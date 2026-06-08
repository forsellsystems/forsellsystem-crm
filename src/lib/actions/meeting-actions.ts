'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { meetingSchema, actionPointSchema, type MeetingFormData } from '@/lib/validations'
import { logActivity, deleteActivityForEntity } from '@/lib/actions/activity-actions'

// Meetings live on all four entity surfaces, so we revalidate both candidate
// detail-page paths for the entity (revalidating a non-matching path is a no-op).
function revalidateEntity(entityType: string, entityId: string) {
  if (entityType === 'company') {
    revalidatePath(`/foretag/${entityId}`)
    revalidatePath(`/aterforsaljare/${entityId}`)
  } else {
    revalidatePath(`/prospekt/${entityId}`)
    revalidatePath(`/aterforsaljar-prospekt/${entityId}`)
  }
  revalidatePath('/moten')
}

export async function createMeeting(data: MeetingFormData): Promise<string> {
  const validated = meetingSchema.parse(data)
  const supabase = await createClient()

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      entity_type: validated.entity_type,
      entity_id: validated.entity_id,
      title: validated.title || null,
      meeting_date: validated.meeting_date || null,
      status: validated.status || null,
      agenda: validated.agenda || null,
      notes: validated.notes || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa möte: ${error.message}`)

  // Resolve the parent bolag's name for a readable log label (meetings start blank)
  let parentName = ''
  if (validated.entity_type === 'company') {
    const { data } = await supabase.from('companies').select('name').eq('id', validated.entity_id).single()
    parentName = data?.name ?? ''
  } else {
    const { data } = await supabase.from('prospects').select('company_name').eq('id', validated.entity_id).single()
    parentName = data?.company_name ?? ''
  }
  await logActivity(supabase, {
    action: 'meeting_created',
    entity_type: 'meeting',
    entity_id: meeting.id,
    metadata: { label: parentName, href: `/moten/${meeting.id}` },
  })

  revalidateEntity(validated.entity_type, validated.entity_id)
  return meeting.id
}

export async function updateMeeting(
  id: string,
  entityType: string,
  entityId: string,
  fields: Partial<Record<'title' | 'meeting_date' | 'status' | 'agenda' | 'notes', string | null>>
) {
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [key, value] of Object.entries(fields)) {
    update[key] = value || null
  }

  const { error } = await supabase.from('meetings').update(update).eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera möte: ${error.message}`)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${id}`)
}

export async function deleteMeeting(id: string, entityType: string, entityId: string) {
  const supabase = await createClient()

  await deleteActivityForEntity(supabase, 'meeting', id)

  // Action points are removed via ON DELETE CASCADE.
  const { error } = await supabase.from('meetings').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort möte: ${error.message}`)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${id}`)
}

// ── Action points ──────────────────────────────────────────────

export async function addActionPoint(meetingId: string, content: string) {
  const validated = actionPointSchema.parse({ meeting_id: meetingId, content })
  const supabase = await createClient()

  // Append to the end of the list.
  const { data: last } = await supabase
    .from('meeting_action_points')
    .select('sort_order')
    .eq('meeting_id', validated.meeting_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (last?.sort_order ?? -1) + 1

  const { error } = await supabase.from('meeting_action_points').insert({
    meeting_id: validated.meeting_id,
    content: validated.content,
    sort_order: nextOrder,
  })

  if (error) throw new Error(`Kunde inte lägga till action point: ${error.message}`)
  revalidatePath(`/moten/${validated.meeting_id}`)
}

export async function toggleActionPoint(id: string, meetingId: string, done: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('meeting_action_points')
    .update({ done })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera action point: ${error.message}`)
  revalidatePath(`/moten/${meetingId}`)
}

export async function updateActionPoint(id: string, meetingId: string, content: string) {
  const validated = actionPointSchema.parse({ meeting_id: meetingId, content })
  const supabase = await createClient()
  const { error } = await supabase
    .from('meeting_action_points')
    .update({ content: validated.content })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera action point: ${error.message}`)
  revalidatePath(`/moten/${meetingId}`)
}

export async function deleteActionPoint(id: string, meetingId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('meeting_action_points').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort action point: ${error.message}`)
  revalidatePath(`/moten/${meetingId}`)
}
