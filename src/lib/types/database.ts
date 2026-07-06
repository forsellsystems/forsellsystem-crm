// Auto-generated types will be placed here after Supabase schema is created.
// For now, define manual types matching our planned schema.

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "salesperson";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  name: string;
  customer_number: string | null;
  org_number: string | null;
  factory_type: "modulfabrik" | "vagg_tak_fabrik" | "badrum" | null;
  building_types: string[];
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  responsible_user_id: string | null;
  prospect_id: string | null;
  is_reseller: boolean;
  reseller_id: string | null;
  fortnox_customer_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Prospect = {
  id: string;
  company_name: string;
  prospect_type: "customer" | "reseller";
  factory_type: "modulfabrik" | "vagg_tak_fabrik" | "badrum" | null;
  building_types: string[];
  country: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "converted" | "archived";
  reseller_id: string | null;
  converted_at: string | null;
  converted_company_id: string | null;
  converted_deal_id: string | null;
  website: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Machine = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  quote_number: string | null;
  company_id: string;
  contact_id: string | null;
  stage: "offert" | "avslutad_affar" | "avslutad_ingen_affar";
  value: number | null;
  currency: string;
  responsible_user_id: string | null;
  prospect_id: string | null;
  reseller_id: string | null;
  project_id: string | null;
  quote_date: string | null;
  closed_at: string | null;
  expected_close_date: string | null;
  heat: 1 | 2 | 3 | null;
  fortnox_offer_documentnumber: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DealMachine = {
  id: string;
  deal_id: string;
  machine_id: string;
  quantity: number;
  created_at: string;
};

export type Note = {
  id: string;
  entity_type: "prospect" | "company" | "deal" | "contact" | "project";
  entity_id: string;
  content: string;
  author_user_id: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  entity_type: "prospect" | "company";
  entity_id: string;
  name: string | null;
  project_type: string | null;
  status: string | null;
  description: string | null;
  value: number | null;
  value_unknown: boolean;
  currency: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: string;
  entity_type: "prospect" | "company" | null;
  entity_id: string | null;
  title: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  status: string | null;
  agenda: string | null;
  notes: string | null;
  participants: string | null;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  id: string;
  content: string;
  done: boolean;
  due_date: string | null;
  sort_order: number;
  entity_type: "company" | "prospect" | "deal" | "project" | null;
  entity_id: string | null;
  source: "comment" | "meeting" | "manual";
  note_id: string | null;
  meeting_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
};

// Joined types for views
export type DealWithRelations = Deal & {
  company_name?: string;
  contact_name?: string;
  responsible_name?: string;
  reseller_name?: string;
  project_name?: string;
};

export type CompanyWithRelations = Company & {
  responsible_name?: string;
  reseller_name?: string;
  contacts?: Contact[];
  deals?: (Deal & { reseller_name?: string | null })[];
};
