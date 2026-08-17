'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  addProjectMachine,
  updateProjectMachine,
  removeProjectMachine,
} from '@/lib/actions/project-context-actions'
import type { ProjectMachineRow } from '@/lib/queries/projects'

/**
 * Vilka av våra produkter som är aktuella för projektet. Tom i början och fylls
 * på när utredningen går framåt, så en tom lista betyder att vi inte vet än.
 * Kommentaren är fri plats för information om produkten i det här projektet,
 * inte en motivering till varför den finns med.
 */
export function ProjectMachinesCard({
  projectId,
  machines,
  options,
}: {
  projectId: string
  machines: ProjectMachineRow[]
  options: { id: string; name: string; category: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [qty, setQty] = useState('1')

  const chosen = new Set(machines.map((m) => m.machine_id))
  const available = options.filter((o) => !chosen.has(o.id))

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Aktuella produkter
          </CardTitle>
          {!adding && available.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={() => setAdding(true)} disabled={isPending}>
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {machines.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">
            Inga produkter valda ännu. Fyll på när ni vet vad kunden behöver.
          </p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {machines.map((m) => (
              <div key={m.id} className="py-2 first:pt-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/maskiner/${m.machine_id}`}
                    className="min-w-0 truncate text-sm font-medium text-[#656565] hover:underline"
                  >
                    {m.machine_name}
                  </Link>
                  {/* 1 är förvalet och säger ingenting, så det visas inte. */}
                  {m.quantity > 1 && (
                    <span className="shrink-0 text-sm text-[#6B6B6B]">× {m.quantity}</span>
                  )}
                  <span className="flex-1" />
                  {m.machine_category && (
                    <span className="shrink-0 text-xs text-[#9A9A9A]">{m.machine_category}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => {
                      setEditId(m.id)
                      setNote(m.note ?? '')
                      setQty(String(m.quantity ?? 1))
                      setError(null)
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => run(() => removeProjectMachine(m.id, projectId))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {editId === m.id ? (
                  <div className="mt-2 flex items-start gap-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-16 shrink-0 rounded-lg border border-border bg-background px-2 h-8 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                      placeholder="Antal"
                      aria-label="Antal"
                    />
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Kommentar (valfritt)"
                      className="min-h-16 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() =>
                        run(async () => {
                          await updateProjectMachine(m.id, projectId, {
                            quantity: Number(qty) || 1,
                            note,
                          })
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
                  m.note && (
                    <p className="text-xs text-[#6B6B6B] whitespace-pre-wrap">{m.note}</p>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {adding && (
          <div className="flex items-center gap-2 border-t border-[#B8B8B8]/40 pt-3">
            <select
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              defaultValue=""
              disabled={isPending}
              onChange={(e) => {
                const machineId = e.target.value
                if (!machineId) return
                run(async () => {
                  await addProjectMachine(projectId, machineId)
                  setAdding(false)
                })
              }}
            >
              <option value="">Välj produkt...</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <Button variant="ghost" size="icon-sm" onClick={() => setAdding(false)}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
