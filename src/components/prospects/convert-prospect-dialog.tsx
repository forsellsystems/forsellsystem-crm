'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { convertProspect } from '@/lib/actions/conversion-actions'
import type { Prospect } from '@/lib/types/database'

interface ConvertProspectDialogProps {
  prospect: Prospect
  companies: { id: string; name: string }[]
  users: { id: string; name: string }[]
}

export function ConvertProspectDialog({
  prospect,
  companies,
  users,
}: ConvertProspectDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [existingCompanyId, setExistingCompanyId] = useState('')
  const [companyName, setCompanyName] = useState(prospect.company_name)
  const [country, setCountry] = useState(prospect.country)
  const [contactPerson, setContactPerson] = useState(
    prospect.contact_person ?? ''
  )
  const [email, setEmail] = useState(prospect.email ?? '')
  const [phone, setPhone] = useState(prospect.phone ?? '')
  const [responsibleUserId, setResponsibleUserId] = useState('')
  const router = useRouter()

  async function handleConvert() {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await convertProspect({
        prospect_id: prospect.id,
        company_name: companyName,
        existing_company_id:
          mode === 'existing' ? existingCompanyId : undefined,
        country,
        contact_person: contactPerson || undefined,
        email: email || undefined,
        phone: phone || undefined,
        responsible_user_id: responsibleUserId || undefined,
      })

      setOpen(false)
      router.push(`/pipeline/${result.deal_id}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Konvertering misslyckades'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white">
            <ArrowRight className="size-4" data-icon="inline-start" />
            Konvertera till affär
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konvertera till affär</DialogTitle>
          <DialogDescription>
            Skapar ett företag, kontaktperson och en ny affär i pipelinen.
            Alla anteckningar kopieras med.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Company mode */}
          <div className="grid gap-2">
            <Label>Företag</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 text-sm py-1.5 rounded-lg border transition-colors ${
                  mode === 'new'
                    ? 'border-[#656565] bg-[#656565]/10 text-[#656565] font-medium'
                    : 'border-border text-[#6B6B6B] hover:bg-[#F2F2F0]'
                }`}
              >
                Skapa nytt
              </button>
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 text-sm py-1.5 rounded-lg border transition-colors ${
                  mode === 'existing'
                    ? 'border-[#656565] bg-[#656565]/10 text-[#656565] font-medium'
                    : 'border-border text-[#6B6B6B] hover:bg-[#F2F2F0]'
                }`}
              >
                Välj befintligt
              </button>
            </div>
          </div>

          {mode === 'new' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="conv-company">Företagsnamn</Label>
                <Input
                  id="conv-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conv-country">Land</Label>
                <Input
                  id="conv-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="conv-existing">Välj företag</Label>
              <select
                id="conv-existing"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                value={existingCompanyId}
                onChange={(e) => setExistingCompanyId(e.target.value)}
              >
                <option value="">Välj...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-[#B8B8B8]/40 pt-4">
            <p className="font-condensed text-[10px] tracking-[0.12em] text-[#6B6B6B] mb-3">
              Kontaktperson
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="conv-contact">Namn</Label>
            <Input
              id="conv-contact"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="conv-email">E-post</Label>
              <Input
                id="conv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conv-phone">Telefon</Label>
              <Input
                id="conv-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="conv-responsible">Ansvarig säljare</Label>
            <select
              id="conv-responsible"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              value={responsibleUserId}
              onChange={(e) => setResponsibleUserId(e.target.value)}
            >
              <option value="">Ingen ansvarig</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConvert}
            disabled={
              isSubmitting ||
              (mode === 'new' && !companyName.trim()) ||
              (mode === 'existing' && !existingCompanyId)
            }
            className="bg-[#F2BB01] hover:bg-[#B07830] text-white"
          >
            {isSubmitting ? 'Konverterar...' : 'Konvertera'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
