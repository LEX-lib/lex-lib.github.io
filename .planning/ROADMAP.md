# Roadmap: Lexarium

## Milestones

- ✅ **v1.0 MVP** — Phases 0–4 (shipped 2026-05-12)
- ✅ **v1.1 Vaccine Grouping** — Phases 5–6 (2026-05-12)
- ✅ **v1.2 Search, Sort & View Toggle** — Phases 7–9 (2026-05-13)
- ✅ **v2.0 Membership Cards** — Phases 10–13 (2026-05-14)
- ✅ **v2.1 Mobile PWA** — Phases 14–15 (2026-05-14)
- ✅ **v2.2 Sort & Search for Membership Cards** — Phase 16 (2026-05-15)
- ✅ **v2.3 UX Polish** — Phases 17–18 (2026-05-18)
- ✅ **v3.0 Site-Wide Dark Mode** — Phases 19–22 (2026-05-19)
- ✅ **v4.0 Daily Expense Tracker** — Phases 23–26 (2026-05-22)
- ✅ **v4.1 Gap Resolution & Feature Completeness** — Phases 27–30 (2026-05-25)
- ✅ **v4.2 Budget Recovery & Hardening** — Phases 31–32 (2026-05-26)
- ✅ **v4.3 Wallecx Mobile Optimization** — Phases 33–37 (shipped 2026-06-08; Phase 38/38b cancelled — Wallecx migrated to separate repo)
- 📋 **v5.0 Admin Payment Ledger** — Phases 38–41 (planned)

Archived per-milestone ROADMAP + REQUIREMENTS live in `.planning/milestones/`; shipped log in `.planning/MILESTONES.md`.

## Phases

> **Phase numbering note — 38 is reused, deliberately.** v4.3's Phase 38 (Mobile UAT Sweep + PWA-UAT-01) and Phase 38b (conditional List Virtualization) were both **cancelled outright** on 2026-06-05 when Wallecx migrated to its own repository — neither ever produced a phase directory or any artifact, and `.planning/phases/` is empty as of this roadmap. v5.0 continues the project's phase count from 37 and reuses the freed number 38 for an entirely different, unrelated phase (Boarder Roster Foundation). This is intentional reuse of an available number, not a numbering error.

### v5.0 Admin Payment Ledger (Phases 38–41)

- [x] **Phase 38: Boarder Roster Foundation** - Admin manages a tagged boarder roster in-app, readable by every authenticated user and writable only by the admin (completed 2026-08-04)
- [ ] **Phase 39: Payment Subject Rework** - `paytime_payments` keys off `boarder` instead of `user`, with the createRule risk spiked and resolved before all five rules are finalized together
- [ ] **Phase 40: Admin-on-Behalf Logging** - Admin can log a payment for any active boarder, including one with no account; a non-admin's own flow is unchanged
- [ ] **Phase 41: Admin Ledger & Tag Visibility** - Admin can see and filter the whole house's ledger by month/tag/boarder/category, reached as sub-views of the existing Monthly Report tab; tags are visible everywhere a boarder appears

<details>
<summary>✅ v4.3 Wallecx Mobile Optimization (Phases 33–37) — SHIPPED 2026-06-08</summary>

- [x] Phase 33: Mobile Foundation (3 plans)
- [x] Phase 34: Layout Audit & Touch Targets (3 plans)
- [x] Phase 35: Forms & Dialogs on Small Screens (6 plans)
- [x] Phase 36: Mobile Performance (7 plans)
- [x] Phase 37: PWA Install + Standalone Polish (6 plans) — verified 12/12, UAT 9/9, threat-secured
- [~] Phase 38: Mobile UAT Sweep + PWA-UAT-01 — ❌ CANCELLED (Wallecx migrated to separate repo)
- [~] Phase 38b: List Virtualization (conditional) — ❌ CANCELLED (never triggered)

Full detail: `.planning/milestones/v4.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.0–v4.2 (Phases 0–32) — SHIPPED</summary>

Archived per-milestone in `.planning/milestones/`. See `.planning/MILESTONES.md` for the shipped log.

</details>

## Phase Details

### Phase 38: Boarder Roster Foundation

**Goal**: The admin maintains a tagged boarder roster entirely in-app — the canonical payment subject every later phase builds on — before any payment data depends on it.
**Depends on**: Nothing new (builds on the existing PayTime v1.0 app; first phase of v5.0)
**Requirements**: ROSTER-01, ROSTER-02, ROSTER-03, ROSTER-04, ROSTER-05, ROSTER-06, TAG-01, VERIFY-03
**Success Criteria** (what must be TRUE):

  1. Admin can add a boarder (display name), assign one or more tags, optionally link an existing user account, and later edit or deactivate any of that — entirely from within the app, no PocketBase Admin UI required for day-to-day roster changes.
  2. Every authenticated user, admin or not, can read the boarder roster; an unauthenticated request cannot.
  3. Admin can add a new tag to the vocabulary without a code change or deploy, and the new tag is immediately assignable to a boarder in the app.

> **ROSTER-07 deliberately excluded from this phase.** Deleting-a-boarder-with-history cannot be meaningfully verified here: `paytime_payments.boarder` does not exist until Phase 39, so no payment can reference a boarder and there is no history to protect. A criterion asserting the refusal would pass vacuously while the protection went unexercised. It moves to Phase 39, next to VERIFY-05, which tests the same relation configuration from the other direction.
**Plans**: 3/3 plans executed

Plans:
**Wave 1**

- [x] 38-01-PLAN.md — `paytime_boarders` collection (D-13 paste-back) + tracer slice: admin adds a boarder by display name and sees it under Admin › Boarders, end to end

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 38-02-PLAN.md — boarder identity: in-app tag vocabulary with Zod normalization (ROSTER-02/TAG-01) and the filtered account-link picker (ROSTER-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 38-03-PLAN.md — lifecycle (edit / deactivate / delete) plus the live rule proof: tokenless read returns nothing, tokenless write is refused (VERIFY-03, ROSTER-06)

**UI hint**: yes

### Phase 39: Payment Subject Rework

**Goal**: `paytime_payments` identifies a boarder, not an account, as its subject — migrated additively, proven against the live instance, and finalized as one indivisible five-rule rewrite — with the single existing production record preserved throughout.
**Depends on**: Phase 38 (the roster must exist to be the subject, to backfill against, and to exercise the rule traversal against real boarder rows)
**Requirements**: SUBJ-01, SUBJ-02, SUBJ-03, SUBJ-04, SUBJ-05, SUBJ-06, SUBJ-07, ROSTER-07, VERIFY-01, VERIFY-02, VERIFY-04, VERIFY-05
**Success Criteria** (what must be TRUE):

  1. The `createRule` relation-traversal form (`@request.body.boarder.user = @request.auth.id`) is proven against the live instance before any of the five rules are finalized; if it fails, the documented fallback (admin-bypass on create, relying on the well-documented list/view/delete rule shape plus client-side boarder pinning for defense in depth) is applied instead and the deviation is recorded. Either outcome leaves this phase and every later phase's existence intact — only the rule text changes, per the gate constraint this phase is built around.
  2. Every payment record identifies the boarder it belongs to; the schema change lands additively (optional `boarder` first, then required only after backfill and proof), the one pre-existing production record is backfilled with no data loss, and it remains visible in every view for both its own owner's token and an admin token.
  3. Every payment also records who entered it (`recorded_by`), distinguishable from whose payment it is.
  4. A boarder with a linked account sees exactly their own payments, no more and no fewer; a non-admin cannot create, edit, or delete another boarder's payment even via a hand-crafted request (not just through the UI), and cannot reassign their own payment to a different boarder by editing it; an admin can create, edit, and delete any boarder's payments. All five rules are exercised together in one pass, with both an admin token and a non-admin token, including cross-boarder isolation in both directions — closing the long-open PT-SMOKE-01.
  5. Deleting a user account never destroys payment history, and `cascadeDelete` is confirmed `false` on both `paytime_boarders.user` and `paytime_payments.boarder` by attempting the deletions that would otherwise destroy it.
  6. Attempting to delete a boarder who has payment history is refused rather than allowed or cascaded (ROSTER-07, moved here from Phase 38 — only testable once a payment can actually reference a boarder). Verify with a real payment row pointing at the boarder, not an empty roster entry.

**Plans**: TBD

### Phase 40: Admin-on-Behalf Logging

**Goal**: The admin can log a payment for any boarder in the house, including one who has never had an account, while every non-admin's own logging experience is unchanged.
**Depends on**: Phase 39 (the boarder-subject rules must be live and correct before the write path exercises them)
**Requirements**: BEHALF-01, BEHALF-02, BEHALF-03, BEHALF-04
**Success Criteria** (what must be TRUE):

  1. Admin sees a boarder selector when logging a payment and can choose any active boarder to log it against, including one with no linked account.
  2. A non-admin sees no boarder selector at all; their payment is logged against their own linked boarder automatically, with no way to pick another.
  3. The boarder selector offers only active boarders — an inactive boarder cannot receive a newly logged payment.

**Plans**: TBD
**UI hint**: yes

### Phase 41: Admin Ledger & Tag Visibility

**Goal**: The admin can see and slice the whole house's payment ledger by month, tag, boarder, and category — as sub-views of the existing Monthly Report tab, not a new top-level surface — with a boarder's tags visible everywhere that boarder appears in the admin surfaces.
**Depends on**: Phase 38 (roster + tag vocabulary), Phase 39 (boarder-subject payments to read), Phase 40 (admin-on-behalf data populates the ledger meaningfully)
**Requirements**: LEDGER-01, LEDGER-02, LEDGER-03, LEDGER-04, LEDGER-05, LEDGER-06, LEDGER-07, TAG-02
**Success Criteria** (what must be TRUE):

  1. Admin can see every boarder's payments for a selected month in one ledger view, filterable by tag, by boarder, and by category.
  2. Admin can see at a glance which boarders have not paid a given category for the selected month.
  3. The ledger and roster management are reached as sub-views (By Boarder / Ledger / Boarders) of the existing Monthly Report tab rather than new top-level tabs; a non-admin can reach neither, blocked both in the client and independently by server rules.
  4. A boarder's tags are visible wherever that boarder appears across the admin surfaces (roster, report, ledger) — not only on the roster screen.

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 38. Boarder Roster Foundation | 3/3 | Complete    | 2026-08-04 |
| 39. Payment Subject Rework | 0/TBD | Not started | - |
| 40. Admin-on-Behalf Logging | 0/TBD | Not started | - |
| 41. Admin Ledger & Tag Visibility | 0/TBD | Not started | - |

## Next

Start with `/gsd-plan-phase 38` (Boarder Roster Foundation). **Wallecx remains frozen in a separate repository** — no further Wallecx work happens here.
