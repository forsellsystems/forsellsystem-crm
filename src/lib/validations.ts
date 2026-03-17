import { z } from 'zod'

// ============================================
// MACHINES
// ============================================
export const machineSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  category: z.string().min(1, 'Kategori krävs'),
  description: z.string().optional(),
})

export type MachineFormData = z.infer<typeof machineSchema>

// ============================================
// USERS
// ============================================
export const userSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  email: z.string().email('Ogiltig e-postadress'),
  role: z.enum(['admin', 'salesperson'], 'Roll krävs'),
  password: z.string().min(6, 'Lösenord måste vara minst 6 tecken').optional().or(z.literal('')),
})

export type UserFormData = z.infer<typeof userSchema>

// ============================================
// PROSPECTS
// ============================================
export const prospectSchema = z.object({
  company_name: z.string().min(1, 'Företagsnamn krävs'),
  factory_type: z.enum(['modulfabrik', 'vagg_tak_fabrik'], 'Fabrikstyp krävs'),
  country: z.string().min(1, 'Land krävs'),
  contact_person: z.string().optional(),
  email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  phone: z.string().optional(),
})

export type ProspectFormData = z.infer<typeof prospectSchema>

// ============================================
// COMPANIES
// ============================================
export const companySchema = z.object({
  name: z.string().min(1, 'Företagsnamn krävs'),
  customer_number: z.string().optional(),
  org_number: z.string().optional(),
  country: z.string().min(1, 'Land krävs'),
  phone: z.string().optional(),
  email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  website: z.string().optional(),
  responsible_user_id: z.string().uuid().optional().or(z.literal('')),
  is_reseller: z.boolean(),
  reseller_id: z.string().uuid().optional().or(z.literal('')),
})

export type CompanyFormData = z.infer<typeof companySchema>

// ============================================
// CONTACTS
// ============================================
export const contactSchema = z.object({
  company_id: z.string().uuid('Företag krävs'),
  name: z.string().min(1, 'Namn krävs'),
  title: z.string().optional(),
  email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  phone: z.string().optional(),
  is_primary: z.boolean(),
})

export type ContactFormData = z.infer<typeof contactSchema>

// ============================================
// DEALS
// ============================================
export const dealSchema = z.object({
  quote_number: z.string().optional(),
  company_id: z.string().uuid('Företag krävs'),
  contact_id: z.string().uuid().optional().or(z.literal('')),
  stage: z.enum(['kontakt', 'behovsanalys', 'offert', 'forhandling', 'avslutad_affar', 'avslutad_ingen_affar']),
  value: z.coerce.number().min(0, 'Värde måste vara positivt').optional(),
  currency: z.enum(['SEK', 'EUR', 'USD', 'NOK', 'DKK']),
  responsible_user_id: z.string().uuid().optional().or(z.literal('')),
  reseller_id: z.string().uuid().optional().or(z.literal('')),
  machine_ids: z.array(z.string().uuid()).optional(),
})

export type DealFormData = z.infer<typeof dealSchema>

// ============================================
// NOTES
// ============================================
export const noteSchema = z.object({
  entity_type: z.enum(['prospect', 'company', 'deal', 'contact']),
  entity_id: z.string().uuid(),
  content: z.string().min(1, 'Anteckning krävs'),
})

export type NoteFormData = z.infer<typeof noteSchema>
