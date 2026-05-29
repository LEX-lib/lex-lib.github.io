<script setup lang="ts">
import { useOnline } from '@vueuse/core'

const isOnline = useOnline()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="!isOnline"
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2"
      :style="{
        backgroundColor: 'var(--color-status-warning)',
        paddingTop: 'env(safe-area-inset-top)',
        color: '#0d1117',
      }"
      role="status"
      aria-live="polite"
    >
      You're offline. Changes will resume when you reconnect.
    </div>
  </Teleport>
</template>
