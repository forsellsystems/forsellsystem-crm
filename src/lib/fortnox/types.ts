// Fortnox API types.

// Token response from the OAuth token endpoint (both authorization_code + refresh_token grants).
export interface FortnoxTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  scope: string
  expires_in: number // seconds (3600)
}

// Our stored connection row (public.fortnox_connection).
export interface FortnoxConnection {
  id: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string | null
  company_name: string | null
  connected_by: string | null
  created_at: string
  updated_at: string
}

// A Fortnox Offer (offert). Fortnox returns far more fields; we type the ones we use.
export interface FortnoxOffer {
  '@url'?: string
  DocumentNumber: string
  CustomerNumber?: string
  CustomerName?: string
  OfferDate?: string
  Total?: number
  Currency?: string
  Sent?: boolean
  Cancelled?: boolean
  OrderReference?: string
  YourReference?: string
  OurReference?: string
  // Projektnummer på offerten. Tom sträng när inget projekt är satt.
  // Det är HÄR kund och projekt möts i Fortnox: projektposten själv bär ingen kund.
  Project?: string
}

// Compact shape used by the offer picker in the deal UI.
export interface FortnoxOfferSummary {
  documentNumber: string
  customerNumber: string | null
  customerName: string | null
  offerDate: string | null
  total: number | null
  currency: string | null
  project: string | null
}

// A Fortnox customer (kund). Requires the `customer` scope to read.
export interface FortnoxCustomer {
  CustomerNumber: string
  Name?: string
  OrganisationNumber?: string
  Email?: string
  // Listan (/customers) svarar med `Phone`, enskild kund (/customers/{nr}) med
  // `Phone1`. Båda måste läsas, annars tappas telefonnumret i väljaren.
  Phone1?: string
  Phone?: string
  Address1?: string
  ZipCode?: string
  City?: string
  // Finns bara på enskild kund, inte i listan.
  CountryCode?: string
  Country?: string
}

// Ett Fortnox-projekt. Kräver `project`-scopet.
export interface FortnoxProject {
  '@url'?: string
  ProjectNumber: string
  Description?: string
  // NOTSTARTED | ONGOING | COMPLETED enligt Fortnox. Läses som text, aldrig som
  // union: ett okänt värde ska visas som det är, inte krascha listan.
  Status?: string
  StartDate?: string
  EndDate?: string
  // Comments och ContactPerson finns BARA på enskilt projekt (/projects/{nr}),
  // aldrig i listan (/projects). Verifierat mot skarpa API:et 2026-08-14.
  Comments?: string
  ContactPerson?: string
  ProjectLeader?: string
}

// Kompakt projektform som väljaren och kopplingsblocket arbetar med.
export interface FortnoxProjectSummary {
  projectNumber: string
  description: string | null
  status: string | null
  startDate: string | null
  endDate: string | null
  comments: string | null
  contactPerson: string | null
  projectLeader: string | null
}

// Kompakt kundform som väljaren och kopplingskortet arbetar med.
export interface FortnoxCustomerSummary {
  customerNumber: string
  name: string | null
  orgNumber: string | null
  email: string | null
  phone: string | null
  city: string | null
  countryCode: string | null
}
