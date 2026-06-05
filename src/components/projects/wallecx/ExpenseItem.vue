<script setup lang="ts">
import type { Expenses } from '@/types/wallecx/expenses/types'
import { formatCurrency } from '@/lib/wallecx/currency'
import dayjs from 'dayjs'

defineProps<{ record: Expenses }>()

const emit = defineEmits<{
  edit:    [record: Expenses]
  delete:  [record: Expenses]
  preview: [record: Expenses]
}>()
</script>

<template>
  <div
    class="flex items-center gap-3 py-3 border-b"
    style="border-color: var(--color-surface-divider)"
  >
    <!-- Amount: fixed 96px, bold, brand colour -->
    <div class="w-24 shrink-0 font-bold text-base"
         style="color: var(--color-brand-primary)">
      {{ formatCurrency(record.amount) }}
    </div>

    <!-- Meta + description: fills remaining space -->
    <div class="flex-1 min-w-0">
      <div class="text-xs" style="color: var(--color-typo-muted)">
        {{ dayjs(record.expense_date).format('D MMM YYYY') }} · {{ record.category }}
      </div>
      <div class="text-sm truncate" style="color: var(--color-typo-body)">
        {{ record.description }}
      </div>
    </div>

    <!-- Paperclip icon — only when receipt is truthy (falsy check handles "" and undefined) -->
    <button
      v-if="record.receipt"
      @click.stop="emit('preview', record)"
      class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
      aria-label="View receipt"
    >
      <iconify-icon icon="mdi:paperclip" width="20" height="20"
        style="color: var(--color-typo-muted)" aria-hidden="true" />
    </button>

    <!-- Edit button -->
    <button
      @click.stop="emit('edit', record)"
      class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
      aria-label="Edit expense"
    >
      <iconify-icon icon="mdi:pencil-outline" width="20" height="20"
        style="color: var(--color-typo-muted)" aria-hidden="true" />
    </button>

    <!-- Delete button -->
    <button
      @click.stop="emit('delete', record)"
      class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
      aria-label="Delete expense"
    >
      <iconify-icon icon="mdi:trash-can-outline" width="20" height="20"
        style="color: var(--color-status-error)" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
/*
 * No PrimeVue form components in ExpenseItem — all colour values reference
 * CSS variables from base.css that auto-switch when .my-app-dark is active.
 * No :deep overrides required.
 */
</style>
