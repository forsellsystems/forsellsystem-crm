'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { machineComponentSchema, type MachineComponentFormData } from '@/lib/validations'

type DbClient = Awaited<ReturnType<typeof createClient>>

// The machine's price is the range summed from its components (price × quantity).
// Cache both bounds back onto the machine whenever the component list changes.
async function recomputeMachinePrice(supabase: DbClient, machineId: string) {
  const { data } = await supabase
    .from('machine_components')
    .select('price_min, price_max, quantity')
    .eq('machine_id', machineId)
  const rows = data ?? []
  const priceMin = rows.reduce((s, c) => s + (Number(c.price_min) || 0) * (Number(c.quantity) || 1), 0)
  const priceMax = rows.reduce(
    (s, c) => s + (Number(c.price_max ?? c.price_min) || 0) * (Number(c.quantity) || 1),
    0
  )
  await supabase
    .from('machines')
    .update({ price_min: priceMin, price_max: priceMax, updated_at: new Date().toISOString() })
    .eq('id', machineId)
}

function revalidate(machineId: string) {
  revalidatePath(`/maskiner/${machineId}`)
  revalidatePath('/maskiner')
}

// price_max is only stored when it differs from price_min (a real range).
function rowFrom(v: MachineComponentFormData) {
  return {
    name: v.name,
    price_min: v.price_min,
    price_max: v.price_max != null && v.price_max !== v.price_min ? v.price_max : null,
    quantity: v.quantity,
  }
}

export async function createComponent(machineId: string, data: MachineComponentFormData) {
  const validated = machineComponentSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machine_components')
    .insert({ machine_id: machineId, ...rowFrom(validated) })
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
    .update({ ...rowFrom(validated), updated_at: new Date().toISOString() })
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
