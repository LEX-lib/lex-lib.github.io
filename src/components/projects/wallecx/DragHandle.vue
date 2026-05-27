<!-- src/components/projects/wallecx/DragHandle.vue
     Phase 34 D-34-03: Visual-only drag-handle pill for bottom-sheet Drawers.
     aria-hidden="true" — decorative; not interactive; no swipe-to-dismiss (Phase 35).
     Callers control v-if="isMobile" gating — this component renders unconditionally. -->
<template>
  <div
    class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
    aria-hidden="true"
  />
</template>
