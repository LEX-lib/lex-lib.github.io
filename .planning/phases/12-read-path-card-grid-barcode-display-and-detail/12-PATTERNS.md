# Phase 12: Read Path — Card Grid, Barcode Display & Detail — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 5 (3 new components + 1 replacement + 1 modification)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/BarcodeDisplay.vue` | component | transform (computed branch selection) | `src/components/projects/wallecx/AttachmentPreview.vue` | role-match (multi-branch render) |
| `src/components/projects/wallecx/MembershipCard.vue` | component | request-response | `src/components/projects/wallecx/VaccinationGroupCard.vue` | exact (PrimeVue Card tile + Badge + emit click) |
| `src/components/projects/wallecx/MembershipDetail.vue` | component | request-response | `src/components/projects/wallecx/VaccinationDetail.vue` | exact (read-only detail + Divider + AttachmentPreview) |
| `src/components/projects/wallecx/MembershipsTab.vue` | component | CRUD (read) | `src/components/projects/wallecx/VaccinationsTab.vue` | exact (three-state fetch + Dialog + openDetail WR-03) |
| `src/components/projects/wallecx/AttachmentPreview.vue` | component | request-response | self (refactor) | self (field-name generalization) |

---

## Pattern Assignments

### `src/components/projects/wallecx/BarcodeDisplay.vue` (component, transform)

**Analog:** `src/components/projects/wallecx/AttachmentPreview.vue` (multi-branch render pattern)

**Imports pattern** — copy from AttachmentPreview lines 1-6, adapt to barcode libraries:
```typescript
import JsBarcode from 'jsbarcode'
import QrcodeVue from 'qrcode.vue'
import { ref, computed, onMounted, watch, useTemplateRef } from 'vue'
```
Note: PrimeVue components (no explicit imports needed — auto-resolved by PrimeVueResolver).

**Module-level constants** (not props — locked by STATE.md BR-2):
```typescript
const BARCODE_FOREGROUND = '#000000'
const BARCODE_BACKGROUND = '#ffffff'
```

**Props + emits pattern:**
```typescript
const props = defineProps<{
  barcode_type: string | undefined
  barcode_value: string | undefined
  card_number: string | undefined
}>()

const emit = defineEmits<{
  scan: []
}>()
```

**Core pattern — four-branch computed selector:**

The branch selection logic mirrors AttachmentPreview's `mimeCategory` computed (lines 33 / AttachmentPreview.vue) but uses a discriminated union type. `renderError` must be checked FIRST to prevent re-entering `linear` branch after a JsBarcode throw:
```typescript
const barcodeSvgRef = useTemplateRef<SVGSVGElement>('barcodeSvgRef')
const renderError = ref(false)

type BarcodeDisplayBranch = 'qr' | 'linear' | 'number-fallback' | 'empty'

const displayBranch = computed<BarcodeDisplayBranch>(() => {
  if (renderError.value && props.card_number) return 'number-fallback'
  if (renderError.value && !props.card_number) return 'empty'
  if (props.barcode_type === 'qr' && props.barcode_value) return 'qr'
  if (['code128', 'ean13', 'code39'].includes(props.barcode_type ?? '') && props.barcode_value) return 'linear'
  if (props.card_number) return 'number-fallback'
  return 'empty'
})
```

**JsBarcode render function — mandatory try/catch:**
```typescript
function renderBarcode(): void {
  if (!barcodeSvgRef.value) return  // STATE.md BR-5: watcher guard before SVG mount
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
    renderError.value = true
  }
}

onMounted(renderBarcode)
watch(() => props.barcode_value, renderBarcode)  // NO { immediate: true } — STATE.md BR-5
```

**Template — branch conditional pattern** (mirrors AttachmentPreview template lines 52-103):
```html
<!-- Branch A: QR code -->
<div v-if="displayBranch === 'qr'"
     class="bg-white p-6 rounded flex items-center justify-center cursor-pointer"
     @click="emit('scan')">
  <QrcodeVue :value="barcode_value" :size="200" level="M" render-as="svg"
    :foreground="BARCODE_FOREGROUND" :background="BARCODE_BACKGROUND" />
</div>

<!-- Branch B: Linear barcode — SVG target for JsBarcode imperative call -->
<div v-else-if="displayBranch === 'linear'"
     class="bg-white p-6 rounded flex items-center justify-center cursor-pointer"
     @click="emit('scan')">
  <svg ref="barcodeSvgRef"></svg>
</div>

<!-- Branch C: card_number plain text fallback -->
<div v-else-if="displayBranch === 'number-fallback'"
     class="bg-white p-6 rounded flex flex-col items-center justify-center cursor-pointer gap-2"
     @click="emit('scan')">
  <span class="text-3xl font-bold" style="color: #000000;">{{ card_number }}</span>
  <span class="text-sm" style="color: var(--color-typo-muted)">Barcode unavailable</span>
</div>

<!-- Branch D: no barcode data at all -->
<div v-else class="bg-white p-6 rounded flex flex-col items-center justify-center gap-2">
  <iconify-icon icon="mdi:barcode-off" width="48" height="48"
    style="color: var(--color-typo-muted)" aria-hidden="true"></iconify-icon>
  <span class="text-sm" style="color: var(--color-typo-muted)">No barcode</span>
</div>
```

**Critical:** `ref="barcodeSvgRef"` string must match the `useTemplateRef('barcodeSvgRef')` call. The `<svg>` tag has no `ref` in Branch D — JsBarcode never targets it.

---

### `src/components/projects/wallecx/MembershipCard.vue` (component, request-response)

**Analog:** `src/components/projects/wallecx/VaccinationGroupCard.vue` (lines 1-63)

**Imports pattern** (lines 1-11 of VaccinationGroupCard.vue):
```typescript
import dayjs from 'dayjs'
import type { Memberships } from '@/types/wallecx/memberships/types'
```
No `pb` import — this component is purely presentational (no PocketBase calls).

**Props + emits pattern** (lines 7-15 of VaccinationGroupCard.vue — adapted):
```typescript
const props = defineProps<{
  record: Memberships
}>()

const emit = defineEmits<{
  click: []
}>()
```

**Core pattern — card_color CSS binding** (locked — STATE.md):
```typescript
const tileStyle = computed(() => ({
  backgroundColor: props.record.card_color ? '#' + props.record.card_color : '#002244'
}))
```

**Expiry computed pattern** (dayjs — same library as VaccinationGroupCard line 3 / VaccinationsTab line 233):
```typescript
const isExpirySoon = computed<boolean>(() => {
  if (!props.record.expiry_date) return false
  return dayjs(props.record.expiry_date).diff(dayjs(), 'day') <= 30
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

const barcode_type_label = computed<string>(() =>
  BARCODE_TYPE_LABELS[props.record.barcode_type ?? ''] ?? props.record.barcode_type ?? ''
)

function displayExpiry(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY')  // compact tile format — matches VaccinationGroupCard line 22
}
```

**Template structure** (mirrors VaccinationGroupCard lines 27-63, with card_color background instead of default surface):
```html
<Card
  class="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
  :style="tileStyle"
  style="min-height: 8rem;"
  @click="emit('click')"
>
  <template #content>
    <p class="text-lg font-bold mb-1" style="color: #ffffff;">{{ record.card_name }}</p>
    <p v-if="record.issuer" class="text-sm mb-2" style="color: rgba(255,255,255,0.75);">
      {{ record.issuer }}
    </p>
    <div class="flex items-center gap-2 mb-2">
      <Badge v-if="record.barcode_type" :value="barcode_type_label" severity="secondary" class="text-xs" />
    </div>
    <div class="flex items-center gap-2 mt-auto">
      <p v-if="record.expiry_date" class="text-sm" style="color: rgba(255,255,255,0.85);">
        Expires: {{ displayExpiry(record.expiry_date) }}
      </p>
      <Badge v-if="isExpirySoon && record.expiry_date" :value="expiryBadgeText"
             :severity="isExpired ? 'danger' : 'warning'" />
    </div>
  </template>
</Card>
```
Key differences from VaccinationGroupCard: `:style="tileStyle"` dynamic background; all text `#ffffff` (not `var(--color-brand-primary)`); no thumbnail image; Badge for barcode type instead of record count.

---

### `src/components/projects/wallecx/MembershipDetail.vue` (component, request-response)

**Analog:** `src/components/projects/wallecx/VaccinationDetail.vue` (lines 1-57)

**Imports pattern** (lines 1-8 of VaccinationDetail.vue — adapted):
```typescript
import dayjs from 'dayjs'
import { ref, onMounted, onUnmounted } from 'vue'
import type { Memberships } from '@/types/wallecx/memberships/types'
import BarcodeDisplay from './BarcodeDisplay.vue'
import AttachmentPreview from './AttachmentPreview.vue'
```
Note: `AttachmentPreview` is imported explicitly (not auto-resolved — it's a local component not in PrimeVue registry).

**Props pattern** (lines 5-8 of VaccinationDetail.vue):
```typescript
const props = defineProps<{
  record: Memberships
  token: string
}>()
```

**Field display helpers** (lines 10-12 of VaccinationDetail.vue — adapted):
```typescript
const BARCODE_TYPE_LABELS: Record<string, string> = {
  qr: 'QR', code128: 'Code 128', ean13: 'EAN-13', code39: 'Code 39', number: 'Number only',
}

const barcodeTypeLabel = computed<string>(() =>
  BARCODE_TYPE_LABELS[props.record.barcode_type ?? ''] ?? props.record.barcode_type ?? '—'
)

const displayExpiry = computed<string>(() =>
  props.record.expiry_date ? dayjs(props.record.expiry_date).format('DD MMMM YYYY') : '—'
  // verbose format — matches VaccinationDetail line 11: 'DD MMMM YYYY'
)
```

**Scan overlay state + wake lock pattern** (NEW — no analog in VaccinationDetail; pattern comes from RESEARCH.md Pattern 3):
```typescript
const showScanOverlay = ref(false)
const wakeLock = ref<WakeLockSentinel | null>(null)

async function openScanOverlay(): Promise<void> {
  showScanOverlay.value = true
  if ('wakeLock' in navigator) {
    try { wakeLock.value = await navigator.wakeLock.request('screen') } catch { /* degrade */ }
  }
}

async function closeScanOverlay(): Promise<void> {
  showScanOverlay.value = false
  try { await wakeLock.value?.release() } catch { /* ignore */ }
  wakeLock.value = null
}

async function onVisibilityChange(): Promise<void> {
  if (document.visibilityState === 'visible' && showScanOverlay.value) {
    if ('wakeLock' in navigator) {
      try { wakeLock.value = await navigator.wakeLock.request('screen') } catch { /* degrade */ }
    }
  }
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange))
```

**Template structure** (mirrors VaccinationDetail lines 15-57):
```html
<!-- Field grid: copy VaccinationDetail lines 18-43 structure exactly, replace fields -->
<div class="flex flex-col gap-4">
  <div class="grid grid-cols-2 gap-4">
    <!-- per-field: <p label> + <p value> pairs in text-sm -->
  </div>

  <!-- Notes conditional: copy VaccinationDetail lines 46-49 exactly -->
  <div v-if="record.notes">
    <p class="text-sm" style="color: var(--color-typo-heading)">Notes</p>
    <p class="text-sm whitespace-pre-wrap" style="color: var(--color-typo-body)">{{ record.notes }}</p>
  </div>

  <Divider />  <!-- copy VaccinationDetail line 52 -->

  <!-- Barcode section — NEW, no analog -->
  <div>
    <p class="text-sm mb-2" style="color: var(--color-typo-heading)">Barcode / QR Code</p>
    <BarcodeDisplay :barcode_type="record.barcode_type" :barcode_value="record.barcode_value"
      :card_number="record.card_number" @scan="openScanOverlay" />
  </div>

  <Divider />

  <!-- Attachment preview: copy VaccinationDetail line 55 — prop names change per AttachmentPreview refactor -->
  <div>
    <p class="text-sm mb-2" style="color: var(--color-typo-heading)">Card Photo</p>
    <AttachmentPreview :record="record" attachment-field="card_image"
      :attachment-name="record.card_name" :token="token" />
  </div>
</div>

<!-- Scan overlay — Teleport to body escapes Dialog z-index stacking context -->
<Teleport to="body">
  <div v-if="showScanOverlay" class="fixed inset-0 flex flex-col items-center justify-center"
       style="z-index: 9999; background: #ffffff; filter: brightness(1.4);"
       role="dialog" aria-modal="true" aria-label="Barcode scan view">
    <button class="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full"
            style="background: rgba(0,0,0,0.08);" @click="closeScanOverlay"
            aria-label="Close scan view">
      <iconify-icon icon="mdi:close" width="24" height="24" style="color: #000000;" aria-hidden="true"></iconify-icon>
    </button>
    <div class="max-w-xs w-full">
      <BarcodeDisplay :barcode_type="record.barcode_type" :barcode_value="record.barcode_value"
        :card_number="record.card_number" />
      <!-- No @scan on overlay BarcodeDisplay — overlay is the scan destination -->
    </div>
  </div>
</Teleport>
```

---

### `src/components/projects/wallecx/MembershipsTab.vue` (component, CRUD read — replacement)

**Analog:** `src/components/projects/wallecx/VaccinationsTab.vue` (lines 1-445) — exact pattern

**Imports pattern** (lines 1-11 of VaccinationsTab.vue — simplified; memberships needs fewer):
```typescript
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Memberships } from '@/types/wallecx/memberships/types'
import MembershipCard from './MembershipCard.vue'
import MembershipDetail from './MembershipDetail.vue'
```
Omit: `useConfirm`, `dayjs`, `onUnmounted`, `ManageVaccination`, `WallecxToolbar` — not needed for Phase 12 read-only tab.

**State refs pattern** (lines 16-20 of VaccinationsTab.vue):
```typescript
const records = ref<Memberships[]>([])
const isLoading = ref(false)
const selectedRecord = ref<Memberships | null>(null)
const showDetail = ref(false)
const fileToken = ref<string>('')
```
Omit: `listToken`, `listTokenTimer`, `showManage`, `manageRecord`, `confirm`, `isExporting`, `showGroupPanel`, `selectedGroup`, `searchQuery`, `sortMode`, `viewMode` — all Phase 13 or vaccinations-specific.

**onMounted fetch pattern** (lines 126-156 of VaccinationsTab.vue — key differences marked):
```typescript
onMounted(async () => {
  isLoading.value = true
  try {
    records.value = await pb
      .collection('wallecx_memberships')           // different collection
      .getFullList<Memberships>({
        sort: '-created',                          // not '-date_administered'
        requestKey: 'memberships-getFullList',     // distinct requestKey — STATE.md MR-5
      })
    // NO listToken fetch here — membership card tiles have no thumbnails
  } catch (e: unknown) {
    toast.error('Failed to load membership cards.')
    console.error('MembershipsTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
// NO onUnmounted — no interval to clear
```

**openDetail function** (lines 171-184 of VaccinationsTab.vue — exact WR-03 pattern):
```typescript
async function openDetail(record: Memberships): Promise<void> {
  selectedRecord.value = record
  if (record.card_image) {               // field: card_image (not record.card)
    try {
      fileToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      toast.error('Failed to load card image. Refresh to try again.')
      console.error('MembershipsTab: getToken failed', e)
      selectedRecord.value = null
      return  // WR-03 abort pattern — do not open dialog token-less
    }
  }
  showDetail.value = true
}
```

**Template structure** (mirrors VaccinationsTab lines 308-443):
```html
<!-- Header row: disabled Add card button (Phase 13 placeholder) -->
<!-- Loading state: v-if="isLoading" → 3× skeleton Card (copy VaccinationsTab lines 340-346, height="8rem") -->
<!-- Empty state: v-else-if="records.length === 0" → icon + text + disabled button (copy lines 349-363) -->
<!-- Data state: v-else → grid grid-cols-1 sm:grid-cols-2 gap-4 + MembershipCard v-for (copy lines 388-398) -->
<!-- Dialog: copy lines 428-442 exactly — change header to "Membership Card", slot to MembershipDetail -->
```

**Dialog pattern** (lines 428-442 of VaccinationsTab.vue — copy exactly with header change):
```html
<Dialog
  v-model:visible="showDetail"
  modal
  header="Membership Card"
  :style="{ width: '40rem' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  @hide="selectedRecord = null; fileToken = ''"
>
  <MembershipDetail
    v-if="selectedRecord"
    :record="selectedRecord"
    :token="fileToken"
  />
</Dialog>
```

---

### `src/components/projects/wallecx/AttachmentPreview.vue` (component — refactor)

**Analog:** self (lines 1-103) — refactor to accept generic props

**Current props** (lines 13-16):
```typescript
const props = defineProps<{
  record: Vaccinations;
  token: string;
}>()
```

**Target props after refactor (Option A from RESEARCH.md):**
```typescript
const props = defineProps<{
  record: RecordModel           // generic — import from 'pocketbase'
  attachmentField: string       // 'card' for vaccinations, 'card_image' for memberships
  attachmentName: string        // alt text source: record.vaccine_name or record.card_name
  token: string
}>()
```

**Fields to change in the script block:**

Current line 33:
```typescript
const mimeCategory = computed(() => getMimeCategory(props.record.card))
```
Becomes:
```typescript
const mimeCategory = computed(() =>
  getMimeCategory((props.record as Record<string, string>)[props.attachmentField] ?? '')
)
```

Current lines 35-44 (`tokenUrl` and `thumbUrl`):
```typescript
const tokenUrl = computed(() =>
  pb.files.getURL(props.record, (props.record as Record<string, string>)[props.attachmentField], { token: props.token })
)
const thumbUrl = computed(() =>
  pb.files.getURL(props.record, (props.record as Record<string, string>)[props.attachmentField], { thumb: '400x400', token: props.token })
)
```

**Fields to change in the template:**

Current line 52: `<div v-if="record.card">`
Becomes: `<div v-if="(record as Record<string, string>)[attachmentField]">`

Current line 56 (img alt): `alt="\`${record.vaccine_name} vaccination card\`"`
Becomes: `:alt="attachmentName"`

**VaccinationDetail call site update** (VaccinationDetail.vue line 55):
```html
<!-- Before -->
<AttachmentPreview :record="record" :token="token" />

<!-- After -->
<AttachmentPreview :record="record" attachment-field="card" :attachment-name="record.vaccine_name" :token="token" />
```

**Required import addition** to AttachmentPreview.vue line 4:
```typescript
import type { RecordModel } from 'pocketbase'
```
Remove: `import type { Vaccinations } from "@/types/wallecx/vaccinations/types"`

---

## Shared Patterns

### Three-State Loading Template
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 340-398
**Apply to:** `MembershipsTab.vue`

```html
<!-- Loading -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content><Skeleton height="8rem" /></template>
  </Card>
</div>

<!-- Empty (zero records) -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:card-account-details-outline" width="48" height="48"
    style="color: var(--color-brand-primary)" aria-hidden="true"></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No membership cards yet.</p>
  <Button label="Add your first card" icon="pi pi-plus" size="small" :disabled="true" />
</div>

<!-- Data -->
<div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <!-- cards here -->
</div>
```

### Field Label/Value Pair
**Source:** `src/components/projects/wallecx/VaccinationDetail.vue` lines 19-42
**Apply to:** `MembershipDetail.vue` field grid

```html
<div>
  <p class="text-sm" style="color: var(--color-typo-heading)">Label</p>
  <p class="text-sm" style="color: var(--color-typo-body)">{{ value || '—' }}</p>
</div>
```

### PocketBase File Token Fetch (WR-03 Pattern)
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 171-184
**Apply to:** `MembershipsTab.vue` `openDetail` function

Abort pattern: set `selectedRecord.value = null` and `return` on token fetch failure — never open the Dialog in a token-less state when an attachment exists.

### Toast Error
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 150-154
**Apply to:** `MembershipsTab.vue` fetch catch, `openDetail` catch

```typescript
import { toast } from 'vue-sonner'
// ...
toast.error('Failed to load membership cards.')
```

### PrimeVue Dialog Sizing
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 428-442
**Apply to:** `MembershipsTab.vue` Dialog wrapper

```html
<Dialog v-model:visible="showDetail" modal header="..." :style="{ width: '40rem' }"
        :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
        @hide="selectedRecord = null; fileToken = ''">
```

### PrimeVue Card Tile Click
**Source:** `src/components/projects/wallecx/VaccinationGroupCard.vue` lines 27-32
**Apply to:** `MembershipCard.vue`

```html
<Card class="cursor-pointer hover:shadow-md transition-shadow" @click="emit('click')">
```

### Notes Field with whitespace-pre-wrap
**Source:** `src/components/projects/wallecx/VaccinationDetail.vue` lines 46-49
**Apply to:** `MembershipDetail.vue` notes section

```html
<div v-if="record.notes">
  <p class="text-sm" style="color: var(--color-typo-heading)">Notes</p>
  <p class="text-sm whitespace-pre-wrap" style="color: var(--color-typo-body)">{{ record.notes }}</p>
</div>
```

### iconify-icon Empty State
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 349-356
**Apply to:** `MembershipsTab.vue` empty state; `BarcodeDisplay.vue` Branch D

```html
<iconify-icon icon="mdi:..." width="48" height="48"
  style="color: var(--color-brand-primary)" aria-hidden="true"></iconify-icon>
```

### dayjs Date Formatting
**Source:** `src/components/projects/wallecx/VaccinationGroupCard.vue` line 22 (compact) and `VaccinationDetail.vue` line 11 (verbose)
**Apply to:** `MembershipCard.vue` (compact `'DD MMM YYYY'`) and `MembershipDetail.vue` (verbose `'DD MMMM YYYY'`)

```typescript
import dayjs from 'dayjs'
dayjs(iso).format('DD MMM YYYY')     // tile: "15 Jan 2027"
dayjs(iso).format('DD MMMM YYYY')   // detail: "15 January 2027"
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `BarcodeDisplay.vue` — scan overlay within it | component | event-driven | No existing scan overlay or WakeLock pattern in codebase; patterns come from RESEARCH.md Pattern 3 + STATE.md FS-1/FS-2 |
| `BarcodeDisplay.vue` — JsBarcode imperative SVG | component | transform | No existing imperative third-party SVG render in codebase; JsBarcode API pattern from RESEARCH.md Pattern 1 |
| `BarcodeDisplay.vue` — QrcodeVue component | component | transform | No existing QR rendering in codebase; API from RESEARCH.md Pattern 2 and verified `node_modules/qrcode.vue/dist/index.d.ts` |

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/` — all 5 existing Wallecx components read in full
**Files scanned:** VaccinationsTab.vue (446 lines), AttachmentPreview.vue (103 lines), VaccinationDetail.vue (57 lines), VaccinationGroupCard.vue (63 lines), WallecxApp.vue (38 lines), MembershipsTab.vue stub (19 lines)
**Types read:** `src/types/wallecx/memberships/types.d.ts`
**Pattern extraction date:** 2026-05-13
