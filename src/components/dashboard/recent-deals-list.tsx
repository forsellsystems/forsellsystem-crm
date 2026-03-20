import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import type { RecentDeal } from '@/lib/queries/dashboard'

interface RecentDealsListProps {
  deals: RecentDeal[]
}

export function RecentDealsList({ deals }: RecentDealsListProps) {
  const getStage = (key: string) =>
    PIPELINE_STAGES.find((s) => s.key === key)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Senaste affärer</CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] text-center py-6">
            Inga affärer ännu.
          </p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {deals.map((deal) => {
              const stage = getStage(deal.stage)
              return (
                <Link
                  key={deal.id}
                  href={`/pipeline/${deal.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {deal.company_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                      {deal.quote_number && <span>#{deal.quote_number}</span>}
                      <span>{formatRelativeTime(deal.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {deal.value && (
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {formatCurrency(deal.value)}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: stage?.color,
                        color: stage?.color,
                      }}
                    >
                      {stage?.label ?? deal.stage}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
