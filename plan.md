# Forsell System CRM2 — Implementeringsplan

## Status: ✅ ALLA FASER KLARA (2026-03-17)

| Fas | Status |
|---|---|
| 0. Projektscaffolding | ✅ |
| 1. Databas (Supabase MCP) | ✅ |
| 2. Maskiner & Inställningar | ✅ |
| 3. Prospekt + Anteckningar | ✅ |
| 4. Företag → Kunder & Kontakter | ✅ |
| 5. Pipeline / Kanban | ✅ |
| 6. Konverteringsflöde | ✅ |
| 7. Dashboard | ✅ |
| 8. Polish & Finslipning | ✅ |
| 9. Fortnox-förberedelse | ✅ |
| 10. Återförsäljare (egen flik) | ✅ |
| 11. Supabase Auth (login + lösenord) | ✅ |
| 12. Bugfix & UI-polish | ✅ |

**15 routes** · **9 databastabeller** · **2 RPC-funktioner** · **GitHub: forsellsystems/forsellsystem-crm**
Admin: Kevin Forss (kevin@forsellsystem.com) — Lösenord: Forsell2026!

### Fas 10: Återförsäljare ✅ KLAR
- `is_reseller` boolean på companies — separerar kunder från återförsäljare
- `reseller_id` FK på companies — kopplar kund till sin återförsäljare
- `reseller_id` FK på deals — vilken återförsäljare affären går genom
- Egen `/aterforsaljare` sida med lista, ny-dialog, detalj (`/aterforsaljare/[id]`)
- Återförsäljare filtreras bort från kundlistan
- Återförsäljare-dropdown vid skapande av kunder och affärer
- Visas på pipeline-kort ("via Randek AB")
- Prospekt som sub-item under Återförsäljare i sidebar

### Fas 11: Supabase Auth ✅ KLAR
- `auth_id` kolumn på users kopplad till `auth.users`
- `create_user_with_password` RPC — skapar auth-användare + public user
- Login-sida (`/login`) med e-post + lösenord
- Middleware skyddar alla sidor (redirect till /login)
- Lösenordsfält i "Ny användare"-dialogen (admin sätter lösenord)
- Logga ut-knapp i sidebar

### Fas 12: Bugfix & UI-polish ✅ KLAR
- [x] Ta bort anteckningar (kunder + återförsäljare)
- [x] Ta bort kunder och återförsäljare
- [x] Ta bort användare under Inställningar
- [x] Borttagen "Inaktivera användare"-knapp
- [x] Kanban drag & drop sparar korrekt (borttagen revalidatePath)
- [x] Redigera affärer — fixat DialogTrigger
- [x] Prospekt som sub-item i menyn under Återförsäljare
- [x] Pipeline: framåt/bakåt-knappar på kort
- [x] Pipeline: förbättrad DnD (touch-stöd, closestCenter, distance 6)
- [x] Pipeline: centrerad "Dra affärer hit"-text
- [x] Dashboard: borttaget "Pipeline per steg"-diagram
- [x] Sidebar: Prospekt-text samma storlek som övriga

---

## Context
Forsell System tillverkar maskiner för husprefabfabriker (elementhantering & modultransport). De behöver ett skräddarsytt B2B-CRM för sin säljprocess med långa säljcykler.

**Kärnflöde:** Prospect → Företag + Kontakt + Affär (pipeline)

**Befintliga resurser i projektet:**
- `Brandbook/Brandbook.pdf` — komplett brand book
- `Logo/forsell-logo-original (1).png` — grön logo på transparent bakgrund
- `Logo/forsell-logo-white.png` — vit logo för mörka bakgrunder
- `Bolagsinfo/Forsell-System-AB-Bolagsinformation.pdf` — bolagsinformation & produktkatalog

---

## Branding & Design (från Brand Book)

### Färgpalett
| Namn | Hex | Användning |
|---|---|---|
| Primary | `#50645F` | Huvudfärg — logotyp, knappar, rubriker, sidebar |
| Primary Darker | `#2A3835` | Mörka bakgrunder, header |
| Primary Dark | `#3D4E4A` | Hover-states, sekundära bakgrunder |
| Primary Light | `#6A7F7A` | Sekundära element, ikoner |
| Primary Lighter | `#8A9E99` | Subtila accenter, disabled states |
| Black | `#1A1F1D` | Primär textfärg |
| Dark Gray | `#3D4542` | Sekundär text |
| Mid Gray | `#6B7672` | Brödtext, placeholders |
| Light Gray | `#B8BFBB` | Linjer, ramar, avdelare |
| Off White | `#F0F2F1` | Sektionsbakgrunder |
| Warm Accent | `#C4883A` | CTA-knappar, varningar, highlights |
| Steel | `#5A7080` | Tekniska element, diagram |
| Deep Red | `#8B3D3D` | Felmeddelanden, kritiska alerts |

### Typografi (Google Fonts)
- **Rubriker & UI:** Barlow (400–900)
- **Etiketter & Nav:** Barlow Condensed (versaler, 400–800)
- **Display/Citat:** DM Serif Display (sparsamt)
- **Brödtext:** Barlow Regular 400, 16–18px, line-height 1.7

### Typografisk skala
- H1: 48px, H2: 36px, H3: 24px, H4: 20px, Body: 16px, Small: 14px, Label: 12px (versaler)

### Tonalitet
Konkret, trygg, effektiv, nordisk. Ingenjörer till ingenjörer — utan fluff.

---

## Produkter (seed-data för Maskiner)

### Kategori: Element Handling
| Maskin | Beskrivning |
|---|---|
| Accessrail | Arbetsplattform för säkert arbete på husmoduler, justerbar i höjd och sidled |
| Vertilift | Lyfter, roterar och förflyttar väggar och tak utan stroppar |
| Modutile | Maskin för kakelsättning av badrumsväggar |
| Vertistore | System för lagring och sortering av väggar stående |
| Modutrack | Station för manuell hantering av väggar och tak på rullbara vagnar |
| Painttrack | Station för målning av väggar stående |

### Kategori: Module Transport Solutions
| Maskin | Beskrivning |
|---|---|
| Skate System | Manuellt lågkostnadssystem med golvmonterat rälsystem |
| Beam Feeder | Semi-automatisk lösning med balkmatare |
| Beam Roller | Helautomatisk transport med automatisk balkåterföring |

---

## Tech Stack
| Val | Teknik |
|---|---|
| Frontend | Next.js 15 (App Router, Server Components) |
| Backend/DB | Supabase (PostgreSQL) |
| UI | shadcn/ui + Tailwind CSS |
| Kanban DnD | @dnd-kit/core + @dnd-kit/sortable |
| Formulär | react-hook-form + zod |
| Diagram | recharts |
| Datum | date-fns (sv locale) |
| Ikoner | lucide-react |
| Språk | Svenska (UI, URL:er) |

---

## Fas 0: Projektscaffolding ✅ KLAR

1. ✅ Initiera Next.js med App Router + TypeScript + Tailwind + src-dir
2. ✅ Installera beroenden:
   - `@supabase/supabase-js @supabase/ssr`
   - `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
   - `react-hook-form @hookform/resolvers zod`
   - `recharts date-fns lucide-react`
3. ✅ Initiera shadcn/ui, lägg till komponenter: button, card, dialog, input, select, table, badge, textarea, tabs, dropdown-menu, sheet, separator, skeleton, tooltip, popover, label
4. ✅ Konfigurera Tailwind-tema med Forsell-färger och Google Fonts (Barlow, Barlow Condensed, DM Serif Display)
5. ✅ Kopiera logotyper till `public/` (original + vit variant)
6. ✅ Skapa `.env.local` med Supabase-nycklar (placeholder — behöver fyllas i)
7. ✅ Skapa Supabase-klientfiler (`src/lib/supabase/client.ts`, `server.ts`)
8. ✅ Skapa grundlayout med sidebar (Forsell-branding: Primary Darker bakgrund, vit logo, Barlow Condensed nav-labels, collapse-funktion)
9. ✅ Skapa `CLAUDE.md`
10. ✅ Skapa alla 13 route-sidor med placeholder-innehåll (dashboard, prospekt, pipeline, företag, maskiner, inställningar + undersidor)
11. ✅ Skapa `src/lib/constants.ts` (pipeline stages, factory types, currencies, machine categories)
12. ✅ Skapa `src/lib/types/database.ts` (manuella TypeScript-typer för alla entiteter)
13. ✅ Skapa `src/lib/utils.ts` (formatDate, formatCurrency, cn)
14. ✅ Supabase MCP kopplad till projektet (`.mcp.json`)
15. ✅ Projektet bygger felfritt (`npm run build` — 13 routes)

---

## Fas 1: Databas via Supabase MCP ✅ KLAR

Koppla MCP till Supabase-projektet och skapa alla tabeller:
> **Status:** Alla tabeller skapade, seed-data infogad, .env.local konfigurerad.

### Tabeller
- **users** — id, name, email, role ('admin'|'salesperson'), is_active
- **companies** — id, name, customer_number, org_number, country, phone, email, website, responsible_user_id, prospect_id, fortnox_customer_id
- **contacts** — id, company_id (FK), name, title, email, phone, is_primary
- **prospects** — id, company_name, factory_type ('modulfabrik'|'vagg_tak_fabrik'), country, contact_person, email, phone, status ('active'|'converted'|'archived'), converted_at, converted_company_id, converted_deal_id
- **machines** — id, name, category, description, is_active
- **deals** — id, quote_number, company_id (FK), contact_id (FK), stage ('kontakt'|'behovsanalys'|'offert'|'forhandling'|'avslutad_affar'|'avslutad_ingen_affar'), value, currency, responsible_user_id, prospect_id, closed_at, expected_close_date, sort_order
- **deal_machines** — id, deal_id (FK), machine_id (FK), quantity. UNIQUE(deal_id, machine_id)
- **notes** (polymorfisk) — id, entity_type ('prospect'|'company'|'deal'|'contact'), entity_id, content, author_user_id, source_entity_type, source_entity_id, created_at. Immutable (append-only).
- **activity_log** — id, entity_type, entity_id, action, metadata (JSONB), user_id, created_at

### Triggers & Views
- `update_updated_at()` trigger på alla tabeller med updated_at
- `pipeline_summary` view — deals per stage med count/total/avg value
- `recent_deals` view — senaste 20 deals med joins

### RLS
- Aktivera RLS på alla tabeller
- Tillfälliga "allow all"-policies (ersätts vid auth-implementation)

---

## Fas 2: Maskiner & Inställningar (etablera mönster) ✅ KLAR

**Mål:** Etablera mönster för CRUD, server actions, formulär, tabeller.

### `/maskiner`
- Maskinlista (server component + Supabase query)
- "Ny maskin"-knapp → formulär med namn, kategori, beskrivning
- Redigera/ta bort maskin
- **Seed-data:** Alla 9 maskiner från produktportföljen (se Produkter ovan), kategoriserade som "Element Handling" eller "Module Transport Solutions"

### `/installningar`
- Användarlista
- Lägg till användare (namn, e-post, roll)
- Redigera/inaktivera användare
- **Seed-data:** En initial användare (Jörgen Forsell, VD)

---

## Fas 3: Prospekt + Anteckningssystem ✅ KLAR

### `/prospekt`
- Tabell: företagsnamn, fabrikstyp, land, kontaktperson, status
- Sök & filter (fabrikstyp, status)
- "Ny prospekt"-knapp

### `/prospekt/ny`
- Formulär med alla fält + validering
- Fabrikstyp-dropdown (Modulfabrik / Vägg & takfabrik)

### `/prospekt/[id]`
- Visa all prospektinfo
- Redigera inline
- **Anteckningshistorik** (delad komponent)
- "Konvertera till affär"-knapp (aktiveras i Fas 6)

### Delad anteckningskomponent
- `NotesTimeline` — renderar anteckningar med datumstämplar, sorterade kronologiskt
- `AddNoteForm` — lägg till ny anteckning
- Server actions för antecknings-CRUD
- Återanvänds på företag och affärer

---

## Fas 4: Kunder (f.d. Företag) & Kontakter ✅ KLAR

> **OBS:** "Företag" omdöpt till "Kunder" i hela UI:t. URL:erna är fortfarande `/foretag` internt.

### `/foretag` (Kunder)
- Tabell: namn, kundnummer, land, ansvarig
- Sök på namn, kundnummer
- **Filtrerar bort återförsäljare** (`is_reseller = false`)
- Återförsäljare-dropdown vid skapande av kund

### `/foretag/ny`
- Alla fält + validering
- Ansvarig-dropdown (från users)
- Återförsäljare-dropdown

### `/foretag/[id]`
- Kundinformation
- Kontaktlista (lägg till/redigera i dialog)
- Kopplande affärer
- Anteckningshistorik (med ta bort)
- Ta bort kund

---

## Fas 5: Pipeline / Kanban ✅ KLAR

### `/pipeline`
- **6 kolumner:** Kontakt → Behovsanalys → Offert → Förhandling → Avslutad (affär) → Avslutad (ingen affär)
- Kolumnheader: stadinamn + antal + totalt värde
- **Kort:** företagsnamn, kontakt, värde, ansvarig
- **Drag & drop** mellan kolumner (uppdaterar stage + sort_order)
- **Drag & drop** inom kolumner (omsortera)
- "Ny affär"-knapp → dialog

### Ny affär-dialog
- Fält: offertnummer, företag (sökbar dropdown), kontakt (filtrerad på valt företag), produkter/maskiner (multi-select), värde, valuta, ansvarig

### `/pipeline/[id]`
- All affärsinformation
- Visuell stage-indikator
- Länkat företag & kontakt (klickbara)
- Produktlista
- Anteckningshistorik

### Teknisk approach
- Server component hämtar deals grupperade per stage
- Client component `KanbanBoard` hanterar DnD med @dnd-kit
- **Optimistic updates** — omedelbar UI-update + server action
- Vid fel: revert + error toast

---

## Fas 6: Konverteringsflöde (Prospect → Affär) ✅ KLAR

**Kritisk affärslogik — implementeras som Supabase RPC-funktion för atomicitet.**

### Steg i konverteringen:
1. Hämta prospekt med alla anteckningar
2. Skapa eller hitta företag (matchning på namn)
3. Skapa kontaktperson (is_primary = true)
4. Skapa affär i pipeline (stage: 'kontakt')
5. Kopiera anteckningar till företag + affär (med source_entity-spårning)
6. Uppdatera prospekt: status='converted', converted_at, converted_company_id, converted_deal_id
7. Logga i activity_log

### UI
- "Konvertera till affär"-dialog på prospektdetalj
- Förifylld med prospektdata
- Val: välj befintligt företag eller skapa nytt
- Vid framgång: redirect till nya affären i pipeline
- Konverterade prospekt visas gråade med länk till företag/affär

---

## Fas 7: Dashboard ✅ KLAR

### `/dashboard`
- **Pipelinevärde** — totalt värde av aktiva affärer
- **Aktiva affärer** — antal deals ej i avslutade stages
- **Snittordervärde** — medelvärde av vunna affärer
- **Senaste affärer** — lista med de 10 senast uppdaterade
- **Pipeline-diagram** — stapeldiagram per stage (recharts)

All data via server components och dashboard-queries.

---

## Fas 8: Polish & Finslipning ✅ KLAR

Branding appliceras redan i Fas 0 (färger, typsnitt, logo). Denna fas fokuserar på:
- Responsivt: sidebar kollapsar på mobil, tabeller blir kort
- Laddningslägen (skeleton)
- Tomma lägen ("Inga prospekt ännu. Skapa ditt första prospekt.")
- Toast-notifikationer (success/error)
- Svenska datumformat (date-fns sv locale)
- Finjustera spacing, hover-states, transitions
- Verifiera att alla färger/typsnitt följer brand book

---

## Fas 9: Fortnox-förberedelse ✅ KLAR

- `fortnox_customer_id` finns redan i companies-tabellen
- Skapa `src/lib/fortnox/` med types.ts och config.ts (placeholder)
- "Fortnox"-sektion på företagsdetalj ("Ej ansluten")
- Dokumentera planerad sync: företag → Fortnox-kund, avslutad affär → Fortnox-offert

---

## Projektstruktur

```
src/
├── app/
│   ├── layout.tsx              # Root layout med sidebar
│   ├── page.tsx                # Redirect → /dashboard
│   ├── globals.css
│   ├── dashboard/page.tsx
│   ├── prospekt/
│   │   ├── page.tsx            # Lista
│   │   ├── ny/page.tsx         # Nytt prospekt
│   │   └── [id]/page.tsx       # Detalj
│   ├── pipeline/
│   │   ├── page.tsx            # Kanban
│   │   └── [id]/page.tsx       # Affärsdetalj
│   ├── foretag/
│   │   ├── page.tsx
│   │   ├── ny/page.tsx
│   │   └── [id]/page.tsx
│   ├── maskiner/
│   │   ├── page.tsx
│   │   └── ny/page.tsx
│   └── installningar/page.tsx
├── components/
│   ├── ui/                     # shadcn/ui
│   ├── layout/                 # sidebar, header
│   ├── dashboard/              # kort, diagram
│   ├── prospects/              # tabell, formulär, konvertera-dialog
│   ├── pipeline/               # kanban-board, column, card, deal-dialog
│   ├── companies/              # tabell, formulär, detalj
│   ├── machines/               # lista, formulär
│   ├── notes/                  # notes-timeline, add-note-form
│   └── shared/                 # data-table, empty-state, loading-skeleton
├── lib/
│   ├── supabase/               # client.ts, server.ts
│   ├── actions/                # server actions per entity + conversion
│   ├── queries/                # data-fetching per entity + dashboard
│   ├── types/database.ts       # Supabase-genererade typer
│   ├── constants.ts            # pipeline stages, factory types, currencies
│   ├── utils.ts                # formatCurrency, formatDate, cn()
│   └── validations.ts          # Zod-scheman
└── hooks/
    ├── use-notes.ts
    └── use-kanban.ts
```

---

## Verifiering

### Per fas
- [x] Alla CRUD-operationer fungerar
- [x] Data visas korrekt i listor och detaljsidor
- [x] Formulärvalidering fångar ogiltiga värden
- [x] Laddningstillstånd visas
- [x] Navigation mellan relaterade entiteter fungerar

### Konverteringsflöde (kritiskt)
- [x] Skapa prospekt med 3+ anteckningar
- [x] Konvertera → företag, kontakt, affär skapas
- [x] Alla anteckningar finns på företag + affär med originaldatum
- [x] Prospekt markerat som konverterat
- [x] Dubbelkonvertering förhindras

### Kanban
- [x] Kort i rätt kolumner
- [x] Drag mellan kolumner uppdaterar stage + persisterar
- [x] Drag inom kolumn omsorterar + persisterar
- [x] Ny affär skapas i rätt kolumn
