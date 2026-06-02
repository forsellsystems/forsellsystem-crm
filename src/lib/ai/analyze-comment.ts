import Anthropic from '@anthropic-ai/sdk'

export type CommentAnalysis = {
  kind: string // mejl | samtal | mote | offert | notering
  person: string | null
  summary: string
}

const SYSTEM = `Du analyserar korta säljkommentarer i ett svenskt CRM och tolkar dem som en utförd aktivitet.
Returnera alltid resultatet via verktyget "logga_aktivitet".
- kind: typ av aktivitet — "mejl", "samtal", "mote", "offert" eller "notering". Välj "notering" om inget annat passar.
- person: namnet på personen som kontaktats/nämns, annars tom sträng.
- summary: en mycket kort sammanfattning (max ~6 ord) på svenska av vad som gjorts.`

/**
 * Best-effort AI analysis of a sales comment → structured activity.
 * Returns null if no API key is set or the call fails — callers fall back
 * to the raw comment text.
 */
export async function analyzeComment(content: string): Promise<CommentAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!content.trim()) return null

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: [
        {
          name: 'logga_aktivitet',
          description: 'Spara den strukturerade aktiviteten som tolkats ur kommentaren.',
          input_schema: {
            type: 'object',
            properties: {
              kind: {
                type: 'string',
                enum: ['mejl', 'samtal', 'mote', 'offert', 'notering'],
                description: 'Typ av aktivitet',
              },
              person: {
                type: 'string',
                description: 'Personens namn om det nämns, annars tom sträng',
              },
              summary: {
                type: 'string',
                description: 'Kort sammanfattning på svenska, max ~6 ord',
              },
            },
            required: ['kind', 'person', 'summary'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'logga_aktivitet' },
      messages: [{ role: 'user', content }],
    })

    const block = response.content.find((b) => b.type === 'tool_use')
    if (!block || block.type !== 'tool_use') return null

    const input = block.input as { kind?: string; person?: string; summary?: string }
    return {
      kind: input.kind || 'notering',
      person: input.person?.trim() ? input.person.trim() : null,
      summary: input.summary?.trim() || '',
    }
  } catch (err) {
    console.error('analyzeComment failed:', err)
    return null
  }
}
