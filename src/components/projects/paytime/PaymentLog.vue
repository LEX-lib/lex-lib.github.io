<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm"; // explicit — NOT auto-resolved by PrimeVueResolver
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth";
import { useFileToken } from "@/composables/useFileToken";
import {
  mapToCreatePayment,
  mapToUpdatePayment,
} from "@/lib/pocketbase/paytimePaymentMapper";
import {
  AcceptedScreenshotTypes,
  collectFieldErrors,
  paymentSchema,
} from "@/lib/paytime/paymentSchema";
import {
  MaxSourceScreenshotBytes,
  prepareScreenshot,
} from "@/lib/paytime/prepareScreenshot";
import type {
  PaymentCategory,
  PaytimePayment,
} from "@/types/paytime/payments/types";

const auth = useAuthStore();
const confirm = useConfirm();
// `screenshot` is a protected file field — URLs need a file token or they 403.
const { token: fileToken } = useFileToken();

const categoryOptions: { label: string; value: PaymentCategory }[] = [
  { label: "Electricity", value: "electricity" },
  { label: "Internet", value: "internet" },
  { label: "Boarding Fee", value: "boarding_fee" },
  { label: "Others", value: "others" },
];

const categoryLabel = (value: string) =>
  categoryOptions.find((option) => option.value === value)?.label ?? value;

const category = ref<PaymentCategory>("electricity");
const month = ref<Date | null>(new Date());
const paymentDate = ref<Date | null>(new Date());
const amount = ref<number | null>(null);
const notes = ref("");
const screenshot = ref<File | null>(null);
/**
 * Bumped to remount FileUpload and wipe its selection. Its own clear() only
 * resets the underlying input in advanced mode, so in basic mode re-picking
 * the same filename afterwards fires no change event and the file is lost.
 */
const screenshotResetKey = ref(0);
const isProcessingScreenshot = ref(false);
const isSaving = ref(false);

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

const fieldErrors = ref<Record<string, string>>({});
const screenshotAccept = AcceptedScreenshotTypes.join(",");

/** Non-null while the form is editing an existing row instead of creating one. */
const editingRecord = ref<PaytimePayment | null>(null);
const isEditing = computed(() => editingRecord.value !== null);

const payments = ref<PaytimePayment[]>([]);
const isLoading = ref(false);

const onScreenshotSelect = async (event: { files: File[] }) => {
  // Single-file mode, but take the last entry so a re-pick wins.
  const picked = event.files?.[event.files.length - 1] ?? null;
  if (!picked) {
    screenshot.value = null;
    return;
  }

  isProcessingScreenshot.value = true;
  try {
    const { file, isCompressed } = await prepareScreenshot(picked);
    screenshot.value = file;
    if (isCompressed) {
      toast.info(
        `Image compressed: ${formatBytes(picked.size)} → ${formatBytes(file.size)}`,
      );
    }
  } finally {
    isProcessingScreenshot.value = false;
  }
};

const screenshotUrl = (payment: PaytimePayment) =>
  payment.screenshot
    ? pb.files.getURL(payment, payment.screenshot, { token: fileToken.value })
    : "";

/**
 * PocketBase's thumb generator 404s on WebP sources, and every compressed
 * screenshot is WebP, so those fall back to the full file. Same rule as
 * wallecx's AttachmentPreview — see Phase 36 PF-07.
 */
const screenshotThumbUrl = (payment: PaytimePayment) => {
  const filename = payment.screenshot;
  if (!filename) {
    return "";
  }
  const isWebP = filename.toLowerCase().endsWith(".webp");
  return pb.files.getURL(
    payment,
    filename,
    isWebP
      ? { token: fileToken.value }
      : { thumb: "100x100", token: fileToken.value },
  );
};

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

/**
 * PocketBase returns per-field validation detail under response.data; the
 * top-level message is only "Failed to create record", which hides which
 * field was rejected.
 */
const describeSaveError = (error: unknown): string => {
  const data = (error as { response?: { data?: Record<string, unknown> } })
    ?.response?.data;
  if (data && typeof data === "object") {
    const fieldErrors = Object.entries(data)
      .map(([field, detail]) => {
        const message = (detail as { message?: string })?.message;
        return message ? `${field}: ${message}` : null;
      })
      .filter(Boolean);
    if (fieldErrors.length) {
      return fieldErrors.join("; ");
    }
  }
  return (error as Error)?.message ?? "unknown error";
};

const clearScreenshotPick = () => {
  screenshot.value = null;
  screenshotResetKey.value += 1;
};

/**
 * After a successful create. Category, month, and date stay put on purpose —
 * boarders usually log several payments for the same month in one sitting.
 */
const resetForm = () => {
  amount.value = null;
  notes.value = "";
  fieldErrors.value = {};
  clearScreenshotPick();
};

/** Leaves edit mode and returns the form to create-a-new-payment defaults. */
const exitEditMode = () => {
  editingRecord.value = null;
  category.value = "electricity";
  month.value = new Date();
  paymentDate.value = new Date();
  amount.value = null;
  notes.value = "";
  fieldErrors.value = {};
  clearScreenshotPick();
};

const startEdit = (payment: PaytimePayment) => {
  editingRecord.value = payment;
  category.value = payment.category;
  month.value = dayjs(`${payment.month}-01`).toDate();
  paymentDate.value = dayjs(payment.payment_date).toDate();
  amount.value = payment.amount ?? null;
  notes.value = payment.notes ?? "";
  fieldErrors.value = {};
  clearScreenshotPick();
};

// Clear stale inline errors as soon as the user touches anything.
watch([category, month, paymentDate, amount, notes, screenshot], () => {
  if (Object.keys(fieldErrors.value).length) {
    fieldErrors.value = {};
  }
});

const savePayment = async () => {
  if (!auth.user) {
    return;
  }

  // A cleared DatePicker leaves null, and dayjs(null) formats to "Invalid
  // Date" — pass undefined instead so the schema reports it as missing.
  const parsed = paymentSchema.safeParse({
    category: category.value,
    month: month.value ? dayjs(month.value).format("YYYY-MM") : undefined,
    payment_date: paymentDate.value
      ? dayjs(paymentDate.value).format("YYYY-MM-DD")
      : undefined,
    amount: amount.value ?? undefined,
    // Notes only exist for "Others"; dropping them on any other category
    // stops a note lingering invisibly after the category is switched.
    notes: category.value === "others" ? notes.value || undefined : undefined,
    screenshot: screenshot.value ?? undefined,
  });

  if (!parsed.success) {
    fieldErrors.value = collectFieldErrors(parsed.error);
    toast.error("Please fix the highlighted fields.");
    return;
  }
  fieldErrors.value = {};

  const editing = editingRecord.value;
  isSaving.value = true;
  try {
    if (editing) {
      await pb
        .collection("paytime_payments")
        .update(editing.id, mapToUpdatePayment(parsed.data));
      toast.success("Payment updated");
      exitEditMode();
    } else {
      await pb
        .collection("paytime_payments")
        .create(mapToCreatePayment({ user: auth.user.id, ...parsed.data }));
      toast.success("Payment logged");
      resetForm();
    }
    await loadPayments();
  } catch (error) {
    toast.error(
      `Failed to ${editing ? "update" : "save"} payment: ${describeSaveError(error)}`,
    );
    console.error("PaymentLog: save failed", error);
  } finally {
    isSaving.value = false;
  }
};

const removePayment = async (payment: PaytimePayment) => {
  try {
    await pb.collection("paytime_payments").delete(payment.id);
    toast.success("Payment deleted");
    payments.value = payments.value.filter((item) => item.id !== payment.id);
    // Don't leave the form editing a row that no longer exists.
    if (editingRecord.value?.id === payment.id) {
      exitEditMode();
    }
  } catch {
    toast.error("Failed to delete payment");
  }
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
        startEdit(rowMenuPayment.value);
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
  <div class="flex flex-col gap-8">
    <!-- New payment form -->
    <div
      class="rounded-xl border border-surface-divider bg-surface-card p-5 flex flex-col gap-4 max-w-2xl"
    >
      <h3 class="font-semibold">
        {{ isEditing ? "Edit Payment" : "Log a Payment" }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pt-category">Payment for</label>
          <Select
            inputId="pt-category"
            v-model="category"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            :invalid="!!fieldErrors.category"
            fluid
          />
          <Message v-if="fieldErrors.category" severity="error" size="small" variant="simple">
            {{ fieldErrors.category }}
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pt-month">For the month of</label>
          <DatePicker
            inputId="pt-month"
            v-model="month"
            view="month"
            dateFormat="MM yy"
            :invalid="!!fieldErrors.month"
            fluid
          />
          <Message v-if="fieldErrors.month" severity="error" size="small" variant="simple">
            {{ fieldErrors.month }}
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pt-date">Date paid</label>
          <DatePicker
            inputId="pt-date"
            v-model="paymentDate"
            dateFormat="yy-mm-dd"
            :invalid="!!fieldErrors.payment_date"
            fluid
          />
          <Message v-if="fieldErrors.payment_date" severity="error" size="small" variant="simple">
            {{ fieldErrors.payment_date }}
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pt-amount">Amount</label>
          <InputNumber
            inputId="pt-amount"
            v-model="amount"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            :invalid="!!fieldErrors.amount"
            fluid
          />
          <Message v-if="fieldErrors.amount" severity="error" size="small" variant="simple">
            {{ fieldErrors.amount }}
          </Message>
        </div>
        <div v-if="category === 'others'" class="flex flex-col gap-1 sm:col-span-2">
          <label class="text-sm font-medium" for="pt-notes">Notes (optional)</label>
          <Textarea
            id="pt-notes"
            v-model="notes"
            rows="2"
            autoResize
            :invalid="!!fieldErrors.notes"
            fluid
          />
          <Message v-if="fieldErrors.notes" severity="error" size="small" variant="simple">
            {{ fieldErrors.notes }}
          </Message>
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium"
            >Screenshot / proof of transaction (optional)</span
          >
          <FileUpload
            :key="screenshotResetKey"
            mode="basic"
            name="screenshot"
            :auto="false"
            customUpload
            :accept="screenshotAccept"
            :maxFileSize="MaxSourceScreenshotBytes"
            chooseLabel="Choose image"
            chooseIcon="pi pi-image"
            :disabled="isProcessingScreenshot"
            class="w-full sm:w-auto"
            @select="onScreenshotSelect"
            @clear="screenshot = null"
          />
          <p v-if="isProcessingScreenshot" class="text-xs opacity-70">
            <i class="pi pi-spin pi-spinner mr-1" />Compressing image…
          </p>
          <p v-else-if="screenshot" class="text-xs opacity-70">
            Will upload as {{ screenshot.name }} ({{
              formatBytes(screenshot.size)
            }})
          </p>
          <p
            v-if="isEditing && editingRecord?.screenshot"
            class="text-xs opacity-70"
          >
            A proof is already attached
            <a
              :href="screenshotUrl(editingRecord)"
              target="_blank"
              rel="noopener noreferrer"
              class="underline"
              >(view)</a
            >. Choosing a file replaces it.
          </p>
          <Message v-if="fieldErrors.screenshot" severity="error" size="small" variant="simple">
            {{ fieldErrors.screenshot }}
          </Message>
        </div>
      </div>
      <div class="flex gap-2 sm:self-start">
        <Button
          :label="isEditing ? 'Update Payment' : 'Save Payment'"
          icon="pi pi-check"
          :loading="isSaving"
          :disabled="isProcessingScreenshot"
          class="flex-1 sm:flex-none"
          @click="savePayment"
        />
        <Button
          v-if="isEditing"
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          outlined
          :disabled="isSaving"
          class="flex-1 sm:flex-none"
          @click="exitEditMode"
        />
      </div>
    </div>

    <!-- Payment history -->
    <div class="flex flex-col gap-3">
      <h3 class="font-semibold">My Payments</h3>
      <p v-if="isLoading" class="text-sm opacity-70">Loading…</p>
      <p v-else-if="!payments.length" class="text-sm opacity-70">
        No payments logged yet.
      </p>
      <div
        v-for="payment in payments"
        :key="payment.id"
        class="rounded-lg border bg-surface-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
        :class="
          editingRecord?.id === payment.id
            ? 'border-primary ring-1 ring-primary'
            : 'border-surface-divider'
        "
      >
        <!-- Details. min-w-0 lets long notes wrap instead of widening the row. -->
        <div class="flex flex-col gap-1 min-w-0 sm:flex-1">
          <div class="flex items-center gap-2">
            <Tag :value="categoryLabel(payment.category)" />
            <span class="text-sm font-medium">
              {{ dayjs(`${payment.month}-01`).format("MMMM YYYY") }}
            </span>
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
          <span v-if="payment.amount" class="text-sm font-semibold whitespace-nowrap">
            ₱{{ payment.amount.toLocaleString("en-PH") }}
          </span>

          <Image
            v-if="payment.screenshot"
            :src="screenshotThumbUrl(payment)"
            :alt="`Proof of ${categoryLabel(payment.category)} payment`"
            preview
            class="shrink-0"
            imageClass="h-12 w-12 rounded object-cover border border-surface-divider"
          >
            <!-- Preview the full file, not the thumbnail. Reuse the slot's own
                 class and style so zoom and rotate keep working. -->
            <template #original="slotProps">
              <img
                :src="screenshotUrl(payment)"
                :alt="`Proof of ${categoryLabel(payment.category)} payment`"
                :class="slotProps.class"
                :style="slotProps.style"
                @click="slotProps.previewCallback?.()"
              />
            </template>
          </Image>

          <!-- Breakpoint classes go on plain wrappers, never on a PrimeVue
               Button: Tailwind utilities live in a cascade layer, PrimeVue's
               .p-button{display:inline-flex} does not, and unlayered styles
               win — so sm:hidden on the Button itself is silently ignored. -->
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
          <div class="ml-auto hidden items-center gap-1 sm:flex">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              :aria-label="`Edit ${categoryLabel(payment.category)} payment`"
              @click="startEdit(payment)"
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
    </div>

    <Menu ref="rowMenu" :model="rowMenuItems" popup />
  </div>
</template>
