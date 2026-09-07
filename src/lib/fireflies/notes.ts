import type { FirefliesTranscript } from './types'

/**
 * Mötesanteckningens text från ett Fireflies-transkript: sammanfattning,
 * action items och hela transkriptet. Delas av webhooken (som uppdaterar ett
 * redan kopplat kort) och av den manuella kopplingen på möteskortet.
 */
export function buildTranscriptNotes(t: FirefliesTranscript): string | null {
  const parts: string[] = []
  const s = t.summary
  if (s?.overview?.trim()) parts.push(s.overview.trim())
  else if (s?.short_summary?.trim()) parts.push(s.short_summary.trim())
  if (s?.action_items?.trim()) parts.push(`Action items:\n${s.action_items.trim()}`)
  const transcript = (t.sentences ?? [])
    .map((x) => `${x.speaker_name ? `${x.speaker_name}: ` : ''}${x.text ?? ''}`.trim())
    .filter(Boolean)
    .join('\n')
  if (transcript) parts.push(`— Transkript —\n${transcript}`)
  return parts.join('\n\n') || null
}
