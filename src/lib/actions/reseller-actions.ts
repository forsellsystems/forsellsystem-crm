'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createReseller(data: {
  name: string
  country: string
  email?: string
  phone?: string
  org_number?: string
  fortnox_customer_id?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('companies').insert({
    name: data.name,
    country: data.country || 'Sverige',
    email: data.email || null,
    phone: data.phone || null,
    org_number: data.org_number || null,
    fortnox_customer_id: data.fortnox_customer_id || null,
    is_reseller: true,
  })

  if (error) {
    // Unikt index: någon hann koppla samma Fortnox-kund medan dialogen var öppen.
    if (error.code === '23505' && error.message.includes('fortnox_customer_id')) {
      throw new Error(
        `Fortnox-kund ${data.fortnox_customer_id} är redan kopplad till ett annat bolag.`
      )
    }
    throw new Error(`Kunde inte skapa agent: ${error.message}`)
  }
  revalidatePath('/aterforsaljare')
  revalidatePath('/pipeline')
}

export async function removeReseller(companyId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({ is_reseller: false })
    .eq('id', companyId)

  if (error) throw new Error(`Kunde inte ta bort agent: ${error.message}`)
  revalidatePath('/aterforsaljare')
  revalidatePath('/pipeline')
}
