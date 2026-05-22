---
phase: 25-read-path-list-view
plan: "02"
subsystem: wallecx
tags: [component, list-view, filter, sort, sessionStorage, file-token, receipt-preview, dark-mode]
dependency_graph:
  requires:
    - src/components/projects/wallecx/ExpenseItem.vue
    - src/components/projects/wallecx/ExpensesToolbar.vue
    - src/components/projects/wallecx/AttachmentPreview.vue
    - src/composables/useIsMobile.ts
    - src/lib/pocketbase/index.ts
    - src/types/wallecx/expenses/types.d.ts
  provides:
    - src/components/projects/wallecx/ExpensesTab.vue (full read path)
  affects:
    - src/components/projects/wallecx/WallecxApp.vue (consumer — tab content slot)
tech_stack:
  added: []
  patterns:
    - onMounted load with sessionStorage sort restoration BEFORE getFullList (no sort flash)
    - Single filteredSortedExpenses computed applies 4 transforms in fixed order: search -> category -> date range -> sort
    - categoryOptions derived from raw expenses.value (not from filtered output — prevents MultiSelect feedback loop)
    - Receipt preview: token fetch via pb.files.getToken() before opening AttachmentPreview; WR-03 abort-on-failure
    - Reactive isMobile via useIsMobile composable selects Dialog (desktop) vs Drawer position='bottom' (mobile)
    - v-if chain order: isLoading -> raw empty -> filtered empty -> data list (Pitfall 4 fix)
    - Skeleton height 3rem for list rows (vs 8rem for membership card tiles)
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ExpensesTab.vue
decisions:
  - "categoryOptions derives from raw expenses.value array — using filteredSortedExpenses would cause selected categories to disappear from the MultiSelect once they no longer appear in filtered results (RESEARCH.md Pitfall 3)"
  - "v-if chain checks raw expenses.length === 0 BEFORE filteredSortedExpenses.length === 0 — if raw is empty the filtered is also empty, so the order matters (Pitfall 4)"
  - "sessionStorage sort restoration runs BEFORE getFullList in onMounted so the initial render uses the persisted sort without a flash of the default mode"
  - "ExpensesToolbar uses v-if='!isLoading' (not v-show) so the toolbar mounts only after the initial load — toolbar's MultiSelect categoryOptions prop is bound to a computed that returns [] when expenses is empty, which is acceptable since the toolbar isn't visible during loading"
  - "No <ConfirmDialog /> in this file — the WallecxApp.vue shell-level invariant is preserved; deleteExpense uses the broadcast useConfirm pattern from Phase 24"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-05-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 25 Plan 02: ExpensesTab.vue Full Read Path Summary

Populated the Phase 24 ExpensesTab.vue stub with the full Phase 25 read path: PocketBase load on mount, sessionStorage sort persistence, four-transform filter pipeline, two distinct empty states, list rendering, and receipt preview wired to AttachmentPreview via short-lived file tokens.

## What Shipped

- **onMounted load** — Restores `sortMode` from sessionStorage (whitelist-validated), then calls `pb.collection('wallecx_expenses').getFullList<Expenses>` with `requestKey: 'expenses-getFullList'` (STATE.md locked invariant). Errors surface a toast and reset `isLoading`.
- **filteredSortedExpenses computed** — Single source of truth for the rendered list. Applies (1) description search (case-insensitive), (2) category filter (empty array = show all), (3) `dateFrom`/`dateTo` range using `dayjs` formatted comparison, (4) sort across 5 modes (newest-first default, oldest-first, category-asc, amount-high, amount-low).
- **categoryOptions computed** — Derived from raw `expenses.value` (not from filtered output). Returns the deduplicated, alphabetically sorted set of categories actually present in the user's records.
- **clearFilters helper** — Resets all four filter refs (searchQuery, selectedCategories, dateFrom, dateTo). Wired to the no-filter-match empty state button.
- **openReceiptPreview** — Fetches `pb.files.getToken()` first; on failure shows the receipt error toast and aborts without opening AttachmentPreview (WR-03 pattern, mirrors MembershipsTab.openDetail).
- **sessionStorage watcher** — `watch(sortMode)` writes to `'wallecx:expense-sort'` whenever the user changes sort. Wrapped in try/catch for privacy-mode iframes.
- **Template states (in order):**
  1. ExpensesToolbar (hidden only during initial loading) — bound to all 5 filter refs plus `expenseSortOptions` and `categoryOptions` props.
  2. `v-if="isLoading"` — 3 Skeleton rows at `height="3rem"`.
  3. `v-else-if="expenses.length === 0"` — "No expenses yet." + "Add your first expense to start tracking." + Add expense button.
  4. `v-else-if="filteredSortedExpenses.length === 0"` — "No expenses match your filters." + "Clear filters" button.
  5. `v-else` — `<ExpenseItem v-for>` over filtered list with `@edit`/`@delete`/`@preview` handlers.
- **Receipt preview wrapper** — `<Dialog>` for desktop, `<Drawer position="bottom">` for mobile (controlled by `useIsMobile`). Both `@hide` reset `previewRecord` and `previewToken`. AttachmentPreview is rendered only when `previewRecord` is non-null.

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 — Script | `5c80775` | onMounted, computed, watcher, openReceiptPreview, clearFilters; preserved Phase 24 stub functions intact |
| 2 — Template | `77ad1db` | ExpensesToolbar mount, 4-state v-if chain, ExpenseItem v-for, Dialog/Drawer receipt preview |

## Requirements Delivered

| ID | Description | Delivered via |
|----|-------------|---------------|
| EXP-07 | Sortable list (5 modes), sessionStorage `wallecx:expense-sort`, newest-first default | onMounted restore + watcher + filteredSortedExpenses sort switch |
| EXP-08 | Category MultiSelect (options from raw expenses) + From/To DatePickers, client-side | categoryOptions computed + dateFrom/dateTo filter in filteredSortedExpenses |
| EXP-09 | Description text search, reactive (no debounce, matches existing pattern) | searchQuery ref + filteredSortedExpenses search step |
| EXP-10 | Paperclip icon on receipt-bearing rows; AttachmentPreview opens in Dialog/Drawer after token fetch | openReceiptPreview + Dialog/Drawer wrappers |

## Deviations from Plan

### Documentation comment preserved (Phase 24 stub directive overrides grep criterion)

- **Found during:** Task 2 verification
- **Issue:** The plan's Task 2 acceptance criterion states `grep "ConfirmDialog" src/components/projects/wallecx/ExpensesTab.vue` returns 0 matches. The current file contains exactly 1 match on line 153, but it is a `// Wired here per STATE.md invariant: ConfirmDialog at WallecxApp.vue shell level only.` comment inside the preserved Phase 24 `deleteExpense` function — not a `<ConfirmDialog />` template element.
- **Decision:** Per the plan's critical constraint "The existing deleteExpense, onCreated, onUpdated, openManage, defineExpose code from Phase 24 stub must be preserved exactly", the comment stays. The practical intent of the grep check (no ConfirmDialog component rendered in this tab) is satisfied — the template contains no `<ConfirmDialog />`.
- **Files modified:** None (comment preserved as-is from Phase 24).
- **Commit:** N/A — no change required.

## Deferred Issues

- **Pre-existing lint error in `src/components/projects/wallecx/VaccinationDetail.vue` line 5** (`'props' is assigned a value but never used`). Out of scope for Phase 25 (introduced by an earlier phase). Recorded here per executor scope-boundary policy; should be cleared in a future maintenance sweep.

## Verification

- `npm run type-check` — exits 0 (clean).
- `npm run build-only` — exits 0 (`✓ built in 1.72s`; PWA generated with 56 precache entries).
- `npm run lint` — oxlint clean; eslint flags the pre-existing VaccinationDetail.vue warning above (unrelated).
- Grep verification:
  - `filteredSortedExpenses`, `categoryOptions`, `wallecx:expense-sort`, `expenses-getFullList`, `openReceiptPreview`, `clearFilters`, `pb.files.getToken`, `deleteExpense`, `onMounted`, `selectedCategories`, `dayjs`, `expenses.value.map` — 24 total occurrences (all required patterns present).
  - Template patterns: `ExpensesToolbar`, `ExpenseItem`, `AttachmentPreview`, both `v-else-if` chain checks, `height="3rem"`, `v-model:search-query`, `:category-options`, `:sort-options="expenseSortOptions"`, `@preview="openReceiptPreview"`, copy strings ("No expenses yet.", "No expenses match your filters.", "Clear filters"), `position="bottom"`, `attachment-field="receipt"` (x2) — 22 total occurrences.
  - `@vueuse/core` — 0 matches in `src/components/projects/wallecx` (constraint upheld).
  - `<ConfirmDialog>` template element — not present (only the documentation comment described above).

## Self-Check: PASSED

- ExpensesTab.vue exists and has been modified: FOUND.
- Commit `5c80775` (script): FOUND on `feat/wallecx`.
- Commit `77ad1db` (template): FOUND on `feat/wallecx`.
- Type-check + build-only: both exit 0.

## Phase 25 Status

Phase 25 is now complete. All four requirements (EXP-07 through EXP-10) ship with this plan. The read path is fully functional: users can load their expenses, sort across 5 modes with sessionStorage persistence, filter by description text, category, and date range, and tap a receipt paperclip to preview the attached file via short-lived token. Next milestone: Phase 26 (period-tabbed reporting with totals and category charts — EXP-11 through EXP-12).
