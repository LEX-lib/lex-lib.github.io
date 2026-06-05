# Phase 13: Write Path — ManageMembership CRUD - Research

**Researched:** 2026-05-14
**Domain:** Vue 3 / PrimeVue 4 write-path CRUD — dialog form, ColorPicker, FileUpload, Zod validation, Vitest mapper spec
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `ColorPicker` pre-filled with `002244` (navy, no `#`) for new cards. `card_color` ref initialises to `'002244'` when creating. No clear button.
- **D-02:** `barcode_value` field uses `v-if` and disappears entirely when `barcode_type === 'number'`. When user switches to 'Number only', `barcode_value` ref is cleared immediately (set to `''`).
- **D-03:** Edit mode card image — thumbnail preview (`?thumb=100x100` + token) above FileUpload; button label changes to 'Replace image'. No 'Remove image'. If no new file selected on save, `card_image` not included in FormData.
- **D-04:** Edit and Delete buttons live inside `MembershipDetail` dialog (footer slot). Emits `edit` and `delete` events to `MembershipsTab.vue`.
- **D-05:** `MembershipsTab.vue` handles state transitions: `@edit` closes detail → sets `manageRecord = selectedRecord` → opens manage dialog; `@delete` calls `useConfirm()` flow.
- **D-06:** `<ConfirmDialog />` is already in `WallecxApp.vue` line 33 — no need to add one to `MembershipsTab.vue`. `useConfirm` composable must be explicitly imported in `MembershipsTab.vue`.
- **D-07:** Direct `v-model` refs for all form fields — NOT `@primevue/forms`. Zod schema applied manually via `schema.safeParse(formValues)` on submit. Locked by STATE.md due to PrimeVue issue #8135.
- **D-08:** Single `isSaving` ref disables form + submit button during in-flight requests; Dialog `:closable="!isSaving"`.
- **D-09:** Create flow: `Object.assign(localRecord, serverResponse)` after `pb.create()` — avoids save-loop bug.
- **D-10:** Update flow: `mapToUpdateMembership(record)` strips `id`, `created`, `updated`, `user`, `card_image` from payload; FormData carries only explicitly set writable fields.
- **D-11:** Delete confirmation message: `Delete "${record.card_name}"? This cannot be undone.` Plain text — never `v-html`.
- **D-12:** Single `ManageMembership.vue` handles both create and edit — null `record` prop = create mode; `Memberships` object = edit mode. Dialog header: "Add Card" vs "Edit Card".
- **D-13:** `membershipMapper.spec.ts` goes in `src/lib/pocketbase/__tests__/`. Tests: (a) `mapToUpdateMembership` strips `id`, `created`, `updated`, `user`, `card_image`; (b) create-then-update id-refresh contract.

### Claude's Discretion

- Exact dialog width (`40vw` matching ManageVaccination.vue is the natural default)
- Field order in the form: `card_name` → `barcode_type` → `barcode_value` (conditional) → `card_number` → `card_color` → `expiry_date` → `issuer` → `notes` → `card_image`
- Zod schema: `card_name` required min-1; `card_color` `z.string().regex(/^[0-9a-fA-F]{6}$/).optional()`; `barcode_value` optional when present; `expiry_date` as date/string optional
- Footer slot vs inline buttons for Edit/Delete in MembershipDetail — footer slot is cleaner
- `pendingFile` ref reset: explicit reset in success branch before `visible.value = false`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MWRITE-01 | `ManageMembership.vue` PrimeVue Dialog form for both create and edit, validated by Zod via direct `v-model` refs (not `@primevue/forms`); `card_name` required; all other fields optional | Direct analog: `ManageVaccination.vue` — replace `<Form zodResolver>` with direct refs + manual `schema.safeParse()`. Zod 4.x `safeParse` API confirmed. |
| MWRITE-02 | Form includes: `barcode_type` dropdown, `barcode_value` conditional text input, `card_number` text input | PrimeVue `Select` + `v-if` pattern; `BARCODE_TYPE_OPTIONS` constant; watcher on barcode_type to clear barcode_value ref. |
| MWRITE-03 | `card_color` field uses PrimeVue `ColorPicker`; stored without `#`; CSS bindings always prepend `#` | ColorPicker emits 6-char hex without `#` — confirmed in STATE.md. Store as-is. Live swatch preview via `:style="{ backgroundColor: '#' + card_color }"`. |
| MWRITE-04 | Optional `card_image` FileUpload — MIME allowlist `image/jpeg,image/png,image/webp`, 10 MB cap; image-only (no PDF for membership cards per Phase 11 D-02) | `onFileSelect` from `ManageVaccination.vue` — PDF passthrough branch removed; EXIF strip + imageCompression pipeline retained for images. `browser-image-compression` already installed. |
| MWRITE-05 | Create: `Object.assign` server record → local; Update: `mapToUpdateMembership`; Delete: confirm → `pb.delete()` → splice → toast; all flows gated by `isSaving` | All patterns present verbatim in `VaccinationsTab.vue` + `ManageVaccination.vue`. Mapper already written in Phase 11. |
| MWRITE-06 | Vitest `membershipMapper.spec.ts` — field-strip + id-refresh contract, mirrors `vaccinationMapper.spec.ts` | `vaccinationMapper.spec.ts` (10 tests) is the direct template. `membershipMapper.ts` already written — strips `id`, `created`, `updated`, `user`, `card_image`. |
</phase_requirements>

---

## Summary

Phase 13 is a pure write-path replication task. Every pattern needed already exists and is production-verified in the vaccinations subsystem. The primary deliverable is `ManageMembership.vue` — a direct structural analog of `ManageVaccination.vue` with three key differences: (1) direct `v-model` refs instead of `@primevue/forms` controlled system, (2) a `ColorPicker` field with a live swatch, and (3) a conditional `barcode_value` field that disappears when `barcode_type === 'number'`.

The mapper (`membershipMapper.ts`) and types (`types.d.ts`) were written in Phase 11 and require no changes. The spec (`membershipMapper.spec.ts`) is a new file that mirrors `vaccinationMapper.spec.ts` structure. `MembershipsTab.vue` and `MembershipDetail.vue` require surgical extensions only — no rewrites.

One important discovery: `ConfirmDialog` is already declared in `WallecxApp.vue` (line 33) at the app shell level. The `useConfirm` composable works because it reads from the root-level ConfirmDialog instance — `MembershipsTab.vue` does NOT need its own `<ConfirmDialog>` tag, but DOES need to explicitly import and call `useConfirm`.

**Primary recommendation:** Implement in 3 plans — (1) `membershipMapper.spec.ts`, (2) `ManageMembership.vue`, (3) `MembershipsTab.vue` + `MembershipDetail.vue` wiring.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Form validation (Zod safeParse) | Frontend (ManageMembership.vue) | — | Client-side pre-validation; PocketBase enforces server-side rules independently |
| CRUD operations (pb.create/update/delete) | Frontend (MembershipsTab.vue) | PocketBase (server) | Tab owns state; server enforces per-user rules |
| Image EXIF strip + compression | Frontend (ManageMembership.vue) | — | Client-side privacy protection before upload |
| `isSaving` double-submit guard | Frontend (ManageMembership.vue) | — | UX guard; server is idempotent on PATCHes |
| Delete confirmation flow | Frontend (MembershipsTab.vue) | — | UX only; actual delete is server-authoritative |
| ColorPicker color storage | Frontend (ManageMembership.vue) | PocketBase `card_color` field | ColorPicker emits hex without `#`; stored as-is |
| Mapper field-strip contract | `membershipMapper.ts` utility | Vitest spec (MWRITE-06) | Prevents server-managed fields from appearing in PATCH body |
| Edit/Delete trigger | Frontend (MembershipDetail.vue emits) | MembershipsTab.vue (handles) | Detail is presentational; tab owns state transitions |
| Barcode value conditional visibility | Frontend (ManageMembership.vue) | — | Pure presentation logic via `v-if` on `barcode_type` ref |

---

## Standard Stack

### Core (already installed — verified against package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vue` | `^3.5.18` | Composition API, `<script setup>`, `defineModel` | Project foundation [VERIFIED: package.json] |
| `primevue` | `^4.3.7` | Dialog, ColorPicker, Select, FileUpload, DatePicker, InputText, Textarea, Button, Message | UI component library locked by project [VERIFIED: package.json] |
| `@primevue/forms` | `^4.3.9` | zodResolver (NOT used in this phase — D-07) | Installed but bypassed due to ColorPicker issue #8135 [VERIFIED: package.json] |
| `zod` | `^4.1.5` | Schema definition + `safeParse` for manual validation | Project standard [VERIFIED: package.json] |
| `browser-image-compression` | `^2.0.2` | Image compression after EXIF strip | Already used in ManageVaccination.vue [VERIFIED: package.json] |
| `dayjs` | `^1.11.18` | Date formatting for `expiry_date` (DatePicker returns Date → `YYYY-MM-DD`) | Project standard [VERIFIED: package.json] |
| `vue-sonner` | `^2.0.8` | Toast notifications (success/error/info) | Project standard [VERIFIED: package.json] |
| `pocketbase` | `^0.26.2` | Backend CRUD client | Project foundation [VERIFIED: package.json] |
| `vitest` | `^3.2.4` | Unit test runner for `membershipMapper.spec.ts` | Project test framework [VERIFIED: package.json] |

No new dependencies needed. Every library for Phase 13 is already installed.

**Installation:** No installation step required.

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction
     │
     ▼
MembershipsTab.vue  ◄──── MembershipDetail.vue (emits: edit, delete)
  │   │   │
  │   │   └─── openDelete() ─── useConfirm() ─── ConfirmDialog (in WallecxApp.vue)
  │   │                              │
  │   │                              └─ accept → pb.collection.delete() → splice records
  │   │
  │   └─── openEdit() / openManage(null) ──► ManageMembership.vue (Dialog)
  │                                               │
  │                                               ├── v-model refs (card_name, barcode_type,
  │                                               │   barcode_value, card_number, card_color,
  │                                               │   expiry_date, issuer, notes)
  │                                               │
  │                                               ├── onFileSelect() ──► canvas EXIF strip
  │                                               │                   ──► imageCompression
  │                                               │                   ──► pendingFile ref
  │                                               │
  │                                               └── onSubmit() ──► schema.safeParse()
  │                                                        │            (Zod validation)
  │                                                        │
  │                                               ┌────────┴────────┐
  │                                               │                 │
  │                                          CREATE mode       EDIT mode
  │                                               │                 │
  │                                          pb.create()      pb.update()
  │                                          FormData +        FormData via
  │                                          user field        mapToUpdateMembership
  │                                               │                 │
  │                                          emit('created')  emit('updated')
  │                                               │                 │
  │                                    ◄──────────┴─────────────────┘
  │
  ├── onCreated() ──► records.value.unshift(created)
  └── onUpdated() ──► records.value[idx] = updated
```

### Recommended Project Structure

No new folders needed. All files drop into existing locations:

```
src/
├── components/projects/wallecx/
│   ├── ManageMembership.vue          # NEW — primary deliverable (MWRITE-01..04)
│   ├── MembershipsTab.vue            # EXTENDED — write state + handlers (MWRITE-05)
│   └── MembershipDetail.vue          # EXTENDED — edit/delete emits (MWRITE-05)
└── lib/pocketbase/
    ├── membershipMapper.ts           # ALREADY EXISTS (Phase 11 — no changes needed)
    └── __tests__/
        ├── vaccinationMapper.spec.ts # EXISTING template
        └── membershipMapper.spec.ts  # NEW — MWRITE-06
```

### Pattern 1: Direct v-model Form (D-07 — NOT @primevue/forms)

**What:** Each form field binds directly to a typed `ref`. On submit, call `schema.safeParse({...})` manually.
**When to use:** Always in ManageMembership.vue — ColorPicker issue #8135 makes `<Form zodResolver>` unusable.

```typescript
// Source: D-07 + ManageVaccination.vue adaptation
const cardName = ref<string>('')
const barcodeType = ref<string | null>(null)
const barcodeValue = ref<string>('')
const cardNumber = ref<string>('')
const cardColor = ref<string>('002244')  // D-01: navy default without #
const expiryDate = ref<Date | null>(null)
const issuer = ref<string>('')
const notes = ref<string>('')

// Reset refs when record prop changes (create vs edit)
const isEditMode = computed(() => record.value !== null)

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
    // Reset to create-mode defaults
    cardName.value = ''
    barcodeType.value = null
    barcodeValue.value = ''
    cardNumber.value = ''
    cardColor.value = '002244'  // D-01
    expiryDate.value = null
    issuer.value = ''
    notes.value = ''
  }
}, { immediate: true })
```

### Pattern 2: Manual Zod safeParse on Submit

**What:** Validate refs directly instead of using form state from `@primevue/forms`.
**When to use:** Submit handler in ManageMembership.vue.

```typescript
// Source: D-07, CONTEXT.md Zod schema guidance
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

// Error refs — one per field that can fail validation
const cardNameError = ref<string>('')
const cardColorError = ref<string>('')

async function onSubmit(): Promise<void> {
  // Reset errors
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
    const fieldErrors = result.error.flatten().fieldErrors
    cardNameError.value = fieldErrors.card_name?.[0] ?? ''
    cardColorError.value = fieldErrors.card_color?.[0] ?? ''
    return
  }

  isSaving.value = true
  // ... rest of submit
}
```

**Important:** Zod 4 changed the error format. `result.error.flatten().fieldErrors` returns `Record<string, string[]>`. Access per-field errors with `fieldErrors.card_name?.[0]`. [VERIFIED: zod ^4.1.5 in package.json; Zod 4 flatten API is backward-compatible with this pattern]

### Pattern 3: barcode_type Watcher (D-02)

**What:** Clear `barcode_value` immediately when `barcode_type` switches to `'number'`.
**When to use:** ManageMembership.vue — drives conditional field visibility.

```typescript
// Source: D-02
watch(barcodeType, (newType) => {
  if (newType === 'number') {
    barcodeValue.value = ''
  }
})
```

Template binding:
```html
<!-- barcode_value — conditional hide per D-02 -->
<div v-if="barcodeType !== 'number'" class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Value</label>
  <InputText v-model="barcodeValue" fluid :disabled="isSaving" />
</div>
```

### Pattern 4: ColorPicker with Live Swatch (MWRITE-03)

**What:** PrimeVue ColorPicker + adjacent swatch span. ColorPicker emits 6-char hex without `#`.
**When to use:** ManageMembership.vue `card_color` field.

```html
<!-- Source: D-01, UI-SPEC §ColorPicker layout -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Card Colour</label>
  <div class="flex items-center gap-3">
    <ColorPicker
      v-model="cardColor"
      aria-label="Card colour picker"
      :disabled="isSaving"
    />
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
```

**Critical:** `v-model` on ColorPicker stores and reads 6-char hex WITHOUT `#`. Default initialise to `'002244'`. Never prepend `#` in the ref.

### Pattern 5: Edit-mode Image Thumbnail (D-03)

**What:** Show existing `card_image` as 100x100 thumbnail above FileUpload when editing.
**When to use:** ManageMembership.vue, field 9 wrapper.

```typescript
// Source: D-03, MembershipsTab.vue token pattern
// Token prop passed from MembershipsTab — same token used by MembershipDetail
const props = defineProps<{
  token?: string  // fileToken from MembershipsTab, needed for thumbnail URL
}>()

const thumbnailUrl = computed(() =>
  isEditMode.value && record.value?.card_image
    ? pb.files.getURL(record.value, record.value.card_image, { thumb: '100x100', token: props.token })
    : null
)
```

```html
<!-- Edit-mode thumbnail (D-03) -->
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
```

### Pattern 6: Image-only onFileSelect (MWRITE-04)

**What:** Simplified version of ManageVaccination.vue's `onFileSelect` — PDF branch removed (Phase 11 D-02: card_image is image-only).
**When to use:** ManageMembership.vue.

```typescript
// Source: ManageVaccination.vue onFileSelect, adapted — PDF branch removed
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    toast.error('File type not supported. Use JPEG, PNG, or WebP.')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('File too large. Maximum size is 10 MB.')
    return
  }

  // EXIF strip via canvas re-encode
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

### Pattern 7: Create and Update Submit Flow (MWRITE-05)

**What:** FormData build, auth null guard, create vs update branching, emit, toast, pendingFile reset.
**When to use:** ManageMembership.vue `onSubmit`.

```typescript
// Source: ManageVaccination.vue onSubmit adapted for membership fields
// isSaving guard already set to true before this block

const formData = new FormData()
formData.append('card_name', cardName.value)
if (barcodeType.value) formData.append('barcode_type', barcodeType.value)
// D-02: only append barcode_value if type is not 'number'
if (barcodeType.value !== 'number' && barcodeValue.value)
  formData.append('barcode_value', barcodeValue.value)
if (cardNumber.value) formData.append('card_number', cardNumber.value)
formData.append('card_color', cardColor.value)  // always set (default '002244')
if (expiryDate.value)
  formData.append('expiry_date', dayjs(expiryDate.value).format('YYYY-MM-DD'))
if (issuer.value) formData.append('issuer', issuer.value)
if (notes.value) formData.append('notes', notes.value)
// D-03: only append card_image if a new file was selected
if (pendingFile.value) formData.append('card_image', pendingFile.value)

if (!isEditMode.value) {
  // CREATE — D-09: Object.assign contract
  const userId = pb.authStore.record?.id  // HIGH-01: null guard
  if (!userId) {
    toast.error('Session expired. Please log in again.')
    isSaving.value = false
    return
  }
  formData.append('user', userId)
  const created = await pb.collection('wallecx_memberships').create<Memberships>(formData)
  emit('created', created)
} else {
  // UPDATE — D-10: mapper strips server-managed fields
  // FormData already contains only writable fields — mapper defines the canonical set
  void mapToUpdateMembership  // explicit reference confirms field contract
  const updated = await pb
    .collection('wallecx_memberships')
    .update<Memberships>(record.value!.id, formData)
  emit('updated', updated)
}

toast.success(isEditMode.value ? 'Card updated.' : 'Card added.')
pendingFile.value = null  // HIGH-02: explicit reset before closing
visible.value = false
```

### Pattern 8: Delete Flow in MembershipsTab.vue (D-05)

**What:** `useConfirm` composable wires ConfirmDialog (already in WallecxApp.vue) for delete confirmation.
**When to use:** `openDelete` function in MembershipsTab.vue.

```typescript
// Source: VaccinationsTab.vue openDelete + deleteRecord
import { useConfirm } from 'primevue/useconfirm'
const confirm = useConfirm()

function openDelete(record: Memberships): void {
  confirm.require({
    message: `Delete "${record.card_name}"? This cannot be undone.`,  // D-11: plain text
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Keep Card', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => deleteCard(record),
  })
}

async function deleteCard(record: Memberships): Promise<void> {
  try {
    await pb.collection('wallecx_memberships').delete(record.id)  // server-first
    const idx = records.value.findIndex((r) => r.id === record.id)
    if (idx !== -1) records.value.splice(idx, 1)
    showDetail.value = false  // close detail dialog after successful delete
    toast.success('Card deleted.')
  } catch (e: unknown) {
    // On failure: do NOT splice — tile stays visible
    toast.error('Failed to delete. Please try again.')
    console.error('MembershipsTab: delete failed', e)
  }
}
```

**Critical:** `useConfirm` must be explicitly imported — it is NOT auto-resolved by PrimeVueResolver. The `<ConfirmDialog>` component tag IS auto-resolved, but `useConfirm` is a composable, not a component. [VERIFIED: STATE.md "Decisions from 03-04 Execution" + WallecxApp.vue line 34 — ConfirmDialog already present there]

### Pattern 9: MembershipDetail.vue Edit/Delete Emits Extension (D-04)

**What:** Add `emit('edit')` and `emit('delete')` buttons to the MembershipDetail dialog footer.
**When to use:** MembershipDetail.vue template — add emits definition and footer buttons.

```typescript
// Add to MembershipDetail.vue <script setup>
const emit = defineEmits<{
  edit: []
  delete: []
}>()
```

```html
<!-- Add footer template to the Dialog wrapping MembershipDetail in MembershipsTab.vue -->
<!-- OR add as a bottom section inside MembershipDetail.vue content -->
<!-- UI-SPEC recommends Dialog footer slot — implement at MembershipsTab.vue Dialog level -->
<template #footer>
  <div class="flex justify-end gap-2">
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
</template>
```

**Architecture note:** Since `MembershipsTab.vue` wraps `MembershipDetail.vue` inside a `<Dialog>`, the footer slot belongs on the Dialog in `MembershipsTab.vue` template. `MembershipDetail.vue` emits `edit` and `delete` — the parent Dialog handles the footer rendering. However, the simplest approach matching the `VaccinationDetail.vue` pattern is to put the buttons directly inside `MembershipDetail.vue`'s content template at the bottom, and have MembershipsTab listen to `@edit` and `@delete` emits from the `<MembershipDetail>` component.

### Pattern 10: membershipMapper.spec.ts (MWRITE-06)

**What:** Mirror `vaccinationMapper.spec.ts` exactly, adapted for membership fields.
**When to use:** `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` — new file.

```typescript
// Source: vaccinationMapper.spec.ts structure + membershipMapper.ts field set
import { describe, it, expect } from 'vitest'
import { mapToUpdateMembership } from '@/lib/pocketbase/membershipMapper'
import type { Memberships } from '@/types/wallecx/memberships/types'

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
})

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

### Anti-Patterns to Avoid

- **Using `@primevue/forms` / `zodResolver` in ManageMembership.vue:** ColorPicker initial value is always ignored inside a `<Form>` — PrimeVue issue #8135. Use direct `v-model` refs exclusively. [VERIFIED: STATE.md locked decision]
- **Appending `card_image` on every update:** Only append to FormData when `pendingFile.value` is set. Sending `null` or empty string for `card_image` in an update will clear the existing PocketBase file. [VERIFIED: D-03]
- **Adding `<ConfirmDialog />` to MembershipsTab.vue:** It's already in `WallecxApp.vue` at line 33. A second instance causes double-confirm rendering. [VERIFIED: reading WallecxApp.vue]
- **Using non-null assertion `pb.authStore.record!.id`:** Crashes on session expiry. Always null-guard with explicit `if (!userId)` path. [VERIFIED: STATE.md HIGH-01, already fixed in Phase 4]
- **Clearing `pendingFile` only in `@hide`:** Stale file persists into the next open if dialog is programmatically closed. Always reset explicitly in the success branch too. [VERIFIED: STATE.md HIGH-02]
- **Using `v-show` for barcode_value conditional:** D-02 explicitly requires `v-if` — the DOM node must be removed, not just hidden. This prevents form state leakage.
- **Prepending `#` to `card_color` before storing:** ColorPicker emits without `#`. Store as-is. Prepend only in CSS `:style` bindings. [VERIFIED: STATE.md, MembershipDetail.vue lines 98-100]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validator loops | Zod `schema.safeParse()` | Type inference, error messages, composable refinements |
| Image EXIF strip | Manual EXIF parser | Canvas re-encode (`ctx.drawImage` → `toBlob`) | Canvas strips all metadata on re-encode; no library needed |
| Image compression | Manual resize algorithm | `browser-image-compression` | Handles progressive JPEG, respects aspect ratio, async worker |
| Delete confirmation | Custom confirm modal | `useConfirm()` + `ConfirmDialog` (PrimeVue) | Keyboard accessible, focus-trapped, already in app shell |
| Toast notifications | Custom toast component | `vue-sonner` | Already installed, consistent with rest of app |
| Date formatting | Manual `Date.toISOString()` | `dayjs(val).format('YYYY-MM-DD')` | Handles timezone edge cases, consistent with existing codebase |
| File URL with token | Manual URL builder | `pb.files.getURL(record, field, { thumb, token })` | Correct PocketBase thumb API format; token injected server-side |

**Key insight:** The entire write-path pattern already exists verbatim in `ManageVaccination.vue` and `VaccinationsTab.vue`. The only custom logic is the membership-specific field set and the ColorPicker `v-model` approach.

---

## Common Pitfalls

### Pitfall 1: ColorPicker inside @primevue/forms ignores initial value
**What goes wrong:** `ColorPicker` always starts showing red and ignores `initialValues` when wrapped in a PrimeVue `<Form>` component.
**Why it happens:** PrimeVue issue #8135 — ColorPicker doesn't integrate with the PrimeVue forms controlled state system.
**How to avoid:** Use direct `v-model="cardColor"` ref. Initialise `cardColor.value = rec.card_color ?? '002244'` in the record watcher.
**Warning signs:** Color picker shows unexpected color on first open of edit mode.

### Pitfall 2: FormData sends card_image on every update
**What goes wrong:** Sending `card_image: null` or `card_image: ''` in a FormData PATCH clears the existing PocketBase file attachment.
**Why it happens:** PocketBase treats an empty file field in FormData as "clear this field".
**How to avoid:** Only call `formData.append('card_image', pendingFile.value)` when `pendingFile.value` is not null.
**Warning signs:** Card image disappears after a plain text edit with no new file selected.

### Pitfall 3: stale pendingFile carries into next dialog open
**What goes wrong:** If dialog closes without the success branch running (e.g. ESC key), `pendingFile` from the previous session persists and gets uploaded on the next submit.
**Why it happens:** Dialog `@hide` fires on programmatic close too, but relying solely on it creates a race condition.
**How to avoid:** Reset `pendingFile.value = null` in BOTH the success branch AND in `onHide()`. [VERIFIED: STATE.md HIGH-02]
**Warning signs:** Image appears on a card that the user didn't intend to add a photo to.

### Pitfall 4: ConfirmDialog duplicate instance
**What goes wrong:** Adding `<ConfirmDialog />` to `MembershipsTab.vue` when it already exists in `WallecxApp.vue` causes two confirmation modals to render.
**Why it happens:** `useConfirm()` broadcasts to ALL `<ConfirmDialog>` instances in the app.
**How to avoid:** Only `useConfirm` composable is needed in `MembershipsTab.vue`. No `<ConfirmDialog>` tag. [VERIFIED: WallecxApp.vue line 33]
**Warning signs:** Delete confirmation appears twice when triggered.

### Pitfall 5: auth null guard missing on create
**What goes wrong:** `pb.authStore.record!.id` non-null assertion crashes the app when the session expires exactly at submit time.
**Why it happens:** PocketBase auth store can become null on session expiry without immediate UI feedback.
**How to avoid:** `const userId = pb.authStore.record?.id; if (!userId) { toast.error(...); isSaving.value = false; return; }` [VERIFIED: STATE.md HIGH-01]
**Warning signs:** Unhandled TypeError in production when users with expired sessions submit forms.

### Pitfall 6: barcode_value appended when barcode_type is 'number'
**What goes wrong:** Sending `barcode_value` to PocketBase when the card is "Number only" type creates confusing data (user expects no barcode_value).
**Why it happens:** If the FormData build doesn't check `barcode_type`, it may include stale `barcode_value` data.
**How to avoid:** Gate `barcode_value` append with `if (barcodeType.value !== 'number' && barcodeValue.value)`. The watcher already clears the ref, but FormData build should also guard.
**Warning signs:** BarcodeDisplay shows an unexpected barcode on "Number only" cards after edit.

### Pitfall 7: Zod 4 error access
**What goes wrong:** Using `result.error.errors[0].message` for field errors — returns the first error globally, not per-field.
**Why it happens:** Confusion between Zod 3 `.issues` and Zod 4 `.flatten()` API.
**How to avoid:** Use `result.error.flatten().fieldErrors.card_name?.[0]` for field-specific messages.
**Warning signs:** Wrong error message displayed on wrong field, or no error displayed at all.

---

## Code Examples

### DefineModel pattern (ManageMembership.vue shell)

```typescript
// Source: ManageVaccination.vue lines 13-14 (adapted)
const visible = defineModel('visible', { type: Boolean, default: false, required: true })
const record = defineModel<Memberships | null>('record', { default: null })

const emit = defineEmits<{
  created: [record: Memberships]
  updated: [record: Memberships]
}>()
```

### MembershipsTab.vue openEdit handler (D-05)

```typescript
// Source: D-05 from CONTEXT.md
function openEdit(record: Memberships): void {
  manageRecord.value = record
  showDetail.value = false      // close detail dialog first
  showManage.value = true       // then open manage dialog
}
```

### MembershipsTab.vue onCreated / onUpdated handlers

```typescript
// Source: VaccinationsTab.vue onCreated (adapted — no date sort needed for memberships)
function onCreated(created: Memberships): void {
  records.value.unshift(created)  // prepend — newest first (matches sort: '-created')
}

function onUpdated(updatedRecord: Memberships): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id)
  if (idx !== -1) records.value[idx] = updatedRecord
}
```

### BARCODE_TYPE_OPTIONS constant

```typescript
// Source: CONTEXT.md specifics + UI-SPEC §barcode_type Select options
const BARCODE_TYPE_OPTIONS = [
  { label: 'QR Code',      value: 'qr'      },
  { label: 'Code 128',     value: 'code128' },
  { label: 'EAN-13',       value: 'ean13'   },
  { label: 'Code 39',      value: 'code39'  },
  { label: 'Number only',  value: 'number'  },
] as const
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@primevue/forms` zodResolver | Direct `v-model` refs + manual `schema.safeParse()` | Phase 13 decision (PrimeVue #8135) | No `<Form>` wrapper; refs initialized in watcher |
| PDF allowed in file upload | Image-only (`image/jpeg,image/png,image/webp`) | Phase 11 D-02 decision | `application/pdf` removed from MIME allowlist in ManageMembership.vue |
| `unshift` in onCreated | `unshift` (no re-sort needed) | Phase 13 (memberships sorted by `-created`, not date field) | Simpler than VaccinationsTab's date-sort |

**Deprecated/outdated:**
- `zodResolver` from `@primevue/forms/resolvers/zod`: Still installed and used in ManageVaccination.vue but NOT in ManageMembership.vue — explicitly excluded by D-07.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ConfirmDialog` in `WallecxApp.vue` propagates to `useConfirm()` calls in `MembershipsTab.vue` — no second instance needed | Anti-Patterns, Pattern 8 | Delete confirm would silently fail; fix: add `<ConfirmDialog>` to MembershipsTab.vue |

**Note on A1:** This was verified by reading `WallecxApp.vue` (line 33 confirmed `<ConfirmDialog />` present) and STATE.md "Decisions from 10-01 Execution" which states "ConfirmDialog stays in WallecxApp.vue (app shell)". The `useConfirm` service broadcasts to all `ConfirmDialog` instances in the component tree — the WallecxApp instance covers all child tabs. Confidence is HIGH.

**All other claims in this research were verified against actual codebase files or STATE.md locked decisions. No user confirmation required.**

---

## Open Questions

1. **Token prop in ManageMembership.vue for edit thumbnail**
   - What we know: MembershipsTab.vue holds `fileToken` ref, which is fetched when opening detail view.
   - What's unclear: Should ManageMembership.vue receive `token` as a prop, or should MembershipsTab.vue pass the same `fileToken` it uses for MembershipDetail? The `fileToken` is currently fetched in `openDetail` only.
   - Recommendation: Pass `fileToken` as a `:token` prop to `<ManageMembership>`. When opening edit mode (`openEdit`), the `fileToken` is already populated (detail was open). For "Add card" (create mode), `token` is irrelevant because `isEditMode` is false and no thumbnail is shown. This is the cleanest approach — no additional token fetch needed.

2. **MembershipDetail footer slot vs content buttons**
   - What we know: UI-SPEC says footer slot at the Dialog level OR buttons at the bottom of content. Both acceptable.
   - What's unclear: If buttons are in `MembershipDetail.vue` content, the Dialog in `MembershipsTab.vue` doesn't need a footer slot; if buttons are in `MembershipsTab.vue`'s Dialog footer, `MembershipDetail.vue` stays purely presentational and emits from an internal `<button>` or the parent wires `@edit`/`@delete` on the Dialog footer.
   - Recommendation: Put `emit('edit')` and `emit('delete')` button triggers inside `MembershipDetail.vue` template at the bottom of the content div (not in Dialog footer slot). This keeps the emit wiring in the component that owns the context, and the Dialog in MembershipsTab.vue stays simple with `@edit="openEdit(selectedRecord!)"` and `@delete="openDelete(selectedRecord!)"`.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 13 is pure frontend code changes. No external tools, databases, CLI utilities, or services beyond the existing development environment are required. PocketBase is already running and verified by Phases 11 and 12.

---

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is skipped.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (session check on create) | `pb.authStore.record?.id` null guard — HIGH-01 fix |
| V3 Session Management | Partial | `fileToken` TTL handled at tab level (already implemented) |
| V4 Access Control | Yes | PocketBase server rules (Phase 11 — already enforced) |
| V5 Input Validation | Yes | Zod schema on client; PocketBase schema enforces server-side |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via card_name interpolation | Tampering | Vue template `{{ }}` auto-escapes; `v-html` forbidden (D-11 confirm message uses template literals only) |
| EXIF GPS metadata leak in card_image | Information Disclosure | Canvas re-encode strips all EXIF before upload (same as vaccination card pipeline) |
| Double-submit / duplicate records | Tampering | `isSaving` ref disables form + button on first submission (D-08) |
| Cross-user data access | Elevation of Privilege | PocketBase server rules enforce `user = @request.auth.id` — client can't bypass (Phase 11 verified) |
| Session expiry on submit | Denial of Service | Explicit null guard returns early with user-facing toast (HIGH-01 pattern) |

---

## Sources

### Primary (HIGH confidence)

- `ManageVaccination.vue` — direct analog for ManageMembership.vue; EXIF strip, FileUpload, isSaving, pendingFile, defineModel, onSubmit patterns verified
- `VaccinationsTab.vue` — direct analog for MembershipsTab.vue write state extension; useConfirm, openDelete, onCreated, onUpdated patterns verified
- `WallecxApp.vue` — confirms `<ConfirmDialog />` at app shell level (line 33); no second instance needed
- `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` — direct template for membershipMapper.spec.ts; 10-test structure verified
- `src/lib/pocketbase/membershipMapper.ts` — already written in Phase 11; strips id, created, updated, user, card_image; confirmed against function signature
- `src/types/wallecx/memberships/types.d.ts` — `Memberships extends RecordModel` with all fields; `AddMembership` type confirmed
- `src/components/projects/wallecx/MembershipsTab.vue` — current state of tab; records ref, isLoading, fileToken, openDetail pattern confirmed
- `src/components/projects/wallecx/MembershipDetail.vue` — current state; no edit/delete buttons present; emits not yet defined
- `.planning/STATE.md` — locked decisions: direct v-model refs, card_color without hash, HIGH-01/02 fixes, ConfirmDialog placement, server-first delete, useConfirm explicit import
- `.planning/phases/13-write-path-managemembership-crud/13-CONTEXT.md` — all implementation decisions D-01..D-13
- `.planning/phases/13-write-path-managemembership-crud/13-UI-SPEC.md` — copywriting contract, component inventory, interaction states
- `package.json` — all required libraries confirmed installed; no new deps needed

### Secondary (MEDIUM confidence)

- Zod 4 `flatten().fieldErrors` API — package.json confirms zod `^4.1.5`; Zod 4 flatten is backward-compatible with this pattern [ASSUMED based on zod 4 changelog knowledge; verified version from package.json]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json; no new installs
- Architecture: HIGH — direct analogs verified line-by-line in production codebase files
- Pitfalls: HIGH — sourced from STATE.md locked lessons (HIGH-01, HIGH-02, Phase 3 Review findings) and D-02/D-03/D-06 decisions
- Mapper spec: HIGH — vaccinationMapper.spec.ts read in full; membershipMapper.ts function signature read and verified

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable stack — PrimeVue/Zod/Vue 3 APIs do not change frequently)
