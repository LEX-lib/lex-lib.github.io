<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import PaymentLog from "./PaymentLog.vue";
import ElectricityCalculator from "./ElectricityCalculator.vue";
import MonthlyReport from "./MonthlyReport.vue";

const auth = useAuthStore();

const isAdmin = computed(() => auth.user?.is_admin === true);
</script>

<template>
  <div class="min-h-screen bg-surface-page">
    <div class="container mx-auto px-6 lg:px-12 py-10">
      <h1
        class="text-3xl lg:text-4xl font-bold mb-2"
        style="color: var(--color-typo-heading)"
      >
        PayTime
        <span style="color: var(--color-brand-accent)">.</span>
      </h1>
      <p class="mb-8" style="color: var(--color-typo-body)">
        Track your boarding house payments and split shared bills.
      </p>

      <Tabs value="log">
        <TabList>
          <Tab value="log">My Payments</Tab>
          <Tab value="calculator">Electricity Calculator</Tab>
          <Tab v-if="isAdmin" value="report">Monthly Report</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="log">
            <PaymentLog />
          </TabPanel>
          <TabPanel value="calculator">
            <ElectricityCalculator />
          </TabPanel>
          <TabPanel v-if="isAdmin" value="report">
            <MonthlyReport />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>
