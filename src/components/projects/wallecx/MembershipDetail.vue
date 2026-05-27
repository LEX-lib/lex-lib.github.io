<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Memberships } from '@/types/wallecx/memberships/types'
import BarcodeDisplay from './BarcodeDisplay.vue'
import AttachmentPreview from './AttachmentPreview.vue'

const props = defineProps<{
  record: Memberships
  token: string
}>()

// Field display helpers
const BARCODE_TYPE_LABELS: Record<string, string> = {
  qr: 'QR',
  code128: 'Code 128',
  ean13: 'EAN-13',
  code39: 'Code 39',
  number: 'Number only',
}

const barcodeTypeLabel = computed<string>(() =>
  BARCODE_TYPE_LABELS[props.record.barcode_type ?? ''] ?? props.record.barcode_type ?? '—'
)

const displayExpiry = computed<string>(() =>
  props.record.expiry_date ? dayjs(props.record.expiry_date).format('DD MMMM YYYY') : '—'
)

// Scan overlay state + wake lock (STATE.md FS-1 + FS-2 locked)
const showScanOverlay = ref(false)
const wakeLock = ref<WakeLockSentinel | null>(null)

async function openScanOverlay(): Promise<void> {
  showScanOverlay.value = true
  if ('wakeLock' in navigator) {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
    } catch {
      // Degrade silently — overlay still opens without wake lock
    }
  }
}

async function closeScanOverlay(): Promise<void> {
  showScanOverlay.value = false
  try {
    await wakeLock.value?.release()
  } catch { /* ignore */ }
  wakeLock.value = null
}

// Re-acquire when tab regains visibility (STATE.md FS-1 — wake lock released on tab switch)
async function onVisibilityChange(): Promise<void> {
  if (document.visibilityState === 'visible' && showScanOverlay.value) {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.value = await navigator.wakeLock.request('screen')
      } catch { /* degrade silently */ }
    }
  }
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange))

// Edit / Delete emits — MembershipsTab.vue wires @edit and @delete (Plan 13-03)
const emit = defineEmits<{
  edit: [];
  delete: [];
}>()
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Primary field grid — two columns; mirrors VaccinationDetail pattern exactly -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Card Name</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.card_name }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Issuer</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.issuer || '—' }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Card Number</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ record.card_number || '—' }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Barcode Type</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ barcodeTypeLabel }}</p>
      </div>
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Expiry Date</p>
        <p class="text-sm" style="color: var(--color-typo-body)">{{ displayExpiry }}</p>
      </div>
      <!-- Card Colour — swatch + hex text; AU English spelling per UI-SPEC Copywriting -->
      <div>
        <p class="text-sm" style="color: var(--color-typo-heading)">Card Colour</p>
        <div v-if="record.card_color" class="flex items-center gap-2">
          <span
            class="inline-block w-4 h-4 rounded"
            :style="{ backgroundColor: '#' + record.card_color }"
          ></span>
          <span class="text-sm" style="color: var(--color-typo-body)">#{{ record.card_color }}</span>
        </div>
        <p v-else class="text-sm" style="color: var(--color-typo-body)">—</p>
      </div>
    </div>

    <!-- Notes — full-width, conditional, whitespace-pre-wrap; NEVER v-html -->
    <div v-if="record.notes">
      <p class="text-sm" style="color: var(--color-typo-heading)">Notes</p>
      <p class="text-sm whitespace-pre-wrap" style="color: var(--color-typo-body)">{{ record.notes }}</p>
    </div>

    <Divider />

    <!-- Barcode / QR Code section -->
    <div>
      <p class="text-sm mb-2" style="color: var(--color-typo-heading)">Barcode / QR Code</p>
      <BarcodeDisplay
        :barcode_type="record.barcode_type"
        :barcode_value="record.barcode_value"
        :card_number="record.card_number"
        @scan="openScanOverlay"
      />
    </div>

    <Divider />

    <!-- Card Photo section (MREAD-04) — uses refactored AttachmentPreview generic props -->
    <div>
      <p class="text-sm mb-2" style="color: var(--color-typo-heading)">Card Photo</p>
      <AttachmentPreview
        :record="record"
        attachment-field="card_image"
        :attachment-name="record.card_name"
        :token="token"
      />
    </div>

    <!-- Edit / Delete action row (D-04: emits to MembershipsTab; Plan 13-03) -->
    <div class="flex justify-end gap-2 pt-2">
      <Button
        label="Edit"
        icon="pi pi-pencil"
        severity="secondary"
        aria-label="Edit card"
        @click="emit('edit')"
      />
      <Button
        label="Delete"
        icon="pi pi-trash"
        severity="danger"
        aria-label="Delete card"
        @click="emit('delete')"
      />
    </div>

  </div>

  <!-- Scan overlay (SCAN-03) — Teleport escapes PrimeVue Dialog z-index stacking context -->
  <!-- STATE.md FS-2: position:fixed inset:0 z-index:9999 (NOT requestFullscreen) -->
  <Teleport to="body">
    <div
      v-if="showScanOverlay"
      class="fixed inset-0 flex flex-col items-center justify-center"
      style="z-index: 9999; background: #ffffff; filter: brightness(1.4); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);"
      role="dialog"
      aria-modal="true"
      aria-label="Barcode scan view"
      @keydown.esc.stop="closeScanOverlay"
    >
      <!-- Close button — always visible, top-right, 48px touch target -->
      <button
        class="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full"
        style="top: calc(1rem + env(safe-area-inset-top)); background: rgba(0,0,0,0.08);"
        @click="closeScanOverlay"
        aria-label="Close scan view"
      >
        <iconify-icon
          icon="mdi:close"
          width="24"
          height="24"
          style="color: #000000;"
          aria-hidden="true"
        ></iconify-icon>
      </button>

      <!-- Barcode centred — max-w-xs constrains width for scanner readability -->
      <!-- No @scan on overlay BarcodeDisplay — overlay IS the scan destination -->
      <div class="max-w-xs w-full">
        <BarcodeDisplay
          :barcode_type="record.barcode_type"
          :barcode_value="record.barcode_value"
          :card_number="record.card_number"
        />
      </div>
    </div>
  </Teleport>
</template>
