import type { SupabaseClient } from '@supabase/supabase-js'
import { parseReport, type ParsedReport } from './parse'

export type SaveResult =
  | { ok: true; id: string; created: boolean; report: ParsedReport }
  | { ok: false; error: string }

/**
 * Spara en rapport. Delad av uppladdningen i UI:t och av webhooken, så att
 * båda vägarna tolkar filen likadant och har samma dubblettskydd.
 *
 * source_file är unikt: samma rapport kan skickas om utan att bli två poster.
 * En omsändning uppdaterar innehållet men rör ALDRIG status eller kopplingen
 * till ett prospekt — det är triageringen, och den är användarens arbete.
 */
export async function saveReport(
  supabase: SupabaseClient,
  filename: string,
  content: string
): Promise<SaveResult> {
  if (!content.trim()) return { ok: false, error: 'Rapporten är tom.' }

  const parsed = parseReport(filename, content)
  if (!parsed) {
    return {
      ok: false,
      error:
        'Filnamnet måste vara på formen ÅÅÅÅ-MM-DD--bolagsnamn.md. ' +
        'Körningar utan kvalificerat prospekt läses inte in.',
    }
  }

  const { data: existing } = await supabase
    .from('prospect_reports')
    .select('id')
    .eq('source_file', parsed.source_file)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('prospect_reports')
      .update({
        content: parsed.content,
        company_name: parsed.company_name,
        org_number: parsed.org_number,
        website: parsed.website,
        icp_score: parsed.icp_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: existing.id, created: false, report: parsed }
  }

  const { data, error } = await supabase
    .from('prospect_reports')
    .insert({
      source_file: parsed.source_file,
      report_date: parsed.report_date,
      company_name: parsed.company_name,
      org_number: parsed.org_number,
      website: parsed.website,
      icp_score: parsed.icp_score,
      content: parsed.content,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  return { ok: true, id: data.id, created: true, report: parsed }
}
