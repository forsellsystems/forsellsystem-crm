'use client'

import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COUNTRIES, FACTORY_TYPES, BUILDING_TYPES } from '@/lib/constants'
import { companySchema, type CompanyFormData } from '@/lib/validations'
import { createCompany, updateCompany } from '@/lib/actions/company-actions'
import type { Company, User } from '@/lib/types/database'

interface CompanyFormProps {
  company?: Company
  users: User[]
  resellers: { id: string; name: string }[]
}

export function CompanyForm({ company, users, resellers }: CompanyFormProps) {
  const [error, setError] = useState<string | null>(null)
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
          customer_number: company.customer_number ?? '',
          org_number: company.org_number ?? '',
          factory_type: company.factory_type ?? '',
          building_types: company.building_types ?? [],
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
          customer_number: '',
          org_number: '',
          factory_type: '',
          building_types: [],
          country: 'Sverige',
          phone: '',
          email: '',
          website: '',
          responsible_user_id: '',
          is_reseller: false,
          reseller_id: '',
        },
  })

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
          <div className="grid gap-2">
            <Label htmlFor="name">Företagsnamn</Label>
            <Input id="name" placeholder="AB Företag" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-[#8B3D3D]">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_number">Kundnummer</Label>
              <Input id="customer_number" {...register('customer_number')} />
            </div>
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

          <div className="grid gap-2">
            <Label>Byggnadstyp</Label>
            <div className="flex gap-4">
              {BUILDING_TYPES.map((bt) => {
                const selected = watch('building_types') ?? []
                return (
                  <label key={bt.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(bt.key)}
                      onChange={() => {
                        const next = selected.includes(bt.key)
                          ? selected.filter((k: string) => k !== bt.key)
                          : [...selected, bt.key]
                        setValue('building_types', next)
                      }}
                      className="accent-[#656565]"
                    />
                    {bt.label}
                  </label>
                )
              })}
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
              <Label htmlFor="reseller_id">Återförsäljare</Label>
              <select
                id="reseller_id"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('reseller_id')}
              >
                <option value="">Ingen återförsäljare</option>
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
