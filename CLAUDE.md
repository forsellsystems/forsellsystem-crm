# Forsell System CRM2

## Project
B2B CRM for Forsell System AB — industrial machinery manufacturer for prefab house factories.
Swedish UI. Long sales cycles. Custom pipeline.

## Tech Stack
- Next.js 15 (App Router, Server Components, Server Actions)
- Supabase (Postgres, Auth planned later)
- shadcn/ui + Tailwind CSS
- TypeScript strict mode

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Architecture
- Server Components by default, Client Components only for interactivity
- Server Actions for all mutations (lib/actions/)
- Queries in lib/queries/ (server-side data fetching)
- Shared notes system: polymorphic notes table, one UI component
- Kanban: @dnd-kit with optimistic updates

## Key Conventions
- Swedish UI text (all labels, messages, placeholders)
- Swedish URLs (/prospekt, /foretag, /maskiner, /installningar)
- UUID primary keys everywhere
- Immutable notes (append-only, never edit/delete)
- conversion-actions.ts handles the critical prospect→company+deal flow

## Branding
- Primary: #50645F, CTA: #C4883A, Sidebar: #2A3835
- Fonts: Barlow (UI), Barlow Condensed (labels/nav), DM Serif Display (display)
- Tone: Konkret, trygg, effektiv, nordisk

## Database
- Supabase Postgres with RLS enabled (permissive policies until auth)
- Project ref: tveysokvjqohfvvyxcwh (MCP connected)
- Polymorphic notes: entity_type + entity_id
- deal_machines junction table for multi-select products
- activity_log for audit trail
- convert_prospect RPC for atomic prospect→company+contact+deal conversion
- fortnox_customer_id on companies (future integration)

## Known Workarounds
- Zod v4 + @hookform/resolvers incompatibility: use `formResolver()` from `src/lib/form-resolver.ts` instead of `zodResolver()` directly
- Zod v4 `.default()` breaks react-hook-form types: set defaults in useForm defaultValues instead
