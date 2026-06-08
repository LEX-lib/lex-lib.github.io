---
phase: 36-mobile-performance
plan: 04
subsystem: performance
tags: [vue3, defineAsyncComponent, suspense, pocketbase, skeleton, code-splitting, instrumentation]

requires:
  - phase: 36-mobile-performance/36-01
    provides: WallecxSkeleton.vue membership-card variant, perfInstrument.ts instrumentedGetFullList wrapper (RecordFullListOptions type correct)
  - phase: 36-mobile-performance/36-03
    provides: defineAsyncComponent + Suspense pattern established in VaccinationsTab.vue; perfInstrument.ts type fix applied

provides:
  - MembershipsTab.vue with async ManageMembership (defineAsyncComponent + Suspense + WallecxSkeleton membership-card fallback)
  - MembershipsTab.vue mount-path getFullList routed through instrumentedGetFullList with requestKey 'memberships-getFullList' preserved verbatim
  - WallecxSkeleton membership-card variant consolidated in inline loading skeleton
  - ManageMembership-EDCazdyS.js 10.44 KB separate chunk split confirmed in build

affects:
  - 36-07 (STATE.md Architectural Invariants — memberships-getFullList confirmed instrumented)

tech-stack:
  added: []
  patterns:
    - "defineAsyncComponent on Manage dialogs: import removed, const assigned to defineAsyncComponent(() => import('./X.vue')); wrapped in Suspense with WallecxSkeleton fallback — established pattern from 36-02/36-03"
    - "instrumentedGetFullList call site: options object unchanged (sort + requestKey pass-through); requestKey preserved verbatim"
    - "WallecxSkeleton v-if consolidation: replaces inline Card+Skeleton grid with single-line <WallecxSkeleton v-if=isLoading> — zero CLS by byte-matched dimensions"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/MembershipsTab.vue

key-decisions:
  - "const ManageMembership = defineAsyncComponent(...) placed inline between import statements — valid in Vue <script setup> (all top-level statements execute in order; no hoisting issue). Established precedent from 36-03."
  - "Export-path getFullList (exportJson function) NOT touched — uses its own distinct requestKey 'memberships-export' and is triggered by user action (out of scope per plan constraints)"
  - "pb import retained — deleteCard uses pb.collection(...).delete(), openDetail uses pb.files.getToken(), exportJson uses pb directly. Only the mount-path getFullList is routed through instrumentedGetFullList."

metrics:
  duration: 3min
  completed: 2026-05-28
  tasks: 1
  files: 1
---

# Phase 36 Plan 04: MembershipsTab Summary

**MembershipsTab async ManageMembership via defineAsyncComponent + Suspense + WallecxSkeleton membership-card fallback; mount-path getFullList instrumented with requestKey 'memberships-getFullList' preserved verbatim; inline Card+Skeleton grid consolidated into WallecxSkeleton**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-28T05:08:00Z
- **Completed:** 2026-05-28T05:11:24Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- ManageMembership lazy-loaded via `defineAsyncComponent` — chunk split confirmed in build output (`ManageMembership-EDCazdyS.js` 10.44 KB separate from `MembershipsTab-Brm-Z5ML.js` 35.45 KB)
- Mount-path `getFullList` wrapped in `instrumentedGetFullList<Memberships>('wallecx_memberships', {...})` with `requestKey: 'memberships-getFullList'` preserved verbatim (STATE.md MR-5 invariant upheld, T-36-10 threat mitigated)
- Inline 6-line Card+Skeleton grid consolidated into `<WallecxSkeleton v-if="isLoading" variant="membership-card" :count="3" />` — zero CLS by byte-matched dimensions (membership-card uses 8rem, matching the removed block)
- Suspense fallback for ManageMembership uses `<WallecxSkeleton variant="membership-card" />` (count=1 default)
- All invariants preserved: BR-2, Phase-34 sticky toolbar `:class="isMobile ? 'wallecx-tab-toolbar' : ''"`, Phase-17 DragHandle + bottom Drawer position, CON-CONFIRMDIALOG-SINGLETON (1 ConfirmDialog in WallecxApp.vue only)

## Task Commits

1. **Task 1: Async ManageMembership + instrumented getFullList + skeleton consolidation** — `3cc013a` (feat)

## Files Created/Modified

- `src/components/projects/wallecx/MembershipsTab.vue` — 4 coordinated edits: (1) import changes + async component const, (2) instrumentedGetFullList with requestKey, (3) WallecxSkeleton inline consolidation, (4) Suspense wrapper around ManageMembership

## Decisions Made

- **const between import statements:** Placing `const ManageMembership = defineAsyncComponent(...)` inline between import statements is valid in Vue `<script setup>` — established precedent from Plan 36-03 (ManageVaccination).
- **Export-path getFullList untouched:** The export JSON `getFullList` at lines ~180-184 uses its own distinct key (`requestKey: "memberships-export"`) and is a user-triggered action. Per plan constraints, only the mount-path call is wrapped.
- **pb import retained:** Multiple other code paths (deleteCard, openDetail getToken, exportJson) use `pb` directly — removing it would break those paths.

## Deviations from Plan

None — plan executed exactly as written. No auto-fix rules triggered. perfInstrument.ts type was already corrected in Plan 36-03.

## Verification Gates (post-execution)

- `npm run type-check`: 0 errors
- `npm run test:unit`: 59/59 tests pass (membershipMapper 11 tests green, floor preserved)
- `npm run lint`: 1 pre-existing error only (VaccinationDetail.vue:5 — grandfathered, not caused by this plan)
- `npm run build-only`: 0 "exceeds" precaching warnings; 71 precache entries; ManageMembership splits into its own 10.44 KB chunk
- `grep -c "requestKey: 'memberships-getFullList'"` → 1 (verbatim invariant upheld)
- `grep -c "<Skeleton height=\"8rem\" />"` → 0 (consolidated)
- `grep -c "<Suspense>"` → 1
- ConfirmDialog grep: 1 (WallecxApp.vue only) — CON-CONFIRMDIALOG-SINGLETON intact
- Phase-34 sticky toolbar `:class="isMobile ? 'wallecx-tab-toolbar' : ''"` intact
- Phase-17 `DragHandle` in bottom Drawer template intact
- BR-2 invariant: BarcodeDisplay.vue and scan overlay untouched (confirmed by plan scope — not in MembershipsTab.vue)

## Known Stubs

None. All changes are wired to real data sources. instrumentedGetFullList calls the real PocketBase SDK; WallecxSkeleton renders real PrimeVue Skeleton + Card components.

## Threat Flags

No new network endpoints, auth paths, or schema changes. The `memberships-getFullList` requestKey is preserved verbatim — T-36-10 (Tampering: requestKey accidentally renamed) disposition: mitigated. T-36-11 (Information Disclosure) inherits Plan 36-01 mitigation (no record content in logs).

## Next Phase Readiness

- Plan 36-05 (ExpensesTab + ExpensesListView + ExpensesReportsView + AttachmentPreview migrations) can begin
- Plan 36-07 (STATE.md close): `memberships-getFullList` confirmed instrumented for the locked requestKey list

## Self-Check

Created files: none
Modified files:
- `src/components/projects/wallecx/MembershipsTab.vue` — FOUND

Commits:
- `3cc013a` — FOUND (feat(36-04): async ManageMembership + instrumented getFullList + skeleton consolidation)

## Self-Check: PASSED

---
*Phase: 36-mobile-performance*
*Completed: 2026-05-28*
