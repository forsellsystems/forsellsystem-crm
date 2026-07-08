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

const smallInput =
  'w-16 shrink-0 rounded-lg border border-border bg-background px-2 h-8 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'
const priceInput =
  'flex-1 min-w-0 rounded-lg border border-border bg-background px-2.5 h-8 text-sm text-right outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

// Name + [qty × from – to] editor, shared by the add row and the per-row edit.
function EditFields({
  name, setName, qty, setQty, min, setMin, max, setMax,
}: {
  name: string; setName: (v: string) => void
  qty: string; setQty: (v: string) => void
  min: string; setMin: (v: string) => void
  max: string; setMax: (v: string) => void
}) {
  return (
    <div className="flex-1 space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Komponentnamn" />
      <div className="flex items-center gap-2">
        <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Antal" className={smallInput} aria-label="Antal" />
        <span className="text-xs text-[#6B6B6B]">×</span>
        <input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Pris från" className={priceInput} aria-label="Pris från" />
        <span className="text-xs text-[#6B6B6B]">–</span>
        <input type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Till (valfritt)" className={priceInput} aria-label="Pris till (valfritt)" />
      </div>
    </div>
  )
}

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

  const [nName, setNName] = useState('')
  const [nQty, setNQty] = useState('1')
  const [nMin, setNMin] = useState('')
  const [nMax, setNMax] = useState('')

  const [editId, setEditId] = useState<string | null>(null)
  const [eName, setEName] = useState('')
  const [eQty, setEQty] = useState('1')
  const [eMin, setEMin] = useState('')
  const [eMax, setEMax] = useState('')

  const num = (s: string) => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }
  const fmt = (v: number) => formatCurrency(v, currency)
  const fmtRange = (min: number, max: number) => (max > min ? `${fmt(min)} – ${fmt(max)}` : fmt(min))

  // Machine total as a range: sum(min·qty) .. sum(max·qty).
  const totalMin = components.reduce((s, c) => s + (Number(c.price_min) || 0) * (Number(c.quantity) || 1), 0)
  const totalMax = components.reduce(
    (s, c) => s + (Number(c.price_max ?? c.price_min) || 0) * (Number(c.quantity) || 1),
    0
  )

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
    if (!nName.trim()) return
    run(async () => {
      await createComponent(machineId, {
        name: nName.trim(),
        price_min: num(nMin),
        price_max: nMax.trim() === '' ? undefined : num(nMax),
        quantity: Math.max(1, Math.round(num(nQty)) || 1),
      })
      setNName('')
      setNQty('1')
      setNMin('')
      setNMax('')
    })
  }

  function startEdit(c: MachineComponent) {
    setEditId(c.id)
    setEName(c.name)
    setEQty(String(c.quantity ?? 1))
    setEMin(String(c.price_min ?? ''))
    setEMax(c.price_max != null ? String(c.price_max) : '')
    setError(null)
  }

  function saveEdit(id: string) {
    if (!eName.trim()) return
    run(async () => {
      await updateComponent(id, machineId, {
        name: eName.trim(),
        price_min: num(eMin),
        price_max: eMax.trim() === '' ? undefined : num(eMax),
        quantity: Math.max(1, Math.round(num(eQty)) || 1),
      })
      setEditId(null)
    })
  }

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
            {components.map((c) => {
              const qty = Number(c.quantity) || 1
              const lineMin = (Number(c.price_min) || 0) * qty
              const lineMax = (Number(c.price_max ?? c.price_min) || 0) * qty
              return editId === c.id ? (
                <div key={c.id} className="flex items-start gap-2 py-2 first:pt-0">
                  <EditFields name={eName} setName={setEName} qty={eQty} setQty={setEQty} min={eMin} setMin={setEMin} max={eMax} setMax={setEMax} />
                  <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(c.id)} disabled={isPending}>
                    <Check className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)} disabled={isPending}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div key={c.id} className="flex items-center gap-2 py-2 first:pt-0">
                  <span className="flex-1 min-w-0 truncate text-sm text-[#1A1A1A]">
                    {c.name}
                    {qty > 1 && <span className="text-[#6B6B6B]"> × {qty}</span>}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">{fmtRange(lineMin, lineMax)}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => startEdit(c)} disabled={isPending}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => run(() => deleteComponent(c.id, machineId))} disabled={isPending}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add row */}
        <div className="flex items-start gap-2 border-t border-[#B8B8B8]/40 pt-3">
          <EditFields name={nName} setName={setNName} qty={nQty} setQty={setNQty} min={nMin} setMin={setNMin} max={nMax} setMax={setNMax} />
          <Button variant="ghost" size="icon-sm" onClick={add} disabled={isPending || !nName.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-[#B8B8B8]/40 pt-3">
          <span className="text-sm font-medium text-[#6B6B6B]">Totalpris</span>
          <span className="font-semibold tabular-nums">{fmtRange(totalMin, totalMax)}</span>
        </div>

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
