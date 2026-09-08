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

export async function getReports(
  reportType: 'customer' | 'reseller'
): Promise<ReportListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospect_reports')
    .select('*')
    .eq('report_type', reportType)
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

/** Otriagerade per spår — siffrorna på flikarna. */
export async function getNewReportCounts(): Promise<{ customer: number; reseller: number }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospect_reports')
    .select('report_type')
    .eq('status', 'ny')

  if (error) return { customer: 0, reseller: 0 }
  const rows = data ?? []
  return {
    customer: rows.filter((r) => r.report_type === 'customer').length,
    reseller: rows.filter((r) => r.report_type === 'reseller').length,
  }
}

/**
 * Vilken prospektrapport bolaget kom ur, om någon.
 *
 * Kopplingen pekar alltid på NULÄGET: så länge bolaget är ett prospekt ligger
 * den på prospektet, och blir det kund flyttar den med till kunden. Därför
 * räcker det att fråga på den entitet man står på.
 */
export async function getReportOrigin(
  kind: 'prospect' | 'company',
  entityId: string
): Promise<{ id: string; report_date: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prospect_reports')
    .select('id, report_date')
    .eq(kind === 'prospect' ? 'prospect_id' : 'company_id', entityId)
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}
