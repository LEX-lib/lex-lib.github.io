---
phase: 24-write-path-tab-shell-crud
plan: 01
subsystem: ui
tags: [vue3, primevue, pocketbase, zod, dayjs, wallecx, expenses]

# Dependency graph
requires:
  - phase: 23-backend-type-foundation
    provides: expenseSchema, Expenses type, DEFAULT_EXPENSE_CATEGORIES constant, expenseMapper

provides:
  - ExpensesTab.vue scaffold with empty state, Add Expense button, and CRUD emit handlers
  - ManageExpense.vue stub with correct visible/record v-models and created/updated emits
  - WallecxApp.vue three-tab shell (Vaccinations / Membership Cards / Expenses)
  - expenseSchema.expense_date hardened with dayjs strict calendar validation (WR-03 fix)

affects:
  - 24-02 (ManageExpense full CRUD — replaces the stub created here)
  - 25-read-path (ExpensesTab list drop-in — empty state placeholder is the insertion point)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ExpensesTab owns its own local state (mirrors VaccinationsTab/MembershipsTab self-contained pattern)"
    - "defineExpose used to surface deleteExpense for Phase 25 list row actions"
    - "dayjs strict parse (.refine with third arg true) for calendar date validation in Zod schema"

key-files:
  created:
    - src/components/projects/wallecx/ExpensesTab.vue
    - src/components/projects/wallecx/ManageExpense.vue
  modified:
    - src/lib/wallecx/expenseSchema.ts
    - src/components/projects/wallecx/WallecxApp.vue

key-decisions:
  - "ManageExpense.vue created as stub only — Plan 02 replaces with full CRUD. Allows WallecxApp and ExpensesTab to import it without build errors."
  - "deleteExpense in ExpensesTab wired to ConfirmDialog at WallecxApp.vue shell level (STATE.md invariant preserved)"
  - "deleteExpense exposed via defineExpose so Phase 25 list rows can trigger it directly"
  - "expense_date .refine() uses dayjs(val, 'YYYY-MM-DD', true).isValid() — third arg true enables strict mode, rejecting Feb 30 etc."

patterns-established:
  - "ExpensesTab pattern: empty state + Add button + ManageExpense dialog + emit chain (onCreated/onUpdated)"
  - "Zod .refine() with dayjs strict parse for date field calendar validation"

requirements-completed: [EXP-04]

# Metrics
duration: 15min
completed: 2026-05-21
---

# Phase 24 Plan 01: Write Path — Tab Shell + CRUD Scaffold Summary

**Three-tab Wallecx shell with Expenses (mdi:cash-multiple), ExpensesTab empty state scaffold, ManageExpense.vue stub interface, and expense_date Zod calendar validation via dayjs strict parse**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-21T04:45:00Z
- **Completed:** 2026-05-21T05:00:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Hardened `expenseSchema.expense_date` with `.refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid())` — resolves WR-03 advisory; rejects logically invalid dates like 2025-02-30
- Created `ManageExpense.vue` stub with correct `visible`/`record` v-models and `created`/`updated` emits — Plan 02 replaces the stub with full CRUD logic
- Created `ExpensesTab.vue` full scaffold: empty state ("No expenses yet — add your first one."), header "Add Expense" button, `onCreated`/`onUpdated` emit handlers, `deleteExpense` wired to `useConfirm` at WallecxApp.vue shell level
- Added Expenses as third tab in `WallecxApp.vue` — tab order: Vaccinations / Membership Cards / Expenses; `mdi:cash-multiple` icon; `activeTab` default unchanged; single `<ConfirmDialog />` preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: expenseSchema.ts WR-03 fix** - `a70b069` (fix)
2. **Task 2: ManageExpense.vue stub** - `6ad0f96` (feat)
3. **Task 3: ExpensesTab.vue scaffold** - `2d6dfbf` (feat)
4. **Task 4: WallecxApp.vue Expenses tab** - `c9d2e67` (feat)

## Files Created/Modified

- `src/lib/wallecx/expenseSchema.ts` — Added `dayjs` import and `.refine()` to `expense_date` field for calendar date validation
- `src/components/projects/wallecx/ManageExpense.vue` — New stub: `visible`/`record` v-models, `created`/`updated` emits, Dialog (desktop) + Drawer bottom (mobile) shell
- `src/components/projects/wallecx/ExpensesTab.vue` — New scaffold: empty state, Add Expense buttons, `onCreated`/`onUpdated` handlers, `deleteExpense` with `useConfirm`, `defineExpose`
- `src/components/projects/wallecx/WallecxApp.vue` — Added `ExpensesTab` import + third `<Tab value="expenses">` + `<TabPanel value="expenses">`

## Decisions Made

- `deleteExpense` is defined in `ExpensesTab.vue` but exposed via `defineExpose` (not called from any template element in Phase 24 — no list yet). Phase 25 list rows will invoke it. ESLint does not flag exposed functions.
- Used `defineExpose({ deleteExpense })` rather than deferring the wiring entirely to Phase 25 — keeps the ConfirmDialog/delete pattern co-located with the data state that owns the `expenses` array.
- ManageExpense.vue stub is intentionally minimal — rendering empty Dialog/Drawer shells is sufficient for Plan 02's full implementation to compile correctly against it.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met.

## Known Stubs

The following are intentional, documented stubs per the Phase 24 plan design:

| Stub | File | Reason |
|------|------|--------|
| Empty Dialog/Drawer shell | `ManageExpense.vue` | Plan 02 replaces with full CRUD form |
| `expenses = ref<Expenses[]>([])` never populated | `ExpensesTab.vue` | Phase 25 adds `onMounted` load from PocketBase |
| `isLoading = ref(false)` always false | `ExpensesTab.vue` | Phase 25 sets true during load |

These stubs are correct for Plan 01's scope. The empty state UI is fully visible and functional as the Phase 24 deliverable.

## Issues Encountered

None. All four tasks passed type-check and build on first attempt. 33 unit tests continue to pass.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced beyond what the threat model covers. `ExpensesTab.deleteExpense` calls `pb.collection('wallecx_expenses').delete(record.id)` (server-first, ConfirmDialog-gated — T-24-01-03 mitigated). `expenseSchema.expense_date .refine()` mitigates T-24-01-01.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02 can now import `ManageExpense.vue` and replace the stub with full CRUD logic
- `ExpensesTab.vue` empty state and button wiring are confirmed building and type-safe
- Phase 25 list drop-in point is the `<div>` wrapper around the empty state in `ExpensesTab.vue`
- 33 Vitest tests remain green; build exits 0

## Self-Check: PASSED

- `src/components/projects/wallecx/ExpensesTab.vue` — FOUND
- `src/components/projects/wallecx/ManageExpense.vue` — FOUND
- `src/lib/wallecx/expenseSchema.ts` — FOUND (modified)
- `src/components/projects/wallecx/WallecxApp.vue` — FOUND (modified)
- Commit `a70b069` — FOUND
- Commit `6ad0f96` — FOUND
- Commit `2d6dfbf` — FOUND
- Commit `c9d2e67` — FOUND

---
*Phase: 24-write-path-tab-shell-crud*
*Completed: 2026-05-21*
