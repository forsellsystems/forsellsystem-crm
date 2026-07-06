import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/fortnox/oauth'
import { fortnoxRedirectUri } from '@/lib/fortnox/config'
import { saveConnection } from '@/lib/fortnox/store'
import { getCompanyName } from '@/lib/fortnox/offers'
import { createClient } from '@/lib/supabase/server'

// OAuth2 redirect target: validate state, exchange the code for tokens, persist.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const settings = (status: string) =>
    NextResponse.redirect(new URL(`/installningar?fortnox=${status}`, origin))

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  if (oauthError) return settings('denied')

  const savedState = request.cookies.get('fortnox_oauth_state')?.value
  if (!code || !state || !savedState || state !== savedState) {
    return settings('state_mismatch')
  }

  try {
    const tokens = await exchangeCodeForTokens(code, fortnoxRedirectUri(origin))
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Who connected it (best-effort — maps the auth user to public.users).
    let connectedBy: string | null = null
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: row } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle()
      connectedBy = row?.id ?? null
    }

    await saveConnection({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      connected_by: connectedBy,
    })

    // Enrich with the connected company's name (best-effort).
    const companyName = await getCompanyName().catch(() => null)
    if (companyName) {
      await saveConnection({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        company_name: companyName,
      })
    }

    const res = settings('connected')
    res.cookies.delete('fortnox_oauth_state')
    return res
  } catch (err) {
    console.error('Fortnox callback failed:', err)
    return settings('error')
  }
}
