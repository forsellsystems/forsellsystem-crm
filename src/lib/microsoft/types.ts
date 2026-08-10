// Microsoft Graph / OAuth types.

// Token response from the Entra token endpoint (authorization_code + refresh_token).
export interface MicrosoftTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  scope: string
  expires_in: number // seconds (~3600)
  ext_expires_in?: number
  id_token?: string
}

// Our stored per-user connection row (public.microsoft_connection).
export interface MicrosoftConnection {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string | null
  account_email: string | null
  account_name: string | null
  created_at: string
  updated_at: string
}

// Non-secret connection status for the UI (tokens never leave the server).
export interface MicrosoftConnectionStatus {
  connected: boolean
  accountEmail: string | null
  accountName: string | null
}

// Microsoft Graph /me
export interface GraphUser {
  displayName?: string
  mail?: string | null
  userPrincipalName?: string
}

export interface GraphRecipient {
  emailAddress?: { name?: string; address?: string }
}

export interface GraphMessage {
  id: string
  subject: string | null
  bodyPreview: string | null
  receivedDateTime: string
  webLink: string | null
  isRead?: boolean
  from?: GraphRecipient
  toRecipients?: GraphRecipient[]
}

export interface GraphDateTime {
  dateTime: string
  timeZone?: string
}

export interface GraphEvent {
  id: string
  subject: string | null
  start?: GraphDateTime
  end?: GraphDateTime
  webLink: string | null
  isAllDay?: boolean
  isCancelled?: boolean
  location?: { displayName?: string }
  organizer?: GraphRecipient
  attendees?: GraphRecipient[]
}
