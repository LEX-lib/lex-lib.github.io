# Phase 32: Decouple Budgets Fetch in ExpensesTab.vue - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor `src/components/projects/wallecx/ExpensesTab.vue` so the `wallecx_expense_budgets` fetch in `onMounted` is isolated from the `wallecx_expenses` fetch. A budgets-only failure must NOT fire the expenses toast and must NOT block the expenses list from rendering. Toast copy must accurately identify which collection failed. Closes BUG-02.

**In scope:**
- Restructure the shared try/catch in `onMounted` (lines 61–82) into two independent paths.
- Reuse the existing `loadBudgets()` helper with a parameterized toast based on call-site context.
- Update the save-refresh toast copy to be more specific about post-save context.
- No new files; no API/schema changes; no UI/visual changes.

**Out of scope (deferred):**
- PB realtime subscriptions for any `wallecx_*` collection (see Deferred Ideas).
- Any refactor or change to `wallecx_expenses` fetch path beyond the try/catch split.
- Any change to `ManageBudget.vue`, `ExpensesReportsView.vue`, or `ExpensesListView.vue`.
- Any change to PocketBase collections, schemas, or rules (Phase 31 handled BUG-01 separately).
- Network-tab / offline / PWA behavior beyond what currently exists.

</domain>

<decisions>
## Implementation Decisions

### Code Structure
- **D-32-1: Reuse `loadBudgets()` with a `context` parameter.** Signature becomes `async function loadBudgets(opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }): Promise<void>`. Default `'refresh'` preserves the existing `@budgets-saved="loadBudgets"` call site at line 219 without modification (verified: `ExpensesReportsView.vue` line 30 declares `'budgets-saved': []` — emits no payload). `onMounted` calls `loadBudgets({ context: 'mount' })` explicitly. Single source of truth, zero duplication of the `getFullList` block, distinct toast copy per call site.

### Toast Copy
- **D-32-2a: Mount-time budgets failure toast** = `'Failed to load budgets.'` (locked verbatim by ROADMAP.md §Phase 32 success criterion 2).
- **D-32-2b: Save-refresh budgets failure toast** = `'Failed to refresh budgets after save. Reload to see changes.'` Replaces the current `'Failed to refresh budgets. Please reload the page.'` — the new copy makes the post-save context explicit so a failed refresh after a save tells the user their save *may* have landed but the in-memory state is stale (vs. the load-on-mount case where there is no save to worry about).
- **D-32-2c: Expenses-failure toast** = `'Failed to load expenses. Pull to refresh or reload the page.'` — unchanged from current implementation.

### isLoading Semantics
- **D-32-3: `isLoading` wraps only the expenses fetch in `onMounted`.** `isLoading.value = true` immediately before the expenses `getFullList`; `isLoading.value = false` in the `finally` block of the expenses try/catch. `loadBudgets({ context: 'mount' })` runs sequentially AFTER the expenses block (still inside `onMounted`'s async body), NOT wrapped by `isLoading`. UX rationale: the expenses list (headline data) appears as soon as it's available; a slow or failing budgets fetch does not keep the skeleton on screen. Matches BUG-02's isolation intent — no part of the budgets data path affects the expenses UX.

### Console Error Messages
- **D-32-4: Distinct console.error tags** — `console.error('ExpensesTab: loadBudgets failed', e)` for budgets (already correct at line 35); `console.error('ExpensesTab: getFullList failed', e)` for expenses (already correct at line 78). No change needed — ROADMAP success criterion 4 already satisfied by existing code; the fix only ensures these messages are FIRED on the correct error path (which is what the try/catch split achieves).

### Claude's Discretion
- Exact placement of the `opts` param interface (inline `{ context: 'mount' | 'refresh' }` vs a named TypeScript type) — Claude's call during execution. Inline is fine for a one-call helper.
- Whether to add a brief JSDoc to `loadBudgets` explaining the `context` param — Claude's call. A 1-line comment is OK if the WHY is non-obvious (e.g., "// Mount toast differs from save-refresh toast — see Phase 32 D-32-2").
- Test strategy: whether to add a new unit test for `loadBudgets` toast branching, or rely on integration smoke (npm run test:unit existing 49/49 passing). Claude's call during planning — but `npm run test:unit` MUST still pass after changes (ROADMAP success criterion 5).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 32 inputs
- `.planning/ROADMAP.md` §"Phase 32: Decouple Budgets Fetch in ExpensesTab.vue" — Goal, depends-on, 5 locked success criteria, requirements (BUG-02).
- `.planning/REQUIREMENTS.md` §BUG-02 — Acceptance criteria for the bug closure.
- `.planning/STATE.md` §"Architectural Invariants (locked)" — particularly: (a) "requestKey per collection" lock (`'expenses-getFullList'`, `'expense-budgets-getFullList'` must stay distinct, no collision), (b) Phase 31 D-13 "Admin-UI checkpoints require text paste-back" (not directly applicable — this is a code-only phase — but note the project-wide rigor expectation), (c) "Server-side per-user isolation is the auth boundary" (Phase 31 already verified for `wallecx_expense_budgets`).

### Phase 26 architecture (shell-owns-data pattern)
- `.planning/milestones/v4.1-phases/26-budgets-reports-view/26-02-PLAN.md` — Parent-shell + child-view SFC split that established `ExpensesTab.vue` as a shell owning `expenses` / `budgets` / `isLoading` refs.
- `.planning/milestones/v4.1-phases/26-budgets-reports-view/26-03-PLAN.md` — Introduction of `ExpensesReportsView.vue` with `:budgets` prop and `@budgets-saved` emit.

### Phase 28 architecture (budget data ownership)
- `.planning/milestones/v4.1-phases/28-budget-tracking/28-02-PLAN.md` — `ManageBudget.vue` bulk-upsert pattern (Promise.all over rows, delete-on-zero). Defines the save flow whose post-success emit triggers `loadBudgets` via `@budgets-saved`.

### Phase 31 retrospective (BUG-01 closure — context for the in-flight expenses tab)
- `.planning/phases/31-recreate-budgets-collection/31-01-SUMMARY.md` — Confirms `wallecx_expense_budgets` collection now exists and returns 200 + items:[] for the authenticated user. Phase 32 can assume the happy path works against the live PB instance; the test cases in ROADMAP §Phase 32 success criterion 2 (temporary deletion of the collection to verify isolation) are *manual UAT*, not part of automated tests.

### Project-level
- `CLAUDE.md` — Project tech stack (Vue 3 Composition API, vue-sonner toasts, PocketBase v0.29.x).
- `src/components/projects/wallecx/ExpensesTab.vue` — Target file; current state lines 26–37 (`loadBudgets`), lines 61–82 (`onMounted`), line 219 (`@budgets-saved` consumer).
- `src/components/projects/wallecx/ExpensesReportsView.vue` line 30 — `'budgets-saved': []` emit signature (verifies no-payload, supports D-32-1 default param).
- `src/lib/pocketbase/expenseBudgetMapper.ts` — Documents the `'expense-budgets-getFullList'` locked requestKey (must not change).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`loadBudgets()` helper at `src/components/projects/wallecx/ExpensesTab.vue:26-37`** — already has its own try/catch and the correct console.error tag (`'ExpensesTab: loadBudgets failed'`). The fix extends this with a `context` param; no new helper needed.
- **`vue-sonner` `toast.error(...)` calls** — pattern is established (used at lines 34, 53, 77). No new toast library or pattern.
- **`ExpenseBudget` type** — already imported (`import type { ExpenseBudget } from '@/types/wallecx/expense-budgets/types'`).
- **`'expense-budgets-getFullList'` requestKey** — already defined and locked in STATE.md invariants; no collision risk; reuse verbatim.

### Established Patterns
- **Shell-owns-data + child-prop-down + emit-up** (Phase 26 D-26-2) — ExpensesTab.vue is the shell. `budgets` ref lives in the shell. `ExpensesReportsView` consumes `:budgets` as prop and emits `'budgets-saved'` upward. No new data ownership pattern needed.
- **Single try/catch around `getFullList` + `toast.error` + `console.error`** — the standard PocketBase error handling shape in this project (see lines 26-37, 49-58, 61-82 of the same file). The fix follows this shape exactly, just split.
- **Typed function signature with default option object** — established pattern (e.g., `openReceiptPreview(record: Expenses)` — different signature style but consistent with the project's TypeScript-first stance).

### Integration Points
- **`onMounted` callback** at line 61 — the only place the BUG-02 root cause lives. Single isolated edit.
- **`@budgets-saved="loadBudgets"` consumer at line 219** — must continue working unchanged. Default `context: 'refresh'` parameter ensures this.
- **`ManageBudget.vue` (not edited)** — emits `'saved'` → `ExpensesReportsView.vue` re-emits as `'budgets-saved'` → `ExpensesTab.vue` calls `loadBudgets()` (now `context: 'refresh'`). Phase 32 does NOT touch this chain except at the leaf default-param level.

</code_context>

<specifics>
## Specific Ideas

- **The save-refresh toast wording change ("Failed to refresh budgets after save. Reload to see changes.")** is intentional — it tells the user the save *may* have landed but their in-memory view is now stale. Distinct from the simpler mount-time `"Failed to load budgets."` which implies no prior state to reconcile.
- **No JSDoc/comment cargo-culting.** A 1-line comment on the `context` param is allowed if it disambiguates, but multi-paragraph docblocks are NOT wanted — falls under project convention "default to writing no comments" (CLAUDE.md). The naming is self-documenting.
- **The test for BUG-02 isolation is manual UAT** (success criterion 2's "temporary test: delete collection, observe isolation"). It is NOT an automated test. Automated tests just need to keep passing (npm run type-check, npm run lint, npm run test:unit 49/49). Do not add an integration test that requires the PB instance to have a missing collection.

</specifics>

<deferred>
## Deferred Ideas

- **PB realtime subscribe for `wallecx_*` collections.** Use `pb.collection('wallecx_expense_budgets').subscribe('*', cb)` + `unsubscribe('*')` on mount/unmount instead of `@budgets-saved`-driven refetch. Considered during Phase 32 discussion but rejected as scope creep because: (a) it does not address BUG-02 (the initial `getFullList` on mount still needs its own try/catch since `subscribe` does not deliver an initial snapshot); (b) it sets a new realtime-subscription precedent that ought to be applied uniformly across `wallecx_expenses`, `wallecx_expense_budgets`, `wallecx_expense_categories`, `wallecx_memberships`, `wallecx_vaccinations` rather than ad-hoc on one collection; (c) PWA / offline / reconnect / race-with-save-in-flight semantics need their own design pass. **Recommended for a future phase** (likely v4.3 or later) — uniform realtime treatment across all wallecx collections, including subscribe error handling, unsubscribe lifecycle, and SSE-in-PWA behavior.

</deferred>

---

*Phase: 32-decouple-budgets-fetch*
*Context gathered: 2026-05-26*
