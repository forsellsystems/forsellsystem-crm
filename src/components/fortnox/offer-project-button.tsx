'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FolderSymlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setDealOfferProject } from '@/lib/actions/fortnox-actions'

/**
 * Skriver affärens projektnummer på dess Fortnox-offert. Visar vad som kommer
 * skrivas innan det sker, eftersom det ändrar i det riktiga Fortnox.
 *
 * `offerProject` är projektnumret offerten bär just nu, direkt från Fortnox.
 */
export function OfferProjectButton({
  dealId,
  offerProject,
  dealProjectNumber,
  dealProjectName,
}: {
  dealId: string
  offerProject: string | null
  dealProjectNumber: string | null
  dealProjectName: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const inSync = Boolean(offerProject && offerProject === dealProjectNumber)

  function write() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const res = await setDealOfferProject(dealId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMessage(`Offert ${res.data.offer} bokförs nu på projekt ${res.data.project}.`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#6B6B6B]">Projekt på offerten</span>
        <span className={offerProject ? '' : 'text-[#B8B8B8]'}>{offerProject ?? '—'}</span>
      </div>

      {inSync ? (
        <p className="text-xs text-[#9A9A9A]">Offerten bokförs på affärens projekt.</p>
      ) : dealProjectNumber ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-[#6B6B6B]"
            disabled={isPending}
            onClick={write}
          >
            <FolderSymlink className="size-4" data-icon="inline-start" />
            {offerProject ? 'Byt till affärens projekt' : 'Sätt projekt på offerten'}
          </Button>
          <p className="text-xs text-[#9A9A9A]">
            Skriver {dealProjectNumber}
            {dealProjectName ? ` (${dealProjectName})` : ''} på offerten i Fortnox.
          </p>
        </>
      ) : (
        <p className="text-xs text-[#9A9A9A]">
          Affären saknar ett Fortnox-kopplat projekt, så inget kan skrivas på offerten.
        </p>
      )}

      {message && <p className="text-xs text-[#4C9A5A]">{message}</p>}
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
