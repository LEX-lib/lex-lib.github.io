<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Memberships } from '@/types/wallecx/memberships/types'
import MembershipCard from './MembershipCard.vue'
import MembershipDetail from './MembershipDetail.vue'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import ManageMembership from './ManageMembership.vue'

const records = ref<Memberships[]>([])
const isLoading = ref(false)
const selectedRecord = ref<Memberships | null>(null)
const showDetail = ref(false)
const fileToken = ref<string>('')
const showManage = ref<boolean>(false)
const manageRecord = ref<Memberships | null>(null)
const confirm = useConfirm()

onMounted(async () => {
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
    <!-- Header row: Add card button (disabled Phase 13 forward reference) -->
    <div class="flex items-center justify-between mb-4">
      <Button
        label="Add card"
        icon="pi pi-plus"
        size="small"
        @click="openManage(null)"
      />
    </div>

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

    <!-- Data state: membership card grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MembershipCard
        v-for="record in records"
        :key="record.id"
        :record="record"
        @click="openDetail(record)"
      />
    </div>

    <!-- MembershipDetail Dialog -->
    <Dialog
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
