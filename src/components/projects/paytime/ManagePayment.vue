<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth";
import { useFileToken } from "@/composables/useFileToken";
import {
  mapToCreatePayment,
  mapToUpdatePayment,
} from "@/lib/pocketbase/paytimePaymentMapper";
import { CategoryOptions } from "@/lib/paytime/categories";
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

const visible = defineModel<boolean>("visible", { required: true });
/** null opens the dialog in create mode. */
const record = defineModel<PaytimePayment | null>("record", { default: null });

const emit = defineEmits<{ saved: [] }>();

const auth = useAuthStore();
// The existing-proof link needs a file token — `screenshot` is protected.
const { token: fileToken } = useFileToken();

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
const fieldErrors = ref<Record<string, string>>({});

const screenshotAccept = AcceptedScreenshotTypes.join(",");
const isEditing = computed(() => record.value !== null);

const existingProofUrl = computed(() => {
  const current = record.value;
  return current?.screenshot
    ? pb.files.getURL(current, current.screenshot, { token: fileToken.value })
    : "";
});

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

const clearScreenshotPick = () => {
  screenshot.value = null;
  screenshotResetKey.value += 1;
};

/**
 * Seeds the form whenever the dialog opens, from the record in edit mode or
 * from defaults in create mode. Keyed on `visible` too so reopening the same
 * record re-seeds rather than showing whatever was left behind.
 */
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, current]) => {
    if (!isVisible) {
      return;
    }
    category.value = current?.category ?? "electricity";
    month.value = current ? dayjs(`${current.month}-01`).toDate() : new Date();
    paymentDate.value = current
      ? dayjs(current.payment_date).toDate()
      : new Date();
    amount.value = current?.amount ?? null;
    notes.value = current?.notes ?? "";
    fieldErrors.value = {};
    clearScreenshotPick();
  },
  { immediate: true },
);

// Clear stale inline errors as soon as the user touches anything.
watch([category, month, paymentDate, amount, notes, screenshot], () => {
  if (Object.keys(fieldErrors.value).length) {
    fieldErrors.value = {};
  }
});

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

/**
 * PocketBase returns per-field validation detail under response.data; the
 * top-level message is only "Failed to create record", which hides which
 * field was rejected.
 */
const describeSaveError = (error: unknown): string => {
  const data = (error as { response?: { data?: Record<string, unknown> } })
    ?.response?.data;
  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .map(([field, detail]) => {
        const message = (detail as { message?: string })?.message;
        return message ? `${field}: ${message}` : null;
      })
      .filter(Boolean);
    if (messages.length) {
      return messages.join("; ");
    }
  }
  return (error as Error)?.message ?? "unknown error";
};

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

  const editing = record.value;
  isSaving.value = true;
  try {
    if (editing) {
      await pb
        .collection("paytime_payments")
        .update(editing.id, mapToUpdatePayment(parsed.data));
      toast.success("Payment updated");
    } else {
      await pb
        .collection("paytime_payments")
        .create(mapToCreatePayment({ user: auth.user.id, ...parsed.data }));
      toast.success("Payment logged");
    }
    emit("saved");
    visible.value = false;
  } catch (error) {
    toast.error(
      `Failed to ${editing ? "update" : "save"} payment: ${describeSaveError(error)}`,
    );
    console.error("ManagePayment: save failed", error);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Edit Payment' : 'Log a Payment'"
    modal
    :draggable="false"
    :style="{ width: '34rem' }"
    :breakpoints="{ '640px': '95vw' }"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pt-category">Payment for</label>
          <Select
            inputId="pt-category"
            v-model="category"
            :options="CategoryOptions"
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
          <p v-else-if="existingProofUrl" class="text-xs opacity-70">
            A proof is already attached
            <a
              :href="existingProofUrl"
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
    </div>

    <template #footer>
      <div class="flex w-full gap-2 sm:w-auto sm:justify-end">
        <Button
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          outlined
          :disabled="isSaving"
          class="flex-1 sm:flex-none"
          @click="visible = false"
        />
        <Button
          :label="isEditing ? 'Update Payment' : 'Save Payment'"
          icon="pi pi-check"
          :loading="isSaving"
          :disabled="isProcessingScreenshot"
          class="flex-1 sm:flex-none"
          @click="savePayment"
        />
      </div>
    </template>
  </Dialog>
</template>
