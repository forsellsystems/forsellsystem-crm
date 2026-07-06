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
}

// Compact shape used by the offer picker in the deal UI.
export interface FortnoxOfferSummary {
  documentNumber: string
  customerName: string | null
  offerDate: string | null
  total: number | null
  currency: string | null
  status: FortnoxOfferStatus
}

export type FortnoxOfferStatus = 'draft' | 'sent' | 'ordercreated' | 'cancelled'
