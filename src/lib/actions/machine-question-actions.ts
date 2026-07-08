'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { machineQuestionSchema, type MachineQuestionFormData } from '@/lib/validations'

function revalidate(machineId: string) {
  revalidatePath(`/maskiner/${machineId}`)
}

// Empty tema/note stored as NULL (not '').
function rowFrom(v: MachineQuestionFormData) {
  return {
    question: v.question,
    category: v.category && v.category.trim() !== '' ? v.category : null,
    note: v.note && v.note.trim() !== '' ? v.note.trim() : null,
  }
}

export async function createQuestion(machineId: string, data: MachineQuestionFormData) {
  const validated = machineQuestionSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machine_questions')
    .insert({ machine_id: machineId, ...rowFrom(validated) })
  if (error) throw new Error(`Kunde inte lägga till fråga: ${error.message}`)

  revalidate(machineId)
}

export async function updateQuestion(
  id: string,
  machineId: string,
  data: MachineQuestionFormData
) {
  const validated = machineQuestionSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('machine_questions')
    .update({ ...rowFrom(validated), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera fråga: ${error.message}`)

  revalidate(machineId)
}

export async function deleteQuestion(id: string, machineId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('machine_questions').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort fråga: ${error.message}`)

  revalidate(machineId)
}
