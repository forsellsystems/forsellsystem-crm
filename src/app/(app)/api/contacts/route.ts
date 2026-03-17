import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')

  if (!companyId) {
    return NextResponse.json([])
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name')
    .eq('company_id', companyId)
    .order('is_primary', { ascending: false })
    .order('name')

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
