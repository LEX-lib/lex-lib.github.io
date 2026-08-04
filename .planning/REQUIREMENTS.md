# Requirements: Lexarium — PayTime v5.0 Admin Payment Ledger

**Defined:** 2026-08-04
**Core Value:** PayTime's admin can maintain the boarding house's payment ledger on behalf of every boarder, whether or not that boarder has an account — and each boarder can still record and retrieve their own payments without losing access to them.

## v5.0 Requirements

### Boarder Roster

- [ ] **ROSTER-01**: Admin can add a boarder to the roster with a display name
- [ ] **ROSTER-02**: Admin can assign one or more tags to a boarder
- [ ] **ROSTER-03**: Admin can link a boarder to an existing user account, or leave the boarder unlinked
- [ ] **ROSTER-04**: Admin can mark a boarder inactive, removing them from the boarder selector while keeping their payment history intact
- [ ] **ROSTER-05**: Admin can edit a boarder's display name, tags, and account link
- [ ] **ROSTER-06**: Any authenticated user can read the roster (the selector needs a source, and a boarder must be able to resolve their own record), but only an admin can change it
- [ ] **ROSTER-07**: Deleting a boarder who still has payment history is refused rather than cascading the payments away

### Payment Subject Rework

- [ ] **SUBJ-01**: Every payment record identifies the boarder it belongs to, rather than a user account
- [ ] **SUBJ-02**: The one existing production payment record is backfilled to its boarder with no data loss
- [ ] **SUBJ-03**: Every payment records who entered it, so an admin-entered payment is distinguishable from a self-entered one
- [ ] **SUBJ-04**: A boarder with a linked account sees exactly their own payments — no more, no fewer — in My Payments
- [ ] **SUBJ-05**: A non-admin cannot create, edit, or delete a payment belonging to another boarder, enforced server-side rather than by the UI
- [ ] **SUBJ-06**: An admin can create, edit, and delete payments for any boarder
- [ ] **SUBJ-07**: Deleting a user account never destroys payment history

### Admin-on-Behalf Logging

- [ ] **BEHALF-01**: Admin can choose which boarder a payment is for while logging it
- [ ] **BEHALF-02**: A non-admin sees no boarder selector; their payment is logged against their own linked boarder automatically
- [ ] **BEHALF-03**: Admin can log a payment for a boarder who has no user account at all
- [ ] **BEHALF-04**: The boarder selector offers only active boarders

### Admin Ledger

- [ ] **LEDGER-01**: Admin can see every boarder's payments for a selected month in one list
- [ ] **LEDGER-02**: Admin can filter the ledger by tag
- [ ] **LEDGER-03**: Admin can filter the ledger by boarder
- [ ] **LEDGER-04**: Admin can filter the ledger by category
- [ ] **LEDGER-05**: Admin can see at a glance which boarders have not paid a given category for the selected month
- [ ] **LEDGER-06**: Admin reaches the ledger and roster management as sub-views of the existing Monthly Report tab (By Boarder / Ledger / Boarders), not as new top-level tabs
- [ ] **LEDGER-07**: A non-admin can reach neither the ledger nor roster management — blocked in the client and independently by server rules

### Tags

- [ ] **TAG-01**: Admin can extend the tag vocabulary without a code change or deploy (documented Admin UI step, since tags are a `select` field)
- [ ] **TAG-02**: A boarder's tags are visible wherever that boarder appears in the admin surfaces, not only on the roster screen

### Verification

These exist because the milestone rewrites every access rule on a collection holding real money records. Unverified rules are the milestone's primary failure mode, and a wrong rule surfaces as an empty list rather than an error — so "it looks fine" is not evidence.

- [ ] **VERIFY-01**: The `createRule` relation-traversal form is proven against the live PocketBase instance before rule text is finalized; if it fails, the documented fallback is applied and the deviation recorded
- [ ] **VERIFY-02**: All five rewritten payment rules are exercised end-to-end with both an admin and a non-admin token, including cross-boarder isolation in both directions (this also closes the long-open PT-SMOKE-01)
- [ ] **VERIFY-03**: The roster list rule is confirmed to reject an unauthenticated read (an empty-string rule is *public* in PocketBase, not "unconfigured")
- [ ] **VERIFY-04**: The update rule is confirmed to reject reassigning a payment to a different boarder — closing PT-RULE-01 on the new field rather than reproducing it
- [ ] **VERIFY-05**: `cascadeDelete` is confirmed `false` on both new relations, verified by attempting the deletions that would otherwise destroy history

## Future Requirements

Deferred. Tracked, not in this roadmap.

### Ledger depth

- **LEDGER-F01**: Running totals / sum footer over the filtered set
- **LEDGER-F02**: Bulk entry — log one category across several boarders in a single pass
- **LEDGER-F03**: Multi-month arrears view (who owes across months, not just the selected one)

### Roster depth

- **ROSTER-F01**: Room / unit identifier as a first-class sortable field
- **ROSTER-F02**: Move-in date
- **ROSTER-F03**: Contact info (phone / messenger)

### Carried from PayTime v1.0

- **PT-AMOUNT-01**: Make `amount` required in PocketBase, not only in the browser
- **PT-FMT-01**: Prettier-format the PayTime source files (committed unformatted)
- **PT-MSGR-01**: Messenger bot for logging payments from the house group thread (carries a group-thread feasibility risk)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Formal dispute / flagging workflow | One admin, six people, one house — a conversation resolves this faster than a workflow. `recorded_by` (SUBJ-03) supplies the attribution a dispute would need |
| Separate audit-log or diff collection | `recorded_by` plus PocketBase's `updated` timestamp is proportionate; a full audit trail is compliance tooling for a different product shape |
| Automated reminders / late fees | Requires notification infrastructure the project doesn't have, and social pressure in a six-person house already does this job |
| Free-form tag management UI | Tags are a small admin-curated vocabulary (TAG-01); a management screen for a handful of fixed values is UI for its own sake |
| Automatic account-linking on signup | Silently binding a new signup to a roster entry guesses at identity. ROSTER-03 keeps linking an explicit admin action |
| Multi-house / multi-tenant support | One boarding house. Every pattern borrowed from multi-tenant SaaS costs complexity with no beneficiary here |
| Placeholder `users` records for account-less boarders | Rejected during questioning: pollutes the auth collection and those accounts are technically loginable |
| Free-text boarder names on the payment | Rejected during questioning: typos fragment a boarder's history and tags have nowhere to live |
| Migration script for the backfill | One record. A manual Admin UI edit with D-13 paste-back is smaller than the script that would replace it |
| Fixing `GiftExchangeManage.vue`'s `isSuperUser = isLoggedIn` | A real bug in a different mini-app, surfaced by this milestone's pitfalls research. Worth its own ticket; folding an unrelated app's auth fix into this milestone hides it |
| Any Wallecx work | Migrated to a separate repository 2026-06-05; frozen here |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROSTER-01 | Phase 38 | Pending |
| ROSTER-02 | Phase 38 | Pending |
| ROSTER-03 | Phase 38 | Pending |
| ROSTER-04 | Phase 38 | Pending |
| ROSTER-05 | Phase 38 | Pending |
| ROSTER-06 | Phase 38 | Pending |
| ROSTER-07 | Phase 39 | Pending |
| SUBJ-01 | Phase 39 | Pending |
| SUBJ-02 | Phase 39 | Pending |
| SUBJ-03 | Phase 39 | Pending |
| SUBJ-04 | Phase 39 | Pending |
| SUBJ-05 | Phase 39 | Pending |
| SUBJ-06 | Phase 39 | Pending |
| SUBJ-07 | Phase 39 | Pending |
| BEHALF-01 | Phase 40 | Pending |
| BEHALF-02 | Phase 40 | Pending |
| BEHALF-03 | Phase 40 | Pending |
| BEHALF-04 | Phase 40 | Pending |
| LEDGER-01 | Phase 41 | Pending |
| LEDGER-02 | Phase 41 | Pending |
| LEDGER-03 | Phase 41 | Pending |
| LEDGER-04 | Phase 41 | Pending |
| LEDGER-05 | Phase 41 | Pending |
| LEDGER-06 | Phase 41 | Pending |
| LEDGER-07 | Phase 41 | Pending |
| TAG-01 | Phase 38 | Pending |
| TAG-02 | Phase 41 | Pending |
| VERIFY-01 | Phase 39 | Pending |
| VERIFY-02 | Phase 39 | Pending |
| VERIFY-03 | Phase 38 | Pending |
| VERIFY-04 | Phase 39 | Pending |
| VERIFY-05 | Phase 39 | Pending |

**Coverage:**
- v5.0 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

**Phase summary:**
- Phase 38 (Boarder Roster Foundation): ROSTER-01..06, TAG-01, VERIFY-03 — 8 requirements
- Phase 39 (Payment Subject Rework): SUBJ-01..07, ROSTER-07, VERIFY-01, VERIFY-02, VERIFY-04, VERIFY-05 — 12 requirements

ROSTER-07 sits in Phase 39, not 38: `paytime_payments.boarder` does not exist until Phase 39, so in Phase 38 no payment can reference a boarder and the "refuse to delete a boarder with history" protection has nothing to protect. Verified there alongside VERIFY-05, which exercises the same relation configuration from the other direction.
- Phase 40 (Admin-on-Behalf Logging): BEHALF-01..04 — 4 requirements
- Phase 41 (Admin Ledger & Tag Visibility): LEDGER-01..07, TAG-02 — 8 requirements

---
*Requirements defined: 2026-08-04*
*Last updated: 2026-08-04 after roadmap creation — all 32 v5.0 requirements mapped to Phases 38–41 (100% coverage). Full phase detail in `.planning/ROADMAP.md`.*
