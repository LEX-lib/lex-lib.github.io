<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Memberships } from '@/types/wallecx/memberships/types'
import MembershipCard from './MembershipCard.vue'
import MembershipDetail from './MembershipDetail.vue'

const records = ref<Memberships[]>([])
const isLoading = ref(false)
const selectedRecord = ref<Memberships | null>(null)
const showDetail = ref(false)
const fileToken = ref<string>('')

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
</script>

<template>
  <div>
    <!-- Header row: Add card button (disabled Phase 13 forward reference) -->
    <div class="flex items-center justify-between mb-4">
      <Button
        label="Add card"
        icon="pi pi-plus"
        size="small"
        :disabled="true"
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
        :disabled="true"
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
      />
    </Dialog>
  </div>
</template>
