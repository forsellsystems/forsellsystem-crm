import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROJECT_TYPES } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const prospectId = searchParams.get('prospect_id')

  // Projects are polymorphic (company or prospect) — accept either.
  const entityType = companyId ? 'company' : prospectId ? 'prospect' : null
  const entityId = companyId ?? prospectId
  if (!entityType || !entityId) {
    return NextResponse.json([])
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, project_type')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  const projects = (data ?? []).map((p) => ({
    id: p.id,
    name:
      p.name?.trim() ||
      PROJECT_TYPES.find((t) => t.key === p.project_type)?.label ||
      'Projekt',
  }))

  return NextResponse.json(projects)
}
