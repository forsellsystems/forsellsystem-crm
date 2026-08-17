'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProjectSpecValueType } from '@/lib/constants'

// Aktuella produkter och förutsättningar på ett projekt. Båda hör till
// utredningen före en affär: vad kunden behöver, och vad vi vet om deras mått.

function revalidate(projectId: string) {
  revalidatePath(`/projekt/${projectId}`)
}

const trimmed = (v?: string | null) => (v && v.trim() !== '' ? v.trim() : null)

// ============================================
// AKTUELLA PRODUKTER
// ============================================

export async function addProjectMachine(projectId: string, machineId: string) {
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('project_machines')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const { error } = await supabase.from('project_machines').insert({
    project_id: projectId,
    machine_id: machineId,
    sort_order: (last?.[0]?.sort_order ?? -1) + 1,
  })
  // Unikt index på (project_id, machine_id): samma produkt två gånger är inget fel
  // värt ett felmeddelande, den ligger redan där.
  if (error && error.code !== '23505') {
    throw new Error(`Kunde inte lägga till produkt: ${error.message}`)
  }
  revalidate(projectId)
}

export async function updateProjectMachineNote(
  id: string,
  projectId: string,
  note: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_machines')
    .update({ note: trimmed(note), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte spara noteringen: ${error.message}`)
  revalidate(projectId)
}

export async function removeProjectMachine(id: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('project_machines').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort produkten: ${error.message}`)
  revalidate(projectId)
}

// ============================================
// FÖRUTSÄTTNINGAR
// ============================================

export type ProjectSpecInput = {
  spec_key?: string | null
  label?: string | null
  value_type: ProjectSpecValueType
  value_min?: number | null
  value_max?: number | null
  unit?: string | null
  value_text?: string | null
  note?: string | null
  // Vilka av projektets produkter förutsättningen gäller. Tom = ingen.
  project_machine_ids?: string[]
}

// Värden sparas bara för den typ de hör till. Annars ligger ett gammalt mått
// kvar bakom "Ej utredd" och läses som en uppgift nästa gång någon tittar.
function rowFrom(v: ProjectSpecInput) {
  const isValue = v.value_type === 'value'
  const isText = v.value_type === 'text'
  return {
    spec_key: trimmed(v.spec_key),
    label: trimmed(v.label),
    value_type: v.value_type,
    value_min: isValue && v.value_min != null ? v.value_min : null,
    value_max: isValue && v.value_max != null ? v.value_max : null,
    unit: isValue ? trimmed(v.unit) : null,
    value_text: isText ? trimmed(v.value_text) : null,
    note: trimmed(v.note),
  }
}

/** Sätter om taggarna till exakt den lista som skickas in. */
async function syncSpecMachines(
  supabase: Awaited<ReturnType<typeof createClient>>,
  specId: string,
  machineIds: string[] | undefined
) {
  await supabase.from('project_spec_machines').delete().eq('project_spec_id', specId)
  const ids = [...new Set(machineIds ?? [])]
  if (ids.length === 0) return
  await supabase
    .from('project_spec_machines')
    .insert(ids.map((id) => ({ project_spec_id: specId, project_machine_id: id })))
}

export async function createProjectSpec(projectId: string, data: ProjectSpecInput) {
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('project_specs')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const { data: created, error } = await supabase
    .from('project_specs')
    .insert({
      project_id: projectId,
      ...rowFrom(data),
      sort_order: (last?.[0]?.sort_order ?? -1) + 1,
    })
    .select('id')
    .single()
  if (error) throw new Error(`Kunde inte lägga till uppgift: ${error.message}`)

  await syncSpecMachines(supabase, created.id, data.project_machine_ids)
  revalidate(projectId)
}

export async function updateProjectSpec(
  id: string,
  projectId: string,
  data: ProjectSpecInput
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_specs')
    .update({ ...rowFrom(data), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera uppgift: ${error.message}`)

  await syncSpecMachines(supabase, id, data.project_machine_ids)
  revalidate(projectId)
}

export async function deleteProjectSpec(id: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('project_specs').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort uppgift: ${error.message}`)
  revalidate(projectId)
}

/** Fritexten under förutsättningarna, för det som inte passar i ett fält. */
export async function updateProjectConditionsNote(projectId: string, note: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ conditions_note: trimmed(note), updated_at: new Date().toISOString() })
    .eq('id', projectId)
  if (error) throw new Error(`Kunde inte spara texten: ${error.message}`)
  revalidate(projectId)
}
