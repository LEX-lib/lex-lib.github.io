---
phase: 24-write-path-tab-shell-crud
plan: 02
subsystem: ui
tags: [vue3, primevue, pocketbase, zod, dayjs, wallecx, expenses, exif, browser-image-compression]

# Dependency graph
requires:
  - phase: 23-backend-type-foundation
    provides: expenseSchema, Expenses type, ExpenseCategories type, DEFAULT_EXPENSE_CATEGORIES, expenseMapper
  - phase: 24-01
    provides: ManageExpense.vue stub, ExpensesTab.vue scaffold, WallecxApp.vue three-tab shell

provides:
  - ManageExpense.vue full CRUD dialog (create, edit, category seeding, custom category, EXIF+compression file pipeline)
  - expenseMapper.ts WR-01 fix (conditional notes key)
  - expenseMapper.spec.ts WR-02 fix (strong not.toHaveProperty assertion)

affects:
  - 25-read-path (ExpensesTab list + ManageExpense edit trigger)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ManageExpense.vue direct v-model refs pattern (D-06 invariant — no @primevue/forms)"
    - "Dialog/Drawer split via useIsMobile() — Dialog on desktop, Drawer position=bottom on mobile"
    - "Zod expenseSchema.safeParse() with flatten().fieldErrors mapped to per-field error refs"
    - "isSaving guard: ref true during entire PocketBase call chain; disables all fields + submit"
    - "Category lazy seeding: getFullList on dialog open; Promise.all seed of 7 defaults if empty"
    - "Custom category on submit: existingMatch check before create (no immediate-on-blur creation)"
    - "Canvas EXIF strip + browser-image-compression for JPEG/PNG/WebP; PDF direct-assign bypass"
    - "void mapToUpdateExpense reference confirms writable field set (mirrors ManageMembership pattern)"
    - "Conditional spread for optional notes key: ...(record.notes !== undefined ? { notes } : {})"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageExpense.vue
    - src/lib/pocketbase/expenseMapper.ts
    - src/lib/pocketbase/__tests__/expenseMapper.spec.ts

key-decisions:
  - "ManageExpense.vue form is duplicated inside both Dialog and Drawer branches (mirrors ManageMembership.vue which only uses Dialog; the plan explicitly requires both branches to contain the full form)"
  - "mapToUpdateExpense is referenced via void mapToUpdateExpense in update branch — confirms writable field set without an extra call, matching ManageMembership pattern"
  - "isSaving.value stays true until finally block even on category create failure — return inside try means finally still runs, which is correct"

patterns-established:
  - "ExpenseCategories seeding pattern: getFullList -> if empty -> isLoadingCategories guard -> Promise.all create -> reload"
  - "Custom category creation before expense record write — two sequential API calls on new category submit"

requirements-completed: [EXP-05, EXP-06]

# Metrics
duration: 20min
completed: 2026-05-21
---

# Phase 24 Plan 02: ManageExpense.vue Full CRUD + expenseMapper WR-01/WR-02 Fixes Summary

**ManageExpense.vue fully implemented as CRUD dialog with Zod validation, isSaving guard, category seeding, custom category creation, EXIF+compression file pipeline, Dialog/Drawer mobile split, and dark mode CSS; expenseMapper WR-01/WR-02 advisory findings resolved**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-21T13:05:00Z
- **Completed:** 2026-05-21T13:11:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed expenseMapper.ts WR-01: changed `notes: record.notes` to conditional spread `...(record.notes !== undefined ? { notes: record.notes } : {})` — notes key no longer appears in the return object when undefined
- Fixed expenseMapper.spec.ts WR-02: changed `expect(minimalPayload.notes).toBeUndefined()` to `expect(minimalPayload).not.toHaveProperty('notes')` — stronger assertion that the key is absent, not merely undefined
- Replaced ManageExpense.vue stub with full implementation: 511 lines covering all acceptance criteria from the plan
- All Phase 24 success criteria SC 2/3/5/6 now achievable: create expense (SC 2), edit guard (SC 3), custom category (SC 5), EXIF strip (SC 6)

## Task Commits

Each task was committed atomically:

1. **Task 1: expenseMapper WR-01/WR-02 fixes** - `9f1bf43` (fix)
2. **Task 2: ManageExpense.vue full CRUD** - `2fdad76` (feat)

## Files Created/Modified

- `src/lib/pocketbase/expenseMapper.ts` — Conditional spread for notes key (WR-01 fix)
- `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` — Stronger not.toHaveProperty assertion (WR-02 fix)
- `src/components/projects/wallecx/ManageExpense.vue` — Full CRUD implementation replacing Plan 01 stub

## Decisions Made

- ManageExpense.vue form is duplicated inside both Dialog and Drawer branches. ManageMembership.vue only uses Dialog, but the plan and 24-CONTEXT.md D-07 explicitly require the Dialog/Drawer split. The form is not abstracted to a shared component — replicating it inside both branches matches the plan's explicit template and avoids introducing a new pattern.
- `isSaving` is set to true before category creation and released in `finally` — on category create failure the function returns inside the try block, but the finally block still runs and correctly sets `isSaving.value = false`. This is the correct behavior.
- `void mapToUpdateExpense` reference in update branch follows the exact ManageMembership.vue pattern (line 227: `void mapToUpdateMembership`), confirming writable field set without redundancy.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met.

## Known Stubs

None — all fields, behaviors, and integrations specified in the plan are implemented.

## Issues Encountered

None. All files compiled and type-checked on first attempt. 33 unit tests continue to pass.

## Threat Surface Scan

All STRIDE mitigations from the threat model are implemented:
- T-24-02-01: Zod expenseSchema.safeParse() on all required fields before any PocketBase call
- T-24-02-02: isSaving ref disables all fields and submit button during full async chain
- T-24-02-03: Canvas re-encode strips EXIF from JPEG/PNG/WebP; PDF bypasses (no GPS metadata possible)
- T-24-02-04: userId sourced from pb.authStore.record?.id with null guard before all writes
- T-24-02-05: category create includes user: userId (server createRule enforces ownership)
- T-24-02-06: onFileSelect validates MIME type against allowedTypes allowlist and enforces 10MB max
- T-24-02-07: Submit button disabled while isLoadingCategories is true

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 25 can use ManageExpense.vue directly for edit affordances on list rows
- ExpensesTab.vue's `onCreated`/`onUpdated` handlers (from Plan 01) now receive fully structured Expenses records from ManageExpense.vue emits
- `deleteExpense` in ExpensesTab.vue (exposed via defineExpose from Plan 01) is ready for Phase 25 list row delete triggers
- 33 Vitest tests green; build exits 0; type-check exits 0

## Self-Check: PASSED

- `src/components/projects/wallecx/ManageExpense.vue` — FOUND (511 insertions)
- `src/lib/pocketbase/expenseMapper.ts` — FOUND (conditional spread)
- `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` — FOUND (not.toHaveProperty)
- Commit `9f1bf43` — FOUND (fix WR-01/WR-02)
- Commit `2fdad76` — FOUND (feat ManageExpense.vue full CRUD)

---
*Phase: 24-write-path-tab-shell-crud*
*Completed: 2026-05-21*
