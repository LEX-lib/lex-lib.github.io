<script setup lang="ts">
import CustomNavBar from "@/components/CustomNavBar.vue";
import { Toaster } from "vue-sonner";
import { SpeedInsights } from "@vercel/speed-insights/vue";

const isProd = import.meta.env.PROD;
</script>

<template>
  <CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }" />
  <RouterView />
  <Toaster />
  <SpeedInsights v-if="isProd" />
</template>
