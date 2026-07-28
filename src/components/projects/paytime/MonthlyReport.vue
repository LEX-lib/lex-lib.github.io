<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import { useFileToken } from "@/composables/useFileToken";
import type { PaytimePayment } from "@/types/paytime/payments/types";

interface ReportRow {
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

const screenshotUrl = (payment: PaytimePayment) =>
  payment.screenshot
    ? pb.files.getURL(payment, payment.screenshot, { token: fileToken.value })
    : "";

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
        row = { userName, others: [] };
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
      <label class="text-sm font-medium">Report for the month of</label>
      <DatePicker v-model="month" view="month" dateFormat="MM yy" fluid />
    </div>

    <p v-if="isLoading" class="text-sm opacity-70">Loading…</p>
    <p v-else-if="!rows.length" class="text-sm opacity-70">
      No payments logged for {{ dayjs(month).format("MMMM YYYY") }}.
    </p>
    <!-- Five columns won't fit a phone, so the table scrolls inside its own
         container rather than making the page scroll sideways. -->
    <div v-else class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table class="w-full min-w-[40rem] text-sm border-collapse">
        <thead>
          <tr class="border-b border-surface-divider text-left">
            <th class="py-2 pr-4 whitespace-nowrap">Boarder</th>
            <th class="py-2 pr-4 whitespace-nowrap">Electricity</th>
            <th class="py-2 pr-4 whitespace-nowrap">Internet</th>
            <th class="py-2 pr-4 whitespace-nowrap">Boarding Fee</th>
            <th class="py-2 whitespace-nowrap">Others</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.userName"
            class="border-b border-surface-divider align-top"
          >
            <td class="py-2 pr-4 font-medium">{{ row.userName }}</td>
            <td
              v-for="key in (['electricity', 'internet', 'boarding_fee'] as const)"
              :key="key"
              class="py-2 pr-4 whitespace-nowrap"
            >
              <template v-if="row[key]">
                <i class="pi pi-check-circle text-green-600 mr-1" />
                {{ dayjs(row[key]!.payment_date).format("MMM D") }}
                <span v-if="row[key]!.amount" class="opacity-70">
                  · ₱{{ row[key]!.amount!.toLocaleString("en-PH") }}
                </span>
                <a
                  v-if="row[key]!.screenshot"
                  :href="screenshotUrl(row[key]!)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline ml-1"
                  >proof</a
                >
              </template>
              <span v-else class="opacity-50">—</span>
            </td>
            <td class="py-2">
              <template v-if="row.others.length">
                <div v-for="other in row.others" :key="other.id">
                  <i class="pi pi-check-circle text-green-600 mr-1" />
                  {{ other.notes || "Others" }}
                  <span v-if="other.amount" class="opacity-70">
                    · ₱{{ other.amount.toLocaleString("en-PH") }}
                  </span>
                </div>
              </template>
              <span v-else class="opacity-50">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
