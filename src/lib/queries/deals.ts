import { createClient } from '@/lib/supabase/server'
import type { Deal, DealWithRelations } from '@/lib/types/database'

export type DealCard = {
  id: string
  quote_number: string | null
  quote_date: string | null
  stage: string
  value: number | null
  currency: string
  sort_order: number
  company_id: string
  company_name: string
  contact_name: string | null
  responsible_name: string | null
  reseller_name: string | null
}

export async function getDealsByStage(): Promise<Record<string, DealCard[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select(
      '*, companies!deals_company_id_fkey(name), contacts!deals_contact_id_fkey(name), users!deals_responsible_user_id_fkey(name), reseller:companies!deals_reseller_id_fkey(name)'
    )
    .order('quote_date', { ascending: false, nullsFirst: false })
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (error) throw error

  const grouped: Record<string, DealCard[]> = {}

  for (const deal of data ?? []) {
    const card: DealCard = {
      id: deal.id,
      quote_number: deal.quote_number,
      quote_date: deal.quote_date,
      stage: deal.stage,
      value: deal.value,
      currency: deal.currency,
      sort_order: deal.sort_order,
      company_id: deal.company_id,
      company_name:
        (deal.companies as { name: string } | null)?.name ?? 'Okänt företag',
      contact_name:
        (deal.contacts as { name: string } | null)?.name ?? null,
      responsible_name:
        (deal.users as { name: string } | null)?.name ?? null,
      reseller_name:
        (deal.reseller as { name: string } | null)?.name ?? null,
    }
    if (!grouped[deal.stage]) grouped[deal.stage] = []
    grouped[deal.stage].push(card)
  }

  return grouped
}

export async function getDeal(id: string): Promise<
  | (DealWithRelations & {
      machines: { id: string; name: string; category: string; quantity: number }[]
    })
  | null
> {
  const supabase = await createClient()

  const [dealRes, machinesRes] = await Promise.all([
    supabase
      .from('deals')
      .select(
        '*, companies!deals_company_id_fkey(name), contacts!deals_contact_id_fkey(name), users!deals_responsible_user_id_fkey(name), reseller:companies!deals_reseller_id_fkey(name)'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('deal_machines')
      .select('quantity, machines!deal_machines_machine_id_fkey(id, name, category)')
      .eq('deal_id', id),
  ])

  if (dealRes.error) return null

  const deal = dealRes.data
  return {
    ...deal,
    company_name:
      (deal.companies as { name: string } | null)?.name ?? undefined,
    contact_name:
      (deal.contacts as { name: string } | null)?.name ?? undefined,
    responsible_name:
      (deal.users as { name: string } | null)?.name ?? undefined,
    reseller_name:
      (deal.reseller as { name: string } | null)?.name ?? undefined,
    machines: (machinesRes.data ?? []).map((dm) => {
      const m = dm.machines as unknown as { id: string; name: string; category: string } | null
      return {
        id: m?.id ?? '',
        name: m?.name ?? '',
        category: m?.category ?? '',
        quantity: dm.quantity,
      }
    }),
  } as DealWithRelations & {
    machines: { id: string; name: string; category: string; quantity: number }[]
  }
}
