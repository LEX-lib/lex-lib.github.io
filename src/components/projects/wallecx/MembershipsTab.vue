<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Memberships } from '@/types/wallecx/memberships/types'
import MembershipCard from './MembershipCard.vue'
import MembershipDetail from './MembershipDetail.vue'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import ManageMembership from './ManageMembership.vue'
import WallecxToolbar from './WallecxToolbar.vue'
import { useIsMobile } from '@/composables/useIsMobile'

const records = ref<Memberships[]>([])
const isLoading = ref(false)
const selectedRecord = ref<Memberships | null>(null)
const showDetail = ref(false)
const fileToken = ref<string>('')
const showManage = ref<boolean>(false)
const manageRecord = ref<Memberships | null>(null)
const confirm = useConfirm()
const isMobile = useIsMobile()

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
    records.value = await pb
      .collection('wallecx_memberships')
      .getFullList<Memberships>({
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

function openEdit(record: Memberships): void {
  manageRecord.value = record
  showDetail.value = false      // close detail dialog first
  showManage.value = true       // then open manage dialog
}

function openManage(record: Memberships | null): void {
  manageRecord.value = record
  showManage.value = true
}

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
</script>

<template>
  <div>
    <!-- Header row: Add card button -->
    <div class="flex items-center justify-between mb-4">
      <Button
        label="Add card"
        icon="pi pi-plus"
        size="small"
        @click="openManage(null)"
      />
    </div>

    <!-- Toolbar: search + sort (ORG-01, ORG-02) — always visible -->
    <WallecxToolbar
      v-model:search-query="searchQuery"
      v-model:sort-mode="sortMode"
      :view-mode="'grid'"
      :sort-options="membershipSortOptions"
      :show-toggle="false"
    />

    <!-- Loading state: 3 skeleton tiles matching MembershipCard min-height -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card v-for="i in 3" :key="i">
        <template #content>
          <Skeleton height="8rem" />
        </template>
      </Card>
    </div>

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
          <div
            class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
            aria-hidden="true"
          ></div>
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
    <ManageMembership
      v-model:visible="showManage"
      v-model:record="manageRecord"
      :token="fileToken"
      @created="onCreated"
      @updated="onUpdated"
    />
  </div>
</template>
