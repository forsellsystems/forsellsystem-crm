import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectMachine, ProjectSpec } from '@/lib/types/database'

export type ProjectWithEntity = Project & {
  entity_name: string
  entity_href: string
  // Agentprojekt beter sig annorlunda: agentens affärer har agenten som
  // reseller_id, inte som company_id.
  entity_is_reseller: boolean
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
      entity_is_reseller: company?.isReseller ?? false,
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
    entity_is_reseller: isReseller,
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

export type ProjectMachineRow = ProjectMachine & {
  machine_name: string
  machine_category: string
}

/** Produkterna som är aktuella för ett projekt, med maskinens namn. */
export async function getProjectMachines(projectId: string): Promise<ProjectMachineRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_machines')
    .select('*, machines!project_machines_machine_id_fkey(name, category)')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => {
    const m = row.machines as { name: string; category: string } | null
    return {
      ...(row as unknown as ProjectMachine),
      machine_name: m?.name ?? 'Okänd produkt',
      machine_category: m?.category ?? '',
    }
  })
}

/** Förutsättning plus vilka av projektets produkter den gäller. */
export type ProjectSpecRow = ProjectSpec & {
  project_machine_ids: string[]
}

/** Projektets förutsättningar, i den ordning de lagts in. */
export async function getProjectSpecs(projectId: string): Promise<ProjectSpecRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_specs')
    .select('*, project_spec_machines(project_machine_id)')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => {
    const tags = (row.project_spec_machines ?? []) as { project_machine_id: string }[]
    return {
      ...(row as unknown as ProjectSpec),
      project_spec_machines: undefined,
      project_machine_ids: tags.map((t) => t.project_machine_id),
    }
  }) as ProjectSpecRow[]
}
