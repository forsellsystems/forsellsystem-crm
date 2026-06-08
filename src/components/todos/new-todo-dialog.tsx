'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTodo } from '@/lib/actions/todo-actions'

interface NewTodoDialogProps {
  customers: { id: string; name: string }[]
  resellers: { id: string; name: string }[]
  customerProspects: { id: string; name: string }[]
  resellerProspects: { id: string; name: string }[]
}

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function NewTodoDialog({
  customers,
  resellers,
  customerProspects,
  resellerProspects,
}: NewTodoDialogProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [selected, setSelected] = useState('') // '' = internt, annars 'company:id' / 'prospect:id'
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreate() {
    if (!content.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      let entity_type: 'company' | 'prospect' | undefined
      let entity_id: string | undefined
      if (selected) {
        const [t, i] = selected.split(':')
        entity_type = t as 'company' | 'prospect'
        entity_id = i
      }
      await createTodo({
        content: content.trim(),
        source: 'manual',
        entity_type,
        entity_id,
        due_date: dueDate || undefined,
      })
      setOpen(false)
      setContent('')
      setSelected('')
      setDueDate('')
      setIsSubmitting(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white" />}>
        <Plus className="size-4" data-icon="inline-start" />
        Ny to-do
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ny to-do</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="todo-content">To-do</Label>
            <Input
              id="todo-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="T.ex. Skicka offert"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="todo-entity">Bolag (valfritt)</Label>
              <select
                id="todo-entity"
                className={selectClass}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Inget (internt)</option>
                {customers.length > 0 && (
                  <optgroup label="Kunder">
                    {customers.map((c) => (
                      <option key={c.id} value={`company:${c.id}`}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
                {resellers.length > 0 && (
                  <optgroup label="Agenter">
                    {resellers.map((r) => (
                      <option key={r.id} value={`company:${r.id}`}>{r.name}</option>
                    ))}
                  </optgroup>
                )}
                {customerProspects.length > 0 && (
                  <optgroup label="Kund-prospekt">
                    {customerProspects.map((p) => (
                      <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
                {resellerProspects.length > 0 && (
                  <optgroup label="Agent-prospekt">
                    {resellerProspects.map((p) => (
                      <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="todo-due">Slutdatum (valfritt)</Label>
              <Input
                id="todo-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button onClick={handleCreate} disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Skapar...' : 'Skapa'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
