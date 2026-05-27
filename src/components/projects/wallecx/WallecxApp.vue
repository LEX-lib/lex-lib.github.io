<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { pb } from "@/lib/pocketbase";
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";
import ExpensesTab from "./ExpensesTab.vue";
import PwaInstallBanner from './PwaInstallBanner.vue';
import '@/assets/wallecx-overrides.css';

const router = useRouter();
const activeTab = ref<string>("vaccinations");

// --- PWA-06: SW update prompt ---
// needRefresh becomes true when a new SW has installed and is waiting to activate.
// registerType: 'prompt' (vite.config.ts) guarantees this never auto-reloads.
const { needRefresh, updateServiceWorker } = useRegisterSW();

watch(needRefresh, (val) => {
  if (!val) return;
  toast.info("A new version of Wallecx is available.", {
    duration: Infinity,
    action: {
      label: "Refresh",
      onClick: () => updateServiceWorker(true),
    },
    cancel: {
      label: "Later",
      onClick: () => {
        needRefresh.value = false;
      },
    },
  });
});

// --- PWA-05: Auth resilience + storage persistence ---
onMounted(async () => {
  // navigator.storage.persist(): iOS 7-day localStorage eviction mitigation.
  // Optional-chain guard: navigator.storage is undefined on iOS < 17 and older browsers.
  // Best-effort only — do NOT show UI based on the return value.
  if (navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      // Silently ignore — graceful degradation
    }
  }

  // pb.authStore.isValid: synchronous JWT expiry check (does not hit the network).
  // This complements the router guard:
  //   - Router guard checks !!user.value (non-null record in store)
  //   - This check catches the case where the record is non-null but the token is expired
  //   - Catches iOS 8-day dormancy scenario where token expires while app is backgrounded
  // Do NOT use useAuthStore().isLoggedIn here — it checks !!user.value, not token expiry.
  if (!pb.authStore.isValid) {
    toast.info("Your session has expired. Please sign in again.");
    await router.push({
      name: "login",
      query: { redirect: "/projects/wallecx" },
    });
  }
});
</script>

<template>
  <Card
      class="overscroll-none"
      :style="{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }"
    >
    <template #content>
      <h1 class="text-2xl font-bold mb-4" style="color: var(--color-typo-heading)">Wallecx</h1>
      <Tabs v-model:value="activeTab" class="wallecx-main-tabs">
        <TabList>
          <Tab value="vaccinations">
            <iconify-icon icon="mdi:needle" width="16" height="16" aria-hidden="true"></iconify-icon>
            Vaccinations
          </Tab>
          <Tab value="memberships">
            <iconify-icon icon="mdi:card-account-details-outline" width="16" height="16" aria-hidden="true"></iconify-icon>
            Membership Cards
          </Tab>
          <Tab value="expenses">
            <iconify-icon icon="mdi:cash-multiple" width="16" height="16" aria-hidden="true"></iconify-icon>
            Expenses
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="vaccinations">
            <VaccinationsTab />
          </TabPanel>
          <TabPanel value="memberships">
            <MembershipsTab />
          </TabPanel>
          <TabPanel value="expenses">
            <ExpensesTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <ConfirmDialog />
    </template>
  </Card>
  <PwaInstallBanner />
</template>
