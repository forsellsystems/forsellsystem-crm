// Fortnox API types — placeholder for future integration

export interface FortnoxCustomer {
  CustomerNumber: string
  Name: string
  OrganisationNumber?: string
  Address1?: string
  ZipCode?: string
  City?: string
  Country?: string
  Email?: string
  Phone1?: string
  WWW?: string
}

export interface FortnoxOffer {
  OfferNumber: string
  CustomerNumber: string
  OfferDate: string
  Total: number
  Currency: string
  YourReference?: string
  OurReference?: string
}

export interface FortnoxConfig {
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
  baseUrl: string
}
