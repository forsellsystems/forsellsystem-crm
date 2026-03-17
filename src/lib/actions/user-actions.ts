'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { userSchema, type UserFormData } from '@/lib/validations'

export async function createUser(data: UserFormData) {
  const validated = userSchema.parse(data)
  const supabase = await createClient()

  if (!validated.password) {
    throw new Error('Lösenord krävs för nya användare')
  }

  // Use RPC to create auth user + public user atomically
  const { data: result, error } = await supabase.rpc('create_user_with_password', {
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

  // Update password if provided
  if (validated.password) {
    const { data: user } = await supabase
      .from('users')
      .select('auth_id')
      .eq('id', id)
      .single()

    if (user?.auth_id) {
      // Update password via direct SQL (admin operation)
      await supabase.rpc('update_user_password', {
        p_auth_id: user.auth_id,
        p_new_password: validated.password,
      })
    }
  }

  revalidatePath('/installningar')
}

export async function deleteUser(id: string) {
  const supabase = await createClient()

  // Get auth_id before deleting
  const { data: user } = await supabase
    .from('users')
    .select('auth_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort användare: ${error.message}`)

  // Delete auth user too
  if (user?.auth_id) {
    await supabase.rpc('delete_auth_user', { p_auth_id: user.auth_id })
  }

  revalidatePath('/installningar')
}
