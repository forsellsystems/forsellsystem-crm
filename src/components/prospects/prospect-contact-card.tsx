'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, User, Mail, Phone, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProspectFields } from '@/lib/actions/prospect-actions'
import type { Prospect } from '@/lib/types/database'

export function ProspectContactCard({
  prospect,
  editable = true,
}: {
  prospect: Prospect
  editable?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    contact_person: prospect.contact_person ?? '',
    email: prospect.email ?? '',
    phone: prospect.phone ?? '',
    website: prospect.website ?? '',
  })

  function handleEdit() {
    setValues({
      contact_person: prospect.contact_person ?? '',
      email: prospect.email ?? '',
      phone: prospect.phone ?? '',
      website: prospect.website ?? '',
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

  const hasAny = prospect.contact_person || prospect.email || prospect.phone || prospect.website

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Kontaktuppgifter</CardTitle>
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
              <Label htmlFor="inline-contact" className="text-xs text-[#6B6B6B]">Kontaktperson</Label>
              <Input
                id="inline-contact"
                value={values.contact_person}
                onChange={(e) => setValues((v) => ({ ...v, contact_person: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inline-email" className="text-xs text-[#6B6B6B]">E-post</Label>
              <Input
                id="inline-email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inline-phone" className="text-xs text-[#6B6B6B]">Telefon</Label>
              <Input
                id="inline-phone"
                type="tel"
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
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
          <div className="space-y-3">
            {prospect.contact_person && (
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-[#6B6B6B]" />
                <span>{prospect.contact_person}</span>
              </div>
            )}
            {prospect.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-[#6B6B6B]" />
                <a href={`mailto:${prospect.email}`} className="text-[#656565] hover:underline">
                  {prospect.email}
                </a>
              </div>
            )}
            {prospect.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-[#6B6B6B]" />
                <a href={`tel:${prospect.phone}`} className="text-[#656565] hover:underline">
                  {prospect.phone}
                </a>
              </div>
            )}
            {prospect.website && (
              <div className="flex items-center gap-2 text-sm">
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
            {!hasAny && (
              <p className="text-sm text-[#6B6B6B]">Inga kontaktuppgifter registrerade.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
