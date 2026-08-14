import { createClient } from '@/lib/supabase/server'
import { PROJECT_TYPES } from '@/lib/constants'
import type { Note } from '@/lib/types/database'

export type NoteWithAuthor = Note & {
  author_name: string | null
  // Satt när anteckningen egentligen ligger på ett av bolagets projekt och
  // bara visas här. Den redigeras och raderas där den hör hemma.
  project_id?: string | null
  project_name?: string | null
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

/**
 * Bolagets egna anteckningar plus anteckningarna på dess projekt, i en enda
 * tidslinje sorterad på tid. Projektanteckningar bär projektets namn så det
 * syns var de kommer ifrån, och de raderas inte härifrån utan på projektet.
 *
 * Anledningen: en anteckning skriven i ett projekt är fortfarande något som
 * hände hos kunden, och ska gå att se på kundkortet utan att man måste veta
 * vilket projekt den råkade skrivas i.
 */
export async function getNotesWithProjects(
  entityType: 'company' | 'prospect',
  entityId: string
): Promise<NoteWithAuthor[]> {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, project_type')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  const projectIds = (projects ?? []).map((p) => p.id)
  const nameById = new Map(
    (projects ?? []).map((p) => [
      p.id,
      p.name?.trim() || PROJECT_TYPES.find((t) => t.key === p.project_type)?.label || 'Projekt',
    ])
  )

  const [ownRes, projectRes] = await Promise.all([
    supabase
      .from('notes')
      .select('*, users!notes_author_user_id_fkey(name)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId),
    projectIds.length > 0
      ? supabase
          .from('notes')
          .select('*, users!notes_author_user_id_fkey(name)')
          .eq('entity_type', 'project')
          .in('entity_id', projectIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  const shape = (note: Record<string, unknown>, fromProject: boolean): NoteWithAuthor => ({
    ...(note as unknown as Note),
    author_name: (note.users as { name: string } | null)?.name ?? null,
    users: undefined,
    project_id: fromProject ? (note.entity_id as string) : null,
    project_name: fromProject ? nameById.get(note.entity_id as string) ?? 'Projekt' : null,
  }) as NoteWithAuthor

  const all = [
    ...((ownRes.data ?? []) as Record<string, unknown>[]).map((n) => shape(n, false)),
    ...((projectRes.data ?? []) as Record<string, unknown>[]).map((n) => shape(n, true)),
  ]

  all.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
  return all
}
