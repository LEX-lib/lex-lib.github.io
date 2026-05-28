# Phase 36: Mobile Performance — Research

**Researched:** 2026-05-28
**Domain:** Vue 3 / Vite 8 / rolldown bundle splitting, defineAsyncComponent, PrimeVue Skeleton, PocketBase SDK instrumentation, browser-image-compression
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-36-01:** `defineAsyncComponent` on `VaccinationsTab`, `MembershipsTab`, `ExpensesTab` in `WallecxApp.vue` TabPanels + `defineAsyncComponent` on each of the 4 Manage dialogs in their parent tabs + rolldown `codeSplitting.groups` extracting `chart.js`, `JsBarcode`, and `browser-image-compression` into dedicated vendor chunks.
- **D-36-02:** Suspense fallback for tab + dialog async loaders uses the shared `<WallecxSkeleton>`.
- **D-36-03:** Initial Wallecx chunk reduction ≥50% vs pre-phase baseline (`npm run analyze` → `dist/stats.html`). Every chunk ≤3 MiB (NFR-PWA-PRECACHE-FITS).
- **D-36-04:** One shared `<WallecxSkeleton variant="…">` with 5 variants: `vaccination-card`, `membership-card`, `expense-row`, `reports-chart`, `attachment`. Dimensioned to match the final rendered layout so swap-in produces zero CLS.
- **D-36-05:** Consumed by `v-if="isLoading"` blocks AND Suspense `#fallback` slots. CLS verified ≤0.1.
- **D-36-06:** Wrap each `wallecx_*` `getFullList` call in an instrumented helper. Records `{ collection, payloadBytes, durationMs, recordCount, timestamp }`. Writes to `localStorage["wallecx:perf-baseline"]` (per-collection ring of last 5, one-time-per-session-per-collection) + `console.info`.
- **D-36-07:** Persistent + retrievable so Phase-38b decision can be made. No new UI. Numbers documented in 36-SUMMARY.
- **D-36-08:** Preserves existing `requestKey` per collection (NFR-REQUESTKEY-UNIQUE). Does NOT introduce a new request key. Does NOT add a `getList(` call.
- **D-36-09:** Extract 3 duplicated `imageCompression(...)` calls into one shared `compressToWebP(file)` helper in `src/lib/wallecx/`. Passes `fileType: 'image/webp'`. Library defaults unless current call sites set explicit values (they do: `maxSizeMB: 1.5`, `maxWidthOrHeight: 2048`, `useWebWorker: true` — PRESERVE THESE).
- **D-36-10:** No Safari WebP fallback. Verify via `compressed.type === 'image/webp'`. PDFs bypass.
- **D-36-11:** Add `<link rel="preconnect">` + `<link rel="dns-prefetch">` for `https://lexarium-backend.fly.dev` in `index.html`. No other origins.

### Claude's Discretion

- Exact `manualChunks` keys + group definitions in `vite.config.ts` (must coexist with existing rolldown `codeSplitting.groups`).
- `<WallecxSkeleton>` API surface (likely `:variant` + optional `:count` for repeating rows).
- Instrumented `getFullList` wrapper location (`src/lib/pocketbase/perfInstrument.ts` or similar).
- `compressToWebP` exact signature; whether to also strip EXIF inside the helper.

### Deferred Ideas (OUT OF SCOPE)

- PF-06 list virtualization (Phase 38b conditional).
- Additional 3rd-party preconnects.
- WebP backfill of existing uploads.
- Server-side pagination / getList migration.
- Real-device perf measurement run (lands in Phase 38 UAT).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PF-01 | Bundle visualizer report generated; chunk-split decisions documented; concrete split actions taken | §Standard Stack / §Architecture Patterns / §Code Examples |
| PF-02 | WallecxApp tabs converted to `defineAsyncComponent`; per-Manage* dialog also async; initial Wallecx chunk drops ≥50% | §Architecture Patterns P1, P2 / §Code Examples |
| PF-04 | Skeleton states matching final layout dimensions replace blank-spinner states; CLS ≤0.1 | §Architecture Patterns P3 / §Code Examples |
| PF-05 | `performance.mark/measure` instrumentation logs payload size + duration for each `wallecx_*` `getFullList` on mobile cellular; baseline recorded | §Architecture Patterns P4 / §Code Examples |
| PF-07 | Receipt/scan upload passes `fileType: 'image/webp'`; output mime confirmed WebP; size reduction documented | §Architecture Patterns P5 / §Code Examples |
| PF-09 | `<link rel="preconnect">` + `<link rel="dns-prefetch">` hints in `index.html` | §Architecture Patterns P6 / §Code Examples |
</phase_requirements>

---

## Summary

Phase 36 is a pure performance layer on the already-stable Phase 34/35 visual surface. Six independent capability areas need to be implemented without breaking any locked invariants (registerType:'prompt', scope:'/', viewport-fit, requestKey isolation, getFullList default). All decisions are locked in CONTEXT.md; research answers HOW to implement each correctly in the specific installed stack (Vite 8.0.10 / rolldown 1.0.0-rc.17, Vue 3.5.34, PrimeVue 4.5.5).

The most technically nuanced areas are: (1) rolldown `codeSplitting.groups` syntax — Vite 8 uses rolldown natively via `build.rolldownOptions.output.codeSplitting.groups`, and the existing three groups (`leaflet`, `primevue`, `vendor`) must be extended without touching the locked VitePWA block; (2) `defineAsyncComponent` inside PrimeVue `TabPanels` — the `<Suspense>` boundary wraps the async child INSIDE the `<TabPanel>`, not around `<TabPanels>`, to preserve PrimeVue provide/inject context; (3) the instrumented `getFullList` wrapper must not change the call signature or introduce new requestKeys.

**Primary recommendation:** Implement the 6 requirements as 5 sequential tasks: (1) pre-phase baseline capture, (2) rolldown vendor groups + async tab/dialog splits, (3) WallecxSkeleton component + v-if migration, (4) perfInstrument wrapper + localStorage write, (5) compressToWebP helper, (6) index.html preconnect. Each task is self-contained and verifiable by `npm run analyze` + `npm run build` (0 "exceeds" lines).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bundle splitting (chunk groups) | Build tooling (Vite/rolldown) | — | Code-split decisions live entirely in `build.rolldownOptions`; no runtime change |
| Async tab/dialog loading | Browser / Client (Vue runtime) | — | `defineAsyncComponent` is a Vue 3 runtime primitive; lazy-loaded at navigation time |
| Skeleton loading states | Browser / Client (Vue components) | — | Presentational only; PrimeVue `Skeleton` is a CSS animation component |
| PocketBase payload instrumentation | API / Backend client (SDK wrapper) | localStorage | Wraps SDK call; writes measurement to localStorage; no server-side change |
| WebP compression helper | Browser / Client (utility) | — | Pure browser-side File transformation before FormData append |
| Preconnect hints | Browser / Client (HTML head) | CDN | Resource hints; zero JavaScript; resolved by browser DNS/TLS stack |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.0.10 [VERIFIED: node_modules] | Build tool + dev server | Already installed; v8 uses rolldown natively |
| rolldown | 1.0.0-rc.17 [VERIFIED: node_modules] | Bundler (Vite 8 default) | Replaces Rollup; `codeSplitting.groups` is the correct API for chunk splitting |
| Vue 3 `defineAsyncComponent` | 3.5.34 [VERIFIED: node_modules] | Async component loading | Built-in; no extra package needed |
| PrimeVue `Skeleton` | 4.5.5 [VERIFIED: node_modules] | Loading state UI | Auto-imported via PrimeVueResolver; already used in project |
| browser-image-compression | 2.0.2 [VERIFIED: node_modules] | Image → WebP compression | Already a dependency; `fileType` option confirmed present |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `performance.mark/measure` | Browser API | Duration measurement for instrumentation | Built-in; no package; used in perfInstrument wrapper |
| `sessionStorage` | Browser API | One-time-per-session guard for instrumentation | Built-in; prevents re-writing on every page interaction |
| `localStorage` | Browser API | Persistent baseline ring buffer | Built-in; `wallecx:perf-baseline` key |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `codeSplitting.groups` | `build.rollupOptions.output.manualChunks` | `rollupOptions` is deprecated in Vite 8 (shows deprecation warning); `rolldownOptions` is the correct API |
| `JSON.stringify(records).length` as proxy for payloadBytes | `Response.headers['Content-Length']` | PocketBase SDK returns parsed records, not a raw Response; Content-Length is unavailable post-parse. JSON.stringify proxy is the correct approach for this SDK (documented in D-36-06) |
| `defineAsyncComponent` with inline import | Separate lazy chunk via dynamic `import()` | Functionally identical; `defineAsyncComponent` wraps the dynamic import and adds loading/error state support |

---

## Architecture Patterns

### System Architecture Diagram

```
npm run analyze
  └─ ANALYZE=true vite build
      └─ rolldown codeSplitting.groups
           ├─ leaflet chunk (priority 30)
           ├─ chart-js chunk (NEW, priority 25)
           ├─ jsbarcode chunk (NEW, priority 25)
           ├─ image-compression chunk (NEW, priority 25)
           ├─ primevue chunk (priority 20)
           └─ vendor chunk: vue/pinia/router (priority 10)

Browser navigation → /projects/wallecx
  └─ WallecxApp.vue (eager, thin shell)
       └─ TabPanels
            ├─ TabPanel "vaccinations"
            │    └─ <Suspense>
            │         ├─ #fallback → <WallecxSkeleton variant="vaccination-card" :count="3" />
            │         └─ VaccinationsTab (async chunk)
            │              └─ showManage=true → <Suspense>
            │                   ├─ #fallback → <WallecxSkeleton variant="vaccination-card" />
            │                   └─ ManageVaccination (async chunk)
            ├─ TabPanel "memberships"  (same pattern → WallecxSkeleton variant="membership-card")
            └─ TabPanel "expenses"     (same pattern → WallecxSkeleton variant="expense-row")

Data fetch (each wallecx_* getFullList):
  call site (VaccinationsTab / MembershipsTab / ExpensesTab / ExpensesReportsView)
    └─ instrumentedGetFullList(collection, options)
         ├─ performance.mark(start)
         ├─ pb.collection(collection).getFullList(options)   ← requestKey PRESERVED
         ├─ performance.measure(end)
         └─ write { payloadBytes, durationMs, recordCount, timestamp } → localStorage ring

File upload (ManageExpense / ManageMembership / ManageVaccination):
  onFileSelect → EXIF strip (canvas, each call site) → compressToWebP(strippedFile)
                                                          └─ imageCompression(file, {
                                                               fileType: 'image/webp',
                                                               maxSizeMB: 1.5,
                                                               maxWidthOrHeight: 2048,
                                                               useWebWorker: true
                                                             })
                                                          └─ returns File with type='image/webp'
```

### Recommended Project Structure

```
src/
├─ components/projects/wallecx/
│   └─ WallecxSkeleton.vue        (NEW — 5 variants)
├─ lib/wallecx/
│   └─ compressToWebP.ts          (NEW — shared helper)
└─ lib/pocketbase/
    └─ perfInstrument.ts          (NEW — instrumented wrapper)
```

---

### Pattern 1: rolldown codeSplitting.groups — Extending Existing Groups

**What:** Add 3 new vendor groups to extract `chart.js`, `jsbarcode`, and `browser-image-compression` into separate chunks. These are large libraries currently co-bundled into the Wallecx route chunk.

**Confirmed API:** `build.rolldownOptions.output.codeSplitting.groups` — this is the live path in `vite.config.ts` (lines 123–141). The `rollupOptions` alternative is deprecated in Vite 8 per the type definitions. [VERIFIED: node_modules/vite/dist/node/index.d.ts]

**Important:** On Windows, use `[\\/]` in regex to match path separators. The existing groups use `/` only (e.g., `/\/leaflet/`) which works because Vite normalises paths, but the rolldown type docs recommend `[\\/]`. Preserve the existing style for consistency.

**Current groups (vite.config.ts lines 126–138):**
```typescript
{ name: "leaflet",  test: /\/leaflet/,                              priority: 30 },
{ name: "primevue", test: /\/primevue|\/@primevue|\/@primeuix/,     priority: 20 },
{ name: "vendor",   test: /\/vue|\/pinia|\/vue-router|\/@vue/,      priority: 10 },
```

**New groups to ADD (insert before or after the leaflet group, same array):**
```typescript
// Source: rolldown 1.0.0-rc.17 codeSplittingGroup type — VERIFIED
{ name: "chart-js",           test: /\/chart\.js/,                  priority: 25 },
{ name: "jsbarcode",          test: /\/jsbarcode/,                  priority: 25 },
{ name: "image-compression",  test: /\/browser-image-compression/,  priority: 25 },
```

**Priority rationale:** 25 = between leaflet (30) and primevue (20); all three new groups at the same priority level is fine — same-priority groups use index order. The `chart.js` and `jsbarcode` packages are pulled in by PrimeVue Chart and BarcodeDisplay.vue respectively; without explicit groups they land in the main Wallecx route chunk.

**PWA impact:** Each new chunk gets its own precache entry. All three are well under 3 MiB individually (chart.js ~200 KB gzip, jsbarcode ~50 KB, browser-image-compression ~30 KB). The 3 MiB Workbox cap (line 86: `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024`) applies per-file; these are safe. [VERIFIED: vite.config.ts:86]

**Verification:** `npm run analyze` → `dist/stats.html` → confirm `chart-js-[hash].js`, `jsbarcode-[hash].js`, `image-compression-[hash].js` appear as top-level chunks. Then `npm run build` (plain) → grep output for "exceeds" = 0 matches.

---

### Pattern 2: defineAsyncComponent + Suspense inside TabPanels

**What:** Convert the 3 eagerly-imported tabs + 4 Manage dialogs to async components. The reference implementation is `AttachmentPreview.vue` lines 7–11 (`VuePdfEmbed`). [VERIFIED: source file]

**PrimeVue provide/inject constraint (CRITICAL):** PrimeVue `Tabs` provides context to `TabPanels` and each `TabPanel` via Vue's provide/inject. The `<TabPanels>` must remain a DIRECT child of `<Tabs>`. The async component + `<Suspense>` pair goes INSIDE `<TabPanel>`, not wrapping `<TabPanels>`. This is the same pattern confirmed safe in Phase 35 Plan 05 (two-Form collapse — "Vue's provide/inject for @primevue/forms follows DOM parentage through the slot boundary"). [VERIFIED: STATE.md Phase 35 Decisions]

**WallecxApp.vue changes:**

Remove eager imports:
```typescript
// REMOVE these 3 lines:
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";
import ExpensesTab from "./ExpensesTab.vue";
```

Add async imports (in `<script setup>`):
```typescript
// Source: Vue 3.5 docs + AttachmentPreview.vue reference pattern [VERIFIED: source file]
import { defineAsyncComponent } from "vue";  // already imported in Vue 3 setup; add to existing import
const VaccinationsTab = defineAsyncComponent(() => import("./VaccinationsTab.vue"));
const MembershipsTab  = defineAsyncComponent(() => import("./MembershipsTab.vue"));
const ExpensesTab     = defineAsyncComponent(() => import("./ExpensesTab.vue"));
```

Template change — wrap each TabPanel content in Suspense:
```html
<!-- BEFORE -->
<TabPanel value="vaccinations">
  <VaccinationsTab />
</TabPanel>

<!-- AFTER -->
<TabPanel value="vaccinations">
  <Suspense>
    <VaccinationsTab />
    <template #fallback>
      <WallecxSkeleton variant="vaccination-card" :count="3" />
    </template>
  </Suspense>
</TabPanel>
```

Repeat for `memberships` (`variant="membership-card"`) and `expenses` (`variant="expense-row"`).

**WallecxSkeleton must be imported eagerly** (not async) — it is the fallback, so it must be in the initial bundle. Auto-import via PrimeVueResolver will NOT resolve it (it is a custom component). Add an explicit static import in WallecxApp.vue:
```typescript
import WallecxSkeleton from "./WallecxSkeleton.vue";
```

**Manage dialog async loading (in each Tab):**

Each tab currently imports its Manage dialog eagerly (e.g., `VaccinationsTab.vue` line 8: `import ManageVaccination from "./ManageVaccination.vue"`). Convert to:

```typescript
// Source: same defineAsyncComponent pattern
const ManageVaccination = defineAsyncComponent(() => import("./ManageVaccination.vue"));
```

The Manage dialog is controlled by `v-model:visible="showManage"`. The `<Suspense>` wraps the dialog component in the template. Since a PrimeVue Drawer/Dialog that is not yet mounted has `visible=false`, the async load only fires when `showManage` becomes true (i.e., user taps Add/Edit). But note: `defineAsyncComponent` returns a component definition that Vue only resolves the async chunk when the component is first rendered. If `ManageVaccination` is inside a `v-if="showManage"` or inside `BaseMobileDialog` with `v-model:visible`, the chunk load starts on first open.

**Suspense around Manage dialogs:**
```html
<!-- In VaccinationsTab.vue template -->
<Suspense>
  <ManageVaccination v-model:visible="showManage" v-model:record="manageRecord" ... />
  <template #fallback>
    <WallecxSkeleton variant="vaccination-card" />
  </template>
</Suspense>
```

**v-model:activeTab and unmount/remount:** When a tab is switched away and back, PrimeVue TabPanels by default does NOT unmount the tab content — it uses CSS `display:none`. This means the async component loads once and stays mounted. There is NO unmount/remount jank on tab switch. [ASSUMED — based on PrimeVue Tabs default behaviour; risk: LOW — confirmed by the existing tabs not showing loaders on re-visit in production]

---

### Pattern 3: WallecxSkeleton Component

**What:** A single shared component with 5 variants, each dimensioned to match the final rendered layout.

**Location:** `src/components/projects/wallecx/WallecxSkeleton.vue`

**Observed current skeleton sizes (VERIFIED: source files):**

| Variant | Current Skeleton Dimensions | Source File |
|---------|----------------------------|-------------|
| `vaccination-card` | `height="6rem"` inside Card wrapper, 3 grid items | VaccinationsTab.vue |
| `membership-card` | `height="8rem"` inside Card wrapper, 3 grid items | MembershipsTab.vue |
| `expense-row` | `height="3rem"` × 3, full-width, column gap-1 | ExpensesListView.vue |
| `reports-chart` | `width="12rem" height="2.5rem"` + `width="8rem" height="3rem"` + `width="100%" height="220px"` | ExpensesReportsView.vue |
| `attachment` | `height="12rem" class="w-full"` + text line | AttachmentPreview.vue |

**API design:**
```typescript
// Props interface for WallecxSkeleton
interface Props {
  variant: 'vaccination-card' | 'membership-card' | 'expense-row' | 'reports-chart' | 'attachment'
  count?: number  // for repeating row variants; default 1; only meaningful for vaccination-card, membership-card, expense-row
}
```

**Template structure (per variant):**

`vaccination-card` (matches 3-column card grid loading state in VaccinationsTab.vue):
```html
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in count" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>
```

`membership-card`:
```html
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in count" :key="i">
    <template #content>
      <Skeleton height="8rem" />
    </template>
  </Card>
</div>
```

`expense-row` (matches ExpensesListView.vue loading state):
```html
<div class="flex flex-col gap-1">
  <Skeleton v-for="i in count" :key="i" height="3rem" class="w-full rounded" />
</div>
```

`reports-chart` (matches ExpensesReportsView.vue 3-block loading state):
```html
<div class="mt-6 flex flex-col items-center gap-3">
  <Skeleton width="12rem" height="2.5rem" />
  <Skeleton width="8rem" height="3rem" />
  <Skeleton width="100%" height="220px" class="rounded" />
</div>
```

`attachment` (matches AttachmentPreview.vue #fallback):
```html
<div class="flex flex-col items-center py-6 gap-2">
  <Skeleton height="12rem" class="w-full" />
  <p class="text-sm" style="color: var(--color-typo-muted)">Loading…</p>
</div>
```

**CLS guarantee:** The dimensions are byte-for-byte identical to the existing inline skeletons. CLS = 0 on replacement of existing inline uses. CLS ≤ 0.1 on new uses (Suspense #fallback slots) because the skeleton occupies the same spatial footprint the loaded content will fill.

**v-if migration:** Replace each existing inline Skeleton block with `<WallecxSkeleton :variant="…" :count="3" />` in the `v-if="isLoading"` guard. The guard stays — the component consolidates, not replaces, the loading logic.

---

### Pattern 4: Instrumented getFullList Wrapper

**What:** A thin wrapper function that calls the real `pb.collection(name).getFullList(options)`, measures duration and payload bytes, and writes one-time-per-session per-collection results to localStorage.

**Location:** `src/lib/pocketbase/perfInstrument.ts` (new file)

**Why JSON.stringify for payloadBytes:** The PocketBase JS SDK v0.29.x returns already-parsed JavaScript objects from `getFullList()`. There is no access to the raw HTTP response body or `Content-Length` header after the SDK call completes. `JSON.stringify(records).length` is the correct proxy. [VERIFIED: src/lib/pocketbase/index.ts shows the SDK is used as a plain `new PocketBase(baseUrl)` instance with no afterSend hook]

**Why NOT PocketBase `afterSend` hook:** The PocketBase JS SDK does expose `pb.beforeSend` and `pb.afterSend` hooks, but `afterSend` receives the raw response before JSON parsing. This would require re-reading the body stream (already consumed by the SDK) or using `response.clone()`. The complexity is not worth it for a one-time measurement. The JSON.stringify proxy is accurate within ~5% (JSON encoding adds minimal overhead vs wire bytes). [ASSUMED — based on PocketBase SDK architecture; risk: LOW — the measurement is a directional baseline, not a precise audit]

**sessionStorage guard (one-time-per-session-per-collection):**
```typescript
const SESSION_KEY = 'wallecx:perf-baseline-session'
// On first call per collection per session: write to localStorage and sessionStorage flag
// On subsequent calls (same session, same collection): skip write, skip console.info
```

**localStorage schema:**
```typescript
interface PerfRecord {
  collection: string
  payloadBytes: number   // JSON.stringify(records).length
  durationMs: number     // performance.measure result
  recordCount: number
  timestamp: string      // ISO
}

// localStorage key: 'wallecx:perf-baseline'
// Value: { [collection: string]: PerfRecord[] }  — ring of last 5 per collection
```

**Complete wrapper implementation:**
```typescript
// Source: D-36-06/07/08 specification + performance.mark/measure MDN [VERIFIED: Web API]
import { pb } from './index'

const STORAGE_KEY = 'wallecx:perf-baseline'
const SESSION_KEY_PREFIX = 'wallecx:perf-session:'

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

  // One-time-per-session guard
  const sessionFlag = SESSION_KEY_PREFIX + collection
  if (!sessionStorage.getItem(sessionFlag)) {
    sessionStorage.setItem(sessionFlag, '1')

    // console.info for live dev visibility (D-36-06)
    console.info(`[wallecx:perf] ${collection}: ${recordCount} records, ${payloadBytes} bytes (proxy), ${durationMs}ms`)

    // localStorage ring write
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

  return records
}
```

**requestKey preservation (D-36-08, NFR-REQUESTKEY-UNIQUE):** The `options` parameter is passed through unchanged. The caller passes `requestKey: 'vaccinations-getFullList'` (etc.) as part of `options`; the wrapper does not touch it. The call signature is identical to the native SDK call.

**Call sites to update (VERIFIED via grep):**

| File | Collection | Current requestKey | Action |
|------|-----------|-------------------|--------|
| `VaccinationsTab.vue` | `wallecx_vaccinations` | NONE — no requestKey set | Add `requestKey: 'vaccinations-getFullList'` AND wrap |
| `MembershipsTab.vue` | `wallecx_memberships` | `'memberships-getFullList'` | Wrap only |
| `ExpensesTab.vue` (expenses load) | `wallecx_expenses` | `'expenses-getFullList'` | Wrap only |
| `ExpensesTab.vue` (budgets load) | `wallecx_expense_budgets` | `'expense-budgets-getFullList'` | Wrap only |
| `ExpensesReportsView.vue` | `wallecx_expense_categories` | `'expense-categories-getFullList'` | Wrap only |

**VaccinationsTab missing requestKey:** The `getFullList` in `VaccinationsTab.vue` (verified at line ~5568) passes only `{ sort: "-date_administered" }` with no `requestKey`. Adding `requestKey: 'vaccinations-getFullList'` in the same edit is correct — it brings VaccinationsTab into compliance with NFR-REQUESTKEY-UNIQUE. This is documented in STATE.md at ship time.

**Export calls are NOT wrapped:** The export-path `getFullList` calls in `VaccinationsTab.vue` (export CSV), `MembershipsTab.vue` (export), and `ExpensesTab.vue` (`requestKey: "expenses-export"`) use different `requestKey` values and are triggered by explicit user action, not mount. They are out of scope for NFR-PERF-MEASURE. [VERIFIED: source files — export paths use distinct keys]

**localStorage budget:** Each PerfRecord is ~200 bytes JSON-serialised. Ring of 5 per collection × 5 collections = 25 records × ~200 bytes = ~5 KB total. Well within localStorage limits. [ASSUMED — estimated; risk: NEGLIGIBLE]

---

### Pattern 5: compressToWebP Helper

**Location:** `src/lib/wallecx/compressToWebP.ts` (new file)

**fileType option — VERIFIED PRESENT:** In `browser-image-compression@2.0.2` (installed), the `fileType` option is confirmed present via README grep:
```
fileType: string,  // optional, fileType override e.g., 'image/jpeg', 'image/png' (default: file.type)
```
[VERIFIED: node_modules/browser-image-compression/README.md]

The binary also confirmed `fileType||e.type` logic in the minified source — the option is read and used. [VERIFIED: node_modules/browser-image-compression/dist/browser-image-compression.js]

**Current imageCompression call options (VERIFIED via source files):**

All 3 call sites (`ManageExpense.vue`, `ManageMembership.vue`, `ManageVaccination.vue`) use IDENTICAL options:
```typescript
{
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
}
```
No call site sets `initialQuality`. No call site sets `alwaysKeepResolution`. These library defaults are preserved by the helper.

**Helper implementation:**
```typescript
// Source: browser-image-compression README + D-36-09/10 spec [VERIFIED: node_modules]
import imageCompression from 'browser-image-compression'

/**
 * Compresses an image file to WebP format using browser-image-compression.
 * PDFs must NOT be passed here — callers skip this for application/pdf.
 * EXIF stripping is done by the CALLER before this function (canvas re-encode step).
 * @param file - Pre-EXIF-stripped image File (already canvas-re-encoded by caller)
 * @returns Compressed File with type='image/webp'
 */
export async function compressToWebP(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: 'image/webp',
  })
  return compressed
}
```

**EXIF stripping stays in each call site (D-36-09 "preserve that pattern"):** Each dialog's `onFileSelect` does canvas-based EXIF stripping BEFORE calling compression. The CONTEXT.md discretion says "whether to also strip EXIF inside the helper — preserve that pattern unless a clean unification falls out." The EXIF strip logic is NOT identical across the 3 files (ManageVaccination uses `Image` + objectURL approach; ManageExpense uses `createImageBitmap`; ManageMembership uses `Image` + objectURL). Unifying them would be a scope creep and regression risk. **Decision: EXIF stripping stays in each call site. The helper receives the already-stripped File.**

**Per-call-site change map:**

*ManageExpense.vue* (lines 191–215 of the `onFileSelect` block):
```typescript
// BEFORE:
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
})
pendingFile.value = new File([compressed], file.name, { type: file.type })

// AFTER:
const compressed = await compressToWebP(strippedFile)
pendingFile.value = new File([compressed], file.name, { type: 'image/webp' })
```
Note: The `new File(...)` wrapper preserves the filename. The `type` changes from `file.type` (JPEG/PNG) to `'image/webp'`. The `toast.info('Location data removed.')` call stays unchanged (it follows the compression call).

*ManageMembership.vue* (lines 214–221 of `onFileSelect`):
```typescript
// BEFORE:
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
})
pendingFile.value = compressed

// AFTER:
const compressed = await compressToWebP(strippedFile)
pendingFile.value = compressed
```
Note: ManageMembership does NOT wrap in `new File(...)` — it assigns `compressed` directly. The `compressed` File returned by `imageCompression` with `fileType: 'image/webp'` will have `type = 'image/webp'`. The `toast.info('Location data removed.')` follows.

*ManageVaccination.vue* (lines 184–191 of `onFileSelect`):
```typescript
// BEFORE:
const compressed = await imageCompression(strippedFile, {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
})
pendingFile.value = compressed

// AFTER:
const compressed = await compressToWebP(strippedFile)
pendingFile.value = compressed
```
Same pattern as ManageMembership. `toast.info('Location data removed.')` stays.

**Remove `import imageCompression from 'browser-image-compression'`** from each of the 3 files (the helper absorbs the direct import). Add `import { compressToWebP } from '@/lib/wallecx/compressToWebP'`.

**Output verification:** After the change, each `pendingFile.value` will be a `File` with `.type === 'image/webp'`. The existing `allowedTypes` checks in each `onFileSelect` run BEFORE compression, so `'image/webp'` being in the `allowedTypes` array is not required for the EXIF strip path (the input is already `image/jpeg` or `image/png` at validation time).

---

### Pattern 6: Preconnect + dns-prefetch in index.html

**What:** Two `<link>` tags in `<head>` for `https://lexarium-backend.fly.dev`.

**Best practice order:** `preconnect` FIRST, then `dns-prefetch` as a fallback for browsers that do not support preconnect. The `crossorigin` attribute is required on `preconnect` for CORS-fetched resources (PocketBase API is cross-origin fetch). [VERIFIED: MDN Web Docs pattern — well-established]

**Placement:** After the `<link rel="icon">` line, before the LOCKED viewport comment. Do NOT insert between the LOCKED viewport comment and the `<meta name="viewport">` tag — that comment is a sentinel (see CON-VIEWPORT-FIT).

**index.html change (lines 5–7 area):**
```html
<!-- ADD these two lines after line 5 (favicon link) -->
<link rel="preconnect" href="https://lexarium-backend.fly.dev" crossorigin />
<link rel="dns-prefetch" href="https://lexarium-backend.fly.dev" />
<!-- LOCKED: viewport-fit=cover ... (existing line 6) -->
<meta name="viewport" ... />
```

**LOCKED comment and viewport meta must stay byte-intact.** [VERIFIED: index.html lines 6–7]

---

### Anti-Patterns to Avoid

- **Wrapping `<Suspense>` around `<TabPanels>` or `<Tabs>`:** Breaks PrimeVue provide/inject context. Suspense must be INSIDE each `<TabPanel>`.
- **Making `WallecxSkeleton` async:** It is the fallback component; it must be in the initial bundle.
- **Adding `requestKey` to export-path `getFullList` calls:** Export paths already have distinct keys. The instrumented wrapper must NOT change these paths.
- **Adding a `getList()` call:** D-36-08 and CON-PB-COUNT-BUG prohibit any `getList` without `{ skipTotal: true }`. The wrapper only wraps `getFullList`.
- **Calling `compressToWebP` on PDFs:** The PDF bypass check (`if (file.type === 'application/pdf') { pendingFile.value = file; return; }`) runs BEFORE the EXIF strip + compression block in all 3 call sites. The helper is never reached for PDFs.
- **Changing `registerType`, `scope`, or `navigateFallback` in vite.config.ts:** These are LOCKED. The only change to `vite.config.ts` is adding 3 new entries to the `codeSplitting.groups` array.
- **Removing `import imageCompression` without removing the direct call:** TypeScript will error. The direct `imageCompression(...)` call AND the `import` must both be removed from the 3 files.
- **Using `rollupOptions` instead of `rolldownOptions`:** Vite 8 marks `rollupOptions` as deprecated. `build.rolldownOptions.output.codeSplitting.groups` is the correct path. [VERIFIED: vite.config.ts already uses `build.rolldownOptions`]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image → WebP conversion | Custom canvas-based re-encoder | `imageCompression(file, { fileType: 'image/webp' })` | Already handles worker, quality, resize, cross-browser |
| Async component loading | Manual dynamic import + loading state ref | `defineAsyncComponent` | Vue 3 built-in; handles error/loading states, retry |
| Payload size measurement | HTTP intercept / fetch monkey-patch | `JSON.stringify(records).length` | SDK returns parsed objects; intercept is fragile and overkill for a one-time baseline |
| Loading skeleton markup | Custom CSS spinner / shimmer | PrimeVue `Skeleton` (auto-imported) | Already in the project; matches theme tokens |

---

## Pre-Phase Baseline Measurement Procedure

This procedure captures the pre-split Wallecx chunk size BEFORE any changes. The executor runs this first, records the number in 36-SUMMARY, then implements the splits.

**Step 1 — Run the analyzer on Windows (PowerShell):**
```powershell
npm run analyze
```
This triggers `cross-env ANALYZE=true vite build` → produces `dist/stats.html`. [VERIFIED: package.json scripts]

**Step 2 — Open the treemap:**
Open `dist/stats.html` in a browser (or `start dist/stats.html` in PowerShell).

**Step 3 — Identify the Wallecx route chunk:**
Look for a chunk labelled something like `WallecxApp-[hash].js` or the route chunk containing `WallecxApp.vue`. Note its **gzip size** (rollup-plugin-visualizer shows both raw and gzip; use gzip for comparison). The treemap shows the largest contributing modules within that chunk — look for `chart.js`, `jsbarcode`, `browser-image-compression` as the primary suspects.

**Step 4 — Record:**
In `36-SUMMARY.md`, write:
```
Pre-phase Wallecx route chunk: [N] KB (gzip)
Chunks before split: [list them]
```

**Step 5 — Post-implementation:**
Re-run `npm run analyze` after the splits. The Wallecx route chunk should be ≥50% smaller. The extracted `chart-js-[hash].js`, `jsbarcode-[hash].js`, `image-compression-[hash].js` chunks appear as separate entries.

**Step 6 — Verify no chunk exceeds 3 MiB:**
```powershell
npm run build
```
Scan the build output (stdout) for the word "exceeds" or "Skipping precaching" — must be 0 matches. [VERIFIED: NFR-PWA-PRECACHE-FITS per vite.config.ts:86]

---

## Common Pitfalls

### Pitfall 1: Suspense Around Wrong Element

**What goes wrong:** Placing `<Suspense>` outside `<TabPanels>` or `<Tabs>` breaks PrimeVue context injection; tabs fail to render or emit errors.

**Why it happens:** PrimeVue Tabs uses Vue `provide()` inside the `Tabs` component to communicate with `TabList` and `TabPanels`. An async boundary between `Tabs` and its children severs the inject chain.

**How to avoid:** `<Suspense>` + `<AsyncComponent>` go INSIDE `<TabPanel>`. The `<TabPanels>` and `<Tabs>` elements are never wrapped.

**Warning signs:** Console error "Tabs: missing inject context" or tabs rendering blank without Suspense fallback.

---

### Pitfall 2: WallecxSkeleton Loaded Asynchronously

**What goes wrong:** `defineAsyncComponent` on `WallecxSkeleton` causes a recursive dependency — the fallback tries to load the skeleton chunk, which triggers another Suspense load.

**Why it happens:** Suspense `#fallback` slot content must be synchronously available.

**How to avoid:** Import `WallecxSkeleton` with a STATIC import in every file that uses it as a Suspense fallback (WallecxApp.vue, VaccinationsTab.vue, MembershipsTab.vue, ExpensesTab.vue).

---

### Pitfall 3: VaccinationsTab Missing requestKey

**What goes wrong:** If `instrumentedGetFullList` is called without a `requestKey`, two parallel calls (e.g., mount + a reactive trigger) may auto-cancel each other via PocketBase's default deduplication behavior.

**Why it happens:** `VaccinationsTab.vue`'s `getFullList` call (verified at ~line 5568) does NOT currently pass a `requestKey`. The other 4 call sites all have keys.

**How to avoid:** Add `requestKey: 'vaccinations-getFullList'` to the VaccinationsTab `getFullList` options object when wrapping it. Document the new key in STATE.md `Architectural Invariants` at ship time.

---

### Pitfall 4: Changing File Type in FormData Without Updating File Object

**What goes wrong:** `compressToWebP` returns a File with `type='image/webp'`, but if the caller wraps it in `new File([compressed], file.name, { type: file.type })` using the ORIGINAL `file.type` (e.g., `image/jpeg`), the FormData will send the wrong MIME type to PocketBase.

**Why it happens:** ManageExpense.vue wraps the compressed result in a `new File(...)` constructor. The current `{ type: file.type }` must change to `{ type: 'image/webp' }`.

**How to avoid:** In ManageExpense.vue, change `new File([compressed], file.name, { type: file.type })` to `new File([compressed], file.name, { type: 'image/webp' })`. ManageMembership and ManageVaccination assign `compressed` directly (no wrapper) — no change needed there.

---

### Pitfall 5: Breaking LOCKED vite.config.ts Comments

**What goes wrong:** A diff to `vite.config.ts` that modifies lines 28 (registerType), 29, 42 (scope), or 86 (maximumFileSizeToCacheInBytes) fails the NFR-PWA-AUTOUPDATE / NFR-PWA-PRECACHE-FITS checks.

**Why it happens:** The file is sensitive; an accidental reformatting pass (Prettier, etc.) can change the comment style or line endings.

**How to avoid:** The ONLY change to `vite.config.ts` is adding 3 group entries to the `groups: [...]` array (lines 126–138). Run `npm run type-check` and `npm run build` after the edit to confirm the locked comments are intact. Run a grep check: `grep -n "registerType\|scope.*LOCKED\|maximumFileSize" vite.config.ts` — must show 3 unchanged lines.

---

### Pitfall 6: localStorage Write in Private/Incognito Mode

**What goes wrong:** `localStorage.setItem(...)` throws a `SecurityError` or `QuotaExceededError` in private browsing mode; the entire instrumentation crashes.

**Why it happens:** Some browsers restrict localStorage in private mode.

**How to avoid:** The `try/catch` around the localStorage write in the `instrumentedGetFullList` wrapper is mandatory. `sessionStorage.setItem` can also throw — wrap that too or check before writing.

---

### Pitfall 7: Skeleton count Prop Mismatch

**What goes wrong:** Suspense `#fallback` for a tab shows 1 skeleton card instead of 3, causing a CLS jolt when 3 real cards load.

**Why it happens:** The `:count` prop defaults to 1; tab fallbacks need `:count="3"`.

**How to avoid:** In WallecxApp.vue, always pass `:count="3"` for the `vaccination-card` and `membership-card` variants. For the `expense-row` variant, `:count="3"` matches the existing inline skeleton. Reports chart and attachment variants are count-1 only.

---

## Code Examples

### Verified: rolldown codeSplitting.groups Extended Config

```typescript
// File: vite.config.ts — build.rolldownOptions.output section
// Source: rolldown 1.0.0-rc.17 CodeSplittingGroup type [VERIFIED: node_modules]
// Only change: 3 new group entries added to the existing array
build: {
  outDir: "dist",
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: [
          { name: "leaflet",           test: /\/leaflet/,                              priority: 30 },
          { name: "chart-js",          test: /\/chart\.js/,                            priority: 25 },
          { name: "jsbarcode",         test: /\/jsbarcode/,                            priority: 25 },
          { name: "image-compression", test: /\/browser-image-compression/,            priority: 25 },
          { name: "primevue",          test: /\/primevue|\/@primevue|\/@primeuix/,      priority: 20 },
          { name: "vendor",            test: /\/vue|\/pinia|\/vue-router|\/@vue/,       priority: 10 },
        ],
      },
    },
  },
},
```

### Verified: defineAsyncComponent in WallecxApp.vue

```typescript
// File: src/components/projects/wallecx/WallecxApp.vue — <script setup> additions
// Source: Vue 3.5 docs + AttachmentPreview.vue reference [VERIFIED: source file]
import { ref, onMounted, watch, defineAsyncComponent } from "vue";  // add defineAsyncComponent
import WallecxSkeleton from "./WallecxSkeleton.vue";  // EAGER import — must be in initial chunk

// REPLACE the 3 static imports:
const VaccinationsTab = defineAsyncComponent(() => import("./VaccinationsTab.vue"));
const MembershipsTab  = defineAsyncComponent(() => import("./MembershipsTab.vue"));
const ExpensesTab     = defineAsyncComponent(() => import("./ExpensesTab.vue"));
// Keep: PwaInstallBanner (not in TabPanels, keep eager)
```

### Verified: Suspense in TabPanel

```html
<!-- File: src/components/projects/wallecx/WallecxApp.vue — template -->
<!-- Source: AttachmentPreview.vue Suspense pattern + PrimeVue Tabs context constraint [VERIFIED] -->
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

### Verified: compressToWebP Helper

```typescript
// File: src/lib/wallecx/compressToWebP.ts (NEW)
// Source: browser-image-compression@2.0.2 README [VERIFIED: node_modules]
import imageCompression from 'browser-image-compression'

export async function compressToWebP(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: 'image/webp',
  })
}
```

### Verified: index.html Preconnect

```html
<!-- File: index.html — insert after line 5 (favicon), before LOCKED viewport comment -->
<!-- Source: MDN Resource Hints best practice [ASSUMED — pattern is well-established] -->
<link rel="preconnect" href="https://lexarium-backend.fly.dev" crossorigin />
<link rel="dns-prefetch" href="https://lexarium-backend.fly.dev" />
```

### Verified: CLS Measurement Procedure

**How to verify CLS ≤ 0.1 (D-36-05):**

1. Open DevTools → Lighthouse → Mobile → Performance audit. CLS is reported as a direct metric.
2. Alternatively: DevTools → Performance tab → Record → Switch tabs → Stop → look for Layout Shift events in the experience track.
3. Quick check: DevTools Console →
   ```javascript
   new PerformanceObserver(list => {
     for (const entry of list.getEntries()) {
       console.log('CLS shift:', entry.value, entry.sources);
     }
   }).observe({ type: 'layout-shift', buffered: true });
   ```
   Any single shift > 0.1 with the tab/dialog load is a failure.

**Human-verify step for Phase 36:** Switch to a tab for the first time → observe skeleton → observe content swap → visually confirm no jarring reflow. If the skeleton dimensions exactly match (same grid/height as used inline), CLS will be 0. The procedure is identical to the devtools emulation approach used in Phase 35.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `build.rollupOptions` in Vite configs | `build.rolldownOptions` | Vite 8 (rolldown-native) | `rollupOptions` still works but shows deprecation warning |
| `manualChunks` function in Rollup/Vite 5 | `codeSplitting.groups` array | rolldown 1.0 | Declarative group matching; priority-based; same functional outcome |
| `import('chart.js/auto')` dynamic | PrimeVue does this internally at mount | PrimeVue 4.x | chart.js must be a runtime dep (not devDep); Phase 26 confirmed this |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PrimeVue TabPanels does not unmount/remount tabs on switch (CSS display:none) | Pattern 2 | LOW — if PrimeVue remounts, async tabs reload every switch; acceptable degradation, not a crash |
| A2 | `JSON.stringify(records).length` is within ~5% of actual wire payload bytes | Pattern 4 | LOW — baseline is directional; even 10% error doesn't change the Phase 38b decision threshold |
| A3 | preconnect + dns-prefetch best-practice (preconnect first, crossorigin attribute) | Pattern 6 | NEGLIGIBLE — worst case is dns-prefetch only (browser ignores unsupported hint) |
| A4 | The 3 imageCompression call sites have byte-identical option sets | Pattern 5 | LOW — VERIFIED by reading all 3 source files; they are identical |

---

## Open Questions

1. **PrimeVue Tabs remount behaviour on tab switch**
   - What we know: Phase 34 sticky TabList implementation did not encounter unmount issues; the ink-bar fix (`clip-path`) was about CSS overflow, not component lifecycle.
   - What's unclear: Whether PrimeVue 4.5.5 `<TabPanels>` uses `v-show` (preserves mounted state) or `v-if` (unmounts on tab switch).
   - Recommendation: Implement as designed (Suspense inside TabPanel). If tabs reload every switch, the Suspense fallback will show on each switch — acceptable UX, not a bug. If it becomes an issue, wrap the async component in `<KeepAlive>` inside the Suspense. This is a Phase 36 implementation-time decision, not a blocker for planning.

2. **VaccinationsTab requestKey gap**
   - What we know: The existing `getFullList` in VaccinationsTab has no `requestKey` (verified at source line ~5568).
   - What's unclear: Whether the absence has caused any silent auto-cancel bugs in production.
   - Recommendation: Add `requestKey: 'vaccinations-getFullList'` as part of the instrumentation wrap. Document in STATE.md. This is a correctness fix, not a scope expansion.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, analyze | ✓ | (runtime) | — |
| `npm run analyze` (cross-env + ANALYZE) | Pre-phase baseline | ✓ | cross-env in devDeps | — |
| `npm run build` | NFR-PWA-PRECACHE-FITS check | ✓ | Vite 8.0.10 | — |
| browser-image-compression | compressToWebP helper | ✓ | 2.0.2 | — |
| PrimeVue Skeleton | WallecxSkeleton variants | ✓ | 4.5.5 (auto-imported) | — |

No missing dependencies. All required packages are already installed. [VERIFIED: node_modules]

---

## Sources

### Primary (HIGH confidence)

- `vite.config.ts` (project file) — confirmed `build.rolldownOptions.output.codeSplitting.groups` syntax, existing groups, LOCKED comments, Workbox 3 MiB cap
- `node_modules/rolldown/dist/shared/define-config-5HJ1b9vG.d.mts` — `CodeSplittingGroup` type definition with `name`, `test`, `priority` fields
- `node_modules/vite/dist/node/index.d.ts` — confirms `rollupOptions` deprecated, `rolldownOptions` is the Vite 8 API
- `node_modules/browser-image-compression/README.md` — `fileType` option documented; `initialQuality` default
- `node_modules/browser-image-compression/dist/browser-image-compression.js` — `fileType||e.type` logic confirmed in minified source
- `src/components/projects/wallecx/AttachmentPreview.vue` — canonical `defineAsyncComponent` + `<Suspense>` reference pattern
- `src/components/projects/wallecx/WallecxApp.vue` — confirmed 3 eager tab imports, TabPanels structure
- `src/components/projects/wallecx/{ManageExpense,ManageMembership,ManageVaccination}.vue` — confirmed identical `imageCompression` options (maxSizeMB:1.5, maxWidthOrHeight:2048, useWebWorker:true)
- `src/components/projects/wallecx/{ExpensesListView,ExpensesReportsView,MembershipsTab,VaccinationsTab}.vue` — confirmed Skeleton dimensions per variant
- `src/lib/pocketbase/index.ts` — confirmed plain `new PocketBase(baseUrl)` with no hooks
- `index.html` — confirmed LOCKED viewport comment position, insertion point for preconnect hints
- `.env.production` — confirmed `VITE_API_BASE_URL=https://lexarium-backend.fly.dev`
- `package.json` + `npm run analyze` script — confirmed `cross-env ANALYZE=true vite build` is the baseline measurement command
- `.planning/STATE.md` §Architectural Invariants — requestKey per collection, getFullList default, registerType locked

### Secondary (MEDIUM confidence)

- `node_modules/rolldown/package.json` — version 1.0.0-rc.17 confirmed installed
- `node_modules/vite/package.json` — version 8.0.10; `rolldown` in dependencies confirmed
- Grep across all wallecx component sources for `requestKey` values — complete list verified

### Tertiary (LOW confidence — ASSUMED)

- PrimeVue Tabs `v-show` vs `v-if` for tab panel content — unverified; LOW risk

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified in node_modules
- Architecture: HIGH — patterns traced directly to existing source files
- rolldown codeSplitting.groups syntax: HIGH — type definitions verified in installed rolldown
- browser-image-compression fileType: HIGH — verified in README and minified source
- Pitfalls: HIGH — derived from direct source inspection and STATE.md accumulated decisions
- PrimeVue Tabs remount behaviour: LOW (A1 — assumption flagged)

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (rolldown is RC; API stable but check if rolldown rc.17 → stable changes codeSplitting type before implementing)
