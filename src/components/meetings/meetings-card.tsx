'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MEETING_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { NewMeetingDialog } from './new-meeting-dialog'
import type { Meeting } from '@/lib/types/database'

export function MeetingsCard({
  entityType,
  entityId,
  meetings,
  editable = true,
}: {
  entityType: 'prospect' | 'company'
  entityId: string
  meetings: Meeting[]
  editable?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Möten</CardTitle>
          {editable && (
            <NewMeetingDialog
              fixedEntity={{ type: entityType, id: entityId }}
              triggerStyle="icon"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">Inga möten tillagda.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {meetings.map((m) => {
              const status = MEETING_STATUSES.find((s) => s.key === m.status)
              const label =
                m.title?.trim() || (m.meeting_date ? formatDate(m.meeting_date) : 'Möte')
              return (
                <Link
                  key={m.id}
                  href={`/moten/${m.id}`}
                  className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {status && (
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                    )}
                    <span className="text-sm font-medium text-[#1A1A1A] truncate">{label}</span>
                    {status && <span className="text-xs text-[#6B6B6B]">{status.label}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {m.title?.trim() && m.meeting_date && (
                      <span className="text-xs text-[#6B6B6B]">
                        {formatDate(m.meeting_date)}
                        {m.meeting_time ? ` ${m.meeting_time.slice(0, 5)}` : ''}
                      </span>
                    )}
                    <ChevronRight className="size-4 text-[#B8B8B8]" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
