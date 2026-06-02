'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PROJECT_TYPES, PROJECT_STATUSES, CURRENCIES } from '@/lib/constants'

export type ProjectFormValues = {
  name: string
  project_type: string
  status: string
  value: string
  value_unknown: boolean
  currency: string
  description: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function ProjectForm({
  initial,
  onSave,
  onCancel,
  disabled,
}: {
  initial?: Partial<ProjectFormValues>
  onSave: (values: ProjectFormValues) => void
  onCancel: () => void
  disabled?: boolean
}) {
  const [values, setValues] = useState<ProjectFormValues>({
    name: initial?.name ?? '',
    project_type: initial?.project_type ?? '',
    status: initial?.status ?? '',
    value: initial?.value ?? '',
    value_unknown: initial?.value_unknown ?? false,
    currency: initial?.currency ?? 'SEK',
    description: initial?.description ?? '',
    contact_name: initial?.contact_name ?? '',
    contact_email: initial?.contact_email ?? '',
    contact_phone: initial?.contact_phone ?? '',
  })

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Projektnamn</Label>
        <Input
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="T.ex. Ny husfabrik Borås"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Projekttyp</Label>
          <select
            className={selectClass}
            value={values.project_type}
            onChange={(e) => setValues((v) => ({ ...v, project_type: e.target.value }))}
          >
            <option value="">Välj typ</option>
            {PROJECT_TYPES.map((pt) => (
              <option key={pt.key} value={pt.key}>{pt.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Status</Label>
          <select
            className={selectClass}
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          >
            <option value="">Välj status</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Budget</Label>
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Input
            type="number"
            min="0"
            disabled={values.value_unknown}
            value={values.value_unknown ? '' : values.value}
            onChange={(e) => setValues((v) => ({ ...v, value: e.target.value }))}
            placeholder={values.value_unknown ? 'Okänd' : '0'}
          />
          <select
            className={selectClass}
            disabled={values.value_unknown}
            value={values.currency}
            onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#6B6B6B] cursor-pointer">
          <input
            type="checkbox"
            checked={values.value_unknown}
            onChange={() =>
              setValues((v) => ({ ...v, value_unknown: !v.value_unknown, value: '' }))
            }
            className="accent-[#656565]"
          />
          Okänd budget
        </label>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Beskrivning</Label>
        <Textarea
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Beskriv projektet..."
        />
      </div>

      <div className="border-t border-[#B8B8B8]/40 pt-3 space-y-3">
        <p className="font-condensed text-[10px] tracking-[0.12em] text-[#6B6B6B]">Kontaktperson</p>
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Namn</Label>
          <Input
            value={values.contact_name}
            onChange={(e) => setValues((v) => ({ ...v, contact_name: e.target.value }))}
            placeholder="Förnamn Efternamn"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-[#6B6B6B]">E-post</Label>
            <Input
              type="email"
              value={values.contact_email}
              onChange={(e) => setValues((v) => ({ ...v, contact_email: e.target.value }))}
              placeholder="namn@foretag.se"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-[#6B6B6B]">Telefon</Label>
            <Input
              type="tel"
              value={values.contact_phone}
              onChange={(e) => setValues((v) => ({ ...v, contact_phone: e.target.value }))}
              placeholder="+46 70 123 45 67"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={disabled}>
          <X className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onSave(values)} disabled={disabled}>
          <Check className="size-4" />
        </Button>
      </div>
    </div>
  )
}
