'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Copy, Check, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listReportRecipients,
  generateOutreachDraft,
  saveOutreachDraft,
  type Recipient,
} from '@/lib/actions/outreach-actions'

const textareaClass =
  'w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

/**
 * Utkast till första mejlet.
 *
 * Två steg med flit: först läser Claude rapporten och listar personerna den
 * namnger, sedan väljer DU vem mejlet ska till. Systemet väljer aldrig
 * mottagare åt dig.
 *
 * Instruktionsfältet står alltid öppet, också före första utkastet. Ett utkast
 * ska aldrig bli en gissning om vad du velat ha. Vid omgenerering skickas både
 * instruktionen och det gamla utkastet med, så det blir en rättning.
 */
export function OutreachCard({
  reportId,
  draft,
  recipient,
  instruction,
  configured,
}: {
  reportId: string
  draft: string | null
  recipient: string | null
  instruction: string | null
  configured: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [people, setPeople] = useState<Recipient[] | null>(null)
  const [text, setText] = useState(instruction ?? '')
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(draft ?? '')
  const [copied, setCopied] = useState(false)

  function run(fn: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel')
      }
    })
  }

  function loadPeople() {
    run(async () => {
      const found = await listReportRecipients(reportId)
      setPeople(found)
    })
  }

  function generate(to: string) {
    run(async () => {
      await generateOutreachDraft(reportId, to, text || undefined)
      setPeople(null)
    })
  }

  async function copy() {
    if (!draft) return
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
            Utkast till mejl
          </CardTitle>
          {recipient && <p className="mt-1 text-xs text-[#9A9A9A]">Till {recipient}</p>}
        </div>
        {draft && !editing && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Kopiera">
              {copied ? <Check className="size-4" /> : <Copy className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditText(draft)
                setEditing(true)
              }}
              aria-label="Redigera"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!configured ? (
          <p className="text-sm text-[#6B6B6B]">
            Claude-kopplingen är inte uppsatt. Lägg <code>ANTHROPIC_API_KEY</code> i Vercel och
            gör en ny deploy, så går det att skriva utkast här.
          </p>
        ) : (
          <>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  className={`${textareaClass} min-h-80`}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(false)}
                    disabled={isPending}
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() =>
                      run(async () => {
                        await saveOutreachDraft(reportId, editText)
                        setEditing(false)
                      })
                    }
                  >
                    <Check className="size-4" />
                  </Button>
                </div>
              </div>
            ) : draft ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1A1A1A]">{draft}</p>
            ) : (
              <p className="text-sm text-[#6B6B6B]">
                Inget utkast än. Claude läser rapporten, du väljer vem mejlet ska till.
              </p>
            )}

            {/* Mottagarval. Visas efter att rapporten lästs. */}
            {people && (
              <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
                <p className="text-xs text-[#6B6B6B]">
                  {people.length ? 'Vem ska mejlet till?' : 'Rapporten namnger ingen person.'}
                </p>
                {people.map((p) => (
                  <button
                    key={`${p.name}-${p.role}`}
                    type="button"
                    onClick={() => generate(`${p.name}, ${p.role}`)}
                    disabled={isPending}
                    className="block w-full rounded-lg border border-[#B8B8B8]/50 px-3 py-2 text-left transition-colors hover:border-[#D4A301] disabled:opacity-50"
                  >
                    <span className="text-sm text-[#1A1A1A]">{p.name}</span>
                    <span className="text-sm text-[#6B6B6B]"> · {p.role}</span>
                    <span className="mt-0.5 block text-xs text-[#9A9A9A]">{p.why}</span>
                  </button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setPeople(null)} disabled={isPending}>
                  Avbryt
                </Button>
              </div>
            )}

            {/* Din instruktion. Står alltid öppen, också före första utkastet:
                utkastet ska aldrig bli en gissning om vad du velat ha. */}
            {!people && !editing && (
              <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
                <p className="text-xs text-[#6B6B6B]">Din instruktion</p>
                <textarea
                  className={`${textareaClass} min-h-24`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    draft
                      ? 'Vad ska ändras? T.ex. för säljigt i andra stycket, nämn Vertilift i stället, korta ner slutet'
                      : 'Vad ska mejlet ta upp? T.ex. vinkla mot arbetsmiljö, nämn Point/A tidigt, håll det kort'
                  }
                />
                <p className="text-[11px] text-[#9A9A9A]">
                  Sparas på rapporten, så du ser vad du bad om förra gången.
                </p>
              </div>
            )}

            {!people && !editing && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => (draft && recipient ? generate(recipient) : loadPeople())}
                  disabled={isPending}
                >
                  <Sparkles className="size-3.5" data-icon="inline-start" />
                  {isPending ? 'Skriver…' : draft ? 'Skriv om' : 'Skapa utkast'}
                </Button>
                {draft && (
                  <Button variant="ghost" size="sm" onClick={loadPeople} disabled={isPending}>
                    Byt mottagare
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
      </CardContent>
    </Card>
  )
}
