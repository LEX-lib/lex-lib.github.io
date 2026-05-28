<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import type { Expenses } from '@/types/wallecx/expenses/types'
import ExpensesToolbar from './ExpensesToolbar.vue'
import ExpenseItem from './ExpenseItem.vue'
import { useIsMobile } from '@/composables/useIsMobile'
import WallecxSkeleton from './WallecxSkeleton.vue'

const props = defineProps<{
  expenses: Expenses[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  edit:                  [record: Expenses]
  delete:                [record: Expenses]
  preview:               [record: Expenses]
  'request-add-expense': []
}>()

const isMobile = useIsMobile()

// Sort persistence — STATE.md locked key (moved verbatim from ExpensesTab.vue)
const SORT_STORAGE_KEY = 'wallecx:expense-sort'
const VALID_SORT_MODES = ['newest-first', 'oldest-first', 'category-asc', 'amount-high', 'amount-low']

const sortMode = ref<string>('newest-first')
const searchQuery = ref<string>('')
const selectedCategories = ref<string[]>([])
const dateFrom = ref<Date | null>(null)
const dateTo = ref<Date | null>(null)

// Sort options — passed as prop to ExpensesToolbar
const expenseSortOptions = [
  { value: 'newest-first', label: 'Newest First' },
  { value: 'oldest-first', label: 'Oldest First' },
  { value: 'category-asc', label: 'Category A–Z' },
  { value: 'amount-high',  label: 'Amount: High to Low' },
  { value: 'amount-low',   label: 'Amount: Low to High' },
]

// Persist sort mode to sessionStorage whenever it changes
watch(sortMode, (next) => {
  try {
    sessionStorage.setItem(SORT_STORAGE_KEY, next)
  } catch {
    // sessionStorage write failures are non-fatal (privacy-mode iframe)
  }
})

// categoryOptions derived from RAW expenses array (NOT filteredSortedExpenses — Phase 25 Pitfall 3)
const categoryOptions = computed<string[]>(() =>
  [...new Set(props.expenses.map(e => e.category))].sort()
)

// filteredSortedExpenses — applies all 4 transforms in order per Phase 25 D-10
const filteredSortedExpenses = computed<Expenses[]>(() => {
  let result = props.expenses
  // 1. description search (case-insensitive)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(e => e.description.toLowerCase().includes(q))
  }
  // 2. category filter (empty array = show all)
  if (selectedCategories.value.length > 0) {
    result = result.filter(e => selectedCategories.value.includes(e.category))
  }
  // 3. date range — dayjs converts Date object to YYYY-MM-DD string for lexicographic comparison
  if (dateFrom.value) {
    const from = dayjs(dateFrom.value).format('YYYY-MM-DD')
    result = result.filter(e => e.expense_date >= from)
  }
  if (dateTo.value) {
    const to = dayjs(dateTo.value).format('YYYY-MM-DD')
    result = result.filter(e => e.expense_date <= to)
  }
  // 4. sort
  const sorted = [...result]
  switch (sortMode.value) {
    case 'oldest-first': sorted.sort((a, b) => a.expense_date.localeCompare(b.expense_date)); break
    case 'category-asc': sorted.sort((a, b) => a.category.localeCompare(b.category)); break
    case 'amount-high':  sorted.sort((a, b) => b.amount - a.amount); break
    case 'amount-low':   sorted.sort((a, b) => a.amount - b.amount); break
    default: sorted.sort((a, b) =>
      b.expense_date.localeCompare(a.expense_date) || b.created.localeCompare(a.created)
    )
  }
  return sorted
})

function clearFilters(): void {
  searchQuery.value = ''
  selectedCategories.value = []
  dateFrom.value = null
  dateTo.value = null
}

onMounted(() => {
  // Restore sort mode (matches Phase 25 onMounted sort-restore block; getFullList stays in parent shell)
  try {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY)
    if (stored && VALID_SORT_MODES.includes(stored)) sortMode.value = stored
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default
  }
})
</script>

<template>
  <div>
    <!-- Sticky toolbar wrapper — class applied on mobile only (LT-05 / D-34-01) -->
    <!-- Note: sticky wrapper lives here in ExpensesListView (not ExpensesTab) because
         ExpensesToolbar renders here, inside the ExpensesListView sub-component shell. -->
    <div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
      <!-- Toolbar: search + sort + category MultiSelect + date range — hidden during loading skeleton only -->
      <ExpensesToolbar
        v-if="!isLoading"
        v-model:search-query="searchQuery"
        v-model:sort-mode="sortMode"
        v-model:selected-categories="selectedCategories"
        v-model:date-from="dateFrom"
        v-model:date-to="dateTo"
        :sort-options="expenseSortOptions"
        :category-options="categoryOptions"
      />
    </div>

    <!-- STATE 1: Loading — 3 skeleton rows at list-row height (3rem, not card height) -->
    <WallecxSkeleton v-if="isLoading" variant="expense-row" :count="3" />

    <!-- STATE 2: No records at all (check raw props.expenses, not filtered) -->
    <div
      v-else-if="expenses.length === 0"
      class="flex flex-col items-center py-12 gap-3"
    >
      <iconify-icon
        icon="mdi:cash-multiple"
        width="48"
        height="48"
        style="color: var(--color-brand-primary)"
        aria-hidden="true"
      />
      <p class="text-sm font-bold" style="color: var(--color-typo-heading)">
        No expenses yet.
      </p>
      <p class="text-sm" style="color: var(--color-typo-muted)">
        Add your first expense to start tracking.
      </p>
      <Button
        label="Add expense"
        icon="pi pi-plus"
        size="small"
        @click="emit('request-add-expense')"
      />
    </div>

    <!-- STATE 3: Records exist but filters/search produce no results -->
    <div
      v-else-if="filteredSortedExpenses.length === 0"
      class="flex flex-col items-center py-12 gap-3"
    >
      <iconify-icon
        icon="mdi:filter-remove-outline"
        width="48"
        height="48"
        style="color: var(--color-brand-primary)"
        aria-hidden="true"
      />
      <p class="text-sm font-bold" style="color: var(--color-typo-heading)">
        No expenses match your filters.
      </p>
      <Button
        label="Clear filters"
        severity="secondary"
        size="small"
        @click="clearFilters"
      />
    </div>

    <!-- STATE 4: Data list — v-for over filteredSortedExpenses -->
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
  </div>
</template>
