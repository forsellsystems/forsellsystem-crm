'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { FACTORY_TYPES } from '@/lib/constants'
import { Search } from 'lucide-react'

export function ProspectFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/prospekt?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#6B7672]" />
        <Input
          placeholder="Sök företag eller kontakt..."
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-9"
        />
      </div>

      <select
        className="flex h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
        defaultValue={searchParams.get('factory_type') ?? 'all'}
        onChange={(e) => updateFilter('factory_type', e.target.value)}
      >
        <option value="all">Alla fabrikstyper</option>
        {FACTORY_TYPES.map((ft) => (
          <option key={ft.key} value={ft.key}>
            {ft.label}
          </option>
        ))}
      </select>

      <select
        className="flex h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
        defaultValue={searchParams.get('status') ?? 'all'}
        onChange={(e) => updateFilter('status', e.target.value)}
      >
        <option value="all">Alla statusar</option>
        <option value="active">Aktiva</option>
        <option value="converted">Konverterade</option>
        <option value="archived">Arkiverade</option>
      </select>
    </div>
  )
}
