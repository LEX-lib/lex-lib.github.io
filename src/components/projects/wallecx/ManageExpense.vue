<script setup lang="ts">
import { useIsMobile } from '@/composables/useIsMobile'
import type { Expenses } from '@/types/wallecx/expenses/types'

const visible = defineModel('visible', { type: Boolean, default: false, required: true })
defineModel<Expenses | null>('record', { default: null })

defineEmits<{
  created: [record: Expenses]
  updated: [record: Expenses]
}>()

const isMobile = useIsMobile()
</script>

<template>
  <Dialog
    v-if="!isMobile"
    modal
    v-model:visible="visible"
    header="Expense"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  />
  <Drawer
    v-else
    v-model:visible="visible"
    position="bottom"
  />
</template>
