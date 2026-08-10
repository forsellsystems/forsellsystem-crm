import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatWeekdayAbbrev, formatMonthAbbrev, formatWeekdayDate } from '@/lib/utils'
import { CreateOutlookMeetingDialog } from './create-outlook-meeting-dialog'

type EntityOption = { id: string; name: string }

export type BolagOptions = {
  customers: EntityOption[]
  resellers: EntityOption[]
  customerProspects: EntityOption[]
  resellerProspects: EntityOption[]
  users: EntityOption[]
}

// A unified agenda row — either a CRM meeting card (internal link) or an Outlook
// calendar event (external link, with an option to create a linked meeting card).
export type AgendaItem = {
  key: string
  title: string
  subtitle: string | null
  date: string | null // YYYY-MM-DD
  time: string | null // HH:MM
  href: string
  external: boolean
  outlook: boolean
  outlookEventId?: string | null
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const SECTION_ORDER = ['Denna vecka', 'Nästa vecka', 'Senare'] as const

export function UpcomingMeetingsList({
  items,
  bolag,
}: {
  items: AgendaItem[]
  bolag?: BolagOptions
}) {
  const now = new Date()
  const todayStr = ymd(now)
  const tomorrowStr = ymd(addDays(now, 1))
  const dow = now.getDay() // 0=Sun..6=Sat
  const daysToSunday = dow === 0 ? 0 : 7 - dow
  const endOfWeekStr = ymd(addDays(now, daysToSunday))
  const endOfNextWeekStr = ymd(addDays(now, daysToSunday + 7))

  const sectionOf = (date: string | null): (typeof SECTION_ORDER)[number] => {
    if (!date) return 'Senare'
    if (date <= endOfWeekStr) return 'Denna vecka'
    if (date <= endOfNextWeekStr) return 'Nästa vecka'
    return 'Senare'
  }

  const sections = SECTION_ORDER.map((label) => ({
    label,
    items: items.filter((it) => sectionOf(it.date) === label),
  })).filter((s) => s.items.length > 0)

  // Left-hand date badge: relative day (Idag/Imorgon) or weekday, big day number, month.
  const badge = (date: string | null) => {
    const isToday = date === todayStr
    const top = !date
      ? '—'
      : isToday
        ? 'Idag'
        : date === tomorrowStr
          ? 'Imorgon'
          : formatWeekdayAbbrev(date)
    const dayNum = date ? String(Number(date.slice(8, 10))) : '–'
    const month = date ? formatMonthAbbrev(date) : ''
    return (
      <div
        className={cn(
          'flex w-14 shrink-0 flex-col items-center rounded-lg border py-1',
          isToday ? 'border-[#D4A301]/50 bg-[#F2BB01]/10' : 'border-[#B8B8B8]/50 bg-[#F2F2F0]'
        )}
      >
        <span className="font-condensed text-[8px] uppercase tracking-wide text-[#6B6B6B] whitespace-nowrap">
          {top}
        </span>
        <span
          className={cn(
            'text-lg font-semibold leading-tight',
            isToday ? 'text-[#D4A301]' : 'text-[#1A1A1A]'
          )}
        >
          {dayNum}
        </span>
        <span className="text-[9px] text-[#9A9A9A]">{month}</span>
      </div>
    )
  }

  const renderRow = (it: AgendaItem) => {
    const meta = it.outlook
      ? it.subtitle
        ? `Outlook · ${it.subtitle}`
        : 'Outlook'
      : it.subtitle || 'Möte'
    const time = it.time || 'Heldag'

    // Outlook event: title opens Outlook; a button creates a linked card.
    if (it.external) {
      return (
        <div key={it.key} className="flex items-center gap-3">
          {badge(it.date)}
          <a
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 hover:opacity-80"
          >
            <p className="truncate text-sm font-medium text-[#1A1A1A]">{it.title}</p>
            <p className="truncate text-xs text-[#6B6B6B]">{meta}</p>
          </a>
          <span className="shrink-0 text-xs text-[#6B6B6B]">{time}</span>
          {it.outlookEventId && (
            <CreateOutlookMeetingDialog
              eventId={it.outlookEventId}
              eventTitle={it.title}
              eventWhen={`${it.date ? formatWeekdayDate(it.date) : ''}${it.time ? ` · ${it.time}` : ''}`}
              customers={bolag?.customers ?? []}
              resellers={bolag?.resellers ?? []}
              customerProspects={bolag?.customerProspects ?? []}
              resellerProspects={bolag?.resellerProspects ?? []}
              users={bolag?.users ?? []}
            />
          )}
        </div>
      )
    }

    // CRM meeting card: whole row links to the meeting page.
    return (
      <Link
        key={it.key}
        href={it.href}
        className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-1 hover:bg-[#F2F2F0] transition-colors"
      >
        {badge(it.date)}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#1A1A1A]">{it.title}</p>
          <p className="truncate text-xs text-[#6B6B6B]">{meta}</p>
        </div>
        <span className="shrink-0 text-xs text-[#6B6B6B]">{time}</span>
      </Link>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Kommande möten
        </CardTitle>
        <Link href="/moten" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A]">
          Visa alla
        </Link>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] text-center py-6">Inga kommande möten.</p>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="font-condensed text-[11px] uppercase tracking-[0.12em] text-[#9A9A9A]">
                  {section.label}
                </p>
                <div className="space-y-2">{section.items.map(renderRow)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
