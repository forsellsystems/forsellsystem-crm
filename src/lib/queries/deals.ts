import { createClient } from '@/lib/supabase/server'
import type { DealWithRelations } from '@/lib/types/database'
import { PROJECT_TYPES } from '@/lib/constants'

export type DealCard = {
  id: string
  quote_number: string | null
  quote_date: string | null
  stage: string
  value: number | null
  currency: string
  heat: number | null
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
    .order('heat', { ascending: true, nullsFirst: false })
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
      heat: deal.heat,
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

export type ProjectDeal = {
  id: string
  quote_number: string | null
  stage: string
  value: number | null
  project_id: string | null
}

/** Deals already linked to a given project. */
export async function getProjectDeals(projectId: string): Promise<ProjectDeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('id, quote_number, stage, value, project_id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/** All deals for a company (candidates to link to a project). */
export async function getCompanyDeals(companyId: string): Promise<ProjectDeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('id, quote_number, stage, value, project_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Affärer som går via en agent. En agents egna projekt ska kunna kopplas till
 * dessa: agenten står som reseller_id, kunden som company_id.
 */
export async function getResellerDeals(resellerId: string): Promise<ProjectDeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('id, quote_number, stage, value, project_id')
    .eq('reseller_id', resellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
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
        '*, companies!deals_company_id_fkey(name), contacts!deals_contact_id_fkey(name), users!deals_responsible_user_id_fkey(name), reseller:companies!deals_reseller_id_fkey(name), projects!deals_project_id_fkey(name, project_type, fortnox_project_id)'
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
    project_name: (() => {
      const p = deal.projects as { name: string | null; project_type: string | null } | null
      if (!p) return undefined
      return (
        p.name?.trim() ||
        PROJECT_TYPES.find((t) => t.key === p.project_type)?.label ||
        'Projekt'
      )
    })(),
    // Projektets Fortnox-nummer, för knappen som skriver det på offerten.
    project_fortnox_id:
      (deal.projects as { fortnox_project_id: string | null } | null)?.fortnox_project_id ??
      null,
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

export type DealListRow = {
  id: string
  quote_number: string | null
  quote_date: string | null
  stage: string
  value: number | null
  currency: string
  heat: number | null
  company_name: string
  company_href: string
  project_name: string | null
  project_id: string | null
  reseller_name: string | null
}

/**
 * Alla affärer som en platt lista. Pipeline är tavlan, den här är listan: lättare
 * att skanna och att söka i när man vill se allt på en gång.
 */
export async function getAllDeals(): Promise<DealListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select(
      '*, companies!deals_company_id_fkey(name, is_reseller), reseller:companies!deals_reseller_id_fkey(name), projects!deals_project_id_fkey(name, project_type)'
    )
    .order('heat', { ascending: true, nullsFirst: false })
    .order('quote_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((deal) => {
    const company = deal.companies as { name: string; is_reseller: boolean } | null
    const project = deal.projects as { name: string | null; project_type: string | null } | null
    return {
      id: deal.id,
      quote_number: deal.quote_number,
      quote_date: deal.quote_date,
      stage: deal.stage,
      value: deal.value,
      currency: deal.currency,
      heat: deal.heat,
      company_name: company?.name ?? 'Okänt',
      // Agenter bor på /aterforsaljare, kunder på /foretag.
      company_href: `${company?.is_reseller ? '/aterforsaljare' : '/foretag'}/${deal.company_id}`,
      project_id: deal.project_id,
      project_name: project
        ? project.name?.trim() ||
          PROJECT_TYPES.find((t) => t.key === project.project_type)?.label ||
          'Projekt'
        : null,
      reseller_name: (deal.reseller as { name: string } | null)?.name ?? null,
    }
  })
}
