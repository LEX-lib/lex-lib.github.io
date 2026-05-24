<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import type { Expenses } from '@/types/wallecx/expenses/types'
import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'
import type { ExpenseCategories } from '@/types/wallecx/expense-categories/types'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import ManageBudget from './ManageBudget.vue'
import { formatCurrency } from '@/lib/wallecx/currency'
import {
  getPeriodRange,
  formatPeriodLabel,
  isValidPeriod,
  PERIOD_STORAGE_KEY,
  PERIOD_FROM_STORAGE_KEY,
  PERIOD_TO_STORAGE_KEY,
  type Period,
} from '@/lib/wallecx/period'
import { useChartTheme } from '@/composables/useChartTheme'

const props = defineProps<{
  expenses: Expenses[]
  budgets: ExpenseBudget[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'request-add-expense': []
  'budgets-saved': []
}>()

// Period state
const period = ref<Period>('this-month')
const customFrom = ref<Date | null>(null)
const customTo = ref<Date | null>(null)

// Theme refs for Chart.js canvas (palette + axis/grid/tooltip colors)
const {
  paletteColors,
  axisColor,
  mutedColor,
  headingColor,
  gridColor,
  surfaceColor,
  dividerColor,
} = useChartTheme()

// Custom-range validation (UI-SPEC §Interaction Contracts → Custom range)
const dateRangeError = computed<string | null>(() => {
  if (period.value !== 'custom') return null
  if (!customFrom.value || !customTo.value) return null
  if (dayjs(customFrom.value).isAfter(dayjs(customTo.value), 'day')) {
    return 'From date must be on or before To date.'
  }
  return null
})

// Resolve the active range — calls into period.ts (quarterOfYear plugin registered there)
const periodRange = computed(() =>
  getPeriodRange(period.value, customFrom.value, customTo.value),
)

// Filter expenses by string comparison on YYYY-MM-DD (mirrors Phase 25 date-range filter)
const periodExpenses = computed<Expenses[]>(() => {
  if (dateRangeError.value) return []
  const fromStr = periodRange.value.from.format('YYYY-MM-DD')
  const toStr = periodRange.value.to.format('YYYY-MM-DD')
  return props.expenses.filter(e => e.expense_date >= fromStr && e.expense_date <= toStr)
})

// EXP-12: grand total — synchronous reduce
const grandTotal = computed(() =>
  periodExpenses.value.reduce((sum, e) => sum + e.amount, 0),
)

// EXP-13: per-category breakdown — Map-based group-and-sum, sorted desc (D-26-6)
const categoryTotals = computed<{ category: string; total: number }[]>(() => {
  const map = new Map<string, number>()
  for (const e of periodExpenses.value) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
  }
  return Array.from(map, ([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
})

// Period name label for Grand Total + chart aria-label
const periodNameLabel = computed(() =>
  formatPeriodLabel(period.value, customFrom.value, customTo.value),
)

// === Phase 28 — Budget vs Actual integration ===

// ManageBudget dialog state (lazy categories load on click — see openManageBudgets)
const showManageBudget = ref(false)
const budgetCategories = ref<ExpenseCategories[]>([])
const isLoadingCategories = ref(false)

// Period-gated budgets (CONTEXT.md D-07/D-08/D-09)
const visibleBudgets = computed<ExpenseBudget[]>(() => {
  if (period.value === 'this-month') {
    return props.budgets.filter((b) => b.budget_type === 'monthly')
  }
  if (period.value === 'this-year') {
    return props.budgets.filter((b) => b.budget_type === 'yearly')
  }
  return []  // this-quarter and custom: section hidden entirely (D-09)
})

// Actual spend per category from the existing categoryTotals computed (period-filtered already)
function actualFor(category: string): number {
  return categoryTotals.value.find((c) => c.category === category)?.total ?? 0
}

function badgeLabel(b: ExpenseBudget): string {
  const actual = actualFor(b.category)
  if (actual > b.amount) return `Over by ${formatCurrency(actual - b.amount)}`
  if (actual < b.amount) return `Under by ${formatCurrency(b.amount - actual)}`
  return 'On budget'
}

function badgeStyle(b: ExpenseBudget): { backgroundColor: string; color: string } {
  const actual = actualFor(b.category)
  const isOver = actual > b.amount
  const token = isOver ? 'var(--color-status-error)' : 'var(--color-status-success)'
  return {
    backgroundColor: `color-mix(in srgb, ${token} 15%, transparent)`,
    color: token,
  }
}

function progressFillStyle(b: ExpenseBudget): { width: string; backgroundColor: string } {
  const actual = actualFor(b.category)
  const isOver = actual > b.amount
  // Defensive guard: if budget amount is 0 the bar fills to 0 (already filtered upstream by upsert
  // delete-on-zero, but cheap to defend here).
  const pct = b.amount > 0 ? Math.min(100, (actual / b.amount) * 100) : 0
  return {
    width: pct + '%',
    backgroundColor: isOver ? 'var(--color-status-error)' : 'var(--color-status-success)',
  }
}

// Open Manage Budgets — load categories on demand (matches ManageExpense.vue's lazy-load pattern)
async function openManageBudgets(): Promise<void> {
  await loadCategoriesForBudget()
  showManageBudget.value = true
}

async function loadCategoriesForBudget(): Promise<void> {
  isLoadingCategories.value = true
  try {
    budgetCategories.value = await pb
      .collection('wallecx_expense_categories')
      .getFullList<ExpenseCategories>({
        requestKey: 'expense-categories-getFullList',  // shared with ManageExpense.vue — safe per RESEARCH Q2
      })
  } catch (e: unknown) {
    toast.error('Failed to load categories. Please try again.')
    console.error('ExpensesReportsView: loadCategoriesForBudget failed', e)
  } finally {
    isLoadingCategories.value = false
  }
}

function onBudgetsSaved(): void {
  emit('budgets-saved')
  showManageBudget.value = false
}

// Reduced-motion detection (UI-SPEC §Accessibility Contract → Reduced motion)
const reducedMotion = computed(() =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches,
)

// Chart.js data — fresh array per recompute (RESEARCH.md anti-pattern: never mutate in place)
const chartData = computed(() => ({
  labels: categoryTotals.value.map(c => c.category),
  datasets: [{
    label: 'Spend',
    data: categoryTotals.value.map(c => c.total),
    backgroundColor: categoryTotals.value.map((_, i) => paletteColors.value[i % 8]),
    borderRadius: 4,
    barThickness: 'flex' as const,
    minBarLength: 20,
  }],
}))

// Chart.js options — depends on useChartTheme refs → reinit() on theme toggle
const chartOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: reducedMotion.value ? 0 : 200 },
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
        font: { family: 'Rubik', size: 12, weight: '400' as const },
        callback: (value: number | string) => formatCurrency(Number(value)),
      },
      grid: { color: gridColor.value },
      border: { color: dividerColor.value },
    },
    y: {
      ticks: {
        color: axisColor.value,
        font: { family: 'Rubik', size: 12, weight: '400' as const },
      },
      grid: { display: false },
      border: { color: dividerColor.value },
    },
  },
}))

// Dynamic chart container height — UI-SPEC §Per-category horizontal bar chart
const chartHeightPx = computed(() =>
  Math.max(220, categoryTotals.value.length * 36),
)

// sessionStorage write watchers (mirrors Phase 25 watcher pattern — non-fatal failure)
watch(period, (next) => {
  try {
    sessionStorage.setItem(PERIOD_STORAGE_KEY, next)
  } catch {
    // sessionStorage write failures are non-fatal (privacy-mode iframe)
  }
})

watch(customFrom, (next) => {
  if (!next) return
  try {
    sessionStorage.setItem(PERIOD_FROM_STORAGE_KEY, dayjs(next).format('YYYY-MM-DD'))
  } catch {
    // non-fatal
  }
})

watch(customTo, (next) => {
  if (!next) return
  try {
    sessionStorage.setItem(PERIOD_TO_STORAGE_KEY, dayjs(next).format('YYYY-MM-DD'))
  } catch {
    // non-fatal
  }
})

onMounted(() => {
  // Restore from sessionStorage with whitelist validation (mirrors Phase 25 pattern)
  try {
    const storedPeriod = sessionStorage.getItem(PERIOD_STORAGE_KEY)
    if (isValidPeriod(storedPeriod)) period.value = storedPeriod
    const storedFrom = sessionStorage.getItem(PERIOD_FROM_STORAGE_KEY)
    if (storedFrom) customFrom.value = dayjs(storedFrom).toDate()
    const storedTo = sessionStorage.getItem(PERIOD_TO_STORAGE_KEY)
    if (storedTo) customTo.value = dayjs(storedTo).toDate()
  } catch {
    // sessionStorage read failures are non-fatal — fall back to defaults
  }

  // Initialize custom defaults if user switches to Custom but has no stored values
  // (D-26-5: defaults are From = first day of current month, To = today)
  if (period.value === 'custom') {
    if (!customFrom.value) customFrom.value = dayjs().startOf('month').toDate()
    if (!customTo.value) customTo.value = new Date()
  }
})

// Watch for switch-to-custom — apply defaults the first time user picks Custom
// without restored values (e.g., first visit ever to the Reports tab)
watch(period, (next) => {
  if (next === 'custom') {
    if (!customFrom.value) customFrom.value = dayjs().startOf('month').toDate()
    if (!customTo.value) customTo.value = new Date()
  }
})
</script>

<template>
  <div class="pt-2">
    <!-- Period selector — PrimeVue Tabs (scrollable per UI-SPEC mobile contract) -->
    <Tabs v-model:value="period" scrollable class="wallecx-period-tabs">
      <TabList>
        <Tab value="this-month">This Month</Tab>
        <Tab value="this-quarter">This Quarter</Tab>
        <Tab value="this-year">This Year</Tab>
        <Tab value="custom">Custom</Tab>
      </TabList>
    </Tabs>

    <!-- Custom-range DatePickers — rendered with v-if (NOT v-show) when period === 'custom' -->
    <div
      v-if="period === 'custom'"
      class="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2 mt-3"
    >
      <div class="flex flex-col gap-1 flex-1 sm:flex-none sm:w-40">
        <label class="text-xs" style="color: var(--color-typo-muted)">From</label>
        <DatePicker
          v-model="customFrom"
          placeholder="From date"
          dateFormat="dd M yy"
          class="w-full min-h-[44px]"
        />
      </div>
      <div class="flex flex-col gap-1 flex-1 sm:flex-none sm:w-40">
        <label class="text-xs" style="color: var(--color-typo-muted)">To</label>
        <DatePicker
          v-model="customTo"
          placeholder="To date"
          dateFormat="dd M yy"
          class="w-full min-h-[44px]"
        />
      </div>
    </div>

    <!-- STATE 1: Loading — skeleton blocks for label, number, and chart area -->
    <div v-if="isLoading" class="mt-6 flex flex-col items-center gap-3">
      <Skeleton width="12rem" height="2.5rem" />
      <Skeleton width="8rem" height="3rem" />
      <Skeleton width="100%" height="220px" class="rounded" />
    </div>

    <!-- STATE 2: Invalid custom range -->
    <p
      v-else-if="dateRangeError"
      role="alert"
      class="text-sm text-center mt-6"
      style="color: var(--color-status-error)"
    >
      {{ dateRangeError }}
    </p>

    <!-- STATE 3: Empty period — centered icon + heading + body + CTA -->
    <div
      v-else-if="periodExpenses.length === 0"
      class="flex flex-col items-center py-12 gap-3"
    >
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
      <Button
        label="Add expense"
        icon="pi pi-plus"
        size="small"
        class="min-h-[44px]"
        @click="emit('request-add-expense')"
      />
    </div>

    <!-- STATE 4: Grand Total hero + horizontal bar chart + Budget vs Actual section -->
    <template v-else>
      <div class="flex flex-col items-center gap-1 my-6">
        <span class="text-sm" style="color: var(--color-typo-muted)">
          Total spend — {{ periodNameLabel }}
        </span>
        <span class="text-3xl font-bold" style="color: var(--color-brand-primary)">
          {{ formatCurrency(grandTotal) }}
        </span>
      </div>

      <!-- Phase 28 — Manage Budgets entry (D-01, UI-SPEC); STATE 4 only -->
      <div class="flex justify-end mb-4">
        <Button
          label="Manage Budgets"
          icon="pi pi-sliders-h"
          severity="secondary"
          size="small"
          class="min-h-[44px]"
          :loading="isLoadingCategories"
          :disabled="isLoadingCategories"
          @click="openManageBudgets"
        />
      </div>

      <div
        class="w-full"
        :style="{ height: chartHeightPx + 'px' }"
        role="img"
        :aria-label="`Per-category expense breakdown for ${periodNameLabel}`"
      >
        <Chart type="bar" :data="chartData" :options="chartOptions" class="w-full h-full" />
      </div>

      <!-- Phase 28 — Budget vs Actual section (D-04/D-05/D-06/D-07/D-08/D-09) -->
      <div v-if="visibleBudgets.length > 0" class="mt-6">
        <h3
          class="text-base font-bold mb-3"
          style="color: var(--color-typo-heading)"
        >
          Budget vs Actual
        </h3>
        <div
          v-for="b in visibleBudgets"
          :key="b.id"
          class="mb-4"
          :aria-label="`Budget for ${b.category}: ${formatCurrency(b.amount)} budget, ${formatCurrency(actualFor(b.category))} actual, ${actualFor(b.category) > b.amount ? 'over' : 'under'}`"
        >
          <div class="text-sm mb-1" style="color: var(--color-typo-heading)">
            {{ b.category }}
          </div>
          <div
            class="w-full h-2 rounded-full"
            style="background-color: var(--color-surface-divider)"
          >
            <div
              class="h-2 rounded-full transition-all"
              :style="progressFillStyle(b)"
            />
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs" style="color: var(--color-typo-muted)">
              {{ formatCurrency(actualFor(b.category)) }}
            </span>
            <span
              class="text-xs font-normal px-2 py-0.5 rounded-full"
              :style="badgeStyle(b)"
            >
              {{ badgeLabel(b) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Phase 28 — ManageBudget modal (Dialog/Drawer split internally) -->
    <ManageBudget
      v-model:visible="showManageBudget"
      :categories="budgetCategories"
      :budgets="budgets"
      @saved="onBudgetsSaved"
    />
  </div>
</template>

<style scoped>
/*
 * Period tabs — UI-SPEC §Component Inventory → Period selector:
 * - 44px touch target floor for all period Tab triggers (Phase 15 invariant)
 * - Tighter horizontal padding so the sub-period tabs read as a tertiary level
 *   under the parent List/Reports sub-tabs (visual hierarchy via padding, not
 *   typography or color).
 */
:deep(.wallecx-period-tabs .p-tab) {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
}
</style>
