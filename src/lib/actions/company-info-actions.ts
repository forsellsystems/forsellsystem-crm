'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { companyInfoSchema, type CompanyInfoFormData } from '@/lib/validations'

const PATH = '/installningar/foretagsinformation'

const trimmed = (v?: string) => (v && v.trim() !== '' ? v.trim() : null)

function rowFrom(v: CompanyInfoFormData) {
  return {
    section: trimmed(v.section),
    title: v.title.trim(),
    title_en: trimmed(v.title_en),
    content: trimmed(v.content),
    content_en: trimmed(v.content_en),
    term_usage: trimmed(v.term_usage),
  }
}

export async function createCompanyInfo(data: CompanyInfoFormData) {
  const validated = companyInfoSchema.parse(data)
  const supabase = await createClient()

  // Nya poster hamnar sist inom sin sektion.
  const { data: last } = await supabase
    .from('company_info')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('company_info')
    .insert({ sort_order: (last?.sort_order ?? -1) + 1, ...rowFrom(validated) })
  if (error) throw new Error(`Kunde inte lägga till: ${error.message}`)

  revalidatePath(PATH)
}

export async function updateCompanyInfo(id: string, data: CompanyInfoFormData) {
  const validated = companyInfoSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('company_info')
    .update({ ...rowFrom(validated), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Kunde inte uppdatera: ${error.message}`)

  revalidatePath(PATH)
}

export async function deleteCompanyInfo(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('company_info').delete().eq('id', id)
  if (error) throw new Error(`Kunde inte ta bort: ${error.message}`)

  revalidatePath(PATH)
}

// Byter plats på en rad och dess granne inom samma sektion, och skriver om hela
// listans sort_order så ordningen håller.
export async function moveCompanyInfo(id: string, direction: 'up' | 'down') {
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('company_info')
    .select('section')
    .eq('id', id)
    .single()

  let query = supabase.from('company_info').select('id, sort_order')
  query = row?.section ? query.eq('section', row.section) : query.is('section', null)

  const { data: rows, error: listError } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (listError) throw new Error(`Kunde inte flytta: ${listError.message}`)

  const list = rows ?? []
  const index = list.findIndex((r) => r.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= list.length) return

  const reordered = [...list]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  for (const [i, r] of reordered.entries()) {
    const { error } = await supabase
      .from('company_info')
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq('id', r.id)
    if (error) throw new Error(`Kunde inte flytta: ${error.message}`)
  }

  revalidatePath(PATH)
}
