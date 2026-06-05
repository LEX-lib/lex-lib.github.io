# Phase 25: Read Path — List View - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Populate `ExpensesTab.vue` with a live expense list loaded from PocketBase on mount. The list is sortable (date / category / amount), filterable by category (multi-select) and date range (start + end), and searchable by description text. Rows with a receipt show a paperclip/image icon that opens `AttachmentPreview` directly. Inline edit/delete actions appear on every row.

**In scope:** EXP-07 (sortable list, sessionStorage sort), EXP-08 (category + date range filters), EXP-09 (description search), EXP-10 (receipt preview via AttachmentPreview icon tap).

**Out of scope:** Period-tabbed reporting view, grand total, per-category charts (Phase 26). Custom category management screen. Any new PocketBase queries beyond the initial `getFullList` on mount.

</domain>

<decisions>
## Implementation Decisions

### Expense Row Layout (EXP-07)
- **D-01:** Each expense renders as a **compact list row** — not a card, not a DataTable. Layout: amount (bold, primary colour, left) | date + category (secondary text, below amount) | description (truncated, secondary text, middle) | action icons (right). New `ExpenseItem.vue` component in `src/components/projects/wallecx/`.
- **D-02:** **Inline icon buttons** for edit and delete on the right side of every row. Pencil icon opens `ManageExpense.vue` (passes the existing record). Trash icon triggers `deleteExpense` via `useConfirm` at `WallecxApp.vue` shell level (STATE.md ConfirmDialog invariant). Both icons must meet the 44px touch target requirement (Phase 15 pattern).
- **D-03:** Sort mode persists in `sessionStorage` under key `wallecx:expense-sort` (locked in EXP-07). Default sort: newest-first (`-expense_date`, then `-created` as tiebreaker).
- **D-04:** Sort options: `newest-first` (default), `oldest-first`, `category-asc` (A–Z), `amount-high` (highest first), `amount-low` (lowest first).

### Filter Toolbar (EXP-08 / EXP-09)
- **D-05:** New **`ExpensesToolbar.vue`** component (`src/components/projects/wallecx/ExpensesToolbar.vue`). Does NOT modify `WallecxToolbar.vue` — Vaccinations and Memberships continue to use it unmodified.
- **D-06:** `ExpensesToolbar.vue` v-model bindings (all parent-owned refs, passed as v-model props):
  - `v-model:search-query` — debounced description text search
  - `v-model:sort-mode` — sort select (same pattern as WallecxToolbar)
  - `v-model:selected-categories` — `string[]` of selected category names (empty = show all)
  - `v-model:date-from` — `Date | null`
  - `v-model:date-to` — `Date | null`
- **D-07:** Category filter uses PrimeVue **`MultiSelect`** component. Options are derived from the loaded `expenses` array (unique categories extracted client-side from already-loaded records — no new PocketBase query). Displays as chips/tags. Clearing selection shows all expenses.
- **D-08:** Date range uses **two PrimeVue `DatePicker` inputs** always visible in the toolbar row — a "From" picker and a "To" picker. Clearing either input removes that bound (open-ended range). No quick presets in Phase 25 (deferred to future polish).
- **D-09:** Description search is **debounced** using `useDebounce` from `@vueuse/core` (already a project dep). Debounce delay: 300ms. Mirrors `WallecxToolbar` search UX.

### Filtering & Sorting Logic (in ExpensesTab)
- **D-10:** All filtering and sorting is a single **`filteredSortedExpenses` computed** in `ExpensesTab.vue`, applied in this order: (1) description search, (2) category filter, (3) date range, (4) sort. No new PocketBase queries — client-side only on the already-loaded `expenses` array.
- **D-11:** Date range comparison uses `dayjs` (already installed). `expense_date` is a `YYYY-MM-DD` string; compare as string or parse with `dayjs(record.expense_date)`. From date is inclusive (`>=`), To date is inclusive (`<=`).
- **D-12:** Empty state when filters produce zero results: "No expenses match your filters." + "Clear filters" button that resets search, categories, and dates. Distinct from the no-records-at-all empty state.

### Receipt Preview (EXP-10)
- **D-13:** Rows with a `receipt` field (non-empty string) display a **paperclip icon** (`mdi:paperclip` or `pi pi-paperclip`) on the row, between description and action buttons.
- **D-14:** Tapping the paperclip icon triggers a `openReceiptPreview(record)` handler that:
  1. Fetches `pb.files.getToken()` (same as `MembershipsTab.openDetail` pattern)
  2. Sets `previewRecord.value` and `previewToken.value`
  3. Opens `AttachmentPreview` with the token
  Token fetch failure shows a toast ("Failed to load receipt. Refresh to try again.") and does NOT open the preview (mirrors MembershipsTab WR-03 pattern).
- **D-15:** `AttachmentPreview` is wired to expenses via a dedicated `showPreview` ref + `previewRecord` + `previewToken` in `ExpensesTab`. No new component needed — `AttachmentPreview` already handles image/PDF/download branching.

### PocketBase Load
- **D-16:** `onMounted` in `ExpensesTab.vue` calls `pb.collection('wallecx_expenses').getFullList<Expenses>({ sort: '-expense_date,-created', requestKey: 'expenses-getFullList' })`. Sets `isLoading` flag before/after (existing Phase 24 stub already has the `isLoading` ref).
- **D-17:** Loading state: 3 skeleton rows (matching `ExpenseItem` row height) — mirrors `MembershipsTab` skeleton card pattern.

### Dark Mode
- **D-18:** `ExpenseItem.vue` and `ExpensesToolbar.vue` follow the scoped CSS variable override pattern (Phase 18 + Phase 22). Target `.my-app-dark` prefixed selectors. No new packages.

### Claude's Discretion
- Exact layout proportions within the compact row (flex weights, truncation length for description)
- Whether to show a running total line at the bottom of the filtered list (nice-to-have; not required by EXP-07–10)
- Whether `ExpensesToolbar.vue` stacks to two rows on mobile or stays single-row with horizontal scroll
- Exact empty-state icon choice for the no-filter-results state
- Whether sort mode is also persisted when category/date filters are active (session storage key stores sort only, per EXP-07)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §EXP-07, EXP-08, EXP-09, EXP-10
- `.planning/ROADMAP.md` §Phase 25 — Goal, SC 1–6

### Project State (locked invariants)
- `.planning/STATE.md` §Architectural Invariants — requestKey per collection (`expenses-getFullList`); ConfirmDialog at shell level only; no new Pinia store; tab state self-contained; server-side per-user isolation
- `.planning/STATE.md` §v4.0 Expense Tracker Foundation — Phase 23 locked decisions (requestKey names, receipt field protected=true → file token required)

### Prior Phase Context
- `.planning/phases/24-write-path-tab-shell-crud/24-CONTEXT.md` — ManageExpense.vue interface, emit events (`created`, `updated`), `deleteExpense` exposed via `defineExpose`
- `.planning/phases/23-backend-type-foundation/23-CONTEXT.md` — Expenses type shape, requestKey names, receipt field, expenseSchema

### Pattern Files to Mirror
- `src/components/projects/wallecx/MembershipsTab.vue` — onMounted load pattern, filteredSorted computed, sessionStorage sort persistence, skeleton loading, empty state, file token fetch before preview, delete via useConfirm
- `src/components/projects/wallecx/WallecxToolbar.vue` — v-model search/sort prop pattern (ExpensesToolbar replicates this shape + adds category + date range)
- `src/components/projects/wallecx/AttachmentPreview.vue` — existing preview component; accept token + record props

### Existing Types and Source Files
- `src/types/wallecx/expenses/types.d.ts` — `Expenses` interface (fields: id, user, amount, expense_date, category, description, notes, receipt, created, updated)
- `src/lib/wallecx/currency.ts` — `formatCurrency()` for displaying amount in the row

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MembershipsTab.vue` — closest analog for `ExpensesTab`; mirrors the full onMounted → computed → render pattern
- `WallecxToolbar.vue` — shape reference for `ExpensesToolbar.vue` (v-model prop pattern, search debounce approach)
- `AttachmentPreview.vue` — drop-in for receipt preview; already handles MIME branching (image / PDF / download)
- `useIsMobile()` at `src/composables/useIsMobile.ts` — available if `ExpensesToolbar` needs responsive layout
- `formatCurrency()` from `src/lib/wallecx/currency.ts` — already formats PHP amounts

### Established Patterns
- `onMounted` → `isLoading = true` → `getFullList` → `isLoading = false` in finally (MembershipsTab lines 82–106)
- `sessionStorage` sort persistence with `validModes` whitelist (MembershipsTab lines 23–80)
- File token fetch before opening attachment (MembershipsTab `openDetail` function)
- `displayedMemberships` computed pattern — the `filteredSortedExpenses` computed mirrors this exactly
- Skeleton loading: 3 `<Card>` + `<Skeleton>` tiles while `isLoading` is true
- `useConfirm` must be imported explicitly from `primevue/useconfirm` (NOT auto-resolved)
- `defineExpose({ deleteExpense })` already exists on `ExpensesTab.vue` — Phase 25 calls it from row actions via a ref to the component

### Integration Points
- `ExpensesTab.vue` — Phase 24 stub; Phase 25 replaces the empty-state-only template with the full list
- `WallecxApp.vue` — no changes needed (ConfirmDialog already at shell level)
- `ManageExpense.vue` — called from row edit button (passes existing record via `manageRecord` + `showManage`)

</code_context>

<specifics>
## Specific Ideas

### ExpenseItem.vue row layout (approximate)
```html
<div class="flex items-center gap-3 py-3 border-b">
  <!-- Left: amount -->
  <div class="font-bold text-base w-24 shrink-0" style="color: var(--color-brand-primary)">
    {{ formatCurrency(record.amount) }}
  </div>
  <!-- Middle: date + category + description -->
  <div class="flex-1 min-w-0">
    <div class="text-xs" style="color: var(--color-typo-muted)">
      {{ dayjs(record.expense_date).format('D MMM YYYY') }} · {{ record.category }}
    </div>
    <div class="text-sm truncate" style="color: var(--color-typo-body)">
      {{ record.description }}
    </div>
  </div>
  <!-- Receipt icon (if has receipt) -->
  <button v-if="record.receipt" @click.stop="emit('preview', record)" class="min-w-[44px] min-h-[44px] ...">
    <iconify-icon icon="mdi:paperclip" ... />
  </button>
  <!-- Edit button -->
  <button @click.stop="emit('edit', record)" class="min-w-[44px] min-h-[44px] ...">
    <iconify-icon icon="mdi:pencil-outline" ... />
  </button>
  <!-- Delete button -->
  <button @click.stop="emit('delete', record)" class="min-w-[44px] min-h-[44px] ...">
    <iconify-icon icon="mdi:trash-can-outline" ... />
  </button>
</div>
```

### ExpensesTab computed pattern
```ts
const filteredSortedExpenses = computed<Expenses[]>(() => {
  let result = expenses.value
  // 1. description search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(e => e.description.toLowerCase().includes(q))
  }
  // 2. category filter
  if (selectedCategories.value.length > 0) {
    result = result.filter(e => selectedCategories.value.includes(e.category))
  }
  // 3. date range
  if (dateFrom.value) {
    const from = dayjs(dateFrom.value).format('YYYY-MM-DD')
    result = result.filter(e => e.expense_date >= from)
  }
  if (dateTo.value) {
    const to = dayjs(dateTo.value).format('YYYY-MM-DD')
    result = result.filter(e => e.expense_date <= to)
  }
  // 4. sort
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

</specifics>

<deferred>
## Deferred Ideas

- **Quick-preset date filters** (Today / This week / This month) — Phase 25 uses always-visible DatePickers; presets could be a future polish
- **Running total at bottom of list** — sum of currently filtered expenses; nice-to-have, not in EXP-07–10
- **Period-tabbed reporting view** — Phase 26 scope (EXP-11, EXP-12, EXP-13)
- **ExpenseDetail panel** — no intermediate detail panel in Phase 25; edit/delete are inline row actions, receipt opens directly via AttachmentPreview

</deferred>

---

*Phase: 25-read-path-list-view*
*Context gathered: 2026-05-21*
