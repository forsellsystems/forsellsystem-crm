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
  FolderKanban,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { getDeal } from '@/lib/queries/deals'
import { getNotes } from '@/lib/queries/notes'
import { getCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import { getActiveUsers } from '@/lib/queries/users'
import { getMachines } from '@/lib/queries/machines'
import { PIPELINE_STAGES, DEAL_HEAT_LEVELS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { EditDealDialog } from '@/components/pipeline/edit-deal-dialog'
import { DeleteDealButton } from '@/components/pipeline/delete-deal-button'
import { UnlinkOfferButton } from '@/components/fortnox/unlink-offer-button'
import { isConnected } from '@/lib/fortnox/store'
import { getOfferSummary } from '@/lib/fortnox/offers'
import { syncDealFieldsFromOffer } from '@/lib/fortnox/sync'
import type { FortnoxOfferSummary, FortnoxOfferStatus } from '@/lib/fortnox/types'

const OFFER_STATUS: Record<FortnoxOfferStatus, { label: string; color: string }> = {
  draft: { label: 'Utkast', color: '#9A9A9A' },
  sent: { label: 'Skickad', color: '#D4A301' },
  ordercreated: { label: 'Order skapad', color: '#4C9A5A' },
  cancelled: { label: 'Annullerad', color: '#8B3D3D' },
}

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

  // Fortnox: connection status + (if linked) the live offer summary.
  const fortnoxConnected = await isConnected()
  let offerSummary: FortnoxOfferSummary | null = null
  let offerError: string | null = null
  if (fortnoxConnected && deal.fortnox_offer_documentnumber) {
    try {
      offerSummary = await getOfferSummary(deal.fortnox_offer_documentnumber)
      if (offerSummary) {
        // Fortnox styr alltid: mirror the offer's figures onto the deal and
        // render the fresh values immediately.
        const synced = await syncDealFieldsFromOffer(deal.id, offerSummary, {
          value: deal.value,
          quote_number: deal.quote_number,
          quote_date: deal.quote_date,
          currency: deal.currency,
        })
        deal.value = synced.value
        deal.quote_number = synced.quote_number
        deal.quote_date = synced.quote_date
        deal.currency = synced.currency
      }
    } catch (err) {
      offerError = err instanceof Error ? err.message : 'Kunde inte hämta offert.'
    }
  }

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
              {deal.heat != null && (() => {
                const heat = DEAL_HEAT_LEVELS.find(h => h.value === deal.heat)
                if (!heat) return null
                return (
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6B6B]">Status</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: heat.color }}
                      />
                      {heat.label}
                    </span>
                  </div>
                )
              })()}

              {deal.fortnox_offer_documentnumber && (
                <div className="border-t border-[#B8B8B8]/40 pt-3 space-y-2">
                  {offerSummary && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B6B6B]">Offertstatus</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: OFFER_STATUS[offerSummary.status].color }}
                        />
                        {OFFER_STATUS[offerSummary.status].label}
                      </span>
                    </div>
                  )}
                  <a
                    href={`/api/fortnox/offers/${encodeURIComponent(deal.fortnox_offer_documentnumber)}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#656565] hover:underline"
                  >
                    <FileText className="size-4" />
                    Öppna offert-PDF
                    <ExternalLink className="size-3" />
                  </a>
                  {offerError && <p className="text-xs text-[#8B3D3D]">{offerError}</p>}
                  <UnlinkOfferButton dealId={deal.id} />
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
                  <span>Agent: {deal.reseller_name}</span>
                </div>
              )}
              {deal.project_id && deal.project_name && (
                <Link
                  href={`/projekt/${deal.project_id}`}
                  className="flex items-center gap-2 text-sm text-[#656565] hover:underline"
                >
                  <FolderKanban className="size-4" />
                  {deal.project_name}
                </Link>
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
