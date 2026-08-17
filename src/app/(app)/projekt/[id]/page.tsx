import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Building2 } from 'lucide-react'
import { getProject, getProjectMachines, getProjectSpecs } from '@/lib/queries/projects'
import { createClient } from '@/lib/supabase/server'
import { getNotes } from '@/lib/queries/notes'
import { getProjectDeals, getCompanyDeals, getResellerDeals } from '@/lib/queries/deals'
import { getMeetingsForProject } from '@/lib/queries/meetings'
import { PROJECT_TYPES } from '@/lib/constants'
import { ProjectDetailCard } from '@/components/projects/project-detail-card'
import { DeleteProjectButton } from '@/components/projects/delete-project-button'
import { ProjectDealsCard } from '@/components/projects/project-deals-card'
import { ProjectMachinesCard } from '@/components/projects/project-machines-card'
import { ProjectConditionsCard } from '@/components/projects/project-conditions-card'
import { getMachines } from '@/lib/queries/machines'
import { getResellers, getCompaniesForSelect } from '@/lib/queries/companies'
import { getActiveUsers } from '@/lib/queries/users'
import { NewDealDialog } from '@/components/pipeline/new-deal-dialog'
import { MeetingsCard } from '@/components/meetings/meetings-card'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { SectionTabs } from '@/components/layout/section-tabs'

export default async function ProjektDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ flik?: string }>
}) {
  const { id } = await params
  const { flik } = await searchParams
  const [project, notes, meetings, projectMachines, specs, machines] = await Promise.all([
    getProject(id),
    getNotes('project', id),
    getMeetingsForProject(id),
    getProjectMachines(id),
    getProjectSpecs(id),
    getMachines(),
  ])

  if (!project) notFound()

  // Projektets kontaktperson väljs ur ägarens kontakter. Kontakter finns på både
  // bolag och prospekt, så väljaren fungerar oavsett var projektet hänger.
  const supabase = await createClient()
  const ownerColumn = project.entity_type === 'company' ? 'company_id' : 'prospect_id'
  const { data: contactRows } = await supabase
    .from('contacts')
    .select('id, name, email, phone')
    .eq(ownerColumn, project.entity_id)
    .order('is_primary', { ascending: false })
    .order('name')
  const contacts = contactRows ?? []

  // Deals can only be linked when the project belongs to a customer (company)
  const isCompanyProject = project.entity_type === 'company'
  // Kandidater att koppla: kundens egna affärer, eller för ett agentprojekt de
  // affärer som går VIA agenten (där står agenten som reseller, inte som kund).
  const [linkedDeals, candidateDeals, dealCompanies, dealResellers, dealUsers] =
    isCompanyProject
      ? await Promise.all([
          getProjectDeals(project.id),
          project.entity_is_reseller
            ? getResellerDeals(project.entity_id)
            : getCompanyDeals(project.entity_id),
          getCompaniesForSelect(),
          getResellers(),
          getActiveUsers(),
        ])
      : [[], [], [], [], []]

  // Allt ligger i flikar, navigeringen högst upp. Detaljerna är förvalet: det är
  // vad man vill se när man landar på ett projekt.
  const base = `/projekt/${project.id}`
  const tab =
    flik === 'anteckningar' ||
    flik === 'moten' ||
    flik === 'forutsattningar' ||
    flik === 'produkter' ||
    flik === 'affarer'
      ? flik
      : 'detaljer'

  const typeLabel = PROJECT_TYPES.find((t) => t.key === project.project_type)?.label
  const title = project.name?.trim() || typeLabel || 'Projekt'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/projekt">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">{title}</h2>
          <Link
            href={project.entity_href}
            className="flex items-center gap-1.5 text-sm text-[#656565] hover:underline mt-1"
          >
            <Building2 className="size-3.5" />
            {project.entity_name}
          </Link>
        </div>
        </div>
        <DeleteProjectButton
          projectId={project.id}
          projectName={title}
          entityType={project.entity_type}
          entityId={project.entity_id}
        />
      </div>

      <SectionTabs
        items={[
          { label: 'Projektdetaljer', href: base, active: tab === 'detaljer' },
          {
            label: 'Anteckningar',
            href: `${base}?flik=anteckningar`,
            active: tab === 'anteckningar',
          },
          {
            label: 'Möten',
            href: `${base}?flik=moten`,
            active: tab === 'moten',
            count: meetings.length,
          },
          {
            label: 'Förutsättningar',
            href: `${base}?flik=forutsattningar`,
            active: tab === 'forutsattningar',
          },
          {
            label: 'Produkter',
            href: `${base}?flik=produkter`,
            active: tab === 'produkter',
          },
          ...(isCompanyProject
            ? [
                {
                  label: 'Affärer',
                  href: `${base}?flik=affarer`,
                  active: tab === 'affarer',
                  count: linkedDeals.length,
                },
              ]
            : []),
        ]}
      />

      {tab === 'detaljer' && (
        <ProjectDetailCard
          project={project}
          entityHref={project.entity_href}
          contacts={contacts}
        />
      )}

      {tab === 'anteckningar' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddNoteForm entityType="project" entityId={project.id} />
            <NotesTimeline notes={notes} entityType="project" entityId={project.id} />
          </CardContent>
        </Card>
      )}

      {tab === 'moten' && (
        <MeetingsCard entityType="project" entityId={project.id} meetings={meetings} />
      )}

      {tab === 'forutsattningar' && (
        <ProjectConditionsCard
          projectId={project.id}
          specs={specs}
          conditionsNote={project.conditions_note}
          products={projectMachines.map((m) => ({ id: m.id, name: m.machine_name }))}
        />
      )}

      {tab === 'produkter' && (
        <ProjectMachinesCard
          projectId={project.id}
          machines={projectMachines}
          options={machines.map((m) => ({ id: m.id, name: m.name, category: m.category }))}
        />
      )}

      {tab === 'affarer' && isCompanyProject && (
        <ProjectDealsCard
          projectId={project.id}
          linkedDeals={linkedDeals}
          candidateDeals={candidateDeals}
          createSlot={
            <NewDealDialog
              companies={
                project.entity_is_reseller
                  ? dealCompanies
                  : [{ id: project.entity_id, name: project.entity_name }]
              }
              resellers={dealResellers}
              users={dealUsers}
              machines={machines}
              triggerStyle="icon"
              defaultProjectId={project.id}
              defaultCompanyId={project.entity_is_reseller ? undefined : project.entity_id}
              defaultResellerId={project.entity_is_reseller ? project.entity_id : undefined}
            />
          }
        />
      )}

    </div>
  )
}
