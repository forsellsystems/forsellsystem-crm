import type { GraphEvent } from './types'

/**
 * En enda regel för när ett Outlook-möte räknas som genomfört, delad av
 * kalendersvepet (som skapar kortet) och av live-synken på möteskortet (som
 * skriver om det vid varje visning). Två olika regler här betyder att den ena
 * skriver över den andra, vilket är precis vad som hände: svepet satte
 * genomfört och synken satte tillbaka planerat resten av dagen.
 */

// Hur länge efter mötets slut det räknas som genomfört. Bufferten finns för
// möten som drar över: kortet ska inte stämplas mitt i mötet.
export const SETTLE_MS = 60 * 60 * 1000

/**
 * "Nu minus X" som svensk väggklocka, i samma form som Graph returnerar
 * (YYYY-MM-DDTHH:MM:SS). Servern kör i UTC, så tiderna får aldrig jämföras
 * genom att parsa Graph-strängarna — de saknar offset och skulle tolkas som
 * UTC och slinta två timmar på sommaren. Strängjämförelse på samma tidszon
 * är däremot exakt.
 */
export function stockholmWallClock(msAgo = 0): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(Date.now() - msAgo))
  return parts.replace(' ', 'T')
}

/** Har händelsen slutat för minst en timme sedan? */
export function hasSettled(ev: GraphEvent): boolean {
  const end = ev.end?.dateTime
  if (typeof end !== 'string') return false
  return end.slice(0, 19) <= stockholmWallClock(SETTLE_MS)
}

/**
 * Mötets status enligt Outlook. Inställt väger tyngst. I övrigt avgör
 * SLUTTIDEN, inte datumet: ett möte som hölls i morse är genomfört på
 * eftermiddagen, inte först i morgon.
 */
export function outlookMeetingStatus(ev: GraphEvent): 'installt' | 'genomfort' | 'planerat' {
  if (ev.isCancelled) return 'installt'
  return hasSettled(ev) ? 'genomfort' : 'planerat'
}
