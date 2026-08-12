'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Check, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SPEC_FIELDS, SPEC_OBJECTS, SPEC_VALUE_TYPES } from '@/lib/constants'
import {
  createSpec,
  updateSpec,
  deleteSpec,
  moveSpec,
} from '@/lib/actions/machine-spec-actions'
import type { MachineSpec } from '@/lib/types/database'

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'
const numInput =
  'w-full min-w-0 rounded-lg border border-border bg-background px-2.5 h-8 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

const FIELD_BY_KEY = new Map(SPEC_FIELDS.map((f) => [f.key as string, f]))

const nf = new Intl.NumberFormat('sv-SE')
const num = (v: number) => nf.format(v)

type Draft = {
  spec_key: string
  label: string
  label_en: string
  object_type: 'element' | 'modul' | 'maskin'
  value_type: 'value' | 'text' | 'adapt' | 'undocumented'
  value_min: string
  value_max: string
  unit: string
  value_text: string
  value_text_en: string
  note: string
  note_en: string
}

const EMPTY: Draft = {
  spec_key: '',
  label: '',
  label_en: '',
  object_type: 'maskin',
  value_type: 'value',
  value_min: '',
  value_max: '',
  unit: '',
  value_text: '',
  value_text_en: '',
  note: '',
  note_en: '',
}

function labelOf(spec: MachineSpec) {
  const field = spec.spec_key ? FIELD_BY_KEY.get(spec.spec_key) : null
  return field?.label ?? spec.label ?? '—'
}

// "300 – 6 000 mm", "max 3 000 kg", "2 st". Enhetslösa fält får bara talet.
function valueOf(spec: MachineSpec) {
  if (spec.value_type === 'adapt') return 'Anpassas efter behov'
  if (spec.value_type === 'undocumented') return 'Ej dokumenterat'
  if (spec.value_type === 'text') return spec.value_text ?? '—'

  const unit = spec.unit ? ` ${spec.unit}` : ''
  const min = spec.value_min != null ? Number(spec.value_min) : null
  const max = spec.value_max != null ? Number(spec.value_max) : null

  if (min != null && max != null) {
    return min === max ? `${num(min)}${unit}` : `${num(min)} – ${num(max)}${unit}`
  }
  if (max != null) return `max ${num(max)}${unit}`
  if (min != null) return `min ${num(min)}${unit}`
  return '—'
}

function draftFrom(spec: MachineSpec): Draft {
  return {
    spec_key: spec.spec_key ?? '',
    label: spec.label ?? '',
    label_en: spec.label_en ?? '',
    object_type: spec.object_type,
    value_type: spec.value_type,
    value_min: spec.value_min != null ? String(spec.value_min) : '',
    value_max: spec.value_max != null ? String(spec.value_max) : '',
    unit: spec.unit ?? '',
    value_text: spec.value_text ?? '',
    value_text_en: spec.value_text_en ?? '',
    note: spec.note ?? '',
    note_en: spec.note_en ?? '',
  }
}

function EditFields({ d, set }: { d: Draft; set: (next: Draft) => void }) {
  const field = d.spec_key ? FIELD_BY_KEY.get(d.spec_key) : null

  function pickField(key: string) {
    const f = key ? FIELD_BY_KEY.get(key) : null
    set({
      ...d,
      spec_key: key,
      // Fältet bär både objekttyp och enhet, så de följer med valet.
      object_type: f ? (f.object as Draft['object_type']) : d.object_type,
      unit: f ? f.unit : d.unit,
    })
  }

  return (
    <div className="flex-1 space-y-2">
      <select
        className={selectClass}
        value={d.spec_key}
        onChange={(e) => pickField(e.target.value)}
        aria-label="Fält"
      >
        <option value="">Egen etikett…</option>
        {SPEC_OBJECTS.map((obj) => (
          <optgroup key={obj.key} label={obj.label}>
            {SPEC_FIELDS.filter((f) => f.object === obj.key).map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {!field && (
        <div className="grid grid-cols-2 gap-2">
          <Input value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} placeholder="Etikett (svenska)" />
          <Input value={d.label_en} onChange={(e) => set({ ...d, label_en: e.target.value })} placeholder="Label (English)" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <select
          className={selectClass}
          value={d.value_type}
          onChange={(e) => set({ ...d, value_type: e.target.value as Draft['value_type'] })}
          aria-label="Typ av svar"
        >
          {SPEC_VALUE_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        {!field && (
          <select
            className={selectClass}
            value={d.object_type}
            onChange={(e) => set({ ...d, object_type: e.target.value as Draft['object_type'] })}
            aria-label="Beskriver"
          >
            {SPEC_OBJECTS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {d.value_type === 'value' && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="number" value={d.value_min} onChange={(e) => set({ ...d, value_min: e.target.value })} placeholder="Från" className={`${numInput} flex-1 min-w-[5rem]`} aria-label="Från" />
          <span className="text-xs text-[#6B6B6B]">–</span>
          <input type="number" value={d.value_max} onChange={(e) => set({ ...d, value_max: e.target.value })} placeholder="Till" className={`${numInput} flex-1 min-w-[5rem]`} aria-label="Till" />
          <input value={d.unit} onChange={(e) => set({ ...d, unit: e.target.value })} placeholder="Enhet" className={`${numInput} w-16 shrink-0`} aria-label="Enhet" />
        </div>
      )}

      {d.value_type === 'text' && (
        <div className="grid grid-cols-2 gap-2">
          <Input value={d.value_text} onChange={(e) => set({ ...d, value_text: e.target.value })} placeholder="Svar (svenska)" />
          <Input value={d.value_text_en} onChange={(e) => set({ ...d, value_text_en: e.target.value })} placeholder="Answer (English)" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input value={d.note} onChange={(e) => set({ ...d, note: e.target.value })} placeholder="Notering (valfri)" />
        <Input value={d.note_en} onChange={(e) => set({ ...d, note_en: e.target.value })} placeholder="Note (English)" />
      </div>
    </div>
  )
}

export function MachineSpecsCard({
  machineId,
  specs,
}: {
  machineId: string
  specs: MachineSpec[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Draft>(EMPTY)

  // Grupperna följer SPEC_OBJECTS-ordningen; tomma grupper visas inte.
  const groups = SPEC_OBJECTS.map((obj) => ({
    ...obj,
    items: specs.filter((s) => s.object_type === obj.key),
  })).filter((g) => g.items.length > 0)

  function run(fn: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel')
      }
    })
  }

  // Tomma sifferfält ska bli undefined, inte 0 — 0 är ett giltigt mätvärde.
  const toNumber = (s: string) => (s.trim() === '' ? undefined : Number(s))

  function toPayload(d: Draft) {
    return {
      spec_key: d.spec_key,
      label: d.label,
      label_en: d.label_en,
      object_type: d.object_type,
      value_type: d.value_type,
      value_min: toNumber(d.value_min),
      value_max: toNumber(d.value_max),
      unit: d.unit,
      value_text: d.value_text,
      value_text_en: d.value_text_en,
      note: d.note,
      note_en: d.note_en,
    }
  }

  function add() {
    if (!draft.spec_key && !draft.label.trim()) return
    run(async () => {
      await createSpec(machineId, toPayload(draft))
      setDraft(EMPTY)
    })
  }

  function saveEdit(id: string) {
    run(async () => {
      await updateSpec(id, machineId, toPayload(edit))
      setEditId(null)
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Specifikationer
          </CardTitle>
          <p className="mt-1 text-xs text-[#9A9A9A]">
            Vad maskinen klarar. &quot;Anpassas efter behov&quot; är ett svar, &quot;ej dokumenterat&quot; är en lucka.
          </p>
        </div>
        {!adding && (
          <Button variant="ghost" size="icon-sm" onClick={() => setAdding(true)} disabled={isPending}>
            <Plus className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">Inga specifikationer tillagda.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="space-y-1">
              <p className="font-condensed text-[11px] uppercase tracking-[0.12em] text-[#9A9A9A]">
                {group.label}
              </p>
              <div className="divide-y divide-[#B8B8B8]/40">
                {group.items.map((spec) => {
                  const first = specs.indexOf(spec) === 0
                  const last = specs.indexOf(spec) === specs.length - 1
                  return editId === spec.id ? (
                    <div key={spec.id} className="flex items-start gap-2 py-2 first:pt-0">
                      <EditFields d={edit} set={setEdit} />
                      <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(spec.id)} disabled={isPending}>
                        <Check className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)} disabled={isPending}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div key={spec.id} className="flex items-start gap-2 py-2 first:pt-0">
                      <div className="flex-1 min-w-0 sm:flex sm:items-baseline sm:gap-3">
                        <span className="text-sm text-[#6B6B6B] sm:w-[46%] sm:shrink-0">
                          {labelOf(spec)}
                        </span>
                        <span className="block text-sm tabular-nums">
                          <span
                            className={
                              spec.value_type === 'undocumented'
                                ? 'text-[#9A9A9A]'
                                : spec.value_type === 'adapt'
                                  ? 'text-[#D4A301]'
                                  : 'text-[#1A1A1A]'
                            }
                          >
                            {valueOf(spec)}
                          </span>
                          {spec.note && (
                            <span className="block text-xs text-[#9A9A9A]">{spec.note}</span>
                          )}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => run(() => moveSpec(spec.id, machineId, 'up'))} disabled={isPending || first} aria-label="Flytta upp">
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => run(() => moveSpec(spec.id, machineId, 'down'))} disabled={isPending || last} aria-label="Flytta ner">
                        <ChevronDown className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditId(spec.id)
                          setEdit(draftFrom(spec))
                          setError(null)
                        }}
                        disabled={isPending}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => run(() => deleteSpec(spec.id, machineId))} disabled={isPending}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {adding && (
          <div className="flex items-start gap-2 border-t border-[#B8B8B8]/40 pt-4">
            <EditFields d={draft} set={setDraft} />
            <Button variant="ghost" size="icon-sm" onClick={add} disabled={isPending || (!draft.spec_key && !draft.label.trim())}>
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setAdding(false)
                setDraft(EMPTY)
              }}
              disabled={isPending}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
