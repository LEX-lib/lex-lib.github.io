---
phase: 34-layout-audit-touch-targets
plan: "02"
subsystem: wallecx-mobile-css
tags: [sticky-toolbar, drag-handle, safe-area, scan-overlay, mobile, touch-target]
dependency_graph:
  requires: [34-01]
  provides: [sticky-toolbar-wrappers, draghandle-swaps, scan-overlay-safe-area]
  affects: [34-03]
tech_stack:
  added: []
  patterns: [conditional-sticky-class, component-import-swap, env-safe-area-inline]
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/VaccinationsTab.vue
    - src/components/projects/wallecx/MembershipsTab.vue
    - src/components/projects/wallecx/ExpensesListView.vue
    - src/components/projects/wallecx/ExpensesTab.vue
    - src/components/projects/wallecx/ManageExpense.vue
    - src/components/projects/wallecx/ManageBudget.vue
    - src/components/projects/wallecx/MembershipDetail.vue
decisions:
  - "Sticky toolbar wrapper applied in ExpensesListView.vue (not ExpensesTab.vue) because <ExpensesToolbar> renders there — plan's file reference was one level too high due to Phase 26 sub-component refactor"
  - "VaccinationsTab DragHandle keeps v-if='isMobile' gate — reactive-position Drawer also renders on desktop as position=right, so pill must remain mobile-only"
  - "MembershipsTab, ExpensesTab, ManageExpense, ManageBudget DragHandle has no v-if — all four are already inside v-else (mobile-only) Drawer branches"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-27"
  tasks_completed: 3
  files_changed: 7
---

# Phase 34 Plan 02: Wire DragHandle + Sticky Toolbars + Scan Overlay Safe-Area Summary

**One-liner:** Wired the Plan-01 CSS spine into the three tab shells (sticky toolbar wrappers via `.wallecx-tab-toolbar`), swapped all 5 existing inline drag-handle pills for the shared `<DragHandle>` component, and added `env(safe-area-inset-*)` padding to the fullscreen barcode scan overlay in MembershipDetail.vue.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add sticky toolbar wrappers in the 3 tab files | f6586e3 | VaccinationsTab.vue, MembershipsTab.vue, ExpensesListView.vue |
| 2 | Swap the 5 existing inline pills for shared DragHandle | f29ba7a | VaccinationsTab.vue, MembershipsTab.vue, ExpensesTab.vue, ManageExpense.vue, ManageBudget.vue |
| 3 | Add safe-area insets to the fullscreen scan overlay | 4f177e6 | MembershipDetail.vue |

---

## Automated Gates

| Gate | Result |
|------|--------|
| `npm run type-check` | PASS — 0 errors |
| `npm run test:unit` | PASS — 59/59 tests |
| `npm run build` | PASS — 57 precache entries; 0 "exceeds" / 0 "Skipping precaching" |
| `npm run lint` | PASS — 0 new errors (pre-existing VaccinationDetail.vue:5 grandfathered) |

---

## Deliverables

### Task 1 — Sticky toolbar wrappers (LT-05)

Each tab's filter/sort toolbar is now wrapped in a div that receives `.wallecx-tab-toolbar` on mobile (≤639px) and an empty string (no behavior) on desktop:

```html
<div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
  <WallecxToolbar ... />
</div>
```

Applied in:
- `VaccinationsTab.vue` — around `<WallecxToolbar>`
- `MembershipsTab.vue` — around `<WallecxToolbar>`
- `ExpensesListView.vue` — around `<ExpensesToolbar>` (see Deviations below)

`isMobile` was already imported via `useIsMobile()` in VaccinationsTab and MembershipsTab. For ExpensesListView, `useIsMobile` import and `const isMobile = useIsMobile()` were added.

### Task 2 — DragHandle swap (LT-02)

All 5 existing inline pill divs replaced by `<DragHandle>` (or `<DragHandle v-if="isMobile" />`):

| File | Before | After | v-if gate |
|------|--------|-------|-----------|
| VaccinationsTab.vue | `<div v-if="isMobile" class="w-8 h-1 ...">` | `<DragHandle v-if="isMobile" />` | Kept — reactive-position Drawer |
| MembershipsTab.vue | `<div class="w-8 h-1 ...">` | `<DragHandle />` | None — v-else mobile Drawer |
| ExpensesTab.vue | `<div class="w-8 h-1 ...">` | `<DragHandle />` | None — v-else mobile Drawer |
| ManageExpense.vue | `<div class="w-8 h-1 ...">` | `<DragHandle />` | None — v-else mobile Drawer |
| ManageBudget.vue | `<div class="w-8 h-1 ...">` | `<DragHandle />` | None — v-else mobile Drawer |

Zero inline `w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600` pill markup remains outside `DragHandle.vue` (verified with `git grep`).

### Task 3 — Scan overlay safe-area (LT-03)

MembershipDetail.vue scan overlay `<div>` style extended with top + bottom insets:
```
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

Close button: removed Tailwind `top-4` class; added inline `top: calc(1rem + env(safe-area-inset-top))` so it clears the iPhone notch. BR-2 invariant preserved:
- `background: #ffffff` unchanged
- `filter: brightness(1.4)` unchanged
- `BarcodeDisplay.vue` untouched (confirmed via `git diff` — no changes)

---

## LT-07 Double-Scroll Verification

Manual verification note: PrimeVue `<Drawer>` sets `pointer-events: auto` on its overlay, which blocks page scroll while the Drawer is open. The Phase 17 `.p-drawer-bottom .p-drawer { height: 85dvh !important }` rule caps panel height, and `.p-drawer-content` has `overflow-y: auto` by default. No nested `overflow-y: scroll` elements exist inside Drawer form content (verified in Phase 34 RESEARCH.md §Internal-Scroll audit). The sticky toolbar wrappers are irrelevant while a Drawer overlay is active (Drawer overlay blocks all page scroll). Double-scroll trap risk: none.

---

## BR-2 Invariant Status

| Check | Expected | Status |
|-------|----------|--------|
| `BarcodeDisplay.vue` BARCODE_FOREGROUND | `#000000` | Unchanged (0 git diff) |
| `BarcodeDisplay.vue` BARCODE_BACKGROUND | `#ffffff` | Unchanged (0 git diff) |
| Scan overlay `background: #ffffff` | Present | Confirmed by automated verify node -e |
| Scan overlay `filter: brightness(1.4)` | Present | Confirmed by automated verify node -e |

BR-2 mid-sweep checkpoint: CLEAN. Full BR-2 visual check (D-34-06) is owned by Phase 38.

---

## dvh Invariant

`grep -r "100vh\|h-screen\|min-h-screen" src/components/projects/wallecx/` → **0 matches**. Invariant clean — no new `vh`-based height introduced.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Applied sticky wrapper in ExpensesListView.vue instead of ExpensesTab.vue**
- **Found during:** Task 1
- **Issue:** Plan says to wrap `<ExpensesToolbar ... />` in `ExpensesTab.vue`, but `ExpensesTab.vue` does not directly render `<ExpensesToolbar>` — it renders `<ExpensesListView>` which in turn renders `<ExpensesToolbar>`. The Phase 26 sub-component refactor moved the toolbar into the child view. Applying the sticky wrapper in `ExpensesTab.vue` would wrap the entire `ExpensesListView` (including list items), not just the toolbar.
- **Fix:** Added `import { useIsMobile } from '@/composables/useIsMobile'` and `const isMobile = useIsMobile()` to `ExpensesListView.vue`; added the sticky wrapper div around `<ExpensesToolbar>` there.
- **Files modified:** `src/components/projects/wallecx/ExpensesListView.vue`
- **Commit:** f6586e3

Note: The plan's `files_modified` frontmatter listed `ExpensesTab.vue` for the sticky wrapper. The actual change landed in `ExpensesListView.vue` for correctness. The `ExpensesTab.vue` file was still modified (DragHandle import + receipt Drawer pill swap in Task 2), so it appears in the commit.

---

## Known Stubs

None. This plan adds structural wrappers, component swaps, and inline style additions. No data-bound elements or placeholder text were introduced.

---

## Threat Flags

No new threat surface introduced. Plan 34-02 threat model (T-34-03, T-34-04) confirmed mitigated:
- T-34-03: Sticky toolbar z-index:9 sits below modal Drawer/Dialog masks (z-index 10+ for modals); no clickjacking surface
- T-34-04: Scan overlay padding repositions layout only; BR-2 white background + filter unchanged; no data exposure

---

## Self-Check

### Created files exist:
None created in this plan.

### Modified files exist:
- `src/components/projects/wallecx/VaccinationsTab.vue` — FOUND (commits f6586e3, f29ba7a)
- `src/components/projects/wallecx/MembershipsTab.vue` — FOUND (commits f6586e3, f29ba7a)
- `src/components/projects/wallecx/ExpensesListView.vue` — FOUND (commit f6586e3)
- `src/components/projects/wallecx/ExpensesTab.vue` — FOUND (commit f29ba7a)
- `src/components/projects/wallecx/ManageExpense.vue` — FOUND (commit f29ba7a)
- `src/components/projects/wallecx/ManageBudget.vue` — FOUND (commit f29ba7a)
- `src/components/projects/wallecx/MembershipDetail.vue` — FOUND (commit 4f177e6)

### Commits exist:
- f6586e3 — feat(34-02): add sticky toolbar wrappers in tab files (LT-05)
- f29ba7a — feat(34-02): swap 5 inline pills for shared DragHandle component (LT-02)
- 4f177e6 — feat(34-02): add safe-area insets to scan overlay in MembershipDetail.vue (LT-03)

### Must-have truths verified:
- [x] VaccinationsTab, MembershipsTab, ExpensesListView: sticky toolbar wrapper with `isMobile ? 'wallecx-tab-toolbar' : ''`
- [x] All 5 pills swapped for `<DragHandle>`; VaccinationsTab uses `v-if="isMobile"` gate
- [x] Zero `w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600` markup outside DragHandle.vue (git grep 0 matches)
- [x] MembershipDetail scan overlay: `padding-top: env(safe-area-inset-top)` and `padding-bottom: env(safe-area-inset-bottom)`
- [x] Close button: `top: calc(1rem + env(safe-area-inset-top))`; Tailwind `top-4` removed
- [x] BR-2: `background: #ffffff` present; BarcodeDisplay.vue untouched
- [x] dvh invariant: 0 matches for 100vh/h-screen/min-h-screen

## Self-Check: PASSED
