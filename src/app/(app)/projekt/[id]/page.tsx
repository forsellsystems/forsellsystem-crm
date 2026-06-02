import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Building2 } from 'lucide-react'
import { getProject } from '@/lib/queries/projects'
import { getNotes } from '@/lib/queries/notes'
import { getProjectDeals, getCompanyDeals } from '@/lib/queries/deals'
import { PROJECT_TYPES } from '@/lib/constants'
import { ProjectDetailCard } from '@/components/projects/project-detail-card'
import { ProjectDealsCard } from '@/components/projects/project-deals-card'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'

export default async function ProjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, notes] = await Promise.all([
    getProject(id),
    getNotes('project', id),
  ])

  if (!project) notFound()

  // Deals can only be linked when the project belongs to a customer (company)
  const isCompanyProject = project.entity_type === 'company'
  const [linkedDeals, candidateDeals] = isCompanyProject
    ? await Promise.all([
        getProjectDeals(project.id),
        getCompanyDeals(project.entity_id),
      ])
    : [[], []]

  const typeLabel = PROJECT_TYPES.find((t) => t.key === project.project_type)?.label
  const title = project.name?.trim() || typeLabel || 'Projekt'

  return (
    <div className="space-y-6 animate-fade-in-up">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProjectDetailCard project={project} entityHref={project.entity_href} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isCompanyProject && (
            <ProjectDealsCard
              projectId={project.id}
              linkedDeals={linkedDeals}
              candidateDeals={candidateDeals}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddNoteForm entityType="project" entityId={project.id} />
              <NotesTimeline notes={notes} entityType="project" entityId={project.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
