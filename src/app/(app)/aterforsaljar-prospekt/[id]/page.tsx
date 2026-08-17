import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Handshake } from 'lucide-react'
import { getProspect } from '@/lib/queries/prospects'
import { getNotesWithProjects } from '@/lib/queries/notes'
import { getMeetings } from '@/lib/queries/meetings'
import { formatDate } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { DeleteProspectButton } from '@/components/prospects/delete-prospect-button'
import { MoveToCompanyButton } from '@/components/prospects/move-to-company-button'
import { ProspectDetailsCard } from '@/components/prospects/prospect-details-card'
import { SectionTabs } from '@/components/layout/section-tabs'
import { createClient } from '@/lib/supabase/server'
import { MeetingsCard } from '@/components/meetings/meetings-card'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Aktiv', variant: 'default' },
  converted: { label: 'Konverterad', variant: 'secondary' },
  archived: { label: 'Arkiverad', variant: 'outline' },
}

export default async function AterforsaljarProspektDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ flik?: string }>
}) {
  const { id } = await params
  const { flik } = await searchParams
  const [prospect, notes, meetings] = await Promise.all([
    getProspect(id),
    getNotesWithProjects('prospect', id),
    getMeetings('prospect', id),
  ])

  if (!prospect || prospect.prospect_type !== 'reseller') notFound()

  const supabase = await createClient()
  const { data: contactRows } = await supabase
    .from('contacts')
    .select('*')
    .eq('prospect_id', prospect.id)
    .order('is_primary', { ascending: false })
    .order('name')
  const contacts = contactRows ?? []

  const base = `/aterforsaljar-prospekt/${prospect.id}`
  const tab = flik === 'anteckningar' || flik === 'moten' ? flik : 'uppgifter'

  const status = statusLabels[prospect.status]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/aterforsaljar-prospekt">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl text-[#1A1A1A]">
                {prospect.company_name}
              </h2>
              <Badge variant={status?.variant ?? 'outline'}>
                {status?.label ?? prospect.status}
              </Badge>
            </div>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {prospect.country} &middot; Skapad{' '}
              {formatDate(prospect.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prospect.status === 'active' && (
            <>
              <DeleteProspectButton prospectId={prospect.id} />
              <MoveToCompanyButton prospectId={prospect.id} prospectType="reseller" />
            </>
          )}
          {prospect.status === 'converted' && prospect.converted_company_id && (
            <Link href={`/aterforsaljare/${prospect.converted_company_id}`}>
              <Button variant="outline">
                <Handshake className="size-4" data-icon="inline-start" />
                Gå till agent
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Samma flikar som kund-prospekt. Agent-prospekt har varken Fortnox eller
          projekt, så raden är kortare. */}
      <SectionTabs
        items={[
          { label: 'Företagsuppgifter', href: base, active: tab === 'uppgifter' },
          {
            label: 'Anteckningar',
            href: `${base}?flik=anteckningar`,
            active: tab === 'anteckningar',
          },
          { label: 'Möten', href: `${base}?flik=moten`, active: tab === 'moten' },
        ]}
      />

      {tab === 'uppgifter' && (
        <ProspectDetailsCard
          prospect={prospect}
          editable={prospect.status === 'active'}
          contacts={contacts}
        />
      )}

      {tab === 'anteckningar' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prospect.status === 'active' && (
              <AddNoteForm entityType="prospect" entityId={prospect.id} />
            )}
            <NotesTimeline notes={notes} entityType="prospect" entityId={prospect.id} />
          </CardContent>
        </Card>
      )}

      {tab === 'moten' && (
        <MeetingsCard
          entityType="prospect"
          entityId={prospect.id}
          meetings={meetings}
          editable={prospect.status === 'active'}
        />
      )}
    </div>
  )
}
