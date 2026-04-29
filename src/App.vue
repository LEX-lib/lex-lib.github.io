<script setup lang="ts">
import CustomNavBar from "@/components/CustomNavBar.vue";
import { Toaster } from "vue-sonner";
import { SpeedInsights } from "@vercel/speed-insights/vue";
</script>

<template>
  <CustomNavBar class="mb-1" />
  <RouterView />
  <Toaster />
  <SpeedInsights />
</template>
