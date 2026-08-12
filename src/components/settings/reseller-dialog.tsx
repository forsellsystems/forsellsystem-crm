'use client'

import { useState } from 'react'
import { Plus, Link2, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COUNTRIES } from '@/lib/constants'
import { FortnoxCustomerPicker } from '@/components/fortnox/fortnox-customer-picker'
import { countryFromCode } from '@/lib/fortnox/countries'
import { createReseller } from '@/lib/actions/reseller-actions'
import type { FortnoxCustomerSummary } from '@/lib/fortnox/types'

export function ResellerDialog() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('Sverige')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [picking, setPicking] = useState(false)
  const [linked, setLinked] = useState<FortnoxCustomerSummary | null>(null)

  // En agent kan vara kund i Fortnox, t.ex. när den fakturerar slutkund. Vald
  // kund fyller fälten, men bara de som faktiskt har ett värde i Fortnox.
  function pickCustomer(customer: FortnoxCustomerSummary) {
    setLinked(customer)
    setPicking(false)
    if (customer.name) setName(customer.name)
    if (customer.orgNumber) setOrgNumber(customer.orgNumber)
    if (customer.email) setEmail(customer.email)
    if (customer.phone) setPhone(customer.phone)
    const fromCode = countryFromCode(customer.countryCode)
    if (fromCode) setCountry(fromCode)
  }

  function resetForm() {
    setName('')
    setCountry('Sverige')
    setEmail('')
    setPhone('')
    setOrgNumber('')
    setLinked(null)
    setPicking(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createReseller({
        name: name.trim(),
        country,
        email: email || undefined,
        phone: phone || undefined,
        org_number: orgNumber || undefined,
        fortnox_customer_id: linked?.customerNumber,
      })
      setOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" data-icon="inline-start" />
        Ny agent
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ny agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2 rounded-lg border border-border bg-[#F9F9F8] p-3">
            <Label className="text-xs text-[#6B6B6B]">Fortnox</Label>
            {linked ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>
                  Kopplad mot <span className="font-medium">{linked.name ?? 'kund'}</span>
                  <span className="text-[#6B6B6B]"> · kundnr {linked.customerNumber}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLinked(null)}>
                  <Link2Off className="size-4" data-icon="inline-start" />
                  Ta bort
                </Button>
              </div>
            ) : picking ? (
              <FortnoxCustomerPicker onPick={pickCustomer} onClose={() => setPicking(false)} />
            ) : (
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-[#6B6B6B]"
                  onClick={() => setPicking(true)}
                >
                  <Link2 className="size-4" data-icon="inline-start" />
                  Koppla mot Fortnox
                </Button>
                <p className="text-xs text-[#9A9A9A]">
                  Välj agenten i Fortnox så fylls uppgifterna i nedan. Finns den inte där
                  ännu kan du koppla senare på agentsidan.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reseller-name">Företagsnamn</Label>
            <Input
              id="reseller-name"
              placeholder="T.ex. Maskin AB"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reseller-country">Land</Label>
              <select
                id="reseller-country"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reseller-orgnr">Organisationsnummer</Label>
              <Input
                id="reseller-orgnr"
                placeholder="XXXXXX-XXXX"
                value={orgNumber}
                onChange={(e) => setOrgNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reseller-email">E-post</Label>
              <Input
                id="reseller-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reseller-phone">Telefon</Label>
              <Input
                id="reseller-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Sparar...' : 'Skapa agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
