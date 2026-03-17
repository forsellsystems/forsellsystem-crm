'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prospectSchema, type ProspectFormData } from '@/lib/validations'

export async function createProspect(data: ProspectFormData) {
  const validated = prospectSchema.parse(data)
  const supabase = await createClient()

  const { data: prospect, error } = await supabase
    .from('prospects')
    .insert({
      company_name: validated.company_name,
      factory_type: validated.factory_type,
      country: validated.country,
      contact_person: validated.contact_person || null,
      email: validated.email || null,
      phone: validated.phone || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa prospekt: ${error.message}`)
  revalidatePath('/prospekt')
  redirect(`/prospekt/${prospect.id}`)
}

export async function updateProspect(id: string, data: ProspectFormData) {
  const validated = prospectSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('prospects')
    .update({
      company_name: validated.company_name,
      factory_type: validated.factory_type,
      country: validated.country,
      contact_person: validated.contact_person || null,
      email: validated.email || null,
      phone: validated.phone || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera prospekt: ${error.message}`)
  revalidatePath(`/prospekt/${id}`)
  revalidatePath('/prospekt')
}

export async function archiveProspect(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('prospects')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte arkivera prospekt: ${error.message}`)
  revalidatePath(`/prospekt/${id}`)
  revalidatePath('/prospekt')
}
