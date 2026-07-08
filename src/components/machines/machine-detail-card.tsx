'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MACHINE_CATEGORIES, CURRENCIES } from '@/lib/constants'
import { updateMachine } from '@/lib/actions/machine-actions'
import type { MachineFormData } from '@/lib/validations'
import type { Machine } from '@/lib/types/database'

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function MachineDetailCard({ machine }: { machine: Machine }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(machine.name)
  const [category, setCategory] = useState(machine.category)
  const [currency, setCurrency] = useState(machine.currency)
  const [description, setDescription] = useState(machine.description ?? '')

  function cancel() {
    setName(machine.name)
    setCategory(machine.category)
    setCurrency(machine.currency)
    setDescription(machine.description ?? '')
    setError(null)
    setEditing(false)
  }

  function save() {
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await updateMachine(machine.id, {
          name: name.trim(),
          category,
          description,
          currency: currency as MachineFormData['currency'],
        })
        setEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel')
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Maskindetaljer
        </CardTitle>
        {!editing && (
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {editing ? (
          <>
            <div className="grid gap-1.5">
              <Label className="text-xs text-[#6B6B6B]">Namn</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-[#6B6B6B]">Kategori</Label>
              <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                {MACHINE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-[#6B6B6B]">Valuta</Label>
              <select className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-[#6B6B6B]">Beskrivning</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon-sm" onClick={cancel} disabled={isPending}>
                <X className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={save} disabled={isPending}>
                <Check className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Kategori</span>
              <span>{machine.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Valuta</span>
              <span>{machine.currency}</span>
            </div>
            {machine.description && (
              <div className="pt-1">
                <p className="text-[#6B6B6B] mb-1">Beskrivning</p>
                <p className="text-[#1A1A1A] whitespace-pre-wrap">{machine.description}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
