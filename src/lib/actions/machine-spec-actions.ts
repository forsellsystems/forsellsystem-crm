'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { machineSpecSchema, type MachineSpecFormData } from '@/lib/validations'

function revalidate(machineId: string) {
  revalidatePath(`/maskiner/${machineId}`)
}

const trimmed = (v?: string) => (v && v.trim() !== '' ? v.trim() : null)

// Siffervärden sparas bara för value_type 'value', fritext bara för 'text'.
// Annars skulle ett gammalt värde ligga kvar och läsas som en uppgift.
function rowFrom(v: MachineSpecFormData) {
  const isValue = v.value_type === 'value'
  const isText = v.value_type === 'text'
  return {
    spec_key: trimmed(v.spec_key),
    label: trimmed(v.label),
    label_en: trimmed(v.label_en),
    object_type: v.object_type,
    value_type: v.value_type,
    value_min: isValue && v.value_min != null ? v.value_min : null,
    value_max: isValue && v.value_max != null ? v.value_max : null,
    unit: isValue ? trimmed(v.unit) : null,
    value_text: isText ? trimmed(v.value_text) : null,
    value_text_en: isText ? trimmed(v.value_text_en) : null,
    note: trimmed(v.note),
    note_en: trimmed(v.note_en),
  }
}

export async function createSpec(machineId: string, data: MachineSpecFormData) {
  const validated = machineSpecSchema.parse(data)
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('machine_specs')
    .select('sort_order')
    .eq('machine_id', machineId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('machine_specs').insert({
    machine_id: machineId,
    sort_order: (last?.sort_order ?? -1) + 1,
    ...rowFrom(validated),
  })
  if (error) throw new Error(`Kunde inte lägga till uppgift: ${error.message}`)

  revalidate(machineId)
}

export async function updateSpec(id: string, machineId: string, data: MachineSpecFormData) {
  const validated = machineSpecSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machine_specs')
    .update({ ...rowFrom(validated), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera uppgift: ${error.message}`)

  revalidate(machineId)
}

export async function deleteSpec(id: string, machineId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('machine_specs').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort uppgift: ${error.message}`)

  revalidate(machineId)
}

// Byter plats på en rad och dess granne, och skriver om hela listans sort_order
// så ordningen håller även om värden råkat bli lika.
export async function moveSpec(id: string, machineId: string, direction: 'up' | 'down') {
  const supabase = await createClient()

  const { data: rows, error: listError } = await supabase
    .from('machine_specs')
    .select('id, sort_order')
    .eq('machine_id', machineId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (listError) throw new Error(`Kunde inte flytta uppgift: ${listError.message}`)

  const list = rows ?? []
  const index = list.findIndex((s) => s.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= list.length) return

  const reordered = [...list]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  for (const [i, row] of reordered.entries()) {
    const { error } = await supabase
      .from('machine_specs')
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) throw new Error(`Kunde inte flytta uppgift: ${error.message}`)
  }

  revalidate(machineId)
}
