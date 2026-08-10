import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/microsoft/oauth'
import { microsoftRedirectUri } from '@/lib/microsoft/config'
import { saveConnection } from '@/lib/microsoft/store'
import { getMe } from '@/lib/microsoft/graph'
import { createClient } from '@/lib/supabase/server'

// OAuth2 redirect target: validate state, resolve the logged-in CRM user, exchange
// the code for tokens, persist under that user, enrich with the mailbox address.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const settings = (status: string) =>
    NextResponse.redirect(new URL(`/installningar?microsoft=${status}`, origin))

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  if (oauthError) return settings('denied')

  const savedState = request.cookies.get('microsoft_oauth_state')?.value
  if (!code || !state || !savedState || state !== savedState) {
    return settings('state_mismatch')
  }

  try {
    // The connection belongs to the signed-in CRM user (delegated "my mailbox").
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return settings('not_logged_in')

    const { data: row } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    const userId = row?.id
    if (!userId) return settings('no_user')

    const tokens = await exchangeCodeForTokens(code, microsoftRedirectUri(origin))
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await saveConnection(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
    })

    // Enrich with the connected mailbox address (best-effort).
    const me = await getMe(userId).catch(() => null)
    if (me) {
      await saveConnection(userId, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        account_email: me.mail ?? me.userPrincipalName ?? null,
        account_name: me.displayName ?? null,
      })
    }

    const res = settings('connected')
    res.cookies.delete('microsoft_oauth_state')
    return res
  } catch (err) {
    console.error('Microsoft callback failed:', err)
    return settings('error')
  }
}
