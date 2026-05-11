<script setup lang="ts">
import dayjs from "dayjs";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const props = defineProps<{
  record: Vaccinations;
  token: string;
}>();

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMMM YYYY");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Primary field grid — two columns -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Vaccine</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.vaccine_name }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Date Administered</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ displayDate(record.date_administered) }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Dose Number</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.dose_number ?? '—' }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Lot Number</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.lot_number || '—' }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Manufacturer</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.manufacturer || '—' }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Location</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.location || '—' }}</p>
      </div>
    </div>

    <!-- Notes: full-width, only rendered when truthy; whitespace-pre-wrap preserves newlines -->
    <div v-if="record.notes">
      <p class="text-sm" style="color: var(--color-typo-heading)">Notes</p>
      <p class="text-sm whitespace-pre-wrap" style="color: var(--color-typo-body)">{{ record.notes }}</p>
    </div>

    <!-- Divider separates field grid from attachment preview -->
    <Divider />

    <!-- Attachment preview — passes record and token down to child -->
    <AttachmentPreview :record="record" :token="token" />
  </div>
</template>
