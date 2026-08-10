import { NextResponse, type NextRequest } from 'next/server'
import { buildAuthorizationUrl } from '@/lib/microsoft/oauth'
import { microsoftConfigured, microsoftRedirectUri } from '@/lib/microsoft/config'

// Kicks off the OAuth2 flow: set a CSRF state cookie and redirect to Microsoft.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  if (!microsoftConfigured()) {
    return NextResponse.redirect(new URL('/installningar?microsoft=missing_config', origin))
  }

  const state = crypto.randomUUID()
  const redirectUri = microsoftRedirectUri(origin)
  const authUrl = buildAuthorizationUrl(redirectUri, state)

  const res = NextResponse.redirect(authUrl)
  res.cookies.set('microsoft_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min, matches the authorization code lifetime
  })
  return res
}
