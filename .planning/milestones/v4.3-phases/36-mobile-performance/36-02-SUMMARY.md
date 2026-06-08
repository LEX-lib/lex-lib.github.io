---
phase: 36-mobile-performance
plan: 02
subsystem: performance
tags: [performance, code-splitting, suspense, skeleton, defineAsyncComponent]

requires:
  - phase: 36-mobile-performance
    plan: 01
    provides: WallecxSkeleton.vue (5 variants), rolldown codeSplitting groups substrate

provides:
  - WallecxApp.vue with defineAsyncComponent for 3 tabs + Suspense/WallecxSkeleton fallbacks per TabPanel

affects:
  - 36-03 (VaccinationsTab async ManageVaccination — WallecxApp async pattern established)
  - 36-04 (MembershipsTab async ManageMembership — same pattern)
  - 36-05 (ExpensesTab async ManageExpense — same pattern)

tech-stack:
  added: []
  patterns:
    - "defineAsyncComponent(() => import('./XxxTab.vue')) const declaration — replaces eager static import"
    - "Suspense INSIDE <TabPanel> (not wrapping TabPanels/Tabs) — preserves PrimeVue provide/inject context per Pitfall 1"
    - "WallecxSkeleton static import in every file using it as Suspense fallback (Pitfall 2 — fallback must be synchronous)"
    - "variant + :count matching the inline skeleton analog (vaccination-card:count=3, membership-card:count=3, expense-row:count=3)"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/WallecxApp.vue

key-decisions:
  - "Suspense placed INSIDE each <TabPanel> — never wrapping <TabPanels> or <Tabs>; preserves PrimeVue provide/inject chain (Pitfall 1 from RESEARCH)"
  - "WallecxSkeleton imported statically (eager) not via defineAsyncComponent — Suspense #fallback slot content must be synchronously available (Pitfall 2)"
  - "CSS side-effect import @/assets/wallecx-overrides.css moved before const declarations for clean import ordering"
  - "WallecxApp chunk reduced from 32.81 KB gzip (post-Plan-36-01-groups) to 2.45 KB gzip — async splits push tab code out of the initial bundle"
  - "No KeepAlive added — PrimeVue Tabs default CSS display:none preserves mounted state per RESEARCH A1"

requirements-completed: [PF-02, PF-04]

duration: 8min
completed: 2026-05-28
---

# Phase 36 Plan 02: WallecxApp.vue Async Tabs Summary

**defineAsyncComponent + Suspense inside each TabPanel with WallecxSkeleton fallbacks; WallecxApp chunk drops from 32.81 KB → 2.45 KB gzip**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-28T04:53:44Z
- **Completed:** 2026-05-28T05:01:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Converted VaccinationsTab, MembershipsTab, ExpensesTab from eager static imports to `defineAsyncComponent(() => import(...))` const declarations
- Added static eager `import WallecxSkeleton from "./WallecxSkeleton.vue"` (Pitfall 2 compliance — fallback must be in initial bundle)
- Wrapped each TabPanel content in `<Suspense>` INSIDE the TabPanel (Pitfall 1 compliance — PrimeVue provide/inject preserved)
- Fallbacks use correct variants: `vaccination-card`, `membership-card`, `expense-row` each with `:count="3"`
- WallecxApp chunk: 64.09 KB gzip (pre-phase baseline) → 32.81 KB (post-Plan-36-01-codeSplitting groups) → **2.45 KB gzip** (this plan)
- All invariants preserved: ConfirmDialog singleton, `wallecx-main-tabs` class, `wallecx-root` class, `PwaInstallBanner`, safeAreaInsets binding, `v-model:value` on Tabs

## Task Commits

1. **Task 1: Convert WallecxApp.vue tabs to defineAsyncComponent + Suspense** — `4f5c3a9` (feat)

## Files Modified

- `src/components/projects/wallecx/WallecxApp.vue` — 3 eager tab imports removed; static WallecxSkeleton import added; 3 defineAsyncComponent const declarations added; TabPanels block each wrapped in Suspense with matched WallecxSkeleton fallback

## Decisions Made

- **Pitfall 1 compliance**: `<Suspense>` placed INSIDE each `<TabPanel>`, never wrapping `<TabPanels>` or `<Tabs>`, to preserve PrimeVue provide/inject context chain
- **Pitfall 2 compliance**: WallecxSkeleton is a static (`import`) not async import — Suspense `#fallback` content must be synchronously available
- **No KeepAlive**: PrimeVue Tabs default uses CSS `display:none` to preserve mounted tab state; KeepAlive documented as Phase-36 fallback per RESEARCH A1 if remount becomes an issue
- **Import ordering**: CSS side-effect import (`wallecx-overrides.css`) moved before const declarations for clean script setup structure

## Deviations from Plan

None — plan executed exactly as written. All three coordinated edits (script imports, TabPanels template block, preservation checks) followed the prescribed implementations verbatim.

## Verification Gates

- `npm run type-check`: 0 errors
- `npm run test:unit`: 59/59 tests pass (Phase 35 floor preserved)
- `npm run lint`: 1 pre-existing error only (VaccinationDetail.vue:5 — grandfathered, not caused by this plan)
- `npm run build-only`: 0 "Skipping precaching" warnings; 0 Workbox-precache "exceeds" lines; WallecxApp chunk 6.09 KB raw / 2.45 KB gzip

## Chunk Size Delta

| Chunk | Before Plan | After Plan |
|-------|-------------|------------|
| WallecxApp (gzip) | 32.81 KB | 2.45 KB |
| VaccinationsTab (lazy) | (included in WallecxApp) | 7.01 KB gzip (separate chunk) |
| MembershipsTab (lazy) | (included in WallecxApp) | 14.75 KB gzip (separate chunk) |
| ExpensesTab (lazy) | (included in WallecxApp) | 11.74 KB gzip (separate chunk) |

## Acceptance Criteria Verification

All 16 acceptance criteria PASS:
1. `defineAsyncComponent` present: PASS
2. 3 occurrences of `defineAsyncComponent(() => import`: PASS
3. Static `import WallecxSkeleton from "./WallecxSkeleton.vue"`: PASS
4. No `import VaccinationsTab from`: PASS
5. No `import MembershipsTab from`: PASS
6. No `import ExpensesTab from`: PASS
7. 3 `<Suspense>` elements: PASS
8. `variant="vaccination-card"`: PASS
9. `variant="membership-card"`: PASS
10. `variant="expense-row"`: PASS
11. 3 `:count="3"` occurrences: PASS
12. Exactly 1 `<ConfirmDialog`: PASS
13. `wallecx-main-tabs` class: PASS
14. Suspense NOT directly wrapping TabPanels: PASS
15. `wallecx-root` class: PASS
16. No `<KeepAlive`: PASS

## Threat Flags

None. T-36-07 (Tampering — Suspense outside TabPanel) mitigated by correct placement inside each `<TabPanel>`. No new origins, data flows, or auth changes introduced.

## Known Stubs

None. WallecxApp.vue is a thin shell — the async tabs load their real content on first render.

## Self-Check

Created files:
- No new files created in this plan.

Modified files exist:
- `src/components/projects/wallecx/WallecxApp.vue` — FOUND

Commits exist:
- 4f5c3a9 — feat(36-02): convert WallecxApp.vue tabs to defineAsyncComponent + Suspense — FOUND

## Self-Check: PASSED

---
*Phase: 36-mobile-performance*
*Completed: 2026-05-28*
