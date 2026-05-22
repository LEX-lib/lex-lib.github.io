---
phase: 24-write-path-tab-shell-crud
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/projects/wallecx/ExpensesTab.vue
  - src/components/projects/wallecx/ManageExpense.vue
  - src/lib/wallecx/expenseSchema.ts
  - src/components/projects/wallecx/WallecxApp.vue
  - src/lib/pocketbase/expenseMapper.ts
  - src/lib/pocketbase/__tests__/expenseMapper.spec.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-05-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files were reviewed covering the Phase 24 write-path: the `ExpensesTab` shell, `ManageExpense` CRUD dialog/drawer, `expenseSchema` validation, `WallecxApp` tab shell, `expenseMapper`, and its unit tests.

The implementation is well-structured and follows established patterns from the Vaccinations and Memberships tabs. Auth null-guards, EXIF stripping, Zod validation, and the `ConfirmDialog`-at-shell-level invariant are all correctly applied. Two warnings require attention before Phase 25 ships (the `requestKey` collision is the higher-priority one). Three info items are scaffolding artifacts.

---

## Warnings

### WR-01: requestKey collision between save mutations and future list fetch

**File:** `src/components/projects/wallecx/ManageExpense.vue:238-244`

**Issue:** Both the `update` call (line 238) and the `create` call (line 243) use `requestKey: 'expenses-getFullList'`. The comment in `expenseMapper.ts` explicitly reserves `'expenses-getFullList'` as the Phase 25 list-query key. When the save fires while a list fetch is in flight — or vice versa — PocketBase's auto-cancel mechanism will abort whichever request shares that key, silently dropping either the save or the refresh. The `update` and `create` mutations need distinct keys that do not collide with the list fetch key.

**Fix:**
```typescript
// update path
const updated = await pb.collection('wallecx_expenses').update<Expenses>(
  record.value.id,
  formData,
  { requestKey: 'expenses-update' },
)

// create path
const created = await pb.collection('wallecx_expenses').create<Expenses>(formData, {
  requestKey: 'expenses-create',
})
```

---

### WR-02: `isLoadingCategories` not set before the initial category fetch

**File:** `src/components/projects/wallecx/ManageExpense.vue:75-105`

**Issue:** `isLoadingCategories` is only set to `true` inside the `cats.length === 0` seeding branch (line 85). The preceding `getFullList` call (line 80) runs without setting the flag. During the initial fetch the Select dropdown shows as enabled and not loading, so a fast user could interact with it or tap Submit before categories arrive. The seeding branch correctly guards itself, but the outer fetch does not.

**Fix:**
```typescript
async function loadCategories(): Promise<void> {
  const userId = pb.authStore.record?.id
  if (!userId) return

  isLoadingCategories.value = true   // <-- set before any await
  try {
    const cats = await pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({
      requestKey: 'expense-categories-getFullList',
    })

    if (cats.length === 0) {
      // seeding path — flag already true, no double-set needed
      try {
        await Promise.all(
          DEFAULT_EXPENSE_CATEGORIES.map((name) =>
            pb.collection('wallecx_expense_categories').create({ user: userId, name }),
          ),
        )
        const seeded = await pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({
          requestKey: 'expense-categories-getFullList',
        })
        loadedCategories.value = seeded
      } catch {
        toast.error('Failed to seed categories. Please try again.')
      }
    } else {
      loadedCategories.value = cats
    }
  } catch {
    toast.error('Failed to load categories. Please try again.')
  } finally {
    isLoadingCategories.value = false   // <-- always clear in finally
  }
}
```

---

## Info

### IN-01: Dead `void mapToUpdateExpense` expression used as lint anchor

**File:** `src/components/projects/wallecx/ManageExpense.vue:234`

**Issue:** `void mapToUpdateExpense` is a no-op statement whose sole purpose is to prevent a lint "unused import" warning. The function is imported but never actually called — the update path builds `FormData` directly. The comment acknowledges this intent, but a dead side-effect-free void expression is confusing to future readers and will not survive all linters.

**Fix:** Either remove the import and the void expression (the import was only needed if `mapToUpdateExpense` were called), or keep the import and replace the void anchor with a type-only reference:
```typescript
// Option A: remove entirely (import + void line)
// Option B: if the import is retained for documentation value, replace with a type assertion:
const _: typeof mapToUpdateExpense = mapToUpdateExpense  // satisfies TS without runtime side-effect
```
The cleanest resolution is Option A — the writable field contract is already documented by `expenseMapper.ts`'s JSDoc.

---

### IN-02: `isLoading` in `ExpensesTab` is declared but never mutated

**File:** `src/components/projects/wallecx/ExpensesTab.vue:10`

**Issue:** `isLoading` is initialised to `false` and never set to `true` or `false` anywhere in the component. The template references it (`v-if="expenses.length === 0 && !isLoading"`), making it permanent dead state. This is flagged as scaffolding for Phase 25, but until the list-fetch logic lands, the guard is inoperative.

**Fix:** Add a `// Phase 25: set isLoading during fetch` comment next to the declaration, or defer declaring it until Phase 25 adds the actual fetch. No immediate action required if the Phase 25 plan already captures this.

---

### IN-03: `expenseMapper.ts` is imported but `mapToUpdateExpense` is never called

**File:** `src/components/projects/wallecx/ManageExpense.vue:7`

**Issue:** `mapToUpdateExpense` is imported at line 7 but is not invoked anywhere in the component — the update path assembles its own `FormData` rather than delegating to the mapper. The mapper is well-tested but unused in production code paths. The function may have been intended for a non-FormData PATCH flow that was later replaced.

**Fix:** If the FormData approach is the final design for file-field PATCH operations (matching the vaccinations/memberships pattern), remove the import. If `mapToUpdateExpense` is intended as a field-set reference document rather than a runtime utility, that intent should be captured in its JSDoc rather than via a dead import.

---

_Reviewed: 2026-05-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
