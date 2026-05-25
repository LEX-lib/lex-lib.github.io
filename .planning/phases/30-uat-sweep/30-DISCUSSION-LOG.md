# Phase 30: UAT Sweep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 30-uat-sweep
**Areas discussed:** Scope confirmation, Plan structure, Failure handling protocol, Outcome documentation & done criteria

---

## Area 1: Scope Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Strict roadmap scope | Only phases 10, 11, 12, 18, 20, 21, 22, 25 — exactly what ROADMAP §Phase 30 success criteria 1-3 list. | ✓ |
| Roadmap + Phase 28 + Phase 29 | 8 named phases plus the two just-shipped (16 additional scenarios). Closes ALL v4.1-era UAT debt. | |
| Roadmap + Phase 14 PWA | Adds Phase 14's 3 pending PWA scenarios. Requires special test setup. | |
| Everything pending (all 8 + 14 + 28 + 29 + 00 + 08) | Closes all known UAT debt including v1.0 leftovers. ~30+ scenarios. | |

**User's choice:** Strict roadmap scope

---

## Area 2: Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| One plan per phase (8 plans) | 30-01 (Phase 10) → 30-08 (Phase 25). Highest granularity; maximizes resumability. | ✓ |
| Grouped by milestone version (4 plans) | v2.0 cluster, v2.3 cluster, v3.0 cluster, v4.0 cluster. Fewer plans; mirrors milestone history. | |
| Single mega-plan | One 30-01-PLAN.md with all 16+ scenarios. Simplest but resumption is harder. | |

**User's choice:** One plan per phase (8 plans)

---

## Area 3: Failure Handling Protocol

| Option | Description | Selected |
|--------|-------------|----------|
| Log all failures, batch fixes at end | Sweep completes regardless of failures; plan emits `gaps_found` if any failed; orchestrator creates fix plans then re-runs failed scenarios. | ✓ |
| Fix inline within same plan | Each failure → diagnose + fix + re-test within the same plan. Tight loop but interleaves QA/dev work. | |
| Stop on first failure, escalate | First failure halts; user decides defer/fix/abort. Most conservative. | |

**User's choice:** Log all failures, batch fixes at end

---

## Area 4a: Outcome Documentation Location

| Option | Description | Selected |
|--------|-------------|----------|
| Update each HUMAN-UAT.md + master 30-UAT-REPORT.md | Per-phase truth lives with the phase; Phase 30 has its own audit trail. | ✓ |
| Only update each HUMAN-UAT.md | No master report — each originating file is canonical. Simpler. | |
| Only write 30-UAT-REPORT.md | Originating files untouched; all results in Phase 30. Cleaner Phase 30 audit but stale source files. | |

**User's choice:** Update each HUMAN-UAT.md + master 30-UAT-REPORT.md

---

## Area 4b: Phase 30 Done Criteria

| Option | Description | Selected |
|--------|-------------|----------|
| All scenarios EXECUTED, failures fixed OR explicitly deferred | Every scenario has a non-pending result; failures fixed or deferred with reason. Matches success criterion 4. | ✓ |
| All scenarios PASS (strict) | Phase 30 only closes when every scenario passes. Risk: can't-reproduce-on-this-environment blocks ship. | |
| All scenarios EXECUTED, any outcome acceptable | Doesn't enforce regression-fix requirement; not aligned with success criterion 4. | |

**User's choice:** All scenarios executed, failures fixed or explicitly deferred

---

## Claude's Discretion (areas left to executor/planner)

- Scenario enumeration for Phases 18/20/21/22 (free-form checklist files)
- Format choice when recording in free-form UAT files (append table vs migrate to structured format — D-05 prefers append)
- Fix-plan granularity (one fix plan covering multiple failures vs separate fix plans per concern)
- Test-user / data-seeding instructions per plan

## Deferred Ideas

- Phase 28 + 29 UAT (16 scenarios) — defer to future cycle
- Phase 14 PWA UAT (3 scenarios) — defer; needs real iOS / DevTools setup
- Phase 00 + 08 v1.0 UAT — defer indefinitely
- Migrating older free-form UAT files to structured format
- Automated UAT harness (Playwright/Cypress)
- Cross-phase deferred-items dashboard
