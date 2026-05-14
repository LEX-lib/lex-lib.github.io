<script setup lang="ts">
import { ref, onMounted } from 'vue';

const BANNER_DISMISSED_KEY = 'wallecx_pwa_banner_dismissed';

const isVisible = ref(false);

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

onMounted(() => {
  try {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed === 'true') return;
    if (isIosSafari() && !isInStandaloneMode()) {
      isVisible.value = true;
    }
  } catch {
    // localStorage unavailable (private browsing) — silently degrade; banner does not show
  }
});

function dismiss(): void {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  } catch {
    // Degrade silently — banner will hide for this session even if localStorage failed
  }
  isVisible.value = false;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <iconify-icon
        icon="mdi:share-variant"
        width="20"
        height="20"
        style="color: #e89820; flex-shrink: 0;"
        aria-hidden="true"
      ></iconify-icon>
      <span class="flex-1 text-sm" style="color: #ffffff;">
        Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install Wallecx
      </span>
      <button
        class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        style="color: rgba(255,255,255,0.7); background: none; border: none; cursor: pointer;"
        aria-label="Dismiss install banner"
        @click="dismiss"
      >
        <iconify-icon icon="mdi:close" width="20" height="20" aria-hidden="true"></iconify-icon>
      </button>
    </div>
  </Teleport>
</template>
