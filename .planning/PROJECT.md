# Lexarium

## What This Is

Lexarium is a personal Vue 3 SPA portfolio hub deployed on Vercel that hosts multiple mini-apps under `/projects/` (LexTrack, Larga, Gift Exchange, API Playground, Wallecx). v3.0 promotes Lexarium from "individual mini-apps" to a fully themed platform with site-wide dark mode.

**Wallecx**, the largest mini-app, is a personal records vault with three record types:

- **Vaccination records** — text fields (vaccine name, date, dose, lot, location, manufacturer, notes) plus an attached scan/photo of the card; grouped by vaccine type with search, sort, and view toggle
- **Membership cards** — loyalty, insurance, and ID cards with barcode/QR rendering, a full-screen scan overlay for counter use, and a coloured card grid
- **Expenses** — daily expense logging with category, description, receipt photo, and period-tabbed reporting (month / quarter / year / custom) with per-category breakdown charts

All three record types share the same per-user PocketBase isolation pattern, the same CRUD dialog + Zod validation + mapper architecture, and live in the same tabbed shell at `/projects/wallecx`.

## Core Value

**Each authenticated user can save, retrieve, and display their own vaccination records, membership/loyalty cards, and daily expenses — without ever losing access to them, and can track spending against per-category budget targets.**

If everything else fails, these capabilities must work: the vaccination history list (with attachment preview), the membership card grid (with barcode scan overlay), and the expenses list with reporting + budget comparison.

## Current State: v4.1 Shipped — Planning Next Milestone

**Latest shipped:** v4.1 Gap Resolution & Feature Completeness (2026-05-25) — closed deferred code-quality items (WR-01/02/03), added JSON exports for memberships and expenses, shipped budget tracking (Manage Budgets dialog + actual-vs-budget reports) and period-over-period comparison line, then ran a structured UAT sweep over 8 phases (80/82 in-scope scenarios passed, BR-2 barcode invariant verified twice, regression floor of 49/49 tests intact).

Wallecx is now feature-complete for personal records vault + expense tracking + budget tracking + period comparison. No active milestone — next milestone TBD via `/gsd-new-milestone`.

<details>
<summary>v4.1 milestone goal (shipped 2026-05-25)</summary>

**Goal:** Close deferred technical debt, add missing JSON exports, extend the expense tracker with budget and period-over-period comparison reporting, and verify untested UAT scenarios across past phases.

**Shipped:**
- CQ-01 expense_date calendar refinement; CQ-02 conditional notes spread on mapToUpdateExpense
- EXPORT-01 memberships JSON export; EXPORT-02 expenses JSON export
- `wallecx_expense_budgets` collection (per-user, monthly/yearly enum) + ExpenseBudget types + expenseBudgetMapper (RPT-01 data foundation)
- `ManageBudget.vue` bulk-upsert modal (Dialog/Drawer + Promise.all create/update/delete-on-zero)
- ExpensesReportsView Budget vs Actual section + Manage Budgets button (RPT-01 + RPT-02 end-to-end)
- ExpensesReportsView inline period-over-period comparison line (RPT-03 — Month + Quarter coverage; error/success color tokens; zero-prior graceful handling; U+2212 minus)
- Phase 30 UAT sweep: 80/82 scenarios passed across 8 ROADMAP-named phases (10, 11, 12, 18, 20, 21, 22, 25); 1 deferred (PWA standalone install needs install flow); 0 regressions
</details>

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
- ✓ CQ-01 expense_date Zod refinement using `dayjs(val, 'YYYY-MM-DD', true).isValid()` to reject invalid calendar dates (Feb 31, Apr 31) — v4.1
- ✓ CQ-02 `mapToUpdateExpense` notes field uses conditional spread; PATCH payload omits `notes` key when undefined (verified via `not.toHaveProperty`) — v4.1
- ✓ EXPORT-01 Memberships JSON export button; EXPORT-02 Expenses JSON export button (mirrors v1.0 vaccination export pattern) — v4.1
- ✓ `wallecx_expense_budgets` PocketBase collection (per-user, monthly/yearly enum, `@request.body.user` create rule); ExpenseBudget TypeScript types + AddExpenseBudget helper; `expenseBudgetMapper.ts` documenting locked `expense-budgets-getFullList` requestKey — v4.1
- ✓ `ManageBudget.vue` bulk-upsert modal (Dialog desktop / Drawer mobile) with per-category amount + Monthly/Yearly toggle, Promise.all create/update/delete-on-zero loop, watch(visible) pre-population, auth-null guard — v4.1
- ✓ ExpensesTab shell fetches budgets and passes through; ExpensesReportsView renders period-gated Budget vs Actual section (monthly for this-month, yearly for this-year, hidden for quarter/custom) with progress bars + Under/Over/On budget badges, plus Manage Budgets button entry — v4.1
- ✓ ExpensesReportsView inline period-over-period comparison line in STATE 4 between Grand Total and Manage Budgets button — Month + Quarter coverage; color-coded direction (error red = overspending, success green = underspending); `↑ $230 (+23%) vs last month` format; honest zero-prior handling (omit %, append "no prior spend"); U+2212 minus — v4.1
- ✓ Structured Phase 30 UAT sweep over 8 ROADMAP-named phases (10, 11, 12, 18, 20, 21, 22, 25) — 80/82 scenarios passed, 1 deferred (PWA standalone install), 0 regressions; BR-2 barcode invariant verified twice — v4.1

### Active

(none — v4.1 milestone shipped; next milestone TBD via `/gsd-new-milestone`)

### Future candidates

- [ ] **EXP-ADV-02** — Recurring expenses (mark as recurring; auto-create future entries)
- [ ] **EXP-ADV-03** — Multi-currency support (currency field + FX conversion at report time)
- [ ] **EXP-ADV-05** — Year-over-year period comparison (extend RPT-03 to this-year vs last-year; trivial dayjs.subtract('year') extension)
- [ ] **EXP-ADV-06** — Custom-range period comparison (same-length preceding window for Custom periods)
- [ ] **EXP-ADV-08** — Multi-period trend / sparkline (visualize last N periods inline near the Grand Total)
- [ ] **CONV-03** — Expiry date reminders (requires notification infrastructure)
- [ ] **SCAN-ADV-01** — PDF417 and Aztec code formats via dynamic `bwip-js` import
- [ ] **PWA-UAT-01** — PWA standalone install + toggle + re-open verification (deferred from Phase 22 V6)
- [ ] **UAT-RESIDUAL-01** — Walk through Phase 28 + Phase 29 deferred UAT scenarios (16 scenarios from v4.1)

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

**Current state (v4.1 shipped — planning next milestone):**
- ~5,200 LOC TypeScript/Vue across `src/components/projects/wallecx/` (v4.1 added ~410 lines: ManageBudget 240, ExpensesReportsView Phase 28+29 additions, ExpensesTab budget fetch + JSON exports, mappers)
- 49 Vitest tests passing (vaccinationMapper.spec.ts × 10, guard.spec.ts × 3, membershipMapper.spec.ts × 11, expenseMapper.spec.ts × 9, period.test.ts × 16)
- Runtime deps: `qrcode.vue@^3.9.1`, `jsbarcode@^3.12.3`, `browser-image-compression@^2.0.2`, `vue-pdf-embed@^2.1.4`, `chart.js@^4.5.1`
- Dev deps: `vite-plugin-pwa@^1.3.0`, `workbox-window@^7.4.1`, `workbox-build@^7.4.1`, `@vite-pwa/assets-generator@^1.0.2`
- Four PocketBase collections: `wallecx_vaccinations`, `wallecx_memberships`, `wallecx_expenses`, `wallecx_expense_categories`, `wallecx_expense_budgets`
- Three-tab shell: Vaccinations / Memberships / Expenses; Expenses tab has List + Reports sub-tabs; parent-shell + child-view SFC split pattern established
- Reports view: period selector → Grand Total hero → period-over-period comparison line (v4.1 RPT-03) → Manage Budgets button → chart → Budget vs Actual section (v4.1 RPT-01/02)
- PWA: installable, SW precaches, vercel.json deployed
- Mobile layouts: grid-cols-1 responsive, 44px touch targets, safe-area insets, bottom sheets (mobile), iOS install banner
- Dark mode: site-wide via useTheme composable + .my-app-dark on html; all Wallecx surfaces correct including charts via useChartTheme; BR-2 barcode invariant (black-on-white in both themes) reverified in v4.1 Phase 30 sweep

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
| PocketBase v0.29.3 createRule uses `@request.body.user` (NOT deprecated `@request.data.user`) | Confirmed against live PB instance during Phase 28; deprecated syntax causes create to return 403 | ✓ Validated v4.1 |
| `wallecx_expense_budgets` requestKey is `'expense-budgets-getFullList'` (locked invariant) | Must stay distinct from `expenses-getFullList`, `expense-categories-getFullList`, `vaccinations-getFullList`, `memberships-getFullList` to prevent PocketBase auto-cancel | ✓ Validated v4.1 |
| Bulk-upsert with Promise.all create/update/delete-on-zero | ManageBudget.vue dispatches concurrent writes per row; partial-failure acceptable for non-critical personal data; parent re-fetches on 'saved' to reflect actual server state | ✓ Validated v4.1 |
| Period-gated UI sections use `v-if` (DOM absent, not just hidden) | Phase 28 D-09 + Phase 29 D-01 — Budget vs Actual and period-comparison line both follow this pattern; non-applicable periods produce zero-length collections that collapse the section entirely | ✓ Validated v4.1 |
| Status color tokens map to value judgment: error=overspending, success=underspending, muted=neutral | Single mental model across Reports view (Budget vs Actual + period comparison) — red signals overspend, green signals underspend | ✓ Validated v4.1 |
| U+2212 minus character (−) for negative percentages, not ASCII hyphen-minus | Typographic correctness; locked in ExpensesReportsView Phase 29 helper | ✓ Validated v4.1 |
| Period comparison covers Month + Quarter only (Year + Custom hidden) | Roadmap-strict scope; year/custom deferred (EXP-ADV-05/06) to keep RPT-03 surface area minimal | ✓ Validated v4.1 |
| Phase 30 UAT sweep as one-plan-per-phase | 8 plans (30-01..30-08), each with checkpoint:human-verify + result-recording task; failures batch-handled at end via gap-closure fix plans | ✓ Validated v4.1 (0 failures actually needed — sweep was clean) |

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
| v4.1 Gap Resolution & Feature Completeness | 27–30 | 2026-05-25 | [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md) |

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
*Last updated: 2026-05-25 — v4.1 milestone shipped (4 phases, 15 plans, 7 requirements validated). Wallecx now feature-complete for personal records + expense tracking + budget tracking + period comparison. 9 milestones shipped to date. Next milestone TBD via `/gsd-new-milestone`.*
