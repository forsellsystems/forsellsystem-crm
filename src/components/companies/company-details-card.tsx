'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateCompanyFields } from '@/lib/actions/company-actions'
import { COUNTRIES, FACTORY_TYPES, BUILDING_TYPES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Company, CompanyWithRelations } from '@/lib/types/database'

export function CompanyDetailsCard({
  company,
}: {
  company: CompanyWithRelations
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    factory_type: company.factory_type ?? '',
    building_types: company.building_types ?? [] as string[],
    country: company.country,
    customer_number: company.customer_number ?? '',
  })

  const factoryLabel =
    FACTORY_TYPES.find((ft) => ft.key === company.factory_type)?.label ?? null

  const buildingLabels = (company.building_types ?? [])
    .map((key) => BUILDING_TYPES.find((bt) => bt.key === key)?.label)
    .filter(Boolean)
    .join(', ')

  function handleEdit() {
    setValues({
      factory_type: company.factory_type ?? '',
      building_types: company.building_types ?? [],
      country: company.country,
      customer_number: company.customer_number ?? '',
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
            <div className="grid gap-1.5">
              <Label className="text-xs text-[#6B6B6B]">Byggnadstyp</Label>
              <div className="flex gap-3">
                {BUILDING_TYPES.map((bt) => (
                  <label key={bt.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.building_types.includes(bt.key)}
                      onChange={() => {
                        const next = values.building_types.includes(bt.key)
                          ? values.building_types.filter((k) => k !== bt.key)
                          : [...values.building_types, bt.key]
                        setValues((v) => ({ ...v, building_types: next }))
                      }}
                      className="accent-[#656565]"
                    />
                    {bt.label}
                  </label>
                ))}
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
              <Label htmlFor="inline-custnr" className="text-xs text-[#6B6B6B]">Kundnummer</Label>
              <Input
                id="inline-custnr"
                value={values.customer_number}
                onChange={(e) => setValues((v) => ({ ...v, customer_number: e.target.value }))}
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
            {company.customer_number && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Kundnummer</span>
                <span>{company.customer_number}</span>
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
                <span className="text-[#6B6B6B]">Återförsäljare</span>
                <span className="text-[#D4A301] font-medium">{company.reseller_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Fortnox</span>
              <span className={company.fortnox_customer_id ? '' : 'text-[#B8B8B8]'}>
                {company.fortnox_customer_id ?? 'Ej ansluten'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Skapad</span>
              <span>{formatDate(company.created_at)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
