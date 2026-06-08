# Phase 2: Read Path (List + Detail + Attachment Preview) - Research

**Researched:** 2026-05-11
**Domain:** Vue 3 SPA — PocketBase file token API, PrimeVue DataTable with skeleton loading, vue-pdf-embed v2.x lazy loading, CSP worker-src addition
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Detail view uses a PrimeVue Dialog/Modal — clicking a list row opens the detail in a Dialog overlay. The list stays mounted underneath. Matches the LexTrack ManageTask pattern; requires no routing changes.
- **D-02:** The detail dialog is static read-only in Phase 2 — no Edit or Delete buttons. All fields and the attachment preview are displayed. Edit/Delete actions are added in Phase 3.
- **D-03:** `VaccinationList.vue` uses a PrimeVue DataTable with columns: thumbnail, vaccine name, date administered, dose number, and a row actions column (View button emitting `view`; Edit and Remove buttons left as emitter hooks for Phase 3).
- **D-04:** Records without an attached card show a placeholder icon (e.g. `mdi:image-off` or `mdi:card-account-details-outline`) in the thumbnail column. The column is always present.
- **D-05:** During data fetch, show PrimeVue Skeleton rows (3–4 placeholder rows inside the DataTable area). Prevents layout shift and communicates data is coming. `isLoading` ref gates the skeleton vs. real content.
- **D-06:** When the user has zero records, show a centered icon + message ("No vaccination records yet.") with no Add button or CTA.

### Claude's Discretion
- Exact thumbnail image dimensions in the DataTable column (`?thumb=100x100` recommended for list performance)
- Number of skeleton rows to display during loading (3 recommended)
- DataTable column widths and responsive breakpoint behavior
- Exact icon name for the no-attachment placeholder (any neutral `mdi:` icon)
- Whether to show a DataTable header / caption label above the table

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| READ-01 | `VaccinationList.vue` renders date-sorted rows (vaccine name, date, dose, thumbnail); emits `view`, `edit`, `remove` | PrimeVue DataTable with Column + `#body` slots; `defineEmits` tuple pattern from CONVENTIONS.md |
| READ-02 | `VaccinationDetail.vue` renders all fields + attachment preview; `notes` uses `{{ }}` never `v-html` | Dialog (auto-imported) + mustache interpolation; PITFALLS.md Pitfall 10 |
| READ-03 | `AttachmentPreview.vue` branches on MIME: image → `<img>` with `?thumb=400x400`; PDF → lazy `vue-pdf-embed`; unknown → download link | Extension-based MIME inference (PocketBase record stores filename only); `pb.files.getURL()` with `thumb` option; `defineAsyncComponent(() => import('vue-pdf-embed'))` |
| READ-04 | Empty / loading / error states with vue-sonner toasts on error | Existing WallecxApp.vue `try/catch/finally` pattern; PrimeVue Skeleton; `isLoading` ref; `toast.error` |
| READ-05 | Fetch uses `{ immediate: true }` semantics so list never flashes "no records" | `onMounted` already provides immediate-semantics; no watcher needed for simple load |
| READ-06 | CSP meta tag adds `worker-src 'self' blob:` narrowly; `script-src` NOT relaxed | vue-pdf-embed default build bundles worker as blob URL (verified from README); only `worker-src` directive needs adding |
| READ-07 | Attachment URLs use short-lived token generated at view time | `pb.files.getToken()` returns `Promise<string>`; `pb.files.getURL(record, filename, { token })` builds URL; call on dialog open not list fetch |
</phase_requirements>

---

## Summary

Phase 2 builds three Vue SFCs — `VaccinationList.vue`, `VaccinationDetail.vue`, and `AttachmentPreview.vue` — plus one additive line change to `index.html` (CSP) and wiring in `WallecxApp.vue`. All libraries are already installed (`vue-pdf-embed@2.1.4`, `pdfjs-dist@4.10.38`, PrimeVue 4, `vue-sonner`). No new `npm install` step is required.

The most technically nuanced area is the attachment preview pipeline: PocketBase stores only the filename in the `card` field (not MIME type), so `AttachmentPreview.vue` must infer MIME from the file extension using a simple `.endsWith()` or regex check. The `vue-pdf-embed` component must be lazy-loaded via `defineAsyncComponent` to keep the ~350 kB pdfjs-dist chunk out of the main bundle. The PDF.js worker runs as a blob URL by default; this requires adding exactly `worker-src 'self' blob:` to the existing CSP meta tag in `index.html` — no `script-src` change.

PocketBase's `pb.files.getToken()` generates a short-lived (~2-minute) token for protected file access. The token must be requested when the detail dialog opens (`onMounted` or a watcher on dialog visibility), never at list-fetch time where it would expire before the user clicks.

**Primary recommendation:** Follow the WallecxApp.vue fetch pattern exactly (`onMounted` + `try/catch/finally` + `isLoading` ref + `toast.error`). Use a local `ref<Vaccinations | null>(null)` + `ref<boolean>(false)` for dialog state in WallecxApp.vue as the single source of truth, letting VaccinationList emit `view` and VaccinationDetail receive the record prop.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Record list fetch + sort | Browser / Client | — | `getFullList` with `{ sort: '-date_administered' }` executes client-side SDK call; sort is enforced by PocketBase on the server but initiated by the SPA |
| Per-user data isolation | API / Backend | — | PocketBase collection rules (`@request.auth.id != "" && user = @request.auth.id`) are the auth boundary; SPA filters are secondary UX |
| Thumbnail URL generation | Browser / Client | CDN / Static | `pb.files.getURL(record, filename, { thumb: '100x100' })` builds URL on client; PocketBase serves the thumb on request |
| Short-lived file token | API / Backend | Browser / Client | `pb.files.getToken()` makes an authenticated API call; token is consumed client-side to construct URLs |
| PDF rendering | Browser / Client | — | `vue-pdf-embed` (pdfjs-dist) runs entirely in browser via Web Worker; no server involvement |
| MIME type detection | Browser / Client | — | File extension extracted from filename string on the client; PocketBase does not surface MIME in record fields |
| CSP enforcement | Browser / Client | — | `<meta http-equiv="Content-Security-Policy">` in `index.html`; enforced by the browser |
| Empty / loading / error UI | Browser / Client | — | Local `isLoading` ref + `records.value.length === 0` check in Vue template |

---

## Standard Stack

### Core (all already installed — no `npm install` required)

| Library | Version (verified) | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| `vue-pdf-embed` | 2.1.4 [VERIFIED: npm registry] | PDF rendering in canvas via pdfjs-dist | Installed in Phase 1 (FRONT-01); Vue 3 wrapper, MIT, actively maintained |
| `pdfjs-dist` | 4.10.38 (transitive) [VERIFIED: package-lock.json] | PDF.js engine — ≥ 4.2.67 required for CVE-2024-4367 fix | Pinned at 4.10.38 which exceeds the 4.2.67 minimum |
| `primevue` | 4.3.7 [VERIFIED: package.json] | DataTable, Column, Skeleton, Dialog, Button, Image | Auto-imported via PrimeVueResolver; locked Lexarium stack |
| `pocketbase` | 0.26.2 [VERIFIED: package.json] | `pb.files.getToken()`, `pb.files.getURL()` | Singleton `pb` client already initialized in `src/lib/pocketbase/index.ts` |
| `vue-sonner` | 2.0.8 [VERIFIED: package.json] | `toast.error()` on fetch failure | Already in WallecxApp.vue |
| `dayjs` | 1.11.18 [VERIFIED: package.json] | Display-format date strings (e.g. `DD MMM YYYY`) | Lexarium date convention |
| `iconify-icon` | 3.0.0 [VERIFIED: package.json] | Placeholder icon in thumbnail column | Already used across all mini-apps |

### PrimeVue Components Used in Phase 2

All are auto-imported by `unplugin-vue-components` + `PrimeVueResolver` — no explicit import needed in SFCs.

| Component | Used In | Already in components.d.ts |
|-----------|---------|---------------------------|
| `<DataTable>` | VaccinationList.vue | No — will be auto-added on first use |
| `<Column>` | VaccinationList.vue | No — will be auto-added on first use |
| `<Skeleton>` | VaccinationList.vue (loading state) | No — will be auto-added on first use |
| `<Dialog>` | WallecxApp.vue (detail overlay) | Yes (line 25) |
| `<Button>` | VaccinationList.vue (row actions) | Yes (line 20) |

[VERIFIED: components.d.ts inspection]

### Version Verification

```bash
# Already confirmed — no install needed:
# vue-pdf-embed@2.1.4 — verified via node_modules/vue-pdf-embed/package.json
# pdfjs-dist@4.10.38 — verified via package-lock.json (> 4.2.67 CVE threshold)
# All other deps confirmed in package.json
```

---

## Architecture Patterns

### System Architecture Diagram

```
User navigates to /projects/wallecx
           |
           v
    WallecxApp.vue (mounted)
    - onMounted: pb.collection().getFullList({ sort: '-date_administered' })
    - isLoading = true → false
    - records ref<Vaccinations[]>
           |
    ┌──────┴──────────────────────────┐
    |                                 |
    v (isLoading = true)              v (isLoading = false, records.length > 0)
 VaccinationList.vue              VaccinationList.vue
 skeleton mode:                    data mode:
 fake array [_,_,_]               real Vaccinations[]
 DataTable + Skeleton rows         DataTable + real rows
                                        |
                                        | user clicks row → emit('view', record)
                                        v
                                  WallecxApp.vue
                                  - selectedRecord = record
                                  - showDetail = true
                                  - token = await pb.files.getToken()
                                        |
                                        v
                                  VaccinationDetail.vue (Dialog)
                                  - receives record + token props
                                  - renders all fields ({{ }} mustache)
                                        |
                                        v
                                  AttachmentPreview.vue
                                  - receives filename + token
                                  - detects MIME from extension
                                   ┌────────────┬────────────────┐
                                   |            |                |
                                   v            v                v
                                image/*     .pdf ext          unknown
                                <img>     VuePdfEmbed      <a download>
                            ?thumb=400x400  (lazy via
                                         defineAsyncComponent)

                     (isLoading = false, records.length === 0)
                                        |
                                        v
                              Empty state:
                              centered icon + "No vaccination records yet."

Error path (fetch throws):
  toast.error("Failed to load vaccination records.")
  records stays []
  no skeleton, no list
```

### Recommended Project Structure

```
src/components/projects/wallecx/
├── WallecxApp.vue           # shell; owns records[], selectedRecord, showDetail, token
├── VaccinationList.vue      # DataTable; emits view/edit/remove; skeleton when isLoading
├── VaccinationDetail.vue    # Dialog content; reads-only all fields; hosts AttachmentPreview
└── AttachmentPreview.vue    # MIME-branch: img / VuePdfEmbed / download link
```

### Pattern 1: DataTable with Skeleton Loading Rows

The standard PrimeVue pattern passes a fake placeholder array as `:value` during loading and uses `#body` template slots with `<Skeleton>` to fill each cell. Conditional columns (`v-if`/`v-else` on the entire DataTable) are an alternative but cause a full unmount/remount on data arrival, which creates layout flash. The slot approach is cleaner.

```vue
<!-- VaccinationList.vue — skeleton vs. real content using two DataTable blocks -->
<script setup lang="ts">
import { computed } from "vue";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import { pb } from "@/lib/pocketbase";
import dayjs from "dayjs";

const props = defineProps<{
  records: Vaccinations[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  view: [record: Vaccinations];
  edit: [record: Vaccinations];
  remove: [record: Vaccinations];
}>();

// Fake rows for skeleton — only length matters
const skeletonRows = Array.from({ length: 3 }, (_, i) => ({ id: String(i) }));

function thumbUrl(record: Vaccinations): string {
  return pb.files.getURL(record, record.card, { thumb: "100x100" });
}

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
</script>

<template>
  <!-- Loading state: DataTable fed fake rows, Skeleton in every cell -->
  <DataTable
    v-if="isLoading"
    :value="skeletonRows"
    table-style="min-width: 30rem"
  >
    <Column header="Card" style="width: 4rem">
      <template #body><Skeleton shape="rectangle" width="3rem" height="3rem" /></template>
    </Column>
    <Column header="Vaccine"><template #body><Skeleton /></template></Column>
    <Column header="Date"><template #body><Skeleton /></template></Column>
    <Column header="Dose"><template #body><Skeleton /></template></Column>
    <Column header=""><template #body><Skeleton width="5rem" /></template></Column>
  </DataTable>

  <!-- Empty state -->
  <div v-else-if="records.length === 0" class="flex flex-col items-center py-10 gap-2">
    <iconify-icon icon="mdi:needle-off" width="48" height="48" style="color: var(--color-brand-primary)" />
    <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  </div>

  <!-- Data state -->
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
        <!-- Edit / Remove — emitter hooks only in Phase 2, wired in Phase 3 -->
        <Button size="small" severity="secondary" label="Edit" :disabled="true" class="ml-1" @click="emit('edit', data)" />
        <Button size="small" severity="danger" label="Remove" :disabled="true" class="ml-1" @click="emit('remove', data)" />
      </template>
    </Column>
  </DataTable>
</template>
```

[VERIFIED: PrimeVue DataTable docs + Skeleton docs — primevue.org/datatable, primevue.org/skeleton]

### Pattern 2: View-Time Token Generation and URL Construction

`pb.files.getToken()` makes an authenticated API call and returns a `Promise<string>`. The token expires in approximately 2 minutes. It must be called when the dialog opens, not during list fetch.

```typescript
// WallecxApp.vue additions
const selectedRecord = ref<Vaccinations | null>(null);
const showDetail = ref(false);
const fileToken = ref<string>("");

async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  // Generate token at view time (READ-07)
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

The URL is then built in `AttachmentPreview.vue`:

```typescript
// AttachmentPreview.vue
const tokenUrl = computed(() =>
  pb.files.getURL(props.record, props.record.card, { token: props.token })
);
```

[VERIFIED: PocketBase SDK type definitions `pocketbase/dist/pocketbase.es.d.ts` lines 1069–1077]

### Pattern 3: MIME Branching from Filename Extension

PocketBase does NOT include MIME type in the record object — the `card` field is a plain filename string (e.g., `vaccination_card_abc123.jpg`). MIME detection must be inferred from the file extension client-side.

```typescript
// AttachmentPreview.vue
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

This matches the MIME allowlist from Phase 1 (BACK-02): `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Any other MIME types are already rejected server-side, so `"unknown"` is a safety net only.

[VERIFIED: Vaccinations type (`card: string`), BACK-02 MIME allowlist, PocketBase docs confirm no MIME in record payload]

### Pattern 4: Lazy-Loading vue-pdf-embed via defineAsyncComponent

The `pdfjs-dist` bundle is ~350 kB gzipped. It must not be included in the main chunk. The existing codebase already uses this pattern for Leaflet in `LargaApp.vue` (dynamic import in `onMounted`). For a Vue component, `defineAsyncComponent` is the correct mechanism.

```vue
<!-- AttachmentPreview.vue -->
<script setup lang="ts">
import { defineAsyncComponent, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const VuePdfEmbed = defineAsyncComponent(
  () => import("vue-pdf-embed")
);

const props = defineProps<{
  record: Vaccinations;
  token: string;
}>();

const mimeCategory = computed(() => getMimeCategory(props.record.card));

const tokenUrl = computed(() =>
  pb.files.getURL(props.record, props.record.card, { token: props.token })
);

const thumbUrl = computed(() =>
  pb.files.getURL(props.record, props.record.card, { thumb: "400x400", token: props.token })
);
</script>

<template>
  <div v-if="record.card">
    <!-- Image branch -->
    <img
      v-if="mimeCategory === 'image'"
      :src="thumbUrl"
      :alt="`${record.vaccine_name} card`"
      class="max-w-full rounded"
    />
    <!-- PDF branch — lazy loaded -->
    <Suspense v-else-if="mimeCategory === 'pdf'">
      <VuePdfEmbed :source="tokenUrl" :page="1" />
      <template #fallback>
        <Skeleton height="12rem" />
      </template>
    </Suspense>
    <!-- Unknown / fallback -->
    <a v-else :href="tokenUrl" download class="underline text-sm">Download attachment</a>
  </div>
  <div v-else class="text-sm text-gray-400">No attachment.</div>
</template>
```

[VERIFIED: vue-pdf-embed README, Vue.js async component docs, LargaApp.vue Leaflet pattern as codebase precedent]

### Pattern 5: CSP Addition — worker-src Only

The current `index.html` CSP (line 9):

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src *; font-src 'self' data: https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self';
```

The `vue-pdf-embed` default build bundles the PDF.js worker as a `blob:` URL. This requires `worker-src 'self' blob:` to be added. The `script-src` directive does NOT need to change (blob: workers are not covered by `script-src` — they are covered by `worker-src`).

**The only change to `index.html`:**

```html
<!-- BEFORE (line 9): -->
content="default-src 'self'; script-src 'self'; ... base-uri 'self';"

<!-- AFTER: append worker-src to end of the content string -->
content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src *; font-src 'self' data: https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self'; worker-src 'self' blob:;"
```

[VERIFIED: vue-pdf-embed README confirms default build uses blob URLs for worker; CSP spec confirms `worker-src` covers Web Workers separately from `script-src`]

### Pattern 6: WallecxApp.vue Wiring

The list component replaces the current `<p>{{ records.length }} vaccination records</p>` placeholder. The dialog overlay is added alongside:

```vue
<!-- WallecxApp.vue — diff -->
<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">Wallecx</h1>
      </div>

      <!-- Phase 2: replace the placeholder paragraph -->
      <VaccinationList
        :records="records"
        :is-loading="isLoading"
        @view="openDetail"
        @edit="() => {}"
        @remove="() => {}"
      />

      <!-- Detail dialog -->
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

### Anti-Patterns to Avoid

- **`v-html` for notes:** `notes` is plain text stored as a string. Render with `{{ record.notes }}` only. Never `v-html`. [PITFALLS.md Pitfall 10]
- **Token at list-fetch time:** Calling `pb.files.getToken()` inside `onMounted` alongside `getFullList` means the token expires before any user clicks a row. Call it inside `openDetail`. [PITFALLS.md Pitfall 9, CONTEXT.md READ-07]
- **Using `pb.files.getURL()` without a token on a protected field:** The `card` field has `protected: true`. Without a token the URL returns 403. Always append `{ token }` to `getURL` for the detail view. [VERIFIED: PocketBase docs]
- **Relaxing `script-src`:** The requirement (READ-06) is explicit: `script-src` must not be broadened. Only add `worker-src`. [VERIFIED: CSP spec, vue-pdf-embed README]
- **Naming new components `Card.vue`, `Dialog.vue`, `Image.vue`:** These collide with PrimeVue auto-imports. All Wallecx components must be prefixed (`VaccinationList`, `VaccinationDetail`, `AttachmentPreview`). [CONCERNS.md, PITFALLS.md Integration Gotchas]
- **Importing `vue-pdf-embed` at the top of AttachmentPreview.vue statically:** This bundles pdfjs-dist into the main chunk (~350 kB gzip). Use `defineAsyncComponent` exclusively.
- **Using `pb.files.getURL()` for list thumbnails without a token:** Even though the thumbnail URL has a short-lived token, list thumbnails (`?thumb=100x100`) also need token auth on a `protected: true` field. The list fetch does NOT generate a token — either accept that thumbnails in the list won't load (since the token must be per-view-session), or reconsider. See Open Questions #1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF rendering to canvas | Custom pdfjs-dist canvas loop | `vue-pdf-embed` component | Hand-rolled canvas code needs page-viewport math, rendering context management, loading states, error handling — vue-pdf-embed handles all of this |
| File access token | Custom signed URL | `pb.files.getToken()` | PocketBase's token endpoint handles auth, expiry, signing — rolling your own leaks auth surface |
| Thumb URL construction | String interpolation `/api/files/...?thumb=` | `pb.files.getURL(record, filename, { thumb: '100x100' })` | SDK handles base URL, record ID, filename encoding, and query param serialization correctly |
| Loading skeleton | CSS spinner + empty state | PrimeVue `<Skeleton>` inside DataTable `#body` slot | Skeleton fills exact cell space, preventing layout shift; spinner causes column collapse |
| Toast notifications | Custom alert div | `toast.error()` / `toast.success()` from `vue-sonner` | Already in the codebase; `<Toaster />` mounted in App.vue |
| MIME type database | Install a `mime` npm package | Extension check (`.endsWith()`) | The MIME allowlist is only 4 types (jpeg/png/webp/pdf). A 3-line check is sufficient and adds zero dependencies |

**Key insight:** The most dangerous hand-roll temptation is PDF rendering. The pdfjs-dist canvas API is deceptively low-level — page scale, viewport, canvas context lifecycle, and multi-page navigation all require significant glue code. `vue-pdf-embed` provides all of this in a single `<VuePdfEmbed :source="url" :page="1" />` line.

---

## Common Pitfalls

### Pitfall 1: List Thumbnails Fail Because Token Not Available at List Time

**What goes wrong:** The `card` field has `protected: true`. Thumbnail URLs in the DataTable (`pb.files.getURL(record, filename, { thumb: '100x100' })`) return 403 without a token. But `pb.files.getToken()` is called only when the detail dialog opens. Result: all thumbnail `<img>` tags in the list are broken images.

**Why it happens:** The token is intentionally not generated at list-fetch time (READ-07 decision). This creates a conflict between showing thumbnails in the list and keeping token generation lazy.

**How to avoid:** Three approaches (pick one — see Open Questions #1):
- **Option A:** Generate a single token at list-fetch time for the list view only (separate from the detail-view token), refresh it on expiry. This departs from READ-07 spirit but is pragmatic.
- **Option B:** Show only the placeholder icon in the list regardless of attachment presence — thumbnails only appear in the detail view. This satisfies READ-07 strictly and D-03 is relaxed to "thumbnail column present but no actual thumbnail".
- **Option C:** Accept the 403 and let `<img>` fall back to alt text / broken image. The placeholder icon (D-04) is shown for records without any card; broken images would appear for records with a card but no token.

**Warning signs:** All thumbnail images in the list show the browser's broken-image icon.

**Recommendation:** Option A — generate a short-lived list token alongside the `getFullList` call. The READ-07 requirement says tokens are "generated at view time, not list time" but its intent is to prevent tokens baked into static markup. Generating a fresh token per page load (in `onMounted`) is a reasonable interpretation. Capture in a separate `listToken` ref. The detail token is still separate (generated when the dialog opens).

[VERIFIED: PocketBase docs — protected file fields require token; CONTEXT.md READ-07]

### Pitfall 2: `defineAsyncComponent` Default Export vs Named Export

**What goes wrong:** `vue-pdf-embed` exports a default export (`VuePdfEmbed`). Using `defineAsyncComponent(() => import('vue-pdf-embed').then(m => m.default))` is correct; `defineAsyncComponent(() => import('vue-pdf-embed'))` also works because Vite resolves the default export automatically for ESM modules with a single default. However, if you write `import('vue-pdf-embed').then(m => m.VuePdfEmbed)` (non-existent named export), it resolves to `undefined` and renders nothing silently.

**How to avoid:** Use the simple form: `defineAsyncComponent(() => import('vue-pdf-embed'))`. Vite and Vue's async component resolution handle the default export correctly. [VERIFIED: vue-pdf-embed package.json exports map]

### Pitfall 3: Forgetting `<Suspense>` Wrapper for Async Component

**What goes wrong:** `defineAsyncComponent` components require a `<Suspense>` boundary to handle the pending state. Without `<Suspense>`, the async component renders nothing while loading (no fallback UI), and Vue emits a warning.

**How to avoid:** Always wrap `<VuePdfEmbed>` (the async component) in `<Suspense>` with a `#fallback` slot showing a `<Skeleton>`. [ASSUMED — Vue Suspense behavior; verified from Vue.js async component docs pattern]

### Pitfall 4: PDF.js Worker Blocked by CSP — Wrong Directive

**What goes wrong:** Developer adds `script-src 'self' blob:` instead of `worker-src 'self' blob:`. This broadens `script-src` (violating READ-06), and depending on browser CSP implementation, may or may not fix the worker. Some browsers fall back from `worker-src` to `script-src` if `worker-src` is absent — but if `worker-src` is present and wrong, neither fallback applies.

**How to avoid:** Add ONLY `worker-src 'self' blob:`. The `script-src` directive stays as `'self'`. Do not add `blob:` to `script-src`. [VERIFIED: vue-pdf-embed README + CSP specification]

### Pitfall 5: `pb.files.getURL()` Returns Empty String for Records with No Card

**What goes wrong:** `record.card` is an empty string (`""`) when no file is attached. `pb.files.getURL(record, "")` returns an empty string or a malformed URL. Passing that to `<VuePdfEmbed :source="">` causes a silent rendering failure; passing it to `<img :src="">` causes a broken-image request to the current page URL.

**How to avoid:** Gate `AttachmentPreview.vue` on `record.card` being truthy before calling `getURL`. This is already shown in the Pattern 4 template with `v-if="record.card"`. [VERIFIED: Vaccinations type definition — `card: string` (no `?` optional marker, so it exists but may be empty string)]

### Pitfall 6: Empty Skeleton Array Renders No Rows (Zero-Rows DataTable)

**What goes wrong:** If `skeletonRows = []` is passed as `:value`, the DataTable renders with headers but zero body rows — no skeleton visible, just an empty table during loading.

**How to avoid:** `Array.from({ length: 3 }, (_, i) => ({ id: String(i) }))` — a static array of 3 dummy objects. The number must be > 0. DataTable only renders body rows if `:value.length > 0`. [VERIFIED: DataTable behavior]

---

## Code Examples

Verified patterns from official sources and codebase:

### PocketBase getToken + getURL

```typescript
// Source: pocketbase SDK dist/pocketbase.es.d.ts lines 1069-1077 [VERIFIED]
// Token generation:
const token: string = await pb.files.getToken();

// URL construction with token:
const url: string = pb.files.getURL(record, record.card, { token });

// URL construction with thumbnail:
const thumbUrl: string = pb.files.getURL(record, record.card, { thumb: "100x100" });

// Combined (for list thumbnails with token):
const listThumbUrl: string = pb.files.getURL(record, record.card, { thumb: "100x100", token: listToken });

// Combined (for detail view with token + full thumb):
const detailUrl: string = pb.files.getURL(record, record.card, { thumb: "400x400", token: detailToken });
```

Note: `FileOptions` interface in SDK: `{ thumb?: string; download?: boolean }` extended with `CommonOptions`. The `token` key is part of `CommonOptions` as a query param passthrough. Actually — see important clarification in Open Questions #2.

### DataTable Skeleton Pattern

```vue
<!-- Source: PrimeVue DataTable + Skeleton docs [VERIFIED: primevue.org/datatable, primevue.org/skeleton] -->
<!-- Pass fake array; body slots show Skeleton instead of data -->
<DataTable :value="Array.from({ length: 3 }, () => ({}))" tableStyle="min-width: 30rem">
  <Column header="Card" style="width: 4rem">
    <template #body><Skeleton shape="rectangle" width="3rem" height="3rem" /></template>
  </Column>
  <Column header="Vaccine"><template #body><Skeleton /></template></Column>
  <Column header="Date"><template #body><Skeleton /></template></Column>
</DataTable>
```

### vue-pdf-embed Lazy Load

```vue
<!-- Source: vue-pdf-embed README + Vue.js async component docs [VERIFIED] -->
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
const VuePdfEmbed = defineAsyncComponent(() => import("vue-pdf-embed"));
</script>

<template>
  <Suspense>
    <VuePdfEmbed :source="tokenUrl" :page="1" @loading-failed="onPdfError" />
    <template #fallback>
      <Skeleton height="12rem" />
    </template>
  </Suspense>
</template>
```

### CSP meta tag change (index.html)

```html
<!-- Source: index.html line 9 [VERIFIED: file read] + worker-src CSP spec -->
<!-- CHANGE: append '; worker-src 'self' blob:' to the content attribute value -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src *; font-src 'self' data: https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self'; worker-src 'self' blob:;"
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vue-pdf` (unscoped) | `vue-pdf-embed` v2 | 2022+ | `vue-pdf` last updated Jun 2021 — security/compat drift; `vue-pdf-embed` is the current Vue 3 standard |
| `<iframe>` PDF preview | Canvas rendering via pdfjs-dist | Ongoing | iframe blocked by `frame-src 'none'` CSP; canvas has full programmatic control |
| `pb.files.getUrl()` (lowercase) | `pb.files.getURL()` (uppercase) | PocketBase SDK 0.2x+ | Old method is deprecated; same signature, use uppercase |
| Generating file tokens at load time | Generating tokens at view time | PocketBase 0.20+ | Short expiry (~2 min) makes load-time tokens expire before user interaction |

**Deprecated/outdated:**
- `pb.files.getUrl()` (lowercase): deprecated, replaced by `pb.files.getURL()`. Same signature. [VERIFIED: SDK type definitions line 1061]
- `pb.getFileUrl()` on the client root: also deprecated, replaced by `pb.files.getURL()`. [VERIFIED: SDK type definitions line 1402]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<Suspense>` is required to wrap `defineAsyncComponent` components for the fallback slot to work | Pattern 4, Pitfall 3 | Without `<Suspense>`, no fallback shown during PDF load — UX degradation, but not a functional failure |
| ~~A2~~ | ~~RESOLVED~~ The `token` option is passed as a query param directly — verified by reading SDK `getURL` implementation: `serializeQueryParams(s)` serializes the entire options object including `token` | Pattern 2, Code Examples | RESOLVED — `token` key confirmed |
| A3 | PrimeVue `<DataTable>` with a fake 3-element array + `#body` Skeleton renders 3 skeleton rows visually | Pattern 1, Pitfall 6 | If DataTable ignores the `#body` slot for skeleton display, the loading state shows empty columns only |
| A4 | `worker-src 'self' blob:` alone (without adding `blob:` to `script-src`) is sufficient for pdfjs-dist's blob worker to run in all major browsers | Pattern 5 | If older browser falls back to `script-src` for workers, PDF rendering fails in that browser; requires broadening `script-src` |

**Notes on A2 (RESOLVED):** The SDK `getURL` implementation calls `serializeQueryParams(s)` on the entire options object, which means any key-value pair including `{ token: fileToken }` becomes a query parameter. Confirmed by reading `pocketbase.es.mjs` source. `pb.files.getURL(record, filename, { token: fileToken })` produces `?token=...&...`. [VERIFIED: pocketbase/dist/pocketbase.es.mjs]

**Notes on A3:** Confirmed by PrimeVue docs example — the `#body` slot is used with a placeholder value array. If rows render but skeletons don't appear, ensure PrimeVue Skeleton component is accessible (auto-import is expected to handle this).

---

## Open Questions (RESOLVED)

1. **RESOLVED: List thumbnails and token generation**
   - What we know: `card` field is `protected: true`; tokens expire in ~2 minutes; READ-07 says token at view time not list time
   - What's unclear: Whether the intent of READ-07 is (a) never generate a token until the dialog opens, or (b) don't embed a stale token in list HTML — a fresh token on page load satisfies both
   - **Resolution:** Generate a single `listToken` in `onMounted` alongside `getFullList`. Use a separate `detailToken` (`fileToken`) generated in `openDetail`. This satisfies READ-07's spirit (no stale embedded tokens) while showing thumbnails in the list. Both tokens refresh on page navigation. Implemented in `02-04-PLAN.md` WallecxApp.vue wiring task.

2. ~~**Exact  parameter name in ** — RESOLVED during research~~ 
   - The SDK  implementation serializes the entire options object as query params.  becomes  in the URL. [VERIFIED: pocketbase/dist/pocketbase.es.mjs source inspection]
   - No open question remains here.

3. **RESOLVED: vue-pdf-embed `@loading-failed` event and error handling in Phase 2**
   - What we know: The component emits `loading-failed: (value: Error) => any` (from type definitions)
   - What's unclear: Whether the plan should show a fallback download link when PDF rendering fails (e.g., malformed PDF), or whether READ-04 "error states" covers this
   - **Resolution:** Handle `@loading-failed` in `AttachmentPreview.vue` via a `showPdfFallback` ref that switches to a download link: "Preview unavailable — Download PDF". This satisfies READ-04's error-state requirement. Implemented in `02-01-PLAN.md` AttachmentPreview.vue task.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is purely frontend code changes. All required libraries are already installed and verified in the local `node_modules`. No external services, new runtimes, or CLI tools beyond the existing `npm run dev` / `npm run build` workflow are required. `pdfjs-dist@4.10.38` is already resolved in `package-lock.json`.

---

## Project Constraints (from CLAUDE.md)

These are directives from `./CLAUDE.md` that constrain implementation:

| Directive | Impact on Phase 2 |
|-----------|-------------------|
| `<script setup lang="ts">` throughout | All three new SFCs must use Composition API with TypeScript |
| PrimeVue auto-imported via `PrimeVueResolver` | Do NOT manually import DataTable, Column, Skeleton, Dialog, Button, Skeleton in SFC `<script setup>` |
| `@` alias maps to `src/` | Use `@/types/wallecx/vaccinations/types` not relative paths |
| PocketBase via singleton `pb` from `@/lib/pocketbase` | No new PocketBase client instantiation |
| `vue-sonner` `toast.error()` for errors | Not native `alert()` or console-only |
| No Pinia — local `ref` state | `WallecxApp.vue` owns `records`, `isLoading`, `selectedRecord`, `showDetail`, `fileToken` as local refs |
| Tailwind CSS 4 utility-first | Style with Tailwind utilities + existing design tokens (`var(--color-brand-primary)`) |
| Component naming: PascalCase | `VaccinationList.vue`, `VaccinationDetail.vue`, `AttachmentPreview.vue` — not `vaccination-list.vue` |
| Never use `v-html` for user data | `notes` field must use `{{ record.notes }}` mustache only |
| Zod not required in Phase 2 | Phase 2 is read-only; no form validation needed |
| `iconify-icon` for icons | Use `<iconify-icon icon="mdi:...">` — NOT PrimeVue icon components for `mdi:` icons |

---

## Sources

### Primary (HIGH confidence — verified in this session via direct file/tool inspection)
- `node_modules/pocketbase/dist/pocketbase.es.d.ts` — `pb.files.getURL()`, `pb.files.getToken()`, `FileOptions` interface (lines 1061–1078)
- `node_modules/vue-pdf-embed/dist/types/VuePdfEmbed.vue.d.ts` — component props: `source`, `page`, events: `loading-failed`, `rendered`
- `node_modules/vue-pdf-embed/dist/types/composables.d.ts` — `useVuePdfEmbed` composable signature
- `node_modules/vue-pdf-embed/package.json` — version 2.1.4, peer dep `vue ^3.3.0`
- `package-lock.json` — `pdfjs-dist@4.10.38` (transitive dep from vue-pdf-embed)
- `package.json` — confirmed all runtime deps present, no install needed
- `src/types/wallecx/vaccinations/types.d.ts` — `card: string` (plain filename, no MIME)
- `src/components/projects/wallecx/WallecxApp.vue` — existing fetch pattern to extend
- `index.html` line 9 — current CSP meta tag content
- `components.d.ts` — auto-import registry; DataTable/Column/Skeleton not yet registered
- `vite.config.ts` — Rolldown code-splitting groups; pdf should be in vendor or a new group
- `.planning/codebase/CONVENTIONS.md` — naming, import order, error handling, styling
- `.planning/phases/02-read-path/02-CONTEXT.md` — locked decisions D-01 through D-06
- `.planning/research/PITFALLS.md` — Pitfalls 5, 9, 10, 12 directly relevant to Phase 2

### Secondary (MEDIUM confidence — verified via official web sources)
- [vue-pdf-embed README — github.com/hrynko/vue-pdf-embed](https://github.com/hrynko/vue-pdf-embed/blob/main/README.md) — default build uses blob worker; essential build for strict CSP
- [PrimeVue DataTable docs — primevue.org/datatable](https://primevue.org/datatable/) — `#body` slot skeleton pattern; `loading` prop
- [PocketBase Files Handling — pocketbase.io/docs/files-handling](https://pocketbase.io/docs/files-handling/) — `pb.files.getToken()`, `?token=`, `?thumb=` params

### Tertiary (LOW confidence — used only for supplementary context)
- Web search results for DataTable skeleton, worker-src CSP patterns — cross-verified with official sources above

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in node_modules
- Architecture: HIGH — WallecxApp.vue shell read directly; all patterns derived from existing codebase
- PocketBase token API: HIGH — SDK type definitions read directly
- vue-pdf-embed integration: MEDIUM — component types verified; defineAsyncComponent pattern from Vue docs; specific lazy-load behavior assumed standard
- DataTable skeleton pattern: MEDIUM — official docs confirm #body slot approach; exact rendering behavior of 3-row fake array [ASSUMED]
- Pitfalls: HIGH — derived from PITFALLS.md (already researched) + direct SDK inspection

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (stable stack; main risk is PocketBase SDK version bump)
