import { createAdminClient } from '@/lib/supabase/admin'
import type { MicrosoftConnection, MicrosoftConnectionStatus } from './types'

// One Microsoft connection per CRM user. Holds OAuth bearer secrets, so access
// goes through the service-role client only — microsoft_connection has NO
// authenticated RLS policy, so tokens are never readable from the browser.

export async function getConnection(userId: string): Promise<MicrosoftConnection | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('microsoft_connection')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as MicrosoftConnection | null) ?? null
}

/** Insert or update this user's connection with a fresh token set (+ optional account info). */
export async function saveConnection(
  userId: string,
  fields: {
    access_token: string
    refresh_token: string
    expires_at: string
    scope?: string | null
    account_email?: string | null
    account_name?: string | null
  }
): Promise<void> {
  const supabase = createAdminClient()
  const existing = await getConnection(userId)

  if (existing) {
    const update: Record<string, unknown> = {
      access_token: fields.access_token,
      refresh_token: fields.refresh_token,
      expires_at: fields.expires_at,
      updated_at: new Date().toISOString(),
    }
    if (fields.scope !== undefined) update.scope = fields.scope
    if (fields.account_email !== undefined) update.account_email = fields.account_email
    if (fields.account_name !== undefined) update.account_name = fields.account_name
    const { error } = await supabase
      .from('microsoft_connection')
      .update(update)
      .eq('id', existing.id)
    if (error) throw new Error(`Kunde inte spara Microsoft-anslutning: ${error.message}`)
  } else {
    const { error } = await supabase.from('microsoft_connection').insert({
      user_id: userId,
      access_token: fields.access_token,
      refresh_token: fields.refresh_token,
      expires_at: fields.expires_at,
      scope: fields.scope ?? null,
      account_email: fields.account_email ?? null,
      account_name: fields.account_name ?? null,
    })
    if (error) throw new Error(`Kunde inte spara Microsoft-anslutning: ${error.message}`)
  }
}

/** Update only the rotating token set (used after a silent refresh). */
export async function updateTokens(
  id: string,
  fields: { access_token: string; refresh_token: string; expires_at: string; scope?: string | null }
): Promise<void> {
  const supabase = createAdminClient()
  const update: Record<string, unknown> = {
    access_token: fields.access_token,
    refresh_token: fields.refresh_token,
    expires_at: fields.expires_at,
    updated_at: new Date().toISOString(),
  }
  if (fields.scope !== undefined) update.scope = fields.scope
  const { error } = await supabase.from('microsoft_connection').update(update).eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera Microsoft-token: ${error.message}`)
}

export async function deleteConnection(userId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('microsoft_connection').delete().eq('user_id', userId)
  if (error) throw new Error(`Kunde inte koppla från Microsoft: ${error.message}`)
}

/** Non-secret status for the UI (never returns tokens). */
export async function getConnectionStatus(userId: string): Promise<MicrosoftConnectionStatus> {
  const conn = await getConnection(userId)
  return {
    connected: conn !== null,
    accountEmail: conn?.account_email ?? null,
    accountName: conn?.account_name ?? null,
  }
}
