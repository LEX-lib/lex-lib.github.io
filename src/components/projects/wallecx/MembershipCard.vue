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

const tileStyle = computed(() => ({
  backgroundColor: props.record.card_color ? '#' + props.record.card_color : '#002244'
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
  <Card
    class="cursor-pointer hover:shadow-md transition-shadow overflow-hidden min-h-[44px] touch-manipulation"
    :style="tileStyle"
    style="min-height: 8rem;"
    @click="emit('click')"
  >
    <template #content>
      <!-- Card name — primary, always white text on coloured background -->
      <p class="text-lg font-bold mb-1" style="color: #ffffff;">
        {{ record.card_name }}
      </p>

      <!-- Issuer — subordinate, white 75% opacity; only when present -->
      <p v-if="record.issuer" class="text-sm mb-2" style="color: rgba(255,255,255,0.75);">
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
        <p v-if="record.expiry_date" class="text-sm" style="color: rgba(255,255,255,0.85);">
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
