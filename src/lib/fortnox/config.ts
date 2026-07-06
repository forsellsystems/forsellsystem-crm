// Fortnox integration config.
//
// OAuth2 Authorization Code flow (the legacy fixed access-token auth was fully
// deprecated 2025-04-30). Access token lives 1h; refresh token lives 45 days and
// ROTATES on every refresh — the old one is invalidated, so we must persist the
// new refresh token each time (see lib/fortnox/client.ts).
//
// Setup (see also the connect flow at /api/fortnox/connect):
// 1. Register an integration in the Fortnox Developer Portal
// 2. Register redirect URI(s): <origin>/api/fortnox/callback
//    (e.g. http://localhost:3000/api/fortnox/callback + the prod URL)
// 3. Request scopes: companyinformation + offer
// 4. Put FORTNOX_CLIENT_ID + FORTNOX_CLIENT_SECRET in the environment

export const FORTNOX_AUTH_URL = 'https://apps.fortnox.se/oauth-v1/auth'
export const FORTNOX_TOKEN_URL = 'https://apps.fortnox.se/oauth-v1/token'
export const FORTNOX_API_BASE = 'https://api.fortnox.se/3'

// Scopes we request. `offer` = read/write offers (offerter),
// `companyinformation` = read the connected company's name (connection check).
export const FORTNOX_SCOPES = ['companyinformation', 'offer'] as const

export const FORTNOX_CLIENT_ID = process.env.FORTNOX_CLIENT_ID ?? ''
export const FORTNOX_CLIENT_SECRET = process.env.FORTNOX_CLIENT_SECRET ?? ''

// Whether the app is configured to talk to Fortnox at all (credentials present).
export function fortnoxConfigured(): boolean {
  return Boolean(FORTNOX_CLIENT_ID && FORTNOX_CLIENT_SECRET)
}

// The redirect URI must match exactly what is registered in Fortnox. We derive it
// from the incoming request origin so the same code works on localhost and prod
// (both must be registered in the Developer Portal). An explicit override wins.
export function fortnoxRedirectUri(origin: string): string {
  return process.env.FORTNOX_REDIRECT_URI || `${origin}/api/fortnox/callback`
}
