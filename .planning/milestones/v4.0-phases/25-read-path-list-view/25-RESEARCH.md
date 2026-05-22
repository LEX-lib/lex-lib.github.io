# Phase 25: Read Path — List View - Research

**Researched:** 2026-05-21
**Domain:** Vue 3 / PrimeVue 4 — expense list rendering, filtering, sorting, attachment preview
**Confidence:** HIGH

---

## Summary

Phase 25 populates `ExpensesTab.vue` (a Phase 24 stub) with a full live list: `onMounted` load, `filteredSortedExpenses` computed, a new `ExpensesToolbar.vue` (search + sort + MultiSelect category filter + two DatePicker inputs), a new `ExpenseItem.vue` compact row component, skeleton loading, two empty states, and receipt preview via the existing `AttachmentPreview` component.

All required patterns (load, sessionStorage sort persistence, skeleton, file token fetch, delete via `useConfirm`, Dialog vs. Drawer responsive preview) are already established in `MembershipsTab.vue` and `VaccinationsTab.vue`. The implementation is a direct structural mirror of the membership list with additional filter dimensions.

**Critical finding:** `@vueuse/core` is NOT installed in this project (`package.json` lists only `@vueuse/motion`). The CONTEXT.md and UI-SPEC reference `useDebounce` from `@vueuse/core` (D-09), but this package is absent. The debounce must be implemented without it — either by installing `@vueuse/core`, or by using a native `watch` + `setTimeout`/`clearTimeout` pattern, or by skipping debounce (the existing WallecxToolbar/VaccinationsTab/MembershipsTab do NOT debounce search at all — they filter reactively on every keystroke). This is the most significant planning decision left open by existing context.

**Primary recommendation:** Implement debounce as a local `watch` + `setTimeout` pattern in `ExpensesToolbar.vue` (no new package install). This matches the spirit of D-09 without introducing a new dependency. The planner must decide: install `@vueuse/core` for `useDebounce`, or use a local 300ms `setTimeout` pattern.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Expense Row Layout (EXP-07)**
- D-01: Each expense renders as a compact list row (not a card, not a DataTable). New `ExpenseItem.vue` in `src/components/projects/wallecx/`.
- D-02: Inline icon buttons (pencil = edit, trash = delete) on every row, both min 44px touch target.
- D-03: Sort mode persists in sessionStorage under key `wallecx:expense-sort`. Default: `newest-first`.
- D-04: Sort options: `newest-first`, `oldest-first`, `category-asc`, `amount-high`, `amount-low`.

**Filter Toolbar (EXP-08 / EXP-09)**
- D-05: New `ExpensesToolbar.vue`. Does NOT modify `WallecxToolbar.vue`.
- D-06: v-model bindings: `v-model:search-query` (string), `v-model:sort-mode` (string), `v-model:selected-categories` (string[]), `v-model:date-from` (Date|null), `v-model:date-to` (Date|null).
- D-07: Category filter uses PrimeVue `MultiSelect`. Options derived client-side from loaded expenses (no new PB query).
- D-08: Date range uses two PrimeVue `DatePicker` inputs always visible. No quick presets.
- D-09: Description search debounced at 300ms using `useDebounce` from `@vueuse/core`. (**NOTE: `@vueuse/core` is NOT installed — see critical finding above.**)

**Filtering & Sorting Logic**
- D-10: All filtering/sorting in a single `filteredSortedExpenses` computed: (1) search, (2) category, (3) date range, (4) sort.
- D-11: Date range comparison uses `dayjs`. `expense_date` is YYYY-MM-DD string. From inclusive (>=), To inclusive (<=).
- D-12: Filter-empty state: "No expenses match your filters." + "Clear filters" button.

**Receipt Preview (EXP-10)**
- D-13: Rows with a receipt field show a paperclip icon.
- D-14: Tapping paperclip calls `pb.files.getToken()`, sets previewRecord + previewToken, opens AttachmentPreview. Token failure shows toast, does NOT open preview.
- D-15: Dedicated `showPreview` + `previewRecord` + `previewToken` refs in `ExpensesTab.vue`.

**PocketBase Load**
- D-16: `onMounted` calls `pb.collection('wallecx_expenses').getFullList<Expenses>({ sort: '-expense_date,-created', requestKey: 'expenses-getFullList' })`.
- D-17: Loading state: 3 skeleton rows matching ExpenseItem row height.

**Dark Mode**
- D-18: `ExpenseItem.vue` and `ExpensesToolbar.vue` follow scoped CSS variable override pattern (Phase 18 + 22). Target `.my-app-dark` prefixed selectors.

### Claude's Discretion

- Exact layout proportions within the compact row (flex weights, truncation length for description)
- Whether to show a running total at bottom of filtered list (nice-to-have, not required)
- Whether `ExpensesToolbar.vue` stacks to two rows on mobile or stays single-row with horizontal scroll
- Exact empty-state icon choice for the no-filter-results state
- Whether sort mode is also persisted when category/date filters are active (session storage key stores sort only)

### Deferred Ideas (OUT OF SCOPE)

- Quick-preset date filters (Today / This week / This month)
- Running total at bottom of list
- Period-tabbed reporting view (Phase 26)
- ExpenseDetail panel
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-07 | Sortable list (date/category/amount), sessionStorage sort persistence under `wallecx:expense-sort` | MembershipsTab.vue lines 23–80 — exact pattern to replicate. 5 sort modes, `validModes` whitelist, `watch(sortMode)` persister. |
| EXP-08 | Filter by category (MultiSelect) and date range (two DatePickers), client-side only | PrimeVue MultiSelect confirmed in auto-import resolver; DatePicker already used in ManageExpense.vue. Category options derived from loaded expenses array. |
| EXP-09 | Client-side description text search, debounced | **Debounce library absent** — see critical finding. Reactive search without debounce is the established project pattern. Manual setTimeout/clearTimeout pattern is viable alternative. |
| EXP-10 | Receipt preview via AttachmentPreview, file token required | AttachmentPreview props confirmed: `record: RecordModel`, `attachmentField: string`, `attachmentName: string`, `token: string`. MembershipsTab `openDetail` is the exact token-fetch pattern to mirror. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data load (getFullList) | ExpensesTab.vue (component) | PocketBase (server) | Tab owns its own data; no Pinia store per STATE.md invariant |
| Filtering + sorting | ExpensesTab.vue (computed) | — | Client-side on already-loaded array; no new queries |
| Toolbar controls (search/sort/filter inputs) | ExpensesToolbar.vue (child component) | — | Isolated UI concern; parent owns state via v-model |
| Row rendering | ExpenseItem.vue (child component) | — | Encapsulates row layout and action emissions |
| Receipt preview | AttachmentPreview.vue (existing) | ExpensesTab.vue (token fetch) | Existing component; parent fetches token before opening |
| Delete confirmation | WallecxApp.vue (ConfirmDialog) → ExpensesTab.vue (useConfirm) | — | STATE.md invariant: ConfirmDialog at shell level only |
| Dark mode | scoped CSS in ExpenseItem + ExpensesToolbar | base.css CSS variables (auto) | CSS variable references auto-switch; PrimeVue components need explicit overrides |

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | ^3.5.18 [VERIFIED: package.json] | Composition API, `<script setup>`, `computed`, `watch`, `ref` | Project foundation |
| PrimeVue 4 Aura | ^4.3.7 [VERIFIED: package.json] | MultiSelect, DatePicker, Skeleton, Button, Dialog, Drawer, IconField, InputText, Select | Auto-imported via PrimeVueResolver; used throughout codebase |
| dayjs | ^1.11.18 [VERIFIED: package.json] | Date comparison for date range filter, `D MMM YYYY` display format | Already used in ManageExpense.vue, VaccinationsTab.vue |
| pocketbase | ^0.26.2 [VERIFIED: package.json] | `pb.collection().getFullList()`, `pb.files.getToken()`, `pb.files.getURL()` | Backend client |
| vue-sonner | ^2.0.8 [VERIFIED: package.json] | Toast notifications (load error, receipt token error, delete success/failure) | Used throughout Wallecx |
| iconify-icon | ^3.0.0 [VERIFIED: package.json] | `mdi:paperclip`, `mdi:pencil-outline`, `mdi:trash-can-outline`, `mdi:cash-multiple`, `mdi:filter-remove-outline` | Used for all feature icons in Wallecx |

### Not Installed — Decision Required

| Library | Decision | Alternative |
|---------|----------|-------------|
| `@vueuse/core` | NOT installed [VERIFIED: package.json] | Use local `watch` + `setTimeout`/`clearTimeout` 300ms debounce pattern OR install `@vueuse/core` for `useDebounce` |

**Recommendation for planner:** The existing VaccinationsTab and MembershipsTab filter `searchQuery` reactively on every keystroke with NO debounce — it is performant because filtering is synchronous on an in-memory array. A 300ms debounce is a UX polish, not a correctness requirement. The simplest path: implement without debounce (matching existing project pattern) OR implement a local debounce ref. Installing `@vueuse/core` introduces a new dependency purely for one utility.

If debounce is desired, the local pattern is:
```typescript
// In ExpensesToolbar.vue
const searchQueryInternal = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQueryInternal, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => emit('update:searchQuery', val), 300)
})
```

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction
      |
      v
[ExpensesToolbar.vue]  -- emits update:searchQuery, update:sortMode,
      |                   update:selectedCategories, update:date-from, update:date-to
      v
[ExpensesTab.vue]
  expenses ref (raw array from PocketBase)
      |
      +--> filteredSortedExpenses computed
      |      (1) description search
      |      (2) category filter
      |      (3) date range (dayjs)
      |      (4) sort (5 modes)
      |
      +--> v-for ExpenseItem.vue  ---- emits: edit, delete, preview
      |         |
      |         +--edit--> openManage(record) --> ManageExpense.vue
      |         |
      |         +--delete--> deleteExpense(record) --> useConfirm --> pb.delete
      |         |                                         |
      |         |                                    [ConfirmDialog at WallecxApp.vue]
      |         |
      |         +--preview--> openReceiptPreview(record)
      |                            |
      |                            +--> pb.files.getToken()
      |                            |         |
      |                            |    success: set previewRecord, previewToken, showPreview=true
      |                            |    failure: toast.error (do NOT open)
      |                            |
      |                       [Dialog (desktop) / Drawer bottom (mobile)]
      |                            |
      |                       [AttachmentPreview.vue]
      |                            props: record, attachmentField="receipt",
      |                                   attachmentName="Receipt", token
      |
      +--> onMounted
             |
             +--> sessionStorage restore (wallecx:expense-sort)
             +--> pb.collection('wallecx_expenses').getFullList({ sort: '-expense_date,-created',
                                                                  requestKey: 'expenses-getFullList' })
```

### Recommended File Structure

```
src/components/projects/wallecx/
├── ExpensesTab.vue          # MODIFY: Phase 24 stub → full list implementation
├── ExpensesToolbar.vue      # CREATE: search + sort + MultiSelect + DatePicker (x2)
├── ExpenseItem.vue          # CREATE: compact list row component
├── AttachmentPreview.vue    # UNCHANGED: reused for receipt preview
├── ManageExpense.vue        # UNCHANGED: called from row edit button
└── WallecxApp.vue           # UNCHANGED: ConfirmDialog already at shell level
```

### Pattern 1: sessionStorage Sort Persistence (from MembershipsTab.vue)

**What:** Read stored sort mode on mount (with validModes whitelist), persist on every change via `watch`.
**When to use:** Every sortable tab in Wallecx uses this pattern.

```typescript
// Source: MembershipsTab.vue lines 23–80 [VERIFIED: codebase]
const SORT_STORAGE_KEY = 'wallecx:expense-sort'
const VALID_SORT_MODES = ['newest-first', 'oldest-first', 'category-asc', 'amount-high', 'amount-low']
const sortMode = ref<string>('newest-first')

watch(sortMode, (next) => {
  try { sessionStorage.setItem(SORT_STORAGE_KEY, next) } catch { /* non-fatal */ }
})

onMounted(async () => {
  try {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY)
    if (stored && VALID_SORT_MODES.includes(stored)) sortMode.value = stored
  } catch { /* privacy-mode iframe fallback */ }
  // ... then load data
})
```

### Pattern 2: onMounted Load with isLoading Guard (from MembershipsTab.vue)

**What:** Set `isLoading = true` before fetch, always reset in `finally`.
**When to use:** Every tab's initial data load.

```typescript
// Source: MembershipsTab.vue lines 92–106 [VERIFIED: codebase]
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
```

### Pattern 3: File Token Fetch Before Preview (from MembershipsTab.vue)

**What:** Fetch `pb.files.getToken()` before opening any attachment preview. Abort + toast on failure.
**When to use:** Any time `AttachmentPreview` is opened. `receipt` field is `protected=true` on the PocketBase collection — direct URL access returns 403. [VERIFIED: STATE.md v4.0 Foundation]

```typescript
// Source: MembershipsTab.vue lines 109–122 [VERIFIED: codebase]
async function openReceiptPreview(record: Expenses): Promise<void> {
  try {
    previewToken.value = await pb.files.getToken()
  } catch (e: unknown) {
    toast.error('Failed to load receipt. Refresh to try again.')
    console.error('ExpensesTab: getToken failed', e)
    return // WR-03 pattern: never open preview without a token
  }
  previewRecord.value = record
  showPreview.value = true
}
```

### Pattern 4: AttachmentPreview Props Interface

**What:** AttachmentPreview accepts `record: RecordModel`, `attachmentField: string`, `attachmentName: string`, `token: string`.
**When to use:** Open as child inside Dialog (desktop) or Drawer bottom (mobile), passing the fetched token.

```html
<!-- Source: AttachmentPreview.vue props definition [VERIFIED: codebase] -->
<!-- Desktop: Dialog -->
<Dialog v-if="!isMobile" v-model:visible="showPreview" modal header="Receipt" ...>
  <AttachmentPreview
    v-if="previewRecord"
    :record="previewRecord"
    attachment-field="receipt"
    attachment-name="Receipt"
    :token="previewToken"
  />
</Dialog>

<!-- Mobile: Drawer bottom -->
<Drawer v-else v-model:visible="showPreview" position="bottom" ...>
  <AttachmentPreview
    v-if="previewRecord"
    :record="previewRecord"
    attachment-field="receipt"
    attachment-name="Receipt"
    :token="previewToken"
  />
</Drawer>
```

### Pattern 5: WallecxToolbar v-model Prop Shape

**What:** WallecxToolbar uses named v-model bindings emitted as `update:searchQuery`, `update:sortMode`.
**When to use:** ExpensesToolbar replicates this shape, adding `update:selectedCategories`, `update:dateFrom`, `update:dateTo`.

```typescript
// Source: WallecxToolbar.vue lines 1–19 [VERIFIED: codebase]
// WallecxToolbar uses defineProps + defineEmits (not defineModel).
// ExpensesToolbar should follow the same pattern for consistency.
const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:sortMode': [value: string]
  'update:selectedCategories': [value: string[]]
  'update:dateFrom': [value: Date | null]
  'update:dateTo': [value: Date | null]
}>()
```

### Pattern 6: Scoped Dark Mode CSS Overrides for PrimeVue Components

**What:** Use `:deep(.my-app-dark .p-*)` inside `<style scoped>` to override PrimeVue component CSS variables.
**When to use:** Any new Wallecx component using PrimeVue form components (InputText, Select, MultiSelect, DatePicker).

```css
/* Source: ManageExpense.vue lines 527–538 [VERIFIED: codebase] */
/* Also see: wallecx-overrides.css lines 52–56 for .p-card pattern */
:deep(.my-app-dark .p-inputtext) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
:deep(.my-app-dark .p-select),
:deep(.my-app-dark .p-multiselect),
:deep(.my-app-dark .p-datepicker) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
```

**Important note:** `wallecx-overrides.css` is imported from `WallecxApp.vue` (non-scoped, global for the Wallecx chunk). It handles `.p-card` and `.p-drawer-bottom .p-drawer`. Component-specific overrides (InputText, Select, etc.) go in scoped styles on each component. [VERIFIED: wallecx-overrides.css, WallecxApp.vue line 11]

### Pattern 7: ExpenseItem Delete via emit (NOT defineExpose)

**What:** `ExpenseItem.vue` emits `delete` → `ExpensesTab.vue` calls `deleteExpense(record)` — which already exists in the stub and handles `useConfirm` → server delete.
**Clarification on CONTEXT.md code_context note:** The note "defineExpose({ deleteExpense }) — Phase 25 calls it from row actions via a ref to the component" refers to the `defineExpose` **already in `ExpensesTab.vue`** (line 54). This was wired to expose `deleteExpense` for potential external callers. Row actions in `ExpenseItem.vue` emit `delete` to `ExpensesTab.vue`, which calls `deleteExpense(record)` internally. No component ref pattern needed — standard emit-to-parent is correct.

### Pattern 8: filteredSortedExpenses Computed

**What:** Single computed that applies all 4 transforms in order. The exact code is provided in CONTEXT.md `<specifics>`.
**When to use:** Replaces the bare `expenses` ref in the template v-for.

```typescript
// Source: CONTEXT.md <specifics> [CITED: .planning/phases/25-read-path-list-view/25-CONTEXT.md]
const filteredSortedExpenses = computed<Expenses[]>(() => {
  let result = expenses.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(e => e.description.toLowerCase().includes(q))
  }
  if (selectedCategories.value.length > 0) {
    result = result.filter(e => selectedCategories.value.includes(e.category))
  }
  if (dateFrom.value) {
    const from = dayjs(dateFrom.value).format('YYYY-MM-DD')
    result = result.filter(e => e.expense_date >= from)
  }
  if (dateTo.value) {
    const to = dayjs(dateTo.value).format('YYYY-MM-DD')
    result = result.filter(e => e.expense_date <= to)
  }
  const sorted = [...result]
  switch (sortMode.value) {
    case 'oldest-first': sorted.sort((a, b) => a.expense_date.localeCompare(b.expense_date)); break
    case 'category-asc': sorted.sort((a, b) => a.category.localeCompare(b.category)); break
    case 'amount-high': sorted.sort((a, b) => b.amount - a.amount); break
    case 'amount-low': sorted.sort((a, b) => a.amount - b.amount); break
    default: sorted.sort((a, b) => b.expense_date.localeCompare(a.expense_date) || b.created.localeCompare(a.created))
  }
  return sorted
})
```

### Anti-Patterns to Avoid

- **Debouncing with `@vueuse/core`:** `@vueuse/core` is not installed. Do not add `import { useDebounce } from '@vueuse/core'` without first installing the package (or use a local timeout pattern).
- **Adding `ConfirmDialog` in `ExpensesTab.vue`:** STATE.md invariant — ConfirmDialog lives at `WallecxApp.vue` shell level only. `useConfirm()` broadcasts to that instance.
- **Adding a new Pinia store:** STATE.md invariant — tab state is self-contained in refs within each tab component.
- **Making a new PocketBase query for categories in the toolbar:** D-07 locked — derive unique categories client-side from the already-loaded `expenses` array.
- **Using `getFullList` without `requestKey`:** Will collide with existing request keys. Use `requestKey: 'expenses-getFullList'` exactly.
- **Opening AttachmentPreview without a token:** `receipt` field is `protected=true`. Always call `pb.files.getToken()` first; abort on failure (WR-03 pattern).
- **Using `@request.body.*` in PB rules:** STATE.md notes `@request.body.*` does NOT exist in this PocketBase version — returns 404. (Relevant if any rule changes are needed, which they aren't in this phase.)
- **Direct v-html for delete confirmation message:** Use plain text string interpolation only (STATE.md, VaccinationsTab.vue line 289 comment).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File attachment preview (image/PDF/download) | Custom preview component | `AttachmentPreview.vue` (existing) | Already handles MIME branching, PDF lazy load, error fallback, thumb URL generation |
| Currency formatting | `'₱' + amount.toFixed(2)` | `formatCurrency()` from `src/lib/wallecx/currency.ts` | Uses `Intl.NumberFormat` with correct PHP locale; single source of truth |
| Date display | Manual string manipulation | `dayjs(record.expense_date).format('D MMM YYYY')` | Already installed; type-safe |
| Date range comparison | Custom date parser | `dayjs(dateFrom.value).format('YYYY-MM-DD')` + string compare | `expense_date` is YYYY-MM-DD string — lexicographic comparison is valid and fast |
| Toast notifications | Custom alert/snackbar | `toast.error()` / `toast.success()` from `vue-sonner` | Existing Wallecx toast system |
| Responsive breakpoint detection | `window.innerWidth` check | `useIsMobile()` from `@/composables/useIsMobile` | Already in project; event-listener lifecycle-managed |
| Delete confirmation dialog | Custom modal | `useConfirm()` + `WallecxApp.vue` `ConfirmDialog` | STATE.md invariant — ConfirmDialog at shell level only |

---

## Exact Component State: ExpensesTab.vue Phase 24 Stub

[VERIFIED: codebase read]

**Already exists (do NOT re-add):**
- `expenses ref<Expenses[]>([])` — raw array
- `isLoading ref(false)` — loading flag
- `showManage ref(false)` + `manageRecord ref<Expenses | null>(null)` — manage dialog state
- `confirm = useConfirm()` — confirm service instance
- `openManage(record)` function
- `onCreated(record)` — prepends to `expenses` with `unshift`
- `onUpdated(record)` — splices by id
- `deleteExpense(record)` — full implementation with `confirm.require`, server delete, splice, toasts
- `defineExpose({ deleteExpense })` — already exposed
- `ManageExpense` — already imported and wired in template
- Empty state template with `mdi:cash-multiple` icon and "No expenses yet — add your first one." copy

**Phase 25 must add:**
- `onMounted` with sessionStorage restore + getFullList call
- `sortMode`, `searchQuery`, `selectedCategories`, `dateFrom`, `dateTo` refs
- `filteredSortedExpenses` computed
- `watch(sortMode)` for sessionStorage persistence
- `showPreview`, `previewRecord`, `previewToken` refs
- `openReceiptPreview(record)` function
- Imports: `onMounted`, `computed`, `watch` from vue; `dayjs`; `useIsMobile`; `ExpensesToolbar`; `ExpenseItem`; `AttachmentPreview`
- Template: skeleton rows (isLoading), filter-empty state, list (v-for ExpenseItem), preview Dialog/Drawer

---

## Exact Component APIs Confirmed

### AttachmentPreview.vue Props [VERIFIED: codebase]
```typescript
defineProps<{
  record: RecordModel        // NOT Expenses — uses RecordModel from pocketbase
  attachmentField: string    // pass "receipt"
  attachmentName: string     // pass "Receipt"
  token: string              // short-lived token from pb.files.getToken()
}>()
```

### ExpenseItem.vue — Define at Creation
```typescript
defineProps<{ record: Expenses }>()
defineEmits<{
  edit: [record: Expenses]
  delete: [record: Expenses]
  preview: [record: Expenses]
}>()
```

### Expenses Interface [VERIFIED: src/types/wallecx/expenses/types.d.ts]
```typescript
export interface Expenses extends RecordModel {
  id: string
  created: string       // ISO datetime
  updated: string
  user: string
  amount: number
  expense_date: string  // YYYY-MM-DD
  category: string      // denormalized name
  description: string
  notes?: string
  receipt?: string      // filename — may be empty string or undefined
}
```

### formatCurrency [VERIFIED: src/lib/wallecx/currency.ts]
```typescript
// Returns formatted PHP amount, e.g. "₱1,234.56"
export function formatCurrency(amount: number): string
```

### WallecxToolbar v-model pattern [VERIFIED: WallecxToolbar.vue]
Uses `defineProps` + `defineEmits` (not `defineModel`). ExpensesToolbar should match this pattern.

---

## Common Pitfalls

### Pitfall 1: `@vueuse/core` Not Installed
**What goes wrong:** `import { useDebounce } from '@vueuse/core'` throws a module resolution error at build time.
**Why it happens:** The project uses `@vueuse/motion` (animation library) but NOT `@vueuse/core` (utility library). They are separate packages.
**How to avoid:** Either (a) install `@vueuse/core` via `npm install @vueuse/core` before using `useDebounce`, or (b) implement a local debounce using `watch` + `setTimeout`, or (c) omit debounce entirely (the existing project pattern is no debounce — reactive filtering on every keystroke).
**Warning signs:** TypeScript error "Cannot find module '@vueuse/core'".

### Pitfall 2: `receipt` Field Check — Empty String vs. Undefined
**What goes wrong:** Using `v-if="record.receipt"` may behave unexpectedly. PocketBase returns `""` (empty string) for file fields with no file, not `undefined`. Both `""` and `undefined` are falsy in JS, but code using `record.receipt !== undefined` would incorrectly show the icon for records with `receipt: ""`.
**Why it happens:** The `Expenses` type declares `receipt?: string` but PocketBase sends `""` for empty file fields.
**How to avoid:** Use `v-if="record.receipt"` (falsy check) — this correctly handles both `""` and `undefined`. Do NOT use `record.receipt !== undefined`.
**Warning signs:** Paperclip icon showing on expenses with no receipt.

### Pitfall 3: Category Options Derived Wrongly
**What goes wrong:** Computing category options from `filteredSortedExpenses` instead of the raw `expenses` array. When a category filter is active, options would disappear from the MultiSelect, making it impossible to deselect.
**Why it happens:** Deriving options from the already-filtered list causes a feedback loop.
**How to avoid:** Always derive `categoryOptions` from the raw `expenses.value` ref, not from `filteredSortedExpenses`.

```typescript
// CORRECT [CITED: CONTEXT.md D-07]
const categoryOptions = computed(() =>
  [...new Set(expenses.value.map(e => e.category))].sort()
)
```

### Pitfall 4: Empty-State Condition Overlap
**What goes wrong:** The "no records" empty state and "no filter results" empty state have overlapping conditions if not ordered carefully in the template.
**Why it happens:** Both trigger when the displayed array is empty. If `expenses.length === 0`, `filteredSortedExpenses.length` is also `0`.
**How to avoid:** Use this exact order in template `v-if` chain (matches MembershipsTab pattern):
1. `v-if="isLoading"` → skeleton rows
2. `v-else-if="expenses.length === 0"` → no records empty state
3. `v-else-if="filteredSortedExpenses.length === 0"` → filter-empty state
4. `v-else` → list

### Pitfall 5: useConfirm Import
**What goes wrong:** PrimeVueResolver auto-imports most PrimeVue components but does NOT auto-import composables.
**Why it happens:** Auto-import resolver handles component tags, not `import {...} from 'primevue/...'` statements.
**How to avoid:** `import { useConfirm } from 'primevue/useconfirm'` explicitly — same as existing ExpensesTab.vue line 6 (already correct in the stub).
**Warning signs:** `useConfirm is not a function` runtime error.

### Pitfall 6: DatePicker Returns Date Object
**What goes wrong:** Using `dateFrom.value` directly in a string comparison with `expense_date` (which is a YYYY-MM-DD string).
**Why it happens:** PrimeVue `DatePicker` v-model returns a JavaScript `Date` object, not a string.
**How to avoid:** Always convert with `dayjs(dateFrom.value).format('YYYY-MM-DD')` before comparing with `expense_date`. The CONTEXT.md computed already handles this correctly (D-11).
**Warning signs:** All expenses appear after setting a date filter.

### Pitfall 7: Skeleton Row Height Mismatch
**What goes wrong:** `<Skeleton height="8rem" />` (the MembershipsTab card skeleton height) used instead of `height="3rem"` for the list row skeleton.
**Why it happens:** Copy-paste from MembershipsTab without adjusting for the row vs. card height difference.
**How to avoid:** Use `<Skeleton height="3rem" class="w-full rounded" />` — matches approximate ExpenseItem row height of 48px. [CITED: UI-SPEC interaction contracts]

---

## Code Examples

### Skeleton Loading State (3 rows)
```html
<!-- Source: UI-SPEC interaction contracts [CITED: 25-UI-SPEC.md] -->
<div v-if="isLoading" class="flex flex-col gap-1">
  <Skeleton v-for="i in 3" :key="i" height="3rem" class="w-full rounded" />
</div>
```

### ExpenseItem Row Structure
```html
<!-- Source: CONTEXT.md <specifics> + UI-SPEC Component Inventory [CITED] -->
<div class="flex items-center gap-3 py-3 border-b"
     style="border-color: var(--color-surface-divider)">
  <!-- Amount column: fixed 96px -->
  <div class="w-24 shrink-0 font-bold text-base"
       style="color: var(--color-brand-primary)">
    {{ formatCurrency(record.amount) }}
  </div>
  <!-- Meta + description: flex-1 -->
  <div class="flex-1 min-w-0">
    <div class="text-xs" style="color: var(--color-typo-muted)">
      {{ dayjs(record.expense_date).format('D MMM YYYY') }} · {{ record.category }}
    </div>
    <div class="text-sm truncate" style="color: var(--color-typo-body)">
      {{ record.description }}
    </div>
  </div>
  <!-- Paperclip (conditional on receipt) -->
  <button v-if="record.receipt"
          @click.stop="emit('preview', record)"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="View receipt">
    <iconify-icon icon="mdi:paperclip" width="20" height="20"
                  style="color: var(--color-typo-muted)" aria-hidden="true" />
  </button>
  <!-- Edit -->
  <button @click.stop="emit('edit', record)"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Edit expense">
    <iconify-icon icon="mdi:pencil-outline" width="20" height="20"
                  style="color: var(--color-typo-muted)" aria-hidden="true" />
  </button>
  <!-- Delete -->
  <button @click.stop="emit('delete', record)"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Delete expense">
    <iconify-icon icon="mdi:trash-can-outline" width="20" height="20"
                  style="color: var(--color-status-error)" aria-hidden="true" />
  </button>
</div>
```

### ExpensesToolbar Layout
```html
<!-- Source: UI-SPEC Component Inventory [CITED: 25-UI-SPEC.md] -->
<!-- Two rows always visible (stacked layout) -->
<div class="flex flex-col gap-2 mb-4">
  <!-- Row 1: Search + Sort -->
  <div class="flex items-center gap-2">
    <IconField class="flex-1">
      <InputIcon class="pi pi-search" />
      <InputText
        :value="searchQuery"
        placeholder="Search by description…"
        class="w-full"
        @input="handleSearchInput"
      />
      <InputIcon v-if="searchQuery" class="pi pi-times cursor-pointer"
        role="button" tabindex="0" aria-label="Clear search"
        @click="emit('update:searchQuery', '')" />
    </IconField>
    <Select
      :model-value="sortMode"
      :options="sortOptions"
      option-label="label"
      option-value="value"
      class="w-36 min-h-[44px]"
      @update:model-value="emit('update:sortMode', $event)"
    />
  </div>
  <!-- Row 2: Category filter + Date range -->
  <div class="flex items-center gap-2">
    <MultiSelect
      :model-value="selectedCategories"
      :options="categoryOptions"
      placeholder="All categories"
      class="flex-1 min-h-[44px]"
      display="chip"
      @update:model-value="emit('update:selectedCategories', $event)"
    />
    <DatePicker
      :model-value="dateFrom"
      placeholder="From date"
      dateFormat="dd M yy"
      class="min-h-[44px]"
      showButtonBar
      @update:model-value="emit('update:dateFrom', $event)"
    />
    <DatePicker
      :model-value="dateTo"
      placeholder="To date"
      dateFormat="dd M yy"
      class="min-h-[44px]"
      showButtonBar
      @update:model-value="emit('update:dateTo', $event)"
    />
  </div>
</div>
```

### Category Options Computed (in ExpensesTab)
```typescript
// CORRECT: from raw expenses, not from filteredSortedExpenses
const categoryOptions = computed<string[]>(() =>
  [...new Set(expenses.value.map(e => e.category))].sort()
)
```

### Clear Filters Handler
```typescript
function clearFilters(): void {
  searchQuery.value = ''
  selectedCategories.value = []
  dateFrom.value = null
  dateTo.value = null
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `request.data.*` in PB rules | `@request.body.*` doesn't exist; use `@request.auth.id` and `@request.data.*` cautiously | Phase 23 research | No PB rule changes needed in Phase 25 |
| `@vueuse/core` for utilities | `@vueuse/motion` only for animations; utilities are project-local | Project inception | Must use local patterns for debounce |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PrimeVue MultiSelect `display="chip"` prop is valid in PrimeVue 4 Aura | Standard Stack | MultiSelect may render differently; visual regression only |
| A2 | PrimeVue DatePicker `showButtonBar` prop exists in PrimeVue 4 (provides Today/Clear buttons) | Code Examples | Clear button unavailable in DatePicker; user must manually clear; UX-only impact |
| A3 | Dark mode scoped CSS selectors `.my-app-dark .p-multiselect` and `.my-app-dark .p-datepicker` are sufficient for full dark-mode coverage | Architecture Patterns | Some inner elements (dropdown overlay, calendar popover) may remain light-themed; visual regression only |

---

## Open Questions

1. **Debounce approach**
   - What we know: `@vueuse/core` is not installed; D-09 says use `useDebounce` from it; existing tabs have no debounce.
   - What's unclear: Whether the planner should install `@vueuse/core` or use a local pattern.
   - Recommendation: If debounce is desired, add a Wave 0 task to `npm install @vueuse/core`. If not, omit debounce and filter reactively (matches existing MembershipsTab/VaccinationsTab behavior).

2. **ExpensesToolbar two-row vs. wrap layout on mobile**
   - What we know: UI-SPEC specifies always-visible two rows. CONTEXT.md marks the exact stacking behavior as Claude's Discretion.
   - What's unclear: Whether the second row (category + dates) should allow horizontal scroll or force stacking.
   - Recommendation: Use `flex-wrap` on Row 2 or make DatePickers narrower (`w-28`) to avoid horizontal overflow on 320px-wide viewports.

3. **`onCreated` sort order after insert**
   - What we know: `onCreated` currently calls `expenses.value.unshift(record)` (prepend). With default sort `newest-first`, prepend is correct for a just-created expense (today's date). But if the user creates an expense with a past date, `unshift` leaves it at the top, which `filteredSortedExpenses` will then re-sort correctly.
   - What's unclear: Whether a re-sort of the raw `expenses` array after create (like VaccinationsTab does) is needed.
   - Recommendation: No change needed — `filteredSortedExpenses` computed re-sorts on every access, so the order of the raw `expenses` array only matters for the default sort display, and the computed handles it. `unshift` is fine.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is a pure Vue/TypeScript code change. No external CLI tools, runtimes, or services beyond the project's already-running Node.js and PocketBase are required.

---

## Security Domain

This phase adds read-path UI only. No new PocketBase collections, rules, or API calls beyond a read-only `getFullList` and `files.getToken()`.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing route guard (no change) |
| V3 Session Management | no | No session changes |
| V4 Access Control | partial | PB server-side rule `@request.auth.id = user.id` already enforced on collection; file token required before preview (D-14, WR-03 pattern) |
| V5 Input Validation | yes (search/filter) | Client-side filtering only; inputs never sent to server; no injection risk |
| V6 Cryptography | no | File token handled by PocketBase SDK |

No new security controls required in Phase 25.

---

## Sources

### Primary (HIGH confidence)
- `src/components/projects/wallecx/MembershipsTab.vue` [VERIFIED: codebase] — sessionStorage, onMounted load, token fetch, delete pattern
- `src/components/projects/wallecx/VaccinationsTab.vue` [VERIFIED: codebase] — no debounce confirmed, reactive search pattern
- `src/components/projects/wallecx/WallecxToolbar.vue` [VERIFIED: codebase] — exact v-model prop API
- `src/components/projects/wallecx/AttachmentPreview.vue` [VERIFIED: codebase] — exact props interface
- `src/components/projects/wallecx/ExpensesTab.vue` [VERIFIED: codebase] — Phase 24 stub exact state
- `src/components/projects/wallecx/ManageExpense.vue` [VERIFIED: codebase] — dark mode scoped CSS pattern, DatePicker usage
- `src/types/wallecx/expenses/types.d.ts` [VERIFIED: codebase] — Expenses interface
- `src/lib/wallecx/currency.ts` [VERIFIED: codebase] — formatCurrency signature
- `src/assets/base.css` [VERIFIED: codebase] — all CSS variable values (light + dark)
- `src/assets/wallecx-overrides.css` [VERIFIED: codebase] — non-scoped override file scope
- `package.json` [VERIFIED: codebase] — confirms `@vueuse/core` absent, `@vueuse/motion` present
- `.planning/phases/25-read-path-list-view/25-CONTEXT.md` [CITED] — 18 locked decisions
- `.planning/phases/25-read-path-list-view/25-UI-SPEC.md` [CITED] — component inventory, interaction contracts, copywriting

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` [CITED] — architectural invariants (ConfirmDialog, requestKey, no new Pinia store, receipt protected=true)
- `.planning/REQUIREMENTS.md` [CITED] — EXP-07 through EXP-10 requirement descriptions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via package.json; critical absence of @vueuse/core confirmed
- Architecture: HIGH — all patterns extracted directly from existing codebase files
- Pitfalls: HIGH — confirmed from live code, not assumptions
- Dark mode: HIGH — CSS variable values verified from base.css; override pattern verified from ManageExpense.vue

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (stable dependencies; 30-day window)
