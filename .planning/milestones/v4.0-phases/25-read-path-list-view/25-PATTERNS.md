# Phase 25: Read Path — List View - Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 3 (2 new, 1 modify)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/projects/wallecx/ExpensesTab.vue` | component (tab host) | CRUD + request-response | `src/components/projects/wallecx/MembershipsTab.vue` | exact |
| `src/components/projects/wallecx/ExpensesToolbar.vue` | component (toolbar) | request-response | `src/components/projects/wallecx/WallecxToolbar.vue` | role-match (extend) |
| `src/components/projects/wallecx/ExpenseItem.vue` | component (list row) | request-response | `src/components/projects/wallecx/MembershipsTab.vue` template grid item | role-match |

---

## Pattern Assignments

### `src/components/projects/wallecx/ExpensesTab.vue` (component, CRUD + request-response)

**Analog:** `src/components/projects/wallecx/MembershipsTab.vue`
**Modification type:** Extend existing Phase 24 stub — do NOT replace existing code; ADD the missing pieces listed in RESEARCH.md §Exact Component State.

**Imports pattern** (MembershipsTab.vue lines 1–11):
```typescript
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Expenses } from '@/types/wallecx/expenses/types'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import { useIsMobile } from '@/composables/useIsMobile'
import dayjs from 'dayjs'
import ExpensesToolbar from './ExpensesToolbar.vue'
import ExpenseItem from './ExpenseItem.vue'
import AttachmentPreview from './AttachmentPreview.vue'
// ManageExpense already imported in Phase 24 stub — do not re-add
```

**sessionStorage sort persistence pattern** (MembershipsTab.vue lines 23–80):
```typescript
const SORT_STORAGE_KEY = 'wallecx:expense-sort'
const VALID_SORT_MODES = ['newest-first', 'oldest-first', 'category-asc', 'amount-high', 'amount-low']
const sortMode = ref<string>('newest-first')

watch(sortMode, (next) => {
  try {
    sessionStorage.setItem(SORT_STORAGE_KEY, next)
  } catch {
    // sessionStorage write failures are non-fatal
  }
})
```

**onMounted load pattern** (MembershipsTab.vue lines 82–106 — adapted for expenses):
```typescript
onMounted(async () => {
  // Restore sort mode BEFORE loading data (so first render uses correct sort)
  try {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY)
    if (stored && VALID_SORT_MODES.includes(stored)) sortMode.value = stored
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default silently
  }
  isLoading.value = true
  try {
    expenses.value = await pb
      .collection('wallecx_expenses')
      .getFullList<Expenses>({
        sort: '-expense_date,-created',
        requestKey: 'expenses-getFullList',  // STATE.md: distinct per-collection key
      })
  } catch (e: unknown) {
    toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
```

**filteredSortedExpenses computed** (CONTEXT.md specifics — verbatim):
```typescript
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
  // 3. date range — dayjs converts Date object → YYYY-MM-DD string for comparison
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
    case 'amount-high':  sorted.sort((a, b) => b.amount - a.amount); break
    case 'amount-low':   sorted.sort((a, b) => a.amount - b.amount); break
    default: sorted.sort((a, b) =>
      b.expense_date.localeCompare(a.expense_date) || b.created.localeCompare(a.created)
    )
  }
  return sorted
})
```

**categoryOptions computed** (derived from raw array, NOT from filteredSortedExpenses — RESEARCH.md Pitfall 3):
```typescript
// CORRECT: use expenses.value (raw), not filteredSortedExpenses
const categoryOptions = computed<string[]>(() =>
  [...new Set(expenses.value.map(e => e.category))].sort()
)
```

**File token fetch + receipt preview pattern** (MembershipsTab.vue lines 109–122):
```typescript
const showPreview = ref(false)
const previewRecord = ref<Expenses | null>(null)
const previewToken = ref<string>('')

async function openReceiptPreview(record: Expenses): Promise<void> {
  try {
    previewToken.value = await pb.files.getToken()
  } catch (e: unknown) {
    toast.error('Failed to load receipt. Refresh to try again.')
    console.error('ExpensesTab: getToken failed', e)
    return  // WR-03: never open preview without a token
  }
  previewRecord.value = record
  showPreview.value = true
}
```

**Template: v-if chain order** (MembershipsTab.vue template — correct ordering avoids Pitfall 4):
```html
<!-- Loading: 3 skeleton rows (NOT card skeletons — use 3rem height for list rows) -->
<div v-if="isLoading" class="flex flex-col gap-1">
  <Skeleton v-for="i in 3" :key="i" height="3rem" class="w-full rounded" />
</div>

<!-- Empty state: no records at all (existing Phase 24 stub template, keep as-is) -->
<div v-else-if="expenses.length === 0" class="flex flex-col items-center py-12 gap-3">
  <!-- existing icon + copy from stub -->
</div>

<!-- Empty state: filter/search produced zero results (EXP-08 / EXP-09) -->
<div v-else-if="filteredSortedExpenses.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:filter-remove-outline" width="48" height="48"
    style="color: var(--color-brand-primary)" aria-hidden="true" />
  <p class="text-sm" style="color: var(--color-typo-heading)">
    No expenses match your filters.
  </p>
  <Button label="Clear filters" severity="secondary" size="small" @click="clearFilters" />
</div>

<!-- Data state: list of expense rows -->
<div v-else>
  <ExpenseItem
    v-for="record in filteredSortedExpenses"
    :key="record.id"
    :record="record"
    @edit="openManage(record)"
    @delete="deleteExpense(record)"
    @preview="openReceiptPreview(record)"
  />
</div>
```

**Template: AttachmentPreview wrapper** (MembershipsTab.vue lines 263–304 pattern):
```html
<!-- Desktop: Dialog -->
<Dialog
  v-if="!isMobile"
  v-model:visible="showPreview"
  modal
  header="Receipt"
  :style="{ width: '40rem' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  @hide="previewRecord = null; previewToken = ''"
>
  <AttachmentPreview
    v-if="previewRecord"
    :record="previewRecord"
    attachment-field="receipt"
    attachment-name="Receipt"
    :token="previewToken"
  />
</Dialog>

<!-- Mobile: bottom Drawer -->
<Drawer
  v-else
  v-model:visible="showPreview"
  position="bottom"
  @hide="previewRecord = null; previewToken = ''"
>
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
      <span class="font-semibold">Receipt</span>
    </div>
  </template>
  <AttachmentPreview
    v-if="previewRecord"
    :record="previewRecord"
    attachment-field="receipt"
    attachment-name="Receipt"
    :token="previewToken"
  />
</Drawer>
```

**clearFilters helper** (RESEARCH.md Code Examples):
```typescript
function clearFilters(): void {
  searchQuery.value = ''
  selectedCategories.value = []
  dateFrom.value = null
  dateTo.value = null
}
```

---

### `src/components/projects/wallecx/ExpensesToolbar.vue` (component, request-response)

**Analog:** `src/components/projects/wallecx/WallecxToolbar.vue`
**Modification type:** New file — copy WallecxToolbar's prop/emit pattern, then extend with MultiSelect and two DatePickers.

**Props and emits pattern** (WallecxToolbar.vue lines 1–19 — adapted):
```typescript
// WallecxToolbar uses defineProps + withDefaults + defineEmits (NOT defineModel)
// ExpensesToolbar must follow the identical pattern for consistency
defineProps<{
  searchQuery: string
  sortMode: string
  sortOptions: { value: string; label: string }[]
  selectedCategories: string[]
  categoryOptions: string[]
  dateFrom: Date | null
  dateTo: Date | null
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:sortMode': [value: string]
  'update:selectedCategories': [value: string[]]
  'update:dateFrom': [value: Date | null]
  'update:dateTo': [value: Date | null]
}>()
```

**Search input pattern** (WallecxToolbar.vue lines 24–41 — copy exactly, change only placeholder text):
```html
<IconField class="flex-1">
  <InputIcon class="pi pi-search" />
  <InputText
    :value="searchQuery"
    placeholder="Search by description…"
    class="w-full"
    @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
  />
  <InputIcon
    v-if="searchQuery"
    class="pi pi-times cursor-pointer"
    role="button"
    tabindex="0"
    aria-label="Clear search"
    @click="emit('update:searchQuery', '')"
    @keydown.enter="emit('update:searchQuery', '')"
    @keydown.space.prevent="emit('update:searchQuery', '')"
  />
</IconField>
```

**Sort Select pattern** (WallecxToolbar.vue lines 43–50 — copy exactly):
```html
<Select
  :model-value="sortMode"
  :options="sortOptions"
  option-label="label"
  option-value="value"
  class="w-36 min-h-[44px]"
  @update:model-value="emit('update:sortMode', $event)"
/>
```

**Full toolbar layout — two rows** (RESEARCH.md Code Examples):
```html
<template>
  <div class="flex flex-col gap-2 mb-4">
    <!-- Row 1: Search + Sort (mirrors WallecxToolbar single row) -->
    <div class="flex items-center gap-2">
      <!-- [search IconField as above] -->
      <!-- [sort Select as above] -->
    </div>
    <!-- Row 2: Category filter + Date range -->
    <div class="flex items-center gap-2 flex-wrap">
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
        placeholder="From"
        dateFormat="dd M yy"
        class="w-32 min-h-[44px]"
        showButtonBar
        @update:model-value="emit('update:dateFrom', $event)"
      />
      <DatePicker
        :model-value="dateTo"
        placeholder="To"
        dateFormat="dd M yy"
        class="w-32 min-h-[44px]"
        showButtonBar
        @update:model-value="emit('update:dateTo', $event)"
      />
    </div>
  </div>
</template>
```

**Dark mode scoped CSS** (ManageExpense.vue lines 527–538 pattern — adapted for toolbar inputs):
```css
<style scoped>
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
</style>
```

**Note on debounce:** Do NOT use `@vueuse/core` (`useDebounce`) — it is not installed. The existing project pattern (WallecxToolbar, MembershipsTab, VaccinationsTab) does NOT debounce search — it filters reactively on every keystroke. Follow this same no-debounce pattern for Phase 25. If debounce is specifically required in a later phase, add `@vueuse/core` as a Wave 0 dependency task.

---

### `src/components/projects/wallecx/ExpenseItem.vue` (component, request-response)

**Analog:** `src/components/projects/wallecx/MembershipsTab.vue` (row/card action emit pattern) + CONTEXT.md specifics
**Modification type:** New file — no existing list-row component to copy from directly; use CONTEXT.md layout spec + MembershipsTab action patterns.

**Props and emits** (RESEARCH.md §Exact Component APIs Confirmed):
```typescript
import type { Expenses } from '@/types/wallecx/expenses/types'
import { formatCurrency } from '@/lib/wallecx/currency'
import dayjs from 'dayjs'

defineProps<{ record: Expenses }>()

const emit = defineEmits<{
  edit:    [record: Expenses]
  delete:  [record: Expenses]
  preview: [record: Expenses]
}>()
```

**Row layout** (CONTEXT.md specifics + RESEARCH.md Code Examples — verbatim):
```html
<template>
  <div
    class="flex items-center gap-3 py-3 border-b"
    style="border-color: var(--color-surface-divider)"
  >
    <!-- Amount: fixed 96px, bold, brand colour -->
    <div class="w-24 shrink-0 font-bold text-base"
         style="color: var(--color-brand-primary)">
      {{ formatCurrency(record.amount) }}
    </div>

    <!-- Meta + description: fills remaining space -->
    <div class="flex-1 min-w-0">
      <div class="text-xs" style="color: var(--color-typo-muted)">
        {{ dayjs(record.expense_date).format('D MMM YYYY') }} · {{ record.category }}
      </div>
      <div class="text-sm truncate" style="color: var(--color-typo-body)">
        {{ record.description }}
      </div>
    </div>

    <!-- Paperclip icon — only when receipt is present (falsy check handles "" and undefined) -->
    <button
      v-if="record.receipt"
      @click.stop="emit('preview', record)"
      class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
      aria-label="View receipt"
    >
      <iconify-icon icon="mdi:paperclip" width="20" height="20"
        style="color: var(--color-typo-muted)" aria-hidden="true" />
    </button>

    <!-- Edit button -->
    <button
      @click.stop="emit('edit', record)"
      class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
      aria-label="Edit expense"
    >
      <iconify-icon icon="mdi:pencil-outline" width="20" height="20"
        style="color: var(--color-typo-muted)" aria-hidden="true" />
    </button>

    <!-- Delete button -->
    <button
      @click.stop="emit('delete', record)"
      class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
      aria-label="Delete expense"
    >
      <iconify-icon icon="mdi:trash-can-outline" width="20" height="20"
        style="color: var(--color-status-error)" aria-hidden="true" />
    </button>
  </div>
</template>
```

**Dark mode scoped CSS** (same override pattern as ManageExpense.vue — component has no PrimeVue inputs, so only row container needs attention):
```css
<style scoped>
/* No PrimeVue form components in ExpenseItem — all styling via CSS variables.
   CSS variables (--color-*) auto-switch via .my-app-dark on <html>.
   No :deep overrides required for this component. */
</style>
```

**Key constraint:** `touch-manipulation` class on all three action buttons — matches WallecxToolbar.vue line 55 pattern for 44px touch targets (Phase 15 pattern).

---

## Shared Patterns

### Authentication / Auth Guard
**Source:** `src/router/index.ts` `beforeEach` guard (unchanged — ExpensesTab is inside `/projects/lextrack` which already requires auth)
**Apply to:** No changes needed — ExpensesTab is already behind the auth guard via WallecxApp route.

### Error Handling (data load failures)
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` lines 92–106
**Apply to:** `ExpensesTab.vue` onMounted load block
```typescript
} catch (e: unknown) {
  toast.error('Failed to load expenses. Pull to refresh or reload the page.')
  console.error('ExpensesTab: getFullList failed', e)
} finally {
  isLoading.value = false  // always reset, even on error
}
```

### Error Handling (file token failures — WR-03 pattern)
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` lines 109–122
**Apply to:** `ExpensesTab.vue` `openReceiptPreview` function
```typescript
} catch (e: unknown) {
  toast.error('Failed to load receipt. Refresh to try again.')
  console.error('ExpensesTab: getToken failed', e)
  return  // WR-03: abort — never open preview without a token when attachment is protected=true
}
```

### CSS Variables (dark mode auto-switching)
**Source:** `src/assets/base.css` (global — defines `--color-brand-primary`, `--color-typo-body`, `--color-typo-muted`, `--color-typo-heading`, `--color-surface-card`, `--color-surface-divider`, `--color-status-error`)
**Apply to:** All inline `style=` attributes in `ExpenseItem.vue` and `ExpensesTab.vue`
These variables switch automatically when `.my-app-dark` is on `<html>` — no component-level override needed for raw CSS variable references on divs and spans.

### PrimeVue Component Dark Mode Overrides
**Source:** `src/components/projects/wallecx/ManageExpense.vue` lines 527–538 (Dialog/Drawer overrides)
**Apply to:** `ExpensesToolbar.vue` scoped styles for `p-inputtext`, `p-select`, `p-multiselect`, `p-datepicker`
**Note:** `wallecx-overrides.css` (imported from `WallecxApp.vue`) covers `.p-dialog`, `.p-drawer`, and `.p-card` globally. Component-specific form input overrides go in each component's own `<style scoped>` block.

### Delete Confirmation (useConfirm pattern)
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` lines 135–157
**Apply to:** `ExpensesTab.vue` `deleteExpense` function (already implemented in Phase 24 stub — do NOT re-implement)
**Key rule:** `useConfirm` must be imported explicitly: `import { useConfirm } from 'primevue/useconfirm'` — already correct in stub line 6.

### 44px Touch Targets
**Source:** `src/components/projects/wallecx/WallecxToolbar.vue` line 55 (`min-h-[44px] min-w-[44px] touch-manipulation`)
**Apply to:** All `<button>` elements in `ExpenseItem.vue`, all interactive controls in `ExpensesToolbar.vue`

---

## No Analog Found

No files in this phase lack a codebase analog. All three files have strong matches.

---

## Critical Anti-Patterns (from RESEARCH.md)

These patterns exist elsewhere in the codebase but MUST NOT be applied here:

| Anti-Pattern | Wrong Source | Why Forbidden |
|---|---|---|
| `import { useDebounce } from '@vueuse/core'` | Mentioned in CONTEXT.md D-09 | `@vueuse/core` NOT installed; use reactive filtering (no debounce) matching MembershipsTab/VaccinationsTab |
| `<ConfirmDialog />` in ExpensesTab template | Other apps | STATE.md invariant: ConfirmDialog at WallecxApp.vue shell level only |
| `new Pinia store` | LexTrack pattern | STATE.md invariant: tab state self-contained in component refs |
| `v-if="record.receipt !== undefined"` | TypeScript instinct | PocketBase returns `""` for empty file fields; use `v-if="record.receipt"` (falsy check) |
| `categoryOptions` derived from `filteredSortedExpenses` | Natural instinct | Causes feedback loop — always derive from raw `expenses.value` |
| `requestKey` omitted from getFullList | shorthand shortcut | Will collide; use `requestKey: 'expenses-getFullList'` exactly (STATE.md) |
| `<Skeleton height="8rem" />` for list row | Copy from MembershipsTab card skeleton | Wrong height for a list row; use `height="3rem"` |

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`
**Files read:** MembershipsTab.vue (316 lines), WallecxToolbar.vue (69 lines), VaccinationsTab.vue (473 lines), ExpensesTab.vue (99 lines — Phase 24 stub), ManageExpense.vue (lines 510–538), AttachmentPreview.vue (lines 1–18), wallecx-overrides.css (57 lines)
**Pattern extraction date:** 2026-05-21
