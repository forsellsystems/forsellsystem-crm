'use client'

import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FACTORY_TYPES, BUILDING_TYPES, COUNTRIES } from '@/lib/constants'
import { prospectSchema, type ProspectFormData } from '@/lib/validations'
import { createProspect, updateProspect } from '@/lib/actions/prospect-actions'
import type { Prospect } from '@/lib/types/database'

interface ProspectFormProps {
  prospect?: Prospect
  prospectType?: 'customer' | 'reseller'
  resellers?: { id: string; name: string }[]
}

export function ProspectForm({ prospect, prospectType = 'customer', resellers = [] }: ProspectFormProps) {
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!prospect
  const effectiveType = prospect?.prospect_type ?? prospectType

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProspectFormData>({
    resolver: formResolver(prospectSchema),
    defaultValues: prospect
      ? {
          company_name: prospect.company_name,
          prospect_type: prospect.prospect_type,
          factory_type: prospect.factory_type ?? '',
          building_types: prospect.building_types ?? [],
          country: prospect.country,
          contact_person: prospect.contact_person ?? '',
          email: prospect.email ?? '',
          phone: prospect.phone ?? '',
          reseller_id: prospect.reseller_id ?? '',
        }
      : {
          company_name: '',
          prospect_type: prospectType,
          factory_type: '',
          building_types: [],
          country: 'Sverige',
          contact_person: '',
          email: '',
          phone: '',
          reseller_id: '',
        },
  })

  async function onSubmit(data: ProspectFormData) {
    try {
      setError(null)
      if (isEditing) {
        await updateProspect(prospect.id, data)
      } else {
        await createProspect({ ...data, prospect_type: effectiveType })
      }
    } catch (err: unknown) {
      const digest = (err as { digest?: string })?.digest
      if (digest?.includes('NEXT_REDIRECT')) return
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  const isReseller = effectiveType === 'reseller'

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {isEditing
            ? (isReseller ? 'Redigera agent-prospekt' : 'Redigera prospekt')
            : (isReseller ? 'Agent-prospekt' : 'Prospektinformation')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="company_name">Företagsnamn</Label>
            <Input
              id="company_name"
              placeholder="T.ex. Nordic Prefab AB"
              {...register('company_name')}
            />
            {errors.company_name && (
              <p className="text-xs text-[#8B3D3D]">
                {errors.company_name.message}
              </p>
            )}
          </div>

          <div className={isReseller ? 'grid gap-2' : 'grid grid-cols-2 gap-4'}>
            {!isReseller && (
              <div className="grid gap-2">
                <Label htmlFor="factory_type">Fabrikstyp</Label>
                <select
                  id="factory_type"
                  className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register('factory_type')}
                >
                  <option value="">Välj fabrikstyp</option>
                  {FACTORY_TYPES.map((ft) => (
                    <option key={ft.key} value={ft.key}>
                      {ft.label}
                    </option>
                  ))}
                </select>
                {errors.factory_type && (
                  <p className="text-xs text-[#8B3D3D]">
                    {errors.factory_type.message}
                  </p>
                )}
              </div>
            )}

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
              {errors.country && (
                <p className="text-xs text-[#8B3D3D]">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>

          {!isReseller && (
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
          )}

          {!isReseller && resellers.length > 0 && (
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

          <div className="grid gap-2">
            <Label htmlFor="contact_person">Kontaktperson</Label>
            <Input
              id="contact_person"
              placeholder="Förnamn Efternamn"
              {...register('contact_person')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="namn@foretag.se"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-[#8B3D3D]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+46 70 123 45 67"
                {...register('phone')}
              />
            </div>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Sparar...'
                : isEditing
                  ? 'Spara ändringar'
                  : (isReseller ? 'Skapa agent-prospekt' : 'Skapa prospekt')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
