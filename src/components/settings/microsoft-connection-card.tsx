'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Link2Off } from 'lucide-react'
import { disconnectMicrosoft } from '@/lib/actions/microsoft-actions'

const STATUS_MESSAGES: Record<string, { text: string; kind: 'ok' | 'error' }> = {
  connected: { text: 'Microsoft anslutet.', kind: 'ok' },
  denied: { text: 'Anslutningen avbröts i Microsoft.', kind: 'error' },
  state_mismatch: { text: 'Säkerhetskontroll misslyckades, försök igen.', kind: 'error' },
  missing_config: { text: 'Microsoft-credentials saknas i miljön (MICROSOFT_CLIENT_ID/SECRET/TENANT_ID).', kind: 'error' },
  not_logged_in: { text: 'Du måste vara inloggad för att ansluta.', kind: 'error' },
  no_user: { text: 'Kunde inte koppla anslutningen till din användare.', kind: 'error' },
  error: { text: 'Något gick fel vid anslutning till Microsoft.', kind: 'error' },
}

export function MicrosoftConnectionCard({
  connected,
  accountEmail,
  statusParam,
}: {
  connected: boolean
  accountEmail: string | null
  statusParam?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const status = statusParam ? STATUS_MESSAGES[statusParam] : undefined

  function handleDisconnect() {
    setError(null)
    startTransition(async () => {
      const res = await disconnectMicrosoft()
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Microsoft 365
        </CardTitle>
        {connected ? (
          <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={isPending}>
            <Link2Off className="size-4" data-icon="inline-start" />
            Koppla från
          </Button>
        ) : (
          <Button
            className="bg-[#656565] hover:bg-[#4A4A4A] text-white"
            size="sm"
            onClick={() => {
              window.location.href = '/api/microsoft/connect'
            }}
          >
            <Link2 className="size-4" data-icon="inline-start" />
            Anslut Microsoft
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
          {connected && accountEmail && (
            <span className="text-[#6B6B6B]">· {accountEmail}</span>
          )}
        </div>
        <p className="text-xs text-[#6B6B6B]">
          Koppla din Outlook-mejl och kalender. Anslutningen gäller ditt eget konto.
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
