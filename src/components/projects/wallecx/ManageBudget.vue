<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import { useIsMobile } from '@/composables/useIsMobile'
import DragHandle from './DragHandle.vue'
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

const isMobile = useIsMobile()
const isSaving = ref(false)

type BudgetRow = {
  category: string
  amount: number | null
  budgetType: 'monthly' | 'yearly'
}
const localRows = ref<BudgetRow[]>([])

// Map existing budget records by category name for O(1) lookup during pre-pop + save
const budgetMap = computed(() => {
  const map = new Map<string, ExpenseBudget>()
  for (const b of props.budgets) map.set(b.category, b)
  return map
})

// Pre-population — fires every time dialog opens; rebuild rows from current props
// (28-CONTEXT D-02 + 28-RESEARCH Pitfall 6: stale state on reopen)
watch(visible, (isOpen) => {
  if (!isOpen) return
  localRows.value = props.categories.map((c) => {
    const existing = budgetMap.value.get(c.name)
    return {
      category: c.name,
      amount: existing?.amount ?? null,
      budgetType: existing?.budget_type ?? 'monthly',
    }
  })
})

// MD-02: reset transient save state on dismiss (backdrop tap / back-gesture /
// swipe-down) so a Drawer/Dialog closed mid-save does not reopen with the Save
// button stuck disabled. Mirrors the onHide reset pattern in ManageExpense /
// ManageMembership / ManageVaccination.
function onHide(): void {
  isSaving.value = false
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
    visible.value = false
  } catch (e: unknown) {
    toast.error('Failed to save budgets. Please try again.')
    console.error('ManageBudget: onSubmit failed', e)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Dialog
    v-if="!isMobile"
    modal
    v-model:visible="visible"
    header="Manage Budgets"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
    :closable="!isSaving"
    @hide="onHide"
  >
    <form @submit.prevent="onSubmit" class="space-y-4">
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

      <Button
        type="submit"
        fluid
        label="Save Budgets"
        :loading="isSaving"
        :disabled="isSaving"
        class="min-h-[44px]"
      />
    </form>
  </Dialog>

  <Drawer
    v-else
    v-model:visible="visible"
    position="bottom"
    :show-close-icon="!isSaving"
    @hide="onHide"
  >
    <template #header>
      <div class="flex flex-col items-center w-full gap-1">
        <DragHandle />
        <span class="font-semibold">Manage Budgets</span>
      </div>
    </template>
    <form @submit.prevent="onSubmit" class="space-y-4">
      <div
        v-for="(row, idx) in localRows"
        :key="row.category"
        class="flex flex-col gap-1 pb-3"
        :class="{ 'border-b': idx < localRows.length - 1 }"
        :style="idx < localRows.length - 1 ? { borderColor: 'var(--color-surface-divider)' } : {}"
      >
        <label
          :for="`budget-amount-m-${idx}`"
          class="text-sm"
          style="color: var(--color-typo-heading)"
        >
          {{ row.category }}
        </label>
        <div class="flex flex-col gap-2">
          <InputNumber
            :id="`budget-amount-m-${idx}`"
            v-model="row.amount"
            fluid
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0"
            :disabled="isSaving"
            placeholder="0.00"
            class="min-h-[44px]"
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

      <Button
        type="submit"
        fluid
        label="Save Budgets"
        :loading="isSaving"
        :disabled="isSaving"
        class="min-h-[44px]"
      />
    </form>
  </Drawer>
</template>

<style scoped>
:deep(.my-app-dark .p-dialog),
:deep(.my-app-dark .p-dialog .p-dialog-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
:deep(.my-app-dark .p-drawer),
:deep(.my-app-dark .p-drawer .p-drawer-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
</style>
