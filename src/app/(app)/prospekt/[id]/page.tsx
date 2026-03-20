import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2 } from 'lucide-react'
import { getProspect } from '@/lib/queries/prospects'
import { getNotes } from '@/lib/queries/notes'
import { formatDate } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { DeleteProspectButton } from '@/components/prospects/delete-prospect-button'
import { MoveToCompanyButton } from '@/components/prospects/move-to-company-button'
import { ProspectDescription } from '@/components/prospects/prospect-description'
import { ProspectContactCard } from '@/components/prospects/prospect-contact-card'
import { ProspectDetailsCard } from '@/components/prospects/prospect-details-card'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Aktiv', variant: 'default' },
  converted: { label: 'Konverterad', variant: 'secondary' },
  archived: { label: 'Arkiverad', variant: 'outline' },
}

export default async function ProspektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [prospect, notes] = await Promise.all([
    getProspect(id),
    getNotes('prospect', id),
  ])

  if (!prospect) notFound()

  const status = statusLabels[prospect.status]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/prospekt">
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
              <MoveToCompanyButton prospectId={prospect.id} />
            </>
          )}
          {prospect.status === 'converted' && prospect.converted_company_id && (
            <Link href={`/foretag/${prospect.converted_company_id}`}>
              <Button variant="outline">
                <Building2 className="size-4" data-icon="inline-start" />
                Gå till kund
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-1 space-y-6">
          <ProspectContactCard
            prospect={prospect}
            editable={prospect.status === 'active'}
          />

          <ProspectDescription
            prospectId={prospect.id}
            description={prospect.description}
            editable={prospect.status === 'active'}
          />

          <ProspectDetailsCard
            prospect={prospect}
            editable={prospect.status === 'active'}
          />
        </div>

        {/* Notes */}
        <div className="lg:col-span-2">
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
        </div>
      </div>
    </div>
  )
}
