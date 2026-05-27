# Roadmap: Wallecx (Lexarium milestone)

**Created:** 2026-05-10
**Mode:** YOLO, parallelization on, balanced models

## Milestones

- ✅ **v1.0 MVP** — Phases 0–4 (shipped 2026-05-12) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Vaccine Grouping** — Phases 5–6 (shipped 2026-05-12)
- ✅ **v1.2 Search, Sort & View Toggle** — Phases 7–9 (shipped 2026-05-13)
- ✅ **v2.0 Membership Cards** — Phases 10–13 (shipped 2026-05-14) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v2.1 Mobile PWA** — Phases 14–15 (shipped 2026-05-14)
- ✅ **v2.2 Sort and Search for Membership Cards** — Phase 16 (shipped 2026-05-15) — [archive](milestones/v2.2-ROADMAP.md)
- ✅ **v2.3 UX Polish** — Phases 17–18 (shipped 2026-05-18)
- ✅ **v3.0 Site-Wide Dark Mode** — Phases 19–22 (shipped 2026-05-19) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Daily Expense Tracker** — Phases 23–26 (shipped 2026-05-22) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Gap Resolution & Feature Completeness** — Phases 27–30 (shipped 2026-05-25) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v4.2 Budget Recovery & Hardening** — Phases 31–32 (shipped 2026-05-26) — [archive](milestones/v4.2-ROADMAP.md)
- 🚧 **v4.3 Wallecx Mobile Optimization** — Phases 33–38 (+ 38b conditional) — IN PROGRESS (Phase 33 complete 2026-05-27)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0–4) — SHIPPED 2026-05-12</summary>

- [x] Phase 0: Pre-Wallecx Cleanup (2/2 plans) — completed 2026-05-10
- [x] Phase 1: Backend + Frontend Foundation (3/3 plans) — completed 2026-05-11
- [x] Phase 2: Read Path (4/4 plans) — completed 2026-05-11
- [x] Phase 3: Write Path (4/4 plans) — completed 2026-05-12
- [x] Phase 4: Discovery & Polish (4/4 plans) — completed 2026-05-12

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Vaccine Grouping (Phases 5–6) — SHIPPED 2026-05-12</summary>

- [x] Phase 5: Schema, Types & Form Field (2/2 plans) — completed 2026-05-12
- [x] Phase 6: Grouped Card View & Group Detail Panel (2/2 plans) — completed 2026-05-12

**Milestone goal:** Reorganize the Wallecx view from a flat date-sorted list into vaccine-type group cards so users can instantly find all records for a specific vaccine category.

</details>

<details>
<summary>✅ v1.2 Search, Sort & View Toggle (Phases 7–9) — SHIPPED 2026-05-13</summary>

- [x] Phase 7: Toolbar — Search & Sort (2/2 plans) — completed 2026-05-13
- [x] Phase 8: View Toggle (2/2 plans) — completed 2026-05-13
- [x] Phase 9: Restore Edit & Delete in Grouped View (1/1 plan) — completed 2026-05-13

**Milestone goal:** Add a persistent toolbar above the Wallecx grouped card view so users can filter groups by vaccine name/type, sort them, and switch between grid and list layouts — all via pure client-side computed/ref changes with no new PocketBase queries.

</details>

<details>
<summary>✅ v2.0 Membership Cards (Phases 10–13) — SHIPPED 2026-05-14</summary>

- [x] Phase 10: Tabs Shell — VaccinationsTab Extraction (2/2 plans) — completed 2026-05-13
- [x] Phase 11: Backend + Frontend Foundation (3/3 plans) — completed 2026-05-13
- [x] Phase 12: Read Path — Card Grid, Barcode Display & Detail (4/4 plans) — completed 2026-05-13
- [x] Phase 13: Write Path — ManageMembership CRUD (3/3 plans) — completed 2026-05-14

**Milestone goal:** Add a second Wallecx vault record type — membership/loyalty/insurance/ID cards — with barcode and QR code rendering, a full-screen scan overlay for counter use, a coloured card grid, and full CRUD. Wallecx becomes a tabbed shell switching between Vaccinations and Membership Cards.

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>✅ v2.1 Mobile PWA (Phases 14–15) — SHIPPED 2026-05-14</summary>

- [x] Phase 14: PWA Foundation (4/4 plans) — completed 2026-05-14
- [x] Phase 15: Mobile Layouts (4/4 plans) — completed 2026-05-14

**Milestone goal:** Wallecx is installable as a home-screen app on iOS and Android, loads instantly on repeat visits, and is fully usable on a 375px phone viewport with correct touch targets, safe-area insets, and no horizontal scroll.

</details>

<details>
<summary>✅ v2.2 Sort and Search for Membership Cards (Phase 16) — SHIPPED 2026-05-15</summary>

- [x] Phase 16: Membership Card Toolbar (2/2 plans) — completed 2026-05-15

**Milestone goal:** Add a persistent toolbar to the Membership Cards tab so users can filter cards in real time by name or issuer and reorder the grid by name, issuer, expiry, or recently added — all as pure client-side computed changes with no new PocketBase queries.

Full details: [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md)

</details>

<details>
<summary>✅ v2.3 UX Polish (Phases 17–18) — SHIPPED 2026-05-18</summary>

- [x] Phase 17: Mobile Bottom Sheets & View Toggle (3/3 plans) — completed 2026-05-18
- [x] Phase 18: Dark Mode Fixes (1/1 plan) — completed 2026-05-18

**Milestone goal:** Refine the Wallecx mobile experience and visual quality — bottom sheets replace drawers/dialogs on mobile, dark mode renders correctly across all Wallecx surfaces, and the redundant view toggle is hidden on small screens with list view as the forced default.

</details>

<details>
<summary>✅ v3.0 Site-Wide Dark Mode (Phases 19–22) — SHIPPED 2026-05-19</summary>

- [x] Phase 19: Theme Infrastructure (1/1 plan) — completed 2026-05-18
- [x] Phase 20: Site Shell & Non-App Pages (1/1 plan) — completed 2026-05-18
- [x] Phase 21: Mini-App Dark Mode Sweep (4/4 plans) — completed 2026-05-19
- [x] Phase 22: Wallecx Audit (1/1 plan) — completed 2026-05-19

**Milestone goal:** Every Lexarium surface renders correctly in dark mode, with a manual NavBar toggle and an OS-preference-aware first-visit default.

Full details: [milestones/v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.0 Daily Expense Tracker (Phases 23–26) — SHIPPED 2026-05-22</summary>

- [x] Phase 23: Backend & Type Foundation (1/1 plan) — completed 2026-05-21
- [x] Phase 24: Write Path — Tab Shell + CRUD (2/2 plans) — completed 2026-05-21
- [x] Phase 25: Read Path — List View (2/2 plans) — completed 2026-05-21
- [x] Phase 26: Reporting View (3/3 plans) — completed 2026-05-22

**Milestone goal:** Add a third Wallecx record type — expenses — with daily logging, period-tabbed reporting (month / quarter / year / custom), and per-category breakdown charts. Wallecx expands from static personal records (vaccinations, memberships) into time-series spending data.

Full details: [milestones/v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.1 Gap Resolution & Feature Completeness (Phases 27–30) — SHIPPED 2026-05-25</summary>

- [x] Phase 27: Code Quality & Exports (3/3 plans) — completed 2026-05-22
- [x] Phase 28: Budget Tracking (3/3 plans) — completed 2026-05-25
- [x] Phase 29: Period Comparison (1/1 plan) — completed 2026-05-25
- [x] Phase 30: UAT Sweep (8/8 plans) — completed 2026-05-25

**Milestone goal:** Close v4.0 deferred code-quality items, ship budget tracking + period comparison features, and run a structured UAT sweep over deferred scenarios from phases 10–25 to clear UAT debt before v4.1 ships.

**Sweep result:** Phase 30 walked 82 in-scope scenarios — 80 passed, 1 deferred (PWA standalone install), 0 failed. BR-2 barcode invariant verified twice. Regression floor (49/49 Vitest tests) intact throughout.

Full details: [milestones/v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)

</details>

<details>
<summary>✅ v4.2 Budget Recovery & Hardening (Phases 31–32) — SHIPPED 2026-05-26</summary>

- [x] Phase 31: Re-create wallecx_expense_budgets PocketBase collection (1/1 plan) — completed 2026-05-26 (BUG-01)
- [x] Phase 32: Decouple budgets fetch in ExpensesTab.vue (1/1 plan) — completed 2026-05-26 (BUG-02)

**Milestone goal:** Eliminate the `404 Missing collection context` runtime error on the Expenses → Reports tab by re-creating the `wallecx_expense_budgets` collection in production PocketBase and refactoring `ExpensesTab.vue` so a missing budgets collection no longer fires misleading toast copy or blocks expenses from loading.

Full details: [milestones/v4.2-ROADMAP.md](milestones/v4.2-ROADMAP.md)

</details>

---

## 🚧 Current Milestone: v4.3 Wallecx Mobile Optimization

**Status:** PLANNED 2026-05-26
**Phases:** 33–38 (6 mandatory) + 38b (conditional)
**Granularity:** coarse
**Test viewports:** iOS Safari ~390px, Android Chrome ~360–412px, iPad ~768–820px
**Coverage:** 32/32 functional requirements mapped (PF-06 conditional → 38b); 16 NFR/CON mapped with verification owners

### Overview

Mobile-grade polish layer on the existing Wallecx mini-app. v4.3 is a **presentation-layer milestone, not a refactor.** Every locked architectural invariant from v2.0–v4.2 stays put (BR-2 barcode, registerType prompt, NetworkOnly /api/*, requestKey isolation, card_color no-hash, shell-owns-data, single ConfirmDialog, D-13 paste-back gates). The milestone ships a thin lateral layer of mobile-grade UX on top of all 3 tabs (Vaccinations, Memberships, Expenses List + Reports) and the PWA install + standalone surfaces.

The phase structure follows category-grouped ordering per A-43-9 (one pattern established once and applied across surfaces): foundation composable → layout audit → forms & dialogs → performance → PWA polish → UAT → conditional virtualization. Continues phase numbering from v4.2 Phase 32.

### Phases

- [x] **Phase 33: Mobile Foundation** — `useMobileEnv` composable, App.vue-scope `beforeinstallprompt` capture, Vue/PrimeVue version bumps, visualizer dev wiring (3/3 plans complete 2026-05-27)
- [x] **Phase 34: Layout Audit & Touch Targets** — 44×44 touch-target sweep, safe-area insets, 100dvh migration, sticky TabList/toolbar, viewport-fit lock, bottom-Drawer branches + BR-2 reverify (3/3 plans complete 2026-05-27)
- [ ] **Phase 35: Forms & Dialogs on Small Screens** — BaseMobileDialog rollout (4 dialogs), iOS 16px fix, sticky action bars, dirty-state guard, camera capture, DatePicker touchUI
- [ ] **Phase 36: Mobile Performance** — Visualizer-driven chunk splits, per-tab + per-Manage `defineAsyncComponent`, skeleton states, WebP uploads, preconnect, payload instrumentation
- [ ] **Phase 37: PWA Install + Standalone Polish** — iOS meta tags, splash screens, per-color-scheme theme-color, Android `beforeinstallprompt` UI, SW-update toast safe-area, manifest shortcuts, offline banner
- [ ] **Phase 38: Mobile UAT Sweep + PWA-UAT-01** — Real iOS + real Android + iPad-820 viewport device matrix; closes PWA-UAT-01 deferred from Phase 22 V6
- [ ] **Phase 38b (CONDITIONAL): List Virtualization** — Triggered only if Phase 36 PF-05 instrumentation reveals >16ms scroll jank or >500 rendered rows; likely skipped

### Phase Details

#### Phase 33: Mobile Foundation

**Goal:** A mobile-aware composable (`useMobileEnv`) exposes `isMobile` / `isTablet` / `isStandalone` / `installPromptEvent` / `safeAreaInsets` to the rest of the milestone, and the Android Chrome `beforeinstallprompt` event is captured at App.vue scope (NOT WallecxApp.vue) so first-load capture survives deep-linking into `/projects/wallecx`. Vue patch-bump + PrimeVue 4.5.5 minor-bump land in a branch with a smoke-test gate before merge.

**Depends on:** Nothing (foundation phase)
**Requirements:** FND-01, FND-02, FND-03, FND-04
**Binds NFR/CON:** None directly — this phase delivers the primitives every later phase reads.

**Success Criteria** (what must be observably TRUE):

1. `src/composables/useMobileEnv.ts` ships with `isMobile`, `isTablet`, `isStandalone`, `installPromptEvent`, `safeAreaInsets` — backward-compatible with existing `useIsMobile.ts` callers (no forced migration)
2. Installing the PWA on Android Chrome after deep-linking to `/projects/wallecx` (i.e., landing on Wallecx via in-app navigation, not direct paint) reliably shows the Install affordance — proving the `beforeinstallprompt` listener registered before user navigation
3. `npm run analyze` produces a treemap report at a known artifact path (`ANALYZE=true`-gated, `cross-env`-wrapped for Windows), and the report is reviewed before Phase 36 plan sequencing
4. Vue patch-bump (3.5.18 → 3.5.34) + PrimeVue minor-bump (4.3.7 → 4.5.5) lockstep with `@primevue/auto-import-resolver` + `@primevue/forms` lands on `feat/wallecx` with a documented branch smoke-test confirming Drawer + Dialog + DatePicker (touchUI) + FileUpload (capture) + MultiSelect + ColorPicker direct-v-model survive

**Plans:** 3 plans
- [x] 33-01-PLAN.md — Vue 3.5.34 + PrimeVue 4.5.5 lockstep version bump + smoke-test gate (FND-04) — COMPLETE (smoke-test PASSED; fix-forward D-33-01-A: ManageVaccination DatePicker rebound to direct v-model per PrimeVue Forms #8191)
- [x] 33-02-PLAN.md — useMobileEnv composable + App.vue beforeinstallprompt capture (FND-01, FND-02) — COMPLETE (5-key composable, tri-state tiers, module-singleton install event, @vueuse/core promoted; 49→59 tests; useIsMobile.ts + PwaInstallBanner.vue untouched)
- [x] 33-03-PLAN.md — ANALYZE-gated rollup-plugin-visualizer + analyze script (FND-03) — COMPLETE (visualizer gated on process.env.ANALYZE; `npm run analyze` → dist/stats.html treemap; plain build never attaches it; PWA registerType/scope LOCKED comments byte-intact; type-check 0, test:unit 59/59)
**UI hint:** yes

#### Phase 34: Layout Audit & Touch Targets

**Goal:** Every interactive element across all 3 Wallecx tabs meets the 44×44 iOS touch-target floor, every fixed/overlay surface respects `env(safe-area-inset-*)` insets, every `100vh`/`h-screen` in `src/components/projects/wallecx/` is replaced with `100dvh` (`100svh` fallback), the WallecxApp TabList + each tab's filter/sort toolbar stay pinned to the top on scroll on mobile, and the BR-2 barcode invariant (black-on-white in both themes) is reverified during the CSS sweep.

**Depends on:** Phase 33 (`useMobileEnv` for `safeAreaInsets`, `isMobile`)
**Requirements:** LT-01, LT-02, LT-03, LT-04, LT-05, LT-07, LT-09
**Binds NFR/CON:**
- **CON-VIEWPORT-FIT** — `<meta name="viewport">` in `index.html` retains `viewport-fit=cover` with inline LOCKED comment (LT-09 verification owner; required prerequisite for any non-zero `env(safe-area-inset-*)` value)
- **NFR-DVH-NOT-VH** — Milestone-close grep audit in `src/components/projects/wallecx/` returns 0 `100vh` / `h-screen` matches (LT-04 verification owner)
- **NFR-BR-2-PRESERVED** — CSS sweep does NOT regress BarcodeDisplay.vue black-on-white invariant; visual check in both themes during touch-target sweep; final coverage owned by Phase 38

**Success Criteria** (what must be observably TRUE):

1. On every mobile test viewport (390/360/768), every button, link, icon button, tab trigger, card tile, sort/filter affordance, and drag handle in Wallecx hits a tap target of at least 44×44 px without overlap with neighbors
2. Bottom-sheet Drawer instances (`MembershipDetail`, `VaccinationGroupPanel`, and all 4 Manage dialogs in Drawer mode) render a visible drag handle and respect bottom + side safe-area insets in both orientations and in PWA standalone mode
3. WallecxApp TabList + each tab's toolbar stay pinned at the top of the viewport while a long list scrolls underneath on mobile; tab/toolbar layout does not jitter when iOS URL bar collapses (no `100vh` flicker)
4. Internal scroll inside Manage dialogs and detail views works without double-scroll trap on small viewports — content scrolls, header + (eventual sticky action bar) remain pinned
5. BarcodeDisplay.vue still renders black bars on white background in BOTH light and dark theme on the Memberships tab after the CSS sweep — visual check recorded

**Plans:** 3 plans
- [x] 34-01-PLAN.md — DragHandle component + wallecx-overrides.css rules (44px touch floor, sticky TabList + toolbar, bottom-Drawer safe-area) + wallecx-main-tabs class + viewport-fit LOCKED comment + dvh confirm (LT-01/04/05/09) — COMPLETE (DragHandle.vue 9ee21cb; CSS rules + wallecx-main-tabs 294c3b9; LOCKED viewport meta a16f9fe; dvh 0 matches confirmed; type-check 0, test:unit 59/59)
- [x] 34-02-PLAN.md — Sticky toolbar wrappers in 3 tabs + DragHandle swap in 5 existing pills + scan-overlay safe-area insets (LT-02/03/05/07) — COMPLETE (f6586e3, f29ba7a, 4f177e6)
- [x] 34-03-PLAN.md — Mobile bottom-Drawer branches for ManageMembership + ManageVaccination + BR-2 black-on-white reverify checkpoint (LT-02/07) — COMPLETE (3dc3b73, b119c76; fixes 06a1238, 78b2d45; BR-2 APPROVED 375x667 light+dark)
**UI hint:** yes

#### Phase 35: Forms & Dialogs on Small Screens

**Goal:** All 4 Manage dialogs (`ManageExpense`, `ManageBudget`, `ManageMembership`, `ManageVaccination`) render through a shared `BaseMobileDialog.vue` wrapper with sticky bottom action bars that stay above the virtual keyboard, iOS auto-zoom-on-focus is eliminated via a global ≥16px `.p-inputtext` rule, every input carries appropriate `inputmode` / `autocomplete` / `enterkeyhint`, DatePicker uses `touchUI` on mobile, FileUpload opens the device camera via `capture="environment"` with a gallery-picker fallback, focused inputs auto-scroll into view when the keyboard opens, and Drawer dismissal on a dirty form gates discard via `useConfirm`. Per-dialog migration order: ManageExpense → ManageBudget → ManageMembership → ManageVaccination (ColorPicker direct-v-model invariant preserved; PrimeVue #8135 workaround intact).

**Depends on:** Phase 33 (`useMobileEnv`), Phase 34 (safe-area inset wiring is the substrate for sticky bottom action bars)
**Requirements:** LT-08, FD-01, FD-03, FD-04, FD-05, FD-06, FD-07, FD-09
**Binds NFR/CON:**
- **NFR-IOS-NO-ZOOM** — FD-01 global `@media (max-width: 640px)` rule enforced; grep audit flags `text-xs` / `text-sm` on any input (FD-01 verification owner)
- **NFR-DRAWER-DIRTY-GUARD** — FD-09 `useConfirm` "Discard changes?" gate before backdrop-tap / swipe-down dismissal of a dirty form (FD-09 verification owner)
- **CON-CARD-COLOR-NO-HASH** — `ManageMembership` BaseMobileDialog migration preserves the `card_color` (no `#` prefix on save, prepend on read) invariant; `membershipMapper.spec.ts` re-runs and extends if ColorPicker is swapped for a native picker (verification owner; migrates LAST in this phase per A-43-2 risk-ordering)
- **CON-CONFIRMDIALOG-SINGLETON** — Exactly one `<ConfirmDialog />` at WallecxApp.vue shell level; FD-09 reuses it. Mobile-positioning tweaks via scoped CSS, NOT by mounting a second instance. Grep audit returns 1 line (verification owner)
- **NFR-BR-2-PRESERVED** — Dialog overlay backdrop changes (z-index, scrim color) re-verified against BarcodeDisplay.vue in MembershipDetail bottom-sheet (final coverage owned by Phase 38)

**Success Criteria** (what must be observably TRUE):

1. Opening any of the 4 Manage dialogs on iOS Safari 390px and tapping any input does NOT trigger page-level zoom (proves FD-01 16px rule active); zoom stays at 1.0 after focus
2. Each Manage dialog renders a sticky Save/Cancel action bar that remains visible above the iOS + Android virtual keyboard; backdrop tap on a dirty form triggers a "Discard changes?" `useConfirm`, NOT silent dismissal
3. Tapping the receipt/scan affordance in `ManageExpense` / `ManageMembership` / `ManageVaccination` opens the device camera (`capture="environment"`); a separate gallery-picker fallback is available for iOS standalone reliability
4. DatePicker on every site of use (`ManageExpense` date, `ExpensesToolbar` From/To, `ExpensesReportsView` Custom range, `ManageVaccination` date, `ManageMembership` expiry) renders in full-screen touchUI mode on mobile; native picker behavior remains on desktop
5. After the `ManageMembership` BaseMobileDialog migration, the existing `membershipMapper.spec.ts` 11 tests still pass and `card_color` round-trips through save → re-load without acquiring or losing the `#` prefix
6. Focused input is brought into view (above the keyboard) on both iOS Safari and Android Chrome — no input is obscured by the keyboard during typing

**Plans:** TBD
**UI hint:** yes

#### Phase 36: Mobile Performance

**Goal:** Bundle visualizer report (PF-01) drives concrete chunk-split decisions; `VaccinationsTab`, `MembershipsTab`, `ExpensesTab` plus all 4 Manage dialogs are loaded via `defineAsyncComponent` (initial Wallecx chunk drops at least 50%); blank-spinner load states are replaced with skeletons that match final layout dimensions (CLS ≤ 0.1); a one-time payload-size + duration measurement per `wallecx_*` `getFullList` is recorded under mid-tier mobile cellular conditions; receipt/scan uploads switch to WebP via `browser-image-compression`; PocketBase origin preconnect + dns-prefetch hints land in `index.html`. The measurement is the gating signal for whether Phase 38b conditional virtualization triggers.

**Depends on:** Phase 33 (visualizer wiring, version bumps), Phase 34 (visual layer stable so regressions are easier to detect), Phase 35 (Manage dialogs ready to be wrapped in async loaders)
**Requirements:** PF-01, PF-02, PF-04, PF-05, PF-07, PF-09
**Binds NFR/CON:**
- **NFR-PERF-MEASURE** — PF-05 instrumentation logs payload + duration per `wallecx_*` `getFullList` on mid-tier mobile cellular; results recorded in MILESTONES.md at close; gates Phase 38b (verification owner)
- **NFR-PWA-PRECACHE-FITS** — `npm run build` log scan for "exceeds" / "Skipping precaching" returns 0 matches; chunk-split decisions stay under the 3 MiB Workbox `maximumFileSizeToCacheInBytes` cap (verification owner; locked since v2.1 Plan 14-04)
- **CON-PB-COUNT-BUG** — Any new `getList(` call against `wallecx_*` in async-loader paths passes `{ skipTotal: true }`; code review rejects otherwise. `getFullList()` remains the default per D-31-B (verification owner)
- **NFR-REQUESTKEY-UNIQUE** — Any new mobile fetch path (focus-back refetch, intersection-lazy-load, on-tab-mount refetch) introduced by chunk-splitting registers a NEW distinct `requestKey` and documents it in STATE.md `## Architectural Invariants` at ship time (verification owner)

**Success Criteria** (what must be observably TRUE):

1. Visualizer treemap (committed as a build artifact reference) shows the initial Wallecx route chunk dropped at least 50% from pre-phase baseline; `leaflet`, `quill`, `vue-pdf-embed`, `dompurify` (if found) no longer ship in the Wallecx critical path
2. Each tab and each Manage dialog loads via `defineAsyncComponent`; switching tabs on a cold load shows a skeleton matching final layout dimensions, then content — CLS measurement ≤ 0.1 on mobile test viewport
3. `performance.mark/measure` records a payload size (bytes) + duration (ms) for each of `wallecx_vaccinations`, `wallecx_memberships`, `wallecx_expenses`, `wallecx_expense_categories`, `wallecx_expense_budgets` `getFullList` calls under mid-tier mobile cellular; numbers documented in MILESTONES.md v4.3 close block
4. A new receipt/scan upload produces a file whose mime type confirms `image/webp` (verified via PocketBase admin file inspection or browser network tab); storage size reduction vs prior format recorded
5. `<link rel="preconnect">` + `<link rel="dns-prefetch">` for the PocketBase origin appear in `index.html` head; warm cellular cold-start time-to-first-`getFullList`-byte improves over baseline
6. `npm run build` output contains 0 lines matching "exceeds" or "Skipping precaching"; all chunks fit under 3 MiB precache cap

**Plans:** TBD

#### Phase 37: PWA Install + Standalone Polish

**Goal:** iOS standalone status-bar renders correctly (`apple-mobile-web-app-capable`, `black-translucent` style, `apple-mobile-web-app-title="Wallecx"`); per-color-scheme `<meta name="theme-color">` switches with light/dark mode; per-device-resolution iOS splash screens replace the white-flash on install + launch (390×844, 360×780, 768×1024); the Android `beforeinstallprompt` event captured in Phase 33 surfaces via an Install button in `PwaInstallBanner.vue` (iOS instructional path coexists in same component); SW-update toast respects safe-area-inset on iPhone notch/dynamic island; offline banner backed by `useOnline` shows on disconnect with retry affordance; manifest `shortcuts` array enables long-press Quick Actions (Add Expense / Add Vaccination / Add Membership / Open Reports); `registerType: 'prompt'` and `scope: '/'` remain LOCKED.

**Depends on:** Phase 33 (`installPromptEvent` captured at App.vue scope), Phase 34 (safe-area wiring is substrate for status-bar black-translucent and SW-toast inset), Phase 36 (reduced bundle so PWA precache fits under 3 MiB)
**Requirements:** PWA-01, PWA-02, PWA-04, PWA-06, PWA-07, PWA-09
**Binds NFR/CON:**
- **NFR-PWA-AUTOUPDATE** — `vite.config.ts` `registerType: 'prompt'` LOCKED comment preserved; any diff that flips to `'autoUpdate'` blocked. Reason: CRUD forms have unsaved state (verification owner; locked since v2.1)
- **CON-PWA-SCOPE** — Manifest `scope: '/'` retained; not narrowed to `/projects/wallecx` (verification owner)
- **NFR-PWA-BANNER-FREQUENCY** — Install banner does NOT show in standalone mode (`display-mode: standalone` OR `navigator.standalone === true`) and respects localStorage dismissal record (re-show only after ≥30 days) (verification owner)
- **NFR-IOS-EVICTION-UX** — Auth-expired redirect copy explains iOS 7-day localStorage eviction (not generic "Session expired"); install banner copy mentions home-screen pinning as mitigation (verification owner)
- **NFR-IOS-SPLASH** — `apple-touch-startup-image` defined for all 3 v4.3 test viewports (390×844, 360×780, 768×1024) via `@vite-pwa/assets-generator`; PWA-02 verification owner
- **NFR-BR-2-PRESERVED** — Theme-color and standalone CSS tweaks do NOT regress BarcodeDisplay.vue black-on-white invariant in standalone mode (final coverage owned by Phase 38)

**Success Criteria** (what must be observably TRUE):

1. Installing the PWA on iOS 390×844 device produces a launcher icon that, when tapped, shows a branded splash (NOT a white flash) and opens to a status bar styled `black-translucent` with the title "Wallecx"
2. Toggling site dark mode in the installed PWA causes the iOS status-bar background color to switch (proves per-color-scheme `theme-color` meta is honored)
3. Long-pressing the installed app icon on Android shows 4 Quick Action shortcuts (Add Expense / Add Vaccination / Add Membership / Open Reports) that deep-link into the correct route
4. Going offline (airplane mode) inside the installed PWA shows a clear offline banner with a retry affordance; reconnecting clears the banner; existing NetworkOnly `/api/*` toast behavior remains intact
5. The SW-update toast ("Refresh / Later") is fully visible above the iPhone home indicator + dynamic island in standalone mode (does NOT clip under safe-area)
6. After dismissing the install banner once, re-launching the app does not re-show the banner for at least 30 days; in standalone mode the banner never shows regardless of dismissal record
7. `registerType: 'prompt'` and `scope: '/'` are confirmed unchanged in `vite.config.ts` (LOCKED comments intact)

**Plans:** TBD
**UI hint:** yes

#### Phase 38: Mobile UAT Sweep + PWA-UAT-01

**Goal:** Real-device validation that v4.3 (Phases 33–37) delivered native-grade mobile UX without regressing any locked invariant. PWA-UAT-01 (deferred from Phase 22 V6 since v3.0) closes here. Device matrix: real iOS device (Safari + standalone installed), real Android device (Chrome + standalone installed), iPad-820 viewport (browser or real device). Mirrors v4.1 Phase 30 sweep structure (per-scenario `38-HUMAN-UAT.md` with structured pass/fail recording).

**Depends on:** Phases 33–37 all shipped (this is the milestone-close UAT)
**Requirements:** PWA-05
**Binds NFR/CON:**
- **NFR-BR-2-PRESERVED** — Final verification owner for the milestone: BarcodeDisplay.vue renders black-on-white in light, dark, and PWA standalone modes at all 3 test viewports (390/360/768); regression caught here would block ship
- **NFR-IOS-EVICTION-UX** — Real-device 7-day eviction or simulated forced eviction surfaces the eviction-specific copy (not generic "Session expired"); verified during PWA-UAT-01 walkthrough
- All Phase 33–37 NFR/CON gates re-affirmed in installed standalone mode (autoupdate-locked, banner-frequency, viewport-fit, dvh-not-vh, ios-no-zoom, confirmdialog-singleton, drawer-dirty-guard, requestkey-unique, pb-count-bug, pwa-scope, pwa-precache-fits, perf-measure, ios-splash, card-color-no-hash)

**Success Criteria** (what must be observably TRUE):

1. PWA-UAT-01 closed: viewport-tagged install + force-quit + relaunch + dark-mode toggle + auth survival scenarios pass on real iOS device, real Android device, and iPad-820 viewport; results recorded in `38-HUMAN-UAT.md`
2. BarcodeDisplay.vue visual check in PWA standalone mode in BOTH themes on a Memberships card with the full-screen scan overlay open — black bars on white background confirmed at counter-readable scale (BR-2 invariant preserved final-check)
3. All 4 Manage dialogs verified end-to-end in installed standalone mode on real iOS + Android: open dialog, type into input (no zoom), tap Save with valid + invalid input, tap Cancel on dirty form (Discard guard fires), upload receipt via camera
4. Install banner frequency rule verified on real device: install → dismiss → confirm banner does NOT re-show within 30 days; standalone mode confirmed silent
5. Vitest regression floor (49/49 unit tests) intact at milestone-close; `npm run type-check` clean; `npm run lint` clean except pre-existing grandfathered `VaccinationDetail.vue:5` (consistent with v4.2 close)

**Plans:** TBD
**UI hint:** yes

#### Phase 38b (CONDITIONAL): List Virtualization in ExpensesListView

**Goal:** If — and only if — Phase 36 PF-05 instrumentation reveals >16ms scroll jank on long expense logs OR any `wallecx_*` collection exceeds ~500 rendered rows on test devices, integrate a virtual scroller (likely `@tanstack/vue-virtual`) in `ExpensesListView.vue` consuming the already-sorted `filteredSortedExpenses` array. The virtual scroller must preserve sessionStorage sort-mode restoration and not regress receipt-preview-on-paperclip-tap. If instrumentation does NOT reveal jank/scale issues, this phase is explicitly closed as "not triggered" in the milestone close block (PF-06 documented as `Conditional / Not Triggered` in REQUIREMENTS.md traceability).

**Depends on:** Phase 36 (PF-05 instrumentation is the gating signal)
**Requirements:** PF-06 *(conditional — triggered by PF-05 instrumentation)*
**Binds NFR/CON:**
- **CON-PB-COUNT-BUG** — Phase 38b prefers client-side virtualization over `getList()` pagination to avoid D-31-B; if pagination is ever needed, `{ skipTotal: true }` mandatory (verification owner if triggered)
- **NFR-REQUESTKEY-UNIQUE** — Any windowed refetch must register a NEW distinct `requestKey` (verification owner if triggered)

**Success Criteria** (only evaluated if triggered):

1. Trigger condition documented: PF-05 instrumentation result showing >16ms scroll jank OR >500 rendered rows pasted into `38b-CONTEXT.md`
2. Scroll jank measurement on test devices drops below 16ms threshold after virtualization integration
3. sessionStorage sort-mode restoration still applies on tab entry (no regression of v4.0 Plan 25-02 pattern)
4. Receipt-preview-on-paperclip-click still works for any row in the virtualized list

**Plans:** TBD (deferred until trigger)

### Phase Ordering Rationale

- **Foundation before audit (33 → 34):** `useMobileEnv` must land first so Phase 34/35/37 can consume `safeAreaInsets`, `isStandalone`, `installPromptEvent`. App.vue listener registration ordering matters for first-page-load capture (A-43-4 — losing the event by registering late at WallecxApp.vue scope would silently drop Android install affordance).
- **Shell before dialogs (34 → 35):** Layout audit fixes the frame; forms phase fixes the content. Sticky bottom action bars depend on the safe-area substrate from Phase 34. LT-08 (sticky action bars in 4 dialogs) is grouped with Phase 35 forms work — the dialogs are where the sticky bars live — not with Phase 34 layout audit, to keep the Manage dialog migration coherent.
- **Performance after visual (35 → 36):** Bundle splits and async components are easier to verify (and easier to detect regressions in) once the visual surface is stable. Skeleton states (PF-04) are sized against the final layout from Phase 34/35.
- **PWA polish last before UAT (36 → 37 → 38):** Status-bar + splash + install affordance need the safe-area wiring (34), the sticky bars (35), and the reduced bundle (36) all in place to feel native-grade.
- **Category grouping (A-43-9):** Each phase establishes ONE pattern across all 3 tabs; tab-by-tab ordering would rediscover the same patterns 3× and produce less reviewable diffs.
- **38b conditional:** Production record counts unknown (personal vault scope). Phase 36 PF-05 instrumentation closes that knowledge gap; only then do we know whether virtualization is needed. Premature virtualization risks M-16 sessionStorage sort-restore regression.

### Requirement Coverage (v4.3)

**Functional requirements:** 32 total — 100% mapped (PF-06 conditional → 38b)

| Phase | Functional Requirements | Count |
|-------|------------------------|-------|
| 33 | FND-01, FND-02, FND-03, FND-04 | 4 |
| 34 | LT-01, LT-02, LT-03, LT-04, LT-05, LT-07, LT-09 | 7 |
| 35 | LT-08, FD-01, FD-03, FD-04, FD-05, FD-06, FD-07, FD-09 | 8 |
| 36 | PF-01, PF-02, PF-04, PF-05, PF-07, PF-09 | 6 |
| 37 | PWA-01, PWA-02, PWA-04, PWA-06, PWA-07, PWA-09 | 6 |
| 38 | PWA-05 | 1 |
| 38b | PF-06 (conditional) | 1 |

**Non-functional / constraint requirements:** 16 total — all mapped to verification-owner phase (binds documented in each phase's "Binds NFR/CON" section).

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Pre-Wallecx Cleanup | v1.0 | 2/2 | Complete | 2026-05-10 |
| 1. Backend + Frontend Foundation | v1.0 | 3/3 | Complete | 2026-05-11 |
| 2. Read Path | v1.0 | 4/4 | Complete | 2026-05-11 |
| 3. Write Path | v1.0 | 4/4 | Complete | 2026-05-12 |
| 4. Discovery & Polish | v1.0 | 4/4 | Complete | 2026-05-12 |
| 5. Schema, Types & Form Field | v1.1 | 2/2 | Complete | 2026-05-12 |
| 6. Grouped Card View & Group Detail Panel | v1.1 | 2/2 | Complete | 2026-05-12 |
| 7. Toolbar — Search & Sort | v1.2 | 2/2 | Complete | 2026-05-13 |
| 8. View Toggle | v1.2 | 2/2 | Complete | 2026-05-13 |
| 9. Restore Edit & Delete in Grouped View | v1.2 | 1/1 | Complete | 2026-05-13 |
| 10. Tabs Shell — VaccinationsTab Extraction | v2.0 | 2/2 | Complete | 2026-05-13 |
| 11. Backend + Frontend Foundation | v2.0 | 3/3 | Complete | 2026-05-13 |
| 12. Read Path — Card Grid, Barcode Display & Detail | v2.0 | 4/4 | Complete | 2026-05-13 |
| 13. Write Path — ManageMembership CRUD | v2.0 | 3/3 | Complete | 2026-05-14 |
| 14. PWA Foundation | v2.1 | 4/4 | Complete | 2026-05-14 |
| 15. Mobile Layouts | v2.1 | 4/4 | Complete | 2026-05-14 |
| 16. Membership Card Toolbar | v2.2 | 2/2 | Complete | 2026-05-15 |
| 17. Mobile Bottom Sheets & View Toggle | v2.3 | 3/3 | Complete (UAT approved) | 2026-05-18 |
| 18. Dark Mode Fixes | v2.3 | 1/1 | Complete (UAT approved) | 2026-05-18 |
| 19. Theme Infrastructure | v3.0 | 1/1 | Complete (UAT approved) | 2026-05-18 |
| 20. Site Shell & Non-App Pages | v3.0 | 1/1 | Complete (UAT approved) | 2026-05-18 |
| 21. Mini-App Dark Mode Sweep | v3.0 | 4/4 | Complete (UAT approved) | 2026-05-19 |
| 22. Wallecx Audit | v3.0 | 1/1 | Complete (UAT approved) | 2026-05-19 |
| 23. Backend & Type Foundation | v4.0 | 1/1 | Complete (UAT approved) | 2026-05-21 |
| 24. Write Path — Tab Shell + CRUD | v4.0 | 2/2 | Complete (UAT approved) | 2026-05-21 |
| 25. Read Path — List View | v4.0 | 2/2 | Complete (UAT approved) | 2026-05-21 |
| 26. Reporting View | v4.0 | 3/3 | Complete (UAT approved) | 2026-05-22 |
| 27. Code Quality & Exports | v4.1 | 3/3 | Complete (UAT approved) | 2026-05-22 |
| 28. Budget Tracking | v4.1 | 3/3 | Complete (UAT deferred) | 2026-05-25 |
| 29. Period Comparison | v4.1 | 1/1 | Complete (UAT deferred) | 2026-05-25 |
| 30. UAT Sweep | v4.1 | 8/8 | Complete (80/82 passed, 1 deferred) | 2026-05-25 |
| 31. Re-create wallecx_expense_budgets collection | v4.2 | 1/1 | Complete | 2026-05-26 |
| 32. Decouple budgets fetch in ExpensesTab.vue | v4.2 | 1/1 | Complete | 2026-05-26 |
| 33. Mobile Foundation | v4.3 | 3/3 | Complete | 2026-05-27 |
| 34. Layout Audit & Touch Targets | v4.3 | 3/3 | Complete | 2026-05-27 |
| 35. Forms & Dialogs on Small Screens | v4.3 | 0/? | Not started | — |
| 36. Mobile Performance | v4.3 | 0/? | Not started | — |
| 37. PWA Install + Standalone Polish | v4.3 | 0/? | Not started | — |
| 38. Mobile UAT Sweep + PWA-UAT-01 | v4.3 | 0/? | Not started | — |
| 38b. List Virtualization (CONDITIONAL) | v4.3 | 0/? | Not triggered (pending PF-05) | — |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-27 — Phase 34 Layout Audit & Touch Targets complete (3/3 plans, LT-01..05/07/09 shipped). DragHandle.vue + wallecx-overrides.css touch-target rules; sticky TabList + toolbar; scan-overlay safe-area; ManageMembership + ManageVaccination bottom-Drawer branches; BR-2 PASSED. All 7 bottom-sheet drag-handle sites done. Next: `/gsd-plan-phase 35` (Forms & Dialogs on Small Screens).*
