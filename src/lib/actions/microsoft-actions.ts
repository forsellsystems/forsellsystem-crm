'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/actions/activity-actions'
import { deleteConnection } from '@/lib/microsoft/store'

// Disconnect the signed-in user's own Microsoft mailbox/calendar connection.
export async function disconnectMicrosoft(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId(supabase)
    if (!userId) return { ok: false, error: 'Ingen inloggad användare.' }
    await deleteConnection(userId)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Något gick fel' }
  }
}
