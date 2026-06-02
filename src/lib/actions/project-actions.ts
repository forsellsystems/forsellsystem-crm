'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { projectSchema, type ProjectFormData } from '@/lib/validations'
import { logActivity, deleteActivityForEntity } from '@/lib/actions/activity-actions'

const entityPathMap: Record<string, string> = {
  prospect: '/prospekt',
  company: '/foretag',
}

function revalidateEntity(entityType: string, entityId: string) {
  const basePath = entityPathMap[entityType] ?? ''
  if (basePath) revalidatePath(`${basePath}/${entityId}`)
  revalidatePath('/projekt')
}

export async function createProject(data: ProjectFormData): Promise<string> {
  const validated = projectSchema.parse(data)
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      entity_type: validated.entity_type,
      entity_id: validated.entity_id,
      name: validated.name || null,
      project_type: validated.project_type || null,
      status: validated.status || null,
      description: validated.description || null,
      value: validated.value_unknown ? null : (validated.value ?? null),
      value_unknown: validated.value_unknown ?? false,
      currency: validated.currency || 'SEK',
      contact_name: validated.contact_name || null,
      contact_email: validated.contact_email || null,
      contact_phone: validated.contact_phone || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa projekt: ${error.message}`)

  // Resolve the parent bolag's name for a readable log label (projects start blank)
  let parentName = ''
  if (validated.entity_type === 'company') {
    const { data } = await supabase.from('companies').select('name').eq('id', validated.entity_id).single()
    parentName = data?.name ?? ''
  } else {
    const { data } = await supabase.from('prospects').select('company_name').eq('id', validated.entity_id).single()
    parentName = data?.company_name ?? ''
  }
  await logActivity(supabase, {
    action: 'project_created',
    entity_type: 'project',
    entity_id: project.id,
    metadata: { label: parentName, href: `/projekt/${project.id}` },
  })

  revalidateEntity(validated.entity_type, validated.entity_id)
  return project.id
}

export async function updateProject(
  id: string,
  entityType: string,
  entityId: string,
  fields: Partial<
    Record<
      'name' | 'project_type' | 'status' | 'description' | 'currency'
        | 'contact_name' | 'contact_email' | 'contact_phone',
      string | null
    > & {
      value: number | null
      value_unknown: boolean
    }
  >
) {
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'value') {
      update[key] = value === '' || value === undefined ? null : value
    } else if (key === 'value_unknown') {
      update[key] = !!value
    } else {
      update[key] = value || null
    }
  }

  const { error } = await supabase.from('projects').update(update).eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera projekt: ${error.message}`)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/projekt/${id}`)
}

export async function deleteProject(
  id: string,
  entityType: string,
  entityId: string
) {
  const supabase = await createClient()

  // Delete the project's notes + activity log first
  await supabase
    .from('notes')
    .delete()
    .eq('entity_type', 'project')
    .eq('entity_id', id)
  await deleteActivityForEntity(supabase, 'project', id)

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort projekt: ${error.message}`)
  revalidateEntity(entityType, entityId)
  revalidatePath(`/projekt/${id}`)
}
