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
import { deleteDeal } from '@/lib/actions/deal-actions'

export function DeleteDealButton({ dealId }: { dealId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteDeal(dealId)
      router.push('/pipeline')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ta bort')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Trash2 className="size-4 text-[#8B3D3D]" data-icon="inline-start" />
        Ta bort
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ta bort affär</DialogTitle>
          <DialogDescription>
            Är du säker? Affären och alla kopplade anteckningar tas bort. Detta kan inte ångras.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Avbryt</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Tar bort...' : 'Ta bort'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
