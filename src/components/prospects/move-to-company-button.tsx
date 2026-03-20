'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { moveProspectToCompany } from '@/lib/actions/prospect-actions'

export function MoveToCompanyButton({ prospectId }: { prospectId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      try {
        setError(null)
        const companyId = await moveProspectToCompany(prospectId)
        router.push(`/foretag/${companyId}`)
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
        className="bg-[#F2BB01] hover:bg-[#B07830] text-white"
      >
        <ArrowRight className="size-4" data-icon="inline-start" />
        {isPending ? 'Flyttar...' : 'Flytta till kund'}
      </Button>
      {error && <p className="text-xs text-[#8B3D3D] mt-1">{error}</p>}
    </div>
  )
}
