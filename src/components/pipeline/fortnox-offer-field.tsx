'use client'

import { useState } from 'react'
import { Link2Off, ListFilter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { fetchRecentOffers, fetchOfferSummary } from '@/lib/actions/fortnox-actions'
import type { FortnoxOfferSummary } from '@/lib/fortnox/types'

/**
 * Fortnox offer picker used inside the deal dialogs. When an offer is chosen it
 * reports the summary up (onLink) so the parent can fill + lock the deal's
 * Värde/Offertnummer/Offertdatum fields. "Ta bort koppling" calls onUnlink.
 */
export function FortnoxOfferField({
  connected,
  linkedNumber,
  onLink,
  onUnlink,
}: {
  connected: boolean
  linkedNumber: string
  onLink: (summary: FortnoxOfferSummary) => void
  onUnlink: () => void
}) {
  const [number, setNumber] = useState('')
  const [offers, setOffers] = useState<FortnoxOfferSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function linkByNumber() {
    if (!number.trim()) return
    setError(null)
    setLoading(true)
    const res = await fetchOfferSummary(number.trim())
    setLoading(false)
    if (!res.ok) setError(res.error)
    else {
      onLink(res.data)
      setNumber('')
      setOffers(null)
    }
  }

  async function loadList() {
    setError(null)
    setLoading(true)
    const res = await fetchRecentOffers()
    setLoading(false)
    if (!res.ok) setError(res.error)
    else setOffers(res.data)
  }

  if (!connected) {
    return (
      <div className="grid gap-1.5">
        <Label className="text-[#6B6B6B]">Fortnox-offert</Label>
        <p className="text-xs text-[#6B6B6B]">
          Anslut Fortnox under Inställningar för att kunna koppla en offert.
        </p>
      </div>
    )
  }

  if (linkedNumber) {
    return (
      <div className="grid gap-1.5">
        <Label className="text-[#6B6B6B]">Fortnox-offert</Label>
        <div className="flex items-center justify-between rounded-lg border border-border bg-[#F2F2F0] px-3 py-2 text-sm">
          <span>
            Kopplad till offert <span className="font-semibold">#{linkedNumber}</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onUnlink}>
            <Link2Off className="size-4" data-icon="inline-start" />
            Ta bort koppling
          </Button>
        </div>
        <p className="text-xs text-[#6B6B6B]">
          Värde, offertnummer och offertdatum styrs av Fortnox så länge kopplingen finns.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-1.5">
      <Label className="text-[#6B6B6B]">Fortnox-offert</Label>
      <div className="flex gap-2">
        <Input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Offertnummer, t.ex. 13"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              linkByNumber()
            }
          }}
        />
        <Button type="button" size="sm" onClick={linkByNumber} disabled={loading || !number.trim()}>
          Koppla
        </Button>
      </div>

      {offers === null ? (
        <Button type="button" variant="ghost" size="sm" onClick={loadList} disabled={loading}>
          <ListFilter className="size-4" data-icon="inline-start" />
          {loading ? 'Hämtar...' : 'Välj från lista'}
        </Button>
      ) : offers.length === 0 ? (
        <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
          <span>Inga offerter hittades i Fortnox.</span>
          <button type="button" onClick={() => setOffers(null)} className="hover:text-[#1A1A1A]">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="max-h-48 divide-y divide-[#B8B8B8]/40 overflow-y-auto rounded-lg border border-border">
          {offers.map((o) => (
            <button
              type="button"
              key={o.documentNumber}
              onClick={() => onLink(o)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#F2F2F0]"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium">#{o.documentNumber}</span>
                {o.customerName && <span className="text-[#6B6B6B]"> · {o.customerName}</span>}
              </span>
              <span className="shrink-0 text-xs text-[#6B6B6B]">
                {o.total != null ? formatCurrency(o.total, o.currency ?? 'SEK') : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
