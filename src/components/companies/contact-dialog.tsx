'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { Plus, Pencil } from 'lucide-react'
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
import { contactSchema, type ContactFormData } from '@/lib/validations'
import { createContact, updateContact } from '@/lib/actions/contact-actions'
import type { Contact } from '@/lib/types/database'

interface ContactDialogProps {
  companyId: string
  contact?: Contact
  trigger?: React.ReactElement
}

export function ContactDialog({ companyId, contact, trigger }: ContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!contact

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: formResolver(contactSchema),
    defaultValues: contact
      ? {
          company_id: companyId,
          name: contact.name,
          title: contact.title ?? '',
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          is_primary: contact.is_primary,
        }
      : {
          company_id: companyId,
          name: '',
          title: '',
          email: '',
          phone: '',
          is_primary: false,
        },
  })

  async function onSubmit(data: ContactFormData) {
    try {
      setError(null)
      if (isEditing) {
        await updateContact(contact.id, data)
      } else {
        await createContact(data)
      }
      setOpen(false)
      if (!isEditing) reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-3.5" data-icon="inline-start" />
          Ny kontakt
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Redigera kontakt' : 'Ny kontakt'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <input type="hidden" {...register('company_id')} />

          <div className="grid gap-2">
            <Label htmlFor="contact-name">Namn</Label>
            <Input id="contact-name" placeholder="Förnamn Efternamn" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-[#8B3D3D]">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contact-title">Titel</Label>
            <Input id="contact-title" placeholder="T.ex. Produktionschef" {...register('title')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact-email">E-post</Label>
              <Input id="contact-email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-[#8B3D3D]">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-phone">Telefon</Label>
              <Input id="contact-phone" type="tel" {...register('phone')} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="contact-primary"
              className="rounded border-border"
              {...register('is_primary')}
            />
            <Label htmlFor="contact-primary" className="text-sm font-normal">
              Primär kontakt
            </Label>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sparar...' : isEditing ? 'Spara' : 'Skapa kontakt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditContactButton({ companyId, contact }: { companyId: string; contact: Contact }) {
  return (
    <ContactDialog
      companyId={companyId}
      contact={contact}
      trigger={<Button variant="ghost" size="icon-sm"><Pencil className="size-3.5" /></Button>}
    />
  )
}
