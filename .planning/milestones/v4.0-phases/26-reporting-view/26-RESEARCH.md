---
phase: 26-reporting-view
phase_number: 26
phase_name: Reporting View
status: complete
created: 2026-05-22
researched: 2026-05-22
domain: Vue 3 / PrimeVue 4 — chart.js integration, period-tabbed reporting, dark-mode canvas theming
confidence: HIGH
depends_on:
  - 25-read-path-list-view
requirements:
  - EXP-11
  - EXP-12
  - EXP-13
---

# Phase 26: Reporting View — Research

**Researched:** 2026-05-22
**Domain:** Vue 3 / PrimeVue 4 — chart.js integration, period-tabbed reporting, dark-mode canvas theming
**Confidence:** HIGH

---

## Summary

Phase 26 adds a "Reports" sub-tab inside `ExpensesTab.vue` that renders a period-tabbed (Month / Quarter / Year / Custom) grand total + per-category horizontal bar chart. All filtering is client-side over the already-loaded `expenses.value` array — zero new PocketBase queries (v1.2 invariant upheld).

The recommended implementation **extracts** the existing Phase 25 list content into a sibling `ExpensesListView.vue` and adds a new `ExpensesReportsView.vue`, with `ExpensesTab.vue` becoming a thin **shell** that owns data and dialogs and routes between two PrimeVue Tab panels (List | Reports). Rationale: `ExpensesTab.vue` is already 312 LOC; inlining Reports would push it to 500-600 LOC and mix three concerns (data load, list view, report view) in one file.

**Three load-bearing technical findings** in this research:

1. **PrimeVue `Chart.vue` imports `chart.js/auto` dynamically** (`node_modules/primevue/chart/Chart.vue` line 41). This means `chart.js` MUST be installed as a project dependency, but it's pulled into its own async chunk by Vite — no synchronous bundle weight added until the Reports tab is opened. `chart.js@4.5.1` is current (npm registry, 2026-05-22).

2. **PrimeVue Chart deep-watches `data` and `options`** and calls `reinit()` (full destroy + reconstruct) on every change. This means: (a) Vue reactivity Just Works — we can use a `computed` for `chartData` and `chartOptions` and re-renders happen automatically; (b) we do NOT need to call any imperative `chartRef.refresh()`. Watch-on-mutate also covers dark-mode toggle if we make `chartOptions` depend on a reactive theme version.

3. **dayjs `startOf('quarter')` / `endOf('quarter')` SILENTLY DOES NOTHING without the `quarterOfYear` plugin.** Verified by Node REPL on 2026-05-22: bare dayjs returns the original timestamp unchanged — no error, no warning. This is the single most likely correctness defect for this phase. The plugin must be registered globally once (e.g., in `src/lib/wallecx/period.ts` on first import) before any quarter math runs.

**Primary recommendation:** Use the three-file split (`ExpensesTab.vue` shell, `ExpensesListView.vue`, `ExpensesReportsView.vue`); pass `expenses`, `isLoading`, and a parent-owned `openManage(null)` handler down as props (no provide/inject); build chart colors via a `useChartTheme()` composable that reads CSS variables and recomputes on `.my-app-dark` mutations; register `dayjs/plugin/quarterOfYear` in a new `src/lib/wallecx/period.ts` helper module.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (12)

**Placement & filter scope**
- D-26-1: ExpensesTab.vue gets two internal PrimeVue Tabs: **List** (Phase 25) and **Reports** (this phase). Shared `expenses` array from the existing `onMounted` `getFullList` — zero additional fetches. ExpensesToolbar lives in the List sub-tab only.
- D-26-2: Reports filters by **period only** — independent of ExpensesToolbar's search/category/date-range. Switching List ↔ Reports does NOT carry filter state.

**Period selector**
- D-26-3: Horizontal PrimeVue Tabs: `[ This Month | This Quarter | This Year | Custom ]`. Same component family as parent. 44px tap targets.
- D-26-4: Calendar boundaries (NOT AU fiscal). Use `dayjs().startOf('month' | 'quarter' | 'year')` and `.endOf(...)`.
- D-26-5: Custom range = two PrimeVue DatePickers (From / To) appearing **inline under** the period selector when "Custom" is active. Defaults: From = first day of current month, To = today.

**Chart**
- D-26-6: **Horizontal bar chart**. Categories on Y-axis, dollar amount on X-axis. Bars sorted by spend descending (largest at top). PrimeVue `<Chart type="bar">` with `indexAxis: 'y'`.
- D-26-7: Show **every** category with at least one expense in the period. Zero-spend categories filtered out. No Top-N + "Other" bucketing.
- D-26-8: Per-bar label = absolute dollar amount only (`$420.00`). No percentage labels.

**State, defaults, persistence**
- D-26-9: Default period on first visit = **This Month**.
- D-26-10: Persist selected period under sessionStorage key `wallecx:expense-period`. Persist Custom From / To under `wallecx:expense-period-from` / `wallecx:expense-period-to` (ISO date strings). `VALID_PERIODS = ['this-month', 'this-quarter', 'this-year', 'custom']`; invalid stored values fall back to default.

**Empty state & hero**
- D-26-11: Zero expenses in period → **hide** chart + grand total; show centered empty state (icon `mdi:chart-bar-stacked`, heading "No expenses in this period.", body, "Add expense" CTA).
- D-26-12: Grand Total = hero element above chart. Small label "Total spend — {periodName}" above large bold number. Period name format: "May 2026", "Q2 2026", "2026", "Apr 1 – May 31, 2026" (en-dash U+2013).

### Locked Constraints (carried)

- No new Pinia store — Reports state lives inside `ExpensesTab.vue` / its sub-components.
- No new PocketBase queries — reuses `expenses.value` from ExpensesTab.
- Reactive instant filtering — period change is synchronous; no debounce.
- Dark mode via CSS variables + `.my-app-dark` class.
- `ConfirmDialog` stays at WallecxApp.vue shell level (N/A here — no destructive actions).
- Currency via `formatCurrency` from `@/lib/wallecx/currency`.
- dayjs for date math.

### Claude's Discretion (open in CONTEXT.md)

1. File structure (this RESEARCH recommends three-file split — see §File structure decision).
2. Chart.js theme integration approach (this RESEARCH recommends `useChartTheme` composable — see §Dark mode strategy).
3. Chart dark-mode mechanism (this RESEARCH locks: manual `MutationObserver` since `@vueuse/core` not installed).
4. Custom range validation behavior (UI-SPEC already resolved: inline error, no Apply button, instant apply).
5. Sub-tab persistence (UI-SPEC defers; this RESEARCH defers to planner as polish item).
6. Period selector mobile layout (UI-SPEC already resolved: PrimeVue `scrollable` prop on Tabs).

### Deferred Ideas (OUT OF SCOPE)

- AU fiscal year toggle
- Year-over-year / period-over-period comparison
- Export report as CSV / PDF
- Budget targets per category
- Drill-down: tap a bar → see filtered expense list
- Top-N + "Other" bucketing (explicitly rejected by D-26-7)
- `chartjs-plugin-datalabels` (UI-SPEC: not in v1)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-11 | Period-tabbed reporting view (Month / Quarter / Year / Custom) inside `ExpensesTab.vue`. | Locked as sub-tab via D-26-1. PrimeVue Tabs nested usage verified safe (see §Stack additions). dayjs period math requires `quarterOfYear` plugin (§dayjs period math — CRITICAL). |
| EXP-12 | Each period view shows the grand total spend for that period. | Pure `computed` reduce over a `periodExpenses` computed — synchronous, in-memory. `formatCurrency()` already installed. |
| EXP-13 | Each period view shows per-category breakdown chart (PrimeVue Chart / Chart.js wrapper). | PrimeVue `Chart` is auto-imported via PrimeVueResolver (verified — see §Stack additions). `chart.js@4.5.1` MUST be added to `dependencies`. PrimeVue Chart's deep-watch makes reactivity automatic. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data load (`getFullList`) | `ExpensesTab.vue` (shell) | PocketBase (server) | Phase 25 invariant: tab owns data; no new fetch in Phase 26 |
| Sub-tab routing (List / Reports) | `ExpensesTab.vue` shell template | — | Shell-only concern; no state lives in children |
| List rendering + filtering | `ExpensesListView.vue` (new — extracted Phase 25 content) | — | Receives `expenses` + `isLoading` as props; owns sort/search/filter local state |
| Reports computation (period filter + totals + chart data) | `ExpensesReportsView.vue` (new) | — | Receives `expenses` + `isLoading` as props; owns period local state |
| Chart rendering | `<Chart type="bar">` inside ExpensesReportsView | Chart.js (via dynamic import inside PrimeVue Chart) | PrimeVue Chart handles canvas lifecycle |
| Period boundary math | `src/lib/wallecx/period.ts` (new helper module) | dayjs + `quarterOfYear` plugin | Pure functions; testable; isolates plugin registration |
| Dark-mode theme reactivity for canvas | `useChartTheme()` composable (new, in ExpensesReportsView or `src/composables/`) | `MutationObserver` on `<body>` | Canvas can't read CSS vars; needs JS-side theme tracking |
| Receipt preview + delete + manage dialogs | `ExpensesTab.vue` shell | — | Stays at shell; Reports has no per-record interactions |

---

## Stack additions

### Required new dependency

| Library | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `chart.js` | `^4.5.1` [VERIFIED: `npm view chart.js dist-tags` returned `latest: '4.5.1'` on 2026-05-22] | Runtime dependency of PrimeVue `<Chart>`. PrimeVue Chart performs `import('chart.js/auto')` at component mount [VERIFIED: `node_modules/primevue/chart/Chart.vue` line 41]. Without `chart.js` installed, the dynamic import resolves to nothing and the chart silently fails to render. | Industry-standard canvas charting library; bundled by PrimeVue docs/examples. |

**Install command:**
```bash
npm install chart.js
```

**PrimeVue 4.3.7 peer dependency on chart.js:** NOT declared. PrimeVue treats it as a soft/optional dep — the dynamic `import('chart.js/auto')` works if the module is resolvable; otherwise PrimeVue silently no-ops. This means `npm install primevue` does NOT pull chart.js in; we must add it explicitly. [VERIFIED: inspection of `node_modules/primevue/chart/index.mjs` `initChart()` method.]

**Bundle impact:** chart.js/auto is ~70 KB minified+gzipped; via Vite's automatic code-splitting on dynamic `import()` it lands in its own chunk that loads lazily only when the Reports tab is first opened. No effect on initial page load.

### Required new dayjs plugin

| Plugin | Why | Installed |
|--------|-----|-----------|
| `dayjs/plugin/quarterOfYear` | dayjs's `startOf('quarter')` and `endOf('quarter')` units silently no-op without this plugin [VERIFIED: Node REPL test — `dayjs().startOf('quarter')` returned the current timestamp unchanged, NOT 2026-04-01]. Required by D-26-4. | Ships inside the already-installed `dayjs@^1.11.18` package; no separate npm install needed — `import quarterOfYear from 'dayjs/plugin/quarterOfYear'` works immediately. [VERIFIED: same node REPL test succeeded after `dayjs.extend(quarterOfYear)`.] |

**Registration pattern (planner — put this at the top of `src/lib/wallecx/period.ts`):**
```typescript
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
dayjs.extend(quarterOfYear)
```

The `dayjs.extend()` call is idempotent — extending the same plugin twice is a no-op. Safe to call at module top level. Other parts of the codebase do NOT currently extend dayjs plugins [VERIFIED: `grep "from ['\"]dayjs/plugin"` in `src/` returned no matches], so this is the first plugin registration in the project.

### Existing stack confirmed

| Library | Version | Notes |
|---------|---------|-------|
| Vue 3 | ^3.5.18 [VERIFIED: package.json] | Composition API + `<script setup lang="ts">` |
| PrimeVue 4 Aura | ^4.3.7 [VERIFIED: package.json] | `Chart`, `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel`, `DatePicker`, `Button`, `Skeleton` — all auto-imported via `PrimeVueResolver` in `vite.config.ts` line 23 [VERIFIED] |
| dayjs | ^1.11.18 [VERIFIED: package.json] | Already used in `ExpensesTab.vue` line 8 |
| `@vueuse/motion` | ^3.0.3 [VERIFIED: package.json] | Animation only; **does NOT** provide `useMutationObserver` |
| `@vueuse/core` | NOT installed [VERIFIED: package.json] | Phase 25 RESEARCH §critical finding still applies — fall back to native `MutationObserver` for dark-mode tracking |
| Iconify | `iconify-icon@^3.0.0` [VERIFIED: package.json] | `mdi:chart-bar-stacked` for empty state |

### Auto-import resolver coverage (verified)

PrimeVue `<Chart>` is registered through `PrimeVueResolver()` in `vite.config.ts`. The resolver maps tag `<Chart>` to `primevue/chart`. No manual `import Chart from 'primevue/chart'` is needed in the SFCs. [VERIFIED: PrimeVueResolver source includes `chart` in its component list; existing components like `<Tabs>` and `<DatePicker>` rely on the same mechanism in this codebase without explicit imports.]

---

## File structure decision

**RECOMMENDATION: three-file split** — `ExpensesTab.vue` becomes a thin shell, with new sibling components `ExpensesListView.vue` (extracted Phase 25 content) and `ExpensesReportsView.vue` (new). Each view receives the parent's data via props.

### LOC estimate (concrete)

| Path A — inline (everything in ExpensesTab.vue) | LOC |
|---|----|
| Current ExpensesTab.vue [VERIFIED: `wc -l`] | 312 |
| + Reports template (period Tabs + Custom DatePickers + Grand Total block + Chart + empty state) | ~120 |
| + Reports script (periodExpenses computed, grandTotal computed, chartData computed, chartOptions computed, useChartTheme integration, sessionStorage persistence for period + custom-from/to, watchers) | ~150 |
| + scoped styles for nested tabs differentiation (`:deep(.p-tabs-tablist .p-tab)`) | ~25 |
| **Total** | **~607** |

| Path B — three-file split (recommended) | LOC |
|---|----|
| ExpensesTab.vue (data load + sub-tab Tabs + manage/preview dialogs + delete handler) | ~180 |
| ExpensesListView.vue (Phase 25 content extracted: toolbar + filter pipeline + list `v-for` + empty states) | ~210 |
| ExpensesReportsView.vue (period selector + DatePickers + Grand Total + Chart + empty state) | ~270 |
| **Total** | **~660** (similar gross LOC; better separation) |

### Rationale for three-file split

1. **Single-Responsibility Principle.** Phase 22 v2.0 invariant says "each tab owns its own state" — but it doesn't say "each tab is one file." When a tab has two distinct views (list of records vs. analytical report) with two distinct local-state shapes (5 filter refs vs. 2 period refs + 2 custom-date refs), splitting reduces cognitive load.
2. **Phase 25 mirror.** Phase 25 already established the precedent of extracting concerns: `ExpenseItem.vue` (row component) + `ExpensesToolbar.vue` (toolbar component) live alongside `ExpensesTab.vue`. Adding two view components follows the same pattern.
3. **Inlined ExpensesTab.vue at ~607 LOC is too dense.** The largest existing tab is `VaccinationsTab.vue` at 472 LOC and it already requires careful navigation. 607+ LOC in a single SFC with three distinct concern groups (data load, list, report) is the boundary where reviewers and the executor agent start making coordination mistakes.
4. **Sub-tab template fits naturally in a shell.** A 180-line shell file that shows `<Tabs>` + `<TabPanel><ExpensesListView ... /></TabPanel>` + `<TabPanel><ExpensesReportsView ... /></TabPanel>` + dialogs reads cleanly. Inlining the children's full templates inside `<TabPanel>` slots produces visually nested template depth (Tabs > TabPanels > TabPanel > view content > nested Tabs > nested TabList > ...) — hard to navigate.
5. **Empty-state CTA wiring stays clean.** Both views' "Add expense" empty-state CTAs call `openManage(null)`. With a shell that owns the dialog, both children emit a `request-add-expense` event handled by the shell. Concise contract.

### File structure (recommended)

```
src/components/projects/wallecx/
├── ExpensesTab.vue              # MODIFY (Phase 25 → Phase 26 shell)
│   - Data load (onMounted + getFullList)
│   - Two sub-tabs: <Tabs v-model:value="activeSubTab"> List | Reports
│   - Dialogs: ManageExpense, AttachmentPreview (Dialog/Drawer)
│   - Handlers: deleteExpense, openManage, openReceiptPreview, onCreated, onUpdated
│   - Exposes deleteExpense (kept from Phase 24 stub)
│
├── ExpensesListView.vue         # NEW (extract Phase 25 content)
│   Props: expenses: Expenses[], isLoading: boolean
│   Emits: edit, delete, preview, request-add-expense
│   Owns: searchQuery, sortMode, selectedCategories, dateFrom, dateTo,
│          SORT_STORAGE_KEY restoration, filteredSortedExpenses computed,
│          ExpensesToolbar render, ExpenseItem v-for, empty states
│
├── ExpensesReportsView.vue      # NEW (this phase)
│   Props: expenses: Expenses[], isLoading: boolean
│   Emits: request-add-expense
│   Owns: period ref ('this-month' | ... | 'custom'),
│          customFrom, customTo refs,
│          period sessionStorage persistence,
│          periodExpenses computed,
│          grandTotal computed,
│          categoryTotals computed (sorted desc),
│          chartData computed,
│          chartOptions computed (depends on useChartTheme),
│          dateRangeError computed (for custom range invalid case),
│          formatPeriodLabel() (or imported from period.ts)
│
├── ExpensesToolbar.vue          # UNCHANGED
├── ExpenseItem.vue              # UNCHANGED
├── ManageExpense.vue            # UNCHANGED
└── AttachmentPreview.vue        # UNCHANGED

src/lib/wallecx/
├── period.ts                    # NEW
│   - dayjs.extend(quarterOfYear) at top
│   - getPeriodRange(period, customFrom, customTo) → { from: Dayjs, to: Dayjs }
│   - formatPeriodLabel(period, customFrom, customTo) → string
│   - VALID_PERIODS constant
│   - PERIOD_STORAGE_KEY, PERIOD_FROM_STORAGE_KEY, PERIOD_TO_STORAGE_KEY constants

src/composables/
└── useChartTheme.ts             # NEW
   - Returns reactive { paletteColors, axisColor, gridColor, mutedColor, headingColor, surfaceColor }
   - Reads getComputedStyle(document.documentElement).getPropertyValue('--color-chart-N') etc.
   - MutationObserver on document.body class attribute → recompute
   - onBeforeUnmount → observer.disconnect()
```

---

## Component contracts

### `ExpensesTab.vue` (modify — becomes shell)

```typescript
// Script: data + dialogs + sub-tab state only
const expenses = ref<Expenses[]>([])         // unchanged
const isLoading = ref(false)                 // unchanged
const showManage = ref(false)                // unchanged
const manageRecord = ref<Expenses | null>(null)
const showPreview = ref(false)
const previewRecord = ref<Expenses | null>(null)
const previewToken = ref<string>('')
const confirm = useConfirm()
const isMobile = useIsMobile()

// NEW: sub-tab state
const SUB_TAB_KEY = 'wallecx:expense-subtab'  // OPTIONAL — see Open Questions
const VALID_SUB_TABS = ['list', 'reports'] as const
const activeSubTab = ref<'list' | 'reports'>('list')

// Handlers (unchanged: openManage, onCreated, onUpdated, deleteExpense, openReceiptPreview)

defineExpose({ deleteExpense })  // unchanged — kept from Phase 24 stub
```

```html
<!-- Template skeleton -->
<div>
  <div class="flex items-center justify-between mb-4">
    <h2>Expenses</h2>
    <Button label="Add Expense" icon="pi pi-plus" size="small" @click="openManage(null)" />
  </div>

  <Tabs v-model:value="activeSubTab" class="wallecx-sub-tabs">
    <TabList>
      <Tab value="list">List</Tab>
      <Tab value="reports">Reports</Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="list">
        <ExpensesListView
          :expenses="expenses"
          :is-loading="isLoading"
          @edit="openManage"
          @delete="deleteExpense"
          @preview="openReceiptPreview"
          @request-add-expense="openManage(null)"
        />
      </TabPanel>
      <TabPanel value="reports">
        <ExpensesReportsView
          :expenses="expenses"
          :is-loading="isLoading"
          @request-add-expense="openManage(null)"
        />
      </TabPanel>
    </TabPanels>
  </Tabs>

  <ManageExpense v-model:visible="showManage" v-model:record="manageRecord"
                 @created="onCreated" @updated="onUpdated" />
  <Dialog v-if="!isMobile" v-model:visible="showPreview" ...>
    <AttachmentPreview ... />
  </Dialog>
  <Drawer v-else v-model:visible="showPreview" position="bottom" ...>
    <AttachmentPreview ... />
  </Drawer>
</div>
```

### `ExpensesListView.vue` (new — extracted)

```typescript
const props = defineProps<{
  expenses: Expenses[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  edit: [record: Expenses]
  delete: [record: Expenses]
  preview: [record: Expenses]
  'request-add-expense': []
}>()

// Owns: searchQuery, sortMode, selectedCategories, dateFrom, dateTo
// Owns: SORT_STORAGE_KEY = 'wallecx:expense-sort' (moved from ExpensesTab — same key)
// Owns: VALID_SORT_MODES whitelist
// Owns: filteredSortedExpenses computed (reads props.expenses)
// Owns: categoryOptions computed (reads props.expenses — NOT filteredSortedExpenses; Phase 25 Pitfall 3)
// Owns: clearFilters function
// Empty-state CTA "Add expense" → emit('request-add-expense')
```

### `ExpensesReportsView.vue` (new — this phase)

```typescript
import { getPeriodRange, formatPeriodLabel, VALID_PERIODS,
         PERIOD_STORAGE_KEY, PERIOD_FROM_STORAGE_KEY, PERIOD_TO_STORAGE_KEY }
  from '@/lib/wallecx/period'
import { useChartTheme } from '@/composables/useChartTheme'
import { formatCurrency } from '@/lib/wallecx/currency'
import dayjs from 'dayjs'

const props = defineProps<{
  expenses: Expenses[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'request-add-expense': []
}>()

type Period = 'this-month' | 'this-quarter' | 'this-year' | 'custom'

const period = ref<Period>('this-month')
const customFrom = ref<Date | null>(null)
const customTo = ref<Date | null>(null)

// On mount: restore from sessionStorage with whitelist validation
// On change: persist (watch period, watch customFrom, watch customTo)

const { paletteColors, axisColor, gridColor, mutedColor,
        headingColor, surfaceColor, dividerColor } = useChartTheme()

// Validation
const dateRangeError = computed<string | null>(() => {
  if (period.value !== 'custom') return null
  if (!customFrom.value || !customTo.value) return null
  if (dayjs(customFrom.value).isAfter(dayjs(customTo.value), 'day')) {
    return 'From date must be on or before To date.'
  }
  return null
})

// Period range
const periodRange = computed(() => getPeriodRange(period.value, customFrom.value, customTo.value))

// Filter expenses to period (string comparison on YYYY-MM-DD — same approach as Phase 25)
const periodExpenses = computed<Expenses[]>(() => {
  if (dateRangeError.value) return []
  const fromStr = periodRange.value.from.format('YYYY-MM-DD')
  const toStr = periodRange.value.to.format('YYYY-MM-DD')
  return props.expenses.filter(e => e.expense_date >= fromStr && e.expense_date <= toStr)
})

const grandTotal = computed(() =>
  periodExpenses.value.reduce((sum, e) => sum + e.amount, 0)
)

// Group by category, sum, sort desc
const categoryTotals = computed<{ category: string; total: number }[]>(() => {
  const map = new Map<string, number>()
  for (const e of periodExpenses.value) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
  }
  return Array.from(map, ([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
})

const periodNameLabel = computed(() =>
  formatPeriodLabel(period.value, customFrom.value, customTo.value)
)

const chartData = computed(() => ({
  labels: categoryTotals.value.map(c => c.category),
  datasets: [{
    label: 'Spend',
    data: categoryTotals.value.map(c => c.total),
    backgroundColor: categoryTotals.value.map((_, i) => paletteColors.value[i % 8]),
    borderRadius: 4,
    barThickness: 'flex',
    minBarLength: 20,
  }],
}))

const chartOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200,
  },
  layout: { padding: { left: 8 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      backgroundColor: surfaceColor.value,
      titleColor: headingColor.value,
      bodyColor: axisColor.value,
      borderColor: dividerColor.value,
      borderWidth: 1,
      callbacks: {
        label: (ctx: { parsed: { x: number } }) => formatCurrency(ctx.parsed.x),
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: mutedColor.value,
        font: { family: 'Rubik', size: 12, weight: '400' },
        callback: (value: number | string) => formatCurrency(Number(value)),
      },
      grid: { color: gridColor.value },
      border: { color: dividerColor.value },
    },
    y: {
      ticks: {
        color: axisColor.value,
        font: { family: 'Rubik', size: 12, weight: '400' },
      },
      grid: { display: false },
      border: { color: dividerColor.value },
    },
  },
}))

const chartHeightPx = computed(() =>
  Math.max(220, categoryTotals.value.length * 36)
)
```

```html
<template>
  <div class="pt-2">
    <!-- Period selector -->
    <Tabs v-model:value="period" scrollable class="wallecx-period-tabs">
      <TabList>
        <Tab value="this-month">This Month</Tab>
        <Tab value="this-quarter">This Quarter</Tab>
        <Tab value="this-year">This Year</Tab>
        <Tab value="custom">Custom</Tab>
      </TabList>
    </Tabs>

    <!-- Custom range (only when period === 'custom') -->
    <div v-if="period === 'custom'" class="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2 mt-3">
      <div class="flex flex-col gap-1 flex-1 sm:flex-none sm:w-40">
        <label class="text-xs" style="color: var(--color-typo-muted)">From</label>
        <DatePicker v-model="customFrom" placeholder="From date" dateFormat="dd M yy"
                    class="w-full min-h-[44px]" />
      </div>
      <div class="flex flex-col gap-1 flex-1 sm:flex-none sm:w-40">
        <label class="text-xs" style="color: var(--color-typo-muted)">To</label>
        <DatePicker v-model="customTo" placeholder="To date" dateFormat="dd M yy"
                    class="w-full min-h-[44px]" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="mt-6 flex flex-col items-center gap-3">
      <Skeleton width="12rem" height="2.5rem" />
      <Skeleton width="8rem" height="3rem" />
      <Skeleton width="100%" height="220px" class="rounded" />
    </div>

    <!-- Invalid range -->
    <p v-else-if="dateRangeError"
       role="alert"
       class="text-sm text-center mt-6"
       style="color: var(--color-status-error)">
      {{ dateRangeError }}
    </p>

    <!-- Empty period -->
    <div v-else-if="periodExpenses.length === 0"
         class="flex flex-col items-center py-12 gap-3">
      <iconify-icon icon="mdi:chart-bar-stacked" width="48" height="48"
                    style="color: var(--color-brand-primary)" aria-hidden="true" />
      <p class="text-sm font-bold" style="color: var(--color-typo-heading)">
        No expenses in this period.
      </p>
      <p class="text-sm" style="color: var(--color-typo-muted)">
        Try another period or add an expense to get started.
      </p>
      <Button label="Add expense" icon="pi pi-plus" size="small"
              @click="emit('request-add-expense')" />
    </div>

    <!-- Hero total + chart -->
    <template v-else>
      <div class="flex flex-col items-center gap-1 my-6">
        <span class="text-sm" style="color: var(--color-typo-muted)">
          Total spend — {{ periodNameLabel }}
        </span>
        <span class="text-3xl font-bold" style="color: var(--color-brand-primary)">
          {{ formatCurrency(grandTotal) }}
        </span>
      </div>
      <div class="w-full" :style="{ height: chartHeightPx + 'px' }"
           role="img" :aria-label="`Per-category expense breakdown for ${periodNameLabel}`">
        <Chart type="bar" :data="chartData" :options="chartOptions" class="w-full h-full" />
      </div>
    </template>
  </div>
</template>
```

### `src/lib/wallecx/period.ts` (new helper)

```typescript
import dayjs, { type Dayjs } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

// CRITICAL: must be called before any startOf('quarter') / endOf('quarter') / format('[Q]Q')
// See RESEARCH §dayjs period math.
dayjs.extend(quarterOfYear)

export type Period = 'this-month' | 'this-quarter' | 'this-year' | 'custom'

export const VALID_PERIODS: readonly Period[] =
  ['this-month', 'this-quarter', 'this-year', 'custom'] as const
export const PERIOD_STORAGE_KEY = 'wallecx:expense-period'
export const PERIOD_FROM_STORAGE_KEY = 'wallecx:expense-period-from'
export const PERIOD_TO_STORAGE_KEY = 'wallecx:expense-period-to'

export function isValidPeriod(value: unknown): value is Period {
  return typeof value === 'string' && (VALID_PERIODS as readonly string[]).includes(value)
}

/**
 * Returns the [from, to] Dayjs range for the selected period. For 'custom',
 * caller is responsible for passing non-null customFrom and customTo; if
 * either is null, falls back to a one-day range at today.
 */
export function getPeriodRange(
  period: Period,
  customFrom: Date | null,
  customTo: Date | null,
): { from: Dayjs; to: Dayjs } {
  const now = dayjs()
  switch (period) {
    case 'this-month':   return { from: now.startOf('month'),   to: now.endOf('month') }
    case 'this-quarter': return { from: now.startOf('quarter'), to: now.endOf('quarter') }
    case 'this-year':    return { from: now.startOf('year'),    to: now.endOf('year') }
    case 'custom': {
      const from = customFrom ? dayjs(customFrom).startOf('day') : now.startOf('day')
      const to = customTo ? dayjs(customTo).endOf('day') : now.endOf('day')
      return { from, to }
    }
  }
}

/**
 * Returns the human-friendly period label per D-26-12 / UI-SPEC copywriting contract.
 * Uses en-dash (U+2013) for custom-range separator.
 */
export function formatPeriodLabel(
  period: Period,
  customFrom: Date | null,
  customTo: Date | null,
): string {
  const now = dayjs()
  switch (period) {
    case 'this-month':   return now.format('MMMM YYYY')
    case 'this-quarter': return now.format('[Q]Q YYYY')
    case 'this-year':    return now.format('YYYY')
    case 'custom': {
      if (!customFrom || !customTo) return '—'
      const from = dayjs(customFrom)
      const to = dayjs(customTo)
      if (from.isSame(to, 'day')) return from.format('MMM D, YYYY')
      if (from.year() !== to.year())
        return `${from.format('MMM D, YYYY')} – ${to.format('MMM D, YYYY')}`
      if (from.month() !== to.month())
        return `${from.format('MMM D')} – ${to.format('MMM D, YYYY')}`
      return `${from.format('MMM D')} – ${to.format('D, YYYY')}`
    }
  }
}
```

### `src/composables/useChartTheme.ts` (new)

See full implementation in §Dark mode strategy below.

---

## Dark mode strategy

### Problem statement

Chart.js renders to `<canvas>`. CSS variables on the parent DOM node DO NOT propagate to canvas drawing — Chart.js needs literal RGB / hex strings at draw time. When `.my-app-dark` is added to `<body>`, the surrounding DOM auto-updates (CSS handles it), but the canvas keeps its old colors until the chart is re-rendered with new values.

### Solution: `useChartTheme()` composable

A small reactive theme tracker that:
1. Reads `--color-chart-1..8` plus `--color-typo-body`, `--color-typo-muted`, `--color-typo-heading`, `--color-surface-card`, `--color-surface-divider` via `getComputedStyle(document.documentElement)` at construction time.
2. Sets up a `MutationObserver` watching `document.body`'s `class` attribute. When the class list mutates, re-reads all variables and updates the refs.
3. Tears down the observer in `onBeforeUnmount`.

Because PrimeVue Chart deep-watches `options` and calls `reinit()` on change, and our `chartOptions` is a `computed` that reads these refs, the chart re-renders automatically when the theme changes. No imperative refresh call needed.

### Full implementation

```typescript
// src/composables/useChartTheme.ts
import { ref, onMounted, onBeforeUnmount } from 'vue'

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function readPalette(): string[] {
  return [1, 2, 3, 4, 5, 6, 7, 8].map(i => readVar(`--color-chart-${i}`))
}

export function useChartTheme() {
  // Initial values — safe to call synchronously inside setup() since the document
  // and CSS are already parsed by the time a child component mounts.
  const paletteColors = ref<string[]>(readPalette())
  const axisColor = ref<string>(readVar('--color-typo-body'))      // Y-axis ticks
  const mutedColor = ref<string>(readVar('--color-typo-muted'))    // X-axis ticks, period name label
  const headingColor = ref<string>(readVar('--color-typo-heading'))// Tooltip title
  const gridColor = ref<string>(readVar('--color-surface-divider'))// Vertical gridlines, axis border
  const surfaceColor = ref<string>(readVar('--color-surface-card'))// Tooltip background
  const dividerColor = ref<string>(readVar('--color-surface-divider'))

  let observer: MutationObserver | null = null

  function refreshFromDom() {
    paletteColors.value = readPalette()
    axisColor.value     = readVar('--color-typo-body')
    mutedColor.value    = readVar('--color-typo-muted')
    headingColor.value  = readVar('--color-typo-heading')
    gridColor.value     = readVar('--color-surface-divider')
    surfaceColor.value  = readVar('--color-surface-card')
    dividerColor.value  = readVar('--color-surface-divider')
  }

  onMounted(() => {
    // Re-read once on mount in case the dark class was applied after initial parse
    refreshFromDom()
    observer = new MutationObserver(refreshFromDom)
    // Watch both <html> AND <body> class attribute — useTheme.ts (line 13) adds the
    // class to document.documentElement, NOT document.body. [VERIFIED: useTheme.ts]
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    paletteColors, axisColor, mutedColor, headingColor,
    gridColor, surfaceColor, dividerColor,
  }
}
```

### Where the dark class actually lives — IMPORTANT

The project's `useTheme.ts` composable adds `.my-app-dark` to `document.documentElement` (the `<html>` element), not `document.body`. [VERIFIED: `src/composables/useTheme.ts` lines 13–17.]

The UI-SPEC dark-mode-contract example code observes `document.body` — that example is incorrect for this project. The composable above observes BOTH `<html>` and `<body>` for safety (PrimeVue's Aura theme is configured with `darkModeSelector: '.my-app-dark'` in `src/main.ts` line 88, and that selector matches anywhere in the cascade; observing both elements covers any future relocation of the class).

### SSR / hydration

Not applicable — this project is a Vite SPA (no SSR). `getComputedStyle` and `document.body` are always available during component setup.

### Initial-render flicker risk

When `<Chart>` mounts, it asynchronously imports `chart.js/auto` (Promise). By the time the chart first draws, `useChartTheme` has already produced reactive refs synchronously via `getComputedStyle` in `setup()` — so the FIRST render gets the correct theme. No flicker.

The only flicker scenario is if a user toggles dark mode while the chart's `reinit()` Promise is in-flight; the rebuild will then use whichever color was current at the moment `chartOptions` was re-read. Acceptable — the user sees the new theme on the very next mutation.

---

## Chart.js integration patterns

### Component usage — confirmed shape

```html
<Chart type="bar" :data="chartData" :options="chartOptions" class="w-full h-full" />
```

PrimeVue Chart props [VERIFIED: `node_modules/primevue/chart/index.d.ts`]:
- `type: string` — `'bar'` for this phase
- `data: any` — Chart.js DataConfig shape `{ labels: string[], datasets: [...] }`
- `options: any` — Chart.js Options object
- `plugins: any` — optional Chart.js plugins (not used; we don't add `chartjs-plugin-datalabels` per UI-SPEC)
- `width: number = 300`, `height: number = 150` — only used when the parent has no constrained size. With `maintainAspectRatio: false` and a parent `:style="{ height: chartHeightPx + 'px' }"`, the chart fills the parent.
- `canvasProps: any` — pass-through HTML attributes for the `<canvas>` element

### Re-render lifecycle

PrimeVue Chart has these key watchers [VERIFIED: `node_modules/primevue/chart/Chart.vue` lines 14–30]:
```javascript
watch: {
  data: { handler() { this.reinit() }, deep: true },
  type:    () => this.reinit(),
  options: () => this.reinit(),
}
```

`reinit()` calls `initChart()`, which:
1. Destroys the existing Chart.js instance (`this.chart.destroy()`)
2. Re-runs `import('chart.js/auto')`
3. Constructs a new `Chart` with current `type`, `data`, `options`, `plugins`

So whenever Vue's reactivity dirties `chartData` or `chartOptions`, the chart automatically tears down and rebuilds. The dynamic import after the first call is cached by the module system, so subsequent `reinit()`s are cheap (no network).

**Memory:** PrimeVue's `beforeUnmount` calls `this.chart.destroy()` [VERIFIED: same file]. So Vue's standard component teardown disposes Chart.js properly — no leak.

### Reading CSS variables INTO Chart.js dataset colors

Pattern (from `useChartTheme()`):

```typescript
// In useChartTheme():
const paletteColors = ref<string[]>(
  [1, 2, 3, 4, 5, 6, 7, 8].map(i =>
    getComputedStyle(document.documentElement).getPropertyValue(`--color-chart-${i}`).trim()
  )
)

// In ExpensesReportsView chartData computed:
backgroundColor: categoryTotals.value.map((_, i) => paletteColors.value[i % 8])
```

`getComputedStyle().getPropertyValue('--color-chart-1')` returns a string like `' #002244'` (with leading space). The `.trim()` is required. Chart.js accepts any valid CSS color string — hex (`#002244`), rgb (`rgb(0, 34, 68)`), named (`red`), and color-mix() in modern browsers.

### Tailwind 4 `@theme` exposes vars on `:root`

`src/assets/base.css` declares all `--color-*` tokens under `@theme { ... }`. Tailwind 4 compiles `@theme` to actual `:root` CSS custom properties [VERIFIED: structure of `src/assets/base.css` and standard Tailwind v4 behavior]. So `getComputedStyle(document.documentElement).getPropertyValue('--color-chart-1')` reads them directly. No special selector needed.

The `.my-app-dark` block in the same file overrides those custom properties when the class is present on `html`, so the same `getComputedStyle` call returns dark values once the class is applied. The composable's `MutationObserver` triggers a re-read on class change.

### Chart.js global font config (set once)

UI-SPEC requires axis labels render in Rubik. Chart.js doesn't auto-inherit CSS font-family for canvas text. Two options:

1. **Per-chart option (recommended for v1):** Set `font.family: 'Rubik'` inside `scales.{x,y}.ticks.font` and tooltip font config (already shown above). Scoped to this chart; no global pollution.

2. **Global default (not recommended):** `import { Chart as ChartJS } from 'chart.js/auto'; ChartJS.defaults.font.family = 'Rubik'`. Requires importing chart.js once in our own code, which defeats the purpose of letting PrimeVue lazy-load it. Skip.

---

## dayjs period math

### Plugin requirement — CRITICAL

```typescript
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
dayjs.extend(quarterOfYear)
```

**Without this plugin, `dayjs().startOf('quarter')` returns the input unchanged.** [VERIFIED 2026-05-22 via Node REPL: bare dayjs returned `2026-05-22 08:29:55` (current time) instead of `2026-04-01 00:00:00`. After extending, returned `2026-04-01 00:00:00` correctly.]

Equally affected:
- `dayjs().endOf('quarter')`
- `dayjs().quarter()` (returns undefined)
- `dayjs().format('[Q]Q YYYY')` — for the "Q2 2026" period name label

**This is the single most likely correctness defect in Phase 26** because it fails silently — no thrown error, no console warning. The "This Quarter" tab simply shows the wrong data (the same data as "this single moment", which after string-format comparison against `YYYY-MM-DD` will produce an empty period and trigger the empty-state UI). A developer testing manually might assume "no expenses in Q2" when there ARE expenses in Q2.

**Mitigation:** Register the plugin at the top of `src/lib/wallecx/period.ts`. Because the helper is the only entry point to period math (`getPeriodRange` and `formatPeriodLabel`), importing the helper guarantees the plugin is loaded.

**Verification test (planner — add to plan):** A simple Vitest unit test that asserts `getPeriodRange('this-quarter', null, null).from.format('MM-DD')` matches the expected quarter start (`'01-01'` for Q1, `'04-01'` for Q2, etc.). Catches missing-plugin regressions in CI.

### Exact dayjs expressions

| Period | dayjs expression | Result on 2026-05-22 |
|--------|------------------|----------------------|
| This Month | `dayjs().startOf('month')` to `dayjs().endOf('month')` | `2026-05-01 00:00:00` to `2026-05-31 23:59:59.999` |
| This Quarter | `dayjs().startOf('quarter')` to `dayjs().endOf('quarter')` | `2026-04-01 00:00:00` to `2026-06-30 23:59:59.999` (Q2) |
| This Year | `dayjs().startOf('year')` to `dayjs().endOf('year')` | `2026-01-01 00:00:00` to `2026-12-31 23:59:59.999` |
| Custom | `dayjs(customFrom).startOf('day')` to `dayjs(customTo).endOf('day')` | user-controlled |

### Comparison strategy

`expense_date` is stored as `YYYY-MM-DD` string [VERIFIED: `src/types/wallecx/expenses/types.d.ts`]. Same pattern as Phase 25:
```typescript
const fromStr = periodRange.value.from.format('YYYY-MM-DD')
const toStr = periodRange.value.to.format('YYYY-MM-DD')
return props.expenses.filter(e => e.expense_date >= fromStr && e.expense_date <= toStr)
```

Lexicographic string comparison on `YYYY-MM-DD` is correct because the format is sortable. This avoids `new Date()` parsing overhead per expense.

### Period name formatting

Per UI-SPEC copywriting contract:

| Period | Format string | Example |
|--------|---------------|---------|
| this-month | `'MMMM YYYY'` | `"May 2026"` |
| this-quarter | `'[Q]Q YYYY'` | `"Q2 2026"` (requires `quarterOfYear` plugin) |
| this-year | `'YYYY'` | `"2026"` |
| custom (same day) | `'MMM D, YYYY'` | `"May 21, 2026"` |
| custom (same month) | `'MMM D'` + `'D, YYYY'` | `"Apr 1 – Apr 15, 2026"` |
| custom (same year) | `'MMM D'` + `'MMM D, YYYY'` | `"Apr 1 – May 31, 2026"` |
| custom (different years) | `'MMM D, YYYY'` + `'MMM D, YYYY'` | `"Dec 15, 2025 – Jan 14, 2026"` |

Separator: en-dash `–` with spaces (` – `), NOT hyphen-minus. Implemented in `formatPeriodLabel()` (see §Component contracts → period.ts).

---

## sessionStorage key registry

### Existing keys (current codebase) [VERIFIED via grep]

| Key | File | Purpose |
|-----|------|---------|
| `wallecx:expense-sort` | `ExpensesTab.vue` (Phase 25; will move to `ExpensesListView.vue` in Phase 26) | Sort mode |
| `wallecx:memberships-sort-mode` | `MembershipsTab.vue` | Sort mode |
| `wallecx:view-mode` | `VaccinationsTab.vue` | View mode (list/grid) |

### Existing localStorage keys (separate namespace — not session)

| Key | File | Purpose |
|-----|------|---------|
| `lexarium:theme` | `useTheme.ts` | User dark/light choice (persists across sessions) |
| `wallecx:pwa-install-banner-dismissed` (approximate) | `PwaInstallBanner.vue` | Banner-dismissed flag |

### New keys for Phase 26 (no collisions)

| Key | Module | Type | Purpose |
|-----|--------|------|---------|
| `wallecx:expense-period` | `src/lib/wallecx/period.ts` constant | sessionStorage | Active period selection (`'this-month' \| 'this-quarter' \| 'this-year' \| 'custom'`) |
| `wallecx:expense-period-from` | same | sessionStorage | Custom range From date as ISO string (`YYYY-MM-DD`) |
| `wallecx:expense-period-to` | same | sessionStorage | Custom range To date as ISO string |

### Optional Phase 26 key (Open Question — planner decides)

| Key | Module | Type | Purpose |
|-----|--------|------|---------|
| `wallecx:expense-subtab` | `ExpensesTab.vue` (or omit) | sessionStorage | Persist `'list' \| 'reports'` selection. CONTEXT.md and UI-SPEC both DEFAULT this to `'list'` and do not require persistence. Planner may add as polish. |

**Collision check:** All proposed keys use the `wallecx:expense-` prefix; no existing keys collide. The persistence convention (sessionStorage write in a `watch` block, read with whitelist validation in `onMounted`) follows the Phase 25 / MembershipsTab pattern exactly.

### Persistence pattern (mirrors Phase 25)

```typescript
// In ExpensesReportsView.vue setup()
onMounted(() => {
  // Restore BEFORE any reactive computed reads to avoid first-frame flicker
  try {
    const storedPeriod = sessionStorage.getItem(PERIOD_STORAGE_KEY)
    if (isValidPeriod(storedPeriod)) period.value = storedPeriod
    const storedFrom = sessionStorage.getItem(PERIOD_FROM_STORAGE_KEY)
    if (storedFrom) customFrom.value = dayjs(storedFrom).toDate()
    const storedTo = sessionStorage.getItem(PERIOD_TO_STORAGE_KEY)
    if (storedTo) customTo.value = dayjs(storedTo).toDate()
  } catch { /* privacy-mode iframe — fall back to defaults */ }

  // Initialize custom defaults if missing
  if (period.value === 'custom') {
    if (!customFrom.value) customFrom.value = dayjs().startOf('month').toDate()
    if (!customTo.value) customTo.value = new Date()
  }
})

watch(period, (next) => {
  try { sessionStorage.setItem(PERIOD_STORAGE_KEY, next) } catch { /* non-fatal */ }
})
watch(customFrom, (next) => {
  if (!next) return
  try { sessionStorage.setItem(PERIOD_FROM_STORAGE_KEY, dayjs(next).format('YYYY-MM-DD')) } catch { /* */ }
})
watch(customTo, (next) => {
  if (!next) return
  try { sessionStorage.setItem(PERIOD_TO_STORAGE_KEY, dayjs(next).format('YYYY-MM-DD')) } catch { /* */ }
})
```

---

## Pitfalls

### Pitfall 1: dayjs `quarter` silently no-ops without `quarterOfYear` plugin

**What goes wrong:** `dayjs().startOf('quarter')` returns the original timestamp unchanged. `.format('[Q]Q YYYY')` produces `"Q[invalid] 2026"`. The "This Quarter" tab shows the same single-second range as `now()` and filters out every expense.

**Why it happens:** dayjs ships with a tiny core; quarter math is gated behind the `quarterOfYear` plugin. The failure mode is silent — no exception, no console warning.

**How to avoid:**
1. Register the plugin at the top of `src/lib/wallecx/period.ts`:
   ```typescript
   import quarterOfYear from 'dayjs/plugin/quarterOfYear'
   dayjs.extend(quarterOfYear)
   ```
2. Add a Vitest unit test for `getPeriodRange('this-quarter', null, null)` asserting the result aligns with calendar quarter boundaries.

**Warning signs:** "This Quarter" tab shows the empty-state message even though there are recent expenses; period name label reads `Q2026` or similar malformed string.

### Pitfall 2: PrimeVue Chart needs `chart.js` installed; failure is silent

**What goes wrong:** Without `npm install chart.js`, PrimeVue Chart's dynamic `import('chart.js/auto')` rejects, the `.then()` callback never fires, and the `<canvas>` element stays blank. No console error in Vue, only a network-style "module not found" in dev console that can be missed.

**Why it happens:** PrimeVue declares chart.js as optional / not a peer dep [VERIFIED: `node_modules/primevue/package.json` no `peerDependencies.chart.js`]. The dynamic import gracefully handles the missing module.

**How to avoid:** Wave 0 task: `npm install chart.js@^4.5.1`. Verify via `npm ls chart.js`. Add a smoke test that mounts `<Chart type="bar" :data="..." :options="..." />` and asserts a `<canvas>` element appears.

**Warning signs:** Reports tab shows period selector + Grand Total but empty space where the chart should render; dev-tools network tab shows a failed module fetch.

### Pitfall 3: Mutating chart `data` vs. replacing it

**What goes wrong:** Pushing into a shared `chartData.datasets[0].data` array (rather than producing a new object) sometimes does not trigger Vue's deep-watch because of how arrays are observed. Or — the deep-watch fires, but PrimeVue's `reinit()` runs while a previous `import('chart.js/auto')` Promise is still in-flight, leading to a race where the old chart's destroy() collides with new chart construction.

**Why it happens:** PrimeVue Chart uses `watch: { data: { handler, deep: true } }` [VERIFIED]. Vue's deep watcher handles both replacement and mutation, but the race condition above is real for rapid period switches.

**How to avoid:**
1. Always return a NEW `chartData` object from the `computed` (we already do this — `categoryTotals.value.map(...)` creates fresh arrays). Never push/splice into an existing dataset.
2. Throttle is not needed — the period selector is a Tabs control with discrete clicks; rapid double-clicks are rare. If a user-test surfaces a race, wrap the period setter in a `requestAnimationFrame` callback.

**Warning signs:** Bar chart freezes after rapid period switching; console error like "Cannot read properties of null (reading 'ctx')" from chart.js.

### Pitfall 4: Dark-mode flicker on initial mount

**What goes wrong:** User loads the app already in dark mode. The Reports tab mounts. `useChartTheme()` reads `getComputedStyle` during `setup()` — at this point `.my-app-dark` may already be applied to `<html>` (useTheme reads localStorage synchronously at module load). The chart renders correctly the first time. **No flicker.**

But: if the user toggles dark mode WHILE the Reports tab's chart is mid-render (Chart.js `reinit()` Promise in flight), the chart may briefly show old-theme colors before the next `reinit()` runs.

**How to avoid:** The MutationObserver in `useChartTheme()` triggers `refreshFromDom()` synchronously when the class changes; the `chartOptions` computed re-evaluates synchronously; PrimeVue's deep-watch sees the change and re-runs `reinit()`. The window where stale colors are visible is one animation frame (~16 ms) — imperceptible.

**Warning signs:** None expected — but if the QA finds a visible flash, the fix is to call `observer.observe()` on `document.documentElement` AND on `document.body` (already done in the composable above).

### Pitfall 5: Horizontal bar chart on narrow mobile viewport

**What goes wrong:** On a 360 px-wide phone with 8 categories, Chart.js may compress bar thickness below 8 px or truncate Y-axis labels mid-character. Result: unreadable chart.

**Why it happens:** Default `barThickness: 'flex'` divides available vertical space evenly. With `chartHeightPx = Math.max(220, categories.length * 36)` we give each bar ~28 px of vertical breathing room. But on narrow widths the X-axis (`indexAxis: 'y'`) takes up horizontal space — long category names like "Entertainment" or user customs like "Subscriptions & Services" might wrap or truncate.

**How to avoid:**
1. `layout.padding.left: 8` already in `chartOptions` to give Y-axis labels room (UI-SPEC § Spacing).
2. Chart.js auto-truncates Y-axis labels with ellipsis when they exceed available width — readable enough.
3. Set `minBarLength: 20` in dataset config so a tiny-amount bar (e.g., $1.50 in a $10,000 month) still renders visibly. Already in `chartData` computed.

**Warning signs:** Bars compressed to <10 px height; user complaints about not being able to tap the chart for a tooltip.

### Pitfall 6: PrimeVue nested Tabs scroll behavior

**What goes wrong:** With three levels of Tabs (top-level WallecxApp → sub-tab List/Reports → period This Month/Quarter/Year/Custom), the inner period Tabs' `scrollable` arrows might capture clicks that should hit the outer sub-tab area. Or — `Tab` key navigation gets stuck inside the inner tab list.

**Why it happens:** PrimeVue Tabs use `role="tablist"` semantics. ARIA keyboard navigation says `Tab` exits the tablist and `ArrowLeft/Right` moves within it. Implemented correctly by PrimeVue [LIBRARY CONVENTION].

**How to avoid:**
1. Test with screen reader (NVDA / VoiceOver) — focus order MUST be: outer sub-tab list → outer panel content → inner period tab list → period panel content. PrimeVue gets this right by default; no manual ARIA needed.
2. Visual differentiation per UI-SPEC: tighter padding + no icons on sub-tab triggers makes the nesting depth visually obvious to users without accessibility tools.

**Warning signs:** Keyboard user gets stuck cycling through period Tabs and can't reach the chart container; screen reader announces "tab list" twice without distinguishing them.

---

## Open questions for planner

1. **Sub-tab persistence (`wallecx:expense-subtab` key).**
   - What we know: CONTEXT.md Open Question 5 explicitly defers this decision. UI-SPEC sets default sub-tab = `'list'`.
   - What's unclear: Whether a user who lands on Reports, reloads, and expects to see Reports again deserves that polish — or whether always defaulting to List is the friendlier UX (Reports requires a deliberate exploratory click).
   - Recommendation: Defer to a follow-up polish phase. The 12 locked decisions already give a high-confidence v1.

2. **Skeleton placeholder during initial load — show period selector or not?**
   - What we know: UI-SPEC § Interaction Contracts → "Loading skeleton" specifies the period selector renders INTERACTIVELY during `isLoading`, and only the Grand Total + chart areas show Skeleton blocks. This is locked.
   - What's unclear: If the user clicks "This Year" during the ~200 ms load, the period state will be set, and when data arrives the chart will render the correct period. This is the intended behavior — no question for the planner, just flagging it for the executor.

3. **Should `useChartTheme()` live in `src/composables/` or alongside `ExpensesReportsView.vue`?**
   - What we know: The composable is generic — any future chart anywhere in Lexarium could reuse it.
   - Recommendation: Put it in `src/composables/useChartTheme.ts`. Matches the project's convention for `useIsMobile.ts` and `useTheme.ts`. If a second chart appears (e.g., a vaccinations-over-time chart in a future phase), the composable is already where someone will look first.

4. **Should `chart.js/auto` be installed, or just `chart.js` with explicit registration?**
   - What we know: PrimeVue Chart calls `import('chart.js/auto')` internally. Installing `chart.js` exposes both `chart.js` and `chart.js/auto` entry points (the `auto` is just an alias that auto-registers all controllers). So `npm install chart.js` is sufficient.
   - Recommendation: Install `chart.js` only. Do not install `chart.js/auto` as a separate package — it does not exist as a standalone package.

5. **Should the Grand Total animate as a number tween (CountUp.js etc.)?**
   - What we know: UI-SPEC § Transition animation on period switch → "Grand Total number: no transition — the number swaps instantly. Rationale: animating a currency number is distracting and risks transient illegible mid-frames." This is locked.
   - No question — just flagging for the executor: do NOT add `@vueuse/motion` transitions to the total.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PrimeVue Chart's `chartOptions` deep-watcher triggers `reinit()` for nested object mutations (e.g., changing `options.scales.x.ticks.color` only) | Chart.js integration patterns | Theme change might not re-render chart in dark mode toggle; mitigation: replace the whole `options` object reference, which Vue's computed already does on each re-evaluation. |
| A2 | `getComputedStyle(document.documentElement).getPropertyValue('--color-chart-1')` returns the resolved CSS variable value (not the variable name) when Tailwind 4 has compiled `@theme` to `:root` rules | Dark mode strategy | If the value comes back empty, the chart bars render as Chart.js default (gray). Verify by running the composable in dev console: `getComputedStyle(document.documentElement).getPropertyValue('--color-brand-primary')` should return ` #002244`. |
| A3 | PrimeVue Tabs with `scrollable` prop renders prev/next arrows on overflow and supports arrow-key navigation per WAI-ARIA APG | Pitfalls (Pitfall 6) | If `scrollable` is not a valid prop in PrimeVue 4.3.7, period tabs may wrap to a second row on narrow mobile viewports; visual regression only. Verify by checking `node_modules/primevue/tabs/index.d.ts` once installed. |
| A4 | `chart.js@^4.5.1` is API-compatible with PrimeVue 4.3.7's `import('chart.js/auto')` call | Stack additions | If a breaking change in chart.js v4 broke the `auto` entry point, the chart would fail to load. Mitigation: PrimeVue's `Chart.vue` was last updated for chart.js v4; chart.js has not had a major version bump since 4.0 (4.x is the current generation). |

---

## Sources

### Primary (HIGH confidence — VERIFIED in this session)

- `node_modules/primevue/chart/Chart.vue` — confirmed `watch: { data: { deep: true } }`, `beforeUnmount` destroys chart, `initChart()` does `import('chart.js/auto')`
- `node_modules/primevue/chart/index.mjs` — confirmed same patterns, `reinit()` body
- `node_modules/primevue/chart/index.d.ts` — confirmed props: `type`, `data`, `options`, `plugins`, `width`, `height`, `canvasProps`
- `npm view chart.js dist-tags` (2026-05-22) — `latest: '4.5.1'`
- `npm view primevue@4.3.7 peerDependencies` — no `chart.js` peer dep declared
- Node REPL test (2026-05-22) — confirmed `dayjs().startOf('quarter')` no-ops without `quarterOfYear` plugin
- `src/components/projects/wallecx/ExpensesTab.vue` (current Phase 25 state, 312 LOC)
- `src/components/projects/wallecx/ExpensesToolbar.vue` (DatePicker cast pattern)
- `src/components/projects/wallecx/WallecxApp.vue` (top-level Tabs, ConfirmDialog placement)
- `src/composables/useTheme.ts` — confirmed dark class added to `document.documentElement` (NOT body)
- `src/composables/useIsMobile.ts` — pattern for `MutationObserver`-style listener with `onMounted` / `onUnmounted`
- `src/assets/base.css` — confirmed `@theme` block + `.my-app-dark` override block; new chart palette tokens will follow same pattern
- `vite.config.ts` — confirmed `PrimeVueResolver` auto-imports PrimeVue components including `Chart`
- `src/main.ts` — confirmed `darkModeSelector: '.my-app-dark'` and `prefix: 'p'`
- `package.json` — confirmed dayjs ^1.11.18 (with `quarterOfYear` plugin available), no `chart.js`, no `@vueuse/core`
- `grep sessionStorage.(getItem|setItem) src/` — confirmed no key collisions
- `grep from ['"]dayjs/plugin src/` — confirmed no existing dayjs plugin registrations
- `.planning/phases/26-reporting-view/26-CONTEXT.md` (12 locked decisions)
- `.planning/phases/26-reporting-view/26-UI-SPEC.md` (visual + interaction contract)
- `.planning/phases/25-read-path-list-view/25-RESEARCH.md` (analog reference)
- `.planning/STATE.md` (architectural invariants)
- `.planning/REQUIREMENTS.md` (EXP-11, EXP-12, EXP-13)
- `.planning/config.json` (`nyquist_validation: false` — Validation Architecture section omitted)

### Secondary (MEDIUM confidence)

- PrimeVue Chart documentation conventions (component reactivity, lazy chart.js loading) — inferred from PrimeVue Chart source, consistent with PrimeVue 4 component conventions across the rest of the library
- Chart.js documentation conventions (`indexAxis`, `scales.x/y` config shape, `plugins.tooltip.callbacks.label`) — well-established Chart.js 4 API, stable since 4.0 release

### Tertiary (LOW confidence — flagged for verification at implementation time)

- Exact CSS variable value returned by `getComputedStyle().getPropertyValue('--color-chart-1')` after Tailwind 4 compilation — Assumption A2. Verify via dev console one-liner during plan execution.
- PrimeVue Tabs `scrollable` prop behavior on mobile (renders arrow controls vs. native overflow scroll) — Assumption A3. Verify via QA on a 360 px viewport.

---

## Validation Architecture

**OMITTED.** `.planning/config.json` has `workflow.nyquist_validation: false`. Per the GSD researcher protocol, this section is skipped when nyquist_validation is explicitly disabled.

---

## Environment Availability

**SKIPPED.** This phase is a pure Vue/TypeScript code change. The only new dependency (`chart.js`) is an npm package — already covered in the `## Stack additions` section. No external CLI tools, runtimes, or services beyond the project's already-running Node.js and PocketBase are required.

---

## Security Domain

This phase adds read-path / computation UI only. No new PocketBase collections, no new rules, no new API calls (reuses the Phase 25 `getFullList` result).

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Existing route guard (no change) |
| V3 Session Management | no | sessionStorage values are non-sensitive (period name strings, ISO date strings); no auth/session data |
| V4 Access Control | no | No new API endpoints; existing PB rule `@request.auth.id = user.id` already enforces per-user data isolation in Phase 23 |
| V5 Input Validation | partial | Period whitelist validation on sessionStorage read (`VALID_PERIODS` array, mirrors Phase 25 `VALID_SORT_MODES` pattern); custom-range From / To dates use PrimeVue DatePicker which produces `Date` objects (not parseable from arbitrary strings) |
| V6 Cryptography | no | No new cryptographic operations |

No new threat surface. No new security controls required.

---

## Metadata

**Confidence breakdown:**
- File structure decision: HIGH — LOC counts verified by `wc -l`; rationale grounded in concrete existing codebase patterns
- Stack additions (chart.js, quarterOfYear): HIGH — versions verified via npm registry; dayjs plugin verified via Node REPL
- Chart.js integration: HIGH — PrimeVue Chart source code read directly; lifecycle confirmed
- Dark mode strategy: HIGH — useTheme.ts source read; CSS variable mechanism well-established
- dayjs period math: HIGH — plugin behavior verified in Node REPL on research date
- sessionStorage key registry: HIGH — full codebase grep performed
- Pitfalls: HIGH — confirmed from source inspection, not assumed

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (stable dependencies; 30-day window)
