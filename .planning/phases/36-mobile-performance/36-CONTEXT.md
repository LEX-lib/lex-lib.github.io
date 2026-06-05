# Phase 36: Mobile Performance - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Cut the initial Wallecx mobile chunk by **≥50%** via visualizer-driven splits + async loading (PF-01/02), replace blank-spinner loads with **layout-matched skeletons** that lock CLS ≤ 0.1 (PF-04), instrument `wallecx_*` `getFullList` **payload + duration** on mobile cellular and persist the baseline (PF-05 — this measurement is the GATE for Phase 38b conditional virtualization), switch receipt/scan uploads to **WebP** (PF-07), and add **PocketBase preconnect/dns-prefetch hints** to cut warm cellular cold-start (PF-09). PF-06 list virtualization is conditional and lives in Phase 38b — NOT in this phase's scope.

This is the **performance layer.** The Phase 34/35 visual+forms surface is stable, so chunk-split regressions are detectable, and skeletons can be dimensioned against the final shipped layout.

</domain>

<decisions>
## Implementation Decisions

### Async-loading granularity (PF-02 + manual chunks)
- **D-36-01:** **Aggressive split.** `defineAsyncComponent` on `VaccinationsTab`, `MembershipsTab`, `ExpensesTab` in `WallecxApp.vue`'s `TabPanels` (each tab loads only when its tab is selected); **plus** `defineAsyncComponent` on each of the 4 Manage dialogs in their parent tabs (load only when the user opens "Add/Edit"); **plus** rolldown `manualChunks` / `codeSplitting.groups` extracting `chart.js`, `JsBarcode`, and `browser-image-compression` into dedicated vendor chunks. `AttachmentPreview.vue`'s existing `defineAsyncComponent(vue-pdf-embed)` + `<Suspense>` is the reference pattern.
- **D-36-02:** Suspense fallback for tab + dialog async loaders uses the **shared `<WallecxSkeleton>`** (D-36-03), so the loading state is layout-matched and CLS-clean (no flash).
- **D-36-03:** Initial Wallecx chunk reduction **target ≥ 50%** vs the pre-phase baseline measured from the Phase-33 visualizer (`npm run analyze` → `dist/stats.html`). Baseline + post-phase size both recorded in 36-SUMMARY and the milestone close. Must keep every chunk ≤ 3 MiB (NFR-PWA-PRECACHE-FITS — Workbox cap).

### Skeleton strategy (PF-04)
- **D-36-04:** Build **one shared `<WallecxSkeleton variant="…">` component** with 5 layout-matched variants: `vaccination-card`, `membership-card`, `expense-row`, `reports-chart`, `attachment`. Each variant is dimensioned to MATCH the final rendered layout (same width / height / spacing / number of placeholder lines) so swap-in produces **zero CLS**. Replaces (consolidates) the existing inline skeletons in `ExpensesListView` + `ExpensesReportsView` + `AttachmentPreview`, and ADDS skeletons to `VaccinationsTab` + `MembershipsTab` where none exist today.
- **D-36-05:** Consumed by each surface in its `v-if="isLoading"` block AND by the Suspense `#fallback` of every async-loaded tab/dialog (D-36-02). CLS verified ≤ 0.1 on the mobile test viewports.

### PF-05 instrumentation output (NFR-PERF-MEASURE)
- **D-36-06:** Wrap each `wallecx_*` `getFullList` call in an instrumented helper that records `{ collection, payloadBytes, durationMs, recordCount, timestamp }` (payload size from the JSON `Content-Length` if available, else `JSON.stringify(records).length` after fetch). Writes to **`localStorage["wallecx:perf-baseline"]`** (a per-collection ring of the last 5 measurements; **one-time-per-session-per-collection** so we don't flood storage) AND `console.info` for live dev visibility.
- **D-36-07:** Persistent + retrievable so the Phase-38b decision can be made by reading the localStorage value (or DevTools console). No new UI. Documented in 36-SUMMARY with the actual baseline numbers captured on a mid-tier mobile cellular session.
- **D-36-08:** The instrumented wrapper preserves the existing `requestKey` per collection (NFR-REQUESTKEY-UNIQUE) — does NOT introduce a new request key, does NOT add a `getList(` call (only wraps `getFullList`). If a future getList is introduced, it must pass `{ skipTotal: true }` (CON-PB-COUNT-BUG).

### WebP conversion (PF-07)
- **D-36-09:** **Image-only WebP, centralized helper.** Extract the 3 duplicated `imageCompression(...)` calls in `ManageExpense.vue`, `ManageMembership.vue`, and `ManageVaccination.vue` into **one shared `compressToWebP(file)` helper** in `src/lib/wallecx/` that passes `fileType: 'image/webp'` to `browser-image-compression` (library defaults for `initialQuality` / `maxSizeMB` unless the current call sites set explicit values — preserve those if so). PDFs continue to bypass compression entirely (existing behavior unchanged).
- **D-36-10:** **No Safari WebP fallback.** Safari 14+ supports WebP; the audience in 2026 is universal. Output mime confirmed via `compressed.type === 'image/webp'`; storage size reduction recorded in 36-SUMMARY (compare a sample upload pre/post).

### PF-09 preconnect / dns-prefetch
- **D-36-11:** Add `<link rel="preconnect">` + `<link rel="dns-prefetch">` for the **PocketBase origin only** (`https://lexarium-backend.fly.dev` — same env in dev + prod per `.env.development` / `.env.production`). Hardcoded in `index.html` is acceptable (env doesn't vary across deployments). No additional 3rd-party preconnects added in this phase.

### Claude's Discretion
- Exact `manualChunks` keys + group definitions in `vite.config.ts` (must coexist with the existing rolldown `codeSplitting.groups`).
- `<WallecxSkeleton>` API surface (likely `:variant` + optional `:count` for repeating rows).
- Instrumented `getFullList` wrapper location (`src/lib/pocketbase/perfInstrument.ts` or similar).
- `compressToWebP` exact signature; whether to also strip EXIF inside the helper (currently each call site does it separately — preserve that pattern unless a clean unification falls out).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 36: Mobile Performance" — goal, 6 success criteria, bound NFR/CON (NFR-PERF-MEASURE, NFR-PWA-PRECACHE-FITS, CON-PB-COUNT-BUG, NFR-REQUESTKEY-UNIQUE).
- `.planning/REQUIREMENTS.md` — PF-01/02/04/05/07/09 (PF-06 conditional → Phase 38b).
- `.planning/STATE.md` §"Architectural Invariants" — requestKey per collection (no auto-cancel), iOS overlay scan, registerType:'prompt' (PWA), NetworkOnly /api/*.

### Phase 33 substrate (already in place)
- `vite.config.ts` (rolldown `codeSplitting.groups` ~line 125, Workbox `maximumFileSizeToCacheInBytes` 3 MiB ~line 86, VitePWA registerType:'prompt' LOCKED ~line 28, scope:'/' LOCKED ~line 42) — chunk-split lands here.
- `npm run analyze` → `dist/stats.html` (Phase 33 ANALYZE-gated visualizer; baseline reference for D-36-03).

### Components touched this phase
- `src/components/projects/wallecx/WallecxApp.vue` — async-import the 3 tabs in `TabPanels`.
- `src/components/projects/wallecx/{Vaccinations,Memberships,Expenses}Tab.vue` — async-import the Manage dialog children.
- `src/components/projects/wallecx/AttachmentPreview.vue` (~line 2-7) — REFERENCE PATTERN for `defineAsyncComponent` + `<Suspense>`.
- `src/components/projects/wallecx/{ExpensesListView,ExpensesReportsView,AttachmentPreview}.vue` — existing inline Skeleton usage to consolidate into shared variants.
- `src/components/projects/wallecx/{ManageExpense,ManageMembership,ManageVaccination}.vue` — 3 imageCompression call sites to centralize.
- `src/lib/pocketbase/*` — instrumented `getFullList` wrapper home (new file).
- `src/lib/wallecx/*` — `compressToWebP` helper home (new file).
- `index.html` — PF-09 preconnect/dns-prefetch hints.

### Environment
- `.env.development` / `.env.production` — `VITE_API_BASE_URL=https://lexarium-backend.fly.dev` (PB origin for preconnect).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`AttachmentPreview.vue` `defineAsyncComponent` + `<Suspense>` pattern** — the canonical async-loader reference for the 3 tabs + 4 Manage dialogs.
- **`browser-image-compression`** already a dep; current calls just need a `fileType` param + centralization.
- **`Skeleton`** (PrimeVue, auto-imported) — building block for `<WallecxSkeleton>` variants.
- **rolldown `codeSplitting.groups`** already in `vite.config.ts` — extend with vendor chunk groups.

### Established Patterns
- requestKey per collection (locked since v2.0) — instrumentation must not introduce new keys.
- `getFullList` (NOT `getList`) is the default per D-31-B — wrapper preserves this; any new `getList` requires `{ skipTotal: true }`.
- Lazy chunk-scoped CSS via WallecxApp.vue import (Phase 34/35) — no new globals.

### Integration Points
- Async loaders live in `WallecxApp.vue` (tabs) and in each tab (their Manage dialog).
- `<WallecxSkeleton>` imported by every loading surface + every Suspense `#fallback`.
- Instrumented `getFullList` wrapper imported by every `wallecx_*` `getFullList` call site.
- `compressToWebP` imported by the 3 Manage dialogs (replacing the inline calls).
- PF-09 hints in `index.html` `<head>` near the existing meta tags.

</code_context>

<specifics>
## Specific Ideas

- ≥50% initial-chunk reduction is the explicit target (D-36-03); the visualizer comparison + chunk size table go in 36-SUMMARY.
- PF-05 baseline numbers are RECORDED, not just measured — the localStorage values + a one-line summary per collection land in 36-SUMMARY so the Phase-38b decision is grounded in actual numbers.
- Centralization of the 3 imageCompression call sites is the explicit choice (not preserved-as-is) — small refactor with clear payoff.

</specifics>

<deferred>
## Deferred Ideas

- **PF-06 list virtualization** — conditional, triggered only if PF-05 baseline reveals >16ms scroll jank or any collection >500 rows. Owned by Phase 38b. Not planned here.
- **Additional 3rd-party preconnects** (Google Fonts, iconify CDN, etc.) — out of PF-09 scope; PB origin only.
- **WebP backfill of existing uploads** — out of scope; only new uploads (PF-07).
- **Server-side pagination / getList migration** — out of scope; `getFullList` remains the default (D-31-B) until/unless PF-05 + 38b drive a different decision.
- **Real-device perf measurement run** — instrumentation lands here; the actual mid-tier mobile cellular reading happens during Phase 38 UAT sweep (which then writes the value back to 36-SUMMARY / Phase 38b trigger evaluation).

</deferred>

---

*Phase: 36-mobile-performance*
*Context gathered: 2026-05-28*
