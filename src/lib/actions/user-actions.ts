'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { userSchema, type UserFormData } from '@/lib/validations'

// User management is admin-only. The RPCs are no longer callable by the
// `authenticated` role (revoked) — they run via the service-role client — so
// this app-layer check is the authorization gate. Throws unless the caller is
// a logged-in, active admin.
async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Inte inloggad')

  const { data: me } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!me || me.role !== 'admin' || !me.is_active) {
    throw new Error('Endast administratörer får hantera användare')
  }
}

export async function createUser(data: UserFormData) {
  const validated = userSchema.parse(data)
  await assertAdmin()

  if (!validated.password) {
    throw new Error('Lösenord krävs för nya användare')
  }

  // Create auth user + public user atomically via the service-role client.
  const admin = createAdminClient()
  const { error } = await admin.rpc('create_user_with_password', {
    p_name: validated.name,
    p_email: validated.email,
    p_password: validated.password,
    p_role: validated.role,
  })

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('E-postadressen används redan')
    }
    throw new Error(`Kunde inte skapa användare: ${error.message}`)
  }

  revalidatePath('/installningar')
}

export async function updateUser(id: string, data: UserFormData) {
  const validated = userSchema.parse(data)
  await assertAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({
      name: validated.name,
      email: validated.email,
      role: validated.role,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') throw new Error('E-postadressen används redan')
    throw new Error(`Kunde inte uppdatera användare: ${error.message}`)
  }

  // Update password if provided (service-role RPC).
  if (validated.password) {
    const { data: user } = await supabase
      .from('users')
      .select('auth_id')
      .eq('id', id)
      .single()

    if (user?.auth_id) {
      const admin = createAdminClient()
      const { error: pwError } = await admin.rpc('update_user_password', {
        p_auth_id: user.auth_id,
        p_new_password: validated.password,
      })
      if (pwError) throw new Error(`Kunde inte byta lösenord: ${pwError.message}`)
    }
  }

  revalidatePath('/installningar')
}

export async function deleteUser(id: string) {
  await assertAdmin()
  const supabase = await createClient()

  // Get auth_id before deleting
  const { data: user } = await supabase
    .from('users')
    .select('auth_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort användare: ${error.message}`)

  // Delete the auth user too (service-role RPC).
  if (user?.auth_id) {
    const admin = createAdminClient()
    await admin.rpc('delete_auth_user', { p_auth_id: user.auth_id })
  }

  revalidatePath('/installningar')
}
