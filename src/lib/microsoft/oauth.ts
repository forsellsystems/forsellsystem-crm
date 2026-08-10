import {
  MICROSOFT_AUTH_URL,
  MICROSOFT_TOKEN_URL,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_SCOPES,
} from './config'
import type { MicrosoftTokenResponse } from './types'

const SCOPE = MICROSOFT_SCOPES.join(' ')

/** Build the Entra authorization URL the user is redirected to (step 1). */
export function buildAuthorizationUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPE,
    state,
  })
  return `${MICROSOFT_AUTH_URL}?${params.toString()}`
}

/** Exchange the authorization code for an access + refresh token (step 2). */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<MicrosoftTokenResponse> {
  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      scope: SCOPE,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Microsoft token-utbyte misslyckades (${res.status}): ${text}`)
  }
  return (await res.json()) as MicrosoftTokenResponse
}

/** Trade the (rotating) refresh token for a fresh access + refresh token. */
export async function refreshAccessToken(
  refreshToken: string
): Promise<MicrosoftTokenResponse> {
  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPE,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Microsoft token-refresh misslyckades (${res.status}): ${text}`)
  }
  return (await res.json()) as MicrosoftTokenResponse
}
