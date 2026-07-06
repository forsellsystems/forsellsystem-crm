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
  prospect_type: z.enum(['customer', 'reseller']).optional(),
  factory_type: z.enum(['modulfabrik', 'vagg_tak_fabrik', 'badrum']).optional().or(z.literal('')),
  building_types: z.array(z.string()).optional(),
  country: z.string().min(1, 'Land krävs'),
  contact_person: z.string().optional(),
  email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  phone: z.string().optional(),
  description: z.string().optional(),
  reseller_id: z.string().uuid().optional().or(z.literal('')),
})

export type ProspectFormData = z.infer<typeof prospectSchema>

// ============================================
// COMPANIES
// ============================================
export const companySchema = z.object({
  name: z.string().min(1, 'Företagsnamn krävs'),
  customer_number: z.string().optional(),
  org_number: z.string().optional(),
  factory_type: z.enum(['modulfabrik', 'vagg_tak_fabrik', 'badrum']).optional().or(z.literal('')),
  building_types: z.array(z.string()).optional(),
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
  stage: z.enum(['offert', 'avslutad_affar', 'avslutad_ingen_affar']),
  value: z.coerce.number().min(0, 'Värde måste vara positivt').optional(),
  currency: z.enum(['SEK', 'EUR', 'USD', 'NOK', 'DKK']),
  responsible_user_id: z.string().uuid().optional().or(z.literal('')),
  reseller_id: z.string().uuid().optional().or(z.literal('')),
  project_id: z.string().uuid().optional().or(z.literal('')),
  quote_date: z.string().optional().or(z.literal('')),
  heat: z.coerce.number().int().min(1).max(3).nullable().optional(),
  fortnox_offer_documentnumber: z.string().optional().or(z.literal('')),
  machine_ids: z.array(z.string().uuid()).optional(),
})

export type DealFormData = z.infer<typeof dealSchema>

// ============================================
// PROJECTS
// ============================================
export const projectSchema = z.object({
  entity_type: z.enum(['prospect', 'company']),
  entity_id: z.string().uuid(),
  name: z.string().optional(),
  project_type: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  value: z.coerce.number().min(0, 'Värde måste vara positivt').optional(),
  value_unknown: z.boolean().optional(),
  currency: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>

// ============================================
// MEETINGS
// ============================================
export const meetingSchema = z.object({
  entity_type: z.enum(['prospect', 'company']).optional(),
  entity_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional().or(z.literal('')),
  project_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().optional(),
  meeting_date: z.string().optional().or(z.literal('')),
  meeting_time: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  participants: z.string().optional(),
})

export type MeetingFormData = z.infer<typeof meetingSchema>

export const todoSchema = z.object({
  content: z.string().min(1, 'Text krävs'),
  entity_type: z.enum(['company', 'prospect', 'deal', 'project']).optional(),
  entity_id: z.string().uuid().optional(),
  source: z.enum(['comment', 'meeting', 'manual']).optional(),
  note_id: z.string().uuid().optional(),
  meeting_id: z.string().uuid().optional(),
  due_date: z.string().optional().or(z.literal('')),
})

export type TodoFormData = z.infer<typeof todoSchema>

// ============================================
// NOTES
// ============================================
export const noteSchema = z.object({
  entity_type: z.enum(['prospect', 'company', 'deal', 'contact', 'project']),
  entity_id: z.string().uuid(),
  content: z.string().min(1, 'Anteckning krävs'),
})

export type NoteFormData = z.infer<typeof noteSchema>
