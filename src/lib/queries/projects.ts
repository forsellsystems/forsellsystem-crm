import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types/database'

export type ProjectWithEntity = Project & {
  entity_name: string
  entity_href: string
}

export async function getAllProjects(): Promise<ProjectWithEntity[]> {
  const supabase = await createClient()
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!projects?.length) return []

  const [companiesRes, prospectsRes] = await Promise.all([
    // is_reseller behövs för länken: agenter bor på /aterforsaljare, inte /foretag.
    supabase.from('companies').select('id, name, is_reseller'),
    supabase.from('prospects').select('id, company_name'),
  ])

  const companyMap = new Map(
    (companiesRes.data ?? []).map((c) => [c.id, { name: c.name, isReseller: c.is_reseller }])
  )
  const prospectMap = new Map(
    (prospectsRes.data ?? []).map((p) => [p.id, p.company_name])
  )

  return projects.map((p) => {
    const company = p.entity_type === 'company' ? companyMap.get(p.entity_id) : undefined
    return {
      ...p,
      entity_name:
        (p.entity_type === 'company' ? company?.name : prospectMap.get(p.entity_id)) ?? 'Okänt',
      entity_href:
        p.entity_type === 'company'
          ? `${company?.isReseller ? '/aterforsaljare' : '/foretag'}/${p.entity_id}`
          : `/prospekt/${p.entity_id}`,
    }
  })
}

export async function getProject(id: string): Promise<ProjectWithEntity | null> {
  const supabase = await createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) return null

  let entity_name = 'Okänt'
  let isReseller = false
  if (project.entity_type === 'company') {
    const { data } = await supabase
      .from('companies')
      .select('name, is_reseller')
      .eq('id', project.entity_id)
      .single()
    entity_name = data?.name ?? 'Okänt'
    isReseller = data?.is_reseller ?? false
  } else {
    const { data } = await supabase
      .from('prospects')
      .select('company_name')
      .eq('id', project.entity_id)
      .single()
    entity_name = data?.company_name ?? 'Okänt'
  }

  return {
    ...project,
    entity_name,
    entity_href:
      project.entity_type === 'company'
        ? `${isReseller ? '/aterforsaljare' : '/foretag'}/${project.entity_id}`
        : `/prospekt/${project.entity_id}`,
  }
}

export async function getProjects(
  entityType: string,
  entityId: string
): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
