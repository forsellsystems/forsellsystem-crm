'use client'

import { useState } from 'react'
import { Archive } from 'lucide-react'
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
import { archiveProspect } from '@/lib/actions/prospect-actions'

export function ArchiveProspectButton({ prospectId }: { prospectId: string }) {
  const [isArchiving, setIsArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleArchive() {
    setIsArchiving(true)
    setError(null)
    try {
      await archiveProspect(prospectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte arkivera')
      setIsArchiving(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Archive className="size-4" data-icon="inline-start" />
        Arkivera
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Arkivera prospekt</DialogTitle>
          <DialogDescription>
            Prospektet kommer att markeras som arkiverat och döljas från aktiva
            listor. Det kan fortfarande hittas via filtret.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Avbryt
          </DialogClose>
          <Button onClick={handleArchive} disabled={isArchiving}>
            {isArchiving ? 'Arkiverar...' : 'Arkivera'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
