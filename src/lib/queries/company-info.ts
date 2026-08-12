import { createClient } from '@/lib/supabase/server'
import type { CompanyInfo } from '@/lib/types/database'

export async function getCompanyInfo(): Promise<CompanyInfo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('company_info')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}
