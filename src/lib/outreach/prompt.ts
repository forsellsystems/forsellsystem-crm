import type { SupabaseClient } from '@supabase/supabase-js'
import { COMPANY_INFO_SECTIONS } from '@/lib/constants'

/**
 * Systemprompten byggs av Företagsinformation, inte av hårdkodad text.
 *
 * Poängen: när Kevin lägger till en regel i "Regler i kunddialog" eller ett
 * svar under "Invändningar och svar" gäller den nästa utkast direkt, utan att
 * någon rör koden. Det är därför sektionerna finns.
 */

// Ordlistan hör inte hemma här: den handlar om vilka ord VI och KUNDEN
// använder, och den skulle bara göra prompten längre utan att styra texten.
const SECTIONS_IN_PROMPT = COMPANY_INFO_SECTIONS.filter((s) => s.key !== 'ordlista')

type InfoRow = { section: string | null; title: string; content: string | null }

/** Företagsinformationen som text, sektion för sektion. */
export async function buildCompanyContext(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from('company_info')
    .select('section, title, content')
    .order('sort_order', { ascending: true })

  const rows = (data ?? []) as InfoRow[]
  const parts: string[] = []

  for (const section of SECTIONS_IN_PROMPT) {
    const inSection = rows.filter((r) => r.section === section.key && r.content?.trim())
    if (!inSection.length) continue
    parts.push(
      `## ${section.label}\n\n` +
        inSection.map((r) => `### ${r.title}\n${r.content!.trim()}`).join('\n\n')
    )
  }

  return parts.join('\n\n')
}

/** Produktregistret, så mejlet kan nämna rätt maskin vid rätt namn. */
export async function buildProductContext(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from('machines')
    .select('name, category')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const rows = (data ?? []) as { name: string; category: string }[]
  if (!rows.length) return ''

  const byCategory = new Map<string, string[]>()
  for (const r of rows) {
    if (!byCategory.has(r.category)) byCategory.set(r.category, [])
    byCategory.get(r.category)!.push(r.name)
  }

  return (
    '## Våra produkter\n\n' +
    [...byCategory.entries()].map(([cat, names]) => `${cat}: ${names.join(', ')}`).join('\n')
  )
}

/**
 * Systemprompten. Reglerna här är de som INTE hör hemma i Företagsinformation:
 * hur uppgiften ser ut och vad som aldrig får hamna i ett mejl. Allt som är
 * säljpolicy ligger i databasen i stället, så Kevin äger det själv.
 */
export function systemPrompt(
  companyContext: string,
  productContext: string,
  senderName: string,
  reportType: 'customer' | 'reseller' = 'customer'
): string {
  // Inledningen ligger som en regel i Företagsinformation och bär platshållaren
  // {avsändare}. Den fylls här, så texten kan ändras utan att koden rörs.
  const context = companyContext.replaceAll('{avsändare}', senderName)

  // Ett agentmejl har ett annat ärende: de ska sälja våra maskiner vidare, inte
  // köpa dem till en egen fabrik. Samma rapport, helt annan vinkel.
  const errand =
    reportType === 'reseller'
      ? `Mottagaren är en möjlig AGENT, alltså en part som skulle sälja Forsell Systems maskiner vidare till husfabriker på sin marknad. De ska inte köpa maskiner till en egen produktion. Skriv om ett samarbete: att deras kunder har de behov våra maskiner löser, och att ni vill undersöka om det finns en gemensam affär. Nämn en produkt bara om rapporten visar att deras marknad har det behovet.`
      : `Mottagaren är ett möjligt KUNDFÖRETAG som driver eller bygger en egen fabrik.`

  return `Du skriver första mejlet från Forsell Systems, utifrån en prospektrapport som en researchkörning tagit fram.

${errand}

Avsändare är ${senderName}. Signera mejlet med det namnet och ingenting annat. Hitta ALDRIG på ett avsändarnamn.

${context}

${productContext}

# Så ska mejlet skrivas

Längd: 150 till 200 ord, brödtext utan punktlistor.

Inled ALLTID med stycket som står under "Mejlets inledning" ovan, ordagrant, med avsändarnamnet ifyllt. Skriv inte om det.

Bygg mejlet på en KONKRET köpsignal ur rapporten: en fabrik som byggs, en rekrytering, en investering de själva gått ut med. Skriv varför du hör av dig just nu.

Nämn den produkt ur vårt sortiment som rapporten pekar ut som mest relevant, vid rätt namn, och säg i en mening vad den gör för deras situation. Lova ingenting om mått, vikter eller kapacitet.

Ställ en äkta fråga ur rapportens obesvarade frågor. Den visar att du läst på och att du vet vad du inte vet.

# Språk

Skriv på SVENSKA om bolaget är svenskt. Är det ett utländskt bolag, skriv hela mejlet på ENGELSKA, inledningen inkluderad. Avgör utifrån rapporten: bolagets säte, organisationsnummer och var fabrikerna ligger. Blanda aldrig språk i samma mejl.

# Absoluta regler

Använd ALDRIG siffror ur bolagets bokslut: omsättning, resultat, marginal eller tillgångar. Att citera någons ekonomi i ett första mejl är obehagligt. Deras egna publika investeringar och fabriksplaner är däremot fria att nämna.

Hitta aldrig på fakta. Allt konkret du skriver ska finnas i rapporten eller i informationen ovan. Är du osäker, skriv det inte.

Skriv aldrig ut ett tankstreck som skiljetecken. Använd punkt eller komma.

Inga superlativ, inga floskler, ingen säljjargong. Konkret, trygg, effektiv, nordisk ton.

Svara med enbart mejlet: ämnesrad på första raden i formen "Ämne: ...", sedan tomrad, sedan hälsningsfras, brödtext och avsändare. Ingen kommentar om texten, inga förklaringar.`
}
