<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useBoarderRoster } from "@/composables/useBoarderRoster";
import ManageBoarder from "./ManageBoarder.vue";
import type { PaytimeBoarder } from "@/types/paytime/boarders/types";

const { boarders, refresh } = useBoarderRoster();
const isLoading = ref(false);

const isDialogVisible = ref(false);
/** null puts the dialog in create mode. */
const dialogRecord = ref<PaytimeBoarder | null>(null);

const openCreate = () => {
  dialogRecord.value = null;
  isDialogVisible.value = true;
};

// Active before inactive (D-38-16). Array.prototype.sort is stable in
// ES2019+, so within each group the server's name,id order survives.
const sortedBoarders = computed(() =>
  [...boarders.value].sort((a, b) => Number(b.is_active) - Number(a.is_active)),
);

onMounted(async () => {
  isLoading.value = true;
  try {
    // The composable's own mount-time refresh is idempotent thanks to its
    // in-flight dedup, so awaiting it here to drive this view's own loading
    // state never fires a second request.
    await refresh();
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-medium">Boarders</h3>
      <Button
        label="Add Boarder"
        icon="pi pi-plus"
        size="small"
        @click="openCreate"
      />
    </div>

    <p v-if="isLoading" class="text-sm opacity-70">Loading…</p>
    <p v-else-if="!sortedBoarders.length" class="text-sm opacity-70">
      No boarders yet. Add the first one to get started.
    </p>

    <!-- Row card: verbatim PaymentLog.vue card classes (D-38-17). No tags
         chips, account-link badge, or row actions yet — Plan 02/03 expand
         this row; this task wires only the display-name path. -->
    <div
      v-for="boarder in sortedBoarders"
      :key="boarder.id"
      class="rounded-lg border border-surface-divider bg-surface-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <div class="flex flex-col gap-1 min-w-0 sm:flex-1">
        <span class="text-sm font-medium break-words">{{ boarder.name }}</span>
      </div>
    </div>

    <ManageBoarder
      v-model:visible="isDialogVisible"
      v-model:record="dialogRecord"
      @saved="refresh"
    />
  </div>
</template>
