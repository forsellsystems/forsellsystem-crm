'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MEETING_STATUSES } from '@/lib/constants'

export type MeetingFormValues = {
  title: string
  meeting_date: string
  status: string
  agenda: string
  notes: string
}

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function MeetingForm({
  initial,
  onSave,
  onCancel,
  disabled,
}: {
  initial?: Partial<MeetingFormValues>
  onSave: (values: MeetingFormValues) => void
  onCancel: () => void
  disabled?: boolean
}) {
  const [values, setValues] = useState<MeetingFormValues>({
    title: initial?.title ?? '',
    meeting_date: initial?.meeting_date ?? '',
    status: initial?.status ?? '',
    agenda: initial?.agenda ?? '',
    notes: initial?.notes ?? '',
  })

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Titel</Label>
        <Input
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="T.ex. Uppstartsmöte"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Datum</Label>
          <Input
            type="date"
            value={values.meeting_date}
            onChange={(e) => setValues((v) => ({ ...v, meeting_date: e.target.value }))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Status</Label>
          <select
            className={selectClass}
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          >
            <option value="">Välj status</option>
            {MEETING_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Agenda</Label>
        <Textarea
          rows={4}
          value={values.agenda}
          onChange={(e) => setValues((v) => ({ ...v, agenda: e.target.value }))}
          placeholder="Punkter att gå igenom (inför mötet)..."
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Mötesanteckningar</Label>
        <Textarea
          rows={5}
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          placeholder="Vad sades på mötet..."
        />
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
