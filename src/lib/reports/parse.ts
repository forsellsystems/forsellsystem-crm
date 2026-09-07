/**
 * Tolkning av en daglig prospektrapport.
 *
 * Formatet är INTE stabilt: de tidiga rapporterna skriver metadata som lös text
 * under rubriken, den senaste som en punktlista med fetstil, och sektionerna
 * varierar mellan körningar. Enda garanterade konventionen är filnamnet,
 * `YYYY-MM-DD--bolagsnamn.md`, enligt mappens README.
 *
 * Därför: datum och bolag hämtas i första hand ur filnamnet, resten plockas
 * tolerant ur texten. Hittas ett fält inte lämnas det TOMT — ett gissat
 * organisationsnummer är värre än inget.
 */

export type ParsedReport = {
  source_file: string
  report_date: string
  company_name: string
  org_number: string | null
  website: string | null
  icp_score: number | null
  content: string
}

// "2026-09-07--adapteo-ab.md" → datum + slug.
const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})--(.+?)\.md$/i

// Rubriken har hetat både "Dagens prospect:" och "Daglig prospectrapport:".
const TITLE_RE = /^#\s+(?:[^:\n]*:\s*)?(.+?)\s*$/m

// Svenskt organisationsnummer: sex siffror, bindestreck, fyra.
const ORG_RE = /\b(\d{6}-\d{4})\b/

// ICP-poängen skrivs "85/100" eller "**95/100**".
const ICP_RE = /\b(\d{1,3})\s*\/\s*100\b/

/** Bolagsnamnet ur filnamnets slug, som sista utväg. */
function nameFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

/**
 * Webbplatsen: den första länken som ser ut som bolagets egen, alltså en URL
 * på en rad som nämner "webbplats". Går det inte tas första URL:en i huvudet,
 * men bara om den inte pekar på en källsajt — rapporterna är fulla av länkar
 * till hitta.se, LinkedIn och pressmeddelanden, och ingen av dem är kundens.
 */
const SOURCE_HOSTS = [
  'hitta.se',
  'linkedin.com',
  'mynewsdesk.com',
  'allabolag.se',
  'ratsit.se',
  'bolagsverket.se',
  'google.com',
  'wikipedia.org',
]

function extractWebsite(head: string): string | null {
  const labelled = head.match(/webbplats[^\n]*?(https?:\/\/[^\s)\]<>,]+)/i)
  if (labelled) return labelled[1].replace(/[.,]$/, '')

  const all = head.match(/https?:\/\/[^\s)\]<>,]+/g) ?? []
  for (const url of all) {
    const clean = url.replace(/[.,]$/, '')
    const host = clean.replace(/^https?:\/\//, '').split('/')[0].toLowerCase()
    if (!SOURCE_HOSTS.some((s) => host.endsWith(s))) return clean
  }
  return null
}

export function parseReport(filename: string, content: string): ParsedReport | null {
  const base = filename.split('/').pop() ?? filename
  const m = base.match(FILENAME_RE)
  if (!m) return null

  const [, date, slug] = m

  // En körning utan kvalificerat prospekt sparas som "no-qualified-prospect".
  // Den har inget bolag och hör inte hemma i inkorgen.
  if (/^no-qualified-prospect$/i.test(slug)) return null

  // Bara huvudet används för metadata: längre ner i rapporten står andra
  // bolags organisationsnummer och massor av källänkar.
  const head = content.slice(0, 2000)

  const title = content.match(TITLE_RE)?.[1]?.trim()
  const org = head.match(ORG_RE)?.[1] ?? null
  const icpRaw = head.match(ICP_RE)?.[1]
  const icp = icpRaw ? Number(icpRaw) : null

  return {
    source_file: base,
    report_date: date,
    company_name: title || nameFromSlug(slug),
    org_number: org,
    website: extractWebsite(head),
    icp_score: icp !== null && Number.isFinite(icp) && icp >= 0 && icp <= 100 ? icp : null,
    content,
  }
}
