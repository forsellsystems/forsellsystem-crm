'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Link2Off, DownloadCloud, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchFortnoxProjectList,
  fetchLinkedProjectNumbers,
  linkProjectToFortnox,
  unlinkProjectFromFortnox,
  importFortnoxProjectInfo,
  createFortnoxProjectForProject,
} from '@/lib/actions/fortnox-actions'
import type { FortnoxProjectSummary } from '@/lib/fortnox/types'

// Fortnox statusnycklar. Okänt värde visas som det är i stället för att döljas.
const STATUS_LABEL: Record<string, string> = {
  NOTSTARTED: 'Ej påbörjat',
  ONGOING: 'Pågående',
  COMPLETED: 'Avslutat',
}

function Picker({
  currentProjectId,
  onPick,
  onClose,
  disabled = false,
}: {
  currentProjectId: string
  onPick: (project: FortnoxProjectSummary) => void
  onClose: () => void
  disabled?: boolean
}) {
  const [projects, setProjects] = useState<FortnoxProjectSummary[] | null>(null)
  const [taken, setTaken] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchFortnoxProjectList(), fetchLinkedProjectNumbers()]).then(
      ([listRes, linkedRes]) => {
        if (!active) return
        setLoading(false)
        if (!listRes.ok) {
          setError(listRes.error)
          return
        }
        setProjects(listRes.data)
        if (linkedRes.ok) {
          const map: Record<string, string> = {}
          for (const row of linkedRes.data) {
            if (row.projectId !== currentProjectId) map[row.projectNumber] = row.projectName
          }
          setTaken(map)
        }
      }
    )
    return () => {
      active = false
    }
  }, [currentProjectId])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
        <span>{loading ? 'Hämtar projekt från Fortnox...' : 'Välj projekt i Fortnox'}</span>
        <button type="button" onClick={onClose} className="hover:text-[#1A1A1A]">
          <X className="size-3.5" />
        </button>
      </div>

      {projects && projects.length > 0 && (
        <div className="max-h-56 divide-y divide-[#B8B8B8]/40 overflow-y-auto rounded-lg border border-border">
          {projects.map((p) => {
            const takenBy = taken[p.projectNumber]
            return (
              <button
                type="button"
                key={p.projectNumber}
                disabled={disabled || Boolean(takenBy)}
                onClick={() => onPick(p)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#F2F2F0] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <span className="min-w-0">
                  <span className="font-medium">{p.description ?? `Projekt ${p.projectNumber}`}</span>
                  <span className="text-[#6B6B6B]"> · {p.projectNumber}</span>
                  {p.status && (
                    <span className="block text-xs text-[#9A9A9A]">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  )}
                </span>
                {takenBy && (
                  <span className="shrink-0 text-xs text-[#9A9A9A]">Kopplat: {takenBy}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {projects && projects.length === 0 && (
        <p className="text-xs text-[#6B6B6B]">Projektregistret i Fortnox är tomt.</p>
      )}

      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}

/**
 * Fortnox-kopplingen på ett CRM-projekt. Samma regler som på bolagen: du väljer
 * alltid ur listan, systemet kopplar aldrig själv, och projektnumret går inte
 * att skriva in. Ett nummer som inte kommer från Fortnox betyder ingenting.
 */
export function FortnoxProjectLink({
  projectId,
  projectNumber,
}: {
  projectId: string
  projectNumber: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function reset() {
    setError(null)
    setMessage(null)
  }

  function pick(project: FortnoxProjectSummary) {
    reset()
    startTransition(async () => {
      const res = await linkProjectToFortnox(projectId, project.projectNumber)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPicking(false)
      router.refresh()
    })
  }

  function createInFortnox() {
    reset()
    startTransition(async () => {
      const res = await createFortnoxProjectForProject(projectId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPicking(false)
      setMessage(`Upplagt i Fortnox som projekt ${res.data.projectNumber}.`)
      router.refresh()
    })
  }

  function importInfo() {
    reset()
    startTransition(async () => {
      const res = await importFortnoxProjectInfo(projectId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMessage(`Hämtat från Fortnox: ${res.data.updated.join(', ')}.`)
      router.refresh()
    })
  }

  function unlink() {
    reset()
    startTransition(async () => {
      const res = await unlinkProjectFromFortnox(projectId)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-2 border-t border-[#B8B8B8]/40 pt-3">
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="text-[#6B6B6B]">Projektnummer</span>
        <span className={projectNumber ? '' : 'text-[#B8B8B8]'}>{projectNumber ?? '—'}</span>
      </div>
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="text-[#6B6B6B]">Fortnox</span>
        {projectNumber ? (
          <span className="font-medium text-[#D4A301]">Kopplat</span>
        ) : (
          <span className="text-[#B8B8B8]">Ingen koppling</span>
        )}
      </div>

      {projectNumber ? (
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" className="-ml-2 text-[#6B6B6B]" disabled={isPending} onClick={importInfo}>
            <DownloadCloud className="size-4" data-icon="inline-start" />
            Hämta info
          </Button>
          <Button variant="ghost" size="sm" className="text-[#6B6B6B]" disabled={isPending} onClick={unlink}>
            <Link2Off className="size-4" data-icon="inline-start" />
            Ta bort koppling
          </Button>
        </div>
      ) : !picking ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-[#6B6B6B]"
          disabled={isPending}
          onClick={() => {
            reset()
            setPicking(true)
          }}
        >
          <Link2 className="size-4" data-icon="inline-start" />
          Koppla mot Fortnox
        </Button>
      ) : (
        <div className="space-y-2">
          <Picker
            currentProjectId={projectId}
            onPick={pick}
            onClose={() => {
              setPicking(false)
              reset()
            }}
            disabled={isPending}
          />
          <div className="space-y-1">
            <p className="text-xs text-[#6B6B6B]">Finns projektet inte i listan?</p>
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6B6B6B]" disabled={isPending} onClick={createInFortnox}>
              <Plus className="size-4" data-icon="inline-start" />
              Lägg upp i Fortnox
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-xs text-[#4C9A5A]">{message}</p>}
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
