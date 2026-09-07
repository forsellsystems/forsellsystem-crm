// Prospektrapporternas väg in.
//
// Rapporten kan komma två vägar, båda till samma mottagare:
//  1. Du laddar upp .md-filen på /rapporter (kräver inloggning, ingen hemlighet)
//  2. Den schemalagda ChatGPT-körningen POST:ar den till
//     /api/webhooks/rapporter med en delad hemlighet
//
// Väg 2 kräver REPORTS_WEBHOOK_SECRET i miljön. Saknas den är webhooken stängd
// och uppladdningen i UI:t fungerar ändå — funktionen är inte beroende av den.

export const REPORTS_WEBHOOK_SECRET = process.env.REPORTS_WEBHOOK_SECRET ?? ''

export function reportsWebhookConfigured(): boolean {
  return Boolean(REPORTS_WEBHOOK_SECRET)
}
