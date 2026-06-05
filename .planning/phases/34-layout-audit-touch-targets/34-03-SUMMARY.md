---
phase: 34-layout-audit-touch-targets
plan: "03"
subsystem: ui
tags: [vue3, primevue, drawer, dialog, mobile, bottom-sheet, drag-handle, barcode, touch-targets]

# Dependency graph
requires:
  - phase: 34-01
    provides: DragHandle.vue component + wallecx-overrides.css touch-target/sticky rules
  - phase: 34-02
    provides: sticky toolbar wrappers + DragHandle swap in 5 existing Drawer sites + scan-overlay safe-area
provides:
  - Mobile bottom-Drawer branch in ManageMembership.vue (v-if="!isMobile" Dialog / v-else Drawer + DragHandle)
  - Mobile bottom-Drawer branch in ManageVaccination.vue (v-if="!isMobile" Dialog / v-else Drawer + DragHandle, @primevue/forms Form replicated in Drawer branch)
  - BR-2 black-on-white reverify gate (D-34-06) PASSED in both light and dark theme after full Phase 34 CSS sweep
  - All 7 Wallecx bottom-sheet sites now have drag-handle parity
affects: [35-forms-dialogs, phase-38-uat-sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "v-if=\"!isMobile\" Dialog / v-else bottom-Drawer with DragHandle in #header slot — established in ManageExpense.vue, extended to ManageMembership + ManageVaccination"
    - "Two mutually-exclusive @primevue/forms <Form> instances (one in Dialog, one in Drawer) sharing the same resolver/initialValues/handlers — safe because v-if/v-else ensures only one is mounted at a time"
    - "administeredDate direct v-model outside @primevue/forms Form (D-33-01-A workaround for PrimeVue #8191) replicated verbatim in the Drawer branch"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageMembership.vue
    - src/components/projects/wallecx/ManageVaccination.vue

key-decisions:
  - "Template duplication over abstraction for Dialog/Drawer conditional — Phase 35 BaseMobileDialog migration will DRY this up; Phase 34 stays presentation-layer-only (A-43-9)"
  - "Two <Form> instances (Dialog + Drawer) are correct because v-if/v-else guarantees mutual exclusivity — each provides its own inject context; fields bind by name not by ref (RESEARCH Pitfall 3)"
  - "administeredDate kept outside @primevue/forms Form in Drawer branch — D-33-01-A invariant must hold in both branches"
  - "card_color ColorPicker direct v-model in both branches — CON-CARD-COLOR-NO-HASH invariant preserved; both branches share the same cardColor ref"
  - "3 layout regressions found at BR-2 checkpoint (all from Plan 34-01 CSS) — auto-fixed by orchestrator in 2 follow-up commits (06a1238, 78b2d45)"

patterns-established:
  - "Pattern: Dialog/Drawer conditional in Manage overlays — v-if=\"!isMobile\" Dialog / v-else Drawer with DragHandle header slot"
  - "Pattern: Direct-v-model DatePicker (D-33-01-A) must be replicated verbatim in both Dialog and Drawer branches of any Manage component that uses it"

requirements-completed: [LT-02, LT-07]

# Metrics
duration: ~30min (code tasks) + human-verify cycle including 2 orchestrator fix commits
completed: "2026-05-27"
---

# Phase 34 Plan 03: Mobile Bottom-Drawer Branches for ManageMembership + ManageVaccination Summary

**Bottom-Drawer branches with DragHandle added to ManageMembership.vue and ManageVaccination.vue, closing the last LT-02 gap; BR-2 barcode black-on-white reverified in both themes after full Phase 34 CSS sweep**

## Performance

- **Duration:** ~30min (code tasks) + human-verify checkpoint cycle with 2 orchestrator fix commits
- **Started:** 2026-05-27
- **Completed:** 2026-05-27
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 2

## Accomplishments

- ManageMembership.vue now renders a centered Dialog on desktop (`v-if="!isMobile"`) and a bottom-Drawer with a visible DragHandle on mobile (`v-else`), preserving the ColorPicker direct-v-model (CON-CARD-COLOR-NO-HASH, PrimeVue #8135 workaround) in both branches
- ManageVaccination.vue now renders the same Dialog/Drawer conditional pattern, with the full `@primevue/forms` `<Form>` structure replicated in the Drawer branch and `administeredDate` kept as a direct v-model ref outside the Form in both branches (D-33-01-A, PrimeVue #8191)
- BR-2 gate (D-34-06, NFR-BR-2-PRESERVED): BarcodeDisplay.vue confirmed black bars on white background in light mode and dark mode after the full Phase 34 CSS sweep — APPROVED at 375x667 viewport
- All 7 Wallecx bottom-sheet sites now have drag-handle parity (5 from Plan 34-02 + 2 here)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add mobile bottom-Drawer branch to ManageMembership.vue** — `3dc3b73` (feat)
2. **Task 2: Add mobile bottom-Drawer branch to ManageVaccination.vue** — `b119c76` (feat)
3. **Task 3: BR-2 barcode reverify + mobile bottom-sheet visual check (D-34-06)** — human-verify APPROVED (see orchestrator fix commits below)

**Orchestrator fix commits (post-review layout regressions):**
- `06a1238` — fix(34): restore bottom-Drawer content padding + clip sticky tablist ink-bar
- `78b2d45` — fix(34): remove sticky-toolbar border-bottom seam

## Files Created/Modified

- `src/components/projects/wallecx/ManageMembership.vue` — Added `useIsMobile` + `DragHandle` imports, `isMobile` const, `v-if="!isMobile"` on Dialog, and `<Drawer v-else position="bottom">` branch with `#header` slot (DragHandle + title) and full form-field duplication; ColorPicker direct v-model `cardColor` preserved in both branches
- `src/components/projects/wallecx/ManageVaccination.vue` — Same pattern as ManageMembership; `@primevue/forms` `<Form v-slot="$form">` replicated in Drawer branch with identical resolver/initialValues/handlers; `administeredDate` direct v-model ref kept outside Form in both branches per D-33-01-A

## Decisions Made

- **Template duplication over abstraction.** Phase 35 BaseMobileDialog migration will DRY up the Dialog/Drawer conditional. Phase 34 stays as a pure presentation-layer change per A-43-9 — no architectural restructuring in the layout audit phase.
- **Two `<Form>` instances are correct.** Mutual exclusivity via `v-if/v-else` ensures only one Form is mounted at a time; each provides its own inject context; fields bind by `name` not by ref. This was confirmed safe in 34-RESEARCH.md Pitfall 3 / Open Question 2.
- **CON-CARD-COLOR-NO-HASH preserved.** Both Dialog and Drawer branches bind the same shared `cardColor` ref to `<ColorPicker>` with direct `v-model`. No `#` prefix added or removed. `membershipMapper.spec.ts` 11 tests green.
- **D-33-01-A preserved in Drawer branch.** `administeredDate` is a direct v-model ref on a DatePicker outside the @primevue/forms Form, seeded on the `[visible, record]` watch rising edge, with manual `dateAdministeredError` required-validation wiring — identical in both Dialog and Drawer branches.

## Deviations from Plan

### Auto-fixed Issues (orchestrator, post-review)

**1. [Rule 1 - Bug] Restore bottom-Drawer content padding collapsed to zero**
- **Found during:** Task 3 human-verify checkpoint at 375×667
- **Issue:** `env(safe-area-inset-left/right)` resolved to `0` on portrait orientation, collapsing PrimeVue's default `1.25rem` Drawer content padding — all fields stretched edge-to-edge with no side padding
- **Fix:** Changed the padding rule to `max(env(safe-area-inset-left), 1.25rem)` and `max(env(safe-area-inset-right), 1.25rem)` per side, so the 1.25rem minimum is always guaranteed even when `env()` resolves to zero
- **Files modified:** `src/assets/wallecx-overrides.css` (Plan 34-01 file)
- **Committed in:** `06a1238` (orchestrator fix commit)

**2. [Rule 1 - Bug] Clip sticky TabList ink-bar bleeding past scroll arrows**
- **Found during:** Task 3 human-verify checkpoint at 375×667
- **Issue:** The sticky TabList ink-bar was bleeding past the `<>` scroll arrows with `overflow: visible` (set to enable the sticky toolbar to peek below)
- **Fix:** Added `clip-path: inset(0)` to the `.wallecx-main-tabs .p-tablist` rule to clip the ink-bar within the TabList bounds while retaining `overflow: visible` for the sticky toolbar
- **Files modified:** `src/assets/wallecx-overrides.css` (Plan 34-01 file)
- **Committed in:** `06a1238` (orchestrator fix commit)

**3. [Rule 1 - Bug] Remove `.wallecx-tab-toolbar` border-bottom seam (dark-mode shelf)**
- **Found during:** Task 3 human-verify checkpoint at 375×667 (dark mode)
- **Issue:** The inner WallecxToolbar `mb-4` margin + a border rendered a "weird color shelf" below search/sort controls in dark mode — a visually distracting band of different background color
- **Fix:** Removed the `border-bottom` from the `.wallecx-tab-toolbar` rule; seamless same-color background retained
- **Files modified:** `src/assets/wallecx-overrides.css` (Plan 34-01 file)
- **Committed in:** `78b2d45` (orchestrator fix commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs introduced by Plan 34-01 CSS that surfaced at the BR-2 human-verify checkpoint)
**Impact on plan:** All 3 fixes were required for correct visual rendering. The root cause was Plan 34-01's CSS rules — the fixes were applied to `wallecx-overrides.css` by the orchestrator. No scope creep; all fixes are presentation-layer only.

## BR-2 Verification Result (D-34-06)

**Final human verdict at 375×667 (light + dark mode, 2026-05-27):**

> BarcodeDisplay.vue: black bars on white background confirmed in light mode, dark mode after Phase 34 CSS sweep.

Additional items confirmed:
- Add Membership opens as a bottom-sheet Drawer with a visible drag handle
- Add Vaccination opens as a bottom-sheet Drawer with a visible drag handle
- Date pre-fills correctly in Edit mode (administeredDate binding intact)
- Stacked sticky TabList + toolbar holds with no bleed and no weird background
- Drawer content properly padded (no edge-to-edge stretch)

## Issues Encountered

Three layout regressions were found during the BR-2 checkpoint, all introduced by Plan 34-01's `wallecx-overrides.css` changes (zero-resolving safe-area padding, ink-bar overflow bleed, dark-mode border seam). All three were diagnosed and fixed by the orchestrator in commits `06a1238` and `78b2d45`, then re-verified and approved in the same human-verify cycle. No new issues remain open.

## Automated Gate Results (on HEAD)

- `npm run type-check` — 0 errors
- `npm run test:unit` — 59/59 passed (membershipMapper.spec.ts 11 tests green; card_color round-trip intact)
- `npm run build` — 57 precache entries, 0 lines matching "exceeds" or "Skipping precaching"
- `npm run lint` — clean except pre-existing grandfathered `VaccinationDetail.vue:5`

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 34 is now COMPLETE (all 3 plans done, all 7 bottom-sheet drag-handle sites covered, BR-2 gate PASSED)
- Phase 35 (Forms & Dialogs on Small Screens) is unblocked: BaseMobileDialog rollout targets ManageExpense → ManageBudget → ManageMembership → ManageVaccination in that risk order; ManageMembership and ManageVaccination now have Drawer branches that Phase 35 will consolidate into BaseMobileDialog
- The Phase 35 planner should note: ManageVaccination's two `<Form>` instances (Dialog + Drawer) will collapse to one in BaseMobileDialog, which is the DRY goal; the administeredDate direct-v-model invariant (D-33-01-A) must be preserved in the BaseMobileDialog migration

---
*Phase: 34-layout-audit-touch-targets*
*Completed: 2026-05-27*

## Self-Check: PASSED

- `3dc3b73` exists in git log: FOUND
- `b119c76` exists in git log: FOUND
- `06a1238` exists in git log: FOUND
- `78b2d45` exists in git log: FOUND
- `src/components/projects/wallecx/ManageMembership.vue` — modified (not created; file pre-existed)
- `src/components/projects/wallecx/ManageVaccination.vue` — modified (not created; file pre-existed)
