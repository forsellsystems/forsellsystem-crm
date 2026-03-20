# Forsell System CRM2

## Project
B2B CRM for Forsell System AB — industrial machinery manufacturer for prefab house factories.
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
- Swedish URLs (/prospekt, /foretag, /maskiner, /installningar, /aterforsaljare)
- UUID primary keys everywhere
- Notes are deletable
- "Företag" renamed to "Kunder" in UI (routes still /foretag)
- Återförsäljare = companies with is_reseller=true, separate /aterforsaljare pages
- Prospekt is a sub-item under Återförsäljare in sidebar
- Inline editing on detail cards (penna-ikon → redigera direkt på kortet, ej dialog)
- Detail cards pattern: ProspectContactCard, ProspectDescription, ProspectDetailsCard (same for companies)
- Country fields: always use COUNTRIES dropdown from constants.ts — Swedish names ("Sverige", "Kanada", "USA"), never ISO codes or English names. Stored as Swedish name string in DB.
- Constants with `{ key, label }` pattern: always store `key` (lowercase) in DB, show `label` in UI. Never store labels in DB.
- factory_type: optional on both prospects and companies (nullable)
- building_types: TEXT[] on both prospects and companies, multi-select checkboxes (flerbostadshus, smahus). Stores keys, not labels.

## Prospect ↔ Company Flow
- "Flytta till kund" button on prospect detail: creates company + contact + copies notes, marks prospect as converted
- "Flytta till prospekt" button on company detail: creates prospect from company data, copies notes, DELETES the company
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
- 4 stages: kontakt → offert → avslutad_affar → avslutad_ingen_affar
- Behovsanalys and Förhandling removed
- quote_date field on deals — shown on kanban cards and deal detail
- Cards sorted by quote_date (newest first, nulls last)
- Entire card is clickable (links to deal detail)
- Move buttons (chevrons) for quick stage changes
- Drag & drop with optimistic updates

## Database
- Supabase Postgres with RLS enabled (authenticated-only policies)
- Polymorphic notes: entity_type + entity_id
- deal_machines junction table for multi-select products
- activity_log for audit trail
- convert_prospect RPC for atomic prospect→company+contact+deal conversion (legacy)
- create_user_with_password RPC for admin user creation
- is_reseller boolean + reseller_id FK on companies
- reseller_id FK on deals
- quote_date on deals (DATE, nullable)
- fortnox_customer_id on companies (future integration)
- website + description on prospects (TEXT, nullable)
- description on companies (TEXT, nullable)
- updateProspectFields / updateCompanyFields for inline partial updates
- country column on prospects and companies: stores Swedish country names (not ISO codes)
- factory_type on prospects and companies: nullable TEXT (modulfabrik | vagg_tak_fabrik | null)
- building_types on prospects and companies: TEXT[] (stores keys: flerbostadshus, smahus)

## Known Workarounds
- Zod v4 + @hookform/resolvers incompatibility: use `formResolver()` from `src/lib/form-resolver.ts` instead of `zodResolver()` directly
- Zod v4 `.default()` breaks react-hook-form types: set defaults in useForm defaultValues instead
- Next.js 15: never call redirect() inside try/catch in server actions
