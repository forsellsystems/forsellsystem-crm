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
- conversion-actions.ts handles the critical prospect→company+deal flow
- "Företag" renamed to "Kunder" in UI (routes still /foretag)
- Återförsäljare = companies with is_reseller=true, separate /aterforsaljare pages
- Prospekt is a sub-item under Återförsäljare in sidebar

## Auth
- Supabase Auth with email/password
- Admin creates users with passwords via create_user_with_password RPC
- Login page at /login
- Middleware protects all routes (redirects to /login)
- Logout button in sidebar

## Branding
- Primary: #50645F, CTA: #C4883A, Sidebar: #2A3835
- Fonts: Barlow (UI), Barlow Condensed (labels/nav), DM Serif Display (display)
- Tone: Konkret, trygg, effektiv, nordisk

## Database
- Supabase Postgres with RLS enabled (authenticated-only policies)
- Polymorphic notes: entity_type + entity_id
- deal_machines junction table for multi-select products
- activity_log for audit trail
- convert_prospect RPC for atomic prospect→company+contact+deal conversion
- create_user_with_password RPC for admin user creation
- is_reseller boolean + reseller_id FK on companies
- reseller_id FK on deals
- fortnox_customer_id on companies (future integration)

## Known Workarounds
- Zod v4 + @hookform/resolvers incompatibility: use `formResolver()` from `src/lib/form-resolver.ts` instead of `zodResolver()` directly
- Zod v4 `.default()` breaks react-hook-form types: set defaults in useForm defaultValues instead
- Next.js 15: never call redirect() inside try/catch in server actions
