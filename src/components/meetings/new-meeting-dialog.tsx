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
import { createMeeting } from '@/lib/actions/meeting-actions'

interface NewMeetingDialogProps {
  customers: { id: string; name: string }[]
  resellers: { id: string; name: string }[]
  customerProspects: { id: string; name: string }[]
  resellerProspects: { id: string; name: string }[]
}

export function NewMeetingDialog({
  customers,
  resellers,
  customerProspects,
  resellerProspects,
}: NewMeetingDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreate() {
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
      const id = await createMeeting({ entity_type, entity_id })
      setOpen(false)
      router.push(`/moten/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white" />}>
        <Plus className="size-4" data-icon="inline-start" />
        Nytt möte
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nytt möte</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="meeting-entity">Bolag (valfritt)</Label>
            <select
              id="meeting-entity"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Internt möte (inget bolag)</option>
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

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Skapar...' : 'Skapa'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
