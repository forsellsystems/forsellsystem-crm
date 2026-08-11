'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteConnection, isConnected } from '@/lib/fortnox/store'
import { getOffer, getOfferSummary, getCustomer, listOffers } from '@/lib/fortnox/offers'
import { FortnoxNotConnectedError } from '@/lib/fortnox/client'
import { logActivity } from '@/lib/actions/activity-actions'
import type { FortnoxOfferSummary, FortnoxCustomer } from '@/lib/fortnox/types'

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

/**
 * Kunder att välja bland när man kopplar en kund/prospekt mot Fortnox. Appen har
 * inte `customer`-scope, så kundregistret kan inte listas — vi härleder i stället
 * unika kunder ur de senaste offerterna. Fältet tar fritext, så listan är en hjälp
 * och inte en begränsning.
 */
export async function fetchFortnoxCustomers(): Promise<
  Result<{ number: string; name: string }[]>
> {
  try {
    const offers = await listOffers(50)
    const byNumber = new Map<string, string>()
    for (const offer of offers) {
      const number = offer.customerNumber ? String(offer.customerNumber) : ''
      if (!number || byNumber.has(number)) continue
      byNumber.set(number, offer.customerName || `Kund ${number}`)
    }
    const customers = [...byNumber].map(([number, name]) => ({ number, name }))
    customers.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
    return { ok: true, data: customers }
  } catch (err) {
    return fail(err)
  }
}

const COUNTRY_BY_CODE: Record<string, string> = {
  SE: 'Sverige',
  NO: 'Norge',
  DK: 'Danmark',
  FI: 'Finland',
  IS: 'Island',
}
function countryFromCode(code?: string | null): string {
  return (code && COUNTRY_BY_CODE[code.toUpperCase()]) || 'Sverige'
}

/** Does a CRM kund already exist for this Fortnox customer number? */
export async function matchFortnoxCustomer(
  customerNumber: string
): Promise<Result<{ id: string; name: string } | null>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .eq('fortnox_customer_id', String(customerNumber))
      .maybeSingle()
    return { ok: true, data: data ?? null }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Create a CRM kund from a Fortnox offer's customer — full data if the `customer`
 * scope is granted, otherwise name + number from the offer. Idempotent on the
 * Fortnox customer number (returns the existing kund if already imported).
 */
export async function createCompanyFromFortnox(
  documentNumber: string
): Promise<Result<{ id: string; name: string }>> {
  try {
    const offer = await getOffer(documentNumber)
    const custNo = offer?.CustomerNumber != null ? String(offer.CustomerNumber) : null
    if (!custNo) return { ok: false, error: 'Offerten saknar kundnummer i Fortnox.' }

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name')
      .eq('fortnox_customer_id', custNo)
      .maybeSingle()
    if (existing) return { ok: true, data: existing }

    // Full customer record needs the `customer` scope — fall back to the offer.
    let full: FortnoxCustomer | null = null
    try {
      full = await getCustomer(custNo)
    } catch {
      full = null
    }

    const name = full?.Name || offer?.CustomerName || `Kund ${custNo}`
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        customer_number: custNo,
        org_number: full?.OrganisationNumber || null,
        email: full?.Email || null,
        phone: full?.Phone1 || null,
        country: countryFromCode(full?.CountryCode),
        fortnox_customer_id: custNo,
        is_reseller: false,
      })
      .select('id, name')
      .single()
    if (error) throw new Error(error.message)

    await logActivity(supabase, {
      action: 'company_created',
      entity_type: 'company',
      entity_id: company.id,
      metadata: { label: company.name, href: `/foretag/${company.id}` },
    })
    revalidatePath('/foretag')
    return { ok: true, data: company }
  } catch (err) {
    return fail(err)
  }
}
