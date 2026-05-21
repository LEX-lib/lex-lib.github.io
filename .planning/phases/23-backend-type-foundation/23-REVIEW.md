---
phase: 23-backend-type-foundation
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/types/wallecx/expenses/types.d.ts
  - src/types/wallecx/expense-categories/types.d.ts
  - src/lib/wallecx/expenseSchema.ts
  - src/lib/wallecx/currency.ts
  - src/lib/pocketbase/expenseMapper.ts
  - src/lib/pocketbase/__tests__/expenseMapper.spec.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-05-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six newly created files were reviewed: two TypeScript type declaration files, a Zod schema module, a currency helper, a PocketBase mapper function, and its Vitest spec. No critical security vulnerabilities were found. There are three warnings: a silent key-inclusion bug in the mapper that may cause unintended PocketBase PATCH behaviour, a weak test assertion that does not enforce the "drop the key" contract, and a date regex that accepts structurally valid but calendrically invalid strings. Three informational items cover duplicate field declarations on the type interfaces, a missing `finite()` guard on the amount schema, and an off-topic test case in the mapper spec.

---

## Warnings

### WR-01: `mapToUpdateExpense` always includes `notes` key — may silently clear field on PATCH

**File:** `src/lib/pocketbase/expenseMapper.ts:28`
**Issue:** The mapper unconditionally assigns `notes: record.notes`. When `record.notes` is `undefined`, the returned object contains the key `notes` with value `undefined`. Some HTTP clients (including PocketBase's own SDK in certain configurations) serialise explicit `undefined` properties in JSON bodies as `""` or as `null`, which can silently clear the notes field on the server during a PATCH even when the caller did not intend to modify it. The companion test (WR-02 below) does not catch this because it only checks the value, not the key's presence.
**Fix:**
```ts
export function mapToUpdateExpense(record: Expenses): {
  amount: number;
  expense_date: string;
  category: string;
  description: string;
  notes?: string;
} {
  const payload: ReturnType<typeof mapToUpdateExpense> = {
    amount: record.amount,
    expense_date: record.expense_date,
    category: record.category,
    description: record.description,
  };
  if (record.notes !== undefined) {
    payload.notes = record.notes;
  }
  return payload;
}
```

---

### WR-02: Test assertion for `notes: undefined` checks value, not key absence — test contract is too weak

**File:** `src/lib/pocketbase/__tests__/expenseMapper.spec.ts:59-63`
**Issue:** The test `"drops notes when undefined"` asserts `expect(minimalPayload.notes).toBeUndefined()`. This passes even if the mapper includes the key with value `undefined`, meaning the test does not enforce the "drop the key" contract expressed in its own description. A bug where `notes` is set to `null` would also pass this assertion silently. The test gives false confidence about the mapper's PATCH safety (see WR-01).
**Fix:**
```ts
it("drops notes when undefined", () => {
  const minimal = makeExpense({ notes: undefined });
  const minimalPayload = mapToUpdateExpense(minimal);
  expect(minimalPayload).not.toHaveProperty("notes");
});
```

---

### WR-03: `expense_date` regex accepts invalid calendar dates

**File:** `src/lib/wallecx/expenseSchema.ts:18`
**Issue:** The regex `/^\d{4}-\d{2}-\d{2}$/` validates the structural format `YYYY-MM-DD` but not calendar validity. Values such as `"2026-13-01"` (month 13), `"2026-02-30"` (non-existent February 30), or `"0000-00-00"` pass the regex. These values will be accepted by the schema and stored in PocketBase, causing silent data corruption that is hard to find after the fact.
**Fix:** Replace the regex-only check with a `z.string().refine()` that additionally validates the date is parseable and non-NaN. Using `dayjs` (already in the project) is the idiomatic approach here:
```ts
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

expense_date: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (val) => dayjs(val, 'YYYY-MM-DD', true).isValid(),
    { message: 'expense_date must be a valid calendar date' }
  ),
```
If the `dayjs` dependency is not desired in this module, a lighter alternative:
```ts
expense_date: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (val) => !isNaN(Date.parse(val)) && new Date(val).toISOString().startsWith(val),
    { message: 'expense_date must be a valid calendar date' }
  ),
```

---

## Info

### IN-01: Duplicate field declarations shadow `RecordModel` base fields

**File:** `src/types/wallecx/expenses/types.d.ts:4-6` and `src/types/wallecx/expense-categories/types.d.ts:4-6`
**Issue:** Both interfaces explicitly redeclare `id: string`, `created: string`, and `updated: string`. `RecordModel` from `pocketbase` already declares these fields. TypeScript merges them silently (both are `string`, so there is no type error), but the duplication is misleading — it implies these fields are custom additions rather than inherited, and could become a maintenance hazard if PocketBase ever changes the base types.
**Fix:** Remove the three redeclared fields from both interfaces:
```ts
// expenses/types.d.ts
export interface Expenses extends RecordModel {
  // id, created, updated — inherited from RecordModel
  user: string;
  amount: number;
  expense_date: string;
  category: string;
  description: string;
  notes?: string;
  receipt?: string;
}
```
Apply the same change to `ExpenseCategories`.

---

### IN-02: `amount` schema lacks explicit `finite()` guard

**File:** `src/lib/wallecx/expenseSchema.ts:17`
**Issue:** `z.number().positive().max(99_999_999.99)` does not exclude `Infinity`. While `max()` blocks `Infinity`, the intent is not immediately obvious to a reader, and `Infinity` would slip through if the `max()` was ever removed or changed. Adding `z.number().finite()` makes the constraint self-documenting and future-proof.
**Fix:**
```ts
amount: z.number().finite().positive().max(99_999_999.99),
```

---

### IN-03: Off-topic test case in mapper spec — `Object.assign` contract is not mapper behaviour

**File:** `src/lib/pocketbase/__tests__/expenseMapper.spec.ts:72-80`
**Issue:** The `"create-then-update id-refresh contract"` describe block tests the behaviour of `Object.assign`, which is a JavaScript built-in, not `mapToUpdateExpense`. The test does not call or assert anything about the mapper function. Its presence in this spec file inflates the apparent coverage of `expenseMapper.ts` and can mislead a reader scanning test results.
**Fix:** Either remove this test block entirely, or move it to a broader integration/contract test file (e.g., `__tests__/expenseFlow.spec.ts`) where it can be properly contextualised alongside the Phase 24 create-then-update flow it is meant to document.

---

_Reviewed: 2026-05-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
