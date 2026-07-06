import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS and is the only role allowed to run
 * the user-management RPCs (create_user_with_password / update_user_password /
 * delete_auth_user), which are no longer executable by `authenticated`.
 *
 * SERVER ONLY — never import into a client component. Callers must gate access
 * themselves (see assertAdmin in user-actions.ts).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY saknas i miljön')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
