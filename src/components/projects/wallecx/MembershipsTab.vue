<script setup lang="ts">
import { ref, onMounted, computed, watch, defineAsyncComponent } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Memberships } from '@/types/wallecx/memberships/types'
import { instrumentedGetFullList } from '@/lib/pocketbase/perfInstrument'
import WallecxSkeleton from './WallecxSkeleton.vue'
const ManageMembership = defineAsyncComponent(() => import('./ManageMembership.vue'))
import MembershipCard from './MembershipCard.vue'
import MembershipDetail from './MembershipDetail.vue'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import WallecxToolbar from './WallecxToolbar.vue'
import DragHandle from './DragHandle.vue'
import { useIsMobile } from '@/composables/useIsMobile'
import dayjs from 'dayjs'

const records = ref<Memberships[]>([])
const isLoading = ref(false)
const selectedRecord = ref<Memberships | null>(null)
const showDetail = ref(false)
const fileToken = ref<string>('')
const showManage = ref<boolean>(false)
const manageRecord = ref<Memberships | null>(null)
// Separate token lifecycle for the Manage dialog — the shared `fileToken` is cleared
// by the detail Dialog's @hide handler asynchronously (after the close animation), which
// would blank the token mid-render of ManageMembership in the openEdit flow (showDetail=false
// → showManage=true → detail @hide fires later → fileToken=''). Mirrors ExpensesTab pattern.
const manageToken = ref<string>('')
const confirm = useConfirm()
const isMobile = useIsMobile()
const isExporting = ref(false)

const SORT_MODE_STORAGE_KEY = 'wallecx:memberships-sort-mode';

const membershipSortOptions = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'name-asc',       label: 'Name A–Z' },
  { value: 'issuer-asc',     label: 'Issuer A–Z' },
  { value: 'expiry-asc',     label: 'Expiry Date' },
];

const searchQuery = ref<string>('');
const sortMode = ref<string>('recently-added');

const displayedMemberships = computed<Memberships[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const filtered = query
    ? records.value.filter(
        (r) =>
          r.card_name.toLowerCase().includes(query) ||
          (r.issuer ?? '').toLowerCase().includes(query)
      )
    : records.value;

  const sorted = [...filtered];
  switch (sortMode.value) {
    case 'name-asc':
      sorted.sort((a, b) =>
        a.card_name.localeCompare(b.card_name, undefined, { sensitivity: 'base' })
      );
      break;
    case 'issuer-asc':
      sorted.sort((a, b) =>
        (a.issuer ?? '').localeCompare(b.issuer ?? '', undefined, { sensitivity: 'base' })
      );
      break;
    case 'expiry-asc':
      sorted.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });
      break;
    case 'recently-added':
    default:
      sorted.sort((a, b) => b.created.localeCompare(a.created));
      break;
  }

  return sorted;
});

watch(sortMode, (next) => {
  try {
    sessionStorage.setItem(SORT_MODE_STORAGE_KEY, next);
  } catch {
    // sessionStorage write failures are non-fatal
  }
});

onMounted(async () => {
  try {
    const stored = sessionStorage.getItem(SORT_MODE_STORAGE_KEY);
    const validModes = membershipSortOptions.map((o) => o.value);
    if (stored && validModes.includes(stored)) {
      sortMode.value = stored;
    }
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default silently
  }
  isLoading.value = true
  try {
    records.value = await instrumentedGetFullList<Memberships>('wallecx_memberships', {
      sort: '-created',
      requestKey: 'memberships-getFullList', // STATE.md MR-5: distinct from vaccinations key
    })
  } catch (e: unknown) {
    toast.error('Failed to load membership cards.')
    console.error('MembershipsTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
// No onUnmounted — no interval to clear (no listToken for membership tiles)

async function openDetail(record: Memberships): Promise<void> {
  selectedRecord.value = record
  if (record.card_image) {
    try {
      fileToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      toast.error('Failed to load card image. Refresh to try again.')
      console.error('MembershipsTab: getToken failed', e)
      selectedRecord.value = null
      return // WR-03: abort — never open Dialog in token-less state when attachment exists
    }
  }
  showDetail.value = true
}

async function openEdit(record: Memberships): Promise<void> {
  // Fetch the manage-dialog's own token BEFORE switching dialogs so the value is
  // stable for the entire lifetime of the open ManageMembership. Failure falls
  // back to opening the dialog with an empty token — form fields still work,
  // only the thumbnail will be blank (toast surfaces the failure).
  if (record.card_image) {
    try {
      manageToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      manageToken.value = ''
      toast.error('Card image preview unavailable. Form will still save.')
      console.error('MembershipsTab: getToken (manage) failed', e)
    }
  } else {
    manageToken.value = ''
  }
  manageRecord.value = record
  showDetail.value = false      // close detail dialog first
  showManage.value = true       // then open manage dialog
}

async function openManage(record: Memberships | null): Promise<void> {
  // Same token-fetch contract as openEdit — needed when opening edit directly
  // from the toolbar/card flow (not via the detail Dialog).
  if (record !== null && record.card_image) {
    try {
      manageToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      manageToken.value = ''
      toast.error('Card image preview unavailable. Form will still save.')
      console.error('MembershipsTab: getToken (manage) failed', e)
    }
  } else {
    manageToken.value = ''
  }
  manageRecord.value = record
  showManage.value = true
}

// Clear the manage-token when the dialog closes (mirrors detail @hide pattern).
watch(showManage, (v) => {
  if (!v) manageToken.value = ''
})

function openDelete(record: Memberships): void {
  confirm.require({
    message: `Delete "${record.card_name}"? This cannot be undone.`,   // D-11: plain text — never v-html
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Keep Card', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => deleteCard(record),
  })
}

async function deleteCard(record: Memberships): Promise<void> {
  try {
    await pb.collection('wallecx_memberships').delete(record.id)   // server-first — D-05
    const idx = records.value.findIndex((r) => r.id === record.id)
    if (idx !== -1) records.value.splice(idx, 1)                   // splice only on success
    showDetail.value = false   // close detail after successful delete
    toast.success('Card deleted.')
  } catch (e: unknown) {
    toast.error('Failed to delete. Please try again.')              // no splice on failure
    console.error('MembershipsTab: delete failed', e)
  }
}

function onCreated(created: Memberships): void {
  records.value.unshift(created)   // prepend — newest first (matches sort: '-created')
}

function onUpdated(updatedRecord: Memberships): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id)
  if (idx !== -1) records.value[idx] = updatedRecord
}

async function exportJson(): Promise<void> {
  if (isExporting.value) return
  const userId = pb.authStore.record?.id
  if (!userId) {
    toast.error("Session expired. Please log in again.")
    return
  }
  isExporting.value = true
  try {
    const allRecords = await pb
      .collection("wallecx_memberships")
      .getFullList<Memberships>({
        sort: "-created",
        requestKey: "memberships-export",
      })
    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: allRecords.length,
      records: allRecords.map((r) => ({
        id: r.id,
        card_name: r.card_name,
        issuer: r.issuer ?? null,
        card_number: r.card_number ?? null,
        card_color: r.card_color ?? null,
        expiry_date: r.expiry_date ?? null,
        notes: r.notes ?? null,
        card_image_url: r.card_image ? pb.files.getURL(r, r.card_image) : null,
        created: r.created,
        updated: r.updated,
      })),
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `wallecx-memberships-${dayjs().format("YYYY-MM-DD")}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    toast.success("Membership cards exported.")
  } catch (e: unknown) {
    toast.error("Export failed. Please try again.")
    console.error("MembershipsTab: exportJson failed", e)
  } finally {
    isExporting.value = false
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
        severity="secondary"
        size="small"
        :disabled="isExporting"
        :loading="isExporting"
        @click="exportJson"
      />
      <Button
        class="flex-1 sm:flex-none"
        label="Add card"
        icon="pi pi-plus"
        size="small"
        @click="openManage(null)"
      />
    </div>

    <!-- Sticky toolbar wrapper — class applied on mobile only (LT-05 / D-34-01) -->
    <div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
      <!-- Toolbar: search + sort (ORG-01, ORG-02) — always visible -->
      <WallecxToolbar
        v-model:search-query="searchQuery"
        v-model:sort-mode="sortMode"
        :view-mode="'grid'"
        :sort-options="membershipSortOptions"
        :show-toggle="false"
      />
    </div>

    <!-- Loading state: 3 skeleton tiles matching MembershipCard min-height -->
    <WallecxSkeleton v-if="isLoading" variant="membership-card" :count="3" />

    <!-- Empty state: no records at all -->
    <div
      v-else-if="records.length === 0"
      class="flex flex-col items-center py-12 gap-3"
    >
      <iconify-icon
        icon="mdi:card-account-details-outline"
        width="48"
        height="48"
        style="color: var(--color-brand-primary)"
        aria-hidden="true"
      ></iconify-icon>
      <p class="text-sm" style="color: var(--color-typo-heading)">
        No membership cards yet.
      </p>
      <Button
        label="Add your first card"
        icon="pi pi-plus"
        size="small"
        @click="openManage(null)"
      />
    </div>

    <!-- Empty state: no search results (ORG-01 — records exist but search matches nothing) -->
    <div
      v-else-if="displayedMemberships.length === 0 && searchQuery"
      class="flex flex-col items-center py-12 gap-3"
    >
      <iconify-icon
        icon="mdi:magnify-remove-outline"
        width="48"
        height="48"
        style="color: var(--color-brand-primary)"
        aria-hidden="true"
      ></iconify-icon>
      <p class="text-sm" style="color: var(--color-typo-heading)">
        No cards match "{{ searchQuery }}"
      </p>
      <Button
        label="Clear search"
        severity="secondary"
        size="small"
        @click="searchQuery = ''"
      />
    </div>

    <!-- Data state: membership card grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MembershipCard
        v-for="record in displayedMemberships"
        :key="record.id"
        :record="record"
        @click="openDetail(record)"
      />
    </div>

    <!-- MembershipDetail wrapper.
         Phase 17 D-06: desktop renders Dialog, mobile renders bottom Drawer.
         Phase 17 D-07: 85dvh content cap is applied via `wallecx-overrides.css`
                        (`.p-drawer-bottom .p-drawer-content` rule).
         Phase 17 D-08: identical @hide handler on both wrappers; openEdit/openDelete
                        inside MembershipDetail already close the detail before opening
                        the manage/confirm dialog (see openEdit fn). -->
    <!-- Desktop: centered Dialog -->
    <Dialog
      v-if="!isMobile"
      v-model:visible="showDetail"
      modal
      header="Membership Card"
      :style="{ width: '40rem' }"
      :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
      @hide="selectedRecord = null; fileToken = ''"
    >
      <MembershipDetail
        v-if="selectedRecord"
        :record="selectedRecord"
        :token="fileToken"
        @edit="openEdit(selectedRecord!)"
        @delete="openDelete(selectedRecord!)"
      />
    </Dialog>

    <!-- Mobile: bottom Drawer -->
    <Drawer
      v-else
      v-model:visible="showDetail"
      position="bottom"
      @hide="selectedRecord = null; fileToken = ''"
    >
      <template #header>
        <div class="flex flex-col items-center w-full gap-1">
          <DragHandle />
          <span class="font-semibold">Membership Card</span>
        </div>
      </template>
      <MembershipDetail
        v-if="selectedRecord"
        :record="selectedRecord"
        :token="fileToken"
        @edit="openEdit(selectedRecord!)"
        @delete="openDelete(selectedRecord!)"
      />
    </Drawer>

    <!-- ManageMembership dialog — create and edit (Plan 13-02) -->
    <Suspense>
      <ManageMembership
        v-model:visible="showManage"
        v-model:record="manageRecord"
        :token="manageToken"
        @created="onCreated"
        @updated="onUpdated"
      />
      <template #fallback>
        <WallecxSkeleton variant="membership-card" />
      </template>
    </Suspense>
  </div>
</template>
