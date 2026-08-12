// Fortnox använder ISO-landskoder, CRM:et lagrar svenska landsnamn ur COUNTRIES.
// Tabellen täcker Forsells marknader (Norden, Nordamerika, Europa, Oceanien,
// Sydamerika) och de länder som faktiskt finns i databasen. Ett land som saknas
// här översätts inte alls: vid skapande utelämnas CountryCode och vid hämtning
// lämnas landet i CRM:et orört. Hellre tomt än fel land.

const CODE_BY_COUNTRY: Record<string, string> = {
  Sverige: 'SE',
  Norge: 'NO',
  Danmark: 'DK',
  Finland: 'FI',
  Island: 'IS',
  Estland: 'EE',
  Lettland: 'LV',
  Litauen: 'LT',
  Polen: 'PL',
  Tyskland: 'DE',
  Nederländerna: 'NL',
  Belgien: 'BE',
  Frankrike: 'FR',
  Storbritannien: 'GB',
  Irland: 'IE',
  Spanien: 'ES',
  Portugal: 'PT',
  Italien: 'IT',
  Österrike: 'AT',
  Schweiz: 'CH',
  Tjeckien: 'CZ',
  Slovakien: 'SK',
  Ungern: 'HU',
  Rumänien: 'RO',
  Bulgarien: 'BG',
  Kroatien: 'HR',
  Slovenien: 'SI',
  Grekland: 'GR',
  USA: 'US',
  Kanada: 'CA',
  Mexiko: 'MX',
  Chile: 'CL',
  Brasilien: 'BR',
  Argentina: 'AR',
  Australien: 'AU',
  'Nya Zeeland': 'NZ',
  Japan: 'JP',
  Sydkorea: 'KR',
  Kina: 'CN',
  Indien: 'IN',
  Sydafrika: 'ZA',
}

const COUNTRY_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_BY_COUNTRY).map(([country, code]) => [code, country])
)

/** Svenskt landsnamn till ISO-kod. null när landet inte finns i tabellen. */
export function codeFromCountry(country?: string | null): string | null {
  if (!country) return null
  return CODE_BY_COUNTRY[country.trim()] ?? null
}

/** ISO-kod till svenskt landsnamn. null när koden inte finns i tabellen. */
export function countryFromCode(code?: string | null): string | null {
  if (!code) return null
  return COUNTRY_BY_CODE[code.trim().toUpperCase()] ?? null
}
