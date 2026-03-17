'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createReseller(data: { name: string; country: string; email?: string; phone?: string }) {
  const supabase = await createClient()

  const { error } = await supabase.from('companies').insert({
    name: data.name,
    country: data.country || 'Sverige',
    email: data.email || null,
    phone: data.phone || null,
    is_reseller: true,
  })

  if (error) throw new Error(`Kunde inte skapa återförsäljare: ${error.message}`)
  revalidatePath('/aterforsaljare')
  revalidatePath('/pipeline')
}

export async function removeReseller(companyId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({ is_reseller: false })
    .eq('id', companyId)

  if (error) throw new Error(`Kunde inte ta bort återförsäljare: ${error.message}`)
  revalidatePath('/aterforsaljare')
  revalidatePath('/pipeline')
}
