<script setup lang="ts">
import dayjs from "dayjs";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

defineProps<{
  records: Vaccinations[];
  listToken: string; // included for API consistency; unused in Drawer columns
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
  <DataTable :value="records" striped-rows table-style="min-width: 24rem">
    <Column field="vaccine_name" header="Vaccine" />
    <Column header="Date" style="width: 8rem">
      <template #body="{ data }">{{ displayDate(data.date_administered) }}</template>
    </Column>
    <Column header="Dose" style="width: 4rem">
      <template #body="{ data }">{{ data.dose_number ?? '—' }}</template>
    </Column>
    <Column header="Lot" style="width: 6rem">
      <template #body="{ data }">{{ data.lot_number || '—' }}</template>
    </Column>
    <Column header="" style="width: 14rem">
      <template #body="{ data }: { data: Vaccinations }">
        <div class="flex gap-1">
          <Button size="small" label="View" class="min-h-[44px] touch-manipulation" @click="emit('view', data)" />
          <Button size="small" icon="pi pi-pencil" label="Edit" class="min-h-[44px] touch-manipulation" severity="secondary" @click="emit('edit', data)" />
          <Button size="small" icon="pi pi-trash" label="Delete" class="min-h-[44px] touch-manipulation" severity="danger" @click="emit('delete', data)" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
