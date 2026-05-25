# Phase 31: Re-create wallecx_expense_budgets PocketBase Collection - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Land the locked Phase 28-01 schema for the `wallecx_expense_budgets` collection into the production PocketBase instance via a manual Admin UI action, then verify with a code-side smoke read that the live Wallecx app can `getList` from it without the `404 Missing collection context` runtime error. BUG-01 in the surgical v4.2 milestone.

Scope is the data-side fix only; the toast-copy / try-catch decoupling lives in Phase 32 (BUG-02).

</domain>

<decisions>
## Implementation Decisions

### Verification Method

- **D-01:** Run BOTH verification paths after re-creation — natural app flow (`npm run dev` → /projects/wallecx → Expenses tab) AND an explicit DevTools console one-liner. Both must pass for Phase 31 to be done.
- **D-02:** Console one-liner uses the live `pb` singleton from `src/lib/pocketbase/index.ts` while on `/projects/wallecx` (logged in). Exercises the exact pb client + auth token the app uses — not the PB Admin UI's API preview, not a throwaway script.
- **D-03:** Pass signal is dual: `200 OK + items: []` from the console getList AND zero error toast fires on Expenses tab mount. A failure of either gate stops Phase 31.
- **D-04:** Read-only verification only — do NOT probe a write (create/update/delete) in Phase 31. BUG-01's success criteria are read-side; write-path validation happens organically the next time the user opens Manage Budgets in production.

### Pre-flight Probe

- **D-05:** BEFORE touching the Admin UI, run the same getList console one-liner against the live PB instance and confirm the response is `404 Missing collection context`. This confirms the failure mode is "collection missing" rather than "collection exists with a typo'd rule" — rules out the worse scenario of clobbering a partially-existing collection.
- **D-06:** If the probe instead shows the collection EXISTS with a divergent field or rule, STOP. Capture the actual schema/rules as text, diff against the locked 28-01 spec, then fix in place via Admin UI edits (do NOT delete-and-recreate). Re-run probe to confirm convergence.
- **D-07:** Probe input + response (status code + body excerpt + timestamp) are pasted inline into 31-SUMMARY.md as a "Pre-flight evidence" section — the smoking gun lives next to the fix.

### Plan Structure

- **D-08:** Phase 31 ships as a SINGLE plan file: `31-01-PLAN.md`. Three tasks in sequence: (1) pre-flight probe checkpoint, (2) Admin UI re-creation checkpoint with paste-back acceptance gate, (3) post-fix smoke verification checkpoint (`npm run dev` + console one-liner). One continuous human session; one summary file.
- **D-09:** **The Admin-UI recreation task (Task 2) REQUIRES text paste-back of the actual schema/rules into chat BEFORE the user types the resume signal.** Specifically: the user pastes (a) all 4 field configs (name, type, required flag, constraints) and (b) all 5 rule strings exact text. Executor verifies the paste-back matches the locked spec literally — an "approved" acknowledgment alone is INSUFFICIENT. This is the structural mechanism that prevents Phase 28-01's silent no-op from recurring.
- **D-10:** Rollback path is documented in the plan: if the smoke verify (Task 3) fails, the user deletes `wallecx_expense_budgets` entirely via Admin UI and re-runs Task 2 from scratch. The collection has zero production rows, so deletion is cheap.

### Evidence + Trust-Breakdown Prevention

- **D-11:** 31-SUMMARY.md must contain (a) the pre-flight 404 response, (b) all 4 field configs as a markdown table, (c) all 5 rule strings exact text, (d) the post-fix console getList response (200 + items: []), (e) "no on-mount toast observed" confirmation. Text-only — no screenshots (binary blobs rot on Admin UI redesigns).
- **D-12:** 31-SUMMARY.md includes a "Root cause (Phase 28-01 retrospective)" section linking to `28-01-SUMMARY.md` and `28-01-PLAN.md` Task 1. Future debugging traces back through this link.
- **D-13:** A NEW project-level architectural invariant lands in STATE.md "Accumulated Context" when Phase 31 ships: *"Admin-UI checkpoints MUST require text paste-back of the artifact configured (schema, rules, env vars) AND a downstream code-side smoke verification. Acknowledgment-only ('approved') is insufficient — see BUG-01 post-mortem."* This is enforcement scaffolding for future GSD admin-UI tasks across the project, not just Wallecx.

### Claude's Discretion

- **Plan task types:** Whether tasks 1/2/3 are `checkpoint:human-action` or a single multi-step checkpoint with sub-gates is a planning detail — researcher/planner can choose. The acceptance gates (D-05, D-09, D-03) are what must be enforceable.
- **Exact wording of resume-signal:** "approved" vs "verified" vs "pasted" — planner discretion, as long as it follows the paste-back not just acknowledgment.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked schema source (Phase 28-01)
- `.planning/milestones/v4.1-phases/28-budget-tracking/28-01-PLAN.md` §Task 1 — the verbatim Admin UI steps including the 4 fields and 5 rules. This is the LOCKED spec Phase 31 lands.
- `.planning/milestones/v4.1-phases/28-budget-tracking/28-CONTEXT.md` §Claude's Discretion → Collection schema — original schema decision rationale.

### Failure mode + memory
- `~/.claude/projects/C--GitRepos-lex-lib-github-io/memory/feedback_pocketbase_v029_rule_syntax.md` — PocketBase v0.29.3 uses `@request.body.user` (NOT `@request.data.user`). v0.29.x rule violations return 404 (not 403). Confirmed live in Phase 28.

### Requirements
- `.planning/REQUIREMENTS.md` §BUG-01 — acceptance criteria for the collection exists + smoke read succeeds.
- `.planning/ROADMAP.md` §Phase 31 — 5 success criteria.

### Architectural invariants (STATE.md)
- `.planning/STATE.md` §Accumulated Context → Architectural Invariants → "Server-side per-user isolation is the auth boundary" — why all 5 rules must be configured, not just listRule.
- `.planning/STATE.md` §v4.0 Expense Tracker Foundation (Phase 23) → "@request.body.user on createRule is the correct v0.29.3 syntax" — same finding as the memory note.

### Live consumer code (verification target)
- `src/components/projects/wallecx/ExpensesTab.vue` lines 23–37 — the `loadBudgets()` helper that must succeed after Phase 31. The on-mount fetch (lines 69–78) is the path that currently throws and fires the "Failed to load expenses..." toast.
- `src/lib/pocketbase/index.ts` — the pb singleton the DevTools console one-liner imports.

### Cross-phase context
- `.planning/RETROSPECTIVE.md` — v4.1 retrospective (if it references the trust-based checkpoint failure mode).
- Phase 32 (next): `.planning/ROADMAP.md` §Phase 32 — toast-copy + decoupled try/catch. Phase 31 should NOT modify ExpensesTab.vue; that's Phase 32.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pb` singleton in `src/lib/pocketbase/index.ts` — already used by `loadBudgets()`. The DevTools console one-liner imports the same module so the smoke check exercises the production codepath.
- `ExpensesTab.vue` `loadBudgets()` helper (lines 23–37) — already wired to fire `'Failed to refresh budgets. Please reload the page.'` on catch. After Phase 31 + Phase 32 land together, this catch path is the only way the user sees a budgets-specific toast.
- Existing PB collections (`wallecx_expenses`, `wallecx_expense_categories`, etc.) — same Admin UI / same rule patterns. The user has done this drill 4+ times; muscle memory should be high.

### Established Patterns
- **Per-user isolation rule template** (locked, used by every wallecx_* collection):
  - listRule/viewRule/updateRule/deleteRule: `user = @request.auth.id`
  - createRule: `@request.auth.id != "" && @request.body.user = @request.auth.id`
- **requestKey naming**: `'expense-budgets-getFullList'` — distinct from expenses/categories/memberships/vaccinations keys. STATE.md invariant.
- **Smoke read pattern**: `pb.collection('X').getList({ page: 1, perPage: 1 })` returning 200 + empty items is the canonical "collection exists and is reachable" probe.

### Integration Points
- **No code changes in Phase 31.** This phase is pure PocketBase Admin UI work + verification. `ExpensesTab.vue` already calls `loadBudgets()` — once the collection exists, that call simply succeeds.
- Phase 32 is the code-side counterpart that decouples the budget fetch from the expense fetch. Phase 31 must NOT pre-empt Phase 32's scope.

</code_context>

<specifics>
## Specific Ideas

- The pre-flight probe is short enough to run interactively in chat: user pastes the response, Claude verifies it shows 404, then issues the green light to proceed to Admin UI work.
- The paste-back format in Task 2 should be a markdown table (fields) + a code block (rules) — easy for the executor to diff visually against the locked 28-01 spec.
- After Phase 31 ships, the next Wallecx login on a fresh device should hit the Expenses tab with zero on-mount errors. Phase 32 then guarantees the toast copy is accurate IF the collection ever goes missing again.

</specifics>

<deferred>
## Deferred Ideas

- **Write-path verification (create + update + delete probe)** — Not in BUG-01 scope. Will be exercised organically when the user next opens Manage Budgets. If anything goes wrong, a v4.3 follow-up phase can add it.
- **Code-level collection health check on app boot or Reports tab mount** — Already deferred to v4.3 as HEALTH-01 in REQUIREMENTS.md. Phase 31's trust-breakdown invariant (D-13) is a planning-layer fix; HEALTH-01 is the runtime-layer fix.
- **Phase 28 + 29 UAT walkthrough** — Already deferred to v4.3 as UAT-28-CLOSE + UAT-29-CLOSE. Out of v4.2 surgical scope.
- **Schema-as-code / PocketBase migrations** — Explicitly out of scope in REQUIREMENTS.md. Would be its own larger initiative.

</deferred>

---

*Phase: 31-recreate-budgets-collection*
*Context gathered: 2026-05-25*
