import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarDays } from 'lucide-react'
import { getAllMeetings } from '@/lib/queries/meetings'
import {
  getCustomerCompaniesForSelect,
  getResellers,
} from '@/lib/queries/companies'
import {
  getCustomerProspectsForSelect,
  getResellerProspectsForSelect,
} from '@/lib/queries/prospects'
import { MEETING_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { NewMeetingDialog } from '@/components/meetings/new-meeting-dialog'

export default async function MotenPage() {
  const [meetings, customers, resellers, customerProspects, resellerProspects] =
    await Promise.all([
      getAllMeetings(),
      getCustomerCompaniesForSelect(),
      getResellers(),
      getCustomerProspectsForSelect(),
      getResellerProspectsForSelect(),
    ])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Möten</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Alla möten hos kunder, prospekt och agenter
          </p>
        </div>
        <NewMeetingDialog
          customers={customers}
          resellers={resellers}
          customerProspects={customerProspects}
          resellerProspects={resellerProspects}
        />
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <CalendarDays className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Inga möten ännu.</p>
              <p className="text-xs mt-1">
                Lägg till möten på en kund, ett prospekt eller en agent.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Möte</TableHead>
                  <TableHead>Bolag</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => {
                  const status = MEETING_STATUSES.find((s) => s.key === m.status)
                  const meetingLabel =
                    m.title?.trim() ||
                    (m.meeting_date ? formatDate(m.meeting_date) : 'Möte')
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link
                          href={`/moten/${m.id}`}
                          className="font-medium text-[#656565] hover:underline"
                        >
                          {meetingLabel}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.entity_href ? (
                          <Link
                            href={m.entity_href}
                            className="text-[#6B6B6B] hover:underline"
                          >
                            {m.entity_name}
                          </Link>
                        ) : (
                          <span className="text-[#9A9A9A]">{m.entity_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {m.meeting_date ? formatDate(m.meeting_date) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {status ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.label}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
