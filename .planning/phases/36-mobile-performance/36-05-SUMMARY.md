---
phase: 36-mobile-performance
plan: "05"
subsystem: wallecx/expenses
tags: [performance, code-splitting, suspense, skeleton, instrumentation]
dependency_graph:
  requires:
    - 36-01  # WallecxSkeleton.vue + perfInstrument.ts foundation
  provides:
    - ManageExpense async chunk (deferred until showManage triggered)
    - instrumented PF-05 coverage for wallecx_expenses, wallecx_expense_budgets, wallecx_expense_categories
    - WallecxSkeleton migration complete for all 3 inline skeleton blocks in Expenses surface
  affects:
    - src/components/projects/wallecx/ExpensesTab.vue
    - src/components/projects/wallecx/ExpensesListView.vue
    - src/components/projects/wallecx/ExpensesReportsView.vue
    - src/components/projects/wallecx/AttachmentPreview.vue
tech_stack:
  patterns:
    - defineAsyncComponent + Suspense for ManageExpense dialog lazy-load (mirrors VaccinationsTab/MembershipsTab pattern)
    - instrumentedGetFullList wrapping 3 mount-path getFullList calls; export-path left untouched
    - WallecxSkeleton shared component replacing 3 inline skeleton blocks (expense-row, reports-chart, attachment variants)
key_files:
  modified:
    - src/components/projects/wallecx/ExpensesTab.vue
    - src/components/projects/wallecx/ExpensesListView.vue
    - src/components/projects/wallecx/ExpensesReportsView.vue
    - src/components/projects/wallecx/AttachmentPreview.vue
decisions:
  - "Export-path getFullList (requestKey: 'expenses-export') intentionally NOT instrumented per RESEARCH Pattern 4 (user-triggered, not mount-path)"
  - "pb import removed from ExpensesReportsView.vue — only remaining usage was the categories getFullList now replaced by instrumentedGetFullList"
  - "ManageBudget left as eager import in ExpensesReportsView (no upload, no WebP — Plan 36-06 scope; default=leave eager per plan)"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-28T05:19:58Z"
  tasks_completed: 4
  files_modified: 4
requirements: [PF-02, PF-04, PF-05]
---

# Phase 36 Plan 05: Expenses Surfaces Summary

One-liner: ManageExpense lazy-loaded via defineAsyncComponent + Suspense with WallecxSkeleton fallback; 3 mount-path getFullList calls instrumented (expenses, expense-budgets, expense-categories); 3 inline skeleton blocks migrated to shared WallecxSkeleton variants (expense-row, reports-chart, attachment).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ExpensesTab: async ManageExpense + instrument expenses/budgets getFullList | fee625f | ExpensesTab.vue |
| 2 | ExpensesListView: consolidate expense-row skeleton | b7998d5 | ExpensesListView.vue |
| 3 | ExpensesReportsView: instrument categories getFullList + consolidate reports-chart skeleton | 2505df3 | ExpensesReportsView.vue |
| 4 | AttachmentPreview: consolidate attachment fallback skeleton | 14a0baa | AttachmentPreview.vue |

## Changes by File

### ExpensesTab.vue (Task 1)
- `defineAsyncComponent` added to `from 'vue'` import
- `import ManageExpense from './ManageExpense.vue'` removed; replaced with `const ManageExpense = defineAsyncComponent(() => import('./ManageExpense.vue'))`
- Static `import WallecxSkeleton from './WallecxSkeleton.vue'` added
- `import { instrumentedGetFullList } from '@/lib/pocketbase/perfInstrument'` added
- `loadBudgets`: `pb.collection('wallecx_expense_budgets').getFullList<ExpenseBudget>` replaced with `instrumentedGetFullList<ExpenseBudget>('wallecx_expense_budgets', ...)` — `requestKey: 'expense-budgets-getFullList'` preserved verbatim
- `onMounted`: `pb.collection('wallecx_expenses').getFullList<Expenses>` replaced with `instrumentedGetFullList<Expenses>('wallecx_expenses', ...)` — `requestKey: 'expenses-getFullList'` preserved verbatim
- `<ManageExpense ...>` wrapped in `<Suspense>` with `<template #fallback><WallecxSkeleton variant="expense-row" /></template>`
- `requestKey: "expenses-export"` in `exportJson()` untouched (out of scope)
- `pb` import retained for `exportJson` and receipt token/URL calls

### ExpensesListView.vue (Task 2)
- Static `import WallecxSkeleton from './WallecxSkeleton.vue'` added
- Inline `<div v-if="isLoading" class="flex flex-col gap-1"><Skeleton v-for="i in 3" ...>` replaced with `<WallecxSkeleton v-if="isLoading" variant="expense-row" :count="3" />`
- Sticky toolbar wrapper (`:class="isMobile ? 'wallecx-tab-toolbar' : ''"`) preserved (Phase 34 invariant)
- v-if chain order preserved (Phase 25 D-09 invariant)

### ExpensesReportsView.vue (Task 3)
- `pb` import removed (no remaining usages after migration)
- `import { instrumentedGetFullList } from '@/lib/pocketbase/perfInstrument'` added
- Static `import WallecxSkeleton from './WallecxSkeleton.vue'` added
- `loadCategoriesForBudget`: `pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>` replaced with `instrumentedGetFullList<ExpenseCategories>('wallecx_expense_categories', ...)` — `requestKey: 'expense-categories-getFullList'` preserved verbatim
- Inline `<div v-if="isLoading" class="mt-6 flex flex-col items-center gap-3">` (3 Skeleton elements) replaced with `<WallecxSkeleton v-if="isLoading" variant="reports-chart" />`
- Period tabs, chart, budget/comparison invariants untouched

### AttachmentPreview.vue (Task 4)
- Static `import WallecxSkeleton from './WallecxSkeleton.vue'` added
- Suspense `#fallback` block (`<div class="flex flex-col items-center py-6 gap-2"><Skeleton height="12rem" .../><p>Loading PDF preview…</p></div>`) replaced with `<WallecxSkeleton variant="attachment" />`
- VuePdfEmbed `defineAsyncComponent` loader (lines 7-11) byte-intact

## Deviations from Plan

None — plan executed exactly as written.

## Key Decisions

- **Export-path untouched (per RESEARCH Pattern 4):** `exportJson()` in ExpensesTab.vue triggers `pb.collection('wallecx_expenses').getFullList` with `requestKey: "expenses-export"`. This is a user-triggered export action, not a mount-path data load. It is explicitly out of scope per the plan and RESEARCH.
- **`pb` removed from ExpensesReportsView.vue:** After replacing the single `pb.collection(...)` call with `instrumentedGetFullList`, `pb` had no remaining usages in that file. Removing the import is correct — avoids an unused import lint warning.
- **ManageBudget remains eager in ExpensesReportsView.vue:** Plan explicitly states "default = leave eager (smaller diff)". ManageBudget has no upload and no WebP scope; Plan 36-06 handles the WebP story.

## Gate Results

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 59/59 passed |
| `npm run lint` | Clean except grandfathered VaccinationDetail.vue:5 (expected) |
| `npm run build` | 0 "exceeds" / 0 "Skipping precaching" |
| ConfirmDialog grep | 1 (WallecxApp.vue shell only) |
| expenses-getFullList requestKey preserved | confirmed |
| expense-budgets-getFullList requestKey preserved | confirmed |
| expense-categories-getFullList requestKey preserved | confirmed |
| expenses-export requestKey untouched | confirmed |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- fee625f: feat(36-05): async ManageExpense + instrument expenses/budgets getFullList in ExpensesTab
- b7998d5: feat(36-05): consolidate expense-row skeleton in ExpensesListView to WallecxSkeleton
- 2505df3: feat(36-05): instrument categories getFullList + consolidate reports-chart skeleton in ExpensesReportsView
- 14a0baa: feat(36-05): consolidate attachment fallback skeleton in AttachmentPreview to WallecxSkeleton
