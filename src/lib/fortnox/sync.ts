import { createClient } from '@/lib/supabase/server'
import type { FortnoxOfferSummary } from './types'

export type SyncableDealFields = {
  value: number | null
  quote_number: string | null
  quote_date: string | null
  currency: string
}

/**
 * "Fortnox styr alltid": mirror a linked offer's figures onto the deal's own
 * fields (value, quote_number, quote_date, currency). Writes ONLY the fields
 * that actually differ — a no-op once the deal is already in sync — and returns
 * the effective values so the caller can render them immediately.
 *
 * Safe to call during a server render: it performs a plain UPDATE and does NOT
 * call revalidatePath. Other pages are dynamically rendered, so they pick up the
 * new values on their next load.
 */
export async function syncDealFieldsFromOffer(
  dealId: string,
  summary: FortnoxOfferSummary,
  current: SyncableDealFields
): Promise<SyncableDealFields> {
  const next: SyncableDealFields = {
    // Fortnox is authoritative; fall back to the current value only when the
    // offer omits a field so we never blank out existing data.
    value: summary.total ?? current.value,
    quote_number: summary.documentNumber,
    quote_date: summary.offerDate ?? current.quote_date,
    currency: summary.currency ?? current.currency,
  }

  // Postgres `numeric` can arrive as a string via PostgREST — coerce before
  // comparing so we don't write on every render.
  const currentValueNum = current.value == null ? null : Number(current.value)

  const changed: Record<string, unknown> = {}
  if (next.value !== currentValueNum) changed.value = next.value
  if (next.quote_number !== current.quote_number) changed.quote_number = next.quote_number
  if (next.quote_date !== current.quote_date) changed.quote_date = next.quote_date
  if (next.currency !== current.currency) changed.currency = next.currency

  if (Object.keys(changed).length > 0) {
    const supabase = await createClient()
    await supabase.from('deals').update(changed).eq('id', dealId)
  }

  return next
}
