'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { unlinkDealOffer } from '@/lib/actions/fortnox-actions'

/** Inline "Ta bort koppling" on the deal card — removes the Fortnox offer link. */
export function UnlinkOfferButton({ dealId }: { dealId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-[#6B6B6B]"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const res = await unlinkDealOffer(dealId)
            if (!res.ok) setError(res.error)
            else router.refresh()
          })
        }}
      >
        <Link2Off className="size-4" data-icon="inline-start" />
        {isPending ? 'Tar bort...' : 'Ta bort koppling'}
      </Button>
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
