import { FIREFLIES_GRAPHQL_URL, FIREFLIES_API_KEY } from './config'
import type { FirefliesTranscript, FirefliesTranscriptSummary } from './types'

const TRANSCRIPT_QUERY = `query Transcript($id: String!) {
  transcript(id: $id) {
    id
    title
    date
    duration
    organizer_email
    participants
    meeting_attendees { displayName email }
    summary { overview short_summary action_items keywords }
  }
}`

// Listan i kopplingsväljaren: bara det som behövs för att känna igen mötet.
// Inga meningar hämtas — de drar in hela transkriptet per rad.
const TRANSCRIPT_LIST_QUERY = `query Transcripts($limit: Int) {
  transcripts(limit: $limit) {
    id
    title
    date
    duration
    meeting_attendees { displayName email }
  }
}`

async function firefliesQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(FIREFLIES_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIREFLIES_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fireflies API misslyckades (${res.status}): ${text.slice(0, 300)}`)
  }
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) {
    throw new Error(`Fireflies GraphQL-fel: ${JSON.stringify(json.errors).slice(0, 300)}`)
  }
  if (!json.data) throw new Error('Fireflies: tomt svar')
  return json.data
}

// Fetch a transcript (summary only — sentences are deliberately not requested)
// by its id. Bearer-auth GraphQL.
export async function fetchTranscript(id: string): Promise<FirefliesTranscript> {
  const data = await firefliesQuery<{ transcript?: FirefliesTranscript }>(TRANSCRIPT_QUERY, { id })
  if (!data.transcript) throw new Error('Fireflies: transkript saknas i svaret')
  return data.transcript
}

/**
 * Senaste transkripten, nyast först — underlaget till väljaren på möteskortet.
 * Hela listan visas alltid; systemet gissar aldrig vilket transkript som hör
 * till vilket möte, precis som Fortnox-kopplingen visar hela kundregistret.
 */
export async function listRecentTranscripts(limit = 25): Promise<FirefliesTranscriptSummary[]> {
  const data = await firefliesQuery<{ transcripts?: FirefliesTranscriptSummary[] }>(
    TRANSCRIPT_LIST_QUERY,
    { limit }
  )
  return data.transcripts ?? []
}
