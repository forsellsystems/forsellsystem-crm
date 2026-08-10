import { getConnection } from './store'
import { getRecentMessagesWith } from './graph'
import type { GraphMessage } from './types'

// Mail for one CRM user, matched to a customer's contact addresses. Resilient by
// design: a Graph failure never throws (the customer page must not break), it
// surfaces as `error` and the card degrades gracefully.
// (Calendar events attach to individual meeting cards, not here — see meetings.)
export interface CustomerComm {
  connected: boolean
  accountEmail: string | null
  error: string | null
  messages: GraphMessage[]
}

export async function getCustomerComm(
  userId: string,
  emails: string[]
): Promise<CustomerComm> {
  const conn = await getConnection(userId)
  if (!conn) {
    return { connected: false, accountEmail: null, error: null, messages: [] }
  }
  if (!emails.length) {
    return { connected: true, accountEmail: conn.account_email, error: null, messages: [] }
  }
  try {
    const messages = await getRecentMessagesWith(userId, emails, 8)
    return { connected: true, accountEmail: conn.account_email, error: null, messages }
  } catch (err) {
    return {
      connected: true,
      accountEmail: conn.account_email,
      error: err instanceof Error ? err.message : 'Kunde inte hämta från Microsoft',
      messages: [],
    }
  }
}
