import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import {
  History,
  MessageSquare,
  MoveRight,
  Building2,
  UserPlus,
  Briefcase,
  FolderKanban,
  CalendarDays,
  ArrowLeft,
} from 'lucide-react'
import { getActivityLog, type ActivityLogEntry } from '@/lib/queries/activity'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatTime, formatDate, formatDayLabel } from '@/lib/utils'

const stageLabel = (key?: string) =>
  PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key ?? ''

const actionIcon: Record<string, typeof History> = {
  note_added: MessageSquare,
  deal_stage_changed: MoveRight,
  company_created: Building2,
  prospect_created: UserPlus,
  deal_created: Briefcase,
  project_created: FolderKanban,
}

// Which level (kund / prospekt / affär / projekt) the comment was added on
const levelLabel = (entityType: string): string =>
  ({
    company: 'Kund',
    prospect: 'Prospekt',
    deal: 'Affär',
    project: 'Projekt',
    contact: 'Kontakt',
  })[entityType] ?? entityType

function ParentLink({ entry }: { entry: ActivityLogEntry }) {
  const { label, href } = entry.metadata
  if (!label) return null
  return href ? (
    <Link href={href} className="text-[#656565] hover:underline">
      {label}
    </Link>
  ) : (
    <span>{label}</span>
  )
}

function NonNoteText({ entry }: { entry: ActivityLogEntry }) {
  const m = entry.metadata
  const label = m.href ? (
    <Link href={m.href} className="font-medium text-[#656565] hover:underline">
      {m.label}
    </Link>
  ) : (
    <span className="font-medium">{m.label}</span>
  )
  switch (entry.action) {
    case 'deal_stage_changed':
      return (
        <>
          Flyttade affär {label}: {stageLabel(m.from)} &rarr; {stageLabel(m.to)}
        </>
      )
    case 'company_created':
      return <>La till kund {label}</>
    case 'prospect_created':
      return <>La till prospekt {label}</>
    case 'deal_created':
      return <>Skapade affär {label}</>
    case 'project_created':
      return <>Skapade projekt{m.label ? <> hos {label}</> : ''}</>
    default:
      return <>{entry.action}</>
  }
}

function RowShell({ Icon, children }: { Icon: typeof History; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F2F2F0]">
        <Icon className="size-3.5 text-[#656565]" />
      </div>
      <div className="min-w-0 space-y-0.5">{children}</div>
    </div>
  )
}

function NoteRow({ entry }: { entry: ActivityLogEntry }) {
  const m = entry.metadata
  // Comments are shown as-is — no interpretation/classification.
  return (
    <RowShell Icon={MessageSquare}>
      <p className="text-sm text-[#1A1A1A]">{m.snippet || 'La till kommentar'}</p>
      <div className="flex items-center gap-2 text-xs text-[#6B6B6B] flex-wrap">
        <span>
          {levelLabel(entry.entity_type)}: <ParentLink entry={entry} />
        </span>
        <span>&middot;</span>
        <span>{entry.user_name ?? 'System'}</span>
        <span>&middot;</span>
        <span>{formatTime(entry.created_at)}</span>
      </div>
    </RowShell>
  )
}

function MeetingRow({ entry }: { entry: ActivityLogEntry }) {
  const m = entry.metadata
  const time = m.meeting_time ? m.meeting_time.slice(0, 5) : null
  const date = m.meeting_date
    ? `${formatDate(m.meeting_date)}${time ? ` kl ${time}` : ''}`
    : time
      ? `kl ${time}`
      : null
  const secondary = [date, m.snippet].filter(Boolean).join(' · ')
  const heading = `Möte${m.title ? `: ${m.title}` : ''}`

  return (
    <RowShell Icon={CalendarDays}>
      <p className="text-sm text-[#1A1A1A]">
        {m.href ? (
          <Link href={m.href} className="font-medium text-[#656565] hover:underline">
            {heading}
          </Link>
        ) : (
          <span className="font-medium">{heading}</span>
        )}
      </p>
      {secondary ? <p className="text-xs text-[#6B6B6B]">{secondary}</p> : null}
      <div className="flex items-center gap-2 text-xs text-[#6B6B6B] flex-wrap">
        {m.label ? (
          <>
            {m.parent_href ? (
              <Link href={m.parent_href} className="text-[#656565] hover:underline">
                {m.label}
              </Link>
            ) : (
              <span>{m.label}</span>
            )}
            <span>&middot;</span>
          </>
        ) : null}
        <span>{entry.user_name ?? 'System'}</span>
      </div>
    </RowShell>
  )
}

function EntryRow({ entry }: { entry: ActivityLogEntry }) {
  if (entry.action === 'note_added') return <NoteRow entry={entry} />
  if (entry.action === 'meeting_created') return <MeetingRow entry={entry} />

  const Icon = actionIcon[entry.action] ?? History
  return (
    <RowShell Icon={Icon}>
      <p className="text-sm text-[#1A1A1A]">
        <NonNoteText entry={entry} />
      </p>
      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
        <span>{entry.user_name ?? 'System'}</span>
        <span>&middot;</span>
        <span>{formatTime(entry.created_at)}</span>
      </div>
    </RowShell>
  )
}

type DayGroup = { key: string; label: string; entries: ActivityLogEntry[] }

function groupByDay(entries: ActivityLogEntry[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const key = format(new Date(entry.created_at), 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (!last || last.key !== key) {
      groups.push({ key, label: formatDayLabel(entry.created_at), entries: [entry] })
    } else {
      last.entries.push(entry)
    }
  }
  return groups
}

export default async function LoggPage() {
  const entries = await getActivityLog()
  const groups = groupByDay(entries)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href="/installningar"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="size-3.5" />
        Inställningar
      </Link>
      <div>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Logg</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Försäljningsaktivitet per dag</p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <History className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Ingen aktivitet ännu.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <h3 className="font-condensed text-xs uppercase tracking-[0.12em] text-[#6B6B6B] mb-3">
                {group.label}
              </h3>
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    {group.entries.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
