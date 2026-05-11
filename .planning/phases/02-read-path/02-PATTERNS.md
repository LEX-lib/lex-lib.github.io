# Phase 2: Read Path (List + Detail + Attachment Preview) - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 5
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/projects/wallecx/WallecxApp.vue` | component (shell) | request-response | `src/components/projects/wallecx/WallecxApp.vue` (self) | exact — extend in place |
| `src/components/projects/wallecx/VaccinationList.vue` | component | CRUD read + event-driven | `src/components/projects/lextrack/ActivityCard.vue` | role-match (list + emit pattern) |
| `src/components/projects/wallecx/VaccinationDetail.vue` | component (dialog content) | request-response | `src/components/projects/lextrack/ManageTask.vue` | role-match (Dialog wrapper + read-only fields) |
| `src/components/projects/wallecx/AttachmentPreview.vue` | component (utility) | file-I/O + event-driven | `src/components/projects/larga/LargaApp.vue` | partial-match (dynamic import in onMounted; adapt to defineAsyncComponent) |
| `index.html` | config | — | `index.html` (self) | exact — additive CSP change only |

---

## Pattern Assignments

### `src/components/projects/wallecx/WallecxApp.vue` (shell component, request-response)

**Analog:** `src/components/projects/wallecx/WallecxApp.vue` (the file itself — extend, do not replace the existing structure)

**Existing imports block** (lines 1–5):
```typescript
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```
Add to this block: `import type { Vaccinations }` is already there. Add child component imports explicitly even though they are auto-resolved, for clarity (convention from `src/views/LexTrackView.vue` style — see CONVENTIONS.md line 65).

**Existing state pattern** (lines 7–9) — preserve and extend:
```typescript
// --- STATE ---
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);
// ADD: dialog state refs
const selectedRecord = ref<Vaccinations | null>(null);
const showDetail = ref(false);
const fileToken = ref<string>("");
const listToken = ref<string>("");
```

**Existing fetch pattern** (lines 12–24) — preserve exactly, extend to also fetch listToken:
```typescript
// --- LOGIC ---
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
    // ADD: list-level token for thumbnail display (Pitfall 1 resolution)
    listToken.value = await pb.files.getToken();
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});
```

**New openDetail function** — add after the onMounted block:
```typescript
async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment.");
      console.error("WallecxApp: getToken failed", e);
    }
  }
  showDetail.value = true;
}
```

**Existing template structure** (lines 27–41) — replace the inner `<div>` content only; preserve the `<Card #content>` wrapper and the `<h1>` header block:
```vue
<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">
          Wallecx
        </h1>
      </div>

      <!-- REPLACE the placeholder <div> with: -->
      <VaccinationList
        :records="records"
        :is-loading="isLoading"
        :list-token="listToken"
        @view="openDetail"
        @edit="() => {}"
        @remove="() => {}"
      />

      <Dialog
        v-model:visible="showDetail"
        modal
        :style="{ width: '40vw' }"
        header="Vaccination Record"
        @hide="selectedRecord = null"
      >
        <VaccinationDetail
          v-if="selectedRecord"
          :record="selectedRecord"
          :token="fileToken"
        />
      </Dialog>
    </template>
  </Card>
</template>
```

**Dialog pattern source** — `src/components/projects/lextrack/ManageTask.vue` lines 27–66:
```vue
<Dialog
  modal
  v-model:visible="visible"
  header="Update Task"
  @close="visible = false"
  :style="{ width: '40vw' }"
  position="right"
>
```
Note: WallecxApp.vue uses `v-model:visible="showDetail"` (local boolean ref) rather than `defineModel` — this is correct because `WallecxApp` is the owner, not a child receiving visibility from a parent.

---

### `src/components/projects/wallecx/VaccinationList.vue` (component, CRUD read + event-driven)

**Analog:** `src/components/projects/lextrack/ActivityCard.vue`

**Imports pattern** — follow ActivityCard.vue lines 1–4 import order; add dayjs and pb:
```typescript
import { computed } from "vue";
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```
Do NOT import DataTable, Column, Skeleton, or Button — they are auto-imported via PrimeVueResolver.

**Props + emits pattern** — from ActivityCard.vue lines 10–19 (tuple-style defineEmits):
```typescript
const props = defineProps<{
  records: Vaccinations[];
  isLoading: boolean;
  listToken: string;
}>();

const emit = defineEmits<{
  view: [record: Vaccinations];
  edit: [record: Vaccinations];
  remove: [record: Vaccinations];
}>();
```

**Empty state pattern** — from ActivityCard.vue lines 57–60 (card-internal empty state), adapted to standalone centered layout:
```vue
<!-- ActivityCard.vue analog (lines 57-60): -->
<div class="flex justify-center my-1" v-if="section.length === 0">
  <span class="mr-2 text-sm font-medium">No Records</span>
</div>

<!-- VaccinationList adaptation: -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-10 gap-2">
  <iconify-icon icon="mdi:needle-off" width="48" height="48" style="color: var(--color-brand-primary)" />
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
</div>
```

**iconify-icon pattern** — from ActivityCard.vue lines 44–49:
```vue
<iconify-icon
  icon="mdi:add"
  width="16"
  height="16"
></iconify-icon>
```

**Row action buttons with emit** — from ActivityCard.vue lines 94–128 (edit + remove emit pattern):
```typescript
// ActivityCard.vue:
const edit = (index: number) => emit("update", index);
const remove = (index: number) => emit("remove", index);
```
```vue
<!-- Adapted for VaccinationList row actions: -->
<Button size="small" label="View" @click="emit('view', data)" />
<Button size="small" severity="secondary" label="Edit" :disabled="true" class="ml-1" @click="emit('edit', data)" />
<Button size="small" severity="danger" label="Remove" :disabled="true" class="ml-1" @click="emit('remove', data)" />
```

**Skeleton rows** — no direct codebase analog; use the RESEARCH.md Pattern 1 directly (verified against PrimeVue DataTable docs):
```typescript
const skeletonRows = Array.from({ length: 3 }, (_, i) => ({ id: String(i) }));
```
```vue
<DataTable v-if="isLoading" :value="skeletonRows" table-style="min-width: 30rem">
  <Column header="Card" style="width: 4rem">
    <template #body><Skeleton shape="rectangle" width="3rem" height="3rem" /></template>
  </Column>
  <Column header="Vaccine"><template #body><Skeleton /></template></Column>
  <Column header="Date"><template #body><Skeleton /></template></Column>
  <Column header="Dose"><template #body><Skeleton /></template></Column>
  <Column header=""><template #body><Skeleton width="5rem" /></template></Column>
</DataTable>
```

**Thumbnail URL helper** — use `pb.files.getURL()` with token (Pitfall 1 resolution):
```typescript
function thumbUrl(record: Vaccinations): string {
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
```

**Data state DataTable** — Column #body slot pattern (no codebase analog for DataTable; follow RESEARCH.md Pattern 1):
```vue
<DataTable v-else :value="records" table-style="min-width: 30rem">
  <Column header="Card" style="width: 4rem">
    <template #body="{ data }">
      <img
        v-if="data.card"
        :src="thumbUrl(data)"
        :alt="`${data.vaccine_name} card thumbnail`"
        class="w-12 h-12 object-cover rounded"
      />
      <iconify-icon v-else icon="mdi:image-off" width="32" height="32" />
    </template>
  </Column>
  <Column field="vaccine_name" header="Vaccine" />
  <Column header="Date">
    <template #body="{ data }">{{ displayDate(data.date_administered) }}</template>
  </Column>
  <Column header="Dose">
    <template #body="{ data }">{{ data.dose_number ?? '—' }}</template>
  </Column>
  <Column header="">
    <template #body="{ data }">
      <Button size="small" label="View" @click="emit('view', data)" />
      <Button size="small" severity="secondary" label="Edit" :disabled="true" class="ml-1" @click="emit('edit', data)" />
      <Button size="small" severity="danger" label="Remove" :disabled="true" class="ml-1" @click="emit('remove', data)" />
    </template>
  </Column>
</DataTable>
```

---

### `src/components/projects/wallecx/VaccinationDetail.vue` (component, request-response)

**Analog:** `src/components/projects/lextrack/ManageTask.vue`

**ManageTask.vue imports + model pattern** (lines 1–13):
```typescript
import type { AddDsuTask } from "@/types/lextrack/dsu_tasks/types";
import { toast } from "vue-sonner";

const visible = defineModel("visible", { type: Boolean, default: false, required: true });
const task = defineModel<AddDsuTask>("task", { required: true });
```
VaccinationDetail.vue does NOT use `defineModel` — it receives `record` and `token` as read-only props (it is a pure display component inside a Dialog, not a dialog manager). Use `defineProps` instead:
```typescript
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const props = defineProps<{
  record: Vaccinations;
  token: string;
}>();
```

**ManageTask.vue Dialog body layout pattern** (lines 26–66):
```vue
<Dialog modal v-model:visible="visible" header="Update Task" :style="{ width: '40vw' }" position="right">
  <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
    <!-- fields -->
  </div>
</Dialog>
```
VaccinationDetail.vue does NOT include the `<Dialog>` wrapper — the dialog lives in `WallecxApp.vue`. VaccinationDetail is the dialog body only:
```vue
<template>
  <div class="space-y-4">
    <!-- Each field as a labeled read-only row -->
    <div>
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Vaccine</p>
      <p>{{ record.vaccine_name }}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Date Administered</p>
      <p>{{ displayDate(record.date_administered) }}</p>
    </div>
    <div v-if="record.dose_number != null">
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Dose Number</p>
      <p>{{ record.dose_number }}</p>
    </div>
    <div v-if="record.lot_number">
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Lot Number</p>
      <p>{{ record.lot_number }}</p>
    </div>
    <div v-if="record.location">
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Location</p>
      <p>{{ record.location }}</p>
    </div>
    <div v-if="record.manufacturer">
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Manufacturer</p>
      <p>{{ record.manufacturer }}</p>
    </div>
    <div v-if="record.notes">
      <p class="text-xs font-semibold uppercase" style="color: var(--color-typo-heading)">Notes</p>
      <!-- NEVER v-html — always mustache (READ-02, PITFALLS Pitfall 10) -->
      <p>{{ record.notes }}</p>
    </div>
    <div v-if="record.card">
      <p class="text-xs font-semibold uppercase mb-1" style="color: var(--color-typo-heading)">Attachment</p>
      <AttachmentPreview :record="record" :token="token" />
    </div>
  </div>
</template>
```

**Date helper** — same dayjs pattern as VaccinationList:
```typescript
import dayjs from "dayjs";
function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
```

**ManageTask analog — what to copy vs. ignore:**

| ManageTask element | Copy? | Reason |
|---|---|---|
| `v-model:visible` / `defineModel` | No | VaccinationDetail is body content, not dialog manager |
| `<Dialog>` wrapper | No | Dialog lives in WallecxApp.vue |
| `toast.success()` | No | Read-only phase — no mutations |
| `space-y-4` layout class | Yes | Field grouping pattern |
| `:style="{ width: '40vw' }"` on Dialog | Indirect | Applied in WallecxApp.vue's `<Dialog>` |

---

### `src/components/projects/wallecx/AttachmentPreview.vue` (utility component, file-I/O)

**Analog:** `src/components/projects/larga/LargaApp.vue` (dynamic import in `onMounted`)

**LargaApp.vue dynamic import pattern** (lines 68–74) — the codebase precedent for deferred loading:
```typescript
onMounted(async () => {
  const [leafletMod, geocoderMod] = await Promise.all([
    import("leaflet"),
    import("leaflet-control-geocoder"),
  ]);
  L = leafletMod;
  geocoderFn = geocoderMod.geocoder;
```
AttachmentPreview.vue uses `defineAsyncComponent` instead of imperative `import()` in onMounted — this is the Vue-idiomatic way for a component-level lazy load (vs. LargaApp's library-level deferred import). Both are valid; `defineAsyncComponent` is correct here because we need a Vue component instance, not a library namespace.

**Imports pattern:**
```typescript
import { defineAsyncComponent, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```

**defineAsyncComponent pattern** — no codebase analog; use RESEARCH.md Pattern 4 directly (verified against Vue.js async component docs):
```typescript
const VuePdfEmbed = defineAsyncComponent(
  () => import("vue-pdf-embed")
);
```

**Props:**
```typescript
const props = defineProps<{
  record: Vaccinations;
  token: string;
}>();
```

**MIME detection** — no codebase analog; use RESEARCH.md Pattern 3:
```typescript
function getMimeCategory(filename: string): "image" | "pdf" | "unknown" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp")) {
    return "image";
  }
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  return "unknown";
}
```

**Computed URLs:**
```typescript
const mimeCategory = computed(() => getMimeCategory(props.record.card));

const tokenUrl = computed(() =>
  pb.files.getURL(props.record, props.record.card, { token: props.token })
);

const thumbUrl = computed(() =>
  pb.files.getURL(props.record, props.record.card, { thumb: "400x400", token: props.token })
);
```

**Template — MIME branch with Suspense:**
```vue
<template>
  <div v-if="record.card">
    <img
      v-if="mimeCategory === 'image'"
      :src="thumbUrl"
      :alt="`${record.vaccine_name} card`"
      class="max-w-full rounded"
    />
    <Suspense v-else-if="mimeCategory === 'pdf'">
      <VuePdfEmbed :source="tokenUrl" :page="1" @loading-failed="showPdfFallback = true" />
      <template #fallback>
        <Skeleton height="12rem" />
      </template>
    </Suspense>
    <a v-else :href="tokenUrl" download class="underline text-sm">Download attachment</a>
    <!-- PDF loading-failed fallback (Open Question 3 resolution) -->
    <a v-if="showPdfFallback" :href="tokenUrl" download class="underline text-sm block mt-2">
      Preview unavailable — Download PDF
    </a>
  </div>
  <div v-else class="text-sm text-gray-400">No attachment.</div>
</template>
```

Add `showPdfFallback` ref:
```typescript
const showPdfFallback = ref(false);
```

**Critical guard — gate on `record.card` truthy** (Pitfall 5): The `v-if="record.card"` on the root `<div>` prevents passing an empty string to `pb.files.getURL()`. This is enforced at the template level.

---

### `index.html` (config, CSP meta tag)

**Analog:** `index.html` (self — additive change only)

**Current CSP meta tag** (lines 7–10):
```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src *; font-src 'self' data: https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self';"
/>
```

**Change: append `worker-src 'self' blob:;` to end of content string only.** Do not modify any other directive. Do not add `blob:` to `script-src`.

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src *; font-src 'self' data: https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self'; worker-src 'self' blob:;"
/>
```

---

## Shared Patterns

### `<script setup lang="ts">` — 100% of SFCs
**Source:** Every SFC in the codebase (ActivityCard.vue line 1, ManageTask.vue line 1, WallecxApp.vue line 1)
**Apply to:** All three new Vue files
```vue
<script setup lang="ts">
// ... no Options API, no defineComponent wrapper
</script>
```

### PocketBase singleton import
**Source:** `src/lib/pocketbase/index.ts` lines 1–5; used in `WallecxApp.vue` line 4
**Apply to:** `WallecxApp.vue` (already present), `VaccinationList.vue`, `AttachmentPreview.vue`
```typescript
import { pb } from "@/lib/pocketbase";
```

### Error handling — try/catch/finally + toast.error
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 12–24; CONVENTIONS.md lines 93–110
**Apply to:** `WallecxApp.vue` openDetail function; any new async operation
```typescript
try {
  // async operation
} catch (e: unknown) {
  toast.error("Descriptive user-facing message.");
  console.error("ComponentName: context", e);
} finally {
  isLoading.value = false; // or equivalent cleanup
}
```

### `iconify-icon` web component usage
**Source:** `src/components/projects/lextrack/ActivityCard.vue` lines 44–49
**Apply to:** `VaccinationList.vue` (thumbnail placeholder + empty state icon)
```vue
<iconify-icon icon="mdi:image-off" width="32" height="32"></iconify-icon>
```
No import needed — registered globally via `vite.config.ts:14-18` `compilerOptions.isCustomElement`.

### PrimeVue auto-import — no explicit imports in `<script setup>`
**Source:** CONVENTIONS.md lines 62–73; `vite.config.ts` PrimeVueResolver configuration
**Apply to:** All three new Vue files — never import DataTable, Column, Skeleton, Dialog, Button, Card
```typescript
// WRONG — do not do this:
import DataTable from "primevue/datatable";
// CORRECT — just use <DataTable> directly in template; auto-imported
```

### `@/` path alias — always use for internal imports
**Source:** CONVENTIONS.md lines 68–70; WallecxApp.vue line 4–5
**Apply to:** All three new Vue files
```typescript
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
// Not: import type { Vaccinations } from "../../types/wallecx/vaccinations/types";
```

### `dayjs` for date display
**Source:** CONVENTIONS.md lines 138+; pattern used project-wide
**Apply to:** `VaccinationList.vue`, `VaccinationDetail.vue`
```typescript
import dayjs from "dayjs";
// Format: dayjs(isoString).format("DD MMM YYYY")
```

### `vue-sonner` toast for user-facing errors
**Source:** `src/components/projects/wallecx/WallecxApp.vue` line 3, line 19
**Apply to:** `WallecxApp.vue` (openDetail error path)
```typescript
import { toast } from "vue-sonner";
toast.error("Failed to load attachment.");
```

---

## No Analog Found

No files in Phase 2 are without a codebase analog. However, the following sub-patterns have no direct codebase precedent and must be implemented from RESEARCH.md patterns:

| Sub-Pattern | In File | Reason | Source |
|---|---|---|---|
| PrimeVue DataTable with Skeleton body slots | `VaccinationList.vue` | No DataTable usage exists in codebase yet | RESEARCH.md Pattern 1 (verified against primevue.org/datatable) |
| `defineAsyncComponent` for Vue component lazy-load | `AttachmentPreview.vue` | LargaApp uses imperative `import()` for libraries, not for Vue components | RESEARCH.md Pattern 4 (verified against Vue.js async component docs) |
| Extension-based MIME detection | `AttachmentPreview.vue` | No file preview component exists in codebase | RESEARCH.md Pattern 3 (verified against Vaccinations type allowlist) |
| `pb.files.getToken()` + `pb.files.getURL(..., { token })` | `WallecxApp.vue`, `AttachmentPreview.vue` | No existing file preview with protected fields | RESEARCH.md Pattern 2 + Code Examples (verified against PocketBase SDK types) |

---

## Implementation Sequence (recommended for planner)

1. `index.html` — CSP change first (no dependencies; unblocks PDF.js worker immediately)
2. `src/components/projects/wallecx/AttachmentPreview.vue` — pure utility; no deps on other new files
3. `src/components/projects/wallecx/VaccinationDetail.vue` — depends on AttachmentPreview
4. `src/components/projects/wallecx/VaccinationList.vue` — no new-file deps; depends only on types + pb
5. `src/components/projects/wallecx/WallecxApp.vue` — wires VaccinationList + VaccinationDetail + Dialog together

---

## Metadata

**Analog search scope:** `src/components/projects/`, `src/lib/`, `src/types/`, `index.html`
**Files scanned:** 10 source files read in full
**Key codebase files read:**
- `src/components/projects/wallecx/WallecxApp.vue` — exact shell to extend
- `src/components/projects/lextrack/ActivityCard.vue` — emit pattern + empty state + iconify-icon
- `src/components/projects/lextrack/ManageTask.vue` — Dialog usage + space-y-4 body layout
- `src/components/projects/lextrack/ManageMeeting.vue` — secondary Dialog confirmation
- `src/components/projects/larga/LargaApp.vue` — dynamic import precedent
- `src/types/wallecx/vaccinations/types.d.ts` — Vaccinations type (all fields)
- `src/lib/pocketbase/index.ts` — pb singleton
- `index.html` — current CSP
- `.planning/codebase/CONVENTIONS.md` — import order, emit style, error handling
**Pattern extraction date:** 2026-05-11
