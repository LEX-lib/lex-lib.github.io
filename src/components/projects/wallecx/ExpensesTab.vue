<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Expenses } from '@/types/wallecx/expenses/types'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import ManageExpense from './ManageExpense.vue'
import dayjs from 'dayjs'
import { useIsMobile } from '@/composables/useIsMobile'
import ExpensesToolbar from './ExpensesToolbar.vue'
import ExpenseItem from './ExpenseItem.vue'
import AttachmentPreview from './AttachmentPreview.vue'

const expenses = ref<Expenses[]>([])
const isLoading = ref(false)
const showManage = ref(false)
const manageRecord = ref<Expenses | null>(null)
const confirm = useConfirm()
const isMobile = useIsMobile()

// Sort persistence — STATE.md locked key
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

// Receipt preview state
const showPreview = ref(false)
const previewRecord = ref<Expenses | null>(null)
const previewToken = ref<string>('')

// Persist sort mode to sessionStorage whenever it changes
watch(sortMode, (next) => {
  try {
    sessionStorage.setItem(SORT_STORAGE_KEY, next)
  } catch {
    // sessionStorage write failures are non-fatal (privacy-mode iframe)
  }
})

// categoryOptions derived from RAW expenses array (NOT filteredSortedExpenses — RESEARCH.md Pitfall 3)
const categoryOptions = computed<string[]>(() =>
  [...new Set(expenses.value.map(e => e.category))].sort()
)

// filteredSortedExpenses — applies all 4 transforms in order per CONTEXT.md D-10
const filteredSortedExpenses = computed<Expenses[]>(() => {
  let result = expenses.value
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

async function openReceiptPreview(record: Expenses): Promise<void> {
  try {
    previewToken.value = await pb.files.getToken()
  } catch (e: unknown) {
    toast.error('Failed to load receipt. Refresh to try again.')
    console.error('ExpensesTab: getToken failed', e)
    return  // WR-03: never open preview without a token when receipt field is protected=true
  }
  previewRecord.value = record
  showPreview.value = true
}

onMounted(async () => {
  // Restore sort mode BEFORE loading data so first render uses the correct sort
  try {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY)
    if (stored && VALID_SORT_MODES.includes(stored)) sortMode.value = stored
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default
  }
  isLoading.value = true
  try {
    expenses.value = await pb
      .collection('wallecx_expenses')
      .getFullList<Expenses>({
        sort: '-expense_date,-created',
        requestKey: 'expenses-getFullList',  // STATE.md: must not collide with other collection keys
      })
  } catch (e: unknown) {
    toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})

function openManage(record: Expenses | null) {
  manageRecord.value = record
  showManage.value = true
}

function onCreated(record: Expenses) {
  expenses.value.unshift(record)
}

function onUpdated(record: Expenses) {
  const idx = expenses.value.findIndex(e => e.id === record.id)
  if (idx !== -1) {
    expenses.value.splice(idx, 1, record)
  }
}

// Phase 25 triggers deleteExpense from the expense list row actions.
// Wired here per STATE.md invariant: ConfirmDialog at WallecxApp.vue shell level only.
function deleteExpense(record: Expenses) {
  confirm.require({
    header: 'Confirm Delete',
    message: 'Delete this expense? This cannot be undone.',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: 'Delete', severity: 'danger' },
    rejectProps: { label: 'Keep Expense', severity: 'secondary' },
    accept: async () => {
      try {
        await pb.collection('wallecx_expenses').delete(record.id)
        const idx = expenses.value.findIndex(e => e.id === record.id)
        if (idx !== -1) expenses.value.splice(idx, 1)
        toast.success('Expense deleted.')
      } catch {
        toast.error('Failed to delete. Please try again.')
      }
    },
  })
}

// Expose deleteExpense for Phase 25 list row actions
defineExpose({ deleteExpense })
</script>

<template>
  <div>
    <!-- Header row: section title + Add Expense button -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold" style="color: var(--color-typo-heading)">Expenses</h2>
      <Button label="Add Expense" icon="pi pi-plus" size="small" @click="openManage(null)" />
    </div>

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

    <!-- STATE 1: Loading — 3 skeleton rows at list-row height (3rem, not card height) -->
    <div v-if="isLoading" class="flex flex-col gap-1">
      <Skeleton v-for="i in 3" :key="i" height="3rem" class="w-full rounded" />
    </div>

    <!-- STATE 2: No records at all (check raw expenses array, not filtered) -->
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
        @click="openManage(null)"
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
        @edit="openManage(record)"
        @delete="deleteExpense(record)"
        @preview="openReceiptPreview(record)"
      />
    </div>

    <!-- ManageExpense dialog/drawer (preserved from Phase 24 stub) -->
    <ManageExpense
      v-model:visible="showManage"
      v-model:record="manageRecord"
      @created="onCreated"
      @updated="onUpdated"
    />

    <!-- Receipt preview: Dialog on desktop, bottom Drawer on mobile -->
    <Dialog
      v-if="!isMobile"
      v-model:visible="showPreview"
      modal
      header="Receipt"
      :style="{ width: '40rem' }"
      :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
      @hide="previewRecord = null; previewToken = ''"
    >
      <AttachmentPreview
        v-if="previewRecord"
        :record="previewRecord"
        attachment-field="receipt"
        attachment-name="Receipt"
        :token="previewToken"
      />
    </Dialog>

    <Drawer
      v-else
      v-model:visible="showPreview"
      position="bottom"
      @hide="previewRecord = null; previewToken = ''"
    >
      <template #header>
        <div class="flex flex-col items-center w-full gap-1">
          <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
          <span class="font-semibold">Receipt</span>
        </div>
      </template>
      <AttachmentPreview
        v-if="previewRecord"
        :record="previewRecord"
        attachment-field="receipt"
        attachment-name="Receipt"
        :token="previewToken"
      />
    </Drawer>
  </div>
</template>
