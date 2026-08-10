import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'
import { getCustomerComm } from '@/lib/microsoft/customer-comm'
import type { GraphMessage } from '@/lib/microsoft/types'

const cardTitle = 'font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]'

// Async server component — fetches the signed-in user's Outlook mail matched to
// this customer's contact addresses. Wrap in <Suspense> so Graph latency doesn't
// block the rest of the customer page. (Outlook meetings link to meeting cards.)
export async function CustomerCommunication({
  userId,
  emails,
}: {
  userId: string
  emails: string[]
}) {
  const comm = await getCustomerComm(userId, emails)

  if (!comm.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={cardTitle}>Mejl (Outlook)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6B6B6B]">
            Anslut ditt Microsoft-konto i{' '}
            <Link href="/installningar" className="underline hover:text-[#1A1A1A]">
              Inställningar
            </Link>{' '}
            för att se din mejlhistorik med den här kunden här.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <MailCard
      messages={comm.messages}
      accountEmail={comm.accountEmail}
      error={comm.error}
      noEmails={emails.length === 0}
    />
  )
}

function MailCard({
  messages,
  accountEmail,
  error,
  noEmails,
}: {
  messages: GraphMessage[]
  accountEmail: string | null
  error: string | null
  noEmails: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Mail className="size-4 text-[#6B6B6B]" />
        <CardTitle className={cardTitle}>Mejl (Outlook)</CardTitle>
      </CardHeader>
      <CardContent>
        {noEmails ? (
          <p className="text-sm text-[#6B6B6B]">
            Lägg till en e-postadress på en kontakt för att matcha mejl.
          </p>
        ) : error ? (
          <p className="text-sm text-[#8B3D3D]">Kunde inte hämta mejl just nu.</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">Ingen mejlkonversation hittad.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {messages.map((m) => {
              const fromAddr = m.from?.emailAddress?.address?.toLowerCase()
              const outgoing = Boolean(accountEmail && fromAddr === accountEmail.toLowerCase())
              const counter = outgoing ? m.toRecipients?.[0]?.emailAddress : m.from?.emailAddress
              const who = counter?.name || counter?.address || 'Okänd'
              return (
                <a
                  key={m.id}
                  href={m.webLink ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-[#1A1A1A]">
                      {m.subject || '(inget ämne)'}
                    </span>
                    <span className="shrink-0 text-xs text-[#6B6B6B]">
                      {formatRelativeTime(m.receivedDateTime)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[#6B6B6B]">
                    {outgoing ? `Du → ${who}` : `${who} → Du`}
                    {m.bodyPreview ? ` · ${m.bodyPreview}` : ''}
                  </p>
                </a>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
