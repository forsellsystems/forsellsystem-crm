'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { meetingSchema, type MeetingFormData } from '@/lib/validations'
import { getCurrentUserId, deleteActivityForEntity } from '@/lib/actions/activity-actions'

// Meetings live on all four entity surfaces, so we revalidate both candidate
// detail-page paths for the entity (revalidating a non-matching path is a no-op).
function revalidateEntity(entityType: string | null, entityId: string | null) {
  if (entityType && entityId) {
    if (entityType === 'company') {
      revalidatePath(`/foretag/${entityId}`)
      revalidatePath(`/aterforsaljare/${entityId}`)
    } else {
      revalidatePath(`/prospekt/${entityId}`)
      revalidatePath(`/aterforsaljar-prospekt/${entityId}`)
    }
  }
  revalidatePath('/moten')
}

type DbClient = Awaited<ReturnType<typeof createClient>>

// Resolve the parent bolag's display name + the correct detail-page href (which
// differs for kund/agent and kund-/agent-prospekt — same logic as queries/meetings.ts).
async function resolveParent(
  supabase: DbClient,
  entityType: string | null,
  entityId: string | null
): Promise<{ name: string; href: string | null }> {
  if (!entityType || !entityId) return { name: 'Internt', href: null }
  if (entityType === 'company') {
    const { data } = await supabase
      .from('companies')
      .select('name, is_reseller')
      .eq('id', entityId)
      .single()
    const href = data?.is_reseller ? `/aterforsaljare/${entityId}` : `/foretag/${entityId}`
    return { name: data?.name ?? '', href }
  }
  const { data } = await supabase
    .from('prospects')
    .select('company_name, prospect_type')
    .eq('id', entityId)
    .single()
  const href =
    data?.prospect_type === 'reseller'
      ? `/aterforsaljar-prospekt/${entityId}`
      : `/prospekt/${entityId}`
  return { name: data?.company_name ?? '', href }
}

/**
 * Keep a single activity_log row in sync with a meeting. A meeting only belongs
 * in the log once it has a DATE — and the log row is dated AT the meeting's date
 * (not when it was entered), so it groups under the day the meeting happens.
 * Updated on later edits, removed if the date is cleared. Best-effort: never throws.
 */
async function syncMeetingActivity(
  supabase: DbClient,
  meetingId: string,
  entityType: string | null,
  entityId: string | null
) {
  try {
    const { data: m } = await supabase
      .from('meetings')
      .select('title, meeting_date, notes, agenda')
      .eq('id', meetingId)
      .single()
    if (!m) return

    const { data: existing } = await supabase
      .from('activity_log')
      .select('id')
      .eq('entity_type', 'meeting')
      .eq('entity_id', meetingId)
      .limit(1)
      .maybeSingle()

    // No date → not a dated event yet; keep it out of the log.
    if (!m.meeting_date) {
      if (existing) await supabase.from('activity_log').delete().eq('id', existing.id)
      return
    }

    const parent = await resolveParent(supabase, entityType, entityId)
    const metadata = {
      label: parent.name,
      href: `/moten/${meetingId}`,
      parent_href: parent.href || undefined,
      title: m.title?.trim() || undefined,
      meeting_date: m.meeting_date,
      snippet: (m.notes?.trim() || m.agenda?.trim() || '').slice(0, 80) || undefined,
    }
    // Date the log row at the meeting's date (noon UTC avoids day-boundary drift).
    const loggedAt = `${m.meeting_date}T12:00:00Z`

    if (existing) {
      await supabase
        .from('activity_log')
        .update({ metadata, created_at: loggedAt })
        .eq('id', existing.id)
    } else {
      const userId = await getCurrentUserId(supabase)
      await supabase.from('activity_log').insert({
        action: 'meeting_created',
        entity_type: 'meeting',
        entity_id: meetingId,
        metadata,
        user_id: userId,
        created_at: loggedAt,
      })
    }
  } catch (err) {
    console.error('syncMeetingActivity failed:', err)
  }
}

export async function createMeeting(data: MeetingFormData): Promise<string> {
  const validated = meetingSchema.parse(data)
  const supabase = await createClient()

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      entity_type: validated.entity_type ?? null,
      entity_id: validated.entity_id ?? null,
      title: validated.title || null,
      meeting_date: validated.meeting_date || null,
      status: validated.status || null,
      agenda: validated.agenda || null,
      notes: validated.notes || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa möte: ${error.message}`)

  // A blank meeting isn't a loggable event yet — it's logged on save
  // (updateMeeting → syncMeetingActivity) once it has a date.
  revalidateEntity(validated.entity_type ?? null, validated.entity_id ?? null)
  return meeting.id
}

export async function updateMeeting(
  id: string,
  entityType: string | null,
  entityId: string | null,
  fields: Partial<Record<'title' | 'meeting_date' | 'status' | 'agenda' | 'notes', string | null>>
) {
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [key, value] of Object.entries(fields)) {
    update[key] = value || null
  }

  const { error } = await supabase.from('meetings').update(update).eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera möte: ${error.message}`)

  await syncMeetingActivity(supabase, id, entityType, entityId)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${id}`)
  revalidatePath('/logg')
}

export async function deleteMeeting(id: string, entityType: string | null, entityId: string | null) {
  const supabase = await createClient()

  await deleteActivityForEntity(supabase, 'meeting', id)

  // Action points are removed via ON DELETE CASCADE.
  const { error } = await supabase.from('meetings').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort möte: ${error.message}`)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${id}`)
}

// Meeting "action points" are now unified to-dos — see src/lib/actions/todo-actions.ts
// (createTodo with source='meeting' + meeting_id, toggleTodo, deleteTodo).
