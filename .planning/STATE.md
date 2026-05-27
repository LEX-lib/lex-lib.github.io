---
gsd_state_version: 1.0
milestone: v4.3
milestone_name: Wallecx Mobile Optimization
status: executing
stopped_at: Phase 33 executing — Plan 33-01 Task 1 done (version bump committed 931aef0, automated gate green); PAUSED at Task 2 checkpoint:human-verify (6-surface PrimeVue smoke-test + #7465 dark-mode flash)
last_updated: "2026-05-27T07:40:00.000Z"
last_activity: 2026-05-27
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# Project State

**Last updated:** 2026-05-26 — v4.3 Wallecx Mobile Optimization planned. ROADMAP.md created with 6 mandatory phases (33–38) + 1 conditional (38b). 32/32 functional requirements mapped; 16 NFR/CON bound to verification-owner phases. Next: `/gsd-plan-phase 33` for Mobile Foundation.

## Project Reference

**Project:** Lexarium — Wallecx
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints (updated 2026-05-26)
**Core value:** Each authenticated user can save, retrieve, and display their own vaccination records, membership/loyalty cards, and daily expenses — without ever losing access to them, and can track spending against per-category budget targets.
**Current focus:** v4.3 Wallecx Mobile Optimization — Wallecx-wide mobile audit (Vaccinations + Memberships + Expenses List + Reports), mobile performance, forms & dialogs on small screens, PWA install + standalone polish. Test viewports: iOS Safari ~390px, Android Chrome ~360–412px, iPad ~768–820px.

## Current Position

**Milestone:** v4.3 Wallecx Mobile Optimization (started 2026-05-26)
**Status:** Executing — Phase 33 Plan 33-01 Task 1 complete (version bump committed 931aef0); PAUSED at Task 2 human-verify checkpoint
**Phase:** 33 Mobile Foundation
**Plan:** 33-01 (FND-04 version bumps) IN PROGRESS — Task 1 (bump + automated gate) done & committed; Task 2 (6-surface manual smoke-test) awaiting human. 33-02 (FND-01/02 useMobileEnv + App.vue listener), 33-03 (FND-03 visualizer) not started.
**Last activity:** 2026-05-27 — 33-01 Task 1 executed; Vue 3.5.34 + PrimeVue 4.5.5 lockstep landed, type-check/build/49-tests/lint green

## Shipped Milestones Summary

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 0–4 | 17 | 2026-05-12 |
| v1.1 Vaccine Grouping | 5–6 | 4 | 2026-05-12 |
| v1.2 Search, Sort & View Toggle | 7–9 | 5 | 2026-05-13 |
| v2.0 Membership Cards | 10–13 | 12 | 2026-05-14 |
| v2.1 Mobile PWA | 14–15 | 8 | 2026-05-14 |
| v2.2 Sort and Search for Membership Cards | 16 | 2 | 2026-05-15 |
| v2.3 UX Polish | 17–18 | 4 | 2026-05-18 |
| v3.0 Site-Wide Dark Mode | 19–22 | 7 | 2026-05-19 |
| v4.0 Daily Expense Tracker | 23–26 | 9 | 2026-05-22 |
| v4.1 Gap Resolution & Feature Completeness | 27–30 | 15 | 2026-05-25 |
| v4.2 Budget Recovery & Hardening | 31–32 | 2 | 2026-05-26 |

## v4.3 Phase Structure

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 33 | Mobile Foundation | FND-01..04 | Planned (3 plans) — ready to execute |
| 34 | Layout Audit & Touch Targets | LT-01,02,03,04,05,07,09 | Not started |
| 35 | Forms & Dialogs on Small Screens | LT-08, FD-01,03,04,05,06,07,09 | Not started |
| 36 | Mobile Performance | PF-01,02,04,05,07,09 | Not started |
| 37 | PWA Install + Standalone Polish | PWA-01,02,04,06,07,09 | Not started |
| 38 | Mobile UAT Sweep + PWA-UAT-01 | PWA-05 | Not started |
| 38b | List Virtualization (CONDITIONAL) | PF-06 | Not triggered |

## Accumulated Context

### Architectural Invariants (locked)

- **Mini-app, not separate deployment.** Wallecx ships as a Lexarium mini-app at `/projects/wallecx`.
- **Specific collections, not polymorphic vault.** Each record type has its own PocketBase collection (`wallecx_vaccinations`, `wallecx_memberships`, `wallecx_expenses`).
- **Server-side per-user isolation is the auth boundary.** All five PocketBase rules enforce ownership; the route guard is UX only.
- **Tab shell, not sub-routes.** PrimeVue Tabs with string-typed `activeTab`; each tab owns its own state; no new Pinia store.
- **Direct v-model refs for ManageMembership.vue.** PrimeVue ColorPicker issue #8135 — controlled system ignores initial value. This is the established pattern for membership write path.
- **ConfirmDialog at WallecxApp.vue shell level only.** `useConfirm` broadcasts to single app-shell-level instance; not duplicated in tab components.
- **requestKey per collection.** `'memberships-getFullList'` and `'vaccinations-getFullList'` and `'expenses-getFullList'` must stay distinct to prevent PocketBase auto-cancel.
- **card_color stored without `#` prefix.** All CSS bindings prepend `#`. Zod validates `[0-9a-fA-F]{6}`.
- **iOS fullscreen via viewport overlay.** `position:fixed;inset:0;z-index:9999` — not the Fullscreen API.
- **JsBarcode always in try/catch.** Throws synchronously on invalid input. On catch, render `card_number` as large plain text.
- **Admin-UI checkpoints require text paste-back + downstream smoke verify.** When a phase configures a live external artifact (PocketBase collection schema, rules, env vars, dashboard settings), the checkpoint MUST require the user to paste back the actual configured values as text AND a code-side smoke verification must run against the live system. Acknowledgment-only signals ("approved", "done") are insufficient. See BUG-01 post-mortem: Phase 28-01 Task 1 → Phase 31.

### v4.3 Phase Structure Decisions (pre-planning, 2026-05-26)

- **Category-grouped phases per A-43-9.** One pattern established once and applied across all 3 tabs. Tab-by-tab ordering rejected — would rediscover the same patterns 3× and produce less reviewable diffs.
- **Foundation phase first (33).** `useMobileEnv` composable + App.vue-scope `beforeinstallprompt` listener must land before any consumer phase. Late listener registration silently drops Android install affordance (A-43-4).
- **Shell before dialogs (34 → 35).** Layout audit fixes the frame; forms phase fixes the content. LT-08 (sticky bottom action bars in 4 dialogs) groups with Phase 35 forms work — the dialogs are where the sticky bars live — not with Phase 34 layout audit, to keep the Manage dialog migration coherent.
- **Performance after visual layer stable (35 → 36).** Bundle splits and async components are easier to verify (and easier to detect regressions in) once the visual surface is stable. Skeleton states (PF-04) are sized against the final layout from Phase 34/35.
- **PWA polish last before UAT (36 → 37 → 38).** Status-bar + splash + install affordance need safe-area wiring (34), sticky bars (35), and reduced bundle (36) all in place to feel native-grade.
- **ManageMembership BaseMobileDialog migration goes LAST in Phase 35.** Highest-risk migration (ColorPicker direct v-model invariant, PrimeVue #8135). Order: ManageExpense → ManageBudget → ManageMembership → ManageVaccination (A-43-2).
- **NFR-PERF-MEASURE gates Phase 38b conditional virtualization.** Production record counts unknown (personal vault scope). Phase 36 PF-05 instrumentation closes that knowledge gap; only then do we know whether virtualization is needed. Premature virtualization risks M-16 sessionStorage sort-restore regression.
- **NFR/CON bind multiple phases.** Each NFR/CON requirement has a verification-owner phase AND binds every other phase that touches the affected surface. Documented in each phase's "Binds NFR/CON" section in ROADMAP.md.

### v2.1 PWA Architectural Decisions

- **registerType: 'prompt' only — never autoUpdate.** Both CRUD forms have unsaved state; a silent SW reload would destroy it.
- **All PocketBase API calls: NetworkOnly.** Auth token lives in localStorage (inaccessible to SW context); stale data risk is unacceptable for a personal vault.
- **navigateFallback: 'index.html' is mandatory.** Without it, navigating to `/projects/wallecx` offline = white screen (SPA routing requirement).
- **vercel.json must ship in the same deployment as the first SW.** Vercel may cache sw.js indefinitely without `Cache-Control: no-cache` headers.
- **navigator.storage.persist() on WallecxApp.vue mount.** Mitigates (does not guarantee) iOS 7-day localStorage eviction of PocketBase auth token.
- **scope: '/' not '/projects/wallecx'.** Scoping to sub-path breaks cross-route navigation within the installed PWA.
- **Do NOT add `<link rel="manifest">` manually.** vite-plugin-pwa auto-injects it at build time.

### v2.1 PWA Build Decisions (Plan 14-04)

- **globIgnores: ['**/about-me-photo*']** — the about-me home page photo (9.85 MB) is excluded from Workbox precache; not needed offline for Wallecx PWA functionality.
- **maximumFileSizeToCacheInBytes: 3 MiB** — vendor bundle (2.57 MiB, contains Vue/Pinia/Router) must be precached for app shell offline; 3 MiB limit accommodates it.
- **Task 2 human-verify auto-approved** — per auto_advance:true config; Chrome DevTools verification instructions documented in 14-04-SUMMARY.md for async follow-up.

### v2.2 Toolbar Implementation Notes

- **Reuse WallecxToolbar.vue** — already implements search + sort + view toggle for VaccinationsTab. Adapt for MembershipsTab via a prop to hide the view toggle (membership cards are always grid-view).
- **State lives in MembershipsTab.vue** — `searchQuery` ref + `sortMode` ref → `filteredSortedMemberships` computed → passed to card grid. Mirrors the VaccinationsTab pattern.
- **No new PocketBase queries.** All filtering and sorting is client-side on the already-loaded `memberships` ref.
- **Sort modes:** Name A–Z, Issuer A–Z, Expiry Date (soonest first; cards without expiry sorted last), Recently Added.
- **Session retention for sort mode** via `sessionStorage` — same approach as VaccinationsTab.
- **Empty state** when search matches zero cards — informative message, not a blank area.
- **sortOptions is a required prop on WallecxToolbar** — each tab must pass its own sort options array. VaccinationsTab passes `vaccinationSortOptions`; MembershipsTab will pass `membershipSortOptions`. (Established in Plan 16-01.)

### v2.3 Architectural Decisions (pre-planning)

- **Bottom sheet strategy: conditional `position` prop on PrimeVue Drawer.** VaccinationGroupPanel already uses `<Drawer position="right">`; switch to `position="bottom"` below 640px using `useWindowSize` from `@vueuse/core`. MembershipDetail currently uses `<Dialog>`; on mobile replace with `<Drawer position="bottom">` or conditionally render a bottom-anchored `<Drawer>` vs `<Dialog>`.
- **Reactive breakpoint via `useWindowSize`.** Already available in `@vueuse/core` (no new packages). Derive `const isMobile = computed(() => width.value < 640)`.
- **MOB-09 via existing `showToggle` prop pattern.** WallecxToolbar already accepts `showToggle`; add a responsive computed to VaccinationsTab that sets `showToggle` to `false` when `isMobile` is true and resets the active view to `'list'` on mount when mobile.
- **Dark mode fix strategy: scoped CSS variable overrides.** Target `.my-app-dark .p-card`, `.my-app-dark .p-dialog`, `.my-app-dark .p-drawer` etc. with CSS custom property overrides inside each Wallecx component's `<style scoped>`. No new packages required.
- **No new npm packages unless strictly necessary.** `useWindowSize` and Tailwind `sm:` breakpoints cover all detection needs.

### v4.0 Expense Tracker Foundation (Phase 23)

- **PocketBase listRule returns 200+empty (not 403) for unauthenticated requests.** `@request.auth.id != ""` is a filter expression; when false, all rows are filtered out. A 403 requires `null` rule (admin-only). Data isolation is intact.
- **@request.body.user on createRule is the correct v0.29.3 syntax.** Use `@request.auth.id != "" && @request.body.user = @request.auth.id` on createRule. The deprecated `@request.data.user` form causes create requests to return 403. Confirmed against the live PocketBase 0.29.3 instance in Phase 28. (Earlier note that claimed the opposite was incorrect — superseded.)
- **Locked requestKey names for Phase 24+:** `'expenses-getFullList'` and `'expense-categories-getFullList'` (must not collide with vaccinations/memberships keys).
- **DEFAULT_EXPENSE_CATEGORIES defined in Phase 23, seeded lazily in Phase 24.** Phase 24's ManageExpense.vue seeds per-user on first dialog open — no PocketBase signup hook.
- **receipt File field: protected=true.** File URLs require short-lived token; direct URL access without token returns 403.
- **src/lib/wallecx/ module pattern established.** Non-PocketBase Wallecx utilities (schemas, constants, formatters) live here. Separate from src/lib/pocketbase/.
- **WR-01/WR-02 code review findings (advisory):** `mapToUpdateExpense` includes `notes: undefined` key unconditionally; test uses `toBeUndefined()` instead of `not.toHaveProperty('notes')`. Carried into Phase 27 (CQ-02).
- **WR-03 advisory:** `expense_date` regex accepts invalid calendar dates. Add `.refine()` using dayjs before Phase 24. Carried into Phase 27 (CQ-01).

### Phase 25 Decisions

- **DatePicker @update:model-value cast pattern.** PrimeVue DatePicker emits `Date | Date[] | (Date|null)[] | null | undefined`; components that bind to `Date | null` must use `($event instanceof Date ? $event : null)` cast. Established in 25-01 ExpensesToolbar.vue.
- **categoryOptions must derive from RAW expenses.value array, not from filteredSortedExpenses.** Using the filtered output causes a feedback loop where selected categories disappear from the MultiSelect once they no longer appear in filtered results. Locked in 25-02 ExpensesTab.vue (RESEARCH.md Pitfall 3).
- **v-if chain order locked: isLoading → raw expenses empty → filtered empty → data list.** If raw expenses array is empty, filteredSortedExpenses is also empty — so the raw-empty check must come first to avoid showing the wrong empty state (RESEARCH.md Pitfall 4).
- **sessionStorage sort restoration runs BEFORE getFullList in onMounted.** Restoring after the load would cause a flash of the default sort mode before the persisted sort applies.
- **`requestKey: 'expenses-getFullList'` confirmed distinct.** Verified non-colliding with `'memberships-getFullList'` and `'vaccinations-getFullList'`. STATE.md locked invariant upheld.

### Phase 26 Decisions (Plan 03 — Wave 3 Reports view + sub-tab wiring)

- **Period selector uses PrimeVue Tabs (scrollable), NOT SelectButton.** Tabs is the established PrimeVue pattern for mutually-exclusive horizontal options and the `scrollable` prop handles narrow-viewport overflow gracefully when the 4 period tabs + inline custom-range DatePickers compete for width.
- **Custom From/To persisted as YYYY-MM-DD strings, not Date objects or ISO datetimes.** Keeps sessionStorage timezone-stable; rehydrated via `dayjs(stored, 'YYYY-MM-DD').toDate()` in onMounted.
- **Chart palette is fully reactive via useChartTheme refs (no manual remount on dark-mode toggle).** All chart colors (palette + axis + grid + muted + heading + surface + divider) live inside the `chartOptions` computed; PrimeVue Chart's deep-watch on options re-renders the chart automatically when `.my-app-dark` flips on `<html>`. Plan 26-01's MutationObserver-based composable design proves itself here.
- **prefers-reduced-motion → animation.duration: 0 (else 200ms).** Read via `window.matchMedia('(prefers-reduced-motion: reduce)').matches` inline in a `reducedMotion` computed — no @vueuse/core dependency added.
- **Chart container height = `Math.max(220, n_categories * 36)`.** Prevents single-category state from collapsing to one thick bar; gives 8-category state breathing room.
- **Invalid custom range (From > To) is a soft state.** Period selector stays interactive, chart + Grand Total hide, inline `role='alert'` message appears below DatePickers in `var(--color-status-error)`. No toast, no dialog.
- **Sub-tab persistence intentionally OUT of scope.** UI-SPEC defers `activeSubTab` persistence; no sessionStorage key added. List is always default on tab entry. May be added later if user feedback warrants.
- **No explicit Chart import in ExpensesReportsView.vue.** PrimeVueResolver auto-imports it; chart.js@^4.5.1 from Plan 26-01 is the runtime dep PrimeVue dynamically imports at mount.
- **Scoped `:deep(.wallecx-sub-tabs .p-tablist .p-tab)` sets sub-tab visual nesting.** `min-height: 44px` + `padding: 0 0.75rem` gives a visual cue that this Tabs is nested under the parent WallecxApp top-level Tabs. No global CSS change.
- **Both sibling views consume the same `:expenses` + `:is-loading` from the shell.** Single `getFullList` call with locked requestKey `'expenses-getFullList'` preserved — Reports view does NOT make its own PocketBase queries. Filtering by period is fully client-side via YYYY-MM-DD string comparison on the already-loaded expenses array.

### Phase 26 Decisions (Plan 02 — Wave 2 refactor)

- **Parent-shell + child-view SFC split established for Wallecx tabs.** ExpensesTab is now a thin parent shell that owns data (expenses ref, isLoading), CRUD operations (deleteExpense, openManage, onCreated, onUpdated), and modal/preview UI (ManageExpense dialog, AttachmentPreview Dialog/Drawer with token gate). ExpensesListView is the child sibling view that owns view-specific UI state (5 filter/sort refs, sessionStorage sort persistence, 4-state template) and emits semantic intent events (edit, delete, preview, request-add-expense) back up to the shell. Plan 26-03 will use the same pattern to add ExpensesReportsView as a second sibling view, with the sub-tab toggle living in the shell.
- **Props are unwrapped in setup — child uses `props.expenses` (no `.value`).** Confirmed via working type-check that categoryOptions and filteredSortedExpenses computeds dereference `props.expenses` directly, matching Vue 3 Composition API behavior where defineProps returns a reactive proxy whose property reads track reactively without `.value`.
- **sessionStorage persistence belongs with the state owner.** Sort mode persistence (`wallecx:expense-sort` + VALID_SORT_MODES whitelist + read in onMounted + write in watch) moved entirely to ExpensesListView in this refactor. The shell does not touch sort state, simplifying Plan 26-03 (which will add period state, NOT sort state, to ExpensesReportsView).
- **Receipt preview state stays in the shell, not the list view.** Even though preview is triggered by a list-row paperclip click, the showPreview/previewRecord/previewToken state and Dialog/Drawer rendering live in ExpensesTab. This avoids re-extraction when Plan 26-03 introduces ExpensesReportsView (which does NOT need receipt preview).
- **All Phase 25 user-visible copy preserved verbatim.** Every string (`'No expenses yet.'`, `'No expenses match your filters.'`, `'Add expense'`, `'Clear filters'`, delete confirmation header/body/labels, error toasts) and every visual element (mdi:cash-multiple, mdi:filter-remove-outline icons, py-12 spacing, Skeleton h=3rem) carried across the refactor without edit. Zero visual diff target met.

### Phase 26 Decisions (Plan 01 — Wave 1 foundation)

- **dayjs format token `Q` is NOT extended by the quarterOfYear plugin.** Despite plan + RESEARCH.md asserting that `now.format('[Q]Q YYYY')` would produce "Q2 2026", empirically (Node REPL after `dayjs.extend(quarterOfYear)`) it produces "QQ 2026" — the plugin patches `.quarter()` / `.startOf('quarter')` / `.endOf('quarter')` accessors but does NOT extend `format()` token grammar. Use `` `Q${now.quarter()} ${now.format('YYYY')}` `` template literal instead. Locked in `src/lib/wallecx/period.ts` `formatPeriodLabel` with an inline NOTE comment.
- **MutationObserver attaches to `document.documentElement`, not `document.body`.** Project's `useTheme.ts` puts `.my-app-dark` on `<html>`. The UI-SPEC sample code observing `<body>` was wrong for this project. `useChartTheme` defensively observes both elements at negligible cost.
- **Chart palette is fully CSS-resident (16 tokens).** `--color-chart-1..8` declared in BOTH the `@theme` block (light) AND the `.my-app-dark` block (dark) in `src/assets/base.css`. The `useChartTheme` composable just re-reads via `getComputedStyle` on class mutation — no JS palette lookup table. Bars auto-swap colors on dark-mode toggle.
- **chart.js installed as runtime dep (NOT devDep).** PrimeVue 4.3.x performs dynamic `import('chart.js/auto')` at component mount; without the package the import silently resolves to nothing and the chart never renders (no error, no warning). PrimeVue does NOT declare chart.js as a peer dep.

### v4.1 Phase 29 Decisions (Period Comparison)

- **Inline period comparison line pattern.** Single `<div v-if="visibleComparison !== null">` rendered between Grand Total hero and Manage Budgets button inside STATE 4 of ExpensesReportsView.vue. Format: `{arrow} ${absolute} ({±%}) vs last {period}`. Single helper-driven render — no separate component.
- **Period coverage: Month + Quarter only.** `visibleComparison` returns null for `this-year` and `custom` (mirrors Phase 28 D-09 hiding pattern — DOM absent, not just hidden). Year/custom extension deferred.
- **Inline dayjs subtraction for prior-period boundaries.** `previousPeriodRange` uses inline `dayjs().subtract(1, 'month'|'quarter').startOf().endOf()` — no new helpers added to `src/lib/wallecx/period.ts`. `dayjs.quarterOfYear` plugin is transitively active via period.ts module-top extension; no re-extend needed.
- **Color semantics for delta: error=overspending, success=underspending, muted=flat.** `comparisonColor` maps direction to `var(--color-status-error/success/typo-muted)`. Consistent with Phase 28 Budget vs Actual color mapping — single mental model across the Reports view.
- **Typography: U+2212 minus character (−) for negative percentage.** NOT ASCII hyphen-minus (-). Locked in line 176 of ExpensesReportsView.vue.
- **Zero prior period → omit percentage, append "(no prior spend)".** `percentage: null` branch in ComparisonResult; comparisonText renders absolute-only string. No `+Infinity%` or fake `+100%`.
- **Accessibility: role="status" + semantic aria-label.** `comparisonAriaLabel` renders "Spending up 23 percent versus last month" (semantic English words; not Unicode arrows in screen-reader copy).

### v4.1 Phase 28 Decisions (Budget Tracking)

- **Mapper documentation pattern.** `src/lib/pocketbase/expenseBudgetMapper.ts` exports `mapToUpdateExpenseBudget` but ManageBudget.vue builds PATCH payloads inline (bulk upsert with per-row `{ category, budget_type, amount }`). The mapper exists primarily as docblock documentation of the locked requestKey `'expense-budgets-getFullList'`. Future single-record budget readers (none planned yet) may adopt it.
- **Bulk-upsert UI pattern: Promise.all over rows, delete-on-zero.** ManageBudget.vue iterates `localRows` and dispatches concurrent create/update/delete via `Promise.all`. Blank-or-zero amount on an existing record triggers delete; non-zero on new triggers create; non-zero on existing triggers update. Partial failure is accepted (parent re-fetches on 'saved' to reflect actual server state).
- **Shell-owns-data invariant applied to budgets.** ExpensesTab.vue owns the `budgets` ref and `loadBudgets` helper. ExpensesReportsView accepts `:budgets` prop and emits `'budgets-saved'`. ManageBudget.vue receives both `:categories` and `:budgets` as props and does NOT fetch.
- **Period-gated visibleBudgets pattern.** Budget vs Actual section uses `v-if="visibleBudgets.length > 0"` with a computed that returns monthly budgets for `this-month`, yearly for `this-year`, and `[]` for `this-quarter`/`custom`. Section is entirely absent from DOM (not just hidden) for non-applicable periods.
- **Manage Budgets button placement: STATE 4 only.** Button lives inside `<template v-else>` (chart rendering state) so it's hidden during loading, invalid range, and empty period states.
- **Categories lazy-loaded on Manage Budgets click.** ExpensesReportsView fetches `wallecx_expense_categories` with `requestKey: 'expense-categories-getFullList'` (shared with ManageExpense.vue, safe per RESEARCH Q2) only when the user clicks the button — not on view mount.

### v4.1 Phase 27 Pre-Planning Notes

- **JSON export pattern reference: vaccination export (v1.0).** Same shape: fetch all user records, `JSON.stringify(records, null, 2)`, create Blob, anchor download. Memberships and expenses follow this pattern.
- **CQ-01 implementation:** Add `.refine((val) => dayjs(val, 'YYYY-MM-DD', true).isValid(), { message: 'Invalid calendar date' })` to the `expense_date` Zod field in the expense schema. The `strict: true` argument to `dayjs()` enforces calendar validity (Feb 31 rejected).
- **CQ-02 implementation:** In `mapToUpdateExpense`, change the notes field from unconditional `notes: record.notes` to a conditional spread: `...(record.notes !== undefined && { notes: record.notes })`. Update the test assertion from `expect(result.notes).toBeUndefined()` to `expect(result).not.toHaveProperty('notes')`.
- **Budget collection requestKey:** Use `'expense-budgets-getFullList'` to stay consistent with locked requestKey naming convention.

### Open Todos

None.

### Active Blockers

None.

## Deferred Items

Items acknowledged and deferred at v1.0 milestone close on 2026-05-13:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 00: 00-HUMAN-UAT.md | partial — 1 pending scenario |
| uat_gap | Phase 08: 08-HUMAN-UAT.md | partial — 4 pending scenarios |
| verification_gap | Phase 00: 00-VERIFICATION.md | human_needed |
| verification_gap | Phase 02: 02-VERIFICATION.md | human_needed |
| verification_gap | Phase 04: 04-VERIFICATION.md | human_needed |
| verification_gap | Phase 05: 05-VERIFICATION.md | human_needed |
| verification_gap | Phase 08: 08-VERIFICATION.md | human_needed |

| uat_gap | Phase 14: 14-HUMAN-UAT.md | partial — 3 pending scenarios (Chrome DevTools PWA install, iOS standalone, offline precache) |
Known deferred items at close: 8 (7 from v1.0 + 1 from Phase 14)

Items acknowledged and deferred at v4.0 milestone close on 2026-05-22:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 10: 10-HUMAN-UAT.md | partial — 2 pending scenarios |
| uat_gap | Phase 11: 11-HUMAN-UAT.md | partial — 1 pending scenario |
| uat_gap | Phase 12: 12-HUMAN-UAT.md | partial — 6 pending scenarios |
| uat_gap | Phase 18: 18-HUMAN-UAT.md | unknown status |
| uat_gap | Phase 20: 20-HUMAN-UAT.md | unknown status |
| uat_gap | Phase 21: 21-HUMAN-UAT.md | unknown status |
| uat_gap | Phase 22: 22-HUMAN-UAT.md | unknown status |
| uat_gap | Phase 23: 23-HUMAN-UAT.md | partial — 0 pending (file format) |
| uat_gap | Phase 24: 24-HUMAN-UAT.md | partial — 0 pending (file format) |
| uat_gap | Phase 25: 25-HUMAN-UAT.md | partial — 7 pending scenarios |
| verification_gap | Phase 10: 10-VERIFICATION.md | human_needed |
| verification_gap | Phase 11: 11-VERIFICATION.md | human_needed |
| verification_gap | Phase 12: 12-VERIFICATION.md | human_needed |
| verification_gap | Phase 13: 13-VERIFICATION.md | human_needed |
| verification_gap | Phase 14: 14-VERIFICATION.md | human_needed |
| verification_gap | Phase 16: 16-VERIFICATION.md | human_needed |
| verification_gap | Phase 17: 17-VERIFICATION.md | human_needed |
| verification_gap | Phase 18: 18-VERIFICATION.md | human_needed |
| verification_gap | Phase 19: 19-VERIFICATION.md | human_needed |
| verification_gap | Phase 20: 20-VERIFICATION.md | human_needed |
| verification_gap | Phase 21: 21-VERIFICATION.md | human_needed |
| verification_gap | Phase 23: 23-VERIFICATION.md | human_needed |
| verification_gap | Phase 24: 24-VERIFICATION.md | human_needed |
| verification_gap | Phase 25: 25-VERIFICATION.md | human_needed |
| context_question | Phase 26: 26-CONTEXT.md | 3 questions (answered by shipped implementation) |
Known deferred items at v4.0 close: 39 (8 carried from prior closes + 31 new at v4.0)

Note: UAT gaps for phases 10–25 are the primary target of Phase 30 (QA-01).

Items acknowledged and deferred at v4.1 milestone close on 2026-05-25:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 28: 28-HUMAN-UAT.md | partial — 9 pending scenarios (just-shipped budget tracking UAT; out of Phase 30 scope per ROADMAP) |
| uat_gap | Phase 29: 29-HUMAN-UAT.md | partial — 7 pending scenarios (just-shipped period comparison UAT; out of Phase 30 scope) |
| uat_gap | Phase 22: 22-HUMAN-UAT.md V6 | deferred — PWA standalone install + toggle (needs install flow) — TARGETED BY v4.3 Phase 38 PWA-UAT-01 |
| verification_gap | Phase 27: 27-VERIFICATION.md | human_needed (sweep approved 2026-05-22 via 27-HUMAN-UAT.md) |
| verification_gap | Phase 28: 28-VERIFICATION.md | human_needed (9 UAT items already deferred in 28-HUMAN-UAT.md) |
| verification_gap | Phase 29: 29-VERIFICATION.md | human_needed (7 UAT items already deferred in 29-HUMAN-UAT.md) |

Known deferred items at v4.1 close: 6 (3 new UAT + 3 verification gaps; previously-deferred Phase 00/08/14 carry forward). Phase 30 resolved 80/82 in-scope scenarios from earlier milestones.

## Session Continuity

**Last session:** 2026-05-27T07:40:00.000Z

**Stopped at:** Phase 33 Plan 33-01 PAUSED at Task 2 checkpoint:human-verify. Task 1 done: vue@^3.5.34 + primevue@^4.5.5 + @primevue/forms@^4.5.5 + @primevue/auto-import-resolver@^4.5.5 installed; package.json committed (931aef0); automated gate green (type-check 0, build 0 with no precache-skip lines, test:unit 49/49, lint clean except grandfathered VaccinationDetail.vue:5); vite.config.ts untouched. Awaiting human 6-surface PrimeVue smoke-test (Drawer, Dialog, DatePicker touchUI, FileUpload capture, MultiSelect, ColorPicker direct-v-model) + HIGHEST-WATCH #7465 dark-mode no-white-flash on Dialog+Drawer. On "approved" paste-back, the continuation writes 33-01-SUMMARY.md and advances the plan counter. SUMMARY.md NOT yet written (plan incomplete).

**Prior stopped-at:** Phase 33 planned — 3 plans, plan-checker VERIFICATION PASSED (0 blockers/warnings; 2 info advisories incorporated: M-6 synchronous-seed spec assertion + node -e portability for the visualizer verify). Plan map: 33-01 = Vue 3.5.34 + PrimeVue 4.5.5 lockstep bump + 6-surface manual smoke-test gate (wave 1, autonomous:false); 33-02 = useMobileEnv composable (5-key object, tri-state 639/1023, module-singleton installPromptEvent) + App.vue beforeinstallprompt capture + spec + @vueuse/core promotion (wave 2); 33-03 = ANALYZE-gated rollup-plugin-visualizer + cross-env + analyze script (wave 3). All 3 plans touch package.json → strictly sequential waves. Plans not yet committed.

**Next session entry point:** Run `/gsd-execute-phase 33` to execute Phase 33. Plans: `.planning/phases/33-mobile-foundation/33-0{1,2,3}-PLAN.md`.

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-26 — v4.3 Wallecx Mobile Optimization roadmap created; status `planned`; 7 phases (6 mandatory + 1 conditional); 32/32 functional requirements mapped; ready for `/gsd-plan-phase 33`*
