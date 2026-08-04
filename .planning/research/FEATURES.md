# Feature Research

**Domain:** Admin-on-behalf payment ledger for a small (~6-person) single-house shared-cost tracker (boarding-house rent/utilities) — PayTime v5.0
**Researched:** 2026-08-04
**Confidence:** MEDIUM (converging patterns across multiple independent app categories — roommate splitters, landlord rent-collection tools, guest/account-linking systems — but individual sources are vendor blogs/app-store listings, not case studies of a house this size; no source addresses a 6-person single-deployment tool directly, so patterns are extrapolated down in scale)

> **Supersedes:** the previous contents of this file (v4.3 Wallecx Mobile Optimization research) — that milestone shipped and Wallecx has since migrated to its own repository. This file now covers PayTime v5.0 only.

## Context Read

This is a **subsequent milestone** on an already-shipped app (PayTime v1.0, shipped outside GSD 2026-08-04). Existing, do NOT re-propose or re-research:
- Per-boarder payment log (category, month covered, date paid, amount, notes, optional screenshot proof) — `PaymentLog.vue` + `ManagePayment.vue`
- Electricity calculator (bill-splitting across main + sub-metered groups) — `electricityCalc.ts`
- Admin-only per-boarder monthly report (who paid what, for a chosen month) — `MonthlyReport.vue`

New capability under research: `paytime_boarders` roster (some boarders have no `users` account), admin logs payments on their behalf, boarders get tags. The deployment is **one real house, ~6 people, one admin (Cedrick), 1 payment record in prod today** — not a multi-tenant SaaS product. That scale is the central constraint on every recommendation below; over-scoping is the explicit risk this research is guarding against.

## Feature Landscape

### Table Stakes (Users Expect These)

Features an admin running this ledger will assume exist. Missing these makes the "admin manages the whole ledger" premise feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Boarder roster with display name + active/inactive status | Every admin-managed-member tool in this class (roommate splitters, rent-collection dashboards) treats "who currently lives here" as the first fact. A boarder who moved out still has payment history; deleting them would break the ledger's past months. | LOW | `paytime_boarders` already scoped in PROJECT.md with display name + optional account link. Add a boolean/status field (`active`) rather than hard delete. |
| Admin can log a payment against any boarder, active or historical | This is the milestone's stated core: not all boarders have accounts. Directly extends the existing `ManagePayment.vue` dialog with a boarder selector. | LOW–MEDIUM | Dependency: existing `ManagePayment.vue` (add/edit dialog) and the `paytime_payments` subject rework (`boarder` FK replacing `user` FK) already decided in Key Decisions. |
| Non-admin sees only their own linked boarder's data | Direct extension of the existing per-user isolation invariant (Constraints: "Per-user isolation enforced server-side"). Every reference app in this class treats "can't see/log someone else's money" as baseline trust. | LOW | Server-side rule rewrite already scoped (`boarder.user = @request.auth.id`) — this research doesn't add new rules, just confirms the expectation is correct. |
| Filter payments/report by month, boarder, category | Already exists for the single-boarder monthly report; admins doing a whole-house view expect the same filters, just widened to "all boarders." Every rent-collection dashboard surveyed (TurboTenant, TenantCloud, RentRedi, Baselane) leads with exactly these three cuts. | LOW–MEDIUM | Dependency: existing `MonthlyReport.vue` query pattern (`month` equality filter, `expand`) — the admin ledger view reuses this, doesn't reinvent it. |
| "Who's paid, who hasn't" at a glance for the current month | The single most consistent finding across every landlord/rent tool surveyed: the dashboard's job #1 is separating paid from unpaid. PROJECT.md's own Core Value statement says the same thing ("the admin being able to see who has and hasn't paid for a given month" must work if everything else fails). | MEDIUM | This is a *computed view*, not new data: cross-reference the boarder roster against `paytime_payments` for the selected month/category. Roster is a hard dependency — can't compute "unpaid" without knowing who's expected to pay. |
| A visible record of who logged an entry (`recorded_by`) once admin-on-behalf exists | Every audit-trail/trust source converges on the same minimum: once more than one person's fingers can touch a row, "who touched it" stops being inferable and has to be recorded. Already flagged as a target field in PROJECT.md. | LOW | One denormalized field set at write time (`recorded_by = @request.auth.id`), no separate audit collection needed at this scale (see Anti-Features). |
| Tags visible on the boarder and filterable in list/report views | Table stakes *given the milestone explicitly asks for tags* — a tag nobody can filter by is decoration, not a feature. Matches the property-management pattern of tagging units/tenants for filtering reports. | LOW–MEDIUM | Depends on the roster existing first; filtering depends on the admin ledger view existing (see below). |

### Differentiators (Competitive Advantage — Relative to "just a spreadsheet")

Not required for the milestone to feel complete, but genuinely valuable given this house's context. None of these need heavy infrastructure — the value here is doing the small thing well, not adding surface area.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fixed, admin-defined tag vocabulary (not free-form) | For 6 people, tags exist to answer "which sub-meter group is this person in?" and "which room?" — a closed, small list (e.g. `Group 1`, `Group 2`, `Sub-meter A`) is more useful for filtering than free text, because free-form tagging fragments on typos/casing exactly the way PROJECT.md already rejected free-text boarder names for the same reason. This directly mirrors the locked decision "Boarders modelled as their own collection... where free text would fragment on typos." | LOW | A `select` field (multi or single) on `paytime_boarders`, not a separate tags collection. A separate tags table with its own CRUD is over-scoped for 6 people and a handful of tags an admin sets once and rarely changes. |
| Bulk entry: log the same category for several boarders in one pass | Genuinely saves the admin repetitive work for house-wide charges (boarding fee, internet) that apply to everyone the same month. This is the one place a 6-person house's admin workflow diverges from a 1:1 payment dialog. | MEDIUM | Dependency: reuses `ManagePayment.vue`'s validation (`paymentSchema.ts`) per row; UI is the new surface, not the data model. Cheapest version: a "log for multiple boarders" mode in the existing dialog that loops the same create call per selected boarder — not a new bulk-import pipeline. |
| Arrears view across multiple months (not just the selected month) | Genuinely useful in a boarding-house setting where someone falls behind by more than one billing cycle — every rent-collection tool surveyed treats multi-month arrears as a real feature, not an edge case. | MEDIUM–HIGH | Needs a boarder × month cross-reference over N months, which is a heavier query/render than the single-month report. Worth scoping only if the admin has actually hit this pain (a boarder genuinely behind) — otherwise it's speculative for a house where, per PROJECT.md, "1 record in prod" exists so far. |
| Running totals per boarder or per category for the selected month | Mild convenience on top of the admin ledger view — a sum row/footer. Cheap once the ledger view itself exists. | LOW | Pure client-side computed sum over the already-fetched payments list; no new PocketBase query. |

### Anti-Features (Commonly Seen Elsewhere, Wrong Fit Here)

Patterns that show up in the reference apps but would be over-scoping for a one-house, 6-person, single-admin deployment. Flagging these explicitly because over-scoping is the stated main risk.

| Feature | Why It Shows Up Elsewhere | Why Problematic Here | Alternative |
|---------|---------------------------|------------------------|-------------|
| Separate audit-log collection with full version diffs (before/after values, compare view) | Compliance-grade audit tools (the kind used for financial reporting/regulated data) always do this — every audit-trail source surveyed assumes a compliance context. | This is one house's boarding-fee tracker with one admin. A `recorded_by` field on the payment row already answers "who logged this" — a full diff-and-compare history is solving a dispute-resolution problem this deployment doesn't have evidence of having. | Ship `recorded_by` + PocketBase's built-in `created`/`updated` timestamps (free, no extra schema). Revisit only if disputes actually happen. |
| Boarder self-serve dispute/flagging workflow ("I didn't pay this, flag for review") | Rent-collection SaaS products build this because they mediate between landlords and tenants who may not trust each other and may never talk face to face. | This is roommates in one house who see each other daily; the stated trust mechanism is "boarder can see their own linked entries" (already table stakes above), not a formal dispute ticketing system. | If a boarder disputes an entry, they tell the admin directly — the existing edit/delete on `ManagePayment.vue` already lets the admin correct it. No new UI needed. |
| Free-form user-defined tags with autocomplete, tag management screen, color-coding, tag merge/rename tooling | Larger multi-tenant property tools build this because they manage many properties/many tags across landlords who don't coordinate with each other. | For 6 boarders and maybe 3–5 tags total, a tag-management screen is solving a scale problem (hundreds of tags, many admins) this house doesn't have. A fixed `select` field the one admin edits via the boarder-edit form covers it. | Admin adds/edits tag options directly on the boarder record or via a short fixed enum in the schema; no dedicated tag-admin screen. |
| Automated reminders, late fees, payment-status notifications | Every landlord rent-collection tool surveyed leads with this — it's the actual product differentiator for tools serving landlords who don't live with their tenants. | This admin lives in the house. The stated core value is *visibility* ("see who has and hasn't paid"), not automated collections enforcement. Automated reminders/late fees are a different product problem (notification infrastructure, policy rules) not asked for in this milestone. | The admin ledger view (paid/unpaid at a glance) already gives the admin what they need to follow up in person or via the house group chat. |
| Automatic, silent account-linking on signup (e.g. match by email/phone and merge automatically) | Some booking/loyalty systems auto-merge guest records into new accounts by matching a known identifier. | Automatic matching risks silently attaching the wrong boarder's history to a new account, and PROJECT.md's decisions already treat this kind of "trust-based, unverified" pattern as the exact failure mode that caused a prior production bug (D-13, BUG-01) — silent automation with no confirm step. | Admin manually sets `boarder.user` link when a roster boarder signs up (a single field edit on an existing admin form) — an explicit, admin-confirmed action, not an automatic matcher. |
| Multi-house / multi-property support (tagging boarders by "which house") | Property-management tools default to this because they're built to manage a portfolio. | There is one house. Adding a "property" or "house" concept is pure speculative scope with zero current need. | Not needed; if a second house ever exists, that's a different milestone's problem, and the schema (`paytime_boarders`, `paytime_payments`) can add a house FK later without touching anything built now. |

## Feature Dependencies

```
paytime_boarders roster (roster fields, tags, active status)
    └──requires──> nothing new (net-new collection)

Admin logs on behalf (boarder selector in ManagePayment.vue)
    └──requires──> paytime_boarders roster
    └──requires──> paytime_payments subject rework (boarder FK replacing user FK) — already decided
    └──requires──> recorded_by field on paytime_payments

Admin ledger view (all boarders, filter by month/tag/boarder/category)
    └──requires──> paytime_boarders roster (tags + names to filter/label by)
    └──requires──> paytime_payments subject rework
    └──enhances──> existing MonthlyReport.vue pattern (same query shape, wider scope)

Paid/unpaid-for-month view
    └──requires──> paytime_boarders roster (need the full expected-payer list, not just who has a payment row)
    └──requires──> Admin ledger view's data fetch (same month-filtered payments)

Bulk entry (log one category for several boarders)
    └──requires──> paytime_boarders roster
    └──enhances──> existing ManagePayment.vue (loops its create path, doesn't replace it)

Tags filterable in list/report
    └──requires──> paytime_boarders roster tags field
    └──requires──> Admin ledger view (the filter has to live somewhere)

Account linking (roster boarder later gets a users account)
    └──requires──> paytime_boarders.user optional FK (already scoped in PROJECT.md)
    └──conflicts with──> automatic/silent matching (anti-feature above — must be an explicit admin action)

Arrears across multiple months
    └──requires──> Admin ledger view
    └──requires──> paytime_boarders roster (active/inactive matters — don't chase arrears from someone who moved out mid-year unless intended)
```

### Dependency Notes

- **Everything in this milestone requires the roster first.** `paytime_boarders` is the foundation collection — tags, admin-on-behalf logging, the ledger view, and paid/unpaid computation all read from it. This matches PROJECT.md's own phase-shape risk note (the relation-traversal rule rewrite must be proven early).
- **The admin ledger view enhances, not replaces, the existing `MonthlyReport.vue`.** They can coexist: the existing per-boarder Panels view is optimized for "look at one boarder's month," the new ledger view is optimized for "look at everyone's month, filtered." Reuse the same PocketBase query pattern (`month` equality, `expand: "boarder"`) rather than building a second bespoke fetch path.
- **Paid/unpaid matrix conflicts with treating the roster as pure history.** Once boarders can be `inactive` (moved out), the "who hasn't paid" computation must decide whether to include inactive boarders for past months (probably yes, for the months they were active) and exclude them going forward (probably yes) — this is a small but real design decision that falls out of the active/inactive field, not a separate feature.
- **Bulk entry enhances `ManagePayment.vue`; it does not need a new bulk-import/CSV pipeline.** The reference apps that do CSV import (SplitMyExpenses) are optimized for personal-finance software connected to bank feeds — a completely different problem than one admin typing the same boarding fee for 6 people once a month.

## MVP Definition

### Launch With (v5.0 — this milestone)

Minimum to deliver "admin keeps the whole house's ledger, logging for boarders without accounts, with tags to slice by."

- [ ] `paytime_boarders` roster: display name, tags (fixed select, not free-form), optional `user` link, active/inactive status — the roster is the dependency root, nothing else works without it
- [ ] `paytime_payments` subject rework: `boarder` FK replaces `user` FK; 5 rules rewritten through the relation; 1 existing record backfilled — already decided, is the load-bearing schema change
- [ ] Admin boarder selector in `ManagePayment.vue`, admin-only; non-admins pinned to their own linked boarder — the literal milestone ask
- [ ] `recorded_by` field set at write time — minimum viable trust/attribution, no separate audit collection
- [ ] Admin ledger view: all boarders' payments for a selected month, filterable by month/tag/boarder/category — directly serves the Core Value statement ("admin being able to see who has and hasn't paid")
- [ ] Tags on the roster, filterable in the ledger view and (if trivial) the existing monthly report — the milestone explicitly asks for tags to make the ledger easy to slice

### Add After Validation (if the admin actually hits the pain)

Not blocking this milestone; add only once real usage shows the need.

- [ ] Bulk entry mode (log one category across several boarders in a single pass) — trigger: admin reports repetitive per-boarder entry for house-wide charges is annoying in practice
- [ ] Running totals/sum footer on the ledger view — trigger: admin wants a quick "total collected this month" without doing mental math
- [ ] Multi-month arrears view — trigger: a real boarder actually falls behind by more than one month (no evidence of this yet — 1 record in prod today)

### Future Consideration (Do Not Build Without New Evidence)

- [ ] Formal dispute/flagging workflow for boarders — defer indefinitely; roommates talking to the admin directly is the existing, sufficient mechanism for a 6-person house
- [ ] Automated reminders / late fees — different product (notification infra), not asked for, no stated need
- [ ] Free-form tag management UI (add/rename/merge/color tags) — defer indefinitely at this scale; a fixed enum the admin edits directly is enough
- [ ] Multi-house support — no second house exists; pure speculative scope

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `paytime_boarders` roster (name, tags, status, optional user link) | HIGH | LOW | P1 |
| `paytime_payments` subject rework + rule rewrite + backfill | HIGH | MEDIUM (relation-traversal risk flagged in PROJECT.md) | P1 |
| Admin boarder selector in `ManagePayment.vue` | HIGH | LOW–MEDIUM | P1 |
| `recorded_by` attribution field | MEDIUM–HIGH (trust, once shared editing exists) | LOW | P1 |
| Admin ledger view with month/tag/boarder/category filters | HIGH | MEDIUM | P1 |
| Tags filterable in ledger/report | MEDIUM–HIGH (this is the stated ask) | LOW–MEDIUM | P1 |
| Paid/unpaid-at-a-glance for current month | HIGH (Core Value literally names this) | MEDIUM (needs roster cross-reference, not just a payments list) | P1 |
| Bulk entry across boarders | MEDIUM | MEDIUM | P2 |
| Running totals | LOW–MEDIUM | LOW | P2 |
| Multi-month arrears view | LOW (no evidence of need yet) | MEDIUM–HIGH | P3 |
| Dispute/flagging workflow | LOW (existing in-person mechanism suffices) | MEDIUM–HIGH | P3 (do not build) |
| Automated reminders/late fees | LOW (wrong product shape for this deployment) | HIGH | P3 (do not build) |
| Free-form tag management UI | LOW (6 people, few tags) | MEDIUM | P3 (do not build) |

**Priority key:**
- P1: Must have for this milestone (v5.0) to deliver its stated goal
- P2: Should have if the admin's actual usage shows the pain, otherwise defer
- P3: Nice to have elsewhere, wrong fit for this deployment — do not build without new evidence

## Competitor Feature Analysis

| Feature | Roommate splitters (Split Patron, Splitie, Cashinator) | Landlord rent-collection tools (TurboTenant, TenantCloud, RentRedi) | Our Approach |
|---------|--------------------------------------------------------|------------------------------------------------------------------------|--------------|
| Members without accounts | Yes — core feature, no login required for added roommates | N/A (tenant portals are usually invited, but landlord still owns the record) | Match the splitter pattern: `paytime_boarders` roster entries need no `users` account; admin manages them directly |
| Admin/owner logs on someone's behalf | Implicit — any member can usually add any expense in these peer tools; no strict "admin-only" concept | Yes — landlord is the sole party who marks rent received | Closer to the landlord model: only the admin can log for boarders without accounts; boarders with accounts log their own, matching the existing self-serve payment log |
| Paid/unpaid dashboard | Weak — these tools show balances owed between people (settle-up), not a paid/unpaid roster view | Strong — this is the primary dashboard view in every tool surveyed | Adopt the landlord-tool framing: paid/unpaid-for-month is the primary admin view, not a settle-up balance |
| Tags/labels for filtering | Not found in roommate splitters | Yes, for unit type/status filtering | Adopt a small fixed-vocabulary tag field on `paytime_boarders`, sized for ~6 people not a portfolio |
| Audit trail / recorded-by | Not surfaced prominently in consumer splitters | Not a headline feature (single-party record-keeper, no shared editing) | Neither reference class needs this as much as we do, because neither has "one person editing rows that represent other people's money" as its core mechanic — `recorded_by` is a genuinely load-bearing addition specific to this milestone's shape |
| Bulk/multi-participant entry | Yes — multi-payer expenses are common (Splitwise, SplitMyExpenses) | Not applicable (rent is typically one tenant, one unit) | Borrow the multi-participant idea but scope it down: a "same category, several boarders" loop over the existing single-entry dialog, not a full multi-payer split engine |
| Guest-to-account linking | Not explicitly documented in the apps surveyed (most treat account-free membership as a permanent option, not a stepping stone) | N/A | Match the general cross-domain pattern (bookings/carts/loyalty): explicit, admin-confirmed link — never silent/automatic matching |

## Sources

- [Best Apps For Managing Roommate Expenses](https://www.marketapts.com/blog/best-apps-splitting-rental-costs/) — MEDIUM confidence (vendor/blog listicle, cross-checked against multiple similar sources)
- [The Best App to Split Expenses with Roommates in 2026 — Split Patron](https://splitpatron.com/f/the-best-app-to-split-expenses-with-roommates-in-2026/) — MEDIUM confidence
- [Cashinator Flatshare Expense Tracker](https://www.cashinator.net/flatshare-expense-tracker/) — MEDIUM confidence
- [TurboTenant Rent Collection App](https://www.turbotenant.com/rent-collection/rent-collection-app/) — MEDIUM confidence
- [TenantCloud Best Rent Collection App](https://www.tenantcloud.com/rent-collection/best-rent-collection-app) — MEDIUM confidence
- [Avail — 12 Best Rent Collection Apps for Landlords](https://www.avail.com/education/articles/8-best-rent-collection-apps-for-landlords) — MEDIUM confidence
- [Landlord Studio — 11 Best Rent Collection Apps](https://www.landlordstudio.com/blog/best-rent-collection-app) — MEDIUM confidence
- [TenantCloud — How do I filter my units?](https://support.tenantcloud.com/en/articles/11934216-how-do-i-filter-my-units) — MEDIUM confidence
- [Splitwin — How to Keep Shared Expense Records for Reimbursements and Disputes](https://splitwin.app/blog/keep-shared-expense-records/) — MEDIUM confidence (directly supports the "activity history identifies the acting member" pattern used for `recorded_by`)
- [Encompass Support — Guest Accounts and the Non-member Merge](https://support.imodules.com/hc/en-us/articles/218262498-Guest-Accounts-and-the-Non-member-Merge) — MEDIUM confidence
- [OwnerRez — Separating or Merging Guest Records](https://www.ownerrez.com/support/articles/separating-merging-guest-records) — MEDIUM confidence
- [Quora — Best practices for merging duplicate user accounts](https://www.quora.com/What-are-the-best-practices-for-merging-duplicate-user-accounts-for-a-website-which-allows-Facebook-Twitter-OpenID-and-other-logins) — LOW confidence (community answer, used only to corroborate a pattern already seen elsewhere)
- [Splitwise (App Store)](https://apps.apple.com/us/app/splitwise/id458023433) — MEDIUM confidence
- [SplitMyExpenses](https://www.splitmyexpenses.com/) — MEDIUM confidence
- Project context: `C:/GitRepos/lex-lib.github.io/.planning/PROJECT.md` (Current Milestone, Core Value, Requirements → Validated, Key Decisions sections) — HIGH confidence (primary source, ground truth for what's already built and already decided)

---
*Feature research for: Admin-on-behalf payment ledger, small single-house boarding tracker (~6 people)*
*Researched: 2026-08-04*
