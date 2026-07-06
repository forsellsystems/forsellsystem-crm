'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, ExternalLink, X, ListFilter } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  linkDealToOffer,
  unlinkDealOffer,
  fetchRecentOffers,
} from '@/lib/actions/fortnox-actions'
import type { FortnoxOfferSummary, FortnoxOfferStatus } from '@/lib/fortnox/types'

const STATUS_LABELS: Record<FortnoxOfferStatus, { label: string; color: string }> = {
  draft: { label: 'Utkast', color: '#9A9A9A' },
  sent: { label: 'Skickad', color: '#D4A301' },
  ordercreated: { label: 'Order skapad', color: '#4C9A5A' },
  cancelled: { label: 'Annullerad', color: '#8B3D3D' },
}

export function DealOfferCard({
  dealId,
  connected,
  linkedNumber,
  summary,
  summaryError,
}: {
  dealId: string
  connected: boolean
  linkedNumber: string | null
  summary: FortnoxOfferSummary | null
  summaryError?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [offers, setOffers] = useState<FortnoxOfferSummary[] | null>(null)
  const [loadingList, setLoadingList] = useState(false)

  function link(documentNumber: string) {
    setError(null)
    startTransition(async () => {
      const res = await linkDealToOffer(dealId, documentNumber)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  function unlink() {
    setError(null)
    startTransition(async () => {
      const res = await unlinkDealOffer(dealId)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  async function loadList() {
    setError(null)
    setLoadingList(true)
    const res = await fetchRecentOffers()
    setLoadingList(false)
    if (!res.ok) setError(res.error)
    else setOffers(res.data)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Fortnox-offert
        </CardTitle>
        {linkedNumber && (
          <Button variant="ghost" size="icon-sm" onClick={unlink} disabled={isPending}>
            <X className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!connected ? (
          <p className="text-[#6B6B6B]">
            Fortnox är inte anslutet.{' '}
            <Link href="/installningar" className="text-[#656565] underline">
              Anslut under Inställningar
            </Link>
            .
          </p>
        ) : linkedNumber ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Offertnummer</span>
              <span className="font-semibold">#{linkedNumber}</span>
            </div>
            {summary ? (
              <>
                {summary.customerName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Kund i Fortnox</span>
                    <span>{summary.customerName}</span>
                  </div>
                )}
                {summary.offerDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Offertdatum</span>
                    <span>{formatDate(summary.offerDate)}</span>
                  </div>
                )}
                {summary.total != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Total</span>
                    <span className="font-semibold">
                      {formatCurrency(summary.total, summary.currency ?? 'SEK')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6B6B]">Status</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: STATUS_LABELS[summary.status].color }}
                    />
                    {STATUS_LABELS[summary.status].label}
                  </span>
                </div>
                <a
                  href={`/api/fortnox/offers/${encodeURIComponent(linkedNumber)}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#656565] hover:underline"
                >
                  <FileText className="size-4" />
                  Öppna offert-PDF
                  <ExternalLink className="size-3" />
                </a>
              </>
            ) : (
              <p className="text-[#8B3D3D]">
                {summaryError ?? 'Kunde inte hämta offerten från Fortnox.'}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-[#6B6B6B]">
              Koppla den här affären till en offert i Fortnox.
            </p>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Offertnummer, t.ex. 12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim()) link(input.trim())
                }}
              />
              <Button
                size="sm"
                onClick={() => input.trim() && link(input.trim())}
                disabled={isPending || !input.trim()}
              >
                Koppla
              </Button>
            </div>

            {offers === null ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadList}
                disabled={loadingList}
              >
                <ListFilter className="size-4" data-icon="inline-start" />
                {loadingList ? 'Hämtar...' : 'Välj från lista'}
              </Button>
            ) : offers.length === 0 ? (
              <p className="text-[#6B6B6B]">Inga offerter hittades i Fortnox.</p>
            ) : (
              <div className="max-h-56 divide-y divide-[#B8B8B8]/40 overflow-y-auto rounded-lg border border-border">
                {offers.map((o) => (
                  <button
                    key={o.documentNumber}
                    onClick={() => link(o.documentNumber)}
                    disabled={isPending}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#F2F2F0]"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">#{o.documentNumber}</span>
                      {o.customerName && (
                        <span className="text-[#6B6B6B]"> · {o.customerName}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-[#6B6B6B]">
                      {o.total != null ? formatCurrency(o.total, o.currency ?? 'SEK') : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p className="text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
