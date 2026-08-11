'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { machineFeatureSchema, type MachineFeatureFormData } from '@/lib/validations'

function revalidate(machineId: string) {
  revalidatePath(`/maskiner/${machineId}`)
}

// Tom engelsk text lagras som NULL (inte '').
function rowFrom(v: MachineFeatureFormData) {
  return {
    name: v.name.trim(),
    name_en: v.name_en && v.name_en.trim() !== '' ? v.name_en.trim() : null,
  }
}

export async function createFeature(machineId: string, data: MachineFeatureFormData) {
  const validated = machineFeatureSchema.parse(data)
  const supabase = await createClient()

  // Nya features hamnar sist i listan.
  const { data: last } = await supabase
    .from('machine_features')
    .select('sort_order')
    .eq('machine_id', machineId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('machine_features')
    .insert({
      machine_id: machineId,
      sort_order: (last?.sort_order ?? -1) + 1,
      ...rowFrom(validated),
    })
  if (error) throw new Error(`Kunde inte lägga till feature: ${error.message}`)

  revalidate(machineId)
}

export async function updateFeature(
  id: string,
  machineId: string,
  data: MachineFeatureFormData
) {
  const validated = machineFeatureSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machine_features')
    .update({ ...rowFrom(validated), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera feature: ${error.message}`)

  revalidate(machineId)
}

export async function deleteFeature(id: string, machineId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('machine_features').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort feature: ${error.message}`)

  revalidate(machineId)
}

// Flyttar en feature ett steg upp/ner genom att byta sort_order med grannen.
export async function moveFeature(id: string, machineId: string, direction: 'up' | 'down') {
  const supabase = await createClient()

  const { data: rows, error: listError } = await supabase
    .from('machine_features')
    .select('id, sort_order')
    .eq('machine_id', machineId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (listError) throw new Error(`Kunde inte flytta feature: ${listError.message}`)

  const list = rows ?? []
  const index = list.findIndex((f) => f.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= list.length) return

  // Skriv om hela listan efter bytet — robust även om sort_order råkat bli lika.
  const reordered = [...list]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  for (const [i, row] of reordered.entries()) {
    const { error } = await supabase
      .from('machine_features')
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) throw new Error(`Kunde inte flytta feature: ${error.message}`)
  }

  revalidate(machineId)
}
