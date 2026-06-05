# Phase 30: UAT Sweep - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute every pending UAT scenario from the eight phases ROADMAP §Phase 30 explicitly names (10, 11, 12, 18, 20, 21, 22, 25), record results in each phase's HUMAN-UAT.md, fix any regressions discovered, and produce a 30-UAT-REPORT.md roll-up that closes v4.1's UAT debt for these phases.

**In scope:**
- 8 phases — exactly what success criteria 1–3 list
- ~16 known pending scenarios (Phase 10: 2; Phase 11: 1; Phase 12: 6; Phase 25: 7) plus an unknown count for Phases 18, 20, 21, 22 (free-form checklists that need a scan to count)
- Recording pass/fail/skipped/blocked per scenario in the originating phase's HUMAN-UAT.md
- Producing 30-UAT-REPORT.md as a single index of all results
- Creating focused regression-fix plans (30-XX-FIX-PLAN.md with `gap_closure: true`) at the end of the sweep for any failures
- Re-running 49+ Vitest tests after each regression fix (zero new failures permitted)
- Closing the v4.1 milestone after Phase 30 ships

**Out of scope:**
- Phase 28 (9 pending) and Phase 29 (7 pending) — just shipped; stay deferred for a future UAT sweep
- Phase 14 (3 PWA scenarios), Phase 00 (1), Phase 08 (4) — v1.0/v2.1 deferrals; remain deferred
- Phases 23, 24 (0 pending — placeholder files only) — nothing to test
- New features or refactors — Phase 30 is QA + targeted fixes only

</domain>

<decisions>
## Implementation Decisions

### Scope

- **D-01:** Phase 30 covers **only the 8 ROADMAP-named phases**: 10, 11, 12, 18, 20, 21, 22, 25. Strict adherence to success criteria 1–3. Phases 28, 29, 14, 00, 08 stay deferred to a future UAT cycle (likely v4.2 or a dedicated UAT milestone).
  - **Rationale:** Matches the original Phase 30 scope when added to roadmap. Avoids scope creep. Phase 28 + 29 are fresh enough that any defects are likely to be caught organically.

### Plan Structure

- **D-02:** **One plan per phase — 8 plans total**: `30-01-PLAN.md` (Phase 10) → `30-08-PLAN.md` (Phase 25). Each plan is a single wave with a single `checkpoint:human-verify` task plus a result-recording task. Each plan has `autonomous: false` and produces its own `30-XX-SUMMARY.md`.
  - **Plan-to-phase mapping (locked):**
    - 30-01 → Phase 10 (Tabs shell + VaccinationsTab extraction) — 2 pending
    - 30-02 → Phase 11 (Backend-frontend foundation for memberships) — 1 pending
    - 30-03 → Phase 12 (Read-path card grid + barcode display + detail) — 6 pending
    - 30-04 → Phase 18 (Dark mode fixes) — unknown count, free-form
    - 30-05 → Phase 20 (Site shell + non-app pages dark mode) — unknown count, free-form
    - 30-06 → Phase 21 (Mini-app dark mode sweep — LexTrack/Larga/Gift Exchange/API Playground) — unknown count, free-form
    - 30-07 → Phase 22 (Wallecx audit) — unknown count, free-form
    - 30-08 → Phase 25 (Read-path list view — expenses toolbar) — 7 pending (archived under `.planning/milestones/v4.0-phases/25-read-path-list-view/`)
  - **Rationale:** Maximizes resumability. Failures localize to one plan. Each phase's history is preserved through its own SUMMARY.md.

### Failure Handling Protocol

- **D-03:** **Batch fixes at end.** During plan execution, the executor keeps walking through scenarios; each result (pass/fail/skipped/blocked) is recorded in the originating phase's HUMAN-UAT.md as the user reports it. The plan does NOT pause for fixes. At plan end:
  - If all scenarios pass → plan completes normally, SUMMARY.md notes 100% pass rate.
  - If any failures → plan returns `gaps_found` status. Orchestrator creates one or more `30-XX-FIX-PLAN.md` files with `gap_closure: true` frontmatter, addressing the specific regressions. Fix plans then execute, then the failed scenarios are re-tested in a follow-up sub-task.
  - **Rationale:** Maximizes signal per UAT session (don't lose context jumping into debugger mid-sweep). Matches success criterion 4 (regression fixes committed before phase close) without forcing the user to context-switch between QA and dev mid-session.
- **D-04:** Fix plans live in the Phase 30 directory (`.planning/phases/30-uat-sweep/30-XX-FIX-PLAN.md`), not in the originating phase's directory. Phase 30 owns the fixes since Phase 30 is the closing phase.

### Documentation & Recording

- **D-05:** **Dual recording.** Both:
  - **In-place updates:** Each originating phase's HUMAN-UAT.md gets `result:` fields filled in. For Phases 18/20/21/22 (older free-form checklist format), append a `## Phase 30 UAT Results` section at the bottom with a table of items + pass/fail. Bump frontmatter `status:` to `approved` (all pass) or keep `partial` (with reason) or `failed`. Bump `updated:` timestamp.
  - **Roll-up report:** `30-UAT-REPORT.md` in the Phase 30 directory containing a table indexed by phase number → scenario count → pass/fail counts → link to the HUMAN-UAT.md and any FIX-PLAN.md.
  - **Rationale:** Per-phase truth stays with the phase; Phase 30 has its own audit trail. Matches the existing project pattern where phase artifacts are self-contained.
- **D-06:** **Phase 25 location handled explicitly.** Phase 25's HUMAN-UAT.md is archived at `.planning/milestones/v4.0-phases/25-read-path-list-view/25-HUMAN-UAT.md`. Plan 30-08 must update this archived file in place (the executor will need the absolute path). 30-UAT-REPORT.md links to the archived location.

### Done Criteria

- **D-07:** **Phase 30 is "complete" when ALL of the following are true:**
  1. Every in-scope scenario has a non-pending result (`passed` / `failed` / `skipped` / `blocked` / `deferred`).
  2. Every `failed` scenario either has a committed regression fix that brings it back to `passed`, OR is explicitly logged in `30-UAT-REPORT.md` under "Deferred Items" with a stated reason (e.g., "needs real iOS device — defer to v4.2").
  3. `npm run test:unit` passes with 49+ tests green AFTER any regression fixes.
  4. `npm run lint` reports no NEW errors (pre-existing VaccinationDetail.vue:5 remains deferred — out of scope).
  5. `npm run type-check` exits 0.
  6. 30-UAT-REPORT.md is committed and reflects the final state.
- **D-08:** **"Deferred with reason" is acceptable.** A scenario that cannot be tested in the current environment (e.g., requires a real iOS device, or a network-isolation setup) can be marked `deferred` with the reason logged in 30-UAT-REPORT.md. Does not block Phase 30 closure. This matches the project's established pattern (v1.0 and v4.0 milestone closes both carried deferred UAT items).

### Claude's Discretion

- **Scenario count for Phases 18/20/21/22.** These four HUMAN-UAT.md files use a free-form checklist format without a structured `## Tests` section or a frontmatter `## Summary` block. The planner / executor should scan each file at plan-creation time and enumerate every distinct `- [ ]` checklist item or numbered test as a discrete scenario to track. If a file is essentially a single PASS/FAIL gate (e.g., "verify dark mode looks correct"), treat it as one scenario.
- **Format migration on free-form UAT files.** When recording results in Phases 18/20/21/22, the executor can either: (a) append a `## Phase 30 UAT Results` table at the bottom (recommended for minimum file churn), or (b) migrate the file to the structured format used by Phases 10/11/12/25. D-05 recommends (a) since the originating phase's checklist style is preserved.
- **Regression-fix-plan granularity.** If failures span multiple unrelated areas (e.g., one dark-mode bug + one toolbar bug), the executor can create two separate fix plans (`30-09-FIX-PLAN.md`, `30-10-FIX-PLAN.md`) — one per concern. If they're related, one fix plan covering both is fine. Planner discretion at fix-plan creation time.
- **Test-user setup guidance.** UAT requires real PocketBase sessions with seeded data (memberships, expenses, vaccinations). The plans should NOT prescribe exact seeding scripts — each plan documents the needed state ("at least 2 memberships with different colors", "expenses across two months") and the user seeds via the live UI before running the scenario.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / Requirements
- `.planning/ROADMAP.md` §Phase 30 — Success Criteria 1-5
- `.planning/REQUIREMENTS.md` §Quality Assurance — QA-01 wording

### Originating UAT Files (in-scope)

#### Structured format (frontmatter + `## Tests` sections)
- `.planning/phases/10-tabs-shell-vaccinationstab-extraction/10-HUMAN-UAT.md` — 2 pending scenarios
- `.planning/phases/11-backend-frontend-foundation/11-HUMAN-UAT.md` — 1 pending scenario
- `.planning/phases/12-read-path-card-grid-barcode-display-and-detail/12-HUMAN-UAT.md` — 6 pending scenarios
- `.planning/milestones/v4.0-phases/25-read-path-list-view/25-HUMAN-UAT.md` — 7 pending scenarios (archived path)

#### Free-form checklist format (no frontmatter, no `result:` fields)
- `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md` — unknown pending count
- `.planning/phases/20-site-shell-non-app-pages/20-HUMAN-UAT.md` — unknown pending count
- `.planning/phases/21-mini-app-dark-mode-sweep/21-HUMAN-UAT.md` — unknown pending count
- `.planning/phases/22-wallecx-audit/22-HUMAN-UAT.md` — unknown pending count

### Locked Invariants (STATE.md)
- `.planning/STATE.md` §Accumulated Context → **Architectural Invariants (locked)** — confirm any regression fixes do not violate (e.g., per-user isolation, requestKey distinctness, card_color format, JsBarcode try/catch)
- `.planning/STATE.md` §Deferred Items — historical record of which items were knowingly deferred; do NOT re-test items already explicitly deferred in earlier milestone closes unless they fall in Phase 30's stated scope

### Test Suite (regression floor)
- `npm run test:unit` — Vitest, jsdom environment, 49 tests across 5 files (must remain green)
- `npm run type-check` — vue-tsc --build (must exit 0)
- `npm run lint` — oxlint + eslint --fix (no NEW errors; pre-existing VaccinationDetail.vue:5 deferred since Phase 12)

### Project Instructions
- `CLAUDE.md` — dev commands, env variables, project conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **HUMAN-UAT.md structured-format template** — Phases 10/11/12/25/27/28/29 all use the same frontmatter + `## Tests` + `result:` pattern. The 30-XX-PLAN.md files can reference `.planning/phases/29-period-comparison/29-HUMAN-UAT.md` as the canonical example.
- **Plan-with-checkpoint:human-verify pattern** — Phase 28 plans (28-01, 28-03) and Phase 29 plan (29-01) all use `checkpoint:human-verify` tasks. The Phase 30 plans mirror this contract: each plan presents the scenarios from the originating phase's HUMAN-UAT.md as the checkpoint payload.
- **Gap-closure plan frontmatter** — `gap_closure: true` in a plan's frontmatter signals the executor that this is a follow-up fix plan. `/gsd-execute-phase 30 --gaps-only` filters to these plans.
- **No new code patterns required** — Phase 30 is mostly a coordination phase. No new components, no schema changes, no new packages.

### Established Patterns

- **Per-phase HUMAN-UAT.md ownership** — each phase's UAT file lives in that phase's directory. Phase 30 modifies these in place; it does not own or move them.
- **Archived phase paths** — Phases 23–26 (v4.0) are archived in `.planning/milestones/v4.0-phases/`. Plans referencing Phase 25 must use the full archived path.
- **Fix plans named 30-XX-FIX-PLAN.md** — to distinguish from the 8 numbered UAT plans (30-01 through 30-08). Fix plans use numbers ≥ 09 to avoid collision.

### Integration Points

- Modifications target:
  - 7 originating phase HUMAN-UAT.md files (in active `.planning/phases/` directories)
  - 1 archived phase HUMAN-UAT.md (under `.planning/milestones/v4.0-phases/25-*/`)
  - New: `.planning/phases/30-uat-sweep/30-UAT-REPORT.md` (master roll-up)
  - New: 8 PLAN.md + 8 SUMMARY.md in `.planning/phases/30-uat-sweep/`
  - Conditional new: 30-XX-FIX-PLAN.md + corresponding source-code fixes IF failures surface
- No changes expected to: PocketBase schema, package.json, build config, deployment config, src/ files (except as needed to fix regressions)

</code_context>

<specifics>
## Specific Ideas

- **Plan ordering preserves chronological context.** 30-01 (Phase 10) is the oldest in scope; 30-08 (Phase 25) is the newest. Running them in numerical order means UAT proceeds from oldest deferral to most recent — failures in older code are less likely to surprise (more code has been written on top of it) and the user can build a rhythm before hitting Phase 25's larger scenario set.
- **30-UAT-REPORT.md schema** (single table; one row per scenario):

  ```
  | Phase | Scenario | Status | Result | Failure Detail | Fix Plan |
  |-------|----------|--------|--------|----------------|----------|
  | 10    | 1 — ...  | passed | -      | -              | -        |
  | 12    | 3 — ...  | failed | -      | <desc>         | 30-09-FIX-PLAN.md |
  ```

  Plus a small summary header (X/Y passed across N phases) and "Deferred Items" section if any.

- **Phase 30 SUMMARY.md (per plan)** — each plan's SUMMARY.md captures: phase covered, scenario count, pass/fail breakdown, link to updated HUMAN-UAT.md, any fix plans created. Mirrors the structure of 28-03-SUMMARY.md.

- **User-driven pacing.** Phase 30 is hands-on QA work; the user should drive execution. The orchestrator (or executor agents) should NOT auto-advance between plans. After each 30-XX plan completes, the user explicitly says "ready for next" or runs `/gsd-execute-phase 30 --wave N+1` (or per-plan invocation).

</specifics>

<deferred>
## Deferred Ideas

- **UAT for Phase 28 + Phase 29** (16 scenarios) — would naturally fit into Phase 30 but the roadmap scope is locked. Defer to a future milestone or a dedicated /gsd-verify-work session.
- **UAT for Phase 14 PWA scenarios** (3 scenarios — Chrome DevTools install, iOS standalone, offline precache) — require special environments (real iOS device, DevTools service-worker tab). Defer to a future cycle.
- **v1.0 deferred UAT** (Phase 00, Phase 08) — historical debt from project inception; lowest risk; defer indefinitely or close as won't-fix in a future cycle.
- **Migrating Phases 18/20/21/22 to structured UAT format** — would standardize the format across the project but adds churn. Defer; D-05's append-table approach handles the format mismatch without migration.
- **Automated UAT harness** (e.g., Playwright tests covering the same scenarios) — large undertaking; would be its own initiative if pursued.
- **Deferred-Items dashboard** — a single page that aggregates pending UAT across all phases at any time. Out of scope.

</deferred>

---

*Phase: 30-uat-sweep*
*Context gathered: 2026-05-25*
