import { createClient } from '@/lib/supabase/server'
import type { Machine } from '@/lib/types/database'

export async function getMachines(): Promise<Machine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('category')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getMachine(id: string): Promise<Machine | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
