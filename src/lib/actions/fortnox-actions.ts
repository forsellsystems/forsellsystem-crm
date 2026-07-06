'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteConnection } from '@/lib/fortnox/store'
import { getOffer, getOfferSummary, listOffers } from '@/lib/fortnox/offers'
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

/** Link a deal to an existing Fortnox offer, verifying the offer exists first. */
export async function linkDealToOffer(
  dealId: string,
  documentNumber: string
): Promise<Result<FortnoxOfferSummary>> {
  const trimmed = documentNumber.trim()
  if (!trimmed) return { ok: false, error: 'Ange ett offertnummer.' }

  try {
    const offer = await getOffer(trimmed)
    if (!offer) {
      return { ok: false, error: `Ingen offert med nummer ${trimmed} hittades i Fortnox.` }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('deals')
      .update({
        fortnox_offer_documentnumber: String(offer.DocumentNumber),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
    if (error) throw new Error(error.message)

    revalidatePath(`/pipeline/${dealId}`)
    const summary = await getOfferSummary(String(offer.DocumentNumber))
    return summary
      ? { ok: true, data: summary }
      : { ok: false, error: 'Offerten kopplades men kunde inte läsas.' }
  } catch (err) {
    return fail(err)
  }
}

/** Remove the offer link from a deal. */
export async function unlinkDealOffer(dealId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('deals')
      .update({ fortnox_offer_documentnumber: null, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (error) throw new Error(error.message)
    revalidatePath(`/pipeline/${dealId}`)
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/** Recent offers from Fortnox, for the picker in the deal UI. */
export async function fetchRecentOffers(): Promise<Result<FortnoxOfferSummary[]>> {
  try {
    const offers = await listOffers(50)
    return { ok: true, data: offers }
  } catch (err) {
    return fail(err)
  }
}
