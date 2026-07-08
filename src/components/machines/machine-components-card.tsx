'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import {
  createComponent,
  updateComponent,
  deleteComponent,
} from '@/lib/actions/machine-component-actions'
import type { MachineComponent } from '@/lib/types/database'

export function MachineComponentsCard({
  machineId,
  currency,
  components,
}: {
  machineId: string
  currency: string
  components: MachineComponent[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const total = components.reduce((s, c) => s + (Number(c.price) || 0), 0)

  const parsePrice = (s: string) => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }

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
    if (!newName.trim()) return
    run(async () => {
      await createComponent(machineId, { name: newName.trim(), price: parsePrice(newPrice) })
      setNewName('')
      setNewPrice('')
    })
  }

  function startEdit(c: MachineComponent) {
    setEditId(c.id)
    setEditName(c.name)
    setEditPrice(String(c.price ?? ''))
    setError(null)
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return
    run(async () => {
      await updateComponent(id, machineId, { name: editName.trim(), price: parsePrice(editPrice) })
      setEditId(null)
    })
  }

  const priceInputClass =
    'w-28 shrink-0 rounded-lg border border-border bg-background px-2.5 h-8 text-sm text-right outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Komponenter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {components.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">Inga komponenter tillagda.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {components.map((c) =>
              editId === c.id ? (
                <div key={c.id} className="flex items-center gap-2 py-2 first:pt-0">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className={priceInputClass}
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(c.id)} disabled={isPending}>
                    <Check className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)} disabled={isPending}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div key={c.id} className="flex items-center gap-2 py-2 first:pt-0">
                  <span className="flex-1 min-w-0 truncate text-sm text-[#1A1A1A]">{c.name}</span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatCurrency(Number(c.price) || 0, currency)}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => startEdit(c)} disabled={isPending}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => run(() => deleteComponent(c.id, machineId))}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}

        {/* Add row */}
        <div className="flex items-center gap-2 border-t border-[#B8B8B8]/40 pt-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Komponentnamn"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                e.preventDefault()
                add()
              }
            }}
          />
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Pris"
            className={priceInputClass}
          />
          <Button variant="ghost" size="icon-sm" onClick={add} disabled={isPending || !newName.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-[#B8B8B8]/40 pt-3">
          <span className="text-sm font-medium text-[#6B6B6B]">Totalpris</span>
          <span className="font-semibold tabular-nums">{formatCurrency(total, currency)}</span>
        </div>

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
