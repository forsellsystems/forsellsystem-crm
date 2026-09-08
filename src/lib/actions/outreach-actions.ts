'use server'

import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { OUTREACH_MODEL, outreachConfigured } from '@/lib/outreach/config'
import {
  buildCompanyContext,
  buildProductContext,
  systemPrompt,
} from '@/lib/outreach/prompt'

export type Recipient = {
  name: string
  role: string
  /** Varför just den här personen, med rapportens egna ord. */
  why: string
}

function client() {
  if (!outreachConfigured()) {
    throw new Error(
      'ANTHROPIC_API_KEY saknas i miljön. Lägg in den i Vercel och gör en ny deploy.'
    )
  }
  return new Anthropic()
}

async function reportFor(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prospect_reports')
    .select('id, company_name, content, outreach_draft, outreach_recipient, outreach_instruction, report_type')
    .eq('id', id)
    .single()
  if (!data) throw new Error('Rapporten finns inte.')
  return { supabase, report: data }
}

/**
 * Avsändarens namn, hämtat från den inloggade användaren. Utan det gissar
 * modellen ett namn utifrån bolagsnamnet, vilket den bevisligen gör.
 */
async function senderName(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Ingen inloggad användare.')

  const { data } = await supabase.from('users').select('name').eq('auth_id', user.id).maybeSingle()
  const name = data?.name?.trim()
  if (!name) throw new Error('Din användare saknar namn, så mejlet kan inte signeras.')
  return name
}

/**
 * Steg 1: vilka personer namnger rapporten?
 *
 * Görs med ett anrop till Claude i stället för med en regex, eftersom
 * rapportformatet varierar mellan körningar. Ett strikt verktygsschema
 * garanterar att svaret går att lita på som data.
 */
export async function listReportRecipients(reportId: string): Promise<Recipient[]> {
  const { report } = await reportFor(reportId)

  const res = await client().messages.create({
    model: OUTREACH_MODEL,
    max_tokens: 4000,
    tools: [
      {
        name: 'lista_personer',
        description:
          'Lämna de namngivna personer hos bolaget som rapporten pekar ut, i den ordning ' +
          'rapporten själv rangordnar dem. Ta bara med personer som faktiskt arbetar hos ' +
          'bolaget, aldrig konsulter eller externa projektledare.',
        strict: true,
        input_schema: {
          type: 'object' as const,
          properties: {
            personer: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Personens namn' },
                  role: { type: 'string', description: 'Roll eller titel, som rapporten anger den' },
                  why: {
                    type: 'string',
                    description:
                      'En kort mening om varför personen är relevant för ett samtal om ' +
                      'produktionsutrustning. Max 20 ord.',
                  },
                },
                required: ['name', 'role', 'why'],
                additionalProperties: false,
              },
            },
          },
          required: ['personer'],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'lista_personer' },
    messages: [
      {
        role: 'user',
        content: `Här är en prospektrapport om ${report.company_name}. Lista de namngivna personerna hos bolaget.\n\n${report.content}`,
      },
    ],
  })

  const call = res.content.find((b) => b.type === 'tool_use')
  if (!call || call.type !== 'tool_use') return []
  const input = call.input as { personer?: Recipient[] }
  return input.personer ?? []
}

/**
 * Steg 2: skriv utkastet till den valda personen.
 *
 * feedback är Kevins kritik av föregående utkast. Finns den skickas även det
 * gamla utkastet med, så omgenereringen blir en rättning och inte ett nytt
 * tärningskast.
 */
export async function generateOutreachDraft(
  reportId: string,
  recipient: string,
  instruction?: string
): Promise<string> {
  const { supabase, report } = await reportFor(reportId)

  const [companyContext, productContext, sender] = await Promise.all([
    buildCompanyContext(supabase),
    buildProductContext(supabase),
    senderName(supabase),
  ])

  const parts = [
    `Skriv mejlet till: ${recipient}`,
    '',
    `Prospektrapport om ${report.company_name}:`,
    '',
    report.content,
  ]

  // Instruktionen är Kevins egen styrning av just det här mejlet. Den väger
  // tyngre än promptens allmänna råd, men aldrig tyngre än de absoluta reglerna.
  if (instruction?.trim()) {
    parts.push('', '# Så vill jag ha mejlet', '', instruction.trim())
  }

  // Finns ett tidigare utkast är omgenereringen en rättning, inte ett nytt
  // försök från noll.
  if (report.outreach_draft?.trim()) {
    parts.push(
      '',
      '# Föregående utkast',
      '',
      report.outreach_draft.trim(),
      '',
      'Skriv om mejlet enligt instruktionen ovan. Behåll det som fungerade.'
    )
  }

  const res = await client().messages.create({
    model: OUTREACH_MODEL,
    max_tokens: 4000,
    // Företagsinformationen är samma vid varje anrop, så den cachas.
    system: [
      {
        type: 'text',
        text: systemPrompt(
          companyContext,
          productContext,
          sender,
          report.report_type === 'reseller' ? 'reseller' : 'customer'
        ),
        cache_control: { type: 'ephemeral' },
      },
    ],
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: parts.join('\n') }],
  })

  const draft = res.content
    .filter((b) => b.type === 'text')
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim()

  if (!draft) throw new Error('Claude svarade utan text. Försök igen.')

  const { error } = await supabase
    .from('prospect_reports')
    .update({
      outreach_draft: draft,
      outreach_recipient: recipient,
      outreach_instruction: instruction?.trim() || null,
      outreach_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
  if (error) throw new Error(`Kunde inte spara utkastet: ${error.message}`)

  revalidatePath(`/rapporter/${reportId}`)
  return draft
}

/** Spara en text du redigerat för hand. */
export async function saveOutreachDraft(reportId: string, draft: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('prospect_reports')
    .update({
      outreach_draft: draft.trim() || null,
      outreach_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
  if (error) throw new Error(`Kunde inte spara utkastet: ${error.message}`)
  revalidatePath(`/rapporter/${reportId}`)
}
