import { createClient } from '@/lib/supabase/server'
import type { Todo } from '@/lib/types/database'

export type TodoWithEntity = Todo & {
  entity_name: string | null
  entity_href: string | null
  source_href: string | null
}

function companyHref(id: string, isReseller: boolean) {
  return isReseller ? `/aterforsaljare/${id}` : `/foretag/${id}`
}
function prospectHref(id: string, prospectType: string) {
  return prospectType === 'reseller' ? `/aterforsaljar-prospekt/${id}` : `/prospekt/${id}`
}

export async function getAllTodos(opts?: { showDone?: boolean }): Promise<TodoWithEntity[]> {
  const supabase = await createClient()

  let query = supabase.from('todos').select('*')
  if (!opts?.showDone) query = query.eq('done', false)
  query = query
    .order('done', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const { data: todos, error } = await query
  if (error) throw error
  if (!todos?.length) return []

  const [companiesRes, prospectsRes, dealsRes, projectsRes] = await Promise.all([
    supabase.from('companies').select('id, name, is_reseller'),
    supabase.from('prospects').select('id, company_name, prospect_type'),
    supabase.from('deals').select('id, quote_number, companies!deals_company_id_fkey(name)'),
    supabase.from('projects').select('id, name'),
  ])

  const companyMap = new Map((companiesRes.data ?? []).map((c) => [c.id, c]))
  const prospectMap = new Map((prospectsRes.data ?? []).map((p) => [p.id, p]))
  const dealMap = new Map((dealsRes.data ?? []).map((d) => [d.id, d]))
  const projectMap = new Map((projectsRes.data ?? []).map((p) => [p.id, p]))

  return todos.map((t) => {
    let entity_name: string | null = null
    let entity_href: string | null = null

    if (t.entity_type === 'company' && t.entity_id) {
      const c = companyMap.get(t.entity_id)
      entity_name = c?.name ?? 'Okänt'
      entity_href = companyHref(t.entity_id, c?.is_reseller ?? false)
    } else if (t.entity_type === 'prospect' && t.entity_id) {
      const p = prospectMap.get(t.entity_id)
      entity_name = p?.company_name ?? 'Okänt'
      entity_href = prospectHref(t.entity_id, p?.prospect_type ?? 'customer')
    } else if (t.entity_type === 'deal' && t.entity_id) {
      const d = dealMap.get(t.entity_id)
      const companyName = (d?.companies as unknown as { name: string } | null)?.name
      entity_name = d?.quote_number || companyName || 'Affär'
      entity_href = `/pipeline/${t.entity_id}`
    } else if (t.entity_type === 'project' && t.entity_id) {
      const p = projectMap.get(t.entity_id)
      entity_name = p?.name || 'Projekt'
      entity_href = `/projekt/${t.entity_id}`
    }

    return {
      ...t,
      entity_name,
      entity_href,
      source_href: t.meeting_id ? `/moten/${t.meeting_id}` : null,
    }
  })
}
