<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Expenses } from '@/types/wallecx/expenses/types'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import { useIsMobile } from '@/composables/useIsMobile'
import ManageExpense from './ManageExpense.vue'
import AttachmentPreview from './AttachmentPreview.vue'
import ExpensesListView from './ExpensesListView.vue'

const expenses = ref<Expenses[]>([])
const isLoading = ref(false)
const showManage = ref(false)
const manageRecord = ref<Expenses | null>(null)
const confirm = useConfirm()
const isMobile = useIsMobile()

// Receipt preview state (stays in the shell — Reports sub-tab in Plan 26-03 does NOT use this)
const showPreview = ref(false)
const previewRecord = ref<Expenses | null>(null)
const previewToken = ref<string>('')

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
</script>

<template>
  <div>
    <!-- Header row: section title + Add Expense button (unchanged from Phase 25) -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold" style="color: var(--color-typo-heading)">Expenses</h2>
      <Button label="Add Expense" icon="pi pi-plus" size="small" @click="openManage(null)" />
    </div>

    <!-- Delegated list view — receives expenses + isLoading as props; re-emits row actions -->
    <ExpensesListView
      :expenses="expenses"
      :is-loading="isLoading"
      @edit="openManage"
      @delete="deleteExpense"
      @preview="openReceiptPreview"
      @request-add-expense="openManage(null)"
    />

    <!-- ManageExpense dialog/drawer (preserved from Phase 24/25) -->
    <ManageExpense
      v-model:visible="showManage"
      v-model:record="manageRecord"
      @created="onCreated"
      @updated="onUpdated"
    />

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
