import { fortnoxFetch, fortnoxJson } from './client'
import type { FortnoxProject, FortnoxProjectSummary } from './types'

// Fortnox projektregister. Kräver `project`-scopet, som sitter på integrationen
// i Fortnox Developer Portal ("Projekt"). Saknas det svarar allt här 403.
//
// Samma mönster som kundregistret i customers.ts: hela listan hämtas och
// användaren väljer, systemet kopplar aldrig något på egen hand.

function toSummary(project: FortnoxProject): FortnoxProjectSummary {
  return {
    projectNumber: String(project.ProjectNumber),
    description: project.Description ?? null,
    status: project.Status ?? null,
    startDate: project.StartDate ?? null,
    endDate: project.EndDate ?? null,
    comments: project.Comments ?? null,
    projectLeader: project.ProjectLeader ?? null,
  }
}

const PAGE_SIZE = 500
const MAX_PAGES = 20

/** Hela projektregistret, sorterat på projektnummer fallande (nyast först). */
export async function listProjects(): Promise<FortnoxProjectSummary[]> {
  const all: FortnoxProjectSummary[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fortnoxFetch(`/projects?limit=${PAGE_SIZE}&page=${page}`)
    const data = await fortnoxJson<{
      Projects?: FortnoxProject[]
      MetaInformation?: { '@TotalPages'?: number }
    }>(res, 'lista projekt')

    all.push(...(data.Projects ?? []).map(toSummary))

    const totalPages = data.MetaInformation?.['@TotalPages'] ?? 1
    if (page >= totalPages) break
  }

  // Högst projektnummer först: det senast upplagda är nästan alltid det sökta.
  all.sort((a, b) => Number(b.projectNumber) - Number(a.projectNumber))
  return all
}

/** Ett projekt via projektnummer. null när det inte finns (404). */
export async function getProjectSummary(
  projectNumber: string
): Promise<FortnoxProjectSummary | null> {
  const res = await fortnoxFetch(`/projects/${encodeURIComponent(projectNumber)}`)
  if (res.status === 404) return null
  const data = await fortnoxJson<{ Project: FortnoxProject }>(res, 'hämta projekt')
  return data.Project ? toSummary(data.Project) : null
}

/**
 * Skapa ett projekt i Fortnox. Fortnox delar ut projektnumret själv, så det som
 * kommer tillbaka är facit. Endast fält med värde skickas med.
 */
export async function createProject(fields: {
  description: string
  startDate?: string | null
  endDate?: string | null
  comments?: string | null
  projectLeader?: string | null
}): Promise<FortnoxProjectSummary> {
  const project: Record<string, string> = { Description: fields.description }
  if (fields.startDate) project.StartDate = fields.startDate
  if (fields.endDate) project.EndDate = fields.endDate
  if (fields.comments) project.Comments = fields.comments
  if (fields.projectLeader) project.ProjectLeader = fields.projectLeader

  const res = await fortnoxFetch('/projects', {
    method: 'POST',
    body: JSON.stringify({ Project: project }),
  })
  const data = await fortnoxJson<{ Project: FortnoxProject }>(res, 'skapa projekt')
  if (!data.Project) throw new Error('Fortnox svarade utan projekt vid skapande.')
  return toSummary(data.Project)
}
