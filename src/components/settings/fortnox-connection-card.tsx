'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Link2Off } from 'lucide-react'
import { disconnectFortnox } from '@/lib/actions/fortnox-actions'

const STATUS_MESSAGES: Record<string, { text: string; kind: 'ok' | 'error' }> = {
  connected: { text: 'Fortnox anslutet.', kind: 'ok' },
  denied: { text: 'Anslutningen avbröts i Fortnox.', kind: 'error' },
  state_mismatch: { text: 'Säkerhetskontroll misslyckades, försök igen.', kind: 'error' },
  missing_config: { text: 'Fortnox-credentials saknas i miljön (FORTNOX_CLIENT_ID/SECRET).', kind: 'error' },
  error: { text: 'Något gick fel vid anslutning till Fortnox.', kind: 'error' },
}

export function FortnoxConnectionCard({
  connected,
  companyName,
  statusParam,
}: {
  connected: boolean
  companyName: string | null
  statusParam?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const status = statusParam ? STATUS_MESSAGES[statusParam] : undefined

  function handleDisconnect() {
    setError(null)
    startTransition(async () => {
      const res = await disconnectFortnox()
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Fortnox
        </CardTitle>
        {connected ? (
          <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={isPending}>
            <Link2Off className="size-4" data-icon="inline-start" />
            Koppla från
          </Button>
        ) : (
          <Button
            className="bg-[#F2BB01] hover:bg-[#D4A301] text-white"
            size="sm"
            onClick={() => {
              window.location.href = '/api/fortnox/connect'
            }}
          >
            <Link2 className="size-4" data-icon="inline-start" />
            Anslut till Fortnox
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: connected ? '#4C9A5A' : '#B8B8B8' }}
          />
          <span className={connected ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'}>
            {connected ? 'Ansluten' : 'Ej ansluten'}
          </span>
          {connected && companyName && (
            <span className="text-[#6B6B6B]">· {companyName}</span>
          )}
        </div>
        <p className="text-xs text-[#6B6B6B]">
          Koppla affärer till offerter i Fortnox. Anslutningen gäller hela CRM:et.
        </p>
        {status && (
          <p className={`text-sm ${status.kind === 'ok' ? 'text-[#4C9A5A]' : 'text-[#8B3D3D]'}`}>
            {status.text}
          </p>
        )}
        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
