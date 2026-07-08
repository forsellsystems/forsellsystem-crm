'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { machineComponentSchema, type MachineComponentFormData } from '@/lib/validations'

type DbClient = Awaited<ReturnType<typeof createClient>>

// The machine's price is the sum of its components — cache it back onto the
// machine row whenever the component list changes.
async function recomputeMachinePrice(supabase: DbClient, machineId: string) {
  const { data } = await supabase
    .from('machine_components')
    .select('price')
    .eq('machine_id', machineId)
  const sum = (data ?? []).reduce((s, c) => s + (Number(c.price) || 0), 0)
  await supabase
    .from('machines')
    .update({ price: sum, updated_at: new Date().toISOString() })
    .eq('id', machineId)
}

function revalidate(machineId: string) {
  revalidatePath(`/maskiner/${machineId}`)
  revalidatePath('/maskiner')
}

export async function createComponent(machineId: string, data: MachineComponentFormData) {
  const validated = machineComponentSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('machine_components').insert({
    machine_id: machineId,
    name: validated.name,
    price: validated.price,
  })
  if (error) throw new Error(`Kunde inte lägga till komponent: ${error.message}`)

  await recomputeMachinePrice(supabase, machineId)
  revalidate(machineId)
}

export async function updateComponent(
  id: string,
  machineId: string,
  data: MachineComponentFormData
) {
  const validated = machineComponentSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machine_components')
    .update({ name: validated.name, price: validated.price, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera komponent: ${error.message}`)

  await recomputeMachinePrice(supabase, machineId)
  revalidate(machineId)
}

export async function deleteComponent(id: string, machineId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('machine_components').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort komponent: ${error.message}`)

  await recomputeMachinePrice(supabase, machineId)
  revalidate(machineId)
}
