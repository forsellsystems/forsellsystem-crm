'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { deleteMachine } from '@/lib/actions/machine-actions'

export function DeleteMachineButton({
  machineId,
  machineName,
}: {
  machineId: string
  machineName: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    try {
      setError(null)
      setIsDeleting(true)
      await deleteMachine(machineId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ta bort maskin')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Trash2 className="size-3.5 text-[#8B3D3D]" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ta bort maskin</DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort <strong>{machineName}</strong>?
            Detta kan inte ångras.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Avbryt
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Tar bort...' : 'Ta bort'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
