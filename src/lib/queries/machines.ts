import { createClient } from '@/lib/supabase/server'
import type { Machine, MachineComponent } from '@/lib/types/database'

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

export async function getMachineComponents(machineId: string): Promise<MachineComponent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machine_components')
    .select('*')
    .eq('machine_id', machineId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}
