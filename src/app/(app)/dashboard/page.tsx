import { TrendingUp, Kanban, BarChart3, Trophy } from 'lucide-react'
import {
  getDashboardStats,
  getPipelineSummary,
  getRecentDeals,
} from '@/lib/queries/dashboard'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/dashboard/stat-card'
import { PipelineChart } from '@/components/dashboard/pipeline-chart'
import { RecentDealsList } from '@/components/dashboard/recent-deals-list'

export default async function DashboardPage() {
  const [stats, pipelineSummary, recentDeals] = await Promise.all([
    getDashboardStats(),
    getPipelineSummary(),
    getRecentDeals(),
  ])

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page heading with display font */}
      <div>
        <h2 className="font-display text-3xl text-[#1A1F1D]">Dashboard</h2>
        <p className="text-sm text-[#6B7672] mt-1">
          Överblick över försäljningen
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          title="Pipelinevärde"
          value={formatCurrency(stats.pipelineValue)}
          subtitle="Totalt värde aktiva affärer"
          icon={TrendingUp}
          accent
        />
        <StatCard
          title="Aktiva affärer"
          value={String(stats.activeDeals)}
          subtitle="Affärer i pipeline"
          icon={Kanban}
        />
        <StatCard
          title="Snittordervärde"
          value={
            stats.avgDealValue > 0 ? formatCurrency(stats.avgDealValue) : '—'
          }
          subtitle="Medelvärde vunna affärer"
          icon={BarChart3}
        />
        <StatCard
          title="Vunna affärer"
          value={String(stats.wonDealsCount)}
          subtitle="Avslutade med affär"
          icon={Trophy}
        />
      </div>

      {/* Charts & Lists */}
      <div className="grid gap-6 lg:grid-cols-2 stagger-children">
        <PipelineChart data={pipelineSummary} />
        <RecentDealsList deals={recentDeals} />
      </div>
    </div>
  )
}
