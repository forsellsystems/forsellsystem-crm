'use client'

import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COUNTRIES, FACTORY_TYPES, BUILDING_TYPES, MATERIALS } from '@/lib/constants'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { FortnoxCustomerPicker } from '@/components/fortnox/fortnox-customer-picker'
import { countryFromCode } from '@/lib/fortnox/countries'
import { companySchema, type CompanyFormData } from '@/lib/validations'
import { createCompany, updateCompany } from '@/lib/actions/company-actions'
import { Link2, Link2Off } from 'lucide-react'
import type { Company, User } from '@/lib/types/database'
import type { FortnoxCustomerSummary } from '@/lib/fortnox/types'

interface CompanyFormProps {
  company?: Company
  users: User[]
  resellers: { id: string; name: string }[]
}

export function CompanyForm({ company, users, resellers }: CompanyFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [linked, setLinked] = useState<FortnoxCustomerSummary | null>(null)
  const isEditing = !!company

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: formResolver(companySchema),
    defaultValues: company
      ? {
          name: company.name,
          fortnox_customer_id: company.fortnox_customer_id ?? '',
          org_number: company.org_number ?? '',
          factory_type: company.factory_type ?? '',
          building_types: company.building_types ?? [],
          material: company.material ?? '',
          country: company.country,
          phone: company.phone ?? '',
          email: company.email ?? '',
          website: company.website ?? '',
          responsible_user_id: company.responsible_user_id ?? '',
          is_reseller: company.is_reseller,
          reseller_id: company.reseller_id ?? '',
        }
      : {
          name: '',
          fortnox_customer_id: '',
          org_number: '',
          factory_type: '',
          building_types: [],
          material: '',
          country: 'Sverige',
          phone: '',
          email: '',
          website: '',
          responsible_user_id: '',
          is_reseller: false,
          reseller_id: '',
        },
  })

  // Vald Fortnox-kund fyller formuläret. Bara fält som har ett värde i Fortnox
  // skrivs, så en tom uppgift där aldrig raderar något du redan hunnit skriva.
  function pickCustomer(customer: FortnoxCustomerSummary) {
    setLinked(customer)
    setPicking(false)
    setValue('fortnox_customer_id', customer.customerNumber)
    if (customer.name) setValue('name', customer.name)
    if (customer.orgNumber) setValue('org_number', customer.orgNumber)
    if (customer.email) setValue('email', customer.email)
    if (customer.phone) setValue('phone', customer.phone)
    const country = countryFromCode(customer.countryCode)
    if (country) setValue('country', country)
  }

  function clearCustomer() {
    setLinked(null)
    setValue('fortnox_customer_id', '')
  }

  async function onSubmit(data: CompanyFormData) {
    try {
      setError(null)
      if (isEditing) {
        await updateCompany(company.id, data)
      } else {
        await createCompany(data)
      }
    } catch (err: unknown) {
      const digest = (err as { digest?: string })?.digest
      if (digest?.includes('NEXT_REDIRECT')) return
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Redigera företag' : 'Företagsinformation'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <input type="hidden" {...register('fortnox_customer_id')} />
          <div className="grid gap-2 rounded-lg border border-border bg-[#F9F9F8] p-3">
            <Label className="text-xs text-[#6B6B6B]">Fortnox</Label>
            {linked ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>
                  Kopplad mot <span className="font-medium">{linked.name ?? 'kund'}</span>
                  <span className="text-[#6B6B6B]"> · kundnr {linked.customerNumber}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={clearCustomer}>
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
                  Välj kunden i Fortnox så fylls uppgifterna i nedan. Finns den inte där
                  ännu kan du koppla senare på kundkortet.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Företagsnamn</Label>
            <Input id="name" placeholder="AB Företag" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-[#8B3D3D]">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="org_number">Organisationsnummer</Label>
              <Input
                id="org_number"
                placeholder="XXXXXX-XXXX"
                {...register('org_number')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="factory_type">Fabrikstyp</Label>
              <select
                id="factory_type"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('factory_type')}
              >
                <option value="">Välj fabrikstyp</option>
                {FACTORY_TYPES.map((ft) => (
                  <option key={ft.key} value={ft.key}>{ft.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Land</Label>
              <select
                id="country"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('country')}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Byggnadstyp</Label>
              <MultiSelectDropdown
                options={BUILDING_TYPES}
                value={watch('building_types') ?? []}
                onChange={(next) => setValue('building_types', next)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="material">Material</Label>
              <select
                id="material"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('material')}
              >
                <option value="">—</option>
                {MATERIALS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="responsible_user_id">Ansvarig</Label>
              <select
                id="responsible_user_id"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('responsible_user_id')}
              >
                <option value="">Ingen ansvarig</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {resellers.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="reseller_id">Agent</Label>
              <select
                id="reseller_id"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('reseller_id')}
              >
                <option value="">Ingen agent</option>
                {resellers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-[#B8B8B8]/40 pt-4 mt-2">
            <p className="font-condensed text-[10px] tracking-[0.12em] text-[#6B6B6B] mb-3">
              Kontaktuppgifter
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-[#8B3D3D]">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" {...register('phone')} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Webbplats</Label>
            <Input
              id="website"
              placeholder="https://www.foretag.se"
              {...register('website')}
            />
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Sparar...'
                : isEditing
                  ? 'Spara ändringar'
                  : 'Skapa företag'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
