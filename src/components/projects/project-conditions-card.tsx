'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PROJECT_SPEC_FIELDS, PROJECT_SPEC_VALUE_TYPES } from '@/lib/constants'
import {
  createProjectSpec,
  updateProjectSpec,
  deleteProjectSpec,
  updateProjectConditionsNote,
  type ProjectSpecInput,
} from '@/lib/actions/project-context-actions'
import type { ProjectSpec } from '@/lib/types/database'

const inputClass =
  'w-full rounded-lg border border-border bg-background px-2.5 h-8 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'
const numClass =
  'w-20 shrink-0 rounded-lg border border-border bg-background px-2 h-8 text-sm text-right outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

/** Etikett och enhet kommer från fältlistan; fria rader bär sin egen etikett. */
function fieldOf(spec: { spec_key: string | null }) {
  return PROJECT_SPEC_FIELDS.find((f) => f.key === spec.spec_key)
}
function labelOf(spec: ProjectSpec) {
  return fieldOf(spec)?.label ?? spec.label ?? 'Uppgift'
}

/** Hur värdet läses beroende på typ. Luckorna visas som text, inte som tomt. */
function valueOf(spec: ProjectSpec) {
  if (spec.value_type === 'pending') return 'Ej utredd'
  if (spec.value_type === 'unknown') return 'Kunden vet inte'
  if (spec.value_type === 'text') return spec.value_text || '—'
  const unit = spec.unit ? ` ${spec.unit}` : ''
  if (spec.value_min == null) return '—'
  if (spec.value_max != null && spec.value_max !== spec.value_min) {
    return `${spec.value_min}–${spec.value_max}${unit}`
  }
  return `${spec.value_min}${unit}`
}

const EMPTY: ProjectSpecInput = {
  spec_key: '',
  label: '',
  value_type: 'value',
  value_min: null,
  value_max: null,
  unit: '',
  value_text: '',
  note: '',
}

function SpecFields({
  draft,
  setDraft,
}: {
  draft: ProjectSpecInput
  setDraft: (next: ProjectSpecInput) => void
}) {
  const chosen = PROJECT_SPEC_FIELDS.find((f) => f.key === draft.spec_key)
  const isValue = draft.value_type === 'value'
  const isText = draft.value_type === 'text'

  return (
    <div className="flex-1 space-y-2">
      <select
        className={inputClass}
        value={draft.spec_key ?? ''}
        onChange={(e) => {
          const key = e.target.value
          const field = PROJECT_SPEC_FIELDS.find((f) => f.key === key)
          setDraft({ ...draft, spec_key: key, unit: field?.unit ?? draft.unit })
        }}
      >
        <option value="">Egen uppgift (skriv etikett)</option>
        {PROJECT_SPEC_FIELDS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      {!draft.spec_key && (
        <Input
          value={draft.label ?? ''}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="Vad gäller uppgiften?"
        />
      )}

      <select
        className={inputClass}
        value={draft.value_type}
        onChange={(e) =>
          setDraft({ ...draft, value_type: e.target.value as ProjectSpecInput['value_type'] })
        }
      >
        {PROJECT_SPEC_VALUE_TYPES.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>

      {isValue && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            className={numClass}
            value={draft.value_min ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, value_min: e.target.value === '' ? null : Number(e.target.value) })
            }
            placeholder="Från"
            aria-label="Från"
          />
          <span className="text-xs text-[#6B6B6B]">–</span>
          <input
            type="number"
            className={numClass}
            value={draft.value_max ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, value_max: e.target.value === '' ? null : Number(e.target.value) })
            }
            placeholder="Till"
            aria-label="Till (valfritt)"
          />
          <input
            className={`${numClass} text-left`}
            value={draft.unit ?? ''}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            placeholder="Enhet"
            aria-label="Enhet"
          />
          {chosen && <span className="text-xs text-[#9A9A9A]">Intervall är valfritt</span>}
        </div>
      )}

      {isText && (
        <Input
          value={draft.value_text ?? ''}
          onChange={(e) => setDraft({ ...draft, value_text: e.target.value })}
          placeholder="Värde i text"
        />
      )}

      <Input
        value={draft.note ?? ''}
        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        placeholder="Notering (valfritt)"
      />
    </div>
  )
}

/**
 * Kundens förutsättningar för projektet. Strukturerade rader så att uppgifterna
 * går att läsa av, plus en fritext under för det som inte passar i ett fält.
 * "Ej utredd" och "Kunden vet inte" är medvetna luckor: en känd lucka är
 * information, och skiljer sig från en rad som aldrig lagts in.
 */
export function ProjectConditionsCard({
  projectId,
  specs,
  conditionsNote,
}: {
  projectId: string
  specs: ProjectSpec[]
  conditionsNote: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [newDraft, setNewDraft] = useState<ProjectSpecInput>(EMPTY)

  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<ProjectSpecInput>(EMPTY)

  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(conditionsNote ?? '')

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

  function startEdit(spec: ProjectSpec) {
    setEditId(spec.id)
    setEditDraft({
      spec_key: spec.spec_key ?? '',
      label: spec.label ?? '',
      value_type: spec.value_type,
      value_min: spec.value_min,
      value_max: spec.value_max,
      unit: spec.unit ?? '',
      value_text: spec.value_text ?? '',
      note: spec.note ?? '',
    })
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Förutsättningar
          </CardTitle>
          {!adding && (
            <Button variant="ghost" size="icon-sm" onClick={() => setAdding(true)} disabled={isPending}>
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {specs.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">
            Inga uppgifter ännu. Lägg in kundens mått, eller markera dem som ej utredda.
          </p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {specs.map((spec) =>
              editId === spec.id ? (
                <div key={spec.id} className="flex items-start gap-2 py-2 first:pt-0">
                  <SpecFields draft={editDraft} setDraft={setEditDraft} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() =>
                      run(async () => {
                        await updateProjectSpec(spec.id, projectId, editDraft)
                        setEditId(null)
                      })
                    }
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div key={spec.id} className="py-2 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 truncate text-sm text-[#6B6B6B]">
                      {labelOf(spec)}
                    </span>
                    <span
                      className={
                        spec.value_type === 'pending' || spec.value_type === 'unknown'
                          ? 'shrink-0 text-sm italic text-[#9A9A9A]'
                          : 'shrink-0 text-sm tabular-nums'
                      }
                    >
                      {valueOf(spec)}
                    </span>
                    <Button variant="ghost" size="icon-sm" disabled={isPending} onClick={() => startEdit(spec)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => run(() => deleteProjectSpec(spec.id, projectId))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {spec.note && <p className="text-xs text-[#9A9A9A]">{spec.note}</p>}
                </div>
              )
            )}
          </div>
        )}

        {adding && (
          <div className="flex items-start gap-2 border-t border-[#B8B8B8]/40 pt-3">
            <SpecFields draft={newDraft} setDraft={setNewDraft} />
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  await createProjectSpec(projectId, newDraft)
                  setNewDraft(EMPTY)
                  setAdding(false)
                })
              }
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setAdding(false)
                setNewDraft(EMPTY)
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Fritext under raderna, för det som inte passar i ett fält. */}
        <div className="border-t border-[#B8B8B8]/40 pt-3">
          {editingNote ? (
            <div className="space-y-2">
              <textarea
                className="w-full min-h-24 rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Övrigt om förutsättningarna"
              />
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditingNote(false)
                    setNoteDraft(conditionsNote ?? '')
                  }}
                >
                  <X className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() =>
                    run(async () => {
                      await updateProjectConditionsNote(projectId, noteDraft)
                      setEditingNote(false)
                    })
                  }
                >
                  <Check className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              {conditionsNote ? (
                <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{conditionsNote}</p>
              ) : (
                <p className="text-sm text-[#B8B8B8]">Övrigt om förutsättningarna</p>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => setEditingNote(true)}>
                <Pencil className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
