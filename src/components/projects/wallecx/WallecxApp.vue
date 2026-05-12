<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import dayjs from "dayjs";
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
const isExporting = ref(false);

// WR-01: refresh listToken before PocketBase's 5-min TTL expires
const LIST_TOKEN_TTL_MS = 4 * 60 * 1000;
let listTokenTimer: ReturnType<typeof setInterval> | null = null;

// --- LOGIC ---
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
    listToken.value = await pb.files.getToken();
    listTokenTimer = setInterval(async () => {
      try {
        listToken.value = await pb.files.getToken();
      } catch (e) {
        console.warn("WallecxApp: listToken refresh failed", e);
      }
    }, LIST_TOKEN_TTL_MS);
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (listTokenTimer) clearInterval(listTokenTimer);
});

async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
      selectedRecord.value = null;
      return; // WR-03: abort — do not open dialog in a token-less state
    }
  }
  showDetail.value = true;
}

function openManage(record: Vaccinations | null): void {
  manageRecord.value = record;
  showManage.value = true;
}

async function exportJson(): Promise<void> {
  if (isExporting.value) return; // POLISH-03: prevent double-click
  const userId = pb.authStore.record?.id;
  if (!userId) {
    toast.error("Session expired. Please log in again.");
    return;
  }
  isExporting.value = true;
  try {
    const allRecords = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });

    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: allRecords.length,
      records: allRecords.map((r) => ({
        id: r.id,
        vaccine_name: r.vaccine_name,
        date_administered: r.date_administered,
        dose_number: r.dose_number ?? null,
        lot_number: r.lot_number ?? null,
        location: r.location ?? null,
        manufacturer: r.manufacturer ?? null,
        notes: r.notes ?? null,
        // POLISH-03: NO token — static reference URL only; card URLs require auth to view
        card_url: r.card ? pb.files.getURL(r, r.card) : null,
        created: r.created,
        updated: r.updated,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wallecx-vaccinations-${dayjs().format("YYYY-MM-DD")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Vaccination records exported.");
  } catch (e: unknown) {
    toast.error("Export failed. Please try again.");
    console.error("WallecxApp: exportJson failed", e);
  } finally {
    isExporting.value = false;
  }
}

function onCreated(created: Vaccinations): void {
  records.value.push(created);
  // MEDIUM-03: maintain date-administered descending sort (matches getFullList sort: '-date_administered')
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
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
      <!-- Header row: title + Download + Add buttons (D-01 — always visible) -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">Wallecx</h1>
        <div class="flex gap-2">
          <Button
            label="Download records"
            icon="pi pi-download"
            size="small"
            severity="secondary"
            :disabled="isExporting"
            :loading="isExporting"
            @click="exportJson"
          />
          <Button
            label="Add vaccination"
            icon="pi pi-plus"
            size="small"
            @click="openManage(null)"
          />
        </div>
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
