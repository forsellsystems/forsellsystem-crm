'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
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
import { PIPELINE_STAGES, CURRENCIES, DEAL_HEAT_LEVELS } from '@/lib/constants'
import { dealSchema, type DealFormData } from '@/lib/validations'
import { updateDeal } from '@/lib/actions/deal-actions'
import { fortnoxConnected as getFortnoxConnected } from '@/lib/actions/fortnox-actions'
import { FortnoxOfferField } from '@/components/pipeline/fortnox-offer-field'
import type { FortnoxOfferSummary } from '@/lib/fortnox/types'
import type { DealWithRelations, User, Machine } from '@/lib/types/database'

interface EditDealDialogProps {
  deal: DealWithRelations & { machines: { id: string }[] }
  companies: { id: string; name: string }[]
  resellers: { id: string; name: string }[]
  users: User[]
  machines: Machine[]
}

export function EditDealDialog({ deal, companies, resellers, users, machines }: EditDealDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedMachines, setSelectedMachines] = useState<string[]>(
    deal.machines.map((m) => m.id)
  )
  const [fortnoxOk, setFortnoxOk] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: formResolver(dealSchema),
    defaultValues: {
      quote_number: deal.quote_number ?? '',
      company_id: deal.company_id,
      contact_id: deal.contact_id ?? '',
      stage: deal.stage as DealFormData['stage'],
      value: deal.value ?? undefined,
      currency: deal.currency as DealFormData['currency'],
      responsible_user_id: deal.responsible_user_id ?? '',
      reseller_id: deal.reseller_id ?? '',
      project_id: deal.project_id ?? '',
      quote_date: deal.quote_date ?? '',
      heat: deal.heat ?? null,
      fortnox_offer_documentnumber: deal.fortnox_offer_documentnumber ?? '',
      machine_ids: deal.machines.map((m) => m.id),
    },
  })

  const selectedCompanyId = watch('company_id')
  const linkedOffer = watch('fortnox_offer_documentnumber') || ''

  // Fortnox drives value/quote_number/quote_date while an offer is linked.
  function linkOffer(summary: FortnoxOfferSummary) {
    setValue('fortnox_offer_documentnumber', summary.documentNumber)
    setValue('quote_number', summary.documentNumber)
    if (summary.total != null) setValue('value', summary.total)
    if (summary.offerDate) setValue('quote_date', summary.offerDate)
    if (summary.currency) setValue('currency', summary.currency as DealFormData['currency'])
  }
  function unlinkOffer() {
    setValue('fortnox_offer_documentnumber', '')
  }

  useEffect(() => {
    if (open) getFortnoxConnected().then(setFortnoxOk).catch(() => setFortnoxOk(false))
  }, [open])

  useEffect(() => {
    if (!selectedCompanyId) { setContacts([]); setProjects([]); return }
    fetch(`/api/contacts?company_id=${selectedCompanyId}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setContacts)
      .catch(() => setContacts([]))
    fetch(`/api/projects?company_id=${selectedCompanyId}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [selectedCompanyId])

  function toggleMachine(machineId: string) {
    setSelectedMachines((prev) => {
      const next = prev.includes(machineId)
        ? prev.filter((id) => id !== machineId)
        : [...prev, machineId]
      setValue('machine_ids', next)
      return next
    })
  }

  async function onSubmit(data: DealFormData) {
    try {
      setError(null)
      await updateDeal(deal.id, { ...data, machine_ids: selectedMachines })
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline">
          <Pencil className="size-4 mr-2" />
          Redigera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Redigera affär</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 max-h-[65vh] overflow-y-auto px-1">
          <input type="hidden" {...register('fortnox_offer_documentnumber')} />
          <FortnoxOfferField
            connected={fortnoxOk}
            linkedNumber={linkedOffer}
            onLink={linkOffer}
            onUnlink={unlinkOffer}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-deal-quote">Offertnummer</Label>
              <Input id="edit-deal-quote" readOnly={!!linkedOffer} className="read-only:bg-[#F2F2F0] read-only:text-[#6B6B6B]" {...register('quote_number')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-deal-quote-date">Offertdatum</Label>
              <Input id="edit-deal-quote-date" type="date" readOnly={!!linkedOffer} className="read-only:bg-[#F2F2F0] read-only:text-[#6B6B6B]" {...register('quote_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-deal-value">Värde</Label>
              <div className="flex gap-2">
                <Input id="edit-deal-value" type="number" readOnly={!!linkedOffer} className="flex-1 read-only:bg-[#F2F2F0] read-only:text-[#6B6B6B]" {...register('value')} />
                <select disabled={!!linkedOffer} className="flex h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-60" {...register('currency')}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-deal-stage">Steg</Label>
            <select id="edit-deal-stage" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('stage')}>
              {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-deal-company">Kund</Label>
            <select id="edit-deal-company" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('company_id')}>
              <option value="">Välj kund...</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.company_id && <p className="text-xs text-[#8B3D3D]">{errors.company_id.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-deal-contact">Kontakt</Label>
            <select id="edit-deal-contact" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('contact_id')} disabled={!selectedCompanyId}>
              <option value="">{selectedCompanyId ? 'Välj kontakt...' : 'Välj kund först'}</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-deal-project">Projekt</Label>
            <select id="edit-deal-project" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('project_id')} disabled={!selectedCompanyId}>
              <option value="">{selectedCompanyId ? 'Inget projekt' : 'Välj kund först'}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-deal-responsible">Ansvarig säljare</Label>
            <select id="edit-deal-responsible" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('responsible_user_id')}>
              <option value="">Ingen ansvarig</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-deal-heat">Status</Label>
            <select id="edit-deal-heat" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('heat')}>
              <option value="">— Ingen</option>
              {DEAL_HEAT_LEVELS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          {resellers.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="edit-deal-reseller">Agent</Label>
              <select id="edit-deal-reseller" className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" {...register('reseller_id')}>
                <option value="">Ingen agent</option>
                {resellers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Produkter / Maskiner</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border border-border rounded-lg p-2">
              {machines.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[#F2F2F0] rounded p-1">
                  <input type="checkbox" checked={selectedMachines.includes(m.id)} onChange={() => toggleMachine(m.id)} className="rounded border-border" />
                  <span className="truncate">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
