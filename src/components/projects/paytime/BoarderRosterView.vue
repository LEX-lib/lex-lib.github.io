<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm"; // explicit — NOT auto-resolved by PrimeVueResolver
import { pb } from "@/lib/pocketbase";
import { useBoarderRoster } from "@/composables/useBoarderRoster";
import { titleCaseTag } from "@/lib/paytime/boarderSchema";
import ManageBoarder from "./ManageBoarder.vue";
import type { PaytimeBoarder } from "@/types/paytime/boarders/types";

const confirm = useConfirm();
const { boarders, refresh } = useBoarderRoster();
const isLoading = ref(false);

const isDialogVisible = ref(false);
/** null puts the dialog in create mode. */
const dialogRecord = ref<PaytimeBoarder | null>(null);

const openCreate = () => {
  dialogRecord.value = null;
  isDialogVisible.value = true;
};

const openEdit = (boarder: PaytimeBoarder) => {
  dialogRecord.value = boarder;
  isDialogVisible.value = true;
};

/**
 * Single write path to is_active (D-38-18) — sends only that one key, never
 * routed through the edit dialog. Patches the shared roster ref in place
 * rather than refetching.
 */
const toggleActive = async (boarder: PaytimeBoarder) => {
  const nextActive = !boarder.is_active;
  try {
    await pb
      .collection("paytime_boarders")
      .update(boarder.id, { is_active: nextActive });
    toast.success(nextActive ? "Boarder reactivated" : "Boarder deactivated");
    const row = boarders.value.find((item) => item.id === boarder.id);
    if (row) {
      row.is_active = nextActive;
    }
  } catch {
    toast.error("Failed to update boarder");
  }
};

const removeBoarder = async (boarder: PaytimeBoarder) => {
  try {
    await pb.collection("paytime_boarders").delete(boarder.id);
    toast.success("Boarder deleted");
    boarders.value = boarders.value.filter((item) => item.id !== boarder.id);
  } catch {
    toast.error("Failed to delete boarder");
  }
};

/**
 * ROSTER-07 pre-check. This is a CLIENT-SIDE refusal, not server
 * enforcement — PocketBase has only cascade-or-orphan for relations, never a
 * RESTRICT mode, so with `cascadeDelete: false` on `payments.boarder` a
 * delete would otherwise succeed and leave payments pointing at a dead id.
 * An admin issuing a hand-crafted request can still orphan payments; that is
 * an accepted threat recorded in 39-SECURITY.md, never described here (or
 * anywhere) as the server having refused (D-39-13).
 */
const countBoarderPayments = async (boarderId: string): Promise<number> => {
  const payments = await pb
    .collection("paytime_payments")
    .getFullList({
      filter: `boarder = "${boarderId}"`,
      // getFullList over getList's totalItems — D-31-B: the count path 400s
      // on non-trivial listRule expressions. Own distinct key: never
      // paytime-payments-list/-report-list/-boarders-list.
      requestKey: "paytime-boarder-payment-count",
    });
  return payments.length;
};

const deleteBoarder = async (boarder: PaytimeBoarder) => {
  const paymentCount = await countBoarderPayments(boarder.id);

  if (paymentCount > 0) {
    // Refuse — no delete request is issued at all. Deactivate (already
    // implemented, ROSTER-04) is the offered alternative.
    confirm.require({
      header: "Can't delete this boarder",
      message: `${boarder.name} has ${paymentCount} payment${paymentCount === 1 ? "" : "s"} on record. Delete would orphan that history — deactivate instead?`,
      icon: "pi pi-exclamation-triangle",
      rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
      acceptProps: { label: "Deactivate", severity: "danger" },
      accept: () => toggleActive(boarder),
    });
    return;
  }

  // Zero payments — existing delete-confirm path, byte-unchanged (D-38-15).
  confirm.require({
    header: "Delete boarder",
    message: `Delete ${boarder.name}? This cannot be undone.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: () => removeBoarder(boarder),
  });
};

/**
 * One popup Menu shared by every row rather than a Menu per row — the row it
 * acts on is whichever opened it.
 */
const rowMenu = ref<{ toggle: (event: Event) => void } | null>(null);
const rowMenuBoarder = ref<PaytimeBoarder | null>(null);

const rowMenuItems = computed(() => [
  {
    label: "Edit",
    icon: "pi pi-pencil",
    command: () => {
      if (rowMenuBoarder.value) {
        openEdit(rowMenuBoarder.value);
      }
    },
  },
  {
    label: rowMenuBoarder.value?.is_active ? "Deactivate" : "Reactivate",
    icon: rowMenuBoarder.value?.is_active ? "pi pi-ban" : "pi pi-check-circle",
    command: () => {
      if (rowMenuBoarder.value) {
        toggleActive(rowMenuBoarder.value);
      }
    },
  },
  {
    label: "Delete",
    icon: "pi pi-trash",
    command: () => {
      if (rowMenuBoarder.value) {
        deleteBoarder(rowMenuBoarder.value);
      }
    },
  },
]);

const openRowMenu = (event: Event, boarder: PaytimeBoarder) => {
  rowMenuBoarder.value = boarder;
  rowMenu.value?.toggle(event);
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

    <!-- Row card: verbatim PaymentLog.vue card classes (D-38-17). -->
    <div
      v-for="boarder in sortedBoarders"
      :key="boarder.id"
      class="rounded-lg border border-surface-divider bg-surface-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <div class="flex flex-col gap-1 min-w-0 sm:flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium break-words">{{ boarder.name }}</span>
          <Tag v-if="!boarder.is_active" value="Inactive" severity="secondary" />
          <!-- Mobile only, and it lives on this line so it sits level with
               the name rather than dropping to the tag row. -->
          <div class="ml-auto sm:hidden">
            <Button
              icon="pi pi-ellipsis-v"
              severity="secondary"
              text
              rounded
              :aria-label="`More options for ${boarder.name}`"
              @click="openRowMenu($event, boarder)"
            />
          </div>
        </div>
        <!-- Zero tags is a valid steady state (D-38-02) — no chips, no
             placeholder chip, no message. -->
        <div v-if="boarder.tags.length" class="flex flex-wrap gap-2">
          <Tag
            v-for="tag in boarder.tags"
            :key="tag"
            severity="info"
            :value="titleCaseTag(tag)"
            :pt="{ label: { class: 'max-w-40 truncate' } }"
          />
        </div>
      </div>

      <!-- Breakpoint classes go on plain wrappers, never on a PrimeVue
           Button: Tailwind utilities live in a cascade layer, PrimeVue's
           .p-button{display:inline-flex} does not, and unlayered styles
           win — so sm:hidden on the Button itself is silently ignored
           (D-38-17). -->
      <div class="hidden items-center gap-1 sm:flex">
        <Button
          icon="pi pi-pencil"
          severity="secondary"
          text
          rounded
          :aria-label="`Edit ${boarder.name}`"
          @click="openEdit(boarder)"
        />
        <Button
          :icon="boarder.is_active ? 'pi pi-ban' : 'pi pi-check-circle'"
          severity="secondary"
          text
          rounded
          :aria-label="`${boarder.is_active ? 'Deactivate' : 'Reactivate'} ${boarder.name}`"
          @click="toggleActive(boarder)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :aria-label="`Delete ${boarder.name}`"
          @click="deleteBoarder(boarder)"
        />
      </div>
    </div>

    <Menu ref="rowMenu" :model="rowMenuItems" popup />

    <ManageBoarder
      v-model:visible="isDialogVisible"
      v-model:record="dialogRecord"
      @saved="refresh"
    />
  </div>
</template>
