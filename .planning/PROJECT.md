# Lexarium

## What This Is

Lexarium is a personal Vue 3 SPA portfolio hub deployed on Vercel that hosts multiple mini-apps under `/projects/` (LexTrack, Larga, Gift Exchange, API Playground, PayTime, and the frozen Wallecx). v3.0 promoted Lexarium from "individual mini-apps" to a fully themed platform with site-wide dark mode.

**PayTime** is the active mini-app as of v5.0 — a shared-utility payment tracker for a Filipino-setting boarding house, where boarders split electricity, internet, boarding fee, and misc costs each month:

- **Payment log** — each boarder logs what they paid: category, the month it covers, date paid, amount, optional notes, and an optional screenshot proof (client-compressed to WebP, stored in a protected PocketBase file field)
- **Electricity calculator** — splits a monthly bill across a main group and sub-metered groups; derives price-per-kWh from amount ÷ consumption and shows the per-person share
- **Monthly report** — admin-only per-boarder view of who paid what for a chosen month

**Wallecx** — historically the largest mini-app and the focus of v1.0–v4.3 — **migrated to its own repository on 2026-06-05** and is frozen here. Its code remains at `/projects/wallecx` by decision but receives no further work. Read Wallecx history below as context for established patterns, not as active scope.

## Core Value

**Each authenticated user can record and retrieve their own data in whichever mini-app they use — without ever losing access to it — and PayTime's admin can maintain the boarding house's payment ledger on behalf of every boarder, whether or not that boarder has an account.**

If everything else fails, these must work: logging a payment against the right boarder and month, and the admin being able to see who has and hasn't paid for a given month.

Wallecx's frozen core value, for reference: each authenticated user can save, retrieve, and display their own vaccination records, membership/loyalty cards, and daily expenses, and track spending against per-category budget targets.

## Current State (after v4.3, before v5.0)

**v4.3 Wallecx Mobile Optimization shipped 2026-06-08** (Phases 33–37, merged to `master`). Phase 38 (Mobile UAT Sweep) + conditional 38b were **cancelled** because Wallecx migrated to a separate repository on 2026-06-05.

**PayTime v1.0 shipped outside the GSD loop** (13 commits on `feat/paytime`, pushed 2026-08-04, not yet merged to `master`). It has no archived milestone, no REQUIREMENTS entry, and no phase history — the validated-requirements entries below were derived by reading the shipped code, not from a GSD artifact. Treat them as accurate about behaviour but unbacked by phase verification or a UAT sweep. **PayTime has never had an end-to-end browser smoke test**; build, type-check, and 185 unit tests pass, but no run against live PocketBase has been observed.

## Current Milestone: v5.0 Admin Payment Ledger

**Goal:** Let the admin keep the whole boarding house's payment ledger — logging on behalf of boarders who have no account — with a tagged boarder roster that makes logs easy to slice.

**Target features:**
- `paytime_boarders` roster — admin-managed: display name, tags, optional link to a `users` account. Admin CRUD; readable by every authenticated user (the boarder selector needs a source, and a boarder must be able to resolve their own record).
- Payment subject rework — `paytime_payments` points at a `boarder`, not a `user`. All five API rules rewritten to reach ownership through the link instead of `user = @request.auth.id`. The single existing record is backfilled.
- Admin logs on behalf — `ManagePayment` gains an admin-only boarder selector. Non-admins stay pinned to their own linked boarder; nobody can log against another boarder.
- Tags — assign tags per boarder; filter and group the ledger and the monthly report by tag.
- Admin ledger view — all boarders' payments in one place, filterable by month, tag, boarder, and category. Distinct from the existing per-boarder monthly report.
- `recorded_by` audit field — once one person can write another's rows, "who logged this" is no longer inferable from the subject field.

**Key risk to settle before the plan locks:** every rewritten access rule depends on PocketBase resolving a relation traversal (`boarder.user = @request.auth.id`). Believed supported in v0.29.x but **not yet tested on this instance**. If it does not hold, the fallback is denormalising the account id onto each payment — which changes the phase shape, so prove it early.

**Schema changes go through the PB Admin UI** — the prod MCP env is SchemaRead-only. Project invariant D-13 applies: paste back actual configured values *and* run a code-side smoke probe. Acknowledgement alone has silently no-op'd before (v4.2 BUG-01).

## Shipped: v4.3 Wallecx Mobile Optimization (2026-06-08)

**Goal:** Make Wallecx feel native-grade on mobile — tighten layout & touch targets, drop perceived load time on small-screen devices, and polish the PWA install + standalone experience.

**Target features:**
- Wallecx-wide mobile layout & touch-target audit across all 3 tabs (Vaccinations, Memberships, Expenses List + Reports) — responsive grids, 44px tap targets, bottom sheets, safe-area insets, no horizontal scroll, modal sizing
- Mobile performance improvements — bundle size, lazy-loading, image compression, first paint, list virtualization on long lists
- Forms & dialogs on small screens — Drawer-vs-Dialog mobile split refinement, sticky action bars, iOS 16px input-font fix, scroll trapping
- PWA install + standalone polish — iOS standalone, install banner, safe-area insets, app-icon polish

**Test viewports:** iOS Safari (~390px), Android Chrome (~360–412px), Tablet (~768–820px)

**Explicitly deferred from v4.3 scope:** HEALTH-01 (boot-time collection health check), UAT-28-CLOSE + UAT-29-CLOSE (16 deferred UAT scenarios), PB-REALTIME (uniform `wallecx_*` realtime subscribe). v4.3 stays mobile-focused.

## Previous State: v4.2 Shipped 2026-05-26

**Latest shipped:** v4.2 Budget Recovery & Hardening (2026-05-26) — closed two production-visible bugs discovered after v4.1 ship. BUG-01: re-created the missing `wallecx_expense_budgets` PocketBase collection via a paste-back gated Admin UI flow that replaced Phase 28-01's trust-based "approved" signal. BUG-02: refactored `ExpensesTab.vue` `onMounted` into independent try/catches so a budgets-only failure no longer fires the misleading `'Failed to load expenses…'` toast or blocks the expenses list. Locked new architectural invariant D-13 ("Admin-UI checkpoints require text paste-back + downstream smoke verify") that prevents the silent-no-op trust-based-checkpoint failure mode project-wide. One PocketBase v0.29.x count-path bug discovered + documented in deviation D-31-B (workaround via `getFullList()` or `getList(p, pp, { skipTotal: true })`).

**Previously shipped:** v4.1 Gap Resolution & Feature Completeness (2026-05-25) — closed deferred code-quality items (WR-01/02/03), added JSON exports for memberships and expenses, shipped budget tracking (Manage Budgets dialog + actual-vs-budget reports) and period-over-period comparison line, then ran a structured UAT sweep over 8 phases (80/82 in-scope scenarios passed, BR-2 barcode invariant verified twice, regression floor of 49/49 tests intact).

<details>
<summary>v4.1 milestone goal (shipped 2026-05-25)</summary>

**Goal:** Close deferred technical debt, add missing JSON exports, extend the expense tracker with budget and period-over-period comparison reporting, and verify untested UAT scenarios across past phases.

**Shipped:**
- CQ-01 expense_date calendar refinement; CQ-02 conditional notes spread on mapToUpdateExpense
- EXPORT-01 memberships JSON export; EXPORT-02 expenses JSON export
- `wallecx_expense_budgets` collection (per-user, monthly/yearly enum) + ExpenseBudget types + expenseBudgetMapper (RPT-01 data foundation) — NOTE: production PB collection was never actually created; v4.2 closes this gap
- `ManageBudget.vue` bulk-upsert modal (Dialog/Drawer + Promise.all create/update/delete-on-zero)
- ExpensesReportsView Budget vs Actual section + Manage Budgets button (RPT-01 + RPT-02 end-to-end)
- ExpensesReportsView inline period-over-period comparison line (RPT-03 — Month + Quarter coverage; error/success color tokens; zero-prior graceful handling; U+2212 minus)
- Phase 30 UAT sweep: 80/82 scenarios passed across 8 ROADMAP-named phases (10, 11, 12, 18, 20, 21, 22, 25); 1 deferred (PWA standalone install needs install flow); 0 regressions
</details>

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
- ✓ **BUG-01** — `wallecx_expense_budgets` PocketBase collection re-created in production with locked Phase 28-01 schema (4 fields, 5 rules with v0.29.3 `@request.body.user` createRule); paste-back gated Admin UI flow + `getFullList` 200 + empty array smoke verify; D-13 architectural invariant locked into STATE.md as workflow-layer prevention of silent-no-op checkpoints — v4.2
- ✓ **BUG-02** — `ExpensesTab.vue` `onMounted` refactored to independent try/catches; `loadBudgets()` gained `opts: { context: 'mount' | 'refresh' }` parameter with ternary toast (`'Failed to load budgets.'` vs `'Failed to refresh budgets after save. Reload to see changes.'`); `isLoading` wraps only the expenses fetch; budgets-only failure no longer fires misleading toast or blocks expenses list (UAT 1 close-the-loop signal verified) — v4.2
- ✓ **PF-01/02/04/05/07/09** — Wallecx mobile performance: vendor code-splitting (chart-js, jsbarcode, image-compression as priority-25 rolldown groups); WallecxApp.vue tabs + per-Manage* dialogs converted to `defineAsyncComponent` + Suspense; WallecxSkeleton with 5 byte-matched variants replacing 5 inline skeletons + 6 Suspense fallbacks (CLS ≤ 0.1 emulation-confirmed at 390×844); `perfInstrument.ts` `instrumentedGetFullList` wrapping all 5 mount-path getFullList calls with one-shot sessionStorage gate + localStorage `wallecx:perf-baseline` writes; shared `compressToWebP.ts` helper (fileType: image/webp, .webp filename rename) adopted in all 3 Manage* upload paths; index.html PocketBase-origin preconnect + dns-prefetch hints. Wallecx route chunk gzip 64.09 KB → 2.13 KB (−96.7%; target ≥50% met 15×). NFR-REQUESTKEY-UNIQUE closed (all 5 mount-path keys distinct + explicit in STATE.md). Phase 38 carry-overs: real-device PF-05 baseline reading, real-device CLS final-check, ManageVaccination current-card thumbnail polish — v4.3

**PayTime v1.0 — shipped outside GSD, derived from code (not phase-verified):**

- ✓ PayTime mini-app at `/projects/paytime`, auth-gated, PocketBase-backed; `PayTimeApp.vue` PrimeVue Tabs shell (My Payments / Electricity Calculator / Monthly Report) — PayTime v1.0
- ✓ `paytime_payments` collection (7 fields, 5 rules) + `users.is_admin` bool; `month` deliberately text `"YYYY-MM"` so the report filters by equality instead of range math — PayTime v1.0
- ✓ `PaymentLog.vue` own-payments list with `requestKey: "paytime-payments-list"`; create, edit, and delete of own rows — PayTime v1.0
- ✓ `ManagePayment.vue` reusable add/edit Dialog — `visible`/`record` `defineModel` pair, `saved` emit, `describeSaveError()` unwrapping PB per-field validation messages — PayTime v1.0
- ✓ `paymentSchema.ts` Zod validation — required amount, optional notes, 5 MB / image-MIME screenshot guard, and a native UTC round-trip calendar check (dayjs strict parse is a no-op here: `customParseFormat` is never registered) — PayTime v1.0
- ✓ `electricityCalc.ts` pure `calculateShares(totalKwh, totalAmount, subMeters, group1People)` — sub-meter reading-from/reading-to, derived price-per-kWh, per-person Group 1 share — PayTime v1.0
- ✓ `MonthlyReport.vue` admin-only per-boarder Panels for a selected month, `expand: "user"`, `requestKey: "paytime-report-list"`; gated client-side on `is_admin` in both `<Tab>` and `<TabPanel>` and server-side in the list/view rules — PayTime v1.0
- ✓ Protected-file handling: `useFileToken.ts` module-level singleton (150 s refresh against a 180 s `fileToken.duration`, in-flight dedup, cleared on `authStore.onChange`) + `screenshotUrls.ts` (skips `?thumb=` for WebP, which 404s) — PayTime v1.0
- ✓ Screenshot pre-processing: `lib/images/compressToWebP.ts` (relocated from `lib/wallecx/`) wrapped by `prepareScreenshot.ts`, which returns the original if compression fails or doesn't shrink — PayTime v1.0
- ✓ Mobile row layout: details column with inline kebab `Menu`, then amount / proof thumbnail / desktop actions — breakpoint classes on plain wrappers, never on a PrimeVue `Button` (Tailwind utilities are layered; PrimeVue's runtime CSS is not, and unlayered wins) — PayTime v1.0
- ✓ 185 Vitest tests passing (adds `electricityCalc`, `paymentSchema`, `paytimePaymentMapper`, `prepareScreenshot`, `useFileToken`, `requestKeys`, `paymentEdit`) — PayTime v1.0

### Active

v5.0 Admin Payment Ledger — **Phase 38 complete** (2026-08-04), Phases 39–41 remain. See `REQUIREMENTS.md` for the canonical traceability table.

Validated in Phase 38: Boarder Roster Foundation — ROSTER-01 … ROSTER-06, TAG-01, VERIFY-03.

- ✓ `paytime_boarders` live in prod (`pbc_3712673815`): `name` text required, `tags` json, `user` relation → `users` (maxSelect 1, `cascadeDelete: false`), `is_active` bool. Read by any authenticated user (`@request.auth.id != ""`), written only by `@request.auth.is_admin = true` — Phase 38
- ✓ Admin › Boarders roster with full CRUD, tag chips, account-link picker, Inactive badge, and a row-action cluster verified at 390px — Phase 38
- ✓ Live rule proof recorded in `38-COLLECTION.md`: tokenless read returns zero rows against a seeded 7-row roster (VERIFY-03); tokenless write refused **and** the roster re-read unchanged afterwards (ROSTER-06 server half) — Phase 38
- ✓ 8/8 UAT passed, `38-SECURITY.md` `threats_open: 0` (13 threats, 7 mitigated + 6 accepted) — Phase 38

**Two platform constraints discovered in Phase 38 that bind Phases 39–41:**

- **PocketBase v0.23+ has no per-field default values.** `is_active` is enforced across three deliberate code paths (Zod `.default(true)` on create → mapper sends it explicitly; excluded from `mapToUpdateBoarder`; a dedicated single-key toggle). There is no server-side backstop — any new write path must set it itself. Same shape for whitespace-name rejection, which is Zod-only: the live schema would accept `"   "`.
- **An unset `maxSelect: 1` relation stores `''`, not `NULL`.** So "unlinked boarder" filters as `user = ''`, and the unique index on `user` had to be **partial** (`WHERE user != ''`) — a plain `UNIQUE(user)` rejects the second accountless row. Confirmed: seven coexisted.

**Carried, not scheduled:** PayTime *payments* end-to-end browser smoke test (still never performed). `38-REVIEW.md` WR-01 — a boarder whose linked account is later deleted keeps a dead relation id (`cascadeDelete: false` by design), and the next unrelated edit then fails with nothing in the UI explaining why; latent until Phase 38 UAT but one boarder is now linked, and Phase 39 makes linking central. ROSTER-06's authenticated-non-admin write half is proven by rule text only — the token-based exercise is Phase 39's VERIFY-02. PayTime source files are not Prettier-clean. `feat/paytime` is pushed but unmerged.

### Future candidates

> **Wallecx-scoped candidates below are moot here** — Wallecx migrated to its own repo on 2026-06-05. Kept for the record; if any still matter they belong in that repo's backlog, not this one. Only non-Wallecx entries are live candidates for Lexarium milestones.

**PayTime candidates (live):**

- [ ] **PT-SMOKE-01** — End-to-end browser smoke test of PayTime v1.0 against live PocketBase (never performed): per-category logging including `boarding_fee`, cross-boarder isolation, proof upload + preview, admin report showing names. Steps already written in the `paytime-pocketbase-schema-pending` note.
- [ ] **PT-RULE-01** — Close the `updateRule` ownership-reassignment gap server-side: `user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)`. The frontend never sends the owner field on update (asserted by test) but a hand-crafted API call still could. **Likely absorbed by v5.0's rule rewrite — re-check rather than doing it twice.**
- [ ] **PT-AMOUNT-01** — Make `amount` required in PocketBase, not only in the browser.
- [ ] **PT-FMT-01** — Prettier-format the PayTime source files (committed unformatted).
- [ ] **PT-MSGR-01** — Messenger bot for logging payments from the house group thread (deferred at PayTime v1.0; carries a group-thread feasibility risk).

**Wallecx candidates (moot — separate repo):**

- [ ] **EXP-ADV-02** — Recurring expenses (mark as recurring; auto-create future entries)
- [ ] **EXP-ADV-03** — Multi-currency support (currency field + FX conversion at report time)
- [ ] **EXP-ADV-05** — Year-over-year period comparison (extend RPT-03 to this-year vs last-year; trivial dayjs.subtract('year') extension)
- [ ] **EXP-ADV-06** — Custom-range period comparison (same-length preceding window for Custom periods)
- [ ] **EXP-ADV-08** — Multi-period trend / sparkline (visualize last N periods inline near the Grand Total)
- [ ] **CONV-03** — Expiry date reminders (requires notification infrastructure)
- [ ] **SCAN-ADV-01** — PDF417 and Aztec code formats via dynamic `bwip-js` import
- [ ] **PWA-UAT-01** — PWA standalone install + toggle + re-open verification (deferred from Phase 22 V6)
- [ ] **HEALTH-01** (deferred from v4.2) — Code-level collection health check on app boot or Reports tab mount: probe `wallecx_expense_budgets` reachability and surface an inline warning (with PB Admin UI setup steps) if missing. Complements the v4.2 D-13 workflow-layer invariant with a runtime safety net.
- [ ] **UAT-28-CLOSE** (deferred from v4.2) — Walk through Phase 28's 9 deferred UAT scenarios in `28-HUMAN-UAT.md` now that the collection is healthy.
- [ ] **UAT-29-CLOSE** (deferred from v4.2) — Walk through Phase 29's 7 deferred UAT scenarios in `29-HUMAN-UAT.md` (period comparison validation).
- [ ] **PB-REALTIME** (captured during v4.2 Phase 32 discussion) — PocketBase realtime `subscribe('*', cb)` / `unsubscribe('*')` lifecycle for `wallecx_*` collections to replace `@budgets-saved`-driven manual refetch and similar emit-up-refetch patterns. Apply uniformly across all wallecx collections rather than ad-hoc on one.

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

**Codebase environment** — Existing Lexarium SPA. Deep map lives in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Note the map predates PayTime and still describes Wallecx as the active app. Key patterns every mini-app follows (written below with Wallecx names; PayTime mirrors them under `src/components/projects/paytime/` with `PayTimeApp.vue`):

- Mini-app convention: `src/components/projects/wallecx/` folder; `WallecxApp.vue` is the thin shell registered as a lazy route in `src/router/index.ts` with `meta: { requiresAuth: true }`
- Backend: shared `pb` singleton at `src/lib/pocketbase/index.ts`. Each record type has a types module (`src/types/wallecx/*/types.d.ts`) and a write mapper (`src/lib/pocketbase/*Mapper.ts`)
- UI: PrimeVue (Aura preset) + Tailwind v4 + Rubik. PrimeVue components auto-imported via `unplugin-vue-components`. `useConfirm` must be imported explicitly — not auto-resolved
- Auth: `useAuthStore` (Pinia setup store); `pb.authStore.record!.id` requires a null guard before use
- Dates: `dayjs` everywhere; PocketBase date filters use `"YYYY-MM-DD"` format
- File tokens: fetched at view time, not list time; `requestKey` must be distinct per collection to prevent auto-cancel

**Current state (PayTime v1.0 shipped — planning v5.0):**

- PayTime: ~1,400 LOC across `src/components/projects/paytime/`, `src/lib/paytime/`, `src/composables/useFileToken.ts`, `src/lib/images/compressToWebP.ts`, `src/types/paytime/`
- 185 Vitest tests passing repo-wide; type-check and build clean
- One PocketBase collection (`paytime_payments`) + `users.is_admin`; **1 record in prod** (a `2026-07` electricity test row, ₱123, owned by Cedrick `4ygxbt0zey088di`) — so v5.0's schema migration is effectively free
- 6 users total, 1 admin (Cedrick). Not all boarders have accounts — the premise of v5.0
- Runtime deps PayTime relies on: `browser-image-compression@^2.0.2` (shared with frozen Wallecx), `zod@^4.3.6`, `dayjs`
- Backend host: `.env.development` and `.env.production` both point at `https://lexarium-backend.fly.dev`, which is the **same instance** as `api.delveen.cc` (verified by identical public record id) — so schema read via the `prod` MCP env is the schema the app uses

**Wallecx state, frozen (v4.1-era snapshot, separate repo now):**
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
- **Naming**: Mini-app folder `src/components/projects/<app>/`, root `<App>App.vue`, route name `<app>`. Wallecx: `wallecx` / `WallecxApp.vue`. PayTime: `paytime` / `PayTimeApp.vue`, with shared logic under `src/lib/paytime/` and types under `src/types/paytime/`
- **PayTime collection prefix**: `paytime_*` — new collections in v5.0 follow it (`paytime_boarders`)
- **requestKey uniqueness (locked invariant)**: every `getFullList` on a mount path needs its own explicit `requestKey`. The PocketBase SDK's default key is `method + path` and **excludes the query string**, so two differently-filtered list calls to the same collection silently abort each other. Existing PayTime keys: `paytime-payments-list`, `paytime-report-list`

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
| Admin-UI checkpoints require text paste-back + downstream smoke verify (D-13 invariant) | Trust-based "approved" signals silently no-op'd Phase 28-01 Task 1 and caused BUG-01. Now project-wide: any phase configuring a live external artifact (PB collection, env vars, dashboard settings) MUST require the user to paste back actual configured values as text AND a code-side smoke probe must exercise the live artifact. Acknowledgment-only is explicitly insufficient | ✓ Validated v4.2 (mitigated T-31-05 process-level threat; locked structurally for all future GSD admin-UI tasks) |
| PocketBase v0.29.x `getList()` count-path bug against non-trivial listRule expressions | The totalItems COUNT path trips on `@request.auth.id != "" && user = @request.auth.id`-shaped listRule expressions, returning 400 "Something went wrong". `getFullList()` uses skipTotal internally and works correctly. Workarounds: `getFullList()` or explicit `getList(p, pp, { skipTotal: true })` | ✓ Documented v4.2 (D-31-B; not a project defect, but a PB SDK/server quirk worth knowing) |
| `loadBudgets()` carries call-site context via `opts.context: 'mount' \| 'refresh'` parameter (default 'refresh') | Single source of truth for the budgets fetch; ternary toast branches to the appropriate copy without duplicating the `getFullList` block. Default `'refresh'` preserves the existing `@budgets-saved="loadBudgets"` template binding without modification | ✓ Validated v4.2 |
| `isLoading` skeleton state wraps only the headline data fetch in `onMounted`, not supporting data | BUG-02 isolation: the budgets path should not block or delay the expenses list rendering. `isLoading` clears in the expenses `try/finally`; supporting fetches (budgets) run sequentially after, outside the skeleton envelope | ✓ Validated v4.2 |
| PayTime `month` stored as text `"YYYY-MM"`, not a date field | Lets the monthly report filter with plain equality (`month = "2026-07"`) instead of range math. `payment_date` is the separate actual date paid | ✓ Validated PayTime v1.0 |
| Screenshot proofs use a `protected: true` PocketBase file field | Payment proofs shouldn't be fetchable by guessing a URL. Costs a file-token flow (`useFileToken`) since plain `getURL()` 403s on protected fields | ✓ Validated PayTime v1.0 |
| `useFileToken` is a module-level singleton, not per-component | PrimeVue `TabPanel` renders `v-if="lazy ? active : true"`, so **every** panel mounts without `lazy` — two sibling panels each calling `getToken()` auto-cancelled each other. `lazy` was rejected as the fix because it uses `v-if` and would destroy the calculator's unsaved input | ✓ Validated PayTime v1.0 |
| Screenshot URLs skip `?thumb=` for WebP files | PocketBase thumb generation 404s on WebP, and every compressed screenshot is WebP — an unconditional `?thumb=` would break every preview | ✓ Validated PayTime v1.0 |
| Breakpoint utilities go on plain wrapper elements, never on a PrimeVue component | Tailwind v4 emits real `@layer` cascade layers; PrimeVue injects its runtime CSS unlayered, and unlayered beats layered. `sm:hidden` on a `Button` is silently ignored | ✓ Validated PayTime v1.0 |
| Update mappers omit the owner field entirely | PocketBase evaluates the update rule against **stored** values, so a request that also sets the owner passes the rule while reassigning the record. `mapToUpdatePayment` omits it, with a test asserting the omission | ✓ Validated PayTime v1.0 |
| Calendar validation uses a native UTC round-trip, not dayjs strict parse | `dayjs(v, "YYYY-MM-DD", true)` is a **no-op here** — `customParseFormat` is never registered, so it accepts `"2026-02-31"`. The same latent bug remains in the frozen `wallecx/expenseSchema.ts:21` | ✓ Validated PayTime v1.0 |
| Boarders modelled as their own `paytime_boarders` collection, not text names or placeholder `users` rows | Not all boarders have accounts. A roster gives the selector a source and tags a home, and renaming a boarder doesn't rewrite history — where free text would fragment on typos and placeholder auth rows would be loginable | ◻ Chosen v5.0 (unvalidated) |
| Boarder is the canonical payment subject; accounts link *to* a boarder | One ledger and one report path, rather than merging two row shapes or reconciling two collections. Costs a rules rewrite plus a 1-record backfill | ◻ Chosen v5.0 (unvalidated) |

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
| v4.2 Budget Recovery & Hardening | 31–32 | 2026-05-26 | [v4.2-ROADMAP.md](milestones/v4.2-ROADMAP.md) |
| v4.3 Wallecx Mobile Optimization | 33–37 | 2026-06-08 | [v4.3-ROADMAP.md](milestones/v4.3-ROADMAP.md) |
| PayTime v1.0 (Payment Log + Electricity Calculator) | — | 2026-08-04 | none — built outside GSD; `feat/paytime` pushed, unmerged |

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
*Last updated: 2026-08-04 after Phase 38 — Boarder Roster Foundation complete: `paytime_boarders` live in prod with admin-gated writes, full in-app CRUD, a usage-derived tag vocabulary, and both live rule probes recorded. 8/8 UAT, `threats_open: 0`. Two platform constraints surfaced that bind the rest of the milestone (no PocketBase field defaults; unset relations store `''` not `NULL`, forcing a partial unique index). TAG-01's requirement text and the "free-form tag management UI" out-of-scope row were corrected — both assumed a `select` field, which is unbuildable because the Collections API is superuser-only at runtime. Next: Phase 39 Payment Subject Rework, whose relation-traversal rule risk is still unproven on this instance.*
