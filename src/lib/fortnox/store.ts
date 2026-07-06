import { createClient } from '@/lib/supabase/server'
import type { FortnoxConnection } from './types'

// The Fortnox connection is a singleton row (one Fortnox account per CRM).
// All access goes through the authenticated server client (RLS authenticated-only).

export async function getConnection(): Promise<FortnoxConnection | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fortnox_connection')
    .select('*')
    .limit(1)
    .maybeSingle()
  return (data as FortnoxConnection | null) ?? null
}

export async function isConnected(): Promise<boolean> {
  return (await getConnection()) !== null
}

/** Insert or update the single connection row with a fresh token set. */
export async function saveConnection(fields: {
  access_token: string
  refresh_token: string
  expires_at: string
  scope?: string | null
  company_name?: string | null
  connected_by?: string | null
}): Promise<void> {
  const supabase = await createClient()
  const existing = await getConnection()

  if (existing) {
    const update: Record<string, unknown> = {
      access_token: fields.access_token,
      refresh_token: fields.refresh_token,
      expires_at: fields.expires_at,
      updated_at: new Date().toISOString(),
    }
    if (fields.scope !== undefined) update.scope = fields.scope
    if (fields.company_name !== undefined) update.company_name = fields.company_name
    if (fields.connected_by !== undefined) update.connected_by = fields.connected_by
    const { error } = await supabase
      .from('fortnox_connection')
      .update(update)
      .eq('id', existing.id)
    if (error) throw new Error(`Kunde inte spara Fortnox-anslutning: ${error.message}`)
  } else {
    const { error } = await supabase.from('fortnox_connection').insert({
      access_token: fields.access_token,
      refresh_token: fields.refresh_token,
      expires_at: fields.expires_at,
      scope: fields.scope ?? null,
      company_name: fields.company_name ?? null,
      connected_by: fields.connected_by ?? null,
    })
    if (error) throw new Error(`Kunde inte spara Fortnox-anslutning: ${error.message}`)
  }
}

/** Update only the rotating token set (used after a silent refresh). */
export async function updateTokens(
  id: string,
  fields: { access_token: string; refresh_token: string; expires_at: string; scope?: string | null }
): Promise<void> {
  const supabase = await createClient()
  const update: Record<string, unknown> = {
    access_token: fields.access_token,
    refresh_token: fields.refresh_token,
    expires_at: fields.expires_at,
    updated_at: new Date().toISOString(),
  }
  if (fields.scope !== undefined) update.scope = fields.scope
  const { error } = await supabase.from('fortnox_connection').update(update).eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera Fortnox-token: ${error.message}`)
}

export async function deleteConnection(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fortnox_connection')
    .delete()
    .not('id', 'is', null)
  if (error) throw new Error(`Kunde inte koppla från Fortnox: ${error.message}`)
}
