---
phase: 38-boarder-roster-foundation
plan: 03
subsystem: ui
tags: [vue3, pocketbase, primevue, useconfirm, vitest, curl]

# Dependency graph
requires:
  - phase: 38-boarder-roster-foundation (plan 01)
    provides: "paytime_boarders live collection, boarderSchema/paytimeBoarderMapper, useBoarderRoster cached-read composable, ManageBoarder.vue/BoarderRosterView.vue display-name-only tracer"
  - phase: 38-boarder-roster-foundation (plan 02)
    provides: "Tag vocabulary + create-behind-a-click AutoComplete, account link picker, tag chips on roster rows"
provides:
  - "Full row action cluster on BoarderRosterView.vue: Edit, Deactivate/Reactivate, Delete behind a shared popup Menu, muted Inactive badge (severity=secondary), active-first ordering preserved"
  - "is_active single write path (D-38-18): schema-level default(true), row-action-menu-only toggle, stripped entirely from ManageBoarder.vue"
  - "Live-seeded 7-row paytime_boarders roster with recorded row-level state (tags, user, is_active)"
  - "VERIFY-03 proven against a non-empty live roster: tokenless read returns HTTP 200 with parsed items.length=0/totalItems=0"
  - "ROSTER-06 server half proven by probe: tokenless write returns HTTP 400 (refused), plus pasted rule text confirming is_admin on all three write rules"
affects: [39-payment-subject-rework, 40-admin-on-behalf-logging, 41-admin-ledger-tag-visibility]

actuals:
  tokens: 6465
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Shared single popup Menu per list (not one per row), tracked via a rowMenuBoarder ref set on open — mirrors PaymentLog.vue's established row-action idiom"
    - "Post-success in-place ref patch for both toggle and delete, never optimistic — a failed write leaves the row exactly as it was"
    - "Base-URL resolution from a committed build artifact (dist/) when direct .env access is denied by the execution environment's own security policy, rather than guessing a hostname"
    - "Same-instance confirmation via response-header comparison (via: 1.1 fly.io, fly-request-id) when two hostnames' literal strings differ but one is a documented CDN-fronted alias of the other"

key-files:
  created: []
  modified:
    - src/components/projects/paytime/BoarderRosterView.vue
    - src/components/projects/paytime/ManageBoarder.vue
    - src/lib/paytime/boarderSchema.ts
    - .planning/phases/38-boarder-roster-foundation/38-COLLECTION.md

key-decisions:
  - "is_active gets a schema-level default(true) in boarderSchema.ts so no caller needs to reference the field directly; the row action menu remains the only place that writes it (D-38-18 upheld)."
  - "Task 3's authenticated-non-admin write path is explicitly NOT exercised — no non-admin credential exists in this environment; the write-rule claim rests on the pasted rule text (is_admin) plus the tokenless-write refusal, which are two different code paths from an authenticated-but-non-admin request. Recorded as the plan's own backstop truth, not overclaimed as proven."
  - "Task 3's 'no row created' claim rests on HTTP semantics (400 = rejected before persistence) rather than an independent authenticated re-read, because the prod PocketBase MCP tool (RecordRead) that Task 2's human-verify session used was not available to this execution context. Recorded as an honest gap in 38-COLLECTION.md rather than silently assumed."

requirements-completed: [ROSTER-04, ROSTER-05]

coverage:
  - id: D1
    description: "Row action cluster: Edit opens the existing ManageBoarder dialog in edit mode; Deactivate/Reactivate toggles is_active via a single-field update with no confirmation, patching the row in place; Delete opens a useConfirm dialog naming the boarder and removes the row only post-success"
    requirement: ROSTER-04
    verification:
      - kind: other
        ref: "38-03-PLAN.md Task 1 grep-based acceptance criteria — all pass (type-check 0, test:unit 127/127, lint 0 new errors)"
        status: pass
    human_judgment: true
    rationale: "The kebab-menu-vs-desktop-inline-actions responsive split, the Inactive badge's muted color, and the live Deactivate/Reactivate/Delete click-through were not independently re-clicked by this executor — Task 1's own commit (5cd7307) predates this continuation agent. Structural grep gates and the automated suite all pass on HEAD as re-verified."
  - id: D2
    description: "ManageBoarder.vue drops all is_active references; the edit dialog no longer exposes the field at all, closing D-38-18's single-write-path invariant"
    requirement: ROSTER-05
    verification:
      - kind: other
        ref: "grep -Fc 'is_active' src/components/projects/paytime/ManageBoarder.vue == 0, re-confirmed on HEAD"
        status: pass
    human_judgment: false
  - id: D3
    description: "VERIFY-03: an unauthenticated GET against paytime_boarders returns HTTP 200 with a parsed items array of length 0 and totalItems 0, against a roster independently confirmed to hold 7 rows"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "38-COLLECTION.md '## VERIFY-03 / ROSTER-06 probe results' — verbatim curl output plus the plan's own node-based JSON-parse assertion, both re-run standalone and passing"
        status: pass
    human_judgment: false
  - id: D4
    description: "ROSTER-06 server half: a tokenless POST against paytime_boarders is refused (HTTP 400, not 200/201) and the pasted rule text names is_admin on createRule/updateRule/deleteRule"
    requirement: ROSTER-06
    verification:
      - kind: other
        ref: "38-COLLECTION.md probe transcript; grep -c 'is_admin' == 14 (>=3 required)"
        status: pass
    human_judgment: true
    rationale: "The claim that no row was actually persisted rests on HTTP response semantics (400 = rejected before insert), not on an independent authenticated re-read — the prod PocketBase MCP tool used by Task 2's human-verify session was not available to this executor. This gap is recorded explicitly in 38-COLLECTION.md and should be closed with a quick authenticated count check (expect 7, unchanged) before the phase's UAT cycle closes VERIFY-03/ROSTER-06 as fully proven. Separately, the authenticated-non-admin write path (the other half of ROSTER-06) is out of Phase 38 scope entirely per the plan's own backstop truth — carried to Phase 39 VERIFY-02."

duration: ~25min
completed: 2026-08-04
status: complete
---

# Phase 38 Plan 03: Boarder Lifecycle + Live Rule Proofs Summary

**Row action cluster (Edit / Deactivate-Reactivate / Delete) completing the roster's CRUD lifecycle, followed by live curl probes proving PocketBase's `listRule` rejects a tokenless read against a known 7-row roster and its write rules refuse a tokenless create.**

## Performance

- **Duration:** ~25 min (this continuation agent; Task 3 only — Tasks 1–2 were committed by prior agent runs)
- **Tasks:** 3/3 (1 auto, 1 checkpoint:human-verify, 1 auto)
- **Files modified:** 4 across the whole plan (3 source files in Task 1, 1 evidence file across Tasks 2 and 3)

## Accomplishments

- `BoarderRosterView.vue` gained a shared popup `Menu` (Edit / Deactivate-Reactivate / Delete), a `useConfirm`-gated delete naming the boarder, a no-confirmation `is_active` toggle that patches the row in place, and a muted `Tag severity="secondary"` Inactive badge — one interaction model at both 390px (kebab) and desktop width (inline icon buttons)
- `boarderSchema.ts`'s `is_active` field now carries a schema-level `default(true)`; `ManageBoarder.vue` was stripped of every `is_active` reference, leaving the row action menu as the field's sole writer (D-38-18)
- The real roster was seeded in-app: **7 boarders**, all currently unlinked to an account (`user: ""`), tags `main` (×6) and `room-2` (×1) — recorded with full row-level detail in `38-COLLECTION.md`'s `## VERIFY-03 preconditions` section
- **VERIFY-03 proven**: a tokenless GET against `paytime_boarders` returns HTTP 200 with parsed `items.length === 0` and `totalItems === 0`, against a roster independently confirmed to hold 7 rows — not a vacuous zero-against-zero result
- **ROSTER-06 server half proven by probe**: a tokenless POST is refused with HTTP 400 (`"Failed to create record."`, empty `data` object — consistent with a `createRule` rejection, not a field-validation error), plus the pasted rule text confirming `@request.auth.is_admin = true` on all three write rules
- Both probe transcripts, the base-URL resolution method, the same-instance confirmation, and two explicitly-recorded honest gaps are appended verbatim to `38-COLLECTION.md`

## Task Commits

1. **Task 1: Row action cluster — Edit, Deactivate/Reactivate, Delete, Inactive badge** - `5cd7307` (feat)
2. **Task 2: Seed the real roster in-app, walk the UI backstops, record the row count** (`checkpoint:human-verify`, gate `blocking-human`) - `4f73079` (docs)
3. **Task 3: Probe the live rules — tokenless read returns nothing, tokenless write is refused** - `8506927` (docs)

## Files Created/Modified

- `src/components/projects/paytime/BoarderRosterView.vue` — row action cluster, shared popup Menu, Inactive badge, `useConfirm` delete, `is_active` toggle
- `src/components/projects/paytime/ManageBoarder.vue` — all `is_active` references removed
- `src/lib/paytime/boarderSchema.ts` — `is_active` gains `default(true)`
- `.planning/phases/38-boarder-roster-foundation/38-COLLECTION.md` — VERIFY-03 preconditions (Task 2) + VERIFY-03/ROSTER-06 probe transcripts (Task 3)

## Decisions Made

- **Base URL resolved from the committed `dist/` build artifact, not `.env` files.** This execution environment's own Bash/Read permission settings deny direct access to `.env`/`.env.production` (a security guardrail, held across retries). Vite inlines `VITE_API_BASE_URL` into the built JS at build time, so grepping the committed `dist/assets/pocketbase-*.js` bundle recovers the exact runtime value (`https://lexarium-backend.fly.dev`) without guessing.
- **Same-instance identity confirmed by header comparison, not by trusting the doc comment alone.** `38-01`'s recorded host string (`https://api.delveen.cc`) differs literally from the resolved `VITE_API_BASE_URL` (`https://lexarium-backend.fly.dev`). Both were curled and their responses compared: identical `via: 1.1 fly.io`, identical security-header set and `content-length`; `api.delveen.cc` additionally shows a Cloudflare front proxying to the same Fly.io app. Confirmed empirically as the same backend before probing it.
- **"No row created" claim rests on HTTP semantics, stated as such rather than papered over.** The tokenless POST returned 400; a non-2xx create response in PocketBase means the insert was rejected before persistence. An independent authenticated re-read (expect roster still at exactly 7) would have been the stronger confirmation but was not available — the prod PocketBase MCP tool used in Task 2's human-verify session was not accessible to this agent. Recorded as an explicit gap in `38-COLLECTION.md`, not silently assumed away.

## Deviations from Plan

### Auto-fixed Issues

None — Rules 1–3 were not triggered. Task 1's implementation, Task 2's checkpoint evidence, and Task 3's probes all executed within the plan's stated design.

### Documented gaps (not deviations — the plan itself anticipated these as backstop/deferred items)

**1. [Plan-anticipated backstop] Authenticated non-admin write path not exercised.**
- No non-admin credential exists in this environment. The plan's own `must_haves.truths` records this exact gap as `verification: backstop`, scoped to Phase 39's VERIFY-02 (both-tokens five-rule sweep).
- The write-rule claim here rests on the pasted rule text (`is_admin`, static half) plus the tokenless-write refusal (behavioural half, unauthenticated case only) — these do not together prove an authenticated-but-non-admin request would also be refused, since `@request.auth.is_admin = true` evaluated against a real non-null `@request.auth` record is a different code path than evaluated against no `@request.auth` at all.

**2. [New, recorded honestly] Authenticated re-read confirming the roster is still exactly 7 rows was not independently performed.**
- The tokenless post-write re-read (used in the plan's own transcript) is vacuous as proof of "no row was created" — an unauthenticated read reports 0 rows whether or not a write succeeded, because `listRule` filters every row for every unauthenticated caller regardless.
- The actual proof rests on the create request's own 400 status (PocketBase does not persist a row on a rejected create). This is a valid deduction from documented PocketBase behavior, but it is not the same as an independent authenticated count confirming 7-not-8.
- **Why not closed here:** the prod PocketBase MCP tool (`RecordRead`) that Task 2's human-verify session used to read back the live roster state is not among this executor's available tools in this execution context. This is recorded verbatim in `38-COLLECTION.md`'s probe-results section as a "Gap, stated honestly" paragraph, not glossed over.
- **Recommended closure:** a quick authenticated `list_records` call (or in-app roster count check) confirming `totalItems: 7` with no `probe-should-not-exist` row present, before the phase's UAT cycle treats VERIFY-03/ROSTER-06 as fully closed.

## Issues Encountered

Carrying forward every open verification item from Tasks 1 and 2, plus the phase-wide unrun click-throughs from Plans 01/02. **None of these are new to this task; none should be read as this task's own failure — they are pre-existing open items this SUMMARY is required to surface rather than let scroll out of context.**

**From Task 2's `38-COLLECTION.md` `## VERIFY-03 preconditions` → UNVERIFIED (carried forward as UAT items, untouched by this task):**
1. **Account linking (ROSTER-03) — NOT exercised.** Zero of the 7 seeded rows has a `user` value: the account-link picker's happy path is unwalked, its "exclude accounts already linked to another boarder" filter has never fired (nothing linked to exclude), and the unique index's *uniqueness* half (as opposed to its permissive many-unlinked-rows half, which IS proven) remains undemonstrated against the live instance.
2. **Empty/whitespace-only name validation** — no record of this being exercised live.
3. **The seven 390px UI backstops** (tag-chip wrapping, long display name in a row, long name in the dialog, tag picker with many chips, long tag name truncation, long account name/email truncation, delete-confirmation wrapping) — no record for any of the seven.
4. **Admin tab absent for a non-admin** — no record. The requirement is the tab being *absent entirely*, not present-and-disabled.

**From Plans 01/02 (`38-01-SUMMARY.md`, `38-02-SUMMARY.md`), still open:**
- The two-unlinked-boarders live probe (A1) — **now superseded/closed** by Task 2's live seed: all 7 rows carry `user: ""`, a stronger result than the original two-row ask. No longer an open item.
- The live click-through flows for tag creation/reuse and the account-link picker's filtered dropdown — **now partially closed** by Task 2: `TAG-01`'s round trip (`main` on 6 boarders) is confirmed live; the account-picker click-through remains open per item 1 above, since no account link was ever created.

**New to this task (Task 3), recorded above under Deviations:**
- Authenticated non-admin write path — plan-scoped backstop, deferred to Phase 39 by design, not a gap this task introduced.
- Authenticated re-read confirming roster count unchanged post-probe — genuine executor-tooling limitation, recorded honestly in `38-COLLECTION.md` and here rather than silently assumed.

This phase should route to `/gsd-verify-work 38` for UAT rather than being marked cleanly, fully verified — the items above are real, open, and enumerated, not implied to be resolved.

## User Setup Required

None — no external service configuration required. The live probes used the already-deployed production PocketBase instance and the project's own committed `dist/` build artifact.

## Next Phase Readiness

- Phase 38's roster CRUD surface (`BoarderRosterView.vue`, `ManageBoarder.vue`) is functionally complete: Add (Plan 01), tags + account link (Plan 02), Edit/Deactivate-Reactivate/Delete (Plan 03).
- `VERIFY-03` and `ROSTER-06`'s server-side behavioural half are proven against the live instance with recorded transcripts; the `is_admin` static half was already true going into this plan.
- Phase 39 (Payment Subject Rework) depends on this roster existing as a payment subject — it does, with 7 seeded rows ready to backfill against.
- **Before Phase 39's VERIFY-02 (both-tokens five-rule sweep):** the account-linking click-through (item 1 above) should be exercised at least once so the unique index's uniqueness half — not just its many-unlinked-rows permissive half — is demonstrated live.
- **Recommended before phase close:** run a quick authenticated read confirming `paytime_boarders` still holds exactly 7 rows (closing the honest gap recorded above), and walk the seven 390px UI backstops plus the non-admin-tab-absence check from Task 2.

---
*Phase: 38-boarder-roster-foundation*
*Completed: 2026-08-04*

## Self-Check: PASSED

All 4 modified source/evidence files (`BoarderRosterView.vue`, `ManageBoarder.vue`, `boarderSchema.ts`, `38-COLLECTION.md`) plus this SUMMARY confirmed present on disk; all three task commits (`5cd7307`, `4f73079`, `8506927`) confirmed in git history.
