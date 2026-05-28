<script setup lang="ts">
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const props = defineProps<{
  records: Vaccinations[];
  isLoading: boolean;
  listToken: string;
}>();

const emit = defineEmits<{
  view: [record: Vaccinations];
  edit: [record: Vaccinations];
  remove: [record: Vaccinations];
  addFirst: [];
}>();

// Skeleton placeholder array — must have length > 0 or DataTable renders no body rows (Pitfall 6)
const skeletonRows = Array.from({ length: 3 }, (_, i) => ({ id: String(i) }));

function thumbUrl(record: Vaccinations): string {
  if (!record.card) return ""; // WR-02: guard against empty-string card field
  // PocketBase thumb generator returns 404 for WebP sources (Phase 36 PF-07 cards
  // are now WebP). Fall back to the full file URL when .webp.
  const isWebP = record.card.toLowerCase().endsWith(".webp");
  return pb.files.getURL(
    record,
    record.card,
    isWebP ? { token: props.listToken } : { thumb: "100x100", token: props.listToken },
  );
}

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
</script>

<template>
  <!-- Loading state: DataTable fed skeletonRows, Skeleton in every cell -->
  <DataTable v-if="isLoading" :value="skeletonRows" table-style="min-width: 30rem">
    <Column header="Card" style="width: 4rem">
      <template #body>
        <Skeleton shape="rectangle" width="3rem" height="3rem" />
      </template>
    </Column>
    <Column header="Vaccine">
      <template #body><Skeleton /></template>
    </Column>
    <Column header="Date" style="width: 8rem">
      <template #body><Skeleton /></template>
    </Column>
    <Column header="Dose" style="width: 4rem">
      <template #body><Skeleton /></template>
    </Column>
    <Column header="" style="width: 10rem">
      <template #body><Skeleton width="8rem" /></template>
    </Column>
  </DataTable>

  <!-- Empty state: centered icon + message + CTA (D-02) -->
  <div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
    <iconify-icon
      icon="mdi:needle-off"
      width="48"
      height="48"
      style="color: var(--color-brand-primary)"
    ></iconify-icon>
    <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
    <Button
      label="Add your first vaccination"
      icon="pi pi-plus"
      size="small"
      @click="emit('addFirst')"
    />
  </div>

  <!-- Data state: striped DataTable with real records -->
  <DataTable v-else :value="records" table-style="min-width: 30rem" striped-rows>
    <Column header="Card" style="width: 4rem">
      <template #body="{ data }">
        <img
          v-if="data.card"
          :src="thumbUrl(data)"
          :alt="`${data.vaccine_name} vaccination card thumbnail`"
          class="w-12 h-12 object-cover rounded"
        />
        <iconify-icon
          v-else
          icon="mdi:image-off"
          width="32"
          height="32"
          style="color: var(--color-typo-muted)"
        ></iconify-icon>
      </template>
    </Column>
    <Column field="vaccine_name" header="Vaccine" />
    <Column header="Date" style="width: 8rem">
      <template #body="{ data }">{{ displayDate(data.date_administered) }}</template>
    </Column>
    <Column header="Dose" style="width: 5rem">
      <template #body="{ data }">{{ data.dose_number ?? "—" }}</template>
    </Column>
    <Column header="" style="width: 10rem">
      <template #body="{ data }">
        <div class="flex gap-1">
          <Button size="small" label="View Record" @click="emit('view', data)" />
          <Button
            size="small"
            severity="secondary"
            label="Edit"
            @click="emit('edit', data)"
          />
          <Button
            size="small"
            severity="danger"
            label="Remove"
            @click="emit('remove', data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
