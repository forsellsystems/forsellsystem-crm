'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteProspect } from '@/lib/actions/prospect-actions'

export function DeleteProspectButton({ prospectId }: { prospectId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      try {
        setError(null)
        await deleteProspect(prospectId)
        router.push('/prospekt')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel')
      }
    })
  }

  return (
    <div>
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="outline"
        className="text-[#8B3D3D] hover:text-[#8B3D3D] hover:bg-[#8B3D3D]/10"
      >
        <Trash2 className="size-4" data-icon="inline-start" />
        {isPending ? 'Raderar...' : 'Radera'}
      </Button>
      {error && <p className="text-xs text-[#8B3D3D] mt-1">{error}</p>}
    </div>
  )
}
