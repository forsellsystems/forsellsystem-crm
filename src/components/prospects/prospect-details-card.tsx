'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, User, Star, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProspectFields } from '@/lib/actions/prospect-actions'
import { FACTORY_TYPES, BUILDING_TYPES, COUNTRIES, MATERIALS } from '@/lib/constants'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { formatDate } from '@/lib/utils'
import { ContactDialog, EditContactButton } from '@/components/companies/contact-dialog'
import { DeleteContactButton } from '@/components/companies/delete-contact-button'
import type { Prospect, Contact } from '@/lib/types/database'

export function ProspectDetailsCard({
  prospect,
  editable = true,
  resellers = [],
  contacts = [],
}: {
  prospect: Prospect
  editable?: boolean
  contacts?: Contact[]
  resellers?: { id: string; name: string }[]
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    factory_type: prospect.factory_type ?? '',
    building_types: prospect.building_types ?? [] as string[],
    material: prospect.material ?? '',
    country: prospect.country,
    reseller_id: prospect.reseller_id ?? '',
    // Prospekt har ingen kontakttabell: personen ligger på prospektet självt och
    // ÄR därför kontakten. Därför bor kontaktuppgifterna kvar här, till skillnad
    // från kunder där de flyttade till kontakter.
    website: prospect.website ?? '',
    description: prospect.description ?? '',
  })

  const isReseller = prospect.prospect_type === 'reseller'

  const factoryLabel =
    FACTORY_TYPES.find((ft) => ft.key === prospect.factory_type)?.label ?? null

  const resellerName = prospect.reseller_id
    ? resellers.find((r) => r.id === prospect.reseller_id)?.name ?? null
    : null

  const buildingLabels = (prospect.building_types ?? [])
    .map((key) => BUILDING_TYPES.find((bt) => bt.key === key)?.label)
    .filter(Boolean)
    .join(', ')

  const materialLabel =
    MATERIALS.find((m) => m.key === prospect.material)?.label ?? null

  function handleEdit() {
    setValues({
      factory_type: prospect.factory_type ?? '',
      building_types: prospect.building_types ?? [],
      material: prospect.material ?? '',
      country: prospect.country,
      reseller_id: prospect.reseller_id ?? '',
      website: prospect.website ?? '',
      description: prospect.description ?? '',
    })
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateProspectFields(prospect.id, values)
      setEditing(false)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Företagsuppgifter</CardTitle>
          {editable && !editing && (
            <Button variant="ghost" size="icon-sm" onClick={handleEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="inline-website" className="text-xs text-[#6B6B6B]">Webbplats</Label>
              <Input
                id="inline-website"
                value={values.website}
                onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
              />
            </div>
            {!isReseller && (
              <div className="grid gap-1.5">
                <Label htmlFor="inline-factory" className="text-xs text-[#6B6B6B]">Fabrikstyp</Label>
                <select
                  id="inline-factory"
                  className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  value={values.factory_type}
                  onChange={(e) => setValues((v) => ({ ...v, factory_type: e.target.value }))}
                >
                  <option value="">Välj fabrikstyp</option>
                  {FACTORY_TYPES.map((ft) => (
                    <option key={ft.key} value={ft.key}>{ft.label}</option>
                  ))}
                </select>
              </div>
            )}
            {!isReseller && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-[#6B6B6B]">Byggnadstyp</Label>
                  <MultiSelectDropdown
                    options={BUILDING_TYPES}
                    value={values.building_types}
                    onChange={(next) => setValues((v) => ({ ...v, building_types: next }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-[#6B6B6B]">Material</Label>
                  <select
                    className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                    value={values.material}
                    onChange={(e) => setValues((v) => ({ ...v, material: e.target.value }))}
                  >
                    <option value="">—</option>
                    {MATERIALS.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="inline-country" className="text-xs text-[#6B6B6B]">Land</Label>
              <select
                id="inline-country"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                value={values.country}
                onChange={(e) => setValues((v) => ({ ...v, country: e.target.value }))}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {!isReseller && resellers.length > 0 && (
              <div className="grid gap-1.5">
                <Label htmlFor="inline-reseller" className="text-xs text-[#6B6B6B]">Agent</Label>
                <select
                  id="inline-reseller"
                  className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  value={values.reseller_id}
                  onChange={(e) => setValues((v) => ({ ...v, reseller_id: e.target.value }))}
                >
                  <option value="">Ingen agent</option>
                  {resellers.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="inline-desc" className="text-xs text-[#6B6B6B]">Beskrivning</Label>
              <textarea
                id="inline-desc"
                className="min-h-24 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon-sm" onClick={handleCancel} disabled={isPending}>
                <X className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleSave} disabled={isPending}>
                <Check className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            {prospect.website && (
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-[#6B6B6B]" />
                <a
                  href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#656565] hover:underline"
                >
                  {prospect.website}
                </a>
              </div>
            )}
            {!isReseller && factoryLabel && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Fabrikstyp</span>
                <span>{factoryLabel}</span>
              </div>
            )}
            {!isReseller && buildingLabels && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Byggnadstyp</span>
                <span>{buildingLabels}</span>
              </div>
            )}
            {!isReseller && materialLabel && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Material</span>
                <span>{materialLabel}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Land</span>
              <span>{prospect.country}</span>
            </div>
            {!isReseller && resellerName && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Agent</span>
                <span className="text-[#D4A301] font-medium">{resellerName}</span>
              </div>
            )}
            {/* Kontakterna är riktiga poster på prospektet, precis som på kunder,
                och följer med när prospektet flyttas till kund. */}
            <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-condensed text-[10px] tracking-[0.12em] uppercase text-[#6B6B6B]">
                  Kontakter
                </span>
                {editable && <ContactDialog prospectId={prospect.id} />}
              </div>
              {contacts.length === 0 ? (
                <p className="text-[#B8B8B8]">Inga kontakter registrerade.</p>
              ) : (
                <div className="divide-y divide-[#B8B8B8]/40">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 shrink-0 text-[#6B6B6B]" />
                          <span className="truncate font-medium">{contact.name}</span>
                          {contact.is_primary && (
                            <Star className="size-3 shrink-0 fill-[#F2BB01] text-[#F2BB01]" />
                          )}
                        </div>
                        {contact.title && (
                          <p className="ml-5 text-xs text-[#6B6B6B]">{contact.title}</p>
                        )}
                        {(contact.email || contact.phone) && (
                          <p className="ml-5 text-xs text-[#6B6B6B]">
                            {[contact.email, contact.phone].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      {editable && (
                        <div className="flex shrink-0 items-center">
                          <EditContactButton prospectId={prospect.id} contact={contact} />
                          <DeleteContactButton
                            contactId={contact.id}
                            contactName={contact.name}
                            prospectId={prospect.id}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {prospect.description && (
              <div className="border-t border-[#B8B8B8]/40 pt-3">
                <p className="mb-1 text-[#6B6B6B]">Beskrivning</p>
                <p className="whitespace-pre-wrap text-[#1A1A1A]">{prospect.description}</p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Skapad</span>
              <span>{formatDate(prospect.created_at)}</span>
            </div>
            {prospect.converted_at && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Konverterad</span>
                <span>{formatDate(prospect.converted_at)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
