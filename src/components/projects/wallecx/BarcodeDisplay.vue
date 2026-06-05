<script setup lang="ts">
import JsBarcode from 'jsbarcode'
import QrcodeVue from 'qrcode.vue'
import { ref, computed, onMounted, watch, useTemplateRef } from 'vue'

// Module-level constants — NEVER configurable via props (STATE.md BR-2)
const BARCODE_FOREGROUND = '#000000'
const BARCODE_BACKGROUND = '#ffffff'

const props = defineProps<{
  barcode_type: string | undefined
  barcode_value: string | undefined
  card_number: string | undefined
}>()

const emit = defineEmits<{
  scan: []
}>()

const barcodeSvgRef = useTemplateRef<SVGSVGElement>('barcodeSvgRef')
const renderError = ref(false)

type BarcodeDisplayBranch = 'qr' | 'linear' | 'number-fallback' | 'empty'

// renderError checked FIRST — prevents re-entering linear branch after JsBarcode throw
// while props remain truthy (STATE.md BR-1)
const displayBranch = computed<BarcodeDisplayBranch>(() => {
  if (renderError.value && props.card_number) return 'number-fallback'
  if (renderError.value && !props.card_number) return 'empty'
  if (props.barcode_type === 'qr' && props.barcode_value) return 'qr'
  if (['code128', 'ean13', 'code39'].includes(props.barcode_type ?? '') && props.barcode_value) return 'linear'
  if (props.card_number) return 'number-fallback'
  return 'empty'
})

function renderBarcode(): void {
  if (!barcodeSvgRef.value) return  // STATE.md BR-5: watcher fires before SVG mounts
  try {
    JsBarcode(barcodeSvgRef.value, props.barcode_value ?? '', {
      format: props.barcode_type?.toUpperCase() ?? 'CODE128',
      lineColor: BARCODE_FOREGROUND,
      background: BARCODE_BACKGROUND,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    })
    renderError.value = false
  } catch {
    renderError.value = true  // displayBranch falls to number-fallback or empty
  }
}

onMounted(renderBarcode)                         // initial render after SVG mounts
watch(() => props.barcode_value, renderBarcode)  // NO { immediate: true } — STATE.md BR-5
</script>

<template>
  <!-- Branch A: QR code -->
  <div
    v-if="displayBranch === 'qr'"
    class="bg-white p-6 rounded flex items-center justify-center cursor-pointer"
    @click="emit('scan')"
  >
    <QrcodeVue
      :value="barcode_value!"
      :size="200"
      level="M"
      render-as="svg"
      :foreground="BARCODE_FOREGROUND"
      :background="BARCODE_BACKGROUND"
    />
  </div>

  <!-- Branch B: Linear barcode (code128 / ean13 / code39) -->
  <div
    v-else-if="displayBranch === 'linear'"
    class="bg-white p-6 rounded flex items-center justify-center cursor-pointer"
    @click="emit('scan')"
  >
    <svg ref="barcodeSvgRef"></svg>
  </div>

  <!-- Branch C: card_number plain-text fallback (barcode_value absent or renderError) -->
  <div
    v-else-if="displayBranch === 'number-fallback'"
    class="bg-white p-6 rounded flex flex-col items-center justify-center cursor-pointer gap-2"
    @click="emit('scan')"
  >
    <span class="text-3xl font-bold" style="color: #000000;">{{ card_number }}</span>
    <span class="text-sm" style="color: var(--color-typo-muted)">Barcode unavailable</span>
  </div>

  <!-- Branch D: No barcode data at all — no @click, no cursor-pointer -->
  <div
    v-else
    class="bg-white p-6 rounded flex flex-col items-center justify-center gap-2"
  >
    <iconify-icon
      icon="mdi:barcode-off"
      width="48"
      height="48"
      style="color: var(--color-typo-muted)"
      aria-hidden="true"
    ></iconify-icon>
    <span class="text-sm" style="color: var(--color-typo-muted)">No barcode</span>
  </div>
</template>
