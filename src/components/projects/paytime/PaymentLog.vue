<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm"; // explicit — NOT auto-resolved by PrimeVueResolver
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth";
import { useFileToken } from "@/composables/useFileToken";
import { categoryLabel } from "@/lib/paytime/categories";
import {
  screenshotThumbUrl,
  screenshotUrl,
} from "@/lib/paytime/screenshotUrls";
import ManagePayment from "./ManagePayment.vue";
import type { PaytimePayment } from "@/types/paytime/payments/types";

const auth = useAuthStore();
const confirm = useConfirm();
// `screenshot` is a protected file field — URLs need a file token or they 403.
const { token: fileToken } = useFileToken();

const payments = ref<PaytimePayment[]>([]);
const isLoading = ref(false);

const isDialogVisible = ref(false);
/** null puts the dialog in create mode. */
const dialogRecord = ref<PaytimePayment | null>(null);

const loadPayments = async () => {
  if (!auth.user) {
    return;
  }
  isLoading.value = true;
  try {
    payments.value = await pb
      .collection("paytime_payments")
      .getFullList<PaytimePayment>({
        filter: `user = "${auth.user.id}"`,
        sort: "-payment_date",
        // The SDK's default auto-cancel key is method+path and ignores the
        // query string, so this would collide with MonthlyReport's list call
        // on the same collection — and PrimeVue mounts both tab panels at
        // once, so one of the two always got aborted.
        requestKey: "paytime-payments-list",
      });
  } catch {
    toast.error("Failed to load payments");
  } finally {
    isLoading.value = false;
  }
};

const openCreate = () => {
  dialogRecord.value = null;
  isDialogVisible.value = true;
};

const openEdit = (payment: PaytimePayment) => {
  dialogRecord.value = payment;
  isDialogVisible.value = true;
};

/**
 * One popup Menu shared by every row rather than a Menu per row — the row it
 * acts on is whichever opened it.
 */
const rowMenu = ref<{ toggle: (event: Event) => void } | null>(null);
const rowMenuPayment = ref<PaytimePayment | null>(null);

const rowMenuItems = computed(() => [
  {
    label: "Edit",
    icon: "pi pi-pencil",
    command: () => {
      if (rowMenuPayment.value) {
        openEdit(rowMenuPayment.value);
      }
    },
  },
  {
    label: "Delete",
    icon: "pi pi-trash",
    command: () => {
      if (rowMenuPayment.value) {
        deletePayment(rowMenuPayment.value);
      }
    },
  },
]);

const openRowMenu = (event: Event, payment: PaytimePayment) => {
  rowMenuPayment.value = payment;
  rowMenu.value?.toggle(event);
};

const removePayment = async (payment: PaytimePayment) => {
  try {
    await pb.collection("paytime_payments").delete(payment.id);
    toast.success("Payment deleted");
    payments.value = payments.value.filter((item) => item.id !== payment.id);
  } catch {
    toast.error("Failed to delete payment");
  }
};

const deletePayment = (payment: PaytimePayment) => {
  confirm.require({
    header: "Delete payment",
    message: `Delete the ${categoryLabel(payment.category)} payment for ${dayjs(
      `${payment.month}-01`,
    ).format("MMMM YYYY")}? This cannot be undone.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: () => removePayment(payment),
  });
};

onMounted(loadPayments);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-semibold">My Payments</h3>
      <Button
        label="Log a Payment"
        icon="pi pi-plus"
        size="small"
        @click="openCreate"
      />
    </div>

    <p v-if="isLoading" class="text-sm opacity-70">Loading…</p>
    <p v-else-if="!payments.length" class="text-sm opacity-70">
      No payments logged yet.
    </p>

    <div
      v-for="payment in payments"
      :key="payment.id"
      class="rounded-lg border border-surface-divider bg-surface-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <!-- Details. min-w-0 lets long notes wrap instead of widening the row. -->
      <div class="flex flex-col gap-1 min-w-0 sm:flex-1">
        <div class="flex items-center gap-2">
          <Tag :value="categoryLabel(payment.category)" />
          <span class="text-sm font-medium">
            {{ dayjs(`${payment.month}-01`).format("MMMM YYYY") }}
          </span>
          <!-- Mobile only, and it lives on this line so it sits level with
               the category rather than dropping to the amount row. -->
          <div class="ml-auto sm:hidden">
            <Button
              icon="pi pi-ellipsis-v"
              severity="secondary"
              text
              rounded
              :aria-label="`More options for ${categoryLabel(payment.category)} payment`"
              @click="openRowMenu($event, payment)"
            />
          </div>
        </div>
        <span class="text-sm opacity-70">
          paid {{ dayjs(payment.payment_date).format("MMM D, YYYY") }}
        </span>
        <p v-if="payment.notes" class="text-sm opacity-70 italic break-words">
          {{ payment.notes }}
        </p>
      </div>

      <!-- Amount, proof, then actions. Own line on mobile; at the end of the
           row from sm up. -->
      <div class="flex items-center gap-4 sm:gap-6">
        <span
          v-if="payment.amount"
          class="text-sm font-semibold whitespace-nowrap"
        >
          ₱{{ payment.amount.toLocaleString("en-PH") }}
        </span>

        <!-- ml-auto pins the proof to the right edge on mobile; from sm up
             it just sits between the amount and the actions. Layout classes
             go on this wrapper rather than the PrimeVue component. -->
        <div v-if="payment.screenshot" class="ml-auto shrink-0 sm:ml-0">
          <Image
            :src="screenshotThumbUrl(payment, fileToken)"
            :alt="`Proof of ${categoryLabel(payment.category)} payment`"
            preview
            imageClass="h-12 w-12 rounded object-cover border border-surface-divider"
          >
            <!-- Preview the full file, not the thumbnail. Reuse the slot's own
                 class and style so zoom and rotate keep working. -->
            <template #original="slotProps">
              <img
                :src="screenshotUrl(payment, fileToken)"
                :alt="`Proof of ${categoryLabel(payment.category)} payment`"
                :class="slotProps.class"
                :style="slotProps.style"
                @click="slotProps.previewCallback?.()"
              />
            </template>
          </Image>
        </div>

        <!-- Breakpoint classes go on plain wrappers, never on a PrimeVue
             Button: Tailwind utilities live in a cascade layer, PrimeVue's
             .p-button{display:inline-flex} does not, and unlayered styles
             win — so sm:hidden on the Button itself is silently ignored. -->
        <div class="hidden items-center gap-1 sm:flex">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            :aria-label="`Edit ${categoryLabel(payment.category)} payment`"
            @click="openEdit(payment)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :aria-label="`Delete ${categoryLabel(payment.category)} payment`"
            @click="deletePayment(payment)"
          />
        </div>
      </div>
    </div>

    <Menu ref="rowMenu" :model="rowMenuItems" popup />

    <ManagePayment
      v-model:visible="isDialogVisible"
      v-model:record="dialogRecord"
      @saved="loadPayments"
    />
  </div>
</template>
