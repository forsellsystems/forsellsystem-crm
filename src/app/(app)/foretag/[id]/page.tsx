import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Briefcase, Handshake } from 'lucide-react'
import { getCompany, getResellers } from '@/lib/queries/companies'
import { getNotesWithProjects } from '@/lib/queries/notes'
import { getProjects } from '@/lib/queries/projects'
import { getMeetings } from '@/lib/queries/meetings'
import { getActiveUsers } from '@/lib/queries/users'
import { getMachines } from '@/lib/queries/machines'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'
import { CompanyDetailsCard } from '@/components/companies/company-details-card'
import { MoveToProspectButton } from '@/components/companies/move-to-prospect-button'
import { NewDealDialog } from '@/components/pipeline/new-deal-dialog'
import { ProjectsCard } from '@/components/projects/projects-card'
import { MeetingsCard } from '@/components/meetings/meetings-card'
import { SectionTabs } from '@/components/layout/section-tabs'
import { CustomerCommunication } from '@/components/microsoft/customer-communication'
import { createClient } from '@/lib/supabase/server'

export default async function ForetagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ flik?: string }>
}) {
  const { id } = await params
  const { flik } = await searchParams
  const supabase = await createClient()
  const [company, notes, projects, meetings, resellers, users, machines] = await Promise.all([
    getCompany(id),
    getNotesWithProjects('company', id),
    getProjects('company', id),
    getMeetings('company', id),
    getResellers(),
    getActiveUsers(),
    getMachines(),
  ])

  if (!company) notFound()

  // Signed-in CRM user (for their own Outlook mailbox/calendar), and the customer's
  // contact addresses to match mail/meetings against.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let currentUserId: string | null = null
  if (user) {
    const { data: urow } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    currentUserId = urow?.id ?? null
  }
  const communicationEmails = Array.from(
    new Set(
      [
        ...(company.email ? [company.email] : []),
        ...(company.contacts ?? [])
          .map((c) => c.email)
          .filter((e): e is string => Boolean(e)),
      ].map((e) => e.toLowerCase())
    )
  )

  // Allt i flikar, navigeringen högst upp, som på projektsidan. Företagsuppgifter
  // är förvalet: det är vad man vill se när man landar på en kund.
  const base = `/foretag/${company.id}`
  const tab =
    flik === 'anteckningar' ||
    flik === 'moten' ||
    flik === 'projekt' ||
    flik === 'affarer' ||
    flik === 'mejl'
      ? flik
      : 'uppgifter'

  const getStageLabel = (key: string) =>
    PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/foretag">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-display text-3xl text-[#1A1A1A]">
              {company.name}
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {company.country}
              {company.responsible_name &&
                ` · Ansvarig: ${company.responsible_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MoveToProspectButton companyId={company.id} />
          <DeleteCompanyButton companyId={company.id} companyName={company.name} />
        </div>
      </div>

      <SectionTabs
        items={[
          { label: 'Företagsuppgifter', href: base, active: tab === 'uppgifter' },
          {
            label: 'Anteckningar',
            href: `${base}?flik=anteckningar`,
            active: tab === 'anteckningar',
          },
          { label: 'Möten', href: `${base}?flik=moten`, active: tab === 'moten' },
          { label: 'Projekt', href: `${base}?flik=projekt`, active: tab === 'projekt' },
          { label: 'Affärer', href: `${base}?flik=affarer`, active: tab === 'affarer' },
          ...(currentUserId
            ? [{ label: 'Mejl', href: `${base}?flik=mejl`, active: tab === 'mejl' }]
            : []),
        ]}
      />

      {tab === 'uppgifter' && (
        <CompanyDetailsCard company={company} resellers={resellers} />
      )}

      {tab === 'anteckningar' && (
<Card>
          <CardHeader>
            <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddNoteForm entityType="company" entityId={company.id} />
            <NotesTimeline notes={notes} entityType="company" entityId={company.id} />
          </CardContent>
        </Card>
      )}

      {tab === 'moten' && (
        <MeetingsCard entityType="company" entityId={company.id} meetings={meetings} />
      )}

      {tab === 'projekt' && (
        <ProjectsCard entityType="company" entityId={company.id} projects={projects} />
      )}

      {/* Deals */}
      {tab === 'affarer' && (
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Affärer</CardTitle>
            <NewDealDialog
              companies={[{ id: company.id, name: company.name }]}
              resellers={resellers}
              users={users}
              machines={machines}
              triggerStyle="icon"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!company.deals || company.deals.length === 0 ? (
            <p className="text-sm text-[#6B6B6B]">Inga affärer ännu.</p>
          ) : (
            <div className="divide-y divide-[#B8B8B8]/40">
              {company.deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/pipeline/${deal.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="size-4 text-[#6B6B6B]" />
                    <div>
                      <p className="text-sm font-medium">
                        {deal.quote_number || 'Affär'}
                      </p>
                      <p className="text-xs text-[#6B6B6B]">
                        {formatDate(deal.created_at)}
                      </p>
                      {deal.reseller_name && (
                        <p className="flex items-center gap-1 text-[10px] text-[#D4A301] mt-0.5">
                          <Handshake className="size-3 shrink-0" />
                          {deal.reseller_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {deal.value && (
                      <span className="text-sm font-medium">
                        {formatCurrency(deal.value)}
                      </span>
                    )}
                    <Badge variant="outline">
                      {getStageLabel(deal.stage)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      )}

      {/* Outlook mail for the signed-in user, matched to this customer */}
      {tab === 'mejl' && currentUserId && (
        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
                  Mejl (Outlook)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#6B6B6B]">Laddar…</p>
              </CardContent>
            </Card>
          }
        >
          <CustomerCommunication userId={currentUserId} emails={communicationEmails} />
        </Suspense>
      )}

    </div>
  )
}
