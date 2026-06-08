# Phase 13: Write Path — ManageMembership CRUD - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 5 (1 new, 2 extended, 1 new test, 1 existing reference)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/ManageMembership.vue` | component (dialog form) | request-response (CRUD) | `src/components/projects/wallecx/ManageVaccination.vue` | exact |
| `src/components/projects/wallecx/MembershipsTab.vue` | component (tab container) | CRUD | `src/components/projects/wallecx/VaccinationsTab.vue` | exact |
| `src/components/projects/wallecx/MembershipDetail.vue` | component (detail view) | request-response | existing file (extend only) | self |
| `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` | test | transform | `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` | exact |
| `src/lib/pocketbase/membershipMapper.ts` | utility | transform | `src/lib/pocketbase/vaccinationMapper.ts` | exact (already written) |

---

## Pattern Assignments

### `src/components/projects/wallecx/ManageMembership.vue` (new — component, request-response CRUD)

**Analog:** `src/components/projects/wallecx/ManageVaccination.vue`

**CRITICAL DIVERGENCE:** ManageMembership.vue must NOT use `@primevue/forms` or `zodResolver`. ManageVaccination.vue uses `<Form zodResolver>` — this entire pattern is replaced with direct `v-model` refs + manual `schema.safeParse()` per D-07 (PrimeVue issue #8135 makes ColorPicker ignore initial values inside `<Form>`).

**Imports pattern** (ManageVaccination.vue lines 1-11, adapted):
```typescript
import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import imageCompression from 'browser-image-compression'
import { toast } from 'vue-sonner'
import dayjs from 'dayjs'
import { pb } from '@/lib/pocketbase'
import { mapToUpdateMembership } from '@/lib/pocketbase/membershipMapper'
import type { Memberships } from '@/types/wallecx/memberships/types'
```

**Note:** Remove `zodResolver`, `Form`, `FormSubmitEvent` imports. Add `watch` (needed for record watcher and barcode_type watcher). Do NOT import `useConfirm` here — delete lives in MembershipsTab.

**defineModel + emit pattern** (ManageVaccination.vue lines 13-19):
```typescript
const visible = defineModel('visible', { type: Boolean, default: false, required: true })
const record = defineModel<Memberships | null>('record', { default: null })

const emit = defineEmits<{
  created: [record: Memberships]
  updated: [record: Memberships]
}>()
```

**isSaving + pendingFile pattern** (ManageVaccination.vue lines 21-22):
```typescript
const isSaving = ref(false)
const pendingFile = ref<File | null>(null)
```

**isEditMode + dialogHeader pattern** (ManageVaccination.vue lines 24-25):
```typescript
const isEditMode = computed(() => record.value !== null)
const dialogHeader = computed(() => isEditMode.value ? 'Edit Card' : 'Add Card')
```

**Direct v-model refs (replaces initialValues computed in ManageVaccination.vue lines 27-39):**
This pattern has NO analog in the existing codebase — it is a new pattern introduced by D-07. Use RESEARCH.md Pattern 1 as the source:
```typescript
const cardName = ref<string>('')
const barcodeType = ref<string | null>(null)
const barcodeValue = ref<string>('')
const cardNumber = ref<string>('')
const cardColor = ref<string>('002244')   // D-01: navy default, no #
const expiryDate = ref<Date | null>(null)
const issuer = ref<string>('')
const notes = ref<string>('')

// Error refs — one per field with possible validation failure
const cardNameError = ref<string>('')
const cardColorError = ref<string>('')

// Initialize refs when record prop changes (replaces initialValues computed)
watch(() => record.value, (rec) => {
  if (rec) {
    cardName.value = rec.card_name
    barcodeType.value = rec.barcode_type ?? null
    barcodeValue.value = rec.barcode_value ?? ''
    cardNumber.value = rec.card_number ?? ''
    cardColor.value = rec.card_color ?? '002244'
    expiryDate.value = rec.expiry_date ? new Date(rec.expiry_date) : null
    issuer.value = rec.issuer ?? ''
    notes.value = rec.notes ?? ''
  } else {
    cardName.value = ''
    barcodeType.value = null
    barcodeValue.value = ''
    cardNumber.value = ''
    cardColor.value = '002244'
    expiryDate.value = null
    issuer.value = ''
    notes.value = ''
  }
}, { immediate: true })
```

**Zod schema (replaces ManageVaccination.vue lines 41-55 — no `resolver = zodResolver(schema)` line):**
```typescript
const schema = z.object({
  card_name: z.string().min(1, { message: 'Card name is required.' }),
  card_color: z.string().regex(/^[0-9a-fA-F]{6}$/, {
    message: 'Must be a valid 6-character hex colour.',
  }).optional(),
  barcode_value: z.string().optional(),
  barcode_type: z.string().optional().nullable(),
  card_number: z.string().optional(),
  expiry_date: z.union([z.date(), z.string()]).optional().nullable(),
  issuer: z.string().optional(),
  notes: z.string().optional(),
})
// NO resolver line — schema.safeParse() called manually in onSubmit
```

**barcode_type watcher (D-02 — no analog in codebase):**
```typescript
watch(barcodeType, (newType) => {
  if (newType === 'number') {
    barcodeValue.value = ''
  }
})
```

**BARCODE_TYPE_OPTIONS constant:**
```typescript
const BARCODE_TYPE_OPTIONS = [
  { label: 'QR Code',     value: 'qr'      },
  { label: 'Code 128',    value: 'code128' },
  { label: 'EAN-13',      value: 'ean13'   },
  { label: 'Code 39',     value: 'code39'  },
  { label: 'Number only', value: 'number'  },
] as const
```

**thumbnail computed (D-03 — no analog in codebase):**
```typescript
// Token prop passed from MembershipsTab (fileToken already populated when edit is triggered)
const props = defineProps<{
  token?: string
}>()

const thumbnailUrl = computed(() =>
  isEditMode.value && record.value?.card_image
    ? pb.files.getURL(record.value, record.value.card_image, { thumb: '100x100', token: props.token })
    : null
)
```

**onFileSelect pattern** (ManageVaccination.vue lines 58-124, adapted — PDF branch removed):
```typescript
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return

  const allowed = ['image/jpeg', 'image/png', 'image/webp']   // no PDF — Phase 11 D-02
  if (!allowed.includes(file.type)) {
    toast.error('File type not supported. Use JPEG, PNG, or WebP.')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('File too large. Maximum size is 10 MB.')
    return
  }

  // EXIF strip via canvas re-encode (same pattern as ManageVaccination.vue lines 79-123)
  try {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = objectUrl
    })
    URL.revokeObjectURL(objectUrl)

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    const strippedBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))),
        'image/jpeg',
        0.92,
      ),
    )

    const strippedFile = new File(
      [strippedBlob],
      file.name.replace(/\.[^.]+$/, '.jpg'),
      { type: 'image/jpeg' },
    )

    const compressed = await imageCompression(strippedFile, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    })

    pendingFile.value = compressed
    toast.info('Location data removed.')
  } catch (e) {
    toast.error('Failed to process image. Please try again.')
    console.error('ManageMembership: EXIF strip failed', e)
    pendingFile.value = null
  }
}
```

**onSubmit pattern** (ManageVaccination.vue lines 126-182, adapted — `{ valid, values }` replaced by manual safeParse):
```typescript
async function onSubmit(): Promise<void> {
  // Reset field errors
  cardNameError.value = ''
  cardColorError.value = ''

  const result = schema.safeParse({
    card_name: cardName.value,
    card_color: cardColor.value || undefined,
    barcode_value: barcodeValue.value || undefined,
    barcode_type: barcodeType.value,
    card_number: cardNumber.value || undefined,
    expiry_date: expiryDate.value,
    issuer: issuer.value || undefined,
    notes: notes.value || undefined,
  })

  if (!result.success) {
    // Zod 4: use flatten().fieldErrors for per-field messages
    const fieldErrors = result.error.flatten().fieldErrors
    cardNameError.value = fieldErrors.card_name?.[0] ?? ''
    cardColorError.value = fieldErrors.card_color?.[0] ?? ''
    return
  }

  isSaving.value = true
  try {
    const formData = new FormData()
    formData.append('card_name', cardName.value)
    if (barcodeType.value) formData.append('barcode_type', barcodeType.value)
    // D-02: only append barcode_value when type is not 'number'
    if (barcodeType.value !== 'number' && barcodeValue.value)
      formData.append('barcode_value', barcodeValue.value)
    if (cardNumber.value) formData.append('card_number', cardNumber.value)
    formData.append('card_color', cardColor.value)
    if (expiryDate.value)
      formData.append('expiry_date', dayjs(expiryDate.value).format('YYYY-MM-DD'))
    if (issuer.value) formData.append('issuer', issuer.value)
    if (notes.value) formData.append('notes', notes.value)
    // D-03: only append card_image when a new file was selected
    if (pendingFile.value) formData.append('card_image', pendingFile.value)

    if (!isEditMode.value) {
      // CREATE — D-09: Object.assign contract; HIGH-01: null guard
      const userId = pb.authStore.record?.id
      if (!userId) {
        toast.error('Session expired. Please log in again.')
        isSaving.value = false
        return
      }
      formData.append('user', userId)
      const created = await pb.collection('wallecx_memberships').create<Memberships>(formData)
      emit('created', created)
    } else {
      // UPDATE — D-10: mapper reference documents canonical writable field set
      void mapToUpdateMembership   // confirms writable fields; FormData mirrors them
      const updated = await pb
        .collection('wallecx_memberships')
        .update<Memberships>(record.value!.id, formData)
      emit('updated', updated)
    }

    toast.success(isEditMode.value ? 'Card updated.' : 'Card added.')
    pendingFile.value = null   // HIGH-02: explicit reset before close
    visible.value = false
  } catch (e: unknown) {
    toast.error('Failed to save. Please try again.')
    console.error('ManageMembership: save failed', e)
  } finally {
    isSaving.value = false
  }
}

function onHide(): void {
  pendingFile.value = null   // HIGH-02: also reset on ESC / programmatic close
}
```

**Template — Dialog shell** (ManageVaccination.vue lines 190-198):
```html
<Dialog
  modal
  v-model:visible="visible"
  :header="dialogHeader"
  :style="{ width: '40vw' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  :closable="!isSaving"
  @hide="onHide"
>
```

**Template — form body structure** (ManageVaccination.vue lines 199-296, adapted):
Replace `<Form v-slot="$form" :initialValues :resolver @submit validate-on-submit>` with a plain `<form @submit.prevent="onSubmit" class="space-y-4">`. Each field uses direct `v-model` instead of `name` prop. Error display uses `v-if="cardNameError"` on the `ref` instead of `$form.field_name?.invalid`.

```html
<!-- Field wrapper pattern — same for all fields (ManageVaccination.vue lines 208-218) -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Card Name *</label>
  <InputText v-model="cardName" fluid :disabled="isSaving" />
  <Message v-if="cardNameError" severity="error" size="small" variant="simple">
    {{ cardNameError }}
  </Message>
</div>

<!-- barcode_type Select -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Type</label>
  <Select
    v-model="barcodeType"
    :options="BARCODE_TYPE_OPTIONS"
    option-label="label"
    option-value="value"
    fluid
    :disabled="isSaving"
  />
</div>

<!-- barcode_value — conditional per D-02 -->
<div v-if="barcodeType !== 'number'" class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Value</label>
  <InputText v-model="barcodeValue" fluid :disabled="isSaving" />
</div>

<!-- card_color ColorPicker with live swatch — D-01/D-03 -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Card Colour</label>
  <div class="flex items-center gap-3">
    <ColorPicker v-model="cardColor" aria-label="Card colour picker" :disabled="isSaving" />
    <span
      class="inline-block w-8 h-8 rounded"
      :style="{ backgroundColor: '#' + cardColor }"
      aria-hidden="true"
    ></span>
  </div>
  <Message v-if="cardColorError" severity="error" size="small" variant="simple">
    {{ cardColorError }}
  </Message>
</div>

<!-- expiry_date DatePicker — same format as date_administered in ManageVaccination.vue line 233 -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Expiry Date</label>
  <DatePicker v-model="expiryDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
</div>

<!-- card_image FileUpload with edit-mode thumbnail — D-03 -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Card Image</label>
  <div v-if="thumbnailUrl" class="flex flex-col gap-1 mb-1">
    <img :src="thumbnailUrl" class="w-24 h-24 object-cover rounded" alt="Current card image" />
    <p class="text-sm" style="color: var(--color-typo-muted)">
      Current image — select a new file to replace it
    </p>
  </div>
  <FileUpload
    mode="basic"
    :auto="false"
    accept="image/jpeg,image/png,image/webp"
    :maxFileSize="10485760"
    :disabled="isSaving"
    :chooseLabel="isEditMode && record?.card_image ? 'Replace image' : undefined"
    @select="onFileSelect"
  />
  <p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
    {{ pendingFile.name }} selected
  </p>
</div>

<!-- Submit button (ManageVaccination.vue lines 289-296) -->
<Button
  type="submit"
  :label="isEditMode ? 'Save Changes' : 'Add Card'"
  :loading="isSaving"
  :disabled="isSaving"
  fluid
/>
```

---

### `src/components/projects/wallecx/MembershipsTab.vue` (extend — component, CRUD)

**Analog:** `src/components/projects/wallecx/VaccinationsTab.vue`

**Current state:** The file already has `records`, `isLoading`, `selectedRecord`, `showDetail`, `fileToken`, `onMounted`, `openDetail`. The write state additions are surgical.

**New imports to add** (based on VaccinationsTab.vue lines 5, 8):
```typescript
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import ManageMembership from './ManageMembership.vue'
```

**New state refs to add** (VaccinationsTab.vue lines 22-24):
```typescript
const showManage = ref<boolean>(false)
const manageRecord = ref<Memberships | null>(null)
const confirm = useConfirm()
```

**openEdit handler** (D-05 — close detail, set record, open manage):
```typescript
function openEdit(record: Memberships): void {
  manageRecord.value = record
  showDetail.value = false      // close detail first
  showManage.value = true       // then open manage dialog
}
```

**openManage handler** (VaccinationsTab.vue lines 186-189 — for "Add card" buttons):
```typescript
function openManage(record: Memberships | null): void {
  manageRecord.value = record
  showManage.value = true
}
```

**openDelete handler** (VaccinationsTab.vue lines 272-283):
```typescript
function openDelete(record: Memberships): void {
  confirm.require({
    message: `Delete "${record.card_name}"? This cannot be undone.`,   // D-11: plain text
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Keep Card', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => deleteCard(record),
  })
}
```

**deleteCard handler** (VaccinationsTab.vue lines 285-305, adapted — no group panel sync):
```typescript
async function deleteCard(record: Memberships): Promise<void> {
  try {
    await pb.collection('wallecx_memberships').delete(record.id)   // server-first
    const idx = records.value.findIndex((r) => r.id === record.id)
    if (idx !== -1) records.value.splice(idx, 1)
    showDetail.value = false   // close detail after successful delete
    toast.success('Card deleted.')
  } catch (e: unknown) {
    toast.error('Failed to delete. Please try again.')
    console.error('MembershipsTab: delete failed', e)
  }
}
```

**onCreated handler** (VaccinationsTab.vue lines 248-253, adapted — no date sort needed):
```typescript
function onCreated(created: Memberships): void {
  records.value.unshift(created)   // prepend — sort: '-created' = newest first
}
```

**onUpdated handler** (VaccinationsTab.vue lines 256-269, adapted — no group panel sync):
```typescript
function onUpdated(updatedRecord: Memberships): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id)
  if (idx !== -1) records.value[idx] = updatedRecord
}
```

**Template changes — enable "Add card" buttons** (MembershipsTab.vue lines 53-58 and 88-91):
```html
<!-- Header button: remove :disabled="true", add @click -->
<Button
  label="Add card"
  icon="pi pi-plus"
  size="small"
  @click="openManage(null)"
/>

<!-- Empty state button: remove :disabled="true", add @click -->
<Button
  label="Add your first card"
  icon="pi pi-plus"
  size="small"
  @click="openManage(null)"
/>
```

**Template changes — wire MembershipDetail emits** (MembershipsTab.vue lines 112-116):
```html
<MembershipDetail
  v-if="selectedRecord"
  :record="selectedRecord"
  :token="fileToken"
  @edit="openEdit(selectedRecord!)"
  @delete="openDelete(selectedRecord!)"
/>
```

**Template additions — ManageMembership dialog** (VaccinationsTab.vue lines 419-425):
```html
<ManageMembership
  v-model:visible="showManage"
  v-model:record="manageRecord"
  :token="fileToken"
  @created="onCreated"
  @updated="onUpdated"
/>
```

**ConfirmDialog:** D-06 confirmed — `<ConfirmDialog />` already exists in `WallecxApp.vue` line 33 (app shell level). Do NOT add another `<ConfirmDialog>` tag to MembershipsTab.vue. Only `useConfirm` composable is needed here.

---

### `src/components/projects/wallecx/MembershipDetail.vue` (extend — component, presentational)

**Current state:** Lines 1-66 are the full `<script setup>`. No `emit` is defined yet. The component is purely presentational.

**Additions to `<script setup>`:**
```typescript
// Add defineEmits — MembershipsTab.vue wires @edit and @delete
const emit = defineEmits<{
  edit: []
  delete: []
}>()
```

**Template addition — Edit/Delete buttons at bottom of content div** (inside the `<div class="flex flex-col gap-4">` after the last `<Divider />`):
```html
<!-- Edit / Delete action row (D-04: emits to MembershipsTab) -->
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
```

**Placement:** After the last `<Divider />` block (MembershipDetail.vue line 137), before the closing `</div>` of the root flex container (line 139). The scan overlay `<Teleport>` at line 142 is outside this container and is unaffected.

---

### `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` (new — test, transform)

**Analog:** `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` (lines 1-84)

**Imports pattern** (vaccinationMapper.spec.ts lines 1-3):
```typescript
import { describe, it, expect } from 'vitest'
import { mapToUpdateMembership } from '@/lib/pocketbase/membershipMapper'
import type { Memberships } from '@/types/wallecx/memberships/types'
```

**Factory function pattern** (vaccinationMapper.spec.ts lines 5-23):
```typescript
const makeMembership = (overrides: Partial<Memberships> = {}): Memberships => ({
  id: 'server-id-123',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-02T00:00:00.000Z',
  collectionId: 'def',
  collectionName: 'wallecx_memberships',
  user: 'user-id-456',
  card_name: 'Woolworths Rewards',
  issuer: 'Woolworths',
  barcode_value: '9300675024861',
  barcode_type: 'ean13',
  card_number: '6002 3456 7890',
  expiry_date: '2027-12-31',
  notes: 'Gold tier',
  card_color: '00aa44',
  card_image: 'card.jpg',
  expand: {},
  ...overrides,
})
```

**Field-strip test** (vaccinationMapper.spec.ts lines 25-35):
```typescript
describe('mapToUpdateMembership strips server-managed fields', () => {
  const payload = mapToUpdateMembership(makeMembership())

  it('strips id, created, updated, user, card_image', () => {
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('created')
    expect(payload).not.toHaveProperty('updated')
    expect(payload).not.toHaveProperty('user')
    expect(payload).not.toHaveProperty('card_image')
  })
})
```

**Preserves writable fields tests** (vaccinationMapper.spec.ts lines 37-74 structure):
```typescript
describe('mapToUpdateMembership preserves writable fields', () => {
  const payload = mapToUpdateMembership(makeMembership())

  it('preserves card_name', () => expect(payload.card_name).toBe('Woolworths Rewards'))
  it('preserves issuer', () => expect(payload.issuer).toBe('Woolworths'))
  it('preserves barcode_value', () => expect(payload.barcode_value).toBe('9300675024861'))
  it('preserves barcode_type', () => expect(payload.barcode_type).toBe('ean13'))
  it('preserves card_number', () => expect(payload.card_number).toBe('6002 3456 7890'))
  it('preserves expiry_date', () => expect(payload.expiry_date).toBe('2027-12-31'))
  it('preserves notes', () => expect(payload.notes).toBe('Gold tier'))
  it('preserves card_color', () => expect(payload.card_color).toBe('00aa44'))

  it('preserves optional fields as undefined when absent', () => {
    const minimal = makeMembership({ issuer: undefined, barcode_value: undefined, card_color: undefined })
    const minimalPayload = mapToUpdateMembership(minimal)
    expect(minimalPayload.issuer).toBeUndefined()
    expect(minimalPayload.barcode_value).toBeUndefined()
    expect(minimalPayload.card_color).toBeUndefined()
  })
})
```

**id-refresh contract test** (vaccinationMapper.spec.ts lines 76-83):
```typescript
describe('create-then-update id-refresh contract', () => {
  it('Object.assign propagates server id so second save PATCHes the same record', () => {
    const localItem = { card_name: 'ALDI', id: '' }
    const serverRecord = makeMembership({ id: 'server-id-789' })
    Object.assign(localItem, serverRecord)
    expect(localItem.id).toBe('server-id-789')
    expect(localItem.id).not.toBe('')
  })
})
```

---

### `src/lib/pocketbase/membershipMapper.ts` (already written — reference only)

**No changes needed.** Written in Phase 11. Full content for reference:

```typescript
// src/lib/pocketbase/membershipMapper.ts (lines 1-23)
import type { Memberships } from '@/types/wallecx/memberships/types'

export function mapToUpdateMembership(record: Memberships): {
  card_name: string;
  issuer?: string;
  barcode_value?: string;
  barcode_type?: string;
  card_number?: string;
  expiry_date?: string;
  notes?: string;
  card_color?: string;
} {
  return {
    card_name: record.card_name,
    issuer: record.issuer,
    barcode_value: record.barcode_value,
    barcode_type: record.barcode_type,
    card_number: record.card_number,
    expiry_date: record.expiry_date,
    notes: record.notes,
    card_color: record.card_color,
  }
}
```

Strips: `id`, `created`, `updated`, `user`, `card_image` (server-managed fields).
Preserves: `card_name`, `issuer`, `barcode_value`, `barcode_type`, `card_number`, `expiry_date`, `notes`, `card_color`.

---

## Shared Patterns

### isSaving Double-Submit Guard
**Source:** `src/components/projects/wallecx/ManageVaccination.vue` lines 21, 128, 167-169, 178-181
**Apply to:** ManageMembership.vue (onSubmit; Dialog `:closable`; all form field `:disabled`; Button `:loading` + `:disabled`)
```typescript
const isSaving = ref(false)
// Set true at start of try block, false in finally
// Dialog: :closable="!isSaving"
// Button: :loading="isSaving" :disabled="isSaving"
// All inputs: :disabled="isSaving"
```

### Auth Null Guard on Create (HIGH-01)
**Source:** `src/components/projects/wallecx/ManageVaccination.vue` lines 150-155
**Apply to:** ManageMembership.vue onSubmit create branch
```typescript
const userId = pb.authStore.record?.id
if (!userId) {
  toast.error('Session expired. Please log in again.')
  isSaving.value = false
  return
}
```

### pendingFile Double-Reset (HIGH-02)
**Source:** `src/components/projects/wallecx/ManageVaccination.vue` lines 174, 184-186
**Apply to:** ManageMembership.vue — reset in BOTH success branch AND onHide()
```typescript
// In success branch (before visible.value = false):
pendingFile.value = null

// In onHide():
function onHide(): void {
  pendingFile.value = null
}
```

### Server-First Delete
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 285-305
**Apply to:** MembershipsTab.vue deleteCard — `await pb.delete()` BEFORE `records.value.splice()`
```typescript
await pb.collection('wallecx_memberships').delete(record.id)  // server first
const idx = records.value.findIndex((r) => r.id === record.id)
if (idx !== -1) records.value.splice(idx, 1)                   // local splice only on success
```

### Error Handling Pattern
**Source:** `src/components/projects/wallecx/ManageVaccination.vue` lines 176-181 and `VaccinationsTab.vue` lines 300-304
**Apply to:** All async functions in ManageMembership.vue and MembershipsTab.vue
```typescript
} catch (e: unknown) {
  toast.error('Failed to save. Please try again.')
  console.error('ManageMembership: save failed', e)
} finally {
  isSaving.value = false
}
```

### Field-Label Typography
**Source:** `src/components/projects/wallecx/ManageVaccination.vue` lines 209, 222, 231, etc.
**Apply to:** All form field labels in ManageMembership.vue
```html
<label class="text-sm" style="color: var(--color-typo-heading)">Field Label</label>
```

### Validation Error Display
**Source:** `src/components/projects/wallecx/ManageVaccination.vue` lines 216-218
**Apply to:** Required fields in ManageMembership.vue (card_name, card_color if invalid format)
```html
<Message v-if="fieldError" severity="error" size="small" variant="simple">
  {{ fieldError }}
</Message>
```

### card_color Hex Display Binding
**Source:** `src/components/projects/wallecx/MembershipDetail.vue` lines 96-104
**Apply to:** ColorPicker swatch in ManageMembership.vue; any other card_color display
```html
<!-- Store as 6-char hex without #; display always prepends # -->
:style="{ backgroundColor: '#' + cardColor }"
```

### useConfirm Explicit Import
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` line 5
**Apply to:** MembershipsTab.vue — composable is NOT auto-resolved by PrimeVueResolver
```typescript
import { useConfirm } from 'primevue/useconfirm'
const confirm = useConfirm()
```
**Note:** Do NOT add `<ConfirmDialog />` tag — already in `WallecxApp.vue` line 33 at app shell level. Adding a second instance causes double-confirm rendering.

---

## No Analog Found

All files have direct analogs. No files require fallback to RESEARCH.md patterns exclusively.

| File | Note |
|------|------|
| Direct `v-model` form refs (inside ManageMembership.vue) | New pattern for this codebase — no analog. Use RESEARCH.md Pattern 1 verbatim. The `initialValues` computed in ManageVaccination.vue is the closest structural reference but the mechanism differs entirely. |
| `barcode_type` watcher clearing `barcode_value` | No analog. Use RESEARCH.md Pattern 3 verbatim. |
| Edit-mode thumbnail via `pb.files.getURL` | No analog in form dialogs. MembershipDetail.vue uses `AttachmentPreview` (full component). ManageMembership.vue uses a direct `<img>` tag with computed `thumbnailUrl`. Pattern sourced from D-03 and RESEARCH.md Pattern 5. |

---

## Metadata

**Analog search scope:**
- `src/components/projects/wallecx/` — all Vue files
- `src/lib/pocketbase/__tests__/` — all spec files
- `src/lib/pocketbase/` — mapper utilities
- `src/types/wallecx/memberships/` — type definitions

**Files read:** 7 source files + 3 planning documents
**Pattern extraction date:** 2026-05-14

**Key analogy summary:**
- ManageMembership.vue ← ManageVaccination.vue (structural copy; replace `<Form zodResolver>` with direct refs + safeParse; remove PDF branch; add ColorPicker, barcode_type Select, thumbnail)
- MembershipsTab.vue ← VaccinationsTab.vue (surgical additions: showManage, manageRecord, useConfirm, openEdit, openDelete, onCreated, onUpdated, deleteCard; no group panel logic needed)
- MembershipDetail.vue ← self (add defineEmits + two Button elements at bottom of content)
- membershipMapper.spec.ts ← vaccinationMapper.spec.ts (direct structural mirror; replace vaccine fields with membership fields)
