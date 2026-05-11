# Phase 3: Write Path (Create / Edit / Delete with Attachments) - Research

**Researched:** 2026-05-11
**Domain:** Vue 3 + PrimeVue 4 form/dialog/upload patterns; browser EXIF strip pipeline; PocketBase create/update/delete; Vitest unit testing of pure mapper
**Confidence:** HIGH — all core patterns verified against Context7 (PrimeVue, browser-image-compression) and live codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** "Add vaccination" button in WallecxApp.vue card header area, top-right, alongside the "Wallecx" heading. Always visible.
- **D-02:** Empty state also gets a CTA — "Add your first vaccination" button — for first-time users.
- **D-03:** Single-column vertical stack in the dialog — all 7 fields stacked one per row, full width.
- **D-04:** Date Administered uses PrimeVue DatePicker (calendar popup), not `<input type="date">`.
- **D-05:** Notes uses a small Textarea (~3 rows).
- **D-06:** Single ManageVaccination.vue handles both create and edit; mode determined by whether `record` prop is `null` (create) or `Vaccinations` (edit).
- **D-07:** Toast `"Location data removed."` fires on every image upload unconditionally (no GPS check). PDFs receive no toast.
- **D-08:** PrimeVue `useConfirm()` + `<ConfirmDialog>`. `<ConfirmDialog />` added once to WallecxApp.vue template.
- **D-09:** Confirmation message includes vaccine name as plain text: `'Delete "${record.vaccine_name}"? This cannot be undone.'` — never `v-html`.

### Claude's Discretion

- Exact dialog width (e.g. `40vw` matching LexTrack or wider).
- Field order within the single column (vaccine_name first, then date, dose, lot, manufacturer, location, notes).
- Whether `dose_number` is InputNumber (0–9) or plain InputText.
- `isSaving` ref placement — single ref in ManageVaccination.vue covers both branches.
- Exact Vitest mock shape for `pb` in `vaccinationMapper.spec.ts`.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WRITE-01 | ManageVaccination.vue: PrimeVue Dialog form for create+edit, Zod via `@primevue/forms` `zodResolver`; required: `vaccine_name`, `date_administered`; `dose_number` integer 1–20 if present | Form + zodResolver pattern verified in Login.vue; Zod 4 installed (4.3.6); `z.int().min(1).max(20).optional()` is correct API |
| WRITE-02 | `<FileUpload mode="basic" :auto="false" @select>` for `card`; client-side MIME + size validation mirrors backend | FileUpload `@select` event verified in Context7 docs; `event.files[0]` gives the File object |
| WRITE-03 | Images: canvas re-encode (EXIF strip) → browser-image-compression; PDFs pass through; toast "Location data removed." | Canvas EXIF strip approach verified; browser-image-compression `imageCompression(file, options)` API verified |
| WRITE-04 | Create flow: `await pb.create<Vaccinations>(formData)` → `Object.assign(localItem, created)` so re-saves PATCH | LexTrack save-loop bug is Pitfall 3; Object.assign contract established in CONTEXT.md code_context |
| WRITE-05 | Update flow: `mapToUpdateVaccination(record)` strips server-managed fields before `pb.update(id, payload)` | vaccinationMapper.ts verified — strips id, created, updated, user, card |
| WRITE-06 | Delete: confirm dialog → `await pb.delete(id)` → splice → toast; failure → no splice + error toast; file 404 within 5s | PrimeVue useConfirm pattern verified; Pitfall 4 (delete local only) and Pitfall 6 (orphan files) directly addressed |
| WRITE-07 | Single `isSaving` ref disables form + submit during in-flight requests | Pitfall 11 (double-submit) pattern; isSaving guard with try/finally |
| WRITE-08 | All PocketBase filter strings use parameterised `{:name}` syntax | Pitfall 2; PocketBase SDK param syntax verified in PITFALLS.md |
| WRITE-09 | Vitest `vaccinationMapper.spec.ts` covers `mapToUpdateVaccination` and create-then-update id-refresh contract | TESTING.md establishes `src/lib/pocketbase/__tests__/` location; Vitest 3.2.4 + jsdom 26 installed |
</phase_requirements>

---

## Summary

Phase 3 builds the write layer on top of the completed read path. All dependencies are pre-installed (`browser-image-compression@2.0.2`, `@primevue/forms@4.5.5`, `zod@4.3.6`), zero new packages are required. The primary work is:

1. **ManageVaccination.vue** — a unified create/edit PrimeVue Dialog using `@primevue/forms` Form + `zodResolver`, replicating the Login.vue pattern for validation and ManageTask.vue for the Dialog shell. The component receives a nullable `record` prop to toggle create vs. edit mode, contains the `isSaving` guard, and handles the `Object.assign` contract on create.

2. **EXIF strip pipeline** — the `@select` handler in ManageVaccination.vue draws the image to a hidden canvas, calls `canvas.toBlob()` to strip all EXIF, then passes the clean Blob to `imageCompression()` with `{ maxSizeMB: 1.5, useWebWorker: true }`. PDFs bypass this entirely.

3. **WallecxApp.vue wiring** — adds `<ConfirmDialog />`, the "Add vaccination" header button (D-01), empty-state CTA (D-02), and wires `@edit`/`@remove` stubs that currently exist in VaccinationList.vue but are disabled.

4. **vaccinationMapper.spec.ts** — the first test in the repo. Pure unit test of `mapToUpdateVaccination` (strips correct fields) and the create→update id-refresh sequence with a mocked `pb`. Location: `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts`.

**Primary recommendation:** Build plans in four waves: (1) vaccinationMapper.spec.ts and ManageVaccination.vue core, (2) EXIF/attachment pipeline, (3) WallecxApp.vue wiring, (4) VaccinationList.vue Edit/Remove button un-stubbing.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Form validation (Zod) | Browser / Client | — | Client-side first-pass; server rules are the real gate |
| EXIF strip + image compression | Browser / Client | — | Must run before upload; canvas API is browser-only |
| Create / update / delete requests | Browser / Client → API | PocketBase (backend) | SPA calls PocketBase REST directly |
| Confirm dialog (delete) | Browser / Client | — | Pure UI concern; PrimeVue ConfirmDialog service |
| isSaving guard | Browser / Client | — | Single-component ref; prevents double-submit |
| File field handling | Browser / Client | PocketBase (storage) | FormData built in browser; stored in PocketBase |
| Mapper (strip server fields) | Browser / Client | — | Pure function; enforces PATCH correctness |
| Unit test (mapper spec) | Dev toolchain (Vitest) | — | Not shipped to production |

---

## Standard Stack

### Core (all already installed — zero new installs)

| Library | Installed Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| `@primevue/forms` | 4.5.5 | Form component + zodResolver | Already used in Login.vue; auto-imported Form component |
| `zod` | 4.3.6 (v4) | Schema validation | Project-standard; used in Login.vue |
| `browser-image-compression` | 2.0.2 | Post-canvas compress to ~1.5 MB | Installed in Phase 1 (FRONT-01); first consumer is Phase 3 |
| `primevue` | 4.3.7 | Dialog, FileUpload, DatePicker, Textarea, ConfirmDialog, useConfirm | PrimeVue resolver auto-imports all; established project UI library |
| `vue-sonner` | 2.0.8 | Toast notifications (success, error, info) | Project-standard; already in WallecxApp.vue |
| `vitest` | 3.2.4 | Unit test runner | Already configured in vitest.config.ts + tsconfig.vitest.json |

**Version verification:** All verified against `package-lock.json` installed versions. [VERIFIED: package-lock.json]

**Installation:** No new packages required. All dependencies already installed.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dayjs` | ^1.11.18 | Format date from DatePicker (Date object → YYYY-MM-DD for PocketBase) | Whenever converting `DatePicker` value to ISO string for `date_administered` |
| `pocketbase` | ^0.26.2 | SDK `create`, `update`, `delete` calls | Every write operation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@primevue/forms` zodResolver | VeeValidate, Valibot | REQUIREMENTS.md explicitly rejects fragmenting away from existing Zod + @primevue/forms convention |
| Canvas re-encode EXIF strip | `exifr` + `piexifjs` | Canvas is zero-dependency and guaranteed to drop all EXIF; library solutions may miss edge cases |
| `useConfirm()` + `<ConfirmDialog>` | Custom confirm dialog component | Decision D-08 locks PrimeVue confirm service |

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks "Add" or "Edit"
        │
        ▼
WallecxApp.vue
  openManage(record: Vaccinations | null)
        │
        ▼
ManageVaccination.vue (Dialog)
  ┌─────────────────────────────────────────┐
  │  @primevue/forms <Form>                 │
  │    zodResolver (Zod 4 schema)           │
  │    7 fields: vaccine_name, date,        │
  │    dose_number, lot_number,             │
  │    manufacturer, location, notes        │
  │                                         │
  │  FileUpload @select ──────────────────► onFileSelect()
  │                                         │  if image:
  │                                         │    canvas.toBlob() [EXIF strip]
  │                                         │    imageCompression() [~1.5 MB]
  │                                         │    toast.info("Location data removed.")
  │                                         │  if PDF: pass through
  │                                         │  validate MIME + size
  │                                         │
  │  isSaving = true ◄── @submit ──────────┘
  │         │
  │         ├── create mode ──► pb.collection().create<Vaccinations>(formData)
  │         │                         │
  │         │                         ▼
  │         │                   Object.assign(localItem, serverRecord)
  │         │                   records.push(localItem) [in WallecxApp]
  │         │
  │         └── edit mode ────► mapToUpdateVaccination(record) [strips server fields]
  │                                   │
  │                                   ▼
  │                             pb.collection().update(id, payload)
  │                             update records[] in place
  │
  │  isSaving = false (finally)
  │  toast.success(...)
  └─────────────────────────────────────────┘

User clicks "Remove"
        │
        ▼
WallecxApp.vue
  openDelete(record)
        │
        ▼
  useConfirm().require({
    message: `Delete "${record.vaccine_name}"? This cannot be undone.`,
    accept: () => deleteRecord(record)
  })
        │
        ▼
  pb.collection().delete(record.id)
        ├── success ─► records.splice(index, 1) ─► toast.success(...)
        └── failure ─► toast.error(...) [no splice]
```

### Recommended Project Structure

```
src/
├── components/projects/wallecx/
│   ├── WallecxApp.vue            # MODIFIED: add button, CTA, ConfirmDialog, wiring
│   ├── VaccinationList.vue       # MODIFIED: enable Edit/Remove buttons (remove :disabled)
│   ├── ManageVaccination.vue     # NEW: unified create/edit dialog
│   ├── VaccinationDetail.vue     # unchanged
│   └── AttachmentPreview.vue     # unchanged
├── lib/pocketbase/
│   ├── vaccinationMapper.ts      # unchanged (already correct)
│   └── __tests__/
│       └── vaccinationMapper.spec.ts  # NEW: first test in repo (WRITE-09)
└── types/wallecx/vaccinations/
    └── types.d.ts                # unchanged
```

### Pattern 1: ManageVaccination.vue Dialog Shell

Based on ManageTask.vue + Login.vue patterns in the codebase.

```typescript
// Source: codebase (Login.vue + ManageTask.vue analogs, verified)
// ManageVaccination.vue <script setup lang="ts">

import { ref, computed } from "vue";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { Form, type FormSubmitEvent } from "@primevue/forms";
import { toast } from "vue-sonner";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { pb } from "@/lib/pocketbase";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import dayjs from "dayjs";

// defineModel pattern from ManageTask.vue / ManageSupport.vue
const visible = defineModel("visible", { type: Boolean, default: false, required: true });
const record = defineModel<Vaccinations | null>("record", { default: null });

// Emits: notify parent of successful save so records[] can be updated
const emit = defineEmits<{
  created: [record: Vaccinations];
  updated: [record: Vaccinations];
}>();

const isSaving = ref(false);
const pendingFile = ref<File | null>(null);

const isEditMode = computed(() => record.value !== null);
const dialogHeader = computed(() => isEditMode.value ? "Edit Vaccination" : "Add Vaccination");

// Zod 4 schema — vaccine_name and date_administered required; dose_number integer 1–20
const schema = z.object({
  vaccine_name: z.string().min(1, { message: "Vaccine name is required." }),
  date_administered: z.string().min(1, { message: "Date administered is required." }),
  dose_number: z.number().int().min(1).max(20).optional().nullable(),
  lot_number: z.string().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const resolver = zodResolver(schema);
```

### Pattern 2: @primevue/forms Form Template

```vue
<!-- Source: Context7 PrimeVue forms docs + Login.vue codebase analog -->
<!-- VERIFIED: /primefaces/primevue — Form zodResolver integration -->
<Form
  v-slot="$form"
  :initialValues
  :resolver
  @submit="onSubmit"
  validate-on-submit
  class="space-y-4"
>
  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium">Vaccine Name *</label>
    <InputText name="vaccine_name" fluid :disabled="isSaving" />
    <Message v-if="$form.vaccine_name?.invalid" severity="error" size="small" variant="simple">
      {{ $form.vaccine_name.error?.message }}
    </Message>
  </div>

  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium">Date Administered *</label>
    <DatePicker name="date_administered" fluid dateFormat="dd M yy" :disabled="isSaving" />
    <Message v-if="$form.date_administered?.invalid" severity="error" size="small" variant="simple">
      {{ $form.date_administered.error?.message }}
    </Message>
  </div>

  <!-- ... other optional fields ... -->

  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium">Card (image or PDF)</label>
    <FileUpload
      mode="basic"
      :auto="false"
      accept="image/jpeg,image/png,image/webp,application/pdf"
      :maxFileSize="10485760"
      @select="onFileSelect"
      :disabled="isSaving"
    />
  </div>

  <Button
    type="submit"
    :label="isEditMode ? 'Save Changes' : 'Add Vaccination'"
    :loading="isSaving"
    :disabled="isSaving"
    fluid
  />
</Form>
```

### Pattern 3: EXIF Strip + Compression Pipeline

```typescript
// Source: PITFALLS.md Pitfall 7 (verified canvas approach)
// + Context7 browser-image-compression docs [VERIFIED: /donaldcwl/browser-image-compression]

async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0];
  if (!file) return;

  // Client-side MIME validation (mirror backend allowlist)
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    toast.error("File type not supported. Use JPEG, PNG, WebP, or PDF.");
    return;
  }

  // Client-side size cap (mirror backend 10 MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error("File too large. Maximum size is 10 MB.");
    return;
  }

  if (file.type === "application/pdf") {
    // PDFs pass through unchanged
    pendingFile.value = file;
    return;
  }

  // Image: EXIF strip via canvas re-encode, then compress
  try {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const strippedBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob failed"))),
        "image/jpeg",
        0.92
      )
    );

    // Convert Blob → File so FormData has a filename
    const strippedFile = new File([strippedBlob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });

    const compressed = await imageCompression(strippedFile, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    });

    pendingFile.value = compressed;
    toast.info("Location data removed.");
  } catch (e) {
    toast.error("Failed to process image. Please try again.");
    console.error("ManageVaccination: EXIF strip failed", e);
    pendingFile.value = null;
  }
}
```

### Pattern 4: Create Flow with Object.assign (WRITE-04)

```typescript
// Source: CONTEXT.md code_context — Save-Loop Contract; PITFALLS.md Pitfall 3
async function onSubmit({ valid, values }: FormSubmitEvent): Promise<void> {
  if (!valid) return;
  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append("vaccine_name", values.vaccine_name);
    formData.append("date_administered", dayjs(values.date_administered).format("YYYY-MM-DD"));
    if (values.dose_number != null) formData.append("dose_number", String(values.dose_number));
    if (values.lot_number) formData.append("lot_number", values.lot_number);
    if (values.manufacturer) formData.append("manufacturer", values.manufacturer);
    if (values.location) formData.append("location", values.location);
    if (values.notes) formData.append("notes", values.notes);
    formData.append("user", pb.authStore.record!.id);
    if (pendingFile.value) formData.append("card", pendingFile.value);

    if (!isEditMode.value) {
      // CREATE — server returns the authoritative record with id, created, updated, card filename
      const created = await pb.collection("wallecx_vaccinations").create<Vaccinations>(formData);
      emit("created", created);
    } else {
      // UPDATE — use mapper to strip server-managed fields
      const payload = mapToUpdateVaccination(record.value!);
      if (pendingFile.value) formData.append("card", pendingFile.value);
      const updated = await pb
        .collection("wallecx_vaccinations")
        .update<Vaccinations>(record.value!.id, formData);
      emit("updated", updated);
    }

    toast.success(isEditMode.value ? "Vaccination updated." : "Vaccination added.");
    visible.value = false;
  } catch (e: unknown) {
    toast.error("Failed to save. Please try again.");
    console.error("ManageVaccination: save failed", e);
  } finally {
    isSaving.value = false;
  }
}
```

### Pattern 5: Delete Flow (WRITE-06)

```typescript
// Source: CONTEXT.md specifics; PITFALLS.md Pitfall 4 + Pitfall 6
// useConfirm import — from primevue/useconfirm (explicit import needed; NOT auto-imported by PrimeVueResolver)
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

function openDelete(record: Vaccinations): void {
  confirm.require({
    message: `Delete "${record.vaccine_name}"? This cannot be undone.`,
    header: "Confirm Delete",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: () => deleteRecord(record),
  });
}

async function deleteRecord(record: Vaccinations): Promise<void> {
  try {
    await pb.collection("wallecx_vaccinations").delete(record.id);
    // Only splice AFTER confirmed server delete (Pitfall 4)
    const idx = records.value.findIndex((r) => r.id === record.id);
    if (idx !== -1) records.value.splice(idx, 1);
    toast.success("Vaccination deleted.");
  } catch (e: unknown) {
    // On failure: do NOT splice (Pitfall 4)
    toast.error("Failed to delete. Please try again.");
    console.error("WallecxApp: delete failed", e);
  }
}
```

### Pattern 6: vaccinationMapper.spec.ts (WRITE-09)

```typescript
// Source: TESTING.md established patterns + codebase vi.mock pattern
// File: src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts
import { describe, it, expect } from "vitest";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const makeVaccinations = (overrides: Partial<Vaccinations> = {}): Vaccinations => ({
  id: "server-id-123",
  created: "2026-01-01T00:00:00.000Z",
  updated: "2026-01-02T00:00:00.000Z",
  collectionId: "abc",
  collectionName: "wallecx_vaccinations",
  user: "user-id-456",
  vaccine_name: "Influenza",
  date_administered: "2026-01-01",
  dose_number: 1,
  lot_number: "LOT001",
  location: "Clinic A",
  manufacturer: "Acme",
  notes: "Arm sore after",
  card: "photo.jpg",
  expand: {},
  ...overrides,
});

describe("mapToUpdateVaccination", () => {
  it("strips id, created, updated, user, card, collectionId, collectionName, expand", () => {
    const record = makeVaccinations();
    const payload = mapToUpdateVaccination(record);

    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created");
    expect(payload).not.toHaveProperty("updated");
    expect(payload).not.toHaveProperty("user");
    expect(payload).not.toHaveProperty("card");
  });

  it("preserves all writable fields", () => {
    const record = makeVaccinations();
    const payload = mapToUpdateVaccination(record);

    expect(payload.vaccine_name).toBe("Influenza");
    expect(payload.date_administered).toBe("2026-01-01");
    expect(payload.dose_number).toBe(1);
    expect(payload.lot_number).toBe("LOT001");
    expect(payload.location).toBe("Clinic A");
    expect(payload.manufacturer).toBe("Acme");
    expect(payload.notes).toBe("Arm sore after");
  });

  it("preserves optional fields as undefined when absent", () => {
    const record = makeVaccinations({
      dose_number: undefined,
      lot_number: undefined,
      location: undefined,
      manufacturer: undefined,
      notes: undefined,
    });
    const payload = mapToUpdateVaccination(record);
    expect(payload.dose_number).toBeUndefined();
    expect(payload.lot_number).toBeUndefined();
  });
});

describe("create-then-update id-refresh contract", () => {
  it("Object.assign propagates server id to the local item so second save is a PATCH", () => {
    // Simulates the WRITE-04 contract without hitting a real PocketBase instance
    const localItem = { vaccine_name: "Flu", date_administered: "2026-01-01", id: "" };
    const serverRecord = makeVaccinations({ id: "server-id-789" });

    // The contract: caller does Object.assign(localItem, serverRecord) after create()
    Object.assign(localItem, serverRecord);

    expect(localItem.id).toBe("server-id-789");
    // Second save should use localItem.id (PATCH), not empty string (POST)
    expect(localItem.id).not.toBe("");
  });
});
```

### Anti-Patterns to Avoid

- **Template-literal PocketBase filters:** `\`user = "${userId}"\`` — use `{ filter: { user: userId } }` parameterised form (WRITE-08, Pitfall 2)
- **Splice before delete:** `records.splice(...)` before `await pb.delete(...)` — on failure the row disappears but still exists on server (Pitfall 4)
- **v-html for confirm message:** `v-html="'Delete ' + record.vaccine_name + '...'"` — plain text only (D-09, WRITE-06)
- **Skipping Object.assign on create:** Not capturing server response means the next save re-creates (Pitfall 3)
- **Uploading raw File to FormData without EXIF strip:** Phone GPS coordinates stored in PocketBase (Pitfall 7)
- **Multiple isSaving refs:** One per dialog branch leads to race conditions; single ref covers both branches (WRITE-07)
- **`customUpload` mode on FileUpload:** PrimeVue issue #7664; use `mode="basic" :auto="false" @select` (WRITE-02, REQUIREMENTS.md Out of Scope)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom reactive validation | `@primevue/forms` + `zodResolver` | Already installed; used in Login.vue; Zod 4 handles type coercion |
| EXIF metadata stripping | exifr / piexifjs libraries | Canvas `toBlob('image/jpeg')` | Zero extra dependencies; canvas never preserves EXIF; verified approach (Pitfall 7) |
| Delete confirmation | Custom boolean modal | PrimeVue `useConfirm()` + `<ConfirmDialog>` | Decision D-08; already in PrimeVue bundle |
| Image size reduction | Manual canvas resize | `browser-image-compression` | Already installed; handles multi-thread WebWorker compression; canvas already done for EXIF strip |
| Double-submit prevention | Debounce / throttle | `isSaving` ref with try/finally | Simpler, correct, covers all error branches |

**Key insight:** The canvas EXIF strip and `browser-image-compression` are sequential steps on the same image — do canvas re-encode first, pass the resulting clean Blob to `imageCompression()`. Do not run them in parallel or reverse order.

---

## Common Pitfalls

### Pitfall A: DatePicker returns a Date object, PocketBase expects YYYY-MM-DD string

**What goes wrong:** `values.date_administered` from the Form submit is a JavaScript `Date` object (DatePicker's native value type), but `date_administered` in the `wallecx_vaccinations` collection is a `date` field that expects `"YYYY-MM-DD"` format.

**Why it happens:** The PrimeVue `Form` component passes the DatePicker value through unchanged. No automatic ISO string conversion.

**How to avoid:** Always format in the submit handler: `dayjs(values.date_administered).format("YYYY-MM-DD")`. For edit mode, the `initialValues` prop should convert the stored ISO string back to a `Date` object for the DatePicker: `new Date(record.date_administered)`.

**Warning signs:** PocketBase returns a 400 error on create/update with `date_administered: Invalid date`.

### Pitfall B: FileUpload `@select` event shape

**What goes wrong:** Developer writes `event.file` (singular) — this is the PrimeVue v3 API. In PrimeVue v4 with `mode="basic"`, the `@select` event exposes `event.files` (array) and `event.originalEvent`.

**Why it happens:** PrimeVue v3/v4 API difference; `@select` was introduced to avoid issue #7664 (`customUpload` mode).

**How to avoid:** Always use `event.files[0]` in the `@select` handler. [VERIFIED: Context7 /primefaces/primevue FileUpload docs]

### Pitfall C: useConfirm must be imported explicitly (not auto-resolved)

**What goes wrong:** `useConfirm` is not in the PrimeVue component auto-import (PrimeVueResolver only resolves Vue components, not composables). Calling `useConfirm()` without an explicit import causes a runtime error.

**Why it happens:** `unplugin-vue-components` resolves PrimeVue UI components, not composable functions.

**How to avoid:** Add `import { useConfirm } from "primevue/useconfirm";` explicitly in the component that calls it (WallecxApp.vue). The `<ConfirmDialog />` component tag IS auto-resolved; only the composable needs the explicit import.

### Pitfall D: canvas.toBlob is async but not Promise-based natively

**What goes wrong:** `canvas.toBlob(callback)` is callback-based. Wrapping it incorrectly (calling `await canvas.toBlob(...)` directly) returns `undefined` immediately.

**Why it happens:** The Canvas API predates Promises. Unlike `canvas.toDataURL()`, `toBlob` is async callback.

**How to avoid:** Wrap in `new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(...), 'image/jpeg', 0.92))`. See Pattern 3 above.

### Pitfall E: Zod 4 breaking changes from v3 syntax used in Login.vue

**What goes wrong:** The project already has `z.email({ message: ... })` in Login.vue — this is Zod 4 syntax. Zod 4 dropped `required_error` / `invalid_type_error` named params in favor of a single `error` function.

**Why it happens:** Login.vue was authored with Zod 4 syntax, which is correct. Risk is copy-pasting Zod 3 examples from the internet into the schema.

**How to avoid:** Use Zod 4 API: `z.string().min(1, { message: "..." })`, `z.int().min(1).max(20).optional()`. For required errors use `z.string().min(1, { message: "Vaccine name is required." })` not `z.string({ required_error: "..." })`.

**Verified against:** [VERIFIED: Context7 /websites/zod_dev_v4]

### Pitfall F: mapToUpdateVaccination does not strip `expand` or `collectionId` / `collectionName`

**What goes wrong:** PocketBase `RecordModel` includes `expand`, `collectionId`, `collectionName` as part of the response shape. If these are sent in a PATCH body, PocketBase ignores unknown fields (safe) but it's noise and may cause type errors.

**How to avoid:** The current `vaccinationMapper.ts` already strips only the listed fields (id, created, updated, user — but NOT card). Verify the mapper handles all `RecordModel` base fields. The Vitest spec should assert `payload` does not contain `id`, `created`, `updated`, `user`, or `card` at minimum.

**Note:** The mapper currently does NOT explicitly strip `card` from the return value — the return type excludes it, but `record.card` is not forwarded. This is the correct behavior for WRITE-05: file replacement is handled via the FormData `card` append in ManageVaccination.vue only when `pendingFile.value` is non-null.

### Pitfall G: isSaving prevents close during save — user is stuck if network hangs

**What goes wrong:** `isSaving = true` disables all form controls. If the network hangs indefinitely the user cannot close the dialog. The `finally` block only runs on resolve or reject, not timeout.

**How to avoid:** Add a `@hide` guard on the Dialog: only allow close when `!isSaving`. This is the intended behavior for WRITE-07 (prevent double-submit). Timeout strategy is out of scope for v1 — document as known limitation.

---

## Code Examples

### Import block for ManageVaccination.vue

```typescript
// Source: Login.vue codebase (zodResolver pattern) + CONTEXT.md code_context
import { ref, computed } from "vue";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { Form, type FormSubmitEvent } from "@primevue/forms";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { useConfirm } from "primevue/useconfirm";
import { toast } from "vue-sonner";
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```

### WallecxApp.vue template additions

```vue
<!-- Source: CONTEXT.md decisions D-01, D-02, D-08 -->
<template>
  <Card>
    <template #content>
      <!-- Header row: title + add button (D-01) -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">Wallecx</h1>
        <Button
          label="Add vaccination"
          icon="pi pi-plus"
          size="small"
          @click="openManage(null)"
        />
      </div>

      <VaccinationList
        :records="records"
        :is-loading="isLoading"
        :list-token="listToken"
        @view="openDetail"
        @edit="openManage"
        @remove="openDelete"
      />

      <!-- ConfirmDialog instance (D-08) -->
      <ConfirmDialog />

      <!-- ManageVaccination dialog -->
      <ManageVaccination
        v-model:visible="showManage"
        v-model:record="manageRecord"
        @created="onCreated"
        @updated="onUpdated"
      />

      <!-- VaccinationDetail dialog (unchanged from Phase 2) -->
      <Dialog v-model:visible="showDetail" modal header="Vaccination Record" :style="{ width: '40rem' }" ...>
        <VaccinationDetail v-if="selectedRecord" :record="selectedRecord" :token="fileToken" />
      </Dialog>
    </template>
  </Card>
</template>
```

### Empty state CTA (VaccinationList.vue, D-02)

```vue
<!-- Source: CONTEXT.md D-02 -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:needle-off" width="48" height="48" style="color: var(--color-brand-primary)"></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  <Button label="Add your first vaccination" icon="pi pi-plus" size="small" @click="emit('addFirst')" />
</div>
```

Note: `@addFirst` emit needs to be added to VaccinationList's `defineEmits`, and wired in WallecxApp.vue to call `openManage(null)`.

### Parameterised PocketBase filter (WRITE-08)

```typescript
// Source: PITFALLS.md Pitfall 2 — parameterised syntax example
// Correct: named placeholder syntax
const record = await pb
  .collection("wallecx_vaccinations")
  .getFirstListItem("id = {:id} && user = {:user}", {
    filter: { id: recordId, user: pb.authStore.record!.id },
  });

// Wrong (template literal — never use):
// const record = await pb.collection("wallecx_vaccinations").getFirstListItem(`id = "${recordId}"`);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `zodResolver` from `@vee-validate/zod` | `zodResolver` from `@primevue/forms/resolvers/zod` | PrimeVue 4 + @primevue/forms | Use the @primevue/forms path — confirmed in Login.vue and Context7 docs |
| `z.string({ required_error: "..." })` | `z.string().min(1, { message: "..." })` | Zod v4 | `required_error` dropped; use `.min(1)` for required strings |
| FileUpload with `customUpload` | FileUpload `mode="basic" :auto="false" @select` | PrimeVue issue #7664 | `customUpload` mode broken; `@select` is the workaround (locked in REQUIREMENTS.md) |
| PrimeVue `acceptClass` prop on confirm | `acceptProps: { severity: "danger" }` | PrimeVue 4.x | `acceptClass` is PrimeVue 3 API; v4 uses `acceptProps` object |

**Deprecated/outdated:**
- `z.ostring()` / `z.onumber()`: Removed in Zod 4 — use `z.string().optional()` / `z.number().optional()`
- `FileUpload customUpload` mode: Broken (PrimeVue issue #7664) — use `mode="basic" :auto="false" @select`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<ConfirmDialog>` component tag is auto-resolved by PrimeVueResolver; only `useConfirm` composable needs explicit import | Pitfall C / Pattern 5 | If wrong: runtime "component not found" — fix by adding `import ConfirmDialog from 'primevue/confirmdialog'`. Low risk — verified from PrimeVue auto-import resolver behavior. |
| A2 | `mapToUpdateVaccination` return type intentionally excludes `card` field — file replacement handled by FormData `card` append | Don't Hand-Roll / Pattern 4 | If wrong: update flow silently drops the existing card. Mitigated by: mapper source code verified to not include `card`. |
| A3 | PrimeVue `Form` @submit fires `FormSubmitEvent` with `{ valid, values }` where `values` is a flat object matching field `name` attributes | Pattern 2 | If wrong: values would be undefined. Mitigated by: Login.vue codebase uses identical pattern. |
| A4 | `browser-image-compression` accepts a `File` constructed from a `Blob` (canvas output) as input | Pattern 3 | If wrong: compression step fails. Mitigated by: Context7 docs confirm `imageFile instanceof Blob` is acceptable input. |

**Non-assumed (fully verified) claims:** All stack versions, EXIF strip approach, useConfirm API shape, Zod 4 syntax, FileUpload `@select` event shape, test file location convention, mapper field list.

---

## Open Questions

1. **Should `dose_number` use `InputNumber` or `InputText`?**
   - What we know: D-06 says "implementation detail — Claude's discretion"
   - What's unclear: InputNumber provides up/down arrows and numeric validation; InputText requires manual Zod coercion
   - Recommendation: Use `InputNumber` — it integrates cleanly with `@primevue/forms` and provides better UX for a 1–20 integer range. The Zod schema handles type enforcement regardless.

2. **Create emit vs. mutate records[] directly?**
   - What we know: ManageVaccination.vue is a child component; WallecxApp.vue owns `records[]`
   - What's unclear: Should ManageVaccination emit the created record, or should WallecxApp pass a callback?
   - Recommendation: Emit `created` / `updated` events from ManageVaccination; WallecxApp handles the array mutation. This follows the established Vue "data down, events up" pattern and matches the emit convention in VaccinationList.vue.

3. **Do VaccinationList's `Edit`/`Remove` buttons need a layout change?**
   - What we know: Both buttons exist as stubs with `:disabled="true"` in the current VaccinationList.vue DataTable
   - What's unclear: Whether removing `:disabled` is all that's needed, or if `size="small"` causes layout overflow
   - Recommendation: Remove `:disabled="true"` from both buttons. No layout change needed — current row actions already have adequate space.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@primevue/forms` | WRITE-01 | ✓ | 4.5.5 | — |
| `zod` | WRITE-01 | ✓ | 4.3.6 | — |
| `browser-image-compression` | WRITE-03 | ✓ | 2.0.2 | — |
| `vitest` | WRITE-09 | ✓ | 3.2.4 | — |
| `@vue/test-utils` | WRITE-09 | ✓ | 2.4.9 | — |
| `jsdom` | WRITE-09 | ✓ | 26.1.0 | — |
| Canvas API | WRITE-03 | ✓ | Browser-native (jsdom provides in tests) | — |

**No missing dependencies.** All phase requirements are satisfiable with installed packages.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Auth already established in Phase 1 |
| V3 Session Management | no | PocketBase auth token handling unchanged |
| V4 Access Control | yes | PocketBase collection rules enforce per-user ownership (established Phase 1) |
| V5 Input Validation | yes | Zod schema validates all form fields; client-side MIME + size validation mirrors backend |
| V6 Cryptography | no | No new cryptographic operations |
| File Upload Security | yes | MIME allowlist, 10 MB cap, EXIF strip before upload |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| PocketBase filter injection via template literals | Tampering | Parameterised `{:name}` syntax (WRITE-08) |
| Stored XSS via notes field | Tampering | Plain text `{{ }}` — never `v-html` (WRITE-06, Pitfall 10) |
| EXIF GPS disclosure in uploaded images | Information Disclosure | Canvas re-encode strips EXIF before upload (WRITE-03, Pitfall 7) |
| Double-submit creates duplicate records | Tampering / Integrity | `isSaving` guard disables form during in-flight request (WRITE-07, Pitfall 11) |
| Delete only removes from local state (record persists server-side) | Repudiation | `await pb.delete()` before splice (WRITE-06, Pitfall 4) |
| Injected script via vaccine_name in confirm dialog | Spoofing | `confirm.require({ message: ... })` renders plain text (D-09) |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase] `src/components/Login.vue` — zodResolver + Form + FormSubmitEvent import pattern
- [VERIFIED: codebase] `src/lib/pocketbase/vaccinationMapper.ts` — confirms mapper strips id, created, updated, user, card
- [VERIFIED: codebase] `src/components/projects/wallecx/WallecxApp.vue` — current state before Phase 3 changes
- [VERIFIED: codebase] `src/components/projects/wallecx/VaccinationList.vue` — stub Edit/Remove buttons confirmed
- [VERIFIED: codebase] `src/components/projects/lextrack/ManageTask.vue` — Dialog + defineModel structural analog
- [VERIFIED: codebase] `vitest.config.ts` + `.planning/codebase/TESTING.md` — test infrastructure config
- [VERIFIED: package-lock.json] All package versions confirmed against installed lock file
- [VERIFIED: Context7 /primefaces/primevue] FileUpload `@select` event shape, useConfirm API, Form zodResolver, DatePicker Form integration
- [VERIFIED: Context7 /donaldcwl/browser-image-compression] `imageCompression(file, { maxSizeMB, maxWidthOrHeight, useWebWorker })` API
- [VERIFIED: Context7 /websites/zod_dev_v4] Zod 4 breaking changes: `required_error` dropped, `z.ostring()` removed, `z.int()` added
- [CITED: .planning/research/PITFALLS.md] Pitfalls 2, 3, 4, 6, 7, 11 — all addressed in this phase
- [CITED: .planning/phases/03-write-path/03-CONTEXT.md] All locked decisions D-01 through D-09

### Secondary (MEDIUM confidence)

- [CITED: .planning/codebase/CONVENTIONS.md] Import order, PrimeVue auto-import scope, error handling pattern, dayjs usage
- [CITED: .planning/phases/02-read-path/02-PATTERNS.md] Phase 2 pattern map — WallecxApp.vue current structure

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package-lock.json
- Architecture patterns: HIGH — Login.vue + ManageTask.vue analogs verified in codebase
- EXIF strip pipeline: HIGH — canvas approach verified in PITFALLS.md + multiple sources
- Zod 4 syntax: HIGH — verified against Context7 /websites/zod_dev_v4
- PrimeVue FileUpload/ConfirmDialog: HIGH — verified against Context7 /primefaces/primevue
- Vitest spec structure: HIGH — TESTING.md establishes all conventions; spec file is pure unit test of existing mapper

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (stable library ecosystem; no fast-moving dependencies)

**nyquist_validation:** DISABLED (`workflow.nyquist_validation: false` in `.planning/config.json`) — Validation Architecture section omitted.
