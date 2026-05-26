# Phase 32: Decouple Budgets Fetch in ExpensesTab.vue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 32-decouple-budgets-fetch
**Areas discussed:** Code structure (reuse vs inline), Toast copy on save-refresh path, isLoading semantics during budgets failure

---

## Pre-Selection: Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Code structure (reuse vs inline) | Reuse `loadBudgets()` or inline a second try/catch in onMounted | ✓ |
| Toast copy on save-refresh path | Different copy for mount vs save-refresh, or single string for both | ✓ |
| isLoading semantics during budgets failure | Clear after expenses succeed, or wait for both fetches | ✓ |

**User's choice:** All three areas selected.

---

## Scope Question: PocketBase Realtime Subscribe

Surfaced by the user as a potential architectural alternative.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Phase 32 minimal — defer realtime | Phase 32 stays scoped to BUG-02 surgical fix; capture realtime subscribe as deferred backlog idea for uniform application across wallecx_* later | ✓ |
| Expand Phase 32 scope to include budgets subscribe | Add budgets-only subscribe to ExpensesTab.vue alongside the try/catch fix | |
| Replace Phase 32 with a broader 'wallecx realtime' phase | Apply subscribe uniformly across all wallecx_* collections; BUG-02 closes as side effect | |

**User's choice:** Keep Phase 32 minimal — defer realtime.
**Notes:** User originally proposed `pb.collection('...').subscribe('*', cb)` on mount/unmount. After surfacing that subscribe does NOT deliver the initial snapshot (the initial getFullList still needs its own try/catch — the BUG-02 root cause is at the initial fetch, not the refresh mechanism) and that introducing realtime in just one collection sets a precedent that ought to be uniform, the user agreed to defer. Captured in CONTEXT.md `<deferred>` section.

---

## Area 1: Code Structure (D-32-1)

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse loadBudgets() + parameterize toast (Recommended) | Single source of truth, zero duplication, distinct copy per call site via `opts: { context: 'mount' \| 'refresh' }` parameter | ✓ |
| Inline second try/catch (no reuse) | ~6 lines duplication but fully independent paths; loadBudgets() unchanged | |
| Reuse loadBudgets() + single 'Failed to load budgets.' for both paths | Simpler than parameterizing; loses 'after save' context for refresh failures | |

**User's choice:** Reuse loadBudgets() + parameterize toast.
**Notes:** Selected via preview content, which locked the function signature `async function loadBudgets(opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }): Promise<void>`. Default `'refresh'` preserves the existing `@budgets-saved="loadBudgets"` call site at line 219 with no change required. Verified via `grep`: `ExpensesReportsView.vue` line 30 declares `'budgets-saved': []` (no payload), so the Vue template binding will call `loadBudgets()` with no args → default param applies.

---

## Area 2: Toast Copy on Save-Refresh (D-32-2)

Implicitly resolved by the Area 1 selected preview, which encoded the exact strings.

| Path | Toast Copy | Locked By |
|------|-----------|-----------|
| Mount-time failure | `'Failed to load budgets.'` | ROADMAP.md success criterion 2 (verbatim lock) |
| Save-refresh failure | `'Failed to refresh budgets after save. Reload to see changes.'` | Area 1 selected preview |
| Expenses failure | `'Failed to load expenses. Pull to refresh or reload the page.'` | Unchanged from current implementation |

**User's choice:** As shown above (via Area 1 preview content).
**Notes:** The save-refresh copy change ("after save. Reload to see changes.") is a slight improvement over the current `'Failed to refresh budgets. Please reload the page.'` — the new wording makes the post-save context explicit so the user understands their save *may* have landed but the in-memory view is stale.

---

## Area 3: isLoading Semantics (D-32-3)

| Option | Description | Selected |
|--------|-------------|----------|
| Clear after expenses succeeds, regardless of budgets (Recommended) | isLoading wraps only the expenses fetch; budgets runs sequentially after; user sees expenses list immediately | ✓ |
| Clear only after BOTH fetches complete (current behavior) | Simpler control flow but a slow/failing budgets keeps the expenses skeleton on screen longer | |
| Run budgets fetch in parallel (fire-and-forget) | Smallest perceived latency but adds promise-handling complexity | |

**User's choice:** Clear after expenses succeeds, regardless of budgets.
**Notes:** Matches the BUG-02 isolation intent — no part of the budgets data path should affect the expenses UX. Selected preview shows the exact `onMounted` structure: expenses-try-finally first, then `await loadBudgets({ context: 'mount' })` after.

---

## Claude's Discretion

- Exact placement of the `opts` param type (inline `{ context: 'mount' | 'refresh' }` vs a named TypeScript type) — execution-time call.
- Whether to add a brief JSDoc / 1-line comment to `loadBudgets` explaining the `context` param.
- Test strategy: add a new unit test for toast branching vs rely on integration smoke. `npm run test:unit` MUST pass either way.

## Deferred Ideas

- **PB realtime subscribe for `wallecx_*` collections** (uniform across all wallecx collections in a future phase — see CONTEXT.md `<deferred>` for full rationale).
