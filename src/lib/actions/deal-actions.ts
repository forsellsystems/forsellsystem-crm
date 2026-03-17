'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { dealSchema, type DealFormData } from '@/lib/validations'

export async function createDeal(data: DealFormData) {
  const validated = dealSchema.parse(data)
  const supabase = await createClient()

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      quote_number: validated.quote_number || null,
      company_id: validated.company_id,
      contact_id: validated.contact_id || null,
      stage: validated.stage,
      value: validated.value ?? null,
      currency: validated.currency,
      responsible_user_id: validated.responsible_user_id || null,
      reseller_id: validated.reseller_id || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa affär: ${error.message}`)

  // Insert deal_machines
  if (validated.machine_ids && validated.machine_ids.length > 0) {
    const { error: dmError } = await supabase.from('deal_machines').insert(
      validated.machine_ids.map((machineId) => ({
        deal_id: deal.id,
        machine_id: machineId,
      }))
    )
    if (dmError) console.error('Could not add machines to deal:', dmError)
  }

  revalidatePath('/pipeline')
  return deal.id
}

export async function updateDeal(id: string, data: DealFormData) {
  const validated = dealSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('deals')
    .update({
      quote_number: validated.quote_number || null,
      company_id: validated.company_id,
      contact_id: validated.contact_id || null,
      stage: validated.stage,
      value: validated.value ?? null,
      currency: validated.currency,
      responsible_user_id: validated.responsible_user_id || null,
      reseller_id: validated.reseller_id || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera affär: ${error.message}`)

  // Update machines
  if (validated.machine_ids) {
    await supabase.from('deal_machines').delete().eq('deal_id', id)
    if (validated.machine_ids.length > 0) {
      await supabase.from('deal_machines').insert(
        validated.machine_ids.map((machineId) => ({
          deal_id: id,
          machine_id: machineId,
        }))
      )
    }
  }

  revalidatePath(`/pipeline/${id}`)
  revalidatePath('/pipeline')
}

export async function deleteDeal(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('deals').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort affär: ${error.message}`)
  revalidatePath('/pipeline')
}

export async function updateDealStage(
  dealId: string,
  stage: string,
  sortOrder: number
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { stage, sort_order: sortOrder }

  // Set closed_at when moving to a closed stage
  if (stage === 'avslutad_affar' || stage === 'avslutad_ingen_affar') {
    updateData.closed_at = new Date().toISOString()
  } else {
    updateData.closed_at = null
  }

  const { error } = await supabase
    .from('deals')
    .update(updateData)
    .eq('id', dealId)

  if (error) throw new Error(`Kunde inte uppdatera affär: ${error.message}`)
  // No revalidatePath here — kanban uses optimistic updates
}

export async function updateDealSortOrders(
  updates: { id: string; sort_order: number }[]
) {
  const supabase = await createClient()

  // Update each deal's sort_order
  for (const update of updates) {
    const { error } = await supabase
      .from('deals')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)

    if (error) throw new Error(`Kunde inte omsortera: ${error.message}`)
  }
  // No revalidatePath here — kanban uses optimistic updates
}
