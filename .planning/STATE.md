---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: Daily Expense Tracker
status: executing
stopped_at: phase 26 plan 02 complete; plan 03 queued (2026-05-22)
last_updated: "2026-05-22T01:44:49Z"
progress:
  total_phases: 27
  completed_phases: 26
  total_plans: 67
  completed_plans: 66
  percent: 99
---

# Project State

**Last updated:** 2026-05-22 — Phase 26 Plan 02 complete (Wave 2 refactor): ExpensesTab.vue reduced from 313 to 161 lines and now acts as a thin shell (data load + ManageExpense + AttachmentPreview dialogs + delete + preview handlers); Phase 25 list logic extracted verbatim into new sibling ExpensesListView.vue (186 lines) which owns 5 filter/sort refs, categoryOptions, filteredSortedExpenses, clearFilters, sessionStorage 'wallecx:expense-sort' persistence with VALID_SORT_MODES whitelist; props { expenses, isLoading } down + 4 events (edit/delete/preview/request-add-expense) up. Phase 25 invariants all preserved: requestKey 'expenses-getFullList', defineExpose({ deleteExpense }), ConfirmDialog at WallecxApp shell level, no @vueuse/core. Type-check + build-only + 49 unit tests all green. Zero user-visible behavior change vs. Phase 25. Next: Plan 26-03 (Wave 3 — ExpensesReportsView.vue + sub-tab wiring).

## Project Reference

**Project:** Lexarium — Wallecx
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.
**Current focus:** v4.0 — Daily Expense Tracker (third Wallecx record type: expenses with period-tabbed reporting and per-category charts).

## Current Position

**Milestone:** v3.0 — Site-Wide Dark Mode
**Milestone:** v4.0 — Daily Expense Tracker
**Phase:** 26 — Reporting View
**Status:** Phase 26 Plans 01 + 02 complete (Wave 1 foundation + Wave 2 refactor shipped); Plan 03 queued

```
v4.0 Progress: [ Phase 23 ] [ Phase 24 ] [ Phase 25 ] [ Phase 26      ]
               [   DONE   ] [   DONE   ] [   DONE   ] [ 2/3 — IN PROG ]
```

```
v3.0 Progress: [ Phase 19 ] [ Phase 20 ] [ Phase 21 ] [ Phase 22 ]
               [   DONE   ] [   DONE   ] [   DONE*  ] [  NEXT UP ]
```

*Phase 21: UAT approved with 2 spot-checks deferred (LexTrack DatePicker/TabView contrast; API Playground sign-off). Revisit if gaps surface during Phase 22 audit.

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

## Accumulated Context

### Architectural Invariants (locked)

- **Mini-app, not separate deployment.** Wallecx ships as a Lexarium mini-app at `/projects/wallecx`.
- **Specific collections, not polymorphic vault.** Each record type has its own PocketBase collection (`wallecx_vaccinations`, `wallecx_memberships`).
- **Server-side per-user isolation is the auth boundary.** All five PocketBase rules enforce ownership; the route guard is UX only.
- **Tab shell, not sub-routes.** PrimeVue Tabs with string-typed `activeTab`; each tab owns its own state; no new Pinia store.
- **Direct v-model refs for ManageMembership.vue.** PrimeVue ColorPicker issue #8135 — controlled system ignores initial value. This is the established pattern for membership write path.
- **ConfirmDialog at WallecxApp.vue shell level only.** `useConfirm` broadcasts to single app-shell-level instance; not duplicated in tab components.
- **requestKey per collection.** `'memberships-getFullList'` and `'vaccinations-getFullList'` (or equivalent) must stay distinct to prevent PocketBase auto-cancel.
- **card_color stored without `#` prefix.** All CSS bindings prepend `#`. Zod validates `[0-9a-fA-F]{6}`.
- **iOS fullscreen via viewport overlay.** `position:fixed;inset:0;z-index:9999` — not the Fullscreen API.
- **JsBarcode always in try/catch.** Throws synchronously on invalid input. On catch, render `card_number` as large plain text.

### v2.1 PWA Architectural Decisions (new)

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
- **@request.data.user on createRule confirmed working.** Both collections use `@request.auth.id != "" && @request.data.user = @request.auth.id`. `@request.body.*` does NOT exist and returns 404.
- **Locked requestKey names for Phase 24+:** `'expenses-getFullList'` and `'expense-categories-getFullList'` (must not collide with vaccinations/memberships keys).
- **DEFAULT_EXPENSE_CATEGORIES defined in Phase 23, seeded lazily in Phase 24.** Phase 24's ManageExpense.vue seeds per-user on first dialog open — no PocketBase signup hook.
- **receipt File field: protected=true.** File URLs require short-lived token; direct URL access without token returns 403.
- **src/lib/wallecx/ module pattern established.** Non-PocketBase Wallecx utilities (schemas, constants, formatters) live here. Separate from src/lib/pocketbase/.
- **WR-01/WR-02 code review findings (advisory):** `mapToUpdateExpense` includes `notes: undefined` key unconditionally; test uses `toBeUndefined()` instead of `not.toHaveProperty('notes')`. Run `/gsd-code-review-fix 23` before Phase 24 write path uses the mapper.
- **WR-03 advisory:** `expense_date` regex accepts invalid calendar dates. Add `.refine()` using dayjs before Phase 24.

### Phase 25 Decisions

- **DatePicker @update:model-value cast pattern.** PrimeVue DatePicker emits `Date | Date[] | (Date|null)[] | null | undefined`; components that bind to `Date | null` must use `($event instanceof Date ? $event : null)` cast. Established in 25-01 ExpensesToolbar.vue.
- **categoryOptions must derive from RAW expenses.value array, not from filteredSortedExpenses.** Using the filtered output causes a feedback loop where selected categories disappear from the MultiSelect once they no longer appear in filtered results. Locked in 25-02 ExpensesTab.vue (RESEARCH.md Pitfall 3).
- **v-if chain order locked: isLoading → raw expenses empty → filtered empty → data list.** If raw expenses array is empty, filteredSortedExpenses is also empty — so the raw-empty check must come first to avoid showing the wrong empty state (RESEARCH.md Pitfall 4).
- **sessionStorage sort restoration runs BEFORE getFullList in onMounted.** Restoring after the load would cause a flash of the default sort mode before the persisted sort applies.
- **`requestKey: 'expenses-getFullList'` confirmed distinct.** Verified non-colliding with `'memberships-getFullList'` and `'vaccinations-getFullList'`. STATE.md locked invariant upheld.

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

## Session Continuity

**Last session:** 2026-05-22T01:44:49Z

**Stopped at:** Phase 26 Plan 02 complete (Wave 2 refactor shipped); Plan 03 queued (2026-05-22)

**Next session entry point:** Execute Plan 26-03 (Wave 3 — ExpensesReportsView.vue + List/Reports sub-tab wiring inside ExpensesTab.vue). The shell + sibling-view architecture is in place: ExpensesReportsView will be a second sibling consuming the same `:expenses` and `:is-loading` props from the shell. All Wave 1 artifacts (chart.js@^4.5.1, --color-chart-1..8 CSS tokens, period.ts, useChartTheme.ts) remain ready for consumption.

**Code review note:** Phase 24 WR-01 + WR-02 fixed and committed (fa5e94e). Phase 25 CONTEXT.md committed (fa5e94e). Phase 25-01 complete: e05b206 + a8cf273. Phase 25-02 complete: 5c80775 + 77ad1db. Phase 26-01 commits: 0a31a10 (chart.js + palette), 6e8617d (period.test RED), ce7e04e (period.ts GREEN), d5edb49 (useChartTheme). Phase 26-02 commits: bcf4568 (extract ExpensesListView.vue), 42ed8ea (refactor ExpensesTab.vue to shell). Pre-existing lint warning in VaccinationDetail.vue (`'props' is assigned a value but never used`) deferred to maintenance sweep.

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-18 — v3.0 Site-Wide Dark Mode started; Phase 19 ready to plan*
