import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  pipelineValue: number
  activeDeals: number
  avgDealValue: number
  wonDealsCount: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const [activeRes, wonRes] = await Promise.all([
    supabase
      .from('deals')
      .select('value')
      .not('stage', 'in', '("avslutad_affar","avslutad_ingen_affar")'),
    supabase.from('deals').select('value').eq('stage', 'avslutad_affar'),
  ])

  const activeDeals = activeRes.data ?? []
  const wonDeals = wonRes.data ?? []

  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + (d.value ?? 0),
    0
  )
  const wonValues = wonDeals
    .map((d) => d.value)
    .filter((v): v is number => v != null)
  const avgDealValue =
    wonValues.length > 0
      ? wonValues.reduce((sum, v) => sum + v, 0) / wonValues.length
      : 0

  return {
    pipelineValue,
    activeDeals: activeDeals.length,
    avgDealValue,
    wonDealsCount: wonDeals.length,
  }
}
