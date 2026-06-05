---
phase: 26-reporting-view
phase_number: 26
phase_name: Reporting View
status: locked
created: 2026-05-21
roadmap_goal: Period-tabbed reporting view (This Month / This Quarter / This Year / Custom range) shows grand total and per-category breakdown chart; charts use PrimeVue Chart (Chart.js wrapper).
requirements:
  - EXP-11
  - EXP-12
  - EXP-13
depends_on:
  - 25-read-path-list-view
---

# Phase 26 — Reporting View: Context & Decisions

## Domain

Add a reporting view to Wallecx Expenses that shows total spend and per-category breakdown for a user-selected period (Month / Quarter / Year / Custom). All filtering is client-side from the already-loaded expenses array; no new PocketBase queries. Visualization uses PrimeVue Chart wrapping Chart.js.

## Locked Decisions

### D-26-1 — Placement: nested sub-tabs inside ExpensesTab
`ExpensesTab.vue` gets two internal PrimeVue Tabs: **List** (the Phase 25 read path) and **Reports** (this phase). User stays in the top-level "Expenses" tab; toggles between list and reports via the sub-tab control. Shared `expenses` array from the existing `onMounted` `getFullList` call — zero additional fetches.

**Implication:** ExpensesTab.vue refactors from "the list view" to "the Expenses shell"; the existing List content either moves into the List sub-tab's template, or extracts into a sibling component (`ExpensesListView.vue`). Planner decides the file split. The ExpensesToolbar lives in the **List sub-tab only** — not shown on Reports.

### D-26-2 — Filter scope: Reports filters by period only
The Reports view is **independent** of the ExpensesToolbar's search/category/date-range filters. It only filters by the selected period. Mental model: "What did I spend this month?" — regardless of what's currently filtered in the List sub-tab.

**Implication:** Switching from List → Reports does not carry filter state. Reports has its own period state (see D-26-3 through D-26-5, D-26-9, D-26-10).

### D-26-3 — Period selector UI: horizontal PrimeVue Tabs
Period selector is a horizontal PrimeVue Tabs control: `[ This Month | This Quarter | This Year | Custom ]`. Same component family as the parent List/Reports tabs but smaller scale. Touch-friendly on mobile (44px tap targets).

### D-26-4 — Period boundaries: calendar (NOT AU fiscal)
- **This Month** = current calendar month (e.g., May 1 – May 31)
- **This Quarter** = current calendar quarter (Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec)
- **This Year** = current calendar year (Jan 1 – Dec 31)

Rationale: Wallecx is a personal Daily Expense Tracker; calendar boundaries match most consumer apps and the user's day-to-day mental model. AU fiscal year (Jul–Jun) is not used in v4.0. If a future phase needs FY support, it ships as a separate user preference — not Phase 26.

**Implementation:** use `dayjs().startOf('month' | 'quarter' | 'year')` and `.endOf(...)` for boundary math.

### D-26-5 — Custom range: inline DatePicker pair under the selector when "Custom" is active
When the user selects the "Custom" tab, two PrimeVue DatePickers (From / To) appear directly below the period selector. Same component pattern as ExpensesToolbar's date-range pickers — zero new UI vocabulary. Hidden when any other period tab is active.

**Defaults on switching to Custom:** From = first day of current month, To = today (planner's call if a better default emerges in research).

### D-26-6 — Chart type: horizontal bar chart
Per-category breakdown is a **horizontal** bar chart. Categories on Y-axis, dollar amount on X-axis. Bars sorted by spend descending (largest at top). Rationale: long category names stay readable; scales well to many categories without label collision; easy visual ranking.

PrimeVue Chart component (`<Chart type="bar">` with `indexAxis: 'y'` in Chart.js options).

### D-26-7 — Categories: all with non-zero spend
Show **every** category that has at least one expense in the period. Zero-spend categories are filtered out (matches ROADMAP success criterion #3). No top-N + "Other" bucketing — the default category set is small enough (7 defaults + user customs) that bucketing is unnecessary.

### D-26-8 — Chart labels: absolute amount only
Each bar is labeled with its dollar amount (`$420.00`). No percentage labels on bars. Grand Total displayed separately and prominently (see D-26-12) — user can eyeball share by bar length.

Currency formatting via the existing `formatCurrency` helper from `@/lib/wallecx/currency`.

### D-26-9 — Default period: This Month
First visit to the Reports sub-tab defaults to "This Month". Most actionable for daily expense tracking — "what have I spent this month" is the primary question users open the report for.

### D-26-10 — Period persistence: sessionStorage key `wallecx:expense-period`
Persist the selected period across reloads (within the browser session) under `wallecx:expense-period`. Same pattern as `wallecx:expense-sort` from Phase 25. Survives F5; clears on tab close.

**Custom-range dates** also persisted, under `wallecx:expense-period-from` and `wallecx:expense-period-to` (ISO date strings).

**Whitelist validation on read:** `VALID_PERIODS = ['this-month', 'this-quarter', 'this-year', 'custom']` — invalid stored values fall back to default (mirrors Phase 25's `VALID_SORT_MODES` pattern).

### D-26-11 — Empty period state: hide chart, centered icon + message
When the selected period has zero expenses: **hide the Grand Total and the chart entirely**. Show a centered empty state:
- Icon (e.g., `mdi:chart-bar-stacked` with reduced opacity / brand color)
- Heading: `No expenses in this period.`
- Sub-text: `Try another period or add an expense to get started.`
- Optional CTA: `Add expense` button → opens ManageExpense (same handler as List sub-tab's empty state)

Matches the Phase 25 "No expenses yet" empty state pattern (centered, brand icon, copy + button).

### D-26-12 — Grand Total: large prominent number above the chart
After the period selector (and DatePicker pair if Custom), render the Grand Total as a hero element:
- Small label above: `Total spend — [Period name]` (e.g., "Total spend — May 2026", "Total spend — Q2 2026", "Total spend — 2026", "Total spend — Apr 1 – May 31, 2026")
- Large number below: formatted via `formatCurrency` (e.g., `$1,234.56`)

Then the chart below. Hierarchy: period selector → total (hero) → chart.

**Period name format** (suggested, planner can adjust):
- This Month → `MMM YYYY` ("May 2026")
- This Quarter → `Q[N] YYYY` ("Q2 2026")
- This Year → `YYYY` ("2026")
- Custom → `MMM D – MMM D, YYYY` ("Apr 1 – May 31, 2026"); if From and To span years, include both years

---

## Locked Constraints (carried from prior phases)

- **No new Pinia store** — Reports state lives inside ExpensesTab.vue or its sub-component (Phase 22 / v2.0 invariant: each tab owns its own state)
- **No new PocketBase queries** — Reports reads the same `expenses.value` array loaded by `onMounted` in ExpensesTab.vue (v1.2 invariant)
- **Reactive instant filtering** — period change recomputes total + chart synchronously; no debounce (Phase 25 confirmed `@vueuse/core` not installed)
- **Dark mode via CSS variables** — chart colors must use the existing `--color-brand-*` and category theme tokens; light/dark mode swap is automatic via `.my-app-dark` class (v3.0)
- **`ConfirmDialog` stays at WallecxApp.vue shell level** — N/A for Reports (no destructive actions in this phase)
- **Currency formatting via `formatCurrency`** from `@/lib/wallecx/currency`
- **dayjs for date math** — already imported in ExpensesTab.vue

---

## New Dependency

- **`chart.js`** — peer dependency of PrimeVue Chart, not currently in `package.json`. Add via `npm install chart.js`. Pin to the major version PrimeVue 4.3.x supports (research confirms exact version; Chart.js 4.x is the current generation).

PrimeVue Chart itself (`primevue/chart`) is already available via the installed `primevue@4.3.7` package — just needs the auto-import resolver entry (already configured via `PrimeVueResolver` in `vite.config.ts`).

---

## Open Questions for Research / Planning

These are NOT user decisions — they're for the researcher and planner to resolve:

1. **File structure** — Does ExpensesTab.vue host both sub-tabs inline (template gets bigger), or do we extract `ExpensesListView.vue` and `ExpensesReportsView.vue` siblings with ExpensesTab.vue as a thin shell? Planner picks based on file size impact.
2. **Chart.js theme integration** — Best pattern for reading `--color-brand-*` tokens into Chart.js dataset colors. Likely involves reading computed styles or maintaining a theme color array. Researcher investigates.
3. **Chart dark mode** — How PrimeVue Chart handles `.my-app-dark` class. Does it auto-react to theme switch, or do we need to recompute colors via a `watch` on `useTheme()`?
4. **Custom range validation** — Behavior when From > To: disable Apply, swap silently, show inline error? Planner decides UX.
5. **Sub-tab persistence** — Does the List/Reports sub-tab selection itself persist across reloads (e.g., `wallecx:expense-subtab`)? Not user-decided; planner can add this as a polish item or defer.
6. **Period selector mobile layout** — At narrow viewports the 4 period tabs may need to wrap or scroll horizontally. Researcher checks PrimeVue Tabs responsive behavior.

---

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 26 entry (goal + success criteria)
- `.planning/REQUIREMENTS.md` — EXP-11, EXP-12, EXP-13
- `.planning/PROJECT.md` — locked architectural principles (no new store, calendar boundaries implied)
- `.planning/phases/25-read-path-list-view/25-CONTEXT.md` — sessionStorage pattern (`wallecx:expense-sort`), filter pipeline
- `.planning/phases/25-read-path-list-view/25-02-PLAN.md` — ExpensesTab.vue structure being extended here
- `.planning/phases/25-read-path-list-view/25-RESEARCH.md` — `@vueuse/core` not installed (no debounce), category source derivation
- `.planning/phases/22-mobile-layouts/` (if exists) — useIsMobile composable usage pattern
- `src/components/projects/wallecx/WallecxApp.vue` — top-level Tabs shell (model for nested Tabs)
- `src/components/projects/wallecx/ExpensesTab.vue` — the host file for sub-tabs
- `src/components/projects/wallecx/ExpensesToolbar.vue` — DatePicker pattern reused for Custom range
- `src/lib/wallecx/currency.ts` — `formatCurrency` helper
- PrimeVue Chart docs: `https://primevue.org/chart/` (researcher will fetch latest)
- Chart.js docs: `https://www.chartjs.org/docs/latest/` (researcher will fetch latest)

---

## Deferred Ideas (out of scope)

- **AU fiscal year toggle** — captured under "future user preferences"; not Phase 26
- **Year-over-year / period-over-period comparison** — separate phase candidate (e.g., "May 2026 vs May 2025 — up 12%")
- **Export report as CSV / PDF** — separate phase candidate (mirrors potential vaccination/membership export work)
- **Budget targets per category** — out of v4.0 scope; could be a v4.1 enhancement
- **Drill-down: tap a bar to see filtered expense list** — interesting but adds a new interaction surface; mark as candidate for follow-up phase
- **Top-N + Other bucketing** — explicitly rejected (D-26-7); revisit only if user category list grows beyond ~15

---

## Status

Decisions locked at 2026-05-21. Ready for `/gsd-research-phase 26` (recommended — non-trivial: PrimeVue Chart + Chart.js dark mode integration) and then `/gsd-plan-phase 26`. Alternatively, `/gsd-plan-phase 26` runs research inline if `workflow.research: true` (it is).
