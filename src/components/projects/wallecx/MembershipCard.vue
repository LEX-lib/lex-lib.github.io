<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'
import type { Memberships } from '@/types/wallecx/memberships/types'

const props = defineProps<{
  record: Memberships
}>()

const emit = defineEmits<{
  click: []
}>()

// WCAG luminance-based contrast helper (D-06).
// Picks "#0d1117" (near-black) for light card_color, "#ffffff" for dark.
// Threshold 0.5 — perceptual midpoint; documented in 18-CONTEXT.md §Specific Ideas.
// Input may include or omit a leading "#"; card_color is stored without "#" per STATE.md invariant.
function pickTextColor(hex: string): string {
  const c = hex.replace('#', '').toLowerCase()
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.5 ? '#0d1117' : '#ffffff'
}

const cardBg = computed(() =>
  props.record.card_color ? '#' + props.record.card_color : '#002244'
)
const cardTextColor = computed(() => pickTextColor(cardBg.value))

const tileStyle = computed(() => ({
  backgroundColor: cardBg.value,
  color: cardTextColor.value,
}))

const isExpirySoon = computed<boolean>(() => {
  if (!props.record.expiry_date) return false
  const daysUntil = dayjs(props.record.expiry_date).diff(dayjs(), 'day')
  return daysUntil <= 30
})

const isExpired = computed<boolean>(() => {
  if (!props.record.expiry_date) return false
  return dayjs(props.record.expiry_date).isBefore(dayjs(), 'day')
})

const expiryBadgeText = computed<string>(() => {
  if (!props.record.expiry_date) return ''
  if (isExpired.value) return 'Expired'
  return 'Expiring soon'
})

const BARCODE_TYPE_LABELS: Record<string, string> = {
  qr: 'QR',
  code128: 'Code 128',
  ean13: 'EAN-13',
  code39: 'Code 39',
  number: 'Number only',
}

const barcodeTypeLabel = computed<string>(() =>
  BARCODE_TYPE_LABELS[props.record.barcode_type ?? ''] ?? props.record.barcode_type ?? ''
)

function displayExpiry(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY')
}
</script>

<template>
  <!-- min-height: 8rem satisfies the 44px touch-target requirement -->
  <Card
    class="cursor-pointer hover:shadow-md transition-shadow overflow-hidden touch-manipulation"
    :style="[tileStyle, { minHeight: '8rem' }]"
    @click="emit('click')"
  >
    <template #content>
      <!-- Card name — primary, contrast-aware foreground derived from card_color luminance -->
      <p class="text-lg font-bold mb-1" :style="{ color: cardTextColor }">
        {{ record.card_name }}
      </p>

      <!-- Issuer — subordinate, contrast-aware foreground at 75% opacity; only when present -->
      <p v-if="record.issuer" class="text-sm mb-2" :style="{ color: cardTextColor, opacity: 0.75 }">
        {{ record.issuer }}
      </p>

      <!-- Barcode type badge -->
      <div class="flex items-center gap-2 mb-2">
        <Badge
          v-if="record.barcode_type && record.barcode_type !== 'number'"
          :value="barcodeTypeLabel"
          severity="secondary"
          class="text-xs"
        />
        <Badge
          v-else-if="record.barcode_type === 'number'"
          value="Number only"
          severity="secondary"
          class="text-xs"
        />
      </div>

      <!-- Expiry row -->
      <div class="flex items-center gap-2 mt-auto">
        <p v-if="record.expiry_date" class="text-sm" :style="{ color: cardTextColor, opacity: 0.85 }">
          Expires: {{ displayExpiry(record.expiry_date) }}
        </p>
        <Badge
          v-if="isExpirySoon && record.expiry_date"
          :value="expiryBadgeText"
          :severity="isExpired ? 'danger' : 'warning'"
        />
      </div>
    </template>
  </Card>
</template>
