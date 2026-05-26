---
phase: 32-decouple-budgets-fetch
plan: 01
status: complete
completed: 2026-05-26
requirements_addressed: [BUG-02]
key-files:
  created:
    - .planning/phases/32-decouple-budgets-fetch/32-01-SUMMARY.md
  modified:
    - src/components/projects/wallecx/ExpensesTab.vue
    - .planning/STATE.md
    - .planning/ROADMAP.md
tags: [vue, error-handling, toast, refactor, bug-02-closed, expensestab]
verification:
  type_check: pass
  lint: "1 pre-existing error (VaccinationDetail.vue:5 — grandfathered by ROADMAP success criterion 5); 0 new errors"
  test_unit: "49/49 passing (5 files, 4.24s)"
  manual_uat: pending (BUG-02 isolation test — see Open Items)
decisions_applied:
  - id: D-32-1
    description: "loadBudgets signature now takes opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }; default preserves @budgets-saved call site at line 219"
  - id: D-32-2a
    description: "Mount-time toast: 'Failed to load budgets.' (ROADMAP-locked)"
  - id: D-32-2b
    description: "Save-refresh toast: 'Failed to refresh budgets after save. Reload to see changes.' (replaces 'Failed to refresh budgets. Please reload the page.')"
  - id: D-32-2c
    description: "Expenses toast: 'Failed to load expenses. Pull to refresh or reload the page.' (unchanged)"
  - id: D-32-3
    description: "isLoading wraps only expenses fetch; await loadBudgets({ context: 'mount' }) runs sequentially after, NOT inside the isLoading envelope"
  - id: D-32-4
    description: "console.error tags preserved: 'ExpensesTab: loadBudgets failed' and 'ExpensesTab: getFullList failed' (already distinct in current code)"
---

## What was built

Two surgical edits to `src/components/projects/wallecx/ExpensesTab.vue` that isolate the `wallecx_expense_budgets` fetch from the `wallecx_expenses` fetch so a budgets-only failure no longer fires the misleading expenses toast or blocks the expenses list from rendering. BUG-02 closed.

### Edit 1 — `loadBudgets` signature + ternary toast (lines 26-40 new)

```typescript
async function loadBudgets(opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }): Promise<void> {
  try {
    budgets.value = await pb
      .collection('wallecx_expense_budgets')
      .getFullList<ExpenseBudget>({
        requestKey: 'expense-budgets-getFullList',  // STATE.md invariant — distinct key
      })
  } catch (e: unknown) {
    const msg = opts.context === 'mount'
      ? 'Failed to load budgets.'
      : 'Failed to refresh budgets after save. Reload to see changes.'
    toast.error(msg)
    console.error('ExpensesTab: loadBudgets failed', e)
  }
}
```

**Backward compat preserved.** The template binding `@budgets-saved="loadBudgets"` at line 219 was NOT modified. Vue passes the no-payload emit (verified: `ExpensesReportsView.vue` line 30 declares `'budgets-saved': []`) with zero args → default `opts: { context: 'refresh' }` kicks in → user sees the save-refresh-specific toast copy on post-save failures.

### Edit 2 — `onMounted` split into independent paths (lines 64-80 new)

```typescript
onMounted(async () => {
  isLoading.value = true
  try {
    expenses.value = await pb
      .collection('wallecx_expenses')
      .getFullList<Expenses>({
        sort: '-expense_date,-created',
        requestKey: 'expenses-getFullList',  // STATE.md: must not collide with other collection keys
      })
  } catch (e: unknown) {
    toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
  await loadBudgets({ context: 'mount' })
})
```

**Behavioral change.** Previously a single shared try/catch wrapped both `wallecx_expenses` and `wallecx_expense_budgets` fetches; a budgets failure fired `'Failed to load expenses…'` and the expenses list never appeared (BUG-02 root cause). Now the expenses fetch has its own isolated try/catch with `isLoading` clearing in its `finally`, and the budgets fetch is delegated to `loadBudgets({ context: 'mount' })` which has its own independent try/catch with the correct toast copy.

## Automated verification

| Check | Result | Detail |
|-------|--------|--------|
| `npm run type-check` | ✓ pass | vue-tsc clean — no errors |
| `npm run lint` | ✓ acceptable | 1 pre-existing VaccinationDetail.vue:5 unused-prop error (explicitly grandfathered by ROADMAP §Phase 32 success criterion 5); 0 new errors introduced |
| `npm run test:unit` | ✓ 49/49 | 5 test files, 4.24s; no test changes needed (Phase 32 has no automated test additions per CONTEXT.md §specifics) |

## Grep-verifiable acceptance criteria

All 9 acceptance criteria from `32-01-PLAN.md` Task 1 verified post-edit:

| # | Criterion | Count |
|---|-----------|-------|
| 1 | `loadBudgets(opts: { context: 'mount' \| 'refresh' } = { context: 'refresh' }): Promise<void>` present | 1× ✓ |
| 2 | `'Failed to load budgets.'` (mount-time ternary branch) present | 1× ✓ |
| 3 | `'Failed to refresh budgets after save. Reload to see changes.'` present | 1× ✓ |
| 4 | `await loadBudgets({ context: 'mount' })` inside `onMounted` present | 1× ✓ |
| 5 | OLD string `'Failed to refresh budgets. Please reload the page.'` REMOVED | 0× ✓ |
| 6 | `console.error('ExpensesTab: loadBudgets failed', e)` preserved | 1× ✓ |
| 7 | `console.error('ExpensesTab: getFullList failed', e)` preserved | 1× ✓ |
| 8 | `toast.error('Failed to load expenses. Pull to refresh or reload the page.')` unchanged | 1× ✓ |
| 9 | Both distinct requestKeys (`'expenses-getFullList'`, `'expense-budgets-getFullList'`) preserved | 1× + 1× ✓ |

## ROADMAP §Phase 32 success criteria — closure

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Both collections healthy → Expenses tab loads without toast; List + Reports sub-tabs working | DEFERRED to manual UAT | Code review confirms correct shape; the user-visible behavior with both collections healthy is the no-error case. Manual smoke recommended. |
| 2 | Budgets collection missing → expenses STILL load; `'Failed to load budgets.'` toast (not `'Failed to load expenses…'`); Reports opens; Budget vs Actual absent | DEFERRED to manual UAT | This is BUG-02's smoking gun and the literal isolation guarantee — verifiable by temporarily renaming the live PB collection. NOT an automated test (CONTEXT.md §specifics). |
| 3 | Reports sub-tab period comparison line (Phase 29) still renders | INHERITED | No code in Phase 32 touched ExpensesReportsView.vue or period comparison logic; type-check + unit tests passing confirms no regression. |
| 4 | Console.error tags distinct (`'ExpensesTab: loadBudgets failed'` vs `'ExpensesTab: getFullList failed'`) | ✓ PASS | Grep criteria 6 and 7 both 1×. |
| 5 | `npm run type-check`, `npm run lint` (no new errors beyond pre-existing VaccinationDetail.vue:5), `npm run test:unit` (49/49) pass | ✓ PASS | All three exit cleanly per automated verification above. |

## Open items (manual UAT — not blocking phase completion)

1. **BUG-02 isolation test:** Temporarily rename `wallecx_expense_budgets` → `wallecx_expense_budgets_disabled` in PocketBase Admin UI. Reload `/projects/wallecx` → Expenses tab. Expected: (a) expenses list renders; (b) single toast `'Failed to load budgets.'` fires; (c) Reports sub-tab opens without error; (d) Budget vs Actual section absent (because `budgets.value` stays `[]`). After verification, rename the collection back. This is the canonical BUG-02 close-the-loop signal.
2. **Save-refresh failure test (optional):** Open ManageBudget, simulate a save failure (network throttle / collection rename mid-flight) and confirm the post-save toast reads `'Failed to refresh budgets after save. Reload to see changes.'` (NOT the mount-time copy).

## Phase 32 scope guarantee — confirmed

Zero changes to:
- Any other source file (`ManageBudget.vue`, `ExpensesReportsView.vue`, `ExpensesListView.vue`, mappers, types).
- PocketBase collections, schemas, or rules (Phase 31 handled `wallecx_expense_budgets` creation).
- Template (lines 173-273 of ExpensesTab.vue), including the `@budgets-saved="loadBudgets"` binding at line 219.
- Any imports, refs, or other function declarations.
- Build/test/lint config.
- Documentation (besides this SUMMARY and the standard STATE/ROADMAP marks).

## Self-Check

- [x] Edit 1 applied — `loadBudgets` signature + ternary toast (per D-32-1, D-32-2a, D-32-2b)
- [x] Edit 2 applied — `onMounted` split (per D-32-3)
- [x] Console tags preserved (D-32-4)
- [x] `npm run type-check` passes
- [x] `npm run lint` passes (1 pre-existing error grandfathered)
- [x] `npm run test:unit` passes 49/49
- [x] All 9 grep acceptance criteria satisfied (8 positive 1× each + 1 negative 0×)
- [x] BUG-02 listed in plan frontmatter `requirements_addressed`
- [x] Template binding at line 219 untouched
- [x] No JSDoc, no new comments, no new imports, no new tests
- [x] Source commit `f6bd1c7` on `feat/wallecx` — atomic, one file modified

Self-Check: PASSED
