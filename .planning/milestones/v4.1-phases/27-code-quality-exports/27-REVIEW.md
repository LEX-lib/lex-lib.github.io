---
phase: 27-code-quality-exports
reviewed: 2026-05-22T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/lib/wallecx/expenseSchema.ts
  - src/lib/pocketbase/expenseMapper.ts
  - src/lib/pocketbase/__tests__/expenseMapper.spec.ts
  - src/components/projects/wallecx/MembershipsTab.vue
  - src/components/projects/wallecx/ExpensesTab.vue
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 27: Code Review Report

**Reviewed:** 2026-05-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files were reviewed: the Zod expense schema (CQ-01 fix), the expense mapper (CQ-02 fix), the mapper unit tests, and the two Vue tab components that received JSON export buttons.

The CQ-01 and CQ-02 fixes are correct. The strict `dayjs` calendar refinement and the conditional notes spread both implement the intended behaviour cleanly. The unit test suite is comprehensive and tests the right contracts.

Two warnings and one info item were found in the export implementations added this phase. No critical issues exist.

## Warnings

### WR-01: Export fetches fresh data instead of exporting the in-memory list

**File:** `src/components/projects/wallecx/MembershipsTab.vue:179-184`

**Issue:** `exportJson` issues a second `getFullList` call to PocketBase instead of serialising the already-loaded `records` ref. The user sees the displayed grid (which reflects the last `onMounted` load plus any create/update/delete mutations) but the downloaded JSON comes from a fresh server round-trip. If another session has modified data between the mount and the export click, the exported file will silently diverge from what the user sees. This also adds unnecessary network latency and consumes one of the distinct `requestKey` slots.

The same pattern appears in `ExpensesTab.vue` (lines 109–115); both components are affected.

**Fix:** Export the reactive list directly rather than re-fetching:

```ts
// MembershipsTab.vue — replace the getFullList call inside exportJson
const exportPayload = {
  exported_at: new Date().toISOString(),
  record_count: records.value.length,
  records: records.value.map((r) => ({
    id: r.id,
    card_name: r.card_name,
    issuer: r.issuer ?? null,
    card_number: r.card_number ?? null,
    card_color: r.card_color ?? null,
    expiry_date: r.expiry_date ?? null,
    notes: r.notes ?? null,
    card_image_url: r.card_image ? pb.files.getURL(r, r.card_image) : null,
    created: r.created,
    updated: r.updated,
  })),
}
// Remove the try/catch wrapping the pb.collection call; keep the Blob/URL/anchor block.
// isExporting guard and the userId check can also be removed (no async operation).
```

Apply the equivalent change in `ExpensesTab.vue` (use `expenses.value` instead of `allRecords`).

---

### WR-02: Delete error swallowed silently — no console logging

**File:** `src/components/projects/wallecx/ExpensesTab.vue:91-93`

**Issue:** The `catch` block inside the `deleteExpense` accept handler uses a bare `catch` with no bound variable. This is legal syntax, but it means the error is never logged to the console. Every other error handler in both files (`MembershipsTab.vue:103-105`, `ExpensesTab.vue:53-55`, etc.) calls `console.error` with context. This one silently discards the error object, making post-mortem debugging of delete failures impossible.

```ts
// current — error detail lost
} catch {
  toast.error('Failed to delete. Please try again.')
}
```

**Fix:** Bind the error variable and log it:

```ts
} catch (e: unknown) {
  toast.error('Failed to delete. Please try again.')
  console.error('ExpensesTab: delete failed', e)
}
```

## Info

### IN-01: `isExporting` guard is unnecessary when exporting from in-memory state

**File:** `src/components/projects/wallecx/MembershipsTab.vue:171`, `src/components/projects/wallecx/ExpensesTab.vue:102`

**Issue:** The `isExporting` ref and the early-return guard exist to prevent concurrent async fetches. If WR-01 is fixed (export from in-memory list), the export becomes synchronous. The `isExporting` flag, the `:disabled` binding, and the `:loading` binding on the Button would then be guarding a synchronous operation that cannot overlap with itself. The dead state ref and the Button props add visual complexity with no functional benefit.

**Fix:** If WR-01 is addressed, remove `isExporting`, the early-return guard, the `try/catch` wrapper (no async call remains), and the `:disabled`/`:loading` Button props. Replace with a simple `@click="exportJson"` binding.

If the re-fetch is intentionally kept (e.g. to guarantee freshest data), then `isExporting` is correct as-is — this item only applies if WR-01 is resolved.

---

_Reviewed: 2026-05-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
