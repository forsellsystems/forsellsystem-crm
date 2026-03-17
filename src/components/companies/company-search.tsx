'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function CompanySearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      router.push(`/foretag?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#6B7672]" />
      <Input
        placeholder="Sök företag eller kundnummer..."
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => updateSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
