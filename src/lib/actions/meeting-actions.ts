'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { meetingSchema, type MeetingFormData } from '@/lib/validations'
import { getCurrentUserId, deleteActivityForEntity, logActivity } from '@/lib/actions/activity-actions'
import { getEventById } from '@/lib/microsoft/graph'
import type { GraphEvent } from '@/lib/microsoft/types'

// Derive a meeting's date (YYYY-MM-DD) + time (HH:MM) from an Outlook event.
// Times arrive in W. Europe local time (see graph.ts), so we can slice directly.
function eventDateTime(ev: GraphEvent): { date: string | null; time: string | null } {
  const dt = ev.start?.dateTime
  if (!dt) return { date: null, time: null }
  return { date: dt.slice(0, 10), time: ev.isAllDay || dt.length < 16 ? null : dt.slice(11, 16) }
}

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
      .select('title, meeting_date, meeting_time, notes, agenda')
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
      meeting_time: m.meeting_time || undefined,
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

// A meeting linked to a deal/project MUST still anchor to a company/prospect so it
// shows on the kund/agent/prospekt card. The anchor is derived from the link:
// deal → its company; project → its parent. Otherwise the picked entity is used.
async function resolveMeetingAnchor(
  supabase: DbClient,
  fields: {
    entity_type?: string | null
    entity_id?: string | null
    deal_id?: string | null
    project_id?: string | null
  }
): Promise<{ entity_type: string | null; entity_id: string | null }> {
  if (fields.deal_id) {
    const { data } = await supabase
      .from('deals')
      .select('company_id')
      .eq('id', fields.deal_id)
      .single()
    if (data?.company_id) return { entity_type: 'company', entity_id: data.company_id }
  }
  if (fields.project_id) {
    const { data } = await supabase
      .from('projects')
      .select('entity_type, entity_id')
      .eq('id', fields.project_id)
      .single()
    if (data?.entity_type && data?.entity_id) {
      return { entity_type: data.entity_type, entity_id: data.entity_id }
    }
  }
  return { entity_type: fields.entity_type ?? null, entity_id: fields.entity_id ?? null }
}

export async function createMeeting(data: MeetingFormData): Promise<string> {
  const validated = meetingSchema.parse(data)
  const supabase = await createClient()

  const anchor = await resolveMeetingAnchor(supabase, validated)

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      entity_type: anchor.entity_type,
      entity_id: anchor.entity_id,
      deal_id: validated.deal_id || null,
      project_id: validated.project_id || null,
      title: validated.title || null,
      meeting_date: validated.meeting_date || null,
      meeting_time: validated.meeting_time || null,
      status: validated.status || null,
      agenda: validated.agenda || null,
      notes: validated.notes || null,
      participants: validated.participants || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa möte: ${error.message}`)

  // The popup can set a date at creation time, so log it right away — but only
  // if a date is present (syncMeetingActivity is a no-op for blank meetings,
  // which get logged later via updateMeeting once they get a date).
  await syncMeetingActivity(supabase, meeting.id, anchor.entity_type, anchor.entity_id)
  revalidateEntity(anchor.entity_type, anchor.entity_id)
  if (validated.deal_id) revalidatePath(`/pipeline/${validated.deal_id}`)
  if (validated.project_id) revalidatePath(`/projekt/${validated.project_id}`)
  revalidatePath('/logg')
  return meeting.id
}

export async function updateMeeting(
  id: string,
  entityType: string | null,
  entityId: string | null,
  fields: Partial<Record<'title' | 'meeting_date' | 'meeting_time' | 'status' | 'agenda' | 'notes' | 'participants', string | null>>
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
  // Also refresh the linked deal/project pages, where this meeting is shown.
  const { data: links } = await supabase
    .from('meetings')
    .select('deal_id, project_id')
    .eq('id', id)
    .single()
  if (links?.deal_id) revalidatePath(`/pipeline/${links.deal_id}`)
  if (links?.project_id) revalidatePath(`/projekt/${links.project_id}`)
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

// ── Outlook (Microsoft 365) linking ─────────────────────────────────────────
// A meeting card can be linked to one Outlook event. While linked, Outlook drives
// title/date/time (synced on view via syncOutlookMeeting).

export async function linkOutlookEvent(
  meetingId: string,
  entityType: string | null,
  entityId: string | null,
  eventId: string
) {
  const supabase = await createClient()
  const userId = await getCurrentUserId(supabase)
  if (!userId) throw new Error('Ingen inloggad användare.')

  const event = await getEventById(userId, eventId)
  if (!event) throw new Error('Kunde inte hämta Outlook-mötet.')
  const { date, time } = eventDateTime(event)

  const { error } = await supabase
    .from('meetings')
    .update({
      outlook_event_id: eventId,
      outlook_web_link: event.webLink ?? null,
      title: event.subject ?? null,
      meeting_date: date,
      meeting_time: time,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
  if (error) throw new Error(`Kunde inte koppla Outlook-möte: ${error.message}`)

  await syncMeetingActivity(supabase, meetingId, entityType, entityId)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${meetingId}`)
  revalidatePath('/logg')
}

export async function unlinkOutlookEvent(
  meetingId: string,
  entityType: string | null,
  entityId: string | null
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('meetings')
    .update({ outlook_event_id: null, outlook_web_link: null, updated_at: new Date().toISOString() })
    .eq('id', meetingId)
  if (error) throw new Error(`Kunde inte ta bort koppling: ${error.message}`)

  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${meetingId}`)
}

/**
 * Re-read a linked meeting's Outlook event and mirror title/date/time onto the
 * meeting row ("Outlook styr löpande"). Best-effort and side-effect-light: called
 * from the meeting detail render, so it never throws and does not revalidate.
 * Returns the fresh fields to merge into the current render, or null.
 */
export async function syncOutlookMeeting(
  meetingId: string,
  userId: string
): Promise<{
  title: string | null
  meeting_date: string | null
  meeting_time: string | null
  status: string
  outlook_web_link: string | null
} | null> {
  try {
    const supabase = await createClient()
    const { data: m } = await supabase
      .from('meetings')
      .select('outlook_event_id')
      .eq('id', meetingId)
      .single()
    if (!m?.outlook_event_id) return null

    const event = await getEventById(userId, m.outlook_event_id)
    if (!event) return null

    const { date, time } = eventDateTime(event)
    // Outlook drives status: cancelled → inställt, past → genomfört, else planerat.
    const today = new Date().toISOString().slice(0, 10)
    const status = event.isCancelled ? 'installt' : date && date < today ? 'genomfort' : 'planerat'
    const fields = {
      title: event.subject ?? null,
      meeting_date: date,
      meeting_time: time,
      status,
      outlook_web_link: event.webLink ?? null,
    }
    await supabase
      .from('meetings')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', meetingId)
    return fields
  } catch {
    return null
  }
}

// Same fields as the real "Ny kund" / "Nytt prospekt" forms (company-form.tsx /
// prospect-form.tsx). Company-only + prospect-only fields are simply ignored for
// the other kind.
export type NewBolagInput = {
  kind: 'kund' | 'agent' | 'kund_prospekt' | 'agent_prospekt'
  name: string
  country: string
  factory_type?: string | null
  building_types?: string[]
  material?: string | null
  reseller_id?: string | null
  email?: string | null
  phone?: string | null
  // company-only
  customer_number?: string | null
  org_number?: string | null
  website?: string | null
  responsible_user_id?: string | null
  // prospect-only
  contact_person?: string | null
}

const clean = (v?: string | null) => (v && v.trim() !== '' ? v.trim() : null)

// Create the bolag (kund/agent = company, kund-/agent-prospekt = prospect) and
// return its entity_type + id. Best-effort activity log, like other create flows.
async function createBolag(
  supabase: DbClient,
  nb: NewBolagInput
): Promise<{ entity_type: 'company' | 'prospect'; entity_id: string }> {
  const name = nb.name.trim()
  if (!name) throw new Error('Bolagsnamn krävs.')
  const country = clean(nb.country) || 'Sverige'

  if (nb.kind === 'kund' || nb.kind === 'agent') {
    const isReseller = nb.kind === 'agent'
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name,
        country,
        is_reseller: isReseller,
        customer_number: clean(nb.customer_number),
        org_number: clean(nb.org_number),
        factory_type: clean(nb.factory_type),
        building_types: nb.building_types ?? [],
        material: clean(nb.material),
        responsible_user_id: clean(nb.responsible_user_id),
        reseller_id: isReseller ? null : clean(nb.reseller_id),
        email: clean(nb.email),
        phone: clean(nb.phone),
        website: clean(nb.website),
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`Kunde inte skapa bolag: ${error?.message}`)

    await logActivity(supabase, {
      action: 'company_created',
      entity_type: 'company',
      entity_id: data.id,
      metadata: {
        label: name,
        href: isReseller ? `/aterforsaljare/${data.id}` : `/foretag/${data.id}`,
      },
    })
    return { entity_type: 'company', entity_id: data.id }
  }

  const prospectType = nb.kind === 'agent_prospekt' ? 'reseller' : 'customer'
  const isReseller = prospectType === 'reseller'
  const { data, error } = await supabase
    .from('prospects')
    .insert({
      company_name: name,
      prospect_type: prospectType,
      country,
      status: 'active',
      // Agent-prospekt hides factory/building/agent (matches prospect-form).
      factory_type: isReseller ? null : clean(nb.factory_type),
      building_types: isReseller ? [] : nb.building_types ?? [],
      material: isReseller ? null : clean(nb.material),
      reseller_id: isReseller ? null : clean(nb.reseller_id),
      contact_person: clean(nb.contact_person),
      email: clean(nb.email),
      phone: clean(nb.phone),
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Kunde inte skapa prospekt: ${error?.message}`)

  await logActivity(supabase, {
    action: 'prospect_created',
    entity_type: 'prospect',
    entity_id: data.id,
    metadata: {
      label: name,
      href:
        prospectType === 'reseller'
          ? `/aterforsaljar-prospekt/${data.id}`
          : `/prospekt/${data.id}`,
    },
  })
  return { entity_type: 'prospect', entity_id: data.id }
}

/**
 * Create a CRM meeting card from an Outlook event, anchored to an existing bolag
 * OR a newly created one, with agenda/participants. Links the meeting to the
 * event (Outlook drives title/date/time). Idempotent on the event. Returns the id.
 */
export async function createOutlookMeetingCard(input: {
  eventId: string
  entity?: { type: 'company' | 'prospect'; id: string } | null
  newBolag?: NewBolagInput | null
  agenda?: string | null
  participants?: string | null
}): Promise<string> {
  const supabase = await createClient()
  const userId = await getCurrentUserId(supabase)
  if (!userId) throw new Error('Ingen inloggad användare.')

  const { data: existing } = await supabase
    .from('meetings')
    .select('id')
    .eq('outlook_event_id', input.eventId)
    .maybeSingle()
  if (existing) return existing.id

  const event = await getEventById(userId, input.eventId)
  if (!event) throw new Error('Kunde inte hämta Outlook-mötet.')
  const { date, time } = eventDateTime(event)

  let entityType: 'company' | 'prospect' | null = input.entity?.type ?? null
  let entityId: string | null = input.entity?.id ?? null
  if (input.newBolag) {
    const created = await createBolag(supabase, input.newBolag)
    entityType = created.entity_type
    entityId = created.entity_id
  }

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      title: event.subject ?? null,
      meeting_date: date,
      meeting_time: time,
      agenda: input.agenda || null,
      participants: input.participants || null,
      outlook_event_id: input.eventId,
      outlook_web_link: event.webLink ?? null,
    })
    .select('id')
    .single()
  if (error) throw new Error(`Kunde inte skapa möteskort: ${error.message}`)

  await syncMeetingActivity(supabase, meeting.id, entityType, entityId)
  revalidateEntity(entityType, entityId)
  revalidatePath('/moten')
  revalidatePath('/dashboard')
  revalidatePath('/logg')
  return meeting.id
}

/**
 * Anchor a meeting card to a bolag (kund/agent = company, kund-/agent-prospekt =
 * prospect), or clear it (null = internal). Revalidates both the old and new
 * parent cards so the meeting moves correctly.
 */
export async function setMeetingEntity(
  meetingId: string,
  entityType: 'company' | 'prospect' | null,
  entityId: string | null
) {
  const supabase = await createClient()

  const { data: prev } = await supabase
    .from('meetings')
    .select('entity_type, entity_id')
    .eq('id', meetingId)
    .single()

  const { error } = await supabase
    .from('meetings')
    .update({
      entity_type: entityType,
      entity_id: entityId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
  if (error) throw new Error(`Kunde inte koppla möte till bolag: ${error.message}`)

  await syncMeetingActivity(supabase, meetingId, entityType, entityId)
  if (prev) revalidateEntity(prev.entity_type, prev.entity_id)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/moten/${meetingId}`)
  revalidatePath('/logg')
}

// Meeting "action points" are now unified to-dos — see src/lib/actions/todo-actions.ts
// (createTodo with source='meeting' + meeting_id, toggleTodo, deleteTodo).
