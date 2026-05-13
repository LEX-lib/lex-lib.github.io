<script setup lang="ts">
import { ref } from "vue";
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";

const activeTab = ref<string>("vaccinations");
</script>

<template>
  <Card>
    <template #content>
      <h1 class="text-2xl font-bold mb-4" style="color: var(--color-typo-heading)">Wallecx</h1>
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="vaccinations">
            <iconify-icon icon="mdi:needle" width="16" height="16" aria-hidden="true"></iconify-icon>
            Vaccinations
          </Tab>
          <Tab value="memberships">
            <iconify-icon icon="mdi:card-account-details-outline" width="16" height="16" aria-hidden="true"></iconify-icon>
            Membership Cards
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="vaccinations">
            <VaccinationsTab />
          </TabPanel>
          <TabPanel value="memberships">
            <MembershipsTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <ConfirmDialog />
    </template>
  </Card>
</template>

<style scoped></style>
