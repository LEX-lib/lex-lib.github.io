# Phase 3: Write Path (Create / Edit / Delete with Attachments) - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 5 (3 new, 2 modified)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/ManageVaccination.vue` | component (dialog) | request-response (CRUD) | `src/components/Login.vue` + `src/components/projects/lextrack/ManageTask.vue` | exact (composite) |
| `src/components/projects/wallecx/WallecxApp.vue` | component (app shell) | CRUD + event-driven | `src/components/projects/wallecx/WallecxApp.vue` (self — modifications) | exact |
| `src/components/projects/wallecx/VaccinationList.vue` | component (list/table) | request-response | `src/components/projects/wallecx/VaccinationList.vue` (self — modifications) | exact |
| `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` | test | transform | `src/lib/pocketbase/vaccinationMapper.ts` (unit under test) + `src/lib/pocketbase/dsuTaskMapper.ts` (mapper structural analog) | role-match |
| `src/lib/pocketbase/vaccinationMapper.ts` | utility (mapper) | transform | `src/lib/pocketbase/dsuTaskMapper.ts` | exact |

---

## Pattern Assignments

### `src/components/projects/wallecx/ManageVaccination.vue` (component, request-response / CRUD)

**Analogs:** `src/components/Login.vue` (Form + zodResolver pattern) and `src/components/projects/lextrack/ManageTask.vue` (Dialog shell + defineModel pattern)

This is the primary new file. It is a composite of two analogs: Login.vue supplies the `@primevue/forms` + `zodResolver` validation pattern; ManageTask.vue (and ManageSupport.vue) supply the `defineModel("visible")` + PrimeVue `Dialog` shell.

---

**Imports pattern** — from `src/components/Login.vue` lines 3-8 and `src/components/projects/wallecx/WallecxApp.vue` lines 2-5:

```typescript
import { ref, computed } from "vue";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { Form, type FormSubmitEvent } from "@primevue/forms";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { toast } from "vue-sonner";
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```

Note: `useConfirm` is NOT needed in ManageVaccination.vue — it lives in WallecxApp.vue. `useConfirm` must be imported explicitly: `import { useConfirm } from "primevue/useconfirm"` (NOT auto-imported by PrimeVueResolver).

---

**Dialog shell + defineModel pattern** — from `src/components/projects/lextrack/ManageTask.vue` lines 5-14, adapted from `src/components/projects/lextrack/ManageSupport.vue` lines 5-12:

```typescript
// ManageTask.vue lines 5-13 — defineModel pattern for Dialog visibility + record
const visible = defineModel("visible", {
  type: Boolean,
  default: false,
  required: true,
});

const task = defineModel<AddDsuTask>("task", {
  required: true,
});
```

For ManageVaccination.vue, the record model is nullable (create vs. edit mode):

```typescript
// Adapted: record is null for create, Vaccinations object for edit
const visible = defineModel("visible", { type: Boolean, default: false, required: true });
const record = defineModel<Vaccinations | null>("record", { default: null });

const isEditMode = computed(() => record.value !== null);
const dialogHeader = computed(() => isEditMode.value ? "Edit Vaccination" : "Add Vaccination");
```

---

**Dialog template shell** — from `src/components/projects/lextrack/ManageTask.vue` lines 27-66:

```vue
<!-- ManageTask.vue lines 27-66 — Dialog shell; copy :style and modal prop -->
<Dialog
  modal
  v-model:visible="visible"
  header="Update Task"
  @close="visible = false"
  :style="{ width: '40vw' }"
  position="right"
>
  <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
    <!-- fields -->
    <Button label="Save Task" @click="updateTask" class="w-full bg-indigo-600 hover:bg-indigo-700" />
  </div>
</Dialog>
```

ManageVaccination.vue uses `:header="dialogHeader"` (computed) and a `<Form>` block instead of direct v-model fields. The Dialog header changes between "Add Vaccination" and "Edit Vaccination" based on `record` prop.

---

**Form + zodResolver + validation error pattern** — from `src/components/Login.vue` lines 41-56 (script) and lines 78-144 (template):

```typescript
// Login.vue lines 41-56 — zodResolver + initialValues setup
const initialValues = reactive({
  email: "",
  password: "",
});

const resolver = ref(
  zodResolver(
    z.object({
      email: z.email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
      password: z.string().min(1, { message: "Password is required." }),
    }),
  ),
);
```

```vue
<!-- Login.vue lines 78-144 — Form component, v-slot $form, field + Message pattern -->
<Form
  v-slot="$form"
  :initialValues
  :resolver
  @submit="login"
  class="space-y-5"
  validate-on-submit
>
  <div class="flex flex-col gap-1">
    <InputText name="email" id="email" fluid />
    <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
      {{ $form.email.error?.message }}
    </Message>
  </div>

  <Button type="submit" label="Sign in" icon="pi pi-sign-in" class="w-full" />
</Form>
```

Copy this pattern for all 7 vaccination fields. Zod 4 syntax: `z.string().min(1, { message: "..." })` for required strings; `z.number().int().min(1).max(20).optional().nullable()` for dose_number.

---

**isSaving guard + try/finally pattern** — from `src/components/projects/wallecx/WallecxApp.vue` lines 16-29 (onMounted fetch pattern):

```typescript
// WallecxApp.vue lines 16-29 — isLoading guard + try/catch/finally + toast pattern
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
    listToken.value = await pb.files.getToken();
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});
```

Apply the same `isSaving.value = true` / `try` / `catch` / `finally { isSaving.value = false }` structure to the `onSubmit` handler in ManageVaccination.vue.

---

**Create flow with Object.assign (WRITE-04 contract):**

The contract is documented in CONTEXT.md code_context (Save-Loop Contract). No existing codebase analog — this pattern is new to Phase 3. After `await pb.collection(...).create<Vaccinations>(formData)`, call `Object.assign(localItem, created)` so the local array item gains `id`, `created`, `updated`, and the server-renamed `card` filename. Without this, a second save re-creates instead of PATCHing.

---

**Update flow with mapper (WRITE-05 contract):**

```typescript
// vaccinationMapper.ts lines 1-21 — use mapToUpdateVaccination before every PATCH
const payload = mapToUpdateVaccination(record.value!);
await pb.collection("wallecx_vaccinations").update<Vaccinations>(record.value!.id, payload);
```

---

**EXIF strip pipeline (WRITE-03):**

No codebase analog. Browser Canvas API + browser-image-compression are both available but unused so far. The pipeline is: `canvas.toBlob()` (callback-based — must wrap in `new Promise<Blob>`) → `imageCompression(strippedFile, { maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true })` → `toast.info("Location data removed.")`. PDFs bypass entirely. Full pattern is in RESEARCH.md Pattern 3.

---

### `src/components/projects/wallecx/WallecxApp.vue` (component, CRUD + event-driven — MODIFIED)

**Analog:** Self (current file) — modifications only.

**Current state** — `src/components/projects/wallecx/WallecxApp.vue` lines 1-80 (full file):

The file currently has:
- `records`, `isLoading`, `selectedRecord`, `showDetail`, `fileToken`, `listToken` refs (lines 8-13)
- `onMounted` fetch block with try/catch/finally (lines 16-29)
- `openDetail()` async handler (lines 31-42)
- Template: `<Card>` shell with header row + `<VaccinationList>` + `<Dialog>` for detail view (lines 45-77)
- Stub handlers `@edit="() => {}"` and `@remove="() => {}"` on VaccinationList (lines 58-59)

**Additions required:**

1. New refs to add after line 13:
```typescript
const showManage = ref(false);
const manageRecord = ref<Vaccinations | null>(null);
```

2. `openManage()` function to add after `openDetail()`:
```typescript
function openManage(record: Vaccinations | null): void {
  manageRecord.value = record;
  showManage.value = true;
}
```

3. `openDelete()` + `deleteRecord()` functions — see Shared Patterns > Delete / useConfirm below.

4. `onCreated()` / `onUpdated()` event handlers:
```typescript
function onCreated(created: Vaccinations): void {
  records.value.push(created);
}

function onUpdated(updated: Vaccinations): void {
  const idx = records.value.findIndex((r) => r.id === updated.id);
  if (idx !== -1) records.value[idx] = updated;
}
```

5. Template additions (replace existing stub `@edit` / `@remove` at line 58-59):
```vue
<!-- Replace line 58-59 stubs -->
@edit="openManage"
@remove="openDelete"
```

6. Add to template after `<VaccinationList>` block:
```vue
<!-- D-08: single ConfirmDialog instance -->
<ConfirmDialog />

<!-- ManageVaccination dialog -->
<ManageVaccination
  v-model:visible="showManage"
  v-model:record="manageRecord"
  @created="onCreated"
  @updated="onUpdated"
/>
```

7. Add "Add vaccination" button to existing header `<div>` (lines 48-52):
```vue
<!-- Replace lines 48-52 header div -->
<div class="flex items-center justify-between mb-4">
  <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">Wallecx</h1>
  <Button label="Add vaccination" icon="pi pi-plus" size="small" @click="openManage(null)" />
</div>
```

---

### `src/components/projects/wallecx/VaccinationList.vue` (component, request-response — MODIFIED)

**Analog:** Self (current file) — minimal modifications.

**Current state** — `src/components/projects/wallecx/VaccinationList.vue`:
- `defineEmits` already declares `edit` and `remove` (lines 14-16) — no change needed
- Edit button at line 95-99 has `:disabled="true"` — remove this prop
- Remove button at lines 100-105 has `:disabled="true"` — remove this prop
- Empty state at lines 53-60 shows static message — add CTA button per D-02

**Modifications required:**

1. Remove `:disabled="true"` from Edit button (line 97):
```vue
<!-- Before (line 95-99): -->
<Button size="small" severity="secondary" label="Edit" :disabled="true" @click="emit('edit', data)" />

<!-- After: -->
<Button size="small" severity="secondary" label="Edit" @click="emit('edit', data)" />
```

2. Remove `:disabled="true"` from Remove button (line 100-105):
```vue
<!-- Before (lines 100-105): -->
<Button size="small" severity="danger" label="Remove" :disabled="true" @click="emit('remove', data)" />

<!-- After: -->
<Button size="small" severity="danger" label="Remove" @click="emit('remove', data)" />
```

3. Empty state CTA (lines 53-60) — add `addFirst` emit + button:
```typescript
// Add to defineEmits (line 14):
const emit = defineEmits<{
  view: [record: Vaccinations];
  edit: [record: Vaccinations];
  remove: [record: Vaccinations];
  addFirst: [];  // NEW — D-02 empty state CTA
}>();
```

```vue
<!-- Replace empty state div (lines 53-60) with: -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:needle-off" width="48" height="48" style="color: var(--color-brand-primary)"></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  <Button label="Add your first vaccination" icon="pi pi-plus" size="small" @click="emit('addFirst')" />
</div>
```

4. Wire `addFirst` in WallecxApp.vue: `@add-first="openManage(null)"` on `<VaccinationList>`.

---

### `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` (test, transform — NEW)

**Analog:** `src/lib/pocketbase/vaccinationMapper.ts` (unit under test). No existing test files in the codebase — this is the first test (WRITE-09).

**Test location:** `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts`

Confirmed by vitest.config.ts — environment is `jsdom`, root is project root. Vitest picks up `**/*.spec.ts` files by default.

**Imports pattern:**

```typescript
import { describe, it, expect } from "vitest";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```

Path alias `@` resolves to `src/` — confirmed by vite.config.ts alias. No mocking of `pb` is needed since `mapToUpdateVaccination` is a pure function with no side effects.

**Test fixture factory pattern** (no existing analog — establish pattern here):

```typescript
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
```

**Three test suites required:**
1. `mapToUpdateVaccination` strips server-managed fields (`id`, `created`, `updated`, `user`, `card`)
2. `mapToUpdateVaccination` preserves all writable fields
3. Create-then-update `Object.assign` id-refresh contract (pure simulation — no pb mock needed)

---

### `src/lib/pocketbase/vaccinationMapper.ts` (utility/mapper, transform — UNCHANGED)

**Analog:** `src/lib/pocketbase/dsuTaskMapper.ts` (lines 1-14) — same pattern.

```typescript
// dsuTaskMapper.ts lines 3-14 — mapper pattern (exact match)
export function mapToUpdateTask(task: DsuTasks): {
  title: string;
  jira_link?: string;
  description?: string;
} {
  return {
    title: task.title,
    jira_link: task.jira_link,
    description: task.description,
  };
}
```

`vaccinationMapper.ts` already implements this pattern correctly (lines 1-21). No changes needed. The spec tests the existing function as-is.

---

## Shared Patterns

### Dialog Shell (PrimeVue Dialog + defineModel)
**Source:** `src/components/projects/lextrack/ManageTask.vue` lines 5-13 and lines 27-66
**Apply to:** `ManageVaccination.vue`

```typescript
// ManageTask.vue lines 5-13
const visible = defineModel("visible", {
  type: Boolean,
  default: false,
  required: true,
});
const task = defineModel<AddDsuTask>("task", { required: true });
```

```vue
<!-- ManageTask.vue lines 27-34 — Dialog shell -->
<Dialog
  modal
  v-model:visible="visible"
  header="Update Task"
  @close="visible = false"
  :style="{ width: '40vw' }"
  position="right"
>
```

For ManageVaccination.vue: use `:header="dialogHeader"` (computed string), omit `position="right"` for a centered modal, add `@hide` guard if needed for isSaving.

---

### Form Validation (@primevue/forms + zodResolver)
**Source:** `src/components/Login.vue` lines 3-8 (imports), lines 41-56 (script), lines 78-144 (template)
**Apply to:** `ManageVaccination.vue`

```typescript
// Login.vue lines 3-8 — exact imports to replicate
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";
import { Form, type FormSubmitEvent } from "@primevue/forms";
```

```vue
<!-- Login.vue lines 78-85 — Form component API -->
<Form
  v-slot="$form"
  :initialValues
  :resolver
  @submit="login"
  class="space-y-5"
  validate-on-submit
>
```

```vue
<!-- Login.vue lines 86-105 — field + error message pattern to replicate per field -->
<div class="flex flex-col gap-1">
  <InputText name="email" id="email" fluid />
  <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
    {{ $form.email.error?.message }}
  </Message>
</div>
```

---

### Toast Notifications (vue-sonner)
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 2 and 24; `src/components/projects/wallecx/VaccinationList.vue` lines 1-4
**Apply to:** `ManageVaccination.vue`, `WallecxApp.vue`

```typescript
// WallecxApp.vue line 2 — import pattern
import { toast } from "vue-sonner";

// Usage patterns in this codebase:
toast.error("Failed to load vaccination records.");  // catch blocks
toast.success("Task is updated successfully!");       // ManageTask.vue line 17
toast.info("Location data removed.");                // new in Phase 3 (EXIF strip)
```

---

### Delete / useConfirm Pattern
**Source:** No existing codebase analog. Must use PrimeVue docs pattern (confirmed in RESEARCH.md).
**Apply to:** `WallecxApp.vue`
**Note:** `useConfirm` requires explicit import — NOT auto-resolved by PrimeVueResolver.

```typescript
// Explicit import required in WallecxApp.vue
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
    // Splice ONLY after confirmed server delete (Pitfall 4)
    const idx = records.value.findIndex((r) => r.id === record.id);
    if (idx !== -1) records.value.splice(idx, 1);
    toast.success("Vaccination deleted.");
  } catch (e: unknown) {
    // Do NOT splice on failure (Pitfall 4)
    toast.error("Failed to delete. Please try again.");
    console.error("WallecxApp: delete failed", e);
  }
}
```

`<ConfirmDialog />` tag IS auto-resolved by PrimeVueResolver — add once to WallecxApp.vue template.

---

### Error Handling (try/catch/finally)
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 16-29
**Apply to:** All async handlers in `ManageVaccination.vue` and `WallecxApp.vue`

```typescript
// WallecxApp.vue lines 16-29 — pattern to copy for all async operations
isLoading.value = true;   // or isSaving.value = true
try {
  // await pb operation
} catch (e: unknown) {
  toast.error("Human-readable error message.");
  console.error("ComponentName: operationName failed", e);
} finally {
  isLoading.value = false;  // or isSaving.value = false
}
```

The `finally` block ensures the guard is always reset even on network errors. `e: unknown` type annotation is required (no `any`).

---

### PocketBase parameterised filters (WRITE-08)
**Source:** `src/lib/pocketbase/index.ts` + RESEARCH.md Pattern 6
**Apply to:** Any new filter strings in `WallecxApp.vue`

```typescript
// Correct — parameterised {: } syntax
const record = await pb
  .collection("wallecx_vaccinations")
  .getFirstListItem("id = {:id} && user = {:user}", {
    filter: { id: recordId, user: pb.authStore.record!.id },
  });

// WRONG — never use template literals for filters (Pitfall 2 / WRITE-08)
// await pb.collection("wallecx_vaccinations").getFirstListItem(`user = "${userId}"`);
```

---

### PocketBase client import
**Source:** `src/lib/pocketbase/index.ts` lines 1-5; used in `WallecxApp.vue` line 4 and `VaccinationList.vue` line 3
**Apply to:** `ManageVaccination.vue`

```typescript
// lib/pocketbase/index.ts lines 1-5 — singleton client
import PocketBase from "pocketbase";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
export const pb = new PocketBase(baseUrl);

// Import in components:
import { pb } from "@/lib/pocketbase";
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| EXIF strip + canvas pipeline (within ManageVaccination.vue) | utility (inline) | file-I/O | No file upload or canvas usage exists anywhere in the codebase yet; browser-image-compression is installed but unused |
| `src/lib/pocketbase/__tests__/` directory | test | — | No `__tests__` directories exist yet; vitest.config.ts confirms jsdom environment is configured but zero test files exist |

For both: use patterns from RESEARCH.md directly (Pattern 3 for EXIF pipeline, Pattern 6 for spec structure).

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/components/projects/lextrack/`, `src/components/Login.vue`, `src/lib/pocketbase/`, `src/types/`
**Files scanned:** 12
**Pattern extraction date:** 2026-05-12
