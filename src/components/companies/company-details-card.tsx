'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Globe, User, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateCompanyFields } from '@/lib/actions/company-actions'
import { COUNTRIES, FACTORY_TYPES, BUILDING_TYPES, MATERIALS } from '@/lib/constants'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { FortnoxCompanyLink } from '@/components/fortnox/fortnox-company-link'
import { ContactDialog, EditContactButton } from '@/components/companies/contact-dialog'
import { DeleteContactButton } from '@/components/companies/delete-contact-button'
import type { CompanyWithRelations } from '@/lib/types/database'

export function CompanyDetailsCard({
  company,
  resellers = [],
}: {
  company: CompanyWithRelations
  resellers?: { id: string; name: string }[]
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    org_number: company.org_number ?? '',
    website: company.website ?? '',
    factory_type: company.factory_type ?? '',
    building_types: company.building_types ?? [] as string[],
    material: company.material ?? '',
    country: company.country,
    reseller_id: company.reseller_id ?? '',
  })

  // En agent säljer våra maskiner, den driver ingen fabrik. Fabrikstyp,
  // byggnadstyp, material och "Agent" hör därför bara till kunder.
  const isReseller = company.is_reseller === true

  const factoryLabel =
    FACTORY_TYPES.find((ft) => ft.key === company.factory_type)?.label ?? null

  const buildingLabels = (company.building_types ?? [])
    .map((key) => BUILDING_TYPES.find((bt) => bt.key === key)?.label)
    .filter(Boolean)
    .join(', ')

  const materialLabel =
    MATERIALS.find((m) => m.key === company.material)?.label ?? null

  function handleEdit() {
    setValues({
      org_number: company.org_number ?? '',
      website: company.website ?? '',
      factory_type: company.factory_type ?? '',
      building_types: company.building_types ?? [],
      material: company.material ?? '',
      country: company.country,
      reseller_id: company.reseller_id ?? '',
    })
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateCompanyFields(company.id, values)
      setEditing(false)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Företagsuppgifter</CardTitle>
          {!editing && (
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
              <Label htmlFor="inline-org" className="text-xs text-[#6B6B6B]">Org.nummer</Label>
              <Input
                id="inline-org"
                value={values.org_number}
                onChange={(e) => setValues((v) => ({ ...v, org_number: e.target.value }))}
              />
            </div>
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
            {!isReseller && (
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
            {company.org_number && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Org.nummer</span>
                <span>{company.org_number}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-[#6B6B6B]" />
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#656565] hover:underline"
                >
                  {company.website}
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
            {/* Kundnumret kommer alltid från Fortnox-kopplingen. Raden finns
                även utan koppling, då tom, så det syns att uppgiften saknas. */}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Kundnummer</span>
              <span className={company.fortnox_customer_id ? '' : 'text-[#B8B8B8]'}>
                {company.fortnox_customer_id ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Land</span>
              <span>{company.country}</span>
            </div>
            {!isReseller && company.reseller_name && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Agent</span>
                <span className="text-[#D4A301] font-medium">{company.reseller_name}</span>
              </div>
            )}
            {/* Kontakterna hör till bolagets uppgifter, inte till ett eget kort. */}
            <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-condensed text-[10px] tracking-[0.12em] uppercase text-[#6B6B6B]">
                  Kontakter
                </span>
                <ContactDialog companyId={company.id} />
              </div>
              {!company.contacts || company.contacts.length === 0 ? (
                <p className="text-[#B8B8B8]">Inga kontakter registrerade.</p>
              ) : (
                <div className="divide-y divide-[#B8B8B8]/40">
                  {company.contacts.map((contact) => (
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
                      <div className="flex shrink-0 items-center">
                        <EditContactButton companyId={company.id} contact={contact} />
                        <DeleteContactButton
                          contactId={contact.id}
                          contactName={contact.name}
                          companyId={company.id}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FortnoxCompanyLink
              companyId={company.id}
              customerNumber={company.fortnox_customer_id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
