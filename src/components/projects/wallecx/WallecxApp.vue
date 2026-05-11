<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

// --- STATE ---
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);

// --- LOGIC ---
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">
          Wallecx
        </h1>
      </div>
      <div>
        <p v-if="isLoading">Loading...</p>
        <p v-else>{{ records.length }} vaccination record{{ records.length === 1 ? "" : "s" }}</p>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
