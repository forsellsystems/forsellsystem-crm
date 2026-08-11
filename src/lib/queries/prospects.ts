import { createClient } from '@/lib/supabase/server'
import type { Prospect } from '@/lib/types/database'

export async function getProspects(filters?: {
  status?: string
  factory_type?: string
  search?: string
  prospect_type?: 'customer' | 'reseller'
}): Promise<Prospect[]> {
  const supabase = await createClient()
  let query = supabase.from('prospects').select('*').order('created_at', { ascending: false })

  if (filters?.prospect_type) {
    query = query.eq('prospect_type', filters.prospect_type)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.factory_type && filters.factory_type !== 'all') {
    query = query.eq('factory_type', filters.factory_type)
  }
  if (filters?.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getCustomerProspectsForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('id, company_name')
    .eq('prospect_type', 'customer')
    .eq('status', 'active')
    .order('company_name')

  if (error) throw error
  return (data ?? []).map((p) => ({ id: p.id, name: p.company_name }))
}

export async function getResellerProspectsForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('id, company_name')
    .eq('prospect_type', 'reseller')
    .eq('status', 'active')
    .order('company_name')

  if (error) throw error
  return (data ?? []).map((p) => ({ id: p.id, name: p.company_name }))
}

/** Offertnummer på prospektets affärer — visar Fortnox-koppling på prospektkortet. */
export async function getProspectFortnoxOffers(prospectId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('fortnox_offer_documentnumber')
    .eq('prospect_id', prospectId)
    .not('fortnox_offer_documentnumber', 'is', null)

  if (error) return []
  return (data ?? [])
    .map((d) => d.fortnox_offer_documentnumber as string | null)
    .filter((n): n is string => Boolean(n))
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
