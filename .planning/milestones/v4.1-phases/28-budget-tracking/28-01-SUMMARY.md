---
phase: 28-budget-tracking
plan: 01
subsystem: database
tags: [pocketbase, types, mapper, schema, budget, wallecx, typescript]

# Dependency graph
requires:
  - phase: 24-expense-tracking
    provides: expense-categories type + expenseMapper pattern (mirrored 1:1 for budgets)
  - phase: 19-pocketbase-auto-cancel
    provides: distinct requestKey discipline (locked 'expense-budgets-getFullList')
provides:
  - wallecx_expense_budgets PocketBase collection with per-user isolation rules
  - ExpenseBudget interface + AddExpenseBudget helper type
  - mapToUpdateExpenseBudget PATCH-payload mapper
  - Locked requestKey 'expense-budgets-getFullList' documented in mapper docblock
affects: [28-02-manage-budget, 28-03-reports-integration, future budget readers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PocketBase v0.29.3 createRule with @request.body.user (not @request.data.user)"
    - "Server-side enum enforcement via Text pattern + TS string literal union"
    - "Per-collection distinct requestKey to prevent auto-cancel collisions"

key-files:
  created:
    - src/types/wallecx/expense-budgets/types.d.ts
    - src/lib/pocketbase/expenseBudgetMapper.ts
  modified: []

key-decisions:
  - "budget_type uses Text field with server-side regex pattern ^(monthly|yearly)$ plus TS string union (defense in depth)"
  - "category stored as denormalized string (not a relation to wallecx_expense_categories) — matches Phase 24 expenses pattern"
  - "Locked distinct requestKey 'expense-budgets-getFullList' to prevent PocketBase auto-cancel collision with expenses/categories/vaccinations/memberships"
  - "Mapper omits conditional spread (no optional fields on ExpenseBudget — unlike expenseMapper's notes field)"

patterns-established:
  - "ExpenseBudget type pattern: mirrors expense-categories type-file shape with budget-specific field substitutions"
  - "expenseBudgetMapper pattern: mirrors expenseMapper docblock + return-shape with the locked requestKey reference"

requirements-completed: [RPT-01]

# Metrics
duration: ~5min (Tasks 2-3 file creation; Task 1 was a user-action checkpoint)
completed: 2026-05-24
---

# Phase 28 Plan 01: Budget Data Foundation Summary

**PocketBase wallecx_expense_budgets collection with per-user rules plus ExpenseBudget TypeScript types and the locked-requestKey PATCH mapper — data foundation for budget tracking.**

## Performance

- **Duration:** ~5 min (Tasks 2-3 deterministic file creation; Task 1 was a manual checkpoint completed by user)
- **Started:** 2026-05-24 (Task 1 checkpoint approved); Tasks 2-3 executed 2026-05-24T15:38–15:39Z
- **Completed:** 2026-05-24T15:39:10Z
- **Tasks:** 3 (1 user-action checkpoint + 2 auto)
- **Files created:** 2

## Accomplishments

- PocketBase `wallecx_expense_budgets` collection created with per-user isolation rules (user-confirmed via "approved")
- `ExpenseBudget` interface and `AddExpenseBudget` helper type ready for downstream Plans 02 and 03
- `mapToUpdateExpenseBudget` PATCH mapper with locked requestKey docblock prevents auto-cancel collisions
- Type-check and lint of new files both green

## PocketBase Collection Schema (User-Confirmed)

Collection: `wallecx_expense_budgets` (Base collection)

Fields:
| Field | Type | Constraints |
|-------|------|-------------|
| `user` | Relation | required, max select 1, → `users`, cascade delete = false |
| `category` | Text | required, min 1, max 200 |
| `budget_type` | Text | required, pattern `^(monthly|yearly)$` (server-side enum) |
| `amount` | Number | required, min 0 |

API Rules (PocketBase v0.29.3 syntax — `@request.body.user` per MEMORY.md):
- **List rule:** `user = @request.auth.id`
- **View rule:** `user = @request.auth.id`
- **Create rule:** `@request.auth.id != "" && @request.body.user = @request.auth.id`
- **Update rule:** `user = @request.auth.id`
- **Delete rule:** `user = @request.auth.id`

User confirmed setup with explicit `approved` response at Task 1 checkpoint.

## Task Commits

1. **Task 1: Create wallecx_expense_budgets PocketBase collection** — manual user action (no code commit; user-confirmed "approved")
2. **Task 2: Create ExpenseBudget type file** — `e2f76d8` (feat)
3. **Task 3: Create expenseBudgetMapper** — `0be1cf5` (feat)

**Plan metadata commit:** (pending — this SUMMARY)

## Files Created/Modified

- `src/types/wallecx/expense-budgets/types.d.ts` — ExpenseBudget interface (RecordModel + user, category, budget_type union, amount) and AddExpenseBudget Omit helper
- `src/lib/pocketbase/expenseBudgetMapper.ts` — mapToUpdateExpenseBudget PATCH stripper returning { category, budget_type, amount }; docblock anchors locked requestKey `'expense-budgets-getFullList'`

## Locked Invariants for Downstream Plans

- **requestKey:** `'expense-budgets-getFullList'` — must be used by every `pb.collection('wallecx_expense_budgets').getFullList<ExpenseBudget>()` call. Must NOT collide with `expenses-getFullList`, `expense-categories-getFullList`, `vaccinations-getFullList`, or `memberships-getFullList`.
- **Writable field set on PATCH:** `{ category, budget_type, amount }` — `user`, `id`, `created`, `updated` are read-only.
- **budget_type enum:** Both TS string union (`"monthly" | "yearly"`) and server-side regex pattern enforce the allowed values — defense in depth.

## Decisions Made

- None beyond plan: Tasks 2 and 3 were deterministic file creation per locked patterns; the schema decisions were already cemented in 28-CONTEXT.md / 28-PATTERNS.md.

## Deviations from Plan

None — Tasks 2-3 executed exactly as written.

The single out-of-scope discovery (pre-existing eslint error in `src/components/projects/wallecx/VaccinationDetail.vue:5`, introduced in commit `b42194d` during Phase 12) was logged to `.planning/phases/28-budget-tracking/deferred-items.md` per executor scope-boundary rules and NOT fixed in this plan.

## Issues Encountered

None. Both `npm run type-check` and `npx eslint` against the two new files returned clean.

## User Setup Required

Task 1 required a one-time PocketBase Admin UI setup (collection + rules), which the user completed and confirmed via "approved" before Tasks 2-3 ran. No further user setup needed for Plans 02 or 03.

## Next Phase Readiness

- **Plan 28-02 (ManageBudget CRUD):** UNBLOCKED — has the collection, types, and mapper it needs.
- **Plan 28-03 (Reports integration):** UNBLOCKED — has the collection and types it needs.
- Both downstream plans MUST use `requestKey: 'expense-budgets-getFullList'` when calling `getFullList`.

## Self-Check: PASSED

- `src/types/wallecx/expense-budgets/types.d.ts` — FOUND
- `src/lib/pocketbase/expenseBudgetMapper.ts` — FOUND
- `.planning/phases/28-budget-tracking/28-01-SUMMARY.md` — FOUND
- Commit `e2f76d8` (Task 2) — FOUND in git log
- Commit `0be1cf5` (Task 3) — FOUND in git log

---
*Phase: 28-budget-tracking*
*Plan: 01*
*Completed: 2026-05-24*
