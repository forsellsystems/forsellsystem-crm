'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Check, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createFeature,
  updateFeature,
  deleteFeature,
  moveFeature,
} from '@/lib/actions/machine-feature-actions'
import type { MachineFeature } from '@/lib/types/database'

// Svenska + engelska, delas av lägg-till-raden och radredigeringen.
function EditFields({
  sv, setSv, en, setEn,
}: {
  sv: string; setSv: (v: string) => void
  en: string; setEn: (v: string) => void
}) {
  return (
    <div className="flex-1 space-y-2">
      <Input value={sv} onChange={(e) => setSv(e.target.value)} placeholder="Feature (svenska)" aria-label="Feature på svenska" />
      <Input value={en} onChange={(e) => setEn(e.target.value)} placeholder="Feature (engelska, valfritt)" aria-label="Feature på engelska" />
    </div>
  )
}

export function MachineFeaturesCard({
  machineId,
  features,
}: {
  machineId: string
  features: MachineFeature[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [nSv, setNSv] = useState('')
  const [nEn, setNEn] = useState('')

  const [editId, setEditId] = useState<string | null>(null)
  const [eSv, setESv] = useState('')
  const [eEn, setEEn] = useState('')

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

  function resetAdd() {
    setNSv('')
    setNEn('')
    setAdding(false)
  }

  function add() {
    if (!nSv.trim()) return
    run(async () => {
      await createFeature(machineId, { name: nSv.trim(), name_en: nEn })
      // Håll raden öppen så flera features kan läggas in i följd.
      setNSv('')
      setNEn('')
    })
  }

  function startEdit(f: MachineFeature) {
    setEditId(f.id)
    setESv(f.name)
    setEEn(f.name_en ?? '')
    setError(null)
  }

  function saveEdit(id: string) {
    if (!eSv.trim()) return
    run(async () => {
      await updateFeature(id, machineId, { name: eSv.trim(), name_en: eEn })
      setEditId(null)
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Features
          </CardTitle>
          <p className="mt-1 text-xs text-[#9A9A9A]">
            Säljpunkter på svenska och engelska
          </p>
        </div>
        {!adding && (
          <Button variant="ghost" size="icon-sm" onClick={() => setAdding(true)} disabled={isPending}>
            <Plus className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {features.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">Inga features tillagda.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {features.map((f, i) =>
              editId === f.id ? (
                <div key={f.id} className="flex items-start gap-2 py-2 first:pt-0">
                  <EditFields sv={eSv} setSv={setESv} en={eEn} setEn={setEEn} />
                  <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(f.id)} disabled={isPending}>
                    <Check className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)} disabled={isPending}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div key={f.id} className="flex items-start gap-2 py-2 first:pt-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1A1A]">{f.name}</p>
                    <p className={`mt-0.5 text-xs ${f.name_en ? 'text-[#6B6B6B]' : 'text-[#9A9A9A]'}`}>
                      {f.name_en ?? 'Engelsk text saknas'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => run(() => moveFeature(f.id, machineId, 'up'))}
                    disabled={isPending || i === 0}
                    aria-label="Flytta upp"
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => run(() => moveFeature(f.id, machineId, 'down'))}
                    disabled={isPending || i === features.length - 1}
                    aria-label="Flytta ner"
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => startEdit(f)} disabled={isPending}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => run(() => deleteFeature(f.id, machineId))} disabled={isPending}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}

        {adding && (
          <div className="flex items-start gap-2 border-t border-[#B8B8B8]/40 pt-3">
            <EditFields sv={nSv} setSv={setNSv} en={nEn} setEn={setNEn} />
            <Button variant="ghost" size="icon-sm" onClick={add} disabled={isPending || !nSv.trim()}>
              <Check className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={resetAdd} disabled={isPending}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
