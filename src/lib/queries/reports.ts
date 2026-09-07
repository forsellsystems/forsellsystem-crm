import { createClient } from '@/lib/supabase/server'
import type { ProspectReport } from '@/lib/types/database'

export type ReportListRow = ProspectReport & {
  /** Vart triageringen ledde, när rapporten är hanterad. */
  linked_name: string | null
  linked_href: string | null
}

async function withLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ProspectReport[]
): Promise<ReportListRow[]> {
  const prospectIds = rows.map((r) => r.prospect_id).filter((v): v is string => Boolean(v))
  const companyIds = rows.map((r) => r.company_id).filter((v): v is string => Boolean(v))

  const [prospects, companies] = await Promise.all([
    prospectIds.length
      ? supabase
          .from('prospects')
          .select('id, company_name, prospect_type')
          .in('id', prospectIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string; prospect_type: string }[] }),
    companyIds.length
      ? supabase.from('companies').select('id, name, is_reseller').in('id', companyIds)
      : Promise.resolve({ data: [] as { id: string; name: string; is_reseller: boolean }[] }),
  ])

  const pById = new Map((prospects.data ?? []).map((p) => [p.id, p]))
  const cById = new Map((companies.data ?? []).map((c) => [c.id, c]))

  return rows.map((r) => {
    if (r.prospect_id) {
      const p = pById.get(r.prospect_id)
      if (p) {
        const base = p.prospect_type === 'reseller' ? '/aterforsaljar-prospekt' : '/prospekt'
        return { ...r, linked_name: p.company_name, linked_href: `${base}/${p.id}` }
      }
    }
    if (r.company_id) {
      const c = cById.get(r.company_id)
      if (c) {
        const base = c.is_reseller ? '/aterforsaljare' : '/foretag'
        return { ...r, linked_name: c.name, linked_href: `${base}/${c.id}` }
      }
    }
    return { ...r, linked_name: null, linked_href: null }
  })
}

export async function getReports(): Promise<ReportListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospect_reports')
    .select('*')
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return withLinks(supabase, (data ?? []) as ProspectReport[])
}

export async function getReport(id: string): Promise<ReportListRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospect_reports')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const [row] = await withLinks(supabase, [data as ProspectReport])
  return row
}

/** Hur många otriagerade rapporter som väntar — badgen i menyn. */
export async function getNewReportCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('prospect_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ny')

  if (error) return 0
  return count ?? 0
}
