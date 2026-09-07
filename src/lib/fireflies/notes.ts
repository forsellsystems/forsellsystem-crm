import type { FirefliesTranscript } from './types'

/**
 * Mötesanteckningens text från ett Fireflies-transkript: SAMMANFATTNINGEN och
 * action items, aldrig hela transkriptet. Ordagranna repliker rad för rad blev
 * tiotusentals tecken i ett fält som ska gå att läsa — själva transkriptet
 * finns kvar i Fireflies för den som behöver det.
 *
 * Delas av webhooken (som uppdaterar ett redan kopplat kort) och av den
 * manuella kopplingen på möteskortet.
 */
export function buildTranscriptNotes(t: FirefliesTranscript): string | null {
  const parts: string[] = []
  const s = t.summary
  if (s?.overview?.trim()) parts.push(s.overview.trim())
  else if (s?.short_summary?.trim()) parts.push(s.short_summary.trim())
  if (s?.action_items?.trim()) parts.push(`Action items:\n${s.action_items.trim()}`)
  return parts.join('\n\n') || null
}
