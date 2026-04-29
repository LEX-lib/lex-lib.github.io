---
phase: 05-day-status-and-export
plan: 02
subsystem: ui
tags: [vue3, primevue, selectbutton, lextrack, day-status, export, template]

# Dependency graph
requires:
  - phase: 05-day-status-and-export
    plan: 01
    provides: dayStatus ref, selectedStatus computed, statusFullName computed, DAY_STATUS_OPTIONS, setDayStatus handler, exportDay handler, isLoading ref

provides:
  - SelectButton in LexTrackView top row bound to selectedStatus/:allowEmpty/DAY_STATUS_OPTIONS/@change=setDayStatus
  - Export Day button (pi-copy) in action group adjacent to Save
  - v-if="!dayStatus" on activity grid (hides when status set)
  - v-else status banner showing statusFullName and formatted date
  - Three-group top row layout: DatePicker | SelectButton | [Export Day, Save]
affects:
  - 05-03 (verification gate — all Phase 5 features now fully functional)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SelectButton bound via :modelValue (read-only computed) + @change handler — avoids Vue 3 setter warning when computed has no setter"
    - "v-if/v-else toggling activity grid vs status banner on same dayStatus ref"
    - "DAY_STATUS_OPTIONS without `as const` — PrimeVue SelectButton :options requires mutable array type"

key-files:
  created: []
  modified:
    - src/views/LexTrackView.vue

key-decisions:
  - "05-02: :modelValue (not v-model) used on SelectButton — selectedStatus is a read-only computed; mutations only via @change=setDayStatus($event.value)"
  - "05-02: Remove `as const` from DAY_STATUS_OPTIONS — PrimeVue SelectButton :options prop expects mutable any[], readonly tuple triggers TS4104"

patterns-established:
  - "Read-only computed + @change handler for PrimeVue SelectButton when the backing ref has no setter"

requirements-completed:
  - UI-DAY-01
  - UI-DAY-02
  - UI-DAY-03
  - EXPORT-01
  - EXPORT-03

# Metrics
duration: 2min
completed: 2026-04-29
---

# Phase 5 Plan 02: Day Status & Export Template Wiring Summary

**SelectButton status group, Export Day button, and status banner wired into LexTrackView.vue template — Phase 5 features fully functional**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-29T09:10:28Z
- **Completed:** 2026-04-29T09:12:14Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Restructured top row into three flex groups: DatePicker group | SelectButton status group | action group (Export Day + Save)
- Added SelectButton bound to `selectedStatus` computed via `:modelValue` + `@change="setDayStatus($event.value)"` with `:allowEmpty="true"` and aria-label for accessibility
- Added Export Day button (`pi pi-copy` icon) to the left of Save in the action group, calling `exportDay()`
- Added `v-if="!dayStatus"` on activity grid and `v-else` status banner showing `statusFullName — YYYY-MM-DD` in `text-xl font-semibold text-(--color-typo-heading)`
- Fixed `as const` on `DAY_STATUS_OPTIONS` (TS4104 — readonly tuple not assignable to mutable `any[]` expected by SelectButton `:options`)

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Wire template — SelectButton, Export Day button, v-if grid, v-else banner** - `78818aa` (feat)

**Plan metadata:** (pending final metadata commit)

## Files Created/Modified

- `src/views/LexTrackView.vue` — Template: added SelectButton + Export Day button to top row, v-if/v-else on activity grid/banner; Script: removed `as const` from DAY_STATUS_OPTIONS

## Decisions Made

- Used `:modelValue` (not `v-model`) on the SelectButton because `selectedStatus` is a read-only computed with no setter. Using `v-model` would cause a Vue 3 runtime warning when SelectButton tries to call the setter. All mutations go through `@change="setDayStatus($event.value)"`.
- Removed `as const` from `DAY_STATUS_OPTIONS` — PrimeVue's SelectButton `:options` prop type is `any[]` (mutable), and TypeScript raised TS4104 (readonly tuple cannot be assigned to mutable type). The `as const` was not necessary for runtime correctness.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `as const` from DAY_STATUS_OPTIONS to fix TS4104**
- **Found during:** Task 2 (type-check after template edit)
- **Issue:** `DAY_STATUS_OPTIONS` declared with `as const` produces a `readonly` tuple. PrimeVue SelectButton `:options` prop expects a mutable `any[]`. `vue-tsc` raised TS4104: "The type '...' is 'readonly' and cannot be assigned to the mutable type 'any[]'."
- **Fix:** Removed `as const` from the array declaration in the script block
- **Files modified:** `src/views/LexTrackView.vue` (line 36)
- **Verification:** `npm run type-check` exits 0; `npm run build` exits 0
- **Committed in:** `78818aa` (same task commit)

---

**Total deviations:** 1 auto-fixed (1 type bug)
**Impact on plan:** Necessary for type-check to pass. No scope creep. `as const` was not required for runtime behavior — the array values remain functionally identical.

## Issues Encountered

None — aside from the `as const` TS4104 caught immediately by type-check.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 5 features are now fully wired and functional:
  - Day status SelectButton: set/clear via immediate PB call
  - Activity grid hides when status set; status banner shows full name + date
  - Export Day button calls `exportDay()` which builds canonical dsu-format.md string and copies to clipboard
- Plan 05-03 (verification gate) can proceed: `npm run type-check` and `npm run build` both exit 0
- No blockers

## Known Stubs

None — all reactive bindings are wired to real script-layer state from Plan 05-01.

---
*Phase: 05-day-status-and-export*
*Completed: 2026-04-29*
