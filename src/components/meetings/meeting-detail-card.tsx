'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MEETING_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { updateMeeting, deleteMeeting } from '@/lib/actions/meeting-actions'
import { MeetingForm, type MeetingFormValues } from './meeting-form'
import type { Meeting } from '@/lib/types/database'

export function MeetingDetailCard({
  meeting,
  entityHref,
}: {
  meeting: Meeting
  entityHref: string
}) {
  // A freshly created meeting has no data yet → open straight in edit mode.
  const isEmpty =
    !meeting.title?.trim() &&
    !meeting.meeting_date &&
    !meeting.status &&
    !meeting.agenda?.trim() &&
    !meeting.notes?.trim()

  const [editing, setEditing] = useState(isEmpty)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const status = MEETING_STATUSES.find((s) => s.key === meeting.status)

  function handleSave(values: MeetingFormValues) {
    startTransition(async () => {
      await updateMeeting(meeting.id, meeting.entity_type, meeting.entity_id, {
        title: values.title || null,
        meeting_date: values.meeting_date || null,
        status: values.status || null,
        agenda: values.agenda || null,
        notes: values.notes || null,
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
              status: meeting.status ?? '',
              agenda: meeting.agenda ?? '',
              notes: meeting.notes ?? '',
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            disabled={isPending}
          />
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Datum</span>
              <span>{meeting.meeting_date ? formatDate(meeting.meeting_date) : '—'}</span>
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
            {meeting.agenda && (
              <div className="pt-1">
                <p className="text-[#6B6B6B] mb-1">Agenda</p>
                <p className="text-[#1A1A1A] whitespace-pre-wrap">{meeting.agenda}</p>
              </div>
            )}
            {meeting.notes && (
              <div className="pt-1">
                <p className="text-[#6B6B6B] mb-1">Mötesanteckningar</p>
                <p className="text-[#1A1A1A] whitespace-pre-wrap">{meeting.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
