# Phase 28: Budget Tracking - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add per-category budget targets (stored in PocketBase, per-user isolated) and wire actual-vs-budget visualization into the existing ExpensesReportsView. The scope is: a budget management UI (set/edit targets) + a budget comparison section in the Reports tab. No alerts, no shared budgets, no new tabs.

</domain>

<decisions>
## Implementation Decisions

### Budget Management UI

- **D-01:** Entry point — a "Manage Budgets" button lives in the Reports tab header area (inside ExpensesReportsView), not the main ExpensesTab header. Contextually discoverable where budgets are actually used.
- **D-02:** Management UI form — opens as a Dialog on desktop, bottom Drawer on mobile (same pattern as ManageExpense.vue). Shows all known user categories as rows, each row having an amount input and a Monthly/Yearly toggle. Single "Save" button commits all changes.
- **D-03:** Category source — loads all categories from `wallecx_expense_categories` collection. Uses existing requestKey `'expense-categories-getFullList'`. Shows the full user-defined category list even if the user hasn't spent in a category yet.

### Budget Visualization in Reports

- **D-04:** Placement — a separate "Budget vs Actual" section below the existing horizontal bar chart. The current chart is untouched; the budget section is additive below it.
- **D-05:** Row format — each budgeted category shows: category name + a progress bar (budget = 100% width) + actual amount + a colored badge. Badge text: "Under by $X" (green, using `--color-status-success`) or "Over by $X" (red, using `--color-status-error`).
- **D-06:** Categories without a budget set are omitted from the budget section entirely — no placeholder rows, no empty bars. (Success criteria 5.)

### Period Filter for Budget Comparison

- **D-07:** Monthly budgets shown only when period = `'this-month'`.
- **D-08:** Yearly budgets shown only when period = `'this-year'`.
- **D-09:** Quarter (`'this-quarter'`) and Custom (`'custom'`) period views: the budget section is hidden entirely. No pro-rating.

### Claude's Discretion

- **Budget type per category:** Each category independently toggles between Monthly and Yearly in the management dialog. Not a global mode — one category can be monthly, another yearly.
- **Collection schema:** `wallecx_expense_budgets` with fields: `user` (relation, required), `category` (text, required), `budget_type` (text: `'monthly'` | `'yearly'`), `amount` (number). One record per category per user. PocketBase rules follow the standard per-user isolation pattern (`@request.auth.id != "" && @request.data.user = @request.auth.id`).
- **Budget data ownership:** ExpensesTab.vue loads budgets in `onMounted` (second `getFullList` call, requestKey `'expense-budgets-getFullList'`), passes as `:budgets` prop to ExpensesReportsView. Child views do not make their own PocketBase calls (consistent with established shell pattern).
- **requestKey:** `'expense-budgets-getFullList'` — pre-locked in STATE.md pre-planning notes.
- **Mapper + types:** Follow `expenseMapper.ts` / `src/types/wallecx/expenses/types.d.ts` patterns. New files: `src/types/wallecx/expense-budgets/types.d.ts` + `src/lib/pocketbase/expenseBudgetMapper.ts`.
- **Save behavior in dialog:** A single "Save" button at the bottom of the dialog issues upsert PocketBase calls (create for new budgets, update for existing). Amount of 0 or blank is treated as "no budget" (delete or skip saving).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing expense tracker code (primary references)
- `src/components/projects/wallecx/ExpensesTab.vue` — shell owner of data fetching + sub-tab routing; budget prop will be added here
- `src/components/projects/wallecx/ExpensesReportsView.vue` — view to extend with budget section; `categoryTotals` computed already available
- `src/components/projects/wallecx/ManageExpense.vue` — Dialog/Drawer CRUD pattern to follow for budget management UI

### Type and mapper patterns
- `src/types/wallecx/expenses/types.d.ts` — type pattern for new `ExpenseBudget` type
- `src/lib/pocketbase/expenseMapper.ts` — mapper pattern for new `expenseBudgetMapper.ts`

### State management decisions (locked)
- `.planning/STATE.md` §Accumulated Context → Architectural Invariants — per-user isolation, requestKey naming, shell-owns-data pattern, no new Pinia store

### Requirements
- `.planning/REQUIREMENTS.md` — RPT-01 (budget management) and RPT-02 (actual-vs-budget reporting) are the acceptance criteria for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useIsMobile` composable — already used in ExpensesTab.vue for Dialog/Drawer switching; reuse in budget management UI
- `useChartTheme` composable — chart theme reactive to dark mode; not needed for budget section (CSS token approach works directly)
- `formatCurrency` from `src/lib/wallecx/currency.ts` — reuse for actual/budget amount display
- `--color-status-success` / `--color-status-error` CSS tokens — use for "Under/Over by $X" badge colors
- PrimeVue Dialog, Drawer, InputNumber — already used in ManageExpense.vue; same imports apply

### Established Patterns
- Shell-owns-data: ExpensesTab.vue fetches `expenses` once; child views receive `:expenses` prop. Same pattern for budgets — tab fetches, ReportsView receives `:budgets`.
- Dialog/Drawer split: `v-if="!isMobile"` Dialog + `v-else` Drawer. Pattern from ExpensesTab receipt preview.
- Per-user PocketBase collection rules: `@request.auth.id != "" && @request.data.user = @request.auth.id` (createRule), `user = @request.auth.id` (listRule/viewRule/updateRule/deleteRule).
- sessionStorage for view state persistence (non-fatal try/catch pattern from ExpensesListView/ExpensesReportsView).
- `requestKey` must be distinct per collection (locked STATE.md invariant).

### Integration Points
- `ExpensesTab.vue`: add `budgets` ref + second `getFullList` in `onMounted`; pass `:budgets` prop to `ExpensesReportsView`
- `ExpensesReportsView.vue`: accept `:budgets` prop; add "Manage Budgets" button in template; add budget section below chart; wire period-gating logic (`period === 'this-month'` for monthly, `period === 'this-year'` for yearly)
- New component: `ManageBudget.vue` — the Dialog/Drawer management form for setting category budgets

</code_context>

<specifics>
## Specific Ideas

- The "Manage Budgets" button should appear in the Reports view content area (not a top header row), visually near the budget section so it's clear what it manages.
- The budget progress bar section heading can simply be "Budget vs Actual" — consistent and clear.
- When the budget section is hidden for Quarter/Custom periods, no empty space or placeholder — the section simply doesn't render.

</specifics>

<deferred>
## Deferred Ideas

- Monthly vs yearly choice was not discussed interactively (skipped by user) — per-category independent M/Y toggle is Claude's discretion.
- Budget alerts / push notifications — explicitly out of scope in REQUIREMENTS.md.
- Shared household budgets — explicitly out of scope.
- Pro-rating budgets for non-monthly/yearly periods — deferred (not needed per D-09).

</deferred>

---

*Phase: 28-budget-tracking*
*Context gathered: 2026-05-22*
