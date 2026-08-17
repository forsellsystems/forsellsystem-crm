import { createClient } from '@/lib/supabase/server'
import type { Prospect } from '@/lib/types/database'

/** Prospekt plus namnet på dess primära kontakt, för listorna. */
export type ProspectWithContact = Prospect & { primary_contact: string | null }

export async function getProspects(filters?: {
  status?: string
  factory_type?: string
  search?: string
  prospect_type?: 'customer' | 'reseller'
}): Promise<ProspectWithContact[]> {
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
      `company_name.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  const prospects = data ?? []
  if (prospects.length === 0) return []

  // Kontaktpersonen är numera en riktig kontaktpost. Listan visar den primära.
  const { data: contacts } = await supabase
    .from('contacts')
    .select('prospect_id, name, is_primary')
    .in('prospect_id', prospects.map((p) => p.id))
    .order('is_primary', { ascending: false })
    .order('name')

  const byProspect = new Map<string, string>()
  for (const c of contacts ?? []) {
    if (c.prospect_id && !byProspect.has(c.prospect_id)) byProspect.set(c.prospect_id, c.name)
  }

  return prospects.map((p) => ({ ...p, primary_contact: byProspect.get(p.id) ?? null }))
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
