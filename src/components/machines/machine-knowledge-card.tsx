'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QUESTION_CATEGORIES } from '@/lib/constants'
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/lib/actions/machine-question-actions'
import type { MachineQuestion } from '@/lib/types/database'

const selectClass =
  'w-full rounded-lg border border-border bg-background px-2.5 h-8 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  QUESTION_CATEGORIES.map((c) => [c.key, c.label])
)

// Tema + fråga + valfri notering. Delas av lägg-till-raden och radredigeringen.
function EditFields({
  category, setCategory, question, setQuestion, note, setNote,
}: {
  category: string; setCategory: (v: string) => void
  question: string; setQuestion: (v: string) => void
  note: string; setNote: (v: string) => void
}) {
  return (
    <div className="flex-1 space-y-2">
      <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Tema">
        <option value="">Tema (valfritt)</option>
        {QUESTION_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
      <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Fråga att ställa" />
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Varför frågan är viktig (valfritt)" />
    </div>
  )
}

export function MachineKnowledgeCard({
  machineId,
  questions,
}: {
  machineId: string
  questions: MachineQuestion[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [nCat, setNCat] = useState('')
  const [nQ, setNQ] = useState('')
  const [nNote, setNNote] = useState('')

  const [editId, setEditId] = useState<string | null>(null)
  const [eCat, setECat] = useState('')
  const [eQ, setEQ] = useState('')
  const [eNote, setENote] = useState('')

  // Grupper i temaordning; frågor utan (eller okänt) tema hamnar sist under "Övrigt".
  const groups = [
    ...QUESTION_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      items: questions.filter((q) => q.category === c.key),
    })),
    {
      key: 'ovrigt',
      label: 'Övrigt',
      items: questions.filter((q) => !q.category || !CATEGORY_LABEL[q.category]),
    },
  ].filter((g) => g.items.length > 0)

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

  function add() {
    if (!nQ.trim()) return
    run(async () => {
      await createQuestion(machineId, { question: nQ.trim(), category: nCat, note: nNote })
      setNCat('')
      setNQ('')
      setNNote('')
      setAdding(false)
    })
  }

  function startEdit(q: MachineQuestion) {
    setEditId(q.id)
    setECat(q.category ?? '')
    setEQ(q.question)
    setENote(q.note ?? '')
    setError(null)
  }

  function saveEdit(id: string) {
    if (!eQ.trim()) return
    run(async () => {
      await updateQuestion(id, machineId, { question: eQ.trim(), category: eCat, note: eNote })
      setEditId(null)
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Kunskapsbank
          </CardTitle>
          <p className="mt-1 text-xs text-[#9A9A9A]">
            Frågor att ställa för att förstå kundens behov
          </p>
        </div>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)} disabled={isPending}>
            <Plus className="size-4" />
            Ny fråga
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">
            Inga frågor ännu. Bygg upp frågorna ni behöver ställa för den här maskinen.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="space-y-1">
              <p className="font-condensed text-[11px] uppercase tracking-[0.12em] text-[#9A9A9A]">
                {group.label}
              </p>
              <div className="divide-y divide-[#B8B8B8]/40">
                {group.items.map((q) =>
                  editId === q.id ? (
                    <div key={q.id} className="flex items-start gap-2 py-2 first:pt-0">
                      <EditFields
                        category={eCat} setCategory={setECat}
                        question={eQ} setQuestion={setEQ}
                        note={eNote} setNote={setENote}
                      />
                      <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(q.id)} disabled={isPending}>
                        <Check className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)} disabled={isPending}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div key={q.id} className="flex items-start gap-2 py-2 first:pt-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1A1A1A]">{q.question}</p>
                        {q.note && <p className="mt-0.5 text-xs text-[#6B6B6B]">{q.note}</p>}
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => startEdit(q)} disabled={isPending}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => run(() => deleteQuestion(q.id, machineId))} disabled={isPending}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}

        {adding && (
          <div className="flex items-start gap-2 border-t border-[#B8B8B8]/40 pt-4">
            <EditFields
              category={nCat} setCategory={setNCat}
              question={nQ} setQuestion={setNQ}
              note={nNote} setNote={setNNote}
            />
            <Button variant="ghost" size="icon-sm" onClick={add} disabled={isPending || !nQ.trim()}>
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setAdding(false)
                setNCat('')
                setNQ('')
                setNNote('')
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
