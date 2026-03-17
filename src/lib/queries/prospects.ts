import { createClient } from '@/lib/supabase/server'
import type { Prospect } from '@/lib/types/database'

export async function getProspects(filters?: {
  status?: string
  factory_type?: string
  search?: string
}): Promise<Prospect[]> {
  const supabase = await createClient()
  let query = supabase.from('prospects').select('*').order('created_at', { ascending: false })

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
