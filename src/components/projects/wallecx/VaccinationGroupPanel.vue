<script setup lang="ts">
import dayjs from "dayjs";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

defineProps<{
  records: Vaccinations[];
  listToken: string;
}>();

const emit = defineEmits<{
  view: [record: Vaccinations];
  edit: [record: Vaccinations];
  delete: [record: Vaccinations];
}>();

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="record in records"
      :key="record.id"
      class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-3 flex flex-col gap-2"
    >
      <!-- Primary: vaccine name -->
      <p class="font-semibold text-base leading-snug">{{ record.vaccine_name }}</p>

      <!-- Secondary: date / dose / lot — wraps on narrow viewports -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-surface-500 dark:text-surface-400">
        <span>{{ displayDate(record.date_administered) }}</span>
        <span v-if="record.dose_number != null">Dose {{ record.dose_number }}</span>
        <span v-if="record.lot_number">Lot {{ record.lot_number }}</span>
      </div>

      <!-- Actions: full-width row, 44px tap targets -->
      <div class="flex gap-2 pt-1">
        <Button
          size="small"
          label="View"
          class="flex-1 min-h-[44px] touch-manipulation"
          @click="emit('view', record)"
        />
        <Button
          size="small"
          icon="pi pi-pencil"
          label="Edit"
          class="flex-1 min-h-[44px] touch-manipulation"
          severity="secondary"
          @click="emit('edit', record)"
        />
        <Button
          size="small"
          icon="pi pi-trash"
          label="Delete"
          class="flex-1 min-h-[44px] touch-manipulation"
          severity="danger"
          @click="emit('delete', record)"
        />
      </div>
    </div>

    <!-- Empty state -->
    <p v-if="records.length === 0" class="text-center text-surface-400 py-6">
      No vaccinations recorded.
    </p>
  </div>
</template>
