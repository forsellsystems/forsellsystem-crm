'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { deleteProject } from '@/lib/actions/project-actions'

/**
 * Radering av ett projekt, med samma tydlighet som på kund- och prospektsidorna:
 * en namngiven knapp i sidhuvudet, inte en ensam ikon inne i ett kort.
 * Raderingen är en riktig DELETE och tar med projektets anteckningar och logg.
 */
export function DeleteProjectButton({
  projectId,
  projectName,
  entityType,
  entityId,
}: {
  projectId: string
  projectName: string
  entityType: string
  entityId: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteProject(projectId, entityType, entityId)
      router.push('/projekt')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-[#8B3D3D]" />}>
        <Trash2 className="size-4" data-icon="inline-start" />
        Radera
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Radera projekt</DialogTitle>
          <DialogDescription>
            {projectName} tas bort permanent, tillsammans med projektets anteckningar
            och logg. Affärer som pekar på projektet blir kvar, men utan projekt.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Avbryt</DialogClose>
          <Button
            className="bg-[#8B3D3D] text-white hover:bg-[#7A3535]"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Raderar...' : 'Radera projekt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
