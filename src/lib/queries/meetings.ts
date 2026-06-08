import { createClient } from '@/lib/supabase/server'
import type { Meeting, MeetingActionPoint } from '@/lib/types/database'

export type MeetingWithEntity = Meeting & {
  entity_name: string
  entity_href: string
}

export type MeetingWithDetails = MeetingWithEntity & {
  action_points: MeetingActionPoint[]
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

export async function getMeetings(
  entityType: string,
  entityId: string
): Promise<Meeting[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('meeting_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getMeeting(id: string): Promise<MeetingWithDetails | null> {
  const supabase = await createClient()
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !meeting) return null

  let entity_name = 'Okänt'
  let entity_href = '#'
  if (meeting.entity_type === 'company') {
    const { data } = await supabase
      .from('companies')
      .select('name, is_reseller')
      .eq('id', meeting.entity_id)
      .single()
    entity_name = data?.name ?? 'Okänt'
    entity_href = companyHref(meeting.entity_id, data?.is_reseller ?? false)
  } else {
    const { data } = await supabase
      .from('prospects')
      .select('company_name, prospect_type')
      .eq('id', meeting.entity_id)
      .single()
    entity_name = data?.company_name ?? 'Okänt'
    entity_href = prospectHref(meeting.entity_id, data?.prospect_type ?? 'customer')
  }

  const { data: actionPoints } = await supabase
    .from('meeting_action_points')
    .select('*')
    .eq('meeting_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return {
    ...meeting,
    entity_name,
    entity_href,
    action_points: actionPoints ?? [],
  }
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
    if (m.entity_type === 'company') {
      const c = companyMap.get(m.entity_id)
      return {
        ...m,
        entity_name: c?.name ?? 'Okänt',
        entity_href: companyHref(m.entity_id, c?.is_reseller ?? false),
      }
    }
    const p = prospectMap.get(m.entity_id)
    return {
      ...m,
      entity_name: p?.company_name ?? 'Okänt',
      entity_href: prospectHref(m.entity_id, p?.prospect_type ?? 'customer'),
    }
  })
}
