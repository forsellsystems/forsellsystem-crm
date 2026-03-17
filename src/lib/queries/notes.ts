import { createClient } from '@/lib/supabase/server'
import type { Note } from '@/lib/types/database'

export type NoteWithAuthor = Note & {
  author_name: string | null
}

export async function getNotes(
  entityType: string,
  entityId: string
): Promise<NoteWithAuthor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, users!notes_author_user_id_fkey(name)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((note) => ({
    ...note,
    author_name: (note.users as { name: string } | null)?.name ?? null,
    users: undefined,
  })) as NoteWithAuthor[]
}
