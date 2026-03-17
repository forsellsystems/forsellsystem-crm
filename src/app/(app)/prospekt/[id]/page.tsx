import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Mail, Phone, Globe, User } from 'lucide-react'
import { getProspect } from '@/lib/queries/prospects'
import { getNotes } from '@/lib/queries/notes'
import { getCompaniesForSelect } from '@/lib/queries/companies'
import { getActiveUsers } from '@/lib/queries/users'
import { FACTORY_TYPES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { ProspectEditDialog } from '@/components/prospects/prospect-edit-dialog'
import { ArchiveProspectButton } from '@/components/prospects/archive-prospect-button'
import { ConvertProspectDialog } from '@/components/prospects/convert-prospect-dialog'

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
  const [prospect, notes, companies, users] = await Promise.all([
    getProspect(id),
    getNotes('prospect', id),
    getCompaniesForSelect(),
    getActiveUsers(),
  ])

  if (!prospect) notFound()

  const factoryLabel =
    FACTORY_TYPES.find((ft) => ft.key === prospect.factory_type)?.label ??
    prospect.factory_type
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
              <h2 className="font-display text-3xl text-[#1A1F1D]">
                {prospect.company_name}
              </h2>
              <Badge variant={status?.variant ?? 'outline'}>
                {status?.label ?? prospect.status}
              </Badge>
            </div>
            <p className="text-sm text-[#6B7672] mt-1">
              {factoryLabel} &middot; {prospect.country} &middot; Skapad{' '}
              {formatDate(prospect.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prospect.status === 'active' && (
            <>
              <ProspectEditDialog prospect={prospect} />
              <ArchiveProspectButton prospectId={prospect.id} />
              <ConvertProspectDialog
                prospect={prospect}
                companies={companies}
                users={users}
              />
            </>
          )}
          {prospect.status === 'converted' && prospect.converted_company_id && (
            <Link href={`/foretag/${prospect.converted_company_id}`}>
              <Button variant="outline">
                <Building2 className="size-4" data-icon="inline-start" />
                Gå till företag
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Kontaktuppgifter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prospect.contact_person && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-[#6B7672]" />
                  <span>{prospect.contact_person}</span>
                </div>
              )}
              {prospect.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-[#6B7672]" />
                  <a
                    href={`mailto:${prospect.email}`}
                    className="text-[#50645F] hover:underline"
                  >
                    {prospect.email}
                  </a>
                </div>
              )}
              {prospect.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-[#6B7672]" />
                  <a
                    href={`tel:${prospect.phone}`}
                    className="text-[#50645F] hover:underline"
                  >
                    {prospect.phone}
                  </a>
                </div>
              )}
              {!prospect.contact_person &&
                !prospect.email &&
                !prospect.phone && (
                  <p className="text-sm text-[#6B7672]">
                    Inga kontaktuppgifter registrerade.
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7672]">Fabrikstyp</span>
                <span>{factoryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7672]">Land</span>
                <span>{prospect.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7672]">Skapad</span>
                <span>{formatDate(prospect.created_at)}</span>
              </div>
              {prospect.converted_at && (
                <div className="flex justify-between">
                  <span className="text-[#6B7672]">Konverterad</span>
                  <span>{formatDate(prospect.converted_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Anteckningar</CardTitle>
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
