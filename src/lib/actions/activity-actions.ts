import type { createClient } from '@/lib/supabase/server'

type DbClient = Awaited<ReturnType<typeof createClient>>

export type ActivityMetadata = {
  label?: string
  href?: string
  snippet?: string
  from?: string
  to?: string
  ai?: {
    kind: string
    person: string | null
    summary: string
  }
}

/** Resolve the current public.users.id from the authenticated session (via auth_id). */
export async function getCurrentUserId(supabase: DbClient): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

/**
 * Write an audit row to activity_log. Best-effort — never throws, so it can't
 * break the surrounding action. Snapshots a readable label/href in metadata.
 */
export async function logActivity(
  supabase: DbClient,
  params: {
    action: string
    entity_type: string
    entity_id: string
    metadata?: ActivityMetadata
  }
): Promise<void> {
  try {
    const userId = await getCurrentUserId(supabase)
    await supabase.from('activity_log').insert({
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      metadata: params.metadata ?? {},
      user_id: userId,
    })
  } catch (err) {
    console.error('logActivity failed:', err)
  }
}

/**
 * Remove activity_log rows for an entity (e.g. when it's deleted), so the log
 * doesn't reference things that no longer exist. Best-effort.
 */
export async function deleteActivityForEntity(
  supabase: DbClient,
  entityType: string,
  entityIds: string | string[]
): Promise<void> {
  try {
    const ids = Array.isArray(entityIds) ? entityIds : [entityIds]
    if (ids.length === 0) return
    await supabase.from('activity_log').delete().eq('entity_type', entityType).in('entity_id', ids)
  } catch (err) {
    console.error('deleteActivityForEntity failed:', err)
  }
}
