# Forsell Systems CRM2

## Project
B2B CRM for Forsell Systems AB — industrial machinery manufacturer for prefab house factories.
Swedish UI. Long sales cycles. Custom pipeline.

## Tech Stack
- Next.js 15 (App Router, Server Components, Server Actions)
- Supabase (Postgres + Auth)
- shadcn/ui + Tailwind CSS
- TypeScript strict mode

## Hosting & Repos
- GitHub: forsellsystems/forsellsystem-crm
- Vercel: forsellsystem-crm.vercel.app
- Supabase project ref: tveysokvjqohfvvyxcwh (MCP connected)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Architecture
- Server Components by default, Client Components only for interactivity
- Server Actions for all mutations (lib/actions/)
- Queries in lib/queries/ (server-side data fetching)
- Shared notes system: polymorphic notes table, one UI component
- Kanban: @dnd-kit with optimistic updates (no revalidatePath in drag actions)

## Key Conventions
- Swedish UI text (all labels, messages, placeholders)
- Swedish URLs (/prospekt, /foretag, /maskiner, /installningar, /aterforsaljare, /aterforsaljar-prospekt, /pipeline, /projekt)
- UUID primary keys everywhere
- Notes are deletable
- "Företag" renamed to "Kunder" in UI (routes still /foretag)
- Återförsäljare = companies with is_reseller=true, separate /aterforsaljare pages
- "Återförsäljare" renamed to "Agent/Agenter" in UI (singular Agent, plural Agenter, sammansättning "agent-prospekt"). Routes still /aterforsaljare + /aterforsaljar-prospekt, DB still is_reseller/reseller_id, code identifiers still reseller. Only visible Swedish text changed.
- Two prospect types via prospect_type column: 'customer' (default, /prospekt) and 'reseller' (/aterforsaljar-prospekt)
- Prospekt-listor visas som tabbar inom KUNDER (/foretag, /prospekt) och ÅTERFÖRSÄLJARE (/aterforsaljare, /aterforsaljar-prospekt) via ListTabs-komponenten. Sidebar har bara KUNDER + ÅTERFÖRSÄLJARE; respektive post markeras aktiv även när prospekt-sidan visas (via alsoActiveOn på navItem).
- Inline editing on detail cards (penna-ikon → redigera direkt på kortet, ej dialog)
- Detail cards pattern: ProspectContactCard, ProspectDescription, ProspectDetailsCard (same for companies)
- Country fields: always use COUNTRIES dropdown from constants.ts — Swedish names ("Sverige", "Kanada", "USA"), never ISO codes or English names. Stored as Swedish name string in DB.
- Constants with `{ key, label }` pattern: always store `key` (lowercase) in DB, show `label` in UI. Never store labels in DB.
- factory_type: optional on both prospects and companies (nullable)
- building_types: TEXT[] on both prospects and companies, multi-select checkboxes (flerbostadshus, smahus). Stores keys, not labels.

## Prospect ↔ Company Flow
- "Flytta till kund" / "Flytta till återförsäljare" button on prospect detail: creates company (is_reseller derived from prospect_type) + contact + copies notes, flyttar projekten, marks prospect as converted
- "Flytta till prospekt" / "Flytta till återförsäljar-prospekt" button on company detail: type-aware (kund → kund-prospekt, återförsäljare → återförsäljar-prospekt). Creates prospect with prospect_type derived from is_reseller, copies notes, flyttar projekt/möten/todos, DELETES the company
- "Skapa affär" button on company detail: opens NewDealDialog with company pre-selected
- "Radera" button on prospect detail: permanently deletes prospect + its notes from DB
- No dialog/confirmation on moves — direct action
- All mutations are real DB operations (INSERT/DELETE) — nothing is soft-deleted or cached
- conversion-actions.ts still exists (legacy RPC flow) but moveProspectToCompany in prospect-actions.ts is the new flow

## Auth
- Supabase Auth with email/password
- Admin creates users with passwords via create_user_with_password RPC
- Login page at /login
- Middleware protects all routes (redirects to /login)
- Logout button in sidebar

## Branding (v2 — Grå & Gul)
- Primary Grey: #656565, CTA Yellow: #F2BB01 (sparingly, CTA only), Dark Gold: #D4A301 (text on light bg), Sidebar: #1A1A1A
- Grey scale: #333333 (charcoal), #4A4A4A (hover), #656565 (primary), #808080 (secondary), #9A9A9A (light)
- Fonts: Barlow (UI), Barlow Condensed (labels/nav), DM Serif Display (display)
- Tone: Konkret, trygg, effektiv, nordisk. Inga em-dash som separatorer.
- Logo: white on dark, grey on light. Never CSS filter.

## Pipeline
- 3 stages: offert → avslutad_affar → avslutad_ingen_affar
- Pipeline = only quoted/offered deals. Kontakt, Behovsanalys and Förhandling removed
- New deals default to stage 'offert'; deals_stage_check enforces the 3 stages
- quote_date field on deals — shown on kanban cards and deal detail
- heat field on deals (DB column; UI-label "Status"; values 1=Het/röd, 2=Varm/orange, 3=Kall/grå, nullable) — colored dot next to value on cards
- Cards sorted: heat ASC (hottest first, nulls last), then quote_date DESC, then sort_order
- Entire card is clickable (links to deal detail)
- Move buttons (chevrons) for quick stage changes
- Drag & drop with optimistic updates

## Database
- Supabase Postgres with RLS enabled (authenticated-only policies)
- Polymorphic notes: entity_type + entity_id (entity_type IN prospect/company/deal/contact/project). Anteckningar-kort finns på affär (/pipeline/[id]), kund (/foretag/[id]) och projekt (/projekt/[id]).
- deal_machines junction table for multi-select products
- machine_features: features/säljpunkter per maskin (name = svenska, name_en = engelska nullable, sort_order). Redigeras på /maskiner/[id] via MachineFeaturesCard, ordnas med chevrons. RLS authenticated-only.
- company_info: företagskontext som INTE går att härleda ur övriga tabeller (positionering, målgrupp, diskvalificerare, regler, invändningar, referenser, ordlista). Regeln: kan en query producera det, skriv inte in det. Prosaposter använder title + content (+ content_en där texten går rakt ut till kund); ordlisteposter använder title (sv term) + title_en (en term) + term_usage (vi|kunden|bada). Sektionerna i COMPANY_INFO_SECTIONS. Egen sida /installningar/foretagsinformation via CompanyInfoCard. Underlag för säljutbildning och framtida AI-lager. RLS authenticated-only.
- Ordervärden och finansiella siffror skrivs INTE in i CRM-innehållet (referenser, företagsinformation). Kevin strök dem konsekvent. Kundens egna investeringssiffror duger som kontext om de är publika, men Forsells ordervärden och bolagets finanser hör inte hemma där.
- Ordlistan i company_info tar BARA ord som inte redan är bestämda någon annanstans i systemet. Maskindelar och mått är fixade i SPEC_FIELDS, komponent-/maskin-/kategorinamn översätts aldrig, och produkttexternas termer (lyftok → lift yoke, spackling → filling) är redan beslutade på sajten. Kvar för ordlistan: säljspråket, alltså hur kundtyper och byggsätt benämns.
- Språkregel för företagsinformation: ALLT ska finnas på svenska och engelska. Saknad engelska är en lucka, inte ett val, och visas som "Engelsk text saknas" i EN-läget. SV/EN-reglage i kortets huvud flippar rubriker, innehåll, sektionsnamn och ordlistans riktning. Maskinnamn, komponentnamn och kategorinamn översätts aldrig (de är engelska på båda språken).
- machines.factory_types: TEXT[] med nycklar ur FACTORY_TYPES, vilka fabrikstyper maskinen passar. Samma mönster som building_types på kunder/prospekt (kryssrutor, nycklar i DB). Modulmaskinerna (Skate System, Beam Feeder, Beam Roller, Accessrail) är bara modulfabrik; elementmaskinerna även vagg_tak_fabrik; Modutile dessutom badrum. Redigeras i MachineDetailCard.
- machine_specs: tekniska uppgifter per maskin. spec_key pekar på SPEC_FIELDS (etikett sv+en och enhet ur konstanten); null = fri rad med egen label/label_en. object_type (element|modul|maskin) skiljer vad uppgiften beskriver — elementmått och modulmått får aldrig jämföras. value_type: value (min/max+unit), text (value_text/value_text_en), adapt ("Anpassas efter behov" = projektkonfigurerat, ett svar) och undocumented ("Ej dokumenterat" = lucka). Skillnaden adapt/undocumented är poängen. Siffror är språkneutrala, så bara noteringar och textsvar har _en-fält. Redigeras via MachineSpecsCard på /maskiner/[id]. RLS authenticated-only.
- machine_components: komponentlista per maskin. Varje komponent har mått (quantity, numeric) + enhet (unit: st|m ur COMPONENT_UNITS), pris per enhet (price_min, valfritt price_max för intervall) och price_note, en fri kommentar om just den komponentens prissättning. Priset är alltid PER ENHET, så radsumman är mått × pris oavsett enhet, och maskinens pris förblir ett enda tal. Meter är minsta längdenhet, aldrig centimeter eller millimeter. Nya komponenter får styck förvalt; meter väljs per komponent. Komponentlista per maskin. Finns på alla maskiner; machines.has_components styr bara om komponentsumman sätter maskinens pris (recompute hoppar över maskiner med direktpris).
- activity_log for audit trail: skrivs via logActivity() i lib/actions/activity-actions.ts (best-effort, kopplar inloggad user via auth_id). Loggar note_added, deal_stage_changed (ej omsortering), company_created, prospect_created, deal_created, project_created. metadata snapshottar { label, href, snippet?, from?, to? }. Visas på /logg (LOGG-fliken, getActivityLog).
- convert_prospect RPC for atomic prospect→company+contact+deal conversion (legacy)
- create_user_with_password RPC for admin user creation
- is_reseller boolean + reseller_id FK on companies
- reseller_id FK on deals
- quote_date on deals (DATE, nullable)
- fortnox_customer_id finns BARA på companies (kunder + agenter), aldrig på prospekt. Ett kundnummer som inte kommer från Fortnox betyder ingenting, så det går inte att skriva in: det sätts enbart genom att välja kund ur Fortnox kundregister (FortnoxCompanyLink på kundkortet och på agentsidan) eller genom "Lägg upp i Fortnox", som skapar kunden där och tar emot numret Fortnox delar ut. Unikt index hindrar två bolag från samma kundnummer. Blir det aktuellt med offert eller faktura lägger man upp kunden i Fortnox och kopplar därifrån.
- Kopplingsväljaren visar ALLTID hela Fortnox-registret och låter användaren välja. Den kopplar aldrig automatiskt, inte ens vid en enda träff — fel kund tyst kopplad är värre än ett extra klick. Kunder som redan hör till ett annat bolag går inte att välja.
- Bolagets Fortnox-koppling och affärens offertkoppling är två skilda saker. Att en affär pekar på en offert gör INTE bolaget kopplat, och att koppla en offert stämplar aldrig något på kundkortet.
- Ett Fortnox-projekt bär INGEN kund. Projektposten har bara ProjectNumber, Description, Status, StartDate, EndDate, Comments, ContactPerson, ProjectLeader. Kund och projekt möts i stället på DOKUMENTET: offerten har både CustomerNumber och Project. Därför måste CRM:et hålla ordningen, och därför skrivs kundens namn in i projektnamnet vid "Lägg upp i Fortnox" ("Promet – Ny fabrik"), precis som era befintliga "Danwood Polen".
- Regel: ett projekt kan bara kopplas mot Fortnox om dess BOLAG redan är kopplat. Prospektprojekt kan aldrig kopplas (prospekt har ingen kundkoppling). projectOwner() i fortnox-actions.ts vaktar båda vägarna, koppla och lägg upp.
- Offertens kund i Fortnox är INTE alltid affärens kund: den kan vara affärens AGENT när agenten fakturerar slutkund (offert 11 är ställd till Randek fast affären är Danwoods). Validera därför aldrig att offertens kund = affärens kund. OfferProjectButton skriver bara Project-fältet och rör aldrig kunden på offerten.
- projects.fortnox_project_id kopplar ett CRM-projekt mot Fortnox projektregister, exakt samma mönster och regler som kundkopplingen (FortnoxProjectLink på /projekt/[id]). Sätts bara via väljaren eller "Lägg upp i Fortnox", aldrig fritext. Unikt partiellt index. Hämta info drar Description → name, Comments → description, ContactPerson → contact_name.
- Fortnox projektformer skiljer sig också mellan endpoints: listan (/projects) saknar `Comments` och `ContactPerson`, enskilt projekt (/projects/{nr}) har båda. Status är NOTSTARTED | ONGOING | COMPLETED men läses som fri text, så ett okänt värde visas i stället för att krascha.
- Fortnox-API:ets kundformer skiljer sig mellan endpoints: listan (/customers) ger `Phone` och saknar `CountryCode`, enskild kund (/customers/{nr}) ger `Phone1` och `CountryCode`. toSummary i lib/fortnox/customers.ts läser båda.
- customer-scopet ("Kund" i Fortnox Developer Portal) krävs för allt kundregisterarbete. Scopet begärs i FORTNOX_SCOPES, men måste också vara ikryssat på integrationen (heter "Forsell CRM"). Ändrade behörigheter kräver ALLTID ny anslutning (Koppla från + Anslut); befintliga tokens behåller sina gamla rättigheter.
- Landsöversättning Fortnox ↔ CRM sker i lib/fortnox/countries.ts. Okänt land översätts inte alls (utelämnas vid skapande, lämnas orört vid hämtning) hellre än att gissa.
- website + description on prospects (TEXT, nullable)
- description on companies (TEXT, nullable)
- updateProspectFields / updateCompanyFields for inline partial updates
- country column on prospects and companies: stores Swedish country names (not ISO codes)
- factory_type on prospects and companies: nullable TEXT (modulfabrik | vagg_tak_fabrik | null)
- building_types on prospects and companies: TEXT[] (stores keys: flerbostadshus, smahus)
- prospect_type on prospects: TEXT NOT NULL DEFAULT 'customer', CHECK IN ('customer', 'reseller')
- heat on deals: SMALLINT nullable, CHECK IN (1, 2, 3)
- Polymorphic projects: projects table (entity_type IN ('prospect','company') + entity_id), columns name/project_type/status/description/value/value_unknown/currency/contact_name/contact_email/contact_phone. Same pattern as notes. RLS authenticated-only. value_unknown=true means budget explicitly marked "okänd" (distinct from blank/null = not entered). name is the project's display label (falls back to project_type label, then "Projekt").
- Projects UI: "Projekt"-kort (flera projekt per bolag) på kund-, agent- och kund-prospekt-detaljsidorna (/foretag/[id], /aterforsaljare/[id], /prospekt/[id]). Agenter kan driva egna projekt, t.ex. mot slutkund som de fakturerar. Agentprojekt länkar till /aterforsaljare/[id], inte /foretag/[id] — getAllProjects och getProject läser is_reseller för att välja rätt. Inline add/edit/delete via ProjectsCard/ProjectItem/ProjectForm (src/components/projects/). project-actions.ts + queries/projects.ts spegla note-actions/notes. Projekt FLYTTAS (UPDATE av entity_type/entity_id) vid prospekt↔kund-flytt, aldrig kopieras — annars blir de kvar på det konverterade prospektet och dyker upp som dubbletter i /projekt, som inte filtrerar på status. Flytt bevarar projektets id, anteckningar, logg och /projekt/[id]-länk. Projekt raderas med entiteten (deleteProspect/deleteCompany rensar även projektens anteckningar + logg).
- Projektets aktivitet rullar upp till bolaget. Möten som skapas på ett projekt ankras redan på projektets bolag (anchor-logiken i meeting-actions.ts), så de syns på kundkortet av sig själva; MeetingsCard märker dem med projektnamnet, utom på projektets eget kort. Anteckningar på projekt hämtas in av getNotesWithProjects() på kund-, agent- och prospektsidorna, märks "Projekt: X" med länk dit, och kan INTE raderas därifrån — de raderas där de hör hemma, annars försvinner de från projektet utan spår.
- PROJECT_TYPES + PROJECT_STATUSES constants ({ key, label }, statuses also carry color)
- Projekt-sida (/projekt): top-level nav-flik under Pipeline (sidebar). Tabell med alla projekt (getAllProjects), "Projekt"-cell länkar till projektets egen sida, "Bolag"-cell till kunden/prospektet. Skapa via NewProjectDialog (textknapp + bolagsväljare kunder+kund-prospekt → tomt projekt → /projekt/[id]).
- Skapa-knappar konsekventa: "+"-ikon på kort (ProjectsCard + Affärer-kortet på /foretag/[id], NewDealDialog triggerStyle="icon"), textknapp på stora sidor (Pipeline "Ny affär", Projekt-fliken "Nytt projekt"). NewDealDialog: prop triggerStyle 'cta'|'icon'.
- Projekt redigeras/raderas på egen sida /projekt/[id] (getProject + ProjectDetailCard, återanvänder ProjectForm). createProject returnerar id.
- Kund/prospekt-kortet (ProjectsCard): visar bolagets projekt som klickbara länkar till /projekt/[id]; "+"-knapp skapar tomt projekt och redirectar dit. Ingen inline-redigering på bolaget.

## Known Workarounds
- Zod v4 + @hookform/resolvers incompatibility: use `formResolver()` from `src/lib/form-resolver.ts` instead of `zodResolver()` directly
- Zod v4 `.default()` breaks react-hook-form types: set defaults in useForm defaultValues instead
- Next.js 15: never call redirect() inside try/catch in server actions
