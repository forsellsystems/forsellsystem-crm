import { fortnoxFetch, fortnoxJson } from './client'
import type { FortnoxOffer, FortnoxOfferSummary } from './types'

function toSummary(offer: FortnoxOffer): FortnoxOfferSummary {
  return {
    documentNumber: String(offer.DocumentNumber),
    customerName: offer.CustomerName ?? null,
    offerDate: offer.OfferDate ?? null,
    total: typeof offer.Total === 'number' ? offer.Total : null,
    currency: offer.Currency ?? null,
  }
}

/** Fetch a single offer by its DocumentNumber. Returns null on 404. */
export async function getOffer(documentNumber: string): Promise<FortnoxOffer | null> {
  const res = await fortnoxFetch(`/offers/${encodeURIComponent(documentNumber)}`)
  if (res.status === 404) return null
  const data = await fortnoxJson<{ Offer: FortnoxOffer }>(res, 'hämta offert')
  return data.Offer ?? null
}

export async function getOfferSummary(
  documentNumber: string
): Promise<FortnoxOfferSummary | null> {
  const offer = await getOffer(documentNumber)
  return offer ? toSummary(offer) : null
}

/** List recent offers (most recent first) for the picker. */
export async function listOffers(limit = 50): Promise<FortnoxOfferSummary[]> {
  const res = await fortnoxFetch(
    `/offers?limit=${limit}&sortby=documentnumber&sortorder=descending`
  )
  const data = await fortnoxJson<{ Offers: FortnoxOffer[] }>(res, 'lista offerter')
  return (data.Offers ?? []).map(toSummary)
}

/**
 * The offer rendered as a PDF. `/preview` returns the PDF without side effects
 * (unlike `/print`, which also flips the offer's Sent flag to true).
 *
 * Counterintuitive but required: the REQUEST's Accept header must stay
 * application/json — Fortnox negotiates only json/xml, so Accept: application/pdf
 * is rejected with error 1000030 "Invalid response type". The PDF still comes
 * back as the raw (binary) response body. Confirmed by Fortnox's own C# SDK and
 * the rantalainen JS client, both of which send Accept: application/json here.
 */
export async function getOfferPdf(documentNumber: string): Promise<ArrayBuffer> {
  const res = await fortnoxFetch(`/offers/${encodeURIComponent(documentNumber)}/preview`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fortnox hämta PDF misslyckades (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.arrayBuffer()
}

/** Connected company's name — used as a lightweight connection check. */
export async function getCompanyName(): Promise<string | null> {
  const res = await fortnoxFetch('/companyinformation')
  if (!res.ok) return null
  const data = await fortnoxJson<{ CompanyInformation?: { CompanyName?: string } }>(
    res,
    'hämta företagsinfo'
  )
  return data.CompanyInformation?.CompanyName ?? null
}
