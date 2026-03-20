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
  factory_type: "modulfabrik" | "vagg_tak_fabrik" | null;
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
  factory_type: "modulfabrik" | "vagg_tak_fabrik" | null;
  building_types: string[];
  country: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "converted" | "archived";
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
  stage: "kontakt" | "offert" | "avslutad_affar" | "avslutad_ingen_affar";
  value: number | null;
  currency: string;
  responsible_user_id: string | null;
  prospect_id: string | null;
  reseller_id: string | null;
  quote_date: string | null;
  closed_at: string | null;
  expected_close_date: string | null;
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
  entity_type: "prospect" | "company" | "deal" | "contact";
  entity_id: string;
  content: string;
  author_user_id: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  created_at: string;
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
};

export type CompanyWithRelations = Company & {
  responsible_name?: string;
  reseller_name?: string;
  contacts?: Contact[];
  deals?: Deal[];
};
