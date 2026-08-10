// Fireflies.ai integration config.
//
// Flow: Fireflies' notetaker bot joins the Teams/Meet call, and when the
// transcript is ready it POSTs to /api/webhooks/fireflies (secured by an
// x-hub-signature HMAC-SHA256 header). We then fetch the transcript via the
// GraphQL API and create a meeting card with the transcript as its notes.
//
// Setup (per user, one-time):
// 1. Create a Fireflies account + connect the calendar (Teams/Meet auto-join)
// 2. Settings → Developer: generate an API key  → FIREFLIES_API_KEY
// 3. Register a webhook → https://<prod>/api/webhooks/fireflies with a secret
//    → FIREFLIES_WEBHOOK_SECRET

export const FIREFLIES_GRAPHQL_URL = 'https://api.fireflies.ai/graphql'
export const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY ?? ''
export const FIREFLIES_WEBHOOK_SECRET = process.env.FIREFLIES_WEBHOOK_SECRET ?? ''

export function firefliesConfigured(): boolean {
  return Boolean(FIREFLIES_API_KEY)
}
