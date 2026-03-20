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
      factory_type: validated.factory_type || null,
      building_types: validated.building_types ?? [],
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
      factory_type: validated.factory_type || null,
      building_types: validated.building_types ?? [],
      country: validated.country,
      contact_person: validated.contact_person || null,
      email: validated.email || null,
      phone: validated.phone || null,
      description: validated.description || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera prospekt: ${error.message}`)
  revalidatePath(`/prospekt/${id}`)
  revalidatePath('/prospekt')
}

export async function updateProspectFields(
  id: string,
  fields: Partial<Record<'contact_person' | 'email' | 'phone' | 'website' | 'description' | 'factory_type' | 'country', string | null> & { building_types: string[] }>
) {
  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'building_types') {
      update[key] = value ?? []
    } else {
      update[key] = value || null
    }
  }

  const { error } = await supabase
    .from('prospects')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera prospekt: ${error.message}`)
  revalidatePath(`/prospekt/${id}`)
  revalidatePath('/prospekt')
}

export async function moveProspectToCompany(prospectId: string): Promise<string> {
  const supabase = await createClient()

  // 1. Fetch prospect data
  const { data: prospect, error: fetchError } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  if (fetchError || !prospect) throw new Error('Kunde inte hämta prospekt')

  // 2. Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: prospect.company_name,
      factory_type: prospect.factory_type,
      building_types: prospect.building_types ?? [],
      country: prospect.country,
      email: prospect.email || null,
      phone: prospect.phone || null,
      website: prospect.website || null,
      description: prospect.description || null,
      prospect_id: prospectId,
      is_reseller: false,
    })
    .select('id')
    .single()

  if (companyError || !company) throw new Error(`Kunde inte skapa kund: ${companyError?.message}`)

  // 3. Create contact if contact_person exists
  if (prospect.contact_person) {
    await supabase.from('contacts').insert({
      company_id: company.id,
      name: prospect.contact_person,
      email: prospect.email || null,
      phone: prospect.phone || null,
      is_primary: true,
    })
  }

  // 4. Copy notes from prospect to company
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('entity_type', 'prospect')
    .eq('entity_id', prospectId)

  if (notes && notes.length > 0) {
    await supabase.from('notes').insert(
      notes.map((note) => ({
        entity_type: 'company' as const,
        entity_id: company.id,
        content: note.content,
        author_user_id: note.author_user_id,
        source_entity_type: 'prospect',
        source_entity_id: prospectId,
      }))
    )
  }

  // 5. Mark prospect as converted
  await supabase
    .from('prospects')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
      converted_company_id: company.id,
    })
    .eq('id', prospectId)

  revalidatePath('/prospekt')
  revalidatePath(`/prospekt/${prospectId}`)
  revalidatePath('/foretag')

  return company.id
}

export async function deleteProspect(id: string) {
  const supabase = await createClient()

  // Delete related notes first
  await supabase
    .from('notes')
    .delete()
    .eq('entity_type', 'prospect')
    .eq('entity_id', id)

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Kunde inte radera prospekt: ${error.message}`)
  revalidatePath('/prospekt')
}
