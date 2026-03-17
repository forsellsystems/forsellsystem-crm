'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { Plus, Pencil } from 'lucide-react'
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
import { MACHINE_CATEGORIES } from '@/lib/constants'
import { machineSchema, type MachineFormData } from '@/lib/validations'
import { createMachine, updateMachine } from '@/lib/actions/machine-actions'
import type { Machine } from '@/lib/types/database'

interface MachineDialogProps {
  machine?: Machine
  trigger?: React.ReactElement
}

export function MachineDialog({ machine, trigger }: MachineDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!machine

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MachineFormData>({
    resolver: formResolver(machineSchema),
    defaultValues: machine
      ? {
          name: machine.name,
          category: machine.category,
          description: machine.description ?? '',
        }
      : {
          name: '',
          category: 'Element Handling',
          description: '',
        },
  })

  async function onSubmit(data: MachineFormData) {
    try {
      setError(null)
      if (isEditing) {
        await updateMachine(machine.id, data)
      } else {
        await createMachine(data)
      }
      setOpen(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={<Button />}
        >
          <Plus className="size-4" data-icon="inline-start" />
          Ny maskin
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Redigera maskin' : 'Ny maskin'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              placeholder="T.ex. Vertilift"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-[#8B3D3D]">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <select
              id="category"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...register('category')}
            >
              {MACHINE_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-[#8B3D3D]">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              placeholder="Beskriv maskinen..."
              rows={3}
              {...register('description')}
            />
          </div>

          {error && (
            <p className="text-sm text-[#8B3D3D]">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Sparar...'
                : isEditing
                  ? 'Spara ändringar'
                  : 'Skapa maskin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditMachineButton({ machine }: { machine: Machine }) {
  return (
    <MachineDialog
      machine={machine}
      trigger={<Button variant="ghost" size="icon-sm"><Pencil className="size-3.5" /></Button>}
    />
  )
}
