# Phase 31: Re-create wallecx_expense_budgets PocketBase Collection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 31-recreate-budgets-collection
**Areas discussed:** Verification method, Pre-flight probe, Plan structure, Evidence + trust-breakdown prevention

---

## Verification Method

### Q1: Which verification path actually runs for the BUG-01 smoke check?

| Option | Description | Selected |
|--------|-------------|----------|
| Both — app flow + console | npm run dev + Expenses tab confirmation AND console getList one-liner. Dual evidence. | ✓ |
| Natural app flow only | Absence of toast as the sole success signal. | |
| Console one-liner only | Skip running the app; protocol-level only. | |

**User's choice:** Both — app flow + console (recommended)

### Q2: Where do we execute the console one-liner so it exercises the real app codepath?

| Option | Description | Selected |
|--------|-------------|----------|
| DevTools on /projects/wallecx with the live pb singleton | Imports `src/lib/pocketbase/index.ts` from the running dev server; uses the app's real auth token. | ✓ |
| PocketBase Admin UI's API preview panel | Bypasses the app's pb client. | |
| Throwaway /scripts/ node script | More plumbing than needed. | |

**User's choice:** DevTools console on /projects/wallecx with the existing pb singleton (recommended)

### Q3: What's the pass signal we accept for BUG-01?

| Option | Description | Selected |
|--------|-------------|----------|
| 200 OK + items: [] AND no on-mount toast | Both must hold — protocol-level and user-facing evidence. | ✓ |
| Just 200 OK from console | Trust the protocol-level result alone. | |
| Just no on-mount toast | Trust the user-facing signal alone. | |

**User's choice:** 200 OK + items: [] AND no on-mount toast (recommended)

### Q4: Do we also probe create+delete (write path) in Phase 31, or read-only is enough for BUG-01?

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only is enough for BUG-01 | BUG-01 success criteria are read-side; write path exercised organically. | ✓ |
| Also probe a write — insert + delete one budget row | More thorough but expands scope beyond BUG-01. | |

**User's choice:** Read-only is enough for BUG-01 (recommended)

---

## Pre-flight Probe

### Q1: Do we run a pre-flight probe BEFORE touching the Admin UI?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — confirm 404 'Missing collection context' first | 30-second probe rules out the "collection exists with broken rule" scenario. | ✓ |
| No — trust BUG-01 diagnosis, rebuild blind | Faster but risks clobbering partial state. | |

**User's choice:** Yes — confirm 404 'Missing collection context' first (recommended)

### Q2: What if the probe shows the collection DOES exist (e.g., with a typo'd rule)?

| Option | Description | Selected |
|--------|-------------|----------|
| Stop, capture actual schema/rules, fix in place | Diff vs locked spec, edit divergent fields/rules only. Preserves data. | ✓ |
| Delete and re-create from scratch | Clean slate; loses any existing rows. | |
| Stop and re-spec the phase | Treat as new finding, new discuss round. | |

**User's choice:** Stop, capture the actual schema/rules, fix in place (recommended)

### Q3: Where do we record the probe result before continuing?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in 31-SUMMARY.md as 'Pre-flight evidence' | Smoking gun lives next to the fix. | ✓ |
| Just verbally confirm to Claude, no log | Looser audit trail. | |

**User's choice:** Inline in 31-SUMMARY.md as 'Pre-flight evidence' (recommended)

---

## Plan Structure

### Q1: How is Phase 31 broken into plan files?

| Option | Description | Selected |
|--------|-------------|----------|
| Single human-action checkpoint plan | One plan, three sequential checkpoint tasks (probe → recreate → smoke verify). | ✓ |
| Two plans — probe+recreate, then verify | Separates 'did action happen' from 'did fix take'. | |
| Three plans | Probe, recreate, verify each separate. Overkill. | |

**User's choice:** Single human-action checkpoint plan (recommended)

### Q2: How does the plan handle the 'trust-based checkpoint' anti-pattern that caused BUG-01?

| Option | Description | Selected |
|--------|-------------|----------|
| Each Admin-UI task requires paste-back of actual schema/rules text before resume-signal | User pastes field configs + rule strings; executor diffs vs locked spec literally. Acknowledgment alone is insufficient. | ✓ |
| Add a code-side smoke verify task that runs AFTER the human checkpoint with a hard gate | Mechanical verification of the user-claimed state. | |
| Both: paste-back + downstream smoke verify gate | Defense in depth. | |

**User's choice:** Each Admin-UI task requires paste-back of actual schema/rules text before resume-signal (recommended)

**Note:** D-09 in CONTEXT.md effectively combines paste-back (Task 2) AND smoke verify (Task 3) — the table option chosen captures the structural fix, and the smoke verify naturally follows in the single-plan structure (D-08).

### Q3: Does the plan include an explicit rollback path if creation goes sideways mid-way?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — documented rollback: delete the partial collection and re-run from step 1 | Cheap because no production rows. | ✓ |
| No — just 'fix in place and re-verify' | Trusts that Admin UI edits don't introduce drift. | |

**User's choice:** Yes — documented rollback: delete the partial collection and re-run from step 1 (recommended)

---

## Evidence + Trust-Breakdown Prevention

### Q1: What evidence lands in 31-SUMMARY.md as proof the fix took?

| Option | Description | Selected |
|--------|-------------|----------|
| Text paste-back of all 4 fields + 5 rules + console response | Field table + rule code block + 404 probe + 200+empty post-fix + 'no toast' confirmation. Grep-able, durable. | ✓ |
| Screenshots of Admin UI + console | Visual proof but rots on UI redesigns. | |
| Minimal — just 'approved' + console response text | Lighter audit trail. | |

**User's choice:** Text paste-back of all 4 fields + 5 rules + console response (recommended)

### Q2: Do we encode a project-level invariant about trust-based checkpoints?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add to STATE.md Accumulated Context | New v4.2 architectural invariant; enforceable scaffolding for future GSD admin-UI tasks. | ✓ |
| Yes — lighter touch: capture only in Phase 31 RETROSPECTIVE | Less binding for future phases. | |
| No — BUG-01 itself is the consequence; future phases will learn | No structural fix. | |

**User's choice:** Yes — add to STATE.md Accumulated Context (recommended)

### Q3: Should the 31-SUMMARY.md cross-reference Phase 28-01's post-mortem so the silent-failure root cause is permanently linked?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — link to 28-01-SUMMARY.md + 28-01-PLAN.md Task 1 | Future debugging can trace the incident from either end. | ✓ |
| No — 31-SUMMARY.md stands alone | Keep summary focused; retro link can live in milestone retrospective. | |

**User's choice:** Yes — link to 28-01-SUMMARY.md + 28-01-PLAN.md Task 1 (recommended)

---

## Claude's Discretion

- Plan task types (`checkpoint:human-action` vs single multi-step checkpoint with sub-gates) — researcher/planner discretion.
- Exact wording of the resume-signal token — planner discretion, as long as it gates on paste-back not acknowledgment.

## Deferred Ideas

- Write-path verification (create + update + delete probe) — exercised organically post-Phase 32.
- Code-level collection health check on app boot — already deferred to v4.3 as HEALTH-01.
- Phase 28/29 UAT walkthroughs — already deferred to v4.3 as UAT-28-CLOSE / UAT-29-CLOSE.
- Schema-as-code / PocketBase migrations — out of v4.2 scope per REQUIREMENTS.md.
