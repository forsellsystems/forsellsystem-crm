import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { firefliesConfigured, FIREFLIES_WEBHOOK_SECRET } from '@/lib/fireflies/config'
import { fetchTranscript } from '@/lib/fireflies/client'
import { buildTranscriptNotes } from '@/lib/fireflies/notes'

export const runtime = 'nodejs'

/**
 * Webhooken SKAPAR INTE möteskort. Möteskorten kommer från kalendern, och
 * transkriptet kopplas för hand på kortet — annars får varje inspelat möte två
 * kort, ett från kalendern och ett härifrån, och den manuella kopplingen blir
 * meningslös. Det webhooken gör är att hålla ett REDAN kopplat kort färskt:
 * blir transkriptet klart eller omgjort skrivs anteckningen om.
 */

// Verify Fireflies' x-hub-signature (HMAC-SHA256 of the raw body, hex).
function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!secret || !header) return false
  const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex')
  const provided = header.replace(/^sha256=/, '').trim()
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
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

    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('fireflies_transcript_id', transcriptId)
      .maybeSingle()

    // Inget kort pekar på transkriptet än. Det är det normala läget: kortet
    // finns redan från kalendern och väntar på att kopplas för hand.
    if (!meeting) {
      return NextResponse.json({ ok: true, skipped: 'inget kopplat möteskort' })
    }

    const { error } = await supabase
      .from('meetings')
      .update({ notes: buildTranscriptNotes(t), updated_at: new Date().toISOString() })
      .eq('id', meeting.id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, updated: meeting.id })
  } catch (err) {
    console.error('Fireflies webhook failed:', err)
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }
}
