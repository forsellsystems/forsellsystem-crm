'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  fetchFortnoxCustomerList,
  fetchLinkedCustomerNumbers,
} from '@/lib/actions/fortnox-actions'
import type { FortnoxCustomerSummary } from '@/lib/fortnox/types'

/**
 * Listan över kunder i Fortnox att välja ur. Delas av kopplingen på bolagskortet
 * och av Ny kund-formuläret. Väljer aldrig något själv: den visar registret och
 * rapporterar vad användaren klickade på.
 *
 * `currentCompanyId` undantar bolagets egen koppling från "upptagen"-märkningen.
 * Utelämnas den (nytt bolag) räknas varje redan kopplad kund som upptagen.
 */
export function FortnoxCustomerPicker({
  currentCompanyId,
  onPick,
  onClose,
  disabled = false,
}: {
  currentCompanyId?: string
  onPick: (customer: FortnoxCustomerSummary) => void
  onClose: () => void
  disabled?: boolean
}) {
  const [customers, setCustomers] = useState<FortnoxCustomerSummary[] | null>(null)
  const [taken, setTaken] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchFortnoxCustomerList(), fetchLinkedCustomerNumbers()]).then(
      ([listRes, linkedRes]) => {
        if (!active) return
        setLoading(false)
        if (!listRes.ok) {
          setError(listRes.error)
          return
        }
        setCustomers(listRes.data)
        if (linkedRes.ok) {
          const map: Record<string, string> = {}
          for (const row of linkedRes.data) {
            if (row.companyId !== currentCompanyId) map[row.customerNumber] = row.companyName
          }
          setTaken(map)
        }
      }
    )
    return () => {
      active = false
    }
  }, [currentCompanyId])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
        <span>{loading ? 'Hämtar kunder från Fortnox...' : 'Välj kund i Fortnox'}</span>
        <button type="button" onClick={onClose} className="hover:text-[#1A1A1A]">
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
                disabled={disabled || Boolean(takenBy)}
                onClick={() => onPick(c)}
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

      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
