<script setup lang="ts">
import { computed, ref } from "vue";
import {
  calculateShares,
  type SubMeterReading,
} from "./electricityCalc";

const totalKwh = ref<number | null>(null);
const totalAmount = ref<number | null>(null);
const group1People = ref<number>(1);
const subMeters = ref<SubMeterReading[]>([]);

const addSubMeter = () => {
  subMeters.value.push({
    label: `Sub-Meter ${subMeters.value.length + 1}`,
    readingFrom: 0,
    readingTo: 0,
  });
};

const removeSubMeter = (index: number) => {
  subMeters.value.splice(index, 1);
};

const shares = computed(() =>
  calculateShares(
    totalKwh.value ?? 0,
    totalAmount.value ?? 0,
    subMeters.value,
    group1People.value,
  ),
);

const hasInvalidReading = computed(() =>
  subMeters.value.some((meter) => meter.readingTo < meter.readingFrom),
);

const php = (value: number) =>
  value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
</script>

<template>
  <div class="flex flex-col gap-6 max-w-2xl">
    <!-- Bill totals -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="pt-total-kwh"
          >Total consumed (kWh)</label
        >
        <InputNumber
          inputId="pt-total-kwh"
          v-model="totalKwh"
          :minFractionDigits="0"
          :maxFractionDigits="2"
          placeholder="e.g. 362"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="pt-total-amount"
          >Amount due (Php)</label
        >
        <InputNumber
          inputId="pt-total-amount"
          v-model="totalAmount"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          placeholder="e.g. 5,193.16"
          fluid
        />
      </div>
    </div>

    <!-- Sub-meters -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Sub-Meters</h3>
        <Button
          label="Add Sub-Meter"
          icon="pi pi-plus"
          size="small"
          outlined
          @click="addSubMeter"
        />
      </div>
      <p v-if="!subMeters.length" class="text-sm opacity-70">
        No sub-meters — the whole bill goes to Group 1.
      </p>
      <div
        v-for="(meter, index) in subMeters"
        :key="index"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end border border-surface-divider rounded-lg p-3"
      >
        <div class="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label class="text-xs font-medium">Label</label>
          <InputText v-model="meter.label" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium">Reading from</label>
          <!-- Meter readings are odometer values, not quantities — no grouping. -->
          <InputNumber
            v-model="meter.readingFrom"
            :maxFractionDigits="2"
            :useGrouping="false"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium">Reading to</label>
          <InputNumber
            v-model="meter.readingTo"
            :maxFractionDigits="2"
            :useGrouping="false"
            fluid
          />
        </div>
        <div class="flex items-center gap-2 col-span-2 sm:col-span-1">
          <span class="text-sm flex-1">
            = {{ (meter.readingTo - meter.readingFrom).toFixed(2) }} kWh
          </span>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            @click="removeSubMeter(index)"
          />
        </div>
      </div>
      <Message v-if="hasInvalidReading" severity="warn" :closable="false">
        A sub-meter's "reading to" is lower than its "reading from".
      </Message>
    </div>

    <!-- Group 1 head count -->
    <div class="flex flex-col gap-1 sm:w-1/2">
      <label class="text-sm font-medium" for="pt-people"
        >People in Group 1</label
      >
      <InputNumber
        inputId="pt-people"
        v-model="group1People"
        :min="1"
        showButtons
        fluid
      />
    </div>

    <!-- Results -->
    <div
      v-if="shares"
      class="rounded-xl border border-surface-divider bg-surface-card p-4 sm:p-5 flex flex-col gap-3"
    >
      <div class="flex justify-between gap-3 text-sm">
        <span class="min-w-0">Price per kWh</span>
        <span class="font-semibold whitespace-nowrap">{{
          php(shares.pricePerKwh)
        }}</span>
      </div>
      <div
        v-for="meter in shares.subMeters"
        :key="meter.label"
        class="flex justify-between gap-3 text-sm"
      >
        <span class="min-w-0 break-words"
          >{{ meter.label }} ({{ meter.kwh.toFixed(2) }} kWh)</span
        >
        <span class="font-semibold whitespace-nowrap">{{
          php(meter.amount)
        }}</span>
      </div>
      <div class="flex justify-between gap-3 text-sm">
        <span class="min-w-0">Group 1 ({{ shares.group1Kwh.toFixed(2) }} kWh)</span>
        <span class="font-semibold whitespace-nowrap">{{
          php(shares.group1Amount)
        }}</span>
      </div>
      <Message
        v-if="shares.group1Kwh < 0"
        severity="warn"
        :closable="false"
      >
        Sub-meters consumed more than the total reading — check the inputs.
      </Message>
      <div
        class="flex justify-between gap-3 border-t border-surface-divider pt-3 text-base"
      >
        <span class="font-semibold min-w-0"
          >Per person in Group 1 ({{ group1People }}
          {{ group1People === 1 ? "person" : "people" }})</span
        >
        <span class="font-bold whitespace-nowrap">{{
          php(shares.perPersonAmount)
        }}</span>
      </div>
    </div>
    <p v-else class="text-sm opacity-70">
      Enter the total kWh and amount due to see the breakdown.
    </p>
  </div>
</template>
