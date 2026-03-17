'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { machineSchema, type MachineFormData } from '@/lib/validations'

export async function createMachine(data: MachineFormData) {
  const validated = machineSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('machines').insert({
    name: validated.name,
    category: validated.category,
    description: validated.description || null,
  })

  if (error) throw new Error(`Kunde inte skapa maskin: ${error.message}`)
  revalidatePath('/maskiner')
}

export async function updateMachine(id: string, data: MachineFormData) {
  const validated = machineSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machines')
    .update({
      name: validated.name,
      category: validated.category,
      description: validated.description || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera maskin: ${error.message}`)
  revalidatePath('/maskiner')
}

export async function deleteMachine(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('machines').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort maskin: ${error.message}`)
  revalidatePath('/maskiner')
}
