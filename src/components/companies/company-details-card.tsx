'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateCompanyFields } from '@/lib/actions/company-actions'
import { COUNTRIES, FACTORY_TYPES, BUILDING_TYPES, MATERIALS } from '@/lib/constants'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { FortnoxCompanyLink } from '@/components/fortnox/fortnox-company-link'
import { formatDate } from '@/lib/utils'
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
    factory_type: company.factory_type ?? '',
    building_types: company.building_types ?? [] as string[],
    material: company.material ?? '',
    country: company.country,
    reseller_id: company.reseller_id ?? '',
  })

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
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Detaljer</CardTitle>
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
            {factoryLabel && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Fabrikstyp</span>
                <span>{factoryLabel}</span>
              </div>
            )}
            {buildingLabels && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Byggnadstyp</span>
                <span>{buildingLabels}</span>
              </div>
            )}
            {materialLabel && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Material</span>
                <span>{materialLabel}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Land</span>
              <span>{company.country}</span>
            </div>
            {company.responsible_name && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Ansvarig</span>
                <span>{company.responsible_name}</span>
              </div>
            )}
            {company.reseller_name && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Agent</span>
                <span className="text-[#D4A301] font-medium">{company.reseller_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Skapad</span>
              <span>{formatDate(company.created_at)}</span>
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
