import { GRAPH_API_BASE, microsoftConfigured } from './config'
import { refreshAccessToken } from './oauth'
import { getConnection, updateTokens } from './store'
import type { MicrosoftConnection } from './types'

// Thrown when there is no usable Microsoft connection for a user (never connected,
// or the refresh token expired/was revoked so they must reconnect).
export class MicrosoftNotConnectedError extends Error {
  constructor(message = 'Microsoft är inte anslutet') {
    super(message)
    this.name = 'MicrosoftNotConnectedError'
  }
}

// Refresh a little before the real expiry to avoid racing the 1h boundary.
const EXPIRY_MARGIN_MS = 60_000

function expiresAtFrom(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

// Dedupe concurrent refreshes per user within this instance so two renders don't
// both POST the rotating refresh token (the second would get invalid_grant).
// Cross-instance races are handled by the re-read in refreshConnection.
const refreshInFlight = new Map<string, Promise<string>>()

async function getValidAccessToken(userId: string): Promise<string> {
  if (!microsoftConfigured()) {
    throw new MicrosoftNotConnectedError('Microsoft-credentials saknas i miljön')
  }
  const conn = await getConnection(userId)
  if (!conn) throw new MicrosoftNotConnectedError()

  const expiresMs = new Date(conn.expires_at).getTime()
  if (Date.now() < expiresMs - EXPIRY_MARGIN_MS) return conn.access_token

  let inflight = refreshInFlight.get(userId)
  if (!inflight) {
    inflight = refreshConnection(conn).finally(() => refreshInFlight.delete(userId))
    refreshInFlight.set(userId, inflight)
  }
  return inflight
}

async function refreshConnection(conn: MicrosoftConnection): Promise<string> {
  let tokens
  try {
    tokens = await refreshAccessToken(conn.refresh_token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Another request may have already rotated the token — re-read and reuse it
    // instead of falsely declaring the connection dead.
    const fresh = await getConnection(conn.user_id)
    if (
      fresh &&
      fresh.refresh_token !== conn.refresh_token &&
      new Date(fresh.expires_at).getTime() > Date.now() + EXPIRY_MARGIN_MS
    ) {
      return fresh.access_token
    }
    // Misconfigured client credentials is a config problem, NOT an expired
    // connection — surface it distinctly so it isn't mistaken for "reconnect".
    if (msg.includes('invalid_client')) {
      throw new MicrosoftNotConnectedError(
        'Microsoft client-credentials (MICROSOFT_CLIENT_ID/SECRET) är felaktiga i denna miljö.'
      )
    }
    throw new MicrosoftNotConnectedError(
      `Microsoft-anslutningen har gått ut, anslut igen. (${msg})`
    )
  }
  await updateTokens(conn.id, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAtFrom(tokens.expires_in),
    scope: tokens.scope,
  })
  return tokens.access_token
}

/**
 * Authenticated fetch against Microsoft Graph for a given CRM user. `path` is
 * relative to https://graph.microsoft.com/v1.0 (e.g. `/me/messages?...`), or an
 * absolute URL (for @odata.nextLink). Retries once on 401 by forcing a refresh.
 */
export async function graphFetch(
  userId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${GRAPH_API_BASE}${path}`

  const doFetch = (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

  let token = await getValidAccessToken(userId)
  let res = await doFetch(token)

  if (res.status === 401) {
    const conn = await getConnection(userId)
    if (conn) {
      token = await refreshConnection(conn)
      res = await doFetch(token)
    }
  }
  return res
}

/** Parse a Graph JSON response, throwing a readable error on failure. */
export async function graphJson<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Microsoft ${context} misslyckades (${res.status}): ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}
