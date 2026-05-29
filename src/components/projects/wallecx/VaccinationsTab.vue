<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import { instrumentedGetFullList } from "@/lib/pocketbase/perfInstrument";
import WallecxSkeleton from "./WallecxSkeleton.vue";
const ManageVaccination = defineAsyncComponent(() => import("./ManageVaccination.vue"));

const props = defineProps<{ pendingAction?: string | null }>();

import VaccinationGroupCard from "./VaccinationGroupCard.vue";
import VaccinationGroupPanel from "./VaccinationGroupPanel.vue";
import WallecxToolbar from './WallecxToolbar.vue';
import DragHandle from './DragHandle.vue';
import { useIsMobile } from "@/composables/useIsMobile";

const VIEW_MODE_STORAGE_KEY = 'wallecx:view-mode';

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
const showGroupPanel = ref(false);
const selectedGroup = ref<VaccineGroup | null>(null);
const searchQuery = ref<string>('');
const sortMode = ref<string>('type-asc');
const viewMode = ref<'grid' | 'list'>('grid');
const isMobile = useIsMobile();

const vaccinationSortOptions = [
  { value: 'type-asc',  label: 'Type A–Z' },
  { value: 'type-desc', label: 'Type Z–A' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

// --- GROUPING ---
interface VaccineGroup {
  vaccineType: string;         // "COVID-19", "Flu", ..., "Uncategorized"
  records: Vaccinations[];     // order preserved from records ref (sorted -date_administered)
  latestRecord: Vaccinations;  // records[0] — most recent by date_administered
}

const groupedVaccinations = computed<VaccineGroup[]>(() => {
  const map = new Map<string, Vaccinations[]>();
  for (const record of records.value) {
    const key = record.vaccine_type?.trim() || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(record);
  }
  const named: VaccineGroup[] = [];
  const uncategorized: VaccineGroup[] = [];
  for (const [key, recs] of map.entries()) {
    const group: VaccineGroup = {
      vaccineType: key === "" ? "Uncategorized" : key,
      records: recs,
      latestRecord: recs[0], // records already sorted -date_administered; [0] is most recent
    };
    if (key === "") uncategorized.push(group);
    else named.push(group);
  }
  // D-05: case-insensitive alphabetical sort; D-06: Uncategorized pinned last
  named.sort((a, b) =>
    a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
  );
  return [...named, ...uncategorized];
});

const displayedGroups = computed<VaccineGroup[]>(() => {
  // Step 1: filter (SEARCH-01)
  const query = searchQuery.value.trim().toLowerCase();
  const filtered = query
    ? groupedVaccinations.value.filter(
        (group) =>
          group.vaccineType.toLowerCase().includes(query) ||
          group.records.some((r) =>
            r.vaccine_name.toLowerCase().includes(query)
          )
      )
    : groupedVaccinations.value;

  // Step 2: sort (SORT-01) — split named/uncategorized first to preserve pinning
  const named = filtered.filter((g) => g.vaccineType !== 'Uncategorized');
  const uncategorized = filtered.filter((g) => g.vaccineType === 'Uncategorized');

  switch (sortMode.value) {
    case 'type-desc':
      named.sort((a, b) =>
        b.vaccineType.localeCompare(a.vaccineType, undefined, { sensitivity: 'base' })
      );
      break;
    case 'name-asc':
      named.sort((a, b) =>
        (a.latestRecord.vaccine_name ?? '').localeCompare(
          b.latestRecord.vaccine_name ?? '',
          undefined,
          { sensitivity: 'base' }
        )
      );
      break;
    case 'name-desc':
      named.sort((a, b) =>
        (b.latestRecord.vaccine_name ?? '').localeCompare(
          a.latestRecord.vaccine_name ?? '',
          undefined,
          { sensitivity: 'base' }
        )
      );
      break;
    case 'type-asc':
    default:
      // groupedVaccinations already sorted type-asc — preserve order
      break;
  }

  // Step 3: re-pin Uncategorized last regardless of sort direction
  return [...named, ...uncategorized];
});

// Phase 17 D-12: read-only layer above viewMode that forces 'list' on mobile.
// viewMode ref and its sessionStorage watch are unchanged — desktop preference
// is preserved across resizes (D-13).
const effectiveViewMode = computed(() => isMobile.value ? 'list' : viewMode.value);

const gridClass = computed(() =>
  effectiveViewMode.value === 'list'
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4',
);

// WR-01: refresh listToken before PocketBase's 5-min TTL expires
const LIST_TOKEN_TTL_MS = 4 * 60 * 1000;
let listTokenTimer: ReturnType<typeof setInterval> | null = null;

// --- LOGIC ---
onMounted(async () => {
  // Phase 8 / VIEW-01: restore viewMode from sessionStorage before any render that depends on it
  try {
    const stored = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === 'grid' || stored === 'list') {
      viewMode.value = stored;
    }
    // Any other value (null, 'foo', JSON garbage) — keep default 'grid'
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default silently
  }
  isLoading.value = true;
  try {
    records.value = await instrumentedGetFullList<Vaccinations>("wallecx_vaccinations", {
      sort: "-date_administered",
      requestKey: "vaccinations-getFullList",  // NEW — closes NFR-REQUESTKEY-UNIQUE gap (Pitfall 3)
    });
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

// Phase 8 / VIEW-01: persist viewMode on every change (silent fallback if sessionStorage write throws)
watch(viewMode, (next) => {
  try {
    sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  } catch {
    // sessionStorage write failures are non-fatal — user just won't have persistence this session
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

// PWA-09: pendingAction watcher — immediate:true catches values set before this watcher registers (Pitfall 4)
watch(
  () => props.pendingAction,
  (action) => {
    if (action === 'add-vaccination') {
      openManage(null);
    }
  },
  { immediate: true }
)

function openGroupPanel(group: VaccineGroup): void {
  selectedGroup.value = group;
  showGroupPanel.value = true;
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
  // Re-sort to keep date_administered descending, so latestRecord (recs[0]) stays accurate
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
  // WR-02: sync open Drawer to the freshly recomputed groupedVaccinations snapshot
  if (showGroupPanel.value && selectedGroup.value) {
    const vaccineType = selectedGroup.value.vaccineType;
    const updated = groupedVaccinations.value.find((g) => g.vaccineType === vaccineType) ?? null;
    selectedGroup.value = updated;
    if (!updated) showGroupPanel.value = false;
  }
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
    // WR-01: sync open Drawer to the freshly recomputed groupedVaccinations snapshot;
    // close if the group is now empty (last record in its type was deleted)
    if (showGroupPanel.value && selectedGroup.value) {
      const vaccineType = selectedGroup.value.vaccineType;
      const updated = groupedVaccinations.value.find((g) => g.vaccineType === vaccineType) ?? null;
      selectedGroup.value = updated;
      if (!updated) showGroupPanel.value = false;
    }
  } catch (e: unknown) {
    // On failure: do NOT splice — row stays visible (Pitfall 4)
    toast.error("Failed to delete. Please try again.");
    console.error("WallecxApp: delete failed", e);
  }
}
</script>

<template>
  <div>
    <!-- Header row: Download + Add buttons -->
    <div class="flex gap-2 mb-4 sm:justify-end">
      <Button
        class="flex-1 sm:flex-none"
        label="Download records"
        icon="pi pi-download"
        size="small"
        severity="secondary"
        :disabled="isExporting"
        :loading="isExporting"
        @click="exportJson"
      />
      <Button
        class="flex-1 sm:flex-none"
        label="Add vaccination"
        icon="pi pi-plus"
        size="small"
        @click="openManage(null)"
      />
    </div>

    <!-- Sticky toolbar wrapper — class applied on mobile only (LT-05 / D-34-01) -->
    <div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
      <!-- Toolbar: search + sort (SEARCH-01, SORT-01) — always visible -->
      <WallecxToolbar
        v-model:search-query="searchQuery"
        v-model:sort-mode="sortMode"
        v-model:view-mode="viewMode"
        :sort-options="vaccinationSortOptions"
        :show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0 && !isMobile"
      />
    </div>

    <!-- Loading state: skeleton card grid -->
    <WallecxSkeleton v-if="isLoading" variant="vaccination-card" :count="3" />

    <!-- Empty state (GROUP-05 edge case: zero records total) -->
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
        @click="openManage(null)"
      />
    </div>

    <!-- Empty state: no search results (SEARCH-02 — user has records but search matches nothing) -->
    <div
      v-else-if="displayedGroups.length === 0 && searchQuery"
      class="flex flex-col items-center py-12 gap-3"
    >
      <iconify-icon
        icon="mdi:magnify-remove-outline"
        width="48"
        height="48"
        style="color: var(--color-brand-primary)"
      ></iconify-icon>
      <p class="text-sm" style="color: var(--color-typo-heading)">
        No groups match "{{ searchQuery }}"
      </p>
      <Button
        label="Clear search"
        severity="secondary"
        size="small"
        @click="searchQuery = ''"
      />
    </div>

    <!-- Grouped card grid (GROUP-04, GROUP-05, D-03) -->
    <div v-else :class="gridClass">
      <VaccinationGroupCard
        v-for="group in displayedGroups"
        :key="group.vaccineType"
        :vaccine-type="group.vaccineType"
        :records="group.records"
        :latest-record="group.latestRecord"
        :list-token="listToken"
        @click="openGroupPanel(group)"
      />
    </div>

    <!-- Drawer for group detail panel.
         Phase 17 D-04: position is reactive (`bottom` on mobile, `right` on desktop).
         Phase 17 D-05: drag handle pill renders in custom #header slot only on mobile.
         :breakpoints removed — superseded by reactive position switch.
         :style width '30rem' only takes effect in right-position (desktop). -->
    <Drawer
      v-model:visible="showGroupPanel"
      :position="isMobile ? 'bottom' : 'right'"
      :style="{ width: '30rem' }"
      @hide="selectedGroup = null"
    >
      <template #header>
        <div class="flex flex-col items-center w-full gap-1">
          <DragHandle v-if="isMobile" />
          <span class="font-semibold">{{ selectedGroup?.vaccineType ?? '' }}</span>
        </div>
      </template>
      <VaccinationGroupPanel
        v-if="selectedGroup"
        :records="selectedGroup.records"
        :list-token="listToken"
        @view="openDetail"
        @edit="openManage"
        @delete="openDelete"
      />
    </Drawer>

    <!-- ManageVaccination: unified create/edit dialog — async-loaded on first open -->
    <Suspense>
      <ManageVaccination
        v-model:visible="showManage"
        v-model:record="manageRecord"
        @created="onCreated"
        @updated="onUpdated"
      />
      <template #fallback>
        <WallecxSkeleton variant="vaccination-card" />
      </template>
    </Suspense>

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
  </div>
</template>

<style scoped></style>
