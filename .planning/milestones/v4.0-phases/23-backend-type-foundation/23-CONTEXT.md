# Phase 23: Backend & Type Foundation - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the two new PocketBase collections (`wallecx_expenses` + `wallecx_expense_categories`) with per-user access rules; create TypeScript types, Zod schema, and an `expenseMapper.ts` matching the existing Wallecx pattern; and write a Vitest spec (`expenseMapper.spec.ts`) locking the write-path contract. **No UI work, no tab, no dialog** — those are Phase 24+. The phase succeeds when a fresh user can be type-safely smoke-tested for cross-user isolation on both collections.

**In scope:** EXP-01 (`wallecx_expenses` collection), EXP-02 (`wallecx_expense_categories` collection), EXP-03 (Zod + types + mapper + spec).

**Out of scope:** ExpensesTab, ManageExpense dialog, list view, reporting view (Phases 24–26). Default-category seeding happens at WRITE time (Phase 24's ManageExpense), not in Phase 23 — Phase 23 just defines the collection so seeding has a target.

</domain>

<decisions>
## Implementation Decisions

### `wallecx_expenses` Collection Schema (EXP-01)
- **D-01:** Collection name `wallecx_expenses` (snake_case, matches `wallecx_vaccinations` / `wallecx_memberships` convention).
- **D-02:** Fields:
  - `id` (PocketBase auto, 15 chars)
  - `user` (relation → `users`, required, single, cascade delete NOT enabled — matches existing collections)
  - `amount` (number, required, min 0.01, max 99,999,999.99) — see D-08
  - `expense_date` (date, required) — stored as `YYYY-MM-DD` per Wallecx convention
  - `category` (text, required, max 60) — denormalized category NAME (see D-05)
  - `description` (text, required, max 120) — short summary like "Lunch at café"
  - `notes` (text, optional, max 2000) — longer free-form
  - `receipt` (file, optional, single, MaxSelect=1) — image (JPEG/PNG/WebP) or PDF, MaxSize=10MB (matches existing `card`/`card_image` convention)
- **D-03:** Access rules (5 total, matches v2.0 lock from STATE.md):
  - `listRule`, `viewRule`, `updateRule`, `deleteRule`: `@request.auth.id != "" && user = @request.auth.id`
  - `createRule`: `@request.auth.id != "" && @request.data.user = @request.auth.id` (`@request.data.*` is the correct PocketBase v0.26.x syntax — `@request.body.*` does NOT exist and causes 403 on create; this lesson is locked in STATE.md and the memory)

### `wallecx_expense_categories` Collection Schema (EXP-02)
- **D-04:** Collection name `wallecx_expense_categories`.
- **D-05:** Fields:
  - `id` (auto)
  - `user` (relation → `users`, **required**) — every category row belongs to exactly one user (no globals; defaults are seeded per-user lazily at write time — see D-09)
  - `name` (text, required, max 60) — unique within the same user via PocketBase compound index `idx_user_name` on `(user, name)`
- **D-06:** Access rules (identical pattern to `wallecx_expenses`):
  - List/View/Update/Delete: `@request.auth.id != "" && user = @request.auth.id`
  - Create: `@request.auth.id != "" && @request.data.user = @request.auth.id`

### Category Reference on Expense (D-05 carry-over)
- **D-07:** `wallecx_expenses.category` is a plain TEXT field holding the category NAME (denormalized). It is NOT a PocketBase relation to `wallecx_expense_categories`. Rationale:
  - Simpler aggregation: group by string match, no `expand` overhead
  - No orphan risk if the user deletes a category later (the expense keeps its historical category name)
  - Renaming a category does NOT retroactively update old expenses — acceptable for a personal tracker (and matches the "soft-historical" approach already used by `vaccinations.vaccine_name`)

### Amount Type (EXP-03 partial)
- **D-08:** `amount` is PocketBase `number` (float). Zod schema enforces:
  - `z.number().positive()` (> 0)
  - `z.number().max(99_999_999.99)` (bounded)
  - Frontend rounds to 2 decimals on save: `Math.round(value * 100) / 100`
  - Display uses `Intl.NumberFormat` with the locked currency (see D-10)
  - JavaScript float precision (~15 significant digits) is sufficient for personal-tracking amounts; integer-cents storage is not required for v4.0

### Default Categories — Lazy Per-User Seed (D-09)
- **D-09:** Default category set (locked, hardcoded in a frontend constant — Phase 24 reads this):
  - `DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Health', 'Shopping', 'Entertainment', 'Other']`
  - **Seeding happens at WRITE time in Phase 24's ManageExpense.vue first-open flow**: when the user opens the expense create dialog, the app checks if they have any rows in `wallecx_expense_categories`; if zero, it bulk-inserts the 7 defaults via a single Promise.all of `pb.collection('wallecx_expense_categories').create(...)` calls.
  - Phase 23 only DEFINES the collection that supports this; Phase 24 implements the seeding.
  - No PocketBase signup hook (out of scope; keeps backend stateless).

### Currency (Hardcoded Site-Wide) (D-10)
- **D-10:** Single locked currency for v4.0. Source-of-truth constant: `src/lib/wallecx/currency.ts` (NEW file) exports:
  - `WALLECX_CURRENCY = 'PHP'`
  - `WALLECX_CURRENCY_LOCALE = 'en-PH'`
  - `formatCurrency(amount: number): string` returning `Intl.NumberFormat(WALLECX_CURRENCY_LOCALE, { style: 'currency', currency: WALLECX_CURRENCY }).format(amount)`
  - Phase 23 creates this constant module so Phase 24/25/26 can import it for display.
  - Multi-currency deferred to EXP-ADV-03 (would migrate this to a user setting or per-expense field then).

### Receipt File Field (D-02 partial)
- **D-11:** `receipt` field MIME constraints: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. MaxSize: 10MB. Single file (MaxSelect=1). Matches the established `card` (vaccinations) / `card_image` (memberships) pattern: stored filename returned as string, served via `pb.files.getURL(record, record.receipt, { token })` with a short-lived view-time token (BR-1).

### TypeScript Types (EXP-03)
- **D-12:** `src/types/wallecx/expenses/types.d.ts`:
  ```ts
  import type { RecordModel } from "pocketbase";

  export interface Expenses extends RecordModel {
    id: string;
    created: string;
    updated: string;
    user: string;
    amount: number;
    expense_date: string;   // ISO date YYYY-MM-DD
    category: string;       // denormalized name
    description: string;
    notes?: string;
    receipt?: string;       // filename returned by MaxSelect=1 file field
  }

  export type AddExpense = Omit<Expenses, "id" | "created" | "updated">;
  ```
- **D-13:** `src/types/wallecx/expense-categories/types.d.ts`:
  ```ts
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

### Zod Schema (EXP-03)
- **D-14:** Zod schema lives in `src/lib/wallecx/expenseSchema.ts` (NEW). Shape:
  ```ts
  import { z } from 'zod';

  export const expenseSchema = z.object({
    amount: z.number().positive().max(99_999_999.99),
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.string().min(1).max(60),
    description: z.string().min(1).max(120),
    notes: z.string().max(2000).optional(),
    // receipt is handled separately as FormData (matches vaccinations/memberships pattern)
  });

  export const expenseCategorySchema = z.object({
    name: z.string().min(1).max(60),
  });
  ```
- **D-15:** Schema lives alongside the mapper and currency constant in `src/lib/wallecx/` — this is a NEW directory; align with existing `src/lib/pocketbase/` for mapper files (D-16).

### Mapper (EXP-03)
- **D-16:** `src/lib/pocketbase/expenseMapper.ts` matches the exact shape of `vaccinationMapper.ts` / `membershipMapper.ts`:
  ```ts
  import type { Expenses } from "@/types/wallecx/expenses/types";

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
      notes: record.notes,
    };
  }
  ```
  Note: `receipt` is NOT included in the update mapper — file fields are handled via FormData append in the manage dialog (Phase 24), matching the existing pattern. The mapper exists to strip read-only fields (id/created/updated/user/collectionId/Name) on plain updates.

### Vitest Spec (EXP-03)
- **D-17:** `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` mirrors `vaccinationMapper.spec.ts` / `membershipMapper.spec.ts`:
  - "strips read-only fields on write" — given a full `Expenses` record, mapper returns only the 5 writable fields
  - "preserves optional fields when present" — notes round-trips
  - "drops optional fields when undefined" — notes absent stays absent
  - At least 5 test cases total, mirroring the contract pattern of the two existing specs
  - Adds to the existing Vitest suite (currently 24 tests; target 29+ after this phase)

### Module Organization
- **D-18:** New directory `src/lib/wallecx/` for v4.0-specific frontend helpers (`currency.ts`, `expenseSchema.ts`). Mapper stays in `src/lib/pocketbase/` to match existing convention (mappers grouped there). Types stay in `src/types/wallecx/expenses/` and `src/types/wallecx/expense-categories/`.

### requestKey Discipline (STATE Invariant Carry)
- **D-19:** When Phase 24/25 query these collections, requestKeys MUST be distinct to prevent PocketBase auto-cancel:
  - `pb.collection('wallecx_expenses').getFullList<Expenses>({ requestKey: 'expenses-getFullList' })`
  - `pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({ requestKey: 'expense-categories-getFullList' })`
  - These keys must not collide with existing `vaccinations-getFullList` / `memberships-getFullList` keys. Phase 23 doesn't query the collections itself but locks the keys in CONTEXT for downstream phases.

### Claude's Discretion
- Whether to add a PocketBase compound index `(user, expense_date)` for read-path query performance — recommended yes, very cheap to add at collection-creation time; phase 25 will benefit
- Whether to add another compound index `(user, category)` for category aggregation — same reasoning
- Exact wording of error messages from Zod safeParse failures — match existing UX style from vaccinationSchema (if it exists) or membershipSchema
- Whether `expenseSchema` exposes its TypeScript type via `z.infer<typeof expenseSchema>` — recommended yes, removes type duplication

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Backend & Type Foundation (EXP-01, EXP-02, EXP-03)

### Roadmap
- `.planning/ROADMAP.md` §Phase 23 — Goal, SC 1–4

### Project State (locked invariants)
- `.planning/STATE.md` §Architectural Invariants — specific collections (not polymorphic vault); 5 per-user PocketBase rules; `@request.data.*` (not `@request.body.*`) for create; requestKey per collection
- `.planning/STATE.md` §Active Blockers / Open Todos — none

### Prior Phase Context (patterns to mirror exactly)
- `.planning/phases/01-backend-frontend-foundation/01-CONTEXT.md` — `wallecx_vaccinations` collection schema, file field convention, mapper + Vitest spec pattern (v1.0 reference)
- `.planning/phases/11-backend-frontend-foundation/11-CONTEXT.md` — `wallecx_memberships` schema with file field, access rule wording, requestKey hygiene (v2.0 reference)

### Auto-Memory
- `~/.claude/projects/.../memory/feedback_pocketbase_v029_rule_syntax.md` — `@request.body.user` returns 404 (not 403); always use `@request.data.user` for create rules (locked memory)

### Files to Create
- `src/types/wallecx/expenses/types.d.ts`
- `src/types/wallecx/expense-categories/types.d.ts`
- `src/lib/wallecx/expenseSchema.ts` (Zod schema for both `expenseSchema` and `expenseCategorySchema`)
- `src/lib/wallecx/currency.ts` (`WALLECX_CURRENCY`, `WALLECX_CURRENCY_LOCALE`, `formatCurrency()`)
- `src/lib/pocketbase/expenseMapper.ts`
- `src/lib/pocketbase/__tests__/expenseMapper.spec.ts`

### Files Untouched
- `src/main.ts`, `src/components/projects/wallecx/WallecxApp.vue` — Phase 24 modifies these to add the tab; Phase 23 only creates the backend + types
- Any other `src/components/projects/wallecx/**` — Phase 24+ scope
- `src/lib/pocketbase/vaccinationMapper.ts`, `membershipMapper.ts` — locked from v1.0/v2.0

### PocketBase Setup (manual / runtime)
- Two new collections are created in the PocketBase admin UI (or via PocketBase Migrations if the project uses them — verify before Phase 23 plan execution). Phase 23's PLAN.md should include a human/admin task documenting the exact PocketBase admin steps to create the collections with the schemas above.

</canonical_refs>

<code_context>
## Existing Code Insights

### What already works (no fix needed)
- Per-user isolation pattern is proven in `wallecx_vaccinations` (v1.0) and `wallecx_memberships` (v2.0) — same rules apply verbatim to both new collections
- File field handling (EXIF strip + browser-image-compression on upload, short-lived token on view) is reusable from Phase 3 / Phase 13 mappers and ManageVaccination / ManageMembership
- Mapper + Vitest spec pattern is established (`vaccinationMapper.spec.ts` has 10 tests, `membershipMapper.spec.ts` has 11 tests; total 24 across the suite)
- `pb` singleton at `src/lib/pocketbase/index.ts` — used by all collection queries

### What needs creation
- Two PocketBase collections (manual admin step in Phase 23's plan)
- 2 new type modules, 2 new lib files (`expenseSchema.ts`, `currency.ts`), 1 new mapper, 1 new spec file (6 source/test files total)
- Compound indexes on `(user, expense_date)` and `(user, category)` for read-path performance (Phase 25 will appreciate)

### Reusable patterns
- Mapper file shape: `mapToUpdate<X>(record: <X>): { writable subset }` — locked
- Spec file shape: `__tests__/<X>Mapper.spec.ts` — locked
- TypeScript interface extends `RecordModel` + `Add<X>` type alias — locked
- requestKey naming: `<collection-suffix>-<operation>` — locked

</code_context>

<specifics>
## Specific Ideas

### PocketBase admin steps (for Phase 23 plan to document)

```
Create collection `wallecx_expenses`:
  Fields:
    user (relation → users, required, single, no cascade)
    amount (number, required, min 0.01, max 99999999.99)
    expense_date (date, required)
    category (text, required, max 60)
    description (text, required, max 120)
    notes (text, optional, max 2000)
    receipt (file, optional, single, MIME=image/jpeg,image/png,image/webp,application/pdf, MaxSize=10MB)
  Indexes:
    idx_expenses_user_date  ON  (user, expense_date)
    idx_expenses_user_category  ON  (user, category)
  Access rules (5):
    list:   @request.auth.id != "" && user = @request.auth.id
    view:   @request.auth.id != "" && user = @request.auth.id
    create: @request.auth.id != "" && @request.data.user = @request.auth.id
    update: @request.auth.id != "" && user = @request.auth.id
    delete: @request.auth.id != "" && user = @request.auth.id

Create collection `wallecx_expense_categories`:
  Fields:
    user (relation → users, required, single, no cascade)
    name (text, required, max 60)
  Indexes:
    idx_expense_categories_user_name  ON  (user, name) UNIQUE
  Access rules (5):
    list:   @request.auth.id != "" && user = @request.auth.id
    view:   @request.auth.id != "" && user = @request.auth.id
    create: @request.auth.id != "" && @request.data.user = @request.auth.id
    update: @request.auth.id != "" && user = @request.auth.id
    delete: @request.auth.id != "" && user = @request.auth.id
```

### `currency.ts` skeleton

```ts
export const WALLECX_CURRENCY = 'PHP';
export const WALLECX_CURRENCY_LOCALE = 'en-PH';

const formatter = new Intl.NumberFormat(WALLECX_CURRENCY_LOCALE, {
  style: 'currency',
  currency: WALLECX_CURRENCY,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
```

### Two-user smoke test outline (acceptance for Phase 23 SC 1)

```
1. User A creates an expense via API (curl or PocketBase admin):
   POST /api/collections/wallecx_expenses/records  with valid record
2. User A creates a category similarly.
3. Authenticate as User B and:
   - LIST /api/collections/wallecx_expenses/records  → should return 0 records (A's record is invisible)
   - GET /api/collections/wallecx_expenses/records/{A's id}  → 404
   - PATCH /api/collections/wallecx_expenses/records/{A's id}  → 404
   - DELETE /api/collections/wallecx_expenses/records/{A's id}  → 404
   - POST with @request.data.user = A's id  → 400 (rule violation)
4. Repeat for wallecx_expense_categories.
```

</specifics>

<deferred>
## Deferred Ideas

- **PocketBase migrations** as a workflow — manual admin steps are accepted for v4.0. If the project later adopts PocketBase Migrations, this is a one-time refactor.
- **Server-side signup hook** to seed default categories — kept as a future option; v4.0 uses lazy frontend seeding (Phase 24).
- **`expenses.budget_id` relation** — for future budget tracking (EXP-ADV-01). Don't add the field in Phase 23; introduce it when EXP-ADV-01 is implemented.
- **Currency as user setting** — defer to EXP-ADV-03; single hardcoded for v4.0.
- **Soft-delete / audit log** on expenses — out of scope; standard PocketBase delete is fine.

</deferred>

---

*Phase: 23-backend-type-foundation*
*Context gathered: 2026-05-19*
