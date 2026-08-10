// Fireflies GraphQL types (only the fields we use).

export interface FirefliesAttendee {
  displayName?: string | null
  email?: string | null
}

export interface FirefliesSummary {
  overview?: string | null
  short_summary?: string | null
  action_items?: string | null
  keywords?: string[] | null
}

export interface FirefliesSentence {
  speaker_name?: string | null
  text?: string | null
}

export interface FirefliesTranscript {
  id: string
  title?: string | null
  date?: number | string | null
  duration?: number | null
  organizer_email?: string | null
  participants?: string[] | null
  meeting_attendees?: FirefliesAttendee[] | null
  summary?: FirefliesSummary | null
  sentences?: FirefliesSentence[] | null
}

// The webhook payload Fireflies POSTs on "Transcription completed".
export interface FirefliesWebhookPayload {
  meetingId?: string
  eventType?: string
  clientReferenceId?: string
}
