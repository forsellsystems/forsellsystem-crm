import { TrendingUp, Kanban, BarChart3, Trophy } from 'lucide-react'
import { getDashboardStats } from '@/lib/queries/dashboard'
import { getUpcomingMeetings } from '@/lib/queries/meetings'
import { getAllTodos } from '@/lib/queries/todos'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getConnection } from '@/lib/microsoft/store'
import { getUpcomingEvents } from '@/lib/microsoft/graph'
import { getCustomerCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import {
  getCustomerProspectsForSelect,
  getResellerProspectsForSelect,
} from '@/lib/queries/prospects'
import { getActiveUsers } from '@/lib/queries/users'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  UpcomingMeetingsList,
  type AgendaItem,
} from '@/components/dashboard/upcoming-meetings-list'
import { OpenTodosList } from '@/components/dashboard/open-todos-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [
    stats,
    meetings,
    todos,
    customers,
    resellers,
    customerProspects,
    resellerProspects,
    users,
  ] = await Promise.all([
    getDashboardStats(),
    getUpcomingMeetings(8),
    getAllTodos({ showDone: false }),
    getCustomerCompaniesForSelect(),
    getResellers(),
    getCustomerProspectsForSelect(),
    getResellerProspectsForSelect(),
    getActiveUsers(),
  ])

  // The signed-in user's upcoming Outlook events (if connected), merged into the
  // agenda alongside CRM meeting cards.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let userId: string | null = null
  if (user) {
    const { data: urow } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    userId = urow?.id ?? null
  }

  let outlookEvents: Awaited<ReturnType<typeof getUpcomingEvents>> = []
  if (userId && (await getConnection(userId))) {
    outlookEvents = await getUpcomingEvents(userId, 8).catch(() => [])
  }

  // Merge CRM meetings + Outlook events; skip Outlook events already represented
  // by a linked CRM meeting card, sort by date/time, take the soonest.
  const linkedIds = new Set(
    meetings.map((m) => m.outlook_event_id).filter((v): v is string => Boolean(v))
  )
  const crmItems: AgendaItem[] = meetings.map((m) => ({
    key: `crm-${m.id}`,
    title: m.title || 'Möte',
    subtitle: m.entity_name || null,
    date: m.meeting_date,
    time: m.meeting_time ? m.meeting_time.slice(0, 5) : null,
    href: `/moten/${m.id}`,
    external: false,
    outlook: Boolean(m.outlook_event_id),
  }))
  const outlookItems: AgendaItem[] = outlookEvents
    .filter((ev) => !linkedIds.has(ev.id))
    .map((ev) => {
      const dt = ev.start?.dateTime
      return {
        key: `ol-${ev.id}`,
        title: ev.subject || '(namnlöst möte)',
        subtitle: ev.location?.displayName || null,
        date: dt ? dt.slice(0, 10) : null,
        time: !ev.isAllDay && dt && dt.length >= 16 ? dt.slice(11, 16) : null,
        href: ev.webLink || '#',
        external: true,
        outlook: true,
        outlookEventId: ev.id,
      }
    })
  const agenda: AgendaItem[] = [...crmItems, ...outlookItems]
    .sort((a, b) => {
      const ak = `${a.date ?? '9999-99-99'} ${a.time ?? '99:99'}`
      const bk = `${b.date ?? '9999-99-99'} ${b.time ?? '99:99'}`
      return ak < bk ? -1 : ak > bk ? 1 : 0
    })
    .slice(0, 6)

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page heading with display font */}
      <div>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Dashboard</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Överblick över försäljningen
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          title="Pipelinevärde"
          value={formatCurrency(stats.pipelineValue)}
          subtitle="Totalt värde aktiva affärer"
          icon={TrendingUp}
          accent
        />
        <StatCard
          title="Aktiva affärer"
          value={String(stats.activeDeals)}
          subtitle="Affärer i pipeline"
          icon={Kanban}
        />
        <StatCard
          title="Snittordervärde"
          value={
            stats.avgDealValue > 0 ? formatCurrency(stats.avgDealValue) : '—'
          }
          subtitle="Medelvärde vunna affärer"
          icon={BarChart3}
        />
        <StatCard
          title="Vunna affärer"
          value={String(stats.wonDealsCount)}
          subtitle="Avslutade med affär"
          icon={Trophy}
        />
      </div>

      {/* Agenda: what to do today */}
      <div className="grid gap-6 lg:grid-cols-2 stagger-children">
        <UpcomingMeetingsList
          items={agenda}
          bolag={{ customers, resellers, customerProspects, resellerProspects, users }}
        />
        <OpenTodosList todos={todos.slice(0, 6)} />
      </div>
    </div>
  )
}
