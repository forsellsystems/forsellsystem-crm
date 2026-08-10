'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MEETING_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import {
  updateMeeting,
  deleteMeeting,
  linkOutlookEvent,
  unlinkOutlookEvent,
  setMeetingEntity,
} from '@/lib/actions/meeting-actions'
import { MeetingForm, type MeetingFormValues } from './meeting-form'
import { parseBullets } from '@/components/ui/bullet-list-input'
import type { Meeting } from '@/lib/types/database'

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

type EntityOption = { id: string; name: string }

export function MeetingDetailCard({
  meeting,
  entityHref,
  outlookConnected = false,
  outlookEvents = [],
  outlookWebLink = null,
  customers = [],
  resellers = [],
  customerProspects = [],
  resellerProspects = [],
}: {
  meeting: Meeting
  entityHref: string
  outlookConnected?: boolean
  outlookEvents?: { id: string; label: string }[]
  outlookWebLink?: string | null
  customers?: EntityOption[]
  resellers?: EntityOption[]
  customerProspects?: EntityOption[]
  resellerProspects?: EntityOption[]
}) {
  const linked = Boolean(meeting.outlook_event_id)
  const entityValue =
    meeting.entity_type && meeting.entity_id
      ? `${meeting.entity_type}:${meeting.entity_id}`
      : ''

  // A freshly created meeting has no data yet → open straight in edit mode.
  const isEmpty =
    !meeting.title?.trim() &&
    !meeting.meeting_date &&
    !meeting.meeting_time &&
    !meeting.participants?.trim() &&
    !meeting.status &&
    !meeting.agenda?.trim() &&
    !meeting.notes?.trim()

  const [editing, setEditing] = useState(isEmpty)
  const [isPending, startTransition] = useTransition()
  const [selectedEvent, setSelectedEvent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const status = MEETING_STATUSES.find((s) => s.key === meeting.status)
  const timeStr = meeting.meeting_time ? meeting.meeting_time.slice(0, 5) : null
  const whenStr =
    [
      meeting.meeting_date ? formatDate(meeting.meeting_date) : null,
      timeStr ? `kl ${timeStr}` : null,
    ]
      .filter(Boolean)
      .join(' ') || '—'

  function handleSave(values: MeetingFormValues) {
    startTransition(async () => {
      await updateMeeting(meeting.id, meeting.entity_type, meeting.entity_id, {
        // Title/date/time/status are driven by Outlook while linked — don't overwrite.
        ...(linked
          ? {}
          : {
              title: values.title || null,
              meeting_date: values.meeting_date || null,
              meeting_time: values.meeting_time || null,
              status: values.status || null,
            }),
        participants: values.participants || null,
        agenda: values.agenda || null,
      })
      setEditing(false)
      router.refresh()
    })
  }

  function handleCancel() {
    // Cancelling a brand-new, never-filled meeting removes the empty row
    // and returns to the bolag instead of leaving an orphan.
    if (isEmpty) {
      startTransition(async () => {
        await deleteMeeting(meeting.id, meeting.entity_type, meeting.entity_id)
        router.push(entityHref)
      })
    } else {
      setEditing(false)
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMeeting(meeting.id, meeting.entity_type, meeting.entity_id)
      router.push('/moten')
    })
  }

  function handleLink() {
    if (!selectedEvent) return
    setError(null)
    startTransition(async () => {
      try {
        await linkOutlookEvent(meeting.id, meeting.entity_type, meeting.entity_id, selectedEvent)
        setSelectedEvent('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte koppla')
      }
    })
  }

  function handleUnlink() {
    setError(null)
    startTransition(async () => {
      try {
        await unlinkOutlookEvent(meeting.id, meeting.entity_type, meeting.entity_id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte ta bort koppling')
      }
    })
  }

  function handleEntityChange(value: string) {
    setError(null)
    startTransition(async () => {
      try {
        if (!value) {
          await setMeetingEntity(meeting.id, null, null)
        } else {
          const [t, i] = value.split(':')
          await setMeetingEntity(meeting.id, t as 'company' | 'prospect', i)
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte koppla bolag')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Möte</CardTitle>
          {!editing && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <MeetingForm
            initial={{
              title: meeting.title ?? '',
              meeting_date: meeting.meeting_date ?? '',
              meeting_time: meeting.meeting_time ? meeting.meeting_time.slice(0, 5) : '',
              participants: meeting.participants ?? '',
              status: meeting.status ?? '',
              agenda: meeting.agenda ?? '',
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            disabled={isPending}
            lockDateTitle={linked}
          />
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid gap-1.5">
              <span className="text-xs text-[#6B6B6B]">Bolag</span>
              <select
                className={selectClass}
                value={entityValue}
                onChange={(e) => handleEntityChange(e.target.value)}
                disabled={isPending}
                aria-label="Koppla möte till bolag"
              >
                <option value="">Internt (inget bolag)</option>
                {customers.length > 0 && (
                  <optgroup label="Kunder">
                    {customers.map((c) => (
                      <option key={c.id} value={`company:${c.id}`}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
                {resellers.length > 0 && (
                  <optgroup label="Agenter">
                    {resellers.map((r) => (
                      <option key={r.id} value={`company:${r.id}`}>{r.name}</option>
                    ))}
                  </optgroup>
                )}
                {customerProspects.length > 0 && (
                  <optgroup label="Kund-prospekt">
                    {customerProspects.map((p) => (
                      <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
                {resellerProspects.length > 0 && (
                  <optgroup label="Agent-prospekt">
                    {resellerProspects.map((p) => (
                      <option key={p.id} value={`prospect:${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Datum</span>
              <span>{whenStr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6B]">Status</span>
              {status ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.label}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
            {meeting.participants?.trim() && (
              <div className="flex justify-between gap-4">
                <span className="text-[#6B6B6B] shrink-0">Deltagare</span>
                <span className="text-right">{meeting.participants}</span>
              </div>
            )}
            {meeting.agenda?.trim() && (
              <div className="pt-1">
                <p className="text-[#6B6B6B] mb-1">Agenda</p>
                <ul className="space-y-1">
                  {parseBullets(meeting.agenda).map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#1A1A1A]">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#656565]" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Outlook link */}
            {linked ? (
              <div className="space-y-1.5 border-t border-[#B8B8B8]/40 pt-3">
                <p className="text-xs text-[#6B6B6B]">Kopplat Outlook-möte</p>
                <div className="flex items-center gap-3">
                  {outlookWebLink && (
                    <a
                      href={outlookWebLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#656565] underline hover:text-[#1A1A1A]"
                    >
                      <ExternalLink className="size-3.5" />
                      Öppna i Outlook
                    </a>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={isPending}>
                    Ta bort koppling
                  </Button>
                </div>
                <p className="text-[11px] text-[#9A9A9A]">Titel, datum, tid och status styrs av Outlook.</p>
              </div>
            ) : outlookConnected && outlookEvents.length > 0 ? (
              <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
                <p className="text-xs text-[#6B6B6B]">Koppla Outlook-möte</p>
                <div className="flex items-center gap-2">
                  <select
                    className={selectClass}
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    aria-label="Välj Outlook-möte"
                  >
                    <option value="">Välj ett möte…</option>
                    {outlookEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLink}
                    disabled={isPending || !selectedEvent}
                  >
                    Koppla
                  </Button>
                </div>
              </div>
            ) : null}

            {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
