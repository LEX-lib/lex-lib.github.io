---
phase: 23-backend-type-foundation
plan: 01
subsystem: database
tags: [pocketbase, typescript, zod, vitest, wallecx, expenses]

requires:
  - phase: 11-backend-frontend-foundation
    provides: vaccinationMapper / membershipMapper pattern that expenseMapper mirrors exactly
  - phase: 13-write-path-managemembership-crud
    provides: file-field-as-FormData pattern that receipt field follows

provides:
  - wallecx_expenses PocketBase collection (7 user-defined fields, 5 per-user rules, 2 compound indexes)
  - wallecx_expense_categories PocketBase collection (2 user-defined fields, 5 per-user rules, unique compound index)
  - src/types/wallecx/expenses/types.d.ts — Expenses interface + AddExpense type
  - src/types/wallecx/expense-categories/types.d.ts — ExpenseCategories interface + AddExpenseCategory type
  - src/lib/wallecx/expenseSchema.ts — expenseSchema + expenseCategorySchema + DEFAULT_EXPENSE_CATEGORIES (7 locked entries)
  - src/lib/wallecx/currency.ts — WALLECX_CURRENCY ('PHP') + formatCurrency()
  - src/lib/pocketbase/expenseMapper.ts — mapToUpdateExpense (strips read-only fields on PATCH)
  - src/lib/pocketbase/__tests__/expenseMapper.spec.ts — 9 Vitest tests (3 describe blocks)

affects:
  - phase-24 (ManageExpense.vue write path + lazy category seeding)
  - phase-25 (read path: card grid + receipt display)
  - phase-26 (reporting + charts)

tech-stack:
  added: []
  patterns:
    - src/lib/wallecx/ module directory for non-PocketBase Wallecx utilities (schemas, constants, formatters)
    - expenseMapper mirrors vaccinationMapper / membershipMapper shape exactly

key-files:
  created:
    - src/types/wallecx/expenses/types.d.ts
    - src/types/wallecx/expense-categories/types.d.ts
    - src/lib/wallecx/expenseSchema.ts
    - src/lib/wallecx/currency.ts
    - src/lib/pocketbase/expenseMapper.ts
    - src/lib/pocketbase/__tests__/expenseMapper.spec.ts
  modified: []

key-decisions:
  - "PocketBase createRule uses @request.data.user (NOT @request.body.user) — locked memory rule confirmed in both collections"
  - "receipt File field: protected=true, maxSize=10MB, MIME=jpeg/png/webp/pdf — receipts may contain PII"
  - "category stored as denormalized Text (not a Relation) per D-07 — prevents retroactive history rewrite on rename"
  - "Unauthenticated listRule returns 200+empty (not 403) — expected PocketBase filter behavior; data isolation intact"
  - "DEFAULT_EXPENSE_CATEGORIES defined here but NOT seeded — Phase 24 seeds lazily per-user on first dialog open"
  - "requestKey names locked: 'expenses-getFullList' and 'expense-categories-getFullList' per D-19"

patterns-established:
  - "src/lib/wallecx/: new module directory for Wallecx-specific non-PocketBase utilities"
  - "expenseMapper: strips id, created, updated, user, collectionId, collectionName, expand, receipt on PATCH"
  - "Three-describe spec structure: strips-fields / preserves-writable / id-refresh-contract"

requirements-completed:
  - EXP-01
  - EXP-02
  - EXP-03

duration: 25min
completed: 2026-05-21
---

# Phase 23: Backend & Type Foundation Summary

**Two PocketBase collections with per-user isolation rules + TypeScript types, Zod schemas, PHP currency helper, and expenseMapper — full v4.0 expense backend foundation ready for Phase 24 UI**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-21T09:00:00Z
- **Completed:** 2026-05-21T09:25:00Z
- **Tasks:** 4 (1 human checkpoint + 3 autonomous)
- **Files modified:** 6 new files created, 0 existing files modified

## Accomplishments

- Both PocketBase collections created with verbatim per-user access rules, compound indexes, and protected file field for receipts
- Two-user cross-isolation smoke test passed: User B cannot list/view/patch/delete User A's records; cross-user create with wrong user id returns 400
- TypeScript interfaces, Zod schemas, DEFAULT_EXPENSE_CATEGORIES constant, currency helper, and expenseMapper all created, mirroring v1.0/v2.0 pattern exactly
- Vitest suite: 9 new expenseMapper tests all pass; 0 locked files modified

## Task Commits

1. **Task 1: PocketBase collections (human checkpoint)** — no commit (Admin UI work)
2. **Task 2: TypeScript types** — `0f1d08e` (feat)
3. **Task 3: Zod schemas + currency** — `bef01f1` (feat)
4. **Task 4: expenseMapper + spec** — `7adca4e` (feat)

## Files Created/Modified

- `src/types/wallecx/expenses/types.d.ts` — Expenses interface (amount, expense_date, category, description, notes?, receipt?) + AddExpense alias
- `src/types/wallecx/expense-categories/types.d.ts` — ExpenseCategories interface (user, name) + AddExpenseCategory alias
- `src/lib/wallecx/expenseSchema.ts` — expenseSchema + expenseCategorySchema + DEFAULT_EXPENSE_CATEGORIES (Food, Transport, Bills, Health, Shopping, Entertainment, Other)
- `src/lib/wallecx/currency.ts` — WALLECX_CURRENCY='PHP', WALLECX_CURRENCY_LOCALE='en-PH', formatCurrency()
- `src/lib/pocketbase/expenseMapper.ts` — mapToUpdateExpense; strips id/created/updated/user/collectionId/collectionName/expand/receipt; D-19 requestKey comment
- `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` — 9 tests across 3 describe blocks

## Decisions Made

- **@request.data.user confirmed** — createRule verified working; unauthenticated list returns 200+empty (not 403), which is expected PocketBase filter behavior; data isolation is intact
- **Protected file field** — receipt marked `protected: true`; receipts may contain PII (card numbers, names, addresses); direct URL access without token returns 403
- **DEFAULT_EXPENSE_CATEGORIES defined but not seeded** — Phase 23 only defines the constant; Phase 24's ManageExpense.vue seeds per-user lazily on first dialog open (no PocketBase signup hook per D-09)

## Deviations from Plan

### 1. Unauthenticated list returns 200+empty, not 403

- **Found during:** Task 1 smoke test step (e)
- **Issue:** Plan expected HTTP 403 for unauthenticated list; PocketBase returns 200 with empty items array
- **Explanation:** PocketBase list rules are applied as filters, not access gates. When `@request.auth.id != ""` evaluates false for an unauthenticated request, all rows are filtered out and an empty list is returned. A 403 would only occur if the rule were `null` (admin-only). Data isolation is equivalent — no records are disclosed.
- **Action:** No change needed; collections correctly configured. Plan expectation was incorrect. Noted here for Phase 24+ readers.

---

**Total deviations:** 1 (documentation only — plan expectation corrected, no code change)

## Issues Encountered

None beyond the expected smoke test behavior documented above.

## Smoke Test Results (SC-1)

| Test | Expected | Actual |
|------|----------|--------|
| User A create expense | 200 | 200 ✓ |
| User A create category | 200 | 200 ✓ |
| User B list expenses | 200 empty | 200 empty ✓ |
| User B view expense (A's id) | 404 | 404 ✓ |
| User B patch expense (A's id) | 404 | 404 ✓ |
| User B delete expense (A's id) | 404 | 404 ✓ |
| User B create with User A's user id | 400 | 400 ✓ |
| Same 4 tests for categories | 200/404/404/404/400 | ✓ all |
| Unauthenticated list | 403 (plan) | 200+empty (correct PB behavior) |

## Locked requestKey Names (D-19 carry for Phase 24+)

```ts
pb.collection('wallecx_expenses').getFullList<Expenses>({ requestKey: 'expenses-getFullList' })
pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({ requestKey: 'expense-categories-getFullList' })
```

These must not collide with `'vaccinations-getFullList'` / `'memberships-getFullList'`.

## Anti-Regression Confirmation

`git diff --name-only HEAD~3` shows only the 6 new files. Zero modifications to:
- `src/lib/pocketbase/vaccinationMapper.ts` ✓
- `src/lib/pocketbase/membershipMapper.ts` ✓
- `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` ✓
- `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` ✓
- `src/types/wallecx/vaccinations/types.d.ts` ✓
- `src/types/wallecx/memberships/types.d.ts` ✓
- `src/main.ts`, `src/composables/useTheme.ts`, `src/assets/base.css`, `index.html` ✓
- Any `src/components/projects/wallecx/**` file ✓

## Vitest Suite

| Metric | Before | After |
|--------|--------|-------|
| Test files | 2 spec + 1 guard | 3 spec + 1 guard |
| Total tests | 24 | 33 |
| New tests | — | 9 (expenseMapper.spec.ts) |
| All pass | — | ✓ |

New test names in `expenseMapper.spec.ts`:
- `strips id, created, updated, user, receipt, collectionId, collectionName`
- `preserves amount`
- `preserves expense_date`
- `preserves category`
- `preserves description`
- `preserves notes when present`
- `drops notes when undefined`
- `handles fractional amount values without loss of precision (2 decimal places)`
- `Object.assign propagates server id so second save PATCHes the same record`

## Next Phase Readiness

Phase 24 (ManageExpense.vue write path) can now:
- Import `Expenses`, `AddExpense`, `ExpenseCategories`, `AddExpenseCategory` from established type paths
- Use `expenseSchema` and `expenseCategorySchema` for client-side validation
- Call `mapToUpdateExpense()` on PATCH operations
- Use `DEFAULT_EXPENSE_CATEGORIES` to lazily seed per-user categories on first dialog open
- Use `WALLECX_CURRENCY` / `formatCurrency()` for amount display
- Use requestKey names `'expenses-getFullList'` and `'expense-categories-getFullList'` (D-19)

No blockers for Phase 24.

## Self-Check: PASSED

- [x] EXP-01: wallecx_expenses exists with 7 fields, 5 rules, 2 indexes, protected file field
- [x] EXP-02: wallecx_expense_categories exists with 2 fields, 5 rules, unique compound index; DEFAULT_EXPENSE_CATEGORIES constant defined
- [x] EXP-03: All 6 source files created; type-check ✓, build ✓, tests ✓ (9 new, all pass)
- [x] SC-1: Two-user isolation confirmed
- [x] SC-2: Expense create with all required fields: 200
- [x] SC-3: DEFAULT_EXPENSE_CATEGORIES has 7 locked entries (Food, Transport, Bills, Health, Shopping, Entertainment, Other)
- [x] SC-4: expenseMapper spec has 9 tests (≥5 required); suite passes
- [x] Anti-regression: 0 locked files modified

---
*Phase: 23-backend-type-foundation*
*Completed: 2026-05-21*
