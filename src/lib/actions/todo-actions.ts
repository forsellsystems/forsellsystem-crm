'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todoSchema, type TodoFormData } from '@/lib/validations'

type DbClient = Awaited<ReturnType<typeof createClient>>

function revalidateTodo(meetingId?: string | null) {
  revalidatePath('/todo')
  if (meetingId) revalidatePath(`/moten/${meetingId}`)
}

async function meetingIdFor(supabase: DbClient, id: string): Promise<string | null> {
  const { data } = await supabase.from('todos').select('meeting_id').eq('id', id).single()
  return data?.meeting_id ?? null
}

export async function createTodo(data: TodoFormData): Promise<string> {
  const validated = todoSchema.parse(data)
  const supabase = await createClient()

  let entity_type: string | null = validated.entity_type ?? null
  let entity_id: string | null = validated.entity_id ?? null

  // Meeting to-dos inherit their entity (bolag) from the meeting.
  if (validated.meeting_id && (!entity_type || !entity_id)) {
    const { data: m } = await supabase
      .from('meetings')
      .select('entity_type, entity_id')
      .eq('id', validated.meeting_id)
      .single()
    if (m) {
      entity_type = m.entity_type
      entity_id = m.entity_id
    }
  }

  // Append to the end of the meeting's checklist (meeting to-dos only).
  let nextOrder = 0
  if (validated.meeting_id) {
    const { data: last } = await supabase
      .from('todos')
      .select('sort_order')
      .eq('meeting_id', validated.meeting_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    nextOrder = (last?.sort_order ?? -1) + 1
  }

  const { data: todo, error } = await supabase
    .from('todos')
    .insert({
      content: validated.content,
      entity_type,
      entity_id,
      source: validated.source ?? 'manual',
      note_id: validated.note_id ?? null,
      meeting_id: validated.meeting_id ?? null,
      due_date: validated.due_date || null,
      sort_order: nextOrder,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa to-do: ${error.message}`)
  revalidateTodo(validated.meeting_id)
  return todo.id
}

export async function toggleTodo(id: string, done: boolean) {
  const supabase = await createClient()
  const meetingId = await meetingIdFor(supabase, id)
  const { error } = await supabase
    .from('todos')
    .update({ done, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera to-do: ${error.message}`)
  revalidateTodo(meetingId)
}

export async function updateTodo(
  id: string,
  fields: { content?: string; due_date?: string | null }
) {
  const supabase = await createClient()
  const meetingId = await meetingIdFor(supabase, id)
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.content !== undefined) update.content = fields.content
  if (fields.due_date !== undefined) update.due_date = fields.due_date || null
  const { error } = await supabase.from('todos').update(update).eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera to-do: ${error.message}`)
  revalidateTodo(meetingId)
}

export async function deleteTodo(id: string) {
  const supabase = await createClient()
  const meetingId = await meetingIdFor(supabase, id)
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort to-do: ${error.message}`)
  revalidateTodo(meetingId)
}
