'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteConnection, isConnected } from '@/lib/fortnox/store'
import { getOfferSummary, listOffers } from '@/lib/fortnox/offers'
import { FortnoxNotConnectedError } from '@/lib/fortnox/client'
import type { FortnoxOfferSummary } from '@/lib/fortnox/types'

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string }

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof FortnoxNotConnectedError) {
    return { ok: false, error: 'Fortnox är inte anslutet. Anslut under Inställningar.' }
  }
  return { ok: false, error: err instanceof Error ? err.message : 'Något gick fel' }
}

/** Whether the CRM has a live Fortnox connection (for showing the offer field). */
export async function fortnoxConnected(): Promise<boolean> {
  return isConnected()
}

/** Disconnect the Fortnox account (deletes stored tokens). */
export async function disconnectFortnox(): Promise<Result> {
  try {
    await deleteConnection()
    revalidatePath('/installningar')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/** Look up a single offer by number (for previewing when linking in a dialog). */
export async function fetchOfferSummary(
  documentNumber: string
): Promise<Result<FortnoxOfferSummary>> {
  const trimmed = documentNumber.trim()
  if (!trimmed) return { ok: false, error: 'Ange ett offertnummer.' }
  try {
    const summary = await getOfferSummary(trimmed)
    return summary
      ? { ok: true, data: summary }
      : { ok: false, error: `Ingen offert med nummer ${trimmed} hittades i Fortnox.` }
  } catch (err) {
    return fail(err)
  }
}

/** Remove the offer link from a deal (inline, directly on the deal card). */
export async function unlinkDealOffer(dealId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('deals')
      .update({ fortnox_offer_documentnumber: null, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (error) throw new Error(error.message)
    revalidatePath(`/pipeline/${dealId}`)
    revalidatePath('/pipeline')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/** Recent offers from Fortnox, for the picker in the deal dialogs. */
export async function fetchRecentOffers(): Promise<Result<FortnoxOfferSummary[]>> {
  try {
    const offers = await listOffers(50)
    return { ok: true, data: offers }
  } catch (err) {
    return fail(err)
  }
}
