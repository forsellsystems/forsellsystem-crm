import { createClient } from '@/lib/supabase/server'

export type ActivityLogEntry = {
  id: string
  action: string
  entity_type: string
  entity_id: string
  metadata: {
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
  user_name: string | null
  created_at: string
}

export async function getActivityLog(limit = 100): Promise<ActivityLogEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, users!activity_log_user_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: (row.metadata ?? {}) as ActivityLogEntry['metadata'],
    user_name: (row.users as { name: string } | null)?.name ?? null,
    created_at: row.created_at,
  }))
}
