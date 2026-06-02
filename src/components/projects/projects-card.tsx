'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { createProject } from '@/lib/actions/project-actions'
import type { Project } from '@/lib/types/database'

export function ProjectsCard({
  entityType,
  entityId,
  projects,
  editable = true,
}: {
  entityType: 'prospect' | 'company'
  entityId: string
  projects: Project[]
  editable?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    startTransition(async () => {
      const id = await createProject({
        entity_type: entityType,
        entity_id: entityId,
        currency: 'SEK',
      })
      router.push(`/projekt/${id}`)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Projekt</CardTitle>
          {editable && (
            <Button variant="ghost" size="icon-sm" onClick={handleCreate} disabled={isPending}>
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">Inga projekt tillagda.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {projects.map((p) => {
              const typeLabel = PROJECT_TYPES.find((t) => t.key === p.project_type)?.label
              const label = p.name?.trim() || typeLabel || 'Projekt'
              const status = PROJECT_STATUSES.find((s) => s.key === p.status)
              return (
                <Link
                  key={p.id}
                  href={`/projekt/${p.id}`}
                  className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {status && (
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                    )}
                    <span className="text-sm font-medium text-[#1A1A1A] truncate">
                      {label}
                    </span>
                    {status && <span className="text-xs text-[#6B6B6B]">{status.label}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.value_unknown ? (
                      <span className="text-xs text-[#6B6B6B]">Okänd</span>
                    ) : p.value != null ? (
                      <span className="text-sm font-medium">
                        {formatCurrency(p.value, p.currency)}
                      </span>
                    ) : null}
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
