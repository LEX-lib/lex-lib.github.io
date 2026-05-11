<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

// --- STATE ---
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);
const selectedRecord = ref<Vaccinations | null>(null);
const showDetail = ref(false);
const fileToken = ref<string>("");
const listToken = ref<string>("");

// --- LOGIC ---
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
    listToken.value = await pb.files.getToken();
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});

async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
    }
  }
  showDetail.value = true;
}
</script>

<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">
          Wallecx
        </h1>
      </div>
      <VaccinationList
        :records="records"
        :is-loading="isLoading"
        :list-token="listToken"
        @view="openDetail"
        @edit="() => {}"
        @remove="() => {}"
      />

      <Dialog
        v-model:visible="showDetail"
        modal
        header="Vaccination Record"
        :style="{ width: '40rem' }"
        :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
        @hide="selectedRecord = null; fileToken = ''"
      >
        <VaccinationDetail
          v-if="selectedRecord"
          :record="selectedRecord"
          :token="fileToken"
        />
      </Dialog>
    </template>
  </Card>
</template>

<style scoped></style>
