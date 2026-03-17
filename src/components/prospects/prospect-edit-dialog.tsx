'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { Pencil } from 'lucide-react'
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
import { FACTORY_TYPES } from '@/lib/constants'
import { prospectSchema, type ProspectFormData } from '@/lib/validations'
import { updateProspect } from '@/lib/actions/prospect-actions'
import type { Prospect } from '@/lib/types/database'

export function ProspectEditDialog({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProspectFormData>({
    resolver: formResolver(prospectSchema),
    defaultValues: {
      company_name: prospect.company_name,
      factory_type: prospect.factory_type,
      country: prospect.country,
      contact_person: prospect.contact_person ?? '',
      email: prospect.email ?? '',
      phone: prospect.phone ?? '',
    },
  })

  async function onSubmit(data: ProspectFormData) {
    try {
      setError(null)
      await updateProspect(prospect.id, data)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil className="size-4" data-icon="inline-start" />
        Redigera
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redigera prospekt</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-company_name">Företagsnamn</Label>
            <Input id="edit-company_name" {...register('company_name')} />
            {errors.company_name && (
              <p className="text-xs text-[#8B3D3D]">{errors.company_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-factory_type">Fabrikstyp</Label>
              <select
                id="edit-factory_type"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('factory_type')}
              >
                {FACTORY_TYPES.map((ft) => (
                  <option key={ft.key} value={ft.key}>{ft.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-country">Land</Label>
              <Input id="edit-country" {...register('country')} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-contact_person">Kontaktperson</Label>
            <Input id="edit-contact_person" {...register('contact_person')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-post</Label>
              <Input id="edit-email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-[#8B3D3D]">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input id="edit-phone" type="tel" {...register('phone')} />
            </div>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
