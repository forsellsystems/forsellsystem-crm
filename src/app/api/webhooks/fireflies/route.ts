import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { firefliesConfigured, FIREFLIES_WEBHOOK_SECRET } from '@/lib/fireflies/config'
import { fetchTranscript } from '@/lib/fireflies/client'
import type { FirefliesTranscript } from '@/lib/fireflies/types'

export const runtime = 'nodejs'

type DbClient = ReturnType<typeof createAdminClient>

// Verify Fireflies' x-hub-signature (HMAC-SHA256 of the raw body, hex).
function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!secret || !header) return false
  const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex')
  const provided = header.replace(/^sha256=/, '').trim()
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function toDateStr(d: number | string | null | undefined): string | null {
  if (d == null) return null
  const dt = typeof d === 'number' ? new Date(d) : new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toISOString().slice(0, 10)
}

// Build the meeting-notes body: summary + action items + full transcript.
function buildNotes(t: FirefliesTranscript): string | null {
  const parts: string[] = []
  const s = t.summary
  if (s?.overview?.trim()) parts.push(s.overview.trim())
  else if (s?.short_summary?.trim()) parts.push(s.short_summary.trim())
  if (s?.action_items?.trim()) parts.push(`Action items:\n${s.action_items.trim()}`)
  const transcript = (t.sentences ?? [])
    .map((x) => `${x.speaker_name ? `${x.speaker_name}: ` : ''}${x.text ?? ''}`.trim())
    .filter(Boolean)
    .join('\n')
  if (transcript) parts.push(`— Transkript —\n${transcript}`)
  return parts.join('\n\n') || null
}

// Match the transcript to a CRM entity via attendee/participant emails:
// contact → company, else company by email, else prospect by email.
async function matchEntity(
  supabase: DbClient,
  t: FirefliesTranscript
): Promise<{ entity_type: 'company' | 'prospect' | null; entity_id: string | null }> {
  const emails = new Set(
    [...(t.participants ?? []), ...((t.meeting_attendees ?? []).map((a) => a.email))]
      .filter((e): e is string => Boolean(e))
      .map((e) => e.toLowerCase())
  )
  if (emails.size === 0) return { entity_type: null, entity_id: null }

  const { data: contacts } = await supabase.from('contacts').select('company_id, email')
  const contact = (contacts ?? []).find((c) => c.email && emails.has(c.email.toLowerCase()))
  if (contact?.company_id) return { entity_type: 'company', entity_id: contact.company_id }

  const { data: companies } = await supabase.from('companies').select('id, email')
  const company = (companies ?? []).find((c) => c.email && emails.has(c.email.toLowerCase()))
  if (company) return { entity_type: 'company', entity_id: company.id }

  const { data: prospects } = await supabase.from('prospects').select('id, email')
  const prospect = (prospects ?? []).find((p) => p.email && emails.has(p.email.toLowerCase()))
  if (prospect) return { entity_type: 'prospect', entity_id: prospect.id }

  return { entity_type: null, entity_id: null }
}

// Best-effort activity row so the transcribed meeting shows in /logg.
async function logMeetingActivity(
  supabase: DbClient,
  meetingId: string,
  t: FirefliesTranscript,
  meetingDate: string | null,
  title: string
) {
  try {
    let userId: string | null = null
    if (t.organizer_email) {
      const { data: u } = await supabase
        .from('users')
        .select('id')
        .ilike('email', t.organizer_email)
        .maybeSingle()
      userId = u?.id ?? null
    }
    await supabase.from('activity_log').insert({
      action: 'meeting_created',
      entity_type: 'meeting',
      entity_id: meetingId,
      metadata: {
        label: title,
        href: `/moten/${meetingId}`,
        title,
        meeting_date: meetingDate || undefined,
        snippet: (t.summary?.overview || t.summary?.short_summary || '').slice(0, 80) || undefined,
      },
      user_id: userId,
      created_at: meetingDate ? `${meetingDate}T12:00:00Z` : new Date().toISOString(),
    })
  } catch (err) {
    console.error('Fireflies logMeetingActivity failed:', err)
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text()

  if (!verifySignature(raw, request.headers.get('x-hub-signature'), FIREFLIES_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  // Field names vary across Fireflies event types — accept the common variants.
  const transcriptId = (payload.meetingId ||
    payload.meeting_id ||
    payload.transcriptId ||
    payload.id) as string | undefined
  const eventType = (payload.eventType || payload.event_type || payload.event) as
    | string
    | undefined

  if (!transcriptId) return NextResponse.json({ ok: true, skipped: 'no transcript id' })
  // "Meeting Bot Joined" fires before the transcript exists → skip. Everything
  // else (Meeting Transcribed / Summarized / legacy) we process.
  if (eventType && /join/i.test(eventType)) {
    return NextResponse.json({ ok: true, skipped: eventType })
  }
  if (!firefliesConfigured()) {
    return NextResponse.json({ error: 'Fireflies not configured' }, { status: 500 })
  }

  try {
    const t = await fetchTranscript(transcriptId)
    const supabase = createAdminClient()

    const notes = buildNotes(t)
    const meetingDate = toDateStr(t.date)
    const title = t.title?.trim() || 'Möte (Fireflies)'
    const participants =
      (t.meeting_attendees ?? [])
        .map((a) => a.displayName || a.email)
        .filter(Boolean)
        .join(', ') || null

    // Idempotent: one meeting card per transcript (retries just refresh notes).
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('fireflies_transcript_id', transcriptId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('meetings')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      return NextResponse.json({ ok: true, updated: existing.id })
    }

    const { entity_type, entity_id } = await matchEntity(supabase, t)

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        entity_type,
        entity_id,
        title,
        meeting_date: meetingDate,
        participants,
        notes,
        status: 'genomfort', // a transcribed meeting has already happened
        fireflies_transcript_id: transcriptId,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)

    await logMeetingActivity(supabase, meeting.id, t, meetingDate, title)

    return NextResponse.json({
      ok: true,
      meetingId: meeting.id,
      matched: Boolean(entity_id),
    })
  } catch (err) {
    console.error('Fireflies webhook failed:', err)
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }
}
