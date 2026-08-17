'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteConnection, isConnected } from '@/lib/fortnox/store'
import { getOffer, getOfferSummary, listOffers, setOfferProject } from '@/lib/fortnox/offers'
import { listCustomers, getCustomerSummary, createCustomer } from '@/lib/fortnox/customers'
import {
  listProjects,
  getProjectSummary,
  createProject as createFortnoxProject,
} from '@/lib/fortnox/projects'
import { codeFromCountry, countryFromCode } from '@/lib/fortnox/countries'
import { FortnoxNotConnectedError } from '@/lib/fortnox/client'
import { logActivity } from '@/lib/actions/activity-actions'
import type {
  FortnoxOfferSummary,
  FortnoxCustomerSummary,
  FortnoxProjectSummary,
} from '@/lib/fortnox/types'

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string }

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof FortnoxNotConnectedError) {
    return { ok: false, error: 'Fortnox är inte anslutet. Anslut under Inställningar.' }
  }
  return { ok: false, error: err instanceof Error ? err.message : 'Något gick fel' }
}

/** Whether the CRM has a live Fortnox connection (for showing the offer field). */
export async function fortnoxConnected(): Promise<boolean> {
  return isConnected()
}

/** Disconnect the Fortnox account (deletes stored tokens). */
export async function disconnectFortnox(): Promise<Result> {
  try {
    await deleteConnection()
    revalidatePath('/installningar')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/** Look up a single offer by number (for previewing when linking in a dialog). */
export async function fetchOfferSummary(
  documentNumber: string
): Promise<Result<FortnoxOfferSummary>> {
  const trimmed = documentNumber.trim()
  if (!trimmed) return { ok: false, error: 'Ange ett offertnummer.' }
  try {
    const summary = await getOfferSummary(trimmed)
    return summary
      ? { ok: true, data: summary }
      : { ok: false, error: `Ingen offert med nummer ${trimmed} hittades i Fortnox.` }
  } catch (err) {
    return fail(err)
  }
}

/** Remove the offer link from a deal (inline, directly on the deal card). */
export async function unlinkDealOffer(dealId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('deals')
      .update({ fortnox_offer_documentnumber: null, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (error) throw new Error(error.message)
    revalidatePath(`/pipeline/${dealId}`)
    revalidatePath('/pipeline')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/** Recent offers from Fortnox, for the picker in the deal dialogs. */
export async function fetchRecentOffers(): Promise<Result<FortnoxOfferSummary[]>> {
  try {
    const offers = await listOffers(50)
    return { ok: true, data: offers }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Hela Fortnox kundregister, att välja ur när ett bolag ska kopplas. Kräver
 * `customer`-scopet. CRM:et väljer aldrig åt användaren, listan är underlaget.
 */
export async function fetchFortnoxCustomerList(): Promise<Result<FortnoxCustomerSummary[]>> {
  try {
    return { ok: true, data: await listCustomers() }
  } catch (err) {
    return fail(err)
  }
}

/** Vilka bolag som redan är kopplade, så väljaren kan markera upptagna kunder. */
export async function fetchLinkedCustomerNumbers(): Promise<
  Result<{ customerNumber: string; companyId: string; companyName: string }[]>
> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name, fortnox_customer_id')
      .not('fortnox_customer_id', 'is', null)
    return {
      ok: true,
      data: (data ?? []).map((c) => ({
        customerNumber: String(c.fortnox_customer_id),
        companyId: c.id,
        companyName: c.name,
      })),
    }
  } catch (err) {
    return fail(err)
  }
}

/** Revalidera bolagets sida oavsett om det är en kund eller en agent. */
function revalidateCompany(companyId: string) {
  revalidatePath(`/foretag/${companyId}`)
  revalidatePath(`/aterforsaljare/${companyId}`)
  revalidatePath('/foretag')
  revalidatePath('/aterforsaljare')
}

/** Does a CRM-bolag already exist for this Fortnox customer number? */
export async function matchFortnoxCustomer(
  customerNumber: string
): Promise<Result<{ id: string; name: string } | null>> {
  try {
    const supabase = await createClient()
    // limit(1) i stället för maybeSingle(): skulle två bolag mot förmodan dela
    // kundnummer ska det bli en träff, inte tolkas som "ingen kund finns" och
    // leda till att ännu en dubblett skapas.
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .eq('fortnox_customer_id', String(customerNumber))
      .limit(1)
    return { ok: true, data: data?.[0] ?? null }
  } catch (err) {
    return fail(err)
  }
}

/** Koppla ett bolag (kund eller agent) till en vald kund i Fortnox. */
export async function linkCompanyToFortnox(
  companyId: string,
  customerNumber: string
): Promise<Result<FortnoxCustomerSummary>> {
  try {
    const number = customerNumber.trim()
    if (!number) return { ok: false, error: 'Inget kundnummer valt.' }

    // Kunden måste finnas i Fortnox: kopplingen ska aldrig kunna peka i tomma luften.
    const summary = await getCustomerSummary(number)
    if (!summary) {
      return { ok: false, error: `Kund ${number} finns inte i Fortnox.` }
    }

    const supabase = await createClient()
    const { data: taken } = await supabase
      .from('companies')
      .select('id, name')
      .eq('fortnox_customer_id', number)
      .neq('id', companyId)
      .limit(1)
    if (taken?.[0]) {
      return {
        ok: false,
        error: `Fortnox-kund ${number} är redan kopplad till ${taken[0].name}.`,
      }
    }

    const { error } = await supabase
      .from('companies')
      .update({ fortnox_customer_id: number, updated_at: new Date().toISOString() })
      .eq('id', companyId)
    if (error) throw new Error(error.message)

    revalidateCompany(companyId)
    return { ok: true, data: summary }
  } catch (err) {
    return fail(err)
  }
}

/** Ta bort bolagets Fortnox-koppling. Rör inget i Fortnox. */
export async function unlinkCompanyFromFortnox(companyId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('companies')
      .update({ fortnox_customer_id: null, updated_at: new Date().toISOString() })
      .eq('id', companyId)
    if (error) throw new Error(error.message)
    revalidateCompany(companyId)
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Hämta kundens uppgifter från Fortnox in på bolaget. Fortnox styr de fält som
 * har ett värde där; tomma fält i Fortnox lämnar CRM:ets uppgift orörd, så en
 * hämtning aldrig raderar något du redan skrivit in.
 */
export async function importFortnoxCustomerInfo(
  companyId: string
): Promise<Result<{ updated: string[] }>> {
  try {
    const supabase = await createClient()
    const { data: company, error: readError } = await supabase
      .from('companies')
      .select('id, fortnox_customer_id')
      .eq('id', companyId)
      .single()
    if (readError || !company) throw new Error('Kunde inte läsa bolaget.')
    if (!company.fortnox_customer_id) {
      return { ok: false, error: 'Bolaget är inte kopplat till Fortnox.' }
    }

    const summary = await getCustomerSummary(String(company.fortnox_customer_id))
    if (!summary) {
      return {
        ok: false,
        error: `Kund ${company.fortnox_customer_id} finns inte längre i Fortnox.`,
      }
    }

    const country = countryFromCode(summary.countryCode)
    const update: Record<string, string> = {}
    if (summary.name) update.name = summary.name
    if (summary.orgNumber) update.org_number = summary.orgNumber
    if (country) update.country = country
    // E-post och telefon skrivs INTE på bolaget. Adresserna i Fortnox är en
    // människas, inte företagets, och personer hör i kontakter. Se
    // fetchFortnoxCustomerContact nedan.

    if (Object.keys(update).length === 0) {
      return { ok: false, error: 'Kunden i Fortnox saknar uppgifter att hämta.' }
    }

    update.updated_at = new Date().toISOString()
    const { error } = await supabase.from('companies').update(update).eq('id', companyId)
    if (error) throw new Error(error.message)

    revalidateCompany(companyId)
    const labels: Record<string, string> = {
      name: 'namn',
      org_number: 'orgnr',
      country: 'land',
    }
    return {
      ok: true,
      data: {
        updated: Object.keys(update)
          .filter((k) => k !== 'updated_at')
          .map((k) => labels[k] ?? k),
      },
    }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Lägg upp bolaget som kund i Fortnox och koppla det. Fortnox delar ut
 * kundnumret. Avbryts om bolaget redan är kopplat, så ingen dubblett skapas i
 * deras register av ett dubbelklick.
 */
export async function createFortnoxCustomerForCompany(
  companyId: string
): Promise<Result<FortnoxCustomerSummary>> {
  try {
    const supabase = await createClient()
    const { data: company, error: readError } = await supabase
      .from('companies')
      .select('id, name, org_number, email, phone, country, fortnox_customer_id')
      .eq('id', companyId)
      .single()
    if (readError || !company) throw new Error('Kunde inte läsa bolaget.')
    if (company.fortnox_customer_id) {
      return {
        ok: false,
        error: `Bolaget är redan kopplat till Fortnox-kund ${company.fortnox_customer_id}.`,
      }
    }

    const created = await createCustomer({
      name: company.name,
      orgNumber: company.org_number,
      email: company.email,
      phone: company.phone,
      countryCode: codeFromCountry(company.country),
    })

    const { error } = await supabase
      .from('companies')
      .update({
        fortnox_customer_id: created.customerNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
    if (error) throw new Error(error.message)

    revalidateCompany(companyId)
    return { ok: true, data: created }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Create a CRM kund from a Fortnox offer's customer. Idempotent on the Fortnox
 * customer number (returns the existing kund if already imported). Faller
 * tillbaka på offertens kundnamn om kundposten inte går att läsa.
 */
export async function createCompanyFromFortnox(
  documentNumber: string
): Promise<Result<{ id: string; name: string }>> {
  try {
    const offer = await getOffer(documentNumber)
    const custNo = offer?.CustomerNumber != null ? String(offer.CustomerNumber) : null
    if (!custNo) return { ok: false, error: 'Offerten saknar kundnummer i Fortnox.' }

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name')
      .eq('fortnox_customer_id', custNo)
      .maybeSingle()
    if (existing) return { ok: true, data: existing }

    let full: FortnoxCustomerSummary | null = null
    try {
      full = await getCustomerSummary(custNo)
    } catch {
      full = null
    }

    const name = full?.name || offer?.CustomerName || `Kund ${custNo}`
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        org_number: full?.orgNumber || null,
        email: full?.email || null,
        phone: full?.phone || null,
        // Okänd landskod faller tillbaka på Sverige: land är obligatoriskt här.
        country: countryFromCode(full?.countryCode) ?? 'Sverige',
        fortnox_customer_id: custNo,
        is_reseller: false,
      })
      .select('id, name')
      .single()
    if (error) throw new Error(error.message)

    await logActivity(supabase, {
      action: 'company_created',
      entity_type: 'company',
      entity_id: company.id,
      metadata: { label: company.name, href: `/foretag/${company.id}` },
    })
    revalidatePath('/foretag')
    return { ok: true, data: company }
  } catch (err) {
    return fail(err)
  }
}

// ============================================
// PROJEKT
// Speglar kundkopplingen: du väljer alltid ur listan, systemet kopplar aldrig
// själv, och ett projektnummer som inte kommer från Fortnox får inte finnas.
// ============================================

/** Hela Fortnox projektregister, att välja ur när ett CRM-projekt ska kopplas. */
export async function fetchFortnoxProjectList(): Promise<Result<FortnoxProjectSummary[]>> {
  try {
    return { ok: true, data: await listProjects() }
  } catch (err) {
    return fail(err)
  }
}

/** Vilka CRM-projekt som redan är kopplade, så väljaren kan gråa ut upptagna. */
export async function fetchLinkedProjectNumbers(): Promise<
  Result<{ projectNumber: string; projectId: string; projectName: string }[]>
> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('projects')
      .select('id, name, project_type, fortnox_project_id')
      .not('fortnox_project_id', 'is', null)
    return {
      ok: true,
      data: (data ?? []).map((p) => ({
        projectNumber: String(p.fortnox_project_id),
        projectId: p.id,
        projectName: p.name || p.project_type || 'Projekt',
      })),
    }
  } catch (err) {
    return fail(err)
  }
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projekt/${projectId}`)
  revalidatePath('/projekt')
}


/**
 * Projektets bolag och dess Fortnox-koppling. Ett Fortnox-projekt bär ingen kund,
 * så ordningen måste hållas här i stället: kunden kopplas först, sedan projektet.
 * Prospekt kan aldrig kopplas, de har ingen kundkoppling alls.
 */
async function projectOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
): Promise<
  | { ok: true; name: string; customerNumber: string }
  | { ok: false; error: string }
> {
  const { data: project } = await supabase
    .from('projects')
    .select('entity_type, entity_id')
    .eq('id', projectId)
    .single()
  if (!project) return { ok: false, error: 'Kunde inte läsa projektet.' }

  if (project.entity_type !== 'company') {
    return {
      ok: false,
      error: 'Projekt på prospekt kan inte kopplas. Flytta prospektet till kund först.',
    }
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name, fortnox_customer_id')
    .eq('id', project.entity_id)
    .single()
  if (!company) return { ok: false, error: 'Kunde inte läsa projektets bolag.' }

  if (!company.fortnox_customer_id) {
    return {
      ok: false,
      error: `${company.name} är inte kopplad mot Fortnox. Koppla kunden först, sedan projektet.`,
    }
  }
  return { ok: true, name: company.name, customerNumber: String(company.fortnox_customer_id) }
}

/** Koppla ett CRM-projekt till ett valt projekt i Fortnox. */
export async function linkProjectToFortnox(
  projectId: string,
  projectNumber: string
): Promise<Result<FortnoxProjectSummary>> {
  try {
    const number = projectNumber.trim()
    if (!number) return { ok: false, error: 'Inget projektnummer valt.' }

    const supabaseOwner = await createClient()
    const owner = await projectOwner(supabaseOwner, projectId)
    if (!owner.ok) return { ok: false, error: owner.error }

    // Projektet måste finnas i Fortnox: kopplingen ska aldrig peka i tomma luften.
    const summary = await getProjectSummary(number)
    if (!summary) return { ok: false, error: `Projekt ${number} finns inte i Fortnox.` }

    const supabase = await createClient()
    const { data: taken } = await supabase
      .from('projects')
      .select('id, name, project_type')
      .eq('fortnox_project_id', number)
      .neq('id', projectId)
      .limit(1)
    if (taken?.[0]) {
      const label = taken[0].name || taken[0].project_type || 'ett annat projekt'
      return { ok: false, error: `Fortnox-projekt ${number} är redan kopplat till ${label}.` }
    }

    const { error } = await supabase
      .from('projects')
      .update({ fortnox_project_id: number, updated_at: new Date().toISOString() })
      .eq('id', projectId)
    if (error) throw new Error(error.message)

    revalidateProject(projectId)
    return { ok: true, data: summary }
  } catch (err) {
    return fail(err)
  }
}

/** Ta bort projektets Fortnox-koppling. Rör inget i Fortnox. */
export async function unlinkProjectFromFortnox(projectId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('projects')
      .update({ fortnox_project_id: null, updated_at: new Date().toISOString() })
      .eq('id', projectId)
    if (error) throw new Error(error.message)
    revalidateProject(projectId)
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Hämta projektets uppgifter från Fortnox in på CRM-projektet. Tomma fält i
 * Fortnox lämnar CRM:ets uppgift orörd, så en hämtning aldrig raderar något.
 */
export async function importFortnoxProjectInfo(
  projectId: string
): Promise<Result<{ updated: string[] }>> {
  try {
    const supabase = await createClient()
    const { data: project, error: readError } = await supabase
      .from('projects')
      .select('id, fortnox_project_id')
      .eq('id', projectId)
      .single()
    if (readError || !project) throw new Error('Kunde inte läsa projektet.')
    if (!project.fortnox_project_id) {
      return { ok: false, error: 'Projektet är inte kopplat till Fortnox.' }
    }

    const summary = await getProjectSummary(String(project.fortnox_project_id))
    if (!summary) {
      return {
        ok: false,
        error: `Projekt ${project.fortnox_project_id} finns inte längre i Fortnox.`,
      }
    }

    const update: Record<string, string> = {}
    if (summary.description) update.name = summary.description
    if (summary.comments) update.description = summary.comments
    // ContactPerson hämtas INTE in: projektets kontaktperson är en av bolagets
    // kontakter, och Fortnox fritext går inte att matcha mot en kontaktpost.

    if (Object.keys(update).length === 0) {
      return { ok: false, error: 'Projektet i Fortnox saknar uppgifter att hämta.' }
    }

    update.updated_at = new Date().toISOString()
    const { error } = await supabase.from('projects').update(update).eq('id', projectId)
    if (error) throw new Error(error.message)

    revalidateProject(projectId)
    const labels: Record<string, string> = { name: 'namn', description: 'beskrivning' }
    return {
      ok: true,
      data: {
        updated: Object.keys(update)
          .filter((k) => k !== 'updated_at')
          .map((k) => labels[k] ?? k),
      },
    }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Lägg upp CRM-projektet i Fortnox och koppla det. Fortnox delar ut numret.
 * Avbryts om projektet redan är kopplat, så ett dubbelklick inte skapar en
 * dubblett i deras register.
 */
export async function createFortnoxProjectForProject(
  projectId: string
): Promise<Result<FortnoxProjectSummary>> {
  try {
    const supabase = await createClient()
    const { data: project, error: readError } = await supabase
      .from('projects')
      .select('id, name, project_type, description, fortnox_project_id')
      .eq('id', projectId)
      .single()
    if (readError || !project) throw new Error('Kunde inte läsa projektet.')
    if (project.fortnox_project_id) {
      return {
        ok: false,
        error: `Projektet är redan kopplat till Fortnox-projekt ${project.fortnox_project_id}.`,
      }
    }

    const owner = await projectOwner(supabase, projectId)
    if (!owner.ok) return { ok: false, error: owner.error }

    // Fortnox kräver en beskrivning; projektets namn är den enda rimliga källan.
    const projectName = (project.name || project.project_type || '').trim()
    if (!projectName) {
      return { ok: false, error: 'Projektet behöver ett namn innan det kan läggas upp i Fortnox.' }
    }

    // Fortnox-projekt saknar kundruta, så kunden måste stå i namnet för att
    // projektet ska gå att känna igen där. Samma mönster som "Danwood Polen".
    const description = `${owner.name} – ${projectName}`

    const created = await createFortnoxProject({
      description,
      comments: project.description,
    })

    const { error } = await supabase
      .from('projects')
      .update({
        fortnox_project_id: created.projectNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
    if (error) throw new Error(error.message)

    revalidateProject(projectId)
    return { ok: true, data: created }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Skriv affärens projektnummer på dess Fortnox-offert. Det är här kund och
 * projekt möts i Fortnox: offerten bär båda, projektposten bär ingen kund.
 * Rör bara projektfältet, aldrig kunden på offerten (den kan vara agenten).
 */
export async function setDealOfferProject(
  dealId: string
): Promise<Result<{ offer: string; project: string }>> {
  try {
    const supabase = await createClient()
    const { data: deal, error: readError } = await supabase
      .from('deals')
      .select('id, fortnox_offer_documentnumber, project_id')
      .eq('id', dealId)
      .single()
    if (readError || !deal) throw new Error('Kunde inte läsa affären.')

    if (!deal.fortnox_offer_documentnumber) {
      return { ok: false, error: 'Affären är inte kopplad till någon Fortnox-offert.' }
    }
    if (!deal.project_id) {
      return { ok: false, error: 'Affären har inget projekt. Välj projekt på affären först.' }
    }

    const { data: project } = await supabase
      .from('projects')
      .select('name, project_type, fortnox_project_id')
      .eq('id', deal.project_id)
      .single()
    if (!project) return { ok: false, error: 'Kunde inte läsa affärens projekt.' }
    if (!project.fortnox_project_id) {
      const label = project.name || project.project_type || 'Projektet'
      return { ok: false, error: `${label} är inte kopplat mot Fortnox. Koppla projektet först.` }
    }

    await setOfferProject(
      String(deal.fortnox_offer_documentnumber),
      String(project.fortnox_project_id)
    )

    revalidatePath(`/pipeline/${dealId}`)
    return {
      ok: true,
      data: {
        offer: String(deal.fortnox_offer_documentnumber),
        project: String(project.fortnox_project_id),
      },
    }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Kontaktpersonen som Fortnox känner till för bolagets kund. Personens adress
 * ligger i EmailOffer/EmailOrder, inte i det generella Email-fältet, och namnet
 * i YourReference som ofta är tomt. EmailInvoice används inte: den är ekonomins
 * funktionsadress, inte en säljkontakt.
 *
 * Returnerar bara underlaget. Ingenting sparas förrän användaren bekräftar, för
 * namnet kan behöva fyllas i och en kontakt ska inte uppstå av ett knapptryck
 * som bara skulle "titta".
 */
export async function fetchFortnoxCustomerContact(companyId: string): Promise<
  Result<{
    name: string | null
    email: string | null
    phone: string | null
    existingContactId: string | null
    existingContactName: string | null
  }>
> {
  try {
    const supabase = await createClient()
    const { data: company } = await supabase
      .from('companies')
      .select('fortnox_customer_id')
      .eq('id', companyId)
      .single()
    if (!company?.fortnox_customer_id) {
      return { ok: false, error: 'Bolaget är inte kopplat till Fortnox.' }
    }

    const summary = await getCustomerSummary(String(company.fortnox_customer_id))
    if (!summary) {
      return { ok: false, error: `Kund ${company.fortnox_customer_id} finns inte i Fortnox.` }
    }
    if (!summary.contactEmail && !summary.contactName && !summary.contactPhone) {
      return { ok: false, error: 'Fortnox har inga kontaktuppgifter på den här kunden.' }
    }

    // Matcha på e-post: samma adress är samma person, oavsett stavning på namnet.
    let existing: { id: string; name: string } | null = null
    if (summary.contactEmail) {
      const { data } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('company_id', companyId)
        .ilike('email', summary.contactEmail)
        .limit(1)
      existing = data?.[0] ?? null
    }

    return {
      ok: true,
      data: {
        name: summary.contactName,
        email: summary.contactEmail,
        phone: summary.contactPhone,
        existingContactId: existing?.id ?? null,
        existingContactName: existing?.name ?? null,
      },
    }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Spara kontaktpersonen från Fortnox som en kontakt på bolaget. Finns adressen
 * redan uppdateras den kontakten i stället för att en dubblett skapas.
 */
export async function saveFortnoxCustomerContact(
  companyId: string,
  fields: { name: string; email: string | null; phone: string | null }
): Promise<Result<{ created: boolean }>> {
  try {
    const name = fields.name.trim()
    if (!name) {
      return { ok: false, error: 'Kontakten behöver ett namn. Fortnox saknar det, så skriv in det.' }
    }

    const supabase = await createClient()
    const email = fields.email?.trim() || null
    const phone = fields.phone?.trim() || null

    if (email) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('company_id', companyId)
        .ilike('email', email)
        .limit(1)
      if (existing?.[0]) {
        const { error } = await supabase
          .from('contacts')
          .update({ name, phone, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id)
        if (error) throw new Error(error.message)
        revalidateCompany(companyId)
        return { ok: true, data: { created: false } }
      }
    }

    // Första kontakten på bolaget blir primär: någon ska vara det.
    const { count } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const { error } = await supabase.from('contacts').insert({
      company_id: companyId,
      name,
      email,
      phone,
      is_primary: (count ?? 0) === 0,
    })
    if (error) throw new Error(error.message)

    revalidateCompany(companyId)
    return { ok: true, data: { created: true } }
  } catch (err) {
    return fail(err)
  }
}
