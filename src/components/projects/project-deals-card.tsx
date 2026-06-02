'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, X, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { setDealProject } from '@/lib/actions/deal-actions'
import type { ProjectDeal } from '@/lib/queries/deals'

const stageLabel = (key: string) =>
  PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key

export function ProjectDealsCard({
  projectId,
  linkedDeals,
  candidateDeals,
}: {
  projectId: string
  linkedDeals: ProjectDeal[]
  candidateDeals: ProjectDeal[]
}) {
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Company deals not already linked to this project
  const candidates = candidateDeals.filter((d) => d.project_id !== projectId)

  function handleLink() {
    if (!selected) return
    startTransition(async () => {
      await setDealProject(selected, projectId)
      setSelected('')
      setAdding(false)
      router.refresh()
    })
  }

  function handleUnlink(dealId: string) {
    startTransition(async () => {
      await setDealProject(dealId, null)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Affärer</CardTitle>
          {!adding && candidates.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {adding && (
          <div className="flex items-center gap-2 pb-3 mb-1 border-b border-[#B8B8B8]/40">
            <select
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Välj affär att koppla...</option>
              {candidates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.quote_number || 'Affär'}
                  {d.value ? ` · ${formatCurrency(d.value)}` : ''}
                </option>
              ))}
            </select>
            <Button variant="ghost" size="icon-sm" onClick={handleLink} disabled={isPending || !selected}>
              <Plus className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => { setAdding(false); setSelected('') }} disabled={isPending}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        {linkedDeals.length === 0 && !adding ? (
          <p className="text-sm text-[#6B6B6B]">Inga affärer kopplade.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {linkedDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <Link
                  href={`/pipeline/${deal.id}`}
                  className="flex items-center gap-2 min-w-0 hover:underline"
                >
                  <Briefcase className="size-3.5 text-[#6B6B6B] shrink-0" />
                  <span className="text-sm font-medium text-[#656565] truncate">
                    {deal.quote_number || 'Affär'}
                  </span>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {deal.value != null && (
                    <span className="text-sm font-medium">{formatCurrency(deal.value)}</span>
                  )}
                  <Badge variant="outline">{stageLabel(deal.stage)}</Badge>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleUnlink(deal.id)} disabled={isPending}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
