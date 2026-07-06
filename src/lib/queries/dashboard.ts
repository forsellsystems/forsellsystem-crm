import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  pipelineValue: number
  activeDeals: number
  avgDealValue: number
  wonDealsCount: number
}

export interface RecentDeal {
  id: string
  quote_number: string | null
  stage: string
  value: number | null
  currency: string
  company_name: string
  responsible_name: string | null
  created_at: string
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

export async function getRecentDeals(): Promise<RecentDeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select(
      'id, quote_number, stage, value, currency, created_at, companies!deals_company_id_fkey(name), users!deals_responsible_user_id_fkey(name)'
    )
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error

  return (data ?? []).map((d) => ({
    id: d.id,
    quote_number: d.quote_number,
    stage: d.stage,
    value: d.value,
    currency: d.currency,
    company_name:
      (d.companies as unknown as { name: string } | null)?.name ?? 'Okänt företag',
    responsible_name:
      (d.users as unknown as { name: string } | null)?.name ?? null,
    created_at: d.created_at,
  }))
}
