import { Skeleton } from '@/components/ui/skeleton'

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-52 mt-2" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[280px]">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2 p-2 rounded-lg bg-[#F2F2F0]/50 min-h-[200px]">
              {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
