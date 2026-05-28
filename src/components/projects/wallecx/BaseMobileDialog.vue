<script setup lang="ts">
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useMobileEnv } from '@/composables/useMobileEnv'
import DragHandle from './DragHandle.vue'

const props = defineProps<{
  title: string
  isDirty: boolean
  isSaving: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })
const { isMobile } = useMobileEnv()
const confirm = useConfirm()

// Bypass flag: set to true by closeWithoutGuard() before setting visible=false.
// Prevents the dirty-guard from firing on Save / explicit Cancel close paths.
// Vue 3 reactive assignments are synchronous so this is race-free (A4, RESEARCH.md).
let _bypassGuard = false

/**
 * Close the dialog/drawer WITHOUT triggering the dirty-state guard.
 * Children call this from their Save success path and explicit Cancel handler.
 * Exposed via defineExpose so consumers can reach it via a template ref.
 */
function closeWithoutGuard(): void {
  _bypassGuard = true
  visible.value = false
}

defineExpose({ closeWithoutGuard })

/**
 * Fires BEFORE the Drawer closes (backdrop tap, swipe-down, Esc key) when
 * `:dismissable="false"` is set (RESEARCH.md §2, Verified Drawer API).
 * Guards against accidental data loss when the user has unsaved changes.
 */
function onBeforeHide(): void {
  if (_bypassGuard) {
    _bypassGuard = false
    return
  }
  if (!props.isDirty) {
    // Not dirty — drive the close manually (dismissable=false blocks auto-close)
    visible.value = false
    return
  }
  confirm.require({
    header: 'Discard changes?',
    message: 'Your unsaved changes will be lost.',
    acceptLabel: 'Discard',
    rejectLabel: 'Keep editing',
    acceptClass: 'p-button-danger',
    accept: () => {
      visible.value = false
    },
  })
}

/** Fires after the Drawer/Dialog fully closes. Resets the bypass flag as a safety net. */
function onHide(): void {
  _bypassGuard = false
}

/**
 * FD-06: Auto-scroll focused input into view when the virtual keyboard opens.
 * Mobile-only; desktop layout is not affected by this.
 * requestAnimationFrame defers the scroll until the keyboard has started opening
 * so the target element is already displaced before we scroll to it.
 */
function onFocusin(e: FocusEvent): void {
  if (!isMobile.value) return
  const target = e.target as HTMLElement
  if (target?.scrollIntoView) {
    requestAnimationFrame(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }
}

// Template ref for the form container (enables slot consumers to detect focus events)
const formRef = ref<HTMLElement | null>(null)
</script>

<template>
  <!-- Mobile: bottom Drawer (85dvh cap already applied by Phase 34 wallecx-overrides.css) -->
  <Drawer
    v-if="isMobile"
    v-model:visible="visible"
    position="bottom"
    :dismissable="false"
    :show-close-icon="!isSaving"
    @before-hide="onBeforeHide"
    @hide="onHide"
  >
    <template #header>
      <div class="flex flex-col items-center w-full gap-1">
        <DragHandle />
        <span class="font-semibold">{{ title }}</span>
      </div>
    </template>

    <!-- Form container: focusin listener drives FD-06 auto-scroll on mobile -->
    <div ref="formRef" @focusin="onFocusin">
      <slot />
      <!-- Sticky action bar: #actions slot routed inside scrollable content (mobile).
           .wallecx-manage-actions CSS rule (Phase 35 LT-08) pins it to the bottom. -->
      <div class="wallecx-manage-actions">
        <slot name="actions" />
      </div>
    </div>
  </Drawer>

  <!-- Desktop: centered Dialog (free-dismiss — no dirty guard on desktop per D-35-08) -->
  <Dialog
    v-else
    modal
    v-model:visible="visible"
    :header="title"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
    :closable="!isSaving"
    @hide="onHide"
  >
    <slot />
    <!-- Desktop: #actions slot routed to Dialog #footer (always visible, outside scroll) -->
    <template #footer>
      <slot name="actions" />
    </template>
  </Dialog>
</template>

<style scoped>
/* Dark-mode surface overrides — extracted from ManageExpense.vue (duplicated across all 4
 * Manage dialogs in Phase 34). Consolidated here so migration plans 02–05 can remove the
 * duplicate scoped :deep blocks. */
:deep(.my-app-dark .p-dialog),
:deep(.my-app-dark .p-dialog .p-dialog-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
:deep(.my-app-dark .p-drawer),
:deep(.my-app-dark .p-drawer .p-drawer-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
</style>
