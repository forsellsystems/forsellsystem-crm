'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prospectSchema, type ProspectFormData } from '@/lib/validations'
import { logActivity, deleteActivityForEntity } from '@/lib/actions/activity-actions'

export async function createProspect(data: ProspectFormData) {
  const validated = prospectSchema.parse(data)
  const supabase = await createClient()
  const prospectType = validated.prospect_type ?? 'customer'

  const { data: prospect, error } = await supabase
    .from('prospects')
    .insert({
      company_name: validated.company_name,
      prospect_type: prospectType,
      factory_type: validated.factory_type || null,
      building_types: validated.building_types ?? [],
      country: validated.country,
      contact_person: validated.contact_person || null,
      email: validated.email || null,
      phone: validated.phone || null,
      reseller_id: validated.reseller_id || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa prospekt: ${error.message}`)
  const basePath = prospectType === 'reseller' ? '/aterforsaljar-prospekt' : '/prospekt'

  await logActivity(supabase, {
    action: 'prospect_created',
    entity_type: 'prospect',
    entity_id: prospect.id,
    metadata: { label: validated.company_name, href: `${basePath}/${prospect.id}` },
  })

  revalidatePath(basePath)
  redirect(`${basePath}/${prospect.id}`)
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
      reseller_id: validated.reseller_id || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera prospekt: ${error.message}`)
  revalidatePath(`/prospekt/${id}`)
  revalidatePath('/prospekt')
  revalidatePath(`/aterforsaljar-prospekt/${id}`)
  revalidatePath('/aterforsaljar-prospekt')
}

export async function updateProspectFields(
  id: string,
  fields: Partial<Record<'contact_person' | 'email' | 'phone' | 'website' | 'description' | 'factory_type' | 'country' | 'reseller_id', string | null> & { building_types: string[] }>
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
  revalidatePath(`/aterforsaljar-prospekt/${id}`)
  revalidatePath('/aterforsaljar-prospekt')
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

  const isReseller = prospect.prospect_type === 'reseller'

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
      reseller_id: prospect.reseller_id || null,
      prospect_id: prospectId,
      is_reseller: isReseller,
    })
    .select('id')
    .single()

  if (companyError || !company) throw new Error(`Kunde inte skapa ${isReseller ? 'agent' : 'kund'}: ${companyError?.message}`)

  await logActivity(supabase, {
    action: 'company_created',
    entity_type: 'company',
    entity_id: company.id,
    metadata: {
      label: prospect.company_name,
      href: isReseller ? `/aterforsaljare/${company.id}` : `/foretag/${company.id}`,
    },
  })

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

  // 5. Copy projects from prospect to company
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('entity_type', 'prospect')
    .eq('entity_id', prospectId)

  if (projects && projects.length > 0) {
    await supabase.from('projects').insert(
      projects.map((project) => ({
        entity_type: 'company' as const,
        entity_id: company.id,
        name: project.name,
        project_type: project.project_type,
        status: project.status,
        description: project.description,
        value: project.value,
        value_unknown: project.value_unknown,
        currency: project.currency,
        contact_name: project.contact_name,
        contact_email: project.contact_email,
        contact_phone: project.contact_phone,
      }))
    )
  }

  // 6. Mark prospect as converted
  await supabase
    .from('prospects')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
      converted_company_id: company.id,
    })
    .eq('id', prospectId)

  const basePath = isReseller ? '/aterforsaljar-prospekt' : '/prospekt'
  revalidatePath(basePath)
  revalidatePath(`${basePath}/${prospectId}`)
  revalidatePath(isReseller ? '/aterforsaljare' : '/foretag')

  return company.id
}

export async function deleteProspect(id: string) {
  const supabase = await createClient()

  // Clean up child projects (their notes + activity), then the prospect's own notes + activity
  const { data: childProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('entity_type', 'prospect')
    .eq('entity_id', id)
  const projectIds = (childProjects ?? []).map((p) => p.id)
  if (projectIds.length > 0) {
    await supabase.from('notes').delete().eq('entity_type', 'project').in('entity_id', projectIds)
    await deleteActivityForEntity(supabase, 'project', projectIds)
  }

  await supabase
    .from('notes')
    .delete()
    .eq('entity_type', 'prospect')
    .eq('entity_id', id)

  await supabase
    .from('projects')
    .delete()
    .eq('entity_type', 'prospect')
    .eq('entity_id', id)

  await deleteActivityForEntity(supabase, 'prospect', id)

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Kunde inte radera prospekt: ${error.message}`)
  revalidatePath('/prospekt')
  revalidatePath('/aterforsaljar-prospekt')
}
