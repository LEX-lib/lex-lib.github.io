<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import { useFileToken } from "@/composables/useFileToken";
import { CategoryOptions } from "@/lib/paytime/categories";
import {
  screenshotThumbUrl,
  screenshotUrl,
} from "@/lib/paytime/screenshotUrls";
import type { PaytimePayment } from "@/types/paytime/payments/types";

/** The categories every boarder is expected to pay; "others" is ad hoc. */
type FixedCategory = "electricity" | "internet" | "boarding_fee";

const FixedCategories = CategoryOptions.filter(
  (option): option is { label: string; value: FixedCategory } =>
    option.value !== "others",
);

interface ReportRow {
  userId: string;
  userName: string;
  electricity?: PaytimePayment;
  internet?: PaytimePayment;
  boarding_fee?: PaytimePayment;
  others: PaytimePayment[];
}

const month = ref<Date>(new Date());
const rows = ref<ReportRow[]>([]);
const isLoading = ref(false);

// `screenshot` is a protected file field — URLs need a file token or they 403.
const { token: fileToken } = useFileToken();

const peso = (value: number) => `₱${value.toLocaleString("en-PH")}`;

const loadReport = async () => {
  isLoading.value = true;
  try {
    const payments = await pb
      .collection("paytime_payments")
      .getFullList<PaytimePayment>({
        filter: `month = "${dayjs(month.value).format("YYYY-MM")}"`,
        expand: "user",
        sort: "payment_date",
        // Distinct from PaymentLog's key (see note there). Stable rather than
        // per-month on purpose: switching months should cancel the previous
        // report request, just not the sibling panel's.
        requestKey: "paytime-report-list",
      });

    const byUser = new Map<string, ReportRow>();
    for (const payment of payments) {
      const expandedUser = payment.expand?.user as
        | { name?: string; email?: string }
        | undefined;
      const userName =
        expandedUser?.name || expandedUser?.email || payment.user;
      let row = byUser.get(payment.user);
      if (!row) {
        row = { userId: payment.user, userName, others: [] };
        byUser.set(payment.user, row);
      }
      if (payment.category === "others") {
        row.others.push(payment);
      } else {
        row[payment.category] = payment;
      }
    }

    rows.value = [...byUser.values()].sort((a, b) =>
      a.userName.localeCompare(b.userName),
    );
  } catch {
    toast.error("Failed to load report");
  } finally {
    isLoading.value = false;
  }
};

watch(month, loadReport);
onMounted(loadReport);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1 sm:w-1/3">
      <label class="text-sm font-medium" for="pt-report-month"
        >Report for the month of</label
      >
      <DatePicker
        inputId="pt-report-month"
        v-model="month"
        view="month"
        dateFormat="MM yy"
        fluid
      />
    </div>

    <p v-if="isLoading" class="text-sm opacity-70">Loading…</p>
    <p v-else-if="!rows.length" class="text-sm opacity-70">
      No payments logged for {{ dayjs(month).format("MMMM YYYY") }}.
    </p>

    <div v-else class="flex flex-col gap-3">
      <Panel
        v-for="row in rows"
        :key="row.userId"
        :header="row.userName"
        toggleable
      >
        <div class="flex flex-col divide-y divide-surface-divider">
          <div
            v-for="category in FixedCategories"
            :key="category.value"
            class="flex items-center gap-3 py-2"
          >
            <span class="w-28 shrink-0 text-sm font-medium">
              {{ category.label }}
            </span>

            <template v-if="row[category.value]">
              <i class="pi pi-check-circle text-green-600" />
              <span class="text-sm">
                {{ dayjs(row[category.value]!.payment_date).format("MMM D") }}
              </span>
              <span
                v-if="row[category.value]!.amount"
                class="text-sm font-semibold whitespace-nowrap"
              >
                {{ peso(row[category.value]!.amount!) }}
              </span>
              <div
                v-if="row[category.value]!.screenshot"
                class="ml-auto shrink-0"
              >
                <Image
                  :src="screenshotThumbUrl(row[category.value]!, fileToken)"
                  :alt="`Proof of ${category.label} payment by ${row.userName}`"
                  preview
                  imageClass="h-10 w-10 rounded object-cover border border-surface-divider"
                >
                  <template #original="slotProps">
                    <img
                      :src="screenshotUrl(row[category.value]!, fileToken)"
                      :alt="`Proof of ${category.label} payment by ${row.userName}`"
                      :class="slotProps.class"
                      :style="slotProps.style"
                      @click="slotProps.previewCallback?.()"
                    />
                  </template>
                </Image>
              </div>
            </template>
            <span v-else class="text-sm opacity-50">Not paid</span>
          </div>

          <div
            v-for="other in row.others"
            :key="other.id"
            class="flex items-center gap-3 py-2"
          >
            <span class="w-28 shrink-0 text-sm font-medium">Others</span>
            <i class="pi pi-check-circle text-green-600" />
            <span class="min-w-0 break-words text-sm">
              {{ other.notes || "Others" }}
            </span>
            <span
              v-if="other.amount"
              class="text-sm font-semibold whitespace-nowrap"
            >
              {{ peso(other.amount) }}
            </span>
            <div v-if="other.screenshot" class="ml-auto shrink-0">
              <Image
                :src="screenshotThumbUrl(other, fileToken)"
                :alt="`Proof of other payment by ${row.userName}`"
                preview
                imageClass="h-10 w-10 rounded object-cover border border-surface-divider"
              >
                <template #original="slotProps">
                  <img
                    :src="screenshotUrl(other, fileToken)"
                    :alt="`Proof of other payment by ${row.userName}`"
                    :class="slotProps.class"
                    :style="slotProps.style"
                    @click="slotProps.previewCallback?.()"
                  />
                </template>
              </Image>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  </div>
</template>
