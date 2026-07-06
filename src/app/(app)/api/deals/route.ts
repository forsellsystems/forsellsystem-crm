import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Deals for a company — used by the meeting dialog's optional "Affär" selector.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')

  if (!companyId) {
    return NextResponse.json([])
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('id, quote_number, value')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  const deals = (data ?? []).map((d) => ({
    id: d.id,
    label: d.quote_number ? `Affär #${d.quote_number}` : 'Affär',
  }))

  return NextResponse.json(deals)
}
