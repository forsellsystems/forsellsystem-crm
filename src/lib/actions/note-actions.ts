'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { noteSchema, type NoteFormData } from '@/lib/validations'
import { getCurrentUserId, logActivity } from '@/lib/actions/activity-actions'
import { createTodo } from '@/lib/actions/todo-actions'

type DbClient = Awaited<ReturnType<typeof createClient>>

/** Resolve a readable label + link for the note's parent entity. */
async function resolveNoteParent(
  supabase: DbClient,
  entityType: string,
  entityId: string
): Promise<{ label: string; href: string }> {
  switch (entityType) {
    case 'company': {
      const { data } = await supabase.from('companies').select('name').eq('id', entityId).single()
      return { label: data?.name ?? 'Kund', href: `/foretag/${entityId}` }
    }
    case 'prospect': {
      const { data } = await supabase
        .from('prospects')
        .select('company_name, prospect_type')
        .eq('id', entityId)
        .single()
      const base = data?.prospect_type === 'reseller' ? '/aterforsaljar-prospekt' : '/prospekt'
      return { label: data?.company_name ?? 'Prospekt', href: `${base}/${entityId}` }
    }
    case 'deal': {
      const { data } = await supabase
        .from('deals')
        .select('quote_number, companies!deals_company_id_fkey(name)')
        .eq('id', entityId)
        .single()
      const companyName = (data?.companies as unknown as { name: string } | null)?.name
      return { label: data?.quote_number || companyName || 'Affär', href: `/pipeline/${entityId}` }
    }
    case 'project': {
      const { data } = await supabase.from('projects').select('name').eq('id', entityId).single()
      return { label: data?.name || 'Projekt', href: `/projekt/${entityId}` }
    }
    default:
      return { label: '', href: '' }
  }
}

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
  project: '/projekt',
}

export async function createNote(
  data: NoteFormData,
  todo?: { content: string; due_date?: string }
) {
  const validated = noteSchema.parse(data)
  const supabase = await createClient()

  const authorId = await getCurrentUserId(supabase)

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      entity_type: validated.entity_type,
      entity_id: validated.entity_id,
      content: validated.content,
      author_user_id: authorId,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte spara anteckning: ${error.message}`)

  // Optional: turn this comment into a to-do (separate "next step" text + due date).
  if (todo?.content?.trim()) {
    const entityType =
      validated.entity_type === 'contact' ? undefined : validated.entity_type
    await createTodo({
      content: todo.content.trim(),
      entity_type: entityType,
      entity_id: entityType ? validated.entity_id : undefined,
      source: 'comment',
      note_id: note.id,
      due_date: todo.due_date,
    })
  }

  const parent = await resolveNoteParent(supabase, validated.entity_type, validated.entity_id)
  await logActivity(supabase, {
    action: 'note_added',
    entity_type: validated.entity_type,
    entity_id: validated.entity_id,
    metadata: {
      label: parent.label,
      href: parent.href,
      snippet: validated.content.slice(0, 80),
    },
  })

  const basePath = entityPathMap[validated.entity_type] ?? ''
  revalidatePath(`${basePath}/${validated.entity_id}`)
}
