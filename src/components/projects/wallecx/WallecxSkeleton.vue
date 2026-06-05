<script setup lang="ts">
interface Props {
  variant: 'vaccination-card' | 'membership-card' | 'expense-row' | 'reports-chart' | 'attachment'
  count?: number
}
const props = withDefaults(defineProps<Props>(), { count: 1 })
</script>

<template>
  <!-- vaccination-card → mirrors VaccinationsTab.vue lines 358–365 -->
  <div v-if="props.variant === 'vaccination-card'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Card v-for="i in props.count" :key="i">
      <template #content>
        <Skeleton height="6rem" />
      </template>
    </Card>
  </div>

  <!-- membership-card → mirrors MembershipsTab.vue lines 256–263 -->
  <div v-else-if="props.variant === 'membership-card'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Card v-for="i in props.count" :key="i">
      <template #content>
        <Skeleton height="8rem" />
      </template>
    </Card>
  </div>

  <!-- expense-row → mirrors ExpensesListView.vue lines 128–131 -->
  <div v-else-if="props.variant === 'expense-row'" class="flex flex-col gap-1">
    <Skeleton v-for="i in props.count" :key="i" height="3rem" class="w-full rounded" />
  </div>

  <!-- reports-chart → mirrors ExpensesReportsView.vue lines 430–435 -->
  <div v-else-if="props.variant === 'reports-chart'" class="mt-6 flex flex-col items-center gap-3">
    <Skeleton width="12rem" height="2.5rem" />
    <Skeleton width="8rem" height="3rem" />
    <Skeleton width="100%" height="220px" class="rounded" />
  </div>

  <!-- attachment → mirrors AttachmentPreview.vue lines 75–80 (generic "Loading…" copy) -->
  <div v-else-if="props.variant === 'attachment'" class="flex flex-col items-center py-6 gap-2">
    <Skeleton height="12rem" class="w-full" />
    <p class="text-sm" style="color: var(--color-typo-muted)">Loading…</p>
  </div>
</template>
