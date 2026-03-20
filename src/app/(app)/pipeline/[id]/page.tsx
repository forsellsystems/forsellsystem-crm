import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building2,
  User,
  Wrench,
} from 'lucide-react'
import { getDeal } from '@/lib/queries/deals'
import { getNotes } from '@/lib/queries/notes'
import { getCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import { getActiveUsers } from '@/lib/queries/users'
import { getMachines } from '@/lib/queries/machines'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { EditDealDialog } from '@/components/pipeline/edit-deal-dialog'
import { DeleteDealButton } from '@/components/pipeline/delete-deal-button'

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [deal, notes, companies, resellers, users, machines] = await Promise.all([
    getDeal(id),
    getNotes('deal', id),
    getCompaniesForSelect(),
    getResellers(),
    getActiveUsers(),
    getMachines(),
  ])

  if (!deal) notFound()

  const currentStageIndex = PIPELINE_STAGES.findIndex(
    (s) => s.key === deal.stage
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pipeline">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl text-[#1A1A1A]">
                {deal.quote_number
                  ? `Affär #${deal.quote_number}`
                  : 'Affär'}
              </h2>
              <Badge
                style={{
                  backgroundColor:
                    PIPELINE_STAGES[currentStageIndex]?.color ?? '#656565',
                  color: 'white',
                }}
              >
                {PIPELINE_STAGES[currentStageIndex]?.label ?? deal.stage}
              </Badge>
            </div>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {deal.company_name} &middot; Skapad {formatDate(deal.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditDealDialog
            deal={deal}
            companies={companies}
            resellers={resellers}
            users={users}
            machines={machines}
          />
          <DeleteDealButton dealId={deal.id} />
        </div>
      </div>

      {/* Stage progress */}
      <div className="flex gap-1">
        {PIPELINE_STAGES.map((stage, i) => (
          <div
            key={stage.key}
            className="flex-1 h-2 rounded-full"
            style={{
              backgroundColor:
                i <= currentStageIndex ? stage.color : '#B8B8B840',
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Affärsdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {deal.value && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Värde</span>
                  <span className="font-semibold">
                    {formatCurrency(deal.value)} {deal.currency}
                  </span>
                </div>
              )}
              {deal.quote_number && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Offertnummer</span>
                  <span>{deal.quote_number}</span>
                </div>
              )}
              {deal.quote_date && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Offertdatum</span>
                  <span>{formatDate(deal.quote_date)}</span>
                </div>
              )}
              {deal.expected_close_date && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Förväntad avslut</span>
                  <span>{formatDate(deal.expected_close_date)}</span>
                </div>
              )}
              {deal.closed_at && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Avslutad</span>
                  <span>{formatDate(deal.closed_at)}</span>
                </div>
              )}
              {deal.responsible_name && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Ansvarig</span>
                  <span>{deal.responsible_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Kopplingar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.company_name && (
                <Link
                  href={`/foretag/${deal.company_id}`}
                  className="flex items-center gap-2 text-sm text-[#656565] hover:underline"
                >
                  <Building2 className="size-4" />
                  {deal.company_name}
                </Link>
              )}
              {deal.contact_name && (
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <User className="size-4" />
                  {deal.contact_name}
                </div>
              )}
              {deal.reseller_name && (
                <div className="flex items-center gap-2 text-sm text-[#D4A301]">
                  <Building2 className="size-4" />
                  <span>Återförsäljare: {deal.reseller_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Machines */}
          {deal.machines && deal.machines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Produkter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deal.machines.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Wrench className="size-3.5 text-[#6B6B6B]" />
                      <span>{m.name}</span>
                      {m.quantity > 1 && (
                        <span className="text-xs text-[#6B6B6B]">
                          x{m.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Notes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddNoteForm entityType="deal" entityId={deal.id} />
              <NotesTimeline notes={notes} entityType="deal" entityId={deal.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
