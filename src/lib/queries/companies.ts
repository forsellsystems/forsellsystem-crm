import { createClient } from '@/lib/supabase/server'
import type { Company, CompanyWithRelations, Contact, Deal } from '@/lib/types/database'

export async function getCompanies(filters?: {
  search?: string
}): Promise<(Company & { responsible_name: string | null })[]> {
  const supabase = await createClient()
  let query = supabase
    .from('companies')
    .select('*, users!companies_responsible_user_id_fkey(name)')
    .eq('is_reseller', false)
    .order('name')

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,customer_number.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((company) => ({
    ...company,
    responsible_name: (company.users as { name: string } | null)?.name ?? null,
    users: undefined,
  })) as (Company & { responsible_name: string | null })[]
}

export async function getCompany(id: string): Promise<CompanyWithRelations | null> {
  const supabase = await createClient()

  const [companyRes, contactsRes, dealsRes] = await Promise.all([
    supabase
      .from('companies')
      .select('*, users!companies_responsible_user_id_fkey(name)')
      .eq('id', id)
      .single(),
    supabase
      .from('contacts')
      .select('*')
      .eq('company_id', id)
      .order('is_primary', { ascending: false })
      .order('name'),
    supabase
      .from('deals')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (companyRes.error) return null

  const company = companyRes.data

  // Fetch reseller name separately (self-join not supported via PostgREST)
  let resellerName: string | null = null
  if (company.reseller_id) {
    const { data: resellerData } = await supabase
      .from('companies')
      .select('name')
      .eq('id', company.reseller_id)
      .single()
    resellerName = resellerData?.name ?? null
  }

  return {
    ...company,
    responsible_name: (company.users as { name: string } | null)?.name ?? null,
    reseller_name: resellerName,
    contacts: (contactsRes.data ?? []) as Contact[],
    deals: (dealsRes.data ?? []) as Deal[],
  } as CompanyWithRelations
}

export async function getResellers(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_reseller', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getCompaniesForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .order('name')

  if (error) throw error
  return data ?? []
}
