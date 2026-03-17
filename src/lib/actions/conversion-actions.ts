'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ConvertProspectData {
  prospect_id: string
  company_name: string
  existing_company_id?: string
  country: string
  contact_person?: string
  email?: string
  phone?: string
  responsible_user_id?: string
}

interface ConvertResult {
  company_id: string
  contact_id: string | null
  deal_id: string
}

export async function convertProspect(
  data: ConvertProspectData
): Promise<ConvertResult> {
  const supabase = await createClient()

  const { data: result, error } = await supabase.rpc('convert_prospect', {
    p_prospect_id: data.prospect_id,
    p_company_name: data.company_name,
    p_existing_company_id: data.existing_company_id || null,
    p_country: data.country,
    p_contact_person: data.contact_person || null,
    p_email: data.email || null,
    p_phone: data.phone || null,
    p_responsible_user_id: data.responsible_user_id || null,
  })

  if (error) {
    throw new Error(`Konvertering misslyckades: ${error.message}`)
  }

  revalidatePath('/prospekt')
  revalidatePath(`/prospekt/${data.prospect_id}`)
  revalidatePath('/foretag')
  revalidatePath('/pipeline')

  return result as ConvertResult
}
