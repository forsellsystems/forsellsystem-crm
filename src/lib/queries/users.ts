import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types/database'

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getActiveUsers(): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
