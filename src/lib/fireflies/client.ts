import { FIREFLIES_GRAPHQL_URL, FIREFLIES_API_KEY } from './config'
import type { FirefliesTranscript } from './types'

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
    sentences { speaker_name text }
  }
}`

// Fetch a transcript (with summary + sentences) by its id. Bearer-auth GraphQL.
export async function fetchTranscript(id: string): Promise<FirefliesTranscript> {
  const res = await fetch(FIREFLIES_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIREFLIES_API_KEY}`,
    },
    body: JSON.stringify({ query: TRANSCRIPT_QUERY, variables: { id } }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fireflies API misslyckades (${res.status}): ${text.slice(0, 300)}`)
  }
  const json = (await res.json()) as {
    data?: { transcript?: FirefliesTranscript }
    errors?: unknown
  }
  if (json.errors) {
    throw new Error(`Fireflies GraphQL-fel: ${JSON.stringify(json.errors).slice(0, 300)}`)
  }
  if (!json.data?.transcript) throw new Error('Fireflies: transkript saknas i svaret')
  return json.data.transcript
}
