# Phase 35: Forms & Dialogs on Small Screens — Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/BaseMobileDialog.vue` | component (wrapper) | request-response | `ManageExpense.vue` (Dialog+Drawer branch structure) + `DragHandle.vue` (#header) | exact — extracts from these files directly |
| `src/components/projects/wallecx/ManageExpense.vue` | component (form dialog) | CRUD + file-I/O | itself (pre-migration source) + `ManageMembership.vue` | exact — wave 1 reference |
| `src/components/projects/wallecx/ManageBudget.vue` | component (form dialog) | CRUD | `ManageExpense.vue` (Dialog/Drawer branch + onHide pattern) | role-match (no file upload) |
| `src/components/projects/wallecx/ManageMembership.vue` | component (form dialog) | CRUD + file-I/O | `ManageExpense.vue` | exact (identical shell pattern) |
| `src/components/projects/wallecx/ManageVaccination.vue` | component (form dialog) | CRUD + file-I/O | `ManageExpense.vue` + `ManageMembership.vue` | exact (identical shell; adds @primevue/forms) |
| `src/assets/wallecx-overrides.css` | config (global CSS) | n/a | itself — Phase 34 sticky/safe-area rules already present | exact — append-only |
| `src/components/projects/wallecx/ExpensesToolbar.vue` | component (toolbar) | request-response | itself — DatePicker site already present | exact |
| `src/components/projects/wallecx/ExpensesReportsView.vue` | component (view) | request-response | itself — DatePicker sites already present | exact |

---

## Pattern Assignments

### `src/components/projects/wallecx/BaseMobileDialog.vue` (NEW — component, request-response)

**Primary analog:** `src/components/projects/wallecx/ManageExpense.vue`
**Supporting analogs:** `DragHandle.vue`, `useMobileEnv.ts`, `WallecxApp.vue` (ConfirmDialog singleton)

**Imports pattern to copy** (from `ManageExpense.vue` lines 1–13 + `ExpensesTab.vue` line 7):

```typescript
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import { useMobileEnv } from '@/composables/useMobileEnv'
import DragHandle from './DragHandle.vue'
```

Note: All four Manage dialogs currently import `useIsMobile` (lines 11, 21, 13, 15 of their respective files). BaseMobileDialog is the first new file that should import `useMobileEnv` instead — giving `isMobile` from the Phase-33 single source of truth. The Manage dialogs will also migrate from `useIsMobile` to `useMobileEnv` during their respective waves (see RESEARCH.md "Confirmed claims" note).

**defineModel pattern** (from `ManageExpense.vue` line 14):

```typescript
const visible = defineModel<boolean>('visible', { required: true })
```

**Mobile Drawer shell pattern** (from `ManageExpense.vue` lines 395–526 — the Drawer branch):

```html
<Drawer
  v-model:visible="visible"
  position="bottom"
  :show-close-icon="!isSaving"
  @hide="onHide"
>
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <DragHandle />
      <span class="font-semibold">{{ dialogHeader }}</span>
    </div>
  </template>
  <!-- ... form body ... -->
</Drawer>
```

Phase 35 modification — add `:dismissable="false"` and `@before-hide="onBeforeHide"` to the Drawer (verified in `node_modules/primevue/drawer/index.d.ts`):

```html
<Drawer
  v-if="isMobile"
  v-model:visible="visible"
  position="bottom"
  :dismissable="false"
  :show-close-icon="!isSaving"
  @before-hide="onBeforeHide"
  @hide="onHide"
>
```

**Desktop Dialog shell pattern** (from `ManageExpense.vue` lines 265–392 — the Dialog branch):

```html
<Dialog
  v-if="!isMobile"
  modal
  v-model:visible="visible"
  :header="dialogHeader"
  :style="{ width: '40vw' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  :closable="!isSaving && !isLoadingCategories"
  @hide="onHide"
>
```

Phase 35 simplification — BaseMobileDialog passes `:closable="!isSaving"` (no `isLoadingCategories`; that is a ManageExpense-specific concern).

**Dark-mode scoped overrides to extract into BaseMobileDialog** (from `ManageExpense.vue` lines 528–538, `ManageBudget.vue` lines 241–250 — same in all 4 dialogs):

```css
/* Move into BaseMobileDialog.vue <style scoped> — currently duplicated in all 4 dialogs */
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
```

**DragHandle component** (from `DragHandle.vue` — entire file, 10 lines):

```html
<!-- Decorative pill; aria-hidden="true"; no props needed -->
<div
  class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
  aria-hidden="true"
/>
```

**Dirty guard — onBeforeHide pattern** (from `RESEARCH.md` §Key Implementation Details #2, pattern synthesized from Drawer API + `ExpensesTab.vue` useConfirm usage at lines 99–106):

```typescript
// ExpensesTab.vue delete-confirm pattern — same service, same singleton ConfirmDialog
// lines 99-120: confirm.require({ header, message, acceptProps, rejectProps, accept })
const confirm = useConfirm()

let _bypassGuard = false

function closeWithoutGuard(): void {
  _bypassGuard = true
  visible.value = false
}

defineExpose({ closeWithoutGuard })

function onBeforeHide(): void {
  if (_bypassGuard) {
    _bypassGuard = false
    return
  }
  if (!props.isDirty) {
    visible.value = false
    return
  }
  confirm.require({
    header: 'Discard changes?',
    message: 'Your unsaved changes will be lost.',
    acceptLabel: 'Discard',
    rejectLabel: 'Keep editing',
    acceptClass: 'p-button-danger',
    accept: () => { visible.value = false },
  })
}

function onHide(): void {
  _bypassGuard = false
}
```

**FD-06 auto-scroll handler** (from `RESEARCH.md` §Key Implementation Details #6):

```typescript
const formRef = ref<HTMLElement | null>(null)

function onFocusin(e: FocusEvent): void {
  if (!isMobile.value) return
  const target = e.target as HTMLElement
  if (target?.scrollIntoView) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }
}
```

Attach via `<div ref="formRef" @focusin="onFocusin">` wrapping `<slot />` + actions div inside the Drawer branch.

**ConfirmDialog singleton location** (`WallecxApp.vue` line 105):
`<ConfirmDialog />` — exactly one instance. BaseMobileDialog calls `useConfirm().require()` — NO second `<ConfirmDialog>` instance anywhere.

---

### `src/components/projects/wallecx/ManageExpense.vue` (MODIFY — wave 1, component, CRUD + file-I/O)

**Analog:** itself (pre-migration source), `ManageMembership.vue` for EXIF path variant

**Current Dialog/Drawer branch structure to collapse** (lines 265–526): Both branches render identical `<form @submit.prevent="onSubmit" class="space-y-4">` with the same fields. BaseMobileDialog migration collapses these to ONE `<BaseMobileDialog>` with form in `#default` slot and Save/Cancel in `#actions` slot.

**onHide reset pattern** (lines 175–177) — must be relayed from BaseMobileDialog's `@hide` emit:

```typescript
function onHide(): void {
  pendingFile.value = null
}
```

**`onFileSelect` EXIF/compression pipeline** (lines 127–173) — both camera and gallery inputs call this handler. No changes to the pipeline itself:

```typescript
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum size is 10 MB.'); return }
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) { toast.error('File type not supported. Use JPEG, PNG, WebP, or PDF.'); return }
  if (file.type === 'application/pdf') { pendingFile.value = file; return }
  // Image: canvas EXIF strip then browser-image-compression
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = await createImageBitmap(file)
    canvas.width = img.width; canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const strippedBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), file.type)
    )
    const strippedFile = new File([strippedBlob], file.name, { type: file.type })
    const compressed = await imageCompression(strippedFile, { maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true })
    pendingFile.value = new File([compressed], file.name, { type: file.type })
    toast.info('Location data removed.')
  } catch {
    toast.error('Failed to process image. Please try again.')
    pendingFile.value = null
  }
}
```

**FD-05 raw file input bridge** — new handler to add, calls existing `onFileSelect`:

```typescript
async function onRawFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''  // reset so same file can be re-selected
  await onFileSelect({ files: [file] })
}
```

**FD-05 two-affordance template** (replaces `<FileUpload>` on mobile, per UI-SPEC Contract 5):

```html
<!-- Mobile two-affordance camera + gallery (v-if="isMobile") -->
<div class="flex gap-2">
  <label class="p-button p-button-outlined p-button-secondary p-button-sm
                min-h-[44px] cursor-pointer flex items-center gap-2 flex-1">
    <input type="file" accept="image/jpeg,image/png,image/webp"
      capture="environment" class="hidden" :disabled="isSaving" @change="onRawFileChange" />
    <i class="pi pi-camera" aria-hidden="true"></i> Take photo
  </label>
  <label class="p-button p-button-outlined p-button-secondary p-button-sm
                min-h-[44px] cursor-pointer flex items-center gap-2 flex-1">
    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
      class="hidden" :disabled="isSaving" @change="onRawFileChange" />
    <i class="pi pi-images" aria-hidden="true"></i> Choose from gallery
  </label>
</div>
<!-- Desktop: existing FileUpload (v-else) -->
<FileUpload v-else mode="basic" :auto="false"
  accept="image/jpeg,image/png,image/webp,application/pdf"
  :chooseLabel="isEditMode && record?.receipt ? 'Replace file' : 'Choose File'"
  :disabled="isSaving" @select="onFileSelect" />
```

**Dirty snapshot pattern** (from RESEARCH.md §Code Examples — synthesized from existing watch/record pattern at lines 44–68):

```typescript
interface ExpenseSnapshot {
  amount: number | null; expenseDate: string; category: string
  description: string; notes: string; hasPendingFile: boolean
}
const snapshot = ref<ExpenseSnapshot | null>(null)

watch(visible, (isOpen) => {
  if (isOpen) snapshot.value = {
    amount: amount.value,
    expenseDate: expenseDate.value.toISOString(),
    category: category.value,
    description: description.value,
    notes: notes.value,
    hasPendingFile: false,
  }
})

const isDirty = computed<boolean>(() => {
  if (!snapshot.value) return false
  return (
    amount.value !== snapshot.value.amount ||
    expenseDate.value.toISOString() !== snapshot.value.expenseDate ||
    category.value !== snapshot.value.category ||
    description.value !== snapshot.value.description ||
    notes.value !== snapshot.value.notes ||
    pendingFile.value !== null
  )
})
```

**FD-04 DatePicker change** (line 299 / line 432 — one of the two identical branches; collapses to one after migration):

```html
<!-- Before: -->
<DatePicker v-model="expenseDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
<!-- After (D-35-13 CORRECTED): -->
<DatePicker v-model="expenseDate" :inline="isMobile" fluid dateFormat="dd M yy" showButtonBar :disabled="isSaving" />
```

**`onSubmit` close pattern** — replace `visible.value = false` (lines 255, 254) with `baseDialogRef.value?.closeWithoutGuard()` so the dirty guard is bypassed on successful save:

```typescript
const baseDialogRef = ref<InstanceType<typeof BaseMobileDialog> | null>(null)

// In onSubmit success path (was: visible.value = false):
baseDialogRef.value?.closeWithoutGuard()

// Explicit Cancel handler (new):
function onCancel(): void {
  baseDialogRef.value?.closeWithoutGuard()
}
```

**FD-03 inputmode/enterkeyhint additions** — add to existing InputNumber and InputText elements:

```html
<!-- Amount InputNumber (lines 284–291 / 415–422): -->
<InputNumber v-model="amount" fluid inputmode="decimal" enterkeyhint="next" autocomplete="off" ... />

<!-- Description InputText (line 327 / 460): -->
<InputText v-model="description" fluid inputmode="text" enterkeyhint="next" autocomplete="off" ... />

<!-- Notes Textarea (line 344 / 477) — last text field: -->
<Textarea v-model="notes" fluid inputmode="text" enterkeyhint="done" autocomplete="off" ... />
```

Note: `inputmode` and `enterkeyhint` are standard HTML attributes and pass through to PrimeVue's underlying `<input>` / `<textarea>` via Vue's attr inheritance.

---

### `src/components/projects/wallecx/ManageBudget.vue` (MODIFY — wave 2, component, CRUD)

**Analog:** `ManageExpense.vue` (Dialog/Drawer shell) + itself (no file upload)

**Current Dialog/Drawer structure** (lines 110–238): identical shell to ManageExpense. Same collapse strategy — one `<BaseMobileDialog>` with `#default` form and `#actions` Save/Cancel.

**`onHide` reset pattern** (lines 56–58):

```typescript
function onHide(): void {
  isSaving.value = false
}
```

**Pre-population watch** (lines 40–50) — must be preserved verbatim; fires on `visible` rising edge to rebuild `localRows` from props:

```typescript
watch(visible, (isOpen) => {
  if (!isOpen) return
  localRows.value = props.categories.map((c) => {
    const existing = budgetMap.value.get(c.name)
    return { category: c.name, amount: existing?.amount ?? null, budgetType: existing?.budget_type ?? 'monthly' }
  })
})
```

**Dirty snapshot** — no equivalent in current file (first-time addition). Copy pattern from RESEARCH.md §Per-Dialog Migration Map ManageBudget:

```typescript
// Snapshot taken AFTER localRows is rebuilt on open
const openSnapshot = ref<string>('')

watch(visible, (isOpen) => {
  if (!isOpen) return
  // ... rebuild localRows as above ...
  openSnapshot.value = JSON.stringify(localRows.value)
})

const isDirty = computed<boolean>(() =>
  JSON.stringify(localRows.value) !== openSnapshot.value
)
```

**`localRows` InputNumber** (lines 138–146 / 207–213) — add `inputmode`/`enterkeyhint`. The last row uses `enterkeyhint="done"`:

```html
<InputNumber
  :id="`budget-amount-${idx}`"
  v-model="row.amount"
  fluid
  inputmode="decimal"
  :enterkeyhint="idx === localRows.length - 1 ? 'done' : 'next'"
  autocomplete="off"
  ...
/>
```

**Save button label** (lines 163, 232): currently `label="Save Budgets"` — use verbatim to avoid regression.

---

### `src/components/projects/wallecx/ManageMembership.vue` (MODIFY — wave 3 — HIGHEST RISK, component, CRUD + file-I/O)

**Analog:** `ManageExpense.vue` (shell); `ManageVaccination.vue` (EXIF path variant for canvas/URL.createObjectURL approach)

**ColorPicker direct-v-model invariant** (lines 41–47, 304–310, 428–435 — PrimeVue #8135):

```typescript
// This ref MUST stay in ManageMembership.vue, never touched by BaseMobileDialog
const cardColor = ref<string>('002244') // D-01: navy default, no # prefix
```

```html
<!-- Direct v-model — DO NOT fold into @primevue/forms -->
<ColorPicker v-model="cardColor" aria-label="Card colour picker" :disabled="isSaving" />
<span class="inline-block w-8 h-8 rounded" :style="{ backgroundColor: '#' + cardColor }" aria-hidden="true"></span>
```

**card_color no-hash round-trip** (lines 63–65, 72–74 in record watcher; lines 208, 74):

```typescript
// Load: strip # prefix from stored value (it's stored without # per CON-CARD-COLOR-NO-HASH)
cardColor.value = rec.card_color ?? '002244'  // rec.card_color is already no-hash

// Save: append to FormData WITHOUT adding #
formData.append('card_color', cardColor.value)  // '002244', never '#002244'
```

**Record watcher** (lines 56–80) — preserve `{ immediate: true }` verbatim:

```typescript
watch(
  () => record.value,
  (rec) => {
    if (rec) {
      cardName.value = rec.card_name
      // ... all field seeds ...
      cardColor.value = rec.card_color ?? '002244'
    } else {
      // ... reset to defaults ...
      cardColor.value = '002244'
    }
  },
  { immediate: true },  // CRITICAL: do not remove
)
```

**EXIF path** (lines 115–173) — ManageMembership uses `URL.createObjectURL` + `Image` load pattern (vs ManageExpense's `createImageBitmap`). Both are valid; preserve existing pattern verbatim. The `onRawFileChange` bridge is added exactly as in ManageExpense:

```typescript
async function onRawFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  await onFileSelect({ files: [file] })
}
```

**FD-05 accept types** — ManageMembership card_image is images-only (no PDF), per lines 353–360:

```html
<!-- Camera: images only -->
<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" ... />
<!-- Gallery: images only (no application/pdf) -->
<input type="file" accept="image/jpeg,image/png,image/webp" ... />
```

**FD-04 DatePicker** (lines 323–325 / 449–451 — both branches become one after migration):

```html
<!-- Before: -->
<DatePicker v-model="expiryDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
<!-- After: -->
<DatePicker v-model="expiryDate" :inline="isMobile" fluid dateFormat="dd M yy" showButtonBar :disabled="isSaving" />
```

**Dirty snapshot** — covers the `pendingFile` flag for upload-dirty detection:

```typescript
const isDirty = computed<boolean>(() => {
  if (!snapshot.value) return false
  return (
    cardName.value !== snapshot.value.cardName ||
    barcodeType.value !== snapshot.value.barcodeType ||
    barcodeValue.value !== snapshot.value.barcodeValue ||
    cardNumber.value !== snapshot.value.cardNumber ||
    cardColor.value !== snapshot.value.cardColor ||
    (expiryDate.value?.toISOString() ?? null) !== snapshot.value.expiryDate ||
    issuer.value !== snapshot.value.issuer ||
    notes.value !== snapshot.value.notes ||
    pendingFile.value !== null
  )
})
```

**FD-03 inputmode additions** (ManageMembership fields):

```html
<InputText v-model="cardName"    inputmode="text"    enterkeyhint="next" autocomplete="off" ... /> <!-- Card Name -->
<InputText v-model="barcodeValue" inputmode="text"   enterkeyhint="next" autocomplete="off" ... /> <!-- Barcode Value -->
<InputText v-model="cardNumber"  inputmode="numeric" enterkeyhint="next" autocomplete="off" ... /> <!-- Card Number -->
<InputText v-model="issuer"      inputmode="text"    enterkeyhint="next" autocomplete="off" ... /> <!-- Issuer -->
<Textarea  v-model="notes"       inputmode="text"    enterkeyhint="done" autocomplete="off" ... /> <!-- Notes — last field -->
```

---

### `src/components/projects/wallecx/ManageVaccination.vue` (MODIFY — wave 4, component, CRUD + file-I/O)

**Analog:** `ManageMembership.vue` (EXIF + shell); itself (two-Form structure to collapse)

**Two-Form → One-Form collapse** — current state: two identical `<Form>` blocks at lines 225 and 343 (Dialog + Drawer branches). After migration: ONE `<Form>` in the `#default` slot of `<BaseMobileDialog>`:

```html
<!-- In ManageVaccination.vue template after migration -->
<BaseMobileDialog v-model:visible="visible" :title="dialogHeader" :is-dirty="isDirty" :is-saving="isSaving" ref="baseDialogRef">
  <Form v-slot="$form" :initialValues="initialValues" :resolver="resolver" @submit="onSubmit" validate-on-submit class="space-y-4">
    <!-- administeredDate DatePicker sits OUTSIDE the Form — preserves D-33-01-A invariant -->
    <!-- ... all named InputText/InputNumber fields ... -->
    <div class="flex flex-col gap-1">
      <label class="text-sm" style="color: var(--color-typo-heading)">Date Administered *</label>
      <DatePicker v-model="administeredDate" :inline="isMobile" fluid dateFormat="dd M yy" showButtonBar :disabled="isSaving" />
      <Message v-if="dateAdministeredError" severity="error" size="small" variant="simple">{{ dateAdministeredError }}</Message>
    </div>
  </Form>
  <template #actions>...</template>
</BaseMobileDialog>
```

**`administeredDate` direct-v-model invariant** (lines 32, 54–62 — D-33-01-A / PrimeVue #8191):

```typescript
// This ref and its watch MUST stay in ManageVaccination.vue, outside @primevue/forms
const administeredDate = ref<Date | null>(null)

// Tuple watch — fires on BOTH visible AND record change (prevents stale-blank on reopen)
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, rec]) => {
    if (!isVisible) return
    administeredDate.value = rec ? new Date(rec.date_administered) : null
    dateAdministeredError.value = ''
  },
  { immediate: true },  // CRITICAL: do not remove
)
```

**`onHide` reset** (lines 207–210):

```typescript
function onHide(): void {
  pendingFile.value = null
  dateAdministeredError.value = ''
}
```

**EXIF path** (lines 75–141) — ManageVaccination uses the same `URL.createObjectURL` + `Image` load pattern as ManageMembership. Add `onRawFileChange` bridge exactly as in ManageExpense/ManageMembership.

**FD-05 accept types** — ManageVaccination accepts images + PDF (lines 303–308):

```html
<!-- Camera: images only (rear camera cannot produce PDFs) -->
<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" ... />
<!-- Gallery: images + PDF (matching existing FileUpload accept on line 304) -->
<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" ... />
```

**`onSubmit` signature** — ManageVaccination uses `@primevue/forms` `FormSubmitEvent` (line 143):

```typescript
async function onSubmit({ valid, values }: FormSubmitEvent): Promise<void> {
  if (!valid) return
  // manual date validation:
  if (!administeredDate.value) { dateAdministeredError.value = 'Date administered is required.'; return }
  // ... FormData build + PocketBase save ...
  baseDialogRef.value?.closeWithoutGuard()  // replaces visible.value = false (line 198)
}
```

**Dirty snapshot** — reads from `initialValues.value` (already a computed based on `record.value`):

```typescript
const isDirty = computed<boolean>(() => {
  if (!snapshot.value) return false
  return (
    // Compare Form fields via initialValues (snapshot taken at open)
    JSON.stringify(snapshot.value) !== JSON.stringify({
      vaccineType: initialValues.value.vaccine_type,
      vaccineName: initialValues.value.vaccine_name,
      administeredDate: administeredDate.value?.toISOString() ?? null,
      // ...other fields
      hasPendingFile: pendingFile.value !== null,
    })
  )
})
```

Simpler alternative: snapshot all field refs individually at open time (same approach as ManageExpense) rather than relying on `initialValues` computed.

**FD-03 inputmode additions** (ManageVaccination fields):

```html
<InputText name="vaccine_type"  inputmode="text"    enterkeyhint="next" autocomplete="off" ... />
<InputText name="vaccine_name"  inputmode="text"    enterkeyhint="next" autocomplete="off" ... />
<InputNumber name="dose_number" inputmode="numeric" enterkeyhint="next" autocomplete="off" ... />
<InputText name="lot_number"    inputmode="text"    enterkeyhint="next" autocomplete="off" ... />
<InputText name="manufacturer"  inputmode="text"    enterkeyhint="next" autocomplete="off" ... />
<InputText name="location"      inputmode="text"    enterkeyhint="next" autocomplete="off" ... />
<Textarea  name="notes"         inputmode="text"    enterkeyhint="done" autocomplete="off" ... />
```

---

### `src/assets/wallecx-overrides.css` (MODIFY — append-only)

**Analog:** itself — existing Phase 34 sticky/safe-area rules (lines 87–140)

**Pattern to copy for FD-01** — mirrors the existing `@media (max-width: 639px)` block structure (lines 93–125) and the `!important` + comment convention used throughout the file:

```css
/* Phase 35 FD-01: iOS auto-zoom prevention — font-size >= 16px on all form inputs
 * at mobile widths. iOS Safari auto-zooms when a focused input has font-size < 16px.
 * Non-scoped (this file is already non-scoped) to reach teleported overlay DOM.
 * !important required — Aura's component tokens set font-size via --p-inputtext-font-size
 * which resolves to ~0.875rem (14px) by default. */
@media (max-width: 640px) {
  .p-inputtext,
  .p-inputnumber-input,
  .p-textarea,
  .p-select-label,
  .p-multiselect-label,
  .p-datepicker-input {
    font-size: 16px !important;
  }
}
```

**Pattern to copy for sticky action bar (LT-08)** — mirrors `.wallecx-tab-toolbar` sticky pattern (lines 112–124) and the `.p-drawer-content` safe-area padding pattern (lines 136–140). CRITICAL: per Pitfall 6 in RESEARCH.md, the action bar uses flat `padding-bottom: 0.5rem` — NOT `max(env(safe-area-inset-bottom), ...)` — because `.p-drawer-content` (line 137) already absorbs the iOS home indicator:

```css
/* Phase 35 LT-08: Sticky Save/Cancel action bar.
 * CRITICAL: padding-bottom is flat 0.5rem — NOT env(safe-area-inset-bottom).
 * .p-drawer-content already pads via max(env(safe-area-inset-bottom), 1.25rem)
 * from Phase 34 (line 137 above). Double-stacking produces ~68px on notched iPhone. */
.wallecx-manage-actions {
  position: sticky;
  bottom: 0;
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  background: var(--p-drawer-background, var(--p-overlay-modal-background));
  border-top: 1px solid var(--color-surface-divider);
  z-index: 1;
}

.my-app-dark .wallecx-manage-actions {
  background: var(--color-surface-card);
}
```

---

### `src/components/projects/wallecx/ExpensesToolbar.vue` (MODIFY — FD-04 only)

**Analog:** itself — DatePicker sites at lines 67–74 and 75–82

**Current code** (lines 67–83):

```html
<DatePicker
  :model-value="dateFrom"
  placeholder="From date"
  dateFormat="dd M yy"
  class="w-32 min-h-[44px]"
  showButtonBar
  @update:model-value="emit('update:dateFrom', ($event instanceof Date ? $event : null))"
/>
<DatePicker
  :model-value="dateTo"
  placeholder="To date"
  dateFormat="dd M yy"
  class="w-32 min-h-[44px]"
  showButtonBar
  @update:model-value="emit('update:dateTo', ($event instanceof Date ? $event : null))"
/>
```

**FD-04 change** — add `useMobileEnv()` import and `:inline="isMobile"`. Note that ExpensesToolbar currently has NO script setup imports at all (lines 1–19 — props and emits only). Add:

```typescript
import { useMobileEnv } from '@/composables/useMobileEnv'
const { isMobile } = useMobileEnv()
```

Then add `:inline="isMobile"` to both DatePicker sites:

```html
<DatePicker
  :model-value="dateFrom"
  :inline="isMobile"
  placeholder="From date"
  dateFormat="dd M yy"
  class="w-32 min-h-[44px]"
  showButtonBar
  @update:model-value="emit('update:dateFrom', ($event instanceof Date ? $event : null))"
/>
```

The `@update:model-value` cast pattern (`$event instanceof Date ? $event : null`) is already present and must be preserved — inline DatePicker emits `Date | null` on selection.

---

### `src/components/projects/wallecx/ExpensesReportsView.vue` (MODIFY — FD-04 only)

**Analog:** itself — DatePicker sites confirmed at lines 412–417 (`customFrom`) and 421–426 (`customTo`)

**Current code** (lines 412–426):

```html
<DatePicker v-model="customFrom" placeholder="From date" dateFormat="dd M yy" class="w-full min-h-[44px]" />
<DatePicker v-model="customTo"   placeholder="To date"   dateFormat="dd M yy" class="w-full min-h-[44px]" />
```

**FD-04 change** — add `useMobileEnv()` to existing script setup (file already imports `useIsMobile` or equivalent — check for existing mobile composable), then add `:inline="isMobile"` + `showButtonBar`:

```html
<DatePicker v-model="customFrom" :inline="isMobile" placeholder="From date" dateFormat="dd M yy" class="w-full min-h-[44px]" showButtonBar />
<DatePicker v-model="customTo"   :inline="isMobile" placeholder="To date"   dateFormat="dd M yy" class="w-full min-h-[44px]" showButtonBar />
```

Note: When `:inline="true"` on mobile, the `placeholder` prop is not displayed (inline calendar shows the full grid). It is harmless to keep it for desktop (`inline=false`) mode.

---

## Shared Patterns

### Pattern S-1: Dialog/Drawer Shell (all 4 Manage dialogs → BaseMobileDialog)

**Source:** `ManageExpense.vue` lines 265–392 (Dialog) and 395–526 (Drawer)
**Apply to:** All 4 Manage dialogs after wave migration

The `v-if="!isMobile"` / `v-else` branch structure is the pattern being INTERNALIZED into BaseMobileDialog. After migration, each Manage dialog contains exactly one `<BaseMobileDialog>` with `#default` and `#actions` slots. The dark-mode scoped `:deep` overrides move to BaseMobileDialog's `<style scoped>`.

### Pattern S-2: useIsMobile → useMobileEnv Migration

**Source:** `useMobileEnv.ts` lines 94–128; `useIsMobile.ts` lines 12–21
**Apply to:** All 4 Manage dialogs, ExpensesToolbar, ExpensesReportsView (any file that adds `isMobile`)

```typescript
// OLD (all 4 dialogs use this):
import { useIsMobile } from '@/composables/useIsMobile'
const isMobile = useIsMobile()

// NEW (Phase 35 pattern — same 639px breakpoint, single source of truth):
import { useMobileEnv } from '@/composables/useMobileEnv'
const { isMobile } = useMobileEnv()
```

`useMobileEnv` internally calls `useIsMobile()` so the breakpoint is identical. No behavioral change.

### Pattern S-3: onHide Reset

**Source:** `ManageExpense.vue` lines 175–177; `ManageBudget.vue` lines 56–58; `ManageMembership.vue` lines 249–251; `ManageVaccination.vue` lines 207–210
**Apply to:** All 4 Manage dialogs

BaseMobileDialog relays `@hide` to children via an emitted `hide` event or by calling a provided `onHide` callback. The existing reset logic in each component must NOT be removed — it fires on both close paths (save and dismiss).

### Pattern S-4: useConfirm Usage (delete-confirm → dirty-guard)

**Source:** `ExpensesTab.vue` lines 7, 20, 99–120 — delete confirm pattern
**Apply to:** `BaseMobileDialog.vue` (dirty guard)

```typescript
// Exact import pattern — explicit, not auto-resolved
import { useConfirm } from 'primevue/useconfirm'
const confirm = useConfirm()

confirm.require({
  header: 'Confirm Delete',       // → 'Discard changes?' for dirty guard
  message: '...',
  acceptProps: { label: 'Delete', severity: 'danger' },  // → acceptLabel: 'Discard', acceptClass: 'p-button-danger'
  rejectProps: { label: 'Keep Expense', severity: 'secondary' },  // → rejectLabel: 'Keep editing'
  accept: async () => { ... },
})
```

### Pattern S-5: Form Field Markup (label + input + error Message)

**Source:** `ManageExpense.vue` lines 278–294 (Amount field group pattern); `ManageMembership.vue` lines 268–273
**Apply to:** All new inline DatePicker wrappings (FD-04)

```html
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Field Label *</label>
  <!-- input component here -->
  <Message v-if="fieldError" severity="error" size="small" variant="simple">
    {{ fieldError }}
  </Message>
</div>
```

`gap-1` (4px) between label and input. `class="text-sm"` on label. `style="color: var(--color-typo-heading)"` for label text. `Message` only rendered when error string is non-empty.

### Pattern S-6: Save Button in Actions Slot

**Source:** `ManageExpense.vue` lines 383–390 (Dialog branch) and 517–524 (Drawer branch — identical)
**Apply to:** All 4 Manage dialogs, `#actions` slot content

```html
<!-- Single submit button pattern (existing) — in Phase 35 moves to #actions slot -->
<Button
  type="submit"
  fluid
  :label="isEditMode ? 'Save Changes' : 'Add Expense'"
  :loading="isSaving || isLoadingCategories"
  :disabled="isSaving || isLoadingCategories"
/>
```

Phase 35 adds a Cancel button alongside (see UI-SPEC Contract 2) and separates Save (type="submit" with :form="id") from Cancel (type="button" calling `closeWithoutGuard()`).

### Pattern S-7: Thumbnail + File-Selected Display

**Source:** `ManageExpense.vue` lines 350–380; `ManageMembership.vue` lines 342–364
**Apply to:** ManageExpense, ManageMembership, ManageVaccination (all upload sites)

```html
<!-- Edit mode: show thumbnail or PDF icon above upload affordances -->
<template v-if="isEditMode && record?.receipt">
  <img v-if="receiptThumbnailUrl" :src="receiptThumbnailUrl"
    class="w-24 h-24 object-cover rounded" alt="Current receipt" />
  <div v-else-if="hasExistingPdf" class="w-24 h-24 flex items-center justify-center border rounded">
    <i class="pi pi-file-pdf text-3xl" aria-label="Receipt (PDF)"></i>
  </div>
  <p class="text-sm" style="color: var(--color-typo-muted)">
    Current receipt — select a new file to replace it
  </p>
</template>
<!-- Pending file name (both mobile and desktop) -->
<p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
  {{ pendingFile.name }} selected
</p>
```

---

## No Analog Found

All files have close analogs in the codebase. No entries.

---

## Invariant Cross-Reference

| Invariant | Constraint | Source Location | What NOT to Change |
|-----------|-----------|-----------------|-------------------|
| CON-CARD-COLOR-NO-HASH | `card_color` stored without `#` prefix | `ManageMembership.vue` lines 63–65, 208 | `formData.append('card_color', cardColor.value)` — no `'#' +` prefix |
| PrimeVue #8135 | ColorPicker requires direct `v-model`, not `@primevue/forms` | `ManageMembership.vue` lines 41–47 | `cardColor` ref stays in ManageMembership; BaseMobileDialog does NOT own it |
| D-33-01-A / PrimeVue #8191 | `administeredDate` requires direct `v-model`, not `@primevue/forms` | `ManageVaccination.vue` lines 32, 54–62 | `administeredDate` ref and `[visible, record]` tuple watch stay in ManageVaccination |
| CON-CONFIRMDIALOG-SINGLETON | Exactly one `<ConfirmDialog />` in the entire app | `WallecxApp.vue` line 105 | BaseMobileDialog calls `useConfirm().require()` only — no second `<ConfirmDialog>` |
| NFR-BR-2-PRESERVED | `membershipMapper.spec.ts` 11 tests must pass after wave 3 | Test file: verify path via `npm run test:unit` | `card_color` round-trip logic in `mapToUpdateMembership` — untouched |

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/composables/`, `src/assets/`, `src/components/projects/wallecx/WallecxApp.vue`
**Files read:** 11 source files
**Pattern extraction date:** 2026-05-27
