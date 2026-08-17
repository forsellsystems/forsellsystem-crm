import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Briefcase } from 'lucide-react'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'
import { MoveToProspectButton } from '@/components/companies/move-to-prospect-button'
import { createClient } from '@/lib/supabase/server'
import { getNotesWithProjects } from '@/lib/queries/notes'
import { getMeetings } from '@/lib/queries/meetings'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { MeetingsCard } from '@/components/meetings/meetings-card'
import { CompanyDetailsCard } from '@/components/companies/company-details-card'
import { SectionTabs } from '@/components/layout/section-tabs'
import type { CompanyWithRelations } from '@/lib/types/database'
import { ProjectsCard } from '@/components/projects/projects-card'
import { getProjects } from '@/lib/queries/projects'

async function getReseller(id: string) {
  const supabase = await createClient()

  const [companyRes, dealsRes, customersRes, contactsRes] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).eq('is_reseller', true).single(),
    supabase.from('deals').select('*, companies!deals_company_id_fkey(name)').eq('reseller_id', id).order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name, country').eq('reseller_id', id).order('name'),
    supabase
      .from('contacts')
      .select('*')
      .eq('company_id', id)
      .order('is_primary', { ascending: false })
      .order('name'),
  ])

  if (companyRes.error) return null

  return {
    ...companyRes.data,
    deals: (dealsRes.data ?? []).map((d) => ({
      ...d,
      company_name: (d.companies as { name: string } | null)?.name ?? 'Okänt',
    })),
    customers: customersRes.data ?? [],
    contacts: contactsRes.data ?? [],
  }
}

export default async function ResellerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ flik?: string }>
}) {
  const { id } = await params
  const { flik } = await searchParams
  const [reseller, notes, meetings, projects] = await Promise.all([
    getReseller(id),
    getNotesWithProjects('company', id),
    getMeetings('company', id),
    // Agenter kan driva egna projekt, t.ex. mot slutkund som de fakturerar.
    getProjects('company', id),
  ])

  if (!reseller) notFound()

  // Samma flikar som kundkortet. En agent har inga fabriksuppgifter, men har
  // kunder och affärer som går via den.
  const base = `/aterforsaljare/${reseller.id}`
  const tab =
    flik === 'anteckningar' ||
    flik === 'moten' ||
    flik === 'projekt' ||
    flik === 'affarer' ||
    flik === 'kunder'
      ? flik
      : 'uppgifter'

  const getStageLabel = (key: string) =>
    PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/aterforsaljare">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl text-[#1A1A1A]">
                {reseller.name}
              </h2>
              <Badge
                variant="outline"
                className="text-[#D4A301] border-[#D4A301]/40"
              >
                Agent
              </Badge>
            </div>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {reseller.country} &middot; Skapad {formatDate(reseller.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MoveToProspectButton companyId={reseller.id} companyType="reseller" />
          <DeleteCompanyButton
            companyId={reseller.id}
            companyName={reseller.name}
            redirectTo="/aterforsaljare"
          />
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
          { label: 'Kunder', href: `${base}?flik=kunder`, active: tab === 'kunder' },
        ]}
      />

      {tab === 'uppgifter' && (
        <CompanyDetailsCard company={reseller as CompanyWithRelations} />
      )}

      {tab === 'anteckningar' && (
<Card>
        <CardHeader>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddNoteForm entityType="company" entityId={reseller.id} />
          <NotesTimeline notes={notes} entityType="company" entityId={reseller.id} />
        </CardContent>
      </Card>
      )}

      {tab === 'moten' && (
        <MeetingsCard entityType="company" entityId={reseller.id} meetings={meetings} />
      )}

      {tab === 'projekt' && (
        <ProjectsCard entityType="company" entityId={reseller.id} projects={projects} />
      )}

      {/* Deals through this reseller */}
      {tab === 'affarer' && reseller.deals.length > 0 && (
                  <Card>
          <CardHeader>
            <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Affärer via denna agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#B8B8B8]/40">
              {reseller.deals.map((deal: { id: string; quote_number: string | null; stage: string; value: number | null; created_at: string; company_name: string }) => (
                <Link
                  key={deal.id}
                  href={`/pipeline/${deal.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="size-4 text-[#6B6B6B]" />
                    <div>
                      <p className="text-sm font-medium">{deal.company_name}</p>
                      <p className="text-xs text-[#6B6B6B]">
                        {deal.quote_number ? `#${deal.quote_number} · ` : ''}
                        {formatDate(deal.created_at)}
                      </p>
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
          </CardContent>
        </Card>
      )}

      {tab === 'affarer' && reseller.deals.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-[#6B6B6B]">
            Inga affärer går via denna agent ännu.
          </CardContent>
        </Card>
      )}

      {tab === 'kunder' && (
      <Card>
        <CardHeader>
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Kunder via denna agent</CardTitle>
        </CardHeader>
        <CardContent>
          {reseller.customers.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] text-center py-4">
              Inga kunder kopplade ännu.
            </p>
          ) : (
            <div className="divide-y divide-[#B8B8B8]/40">
              {reseller.customers.map((customer: { id: string; name: string; country: string }) => (
                <Link
                  key={customer.id}
                  href={`/foretag/${customer.id}`}
                  className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0 text-sm text-[#656565] hover:underline"
                >
                  <Building2 className="size-3.5 text-[#6B6B6B]" />
                  {customer.name}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

    </div>
  )
}
