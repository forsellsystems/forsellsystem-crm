'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { createMeeting } from '@/lib/actions/meeting-actions'

interface NewMeetingDialogProps {
  customers?: { id: string; name: string }[]
  resellers?: { id: string; name: string }[]
  customerProspects?: { id: string; name: string }[]
  resellerProspects?: { id: string; name: string }[]
  // When set, the bolag selector is hidden and the meeting is locked to this
  // entity. 'company'/'prospect' come from a kund/agent/prospekt card; 'deal'/
  // 'project' come from a deal/project card (the anchor is derived server-side).
  fixedEntity?: { type: 'company' | 'prospect' | 'deal' | 'project'; id: string }
  triggerStyle?: 'cta' | 'icon'
}

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

export function NewMeetingDialog({
  customers = [],
  resellers = [],
  customerProspects = [],
  resellerProspects = [],
  fixedEntity,
  triggerStyle = 'cta',
}: NewMeetingDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [dealId, setDealId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [deals, setDeals] = useState<{ id: string; label: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [participants, setParticipants] = useState('')
  const [agenda, setAgenda] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fixedType = fixedEntity?.type
  const lockedToDealOrProject = fixedType === 'deal' || fixedType === 'project'

  // The company/prospect whose deals/projects can be linked (a fixed kund/prospekt,
  // or the one picked in the Bolag selector). Null for internal / fixed deal/project.
  const activeType: 'company' | 'prospect' | null =
    fixedType === 'company' || fixedType === 'prospect'
      ? fixedType
      : !fixedEntity && selected
        ? (selected.split(':')[0] as 'company' | 'prospect')
        : null
  const activeId: string | null =
    fixedType === 'company' || fixedType === 'prospect'
      ? fixedEntity!.id
      : !fixedEntity && selected
        ? selected.split(':')[1]
        : null

  // Cascade: load the active entity's deals (companies only) + projects.
  // Lists are cleared in the Bolag onChange so the effect stays fully async
  // (no synchronous setState in an effect).
  useEffect(() => {
    if (lockedToDealOrProject || !activeType || !activeId) return
    let cancelled = false
    const dealsP =
      activeType === 'company'
        ? fetch(`/api/deals?company_id=${activeId}`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        : Promise.resolve([])
    const param = activeType === 'company' ? 'company_id' : 'prospect_id'
    const projectsP = fetch(`/api/projects?${param}=${activeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
    dealsP.then((d) => !cancelled && setDeals(d))
    projectsP.then((p) => !cancelled && setProjects(p))
    return () => {
      cancelled = true
    }
  }, [activeType, activeId, lockedToDealOrProject])

  async function handleCreate() {
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: Parameters<typeof createMeeting>[0] = {
        title,
        meeting_date: date,
        meeting_time: time,
        participants,
        agenda,
      }
      if (fixedType === 'deal') {
        payload.deal_id = fixedEntity!.id
      } else if (fixedType === 'project') {
        payload.project_id = fixedEntity!.id
      } else {
        if (fixedType === 'company' || fixedType === 'prospect') {
          payload.entity_type = fixedType
          payload.entity_id = fixedEntity!.id
        } else if (selected) {
          const [t, i] = selected.split(':')
          payload.entity_type = t as 'company' | 'prospect'
          payload.entity_id = i
        }
        if (dealId) payload.deal_id = dealId
        if (projectId) payload.project_id = projectId
      }
      const id = await createMeeting(payload)
      setOpen(false)
      router.push(`/moten/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerStyle === 'icon' ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Plus className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white" />}>
          <Plus className="size-4" data-icon="inline-start" />
          Nytt möte
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nytt möte</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid gap-2">
            <Label htmlFor="meeting-title">Titel</Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Uppstartsmöte"
            />
          </div>

          {!fixedEntity && (
            <div className="grid gap-2">
              <Label htmlFor="meeting-entity">Bolag (valfritt)</Label>
              <select
                id="meeting-entity"
                className={selectClass}
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value)
                  setDealId('')
                  setProjectId('')
                  setDeals([])
                  setProjects([])
                }}
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
          )}

          {!lockedToDealOrProject && deals.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="meeting-deal">Affär (valfritt)</Label>
              <select
                id="meeting-deal"
                className={selectClass}
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
              >
                <option value="">Ingen affär</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {!lockedToDealOrProject && projects.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="meeting-project">Projekt (valfritt)</Label>
              <select
                id="meeting-project"
                className={selectClass}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Inget projekt</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="meeting-date">Datum (valfritt)</Label>
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-time">Tid (valfritt)</Label>
              <Input
                id="meeting-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-participants">Deltagare (valfritt)</Label>
            <Input
              id="meeting-participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="T.ex. Anna, Erik, kundens VD"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-agenda">Agenda (valfritt)</Label>
            <Textarea
              id="meeting-agenda"
              rows={4}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Punkter att gå igenom (inför mötet)..."
            />
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
