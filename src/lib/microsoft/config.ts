// Microsoft 365 (Graph) integration config.
//
// OAuth2 Authorization Code flow against Entra ID (Azure AD), per user — each CRM
// user connects their own mailbox/calendar (delegated permissions). Access token
// lives ~1h; refresh token rotates and lives ~90 days (offline_access scope).
//
// Setup (Entra admin center → Appregistreringar):
// 1. Register an app (single tenant), redirect URI <origin>/api/microsoft/callback
//    (e.g. http://localhost:3000/api/microsoft/callback + the prod URL)
// 2. Delegated Microsoft Graph permissions: Mail.Read, Calendars.Read,
//    offline_access, User.Read  →  Grant admin consent
// 3. Put MICROSOFT_CLIENT_ID + MICROSOFT_TENANT_ID + MICROSOFT_CLIENT_SECRET in env

export const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID ?? ''
export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID ?? ''
export const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET ?? ''

const AUTHORITY = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID || 'common'}`
export const MICROSOFT_AUTH_URL = `${AUTHORITY}/oauth2/v2.0/authorize`
export const MICROSOFT_TOKEN_URL = `${AUTHORITY}/oauth2/v2.0/token`
export const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'

// Delegated scopes. offline_access = refresh token; Mail.Read/Calendars.Read =
// read the signed-in user's mail + calendar; User.Read = read their profile.
// (Switch Calendars.Read → Calendars.ReadWrite to also create Outlook events.)
export const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Calendars.Read',
] as const

// Whether the app is configured to talk to Microsoft at all (credentials present).
export function microsoftConfigured(): boolean {
  return Boolean(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET && MICROSOFT_TENANT_ID)
}

// Redirect URI must match exactly what is registered in Entra. Derived from the
// request origin so the same code works on localhost and prod (both registered).
export function microsoftRedirectUri(origin: string): string {
  return process.env.MICROSOFT_REDIRECT_URI || `${origin}/api/microsoft/callback`
}
