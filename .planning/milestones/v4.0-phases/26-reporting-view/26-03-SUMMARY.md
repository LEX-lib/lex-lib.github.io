---
phase: 26-reporting-view
plan: "03"
subsystem: ui
tags: [vue3, primevue, chart.js, reporting, sessionStorage, dayjs, quarterOfYear, dark-mode, prefers-reduced-motion]

# Dependency graph
requires:
  - phase: 26-reporting-view
    provides: Plan 26-01 Wave 1 foundation (chart.js@^4.5.1, --color-chart-1..8 palette tokens, src/lib/wallecx/period.ts with quarterOfYear plugin + VALID_PERIODS + storage keys, src/composables/useChartTheme.ts) — fully consumed by ExpensesReportsView.vue
  - phase: 26-reporting-view
    provides: Plan 26-02 Wave 2 shell + ExpensesListView sibling — ExpensesTab.vue parent-shell pattern this plan extends with the Reports sibling and a sub-tab control
provides:
  - ExpensesReportsView.vue — new sibling component owning Reports sub-tab UI (period selector, Grand Total hero, per-category horizontal bar chart, loading/invalid-range/empty states)
  - ExpensesTab.vue extended with PrimeVue Tabs sub-tab control (List | Reports); both sibling views consume the same expenses + isLoading props from the shell
  - EXP-11 (period-tabbed reporting view), EXP-12 (grand total), EXP-13 (per-category breakdown chart) delivered end-to-end
affects: [phase-26-close, milestone-v4.0-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PrimeVue Tabs as a sub-tab control nested inside a parent tab — scoped :deep override sets 44px min-height + tighter 0.75rem horizontal padding to give visual nesting cue under the WallecxApp top-level Tabs"
    - "Chart palette reactive to dark-mode toggle — useChartTheme refs feed chartOptions computed, PrimeVue Chart's deep-watch on options triggers re-render automatically when the .my-app-dark class flips on <html>"
    - "Period state stored as 3 sessionStorage keys (PERIOD_STORAGE_KEY + FROM + TO) with isValidPeriod() whitelist on read; YYYY-MM-DD strings for custom range so date parsing is timezone-stable"
    - "Mutually-exclusive 4-state v-if chain for Reports view: loading skeleton > invalid range > empty period > Grand Total + chart — same discipline as Phase 25 list view"
    - "Currency-aware chart formatters via formatCurrency callback in both tooltip.label and x-axis ticks; minBarLength: 20 ensures sub-cent bars stay clickable"
    - "prefers-reduced-motion gate on chart animation.duration (0 vs 200ms) — no @vueuse/core dependency added; matchMedia read inline in computed"

key-files:
  created:
    - src/components/projects/wallecx/ExpensesReportsView.vue
  modified:
    - src/components/projects/wallecx/ExpensesTab.vue

key-decisions:
  - "Period selector uses PrimeVue Tabs (scrollable) — NOT SelectButton or custom buttons. Tabs is the established PrimeVue pattern for mutually-exclusive horizontal options, and the scrollable prop handles the 4-tab + custom-range-controls overflow gracefully on narrow viewports."
  - "Default period is 'this-month' (per UI-SPEC §Interaction Contracts). sessionStorage restore runs in onMounted BEFORE first render side-effects, with isValidPeriod() guarding against stale/malformed values from older sessions."
  - "Custom From/To persisted as YYYY-MM-DD strings (not Date objects, not ISO datetimes) to keep sessionStorage timezone-stable. Read path rehydrates via dayjs(stored, 'YYYY-MM-DD').toDate()."
  - "Invalid range (From > To) is a soft state — period selector stays interactive, chart + Grand Total hide, inline role='alert' message appears below DatePickers. No toast, no dialog. User can fix the range without losing context."
  - "Empty period state shows 'Add expense' CTA that emits request-add-expense — same event contract as ExpensesListView, so the shell routes both to openManage(null) with zero extra wiring."
  - "Chart container height computed as Math.max(220, n_categories * 36) — keeps single-category state from collapsing to one thick bar, and lets 8-category state breathe."
  - "Sub-tab persistence intentionally OUT of scope. UI-SPEC defers it; no sessionStorage key added for activeSubTab. List is always default on tab entry."
  - "No explicit Chart import in ExpensesReportsView.vue — auto-resolved by unplugin-vue-components PrimeVueResolver (same as every other PrimeVue component in this project). chart.js@^4.5.1 from Plan 26-01 is the runtime dep PrimeVue dynamically imports at mount."
  - "44px touch targets enforced via :deep scoped overrides on period tabs and inline style on Add expense button — no global CSS change."
  - "All en-dash separators (U+2013, not hyphen-minus) preserved verbatim from UI-SPEC §Copywriting Contract: 'Total spend — {periodName}', 'From — To' custom-range label."
  - "ConfirmDialog NOT mounted in either file — STATE.md invariant: confirm dialog lives at WallecxApp shell level only. Reports view has no destructive interactions."
  - "defineExpose({ deleteExpense }) preserved on ExpensesTab.vue — Phase 24 invariant carried through the sub-tab refactor."

patterns-established:
  - "Sub-tab control inside a top-level tab: PrimeVue Tabs with two TabPanels, scoped :deep class override for visual nesting, no sessionStorage persistence unless explicitly required. Reusable for future MembershipsTab/VaccinationsTab reporting additions."
  - "Reactive-palette chart: read N colors from useChartTheme's paletteColors ref, cycle via `paletteColors.value[i % paletteColors.value.length]`, embed all colors in chartOptions computed → dark-mode toggle on <html> auto-rebuilds chart without manual remount."
  - "Period state contract: { period: Period, customFrom: Date | null, customTo: Date | null } → derived periodRange via getPeriodRange(period, customFrom, customTo) → derived periodExpenses by YYYY-MM-DD string comparison. Future filter views can reuse the same shape."

requirements-completed:
  - EXP-11  # period-tabbed reporting view (This Month / This Quarter / This Year / Custom)
  - EXP-12  # grand total for selected period
  - EXP-13  # per-category breakdown horizontal bar chart

# Metrics
duration: 2min
completed: 2026-05-22
---

# Phase 26 Plan 03: ExpensesReportsView.vue + List/Reports sub-tab wiring Summary

**Delivers the Reports sub-tab end-to-end: a 324-line ExpensesReportsView.vue with period selector, Grand Total hero, per-category horizontal bar chart, loading/invalid-range/empty states; ExpensesTab.vue gains a PrimeVue Tabs sub-tab control (List | Reports) hosting both sibling views. Completes Phase 26 and closes EXP-11/12/13.**

## Performance

- **Duration:** ~2 min (two atomic commits ~90 seconds apart)
- **Started:** 2026-05-22T09:51:21+08:00 (commit 7a720e9)
- **Completed:** 2026-05-22T09:52:52+08:00 (commit fa4c01b)
- **Tasks:** 2
- **Files modified:** 2 (1 new, 1 modified)

## Accomplishments

- **ExpensesReportsView.vue created (324 lines)** — full Reports sub-tab UI:
  - Period selector: PrimeVue Tabs (scrollable) with 4 tabs — This Month, This Quarter, This Year, Custom — labels verbatim per UI-SPEC
  - Inline From/To PrimeVue DatePickers shown only when `period === 'custom'`; defaults to `startOf('month')..today`
  - Custom-range validation: `dateRangeError` computed; when From > To, chart + Grand Total hide, inline `role='alert'` message 'From date must be on or before To date.' shown in `var(--color-status-error)`
  - Grand Total hero: 'Total spend — {periodName}' (U+2013 en-dash) with bold brand-primary `formatCurrency(grandTotal)` value
  - Per-category horizontal bar chart: PrimeVue Chart `type='bar'` with `indexAxis: 'y'`, bars sorted descending, palette cycled via `paletteColors[i % 8]`, `minBarLength: 20`, `borderRadius: 4`, tooltip + x-axis tick `callback: formatCurrency`, `maintainAspectRatio: false`
  - Reactive chart theming: all colors (palette + axis + grid + muted + heading + surface + divider) read from `useChartTheme()` refs → dark-mode toggle on `<html>` triggers Chart's deep-watch and re-renders automatically
  - `prefers-reduced-motion` → `animation.duration: 0` (else 200ms)
  - Chart container height = `Math.max(220, categoryTotals.length * 36)`
  - 4-state mutually-exclusive v-if chain: `isLoading` → `dateRangeError` → `categoryTotals.length === 0` (empty period) → Grand Total + chart
  - Empty-period state: centered `mdi:chart-bar-stacked` icon + 'No expenses in this period.' heading + 'Try another period or add an expense to get started.' body + 'Add expense' button emitting `request-add-expense`
  - sessionStorage persistence: `PERIOD_STORAGE_KEY` (period name with `isValidPeriod()` whitelist), `PERIOD_FROM_STORAGE_KEY` + `PERIOD_TO_STORAGE_KEY` (YYYY-MM-DD strings for custom range)
  - `role='img'` + dynamic `aria-label` on chart wrapper for screen readers
  - 44px touch targets on period tabs (`:deep` scoped), DatePicker inputs, and Add expense button

- **ExpensesTab.vue extended (161 → 196 lines, +35 lines)** — sub-tab wiring:
  - Added `import ExpensesReportsView` and `type SubTab = 'list' | 'reports'`; `const activeSubTab = ref<SubTab>('list')`
  - Replaced direct `<ExpensesListView>` mount with `<Tabs v-model:value="activeSubTab" class="wallecx-sub-tabs">` wrapper
  - Two `<TabPanel>`s: `value="list"` hosts ExpensesListView with all 4 events (edit/delete/preview/request-add-expense); `value="reports"` hosts ExpensesReportsView with the single `request-add-expense` event
  - Both views receive the same `:expenses` + `:is-loading` props from the shell — **single getFullList call**, locked requestKey `'expenses-getFullList'` preserved
  - Both `request-add-expense` handlers route to `openManage(null)` — opens the Add Expense dialog
  - Scoped `:deep(.wallecx-sub-tabs .p-tablist .p-tab)` sets `min-height: 44px` + `padding: 0 0.75rem` for visual nesting cue under the parent WallecxApp top-level Tabs
  - `defineExpose({ deleteExpense })` preserved (Phase 24 invariant)
  - ConfirmDialog still mounted only at WallecxApp shell (STATE.md invariant preserved)

- **All STATE.md invariants verified preserved:** requestKey `'expenses-getFullList'`, ConfirmDialog at WallecxApp shell level only, no `@vueuse/core` import, no `chartjs-plugin-datalabels`, no explicit `Chart` import (PrimeVueResolver auto-imports it)

- **Verification:** `npm run type-check` clean (vue-tsc --build, no errors); `npm run test:unit` 49/49 tests pass across 5 test files (10 vaccinationMapper + 11 membershipMapper + 9 expenseMapper + 16 period + 3 router guard) — zero regressions vs. Plan 26-02 baseline.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ExpensesReportsView.vue** — `7a720e9` (feat) — 324 insertions, 1 new file
2. **Task 2: Wire List|Reports sub-tabs into ExpensesTab.vue** — `fa4c01b` (feat) — 45 insertions, 9 deletions

## Files Created/Modified

- `src/components/projects/wallecx/ExpensesReportsView.vue` — NEW. 324-line SFC. Receives `{ expenses: Expenses[], isLoading: boolean }` props; emits `request-add-expense`. Owns period state (period + customFrom + customTo refs), all derived computeds (`periodRange`, `periodExpenses`, `grandTotal`, `categoryTotals`, `periodNameLabel`, `reducedMotion`, `chartData`, `chartOptions`, `chartHeightPx`, `dateRangeError`), and sessionStorage persistence.
- `src/components/projects/wallecx/ExpensesTab.vue` — MODIFIED. +35 lines (161 → 196). Added `ExpensesReportsView` import, `SubTab` type + `activeSubTab` ref, Tabs/TabList/Tab/TabPanels/TabPanel wrapper around both sibling views, scoped sub-tab CSS.

## Decisions Made

All design decisions were front-loaded into 26-03-PLAN.md and the supporting artifacts (26-UI-SPEC.md, 26-RESEARCH.md). Plan executed as written. Notable decisions inherited from the plan and confirmed during execution:

- Period selector via PrimeVue Tabs (not SelectButton) — handles narrow-viewport overflow via `scrollable`
- Period default `'this-month'`, restored from sessionStorage with `isValidPeriod()` whitelist
- Custom range persisted as YYYY-MM-DD strings (timezone-stable)
- Sub-tab persistence intentionally deferred — no sessionStorage key for `activeSubTab`
- 4-state mutually-exclusive v-if chain (loading → invalid range → empty period → data)
- Chart palette fully reactive via `useChartTheme` refs (no manual remount on dark-mode toggle)

## Deviations from Plan

None — both tasks executed exactly as specified. The two commit messages (7a720e9 and fa4c01b) document the full implementation against the plan's must_haves; every truth in 26-03-PLAN.md's `must_haves.truths` block is satisfied in the shipped code.

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered

None.

## Verification Evidence

- `npm run type-check` → exit 0 (vue-tsc --build, no errors) — re-verified 2026-05-22 post-restart
- `npm run test:unit` → 49 tests passed across 5 test files (no regressions) — re-verified 2026-05-22 post-restart
- ExpensesReportsView.vue exists at `src/components/projects/wallecx/ExpensesReportsView.vue` (324 LOC) — FOUND
- ExpensesTab.vue contains `import ExpensesReportsView from './ExpensesReportsView.vue'` and `type SubTab = 'list' | 'reports'` and `<TabPanel value="list">` + `<TabPanel value="reports">` — FOUND
- Both views receive `:expenses` + `:is-loading` from the shell — verified via grep
- Locked requestKey `'expenses-getFullList'` preserved in ExpensesTab.vue — verified
- `defineExpose({ deleteExpense })` preserved in ExpensesTab.vue — verified
- No `ConfirmDialog` mounted in either ExpensesTab.vue or ExpensesReportsView.vue — verified
- No `@vueuse/core` import in either file — verified
- No `chartjs-plugin-datalabels` reference — verified
- No explicit `import Chart` (PrimeVueResolver auto-resolves) — verified
- Commit 7a720e9 (Task 1) — FOUND in git log
- Commit fa4c01b (Task 2) — FOUND in git log

## User Setup Required

None — no external service configuration required. chart.js was added as a runtime dependency in Plan 26-01.

**Manual verification still recommended** (browser-based, not part of automated suite):
- Visual: dark-mode toggle re-renders chart palette without remount/flicker
- Visual: switching periods (This Month → This Quarter → This Year → Custom) updates Grand Total + chart bars
- Visual: custom range with From > To shows inline error, hides chart + Grand Total
- Visual: empty-period state shows Add expense CTA and clicking it opens ManageExpense dialog
- Visual: sub-tab control sits visually nested under the WallecxApp top-level Tabs (44px min-height, tighter padding)

## Next Phase Readiness

- **Phase 26 is complete.** All 3 plans shipped: 26-01 (Wave 1 foundation), 26-02 (Wave 2 shell + ExpensesListView), 26-03 (Wave 3 Reports view + sub-tab wiring). EXP-11, EXP-12, EXP-13 all delivered.
- **Milestone v4.0 — Daily Expense Tracker is complete.** All 4 phases (23 backend foundation, 24 write path, 25 read path, 26 reporting) shipped. Ready for `/gsd-complete-milestone`.
- No blockers, no open todos.
- STATE.md needs an update to reflect Plan 26-03 closure (current `stopped_at` field still says "plan 03 queued").

## Self-Check: PASSED

- ExpensesReportsView.vue exists at `src/components/projects/wallecx/ExpensesReportsView.vue` — FOUND (324 LOC)
- ExpensesTab.vue contains the Tabs/TabPanel wrapper with `value="list"` + `value="reports"` — FOUND
- Commit 7a720e9 (Task 1) — FOUND in git log
- Commit fa4c01b (Task 2) — FOUND in git log
- type-check and test:unit re-verified green post-Windows-restart
- All must_haves truths from 26-03-PLAN.md satisfied
- All STATE.md invariants preserved (requestKey, ConfirmDialog scope, no vueuse-core, defineExpose)
- EXP-11/12/13 marked complete in frontmatter

---
*Phase: 26-reporting-view*
*Completed: 2026-05-22*
*Drafted retroactively on 2026-05-22 (post-Windows-restart) from commits 7a720e9 + fa4c01b — code was shipped before the prior session ended but SUMMARY was never written.*
