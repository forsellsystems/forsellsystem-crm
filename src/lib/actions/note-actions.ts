'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { noteSchema, type NoteFormData } from '@/lib/validations'

export async function deleteNote(noteId: string, entityType: string, entityId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) throw new Error(`Kunde inte ta bort anteckning: ${error.message}`)

  const basePath = entityPathMap[entityType] ?? ''
  revalidatePath(`${basePath}/${entityId}`)
}

const entityPathMap: Record<string, string> = {
  prospect: '/prospekt',
  company: '/foretag',
  deal: '/pipeline',
  contact: '/foretag',
}

export async function createNote(data: NoteFormData) {
  const validated = noteSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('notes').insert({
    entity_type: validated.entity_type,
    entity_id: validated.entity_id,
    content: validated.content,
    author_user_id: null, // TODO: set from auth when implemented
  })

  if (error) throw new Error(`Kunde inte spara anteckning: ${error.message}`)

  const basePath = entityPathMap[validated.entity_type] ?? ''
  revalidatePath(`${basePath}/${validated.entity_id}`)
}
