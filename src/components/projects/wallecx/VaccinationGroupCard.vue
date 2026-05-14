<script setup lang="ts">
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const props = defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

function thumbUrl(record: Vaccinations): string {
  if (!record.card) return "";
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
</script>

<template>
  <Card
    class="cursor-pointer hover:shadow-md transition-shadow min-h-[44px] touch-manipulation"
    @click="emit('click')"
  >
    <template #content>
      <!-- Type name + badge (D-04: most prominent) -->
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg font-bold" style="color: var(--color-brand-primary)">
          {{ vaccineType }}
        </span>
        <Badge
          :value="`${records.length} record${records.length !== 1 ? 's' : ''}`"
          severity="secondary"
        />
      </div>
      <!-- Last administered date -->
      <p class="text-sm mb-2" style="color: var(--color-typo-heading)">
        Last: {{ displayDate(latestRecord.date_administered) }}
      </p>
      <!-- Thumbnail or placeholder (mirrors VaccinationList.vue pattern) -->
      <img
        v-if="latestRecord.card"
        :src="thumbUrl(latestRecord)"
        :alt="`${vaccineType} vaccination card thumbnail`"
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
  </Card>
</template>
