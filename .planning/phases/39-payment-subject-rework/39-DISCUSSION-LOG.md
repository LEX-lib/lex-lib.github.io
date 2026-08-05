# Phase 39: Payment Subject Rework - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-05
**Phase:** 39-payment-subject-rework
**Areas discussed:** Field migration shape, Spike + locked fallback, Read-path continuity, Delete guard + evidence

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Field migration shape | Rename `user` → `recorded_by` vs drop-and-add; required-ness; cascadeDelete is TRUE today so SUBJ-07 fails | ✓ |
| Spike + locked fallback | How the traversal createRule is proven live, and which of the two conflicting documented fallbacks binds | ✓ |
| Read-path continuity | My Payments with a null boarder, MonthlyReport regrouping, where `recorded_by` surfaces | ✓ |
| Delete guard + evidence | ROSTER-07 with no RESTRICT mode; who runs the two-token sweep given Phase 38's credential gap | ✓ |

**User's choice:** all four.
**Notes:** Two scouting findings framed the questions — live `paytime_payments.user` is `cascadeDelete: true` (SUBJ-07 false today, and `user` is already a `users` relation so it is a rename candidate), and ROADMAP vs PROJECT.md record different fallbacks.

---

## Field migration shape

### Q1 — How should `recorded_by` land?

| Option | Description | Selected |
|--------|-------------|----------|
| Rename user → recorded_by | PB rename preserves data; the one prod row's `user` IS the recorder so SUBJ-03 backfills free; ends with 2 relations not 3. Cost: mapper/Zod/types/PaymentLog filter/MonthlyReport expand all break in the same commit | ✓ |
| Keep user, add recorded_by | Smallest schema risk. Cost: three relations, `user` becomes permanently ambiguous, stays required + cascadeDelete:true so SUBJ-07 still fails | |
| Add both, then drop user | No ambiguity at the end, each step independently verifiable. Cost: one more Admin UI step + paste-back; drop is destructive so it lands last | |

**User's choice:** Rename user → recorded_by
**Notes:** Recorded as D-39-01 with reversibility `one-way`.

### Q2 — `recorded_by` constraints after the rename

| Option | Description | Selected |
|--------|-------------|----------|
| cascadeDelete false, optional | History survives; a dead id can be cleared rather than blocking forever; update mapper omits the field | ✓ |
| cascadeDelete false, stay required | Every row provably has a recorder. Cost: reproduces 38-REVIEW WR-01 on the payments collection | |
| You decide | Planner picks within hard constraints | |

**User's choice:** cascadeDelete false, optional
**Notes:** WR-01 mitigation is the deciding factor. Update mapper must not resend `recorded_by`.

### Q3 — Sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Add boarder first, rename last | boarder optional → backfill → prove → client migrates while still sending `user` → one indivisible commit renames + flips + rewrites 5 rules. App never broken | ✓ |
| Rename first, then boarder | Field meaning settled up front. Cost: a window where create is broken (mapper sends a field that no longer exists) | |
| One big-bang change | Fewest paste-backs. Cost: violates the locked additive order; flips `boarder` required before the spike resolves | |

**User's choice:** Add boarder first, rename last

### Q4 — `paytime_payments.boarder` configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Required, no index | maxSelect 1, cascadeDelete false, required after backfill, no index — many payments per boarder is the point | ✓ |
| Required + index on boarder | Lookup speed. Cost: ~7 boarders, index earns nothing measurable, one more paste-back | |
| You decide | Planner picks within hard constraints | |

**User's choice:** Required, no index

---

## Spike + locked fallback

### Q1 — Spike harness

| Option | Description | Selected |
|--------|-------------|----------|
| Throwaway probe collection | Scratch collection with only the traversal createRule, hit with a real non-admin token, then deleted. Zero risk to the live payments collection | |
| Probe on paytime_payments directly | Tests the real target, no scratch artifact. Cost: the live money collection carries a half-migrated rule; a botched revert leaves it wrong | |
| You decide | Planner picks the harness within constraints | ✓ |

**User's choice:** You decide
**Notes:** Constraints locked regardless — real non-admin token (not tokenless, not admin), positive AND negative case, raw response pasted back per D-13.

### Q2 — Which fallback binds

| Option | Description | Selected |
|--------|-------------|----------|
| ROADMAP's admin-bypass | Admin-bypass on create + client-side boarder pinning; only rule text changes, phase shape survives. Cost: SUBJ-05 becomes partially client-only, must be an accepted threat | ✓ |
| PROJECT.md's denormalise | Redundant account-id column so createRule uses already-proven syntax; SUBJ-05 stays fully server-enforced. Cost: reintroduces the renamed field under a new name, two sources of truth, PROJECT.md itself says it changes the phase shape | |
| Decide only if it fires | Re-discuss with the real error in hand. Cost: phase pauses mid-execution needing a human | |

**User's choice:** ROADMAP's admin-bypass
**Notes:** PROJECT.md line 41 is now explicitly superseded — flagged for correction at the next phase transition so no downstream agent re-derives the denormalise fallback.

### Q3 — Closing VERIFY-04 (no boarder reassignment on update)

| Option | Description | Selected |
|--------|-------------|----------|
| isset guard in the rule | Server-side, holds against hand-crafted requests, exactly what PT-RULE-01 asked for. Cost: `:isset` and body-vs-stored comparison are two more unproven syntax forms needing their own probe | ✓ |
| Mapper omission only | Zero new rule syntax. Cost: this IS PT-RULE-01 reproduced on the new field; VERIFY-04 would pass by assertion not probe | |
| Both | Defense in depth; if the `:isset` probe fails the mapper omission is already the floor | |

**User's choice:** isset guard in the rule
**Notes:** `:isset` becomes a second probe target alongside the traversal. `mapToUpdatePayment` won't send `boarder` anyway (it builds an explicit field list), but that is incidental, not the guarantee.

### Q4 — Shape of the five rules

| Option | Description | Selected |
|--------|-------------|----------|
| Uniform traversal + admin OR | One mental model across all five; admin branch everywhere so SUBJ-06 holds without special-casing | ✓ |
| Traversal only, no admin branch | Cost: SUBJ-06 breaks outright — the admin cannot touch another boarder's payments, which is the milestone's premise; also breaks Phase 40 before it starts | |
| You decide | Planner authors exact text within hard constraints | |

**User's choice:** Uniform traversal + admin OR
**Notes:** Hard constraints carried: never `""` (public), never bare `@request.auth.id != ""` on writes, literal `is_admin` on every write branch, `@request.body.` not `@request.data.`, all five pasted back together.

---

## Read-path continuity

### Q1 — My Payments with `myBoarder === null` (5 of 6 accounts today)

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit empty state | Skip the fetch, distinct 'no boarder record linked' copy. Distinguishes 'not set up' from 'nothing logged yet' | ✓ |
| Reuse 'No payments logged yet.' | Zero new copy. Cost: tells the user they have no payments when the truth is they have no identity, and the Log button then fails unexplained | |
| Also hide the Log button | Explicit empty state AND hide/disable Log a Payment. Cost: two branches on one condition | |

**User's choice:** Explicit empty state
**Notes:** Log a Payment stays visible; the create-path guard was then placed deliberately (see Q3). This is the copy D-38-14 deferred out of Phase 38.

### Q2 — How much of MonthlyReport changes

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal swap to boarder | `expand: "boarder"`, group on `payment.boarder`, label `expand.boarder.name`. Nothing else | ✓ |
| Swap + show recorded_by | Marker where recorded_by differs from the boarder's account. Cost: no admin-on-behalf rows exist until Phase 40, so it ships unexercised | |
| Swap + list boarders with zero payments | Cost: that is LEDGER-05, Phase 41 — scope creep | |

**User's choice:** Minimal swap to boarder

### Q3 — Where the null-boarder create path is handled

| Option | Description | Selected |
|--------|-------------|----------|
| Guard in ManagePayment | Dialog resolves `myBoarder` on open, shows the no-boarder message in place of the form, Save disabled. One owner of the condition, and the seam Phase 40's selector drops into | ✓ |
| Guard at the button | Cheapest. Cost: Phase 40's selector then arrives in a dialog assuming a boarder always exists, so the guard is rewritten one phase later | |
| Pin silently, let it fail | No new branch. Cost: unexplained validation error on the primary write path of a money app | |

**User's choice:** Guard in ManagePayment

### Q4 — requestKeys

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both keys as-is | Same two mount-path fetches, only filters change; invariant already satisfied | ✓ |
| Rename to reflect boarder | Cost: churns a locked invariant + its assertion spec for cosmetic gain | |
| You decide | Planner picks within the invariant | |

**User's choice:** Keep both keys as-is

---

## Delete guard + evidence

### Q1 — What "refused" means for ROSTER-07

| Option | Description | Selected |
|--------|-------------|----------|
| Client pre-check in the roster | Count payments before delete; refuse with a count-naming message and offer Deactivate. Honest about the mechanism, reuses ROSTER-04. Cost: a hand-crafted admin request can still orphan payments — accepted threat | ✓ |
| Drop delete, deactivate only | Nothing to refuse because nothing can delete. Cost: reverses D-38-15 which the user explicitly overrode one phase ago; a typo'd zero-payment boarder becomes permanently stuck | |
| Pre-check + keep delete when clean | Same as option 1 in effect | |

**User's choice:** Client pre-check in the roster
**Notes:** PocketBase relations offer only cascade-or-orphan — there is no RESTRICT mode. Zero-payment boarders still delete freely, preserving D-38-15's intent. Must be recorded as accepted, never claimed as server-enforced.

### Q2 — Not repeating Phase 38's credential gap

| Option | Description | Selected |
|--------|-------------|----------|
| User supplies both tokens | Blocking checkpoint asks for an admin and a non-admin token (or credentials to mint them); executor runs the full sweep and pastes back raw responses. Closes the Phase 38 gap at its root | ✓ |
| You run the sweep manually | No credential sharing. Cost: 10+ cases by hand, transcription is where evidence quality dies | |
| Second non-admin boarder needed too | Option 1 plus an explicit prerequisite link task | |

**User's choice:** User supplies both tokens
**Notes:** The second-linked-boarder prerequisite was then raised separately as a factual gap and settled in Q3 — only one boarder is linked today, so "isolation in both directions" is not currently testable.

### Q3 — Test data setup

| Option | Description | Selected |
|--------|-------------|----------|
| Prerequisite roster task | Link a second existing account to a roster boarder via the Phase 38 Admin › Boarders UI, log one payment per boarder. Re-exercises Phase 38's UI as a side benefit | ✓ |
| Reuse whatever exists | Minimal new data. Cost: the pre-existing prod record becomes a subject in a destructive sweep — the one row SUBJ-02 promises to preserve | |
| You decide | Planner sets it up within constraints | |

**User's choice:** Prerequisite roster task
**Notes:** Constraint carried — the pre-existing `2026-07` electricity record is never a delete-case target; seed payments must be recognisable and disposable.

### Q4 — Proving VERIFY-05

| Option | Description | Selected |
|--------|-------------|----------|
| Throwaway account + boarder | Disposable account + boarder + payment; delete the account (payment survives), delete the boarder (payment survives orphaned). Proves both directions destructively with no real data at risk | ✓ |
| Schema paste-back only | Zero risk. Cost: exactly the acknowledgment-only pattern D-13 forbids; VERIFY-05's wording demands the attempted deletion | |
| Delete a real inactive boarder | No throwaway rows. Cost: destroys real data to prove a flag, and the ROSTER-07 pre-check should be refusing that delete anyway | |

**User's choice:** Throwaway account + boarder
**Notes:** The orphaned test payment needs cleanup.

---

## Claude's Discretion

- The VERIFY-01 / `:isset` spike harness (throwaway collection vs reverted rule on the live collection vs other), within D-39-05's constraints
- Exact text of the five rewritten rules, within D-39-08's hard constraints
- SUBJ-02 backfill mechanics — which boarder the one prod record maps to, who edits it, how it's proven (no migration script; manual edit + D-13 paste-back)
- Whether `boarder` is `required` at the Zod layer, and how `paymentSchema` / types / `paytimePaymentMapper` absorb the rename
- Empty-state and guard copy wording
- Cleanup mechanics for the seed payments and the throwaway rows
- Whether WR-01's dead-relation UX gets user-facing handling in this phase

## Deferred Ideas

- Visible `recorded_by` marker on payment/report rows — Phase 40 (unexercised until admin-on-behalf rows exist)
- Zero-payment / unpaid-boarder rows in the report — LEDGER-05, Phase 41
- Admin boarder selector in `ManagePayment` — BEHALF-01/03, Phase 40
- WR-01 dead-relation user-facing handling — may stay latent this phase
- Server-side enforcement of ROSTER-07 — not deferred, *unavailable* (no RESTRICT in PocketBase)
- Display-name uniqueness on `paytime_boarders` — still not discussed, carried from 38-CONTEXT.md
- PT-AMOUNT-01, PT-FMT-01 — Future Requirements, not v5.0 scope
- Orphan `.claude/worktrees/` vitest duplicates — STATE.md housekeeping; will inflate this phase's test counts if ignored
