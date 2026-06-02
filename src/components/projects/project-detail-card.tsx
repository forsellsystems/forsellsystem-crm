'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { updateProject, deleteProject } from '@/lib/actions/project-actions'
import { ProjectForm, type ProjectFormValues } from './project-form'
import type { Project } from '@/lib/types/database'

export function ProjectDetailCard({
  project,
  entityHref,
}: {
  project: Project
  entityHref: string
}) {
  // A freshly created project has no data yet → open straight in edit mode.
  const isEmpty =
    !project.name?.trim() &&
    !project.project_type &&
    !project.status &&
    project.value == null &&
    !project.value_unknown &&
    !project.description?.trim() &&
    !project.contact_name?.trim() &&
    !project.contact_email?.trim() &&
    !project.contact_phone?.trim()

  const [editing, setEditing] = useState(isEmpty)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const typeLabel = PROJECT_TYPES.find((t) => t.key === project.project_type)?.label
  const status = PROJECT_STATUSES.find((s) => s.key === project.status)

  function handleSave(values: ProjectFormValues) {
    startTransition(async () => {
      await updateProject(project.id, project.entity_type, project.entity_id, {
        name: values.name || null,
        project_type: values.project_type || null,
        status: values.status || null,
        description: values.description || null,
        currency: values.currency || null,
        value: values.value_unknown ? null : values.value ? Number(values.value) : null,
        value_unknown: values.value_unknown,
        contact_name: values.contact_name || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
      })
      setEditing(false)
      router.refresh()
    })
  }

  function handleCancel() {
    // Cancelling a brand-new, never-filled project removes the empty row
    // and returns to the bolag instead of leaving an orphan.
    if (isEmpty) {
      startTransition(async () => {
        await deleteProject(project.id, project.entity_type, project.entity_id)
        router.push(entityHref)
      })
    } else {
      setEditing(false)
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteProject(project.id, project.entity_type, project.entity_id)
      router.push('/projekt')
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Projektdetaljer</CardTitle>
          {!editing && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <ProjectForm
            initial={{
              name: project.name ?? '',
              project_type: project.project_type ?? '',
              status: project.status ?? '',
              value: project.value != null ? String(project.value) : '',
              value_unknown: project.value_unknown,
              currency: project.currency ?? 'SEK',
              description: project.description ?? '',
              contact_name: project.contact_name ?? '',
              contact_email: project.contact_email ?? '',
              contact_phone: project.contact_phone ?? '',
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            disabled={isPending}
          />
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Typ</span>
              <span>{typeLabel ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6B]">Status</span>
              {status ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.label}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Budget</span>
              <span>
                {project.value_unknown
                  ? 'Okänd'
                  : project.value != null
                    ? formatCurrency(project.value, project.currency)
                    : '—'}
              </span>
            </div>
            {project.description && (
              <div className="pt-1">
                <p className="text-[#6B6B6B] mb-1">Beskrivning</p>
                <p className="text-[#1A1A1A] whitespace-pre-wrap">{project.description}</p>
              </div>
            )}
            {(project.contact_name || project.contact_email || project.contact_phone) && (
              <div className="border-t border-[#B8B8B8]/40 pt-3 space-y-2">
                <p className="font-condensed text-[10px] tracking-[0.12em] text-[#6B6B6B]">Kontaktperson</p>
                {project.contact_name && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Namn</span>
                    <span>{project.contact_name}</span>
                  </div>
                )}
                {project.contact_email && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">E-post</span>
                    <a href={`mailto:${project.contact_email}`} className="text-[#656565] hover:underline">
                      {project.contact_email}
                    </a>
                  </div>
                )}
                {project.contact_phone && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Telefon</span>
                    <a href={`tel:${project.contact_phone}`} className="text-[#656565] hover:underline">
                      {project.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
