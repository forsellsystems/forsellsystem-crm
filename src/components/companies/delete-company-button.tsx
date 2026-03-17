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
import { deleteCompany } from '@/lib/actions/company-actions'

export function DeleteCompanyButton({
  companyId,
  companyName,
  redirectTo = '/foretag',
}: {
  companyId: string
  companyName: string
  redirectTo?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteCompany(companyId)
      router.push(redirectTo)
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
          <DialogTitle>Ta bort</DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort <strong>{companyName}</strong>?
            Alla kopplade kontakter och anteckningar tas också bort. Detta kan inte ångras.
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
