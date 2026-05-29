<script setup lang="ts">
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import { instrumentedGetFullList } from '@/lib/pocketbase/perfInstrument'
import type { Expenses } from '@/types/wallecx/expenses/types'
import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import { useIsMobile } from '@/composables/useIsMobile'
import DragHandle from './DragHandle.vue'
import WallecxSkeleton from './WallecxSkeleton.vue'
import dayjs from 'dayjs'
import AttachmentPreview from './AttachmentPreview.vue'
import ExpensesListView from './ExpensesListView.vue'
import ExpensesReportsView from './ExpensesReportsView.vue'

const ManageExpense = defineAsyncComponent(() => import('./ManageExpense.vue'))

const props = defineProps<{ pendingAction?: string | null }>()

const expenses = ref<Expenses[]>([])
const isLoading = ref(false)
const showManage = ref(false)
const manageRecord = ref<Expenses | null>(null)
// Edit-mode receipt thumbnail needs ?token on the file URL — wallecx_expenses
// viewRule is `@request.auth.id != "" && user = @request.auth.id`. Mirrors
// MembershipsTab/VaccinationsTab fileToken pattern.
const manageToken = ref<string>('')
const confirm = useConfirm()
const isMobile = useIsMobile()
const isExporting = ref(false)

// Phase 28 — budgets owned by the shell (CONTEXT.md "Budget data ownership"); passed to Reports view.
const budgets = ref<ExpenseBudget[]>([])

async function loadBudgets(opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }): Promise<void> {
  try {
    budgets.value = await instrumentedGetFullList<ExpenseBudget>('wallecx_expense_budgets', {
      requestKey: 'expense-budgets-getFullList',  // STATE.md invariant — distinct key
    })
  } catch (e: unknown) {
    const msg = opts.context === 'mount'
      ? 'Failed to load budgets.'
      : 'Failed to refresh budgets after save. Reload to see changes.'
    toast.error(msg)
    console.error('ExpensesTab: loadBudgets failed', e)
  }
}

// Receipt preview state (stays in the shell — Reports sub-tab in Plan 26-03 does NOT use this)
const showPreview = ref(false)
const previewRecord = ref<Expenses | null>(null)
const previewToken = ref<string>('')

// Sub-tab routing — D-26-1: List (Phase 25) | Reports (Phase 26)
// Default 'list'; persistence across sessions deferred (UI-SPEC §Sub-tab persistence: out of scope).
type SubTab = 'list' | 'reports'
const activeSubTab = ref<SubTab>('list')

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
  isLoading.value = true
  try {
    expenses.value = await instrumentedGetFullList<Expenses>('wallecx_expenses', {
      sort: '-expense_date,-created',
      requestKey: 'expenses-getFullList',  // STATE.md: must not collide with other collection keys
    })
  } catch (e: unknown) {
    toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
  await loadBudgets({ context: 'mount' })
})

async function openManage(record: Expenses | null) {
  // Edit mode with an existing receipt needs a file token to render the thumbnail.
  // Fetch unconditionally — cheap (one auth-scoped call) and keeps the prop shape stable.
  // If token fetch fails, still open the dialog (form fields work without it; only the
  // thumbnail will be blank), but surface the failure so the user knows why.
  if (record !== null) {
    try {
      manageToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      manageToken.value = ''
      toast.error('Receipt preview unavailable. Form will still save.')
      console.error('ExpensesTab: getToken (manage) failed', e)
    }
  } else {
    manageToken.value = ''
  }
  manageRecord.value = record
  showManage.value = true
}

// Clear the manage-token when the dialog closes (mirrors MembershipsTab @hide pattern).
watch(showManage, (v) => {
  if (!v) manageToken.value = ''
})

// PWA-09: pendingAction watcher — immediate:true catches values set before this watcher registers (Pitfall 4)
watch(
  () => props.pendingAction,
  (action) => {
    if (action === 'add-expense') {
      openManage(null);
    } else if (action === 'open-reports') {
      activeSubTab.value = 'reports';
    }
  },
  { immediate: true }
)

function onCreated(record: Expenses) {
  expenses.value.unshift(record)
}

function onUpdated(record: Expenses) {
  const idx = expenses.value.findIndex(e => e.id === record.id)
  if (idx !== -1) {
    expenses.value.splice(idx, 1, record)
  }
}

// Delete uses useConfirm; the confirm dialog itself is mounted at WallecxApp.vue shell level.
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

// Phase 24 invariant: expose deleteExpense for parent (WallecxApp) inspection / future test hooks.
defineExpose({ deleteExpense })

async function exportJson(): Promise<void> {
  if (isExporting.value) return
  const userId = pb.authStore.record?.id
  if (!userId) {
    toast.error("Session expired. Please log in again.")
    return
  }
  isExporting.value = true
  try {
    const allRecords = await pb
      .collection("wallecx_expenses")
      .getFullList<Expenses>({
        sort: "-expense_date,-created",
        requestKey: "expenses-export",
      })
    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: allRecords.length,
      records: allRecords.map((r) => ({
        id: r.id,
        amount: r.amount,
        expense_date: r.expense_date,
        category: r.category,
        description: r.description,
        notes: r.notes ?? null,
        receipt_url: r.receipt ? pb.files.getURL(r, r.receipt) : null,
        created: r.created,
        updated: r.updated,
      })),
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `wallecx-expenses-${dayjs().format("YYYY-MM-DD")}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    toast.success("Expenses exported.")
  } catch (e: unknown) {
    toast.error("Export failed. Please try again.")
    console.error("ExpensesTab: exportJson failed", e)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header row: Download + Add buttons -->
    <div class="flex gap-2 mb-4 sm:justify-end">
      <Button
        class="flex-1 sm:flex-none"
        label="Download records"
        icon="pi pi-download"
        severity="secondary"
        size="small"
        :disabled="isExporting"
        :loading="isExporting"
        @click="exportJson"
      />
      <Button
        class="flex-1 sm:flex-none"
        label="Add Expense"
        icon="pi pi-plus"
        size="small"
        @click="openManage(null)"
      />
    </div>

    <!-- Sub-tab shell: List (Phase 25) | Reports (Phase 26 EXP-11/12/13) -->
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
            :budgets="budgets"
            :is-loading="isLoading"
            @request-add-expense="openManage(null)"
            @budgets-saved="loadBudgets"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- ManageExpense dialog/drawer (preserved from Phase 24/25) -->
    <Suspense>
      <ManageExpense
        v-model:visible="showManage"
        v-model:record="manageRecord"
        :token="manageToken"
        @created="onCreated"
        @updated="onUpdated"
      />
      <template #fallback>
        <WallecxSkeleton variant="expense-row" />
      </template>
    </Suspense>

    <!-- Receipt preview: Dialog on desktop, bottom Drawer on mobile (preserved from Phase 25) -->
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
          <DragHandle />
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

<style scoped>
/*
 * Sub-tab differentiation — UI-SPEC §Sub-tab shell:
 * Same PrimeVue Tabs component + same Aura active-tab underline as the parent
 * WallecxApp top-level Tabs; perceptual nesting depth comes from tighter
 * horizontal padding on the Tab triggers (no icons on sub-tabs; structural cue).
 */
:deep(.wallecx-sub-tabs .p-tablist .p-tab) {
  padding: 0.5rem 0.75rem;
  min-height: 44px;
}
</style>
