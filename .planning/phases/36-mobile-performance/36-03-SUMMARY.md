---
phase: 36-mobile-performance
plan: 03
subsystem: performance
tags: [vue3, defineAsyncComponent, suspense, pocketbase, skeleton, code-splitting, request-key-fix]

requires:
  - phase: 36-mobile-performance/36-01
    provides: WallecxSkeleton.vue vaccination-card variant, perfInstrument.ts instrumentedGetFullList wrapper
  - phase: 36-mobile-performance/36-02
    provides: defineAsyncComponent + Suspense pattern established in WallecxApp.vue

provides:
  - VaccinationsTab.vue with async ManageVaccination (defineAsyncComponent + Suspense + WallecxSkeleton fallback)
  - VaccinationsTab.vue mount-path getFullList routed through instrumentedGetFullList with requestKey 'vaccinations-getFullList'
  - WallecxSkeleton vaccination-card variant consolidated in inline loading skeleton
  - NFR-REQUESTKEY-UNIQUE violation closed for wallecx_vaccinations collection

affects:
  - 36-07 (STATE.md Architectural Invariants must note vaccinations-getFullList as the 4th locked requestKey at phase close)
  - perfInstrument.ts (fix: RecordFullListOptions type replaces Parameters<>[0] — applies to 36-05 consumers too)

tech-stack:
  added: []
  patterns:
    - "defineAsyncComponent on Manage dialogs: import removed, const assigned to defineAsyncComponent(() => import('./X.vue')); wrapped in Suspense with WallecxSkeleton fallback — same pattern as WallecxApp.vue tabs (36-02)"
    - "instrumentedGetFullList call site: options object unchanged (sort + requestKey pass-through); requestKey added if previously missing"
    - "WallecxSkeleton v-if consolidation: replaces inline Card+Skeleton grid with single-line <WallecxSkeleton v-if=isLoading> — zero CLS by byte-matched dimensions"
    - "perfInstrument.ts: options type fixed to RecordFullListOptions (imported from 'pocketbase') — Parameters<ReturnType<typeof pb.collection>['getFullList']>[0] resolved to number via TypeScript overload resolution (LAST overload wins)"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/VaccinationsTab.vue
    - src/lib/pocketbase/perfInstrument.ts

key-decisions:
  - "Rule 1 fix — perfInstrument.ts options parameter type: Parameters<ReturnType<typeof pb.collection>['getFullList']>[0] resolves to number (the batch parameter of the legacy overload — TypeScript selects LAST overload for Parameters<>). Fixed to explicit RecordFullListOptions imported from 'pocketbase'. Affects all future instrumentedGetFullList call sites in plans 36-05 and beyond."
  - "const ManageVaccination = defineAsyncComponent(...) placed inline between import statements — valid in Vue <script setup> (all top-level statements execute in order; no hoisting issue)"
  - "Export-path getFullList (CSV export path) NOT touched — uses its own implicit requestKey and is triggered by user action (out of scope per RESEARCH Pattern 4 / plan constraints)"
  - "vaccinations-getFullList added as the 4th locked requestKey: now 4 keys total (memberships-, expenses-, expense-budgets-, expense-categories-, vaccinations-). STATE.md update deferred to Plan 36-07 per plan output spec."

patterns-established:
  - "Manage dialog async pattern: remove eager import, add defineAsyncComponent const, wrap component in Suspense with <WallecxSkeleton variant=X /> fallback"
  - "getFullList instrumentation: replace pb.collection(c).getFullList<T>(opts) with instrumentedGetFullList<T>(c, opts) — one-line change at each call site"

requirements-completed: [PF-02, PF-04, PF-05]

duration: 4min
completed: 2026-05-28
---

# Phase 36 Plan 03: VaccinationsTab Summary

**VaccinationsTab ManageVaccination async-split via defineAsyncComponent + Suspense, mount-path getFullList instrumented with vaccinations-getFullList requestKey (NFR-REQUESTKEY-UNIQUE closed), inline skeleton consolidated into WallecxSkeleton**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-28T05:00:02Z
- **Completed:** 2026-05-28T05:04:10Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- ManageVaccination lazy-loaded via `defineAsyncComponent` — chunk split confirmed in build output (`ManageVaccination-DRJVUwzu.js` 9.78 KB separate from `VaccinationsTab-WHb8Nb4V.js` 14.59 KB)
- Mount-path `getFullList` wrapped in `instrumentedGetFullList<Vaccinations>('wallecx_vaccinations', {...})` with `requestKey: 'vaccinations-getFullList'` — closes the NFR-REQUESTKEY-UNIQUE gap documented in RESEARCH Pitfall 3
- Inline 6-line Card+Skeleton grid consolidated into `<WallecxSkeleton v-if="isLoading" variant="vaccination-card" :count="3" />` — zero CLS by byte-matched dimensions
- Suspense fallback for ManageVaccination uses `<WallecxSkeleton variant="vaccination-card" />` (count=1 default)
- Fixed `perfInstrument.ts` options parameter type — prevents TypeScript overload resolution picking `number` type for `options`

## Task Commits

1. **Task 1: Async ManageVaccination + instrumented getFullList + skeleton consolidation** — `5111281` (feat)

## Files Created/Modified

- `src/components/projects/wallecx/VaccinationsTab.vue` — 4 coordinated edits: (1) import changes + async component, (2) instrumentedGetFullList with requestKey, (3) WallecxSkeleton inline consolidation, (4) Suspense wrapper around ManageVaccination
- `src/lib/pocketbase/perfInstrument.ts` — Fixed options parameter type from `Parameters<ReturnType<typeof pb.collection>['getFullList']>[0]` (resolves to `number`) to explicit `RecordFullListOptions` imported from `'pocketbase'`

## Decisions Made

- **perfInstrument.ts type fix (Rule 1):** TypeScript's `Parameters<>` utility resolves to the LAST function overload. `RecordService.getFullList` has two overloads; the last is `(batch?: number, options?: RecordListOptions)`, so `Parameters<...>[0]` = `number`. The fix uses `import type { RecordFullListOptions } from 'pocketbase'` directly — explicit, correct, and future-proof for all 4 remaining call sites in Plans 36-05.
- **const between import statements:** Placing `const ManageVaccination = defineAsyncComponent(...)` inline between import statements is valid in Vue `<script setup>` — the entire script block executes in declaration order, and ES module imports are always fully resolved before any code runs.
- **Export-path getFullList untouched:** The CSV export `getFullList` at lines ~220-225 uses its own implicit key (no requestKey — different path) and is a user-triggered action. Per RESEARCH Pattern 4 and plan constraints, only the mount-path call is wrapped.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed perfInstrument.ts options parameter type**
- **Found during:** Task 1 (type-check after editing VaccinationsTab.vue)
- **Issue:** `Parameters<ReturnType<typeof pb.collection>['getFullList']>[0]` resolves to `number` because TypeScript selects the LAST overload for `Parameters<>` — `getFullList(batch?: number, options?: RecordListOptions)` — making the options parameter typed as `number`. Calling `instrumentedGetFullList<Vaccinations>('wallecx_vaccinations', { sort: "...", requestKey: "..." })` produced TS2345.
- **Fix:** Changed options parameter type in `perfInstrument.ts` to `RecordFullListOptions` (imported from `'pocketbase'`) — the correct type for the first-overload options object.
- **Files modified:** `src/lib/pocketbase/perfInstrument.ts`
- **Verification:** `npm run type-check` exits 0
- **Committed in:** `5111281` (same task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in previously-shipped perfInstrument.ts)
**Impact on plan:** Essential correctness fix. The type error would have blocked every future call site (Plans 36-05). No scope creep.

## Issues Encountered

None beyond the type fix documented above.

## Verification Gates (post-execution)

- `npm run type-check`: 0 errors
- `npm run test:unit`: 59/59 tests pass (floor preserved)
- `npm run lint`: 1 pre-existing error only (VaccinationDetail.vue:5 — grandfathered, not caused by this plan)
- `npm run build-only`: 0 "exceeds" precaching warnings; 70 precache entries; ManageVaccination splits into its own 9.78 KB chunk; VaccinationsTab chunk 14.59 KB
- `grep -c "requestKey: \"vaccinations-getFullList\""` → 1
- `grep -c "<Skeleton height=\"6rem\" />"` → 0 (consolidated)
- `grep -c "<Suspense>"` → 1
- ConfirmDialog grep: 1 (WallecxApp.vue only) — CON-CONFIRMDIALOG-SINGLETON intact
- Phase-34 sticky toolbar `:class="isMobile ? 'wallecx-tab-toolbar' : ''"` intact
- Phase-17 `DragHandle v-if="isMobile"` gate intact
- Phase-17 `:position="isMobile ? 'bottom' : 'right'"` reactive Drawer position intact

## Known Stubs

None. All changes are wired to real data sources. instrumentedGetFullList calls the real PocketBase SDK; WallecxSkeleton renders real PrimeVue Skeleton + Card components.

## Threat Flags

No new network endpoints, auth paths, or schema changes. The `vaccinations-getFullList` requestKey is distinct from all 4 existing keys (memberships-, expenses-, expense-budgets-, expense-categories-getFullList) — T-36-08 disposition: mitigated.

## Next Phase Readiness

- Plan 36-04 (MembershipsTab async dialog + skeleton) can begin — same pattern established
- Plan 36-05 (ExpensesTab + ExpensesListView + ExpensesReportsView + AttachmentPreview migrations) can begin — perfInstrument.ts type now correct for all consumers
- Plan 36-07 (STATE.md close): Add `vaccinations-getFullList` to Architectural Invariants locked requestKey list

## Self-Check

Created files: none
Modified files:
- `src/components/projects/wallecx/VaccinationsTab.vue` — FOUND
- `src/lib/pocketbase/perfInstrument.ts` — FOUND

Commits:
- `5111281` — FOUND (feat(36-03): async ManageVaccination + instrumented getFullList + skeleton consolidation)

## Self-Check: PASSED

---
*Phase: 36-mobile-performance*
*Completed: 2026-05-28*
