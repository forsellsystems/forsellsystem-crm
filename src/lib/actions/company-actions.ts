'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { companySchema, type CompanyFormData } from '@/lib/validations'

export async function createCompany(data: CompanyFormData) {
  const validated = companySchema.parse(data)
  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      name: validated.name,
      customer_number: validated.customer_number || null,
      org_number: validated.org_number || null,
      factory_type: validated.factory_type || null,
      building_types: validated.building_types ?? [],
      country: validated.country,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      responsible_user_id: validated.responsible_user_id || null,
      is_reseller: validated.is_reseller,
      reseller_id: validated.reseller_id || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa företag: ${error.message}`)
  revalidatePath('/foretag')
  redirect(`/foretag/${company.id}`)
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('companies').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort: ${error.message}`)
  revalidatePath('/foretag')
  revalidatePath('/aterforsaljare')
}

export async function moveCompanyToProspect(companyId: string): Promise<string> {
  const supabase = await createClient()

  // 1. Fetch company data
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (fetchError || !company) throw new Error('Kunde inte hämta kund')

  // 2. Get primary contact info
  const { data: contacts } = await supabase
    .from('contacts')
    .select('name, email, phone')
    .eq('company_id', companyId)
    .eq('is_primary', true)
    .limit(1)

  const primaryContact = contacts?.[0]

  // 3. Create prospect
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .insert({
      company_name: company.name,
      factory_type: company.factory_type || 'modulfabrik',
      building_types: company.building_types ?? [],
      country: company.country,
      contact_person: primaryContact?.name || null,
      email: primaryContact?.email || company.email || null,
      phone: primaryContact?.phone || company.phone || null,
      website: company.website || null,
      description: company.description || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (prospectError || !prospect) throw new Error(`Kunde inte skapa prospekt: ${prospectError?.message}`)

  // 4. Copy notes from company to prospect
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('entity_type', 'company')
    .eq('entity_id', companyId)

  if (notes && notes.length > 0) {
    await supabase.from('notes').insert(
      notes.map((note) => ({
        entity_type: 'prospect' as const,
        entity_id: prospect.id,
        content: note.content,
        author_user_id: note.author_user_id,
        source_entity_type: 'company',
        source_entity_id: companyId,
      }))
    )
  }

  // 5. Delete company
  await supabase.from('companies').delete().eq('id', companyId)

  revalidatePath('/foretag')
  revalidatePath('/prospekt')

  return prospect.id
}

export async function updateCompanyFields(
  id: string,
  fields: Partial<Record<'name' | 'customer_number' | 'org_number' | 'factory_type' | 'country' | 'phone' | 'email' | 'website' | 'description', string | null> & { building_types: string[] }>
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
    .from('companies')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera företag: ${error.message}`)
  revalidatePath(`/foretag/${id}`)
  revalidatePath('/foretag')
}

export async function updateCompany(id: string, data: CompanyFormData) {
  const validated = companySchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({
      name: validated.name,
      customer_number: validated.customer_number || null,
      org_number: validated.org_number || null,
      factory_type: validated.factory_type || null,
      building_types: validated.building_types ?? [],
      country: validated.country,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      responsible_user_id: validated.responsible_user_id || null,
      is_reseller: validated.is_reseller,
      reseller_id: validated.reseller_id || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera företag: ${error.message}`)
  revalidatePath(`/foretag/${id}`)
  revalidatePath('/foretag')
}
