import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  pipelineValue: number
  activeDeals: number
  avgDealValue: number
  wonDealsCount: number
}

export interface PipelineStageSummary {
  stage: string
  deal_count: number
  total_value: number
}

export interface RecentDeal {
  id: string
  quote_number: string | null
  stage: string
  value: number | null
  currency: string
  company_name: string
  responsible_name: string | null
  updated_at: string
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

export async function getPipelineSummary(): Promise<PipelineStageSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('pipeline_summary').select('*')

  if (error) throw error
  return (data ?? []) as PipelineStageSummary[]
}

export async function getRecentDeals(): Promise<RecentDeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('recent_deals').select('*')

  if (error) throw error

  return (data ?? []).map((d) => ({
    id: d.id,
    quote_number: d.quote_number,
    stage: d.stage,
    value: d.value,
    currency: d.currency,
    company_name: d.company_name,
    responsible_name: d.responsible_name,
    updated_at: d.updated_at,
  }))
}
