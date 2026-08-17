import { fortnoxFetch, fortnoxJson } from './client'
import type { FortnoxCustomer, FortnoxCustomerSummary } from './types'

// Fortnox kundregister. Kräver `customer`-scopet, som sitter på integrationen i
// Fortnox Developer Portal ("Kund"). Saknas det svarar allt här 403.

// Fortnox svarar med tom sträng snarare än null för fält som inte är ifyllda.
const nonEmpty = (v?: string | null) => (v && v.trim() !== '' ? v.trim() : null)

function toSummary(customer: FortnoxCustomer): FortnoxCustomerSummary {
  return {
    customerNumber: String(customer.CustomerNumber),
    name: customer.Name ?? null,
    orgNumber: customer.OrganisationNumber ?? null,
    email: customer.Email ?? null,
    phone: customer.Phone1 ?? customer.Phone ?? null,
    city: customer.City ?? null,
    countryCode: customer.CountryCode ?? null,
    // Personen: namn ur YourReference, adress ur offert- eller orderfältet.
    // EmailInvoice används INTE, den är ekonomins funktionsadress.
    contactName: nonEmpty(customer.YourReference),
    contactEmail:
      nonEmpty(customer.EmailOffer) ??
      nonEmpty(customer.EmailOrder) ??
      nonEmpty(customer.Email),
    contactPhone: nonEmpty(customer.Phone1) ?? nonEmpty(customer.Phone2) ?? nonEmpty(customer.Phone),
  }
}

/**
 * Hela kundregistret, sorterat på namn. Fortnox sidindelar med 500 per sida som
 * mest; vi hämtar sida för sida tills registret är slut så listan aldrig blir
 * tyst avkortad. MAX_PAGES är en spärr mot oändlig loop vid oväntade svar.
 */
const PAGE_SIZE = 500
const MAX_PAGES = 20

export async function listCustomers(): Promise<FortnoxCustomerSummary[]> {
  const all: FortnoxCustomerSummary[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fortnoxFetch(`/customers?limit=${PAGE_SIZE}&page=${page}`)
    const data = await fortnoxJson<{
      Customers?: FortnoxCustomer[]
      MetaInformation?: { '@TotalPages'?: number }
    }>(res, 'lista kunder')

    all.push(...(data.Customers ?? []).map(toSummary))

    const totalPages = data.MetaInformation?.['@TotalPages'] ?? 1
    if (page >= totalPages) break
  }

  all.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'sv'))
  return all
}

/** En kund via kundnummer. null när den inte finns (404). */
export async function getCustomerSummary(
  customerNumber: string
): Promise<FortnoxCustomerSummary | null> {
  const res = await fortnoxFetch(`/customers/${encodeURIComponent(customerNumber)}`)
  if (res.status === 404) return null
  const data = await fortnoxJson<{ Customer: FortnoxCustomer }>(res, 'hämta kund')
  return data.Customer ? toSummary(data.Customer) : null
}

/**
 * Skapa en kund i Fortnox. Fortnox delar ut kundnumret själv, så det som kommer
 * tillbaka är facit. Endast fält med värde skickas med, annars skriver vi tomma
 * strängar in i deras register.
 */
export async function createCustomer(fields: {
  name: string
  orgNumber?: string | null
  email?: string | null
  phone?: string | null
  countryCode?: string | null
}): Promise<FortnoxCustomerSummary> {
  const customer: Record<string, string> = { Name: fields.name }
  if (fields.orgNumber) customer.OrganisationNumber = fields.orgNumber
  if (fields.email) customer.Email = fields.email
  if (fields.phone) customer.Phone1 = fields.phone
  if (fields.countryCode) customer.CountryCode = fields.countryCode

  const res = await fortnoxFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ Customer: customer }),
  })
  const data = await fortnoxJson<{ Customer: FortnoxCustomer }>(res, 'skapa kund')
  if (!data.Customer) throw new Error('Fortnox svarade utan kund vid skapande.')
  return toSummary(data.Customer)
}
