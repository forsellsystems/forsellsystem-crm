'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { contactSchema, type ContactFormData } from '@/lib/validations'

// Kontakter hänger på ett bolag eller ett prospekt, aldrig båda. Prospektens
// kontakter följer med när prospektet flyttas till kund.
function ownerOf(v: { company_id?: string; prospect_id?: string }) {
  if (v.prospect_id) return { prospect_id: v.prospect_id, company_id: null }
  if (v.company_id) return { company_id: v.company_id, prospect_id: null }
  throw new Error('Kontakten behöver ett bolag eller ett prospekt.')
}

function revalidateOwner(v: { company_id?: string | null; prospect_id?: string | null }) {
  if (v.prospect_id) {
    revalidatePath(`/prospekt/${v.prospect_id}`)
    revalidatePath(`/aterforsaljar-prospekt/${v.prospect_id}`)
  }
  if (v.company_id) {
    revalidatePath(`/foretag/${v.company_id}`)
    revalidatePath(`/aterforsaljare/${v.company_id}`)
  }
}

export async function createContact(data: ContactFormData) {
  const validated = contactSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').insert({
    ...ownerOf(validated),
    name: validated.name,
    title: validated.title || null,
    email: validated.email || null,
    phone: validated.phone || null,
    is_primary: validated.is_primary,
  })

  if (error) throw new Error(`Kunde inte skapa kontakt: ${error.message}`)
  revalidateOwner(validated)
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
  revalidateOwner(validated)
}

export async function deleteContact(
  id: string,
  owner: { company_id?: string; prospect_id?: string }
) {
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort kontakt: ${error.message}`)
  revalidateOwner(owner)
}
