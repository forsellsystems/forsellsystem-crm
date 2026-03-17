'use client'

import { useState, useEffect } from 'react'
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
import { companySchema, type CompanyFormData } from '@/lib/validations'
import { updateCompany } from '@/lib/actions/company-actions'
import type { Company } from '@/lib/types/database'

export function CompanyEditDialog({ company }: { company: Company }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: formResolver(companySchema),
    defaultValues: {
      name: company.name,
      customer_number: company.customer_number ?? '',
      org_number: company.org_number ?? '',
      country: company.country,
      phone: company.phone ?? '',
      email: company.email ?? '',
      website: company.website ?? '',
      responsible_user_id: company.responsible_user_id ?? '',
      is_reseller: company.is_reseller,
      reseller_id: company.reseller_id ?? '',
    },
  })

  async function onSubmit(data: CompanyFormData) {
    try {
      setError(null)
      await updateCompany(company.id, data)
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
          <DialogTitle>Redigera företag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Företagsnamn</Label>
            <Input id="edit-name" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-[#8B3D3D]">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-customer_number">Kundnummer</Label>
              <Input id="edit-customer_number" {...register('customer_number')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-org_number">Org.nummer</Label>
              <Input id="edit-org_number" {...register('org_number')} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-country">Land</Label>
            <Input id="edit-country" {...register('country')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-post</Label>
              <Input id="edit-email" type="email" {...register('email')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input id="edit-phone" type="tel" {...register('phone')} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-website">Webbplats</Label>
            <Input id="edit-website" {...register('website')} />
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
