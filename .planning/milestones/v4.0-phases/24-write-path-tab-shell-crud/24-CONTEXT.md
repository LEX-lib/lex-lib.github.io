# Phase 24: Write Path — Tab Shell + CRUD - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a third "Expenses" tab to `WallecxApp.vue` after Memberships; implement `ManageExpense.vue` as the CRUD dialog for creating, editing, and deleting expense records; wire custom category creation from within the manage flow. `ExpensesTab.vue` in Phase 24 shows only an empty state + "Add Expense" button — the full sortable/filterable list is Phase 25 scope.

**In scope:** EXP-04 (third Expenses tab), EXP-05 (ManageExpense CRUD dialog), EXP-06 (add custom category from within manage flow).

**Out of scope:** Full list view, sort/filter toolbar, date-range filter, description search (Phase 25). Reporting view, charts (Phase 26). Custom category management screen (deferred). Code review fixes from Phase 23 (WR-01/02/03) — run `/gsd-code-review-fix 23` before or alongside Phase 24.

</domain>

<decisions>
## Implementation Decisions

### Tab Shell (EXP-04)
- **D-01:** Third tab added to `WallecxApp.vue` using the existing PrimeVue `Tabs` / `TabList` / `TabPanel` pattern. Tab value string: `"expenses"`. Tab label: "Expenses" with an appropriate iconify icon (e.g. `mdi:cash-multiple` or `mdi:wallet-outline`).
- **D-02:** `activeTab` ref in `WallecxApp.vue` remains `ref<string>("vaccinations")` on initial load — no change to default tab. New `ExpensesTab` component imported and registered as the third `TabPanel`.
- **D-03:** No new Pinia store. `ExpensesTab.vue` owns its own state (mirrors `VaccinationsTab` and `MembershipsTab` self-contained pattern — STATE invariant).

### ExpensesTab Scaffold (EXP-04 / Phase 24 scope)
- **D-04:** `ExpensesTab.vue` in Phase 24 renders **empty state + "Add Expense" button only**. No list rendering. Empty state message: "No expenses yet — add your first one." Button opens `ManageExpense.vue`.
- **D-05:** Phase 25 replaces/expands the empty-state area with the real expense list. Phase 24's `ExpensesTab.vue` should structure the template to make Phase 25's list drop-in straightforward (e.g. a `<div>` where the list will go, currently showing the empty state).

### ManageExpense Dialog (EXP-05)
- **D-06:** `ManageExpense.vue` uses the **direct v-model refs pattern** (not @primevue/forms) — matches `ManageMembership.vue`. PrimeVue ColorPicker issue #8135 does not apply here (no ColorPicker), but the pattern is locked regardless.
- **D-07:** Dialog component: PrimeVue `<Dialog>` on desktop/tablet; `<Drawer position="bottom">` on mobile (< 640px) via `useIsMobile()` composable — mirrors Phase 17's `MembershipsTab.vue` pattern.
- **D-08:** `isSaving` guard: ref set to `true` during PocketBase calls, `false` in `finally`. Dialog is non-closable while `isSaving` is true. Prevents double-submit (EXP-05 SC 3).
- **D-09:** Zod validation via `expenseSchema` from `src/lib/wallecx/expenseSchema.ts` (Phase 23). Call `schema.safeParse()` on submit; map `flatten().fieldErrors` to per-field error refs.
- **D-10:** Server-first delete: `useConfirm` → ConfirmDialog at `WallecxApp.vue` shell level (STATE invariant — not duplicated in `ExpensesTab`). Confirm → `pb.collection('wallecx_expenses').delete(id)` → emit to parent to remove from local list.
- **D-11:** Auth null guard on create: `const userId = pb.authStore.record?.id; if (!userId) { toast.error(...); return; }` — matches `ManageMembership.vue` HIGH-01 pattern.
- **D-12:** `requestKey` on load: `{ requestKey: 'expenses-getFullList' }` and `{ requestKey: 'expense-categories-getFullList' }` (Phase 23 D-19 — must not collide with vaccinations/memberships keys).

### Form Fields in ManageExpense
- **D-13:** **Amount field** — PrimeVue `InputNumber` with `minFractionDigits=2`, `maxFractionDigits=2`, `:min="0.01"`, no currency mode. A static "PHP" label displayed beside the field (not inside it). Avoids locale/keyboard quirks with PrimeVue currency mode on mobile. Value stored as float, rounded to 2 decimals on save: `Math.round(value * 100) / 100`.
- **D-14:** **Date field** — PrimeVue `DatePicker` (same as `expiry_date` in `ManageMembership.vue`). Defaults to today on create: `ref<Date>(new Date())`. Saved as `dayjs(date).format('YYYY-MM-DD')` (YYYY-MM-DD string to PocketBase).
- **D-15:** **Category field** — PrimeVue `Select` with `editable=true`. The loaded `wallecx_expense_categories` for the user populate the options list. The user can type a new category name directly in the editable Select.
- **D-16:** **Notes field** — PrimeVue `Textarea`, 3 rows, auto-resize false (matches ManageMembership notes pattern).
- **D-17:** **Receipt field** — PrimeVue `FileUpload` (mode="basic"), accepts `image/jpeg,image/png,image/webp,application/pdf`, maxFileSize 10MB. EXIF strip + `browser-image-compression` pipeline for image files (same as ManageVaccination/ManageMembership). PDF files skip EXIF strip. Single file (MaxSelect=1).

### Custom Category Creation (EXP-06)
- **D-18:** `Select` is rendered with `editable=true`. When the user types a new category name (one not present in the loaded options), the new category is **NOT created immediately on blur**. Instead, creation happens **on expense save** (submit handler).
- **D-19:** On submit, before creating/updating the expense, the handler checks if the current category value matches any existing `ExpenseCategories` record name. If not found → `pb.collection('wallecx_expense_categories').create({ user: userId, name: categoryValue })` → then proceed with expense create/update. Two API calls in sequence when category is new.
- **D-20:** If category creation fails, abort the expense save and show a toast error. User stays on the dialog with their data intact.

### Category Seeding UX (D-09 from Phase 23 carry)
- **D-21:** On `ManageExpense.vue` open (watched via `visible` prop / dialog open event), the component calls `pb.collection('wallecx_expense_categories').getFullList(...)`. If the result is empty (length === 0), it seeds the 7 defaults via `Promise.all` of `.create(...)` calls.
- **D-22:** While seeding is in progress, the category `Select` is rendered as **disabled with a placeholder "Loading categories..."**. Once seeding completes, the Select is enabled and populated. User cannot submit the form while categories are loading (Submit button disabled or isSaving-style guard on the seed operation).
- **D-23:** `DEFAULT_EXPENSE_CATEGORIES` constant imported from Phase 23 source (the constant is already defined in `src/lib/wallecx/` per Phase 23 decisions).

### Dark Mode
- **D-24:** `ManageExpense.vue` and `ExpensesTab.vue` follow the established scoped CSS variable override pattern (Phase 18 + Phase 22). No new packages. Target `.my-app-dark .p-dialog`, `.my-app-dark .p-drawer` with override blocks inside `<style scoped>`.

### Claude's Discretion
- Exact icon choice for the Expenses tab (mdi:cash-multiple, mdi:wallet-outline, or similar — consistent with Vaccinations needle and Memberships card icon)
- Whether `ManageExpense.vue` shows a description field character counter (120 char max per D-14 in Phase 23)
- Exact toast wording for create/update/delete success messages (mirror existing pattern: "Expense added." / "Expense updated." / "Expense deleted.")
- Whether to add a `.refine()` to `expense_date` in `expenseSchema` (WR-03 advisory from Phase 23 code review — recommended yes, add before Phase 24 uses the schema)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §EXP-04, EXP-05, EXP-06
- `.planning/ROADMAP.md` §Phase 24 — Goal, SC 1–6

### Project State (locked invariants)
- `.planning/STATE.md` §Architectural Invariants — Tab shell pattern; ConfirmDialog at shell level only; requestKey per collection; server-side per-user isolation; direct v-model refs for PrimeVue forms
- `.planning/STATE.md` §v4.0 Expense Tracker Foundation — Phase 23 locked decisions (D-09 lazy seeding, D-19 requestKeys, D-10 currency module)

### Phase 23 Context (backend + type foundation)
- `.planning/phases/23-backend-type-foundation/23-CONTEXT.md` — expenseSchema location, expenseMapper shape, DEFAULT_EXPENSE_CATEGORIES constant, requestKey names, currency module, WR-01/02/03 advisory findings

### Prior Phase Patterns to Mirror Exactly
- `src/components/projects/wallecx/WallecxApp.vue` — Tab shell structure (Tabs, TabList, Tab, TabPanels, TabPanel); ConfirmDialog placement; onMounted auth/PWA logic
- `src/components/projects/wallecx/ManageMembership.vue` — Direct v-model refs pattern; Zod safeParse; isSaving guard; FileUpload + EXIF strip; server-first delete via useConfirm; Dialog/Drawer-bottom split via useIsMobile()
- `src/components/projects/wallecx/MembershipsTab.vue` — Tab self-contained state ownership; useConfirm import (explicit, not auto-resolved); onMounted load; emit patterns for CRUD operations; useIsMobile() usage
- `src/composables/useIsMobile.ts` — Mobile breakpoint composable (< 640px) — already exists, reuse directly

### Phase 23 Source Files (already created — must use, not recreate)
- `src/types/wallecx/expenses/types.d.ts` — `Expenses` interface + `AddExpense` type
- `src/types/wallecx/expense-categories/types.d.ts` — `ExpenseCategories` interface + `AddExpenseCategory` type
- `src/lib/wallecx/expenseSchema.ts` — `expenseSchema` + `expenseCategorySchema` (Zod)
- `src/lib/wallecx/currency.ts` — `WALLECX_CURRENCY`, `WALLECX_CURRENCY_LOCALE`, `formatCurrency()`
- `src/lib/pocketbase/expenseMapper.ts` — `mapToUpdateExpense()`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WallecxApp.vue` — existing Tabs shell; third tab is a straight add (import + TabPanel entry)
- `ManageMembership.vue` — template to mirror for ManageExpense (direct v-model, FileUpload, isSaving, Dialog/Drawer split)
- `MembershipsTab.vue` — template to mirror for ExpensesTab (onMounted load, confirm delete, emit chain)
- `useIsMobile()` — composable at `src/composables/useIsMobile.ts`; already used by MembershipsTab and VaccinationsTab
- `useConfirm` — must be imported explicitly from `primevue/useconfirm` (not auto-resolved by PrimeVueResolver)
- `AttachmentPreview.vue` — existing component for receipt preview (Phase 25 will use this; Phase 24 just uploads)
- `browser-image-compression` — already a runtime dep, used by ManageVaccination + ManageMembership

### Established Patterns
- PrimeVue `Select` with `editable=true` — straightforward Vue prop; no new component needed for custom category
- `dayjs(date).format('YYYY-MM-DD')` for date serialization to PocketBase
- `pb.authStore.record?.id` null guard before all create operations
- `requestKey` distinct per collection to prevent PocketBase auto-cancel
- scoped CSS `.my-app-dark` variable overrides for dark mode (no new packages)

### Integration Points
- `WallecxApp.vue` — add import + TabPanel (minimal change, low risk)
- `ExpensesTab.vue` — new file; calls ManageExpense + eventually passed delete confirms up via ConfirmDialog at shell
- `ManageExpense.vue` — new file; emits `created` / `updated` events; parent (ExpensesTab) handles list refresh

</code_context>

<specifics>
## Specific Ideas

### ManageExpense.vue field order (top to bottom, mirrors form logic)
1. Amount (required, InputNumber plain, PHP label)
2. Date (required, DatePicker, default today)
3. Category (required, editable Select, loading state on seed)
4. Description (required, InputText, max 120)
5. Notes (optional, Textarea 3 rows)
6. Receipt (optional, FileUpload image+PDF, EXIF strip for images)
7. Submit button (loading state = isSaving OR isLoadingCategories)

### Category editable Select pseudo-logic
```ts
// on dialog open
const categories = await pb.collection('wallecx_expense_categories')
  .getFullList<ExpenseCategories>({ requestKey: 'expense-categories-getFullList' })
if (categories.length === 0) {
  isLoadingCategories.value = true
  await Promise.all(DEFAULT_EXPENSE_CATEGORIES.map(name =>
    pb.collection('wallecx_expense_categories').create({ user: userId, name })
  ))
  // reload categories
  isLoadingCategories.value = false
}

// on submit (if category is new)
const existingMatch = loadedCategories.value.find(c => c.name === category.value)
if (!existingMatch) {
  await pb.collection('wallecx_expense_categories').create({ user: userId, name: category.value })
}
// then create/update expense
```

### WallecxApp.vue third tab addition
```html
<Tab value="expenses">
  <iconify-icon icon="mdi:cash-multiple" width="16" height="16" aria-hidden="true"></iconify-icon>
  Expenses
</Tab>
...
<TabPanel value="expenses">
  <ExpensesTab />
</TabPanel>
```

</specifics>

<deferred>
## Deferred Ideas

- **Category management screen** — dedicated UI to rename or delete user categories (separate future phase)
- **Default category customization** — letting users change which categories are seeded (future)
- **Expense list in Phase 24** — intentionally deferred to Phase 25; Phase 24 delivers empty state only
- **WR-01/02/03 code review fixes** — Phase 23 advisory findings; should run `/gsd-code-review-fix 23` before or alongside Phase 24 execution

</deferred>

---

*Phase: 24-write-path-tab-shell-crud*
*Context gathered: 2026-05-21*
