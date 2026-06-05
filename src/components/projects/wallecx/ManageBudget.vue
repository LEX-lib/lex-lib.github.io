<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import BaseMobileDialog from './BaseMobileDialog.vue'
import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'
import type { ExpenseCategories } from '@/types/wallecx/expense-categories/types'

const props = defineProps<{
  categories: ExpenseCategories[]
  budgets: ExpenseBudget[]
}>()

const visible = defineModel('visible', { type: Boolean, default: false, required: true })

const emit = defineEmits<{
  saved: []
}>()

const isSaving = ref(false)
const baseDialogRef = ref<InstanceType<typeof BaseMobileDialog> | null>(null)

type BudgetRow = {
  category: string
  amount: number | null
  budgetType: 'monthly' | 'yearly'
}
const localRows = ref<BudgetRow[]>([])

// FD-09: Dirty snapshot — taken AFTER localRows is rebuilt on open
const openSnapshot = ref<string>('')

// Map existing budget records by category name for O(1) lookup during pre-pop + save
const budgetMap = computed(() => {
  const map = new Map<string, ExpenseBudget>()
  for (const b of props.budgets) map.set(b.category, b)
  return map
})

// Pre-population — fires every time dialog opens; rebuild rows from current props
// (28-CONTEXT D-02 + 28-RESEARCH Pitfall 6: stale state on reopen)
// FD-09: snapshot taken immediately AFTER localRows rebuild
watch(visible, (isOpen) => {
  if (!isOpen) {
    // MD-02: reset transient save state on close so a dialog closed mid-save does
    // not reopen with the Save button stuck disabled.
    isSaving.value = false
    return
  }
  localRows.value = props.categories.map((c) => {
    const existing = budgetMap.value.get(c.name)
    return {
      category: c.name,
      amount: existing?.amount ?? null,
      budgetType: existing?.budget_type ?? 'monthly',
    }
  })
  // Snapshot for dirty tracking (FD-09) — taken after localRows is rebuilt
  openSnapshot.value = JSON.stringify(localRows.value)
})

// FD-09: isDirty computed — passed to BaseMobileDialog :is-dirty prop
const isDirty = computed<boolean>(() => JSON.stringify(localRows.value) !== openSnapshot.value)

// FD-09: Explicit Cancel — close without triggering dirty guard
function onCancel(): void {
  baseDialogRef.value?.closeWithoutGuard()
}

async function onSubmit(): Promise<void> {
  const userId = pb.authStore.record?.id
  if (!userId) {
    toast.error('Session expired. Please log in again.')
    return
  }
  isSaving.value = true
  try {
    // Concurrent upsert per row. Per RESEARCH.md Pitfall 4: PocketBase has no
    // cross-collection transactions; partial failure (some rows commit, some not)
    // is acceptable for non-critical personal budget data. Parent re-fetches on
    // 'saved' so UI reflects actual server state.
    await Promise.all(
      localRows.value.map(async (row) => {
        const existing = budgetMap.value.get(row.category)
        const isBlankOrZero = row.amount == null || row.amount <= 0
        if (isBlankOrZero) {
          if (existing) {
            await pb.collection('wallecx_expense_budgets').delete(existing.id)
          }
          return
        }
        if (existing) {
          await pb.collection('wallecx_expense_budgets').update(existing.id, {
            budget_type: row.budgetType,
            amount: row.amount,
          })
        } else {
          await pb.collection('wallecx_expense_budgets').create({
            user: userId,
            category: row.category,
            budget_type: row.budgetType,
            amount: row.amount,
          })
        }
      }),
    )
    toast.success('Budgets saved.')
    emit('saved')
    // FD-09: bypass dirty guard on successful save
    baseDialogRef.value?.closeWithoutGuard()
  } catch (e: unknown) {
    toast.error('Failed to save budgets. Please try again.')
    console.error('ManageBudget: onSubmit failed', e)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseMobileDialog
    ref="baseDialogRef"
    v-model:visible="visible"
    title="Manage Budgets"
    :is-dirty="isDirty"
    :is-saving="isSaving"
  >
    <!-- #default slot: form body rendered ONCE (Pattern S-1) -->
    <form @submit.prevent="onSubmit" id="manage-budget-form" class="space-y-4">
      <div
        v-for="(row, idx) in localRows"
        :key="row.category"
        class="flex flex-col gap-1 pb-3"
        :class="{ 'border-b': idx < localRows.length - 1 }"
        :style="idx < localRows.length - 1 ? { borderColor: 'var(--color-surface-divider)' } : {}"
      >
        <label
          :for="`budget-amount-${idx}`"
          class="text-sm"
          style="color: var(--color-typo-heading)"
        >
          {{ row.category }}
        </label>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <!-- FD-03 (Contract 7 ManageBudget): inputmode=decimal; last-row enterkeyhint=done -->
          <InputNumber
            :id="`budget-amount-${idx}`"
            v-model="row.amount"
            fluid
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0"
            :disabled="isSaving"
            placeholder="0.00"
            class="min-h-[44px] flex-1"
            inputmode="decimal"
            :enterkeyhint="idx === localRows.length - 1 ? 'done' : 'next'"
            autocomplete="off"
          />
          <SelectButton
            v-model="row.budgetType"
            :options="[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            :disabled="isSaving"
            class="min-h-[44px]"
          />
        </div>
      </div>
    </form>

    <!-- #actions slot: Save/Cancel buttons (UI-SPEC Contract 2) -->
    <template #actions>
      <div class="flex gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          fluid
          :disabled="isSaving"
          @click="onCancel"
        />
        <Button
          type="submit"
          form="manage-budget-form"
          label="Save Budgets"
          fluid
          :loading="isSaving"
          :disabled="isSaving"
        />
      </div>
    </template>
  </BaseMobileDialog>
</template>
