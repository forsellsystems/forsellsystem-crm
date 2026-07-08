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
    currency: validated.currency,
  })

  if (error) throw new Error(`Kunde inte skapa maskin: ${error.message}`)
  revalidatePath('/maskiner')
}

export async function updateMachine(id: string, data: MachineFormData) {
  const validated = machineSchema.parse(data)
  const supabase = await createClient()

  const hasComponents = validated.has_components ?? false

  const update: Record<string, unknown> = {
    name: validated.name,
    category: validated.category,
    description: validated.description || null,
    currency: validated.currency,
    has_components: hasComponents,
    updated_at: new Date().toISOString(),
  }

  if (hasComponents) {
    // Component-based: price = summed component range (so switching modes reflects
    // the components immediately). The component actions keep it in sync after.
    const { data: comps } = await supabase
      .from('machine_components')
      .select('price_min, price_max, quantity')
      .eq('machine_id', id)
    const rows = comps ?? []
    update.price_min = rows.reduce((s, c) => s + (Number(c.price_min) || 0) * (Number(c.quantity) || 1), 0)
    update.price_max = rows.reduce((s, c) => s + (Number(c.price_max ?? c.price_min) || 0) * (Number(c.quantity) || 1), 0)
  } else {
    // Direct price range on the machine.
    const min = validated.price_min ?? 0
    update.price_min = min
    update.price_max = validated.price_max != null && validated.price_max !== min ? validated.price_max : null
  }

  const { error } = await supabase.from('machines').update(update).eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera maskin: ${error.message}`)
  revalidatePath(`/maskiner/${id}`)
  revalidatePath('/maskiner')
}

export async function deleteMachine(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('machines').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort maskin: ${error.message}`)
  revalidatePath('/maskiner')
}
