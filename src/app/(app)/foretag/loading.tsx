import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function ForetagLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#B8B8B8]/40 last:border-0">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
