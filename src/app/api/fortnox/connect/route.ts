import { NextResponse, type NextRequest } from 'next/server'
import { buildAuthorizationUrl } from '@/lib/fortnox/oauth'
import { fortnoxConfigured, fortnoxRedirectUri } from '@/lib/fortnox/config'

// Kicks off the OAuth2 flow: set a CSRF state cookie and redirect to Fortnox.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  if (!fortnoxConfigured()) {
    return NextResponse.redirect(new URL('/installningar?fortnox=missing_config', origin))
  }

  const state = crypto.randomUUID()
  const redirectUri = fortnoxRedirectUri(origin)
  const authUrl = buildAuthorizationUrl(redirectUri, state)

  const res = NextResponse.redirect(authUrl)
  res.cookies.set('fortnox_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min, matches the authorization code lifetime
  })
  return res
}
