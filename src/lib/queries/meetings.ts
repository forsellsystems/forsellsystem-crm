import { createClient } from '@/lib/supabase/server'
import { PROJECT_TYPES } from '@/lib/constants'
import type { Meeting, Todo } from '@/lib/types/database'

export type MeetingWithEntity = Meeting & {
  entity_name: string
  entity_href: string | null
  deal_label?: string | null
  deal_href?: string | null
  project_label?: string | null
  project_href?: string | null
}

export type MeetingWithDetails = MeetingWithEntity & {
  action_points: Todo[]
}

// Resolve the correct detail-page href for a meeting's parent entity. Unlike
// projects, meetings live on all four entity surfaces, so we branch on
// is_reseller (companies) and prospect_type (prospects).
function companyHref(id: string, isReseller: boolean) {
  return isReseller ? `/aterforsaljare/${id}` : `/foretag/${id}`
}
function prospectHref(id: string, prospectType: string) {
  return prospectType === 'reseller' ? `/aterforsaljar-prospekt/${id}` : `/prospekt/${id}`
}

/** Möte plus namnet på projektet det hör till, när det finns ett. */
export type MeetingWithProject = Meeting & { project_name?: string | null }

export async function getMeetings(
  entityType: string,
  entityId: string
): Promise<MeetingWithProject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('meeting_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  const meetings = data ?? []

  // Ett möte som skapats på ett projekt ankras på projektets bolag, så det
  // hamnar här av sig självt. Hämta projektnamnet så det syns VILKET projekt.
  const projectIds = [...new Set(meetings.map((m) => m.project_id).filter(Boolean))]
  if (projectIds.length === 0) return meetings

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, project_type')
    .in('id', projectIds as string[])
  const nameById = new Map(
    (projects ?? []).map((p) => [
      p.id,
      p.name?.trim() || PROJECT_TYPES.find((t) => t.key === p.project_type)?.label || 'Projekt',
    ])
  )

  return meetings.map((m) => ({
    ...m,
    project_name: m.project_id ? nameById.get(m.project_id) ?? null : null,
  }))
}

export async function getMeeting(id: string): Promise<MeetingWithDetails | null> {
  const supabase = await createClient()
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !meeting) return null

  let entity_name = 'Internt'
  let entity_href: string | null = null
  if (meeting.entity_type === 'company' && meeting.entity_id) {
    const { data } = await supabase
      .from('companies')
      .select('name, is_reseller')
      .eq('id', meeting.entity_id)
      .single()
    entity_name = data?.name ?? 'Okänt'
    entity_href = companyHref(meeting.entity_id, data?.is_reseller ?? false)
  } else if (meeting.entity_type === 'prospect' && meeting.entity_id) {
    const { data } = await supabase
      .from('prospects')
      .select('company_name, prospect_type')
      .eq('id', meeting.entity_id)
      .single()
    entity_name = data?.company_name ?? 'Okänt'
    entity_href = prospectHref(meeting.entity_id, data?.prospect_type ?? 'customer')
  }

  // Optional deal/project links (for display on the meeting detail).
  let deal_label: string | null = null
  let deal_href: string | null = null
  if (meeting.deal_id) {
    const { data } = await supabase
      .from('deals')
      .select('quote_number')
      .eq('id', meeting.deal_id)
      .single()
    deal_label = data?.quote_number ? `Affär #${data.quote_number}` : 'Affär'
    deal_href = `/pipeline/${meeting.deal_id}`
  }
  let project_label: string | null = null
  let project_href: string | null = null
  if (meeting.project_id) {
    const { data } = await supabase
      .from('projects')
      .select('name, project_type')
      .eq('id', meeting.project_id)
      .single()
    project_label =
      data?.name?.trim() ||
      PROJECT_TYPES.find((t) => t.key === data?.project_type)?.label ||
      'Projekt'
    project_href = `/projekt/${meeting.project_id}`
  }

  const { data: actionPoints } = await supabase
    .from('todos')
    .select('*')
    .eq('meeting_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return {
    ...meeting,
    entity_name,
    entity_href,
    deal_label,
    deal_href,
    project_label,
    project_href,
    action_points: actionPoints ?? [],
  }
}


export async function getMeetingsForProject(projectId: string): Promise<Meeting[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('meeting_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAllMeetings(): Promise<MeetingWithEntity[]> {
  const supabase = await createClient()
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!meetings?.length) return []

  const [companiesRes, prospectsRes] = await Promise.all([
    supabase.from('companies').select('id, name, is_reseller'),
    supabase.from('prospects').select('id, company_name, prospect_type'),
  ])

  const companyMap = new Map(
    (companiesRes.data ?? []).map((c) => [c.id, c])
  )
  const prospectMap = new Map(
    (prospectsRes.data ?? []).map((p) => [p.id, p])
  )

  return meetings.map((m) => {
    if (m.entity_type === 'company' && m.entity_id) {
      const c = companyMap.get(m.entity_id)
      return {
        ...m,
        entity_name: c?.name ?? 'Okänt',
        entity_href: companyHref(m.entity_id, c?.is_reseller ?? false),
      }
    }
    if (m.entity_type === 'prospect' && m.entity_id) {
      const p = prospectMap.get(m.entity_id)
      return {
        ...m,
        entity_name: p?.company_name ?? 'Okänt',
        entity_href: prospectHref(m.entity_id, p?.prospect_type ?? 'customer'),
      }
    }
    return { ...m, entity_name: 'Internt', entity_href: null }
  })
}

// Upcoming (today and forward) meetings for the dashboard agenda, soonest first.
// Cancelled meetings are dropped in JS since .neq would also filter NULL status.
export async function getUpcomingMeetings(limit = 5): Promise<MeetingWithEntity[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .gte('meeting_date', today)
    .order('meeting_date', { ascending: true, nullsFirst: false })
    .order('meeting_time', { ascending: true, nullsFirst: false })

  if (error) throw error

  const upcoming = (meetings ?? [])
    .filter((m) => m.status !== 'installt')
    .slice(0, limit)
  if (!upcoming.length) return []

  const [companiesRes, prospectsRes] = await Promise.all([
    supabase.from('companies').select('id, name, is_reseller'),
    supabase.from('prospects').select('id, company_name, prospect_type'),
  ])
  const companyMap = new Map((companiesRes.data ?? []).map((c) => [c.id, c]))
  const prospectMap = new Map((prospectsRes.data ?? []).map((p) => [p.id, p]))

  return upcoming.map((m) => {
    if (m.entity_type === 'company' && m.entity_id) {
      const c = companyMap.get(m.entity_id)
      return {
        ...m,
        entity_name: c?.name ?? 'Okänt',
        entity_href: companyHref(m.entity_id, c?.is_reseller ?? false),
      }
    }
    if (m.entity_type === 'prospect' && m.entity_id) {
      const p = prospectMap.get(m.entity_id)
      return {
        ...m,
        entity_name: p?.company_name ?? 'Okänt',
        entity_href: prospectHref(m.entity_id, p?.prospect_type ?? 'customer'),
      }
    }
    return { ...m, entity_name: 'Internt', entity_href: null }
  })
}
