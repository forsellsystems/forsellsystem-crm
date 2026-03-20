'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Mail, Phone, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateCompanyFields } from '@/lib/actions/company-actions'
import type { Company } from '@/lib/types/database'

export function CompanyContactCard({
  company,
}: {
  company: Company
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    email: company.email ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    org_number: company.org_number ?? '',
  })

  function handleEdit() {
    setValues({
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      org_number: company.org_number ?? '',
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

  const hasAny = company.email || company.phone || company.website || company.org_number

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
          <div className="space-y-3 text-sm">
            {company.org_number && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Org.nummer</span>
                <span>{company.org_number}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-[#6B6B6B]" />
                <a href={`mailto:${company.email}`} className="text-[#656565] hover:underline">
                  {company.email}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-[#6B6B6B]" />
                <a href={`tel:${company.phone}`} className="text-[#656565] hover:underline">
                  {company.phone}
                </a>
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
            {!hasAny && (
              <p className="text-sm text-[#6B6B6B]">Inga uppgifter registrerade.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
