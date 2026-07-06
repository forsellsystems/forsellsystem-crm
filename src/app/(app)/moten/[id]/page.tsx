import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Briefcase, FolderKanban } from 'lucide-react'
import { getMeeting } from '@/lib/queries/meetings'
import { formatDate } from '@/lib/utils'
import { MeetingDetailCard } from '@/components/meetings/meeting-detail-card'
import { ActionPointsCard } from '@/components/meetings/action-points-card'

export default async function MoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const meeting = await getMeeting(id)

  if (!meeting) notFound()

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
          <MeetingDetailCard meeting={meeting} entityHref={meeting.entity_href ?? '/moten'} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ActionPointsCard meetingId={meeting.id} actionPoints={meeting.action_points} />
        </div>
      </div>
    </div>
  )
}
