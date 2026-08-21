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
  org_number: string | null;
  factory_type: "modulfabrik" | "vagg_tak_fabrik" | "badrum" | null;
  building_types: string[];
  material: string | null;
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
  // Exakt en av dessa är satt: kontakten hör till ett bolag eller ett prospekt.
  company_id: string | null;
  prospect_id: string | null;
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
  material: string | null;
  country: string;
  // Kontaktpersonen är en riktig kontaktpost på prospektet, inte fält här.
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
  description_en: string | null;
  // Price range. When has_components: cached sum of the component ranges.
  // Otherwise: a direct price range set on the machine. price_max NULL = single price.
  has_components: boolean;
  // Vilka fabrikstyper maskinen passar. Nycklar ur FACTORY_TYPES.
  factory_types: string[];
  price_min: number | null;
  price_max: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MachineComponent = {
  id: string;
  machine_id: string;
  name: string;
  price_min: number;
  price_max: number | null; // NULL = single price (= price_min)
  quantity: number; // mängd i unit; decimal när unit = 'm'
  unit: string; // 'st' | 'm' — nyckel ur COMPONENT_UNITS
  price_note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// Företagskontext. Prosaposter använder title + content; ordlisteposter använder
// title (svensk term) + title_en (engelsk term) + term_usage.
export type CompanyInfo = {
  id: string;
  section: string | null;
  title: string;
  title_en: string | null;
  content: string | null;
  content_en: string | null;
  term_usage: "vi" | "kunden" | "bada" | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// En teknisk uppgift om en maskin. spec_key pekar på SPEC_FIELDS (etiketten
// kommer därifrån, på båda språken); är den null används label/label_en.
// value_type styr hur raden läses: siffra, text, "anpassas efter behov" eller
// "ej dokumenterat".
export type MachineSpec = {
  id: string;
  machine_id: string;
  spec_key: string | null;
  label: string | null;
  label_en: string | null;
  object_type: "element" | "modul" | "maskin";
  value_type: "value" | "text" | "adapt" | "undocumented";
  value_min: number | null;
  value_max: number | null;
  unit: string | null;
  value_text: string | null;
  value_text_en: string | null;
  note: string | null;
  note_en: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// En av våra produkter som är aktuell för ett projekt, med valfri motivering.
export type ProjectMachine = {
  id: string;
  project_id: string;
  machine_id: string;
  quantity: number;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// En förutsättning i ett projekt: kundens mått eller uppgift. value_type
// 'pending'/'unknown' är medvetna luckor och bär inget värde.
export type ProjectSpec = {
  id: string;
  project_id: string;
  spec_key: string | null;
  label: string | null;
  value_type: "value" | "text" | "pending" | "unknown";
  value_min: number | null;
  value_max: number | null;
  unit: string | null;
  value_text: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// En feature/säljpunkt på en maskin. name = svenska, name_en = engelska (valfri).
export type MachineFeature = {
  id: string;
  machine_id: string;
  name: string;
  name_en: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MachineQuestion = {
  id: string;
  machine_id: string;
  question: string;
  note: string | null; // valfri "varför / vad svaret påverkar"
  sort_order: number;
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
  entity_type: "prospect" | "company" | "deal" | "contact" | "project" | "machine";
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
  // Kontaktpersonen är en av bolagets kontakter, inte fritext.
  contact_id: string | null;
  // Projektnummer i Fortnox. Sätts bara via kopplingen, aldrig som fritext.
  fortnox_project_id: string | null;
  // Fritext under förutsättningarna, för det som inte passar i ett fält.
  conditions_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: string;
  entity_type: "prospect" | "company" | null;
  entity_id: string | null;
  deal_id: string | null;
  project_id: string | null;
  title: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  status: string | null;
  agenda: string | null;
  notes: string | null;
  participants: string | null;
  outlook_event_id: string | null;
  outlook_web_link: string | null;
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
  project_fortnox_id?: string | null;
};

export type CompanyWithRelations = Company & {
  responsible_name?: string;
  reseller_name?: string;
  contacts?: Contact[];
  deals?: (Deal & { reseller_name?: string | null })[];
};
