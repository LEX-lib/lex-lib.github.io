---
phase: 36-mobile-performance
plan: 01
subsystem: performance
tags: [vite, rolldown, code-splitting, skeleton, pocketbase, webp, browser-image-compression]

requires:
  - phase: 33-mobile-foundation
    provides: ANALYZE-gated rollup-plugin-visualizer, rolldown codeSplitting.groups substrate, npm run analyze script
  - phase: 35-forms-dialogs-on-small-screens
    provides: stable visual surface; WallecxApp, VaccinationsTab, MembershipsTab, ExpensesTab at final dimensions

provides:
  - WallecxSkeleton.vue with 5 byte-matched variants (vaccination-card, membership-card, expense-row, reports-chart, attachment)
  - perfInstrument.ts — instrumentedGetFullList wrapper with localStorage ring + sessionStorage guard
  - compressToWebP.ts — centralized WebP image compression helper
  - vite.config.ts extended with chart-js/jsbarcode/image-compression codeSplitting groups at priority 25
  - 36-BASELINE.md with pre-phase chunk size + reduction target (≤32 KB gzip for WallecxApp)

affects:
  - 36-02 (async tab splits consume WallecxSkeleton + codeSplitting groups)
  - 36-03 (perfInstrument consumer migration)
  - 36-04 (compressToWebP consumer migration in ManageExpense/Membership/Vaccination)
  - 36-07 (post-phase analyze run compares against 36-BASELINE.md numbers)

tech-stack:
  added: []
  patterns:
    - "WallecxSkeleton.vue: single shared variant-prop component consolidating 5 inline skeleton blocks, CLS-safe via byte-matched dimensions"
    - "perfInstrument.ts: instrumented SDK wrapper preserving requestKey, sessionStorage one-shot guard + localStorage ring, private-mode-safe try/catch"
    - "compressToWebP.ts: lib/wallecx utility helper pattern (single named export, plain import, no path alias within lib)"
    - "rolldown codeSplitting.groups: priority 25 vendor chunks inserted between leaflet (30) and primevue (20)"

key-files:
  created:
    - src/components/projects/wallecx/WallecxSkeleton.vue
    - src/lib/pocketbase/perfInstrument.ts
    - src/lib/wallecx/compressToWebP.ts
    - .planning/phases/36-mobile-performance/36-BASELINE.md
  modified:
    - vite.config.ts (3 new codeSplitting.groups entries)

key-decisions:
  - "WallecxSkeleton dimensions are byte-identical to the inline blocks they consolidate (VaccinationsTab:358-365, MembershipsTab:256-263, ExpensesListView:128-131, ExpensesReportsView:430-435, AttachmentPreview:75-80) — zero CLS guarantee"
  - "perfInstrument.ts wraps only getFullList (not getList per D-36-08/CON-PB-COUNT-BUG); passes options unchanged to preserve requestKey per NFR-REQUESTKEY-UNIQUE"
  - "compressToWebP.ts: EXIF strip stays in each call site (ManageExpense uses createImageBitmap; ManageMembership/ManageVaccination use Image+objectURL — cannot unify cleanly per D-36-09)"
  - "codeSplitting.groups: priority 25 for all 3 new groups (chart-js, jsbarcode, image-compression) — between leaflet:30 and primevue:20; same-priority groups use index order"
  - "vite.config.ts LOCKED lines 28/42/86/88 byte-intact: registerType:prompt, scope:/, maximumFileSizeToCacheInBytes:3MiB, navigateFallback:index.html"
  - "36-BASELINE.md pre-phase: WallecxApp 230.21 KB raw / 64.09 KB gzip; target ≤32 KB gzip (floor of 64*0.5); codeSplitting groups alone reduced it to 32.81 KB gzip (~49%)"

patterns-established:
  - "Variant-prop skeleton component: withDefaults defineProps with count default 1; Skeleton and Card auto-imported via PrimeVueResolver; no style block; dimensions byte-matched to inline analog"
  - "SDK instrumentation wrapper: performance.mark/measure; JSON.stringify(records).length proxy; nested try/catch for sessionStorage+localStorage private-mode safety"
  - "lib/wallecx utility: plain named export, browser-image-compression default import, no @/ alias within lib dir"

requirements-completed: [PF-01, PF-02, PF-04, PF-05, PF-07]

duration: 25min
completed: 2026-05-28
---

# Phase 36 Plan 01: Foundation Summary

**Pre-phase baseline (64 KB gzip), WallecxSkeleton 5-variant component, perfInstrument getFullList wrapper, compressToWebP helper, and 3 rolldown vendor chunk groups (chart-js/jsbarcode/image-compression) reducing WallecxApp to 32.81 KB gzip**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-28T12:42:17Z
- **Completed:** 2026-05-28T13:07:00Z
- **Tasks:** 5
- **Files modified/created:** 5

## Accomplishments

- Captured pre-phase baseline: WallecxApp route chunk 230.21 KB raw / 64.09 KB gzip
- Created WallecxSkeleton.vue with 5 byte-matched variants (vaccination-card/membership-card/expense-row/reports-chart/attachment) — CLS-safe foundation for Suspense fallbacks in Plans 36-02/03
- Created perfInstrument.ts with instrumentedGetFullList: performance.mark/measure, sessionStorage one-shot guard, localStorage ring (last 5), nested try/catch for private-mode safety, preserves requestKey
- Created compressToWebP.ts with fileType:'image/webp' + preserved options (maxSizeMB:1.5, maxWidthOrHeight:2048, useWebWorker:true) — centralizes 3 identical call sites
- Extended vite.config.ts with 3 new codeSplitting.groups at priority 25; immediate effect: WallecxApp chunk dropped from 230.21 KB → 113.95 KB raw / 64.09 KB → 32.81 KB gzip (~49% reduction)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pre-phase baseline capture** — `e247775` (docs)
2. **Task 2: WallecxSkeleton.vue** — `02d857a` (feat)
3. **Task 3: perfInstrument.ts** — `b8b6b3f` (feat)
4. **Task 4: compressToWebP.ts** — `ed500da` (feat)
5. **Task 5: vite.config.ts codeSplitting groups** — `16dd41a` (feat)
6. **Baseline update with interim measurement** — `e20bfc9` (docs)

## Files Created/Modified

- `src/components/projects/wallecx/WallecxSkeleton.vue` — 5-variant shared skeleton component; Skeleton+Card auto-imported; :count prop (default 1); no style block
- `src/lib/pocketbase/perfInstrument.ts` — instrumentedGetFullList wrapper; performance.mark/measure; localStorage ring; sessionStorage guard; nested try/catch
- `src/lib/wallecx/compressToWebP.ts` — WebP compression helper; imageCompression with fileType:'image/webp' and 3 preserved options
- `vite.config.ts` — 3 new codeSplitting.groups (chart-js/jsbarcode/image-compression at priority 25)
- `.planning/phases/36-mobile-performance/36-BASELINE.md` — pre-phase numbers + post-groups interim measurement

## Decisions Made

- **Skeleton dimensions byte-matched**: All 5 variants use exact same dimensions as the inline skeleton blocks they will consolidate — no guessing, zero CLS risk
- **EXIF strip not unified in helper**: ManageExpense uses `createImageBitmap`, ManageMembership/Vaccination use `Image+objectURL` — different enough that unification would be risky scope creep (D-36-09 preserved)
- **codeSplitting groups work immediately**: Adding 3 groups reduced the WallecxApp chunk by ~49% without any other changes; the Plan 36-02/03 async splits will push it further below 32 KB
- **perfInstrument nested try/catch**: Outer try/catch wraps sessionStorage (can throw in private mode), inner try/catch wraps localStorage (Pitfall 6 from RESEARCH)

## Deviations from Plan

None - plan executed exactly as written. All 5 tasks followed the prescribed implementations verbatim.

## Issues Encountered

None. All acceptance criteria met on first attempt. The rolldown codeSplitting groups worked immediately and produced a measurable ~49% reduction in the WallecxApp chunk gzip size as a side effect of Task 5 (before async component splits in Plans 36-02/03).

## Verification Gates (post-execution)

- `npm run type-check`: 0 errors
- `npm run test:unit`: 59/59 tests pass (Phase 35 floor preserved)
- `npm run lint`: 1 pre-existing error only (VaccinationDetail.vue:5 — grandfathered, not caused by this plan)
- `npm run build-only`: 0 "exceeds" warnings for new chunks; 0 "Skipping precaching" warnings; 59 precache entries; all chunks within 3 MiB NFR-PWA-PRECACHE-FITS
- `npm run analyze`: `dist/stats.html` exists; WallecxApp-[hash].js visible in treemap
- LOCKED lines 28/42/86/88 verified byte-intact via grep
- ConfirmDialog count in wallecx: 1 (WallecxApp.vue only) — invariant preserved
- `src/lib/pocketbase/perfInstrument.ts`: grep for `getList(` returns 0 (D-36-08 satisfied)

## Threat Flags

None new. The 3 new files and 1 modified config introduce no new network endpoints, auth paths, or schema changes beyond what was analyzed in the plan's threat model (T-36-01..05 addressed in implementation).

## Known Stubs

None. All 3 new files implement their full specified contracts with no placeholder data.

## Next Phase Readiness

- Wave 2 (Plan 36-02) can begin: WallecxSkeleton.vue available as Suspense fallback; codeSplitting groups for async chunks ready; WallecxApp.vue async tab splits target
- Wave 2 (Plan 36-03) can begin: perfInstrument.ts exports instrumentedGetFullList; call site migration map documented in PATTERNS.md
- Wave 2 (Plan 36-04) can begin: compressToWebP.ts exports compressToWebP; per-call-site change maps documented in PATTERNS.md
- Plan 36-07 (post-phase analyze close): 36-BASELINE.md has pre-phase baseline (64.09 KB gzip) and ≤32 KB reduction target

## Self-Check

Created files exist:
- `src/components/projects/wallecx/WallecxSkeleton.vue` — FOUND
- `src/lib/pocketbase/perfInstrument.ts` — FOUND
- `src/lib/wallecx/compressToWebP.ts` — FOUND
- `.planning/phases/36-mobile-performance/36-BASELINE.md` — FOUND
- `dist/stats.html` — FOUND (from npm run analyze)

Commits exist:
- e247775 — docs(36-01): capture pre-phase Wallecx route chunk baseline
- 02d857a — feat(36-01): create WallecxSkeleton.vue with 5 byte-matched variants
- b8b6b3f — feat(36-01): create perfInstrument.ts — instrumented getFullList wrapper
- ed500da — feat(36-01): create compressToWebP.ts — centralized WebP image compression helper
- 16dd41a — feat(36-01): extend vite.config.ts codeSplitting.groups with 3 vendor chunks
- e20bfc9 — docs(36-01): update 36-BASELINE.md with post-groups interim measurement

## Self-Check: PASSED

---
*Phase: 36-mobile-performance*
*Completed: 2026-05-28*
