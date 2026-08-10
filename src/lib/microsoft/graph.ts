import { graphFetch, graphJson } from './client'
import type { GraphUser, GraphMessage, GraphEvent } from './types'

const MESSAGE_SELECT = 'id,subject,bodyPreview,receivedDateTime,webLink,from,toRecipients,isRead'
const EVENT_SELECT = 'id,subject,start,end,webLink,isAllDay,isCancelled,location,organizer,attendees'

// Ask Graph to return event times in Swedish local time so the UI can slice
// HH:MM straight from the string without timezone math.
const PREFER_TZ = { Prefer: 'outlook.timezone="W. Europe Standard Time"' }

/** The connected mailbox — used after connecting to show "Ansluten som ...". */
export async function getMe(userId: string): Promise<GraphUser> {
  const res = await graphFetch(userId, '/me?$select=displayName,mail,userPrincipalName')
  return graphJson<GraphUser>(res, 'kontohämtning')
}

// Recent messages where any of the given addresses is a participant (from/to/cc),
// newest first. Graph $search can't be combined with $orderby on messages, so we
// fetch a batch and sort client-side.
export async function getRecentMessagesWith(
  userId: string,
  emails: string[],
  limit = 8
): Promise<GraphMessage[]> {
  if (!emails.length) return []
  const kql = emails.map((e) => `participants:${e}`).join(' OR ')
  const qs =
    `$search=${encodeURIComponent(`"${kql}"`)}` +
    `&$top=25` +
    `&$select=${encodeURIComponent(MESSAGE_SELECT)}`
  const res = await graphFetch(userId, `/me/messages?${qs}`)
  const data = await graphJson<{ value: GraphMessage[] }>(res, 'mejlhämtning')
  return (data.value ?? [])
    .slice()
    .sort((a, b) => (a.receivedDateTime < b.receivedDateTime ? 1 : -1))
    .slice(0, limit)
}

// Calendar events (recent + upcoming) where any of the given addresses is the
// organizer or an attendee, newest first. Times are requested in W. Europe time
// so the card can show them without timezone math.
export async function getEventsWith(
  userId: string,
  emails: string[],
  limit = 6
): Promise<GraphEvent[]> {
  if (!emails.length) return []
  const DAY = 86_400_000
  const start = new Date(Date.now() - 90 * DAY).toISOString()
  const end = new Date(Date.now() + 365 * DAY).toISOString()
  const qs =
    `startDateTime=${encodeURIComponent(start)}` +
    `&endDateTime=${encodeURIComponent(end)}` +
    `&$select=${encodeURIComponent(EVENT_SELECT)}` +
    `&$top=50` +
    `&$orderby=${encodeURIComponent('start/dateTime')}`
  const res = await graphFetch(userId, `/me/calendarView?${qs}`, { headers: PREFER_TZ })
  const data = await graphJson<{ value: GraphEvent[] }>(res, 'kalenderhämtning')

  const wanted = new Set(emails.map((e) => e.toLowerCase()))
  return (data.value ?? [])
    .filter((ev) => {
      const addrs: string[] = []
      if (ev.organizer?.emailAddress?.address) addrs.push(ev.organizer.emailAddress.address)
      for (const a of ev.attendees ?? []) {
        if (a.emailAddress?.address) addrs.push(a.emailAddress.address)
      }
      return addrs.some((a) => wanted.has(a.toLowerCase()))
    })
    .sort((a, b) => ((a.start?.dateTime ?? '') < (b.start?.dateTime ?? '') ? 1 : -1))
    .slice(0, limit)
}

// The signed-in user's own events (recent + upcoming) for the meeting-link picker.
export async function getMyEvents(userId: string, limit = 20): Promise<GraphEvent[]> {
  const DAY = 86_400_000
  const start = new Date(Date.now() - 30 * DAY).toISOString()
  const end = new Date(Date.now() + 120 * DAY).toISOString()
  const qs =
    `startDateTime=${encodeURIComponent(start)}` +
    `&endDateTime=${encodeURIComponent(end)}` +
    `&$select=${encodeURIComponent(EVENT_SELECT)}` +
    `&$top=${limit}` +
    `&$orderby=${encodeURIComponent('start/dateTime desc')}`
  const res = await graphFetch(userId, `/me/calendarView?${qs}`, { headers: PREFER_TZ })
  const data = await graphJson<{ value: GraphEvent[] }>(res, 'kalenderhämtning')
  return data.value ?? []
}

// The signed-in user's upcoming events (from now), soonest first — for the
// dashboard "Kommande möten" list.
export async function getUpcomingEvents(userId: string, limit = 8): Promise<GraphEvent[]> {
  const start = new Date().toISOString()
  const end = new Date(Date.now() + 180 * 86_400_000).toISOString()
  const qs =
    `startDateTime=${encodeURIComponent(start)}` +
    `&endDateTime=${encodeURIComponent(end)}` +
    `&$select=${encodeURIComponent(EVENT_SELECT)}` +
    `&$top=${limit}` +
    `&$orderby=${encodeURIComponent('start/dateTime')}`
  const res = await graphFetch(userId, `/me/calendarView?${qs}`, { headers: PREFER_TZ })
  const data = await graphJson<{ value: GraphEvent[] }>(res, 'kalenderhämtning')
  return data.value ?? []
}

// A single event by id — for a linked meeting card (live sync). Returns null if
// the event no longer exists in Outlook.
export async function getEventById(userId: string, eventId: string): Promise<GraphEvent | null> {
  const qs = `$select=${encodeURIComponent(EVENT_SELECT)}`
  const res = await graphFetch(userId, `/me/events/${encodeURIComponent(eventId)}?${qs}`, {
    headers: PREFER_TZ,
  })
  if (res.status === 404) return null
  return graphJson<GraphEvent>(res, 'kalenderhämtning')
}
