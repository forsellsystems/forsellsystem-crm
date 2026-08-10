'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BulletListInput, parseBullets, joinBullets } from '@/components/ui/bullet-list-input'
import { MEETING_STATUSES } from '@/lib/constants'

export type MeetingFormValues = {
  title: string
  meeting_date: string
  meeting_time: string
  participants: string
  status: string
  agenda: string
}

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function MeetingForm({
  initial,
  onSave,
  onCancel,
  disabled,
  lockDateTitle,
}: {
  initial?: Partial<MeetingFormValues>
  onSave: (values: MeetingFormValues) => void
  onCancel: () => void
  disabled?: boolean
  // When linked to Outlook, title/date/time are driven by Outlook — lock them here.
  lockDateTitle?: boolean
}) {
  const [values, setValues] = useState<MeetingFormValues>({
    title: initial?.title ?? '',
    meeting_date: initial?.meeting_date ?? '',
    meeting_time: initial?.meeting_time ?? '',
    participants: initial?.participants ?? '',
    status: initial?.status ?? '',
    agenda: initial?.agenda ?? '',
  })

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Titel</Label>
        <Input
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="T.ex. Uppstartsmöte"
          disabled={lockDateTitle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Datum</Label>
          <Input
            type="date"
            value={values.meeting_date}
            onChange={(e) => setValues((v) => ({ ...v, meeting_date: e.target.value }))}
            disabled={lockDateTitle}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-[#6B6B6B]">Tid (valfritt)</Label>
          <Input
            type="time"
            value={values.meeting_time}
            onChange={(e) => setValues((v) => ({ ...v, meeting_time: e.target.value }))}
            disabled={lockDateTitle}
          />
        </div>
      </div>

      {lockDateTitle && (
        <p className="text-[11px] text-[#9A9A9A]">
          Titel, datum, tid och status styrs av det kopplade Outlook-mötet.
        </p>
      )}

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Deltagare</Label>
        <Input
          value={values.participants}
          onChange={(e) => setValues((v) => ({ ...v, participants: e.target.value }))}
          placeholder="T.ex. Anna, Erik, kundens VD"
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Status</Label>
        <select
          className={selectClass}
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          disabled={lockDateTitle}
        >
          <option value="">Välj status</option>
          {MEETING_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-[#6B6B6B]">Agenda</Label>
        <BulletListInput
          value={parseBullets(values.agenda)}
          onChange={(next) => setValues((v) => ({ ...v, agenda: joinBullets(next) }))}
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
