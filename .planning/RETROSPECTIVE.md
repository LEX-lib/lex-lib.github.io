# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v4.0 — Daily Expense Tracker

**Shipped:** 2026-05-22
**Phases:** 4 (23–26) | **Plans:** 9 | **Timeline:** 2 days

### What Was Built
- wallecx_expenses + wallecx_expense_categories PocketBase collections with per-user isolation, Zod schema, expenseMapper, and 9 Vitest tests
- ManageExpense.vue CRUD dialog (Zod safeParse, isSaving guard, EXIF-stripped receipt upload, Dialog/Drawer mobile split, custom category seeding)
- Sortable/filterable/searchable expense list (5 sort modes, category multi-select, date-range, instant search) with receipt preview via AttachmentPreview
- ExpensesReportsView.vue: period selector (Month/Quarter/Year/Custom), Grand Total hero, horizontal bar chart with dark-mode reactivity and prefers-reduced-motion support
- Parent-shell + child-view SFC split pattern (ExpensesTab -> ExpensesListView + ExpensesReportsView) established

### What Worked
- TDD on pure helpers: Writing period.test.ts before period.ts caught the dayjs Q-format issue empirically before it could silently produce wrong quarter labels in production
- Phased plan waves: Phase 26 split into 3 plans (foundation -> shell refactor -> reports view) let each plan stay focused and atomic
- useChartTheme MutationObserver design: Observing document.documentElement for .my-app-dark proved correct first try; dark-mode toggle auto-re-renders chart
- SFC extraction pattern: Extracting ExpensesListView.vue in Plan 26-02 before Plan 26-03 added the Reports view made the final wiring trivially simple
- WR code review fixes in same phase: expenseMapper WR-01/WR-02/WR-03 addressed in Phase 24, not deferred; prevented compound bugs in later phases

### What Was Inefficient
- REQUIREMENTS.md traceability not updated post-phase: EXP-04/05/06 and EXP-11/12/13 remained Pending after their phases shipped; required manual correction at archive time
- dayjs Q-format assumption: RESEARCH.md assumed format([Q]Q YYYY) would work; empirical Node REPL check caught this but it required a mid-plan correction
- 39 deferred artifacts: UAT and verification gaps accumulated from prior milestones; signal that verification should happen sooner per phase

### Patterns Established
- Parent-shell + child-view SFC split: ExpensesTab as data-owning shell; ExpensesListView + ExpensesReportsView as sibling views. Reuse for future Wallecx tabs.
- Chart palette via CSS custom properties: 8 tokens (--color-chart-1..8) declared in both light and dark blocks; useChartTheme reads via getComputedStyle on MutationObserver trigger
- Period state in sessionStorage as YYYY-MM-DD strings: Not Date objects; timezone-stable; rehydrated via dayjs parse on mount
- Invalid range as soft state: role=alert inline message, not a toast/dialog; period selector stays interactive
- 4-state v-if chain discipline: loading -> invalid -> empty -> data; order matters; both sibling views follow this exactly

### Key Lessons
1. Validate plugin token coverage before planning: Query the actual runtime to confirm a library API matches its documentation. dayjs.format(Q) vs .quarter() are documented differently.
2. Keep traceability tables in sync during phase transitions: A stale REQUIREMENTS.md at milestone close adds cleanup work
3. Phased SFC extraction pays dividends immediately: Extracting sibling views as a dedicated plan step makes subsequent plans trivially focused
4. MutationObserver on html not body for this project: .my-app-dark lives on document.documentElement

### Cost Observations
- Model mix: ~100% Sonnet 4.6
- Sessions: 2-3 sessions (split by Windows restart mid-Phase 26)
- Notable: 78 commits in 2 days; type-check + 49 tests green throughout; no rework commits needed

---

## Milestone: v4.1 — Gap Resolution & Feature Completeness

**Shipped:** 2026-05-25
**Phases:** 4 (27–30) | **Plans:** 15 | **Timeline:** 4 days

### What Was Built
- Phase 27: WR-01/02 (mapToUpdateExpense notes conditional spread + test assertion) + WR-03 (expense_date Zod calendar validation via dayjs .refine + strict:true); EXPORT-01 memberships JSON export + EXPORT-02 expenses JSON export
- Phase 28: wallecx_expense_budgets PocketBase collection (per-user, monthly/yearly enum, @request.body.user createRule); ExpenseBudget TypeScript types + AddExpenseBudget helper; expenseBudgetMapper.ts; ManageBudget.vue bulk-upsert modal (Dialog/Drawer, Promise.all create/update/delete-on-zero); ExpensesTab shell budget fetch + ExpensesReportsView Budget vs Actual section + Manage Budgets button
- Phase 29: ExpensesReportsView inline period-over-period comparison line (Month + Quarter coverage; color-coded direction; honest zero-prior handling; U+2212 minus; ARIA role+label)
- Phase 30: Structured UAT sweep across 8 ROADMAP-named phases (10, 11, 12, 18, 20, 21, 22, 25); 80/82 in-scope scenarios passed, 1 deferred (PWA standalone), 0 regressions; BR-2 barcode-black-on-white invariant verified twice; master 30-UAT-REPORT.md audit trail

### What Worked
- **Lean plan-phase for trivial UI additions.** Phase 29 was a single ~50-line modification to ExpensesReportsView; user explicitly chose "pattern-mapper + planner only" (skipping research and UI-spec) and the plan-checker passed 6/6 dimensions on first try. The CONTEXT.md decisions (D-01..D-07) were detailed enough that the planner inherited near-complete implementation guidance.
- **One-plan-per-phase for UAT sweep.** Phase 30's 8 plans (30-01..30-08) gave clean per-phase granularity. Each plan could be paused/resumed independently via `--wave N`. Result-recording protocol was identical across all 8 (per CONTEXT D-05), so the planner produced the set efficiently via a template loop.
- **`auto_advance: true` + acknowledged checkpoints.** Phase 28 and 29 human-verify checkpoints auto-approved (per config + --auto flag) and persisted the scenarios as HUMAN-UAT.md for later testing. Phase 30 then walked through deferred items deliberately. The deferred-then-walked pattern preserved velocity during build phases.
- **Architectural invariants paid off.** v4.1 added a 4th PocketBase collection (`wallecx_expense_budgets`) — the locked requestKey naming, per-user rule pattern, and v0.29.3 syntax invariant from STATE.md meant Plan 28-01 was almost entirely template-driven.

### What Was Inefficient
- **`gsd-tools.cjs` SDK was incomplete.** Many workflow steps reference `gsd-sdk query state.begin-phase`, `phase-plan-index`, `verify.key-links`, `roadmap.update-plan-progress`, `phase.complete` — none of those are registered in the installed CJS CLI. I worked around by managing STATE.md / ROADMAP.md / REQUIREMENTS.md updates manually. This works but is fragile — easy to drift from the workflow's intent.
- **Plan-checker authoring miscount.** Plan 28-03 (Phase 28 Wave 3) included a grep acceptance criterion expecting `expenses-getFullList=2` in ExpensesTab.vue, but the file had only 1 occurrence (the second key in `exportJson` is `expenses-export`, not `expenses-getFullList`). Caught by the executor at runtime and noted in the SUMMARY. A second-pass review of the planner's acceptance criteria against the actual file would have caught it pre-execution.
- **Phase 30 Vector 6 (PWA standalone) noted as deferred only at sweep time, not at planning time.** The plan's Task 1 listed 7 scenarios; the user had to drop V6 mid-walkthrough. With foresight at plan-phase, we could have pre-deferred V6 (acceptable per CONTEXT D-08) and simplified the plan to 6 vectors. Pattern for future UAT sweeps: pre-screen each scenario for environment-feasibility before locking the plan.

### Patterns Established
- **Period-gated section pattern** (`v-if="visibleX.length > 0"` with computed returning empty for excluded periods → DOM absent, not just hidden). Mirrors Phase 28 D-09 → Phase 29 D-01. Now a Wallecx Reports invariant.
- **Status color value-judgment mapping** (`--color-status-error` = bad/over, `--color-status-success` = good/under, `--color-typo-muted` = neutral). Reused across Phase 28 Budget vs Actual and Phase 29 period comparison. Single mental model in the Reports view.
- **UAT recording dual-doc protocol** (per-phase HUMAN-UAT.md updates + master roll-up like 30-UAT-REPORT.md). Works well for sweeps where many phases need pass/fail tracking. Free-form HUMAN-UAT.md files (Phases 18/20/21/22) get a `## Phase 30 UAT Results` appendix rather than format migration — minimum churn.
- **Plan-checker as goal-backward auditor.** Catches Edit-tool anchor drift (line numbers shifting between plan authoring and execution), grep acceptance miscounts, and ensures locked decisions trace to specific tasks. Saved at least one re-plan cycle in Phase 29.

### Key Lessons
1. **`auto_advance: true` is a global preference, not a chain trigger.** The workflow distinguishes between `workflow.auto_advance` (persistent user setting) and `workflow._auto_chain_active` (ephemeral session flag). When invoking `/gsd-discuss-phase` directly without `--chain` or `--auto`, the chain flag stays false even though auto_advance is true — so plan-phase doesn't auto-generate UI-SPEC. I had to set `_auto_chain_active: true` manually to honor the user's intent of auto-chaining. Future: either set the flag at the start of a long auto session or document the distinction.
2. **PocketBase v0.29.3 createRule syntax (`@request.body.user`, NOT `@request.data.user`) is fragile.** Discovered in v4.0 Phase 23 with a follow-up correction in Phase 28. STATE.md invariant in place; all future PocketBase collection plans MUST cite this.
3. **Promise.all bulk upsert is the right pattern for non-critical data.** ManageBudget.vue dispatches concurrent create/update/delete calls; partial-failure acceptable since the parent re-fetches on the 'saved' event. For non-critical personal data (budgets, preferences) this is fine; for financial transactions it would not be.
4. **Deferred-with-reason is acceptable at milestone close.** v4.1 closed with 6 deferred items (3 UAT scenarios from just-shipped phases, 3 verification gaps, plus carry-forwards from v1.0/v4.0). Matches v1.0 and v4.0 close patterns. The pattern works because each deferral has a clear reason logged in STATE.md.

### Cost Observations
- Model mix: ~100% Sonnet 4.6 (executor + verifier + planner + pattern-mapper); occasional Opus calls for inline orchestration when the workflow demanded deeper reasoning
- Sessions: 1 long session split across "build" (Phases 28+29) and "verify" (Phase 30 sweep with 7 batched AskUserQuestion turns)
- Notable: Phase 30 sweep used inline orchestrator-driven AskUserQuestion batches rather than spawning gsd-executor for each plan — saved significant token cost on what was fundamentally a human-verify-and-record loop
- 80+ commits across v4.1; 49/49 tests stayed green throughout; no rework commits

---

## Milestone: v4.2 — Budget Recovery & Hardening

**Shipped:** 2026-05-26
**Phases:** 2 (31–32) | **Plans:** 2 | **Timeline:** 1 build day (~8 hours)

### What Was Built
- Phase 31: Re-created `wallecx_expense_budgets` PocketBase collection in production with locked Phase 28-01 schema via paste-back gated Admin UI flow (pre-flight 404 probe → Task 2 paste-back literal-string compare → Task 3 dual-pass smoke verify). Closes BUG-01. Locked new project-level D-13 architectural invariant in STATE.md ("Admin-UI checkpoints require text paste-back + downstream smoke verify"). Discovered + documented PB v0.29.x count-path bug (D-31-B: `getList()` returns 400 against non-trivial listRule expressions; workaround via `getFullList()` or `skipTotal: true`).
- Phase 32: Refactored `ExpensesTab.vue` `onMounted` into independent try/catches. `loadBudgets()` gained `opts: { context: 'mount' | 'refresh' } = { context: 'refresh' }` parameter with ternary toast copy; `isLoading` wraps only the expenses fetch and clears in `finally` before the sequential budgets fetch. Closes BUG-02. Single file modified (`src/components/projects/wallecx/ExpensesTab.vue`): +6/−8 lines. UAT 1 close-the-loop signal verified via paste-back (toast verbatim `'Failed to load budgets.'`, expenses list rendered, Reports opened, Budget vs Actual absent) + 404 console smoke probe.

### What Worked
- **D-13 invariant designed inside the phase that needed it.** Phase 31's Task 3 Part C was an explicit instruction to inject the new "paste-back + downstream verify" invariant into STATE.md. Treating the workflow-layer fix as part of the phase scope (not a separate process-improvement initiative) meant the invariant landed structurally and was immediately applied to Phase 32's UAT 1 — no separate "set up the discipline first" overhead.
- **Paste-back gate caught a real deviation in Phase 31 Task 2.** User configured stricter rules (`@request.auth.id != "" && user = @request.auth.id`) than the locked spec called for. Literal-string compare surfaced the diff immediately. Outcome: deviation accepted with rationale (D-31-A) — project-wide consistency with other `wallecx_*` collections, strict enhancement. Without paste-back, this would have been a silent divergence between spec and reality.
- **Diagnostic-driven root cause analysis for the Phase 31 Task 3 Part B 400.** When the spec-literal `getList({page:1, perPage:1})` returned 400 against a collection where `getFullList()` returned 200 + empty, three follow-up probes (auth state, getFullList, skipTotal:true) isolated the cause to a PB SDK/server quirk on the totalItems COUNT path. Functional-equivalence waiver (D-31-B) is documented and defensible; not a Phase 31 schema defect.
- **`gsd-discuss-phase` scope guardrail caught PB-REALTIME scope creep cleanly.** During Phase 32 discussion the user proposed switching to PocketBase subscribe. Surfaced that subscribe does NOT solve BUG-02 (initial getFullList still needs its own try/catch) and ought to be applied uniformly. User selected "defer realtime" and the idea was captured to backlog — zero scope creep, idea preserved.
- **Plan-checker caught a cosmetic acceptance criterion miscount with a 1-line fix.** The first PLAN.md draft had an acceptance criterion that grepped for `toast.error('Failed to load budgets.')` literal — which wouldn't match the locked ternary-shaped code (`toast.error(msg)` after a ternary assignment). Plan-checker flagged this as a single warning; fixed inline without re-running the planner. Demonstrates the plan-checker's value even on tiny phases.

### What Was Inefficient
- **`gsd-tools.cjs` SDK still incomplete.** Same finding as v4.1: many workflow steps reference `gsd-sdk query …` commands that aren't registered (`init.execute-phase`, `state.begin-phase`, `phase.complete`, `audit-open`, `roadmap.analyze`, `summary-extract`, `milestone.complete`, etc.). Managed STATE.md / ROADMAP.md / REQUIREMENTS.md updates manually. Works but error-prone — easy to drift from workflow intent (e.g., forgetting a frontmatter field on STATE.md or missing the "git rm REQUIREMENTS.md" step).
- **`workflow.auto_advance: true` config setting kept triggering edge cases.** Strict workflow says "auto-advance to next step when AUTO_CFG is true," but the user was clearly pacing manually (invoking each `/gsd-*` command explicitly). Chose to honor user behavior over strict config interpretation. Worth either toggling `auto_advance: false` for this style of work, or documenting the manual-override pattern more explicitly.
- **Phase 31 Task 2 paste-back gate UX was wordy.** The "paste BOTH artifacts as plain text" instruction generated ~30 lines of paste-back specification before the user even ran the test. Future paste-back gates could be tighter — one canonical paste-back schema, not two separate ones (field table + rules block).

### Patterns Established
- **Paste-back + downstream smoke verify** (D-13 invariant, now project-wide). For any phase that configures a live external artifact (PB collection, env vars, dashboard settings, third-party integration), the checkpoint MUST require the user to paste actual configured values as text AND a code-side smoke probe must exercise the live system. Acknowledgment-only ("approved", "done") is structurally insufficient. This is the explicit response to T-31-05 (process-level threat: trust-based-checkpoint silent no-op).
- **Functional-equivalence waiver with rationale + multi-source proof** (D-31-B precedent). When a spec-literal probe trips on an external-system quirk, prove the underlying semantic three independent ways (here: `getFullList` 200 + empty array; `getList(skipTotal:true)` 200 + items:[]; app-flow no-toast signal) and record the deviation with explicit rationale. Avoids both rubber-stamping and getting stuck on cosmetic spec-vs-reality drift.
- **Optional parameter with default that preserves existing call sites** (D-32-1). When extending a helper used in multiple places, add `opts: { … } = { … }` with the default that matches the most common existing call site. New calls pass explicit context; old calls keep working unchanged. Verified for `loadBudgets()` against the `@budgets-saved` template binding via the Vue emit signature grep.
- **Inline orchestrator execution for tiny single-task autonomous plans.** Phase 32 had 1 plan, 1 task, ~20 lines of changes in a single file. Spawning a gsd-executor worktree agent for that would cost more in worktree setup + merge cleanup than the work itself. Going inline (read PLAN locked_implementation → apply Edits → run type-check/lint/test → grep-verify → commit) was 2–3× faster. Pattern: for `autonomous: true` plans with ≤2 tasks and ≤1 file modified, prefer inline; for everything else, spawn the executor.

### Key Lessons
1. **Process-level threats deserve process-level fixes.** BUG-01's root cause wasn't a code defect — it was a workflow design choice (trust-based "approved" signal) that silently no-op'd. Locking D-13 as a STATE.md invariant turns the lesson into a structural guard rather than a one-time post-mortem note. Future GSD phases inherit the protection automatically.
2. **Spec-vs-reality drift is sometimes the external system's fault, not yours.** PocketBase v0.29.x's count-path bug on non-trivial listRule expressions is a real upstream defect. The right response is to document the diagnostic chain, accept a functional-equivalence waiver with rationale, and capture the workaround pattern for future reference — not to chase a spec-literal that the upstream cannot satisfy.
3. **Surgical milestones can stay surgical if you guard against discussion-time scope creep.** Phase 32's PB-REALTIME suggestion would have been a legitimate v4.3+ feature in its own right but had no place in a 2-phase BUG-02 fix. The discuss-phase scope guardrail (surface the scope-creep tension, present options, capture deferred) worked exactly as designed.
4. **Even tiny plans benefit from the plan-checker.** Phase 32's plan-checker found one warning in a 1-file refactor — a wording miscount in an acceptance criterion. Sub-1-minute fix. The plan-checker isn't only valuable on large phases.

### Cost Observations
- Model mix: ~100% Opus 4.7 (1M context) — the entire milestone (discuss → plan → execute → UAT → close) ran in a single long conversation session inline; subagents (planner + plan-checker) called once each for Phase 32 only; Phase 31 was fully inline (autonomous: false + all human-action checkpoints made spawning impractical).
- Sessions: 1 long session (didn't `/clear` between phases — Opus 4.7 1M context absorbed the full milestone without pressure).
- Notable: 8 commits in one build day; type-check + 49 tests green throughout; no rework commits needed; zero new test files added (test strategy per CONTEXT.md §specifics: BUG-02 isolation is manual UAT, not automated).

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP | 5 | 17 | Initial pattern established (mapper + Vitest + Zod) |
| v2.0 Membership Cards | 4 | 12 | Tabs shell pattern; BarcodeDisplay try/catch |
| v2.1 Mobile PWA | 2 | 8 | PWA architectural invariants locked (prompt-only SW) |
| v3.0 Site-Wide Dark Mode | 4 | 7 | Site-wide theme; useTheme composable; FOUC prevention |
| v4.0 Daily Expense Tracker | 4 | 9 | Parent-shell + child-view SFC split; chart infrastructure; TDD on helpers |
| v4.1 Gap Resolution & Feature Completeness | 4 | 15 | Period-gated UI pattern (v-if DOM-absent); status-color value-judgment mapping; one-plan-per-phase UAT sweep template |
| v4.2 Budget Recovery & Hardening | 2 | 2 | D-13 paste-back + downstream-smoke-verify invariant (workflow-layer mitigation for trust-based-checkpoint silent no-op); inline orchestrator pattern for tiny single-task autonomous plans; functional-equivalence waiver template (D-31-B) |

### Cumulative Quality

| Milestone | Tests | New Tests | Notable |
|-----------|-------|-----------|---------|
| v1.0 | 13 | 13 | First mapper + guard tests |
| v2.0 | 24 | 11 | membershipMapper.spec.ts |
| v4.0 | 49 | 25 | expenseMapper.spec.ts (9) + period.test.ts (16) |
| v4.1 | 49 | 0 | Stable regression floor; new code in v4.1 (~410 LOC) was UI-only — no new mapper unit tests; UAT sweep verified prior phases instead |
| v4.2 | 49 | 0 | Stable regression floor maintained through a surgical 6/−8-line refactor; no new tests added (manual UAT per CONTEXT.md §specifics) |

### Top Lessons (Verified Across Milestones)

1. Server-side collection rules are the real auth boundary: All five PocketBase rules must enforce @request.auth.id ownership. Validated in v1.0, v2.0, v4.0.
2. Direct v-model refs over @primevue/forms for PrimeVue ColorPicker: Issue #8135 means the controlled system ignores initial value. Established v2.0, followed v4.0.
3. requestKey must be distinct per collection: PocketBase auto-cancels identical requestKeys. Three locked keys: vaccinations-getFullList, memberships-getFullList, expenses-getFullList.
4. Phase extraction pays dividends: Extracting VaccinationsTab (v2.0), then ExpensesListView (v4.0) as dedicated plan steps keeps subsequent plans focused.
5. **Period-gated UI sections render via `v-if`, not `display:none`.** Established Phase 28 D-09, reapplied Phase 29 D-01. DOM absence prevents stale content during period switches and keeps mental model simple.
6. **UAT sweep best done one-plan-per-phase.** Phase 30 (v4.1) validated this — 8 plans, each pausable, each producing its own SUMMARY.md, results aggregated into a master roll-up report. Cleaner than mega-plan or milestone-cluster groupings.
