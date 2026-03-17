'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeReseller } from '@/lib/actions/reseller-actions'

export function RemoveResellerButton({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    try {
      await removeReseller(companyId)
    } catch {
      // revalidation handles state
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleRemove}
      disabled={loading}
      title="Ta bort som återförsäljare"
    >
      <X className="size-3.5 text-[#8B3D3D]" />
    </Button>
  )
}
