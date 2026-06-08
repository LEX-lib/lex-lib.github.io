# Milestones

## v4.3 Wallecx Mobile Optimization (Shipped: 2026-06-08)

**Phases completed:** 6 phases, 25 plans, 30 tasks

**Key accomplishments:**

- Bumped Vue 3.5.18→3.5.34 (patch) and PrimeVue 4.3.7→4.5.5 (minor) lockstep with @primevue/auto-import-resolver + @primevue/forms, establishing one clean v4.3 baseline; the 4.5 smoke-test surfaced a PrimeVue Forms DatePicker regression (#8191/#7806) that was fixed-forward by rebinding ManageVaccination's date field to a direct v-model ref.
- `useMobileEnv` composable exposing tri-state mobile/tablet/standalone tiers, a module-singleton captured install-prompt event, and safe-area env() strings — with the Android `beforeinstallprompt` event captured at App.vue scope and `@vueuse/core` promoted to a direct dependency.
- CSS spine for the Phase 34 mobile audit — DragHandle pill component, four wallecx-overrides.css rule blocks (44px icon-button floor, sticky TabList, sticky-toolbar class, bottom-Drawer safe-area), wallecx-main-tabs class on WallecxApp Tabs, and LOCKED viewport meta comment.
- Wired the Plan-01 CSS spine into the three tab shells (sticky toolbar wrappers via `.wallecx-tab-toolbar`), swapped all 5 existing inline drag-handle pills for the shared `<DragHandle>` component, and added `env(safe-area-inset-*)` padding to the fullscreen barcode scan overlay in MembershipDetail.vue.
- Bottom-Drawer branches with DragHandle added to ManageMembership.vue and ManageVaccination.vue, closing the last LT-02 gap; BR-2 barcode black-on-white reverified in both themes after full Phase 34 CSS sweep
- BaseMobileDialog.vue Dialog/Drawer wrapper with dirty-guard via Drawer before-hide + useConfirm singleton, DragHandle header, focusin scrollIntoView auto-scroll, and FD-01 16px iOS no-zoom + LT-08 sticky action bar CSS appended to wallecx-overrides.css.
- ManageExpense collapsed from dual Dialog/Drawer branches to single BaseMobileDialog with FD-03/04/05/09 treatment; 4 standalone expense DatePicker sites switched to :inline=isMobile.
- ManageBudget collapsed from dual Dialog/Drawer branches to single BaseMobileDialog with JSON.stringify array dirty detection (FD-09) and FD-03 per-row input attributes; no upload added (D-35-11).
- ManageMembership collapsed from dual Dialog/Drawer branches to single BaseMobileDialog — ColorPicker direct v-model (#8135), card_color no-hash (CON-CARD-COLOR-NO-HASH), and {immediate:true} record watcher all preserved; FD-03/04/05/09 applied; 59/59 tests pass.
- ManageVaccination collapsed from dual Dialog/Drawer Form branches to single BaseMobileDialog — administeredDate direct v-model (#8191 / D-33-01-A) and [visible,record] tuple watch {immediate:true} preserved verbatim; two-Form collapse confirmed safe; FD-03/04/05/09 applied; 59/59 tests pass.
- 16/16 automated gates and grep audits PASS; FD-04 popup revert committed after UAT; Phase 35 fully closed with human APPROVED on all 6 device behaviors at 390px emulation
- Pre-phase baseline (64 KB gzip), WallecxSkeleton 5-variant component, perfInstrument getFullList wrapper, compressToWebP helper, and 3 rolldown vendor chunk groups (chart-js/jsbarcode/image-compression) reducing WallecxApp to 32.81 KB gzip
- defineAsyncComponent + Suspense inside each TabPanel with WallecxSkeleton fallbacks; WallecxApp chunk drops from 32.81 KB → 2.45 KB gzip
- VaccinationsTab ManageVaccination async-split via defineAsyncComponent + Suspense, mount-path getFullList instrumented with vaccinations-getFullList requestKey (NFR-REQUESTKEY-UNIQUE closed), inline skeleton consolidated into WallecxSkeleton
- MembershipsTab async ManageMembership via defineAsyncComponent + Suspense + WallecxSkeleton membership-card fallback; mount-path getFullList instrumented with requestKey 'memberships-getFullList' preserved verbatim; inline Card+Skeleton grid consolidated into WallecxSkeleton
- Migrated 3 inline `imageCompression({maxSizeMB:1.5, maxWidthOrHeight:2048, useWebWorker:true})` blocks to the shared `compressToWebP(strippedFile)` helper; fixed Pitfall 4 MIME mismatch in ManageExpense's `new File` wrapper.
- Phase 36 closed with PocketBase-origin preconnect/dns-prefetch hints, a 20/20 grep+gate audit confirming all NFR/CON invariants, the explicit 5-key requestKey invariant in STATE.md, and human-verify approval at 390×844 emulation across all 3 tabs (CLS ≤ 0.1, PF-05 instrumentation present, WebP MIME confirmed, Suspense fallback first-switch-only).
- iOS splash PNGs (3 viewports) and Android shortcut icons (4x96x96) generated from branding_logo.svg via @vite-pwa/assets-generator@1.0.2 with navy #002244 background.
- Site-wide offline banner using `useOnline` from `@vueuse/core`, Teleport to body, fixed amber top, no retry button; mounted in App.vue; ROADMAP and REQUIREMENTS reworded to align with useOnline-reactive design (D-37-12).
- `src/components/projects/wallecx/PwaInstallBanner.vue` (76 lines → 221 lines)
- iOS standalone meta tags (apple-mobile-web-app-capable / status-bar-style black-translucent / title Wallecx), per-color-scheme theme-color (#002244 light / #0d1117 dark), and 3 apple-touch-startup-image splash links inserted into index.html with all LOCKED elements byte-intact.
- Android Quick Actions wired end-to-end via manifest.shortcuts array, WallecxApp pendingAction dispatch, and immediate-watcher tab consumers, plus SW toast safe-area and iOS eviction-aware auth-expired copy.
- Reactive `watch(standaloneMatch)` replaces one-shot if-block in useMobileEnv.ts (CR-01); `pendingAction.value = null` reset prevents deep-link replay on Suspense remount (CR-02).

---

## v4.2 — Budget Recovery & Hardening

**Shipped:** 2026-05-26
**Phases:** 31–32 (2 phases, 2 plans)
**Timeline:** 2026-05-25 → 2026-05-26 (build day 2026-05-26; ~8 hours)
**Requirements:** 2/2 shipped (BUG-01, BUG-02)
**Git range:** `04b9cfb` → `58c3e4b` (8 commits on `feat/wallecx`)
**Source LOC change:** 1 file modified (`ExpensesTab.vue`): +6 / −8 lines

### Delivered

1. **BUG-01 closed** — `wallecx_expense_budgets` PocketBase collection re-created in production with the locked Phase 28-01 schema (4 fields + 5 v0.29.3 rules) via a paste-back gated Admin UI flow that replaced Phase 28-01's trust-based "approved" signal. Pre-flight 404 probe + Task 2 paste-back literal-string compare against locked spec + Task 3 dual-pass smoke verify (`getFullList` 200 + empty array; app-flow no on-mount toast).
2. **BUG-02 closed** — `ExpensesTab.vue` `onMounted` refactored to independent try/catches. `loadBudgets()` gained `opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }` parameter with ternary toast copy; `isLoading` now wraps only the expenses fetch and clears in `finally` before the sequential `await loadBudgets({ context: 'mount' })`. Budgets-only failure no longer fires the misleading `'Failed to load expenses…'` toast and no longer blocks the expenses list from rendering.
3. **D-13 architectural invariant locked** project-wide — "Admin-UI checkpoints require text paste-back + downstream smoke verify." Recorded in STATE.md `## Architectural Invariants` during Phase 31 Task 3 Part C. Now binds all future GSD admin-UI tasks in this project; acknowledgment-only signals are explicitly insufficient.
4. **PocketBase v0.29.x count-path bug discovered + documented** — `getList()` returns 400 against collections with non-trivial listRule expressions (the totalItems count path trips on the `&&` evaluation). Workaround via `getFullList()` (uses skipTotal internally) or `getList(p, pp, { skipTotal: true })`. Documented in `31-01-SUMMARY.md` deviation D-31-B for future reference; not a Phase 31 schema/rule defect.
5. **UAT discipline upheld per D-13** — Both BUG fixes verified with text paste-back gates AND code-side console smoke probes. BUG-01: Task 1 pre-flight 404 paste-back, Task 2 schema/rules literal-string compare, Task 3 dual-signal smoke verify. BUG-02: UAT 1 paste-back (toast verbatim `'Failed to load budgets.'`, expenses list rendered, Reports opened, Budget vs Actual absent) + console smoke probe returning 404 to corroborate the test was actually exercised.

### Accepted deviations (recorded with rationale)

- **D-31-A** — List/View/Update/Delete rules use the stricter `@request.auth.id != "" && user = @request.auth.id` form (project-wide consistency with other `wallecx_*` collections; strict enhancement, no security regression). Create rule matches spec verbatim.
- **D-31-B** — Plan-spec literal `getList({ page: 1, perPage: 1 })` returns 400 due to PocketBase v0.29.x count-path bug; functional equivalence proven via `getFullList()` 200 + empty array and `getList(p, pp, { skipTotal: true })` 200 + `items:[]` (three independent confirmations of the underlying semantic).

### Known deferred items at close: 0 NEW

Pre-existing items from prior milestones remain in STATE.md `## Deferred Items` (00-HUMAN-UAT.md, 08-HUMAN-UAT.md from v1.0, etc.) — none of these are v4.2-introduced. v4.2 explicitly deferred to v4.3+ per REQUIREMENTS.md Future Requirements section: HEALTH-01 (code-level collection health check on boot), UAT-28-CLOSE (Phase 28 deferred UAT — 9 scenarios), UAT-29-CLOSE (Phase 29 deferred UAT — 7 scenarios), and the newly-captured PB-REALTIME idea (subscribe across all wallecx_* collections, uniform-application future phase).

**Archive:** [milestones/v4.2-ROADMAP.md](milestones/v4.2-ROADMAP.md)
**Requirements:** [milestones/v4.2-REQUIREMENTS.md](milestones/v4.2-REQUIREMENTS.md)

---

## v4.1 — Gap Resolution & Feature Completeness

**Shipped:** 2026-05-25
**Phases:** 27–30 (4 phases, 15 plans)
**Timeline:** 2026-05-22 → 2026-05-25 (4 days)
**Requirements:** 7/7 shipped (CQ-01, CQ-02, EXPORT-01, EXPORT-02, RPT-01, RPT-02, RPT-03, QA-01)

### Delivered

1. Fixed two deferred Phase 23 code-quality items: `expense_date` Zod refinement now blocks invalid calendar dates (Feb 31, Apr 31) via `dayjs(val, 'YYYY-MM-DD', true).isValid()`; `mapToUpdateExpense` notes field now uses conditional spread so missing notes produce no `notes` key on PATCH (verified via `not.toHaveProperty`) — CQ-01, CQ-02
2. One-click JSON download buttons on Memberships and Expenses tabs — fetch all user records, `JSON.stringify(records, null, 2)`, blob download. Mirrors the v1.0 vaccination export pattern — EXPORT-01, EXPORT-02
3. `wallecx_expense_budgets` PocketBase collection (per-user isolation, monthly/yearly enum) + ExpenseBudget TypeScript types + expenseBudgetMapper documenting the locked `expense-budgets-getFullList` requestKey — RPT-01 data foundation
4. `ManageBudget.vue` bulk-upsert modal (Dialog desktop / Drawer mobile) with per-category amount + Monthly/Yearly toggle, Promise.all create/update/delete-on-zero loop, watch(visible) pre-population, auth-null guard — RPT-01 UI half
5. ExpensesTab shell wires budgets fetch through to ExpensesReportsView; Reports view renders period-gated Budget vs Actual section (this-month: monthly budgets; this-year: yearly; hidden for quarter/custom per D-09) with progress bars + Under/Over/On budget badges — RPT-01 + RPT-02 end-to-end
6. Inline period-over-period comparison line in `ExpensesReportsView.vue` STATE 4 (between Grand Total hero and Manage Budgets button): `↑ $230 (+23%) vs last month` — Month + Quarter coverage; color-coded direction (error red = overspending, success green = underspending); honest zero-prior handling (omit percentage, append "no prior spend"); U+2212 minus character — RPT-03
7. Structured UAT sweep across 8 ROADMAP-named phases (10, 11, 12, 18, 20, 21, 22, 25) — 80/82 in-scope scenarios passed, 1 deferred (PWA standalone install needs install flow), 0 regressions. BR-2 barcode-black-on-white invariant verified twice (Phase 18 §6 + Phase 22 V5). Regression floor (49/49 Vitest tests) intact throughout — QA-01

### Known deferred items at close: 6 (3 new UAT — Phase 28/29 just-shipped scenarios + Phase 22 V6 PWA; 3 verification gaps for Phase 27/28/29 — see STATE.md Deferred Items)

**Archive:** [milestones/v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)
**Requirements:** [milestones/v4.1-REQUIREMENTS.md](milestones/v4.1-REQUIREMENTS.md)

---

## v4.0 — Daily Expense Tracker

**Shipped:** 2026-05-22
**Phases:** 23–26 (4 phases, 9 plans)
**Timeline:** 2026-05-20 → 2026-05-22 (2 days)
**Requirements:** 13/13 shipped

### Delivered

1. `wallecx_expenses` + `wallecx_expense_categories` PocketBase collections with per-user rules, Zod schema, expenseMapper, and 9 Vitest tests — EXP-01/02/03 foundation complete
2. Third "Expenses" tab in WallecxApp.vue; `ManageExpense.vue` CRUD dialog with Zod, isSaving guard, EXIF-stripped receipt upload, custom category seeding, and Dialog/Drawer mobile split — EXP-04/05/06
3. Sortable/filterable/searchable expense list (5 sort modes, category multi-select, date-range picker, instant description search) with receipt preview via AttachmentPreview — EXP-07/08/09/10
4. `ExpensesListView.vue` extracted as a sibling view; `ExpensesTab.vue` refactored to thin data-owning shell — establishes parent-shell + child-view SFC split pattern for future Wallecx tabs
5. `period.ts` dayjs helper + `useChartTheme` dark-mode composable (MutationObserver on html element) + 8 CSS chart palette tokens — chart infrastructure reusable across future visualizations
6. `ExpensesReportsView.vue` — period selector (Month/Quarter/Year/Custom), Grand Total hero, horizontal bar chart with dark-mode reactivity, prefers-reduced-motion gate, sessionStorage period persistence — EXP-11/12/13

### Known deferred items at close: 39 (8 carried from prior closes + 31 at v4.0 — see STATE.md Deferred Items)

**Archive:** [milestones/v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)
**Requirements:** [milestones/v4.0-REQUIREMENTS.md](milestones/v4.0-REQUIREMENTS.md)

---

## v3.0 — Site-Wide Dark Mode

**Shipped:** 2026-05-19
**Phases:** 19–22 (4 phases, 7 plans)
**Timeline:** 2026-05-18 → 2026-05-19 (3 days incl. UAT)
**Requirements:** 13/13 shipped

### Delivered

1. `useTheme` composable + NavBar sun/moon toggle + inline FOUC script in `index.html` — Lexarium has a fully working theme toggle with OS-preference detection and localStorage persistence (no flash on hard reload)
2. Tailwind v4 `@custom-variant dark` alignment + per-component `.my-app-dark` overrides + `--color-mix-target` CSS variable — every site-shell surface (Home/Hero/About/Projects/Blog/Login/NavBar) renders correctly in dark mode
3. Mini-app sweep: LexTrack semantic-token refactor (file was dark-only-hardcoded — now genuinely theme-aware in both themes; also fixes a never-working light mode), Larga Leaflet geocoder override, MonitoX ~123 utility pairings + bg-black button inversion, API Playground 13 chrome legibility tweaks
4. Wallecx audit confirmed zero regressions in PWA standalone mode after site-wide toggle wire-up; BarcodeDisplay BR-2 invariant preserved (barcode stays black-on-white in both themes)
5. Verification methodology established: per-phase `HUMAN-UAT.md` docs with structured failure-mode catalogs; pattern carries forward to future milestones

### Known deferred items at close: 2 (LexTrack DatePicker/TabView visual spot-check; API Playground sign-off) plus carried-forward CONV-01, CONV-03, SCAN-ADV-01, PWA-ADV-01..03, THEME-ADV-01..04

**Archive:** [milestones/v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)
**Requirements:** [milestones/v3.0-REQUIREMENTS.md](milestones/v3.0-REQUIREMENTS.md)

---

## v2.0 — Membership Cards

**Shipped:** 2026-05-14
**Phases:** 10–13 (4 phases, 12 plans)
**Timeline:** 2026-05-13 → 2026-05-14 (2 days)
**Requirements:** 22/22 shipped

### Delivered

1. WallecxApp.vue refactored from a 452-line vaccination monolith into a 35-line PrimeVue Tabs shell; VaccinationsTab.vue verbatim-extracts all vaccination state with zero regression
2. `wallecx_memberships` PocketBase collection with 10 fields and 5 per-user access rules; two-user smoke test confirmed cross-user isolation across all access types
3. BarcodeDisplay.vue four-branch renderer (QR/linear/number-fallback/empty) with JsBarcode try/catch guard and qrcode.vue SVG; full-screen scan overlay via Teleport + viewport overlay (iOS-safe) + wake lock
4. MembershipCard.vue coloured tile grid with expiry warnings; MembershipDetail.vue read-only field grid with embedded barcode and card photo preview via refactored AttachmentPreview.vue
5. ManageMembership.vue create/edit dialog with direct v-model refs (ColorPicker issue #8135 workaround), Zod safeParse, conditional barcode_value field, EXIF-stripped FileUpload, isSaving guard, server-first delete
6. membershipMapper.spec.ts Vitest spec (11 tests) locking 5-field strip and id-refresh contract; 24 tests total passing

### Known deferred items at close: 0 (prior deferred items from v1.0 close, already in STATE.md)

**Archive:** `.planning/milestones/v2.0-ROADMAP.md`
**Requirements:** `.planning/milestones/v2.0-REQUIREMENTS.md`

---

## v1.0 — Wallecx MVP

**Shipped:** 2026-05-12
**Phases:** 0–4 (5 phases, 17 plans)
**Timeline:** 2026-05-10 → 2026-05-12 (3 days)
**Requirements:** 33/34 shipped (READ-06 dropped)

### Delivered

1. Stripped dev credentials (VITE_LOGIN_*) from codebase; added `lint:secrets` regression guard — production bundle no longer carries shipped credentials
2. `wallecx_vaccinations` PocketBase collection with server-side per-user isolation — two-user smoke test confirmed cross-user isolation across all access types
3. MIME-branched attachment preview (image/PDF/download) with short-lived view-time tokens and zero `v-html`
4. Full CRUD write path: Zod-validated dialog, EXIF-stripping image pipeline, `isSaving` guard preventing double-submits
5. Projects directory tile, design token audit, JSON export — Wallecx discoverable and design-consistent
6. First repo tests: `vaccinationMapper.spec.ts` (mapper contract) and `guard.spec.ts` (auth redirect)

### Known deferred items at close: 11 (see STATE.md Deferred Items)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`
**Requirements:** `.planning/milestones/v1.0-REQUIREMENTS.md`
