import { FORTNOX_API_BASE, fortnoxConfigured } from './config'
import { refreshAccessToken } from './oauth'
import { getConnection, updateTokens } from './store'
import type { FortnoxConnection } from './types'

// Thrown when there is no usable Fortnox connection (never connected, or the
// refresh token expired/was revoked so the user must reconnect).
export class FortnoxNotConnectedError extends Error {
  constructor(message = 'Fortnox är inte anslutet') {
    super(message)
    this.name = 'FortnoxNotConnectedError'
  }
}

// Refresh a little before the real expiry to avoid racing the 1h boundary.
const EXPIRY_MARGIN_MS = 60_000

function expiresAtFrom(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

/**
 * Return a valid access token, transparently refreshing (and persisting the
 * rotated refresh token) when the current one is expired or about to expire.
 */
async function getValidAccessToken(): Promise<string> {
  if (!fortnoxConfigured()) {
    throw new FortnoxNotConnectedError('Fortnox-credentials saknas i miljön')
  }
  const conn = await getConnection()
  if (!conn) throw new FortnoxNotConnectedError()

  const expiresMs = new Date(conn.expires_at).getTime()
  if (Date.now() < expiresMs - EXPIRY_MARGIN_MS) {
    return conn.access_token
  }
  return refreshConnection(conn)
}

async function refreshConnection(conn: FortnoxConnection): Promise<string> {
  try {
    const tokens = await refreshAccessToken(conn.refresh_token)
    await updateTokens(conn.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAtFrom(tokens.expires_in),
      scope: tokens.scope,
    })
    return tokens.access_token
  } catch (err) {
    // A failed refresh almost always means the refresh token expired (45 days)
    // or was revoked — the connection is dead and the user must reconnect.
    throw new FortnoxNotConnectedError(
      `Fortnox-anslutningen har gått ut, anslut igen. (${err instanceof Error ? err.message : 'okänt fel'})`
    )
  }
}

/**
 * Authenticated fetch against the Fortnox REST API. `path` is relative to
 * https://api.fortnox.se/3 (e.g. `/offers/123`). Retries once on 401 by
 * forcing a token refresh. Returns the raw Response (caller parses).
 */
export async function fortnoxFetch(
  path: string,
  init: RequestInit = {},
  { accept = 'application/json' }: { accept?: string } = {}
): Promise<Response> {
  const url = `${FORTNOX_API_BASE}${path}`

  const doFetch = (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: accept,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

  let token = await getValidAccessToken()
  let res = await doFetch(token)

  if (res.status === 401) {
    const conn = await getConnection()
    if (conn) {
      token = await refreshConnection(conn)
      res = await doFetch(token)
    }
  }
  return res
}

/** Parse a Fortnox JSON response, throwing a readable error on failure. */
export async function fortnoxJson<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fortnox ${context} misslyckades (${res.status}): ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}
