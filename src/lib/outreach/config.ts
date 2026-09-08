// Claude-kopplingen som skriver utkast till första mejlet.
//
// Nyckeln ligger i miljön och läses av SDK:n själv. Saknas den är knappen
// avstängd med en förklaring, precis som Fortnox- och Microsoft-kopplingarna
// gör — funktionen ska aldrig krascha för att en integration inte är uppsatt.

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''

export function outreachConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY)
}

// Opus 5 är husets modell. Uppgiften är inte svår för den, och kostnaden per
// utkast ligger kring en tiondels krona — inte något att optimera bort.
export const OUTREACH_MODEL = 'claude-opus-5'
