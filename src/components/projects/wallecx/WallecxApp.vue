<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import ManageVaccination from "./ManageVaccination.vue";

// --- STATE ---
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);
const selectedRecord = ref<Vaccinations | null>(null);
const showDetail = ref(false);
const fileToken = ref<string>("");
const listToken = ref<string>("");
const showManage = ref<boolean>(false);
const manageRecord = ref<Vaccinations | null>(null);
const confirm = useConfirm();

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

function openManage(record: Vaccinations | null): void {
  manageRecord.value = record;
  showManage.value = true;
}

function onCreated(created: Vaccinations): void {
  // unshift = newest first, matching sort: '-date_administered' (UI-SPEC onCreated contract)
  records.value.unshift(created);
}

function onUpdated(updatedRecord: Vaccinations): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id);
  if (idx !== -1) records.value[idx] = updatedRecord;
}

function openDelete(record: Vaccinations): void {
  // D-08: PrimeVue useConfirm service
  // D-09: plain text interpolation — NEVER v-html
  confirm.require({
    message: `Delete "${record.vaccine_name}"? This cannot be undone.`,
    header: "Confirm Delete",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Keep Record", severity: "secondary", outlined: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: () => deleteRecord(record),
  });
}

async function deleteRecord(record: Vaccinations): Promise<void> {
  try {
    // WRITE-06 / Pitfall 4: await server delete BEFORE splicing local state
    await pb.collection("wallecx_vaccinations").delete(record.id);
    const idx = records.value.findIndex((r) => r.id === record.id);
    if (idx !== -1) records.value.splice(idx, 1);
    toast.success("Vaccination deleted.");
  } catch (e: unknown) {
    // On failure: do NOT splice — row stays visible (Pitfall 4)
    toast.error("Failed to delete. Please try again.");
    console.error("WallecxApp: delete failed", e);
  }
}
</script>

<template>
  <Card>
    <template #content>
      <!-- Header row: title + Add button (D-01 — always visible) -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">Wallecx</h1>
        <Button
          label="Add vaccination"
          icon="pi pi-plus"
          size="small"
          @click="openManage(null)"
        />
      </div>

      <VaccinationList
        :records="records"
        :is-loading="isLoading"
        :list-token="listToken"
        @view="openDetail"
        @edit="openManage"
        @remove="openDelete"
        @add-first="openManage(null)"
      />

      <!-- D-08: single ConfirmDialog instance for delete confirmation -->
      <ConfirmDialog />

      <!-- ManageVaccination: unified create/edit dialog -->
      <ManageVaccination
        v-model:visible="showManage"
        v-model:record="manageRecord"
        @created="onCreated"
        @updated="onUpdated"
      />

      <!-- VaccinationDetail dialog — unchanged from Phase 2 -->
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
