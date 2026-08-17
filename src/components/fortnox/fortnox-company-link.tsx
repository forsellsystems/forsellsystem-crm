'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Link2Off, DownloadCloud, Plus, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FortnoxCustomerPicker } from '@/components/fortnox/fortnox-customer-picker'
import { Input } from '@/components/ui/input'
import {
  linkCompanyToFortnox,
  unlinkCompanyFromFortnox,
  importFortnoxCustomerInfo,
  createFortnoxCustomerForCompany,
  fetchFortnoxCustomerContact,
  saveFortnoxCustomerContact,
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

  // Kontaktpersonen från Fortnox: hämtas som förslag, sparas först när du
  // bekräftar. Namnet saknas ofta i Fortnox och får då skrivas här.
  const [candidate, setCandidate] = useState<{
    name: string | null
    email: string | null
    phone: string | null
    existingContactName: string | null
  } | null>(null)
  const [candidateName, setCandidateName] = useState('')

  function reset() {
    setError(null)
    setMessage(null)
  }

  function fetchContact() {
    reset()
    setCandidate(null)
    startTransition(async () => {
      const res = await fetchFortnoxCustomerContact(companyId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setCandidate(res.data)
      setCandidateName(res.data.name ?? res.data.existingContactName ?? '')
    })
  }

  function saveContact() {
    if (!candidate) return
    reset()
    startTransition(async () => {
      const res = await saveFortnoxCustomerContact(companyId, {
        name: candidateName,
        email: candidate.email,
        phone: candidate.phone,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setCandidate(null)
      setMessage(res.data.created ? 'Kontakten är tillagd.' : 'Kontakten är uppdaterad.')
      router.refresh()
    })
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
            onClick={fetchContact}
          >
            <UserPlus className="size-4" data-icon="inline-start" />
            Hämta kontaktperson
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

      {candidate && (
        <div className="space-y-2 rounded-lg border border-[#D4A301]/40 bg-[#F2BB01]/10 px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-[#6B6B6B]">
              {candidate.existingContactName
                ? `Adressen finns redan på ${candidate.existingContactName}, som uppdateras.`
                : 'Fortnox har dessa uppgifter. Kontrollera namnet innan du sparar.'}
            </p>
            <button
              type="button"
              onClick={() => setCandidate(null)}
              className="text-[#6B6B6B] hover:text-[#1A1A1A]"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <Input
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="Namn på kontaktpersonen"
          />
          <p className="text-xs text-[#6B6B6B]">
            {[candidate.email, candidate.phone].filter(Boolean).join(' · ') ||
              'Fortnox saknar e-post och telefon'}
          </p>
          <Button size="sm" disabled={isPending || !candidateName.trim()} onClick={saveContact}>
            {candidate.existingContactName ? 'Uppdatera kontakten' : 'Lägg till som kontakt'}
          </Button>
        </div>
      )}

      {message && <p className="text-xs text-[#4C9A5A]">{message}</p>}
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
