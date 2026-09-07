import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { REPORTS_WEBHOOK_SECRET, reportsWebhookConfigured } from '@/lib/reports/config'
import { saveReport } from '@/lib/reports/store'

export const runtime = 'nodejs'

/**
 * Tar emot en daglig prospektrapport från den schemalagda ChatGPT-körningen.
 *
 * Skicka:
 *   POST /api/webhooks/rapporter
 *   x-rapport-signature: <HMAC-SHA256 av rå body, hex>
 *   { "filename": "2026-09-07--adapteo-ab.md", "content": "# Daglig ..." }
 *
 * Rapporten blir en post i inkorgen på /rapporter. Den skapar ALDRIG ett
 * prospekt av sig själv — den väntar på att någon läser den och avgör.
 */

// Samma signaturmodell som Fireflies-webhooken: HMAC-SHA256 över rå body.
function verifySignature(raw: string, header: string | null): boolean {
  if (!REPORTS_WEBHOOK_SECRET || !header) return false
  const expected = crypto
    .createHmac('sha256', REPORTS_WEBHOOK_SECRET)
    .update(raw, 'utf8')
    .digest('hex')
  const provided = header.replace(/^sha256=/, '').trim()
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const raw = await request.text()

  if (!reportsWebhookConfigured()) {
    return NextResponse.json({ error: 'Rapport-webhooken är inte konfigurerad' }, { status: 503 })
  }
  if (!verifySignature(raw, request.headers.get('x-rapport-signature'))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: { filename?: unknown; content?: unknown }
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const filename = typeof payload.filename === 'string' ? payload.filename : ''
  const content = typeof payload.content === 'string' ? payload.content : ''
  if (!filename || !content) {
    return NextResponse.json({ error: 'filename och content krävs' }, { status: 400 })
  }

  const result = await saveReport(createAdminClient(), filename, content)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({
    ok: true,
    id: result.id,
    created: result.created,
    company: result.report.company_name,
  })
}
