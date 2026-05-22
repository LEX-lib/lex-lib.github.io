# Phase 26: Reporting View - Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 7 (4 new, 3 modify)
**Analogs found:** 7 / 7 (1 no-direct-analog for the Chart component itself — first chart in codebase)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/composables/useChartTheme.ts` | composable (reactive theme) | event-driven (MutationObserver) | `src/composables/useTheme.ts` + `src/composables/useIsMobile.ts` | role-match (compose two patterns) |
| `src/lib/wallecx/period.ts` | utility (pure functions + constants) | transform | `src/lib/wallecx/currency.ts` | exact (lib module shape) |
| `src/components/projects/wallecx/ExpensesListView.vue` | component (list view) | request-response | `src/components/projects/wallecx/ExpensesTab.vue` (current Phase 25 content — extraction source) | exact (this IS the source) |
| `src/components/projects/wallecx/ExpensesReportsView.vue` | component (chart view) | transform + event-driven | `src/components/projects/wallecx/MembershipsTab.vue` (filtered display + sessionStorage); ExpensesToolbar.vue (DatePicker pair) | partial (no direct chart analog) |
| `src/components/projects/wallecx/ExpensesTab.vue` (MODIFY) | component (shell) | request-response | `src/components/projects/wallecx/WallecxApp.vue` (Tabs shell pattern) | exact |
| `src/assets/base.css` (MODIFY) | config (CSS tokens) | n/a | `src/assets/base.css` lines 5-31 / 43-60 (existing `@theme` + `.my-app-dark` blocks) | exact (self-extend) |
| `package.json` (MODIFY) | config (deps) | n/a | `package.json` line 31 (`dayjs: ^1.11.18` — alphabetic insertion) | exact (self-extend) |

---

## Pattern Assignments

### `src/composables/useChartTheme.ts` (composable, event-driven)

**Analog:** `src/composables/useTheme.ts` (dark-class management) + `src/composables/useIsMobile.ts` (composable lifecycle structure)
**Modification type:** New file — compose two existing patterns: useTheme.ts's `document.documentElement.classList` constant + useIsMobile.ts's onMounted/onUnmounted listener teardown.

**Imports pattern** (useIsMobile.ts lines 1, adapted):
```typescript
import { ref, onMounted, onBeforeUnmount } from 'vue'
```

**Reactive listener with onMounted/onUnmounted teardown** (useIsMobile.ts lines 12-21 — copy structure exactly, swap `matchMedia` for `MutationObserver`):
```typescript
export function useIsMobile(breakpoint = 639): Ref<boolean> {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const isMobile = ref(query.matches)
  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  onMounted(() => query.addEventListener('change', handler))
  onUnmounted(() => query.removeEventListener('change', handler))
  return isMobile
}
```

**Dark class lives on `<html>` — NOT `<body>`** (useTheme.ts lines 12-18 — load-bearing):
```typescript
function applyTheme(value: Theme): void {
  if (value === 'dark') {
    document.documentElement.classList.add(DARK_CLASS)
  } else {
    document.documentElement.classList.remove(DARK_CLASS)
  }
}
```

**Reactive ref + synchronous initial value seeding** (useTheme.ts lines 8-10 — same pattern: read DOM state synchronously at module/composable creation):
```typescript
const theme = ref<Theme>(
  document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light'
)
```

**Combined target pattern for `useChartTheme()`** (compose both — RESEARCH.md §Dark mode strategy lines 661-722):
```typescript
import { ref, onMounted, onBeforeUnmount } from 'vue'

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function readPalette(): string[] {
  return [1, 2, 3, 4, 5, 6, 7, 8].map(i => readVar(`--color-chart-${i}`))
}

export function useChartTheme() {
  // Synchronous initial read — pattern from useTheme.ts line 8-10
  const paletteColors = ref<string[]>(readPalette())
  const axisColor = ref<string>(readVar('--color-typo-body'))
  const mutedColor = ref<string>(readVar('--color-typo-muted'))
  const headingColor = ref<string>(readVar('--color-typo-heading'))
  const gridColor = ref<string>(readVar('--color-surface-divider'))
  const surfaceColor = ref<string>(readVar('--color-surface-card'))
  const dividerColor = ref<string>(readVar('--color-surface-divider'))

  let observer: MutationObserver | null = null

  function refreshFromDom() {
    paletteColors.value = readPalette()
    axisColor.value = readVar('--color-typo-body')
    mutedColor.value = readVar('--color-typo-muted')
    headingColor.value = readVar('--color-typo-heading')
    gridColor.value = readVar('--color-surface-divider')
    surfaceColor.value = readVar('--color-surface-card')
    dividerColor.value = readVar('--color-surface-divider')
  }

  // Lifecycle: pattern from useIsMobile.ts lines 18-19
  onMounted(() => {
    refreshFromDom()
    observer = new MutationObserver(refreshFromDom)
    // Observe BOTH <html> and <body> — useTheme.ts uses <html>, but UI-SPEC
    // dark-mode contract example uses <body>; observing both is defensive.
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

  return { paletteColors, axisColor, mutedColor, headingColor,
           gridColor, surfaceColor, dividerColor }
}
```

**Critical anti-pattern to avoid:** Do NOT use `@vueuse/core`'s `useMutationObserver` — `@vueuse/core` is NOT installed (verified via package.json — only `@vueuse/motion` ^3.0.3 is present). Use native `MutationObserver` per useIsMobile.ts's listener teardown pattern.

---

### `src/lib/wallecx/period.ts` (utility, transform)

**Analog:** `src/lib/wallecx/currency.ts`
**Modification type:** New file — same shape: module-top constants + pure exported functions.

**Module shape** (currency.ts lines 1-13 — full file as template):
```typescript
// Single locked currency for v4.0 (D-10). Multi-currency support is deferred to EXP-ADV-03,
// which would migrate this to a user setting or a per-expense field.
export const WALLECX_CURRENCY = 'PHP';
export const WALLECX_CURRENCY_LOCALE = 'en-PH';

const formatter = new Intl.NumberFormat(WALLECX_CURRENCY_LOCALE, {
  style: 'currency',
  currency: WALLECX_CURRENCY,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
```

**Key pattern lessons from currency.ts:**
1. **Module-top constants exported** (`WALLECX_CURRENCY`, `WALLECX_CURRENCY_LOCALE`) — `period.ts` will export `VALID_PERIODS`, `PERIOD_STORAGE_KEY`, `PERIOD_FROM_STORAGE_KEY`, `PERIOD_TO_STORAGE_KEY` the same way.
2. **Module-level singleton** (`const formatter`) initialized once at module load — `period.ts` will do the equivalent via `dayjs.extend(quarterOfYear)` at module load (idempotent, safe to repeat).
3. **Pure functions** (`formatCurrency`) with explicit return types — `period.ts` exports `getPeriodRange(...)` and `formatPeriodLabel(...)` the same way.
4. **No semicolons inconsistency** — currency.ts uses semicolons; ExpensesTab.vue does NOT. Match the surrounding file's convention. **For new lib files: use semicolons** to match currency.ts.

**dayjs plugin registration at module top** (CRITICAL — RESEARCH.md Pitfall 1):
```typescript
import dayjs, { type Dayjs } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

// CRITICAL: dayjs().startOf('quarter') silently no-ops without this plugin.
// Verified via Node REPL on 2026-05-22.
dayjs.extend(quarterOfYear)
```

**Full target shape** (RESEARCH.md §Component contracts → period.ts, lines 566-636):
```typescript
import dayjs, { type Dayjs } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

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

**Separator:** en-dash (` – `, U+2013) — NOT hyphen-minus. UI-SPEC copywriting contract.

---

### `src/components/projects/wallecx/ExpensesListView.vue` (component, request-response)

**Analog:** `src/components/projects/wallecx/ExpensesTab.vue` (current Phase 25 content — this is a **direct extraction**)
**Modification type:** New file populated by **moving** the Phase 25 list logic out of ExpensesTab.vue. Most code is copy-paste with two transformations: (a) `expenses.value` reads become `props.expenses`; (b) `openManage`, `openReceiptPreview`, `deleteExpense` calls become `emit('edit', ...)`, `emit('preview', ...)`, `emit('delete', ...)`.

**Props/emits contract** (RESEARCH.md §Component contracts):
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
```

**Imports to MOVE from ExpensesTab.vue → ExpensesListView.vue** (current ExpensesTab.vue lines 1-12):
```typescript
import { ref, computed, watch, onMounted } from 'vue'
import type { Expenses } from '@/types/wallecx/expenses/types'
import dayjs from 'dayjs'
import ExpensesToolbar from './ExpensesToolbar.vue'
import ExpenseItem from './ExpenseItem.vue'
```

**Imports that STAY in ExpensesTab.vue** (shell only needs):
```typescript
import { pb } from '@/lib/pocketbase'
import { toast } from 'vue-sonner'
import { useConfirm } from 'primevue/useconfirm'
import { useIsMobile } from '@/composables/useIsMobile'
import ManageExpense from './ManageExpense.vue'
import AttachmentPreview from './AttachmentPreview.vue'
```

**Filter/sort state + computed to MOVE** (current ExpensesTab.vue lines 22-91 — verbatim move, only change `expenses.value` → `props.expenses`):
```typescript
const SORT_STORAGE_KEY = 'wallecx:expense-sort'
const VALID_SORT_MODES = ['newest-first', 'oldest-first', 'category-asc', 'amount-high', 'amount-low']
const sortMode = ref<string>('newest-first')
const searchQuery = ref<string>('')
const selectedCategories = ref<string[]>([])
const dateFrom = ref<Date | null>(null)
const dateTo = ref<Date | null>(null)

const expenseSortOptions = [
  { value: 'newest-first', label: 'Newest First' },
  { value: 'oldest-first', label: 'Oldest First' },
  { value: 'category-asc', label: 'Category A–Z' },
  { value: 'amount-high',  label: 'Amount: High to Low' },
  { value: 'amount-low',   label: 'Amount: Low to High' },
]

watch(sortMode, (next) => {
  try {
    sessionStorage.setItem(SORT_STORAGE_KEY, next)
  } catch {
    // sessionStorage write failures are non-fatal (privacy-mode iframe)
  }
})

const categoryOptions = computed<string[]>(() =>
  [...new Set(props.expenses.map(e => e.category))].sort()
)

const filteredSortedExpenses = computed<Expenses[]>(() => {
  let result = props.expenses  // CHANGED from expenses.value
  // ... rest unchanged
})
```

**onMounted sort restoration** (current ExpensesTab.vue lines 112-119 — move only the sort restoration block; the `getFullList` call stays in shell):
```typescript
onMounted(() => {
  try {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY)
    if (stored && VALID_SORT_MODES.includes(stored)) sortMode.value = stored
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default
  }
})
```

**Template: emit instead of call** (current ExpensesTab.vue lines 252-262 → emit form):
```html
<div v-else>
  <ExpenseItem
    v-for="record in filteredSortedExpenses"
    :key="record.id"
    :record="record"
    @edit="emit('edit', record)"
    @delete="emit('delete', record)"
    @preview="emit('preview', record)"
  />
</div>
```

**Empty-state CTA: emit instead of direct call** (current ExpensesTab.vue line 225):
```html
<!-- BEFORE (in ExpensesTab.vue): -->
<Button label="Add expense" icon="pi pi-plus" size="small" @click="openManage(null)" />

<!-- AFTER (in ExpensesListView.vue): -->
<Button label="Add expense" icon="pi pi-plus" size="small" @click="emit('request-add-expense')" />
```

**Critical: `isLoading` prop usage** — replace `isLoading.value` with `props.isLoading` everywhere; replace `expenses.length` (template raw) with `props.expenses.length` (or `expenses.length` with `v-bind` reactive — Vue auto-unwraps in templates so `expenses.length === 0` works against a prop).

---

### `src/components/projects/wallecx/ExpensesReportsView.vue` (component, transform + event-driven)

**Analog (partial — no direct chart analog exists):**
- `src/components/projects/wallecx/MembershipsTab.vue` lines 23-80 — sessionStorage sort persistence pattern (mirror for period persistence)
- `src/components/projects/wallecx/ExpensesToolbar.vue` — DatePicker pair pattern (for Custom range)
- `src/components/projects/wallecx/ExpensesTab.vue` lines 187-249 — empty-state layout/copy structure
- RESEARCH.md §Component contracts → ExpensesReportsView.vue (lines 358-562) — full target shape

**Imports** (compose from period.ts + useChartTheme + currency + dayjs):
```typescript
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import type { Expenses } from '@/types/wallecx/expenses/types'
import { formatCurrency } from '@/lib/wallecx/currency'
import {
  getPeriodRange, formatPeriodLabel, isValidPeriod,
  VALID_PERIODS, PERIOD_STORAGE_KEY, PERIOD_FROM_STORAGE_KEY, PERIOD_TO_STORAGE_KEY,
  type Period,
} from '@/lib/wallecx/period'
import { useChartTheme } from '@/composables/useChartTheme'
```

**Props/emits** (mirrors ExpensesListView):
```typescript
const props = defineProps<{
  expenses: Expenses[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'request-add-expense': []
}>()
```

**sessionStorage restoration pattern** (mirrors current ExpensesTab.vue lines 112-119 — same shape, three keys instead of one):
```typescript
const period = ref<Period>('this-month')
const customFrom = ref<Date | null>(null)
const customTo = ref<Date | null>(null)

onMounted(() => {
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
```

**sessionStorage write watchers** (current ExpensesTab.vue lines 45-51 — replicate per-ref):
```typescript
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

**Date range filter pattern — string compare on YYYY-MM-DD** (current ExpensesTab.vue lines 71-78 — copy verbatim, applied to periodRange instead of dateFrom/dateTo):
```typescript
// Current pattern in ExpensesTab.vue lines 71-78:
if (dateFrom.value) {
  const from = dayjs(dateFrom.value).format('YYYY-MM-DD')
  result = result.filter(e => e.expense_date >= from)
}
if (dateTo.value) {
  const to = dayjs(dateTo.value).format('YYYY-MM-DD')
  result = result.filter(e => e.expense_date <= to)
}

// Adapted for ExpensesReportsView.vue:
const periodRange = computed(() => getPeriodRange(period.value, customFrom.value, customTo.value))

const periodExpenses = computed<Expenses[]>(() => {
  if (dateRangeError.value) return []
  const fromStr = periodRange.value.from.format('YYYY-MM-DD')
  const toStr = periodRange.value.to.format('YYYY-MM-DD')
  return props.expenses.filter(e => e.expense_date >= fromStr && e.expense_date <= toStr)
})
```

**Custom range DatePicker pair pattern** (current ExpensesToolbar.vue — same DatePicker shape; UI-SPEC § Custom-range DatePicker pair lines 199-209):
```html
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
```

**Empty state pattern** (current ExpensesTab.vue lines 204-227 — same shape, icon change to `mdi:chart-bar-stacked`):
```html
<div class="flex flex-col items-center py-12 gap-3">
  <iconify-icon
    icon="mdi:chart-bar-stacked"
    width="48"
    height="48"
    style="color: var(--color-brand-primary)"
    aria-hidden="true"
  />
  <p class="text-sm font-bold" style="color: var(--color-typo-heading)">
    No expenses in this period.
  </p>
  <p class="text-sm" style="color: var(--color-typo-muted)">
    Try another period or add an expense to get started.
  </p>
  <Button label="Add expense" icon="pi pi-plus" size="small"
          @click="emit('request-add-expense')" />
</div>
```

**Grand Total hero block + Chart** (RESEARCH.md §Component contracts lines 545-559 — first chart in codebase, NO existing analog; use UI-SPEC as authoritative reference):
```html
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
```

**Template: v-if chain ordering — mutually exclusive** (mirrors ExpensesTab.vue lines 199-262 four-state chain):
1. `v-if="isLoading"` — skeleton blocks (label + number + 220px chart skeleton)
2. `v-else-if="dateRangeError"` — inline error (only possible in custom mode)
3. `v-else-if="periodExpenses.length === 0"` — empty state
4. `v-else` — grand total + chart

---

### `src/components/projects/wallecx/ExpensesTab.vue` (MODIFY — becomes shell, request-response)

**Analog:** `src/components/projects/wallecx/WallecxApp.vue` (top-level Tabs shell)
**Modification type:** Refactor — most existing code is REMOVED (moved to ExpensesListView.vue); shell retains data load, dialogs, and adds Tabs sub-navigation.

**WallecxApp.vue Tabs shell template** (WallecxApp.vue lines 78-104 — exact structural template to mirror for the inner sub-tabs):
```html
<Tabs v-model:value="activeTab">
  <TabList>
    <Tab value="vaccinations">
      <iconify-icon icon="mdi:needle" width="16" height="16" aria-hidden="true"></iconify-icon>
      Vaccinations
    </Tab>
    <Tab value="memberships">
      <iconify-icon icon="mdi:card-account-details-outline" width="16" height="16" aria-hidden="true"></iconify-icon>
      Membership Cards
    </Tab>
    <Tab value="expenses">
      <iconify-icon icon="mdi:cash-multiple" width="16" height="16" aria-hidden="true"></iconify-icon>
      Expenses
    </Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="vaccinations">
      <VaccinationsTab />
    </TabPanel>
    <TabPanel value="memberships">
      <MembershipsTab />
    </TabPanel>
    <TabPanel value="expenses">
      <ExpensesTab />
    </TabPanel>
  </TabPanels>
</Tabs>
```

**Adapted sub-tab shell for ExpensesTab.vue** (UI-SPEC § Sub-tab shell, RESEARCH.md §Component contracts lines 289-332):
```html
<div>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold" style="color: var(--color-typo-heading)">Expenses</h2>
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
  <!-- Receipt preview Dialog/Drawer — unchanged from Phase 25 -->
</div>
```

**Shell-only script** (KEEP from current ExpensesTab.vue, REMOVE moved-to-child blocks):

KEEP (lines 1, 4, 6-9, 11-12, 14-19, 39-42, 100-110, 112, 120-134, 136-176):
- `import { ref, onMounted } from 'vue'` (remove `computed`, `watch` — not needed in shell)
- `pb`, `toast`, `Expenses` type, `useConfirm`, `useIsMobile`, `dayjs` (for receipt token timing), `ManageExpense`, `AttachmentPreview`
- `expenses`, `isLoading`, `showManage`, `manageRecord`, `confirm`, `isMobile`
- Receipt preview refs (`showPreview`, `previewRecord`, `previewToken`)
- `openReceiptPreview()` (lines 100-110)
- `onMounted` block, but trimmed: keep ONLY the getFullList load (lines 120-134); REMOVE sort restoration (moves to ExpensesListView)
- `openManage()`, `onCreated()`, `onUpdated()` (lines 136-150)
- `deleteExpense()` (lines 154-172)
- `defineExpose({ deleteExpense })` (line 175)

REMOVE (move to ExpensesListView.vue):
- Lines 22-37 (`SORT_STORAGE_KEY`, `VALID_SORT_MODES`, `sortMode`, search/filter refs, `expenseSortOptions`)
- Lines 44-91 (`watch(sortMode)`, `categoryOptions`, `filteredSortedExpenses`)
- Lines 93-98 (`clearFilters`)
- Lines 113-119 inside `onMounted` (sort restoration)

ADD (new shell-only state):
```typescript
type SubTab = 'list' | 'reports'
const activeSubTab = ref<SubTab>('list')
```

**Critical invariants preserved** (STATE.md / RESEARCH.md):
- `requestKey: 'expenses-getFullList'` MUST stay (current ExpensesTab.vue line 126) — STATE.md collision avoidance
- `defineExpose({ deleteExpense })` MUST stay (line 175) — Phase 24 stub invariant
- `ConfirmDialog` lives at WallecxApp.vue shell level — not added here

---

### `src/assets/base.css` (MODIFY — config)

**Analog:** `src/assets/base.css` itself (lines 5-31 `@theme` block, lines 43-60 `.my-app-dark` block) — extend in place.
**Modification type:** Add 8 new CSS variables to BOTH blocks.

**Existing `@theme` shape** (base.css lines 5-31 — pattern to follow):
```css
@theme {
  /* Brand core */
  --color-brand-primary: #002244;
  --color-brand-primary-dark: #0a3d6b;
  --color-brand-accent: #e89820;
  --color-brand-accent-light: #fdf3dc;

  /* Backgrounds & surfaces */
  --color-surface-page: #f5f7fa;
  --color-surface-card: #ffffff;
  --color-surface-code: #1a1a2e;
  --color-surface-divider: #e8ecf2;

  /* Typography */
  --color-typo-heading: #0d1117;
  --color-typo-body: #3d4a5c;
  --color-typo-muted: #6b7280;
  --color-typo-link: #e89820;

  /* Semantics */
  --color-status-success: #1a7c45;
  --color-status-warning: #e89820;
  --color-status-error: #c0392b;
  --color-status-info: #378add;

  --color-mix-target: #ffffff;
}
```

**Existing `.my-app-dark` shape** (base.css lines 43-60 — must add dark values for every new token in the same order/grouping):
```css
.my-app-dark {
  --color-brand-primary: #7896ba;
  --color-brand-primary-dark: #3d6a9a;
  --color-brand-accent: #f0ab40;
  --color-brand-accent-light: #3a2d10;

  --color-surface-page: #0d1117;
  --color-surface-card: #1a1a2e;
  --color-surface-code: #0d1117;
  --color-surface-divider: #2a3142;

  --color-typo-heading: #f5f7fa;
  --color-typo-body: #cbd5e1;
  --color-typo-muted: #9ca3af;
  --color-typo-link: #f0ab40;

  --color-mix-target: #0d1117;
}
```

**Insertion pattern — append a new comment-headed group inside each block** (UI-SPEC § Color → Chart Category Bar Palette):
```css
/* Add inside @theme block (after Semantics, before --color-mix-target — or wherever the planner chooses; consistency matters more than exact placement): */

  /* Chart palette (Phase 26) — 8-color cyclic palette for per-category bars. */
  --color-chart-1: #002244;  /* Navy / steel blue (same as brand primary) */
  --color-chart-2: #0a6bba;  /* Mid blue */
  --color-chart-3: #1a7c45;  /* Green */
  --color-chart-4: #e89820;  /* Amber (brand accent) */
  --color-chart-5: #9c27b0;  /* Purple */
  --color-chart-6: #378add;  /* Sky blue (info) */
  --color-chart-7: #d97706;  /* Orange */
  --color-chart-8: #5b6b80;  /* Neutral slate */

/* Add to .my-app-dark block (matching order): */

  --color-chart-1: #7896ba;
  --color-chart-2: #5ea6e6;
  --color-chart-3: #4cb87a;
  --color-chart-4: #f0ab40;
  --color-chart-5: #c77dd6;
  --color-chart-6: #7fb6e6;
  --color-chart-7: #f59e3c;
  --color-chart-8: #9ca8b8;
```

**Critical:** Both blocks MUST be updated. Omitting from `.my-app-dark` causes chart to render with light palette in dark mode (UI-SPEC § Bar palette under dark mode).

---

### `package.json` (MODIFY — config)

**Analog:** `package.json` lines 22-50 (existing `dependencies` block — alphabetic order).
**Modification type:** Add `chart.js: ^4.5.1` between `browser-image-compression` (line 30) and `dayjs` (line 31).

**Exact dependency line** (RESEARCH.md §Stack additions — version VERIFIED 2026-05-22 via `npm view chart.js dist-tags`):
```json
    "chart.js": "^4.5.1",
```

**Insertion location** (after line 30, before line 31 — alphabetic):
```json
    "browser-image-compression": "^2.0.2",
    "chart.js": "^4.5.1",
    "dayjs": "^1.11.18",
```

**Install command (planner Wave 0 task):**
```bash
npm install chart.js@^4.5.1
```

No other package.json changes. No new devDependency. No script change. No engines change.

---

## Shared Patterns

### Authentication / Auth Guard
**Source:** `src/router/index.ts` `beforeEach` guard (UNCHANGED).
**Apply to:** No changes — Reports view is inside `/projects/lextrack` which already enforces auth via the existing guard. Phase 26 inherits.

### sessionStorage write-on-watch + read-on-mount + whitelist validation
**Source:** Current `ExpensesTab.vue` lines 45-51 (write watch) + lines 112-119 (read with VALID_SORT_MODES whitelist).
**Apply to:** `ExpensesListView.vue` (move sort-mode block) AND `ExpensesReportsView.vue` (NEW period block — same shape with three keys).

```typescript
// READ (in onMounted) — whitelist validation:
try {
  const stored = sessionStorage.getItem(KEY)
  if (stored && VALID_VALUES.includes(stored)) state.value = stored
} catch {
  // sessionStorage may throw in privacy-mode iframes; fall back to default silently
}

// WRITE (in watch) — non-fatal:
watch(state, (next) => {
  try {
    sessionStorage.setItem(KEY, next)
  } catch {
    // sessionStorage write failures are non-fatal
  }
})
```

### CSS Variables (dark mode auto-switching for DOM elements)
**Source:** `src/assets/base.css` — `@theme` block (lines 5-31) + `.my-app-dark` override block (lines 43-60).
**Apply to:** All inline `style="color: var(--color-...)"` references in `ExpensesReportsView.vue` (period name label, grand total, empty-state icon, DatePicker labels, inline error text).
**No JS required** — Tailwind 4 compiles `@theme` to `:root` rules; `.my-app-dark` on `<html>` swaps them automatically.

### CSS Variables → Chart.js canvas (REQUIRES JS — the dark-mode bridge)
**Source:** RESEARCH.md §Dark mode strategy (composes `useTheme.ts`'s class-on-`<html>` knowledge with `useIsMobile.ts`'s listener teardown).
**Apply to:** ONLY `ExpensesReportsView.vue` chartOptions (the canvas case). DOM-rendered UI uses raw CSS variables; canvas-rendered chart reads them via `getComputedStyle` through `useChartTheme()`.

### Error Handling (data load failures)
**Source:** Current `ExpensesTab.vue` lines 128-133.
**Apply to:** Shell `ExpensesTab.vue` onMounted block stays UNCHANGED (this code does not move).
```typescript
} catch (e: unknown) {
  toast.error('Failed to load expenses. Pull to refresh or reload the page.')
  console.error('ExpensesTab: getFullList failed', e)
} finally {
  isLoading.value = false
}
```

### Error Handling (file token failures — WR-03 pattern)
**Source:** Current `ExpensesTab.vue` lines 100-110.
**Apply to:** Shell `ExpensesTab.vue` `openReceiptPreview` stays UNCHANGED (also does not move — Reports has no receipt preview).

### 44px Touch Targets
**Source:** `WallecxToolbar.vue` line 55 (`min-h-[44px] min-w-[44px] touch-manipulation`) — Phase 15 invariant.
**Apply to:** All period tabs, DatePickers, and the empty-state "Add expense" button in ExpensesReportsView.vue. Implementation: `:deep(.p-tab) { min-height: 44px; }` scoped to the period Tabs container; `class="min-h-[44px]"` on each DatePicker; `class="min-h-[44px]"` on the Button.

### Reactive instant filtering (no debounce)
**Source:** Current `ExpensesTab.vue` filter chain in `filteredSortedExpenses` computed (lines 59-91) — pure `computed` over `expenses.value`, no `useDebounce`.
**Apply to:** `ExpensesReportsView.vue` `periodExpenses` / `grandTotal` / `categoryTotals` computeds. Period switch and DatePicker change recompute synchronously.
**Anti-pattern:** Do NOT import `useDebounce` from `@vueuse/core` — it is NOT installed (verified in package.json — only `@vueuse/motion` ^3.0.3).

### Defensive sessionStorage try/catch
**Source:** Current `ExpensesTab.vue` lines 47-49 / 117-119 — every sessionStorage read AND write is wrapped in try/catch with empty catch body and a one-line comment.
**Apply to:** All three new sessionStorage keys in ExpensesReportsView.vue (period, custom-from, custom-to) — both read and write paths.

---

## No Analog Found

**PrimeVue `<Chart>` component usage** — the codebase has zero existing chart components. This is the first.

**Mitigation for planner:**
1. Treat RESEARCH.md §Chart.js integration patterns (lines 743-809) and UI-SPEC § Per-category horizontal bar chart (lines 244-289) as the authoritative reference for the `<Chart type="bar">` block.
2. The Chart.js `options` shape (especially the `scales.{x,y}.ticks.font` + `tooltip.callbacks.label` config) is research-derived, not codebase-derived. Verify behavior at implementation time.
3. PrimeVue Chart is auto-imported via `PrimeVueResolver` (verified in `vite.config.ts`) — no explicit `import Chart from 'primevue/chart'` needed in the SFC.
4. `chart.js@^4.5.1` peer dep is INSTALLED via Wave 0 task; without it, the chart silently fails (RESEARCH.md Pitfall 2).

---

## Critical Anti-Patterns (from RESEARCH.md)

These patterns exist elsewhere in the codebase OR are suggested by the UI-SPEC's `useMutationObserver` reference, but MUST NOT be applied here:

| Anti-Pattern | Wrong Source | Why Forbidden |
|---|---|---|
| `import { useMutationObserver } from '@vueuse/core'` | UI-SPEC § Dark Mode Contract example | `@vueuse/core` NOT installed; use native `MutationObserver` per useIsMobile.ts listener pattern |
| `dayjs().startOf('quarter')` without registering `quarterOfYear` plugin | Natural dayjs API instinct | Silently returns the input unchanged — the single highest-risk defect in Phase 26. `dayjs.extend(quarterOfYear)` MUST be at top of `src/lib/wallecx/period.ts` |
| Observe ONLY `document.body` for dark class | UI-SPEC dark-mode-contract example code | `useTheme.ts` adds the class to `document.documentElement` (`<html>`), NOT `<body>`. The composable must observe BOTH (defensive) |
| Mutating `chartData.datasets[0].data` in place | Vue reactivity instinct | PrimeVue Chart deep-watches `data` — but mutating arrays can race with `reinit()`. Always return NEW `chartData` object from the `computed` (`.map(...)` produces fresh arrays — already correct in RESEARCH.md target shape) |
| Hard-coded hex values in chart `backgroundColor` | Quick win | Bars must read CSS variables via `useChartTheme()` so dark mode swaps; hard-coded hex breaks the dark contract |
| `import Chart from 'primevue/chart'` | TypeScript instinct | `<Chart>` is auto-resolved via `PrimeVueResolver` (vite.config.ts) — explicit imports duplicate work; follow MembershipsTab.vue pattern (no explicit PrimeVue component imports for auto-resolved tags) |
| Hyphen-minus `-` in custom date-range separator | Keyboard convenience | UI-SPEC requires en-dash U+2013 (` – `). `formatPeriodLabel()` must use the literal en-dash character |
| Adding `chart.js/auto` as a separate npm package | Common confusion | Does not exist as a standalone package. Install only `chart.js` (the `/auto` entry point ships inside it) |
| Animating Grand Total number with CountUp / @vueuse/motion | Polish instinct | UI-SPEC § Transition animation: "no transition — animating a currency number is distracting and risks transient illegible mid-frames" |
| `<ConfirmDialog />` in ExpensesTab template | Phase 25 instinct | STATE.md invariant: ConfirmDialog at WallecxApp.vue shell level only. Phase 26 has no destructive actions anyway |
| New Pinia store for Reports state | Architectural temptation | STATE.md invariant: tab state self-contained in component refs. Period/custom-from/custom-to live in ExpensesReportsView.vue |
| `categoryOptions` derived from filtered/period-filtered expenses (in ExpensesListView) | Natural instinct | Causes feedback loop — always derive from raw `props.expenses` (Phase 25 Pitfall 3, carries through) |

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/composables/`, `src/lib/wallecx/`, `src/assets/`, `package.json`
**Files read:**
- `src/composables/useTheme.ts` (57 lines)
- `src/composables/useIsMobile.ts` (21 lines)
- `src/lib/wallecx/currency.ts` (13 lines)
- `src/components/projects/wallecx/ExpensesTab.vue` (312 lines — current Phase 25 state)
- `src/components/projects/wallecx/WallecxApp.vue` (110 lines)
- `src/components/projects/wallecx/MembershipsTab.vue` (lines 1-80 — sort/sessionStorage pattern)
- `src/assets/base.css` (68 lines)
- `package.json` (85 lines)
- `.planning/phases/26-reporting-view/26-CONTEXT.md` (162 lines, 12 locked decisions)
- `.planning/phases/26-reporting-view/26-RESEARCH.md` (1137 lines, two-page read)
- `.planning/phases/26-reporting-view/26-UI-SPEC.md` (662 lines)
- `.planning/phases/25-read-path-list-view/25-PATTERNS.md` (530 lines — format reference)

**Pattern extraction date:** 2026-05-22
