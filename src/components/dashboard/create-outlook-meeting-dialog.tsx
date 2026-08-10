'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import { BulletListInput, parseBullets, joinBullets } from '@/components/ui/bullet-list-input'
import { COUNTRIES, FACTORY_TYPES, BUILDING_TYPES, MATERIALS } from '@/lib/constants'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { createOutlookMeetingCard } from '@/lib/actions/meeting-actions'

type EntityOption = { id: string; name: string }

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function CreateOutlookMeetingDialog({
  eventId,
  eventTitle,
  eventWhen,
  customers = [],
  resellers = [],
  customerProspects = [],
  resellerProspects = [],
  users = [],
}: {
  eventId: string
  eventTitle: string
  eventWhen: string
  customers?: EntityOption[]
  resellers?: EntityOption[]
  customerProspects?: EntityOption[]
  resellerProspects?: EntityOption[]
  users?: EntityOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [selected, setSelected] = useState('')

  // New bolag — always a Kund (company). Same fields as the real "Ny kund" form.
  const [name, setName] = useState('')
  const [country, setCountry] = useState('Sverige')
  const [factoryType, setFactoryType] = useState('')
  const [buildingTypes, setBuildingTypes] = useState<string[]>([])
  const [material, setMaterial] = useState('')
  const [customerNumber, setCustomerNumber] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [responsibleUserId, setResponsibleUserId] = useState('')
  const [resellerId, setResellerId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [agenda, setAgenda] = useState('')
  const [participants, setParticipants] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setIsSubmitting(true)
    setError(null)
    try {
      const input: Parameters<typeof createOutlookMeetingCard>[0] = {
        eventId,
        agenda: agenda || null,
        participants: participants || null,
      }
      if (mode === 'new') {
        if (!name.trim()) {
          setError('Företagsnamn krävs')
          setIsSubmitting(false)
          return
        }
        input.newBolag = {
          kind: 'kund',
          name,
          country,
          factory_type: factoryType || null,
          building_types: buildingTypes,
          material: material || null,
          reseller_id: resellerId || null,
          email: email || null,
          phone: phone || null,
          customer_number: customerNumber || null,
          org_number: orgNumber || null,
          website: website || null,
          responsible_user_id: responsibleUserId || null,
        }
      } else if (selected) {
        const [t, i] = selected.split(':')
        input.entity = { type: t as 'company' | 'prospect', id: i }
      }
      const id = await createOutlookMeetingCard(input)
      setOpen(false)
      router.push(`/moten/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Plus className="size-4" data-icon="inline-start" />
        Skapa kort
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Skapa möteskort</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Outlook event (read-only — Outlook drives title/date/time) */}
          <div className="rounded-lg border border-border bg-[#F2F2F0] px-3 py-2">
            <p className="text-sm font-medium text-[#1A1A1A]">{eventTitle}</p>
            <p className="text-xs text-[#6B6B6B]">{eventWhen} · från Outlook</p>
          </div>

          {/* Bolag: pick an existing one (any type) or create a new Kund */}
          <div className="grid gap-2">
            <Label>Bolag</Label>
            <div className="flex gap-1 rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 rounded-md px-2 py-1 text-xs ${mode === 'existing' ? 'bg-[#656565] text-white' : 'text-[#6B6B6B]'}`}
              >
                Välj befintligt
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 rounded-md px-2 py-1 text-xs ${mode === 'new' ? 'bg-[#656565] text-white' : 'text-[#6B6B6B]'}`}
              >
                Ny kund
              </button>
            </div>

            {mode === 'existing' ? (
              <select
                className={selectClass}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Internt (inget bolag)</option>
                {customers.length > 0 && (
                  <optgroup label="Kunder">
                    {customers.map((c) => (
                      <option key={c.id} value={`company:${c.id}`}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
                {resellers.length > 0 && (
                  <optgroup label="Agenter">
                    {resellers.map((r) => (
                      <option key={r.id} value={`company:${r.id}`}>{r.name}</option>
                    ))}
                  </optgroup>
                )}
                {customerProspects.length > 0 && (
                  <optgroup label="Kund-prospekt">
                    {customerProspects.map((p) => (
                      <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
                {resellerProspects.length > 0 && (
                  <optgroup label="Agent-prospekt">
                    {resellerProspects.map((p) => (
                      <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            ) : (
              <div className="grid gap-3 rounded-lg border border-border p-3">
                <p className="font-condensed text-[10px] tracking-[0.12em] text-[#6B6B6B]">
                  Ny kund
                </p>

                <div className="grid gap-1.5">
                  <Label className="text-xs text-[#6B6B6B]">Företagsnamn</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="AB Företag" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Kundnummer</Label>
                    <Input value={customerNumber} onChange={(e) => setCustomerNumber(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Organisationsnummer</Label>
                    <Input value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} placeholder="XXXXXX-XXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Fabrikstyp</Label>
                    <select className={selectClass} value={factoryType} onChange={(e) => setFactoryType(e.target.value)}>
                      <option value="">Välj fabrikstyp</option>
                      {FACTORY_TYPES.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Land</Label>
                    <select className={selectClass} value={country} onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Byggnadstyp</Label>
                    <MultiSelectDropdown
                      options={BUILDING_TYPES}
                      value={buildingTypes}
                      onChange={setBuildingTypes}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Material</Label>
                    <select className={selectClass} value={material} onChange={(e) => setMaterial(e.target.value)}>
                      <option value="">—</option>
                      {MATERIALS.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs text-[#6B6B6B]">Ansvarig</Label>
                  <select className={selectClass} value={responsibleUserId} onChange={(e) => setResponsibleUserId(e.target.value)}>
                    <option value="">Ingen ansvarig</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {resellers.length > 0 && (
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Agent</Label>
                    <select className={selectClass} value={resellerId} onChange={(e) => setResellerId(e.target.value)}>
                      <option value="">Ingen agent</option>
                      {resellers.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">E-post</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="namn@foretag.se" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Telefon</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs text-[#6B6B6B]">Webbplats</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.foretag.se" />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ol-participants">Deltagare (valfritt)</Label>
            <Input
              id="ol-participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="T.ex. Anna, Erik, kundens VD"
            />
          </div>

          <div className="grid gap-2">
            <Label>Agenda (valfritt)</Label>
            <BulletListInput
              value={parseBullets(agenda)}
              onChange={(next) => setAgenda(joinBullets(next))}
            />
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Skapar...' : 'Skapa möteskort'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
