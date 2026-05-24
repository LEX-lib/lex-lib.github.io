# Phase 28: Budget Tracking - Pattern Map

**Mapped:** 2026-05-24
**Files analyzed:** 5 (3 new + 2 modified)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/types/wallecx/expense-budgets/types.d.ts` | NEW | model (type-only) | n/a (declarations) | `src/types/wallecx/expense-categories/types.d.ts` | exact |
| `src/lib/pocketbase/expenseBudgetMapper.ts` | NEW | utility (PATCH mapper) | transform | `src/lib/pocketbase/expenseMapper.ts` | exact |
| `src/components/projects/wallecx/ManageBudget.vue` | NEW | component (write-path modal) | CRUD (upsert) | `src/components/projects/wallecx/ManageExpense.vue` | role-match (CRUD vs upsert) |
| `src/components/projects/wallecx/ExpensesTab.vue` | MODIFIED | component (shell / data owner) | request-response (getFullList) | self (extend in place) | self |
| `src/components/projects/wallecx/ExpensesReportsView.vue` | MODIFIED | component (read-path view) | computed-derived render | self (extend in place) | self |

---

## Pattern Assignments

### `src/types/wallecx/expense-budgets/types.d.ts` (NEW — model, declarations)

**Analog:** `src/types/wallecx/expense-categories/types.d.ts` (1-12)

**Full file pattern to mirror** (lines 1-12):
```typescript
import type { RecordModel } from "pocketbase";

export interface ExpenseCategories extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  name: string;
}

export type AddExpenseCategory = Omit<ExpenseCategories, "id" | "created" | "updated">;
```

**Adaptation for ExpenseBudget:**
- Interface name: `ExpenseBudget`
- Fields (per CONTEXT.md "Collection schema"): `id`, `created`, `updated`, `user`, `category: string`, `budget_type: 'monthly' | 'yearly'`, `amount: number`
- Helper export: `export type AddExpenseBudget = Omit<ExpenseBudget, 'id' | 'created' | 'updated'>;`
- Quote style: double quotes (matches both expenses and expense-categories analogs)
- File ends with single trailing newline (no closing comment block)

---

### `src/lib/pocketbase/expenseBudgetMapper.ts` (NEW — utility, transform)

**Analog:** `src/lib/pocketbase/expenseMapper.ts` (1-30)

**Full file pattern to mirror** (lines 1-30):
```typescript
import type { Expenses } from "@/types/wallecx/expenses/types";

/**
 * Strip read-only PocketBase fields on PATCH.
 * ...docblock...
 */
export function mapToUpdateExpense(record: Expenses): {
  amount: number;
  expense_date: string;
  category: string;
  description: string;
  notes?: string;
} {
  return {
    amount: record.amount,
    expense_date: record.expense_date,
    category: record.category,
    description: record.description,
    ...(record.notes !== undefined ? { notes: record.notes } : {}),
  };
}
```

**Adaptation for expenseBudgetMapper.ts:**
- Import: `import type { ExpenseBudget } from "@/types/wallecx/expense-budgets/types";`
- Function name: `mapToUpdateExpenseBudget`
- Return shape: `{ category: string; budget_type: 'monthly' | 'yearly'; amount: number }`
- Strip read-only fields: `id`, `created`, `updated`, `user`, `collectionId`, `collectionName`, `expand`
- Docblock should mention the locked requestKey `'expense-budgets-getFullList'` (per CONTEXT.md "Claude's Discretion") and warn it must not collide with `'expenses-getFullList'`, `'expense-categories-getFullList'`, `'vaccinations-getFullList'`, `'memberships-getFullList'`
- Notes field pattern (`...(record.notes !== undefined ? ...)`) is NOT needed — ExpenseBudget has no optional fields per schema

---

### `src/components/projects/wallecx/ManageBudget.vue` (NEW — component, CRUD upsert modal)

**Analog:** `src/components/projects/wallecx/ManageExpense.vue` (1-538)

**Imports pattern** (analog lines 1-11):
```typescript
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import { mapToUpdateExpense } from '@/lib/pocketbase/expenseMapper'
import type { Expenses } from '@/types/wallecx/expenses/types'
import type { ExpenseCategories } from '@/types/wallecx/expense-categories/types'
import { useIsMobile } from '@/composables/useIsMobile'
```

**Adaptation for ManageBudget.vue imports:**
- Drop: `imageCompression`, `dayjs`, `expenseSchema`, `DEFAULT_EXPENSE_CATEGORIES`, `mapToUpdateExpense`, `Expenses`
- Add: `import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'`
- Add: `import type { ExpenseCategories } from '@/types/wallecx/expense-categories/types'` (kept — categories are still referenced via prop)
- Keep: `ref`, `computed`, `watch` from vue; `toast`; `pb`; `useIsMobile`
- Single quotes only (matches analog `.vue` script style)

**defineModel + defineEmits pattern** (analog lines 13-19):
```typescript
const visible = defineModel('visible', { type: Boolean, default: false, required: true })
const record = defineModel<Expenses | null>('record', { default: null })

const emit = defineEmits<{
  created: [record: Expenses]
  updated: [record: Expenses]
}>()
```

**Adaptation for ManageBudget.vue:**
- Keep `visible` defineModel exactly as-is
- DROP `record` defineModel (ManageBudget is bulk-upsert, not single-record CRUD)
- Add props instead: `defineProps<{ categories: ExpenseCategories[]; budgets: ExpenseBudget[] }>()`
- Emit: `defineEmits<{ saved: [] }>()` (parent re-fetches the `budgets` ref on this event — see Pitfall 3 in RESEARCH.md)

**useIsMobile + isSaving pattern** (analog lines 21-22):
```typescript
const isMobile = useIsMobile()
const isSaving = ref(false)
```
Copy verbatim.

**Watcher pattern for pre-populating local form state from `:budgets` prop** (analog lines 43-67):
```typescript
watch(
  () => record.value,
  (rec) => {
    if (rec) {
      amount.value = rec.amount
      // ...seed from record
    } else {
      amount.value = null
      // ...blank defaults
    }
    // reset error refs
  },
  { immediate: true },
)
```

**Adaptation for ManageBudget.vue:** watch `visible` (per RESEARCH.md Pitfall 6) — re-create the local rows array from `props.categories` and `props.budgets` every time the dialog opens, so the dialog reflects current server state on each open:
```typescript
type BudgetRow = { category: string; amount: number | null; budgetType: 'monthly' | 'yearly' }
const localRows = ref<BudgetRow[]>([])

watch(visible, (isOpen) => {
  if (!isOpen) return
  const budgetMap = new Map(props.budgets.map(b => [b.category, b]))
  localRows.value = props.categories.map(c => {
    const existing = budgetMap.get(c.name)
    return {
      category: c.name,
      amount: existing?.amount ?? null,
      budgetType: existing?.budget_type ?? 'monthly',  // default monthly per UI-SPEC
    }
  })
})
```

**Submit / save handler pattern** (analog lines 178-260) — adapted for upsert loop:
- Auth null guard: copy from analog lines 203-207:
```typescript
const userId = pb.authStore.record?.id
if (!userId) {
  toast.error('Session expired. Please log in again.')
  return
}
```
- Saving toggle pattern (analog lines 209, 257-259):
```typescript
isSaving.value = true
try { /* ... */ } finally { isSaving.value = false }
```
- Toast on success/failure (analog lines 244, 256):
```typescript
toast.success('Budgets saved.')
// catch block:
toast.error('Failed to save budgets. Please try again.')
```
- Upsert loop (NEW logic — see RESEARCH.md Pattern 4 in 28-RESEARCH.md lines 256-296). Use `Promise.all` over `localRows.value.map(async (row) => { ... })`. Per row:
  - If `row.amount == null || row.amount <= 0` and existing record exists → `pb.collection('wallecx_expense_budgets').delete(existing.id)`; else skip.
  - If existing → `update(existing.id, { budget_type, amount })` (use `mapToUpdateExpenseBudget` semantics — the writable field set)
  - If new → `create({ user: userId, category, budget_type, amount })`
- After save: emit `'saved'`, set `visible.value = false`

**Template pattern — Desktop Dialog** (analog lines 264-291):
```html
<Dialog
  v-if="!isMobile"
  modal
  v-model:visible="visible"
  :header="dialogHeader"
  :style="{ width: '40vw' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  :closable="!isSaving && !isLoadingCategories"
  @hide="onHide"
>
  <form @submit.prevent="onSubmit" class="space-y-4">...</form>
</Dialog>
```

**Adaptation for ManageBudget.vue:**
- `:header="'Manage Budgets'"` (per UI-SPEC §Copywriting Contract)
- `:closable="!isSaving"` (no category loading state — categories come in via prop)
- `@hide` handler may be omitted unless cleanup needed
- Remove the `onHide` callback's `pendingFile.value = null` (no file uploads in ManageBudget)

**Template pattern — Mobile Drawer** (analog lines 394-407):
```html
<Drawer
  v-else
  v-model:visible="visible"
  position="bottom"
  :show-close-icon="!isSaving && !isLoadingCategories"
  @hide="onHide"
>
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
      <span class="font-semibold">{{ dialogHeader }}</span>
    </div>
  </template>
  <form @submit.prevent="onSubmit" class="space-y-4">...</form>
</Drawer>
```
Copy template structure; replace `dialogHeader` with literal `Manage Budgets`; replace `:show-close-icon="!isSaving && !isLoadingCategories"` with `:show-close-icon="!isSaving"`.

**Form field pattern — amount InputNumber** (analog lines 277-293, adapted for per-row):
```html
<InputNumber
  v-model="row.amount"
  fluid
  :minFractionDigits="2"
  :maxFractionDigits="2"
  :min="0"
  :disabled="isSaving"
/>
```
Note: change `:min="0.01"` (analog) → `:min="0"` (ManageBudget allows 0 to mean "delete").

**New control — SelectButton for Monthly/Yearly toggle** (no exact analog in codebase; PrimeVue auto-imported via PrimeVueResolver):
```html
<SelectButton
  v-model="row.budgetType"
  :options="[
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly',  value: 'yearly'  },
  ]"
  option-label="label"
  option-value="value"
  :allow-empty="false"
  :disabled="isSaving"
/>
```
[ASSUMED: SelectButton is auto-imported via PrimeVueResolver — same auto-import mechanism that resolves Dialog, Drawer, InputNumber, FileUpload, Select, DatePicker, Tabs without explicit imports in any Wallecx component. Verified: no Vue file in `src/` explicitly imports PrimeVue components.]

**Submit button pattern** (analog lines 383-389):
```html
<Button
  type="submit"
  fluid
  :label="isEditMode ? 'Save Changes' : 'Add Expense'"
  :loading="isSaving || isLoadingCategories"
  :disabled="isSaving || isLoadingCategories"
/>
```
**Adaptation:** label = literal `"Save Budgets"`; loading/disabled = `isSaving`.

**Scoped style pattern — dark mode overrides** (analog lines 527-538):
```css
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
**Copy verbatim** into ManageBudget.vue `<style scoped>`.

---

### `src/components/projects/wallecx/ExpensesTab.vue` (MODIFIED — shell, data owner)

**Self-reference** — extend the existing shell. Two patterns to mirror in-place.

**Pattern 1: Second `getFullList` for budgets** — extend the existing `onMounted` block (current file lines 44-59):

Current code (lines 44-59):
```typescript
onMounted(async () => {
  isLoading.value = true
  try {
    expenses.value = await pb
      .collection('wallecx_expenses')
      .getFullList<Expenses>({
        sort: '-expense_date,-created',
        requestKey: 'expenses-getFullList',
      })
  } catch (e: unknown) {
    toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
```

**Extension pattern** (from RESEARCH.md Pattern 1, lines 158-185):
```typescript
const budgets = ref<ExpenseBudget[]>([])

// Inside the existing try-block, AFTER the expenses fetch:
budgets.value = await pb
  .collection('wallecx_expense_budgets')
  .getFullList<ExpenseBudget>({
    requestKey: 'expense-budgets-getFullList',  // STATE.md invariant — distinct key
  })
```
- Add `import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'` at line 5-ish (alphabetical after `Expenses`).
- Per CONTEXT.md "Claude's Discretion" + RESEARCH.md Pitfall 1: requestKey must be exactly `'expense-budgets-getFullList'`.
- Toast wording stays as `'Failed to load expenses. Pull to refresh or reload the page.'` (single shared toast per RESEARCH.md note on line 187).

**Pattern 2: Pass `:budgets` prop to ExpensesReportsView** — modify the existing template (current file lines 190-196):

Current:
```html
<ExpensesReportsView
  :expenses="expenses"
  :is-loading="isLoading"
  @request-add-expense="openManage(null)"
/>
```

**Extension:**
```html
<ExpensesReportsView
  :expenses="expenses"
  :budgets="budgets"
  :is-loading="isLoading"
  @request-add-expense="openManage(null)"
  @budgets-saved="loadBudgets"
/>
```

**Pattern 3: `loadBudgets` helper** for the `@budgets-saved` event (RESEARCH.md Pitfall 3 + Open Question 1):
```typescript
async function loadBudgets(): Promise<void> {
  try {
    budgets.value = await pb
      .collection('wallecx_expense_budgets')
      .getFullList<ExpenseBudget>({
        requestKey: 'expense-budgets-getFullList',
      })
  } catch (e: unknown) {
    toast.error('Failed to refresh budgets. Please reload the page.')
    console.error('ExpensesTab: loadBudgets failed', e)
  }
}
```
Mirror the existing fetch-with-toast-and-console.error idiom from analog lines 47-58 and 142-146 (`exportJson` error handling).

---

### `src/components/projects/wallecx/ExpensesReportsView.vue` (MODIFIED — view)

**Self-reference** — extend the existing reports view with `:budgets` prop, button, and section.

**Pattern 1: Accept `:budgets` prop** — extend defineProps (current lines 17-20):

Current:
```typescript
const props = defineProps<{
  expenses: Expenses[]
  isLoading: boolean
}>()
```

**Extension:**
```typescript
const props = defineProps<{
  expenses: Expenses[]
  budgets: ExpenseBudget[]
  isLoading: boolean
}>()
```
- Add type import alongside the `Expenses` import (line 4): `import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'`.

**Pattern 2: Emit `budgets-saved`** — extend defineEmits (current lines 22-24):
```typescript
const emit = defineEmits<{
  'request-add-expense': []
  'budgets-saved': []
}>()
```
Mirror the existing kebab-case event naming.

**Pattern 3: Local `showManageBudget` ref + computed maps**:
```typescript
const showManageBudget = ref(false)
const budgetCategories = ref<ExpenseCategories[]>([])
const isLoadingCategories = ref(false)

// Lookup map — O(1) per category
const budgetMap = computed(() => {
  const map = new Map<string, ExpenseBudget>()
  for (const b of props.budgets) map.set(b.category, b)
  return map
})

// Period-gated rows (D-07, D-08, D-09)
const visibleBudgets = computed<ExpenseBudget[]>(() => {
  if (period.value === 'this-month') {
    return props.budgets.filter(b => b.budget_type === 'monthly')
  }
  if (period.value === 'this-year') {
    return props.budgets.filter(b => b.budget_type === 'yearly')
  }
  return []  // this-quarter and custom: section hidden
})
```

**Pattern 4: Load categories when opening ManageBudget** — mirror ManageExpense.vue's `loadCategories` pattern (analog lines 75-108) but inside ExpensesReportsView since this view owns the button:
```typescript
async function openManageBudgets(): Promise<void> {
  await loadCategoriesForBudget()
  showManageBudget.value = true
}

async function loadCategoriesForBudget(): Promise<void> {
  isLoadingCategories.value = true
  try {
    budgetCategories.value = await pb.collection('wallecx_expense_categories')
      .getFullList<ExpenseCategories>({
        requestKey: 'expense-categories-getFullList',
      })
  } catch {
    toast.error('Failed to load categories. Please try again.')
  } finally {
    isLoadingCategories.value = false
  }
}
```
**Note on requestKey collision** (RESEARCH.md Open Question 2): `'expense-categories-getFullList'` is reused from ManageExpense.vue. Since both dialogs are not open simultaneously (Reports tab vs List tab modal), reuse is acceptable per existing pattern.

**Pattern 5: "Manage Budgets" button placement** — inside STATE 4 block (current line 291 `<template v-else>`), per UI-SPEC §Component Inventory →  Extended Component:
```html
<template v-else>
  <div class="flex flex-col items-center gap-1 my-6">
    <span class="text-sm" style="color: var(--color-typo-muted)">
      Total spend — {{ periodNameLabel }}
    </span>
    <span class="text-3xl font-bold" style="color: var(--color-brand-primary)">
      {{ formatCurrency(grandTotal) }}
    </span>
  </div>

  <!-- NEW: Manage Budgets button (D-01, UI-SPEC) -->
  <div class="flex justify-end mb-4">
    <Button
      label="Manage Budgets"
      icon="pi pi-sliders-h"
      severity="secondary"
      size="small"
      class="min-h-[44px]"
      :loading="isLoadingCategories"
      :disabled="isLoadingCategories"
      @click="openManageBudgets"
    />
  </div>

  <!-- existing chart container ... -->
```
The existing chart block stays unchanged below.

**Pattern 6: Budget vs Actual section** — appended below the chart (after the closing `</div>` for the chart container, before `</template>`):
```html
<div
  v-if="visibleBudgets.length > 0"
  class="mt-6"
>
  <h3 class="text-base font-bold mb-3" style="color: var(--color-typo-heading)">
    Budget vs Actual
  </h3>
  <div
    v-for="b in visibleBudgets"
    :key="b.id"
    class="mb-4"
    :aria-label="`Budget for ${b.category}: ${formatCurrency(b.amount)} budget, ${formatCurrency(actualFor(b.category))} actual, ${b.amount >= actualFor(b.category) ? 'under' : 'over'}`"
  >
    <div class="text-sm mb-1" style="color: var(--color-typo-heading)">
      {{ b.category }}
    </div>
    <div class="w-full h-2 rounded-full" style="background-color: var(--color-surface-divider)">
      <div
        class="h-2 rounded-full transition-all"
        :style="{
          width: Math.min(100, (actualFor(b.category) / b.amount) * 100) + '%',
          backgroundColor: actualFor(b.category) > b.amount
            ? 'var(--color-status-error)'
            : 'var(--color-status-success)',
        }"
      />
    </div>
    <div class="flex items-center justify-between mt-1">
      <span class="text-xs" style="color: var(--color-typo-muted)">
        {{ formatCurrency(actualFor(b.category)) }}
      </span>
      <span
        class="text-xs font-normal px-2 py-0.5 rounded-full"
        :style="badgeStyle(b)"
      >
        {{ badgeLabel(b) }}
      </span>
    </div>
  </div>
</div>
```

Supporting helpers in `<script setup>`:
```typescript
function actualFor(category: string): number {
  return categoryTotals.value.find(c => c.category === category)?.total ?? 0
}

function badgeLabel(b: ExpenseBudget): string {
  const actual = actualFor(b.category)
  if (actual > b.amount)  return `Over by ${formatCurrency(actual - b.amount)}`
  if (actual < b.amount)  return `Under by ${formatCurrency(b.amount - actual)}`
  return 'On budget'
}

function badgeStyle(b: ExpenseBudget): { backgroundColor: string; color: string } {
  const actual = actualFor(b.category)
  const isOver = actual > b.amount
  const token = isOver ? 'var(--color-status-error)' : 'var(--color-status-success)'
  return {
    backgroundColor: `color-mix(in srgb, ${token} 15%, transparent)`,
    color: token,
  }
}
```

**Pattern 7: ManageBudget mount point** — at the end of the template's outer `<div class="pt-2">`:
```html
<ManageBudget
  v-model:visible="showManageBudget"
  :categories="budgetCategories"
  :budgets="budgets"
  @saved="emit('budgets-saved'); showManageBudget = false"
/>
```
And add the import at the top of `<script setup>`:
```typescript
import ManageBudget from './ManageBudget.vue'
```

---

## Shared Patterns

### Authentication / Per-User Isolation

**Source:** PocketBase collection rules (server-side) + analog ManageExpense.vue lines 203-207 (client-side guard)
**Apply to:** All ManageBudget write operations (create, update, delete)

```typescript
// Auth null guard before any write
const userId = pb.authStore.record?.id
if (!userId) {
  toast.error('Session expired. Please log in again.')
  return
}
```

Server-side PocketBase rules for `wallecx_expense_budgets` (per CONTEXT.md "Claude's Discretion" + MEMORY.md PocketBase v0.29.x note):
```
createRule: @request.auth.id != "" && @request.body.user = @request.auth.id
listRule:   user = @request.auth.id
viewRule:   user = @request.auth.id
updateRule: user = @request.auth.id
deleteRule: user = @request.auth.id
```
**Note:** Use `@request.body.user` (NOT `@request.data.user`) per PocketBase v0.29.3 syntax. The deprecated `@request.data.user` form causes create requests to return 403.

### Toast Notifications

**Source:** `vue-sonner` `toast.success` / `toast.error` — used throughout ManageExpense.vue (analog lines 98, 138, 168, 205, 220, 244, 256), ExpensesTab.vue (lines 35, 54, 90, 92, 105, 140, 142)
**Apply to:** All write-path success/failure, all data-fetch failure

Specific toast copy locked by UI-SPEC §Copywriting Contract:
- `toast.success('Budgets saved.')` — ManageBudget save success
- `toast.error('Failed to save budgets. Please try again.')` — ManageBudget save failure
- `toast.error('Session expired. Please log in again.')` — auth-null guard (literal copy reused from ManageExpense.vue line 205)
- `toast.error('Failed to load categories. Please try again.')` — ManageBudget categories load failure (literal copy from analog line 104)

### Dialog/Drawer Mobile Split

**Source:** `src/composables/useIsMobile.ts` + `src/components/projects/wallecx/ManageExpense.vue` lines 265-407
**Apply to:** ManageBudget.vue only (existing receipt preview in ExpensesTab.vue already uses this; no new modal in ExpensesReportsView)

```typescript
const isMobile = useIsMobile()
// Template: <Dialog v-if="!isMobile" ...> ... </Dialog>
//           <Drawer v-else position="bottom" ...> ... </Drawer>
```

Mobile breakpoint: 639px (matches Tailwind `sm:` threshold of 640px per `useIsMobile.ts` line 12 default and CLAUDE.md Phase 17 D-10 reference).

### Currency Formatting

**Source:** `src/lib/wallecx/currency.ts` lines 1-13
**Apply to:** All amount display in ManageBudget (if any read-back) and the Budget vs Actual section

```typescript
import { formatCurrency } from '@/lib/wallecx/currency'
// formatCurrency(1234.56) → "₱1,234.56"
```

### CSS Tokens for Status

**Source:** `src/assets/base.css` (verified in 28-RESEARCH.md line 528-530)
**Apply to:** Budget vs Actual progress bars and Under/Over badges in ExpensesReportsView.vue

| Token | Value | Use |
|-------|-------|-----|
| `--color-status-success` | `#1a7c45` | Under-budget progress fill + badge text |
| `--color-status-error` | `#c0392b` | Over-budget progress fill + badge text |
| `--color-surface-divider` | `#e8ecf2` (light) / `#2a3142` (dark) | Progress bar track |
| `--color-typo-heading` | per theme | Section heading + category name text |
| `--color-typo-muted` | per theme | Actual amount text |
| `--color-brand-primary` | `#002244` (light) / `#7896ba` (dark) | Reserved for Grand Total hero only — NOT used in budget section |

**Badge background** uses `color-mix(in srgb, var(--color-status-*) 15%, transparent)` per UI-SPEC §Component Inventory — produces a subtle tint while preserving the token-based color system.

### Touch Target Minimum

**Source:** Phase 15 invariant — referenced throughout existing code (e.g., ExpensesReportsView.vue lines 232, 241, 285; ExpensesTab.vue line 260)
**Apply to:** ALL interactive controls in ManageBudget.vue and the new "Manage Budgets" button

```html
<Button ... class="min-h-[44px]" />
<InputNumber ... class="min-h-[44px]" />  <!-- if Tailwind class doesn't reach the input, fallback to scoped CSS -->
```

### requestKey Uniqueness (STATE.md Invariant)

**Source:** `.planning/STATE.md` §Architectural Invariants + RESEARCH.md Pitfall 1
**Apply to:** All PocketBase `getFullList`, `create`, `update`, `delete` calls in this phase

| Operation | Locked requestKey |
|-----------|-------------------|
| ExpensesTab.vue: budgets fetch | `'expense-budgets-getFullList'` |
| ExpensesTab.vue: existing expenses fetch | `'expenses-getFullList'` (unchanged) |
| ManageBudget.vue: create/update/delete (per call) | inline calls — no explicit requestKey needed for write operations (PocketBase auto-cancels only on duplicate request keys for in-flight reads) |
| ExpensesReportsView.vue: categories fetch for ManageBudget | `'expense-categories-getFullList'` (reused — see RESEARCH.md Open Question 2 — acceptable because ManageExpense and ManageBudget are not open simultaneously) |

**Anti-pattern:** Do NOT reuse `'expense-budgets-getFullList'` for any other call. Do NOT alias the budgets read to `'expenses-getFullList'`.

### sessionStorage Non-Fatal Pattern

**Source:** ExpensesReportsView.vue lines 152-176 (existing watch-write idiom)
**Apply to:** Not required for this phase — no new sessionStorage keys per CONTEXT.md. The "Manage Budgets" dialog state is in-memory only (no persistence of open/closed state across sessions).

---

## No Analog Found

| File / Concern | Reason | Recommendation |
|----------------|--------|----------------|
| PrimeVue `SelectButton` (Monthly/Yearly toggle) | No existing usage of SelectButton or ToggleButton anywhere in the codebase (`Grep` confirms 0 results in `src/`). | Use PrimeVue `SelectButton` — auto-imported via PrimeVueResolver (same mechanism as Dialog/Drawer/InputNumber). UI-SPEC §Component Inventory locks the API. Confidence: HIGH that auto-import works — every PrimeVue component used in Wallecx is auto-imported without explicit import statements. |
| Bulk-upsert loop with `Promise.all` | No existing Wallecx component does multi-record upsert in a single save. All other Manage*.vue components write a single record. | Follow RESEARCH.md Pattern 4 explicitly. Document Promise.all partial-failure acceptance (Pitfall 4) in a code comment in `onSubmit`. After save, parent re-fetches via `@saved` event — guarantees UI reflects server state even on partial failure. |
| Progress bar UI primitive | No native PrimeVue ProgressBar usage for non-loading purposes; no existing budget-style indicator. | Hand-roll two `<div>` elements per RESEARCH.md Pattern 6 (lines 339-353). Uses only Tailwind utilities + CSS-token inline styles. No new library. |

---

## Metadata

**Analog search scope:**
- `src/components/projects/wallecx/` — all 3 Manage*.vue files inspected, ExpensesTab.vue and ExpensesReportsView.vue read in full
- `src/types/wallecx/` — expenses and expense-categories type files
- `src/lib/pocketbase/` — expenseMapper.ts (primary analog)
- `src/lib/wallecx/` — currency.ts (formatCurrency)
- `src/composables/` — useIsMobile.ts
- `components.d.ts` — verified SelectButton/ToggleButton not pre-registered (auto-imported on demand)

**Files scanned:** 9 source files read end-to-end; 2 grep sweeps for SelectButton/ToggleButton/ExpenseBudget across `src/`

**Confidence:** HIGH — all primary analogs are 1:1 structural matches; only the bulk-upsert loop and SelectButton control are new (and both have explicit specs in CONTEXT.md/UI-SPEC/RESEARCH.md).

**Pattern extraction date:** 2026-05-24
