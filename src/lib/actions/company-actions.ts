'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { companySchema, type CompanyFormData } from '@/lib/validations'

export async function createCompany(data: CompanyFormData) {
  const validated = companySchema.parse(data)
  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      name: validated.name,
      customer_number: validated.customer_number || null,
      org_number: validated.org_number || null,
      country: validated.country,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      responsible_user_id: validated.responsible_user_id || null,
      is_reseller: validated.is_reseller,
      reseller_id: validated.reseller_id || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Kunde inte skapa företag: ${error.message}`)
  revalidatePath('/foretag')
  redirect(`/foretag/${company.id}`)
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('companies').delete().eq('id', id)

  if (error) throw new Error(`Kunde inte ta bort: ${error.message}`)
  revalidatePath('/foretag')
  revalidatePath('/aterforsaljare')
}

export async function updateCompany(id: string, data: CompanyFormData) {
  const validated = companySchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({
      name: validated.name,
      customer_number: validated.customer_number || null,
      org_number: validated.org_number || null,
      country: validated.country,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      responsible_user_id: validated.responsible_user_id || null,
      is_reseller: validated.is_reseller,
      reseller_id: validated.reseller_id || null,
    })
    .eq('id', id)

  if (error) throw new Error(`Kunde inte uppdatera företag: ${error.message}`)
  revalidatePath(`/foretag/${id}`)
  revalidatePath('/foretag')
}
