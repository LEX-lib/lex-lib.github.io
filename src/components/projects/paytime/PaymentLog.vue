<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth";
import { useFileToken } from "@/composables/useFileToken";
import { mapToCreatePayment } from "@/lib/pocketbase/paytimePaymentMapper";
import {
  AcceptedScreenshotTypes,
  collectFieldErrors,
  paymentSchema,
} from "@/lib/paytime/paymentSchema";
import type {
  PaymentCategory,
  PaytimePayment,
} from "@/types/paytime/payments/types";

const auth = useAuthStore();
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
const screenshotInput = ref<HTMLInputElement | null>(null);
const isSaving = ref(false);

const fieldErrors = ref<Record<string, string>>({});
const screenshotAccept = AcceptedScreenshotTypes.join(",");

const payments = ref<PaytimePayment[]>([]);
const isLoading = ref(false);

const onScreenshotChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  screenshot.value = input.files?.[0] ?? null;
};

const screenshotUrl = (payment: PaytimePayment) =>
  payment.screenshot
    ? pb.files.getURL(payment, payment.screenshot, { token: fileToken.value })
    : "";

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

const resetForm = () => {
  amount.value = null;
  notes.value = "";
  screenshot.value = null;
  fieldErrors.value = {};
  if (screenshotInput.value) {
    screenshotInput.value.value = "";
  }
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
    notes: notes.value || undefined,
    screenshot: screenshot.value ?? undefined,
  });

  if (!parsed.success) {
    fieldErrors.value = collectFieldErrors(parsed.error);
    toast.error("Please fix the highlighted fields.");
    return;
  }
  fieldErrors.value = {};

  isSaving.value = true;
  try {
    const formData = mapToCreatePayment({
      user: auth.user.id,
      ...parsed.data,
    });
    await pb.collection("paytime_payments").create(formData);
    toast.success("Payment logged");
    resetForm();
    await loadPayments();
  } catch (error) {
    toast.error(`Failed to save payment: ${describeSaveError(error)}`);
    console.error("PaymentLog: create failed", error);
  } finally {
    isSaving.value = false;
  }
};

const deletePayment = async (payment: PaytimePayment) => {
  try {
    await pb.collection("paytime_payments").delete(payment.id);
    toast.success("Payment deleted");
    payments.value = payments.value.filter((item) => item.id !== payment.id);
  } catch {
    toast.error("Failed to delete payment");
  }
};

onMounted(loadPayments);
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- New payment form -->
    <div
      class="rounded-xl border border-surface-divider bg-surface-card p-5 flex flex-col gap-4 max-w-2xl"
    >
      <h3 class="font-semibold">Log a Payment</h3>
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
          <label class="text-sm font-medium" for="pt-screenshot"
            >Screenshot / proof of transaction (optional)</label
          >
          <input
            id="pt-screenshot"
            ref="screenshotInput"
            type="file"
            :accept="screenshotAccept"
            class="text-sm"
            @change="onScreenshotChange"
          />
          <Message v-if="fieldErrors.screenshot" severity="error" size="small" variant="simple">
            {{ fieldErrors.screenshot }}
          </Message>
        </div>
      </div>
      <Button
        label="Save Payment"
        icon="pi pi-check"
        :loading="isSaving"
        class="sm:self-start"
        @click="savePayment"
      />
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
        class="rounded-lg border border-surface-divider bg-surface-card p-4 flex flex-wrap items-center gap-3"
      >
        <Tag :value="categoryLabel(payment.category)" />
        <span class="text-sm font-medium">{{
          dayjs(payment.month + "-01").format("MMMM YYYY")
        }}</span>
        <span class="text-sm opacity-70">
          paid {{ dayjs(payment.payment_date).format("MMM D, YYYY") }}
        </span>
        <span v-if="payment.amount" class="text-sm font-semibold">
          ₱{{ payment.amount.toLocaleString("en-PH") }}
        </span>
        <span v-if="payment.notes" class="text-sm opacity-70 italic">
          {{ payment.notes }}
        </span>
        <a
          v-if="payment.screenshot"
          :href="screenshotUrl(payment)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm underline"
        >
          <i class="pi pi-image mr-1" />proof
        </a>
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          size="small"
          class="ml-auto"
          @click="deletePayment(payment)"
        />
      </div>
    </div>
  </div>
</template>
