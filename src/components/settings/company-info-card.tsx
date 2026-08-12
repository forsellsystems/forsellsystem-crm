'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Check, X, Trash2, ChevronUp, ChevronDown, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { COMPANY_INFO_SECTIONS, TERM_USAGE } from '@/lib/constants'
import {
  createCompanyInfo,
  updateCompanyInfo,
  deleteCompanyInfo,
  moveCompanyInfo,
} from '@/lib/actions/company-info-actions'
import type { CompanyInfo } from '@/lib/types/database'

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

const USAGE_LABEL = new Map(TERM_USAGE.map((u) => [u.key as string, u.label]))

type Draft = {
  section: string
  title: string
  title_en: string
  content: string
  content_en: string
  term_usage: string
}

const EMPTY: Draft = {
  section: '',
  title: '',
  title_en: '',
  content: '',
  content_en: '',
  term_usage: '',
}

function draftFrom(row: CompanyInfo): Draft {
  return {
    section: row.section ?? '',
    title: row.title,
    title_en: row.title_en ?? '',
    content: row.content ?? '',
    content_en: row.content_en ?? '',
    term_usage: row.term_usage ?? '',
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-[#6B6B6B]"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? 'Kopierat' : label}
    </Button>
  )
}

function EditFields({ d, set }: { d: Draft; set: (next: Draft) => void }) {
  const isTerm = d.section === 'ordlista'

  return (
    <div className="flex-1 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select
          className={selectClass}
          value={d.section}
          onChange={(e) => set({ ...d, section: e.target.value })}
          aria-label="Sektion"
        >
          <option value="">Övrigt</option>
          {COMPANY_INFO_SECTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        {isTerm && (
          <select
            className={selectClass}
            value={d.term_usage}
            onChange={(e) => set({ ...d, term_usage: e.target.value })}
            aria-label="Vems ord"
          >
            <option value="">Vems ord?</option>
            {TERM_USAGE.map((u) => (
              <option key={u.key} value={u.key}>{u.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          value={d.title}
          onChange={(e) => set({ ...d, title: e.target.value })}
          placeholder={isTerm ? 'Term (svenska)' : 'Rubrik'}
        />
        <Input
          value={d.title_en}
          onChange={(e) => set({ ...d, title_en: e.target.value })}
          placeholder={isTerm ? 'Term (engelska)' : 'Rubrik (engelska, valfri)'}
        />
      </div>

      <Textarea
        rows={isTerm ? 2 : 4}
        value={d.content}
        onChange={(e) => set({ ...d, content: e.target.value })}
        placeholder={isTerm ? 'Kommentar (valfri)' : 'Text på svenska'}
      />
      <Textarea
        rows={isTerm ? 2 : 4}
        value={d.content_en}
        onChange={(e) => set({ ...d, content_en: e.target.value })}
        placeholder={isTerm ? 'Comment (optional)' : 'Text på engelska (valfri)'}
      />
    </div>
  )
}

export function CompanyInfoCard({ rows }: { rows: CompanyInfo[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Draft>(EMPTY)

  const known = new Set<string>(COMPANY_INFO_SECTIONS.map((s) => s.key))
  const groups = [
    ...COMPANY_INFO_SECTIONS.map((s) => ({
      key: s.key as string,
      label: s.label as string,
      items: rows.filter((r) => r.section === s.key),
    })),
    {
      key: 'ovrigt',
      label: 'Övrigt',
      items: rows.filter((r) => !r.section || !known.has(r.section)),
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

  function payload(d: Draft) {
    return {
      section: d.section,
      title: d.title,
      title_en: d.title_en,
      content: d.content,
      content_en: d.content_en,
      term_usage: d.term_usage as '' | 'vi' | 'kunden' | 'bada',
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Företagsinformation
          </CardTitle>
          <p className="mt-1 text-xs text-[#9A9A9A]">
            Det som inte går att fråga databasen om. Kan en query producera det, skriv inte in det här.
          </p>
        </div>
        {!adding && (
          <Button variant="ghost" size="icon-sm" onClick={() => setAdding(true)} disabled={isPending}>
            <Plus className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">Inget tillagt ännu.</p>
        ) : (
          groups.map((group) => {
            const isTerms = group.key === 'ordlista'
            return (
              <div key={group.key} className="space-y-1">
                <p className="font-condensed text-[11px] uppercase tracking-[0.12em] text-[#9A9A9A]">
                  {group.label}
                </p>
                <div className="divide-y divide-[#B8B8B8]/40">
                  {group.items.map((row) => {
                    const first = rows.indexOf(row) === 0
                    const last = rows.indexOf(row) === rows.length - 1
                    return editId === row.id ? (
                      <div key={row.id} className="flex items-start gap-2 py-3 first:pt-0">
                        <EditFields d={edit} set={setEdit} />
                        <Button variant="ghost" size="icon-sm" onClick={() => run(async () => { await updateCompanyInfo(row.id, payload(edit)); setEditId(null) })} disabled={isPending}>
                          <Check className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)} disabled={isPending}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div key={row.id} className="flex items-start gap-2 py-3 first:pt-0">
                        <div className="flex-1 min-w-0">
                          {isTerms ? (
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="text-sm text-[#1A1A1A]">{row.title}</span>
                              {row.title_en && (
                                <>
                                  <span className="text-[#B8B8B8]">→</span>
                                  <span className="text-sm text-[#1A1A1A]">{row.title_en}</span>
                                </>
                              )}
                              {row.term_usage && (
                                <span className="rounded border border-[#D4A301]/40 bg-[#F2BB01]/10 px-1.5 py-px text-[10px] uppercase tracking-[0.1em] text-[#8F6B00]">
                                  {USAGE_LABEL.get(row.term_usage)}
                                </span>
                              )}
                              {row.content && (
                                <span className="w-full text-xs text-[#6B6B6B]">{row.content}</span>
                              )}
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-[#1A1A1A]">{row.title}</p>
                              {row.content && (
                                <p className="mt-1 whitespace-pre-wrap text-sm text-[#4A4A4A]">{row.content}</p>
                              )}
                              {row.content_en && (
                                <>
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#6B6B6B]">{row.content_en}</p>
                                  <div className="mt-1 flex gap-1">
                                    <CopyButton text={row.content ?? ''} label="Kopiera svenska" />
                                    <CopyButton text={row.content_en} label="Kopiera engelska" />
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => run(() => moveCompanyInfo(row.id, 'up'))} disabled={isPending || first} aria-label="Flytta upp">
                          <ChevronUp className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => run(() => moveCompanyInfo(row.id, 'down'))} disabled={isPending || last} aria-label="Flytta ner">
                          <ChevronDown className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditId(row.id); setEdit(draftFrom(row)); setError(null) }} disabled={isPending}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => run(() => deleteCompanyInfo(row.id))} disabled={isPending}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        {adding && (
          <div className="flex items-start gap-2 border-t border-[#B8B8B8]/40 pt-4">
            <EditFields d={draft} set={setDraft} />
            <Button variant="ghost" size="icon-sm" onClick={() => run(async () => { await createCompanyInfo(payload(draft)); setDraft(EMPTY) })} disabled={isPending || !draft.title.trim()}>
              <Check className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => { setAdding(false); setDraft(EMPTY) }} disabled={isPending}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

        <Label className="sr-only">Företagsinformation</Label>
      </CardContent>
    </Card>
  )
}
