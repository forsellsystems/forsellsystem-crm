import {
  FORTNOX_AUTH_URL,
  FORTNOX_TOKEN_URL,
  FORTNOX_CLIENT_ID,
  FORTNOX_CLIENT_SECRET,
  FORTNOX_SCOPES,
} from './config'
import type { FortnoxTokenResponse } from './types'

function basicAuthHeader(): string {
  const creds = `${FORTNOX_CLIENT_ID}:${FORTNOX_CLIENT_SECRET}`
  return `Basic ${Buffer.from(creds).toString('base64')}`
}

/** Build the Fortnox authorization URL the user is redirected to (step 1). */
export function buildAuthorizationUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: FORTNOX_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: FORTNOX_SCOPES.join(' '),
    state,
    access_type: 'offline', // required to receive a refresh token
    response_type: 'code',
  })
  return `${FORTNOX_AUTH_URL}?${params.toString()}`
}

/** Exchange the authorization code for an access + refresh token (step 2). */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<FortnoxTokenResponse> {
  const res = await fetch(FORTNOX_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fortnox token-utbyte misslyckades (${res.status}): ${text}`)
  }
  return (await res.json()) as FortnoxTokenResponse
}

/** Trade the (rotating) refresh token for a fresh access + refresh token. */
export async function refreshAccessToken(
  refreshToken: string
): Promise<FortnoxTokenResponse> {
  const res = await fetch(FORTNOX_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fortnox token-refresh misslyckades (${res.status}): ${text}`)
  }
  return (await res.json()) as FortnoxTokenResponse
}
