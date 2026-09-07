'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { saveReport } from '@/lib/reports/store'
import { getCurrentUserId, logActivity } from '@/lib/actions/activity-actions'

function revalidateReports(id?: string) {
  revalidatePath('/rapporter')
  if (id) revalidatePath(`/rapporter/${id}`)
}

/**
 * Ta emot en uppladdad rapport. Samma tolkning och samma dubblettskydd som
 * webhooken — enda skillnaden är att den här vägen kräver inloggning i stället
 * för en delad hemlighet.
 */
export async function uploadReport(filename: string, content: string) {
  const supabase = await createClient()
  const result = await saveReport(supabase, filename, content)
  if (!result.ok) throw new Error(result.error)

  revalidateReports(result.id)
  return { id: result.id, created: result.created, company: result.report.company_name }
}

/**
 * Gör rapporten till ett kund-prospekt och lägg hela rapporten som anteckning
 * där. Bolagsnamn, webbplats och land följer med; resten fyller du i på
 * prospektet. Rapporten markeras hanterad och pekar på prospektet.
 *
 * Det här är det ENDA stället där en rapport blir ett prospekt, och det sker
 * bara när någon klickat. Inkorgen skapar aldrig något av sig själv.
 */
export async function createProspectFromReport(reportId: string) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('prospect_reports')
    .select('id, company_name, website, content, prospect_id')
    .eq('id', reportId)
    .single()
  if (!report) throw new Error('Rapporten finns inte.')
  if (report.prospect_id) throw new Error('Rapporten är redan kopplad till ett prospekt.')

  const { data: prospect, error } = await supabase
    .from('prospects')
    .insert({
      company_name: report.company_name,
      prospect_type: 'customer',
      // Rapporterna gäller svenska fabriker. Landet går att ändra på prospektet.
      country: 'Sverige',
      website: report.website,
      building_types: [],
    })
    .select('id')
    .single()
  if (error) throw new Error(`Kunde inte skapa prospekt: ${error.message}`)

  const authorId = await getCurrentUserId(supabase)
  await supabase.from('notes').insert({
    entity_type: 'prospect',
    entity_id: prospect.id,
    content: report.content,
    author_user_id: authorId,
  })

  await supabase
    .from('prospect_reports')
    .update({ status: 'hanterad', prospect_id: prospect.id, updated_at: new Date().toISOString() })
    .eq('id', reportId)

  await logActivity(supabase, {
    action: 'prospect_created',
    entity_type: 'prospect',
    entity_id: prospect.id,
    metadata: {
      label: report.company_name,
      href: `/prospekt/${prospect.id}`,
      snippet: 'Skapat från prospektrapport',
    },
  })

  revalidateReports(reportId)
  revalidatePath('/prospekt')
  revalidatePath('/logg')
  return prospect.id
}

/**
 * Koppla rapporten till ett bolag som redan finns, och lägg rapporten som
 * anteckning där. Används när researchen gäller någon ni redan har.
 */
export async function linkReportToExisting(
  reportId: string,
  target: { kind: 'prospect' | 'company'; id: string }
) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('prospect_reports')
    .select('id, content')
    .eq('id', reportId)
    .single()
  if (!report) throw new Error('Rapporten finns inte.')

  const authorId = await getCurrentUserId(supabase)
  await supabase.from('notes').insert({
    entity_type: target.kind,
    entity_id: target.id,
    content: report.content,
    author_user_id: authorId,
  })

  await supabase
    .from('prospect_reports')
    .update({
      status: 'hanterad',
      prospect_id: target.kind === 'prospect' ? target.id : null,
      company_id: target.kind === 'company' ? target.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  revalidateReports(reportId)
  revalidatePath(target.kind === 'prospect' ? '/prospekt' : '/foretag')
}

/** Rapporten höll inte. Den ligger kvar och går att läsa, men är avklarad. */
export async function dismissReport(reportId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('prospect_reports')
    .update({ status: 'avfardad', updated_at: new Date().toISOString() })
    .eq('id', reportId)
  if (error) throw new Error(`Kunde inte avfärda rapporten: ${error.message}`)
  revalidateReports(reportId)
}

/** Tillbaka till otriagerad. Kopplingen till bolaget lämnas orörd. */
export async function reopenReport(reportId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('prospect_reports')
    .update({ status: 'ny', updated_at: new Date().toISOString() })
    .eq('id', reportId)
  if (error) throw new Error(`Kunde inte återöppna rapporten: ${error.message}`)
  revalidateReports(reportId)
}

/**
 * Radera rapporten. Anteckningen som redan lagts på ett bolag är en egen post
 * och följer inte med — den raderas där den hör hemma.
 */
export async function deleteReport(reportId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('prospect_reports').delete().eq('id', reportId)
  if (error) throw new Error(`Kunde inte radera rapporten: ${error.message}`)
  revalidatePath('/rapporter')
}
