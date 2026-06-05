---
phase: 28-budget-tracking
reviewed: 2026-05-24T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/projects/wallecx/ExpensesReportsView.vue
  - src/components/projects/wallecx/ExpensesTab.vue
  - src/components/projects/wallecx/ManageBudget.vue
  - src/lib/pocketbase/expenseBudgetMapper.ts
  - src/types/wallecx/expense-budgets/types.d.ts
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-05-24
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 28 adds a clean, well-scoped budget tracking feature. The implementation faithfully follows established project patterns (shell-owns-data, Dialog/Drawer split, distinct requestKeys, per-user isolation, 44px touch targets, CSS-token theming). No critical security or correctness bugs were found — per-user isolation is properly delegated to PocketBase rules, `userId` presence is defensively checked before write, and the requestKey invariant is respected.

Three warnings worth addressing:
1. `ManageBudget.vue` rebuilds `localRows` only when `visible` flips false→true, but if the parent passes a fresh `categories` prop while the dialog is open the table will not refresh.
2. `ManageBudget.vue` instantiates the form **twice** in the template (Dialog branch + Drawer branch). Mobile and desktop use different `:id` prefixes but share the same `localRows` ref — fine functionally, but the duplicated template is a maintenance trap and bloats the bundle.
3. The "delete on blank/zero" path in `onSubmit` proceeds even when the user clears every row, with no confirmation. A user who accidentally clears a row will silently lose that budget on Save.

Info items are minor (type duplication on the interface, missing aria for the budget section heading, an unused `mapToUpdateExpenseBudget` export, etc.).

## Warnings

### WR-01: `localRows` not rebuilt if `categories` changes while dialog is open

**File:** `src/components/projects/wallecx/ManageBudget.vue:39-49`

**Issue:** The `watch(visible, ...)` handler rebuilds `localRows` only on `visible` true. If a parent re-fetches categories (e.g., after the user adds a new category in another view) while the dialog is still open, the new category will not appear in the form. The current parent flow (`openManageBudgets` loads categories *then* sets `showManageBudget = true`) avoids this in practice — but the component is brittle to a future caller that pre-loads categories and toggles `visible`.

This is also asymmetric with the established pattern: `ManageExpense.vue` re-runs `loadCategories()` on every open, so the contents are always fresh.

**Fix:** Either watch `props.categories` in addition to `visible`, or rebuild `localRows` from a computed that depends on both:

```ts
watch([visible, () => props.categories, () => props.budgets], ([isOpen]) => {
  if (!isOpen) return
  localRows.value = props.categories.map((c) => {
    const existing = budgetMap.value.get(c.name)
    return {
      category: c.name,
      amount: existing?.amount ?? null,
      budgetType: existing?.budget_type ?? 'monthly',
    }
  })
})
```

Also: rebuilding from `props.budgets` on reopen ensures that if the user opens the dialog twice (saves once, reopens) the second open reflects server state, not stale local state.

### WR-02: Form markup duplicated between Dialog and Drawer branches

**File:** `src/components/projects/wallecx/ManageBudget.vue:110-160` (Dialog branch) and `163-225` (Drawer branch)

**Issue:** The entire `<form>` block — including the `v-for`, InputNumber, SelectButton, and Save button — is duplicated. Only the `:id` prefix differs (`budget-amount-${idx}` vs `budget-amount-m-${idx}`) and the desktop variant adds `sm:flex-row sm:items-center` on the inner row. Risk: any future change (label text, validation, additional field, accessibility attribute) must be made twice — drift is inevitable.

Note: the `:id` differentiation is necessary *because* both branches render simultaneously in the DOM (Dialog/Drawer are both mounted by PrimeVue but one is hidden). Duplicate IDs would be an a11y violation. Extracting to a shared form component avoids this trap.

**Fix:** Extract a `<BudgetRowsForm>` inner component (or a `<template>` fragment via `<script setup>` slots) and render it once inside each Dialog/Drawer:

```vue
<!-- BudgetRowsForm.vue -->
<script setup lang="ts">
defineProps<{ rows: BudgetRow[]; idPrefix: string; isSaving: boolean }>()
defineEmits<{ submit: [] }>()
</script>
<template>
  <form @submit.prevent="$emit('submit')" class="space-y-4">
    <div v-for="(row, idx) in rows" :key="row.category" ...>
      <label :for="`${idPrefix}-${idx}`" ...>{{ row.category }}</label>
      <InputNumber :id="`${idPrefix}-${idx}`" v-model="row.amount" ... />
      ...
    </div>
    <Button type="submit" fluid label="Save Budgets" ... />
  </form>
</template>
```

Then in `ManageBudget.vue`:

```vue
<Dialog v-if="!isMobile" ...>
  <BudgetRowsForm :rows="localRows" id-prefix="budget-amount" :is-saving="isSaving" @submit="onSubmit" />
</Dialog>
<Drawer v-else ...>
  <BudgetRowsForm :rows="localRows" id-prefix="budget-amount-m" :is-saving="isSaving" @submit="onSubmit" />
</Drawer>
```

### WR-03: Silent budget deletion on clear-and-save

**File:** `src/components/projects/wallecx/ManageBudget.vue:51-97`

**Issue:** In `onSubmit`, any row where `amount == null || amount <= 0` is treated as a delete (line 66-72). A user who clears a single field (e.g., to "edit the amount later") and clicks Save will silently delete the existing budget record with no confirmation. There is no UI indication that clearing equals deleting — the label still reads "0.00" placeholder. Combined with `Promise.all` upserts, the destructive action is indistinguishable from a no-op save.

This is especially risky on mobile where the InputNumber may clear unexpectedly on focus, and the toast simply says "Budgets saved" — no mention of any deletions.

**Fix:** Either:

(a) Show a confirmation/preview when the save will delete one or more existing budgets:

```ts
const willDelete = localRows.value.filter((r) => {
  const existing = budgetMap.value.get(r.category)
  return existing && (r.amount == null || r.amount <= 0)
})
if (willDelete.length > 0) {
  // surface in a confirm dialog (useConfirm) before issuing deletes
}
```

(b) Decouple "blank" from "zero": treat `null`/blank as "leave unchanged" and require an explicit `0` to delete, with a tooltip or helper text ("Set to 0 to remove budget") under each input.

Option (b) is more aligned with mobile-first usability — a cleared field on a touch device should not be a destructive intent signal.

## Info

### IN-01: Redundant property declarations in `ExpenseBudget` interface

**File:** `src/types/wallecx/expense-budgets/types.d.ts:3-11`

**Issue:** `id`, `created`, and `updated` are already declared by `RecordModel` (the extended interface from `pocketbase`). Re-declaring them is harmless but adds noise and risks drift if PocketBase's type changes.

**Fix:** Drop the three redundant lines:

```ts
export interface ExpenseBudget extends RecordModel {
  user: string;
  category: string;
  budget_type: "monthly" | "yearly";
  amount: number;
}
```

Note: `expenseMapper.ts` / `expenses/types.d.ts` pattern (cited as the canonical reference in 28-CONTEXT.md) should be checked for consistency — if existing types follow the redundant pattern, leaving it for parity is acceptable.

### IN-02: `mapToUpdateExpenseBudget` is exported but never used

**File:** `src/lib/pocketbase/expenseBudgetMapper.ts:15-25`

**Issue:** `ManageBudget.vue` constructs the update payload inline (lines 73-77) rather than calling the mapper:

```ts
await pb.collection('wallecx_expense_budgets').update(existing.id, {
  budget_type: row.budgetType,
  amount: row.amount,
})
```

The mapper exists, is documented, but has no callers. Either (a) inline mapping is the intended pattern and the mapper is dead code, or (b) the mapper should be used in `ManageBudget.vue` to centralize the "strip read-only fields" contract.

**Fix:** Use the mapper in `ManageBudget.vue`, or remove the mapper if the team prefers inline maps for small payloads. Note: the mapper currently takes a full `ExpenseBudget` record, but the update site has a partial `BudgetRow` — adapting the mapper signature (e.g., `mapToUpdateExpenseBudget(input: { category, budgetType, amount })`) would make it usable here.

### IN-03: Budget section lacks a landmark role / aria-labelledby

**File:** `src/components/projects/wallecx/ExpensesReportsView.vue:411-448`

**Issue:** The "Budget vs Actual" section uses an `<h3>` heading inside a plain `<div>`. Each row carries an `aria-label` on its container `<div>` (line 422) — but the container is not a focusable / semantic element, so screen readers may not announce it consistently. The per-row aria-label is also verbose and constructs the same text the visible badge already shows.

**Fix:** Wrap the section in `<section aria-labelledby="budget-vs-actual-heading">` and give the `<h3>` an `id`. Drop the per-row `aria-label` (or move it to a programmatically focusable progressbar element using `role="progressbar"` + `aria-valuenow`/`aria-valuemax`):

```vue
<section v-if="visibleBudgets.length > 0" class="mt-6" aria-labelledby="budget-vs-actual-heading">
  <h3 id="budget-vs-actual-heading" class="text-base font-bold mb-3" ...>Budget vs Actual</h3>
  <div v-for="b in visibleBudgets" :key="b.id" class="mb-4">
    <div class="text-sm mb-1" ...>{{ b.category }}</div>
    <div
      class="w-full h-2 rounded-full"
      role="progressbar"
      :aria-valuenow="actualFor(b.category)"
      :aria-valuemin="0"
      :aria-valuemax="b.amount"
      :aria-label="`${b.category} budget progress`"
      style="background-color: var(--color-surface-divider)"
    >
      <div class="h-2 rounded-full transition-all" :style="progressFillStyle(b)" />
    </div>
    ...
  </div>
</section>
```

### IN-04: `reducedMotion` is computed but only used by Chart.js options

**File:** `src/components/projects/wallecx/ExpensesReportsView.vue:171-175`

**Issue:** The budget section uses `transition-all` (line 432) on the progress fill, which respects `prefers-reduced-motion` only if Tailwind v4's defaults do so. The newly added budget rows do not consult the `reducedMotion` computed — so users with reduced-motion preferences may still see the fill animation depending on browser behavior.

**Fix:** Either confirm Tailwind v4 honors `prefers-reduced-motion` for `transition-*` utilities, or conditionally apply the transition:

```vue
<div
  class="h-2 rounded-full"
  :class="{ 'transition-all': !reducedMotion }"
  :style="progressFillStyle(b)"
/>
```

This is also consistent with the UI-SPEC reduced-motion contract cited at line 171.

### IN-05: Console error logging exposes implementation detail

**File:** `src/components/projects/wallecx/ExpensesTab.vue:36, 78, 166`; `src/components/projects/wallecx/ExpensesReportsView.vue:160`; `src/components/projects/wallecx/ManageBudget.vue:93`

**Issue:** `console.error('ExpensesTab: loadBudgets failed', e)` and similar logs are useful in dev but persist in production builds (Vite does not strip them by default). The error object can leak PocketBase API URLs, request payloads, and stack traces to the browser console. For a public GitHub Pages deployment, this is low-severity info-leak.

**Fix:** Either guard with `if (import.meta.env.DEV)`, or use a thin wrapper (e.g., `src/lib/logger.ts`) that no-ops in production. Note: this is a project-wide pattern, not introduced by Phase 28 — if the team has decided to keep these logs, ignore.

---

_Reviewed: 2026-05-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
