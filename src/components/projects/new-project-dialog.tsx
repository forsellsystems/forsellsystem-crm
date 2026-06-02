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
import { Label } from '@/components/ui/label'
import { createProject } from '@/lib/actions/project-actions'

interface NewProjectDialogProps {
  companies: { id: string; name: string }[]
  prospects: { id: string; name: string }[]
}

export function NewProjectDialog({ companies, prospects }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreate() {
    if (!selected) return
    const [entityType, entityId] = selected.split(':')
    setIsSubmitting(true)
    setError(null)
    try {
      const id = await createProject({
        entity_type: entityType as 'company' | 'prospect',
        entity_id: entityId,
        currency: 'SEK',
      })
      setOpen(false)
      router.push(`/projekt/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white" />}>
        <Plus className="size-4" data-icon="inline-start" />
        Nytt projekt
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nytt projekt</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project-entity">Bolag</Label>
            <select
              id="project-entity"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Välj bolag...</option>
              {companies.length > 0 && (
                <optgroup label="Kunder">
                  {companies.map((c) => (
                    <option key={c.id} value={`company:${c.id}`}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              {prospects.length > 0 && (
                <optgroup label="Prospekt">
                  {prospects.map((p) => (
                    <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button onClick={handleCreate} disabled={isSubmitting || !selected}>
              {isSubmitting ? 'Skapar...' : 'Skapa'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
