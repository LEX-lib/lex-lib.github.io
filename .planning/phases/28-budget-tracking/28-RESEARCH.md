# Phase 28: Budget Tracking - Research

**Researched:** 2026-05-23
**Domain:** Vue 3 SPA + PocketBase — per-user budget management and actual-vs-budget visualization
**Confidence:** HIGH

## Summary

Phase 28 adds two tightly scoped capabilities to the existing Wallecx expense tracker: (1) a budget management UI where users set monthly or yearly spend targets per category, and (2) a "Budget vs Actual" section in the Reports tab that renders those targets alongside real spend with over/under indicators. Both capabilities extend existing components rather than creating new tabs or routes.

All architectural decisions are locked in CONTEXT.md. The phase follows patterns already established across Phases 23–27: the shell-owns-data pattern (ExpensesTab.vue fetches, child views receive props), Dialog/Drawer split via `useIsMobile`, per-user PocketBase collection rules, and the existing mapper + type file conventions. No new packages are required — PrimeVue InputNumber, Dialog, Drawer, and the `formatCurrency` utility are already available.

The primary implementation risk is the upsert pattern for budget saves: the ManageBudget dialog must correctly distinguish create vs update for each category row and handle amount=0 or blank as a delete-or-skip. A secondary concern is PocketBase collection setup (`wallecx_expense_budgets`) — the collection does not yet exist and must be created with correct per-user rules before any frontend code can be tested.

**Primary recommendation:** Create the PocketBase collection first (Wave 0), then build types + mapper (Wave 1), then integrate the shell data fetch and ManageBudget component (Wave 2), then add the budget section to ExpensesReportsView (Wave 3).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Budget Management UI**
- D-01: Entry point — "Manage Budgets" button in the Reports tab header area (inside ExpensesReportsView), not the main ExpensesTab header.
- D-02: Management UI form — opens as Dialog on desktop, bottom Drawer on mobile (ManageExpense.vue pattern). Shows all known user categories as rows, each row has amount input + Monthly/Yearly toggle. Single "Save" button commits all changes.
- D-03: Category source — loads all categories from `wallecx_expense_categories` collection, requestKey `'expense-categories-getFullList'`.

**Budget Visualization in Reports**
- D-04: Placement — a separate "Budget vs Actual" section below the existing horizontal bar chart. The chart is untouched; budget section is additive.
- D-05: Row format — each budgeted category: category name + progress bar (budget = 100% width) + actual amount + colored badge. Badge: "Under by $X" (green, `--color-status-success`) or "Over by $X" (red, `--color-status-error`).
- D-06: Categories without a budget are omitted from the budget section entirely.

**Period Filter for Budget Comparison**
- D-07: Monthly budgets shown only when period = `'this-month'`.
- D-08: Yearly budgets shown only when period = `'this-year'`.
- D-09: Quarter and Custom periods: budget section hidden entirely. No pro-rating.

**Claude's Discretion**
- Budget type per category: each category independently toggles Monthly/Yearly in the dialog. Not a global mode.
- Collection schema: `wallecx_expense_budgets` fields: `user` (relation, required), `category` (text, required), `budget_type` (text: `'monthly'` | `'yearly'`), `amount` (number). One record per category per user.
- PocketBase rules: `@request.auth.id != "" && @request.data.user = @request.auth.id` (createRule), `user = @request.auth.id` (list/view/update/deleteRule).
- Budget data ownership: ExpensesTab.vue loads budgets in `onMounted`, passes as `:budgets` prop to ExpensesReportsView.
- requestKey: `'expense-budgets-getFullList'`
- Mapper + types: follow expenseMapper.ts / expenses/types.d.ts patterns. New: `src/types/wallecx/expense-budgets/types.d.ts` + `src/lib/pocketbase/expenseBudgetMapper.ts`.
- Save behavior: single "Save" button issues upsert calls (create new, update existing). Amount=0 or blank = no budget (delete or skip saving).

### Deferred Ideas (OUT OF SCOPE)
- Budget alerts / push notifications — out of scope per REQUIREMENTS.md.
- Shared household budgets — out of scope.
- Pro-rating budgets for quarter/custom periods — deferred (D-09).
- Monthly vs yearly global mode choice was skipped; per-category toggle is Claude's discretion.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RPT-01 | User can set a monthly or yearly budget target per expense category (stored in PocketBase, per-user isolation) | Collection schema, upsert pattern, ManageBudget component design, D-02/D-03 |
| RPT-02 | User can view actual-vs-budget reporting for each category in the Reports tab (budget bar + actual + over/under indicator) | Budget section placement (D-04), row format (D-05), period gating (D-07/D-08/D-09), categoryTotals integration |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Budget CRUD (create/update/delete) | API / Backend (PocketBase) | Frontend (ManageBudget.vue) | Persistence and per-user isolation enforced by PocketBase rules; UI only submits the payload |
| Budget data loading | Frontend Shell (ExpensesTab.vue) | — | Shell-owns-data invariant; child views receive props, do not make their own PocketBase calls |
| Budget visualization | Frontend View (ExpensesReportsView.vue) | — | Receives `:budgets` prop; filters by period client-side; renders Budget vs Actual section |
| Period gating (monthly/yearly visibility) | Frontend View (ExpensesReportsView.vue) | — | Pure computed logic on `period` ref — no server involvement |
| Category list source | API / Backend (PocketBase) | Frontend (ManageBudget.vue) | `wallecx_expense_categories` collection loaded via existing `expense-categories-getFullList` pattern |

---

## Standard Stack

All libraries are already installed. No new packages are required for this phase. [VERIFIED: codebase grep]

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 Composition API | Current | Component logic with `<script setup lang="ts">` | Project standard — all Wallecx components use this pattern |
| PrimeVue 4 | Current | Dialog, Drawer, InputNumber, Button, SelectButton | Auto-imported via PrimeVueResolver; established in ManageExpense.vue |
| PocketBase JS SDK | Current | `getFullList`, `create`, `update`, `delete` on collections | All Wallecx data operations use this pattern |
| Tailwind CSS 4 | Current | Utility-first layout | Project standard |
| vue-sonner | Current | Toast notifications | `toast.success` / `toast.error` used throughout |

### Supporting (Already in Use)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useIsMobile` composable | Local | Dialog vs Drawer split at 639px | Dialog/Drawer pattern gate — used identically in ManageExpense.vue |
| `formatCurrency` | Local | PHP currency formatting via `Intl.NumberFormat` | Budget amounts and actual spend display |
| CSS tokens (`--color-status-success`, `--color-status-error`) | Local | Badge colors for Under/Over indicator | Semantic color system already in base.css |

### Alternatives Considered
None — all decisions locked in CONTEXT.md. No alternative libraries needed.

---

## Architecture Patterns

### System Architecture Diagram

```
ExpensesTab.vue (Shell)
  ├── onMounted: pb.collection('wallecx_expenses').getFullList()    → expenses ref
  ├── onMounted: pb.collection('wallecx_expense_budgets').getFullList() → budgets ref  [NEW]
  └── <ExpensesReportsView :expenses :budgets :is-loading>           [budgets prop NEW]
        ├── period gating computed (this-month → monthly budgets, this-year → yearly)
        ├── categoryTotals computed (already exists)
        ├── budgetMap computed: Map<category, ExpenseBudget>         [NEW]
        ├── visibleBudgets computed: filter by period type           [NEW]
        ├── "Manage Budgets" button → showManageBudget = true        [NEW]
        ├── Budget vs Actual section (below chart)                   [NEW]
        │     └── For each category with a budget:
        │           category name | progress bar | actual | badge
        └── <ManageBudget :categories :budgets>                      [NEW SFC]
              ├── Shows all categories as rows
              │     └── Row: InputNumber (amount) + SelectButton/ToggleButton (Monthly|Yearly)
              └── "Save" button → upsert loop via PocketBase
                    ├── amount > 0: create or update record
                    └── amount = 0 or blank: delete existing or skip
```

### Recommended Project Structure

New files for this phase:

```
src/
├── types/wallecx/expense-budgets/
│   └── types.d.ts                          # ExpenseBudget interface + AddExpenseBudget type
├── lib/pocketbase/
│   └── expenseBudgetMapper.ts              # mapToUpdateExpenseBudget (strips read-only fields)
└── components/projects/wallecx/
    └── ManageBudget.vue                    # Dialog/Drawer budget management form
```

Modified files:

```
src/components/projects/wallecx/
├── ExpensesTab.vue                         # Add budgets ref + second getFullList + :budgets prop
└── ExpensesReportsView.vue                 # Add :budgets prop, "Manage Budgets" button, budget section
```

### Pattern 1: Shell-Owns-Data (Budget Extension)

**What:** ExpensesTab.vue owns all PocketBase fetches; child views receive data as props.
**When to use:** Every new data collection that a child view needs.

```typescript
// Source: src/components/projects/wallecx/ExpensesTab.vue (existing pattern)
// EXTENSION for budgets:

const budgets = ref<ExpenseBudget[]>([])

onMounted(async () => {
  isLoading.value = true
  try {
    expenses.value = await pb
      .collection('wallecx_expenses')
      .getFullList<Expenses>({
        sort: '-expense_date,-created',
        requestKey: 'expenses-getFullList',
      })
    // Second fetch — distinct requestKey required (STATE.md invariant)
    budgets.value = await pb
      .collection('wallecx_expense_budgets')
      .getFullList<ExpenseBudget>({
        requestKey: 'expense-budgets-getFullList',
      })
  } catch (e: unknown) {
    toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
```

**Key concern:** Both fetches share a single try/catch and a single `isLoading` flag. If the budget fetch fails, the same toast fires. This is acceptable per the project's existing error-handling pattern (the shell does not distinguish between failure sources in toasts). [VERIFIED: codebase read]

### Pattern 2: Dialog/Drawer Split (ManageBudget.vue)

**What:** Render `<Dialog>` when `!isMobile`, `<Drawer position="bottom">` when `isMobile`. Identical form content in both.
**When to use:** Every write-path modal in Wallecx (ManageExpense.vue, ManageMembership.vue use this).

```typescript
// Source: src/components/projects/wallecx/ManageExpense.vue (established pattern)
const visible = defineModel('visible', { type: Boolean, default: false, required: true })
const isMobile = useIsMobile()

// Template:
// <Dialog v-if="!isMobile" modal v-model:visible="visible" ...>
// <Drawer v-else v-model:visible="visible" position="bottom" ...>
```

ManageBudget.vue uses a different signature: it receives `:categories` and `:budgets` as props (not a single record model-value). The parent controls visibility via a `v-model:visible` defineModel. [ASSUMED — open/close mechanism is Claude's discretion; defineModel pattern is the established standard]

### Pattern 3: Type and Mapper Files

**What:** Each PocketBase collection has a corresponding types.d.ts (interface extending RecordModel) and a mapper function that strips read-only fields for PATCH.
**When to use:** Every new PocketBase collection with an update path.

```typescript
// New: src/types/wallecx/expense-budgets/types.d.ts
// Source: mirrors src/types/wallecx/expenses/types.d.ts exactly

import type { RecordModel } from 'pocketbase';

export interface ExpenseBudget extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  category: string;         // denormalized category name (not a relation)
  budget_type: 'monthly' | 'yearly';
  amount: number;
}

export type AddExpenseBudget = Omit<ExpenseBudget, 'id' | 'created' | 'updated'>;
```

```typescript
// New: src/lib/pocketbase/expenseBudgetMapper.ts
// Source: mirrors src/lib/pocketbase/expenseMapper.ts

import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types';

export function mapToUpdateExpenseBudget(record: ExpenseBudget): {
  category: string;
  budget_type: 'monthly' | 'yearly';
  amount: number;
} {
  return {
    category: record.category,
    budget_type: record.budget_type,
    amount: record.amount,
  };
}
```

### Pattern 4: Upsert Logic in ManageBudget Save

**What:** The "Save" button must determine for each category row whether to create, update, or delete/skip a budget record.
**When to use:** Only in ManageBudget.vue's save handler.

The upsert requires a lookup map built from the incoming `:budgets` prop (category name → existing record), then for each non-zero row issue `pb.collection(...).create()` or `.update(record.id, ...)` as appropriate:

```typescript
// Pseudo-pattern for save handler:
async function onSave(): Promise<void> {
  const userId = pb.authStore.record?.id
  if (!userId) { toast.error('Session expired. Please log in again.'); return }
  isSaving.value = true
  try {
    await Promise.all(
      localRows.value.map(async (row) => {
        const existing = budgetMap.get(row.category)
        if (!row.amount || row.amount <= 0) {
          // amount blank or zero — delete existing record if present, else skip
          if (existing) {
            await pb.collection('wallecx_expense_budgets').delete(existing.id)
          }
          return
        }
        if (existing) {
          await pb.collection('wallecx_expense_budgets').update(existing.id, {
            budget_type: row.budgetType,
            amount: row.amount,
          })
        } else {
          await pb.collection('wallecx_expense_budgets').create({
            user: userId,
            category: row.category,
            budget_type: row.budgetType,
            amount: row.amount,
          })
        }
      })
    )
    emit('saved')     // parent refreshes budgets ref
    visible.value = false
    toast.success('Budgets saved.')
  } catch {
    toast.error('Failed to save budgets. Please try again.')
  } finally {
    isSaving.value = false
  }
}
```

**Key concern:** `Promise.all` means all upserts fire concurrently. If one fails, others may have already committed (partial save). For this phase scope (no transactions in PocketBase JS SDK), this is acceptable — budget data is non-critical (no financial transactions). The catch block fires a single toast and the user can retry. [ASSUMED — no explicit transaction requirement in CONTEXT.md; acceptable per project risk posture]

### Pattern 5: Budget Section in ExpensesReportsView

**What:** A computed `budgetMap` (Map<category, ExpenseBudget>) and a `visibleBudgets` computed that filters by active period type — monthly budgets only for `this-month`, yearly only for `this-year`, none for `this-quarter`/`custom`.

```typescript
// Receives new prop:
const props = defineProps<{
  expenses: Expenses[]
  isLoading: boolean
  budgets: ExpenseBudget[]   // NEW
}>()

// Budget lookup map (O(1) per category lookup)
const budgetMap = computed(() => {
  const map = new Map<string, ExpenseBudget>()
  for (const b of props.budgets) {
    map.set(b.category, b)
  }
  return map
})

// Visible budget rows for current period (D-07, D-08, D-09)
const visibleBudgets = computed(() => {
  if (period.value === 'this-month') {
    return props.budgets.filter(b => b.budget_type === 'monthly')
  }
  if (period.value === 'this-year') {
    return props.budgets.filter(b => b.budget_type === 'yearly')
  }
  return []   // this-quarter and custom: no budget section
})
```

### Pattern 6: Progress Bar for Budget vs Actual

**What:** Each budget row renders a simple progress bar using inline styles — budget amount = 100% width, actual amount clamped at 100% (bar fills fully when over budget; the badge communicates the over amount).

```html
<!-- Budget progress bar — no new library needed (Tailwind + inline style) -->
<div class="w-full bg-surface-divider rounded-full h-2">
  <div
    class="h-2 rounded-full transition-all"
    :style="{
      width: Math.min(100, (actual / budget) * 100) + '%',
      backgroundColor: actual > budget
        ? 'var(--color-status-error)'
        : 'var(--color-status-success)',
    }"
  />
</div>
```

No third-party progress bar component is needed — the native implementation is two `<div>` elements with inline styles. [VERIFIED: base.css confirms CSS tokens exist; pattern consistent with project CSS-token approach]

### Anti-Patterns to Avoid

- **Distinct requestKey per collection:** Never reuse `'expense-budgets-getFullList'` for any other PocketBase call. The STATE.md invariant says all `getFullList` requestKeys must be distinct to prevent PocketBase auto-cancel. [VERIFIED: STATE.md §Architectural Invariants]
- **Child view making its own PocketBase calls:** ExpensesReportsView MUST NOT fetch budgets itself. The shell-owns-data pattern is a locked invariant. ManageBudget.vue writes (upsert) but does NOT read from PocketBase — it receives `:budgets` and `:categories` as props.
- **Global budget type mode:** Each category row independently holds its `budget_type` toggle. There is no global toggle. [VERIFIED: CONTEXT.md Claude's Discretion]
- **Showing budget rows for quarter/custom periods:** The budget section must be entirely absent (v-if, not v-show) when period is `this-quarter` or `custom`. [VERIFIED: CONTEXT.md D-09]
- **Placeholder rows for categories without budgets:** Only render categories that have a budget record. [VERIFIED: CONTEXT.md D-06]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom formatter | `formatCurrency` from `src/lib/wallecx/currency.ts` | Already handles PHP locale; consistent across all Wallecx views [VERIFIED: codebase] |
| Mobile breakpoint detection | `window.innerWidth` check | `useIsMobile()` from `src/composables/useIsMobile.ts` | Reactive, lifecycle-managed; established pattern [VERIFIED: codebase] |
| Toast notifications | Custom alert UI | `toast.success` / `toast.error` from `vue-sonner` | Established across all Wallecx CRUD flows [VERIFIED: codebase] |
| Number input | `<input type="number">` | PrimeVue `InputNumber` | Already used in ManageExpense.vue for amount; auto-imported [VERIFIED: codebase] |
| Dialog/Drawer | Custom modal | PrimeVue `Dialog` + `Drawer` | Established pattern across all Wallecx write-path modals [VERIFIED: codebase] |

**Key insight:** This phase is additive extension. Every UI primitive and data pattern already exists in the codebase. The work is wiring, not inventing.

---

## Runtime State Inventory

> Omitted — not a rename/refactor/migration phase. New collection only.

---

## Common Pitfalls

### Pitfall 1: requestKey Collision with Concurrent Fetches

**What goes wrong:** If both `expenses-getFullList` and `expense-budgets-getFullList` fetch in the same `onMounted` call and share the same requestKey string, PocketBase SDK auto-cancels the first when the second fires (AbortController behavior).
**Why it happens:** PocketBase JS SDK tracks one active request per requestKey. Issuing two requests with the same key cancels the first.
**How to avoid:** Use `'expense-budgets-getFullList'` for the budget fetch — distinct from all other keys. Confirmed locked in STATE.md.
**Warning signs:** First getFullList silently resolves with 0 records even though the collection has data.

### Pitfall 2: Budget Records for Wrong Period Type Leaking Through

**What goes wrong:** A category has a `monthly` budget but the user is viewing `this-year`. If the `visibleBudgets` computed is not filtered by `budget_type`, monthly budgets would show under yearly period view.
**Why it happens:** Budgets stored in PocketBase contain ALL user budgets (both monthly and yearly) — filtering is client-side.
**How to avoid:** The `visibleBudgets` computed must explicitly filter `budget_type === 'monthly'` for `this-month` and `budget_type === 'yearly'` for `this-year`. Categories with no matching budget record are omitted (D-06).
**Warning signs:** A category shows a budget bar in the wrong period.

### Pitfall 3: Stale Budget Data After Save

**What goes wrong:** After ManageBudget.vue saves, ExpensesReportsView still renders the old budgets because the parent `budgets` ref was not refreshed.
**Why it happens:** ManageBudget.vue only writes to PocketBase; it does not update the parent ref. The parent must re-fetch or update reactively.
**How to avoid:** ManageBudget.vue emits a `'saved'` event. ExpensesTab.vue (or ExpensesReportsView.vue) listens and re-fetches the budget collection. The simplest approach: re-fetch budgets in the `@saved` handler.
**Warning signs:** Budgets saved in the dialog don't appear in the budget section until page refresh.

### Pitfall 4: upsert Race — Partial Save on Promise.all Failure

**What goes wrong:** `Promise.all` fires all upserts concurrently. If record 3 of 7 fails, records 1, 2 may already be committed in PocketBase; records 4–7 are aborted. The user sees a toast error but some records were saved.
**Why it happens:** PocketBase JS SDK has no transaction support across multiple collection operations.
**How to avoid:** For this phase's scope (non-critical personal budget data), this is accepted. Document in the save handler with a comment. For user experience, re-fetch budgets after any save attempt (success or partial failure) so the UI reflects actual server state.
**Warning signs:** User sees "Failed to save" toast but some category budgets are updated.

### Pitfall 5: InputNumber v-model Type Mismatch

**What goes wrong:** PrimeVue `InputNumber` emits `number | null`. If the local row state types `amount` as `number`, a null (cleared field) causes TypeScript errors or unexpected NaN behavior in the upsert logic.
**Why it happens:** PrimeVue InputNumber's `modelValue` accepts `number | null` (clears to null, not 0, when user deletes input).
**How to avoid:** Type local row amount as `number | null`. In the save handler, treat `null` or `<= 0` as "no budget" (delete/skip path). [VERIFIED: ManageExpense.vue uses `const amount = ref<number | null>(null)` for exactly this reason]

### Pitfall 6: ManageBudget Category Rows Not Reflecting Existing Budgets on Open

**What goes wrong:** User opens ManageBudget dialog — all InputNumber fields are empty/zero even though they previously set budgets.
**Why it happens:** The local form state was initialized with blank rows instead of being seeded from the `:budgets` prop.
**How to avoid:** Use a `watch(visible, ...)` watcher (same pattern as ManageExpense.vue's `watch(record, ...)`) that resets the local row state from the `:budgets` prop every time the dialog opens. The local rows array must be re-created on each open, not mutated.
**Warning signs:** User's existing budget targets don't pre-populate the dialog.

---

## Code Examples

Verified patterns from existing codebase:

### ExpenseCategories Type (reference for ExpenseBudget)
```typescript
// Source: src/types/wallecx/expense-categories/types.d.ts [VERIFIED]
import type { RecordModel } from 'pocketbase';

export interface ExpenseCategories extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  name: string;
}

export type AddExpenseCategory = Omit<ExpenseCategories, 'id' | 'created' | 'updated'>;
```

### expenseMapper.ts (reference for expenseBudgetMapper.ts)
```typescript
// Source: src/lib/pocketbase/expenseMapper.ts [VERIFIED]
export function mapToUpdateExpense(record: Expenses): { ... } {
  return {
    amount: record.amount,
    expense_date: record.expense_date,
    category: record.category,
    description: record.description,
    ...(record.notes !== undefined ? { notes: record.notes } : {}),
  };
}
```

### Dialog/Drawer split (reference for ManageBudget.vue template)
```html
<!-- Source: src/components/projects/wallecx/ManageExpense.vue [VERIFIED] -->
<!-- Desktop: centered Dialog -->
<Dialog
  v-if="!isMobile"
  modal
  v-model:visible="visible"
  :header="dialogHeader"
  :style="{ width: '40vw' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  :closable="!isSaving"
  @hide="onHide"
>
  <form @submit.prevent="onSubmit" class="space-y-4">...</form>
</Dialog>

<!-- Mobile: bottom Drawer -->
<Drawer v-else v-model:visible="visible" position="bottom" @hide="onHide">
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
      <span class="font-semibold">{{ dialogHeader }}</span>
    </div>
  </template>
  <form @submit.prevent="onSubmit" class="space-y-4">...</form>
</Drawer>
```

### Dark mode scoped overrides (reference for ManageBudget.vue style)
```css
/* Source: src/components/projects/wallecx/ManageExpense.vue [VERIFIED] */
:deep(.my-app-dark .p-dialog),
:deep(.my-app-dark .p-dialog .p-dialog-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
:deep(.my-app-dark .p-drawer),
:deep(.my-app-dark .p-drawer .p-drawer-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
```

### PocketBase per-user rules (reference for wallecx_expense_budgets collection)
```
// Source: STATE.md §Architectural Invariants [VERIFIED]
// createRule: @request.auth.id != "" && @request.data.user = @request.auth.id
// listRule:   user = @request.auth.id
// viewRule:   user = @request.auth.id
// updateRule: user = @request.auth.id
// deleteRule: user = @request.auth.id
```

### formatCurrency usage
```typescript
// Source: src/lib/wallecx/currency.ts [VERIFIED]
// Usage: formatCurrency(1234.56) → "₱1,234.56"
import { formatCurrency } from '@/lib/wallecx/currency'
```

### CSS status tokens for badge colors
```css
/* Source: src/assets/base.css [VERIFIED] */
--color-status-success: #1a7c45;  /* Under by $X badge */
--color-status-error:   #c0392b;  /* Over by $X badge  */
```

---

## State of the Art

No external library state-of-the-art concerns apply to this phase. All patterns are internal.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Child views fetch their own data | Shell-owns-data pattern | Phase 26 | Child views are stateless re data; only the shell fetches |
| Per-component modal | defineModel visible + Dialog/Drawer split | Phase 24 | Consistent modal pattern across all Wallecx write paths |

**No deprecated patterns apply to this phase.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ManageBudget.vue receives `:categories` and `:budgets` as props (not fetching its own data), with parent controlling open/close via `v-model:visible` defineModel | Architecture Patterns | Low — consistent with shell-owns-data; if wrong, only affects prop API design |
| A2 | `Promise.all` concurrent upsert is acceptable for partial failure risk given non-critical personal budget data | Pattern 4 (upsert) | Low — no financial transaction semantics; budget data is purely informational |
| A3 | The "Manage Budgets" button is placed inside the STATE 4 block (has data) OR always visible in the Reports view regardless of data state | Code Examples / D-01 | Low — CONTEXT.md says "in the Reports tab header area"; placement within that area is Claude's discretion |

**Verified claims (no assumption):** shell-owns-data pattern, Dialog/Drawer split, requestKey naming, mapper/type file pattern, CSS token names, per-user PocketBase rule syntax, formatCurrency signature, useIsMobile signature, InputNumber null type behavior.

---

## Open Questions

1. **Budget refresh strategy after ManageBudget save**
   - What we know: ManageBudget.vue writes to PocketBase and must signal the parent to update.
   - What's unclear: Should ExpensesTab.vue re-fetch the entire budget list after save (one extra getFullList call), or should ExpensesReportsView.vue merge the saved rows into the local `budgets` ref optimistically?
   - Recommendation: Re-fetch in ExpensesTab.vue's `@saved` handler via a separate `loadBudgets()` async function (consistent with PocketBase as source of truth; avoids manual merge logic that could drift from server state).

2. **ManageBudget categories source — who fetches?**
   - What we know: CONTEXT.md D-03 says ManageBudget loads categories from `wallecx_expense_categories` with requestKey `'expense-categories-getFullList'`. ManageExpense.vue also uses this same requestKey.
   - What's unclear: If both ManageExpense.vue and ManageBudget.vue are concurrently open (unlikely but possible), they share a requestKey and one would cancel the other.
   - Recommendation: Pass categories as a prop from ExpensesTab.vue if that avoids the requestKey collision concern, OR accept the existing pattern (ManageExpense.vue already uses the same requestKey and works fine in isolation). Since both dialogs are unlikely to be open simultaneously, the existing approach is acceptable.

3. **"Manage Budgets" button placement detail**
   - What we know: D-01 says the button is in the Reports tab header area inside ExpensesReportsView.
   - What's unclear: Is the button visible even in STATE 1 (loading), STATE 2 (invalid range), and STATE 3 (empty period), or only in STATE 4 (data present)?
   - Recommendation: Place the button above the period tabs or immediately below them — always visible within the Reports view — so users can manage budgets even before they have expenses. The budget management UI is independent of expense data.

---

## Environment Availability

Step 2.6: SKIPPED — this phase makes no changes beyond the existing project tech stack. PocketBase collection creation is a UI/API operation against the existing PocketBase instance, not a CLI dependency.

---

## Validation Architecture

> `workflow.nyquist_validation` is `false` in `.planning/config.json`. Section skipped.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Auth is handled by the existing PocketBase auth guard |
| V3 Session Management | no | Session managed by PocketBase SDK + existing auth store |
| V4 Access Control | yes | PocketBase per-user rules: `user = @request.auth.id` on list/view/update/delete; `@request.auth.id != "" && @request.data.user = @request.auth.id` on create |
| V5 Input Validation | yes | Budget `amount` must be positive number; `budget_type` must be `'monthly'` or `'yearly'`; `category` must be non-empty string. Client-side validation in save handler; PocketBase field types enforce server-side. |
| V6 Cryptography | no | No encryption needed for budget amounts |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User A reads User B's budgets | Information Disclosure | PocketBase listRule `user = @request.auth.id` filters at query time — enforced server-side [VERIFIED: STATE.md invariant] |
| User A creates budget assigned to User B's user ID | Tampering | PocketBase createRule `@request.data.user = @request.auth.id` blocks cross-user creates [VERIFIED: STATE.md + memory MEMORY.md PocketBase v0.29.x syntax note] |
| Invalid budget_type value stored | Tampering | PocketBase text field + client-side TypeScript type narrowing; consider adding PocketBase field-level enum validation |

**PocketBase rule syntax note:** Per project MEMORY.md, `@request.data.user` (not `@request.body.user`) is the correct v0.29.x syntax for createRule. Rule violations return 404, not 403. [VERIFIED: MEMORY.md]

---

## Sources

### Primary (HIGH confidence)
- `src/components/projects/wallecx/ExpensesTab.vue` — shell data fetch pattern, requestKey naming, Dialog/Drawer split wiring
- `src/components/projects/wallecx/ExpensesReportsView.vue` — existing computed structure (categoryTotals, periodExpenses, period ref); extension points
- `src/components/projects/wallecx/ManageExpense.vue` — Dialog/Drawer pattern, useIsMobile, InputNumber, defineModel, watch(visible), loadCategories flow
- `src/types/wallecx/expenses/types.d.ts` — type file pattern for ExpenseBudget
- `src/lib/pocketbase/expenseMapper.ts` — mapper pattern for expenseBudgetMapper.ts
- `src/lib/wallecx/currency.ts` — formatCurrency signature
- `src/assets/base.css` — CSS token names (--color-status-success, --color-status-error)
- `.planning/phases/28-budget-tracking/28-CONTEXT.md` — all locked decisions
- `.planning/STATE.md` — architectural invariants (requestKey, shell-owns-data, PocketBase rule syntax)
- `src/composables/useIsMobile.ts` — composable signature

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — RPT-01, RPT-02 acceptance criteria
- `src/lib/wallecx/period.ts` — Period type definition used in budget gating logic

### Tertiary (LOW confidence)
None — all claims are verified from the codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via codebase grep; no new packages
- Architecture: HIGH — all patterns directly observed in existing Wallecx components
- Pitfalls: HIGH — derived from existing codebase patterns and locked STATE.md invariants; Pitfall 4 (Promise.all partial failure) is MEDIUM because it depends on acceptable risk posture

**Research date:** 2026-05-23
**Valid until:** Stable until Phase 28 is complete; no fast-moving dependencies
