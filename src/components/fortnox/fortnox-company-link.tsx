'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Link2Off, DownloadCloud, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchFortnoxCustomerList,
  fetchLinkedCustomerNumbers,
  linkCompanyToFortnox,
  unlinkCompanyFromFortnox,
  importFortnoxCustomerInfo,
  createFortnoxCustomerForCompany,
} from '@/lib/actions/fortnox-actions'
import type { FortnoxCustomerSummary } from '@/lib/fortnox/types'

type Taken = Record<string, string>

/**
 * Fortnox-kopplingen på ett bolag, kund som agent. Du väljer alltid kund ur
 * listan; komponenten kopplar aldrig något på egen hand, inte ens när det bara
 * finns en träff. Kunder som redan hör till ett annat bolag går inte att välja.
 *
 * Kopplingen är bolagets, inte affärens. Att en affär pekar på en Fortnox-offert
 * räknas alltså inte som att bolaget är kopplat.
 */
export function FortnoxCompanyLink({
  companyId,
  customerNumber,
}: {
  companyId: string
  customerNumber: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [picking, setPicking] = useState(false)
  const [customers, setCustomers] = useState<FortnoxCustomerSummary[] | null>(null)
  const [taken, setTaken] = useState<Taken>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function reset() {
    setError(null)
    setMessage(null)
  }

  async function openPicker() {
    reset()
    setPicking(true)
    setLoading(true)
    const [listRes, linkedRes] = await Promise.all([
      fetchFortnoxCustomerList(),
      fetchLinkedCustomerNumbers(),
    ])
    setLoading(false)
    if (!listRes.ok) {
      setError(listRes.error)
      return
    }
    setCustomers(listRes.data)
    if (linkedRes.ok) {
      const map: Taken = {}
      for (const row of linkedRes.data) {
        if (row.companyId !== companyId) map[row.customerNumber] = row.companyName
      }
      setTaken(map)
    }
  }

  function closePicker() {
    setPicking(false)
    setCustomers(null)
    reset()
  }

  function pick(customer: FortnoxCustomerSummary) {
    reset()
    startTransition(async () => {
      const res = await linkCompanyToFortnox(companyId, customer.customerNumber)
      if (!res.ok) {
        setError(res.error)
        return
      }
      closePicker()
      router.refresh()
    })
  }

  function createInFortnox() {
    reset()
    startTransition(async () => {
      const res = await createFortnoxCustomerForCompany(companyId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPicking(false)
      setCustomers(null)
      setMessage(`Upplagd i Fortnox som kund ${res.data.customerNumber}.`)
      router.refresh()
    })
  }

  function importInfo() {
    reset()
    startTransition(async () => {
      const res = await importFortnoxCustomerInfo(companyId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMessage(`Hämtat från Fortnox: ${res.data.updated.join(', ')}.`)
      router.refresh()
    })
  }

  function unlink() {
    reset()
    startTransition(async () => {
      const res = await unlinkCompanyFromFortnox(companyId)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="text-[#6B6B6B]">Fortnox</span>
        {customerNumber ? (
          <span className="text-right">
            <span className="font-medium text-[#D4A301]">Kopplad</span>
            <span className="text-[#6B6B6B]"> · Kundnr {customerNumber}</span>
          </span>
        ) : (
          <span className="text-[#B8B8B8]">Ingen koppling</span>
        )}
      </div>

      {customerNumber ? (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-[#6B6B6B]"
            disabled={isPending}
            onClick={importInfo}
          >
            <DownloadCloud className="size-4" data-icon="inline-start" />
            Hämta info
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B6B6B]"
            disabled={isPending}
            onClick={unlink}
          >
            <Link2Off className="size-4" data-icon="inline-start" />
            Ta bort koppling
          </Button>
        </div>
      ) : !picking ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-[#6B6B6B]"
          disabled={isPending}
          onClick={openPicker}
        >
          <Link2 className="size-4" data-icon="inline-start" />
          Koppla mot Fortnox
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>{loading ? 'Hämtar kunder från Fortnox...' : 'Välj kund i Fortnox'}</span>
            <button type="button" onClick={closePicker} className="hover:text-[#1A1A1A]">
              <X className="size-3.5" />
            </button>
          </div>

          {customers && customers.length > 0 && (
            <div className="max-h-56 divide-y divide-[#B8B8B8]/40 overflow-y-auto rounded-lg border border-border">
              {customers.map((c) => {
                const takenBy = taken[c.customerNumber]
                return (
                  <button
                    type="button"
                    key={c.customerNumber}
                    disabled={isPending || Boolean(takenBy)}
                    onClick={() => pick(c)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#F2F2F0] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{c.name ?? `Kund ${c.customerNumber}`}</span>
                      <span className="text-[#6B6B6B]"> · {c.customerNumber}</span>
                      {c.orgNumber && (
                        <span className="block text-xs text-[#9A9A9A]">{c.orgNumber}</span>
                      )}
                    </span>
                    {takenBy && (
                      <span className="shrink-0 text-xs text-[#9A9A9A]">Kopplad: {takenBy}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {customers && customers.length === 0 && (
            <p className="text-xs text-[#6B6B6B]">Kundregistret i Fortnox är tomt.</p>
          )}

          {customers && (
            <div className="space-y-1">
              <p className="text-xs text-[#6B6B6B]">Finns bolaget inte i listan?</p>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-[#6B6B6B]"
                disabled={isPending}
                onClick={createInFortnox}
              >
                <Plus className="size-4" data-icon="inline-start" />
                Lägg upp i Fortnox
              </Button>
            </div>
          )}
        </div>
      )}

      {message && <p className="text-xs text-[#4C9A5A]">{message}</p>}
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
