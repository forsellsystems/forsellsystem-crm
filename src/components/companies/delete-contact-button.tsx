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
import { deleteContact } from '@/lib/actions/contact-actions'

/**
 * Radering av en kontakt. Bekräftas, eftersom affärer och projekt kan peka på
 * personen: de blir kvar men tappar sin kontaktperson (främmandenycklarna är
 * SET NULL). Knappen är alltid synlig, inte gömd bakom hover.
 */
export function DeleteContactButton({
  contactId,
  contactName,
  companyId,
  prospectId,
}: {
  contactId: string
  contactName: string
  companyId?: string
  prospectId?: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteContact(contactId, { company_id: companyId, prospect_id: prospectId })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ta bort kontakt</DialogTitle>
          <DialogDescription>
            {contactName} tas bort permanent. Affärer och projekt som pekar på personen
            blir kvar, men utan kontaktperson.
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
            {isDeleting ? 'Tar bort...' : 'Ta bort'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
