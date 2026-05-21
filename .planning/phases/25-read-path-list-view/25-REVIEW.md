---
phase: 25-read-path-list-view
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/projects/wallecx/ExpenseItem.vue
  - src/components/projects/wallecx/ExpensesToolbar.vue
  - src/components/projects/wallecx/ExpensesTab.vue
findings:
  critical: 0
  warning: 2
  info: 6
  total: 8
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The phase 25 read-path components are well structured: ExpenseItem is a thin presentational row with proper a11y labels and 44px touch targets, ExpensesToolbar correctly uses one-way binding + emit pairs for v-model props, and ExpensesTab cleanly composes loading/empty/filtered-empty/list states. Description rendering uses safe `{{ }}` interpolation so there is no XSS exposure, sessionStorage writes are guarded with try/catch, and the receipt-preview flow correctly refuses to open when the token fetch fails.

Two warnings are worth fixing before sign-off: a race condition when the user taps multiple receipt icons quickly (stale token + record can be paired into the dialog), and a `defineExpose` of `deleteExpense` that no parent consumes (dead public surface). The remaining six items are info-level polish: missing tie-breaker on `oldest-first`/`category-asc` sorts, toolbar visible in the truly-empty state, inline semicolon expressions on `@hide`, a no-op `.stop` on row buttons, and minor typing notes.

## Warnings

### WR-01: Race condition in `openReceiptPreview` can pair the wrong record with a token

**File:** `src/components/projects/wallecx/ExpensesTab.vue:100-110`
**Issue:** `openReceiptPreview` awaits `pb.files.getToken()` before setting `previewRecord`/`showPreview`. If the user taps two paperclip icons in quick succession the two awaited promises can resolve out of order, leaving `previewToken` from call A paired with `previewRecord` from call B (or vice versa). On a protected file field the dialog can briefly show the wrong receipt or 403 — at minimum the UX is jittery.

**Fix:** Stamp each invocation and bail out if a newer one has started, or set the record before awaiting and confirm identity afterwards.
```ts
let previewSeq = 0
async function openReceiptPreview(record: Expenses): Promise<void> {
  const seq = ++previewSeq
  let token: string
  try {
    token = await pb.files.getToken()
  } catch (e: unknown) {
    toast.error('Failed to load receipt. Refresh to try again.')
    console.error('ExpensesTab: getToken failed', e)
    return
  }
  if (seq !== previewSeq) return  // a newer click superseded us
  previewToken.value = token
  previewRecord.value = record
  showPreview.value = true
}
```

### WR-02: `defineExpose({ deleteExpense })` exposes a public surface no parent consumes

**File:** `src/components/projects/wallecx/ExpensesTab.vue:175`
**Issue:** `deleteExpense` is wired internally via the `@delete` event on `<ExpenseItem>` (line 259). The `defineExpose` block claims the action is exposed "for Phase 25 list row actions," but the row actions are emitted as events and handled in this same component. No `ref="..."` on `<ExpensesTab>` in the codebase reads this method, so it is dead public API. Worse, it creates an implicit contract: a future refactor that renames or changes the signature will silently break any parent that later tries to call it.

**Fix:** Remove the expose unless a documented external caller exists.
```ts
// Delete these lines:
// // Expose deleteExpense for Phase 25 list row actions
// defineExpose({ deleteExpense })
```
If a parent (e.g. a keyboard shortcut handler in `WallecxApp.vue`) really does need it, add a code comment naming that caller and add a test that covers the path.

## Info

### IN-01: `oldest-first` and `category-asc` sorts have no tie-breaker, unlike the default

**File:** `src/components/projects/wallecx/ExpensesTab.vue:81-89`
**Issue:** The default (newest-first) branch breaks ties with `b.created.localeCompare(a.created)` so records on the same `expense_date` have a stable order. `oldest-first`, `category-asc`, `amount-high`, and `amount-low` use single-key comparators, so ties can re-order on each render and produce visual flicker when the list updates (e.g. after `onUpdated`).

**Fix:** Add a `created` tie-breaker to every comparator, matching the default.
```ts
case 'oldest-first':
  sorted.sort((a, b) =>
    a.expense_date.localeCompare(b.expense_date) ||
    a.created.localeCompare(b.created)
  )
  break
case 'category-asc':
  sorted.sort((a, b) =>
    a.category.localeCompare(b.category) ||
    b.expense_date.localeCompare(a.expense_date)
  )
  break
// …and similarly for amount-high / amount-low using b.created.localeCompare(a.created)
```

### IN-02: Toolbar renders in the truly-empty state (`expenses.length === 0`)

**File:** `src/components/projects/wallecx/ExpensesTab.vue:187-196`
**Issue:** `ExpensesToolbar` is gated only by `v-if="!isLoading"`, so once loading completes the search box, category MultiSelect, and two DatePickers are visible above the "No expenses yet." empty state. They serve no purpose when there are zero records and add visual noise on a first-time user's screen.

**Fix:** Hide the toolbar when the raw list is empty.
```vue
<ExpensesToolbar
  v-if="!isLoading && expenses.length > 0"
  …
/>
```

### IN-03: Inline multi-statement `@hide` handlers reduce readability

**File:** `src/components/projects/wallecx/ExpensesTab.vue:280, 295`
**Issue:** `@hide="previewRecord = null; previewToken = ''"` packs two assignments into a template expression. It works because Vue evaluates this as a function body, but it sidesteps the script section and makes the cleanup logic hard to grep for.

**Fix:** Extract a named handler.
```ts
function closePreview(): void {
  previewRecord.value = null
  previewToken.value = ''
}
```
```vue
<Dialog … @hide="closePreview" />
<Drawer … @hide="closePreview" />
```

### IN-04: `@click.stop` on row action buttons is a no-op

**File:** `src/components/projects/wallecx/ExpenseItem.vue:39, 49, 59`
**Issue:** The three action buttons use `@click.stop`, but the row's outer `<div>` has no click handler to bubble into. The modifier is defensive padding for a future tappable row, but right now it just adds template noise and hides intent (a reviewer reasonably assumes a parent listener exists somewhere).

**Fix:** Drop `.stop` until a row-level click handler is actually added, or add a TODO comment naming the future row-tap behaviour.

### IN-05: DatePicker `@update:model-value` does not handle the `Date[]` shape

**File:** `src/components/projects/wallecx/ExpensesToolbar.vue:73, 81`
**Issue:** PrimeVue's `DatePicker` emits `Date | Date[] | (Date | null)[] | null` depending on `selectionMode`. The handler `$event instanceof Date ? $event : null` collapses every non-`Date` (including `null` from the button-bar "Clear") to `null`, which is the desired behaviour today. The risk is later: if anyone adds `selection-mode="range"` to one of these pickers expecting it to "just work," the array payload will silently become `null` and the filter will look broken.

**Fix:** Either type the payload narrowly with a typed event handler, or add a code comment noting the intentional single-date contract.
```vue
<DatePicker
  …
  selection-mode="single"   <!-- explicit, matches the cast below -->
  @update:model-value="(v: Date | null) => emit('update:dateFrom', v instanceof Date ? v : null)"
/>
```

### IN-06: No teardown for the in-flight `getFullList` request

**File:** `src/components/projects/wallecx/ExpensesTab.vue:121-127`
**Issue:** `pb.collection('wallecx_expenses').getFullList({ requestKey: 'expenses-getFullList' })` is fired in `onMounted` but the component has no `onUnmounted` hook to cancel/ignore it. If the user navigates away mid-fetch (mobile back-swipe, route change) the promise will still resolve and the `expenses.value = …` assignment runs on an unmounted component, then the toast on the catch branch fires for an unrelated network error. PocketBase's auto-cancel by `requestKey` saves us most of the time (next mount with the same key cancels the previous), but the explicit guard is cheap.

**Fix:** Track mounted state.
```ts
let isMounted = true
onUnmounted(() => { isMounted = false })

onMounted(async () => {
  …
  try {
    const list = await pb.collection('wallecx_expenses').getFullList<Expenses>({ … })
    if (isMounted) expenses.value = list
  } catch (e: unknown) {
    if (isMounted) toast.error('Failed to load expenses. Pull to refresh or reload the page.')
    console.error('ExpensesTab: getFullList failed', e)
  } finally {
    if (isMounted) isLoading.value = false
  }
})
```

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
