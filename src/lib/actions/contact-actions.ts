'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { contactSchema, type ContactFormData } from '@/lib/validations'

export async function createContact(data: ContactFormData) {
  const validated = contactSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').insert({
    company_id: validated.company_id,
    name: validated.name,
    title: validated.title || null,
    email: validated.email || null,
    phone: validated.phone || null,
    is_primary: validated.is_primary,
  })

  if (error) throw new Error(`Kunde inte skapa kontakt: ${error.message}`)
  revalidatePath(`/foretag/${validated.company_id}`)
}

export async function updateContact(id: string, data: ContactFormData) {
  const validated = contactSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('contacts')
    .update({
      name: validated.name,
      title: validated.title || null,
      email: validated.email || null,
      phone: validated.phone || null,
      is_primary: validated.is_primary,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera kontakt: ${error.message}`)
  revalidatePath(`/foretag/${validated.company_id}`)
}

export async function deleteContact(id: string, companyId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort kontakt: ${error.message}`)
  revalidatePath(`/foretag/${companyId}`)
}
