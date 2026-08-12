'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Link2Off, DownloadCloud, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FortnoxCustomerPicker } from '@/components/fortnox/fortnox-customer-picker'
import {
  linkCompanyToFortnox,
  unlinkCompanyFromFortnox,
  importFortnoxCustomerInfo,
  createFortnoxCustomerForCompany,
} from '@/lib/actions/fortnox-actions'
import type { FortnoxCustomerSummary } from '@/lib/fortnox/types'

/**
 * Fortnox-kopplingen på ett befintligt bolag, kund som agent. Numret självt står
 * på kortets Kundnummer-rad; här ligger status och åtgärderna.
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
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function reset() {
    setError(null)
    setMessage(null)
  }

  function pick(customer: FortnoxCustomerSummary) {
    reset()
    startTransition(async () => {
      const res = await linkCompanyToFortnox(companyId, customer.customerNumber)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPicking(false)
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
          <span className="font-medium text-[#D4A301]">Kopplad</span>
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
          onClick={() => {
            reset()
            setPicking(true)
          }}
        >
          <Link2 className="size-4" data-icon="inline-start" />
          Koppla mot Fortnox
        </Button>
      ) : (
        <div className="space-y-2">
          <FortnoxCustomerPicker
            currentCompanyId={companyId}
            onPick={pick}
            onClose={() => {
              setPicking(false)
              reset()
            }}
            disabled={isPending}
          />
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
        </div>
      )}

      {message && <p className="text-xs text-[#4C9A5A]">{message}</p>}
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
