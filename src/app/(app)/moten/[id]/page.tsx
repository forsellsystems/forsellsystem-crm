import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Briefcase, FolderKanban } from 'lucide-react'
import { getMeeting } from '@/lib/queries/meetings'
import { formatDate } from '@/lib/utils'
import { MeetingDetailCard } from '@/components/meetings/meeting-detail-card'
import { MeetingNotesCard } from '@/components/meetings/meeting-notes-card'
import { ActionPointsCard } from '@/components/meetings/action-points-card'
import { createClient } from '@/lib/supabase/server'
import { getConnection } from '@/lib/microsoft/store'
import { getMyEvents } from '@/lib/microsoft/graph'
import { syncOutlookMeeting } from '@/lib/actions/meeting-actions'
import { getCustomerCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import {
  getCustomerProspectsForSelect,
  getResellerProspectsForSelect,
} from '@/lib/queries/prospects'

export default async function MoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [meeting0, customers, resellers, customerProspects, resellerProspects] =
    await Promise.all([
      getMeeting(id),
      getCustomerCompaniesForSelect(),
      getResellers(),
      getCustomerProspectsForSelect(),
      getResellerProspectsForSelect(),
    ])

  if (!meeting0) notFound()

  // Microsoft/Outlook: resolve the signed-in user, live-sync a linked meeting
  // from Outlook, and load picker events for an unlinked one.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let userId: string | null = null
  if (user) {
    const { data: urow } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    userId = urow?.id ?? null
  }

  let outlookConnected = false
  let outlookEvents: { id: string; label: string }[] = []
  let synced: Awaited<ReturnType<typeof syncOutlookMeeting>> = null
  if (userId) {
    outlookConnected = (await getConnection(userId)) !== null
    if (outlookConnected) {
      if (meeting0.outlook_event_id) {
        synced = await syncOutlookMeeting(meeting0.id, userId)
      } else {
        const events = await getMyEvents(userId).catch(() => [])
        outlookEvents = events.map((ev) => {
          const dt = ev.start?.dateTime
          const datePart = dt ? formatDate(dt.slice(0, 10)) : ''
          const timePart = !ev.isAllDay && dt && dt.length >= 16 ? ` ${dt.slice(11, 16)}` : ''
          return { id: ev.id, label: `${ev.subject || '(namnlöst möte)'} — ${datePart}${timePart}` }
        })
      }
    }
  }

  const meeting = synced ? { ...meeting0, ...synced } : meeting0

  const title =
    meeting.title?.trim() ||
    (meeting.meeting_date ? formatDate(meeting.meeting_date) : 'Möte')

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/moten">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">{title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {meeting.entity_href ? (
              <Link
                href={meeting.entity_href}
                className="flex items-center gap-1.5 text-[#656565] hover:underline"
              >
                <Building2 className="size-3.5" />
                {meeting.entity_name}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[#6B6B6B]">
                <Building2 className="size-3.5" />
                {meeting.entity_name}
              </span>
            )}
            {meeting.deal_href && meeting.deal_label && (
              <Link
                href={meeting.deal_href}
                className="flex items-center gap-1.5 text-[#656565] hover:underline"
              >
                <Briefcase className="size-3.5" />
                {meeting.deal_label}
              </Link>
            )}
            {meeting.project_href && meeting.project_label && (
              <Link
                href={meeting.project_href}
                className="flex items-center gap-1.5 text-[#656565] hover:underline"
              >
                <FolderKanban className="size-3.5" />
                {meeting.project_label}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MeetingDetailCard
            meeting={meeting}
            entityHref={meeting.entity_href ?? '/moten'}
            outlookConnected={outlookConnected}
            outlookEvents={outlookEvents}
            outlookWebLink={meeting.outlook_web_link ?? null}
            customers={customers}
            resellers={resellers}
            customerProspects={customerProspects}
            resellerProspects={resellerProspects}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <MeetingNotesCard meeting={meeting} />
          <ActionPointsCard meetingId={meeting.id} actionPoints={meeting.action_points} />
        </div>
      </div>
    </div>
  )
}
