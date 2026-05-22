# Lexarium

## What This Is

Lexarium is a personal Vue 3 SPA portfolio hub deployed on Vercel that hosts multiple mini-apps under `/projects/` (LexTrack, Larga, Gift Exchange, API Playground, Wallecx). v3.0 promotes Lexarium from "individual mini-apps" to a fully themed platform with site-wide dark mode.

**Wallecx**, the largest mini-app, is a personal records vault with three record types:

- **Vaccination records** — text fields (vaccine name, date, dose, lot, location, manufacturer, notes) plus an attached scan/photo of the card; grouped by vaccine type with search, sort, and view toggle
- **Membership cards** — loyalty, insurance, and ID cards with barcode/QR rendering, a full-screen scan overlay for counter use, and a coloured card grid
- **Expenses** — daily expense logging with category, description, receipt photo, and period-tabbed reporting (month / quarter / year / custom) with per-category breakdown charts

All three record types share the same per-user PocketBase isolation pattern, the same CRUD dialog + Zod validation + mapper architecture, and live in the same tabbed shell at `/projects/wallecx`.

## Core Value

**Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.**

If everything else fails, these two capabilities must work: the vaccination history list (with attachment preview), and the membership card grid (with barcode scan overlay).

## Current State: v4.0 Shipped — Planning Next Milestone

**Latest shipped:** v4.0 Daily Expense Tracker (2026-05-22) — third Wallecx record type added; Wallecx now covers vaccinations, membership cards, and daily expenses with period-tabbed reporting and per-category charts.

<details>
<summary>v4.0 milestone goal (shipped 2026-05-22)</summary>

**Goal:** Add a third Wallecx record type — expenses — with daily logging, period-tabbed reporting (month / quarter / year / custom), and per-category breakdown charts.

**Shipped:**
- `wallecx_expenses` + `wallecx_expense_categories` PocketBase collections with per-user rules, Zod schema, expenseMapper (9 Vitest tests)
- `ManageExpense.vue` CRUD dialog with Zod safeParse, isSaving guard, EXIF-stripped receipt upload, custom category seeding
- `ExpensesTab.vue` list view: sortable/filterable/searchable, sessionStorage sort persistence, receipt preview via AttachmentPreview
- `ExpensesReportsView.vue`: period selector (Month/Quarter/Year/Custom), Grand Total hero, horizontal bar chart, dark-mode reactive via useChartTheme, prefers-reduced-motion support
- Parent-shell + child-view SFC split pattern (ExpensesTab → ExpensesListView + ExpensesReportsView) established for future tabs
</details>

## Requirements

### Validated

- ✓ Vue 3 SPA portfolio shell with shared `CustomNavBar` and `RouterView` — existing
- ✓ Routing with lazy-loaded mini-apps under `/projects/<app>` and a `requiresAuth` guard — existing
- ✓ PocketBase auth (login/logout via `useAuthStore`) wired through Pinia — existing
- ✓ Brand design system (navy/amber palette, Rubik font, custom PrimeVue Aura preset, Tailwind v4 tokens) — existing
- ✓ LexTrack, Larga, Gift Exchange, API Playground mini-apps — existing
- ✓ Vercel deployment via GitHub push integration — existing
- ✓ Wallecx mini-app at `/projects/wallecx`, auth-gated, PocketBase-backed — v1.0
- ✓ `wallecx_vaccinations` collection with per-user rules and composite index — v1.0
- ✓ Vaccination read path (MIME-branched preview, short-lived tokens, no v-html) — v1.0
- ✓ Vaccination write path (Zod dialog, EXIF strip, isSaving guard, server-first delete) — v1.0
- ✓ Projects tile, design token audit, JSON export, route guard test — v1.0
- ✓ `vaccine_type` field end-to-end (collection, TypeScript interface, required form field) — v1.1
- ✓ Grouped card view by vaccine type with Uncategorized catch-all and group detail Drawer — v1.1
- ✓ Real-time search (type or name), sort (4 modes, Uncategorized pinned last), view toggle (grid/list, sessionStorage) — v1.2
- ✓ Edit/Delete restored in group detail drawer (emit chain through VaccinationGroupPanel) — v1.2
- ✓ WallecxApp.vue as PrimeVue Tabs shell; VaccinationsTab.vue self-contained extraction — v2.0
- ✓ `wallecx_memberships` collection with per-user rules; two-user isolation smoke test — v2.0
- ✓ BarcodeDisplay.vue (QR/linear/number-fallback/empty); full-screen scan overlay (Teleport, wake lock, iOS-safe) — v2.0
- ✓ MembershipCard.vue coloured tile grid with expiry warnings; MembershipDetail.vue read-only view — v2.0
- ✓ ManageMembership.vue CRUD dialog (direct v-model, ColorPicker, Zod, EXIF-stripped upload, server-first delete) — v2.0
- ✓ membershipMapper.spec.ts Vitest spec; 24 tests passing — v2.0
- ✓ vite-plugin-pwa: manifest, SW (registerType: 'prompt'), navigateFallback, NetworkOnly for /api/*, vercel.json cache headers — v2.1
- ✓ PWA icons: pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png, apple-touch-icon-180x180.png in public/ — v2.1
- ✓ WallecxApp.vue: navigator.storage.persist(), pb.authStore.isValid expiry check + toast + redirect, SW update toast (Refresh/Later) — v2.1
- ✓ WallecxToolbar generic (sortOptions required prop); MembershipsTab search/sort (displayedMemberships computed, sessionStorage persistence, no-results empty state) — v2.2
- ✓ Bottom sheet on mobile for VaccinationGroupPanel and MembershipDetail; toolbar view-toggle hidden on mobile with list view forced — v2.3
- ✓ Wallecx dark mode (PrimeVue #7465 fix via `@custom-variant dark` alignment + custom `@theme` token dark overrides); MembershipCard luminance-aware text color; PrimeVue Card visible separation override — v2.3
- ✓ `useTheme` composable + NavBar sun/moon toggle + inline FOUC script + localStorage persistence + OS-preference detection — v3.0
- ✓ Site shell + non-app pages dark mode (HomeView/Hero/About, ProjectsView, BlogView, Login, CustomNavBar) — v3.0
- ✓ Mini-app dark mode (LexTrack semantic-token refactor, Larga geocoder override, MonitoX sweep, API Playground chrome) — v3.0
- ✓ Wallecx audit confirmed Phase 18 dark mode survives site-wide toggle wire-up; PWA standalone PASS — v3.0
- ✓ `wallecx_expenses` collection (7 fields, 5 per-user rules); `wallecx_expense_categories` collection; Zod schema + expenseMapper + 9 Vitest tests — v4.0
- ✓ Third "Expenses" tab in WallecxApp.vue; `ManageExpense.vue` CRUD with Zod, isSaving guard, EXIF-stripped receipt upload, Dialog/Drawer mobile split, custom category seeding — v4.0
- ✓ ExpensesTab.vue list view: sortable (5 modes, sessionStorage), category multi-select filter, date-range filter, description search; receipt preview via AttachmentPreview — v4.0
- ✓ Parent-shell + child-view SFC split (ExpensesTab → ExpensesListView + ExpensesReportsView); single getFullList call preserved — v4.0
- ✓ `period.ts` dayjs helper (quarterOfYear plugin); `useChartTheme` composable (MutationObserver dark-mode reactive); 8 CSS chart palette tokens — v4.0
- ✓ `ExpensesReportsView.vue`: period selector (Month/Quarter/Year/Custom), Grand Total hero, horizontal bar chart (Chart.js via PrimeVue), dark-mode reactive, prefers-reduced-motion, sessionStorage persistence — v4.0

### Active

No active requirements — next milestone not yet planned. See `/gsd-new-milestone` to define v4.x or v5.0 goals.

### Future candidates

- [ ] **EXP-ADV-01** — Budget tracking per category (monthly/yearly targets with actual-vs-budget reporting)
- [ ] **EXP-ADV-02** — Recurring expenses (mark as recurring; auto-create future entries)
- [ ] **EXP-ADV-03** — Multi-currency support (currency field + FX conversion at report time)
- [ ] **EXP-ADV-04** — Period-over-period comparison (this month vs last; quarter-over-quarter delta)
- [ ] **EXP-ADV-07** — Expense JSON export (batch with CONV-01 vaccination/membership exports)
- [ ] **CONV-01** — JSON export of all membership card records (mirrors vaccination export)
- [ ] **CONV-03** — Expiry date reminders (requires notification infrastructure)
- [ ] **SCAN-ADV-01** — PDF417 and Aztec code formats via dynamic `bwip-js` import

### Out of Scope

| Feature | Reason |
|---------|--------|
| Apple Wallet / Google Wallet export | Requires server-side certificate signing |
| NFC tap-to-add | Browser SPA cannot reliably access NFC hardware |
| Live points balance / account integration | Per-issuer OAuth / scraping — excessive complexity |
| Barcode camera scanning to populate value | ZXing build cost exceeds manual entry benefit |
| Calendar view for vaccinations | List + detail is enough for a small dataset |
| OCR / auto-populating fields from card image | Manual entry is acceptable |
| Sharing a record / shareable link | Per-user privacy is the default |
| PDF export / printable summary | Attached card scan covers "show this" use case |
| Multi-language / localization | English only, matching the rest of Lexarium |
| Full offline data access | PocketBase has no offline SDK; IndexedDB replica is out of scope for v2.1 |
| Public unauthenticated access | Vaccination and membership data is sensitive |

## Context

**Codebase environment** — Existing Lexarium SPA. Deep map lives in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Key patterns Wallecx must follow:

- Mini-app convention: `src/components/projects/wallecx/` folder; `WallecxApp.vue` is the thin shell registered as a lazy route in `src/router/index.ts` with `meta: { requiresAuth: true }`
- Backend: shared `pb` singleton at `src/lib/pocketbase/index.ts`. Each record type has a types module (`src/types/wallecx/*/types.d.ts`) and a write mapper (`src/lib/pocketbase/*Mapper.ts`)
- UI: PrimeVue (Aura preset) + Tailwind v4 + Rubik. PrimeVue components auto-imported via `unplugin-vue-components`. `useConfirm` must be imported explicitly — not auto-resolved
- Auth: `useAuthStore` (Pinia setup store); `pb.authStore.record!.id` requires a null guard before use
- Dates: `dayjs` everywhere; PocketBase date filters use `"YYYY-MM-DD"` format
- File tokens: fetched at view time, not list time; `requestKey` must be distinct per collection to prevent auto-cancel

**Current state (v4.0 shipped — planning next milestone):**
- ~4,800 LOC TypeScript/Vue across `src/components/projects/wallecx/`
- 49 Vitest tests passing (vaccinationMapper.spec.ts × 10, guard.spec.ts × 3, membershipMapper.spec.ts × 11, expenseMapper.spec.ts × 9, period.test.ts × 16)
- Runtime deps: `qrcode.vue@^3.9.1`, `jsbarcode@^3.12.3`, `browser-image-compression@^2.0.2`, `vue-pdf-embed@^2.1.4`, `chart.js@^4.5.1`
- Dev deps: `vite-plugin-pwa@^1.3.0`, `workbox-window@^7.4.1`, `workbox-build@^7.4.1`, `@vite-pwa/assets-generator@^1.0.2`
- Three PocketBase collections: `wallecx_vaccinations`, `wallecx_memberships`, `wallecx_expenses` + `wallecx_expense_categories`
- Three-tab shell: Vaccinations / Memberships / Expenses; parent-shell + child-view SFC split pattern established
- PWA: installable, SW precaches 53 entries (3 MiB vendor limit), vercel.json deployed
- Mobile layouts: grid-cols-1 responsive, 44px touch targets, safe-area insets, bottom sheets (mobile), iOS install banner
- Dark mode: site-wide via useTheme composable + .my-app-dark on html; all Wallecx surfaces correct including charts via useChartTheme

## Constraints

- **Tech stack**: Vue 3 + Vite 8 (rolldown) + PrimeVue 4 (Aura) + Pinia + Vue Router + Tailwind v4 + PocketBase — Locked
- **Hosting**: Static deploy on Vercel. No server-side code beyond PocketBase
- **Auth**: Reuse existing PocketBase users + Pinia `useAuthStore`. No separate identity store
- **Privacy**: Per-user isolation enforced server-side via PocketBase collection rules — not just client-side route guards
- **Design system**: Lexarium navy/amber palette + Rubik font + PrimeVue Aura preset — no new design tokens
- **Naming**: Mini-app folder `src/components/projects/wallecx/`, root `WallecxApp.vue`, route name `wallecx`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build Wallecx as a Lexarium mini-app | Fits portfolio pattern; reuses auth, design system, PocketBase | ✓ Validated v1.0 |
| Multi-user from day 1 | Reuses existing PocketBase auth; per-user rules avoid a future migration | ✓ Validated v1.0 |
| File attachments in v1 | The card scan *is* the record for most people | ✓ Validated v1.0 |
| Standard field set (not Minimal, not Comprehensive) | Lot number is useful for recalls; clinical fields are excess | ✓ Validated v1.0 |
| Re-use Lexarium design system | No reason for a new visual identity on one mini-app | ✓ Validated v1.0 |
| `vaccine_type` optional in schema but required in form | No destructive migration for existing records; clean going forward | ✓ Validated v1.1 |
| Phase 6 reuses existing VaccinationDetail.vue without modification | GROUP-07 explicitly scopes to reuse | ✓ Validated v1.1 |
| Search/sort/view-toggle as pure client-side computed changes | No new PocketBase queries for v1.2 features | ✓ Validated v1.2 |
| PrimeVue Tabs over sub-routes for tab switching | Sub-routes break existing `/projects/wallecx` bookmarks | ✓ Validated v2.0 |
| Each tab owns its own state; no new Pinia store | VaccinationsTab + MembershipsTab are self-contained | ✓ Validated v2.0 |
| ManageMembership.vue uses direct v-model refs, not @primevue/forms | PrimeVue ColorPicker issue #8135 — controlled system ignores initial value | ✓ Validated v2.0 |
| `card_color` stored without `#` prefix | Matches ColorPicker emit format; all CSS bindings prepend `#` | ✓ Validated v2.0 |
| iOS fullscreen via viewport overlay, not Fullscreen API | `requestFullscreen()` unsupported on non-video elements iOS < 26 | ✓ Validated v2.0 |
| Every JsBarcode() call wrapped in try/catch | JsBarcode has no soft-fail mode; invalid input throws synchronously | ✓ Validated v2.0 |
| ConfirmDialog kept at WallecxApp.vue shell level | `useConfirm` broadcasts to single app-shell-level instance | ✓ Validated v2.0 |
| category stored as denormalized Text (not Relation) | Prevents retroactive history rewrite when a category is renamed | ✓ Validated v4.0 |
| DEFAULT_EXPENSE_CATEGORIES seeded lazily on first dialog open | No PocketBase signup hook needed; seeding in ManageExpense.vue on first open | ✓ Validated v4.0 |
| Period selector uses PrimeVue Tabs (scrollable) | Established PrimeVue pattern for mutually-exclusive options; scrollable handles narrow-viewport overflow | ✓ Validated v4.0 |
| Chart palette fully reactive via useChartTheme refs | MutationObserver on html element reads CSS vars; PrimeVue Chart's deep-watch re-renders automatically on .my-app-dark toggle | ✓ Validated v4.0 |
| dayjs Q-format template literal (not format token) | quarterOfYear plugin patches .quarter() accessors but NOT format() grammar — `Q${now.quarter()} ${now.format('YYYY')}` required | ✓ Validated v4.0 |
| Parent-shell + child-view SFC split for ExpensesTab | Shell owns data + dialogs; sibling views (ExpensesListView, ExpensesReportsView) own view-specific UI state and emit intent events | ✓ Validated v4.0 |

## Shipped Milestones

| Milestone | Phases | Shipped | Archive |
|-----------|--------|---------|---------|
| v1.0 MVP | 0–4 | 2026-05-12 | [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) |
| v1.1 Vaccine Grouping | 5–6 | 2026-05-12 | — |
| v1.2 Search, Sort & View Toggle | 7–9 | 2026-05-13 | — |
| v2.0 Membership Cards | 10–13 | 2026-05-14 | [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) |
| v2.1 Mobile PWA | 14–15 | 2026-05-14 | — |
| v2.2 Sort and Search for Membership Cards | 16 | 2026-05-15 | [v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md) |
| v2.3 UX Polish | 17–18 | 2026-05-18 | — |
| v3.0 Site-Wide Dark Mode | 19–22 | 2026-05-19 | [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) |
| v4.0 Daily Expense Tracker | 23–26 | 2026-05-22 | [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-22 after v4.0 milestone — Daily Expense Tracker shipped. All 13 EXP requirements validated. Wallecx now has three record types with period-tabbed reporting and dark-mode-reactive charts.*
