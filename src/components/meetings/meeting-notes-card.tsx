'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateMeeting } from '@/lib/actions/meeting-actions'
import type { Meeting } from '@/lib/types/database'

// Always-visible, inline-editable meeting notes card (own card, not buried in the
// Möte card's edit form). Updates only the `notes` field.
export function MeetingNotesCard({ meeting }: { meeting: Meeting }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(meeting.notes ?? '')
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await updateMeeting(meeting.id, meeting.entity_type, meeting.entity_id, {
        notes: value.trim() || null,
      })
      setEditing(false)
      router.refresh()
    })
  }

  function cancel() {
    setValue(meeting.notes ?? '')
    setEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Mötesanteckningar
        </CardTitle>
        {!editing && (
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              rows={10}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Vad sades på mötet..."
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon-sm" onClick={cancel} disabled={isPending}>
                <X className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={save} disabled={isPending}>
                <Check className="size-4" />
              </Button>
            </div>
          </div>
        ) : meeting.notes?.trim() ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left text-sm text-[#1A1A1A] whitespace-pre-wrap"
          >
            {meeting.notes}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-[#9A9A9A] hover:text-[#6B6B6B]"
          >
            Lägg till mötesanteckningar…
          </button>
        )}
      </CardContent>
    </Card>
  )
}
