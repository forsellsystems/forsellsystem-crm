'use client'

import { useEffect, useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchFortnoxCustomers } from '@/lib/actions/fortnox-actions'

/**
 * Kopplingsstatus mot Fortnox, visad på kund- och prospektkortet.
 * En koppling finns när kundnumret är satt, eller när någon av bolagets affärer
 * är kopplad till en Fortnox-offert.
 */
export function FortnoxStatusRow({
  customerNumber,
  offerNumbers = [],
}: {
  customerNumber: string | null
  offerNumbers?: string[]
}) {
  const linked = Boolean(customerNumber) || offerNumbers.length > 0

  const detail = customerNumber
    ? `Kundnr ${customerNumber}`
    : offerNumbers.length === 1
      ? `Offert ${offerNumbers[0]}`
      : `${offerNumbers.length} offerter`

  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#6B6B6B]">Fortnox</span>
      {linked ? (
        <span className="text-right">
          <span className="font-medium text-[#D4A301]">Kopplad</span>
          <span className="text-[#6B6B6B]"> · {detail}</span>
        </span>
      ) : (
        <span className="text-[#B8B8B8]">Ingen koppling</span>
      )}
    </div>
  )
}

/**
 * Fritextfält för Fortnox-kundnummer med förslag hämtade ur de senaste
 * offerterna. Förslagen laddas först när fältet visas, så vanliga sidladdningar
 * inte behöver vänta på Fortnox.
 */
export function FortnoxCustomerInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const listId = useId()
  const [customers, setCustomers] = useState<{ number: string; name: string }[]>([])

  useEffect(() => {
    let active = true
    fetchFortnoxCustomers()
      .then((res) => {
        if (active && res.ok) setCustomers(res.data)
      })
      // Ingen Fortnox-anslutning eller nedsläckt API: fältet funkar som fritext ändå.
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const match = customers.find((c) => c.number === value.trim())

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`fortnox-${listId}`} className="text-xs text-[#6B6B6B]">
        Fortnox-kundnummer
      </Label>
      <Input
        id={`fortnox-${listId}`}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Kundnummer i Fortnox"
      />
      <datalist id={listId}>
        {customers.map((c) => (
          <option key={c.number} value={c.number}>
            {c.name}
          </option>
        ))}
      </datalist>
      <p className="text-xs text-[#9A9A9A]">
        {match
          ? match.name
          : customers.length > 0
            ? 'Välj bland kunder från senaste offerterna, eller skriv numret.'
            : 'Skriv kundnumret från Fortnox.'}
      </p>
    </div>
  )
}
