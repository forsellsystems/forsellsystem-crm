// Fortnox integration config — placeholder for future implementation
//
// Planned sync:
// 1. Company → Fortnox Customer (sync on create/update)
// 2. Won Deal → Fortnox Offer (sync when stage = avslutad_affar)
//
// Setup steps:
// 1. Register app at developer.fortnox.se
// 2. Add FORTNOX_CLIENT_ID and FORTNOX_CLIENT_SECRET to .env.local
// 3. Implement OAuth2 flow for token management
// 4. Create sync functions in this directory

export const FORTNOX_BASE_URL = 'https://api.fortnox.se/3'

export const FORTNOX_ENABLED = false // Set to true when integration is ready
