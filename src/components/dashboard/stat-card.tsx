import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  accent?: boolean
}

export function StatCard({ title, value, subtitle, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="font-condensed text-[10px] tracking-[0.15em] text-[#6B7672]">
              {title}
            </p>
            <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-[#C4883A]' : 'text-[#1A1F1D]'}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-[11px] text-[#8A9E99]">{subtitle}</p>
            )}
          </div>
          <div className="h-9 w-9 rounded-lg bg-[#50645F]/8 flex items-center justify-center group-hover:bg-[#50645F]/12 transition-colors">
            <Icon className="size-[18px] text-[#50645F]" />
          </div>
        </div>
      </CardContent>
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${accent ? 'bg-[#C4883A]' : 'bg-[#50645F]'} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Card>
  )
}
