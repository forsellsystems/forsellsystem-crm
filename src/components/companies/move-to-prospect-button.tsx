'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { moveCompanyToProspect } from '@/lib/actions/company-actions'

export function MoveToProspectButton({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      try {
        setError(null)
        const prospectId = await moveCompanyToProspect(companyId)
        router.push(`/prospekt/${prospectId}`)
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
      >
        <ArrowLeft className="size-4" data-icon="inline-start" />
        {isPending ? 'Flyttar...' : 'Flytta till prospekt'}
      </Button>
      {error && <p className="text-xs text-[#8B3D3D] mt-1">{error}</p>}
    </div>
  )
}
