<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Expenses } from '@/types/wallecx/expenses/types'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import ManageExpense from './ManageExpense.vue'

const expenses = ref<Expenses[]>([])
const isLoading = ref(false)
const showManage = ref(false)
const manageRecord = ref<Expenses | null>(null)
const confirm = useConfirm()

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

    <!-- Phase 25 list drop-in point (empty in Phase 24 — no list rendering) -->
    <div>
      <!-- Empty state: shown when expenses array is empty and not loading -->
      <div
        v-if="expenses.length === 0 && !isLoading"
        class="flex flex-col items-center py-12 gap-3"
      >
        <iconify-icon
          icon="mdi:cash-multiple"
          width="48"
          height="48"
          style="color: var(--color-brand-primary)"
          aria-hidden="true"
        />
        <p class="text-sm" style="color: var(--color-typo-muted)">
          No expenses yet — add your first one.
        </p>
        <Button
          label="Add your first expense"
          icon="pi pi-plus"
          size="small"
          @click="openManage(null)"
        />
      </div>
    </div>

    <!-- ManageExpense dialog/drawer -->
    <ManageExpense
      v-model:visible="showManage"
      v-model:record="manageRecord"
      @created="onCreated"
      @updated="onUpdated"
    />
  </div>
</template>
