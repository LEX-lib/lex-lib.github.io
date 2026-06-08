# Phase 36: Mobile Performance — Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 11 new/modified files
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/WallecxSkeleton.vue` | component | request-response | `src/components/projects/wallecx/VaccinationsTab.vue` (lines 358–365) + `MembershipsTab.vue` (lines 256–263) + `ExpensesListView.vue` (lines 128–131) + `ExpensesReportsView.vue` (lines 430–435) + `AttachmentPreview.vue` (lines 75–80) | exact — consolidates all 5 inline skeleton blocks |
| `src/lib/pocketbase/perfInstrument.ts` | utility | request-response | `src/lib/pocketbase/index.ts` (line 5) + `src/components/projects/wallecx/ExpensesTab.vue` (lines 68–79) — call site shape | role-match |
| `src/lib/wallecx/compressToWebP.ts` | utility | transform | `src/components/projects/wallecx/ManageExpense.vue` (lines 205–209) + `ManageMembership.vue` (lines 214–218) + `ManageVaccination.vue` (lines 184–188) | exact — extracts identical 4-option block |
| `vite.config.ts` (MODIFY) | config | batch | `vite.config.ts` (lines 126–138) — existing `codeSplitting.groups` array | exact — extend same array |
| `WallecxApp.vue` (MODIFY) | component | request-response | `src/components/projects/wallecx/AttachmentPreview.vue` (lines 7–11, 67–81) | exact — defineAsyncComponent + Suspense/fallback |
| `VaccinationsTab.vue` (MODIFY — async dialog + requestKey + skeleton) | component | request-response | `AttachmentPreview.vue` (lines 7–11, 67–81) + `VaccinationsTab.vue` (lines 358–365) own existing skeleton | exact |
| `MembershipsTab.vue` (MODIFY — async dialog + skeleton) | component | request-response | Same as VaccinationsTab.vue analog | exact |
| `ExpensesTab.vue` (MODIFY — async dialog) | component | request-response | Same as VaccinationsTab.vue analog | exact |
| `ManageExpense.vue` (MODIFY — compressToWebP) | component | transform | `src/lib/wallecx/currency.ts` (helper import pattern) + own lines 205–210 | exact |
| `ManageMembership.vue` (MODIFY — compressToWebP) | component | transform | Same as ManageExpense.vue analog | exact |
| `ManageVaccination.vue` (MODIFY — compressToWebP) | component | transform | Same as ManageExpense.vue analog | exact |
| `index.html` (MODIFY — preconnect hints) | config | request-response | `index.html` (lines 4–7) — existing `<link>` + LOCKED comment context | exact |

---

## Pattern Assignments

### `src/components/projects/wallecx/WallecxSkeleton.vue` (component, request-response)

**Analog:** Five inline skeleton blocks, one per variant, each verified in source.

**Imports pattern** — copy from `AttachmentPreview.vue` line 1 (script setup, no extra imports needed; `Skeleton` and `Card` are PrimeVue auto-imported):
```vue
<script setup lang="ts">
// No imports needed — Skeleton and Card are auto-imported via PrimeVueResolver
// (Components({ resolvers: [PrimeVueResolver()] }) in vite.config.ts)

interface Props {
  variant: 'vaccination-card' | 'membership-card' | 'expense-row' | 'reports-chart' | 'attachment'
  count?: number
}
const props = withDefaults(defineProps<Props>(), { count: 1 })
</script>
```

**vaccination-card variant** — source: `VaccinationsTab.vue` lines 358–365:
```html
<!-- VaccinationsTab.vue lines 358–365 — exact inline block to consolidate -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>
```
WallecxSkeleton renders this with `:count` replacing the hardcoded `3`:
```html
<div v-if="variant === 'vaccination-card'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in count" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>
```

**membership-card variant** — source: `MembershipsTab.vue` lines 256–263:
```html
<!-- MembershipsTab.vue lines 256–263 — exact inline block to consolidate -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="8rem" />
    </template>
  </Card>
</div>
```

**expense-row variant** — source: `ExpensesListView.vue` lines 128–131:
```html
<!-- ExpensesListView.vue lines 128–131 — exact inline block to consolidate -->
<div v-if="isLoading" class="flex flex-col gap-1">
  <Skeleton v-for="i in 3" :key="i" height="3rem" class="w-full rounded" />
</div>
```

**reports-chart variant** — source: `ExpensesReportsView.vue` lines 430–435:
```html
<!-- ExpensesReportsView.vue lines 430–435 — exact inline block to consolidate -->
<div v-if="isLoading" class="mt-6 flex flex-col items-center gap-3">
  <Skeleton width="12rem" height="2.5rem" />
  <Skeleton width="8rem" height="3rem" />
  <Skeleton width="100%" height="220px" class="rounded" />
</div>
```

**attachment variant** — source: `AttachmentPreview.vue` lines 75–80:
```html
<!-- AttachmentPreview.vue lines 75–80 — exact #fallback block to consolidate -->
<div class="flex flex-col items-center py-6 gap-2">
  <Skeleton height="12rem" class="w-full" />
  <p class="text-sm" style="color: var(--color-typo-muted)">Loading PDF preview…</p>
</div>
```
Change the text to "Loading…" in the shared variant (generic); AttachmentPreview.vue's Suspense fallback will switch to `<WallecxSkeleton variant="attachment" />`.

**Full component template skeleton** (assemble from the 5 blocks above using `v-if/v-else-if`):
```html
<template>
  <!-- vaccination-card -->
  <div v-if="variant === 'vaccination-card'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Card v-for="i in count" :key="i">
      <template #content><Skeleton height="6rem" /></template>
    </Card>
  </div>

  <!-- membership-card -->
  <div v-else-if="variant === 'membership-card'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Card v-for="i in count" :key="i">
      <template #content><Skeleton height="8rem" /></template>
    </Card>
  </div>

  <!-- expense-row -->
  <div v-else-if="variant === 'expense-row'" class="flex flex-col gap-1">
    <Skeleton v-for="i in count" :key="i" height="3rem" class="w-full rounded" />
  </div>

  <!-- reports-chart -->
  <div v-else-if="variant === 'reports-chart'" class="mt-6 flex flex-col items-center gap-3">
    <Skeleton width="12rem" height="2.5rem" />
    <Skeleton width="8rem" height="3rem" />
    <Skeleton width="100%" height="220px" class="rounded" />
  </div>

  <!-- attachment -->
  <div v-else-if="variant === 'attachment'" class="flex flex-col items-center py-6 gap-2">
    <Skeleton height="12rem" class="w-full" />
    <p class="text-sm" style="color: var(--color-typo-muted)">Loading…</p>
  </div>
</template>
```

---

### `src/lib/pocketbase/perfInstrument.ts` (utility, request-response)

**Analog:** `src/lib/pocketbase/index.ts` line 5 (the `pb` export); call site shape from `ExpensesTab.vue` lines 66–79 and `MembershipsTab.vue` lines 95–108.

**pb import pattern** — source: `src/lib/pocketbase/index.ts` line 5, mirrored in every wallecx component:
```typescript
// src/lib/pocketbase/index.ts — the only export
import PocketBase from "pocketbase";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
export const pb = new PocketBase(baseUrl);
```

**Existing call site shape** (the shape the wrapper must preserve) — source: `MembershipsTab.vue` lines 96–102:
```typescript
records.value = await pb
  .collection('wallecx_memberships')
  .getFullList<Memberships>({
    sort: '-created',
    requestKey: 'memberships-getFullList',   // must pass through unchanged
  })
```

**Existing call site shape — VaccinationsTab** (MISSING requestKey) — source: `VaccinationsTab.vue` lines 154–156:
```typescript
records.value = await pb
  .collection("wallecx_vaccinations")
  .getFullList<Vaccinations>({ sort: "-date_administered" });
  // NO requestKey — must add 'vaccinations-getFullList' here when wrapping
```

**New file imports pattern** — copy `@/` alias style from `src/lib/pocketbase/vaccinationMapper.ts` line 1:
```typescript
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
// → for perfInstrument.ts:
import { pb } from './index'
```

**Core wrapper implementation** (full content, ready to copy):
```typescript
// src/lib/pocketbase/perfInstrument.ts
import { pb } from './index'

const STORAGE_KEY = 'wallecx:perf-baseline'
const SESSION_KEY_PREFIX = 'wallecx:perf-session:'

interface PerfRecord {
  collection: string
  payloadBytes: number
  durationMs: number
  recordCount: number
  timestamp: string
}

export async function instrumentedGetFullList<T>(
  collection: string,
  options: Parameters<ReturnType<typeof pb.collection>['getFullList']>[0]
): Promise<T[]> {
  const markStart = `perf:${collection}:start`
  const markEnd   = `perf:${collection}:end`
  const measureName = `perf:${collection}`

  performance.mark(markStart)
  const records = await pb.collection(collection).getFullList<T>(options)
  performance.mark(markEnd)
  const measure = performance.measure(measureName, markStart, markEnd)

  const durationMs = Math.round(measure.duration)
  const payloadBytes = JSON.stringify(records).length
  const recordCount = records.length

  const sessionFlag = SESSION_KEY_PREFIX + collection
  try {
    if (!sessionStorage.getItem(sessionFlag)) {
      sessionStorage.setItem(sessionFlag, '1')
      console.info(
        `[wallecx:perf] ${collection}: ${recordCount} records, ${payloadBytes} bytes (proxy), ${durationMs}ms`
      )
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const stored: Record<string, PerfRecord[]> = raw ? JSON.parse(raw) : {}
        const ring = stored[collection] ?? []
        ring.push({ collection, payloadBytes, durationMs, recordCount, timestamp: new Date().toISOString() })
        if (ring.length > 5) ring.shift()
        stored[collection] = ring
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      } catch {
        // localStorage write failures are non-fatal (private mode, quota exceeded)
      }
    }
  } catch {
    // sessionStorage may also throw in private mode — skip instrumentation silently
  }

  return records
}
```

**Call site migration map** (5 mount-path getFullList calls; export-path calls are NOT wrapped):

| File | Line (approx) | Collection | Action |
|------|--------------|------------|--------|
| `VaccinationsTab.vue` | 154–156 | `wallecx_vaccinations` | Add `requestKey: 'vaccinations-getFullList'` AND wrap |
| `MembershipsTab.vue` | 97–102 | `wallecx_memberships` | Wrap only — requestKey already present |
| `ExpensesTab.vue` | 68–73 | `wallecx_expenses` | Wrap only — requestKey already present |
| `ExpensesTab.vue` | 29–33 | `wallecx_expense_budgets` | Wrap only — requestKey already present |
| `ExpensesReportsView.vue` | 251–255 | `wallecx_expense_categories` | Wrap only — requestKey already present |

**Before/after pattern** — source: `ExpensesTab.vue` lines 68–73 (representative):
```typescript
// BEFORE:
expenses.value = await pb
  .collection('wallecx_expenses')
  .getFullList<Expenses>({
    sort: '-expense_date,-created',
    requestKey: 'expenses-getFullList',
  })

// AFTER:
import { instrumentedGetFullList } from '@/lib/pocketbase/perfInstrument'
// ...
expenses.value = await instrumentedGetFullList<Expenses>('wallecx_expenses', {
  sort: '-expense_date,-created',
  requestKey: 'expenses-getFullList',   // preserved unchanged
})
```

**VaccinationsTab special case** — source: `VaccinationsTab.vue` lines 154–156:
```typescript
// BEFORE (no requestKey — NFR violation):
records.value = await pb
  .collection("wallecx_vaccinations")
  .getFullList<Vaccinations>({ sort: "-date_administered" });

// AFTER (add requestKey + wrap):
records.value = await instrumentedGetFullList<Vaccinations>('wallecx_vaccinations', {
  sort: '-date_administered',
  requestKey: 'vaccinations-getFullList',  // NEW — fixes NFR-REQUESTKEY-UNIQUE
})
```

---

### `src/lib/wallecx/compressToWebP.ts` (utility, transform)

**Analog:** The 3 identical `imageCompression(strippedFile, {...})` blocks. All 3 verified to have byte-identical options.

**Existing 4-option block** — source: `ManageExpense.vue` lines 205–209 (identical in ManageMembership.vue 214–218 and ManageVaccination.vue 184–188):
```typescript
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
})
```

**Import pattern** — matches `src/lib/wallecx/currency.ts` (named export, no path alias needed within lib):
```typescript
// currency.ts pattern: plain named export, no imports from @/
export function formatCurrency(amount: number): string { ... }

// → compressToWebP.ts follows the same pattern:
import imageCompression from 'browser-image-compression'
export async function compressToWebP(file: File): Promise<File> { ... }
```

**New file full content** (ready to copy):
```typescript
// src/lib/wallecx/compressToWebP.ts
import imageCompression from 'browser-image-compression'

/**
 * Compresses an image file to WebP using browser-image-compression.
 * EXIF stripping must be done by the caller (canvas re-encode) BEFORE this call.
 * PDFs must NOT be passed here — callers already short-circuit for application/pdf.
 */
export async function compressToWebP(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: 'image/webp',
  })
}
```

**Per-call-site changes:**

`ManageExpense.vue` — source lines 3, 205–210:
```typescript
// REMOVE line 3:
import imageCompression from 'browser-image-compression'
// ADD to imports:
import { compressToWebP } from '@/lib/wallecx/compressToWebP'

// CHANGE lines 205–210 (note: type changes to 'image/webp' in the File wrapper):
// BEFORE:
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true,
})
pendingFile.value = new File([compressed], file.name, { type: file.type })

// AFTER:
const compressed = await compressToWebP(strippedFile)
pendingFile.value = new File([compressed], file.name, { type: 'image/webp' })
// ↑ CRITICAL: type was file.type (image/jpeg or image/png); must change to 'image/webp'
```

`ManageMembership.vue` — source lines 4, 214–220:
```typescript
// REMOVE line 4:
import imageCompression from "browser-image-compression";
// ADD:
import { compressToWebP } from '@/lib/wallecx/compressToWebP'

// CHANGE lines 214–220 (no File wrapper — direct assign):
// BEFORE:
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true,
});
pendingFile.value = compressed;

// AFTER:
const compressed = await compressToWebP(strippedFile)
pendingFile.value = compressed
// compressed.type will be 'image/webp' — no extra wrapper needed
```

`ManageVaccination.vue` — source lines 6, 184–190:
```typescript
// REMOVE line 6:
import imageCompression from "browser-image-compression";
// ADD:
import { compressToWebP } from '@/lib/wallecx/compressToWebP'

// CHANGE lines 184–190 (same direct-assign pattern as ManageMembership):
// BEFORE:
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true,
});
pendingFile.value = compressed;

// AFTER:
const compressed = await compressToWebP(strippedFile)
pendingFile.value = compressed
```

**Note on EXIF strip differences:** ManageVaccination (lines 153–182) and ManageMembership (lines 185–212) use `Image` + `URL.createObjectURL` approach. ManageExpense (lines 192–203) uses `createImageBitmap`. Both produce `strippedFile` before calling the helper — the helper only receives the already-stripped File. Do NOT move EXIF stripping into the helper.

---

### `vite.config.ts` (config, batch — MODIFY)

**Analog:** `vite.config.ts` lines 126–138 — the existing `codeSplitting.groups` array.

**Existing groups block** (source: `vite.config.ts` lines 125–138):
```typescript
codeSplitting: {
  groups: [
    { name: "leaflet", test: /\/leaflet/, priority: 30 },
    {
      name: "primevue",
      test: /\/primevue|\/@primevue|\/@primeuix/,
      priority: 20,
    },
    {
      name: "vendor",
      test: /\/vue|\/pinia|\/vue-router|\/@vue/,
      priority: 10,
    },
  ],
},
```

**Target state** — insert 3 new groups after `leaflet`, before `primevue`:
```typescript
codeSplitting: {
  groups: [
    { name: "leaflet",           test: /\/leaflet/,                         priority: 30 },
    { name: "chart-js",          test: /\/chart\.js/,                       priority: 25 },
    { name: "jsbarcode",         test: /\/jsbarcode/,                       priority: 25 },
    { name: "image-compression", test: /\/browser-image-compression/,       priority: 25 },
    {
      name: "primevue",
      test: /\/primevue|\/@primevue|\/@primeuix/,
      priority: 20,
    },
    {
      name: "vendor",
      test: /\/vue|\/pinia|\/vue-router|\/@vue/,
      priority: 10,
    },
  ],
},
```

**LOCKED lines that must NOT change** (source: `vite.config.ts`):
- Line 28: `registerType: "prompt",          // LOCKED: never 'autoUpdate'…`
- Line 42: `scope: "/",                    // LOCKED: scope "/" per STATE.md…`
- Line 86: `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,`
- Line 88: `navigateFallback: "index.html",  // LOCKED: mandatory for SPA offline…`

---

### `WallecxApp.vue` (component, request-response — MODIFY)

**Analog:** `src/components/projects/wallecx/AttachmentPreview.vue` lines 2 (defineAsyncComponent import), 7–11 (defineAsyncComponent call), 67–81 (Suspense + fallback).

**defineAsyncComponent import** — source: `AttachmentPreview.vue` line 2:
```typescript
import { defineAsyncComponent, computed, ref } from "vue";
```

**Existing eager imports to replace** — source: `WallecxApp.vue` lines 7–9:
```typescript
// REMOVE lines 7–9:
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";
import ExpensesTab from "./ExpensesTab.vue";
```

**Script block changes** — add to `WallecxApp.vue` line 2 (add `defineAsyncComponent` to existing vue import) and add static WallecxSkeleton import after line 10:
```typescript
// CHANGE line 2 — add defineAsyncComponent to existing import:
import { ref, onMounted, watch, defineAsyncComponent } from "vue";

// ADD after line 10 (after PwaInstallBanner import):
import WallecxSkeleton from "./WallecxSkeleton.vue";  // EAGER — must be in initial chunk

// REPLACE lines 7–9 with:
const VaccinationsTab = defineAsyncComponent(() => import("./VaccinationsTab.vue"));
const MembershipsTab  = defineAsyncComponent(() => import("./MembershipsTab.vue"));
const ExpensesTab     = defineAsyncComponent(() => import("./ExpensesTab.vue"));
```

**Suspense pattern** — source: `AttachmentPreview.vue` lines 67–81:
```html
<!-- AttachmentPreview.vue lines 67–81 — the reference Suspense pattern -->
<Suspense>
  <VuePdfEmbed
    :source="tokenUrl"
    :page="1"
    class="w-full"
    @loading-failed="onPdfError"
  />
  <template #fallback>
    <div class="flex flex-col items-center py-6 gap-2">
      <Skeleton height="12rem" class="w-full" />
      <p class="text-sm" style="color: var(--color-typo-muted)">Loading PDF preview…</p>
    </div>
  </template>
</Suspense>
```

**Template changes** — replace `WallecxApp.vue` lines 93–103 (the `<TabPanels>` block):
```html
<!-- BEFORE (WallecxApp.vue lines 93–103): -->
<TabPanels>
  <TabPanel value="vaccinations">
    <VaccinationsTab />
  </TabPanel>
  <TabPanel value="memberships">
    <MembershipsTab />
  </TabPanel>
  <TabPanel value="expenses">
    <ExpensesTab />
  </TabPanel>
</TabPanels>

<!-- AFTER — Suspense INSIDE each TabPanel (never wrapping TabPanels): -->
<TabPanels>
  <TabPanel value="vaccinations">
    <Suspense>
      <VaccinationsTab />
      <template #fallback>
        <WallecxSkeleton variant="vaccination-card" :count="3" />
      </template>
    </Suspense>
  </TabPanel>
  <TabPanel value="memberships">
    <Suspense>
      <MembershipsTab />
      <template #fallback>
        <WallecxSkeleton variant="membership-card" :count="3" />
      </template>
    </Suspense>
  </TabPanel>
  <TabPanel value="expenses">
    <Suspense>
      <ExpensesTab />
      <template #fallback>
        <WallecxSkeleton variant="expense-row" :count="3" />
      </template>
    </Suspense>
  </TabPanel>
</TabPanels>
```

---

### `VaccinationsTab.vue` (component, request-response — MODIFY)

Three independent changes in this file.

**Change 1: Async ManageVaccination dialog** — analog: `AttachmentPreview.vue` lines 2, 7–11.

Source of eager import to replace — `VaccinationsTab.vue` line 8:
```typescript
// REMOVE line 8:
import ManageVaccination from "./ManageVaccination.vue";

// ADD (with defineAsyncComponent added to existing vue import on line 1):
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from "vue";
import WallecxSkeleton from "./WallecxSkeleton.vue";  // EAGER — Suspense fallback
const ManageVaccination = defineAsyncComponent(() => import("./ManageVaccination.vue"));
```

Source of existing Suspense template pattern for the Manage dialog — `AttachmentPreview.vue` lines 67–74 applied to the ManageVaccination usage at `VaccinationsTab.vue` lines 446–452:
```html
<!-- BEFORE (VaccinationsTab.vue lines 446–452): -->
<ManageVaccination
  v-model:visible="showManage"
  v-model:record="manageRecord"
  @created="onCreated"
  ...
/>

<!-- AFTER — wrap in Suspense: -->
<Suspense>
  <ManageVaccination
    v-model:visible="showManage"
    v-model:record="manageRecord"
    @created="onCreated"
    ...
  />
  <template #fallback>
    <WallecxSkeleton variant="vaccination-card" />
  </template>
</Suspense>
```

**Change 2: Add missing requestKey to mount-path getFullList** — source: `VaccinationsTab.vue` lines 154–156:
```typescript
// BEFORE (lines 154–156) — no requestKey, NFR violation:
records.value = await pb
  .collection("wallecx_vaccinations")
  .getFullList<Vaccinations>({ sort: "-date_administered" });

// AFTER — after also switching to instrumentedGetFullList:
records.value = await instrumentedGetFullList<Vaccinations>('wallecx_vaccinations', {
  sort: '-date_administered',
  requestKey: 'vaccinations-getFullList',
})
```

**Change 3: Replace inline skeleton with WallecxSkeleton** — source: `VaccinationsTab.vue` lines 358–365:
```html
<!-- BEFORE (lines 358–365): -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- AFTER: -->
<WallecxSkeleton v-if="isLoading" variant="vaccination-card" :count="3" />
```

---

### `MembershipsTab.vue` (component, request-response — MODIFY)

Two independent changes.

**Change 1: Async ManageMembership dialog** — analog identical to VaccinationsTab pattern above.

Source of eager import — `MembershipsTab.vue` (line not captured in grep but follows same pattern as line 8 of VaccinationsTab):
```typescript
// Find and REMOVE: import ManageMembership from "./ManageMembership.vue";
// ADD:
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import WallecxSkeleton from "./WallecxSkeleton.vue";
const ManageMembership = defineAsyncComponent(() => import("./ManageMembership.vue"));
```

Wrap usage in Suspense (same pattern as VaccinationsTab, variant `"membership-card"`).

**Change 2: Replace inline skeleton with WallecxSkeleton** — source: `MembershipsTab.vue` lines 256–263:
```html
<!-- BEFORE (lines 256–263): -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="8rem" />
    </template>
  </Card>
</div>

<!-- AFTER: -->
<WallecxSkeleton v-if="isLoading" variant="membership-card" :count="3" />
```

---

### `ExpensesTab.vue` (component, request-response — MODIFY)

One change: async ManageExpense dialog.

Source of eager import to replace — `ExpensesTab.vue` line 11:
```typescript
// REMOVE line 11:
import ManageExpense from './ManageExpense.vue'

// ADD:
import { ref, onMounted, defineAsyncComponent } from "vue";
import WallecxSkeleton from "./WallecxSkeleton.vue";
const ManageExpense = defineAsyncComponent(() => import("./ManageExpense.vue"));
```

Wrap `<ManageExpense>` usage at `ExpensesTab.vue` lines 225–229 in Suspense (variant `"expense-row"`):
```html
<!-- BEFORE (lines 225–229): -->
<ManageExpense
  v-model:visible="showManage"
  v-model:record="manageRecord"
  @created="onCreated"
  ...
/>

<!-- AFTER: -->
<Suspense>
  <ManageExpense
    v-model:visible="showManage"
    v-model:record="manageRecord"
    @created="onCreated"
    ...
  />
  <template #fallback>
    <WallecxSkeleton variant="expense-row" />
  </template>
</Suspense>
```

Note: `ExpensesTab.vue` passes `:is-loading="isLoading"` to `ExpensesListView` and `ExpensesReportsView` as props (lines 205, 216) — these children handle their own skeleton rendering via `v-if="isLoading"`. The skeleton consolidation in those children happens in the next section.

---

### `ExpensesListView.vue` + `ExpensesReportsView.vue` + `AttachmentPreview.vue` (MODIFY — skeleton consolidation)

**ExpensesListView.vue** — source: lines 128–131:
```html
<!-- BEFORE (lines 128–131): -->
<div v-if="isLoading" class="flex flex-col gap-1">
  <Skeleton v-for="i in 3" :key="i" height="3rem" class="w-full rounded" />
</div>

<!-- AFTER: -->
<WallecxSkeleton v-if="isLoading" variant="expense-row" :count="3" />
```
Add import at top of script: `import WallecxSkeleton from "./WallecxSkeleton.vue";`

**ExpensesReportsView.vue** — source: lines 430–435:
```html
<!-- BEFORE (lines 430–435): -->
<div v-if="isLoading" class="mt-6 flex flex-col items-center gap-3">
  <Skeleton width="12rem" height="2.5rem" />
  <Skeleton width="8rem" height="3rem" />
  <Skeleton width="100%" height="220px" class="rounded" />
</div>

<!-- AFTER: -->
<WallecxSkeleton v-if="isLoading" variant="reports-chart" />
```
Add import: `import WallecxSkeleton from "./WallecxSkeleton.vue";`

**AttachmentPreview.vue** — source: lines 75–80 (the `#fallback` template):
```html
<!-- BEFORE (lines 75–80): -->
<template #fallback>
  <div class="flex flex-col items-center py-6 gap-2">
    <Skeleton height="12rem" class="w-full" />
    <p class="text-sm" style="color: var(--color-typo-muted)">Loading PDF preview…</p>
  </div>
</template>

<!-- AFTER: -->
<template #fallback>
  <WallecxSkeleton variant="attachment" />
</template>
```
Add import: `import WallecxSkeleton from "./WallecxSkeleton.vue";`

---

### `index.html` (config — MODIFY)

**Analog:** `index.html` lines 4–7 — existing `<link>` + LOCKED viewport comment structure.

**Existing `<head>` structure** (source: `index.html` lines 3–7):
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/branding_logo.svg" />
  <!-- LOCKED: viewport-fit=cover is required for env(safe-area-inset-*) non-zero values (CON-VIEWPORT-FIT / LT-09). Do not remove. -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

**Target state** — insert 2 lines after line 5 (favicon link), BEFORE the LOCKED comment on line 6:
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/branding_logo.svg" />
  <link rel="preconnect" href="https://lexarium-backend.fly.dev" crossorigin />
  <link rel="dns-prefetch" href="https://lexarium-backend.fly.dev" />
  <!-- LOCKED: viewport-fit=cover is required for env(safe-area-inset-*) non-zero values (CON-VIEWPORT-FIT / LT-09). Do not remove. -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

**Constraint:** The LOCKED comment (line 6) and the `<meta name="viewport">` content string (including `interactive-widget=resizes-content`) must remain byte-intact.

---

## Shared Patterns

### defineAsyncComponent + Suspense
**Source:** `src/components/projects/wallecx/AttachmentPreview.vue` lines 2, 7–11, 67–81
**Apply to:** WallecxApp.vue (3 tab async loads), VaccinationsTab.vue (ManageVaccination), MembershipsTab.vue (ManageMembership), ExpensesTab.vue (ManageExpense)

Key constraints extracted from the analog:
1. `defineAsyncComponent` receives a single arrow function returning a dynamic import
2. `<Suspense>` wraps the async component in the template; `#fallback` slot holds the skeleton
3. The fallback component (`WallecxSkeleton`) MUST be imported statically — never async
4. In WallecxApp.vue: `<Suspense>` goes INSIDE `<TabPanel>`, never wrapping `<TabPanels>`

```vue
<!-- Complete pattern from AttachmentPreview.vue — lines 7–11 (script) + 67–81 (template) -->

<!-- script setup -->
const VuePdfEmbed = defineAsyncComponent(async () => {
  const { GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = workerUrl;
  return import("vue-pdf-embed");
});
// Simple form (no side-effects before import):
const ManageVaccination = defineAsyncComponent(() => import("./ManageVaccination.vue"));

<!-- template -->
<Suspense>
  <VuePdfEmbed ... />
  <template #fallback>
    <div class="flex flex-col items-center py-6 gap-2">
      <Skeleton height="12rem" class="w-full" />
    </div>
  </template>
</Suspense>
```

### getFullList call site shape (requestKey preservation)
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` lines 97–102; `ExpensesTab.vue` lines 68–73
**Apply to:** All 5 mount-path `wallecx_*` getFullList wrapping migrations

The `options` object is passed through unchanged to `instrumentedGetFullList`. The `requestKey` value is never modified by the wrapper.

### isLoading guard + skeleton block pattern
**Source:** `VaccinationsTab.vue` lines 152, 169 (isLoading flip), 358 (v-if guard)
**Apply to:** VaccinationsTab.vue, MembershipsTab.vue (existing pattern already present in both)

```typescript
// isLoading flip — matches all 3 tab files:
isLoading.value = true
try {
  records.value = await /* getFullList call */
} catch (e: unknown) {
  toast.error('...')
  console.error('...: getFullList failed', e)
} finally {
  isLoading.value = false
}
```

### lib/wallecx utility file structure
**Source:** `src/lib/wallecx/currency.ts` lines 1–13
**Apply to:** `src/lib/wallecx/compressToWebP.ts`

Named exports, no barrel index, no path alias `@/` within the lib directory itself (plain relative imports), single responsibility per file.

---

## No Analog Found

None. All 11 files have exact or role-match analogs in the codebase.

---

## Plan Dependency Note

**Plan-36-01 (foundation)** must execute before consumer migrations:
1. Create `WallecxSkeleton.vue` (consumers: WallecxApp.vue, VaccinationsTab, MembershipsTab, ExpensesListView, ExpensesReportsView, AttachmentPreview)
2. Create `perfInstrument.ts` (consumers: VaccinationsTab, MembershipsTab, ExpensesTab, ExpensesReportsView)
3. Create `compressToWebP.ts` (consumers: ManageExpense, ManageMembership, ManageVaccination)
4. Modify `vite.config.ts` codeSplitting groups (independent; no consumer dependencies)
5. Modify `index.html` preconnect hints (independent; no consumer dependencies)

Plans that migrate consumers can only start after Plan-36-01 ships the 3 new files.

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/lib/pocketbase/`, `src/lib/wallecx/`, `vite.config.ts`, `index.html`
**Files scanned:** 15 source files (AttachmentPreview, WallecxApp, VaccinationsTab, MembershipsTab, ExpensesTab, ExpensesListView, ExpensesReportsView, ManageExpense, ManageMembership, ManageVaccination, pocketbase/index, vaccinationMapper, currency, vite.config.ts, index.html)
**Pattern extraction date:** 2026-05-28
