'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
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
import { CURRENCIES } from '@/lib/constants'
import { dealSchema, type DealFormData } from '@/lib/validations'
import { createDeal } from '@/lib/actions/deal-actions'
import type { User, Machine } from '@/lib/types/database'

interface NewDealDialogProps {
  companies: { id: string; name: string }[]
  resellers: { id: string; name: string }[]
  users: User[]
  machines: Machine[]
}

export function NewDealDialog({ companies, resellers, users, machines }: NewDealDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])
  const [selectedMachines, setSelectedMachines] = useState<string[]>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: formResolver(dealSchema),
    defaultValues: {
      quote_number: '',
      company_id: '',
      contact_id: '',
      stage: 'kontakt',
      value: undefined,
      currency: 'SEK',
      responsible_user_id: '',
      reseller_id: '',
      quote_date: '',
      machine_ids: [],
    },
  })

  const selectedCompanyId = watch('company_id')

  // Fetch contacts when company changes
  useEffect(() => {
    if (!selectedCompanyId) {
      setContacts([])
      return
    }

    async function fetchContacts() {
      try {
        const res = await fetch(
          `/api/contacts?company_id=${selectedCompanyId}`
        )
        if (res.ok) {
          const data = await res.json()
          setContacts(data)
        }
      } catch {
        setContacts([])
      }
    }
    fetchContacts()
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
      await createDeal({ ...data, machine_ids: selectedMachines })
      setOpen(false)
      reset()
      setSelectedMachines([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white" />}>
        <Plus className="size-4" data-icon="inline-start" />
        Ny affär
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny affär</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="deal-quote">Offertnummer</Label>
              <Input id="deal-quote" placeholder="OFF-001" {...register('quote_number')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deal-quote-date">Offertdatum</Label>
              <Input id="deal-quote-date" type="date" {...register('quote_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="deal-value">Värde</Label>
              <div className="flex gap-2">
                <Input
                  id="deal-value"
                  type="number"
                  placeholder="0"
                  className="flex-1"
                  {...register('value')}
                />
                <select
                  className="flex h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register('currency')}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deal-company">Företag</Label>
            <select
              id="deal-company"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...register('company_id')}
            >
              <option value="">Välj företag...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.company_id && (
              <p className="text-xs text-[#8B3D3D]">{errors.company_id.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deal-contact">Kontakt</Label>
            <select
              id="deal-contact"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...register('contact_id')}
              disabled={!selectedCompanyId}
            >
              <option value="">
                {selectedCompanyId ? 'Välj kontakt...' : 'Välj företag först'}
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deal-responsible">Ansvarig säljare</Label>
            <select
              id="deal-responsible"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...register('responsible_user_id')}
            >
              <option value="">Ingen ansvarig</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {resellers.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="deal-reseller">Återförsäljare</Label>
              <select
                id="deal-reseller"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                {...register('reseller_id')}
              >
                <option value="">Ingen återförsäljare</option>
                {resellers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Produkter / Maskiner</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border border-border rounded-lg p-2">
              {machines.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[#F2F2F0] rounded p-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedMachines.includes(m.id)}
                    onChange={() => toggleMachine(m.id)}
                    className="rounded border-border"
                  />
                  <span className="truncate">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Skapar...' : 'Skapa affär'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
