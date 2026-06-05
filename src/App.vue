<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import CustomNavBar from "@/components/CustomNavBar.vue";
import OfflineBanner from "@/components/OfflineBanner.vue";
import { Toaster } from "vue-sonner";
import { SpeedInsights } from "@vercel/speed-insights/vue";
import {
  setInstallPromptEvent,
  clearInstallPromptEvent,
  type BeforeInstallPromptEvent,
} from "@/composables/useMobileEnv";

const isProd = import.meta.env.PROD;

// FND-02: capture Android Chrome's beforeinstallprompt at App.vue scope (NOT
// WallecxApp.vue) so the event survives in-app navigation to /projects/wallecx.
// Registering late at the mini-app scope would miss the event on first paint
// (A-43-4). Capture-only (D-05): preventDefault suppresses Chrome's auto-banner
// and we stash the event in useMobileEnv's module singleton — Phase 37 owns the
// user-gesture-gated .prompt() call. We NEVER call .prompt() here.
function handleBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  setInstallPromptEvent(event as BeforeInstallPromptEvent);
}

function handleAppInstalled(): void {
  clearInstallPromptEvent();
}

onMounted(() => {
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
});
</script>

<template>
  <OfflineBanner />
  <CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }" />
  <RouterView />
  <Toaster />
  <SpeedInsights v-if="isProd" />
</template>
