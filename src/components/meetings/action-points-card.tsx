'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  addActionPoint,
  toggleActionPoint,
  deleteActionPoint,
} from '@/lib/actions/meeting-actions'
import type { MeetingActionPoint } from '@/lib/types/database'

export function ActionPointsCard({
  meetingId,
  actionPoints,
}: {
  meetingId: string
  actionPoints: MeetingActionPoint[]
}) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    const value = content.trim()
    setContent('')
    startTransition(async () => {
      await addActionPoint(meetingId, value)
    })
  }

  function handleToggle(id: string, done: boolean) {
    startTransition(async () => {
      await toggleActionPoint(id, meetingId, done)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteActionPoint(id, meetingId)
    })
  }

  const doneCount = actionPoints.filter((a) => a.done).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Action points</CardTitle>
          {actionPoints.length > 0 && (
            <span className="text-xs text-[#6B6B6B]">
              {doneCount}/{actionPoints.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionPoints.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">Inga action points ännu.</p>
        ) : (
          <div className="space-y-1.5">
            {actionPoints.map((ap) => (
              <div key={ap.id} className="group flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ap.done}
                  onChange={() => handleToggle(ap.id, !ap.done)}
                  className="accent-[#656565] size-4 shrink-0"
                />
                <span
                  className={cn(
                    'text-sm flex-1',
                    ap.done ? 'line-through text-[#9A9A9A]' : 'text-[#1A1A1A]'
                  )}
                >
                  {ap.content}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(ap.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ny action point..."
            className="h-8"
          />
          <Button type="submit" size="icon-sm" variant="ghost" disabled={isPending || !content.trim()}>
            <Plus className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
