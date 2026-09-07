import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPastEvents } from './graph'
import type { GraphEvent } from './types'

/**
 * Automatisk mötesimport från Outlook-kalendern.
 *
 * Allt som ligger i kalendern ska in — ingen filtrering på deltagare eller
 * bolag. Kortet skapas UTAN bolag och utan transkript: båda kopplingarna görs
 * för hand på möteskortet, eftersom systemet inte ska välja åt användaren.
 *
 * Svepet triggas när mötessidan öppnas, inte av ett schemalagt jobb. Resultatet
 * blir detsamma för den som tittar: när du öppnar Möten är allt som avslutats
 * där. Det kostar ingen infrastruktur, men inget händer medan ingen är inne.
 */

// Hur länge efter mötets slut kortet skapas. Bufferten finns för möten som
// drar över: kortet ska skapas som genomfört, inte mitt i mötet.
const SETTLE_MS = 60 * 60 * 1000

// Bakåtfönstret vid FÖRSTA körningen. Därefter styr vattenmärket hur långt
// tillbaka som behövs, så ett uppehåll aldrig lämnar ett hål.
const WINDOW_DAYS = 14

// Taket på hur långt bakåt vi någonsin frågar Graph, även efter ett långt
// uppehåll. Utan tak växer anropet obegränsat.
const MAX_WINDOW_DAYS = 90

// Strypventil: svepet gör ett Graph-anrop, och mötessidan kan laddas ofta.
const THROTTLE_MS = 5 * 60 * 1000

/**
 * "Nu minus X" som svensk väggklocka, i samma form som Graph returnerar
 * (YYYY-MM-DDTHH:MM:SS). Servern kör i UTC, så tiderna får aldrig jämföras
 * genom att parsa Graph-strängarna — de saknar offset och skulle tolkas som
 * UTC och slinta två timmar på sommaren. Strängjämförelse på samma tidszon
 * är däremot exakt.
 */
function stockholmWallClock(msAgo: number): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(Date.now() - msAgo))
  return parts.replace(' ', 'T')
}

/** Deltagarnas namn som fritext, samma form som möteskortet visar i övrigt. */
function participantsOf(ev: GraphEvent): string | null {
  const names = (ev.attendees ?? [])
    .map((a) => a.emailAddress?.name || a.emailAddress?.address)
    .filter((n): n is string => Boolean(n))
  return names.length ? names.join(', ') : null
}

/**
 * Kalenderhändelse → möteskortets fält. Datum och tid skivas rakt ur strängen
 * eftersom Graph redan svarat i svensk lokaltid.
 */
function meetingRowFrom(ev: GraphEvent) {
  const dt = ev.start?.dateTime
  return {
    entity_type: null,
    entity_id: null,
    title: ev.subject?.trim() || null,
    meeting_date: dt ? dt.slice(0, 10) : null,
    meeting_time: ev.isAllDay || !dt || dt.length < 16 ? null : dt.slice(11, 16),
    participants: participantsOf(ev),
    // Mötet är över när kortet skapas, så statusen är känd.
    status: ev.isCancelled ? 'installt' : 'genomfort',
    outlook_event_id: ev.id,
    outlook_ical_uid: ev.iCalUId ?? null,
    outlook_web_link: ev.webLink ?? null,
  }
}

/**
 * Kör svepet för en användare. Returnerar antalet skapade möteskort.
 * Best-effort: kastar aldrig, eftersom det körs under sidrendering.
 */
export async function importFinishedCalendarMeetings(userId: string): Promise<number> {
  const admin = createAdminClient()

  const { data: conn } = await admin
    .from('microsoft_connection')
    .select('user_id, last_calendar_import_at, calendar_watermark')
    .eq('user_id', userId)
    .maybeSingle()
  if (!conn) return 0

  if (conn.last_calendar_import_at) {
    const age = Date.now() - new Date(conn.last_calendar_import_at).getTime()
    if (age < THROTTLE_MS) return 0
  }

  // Stämpeln sätts oavsett utfall. Annars skulle en trasig koppling ge ett
  // Graph-anrop per sidladdning i all evighet, eftersom felfallet aldrig
  // hann uppdatera strypventilen.
  const stampAttempt = admin
    .from('microsoft_connection')
    .update({ last_calendar_import_at: new Date().toISOString() })
    .eq('user_id', userId)

  try {
    // Hur långt bakåt behöver vi fråga? Normalt räcker fönstret, men har ingen
    // öppnat sidan på tre veckor måste vi sträcka oss förbi dem.
    const lastRun = conn.last_calendar_import_at
      ? new Date(conn.last_calendar_import_at).getTime()
      : null
    const daysSinceRun = lastRun ? (Date.now() - lastRun) / 86_400_000 : WINDOW_DAYS
    const days = Math.min(MAX_WINDOW_DAYS, Math.max(WINDOW_DAYS, Math.ceil(daysSinceRun) + 1))

    const events = await getPastEvents(userId, days)

    // Avslutat för minst en timme sedan. Saknas sluttid går mötet inte att
    // bedöma, och då väntar vi hellre än gissar.
    const cutoff = stockholmWallClock(SETTLE_MS)

    // Vattenmärket: allt som slutade vid eller före det är redan behandlat.
    // Därför återuppstår inte ett kort som användaren medvetet raderat — och
    // därför tappas ingenting efter ett långt uppehåll heller.
    const watermark = conn.calendar_watermark ?? null

    const finished = events.filter((ev) => {
      const end = ev.end?.dateTime
      if (typeof end !== 'string') return false
      const at = end.slice(0, 19)
      return at <= cutoff && (watermark === null || at > watermark)
    })

    if (finished.length) {
      // Vilka har redan ett kort? Både på event-id (samma brevlåda) och på
      // iCalUId + datum (samma möte i en kollegas brevlåda — Graph ger olika
      // event-id per brevlåda, så id ensamt fångar inte dubbletten).
      const ids = finished.map((ev) => ev.id)
      const uids = finished
        .map((ev) => ev.iCalUId)
        .filter((u): u is string => Boolean(u))

      const [byId, byUid] = await Promise.all([
        admin.from('meetings').select('outlook_event_id').in('outlook_event_id', ids),
        uids.length
          ? admin
              .from('meetings')
              .select('outlook_ical_uid, meeting_date')
              .in('outlook_ical_uid', uids)
          : Promise.resolve({ data: [] as { outlook_ical_uid: string; meeting_date: string }[] }),
      ])

      const knownIds = new Set((byId.data ?? []).map((r) => r.outlook_event_id as string))
      const knownUids = new Set(
        (byUid.data ?? []).map((r) => `${r.outlook_ical_uid}|${r.meeting_date ?? ''}`)
      )

      const fresh = finished.filter((ev) => {
        if (knownIds.has(ev.id)) return false
        const dt = ev.start?.dateTime
        const uidKey = ev.iCalUId ? `${ev.iCalUId}|${dt ? dt.slice(0, 10) : ''}` : null
        return !uidKey || !knownUids.has(uidKey)
      })

      if (fresh.length) {
        // onConflict på det unika indexet: två samtidiga sidladdningar ska inte
        // kunna skapa var sitt kort för samma möte.
        const { error } = await admin
          .from('meetings')
          .upsert(fresh.map(meetingRowFrom), {
            onConflict: 'outlook_event_id',
            ignoreDuplicates: true,
          })
        if (error) throw new Error(error.message)
      }

      // Vattenmärket flyttas fram BARA när körningen gick igenom hela vägen.
      await admin
        .from('microsoft_connection')
        .update({ calendar_watermark: cutoff })
        .eq('user_id', userId)

      await stampAttempt
      return fresh.length
    }

    await admin
      .from('microsoft_connection')
      .update({ calendar_watermark: cutoff })
      .eq('user_id', userId)
    await stampAttempt
    return 0
  } catch (err) {
    // En trasig kalenderkoppling får aldrig fälla mötessidan. Stämpeln sätts
    // ändå, så felet inte upprepas vid varje sidladdning.
    console.error('Kalenderimport misslyckades:', err)
    await stampAttempt
    return 0
  }
}

/**
 * Svepet för den inloggade användaren. Anropas från mötessidan före listan
 * hämtas, så nyskapade kort kommer med i samma rendering.
 */
export async function importFinishedCalendarMeetingsForViewer(): Promise<number> {
  // Ingen try/catch runt sessionen: cookies() kastar med flit under statisk
  // rendering för att märka sidan som dynamisk, och det felet ska passera.
  // Själva importen fångar sina egna fel.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: row } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!row?.id) return 0

  return await importFinishedCalendarMeetings(row.id)
}
