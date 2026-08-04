# Project Research Summary

**Project:** Lexarium — PayTime
**Milestone:** v5.0 Admin Payment Ledger
**Domain:** Admin-managed roster + admin-on-behalf payment write path on an existing per-user-isolated PocketBase mini-app (~6-person boarding house)
**Researched:** 2026-08-04
**Confidence:** MEDIUM overall (HIGH on stack/architecture/pitfalls where grounded in this project's own code and PocketBase's official docs; MEDIUM on features since no source addresses a deployment this small directly; the single most load-bearing technical question is explicitly unresolved — see below)

## Executive Summary

This is a subject-model migration on an already-shipped payment tracker, not a greenfield build. `paytime_payments` currently keys every access rule off `user = @request.auth.id`; v5.0 introduces a `paytime_boarders` roster (some boarders have no `users` account) and rewrites all five rules to traverse `boarder.user = @request.auth.id` instead, while adding an admin-on-behalf write path, a `recorded_by` audit field, tags, and a new admin ledger view. No new npm packages or server upgrades are needed — every capability (tags via a `select` field, ledger filtering via `DataTable`/`MultiSelect`) is covered by the already-installed stack. The architecturally sound placement is to nest the new ledger and roster views inside the existing `MonthlyReport.vue` tab (rebuilt as a shell) as sibling sub-views, mirroring the `ExpensesTab.vue` shell pattern already proven in this codebase, rather than adding a new top-level tab.

The single biggest risk is not features or UI — it's whether PocketBase's relation-traversal syntax actually works the way the design assumes on this project's live v0.29.x instance, specifically for the `createRule`, which must chase a relation off the submitted request body (`@request.body.boarder.user = @request.auth.id`) rather than a stored record. The four research passes did not agree on how confident to be about this, and that disagreement is preserved below rather than averaged away, because it gates the entire access-control design for the milestone's highest-risk phase.

Beyond that gate, the research converges cleanly: the roster is the dependency root for every other feature (tags, admin-on-behalf logging, the ledger, paid/unpaid computation), the update-rule stored-value trap that produced this project's own PT-RULE-01 backlog item will reproduce identically on the new `boarder` field unless closed server-side this time, and `cascadeDelete` must be `false` on both new/changed relations or a routine account/boarder cleanup silently destroys the payment history this app exists to protect. None of these risks require new technology — they require sequencing (schema -> backfill -> rule rewrite -> UI) and disciplined manual Admin-UI verification (this project's existing D-13 paste-back invariant), because the PocketBase schema has no scripted migration path here.

## Key Findings

### Recommended Stack

No new core technology for v5.0 — this is schema + UI work on the existing Vue 3 + PrimeVue 4 + PocketBase (server v0.29.x, JS SDK `^0.26.2`) + Zod + dayjs stack. Tags are a PocketBase `select` field (`maxSelect > 1`, fixed admin-curated vocabulary), not a `json` array (no native array-filter operators) and not a separate tags collection (overkill at ~6 people / a handful of tags). The admin ledger uses already-installed `DataTable` + `Column` with `MultiSelect` as the per-column filter element; `Chips`/`InputChips`/`AutoComplete` are explicitly wrong for tag input because they're built for freeform vocabularies, not a closed admin-curated set. Retargeting the payment record's subject relation must be additive (new `boarder` field alongside the old `user` field, backfill, then drop `user`) — never an in-place relation retarget, which performs no ID remapping and would silently orphan the record.

**Core technologies (deltas only):**
- PocketBase server v0.29.x (unchanged) — relation-rule traversal for `boarder.user` ownership chain
- PocketBase JS SDK `^0.26.2` (unchanged) — `expand: "boarder.user"` extends the already-shipped `expand: "user"` pattern one hop deeper
- PrimeVue `MultiSelect` + `DataTable`/`Column` (already installed) — tag assignment/filter UI and the filterable ledger, zero new imports

### Expected Features

**Must have (table stakes, P1):**
- `paytime_boarders` roster: display name, fixed-vocabulary tags, optional `user` link, active/inactive status — the dependency root for everything else
- `paytime_payments` subject rework: `boarder` FK replaces `user` FK, 5 rules rewritten, 1 existing record backfilled
- Admin boarder selector in `ManagePayment.vue`, admin-only; non-admins pinned to their own linked boarder
- `recorded_by` field set at write time — minimum viable attribution once more than one person can write a row
- Admin ledger view: all boarders' payments for a selected month, filterable by month/tag/boarder/category
- Tags on the roster, filterable in the ledger and (if trivial) the existing monthly report — this is the milestone's explicit ask, so an unfilterable tag would be decoration, not a feature

**Should have (P2, add only once real usage shows the pain):**
- Bulk entry — log one category across several boarders in a single pass (loops the existing single-entry dialog, not a new import pipeline)
- Running totals / sum footer on the ledger view

**Defer indefinitely (P3, do not build without new evidence):**
- Multi-month arrears view (no evidence yet — 1 record in prod today)
- Formal dispute/flagging workflow, automated reminders/late fees, free-form tag management UI, multi-house support — all patterns borrowed from a different product shape (multi-tenant SaaS, landlord-tenant mediation) that doesn't fit one house, one admin, six people

### Architecture Approach

`MonthlyReport.vue` becomes the admin-tab shell: it owns the roster fetch (via a new `useBoarderRoster` composable, module-level-cached, mirroring the existing `useFileToken.ts` pattern rather than a new Pinia store) and the month-scoped payments fetch, and hosts a nested `Tabs` with three props-in/emit-up children — `MonthlyReportView` (today's per-boarder Panels markup, extracted verbatim), `AdminLedgerView` (new, flat filterable table), and `BoarderRosterView` (new, roster CRUD). This exactly mirrors the `ExpensesTab.vue` -> `ExpensesListView`/`ExpensesReportsView` shell precedent already in this codebase. No sub-view fetches for itself — PrimeVue mounts every `TabPanel` without `lazy`, so independent fetches would reproduce the exact `requestKey` collision this project has already paid down twice.

**Major components:**
1. `paytime_boarders` (new PocketBase collection) — canonical payment subject, admin-managed roster + tags
2. `useBoarderRoster.ts` (new composable) — shared, cached roster fetch consumed by `ManagePayment`, `PaymentLog`, and the three admin sub-views
3. `MonthlyReport.vue` (restructured shell) + `MonthlyReportView.vue` / `AdminLedgerView.vue` / `BoarderRosterView.vue` (new/extracted) — the admin-tab surface
4. `paytimeBoarderMapper.ts` / `boarderSchema.ts` (new) and `paytimePaymentMapper.ts` update (field rename `user` -> `boarder`/`recorded_by`)

### Critical Pitfalls

1. **Admin check satisfiable by any authenticated user** — this exact bug (`isSuperUser = isLoggedIn`) already exists once in this codebase (`GiftExchangeManage.vue`). Every admin-only rule must reference `@request.auth.is_admin = true` explicitly, never bare `@request.auth.id != ""`; grep every new/changed rule for the literal substring `is_admin`.
2. **Update rule reassignment via stored-value evaluation** — PocketBase evaluates `updateRule` against the record's stored state, so `boarder.user = @request.auth.id` passes even on a request that also reassigns `boarder`. This reproduces PT-RULE-01 (already flagged, currently only client-mitigated) on the new field unless closed server-side this time with an `:isset`/self-reference guard.
3. **`cascadeDelete: true` on `paytime_boarders.user` or `paytime_payments.boarder`** — the single most dangerous checkbox in the migration; either setting silently destroys payment history on a routine account/boarder cleanup. Both must be `false`; prefer an `is_active` flag over deletion.
4. **Roster list/view rule left as `""` instead of `@request.auth.id != ""`** — PocketBase treats an empty-string rule as public, not "not yet configured." The full roster (names + tags) would be readable with no auth token at all.
5. **Partially-applied five-rule rewrite** — the five `paytime_payments` rules, the backfill, and two hardcoded client `filter:` strings are all manual, non-transactional Admin-UI edits with no cross-validation; treat "rewrite the rules" as one indivisible unit, verified by pasting back all five rules verbatim plus a smoke probe with both an admin and a non-admin token.

## Reconciled Disagreement: `createRule` relation traversal off `@request.body`

STACK.md and ARCHITECTURE.md reached different confidence levels on the same expression — `@request.body.boarder.user = @request.auth.id` in the `paytime_payments` create rule — and that disagreement is preserved here rather than resolved into false confidence:

- **STACK.md: MEDIUM-HIGH.** Cites a direct quote from PocketBase maintainer Gani Georgiev in GitHub Discussion #6073 stating that bare relation dot-notation in a create rule (e.g. `customer.user.id`) "is essentially an alias for `@request.body.customer.*`," plus a second, independent worked example in Discussion #5667 chaining ownership through one relation in a create rule.
- **ARCHITECTURE.md: LOW.** States it could not find documentation that explicitly confirms dot-chaining works off `@request.body.<relField>` specifically — only that direct equality and `:isset`/`:changed` modifiers on body values are clearly documented — and flags this as a second, independent risk beyond the one PROJECT.md already names.

**Assessment:** STACK.md's citation is the stronger of the two — it quotes the PocketBase maintainer directly confirming the exact alias relationship (`customer.user.id` matches `@request.body.customer.*`) on the project's own GitHub repo, which is about as strong as external, non-empirical verification gets. ARCHITECTURE.md's caution is not wrong, but its search did not surface that maintainer quote as the deciding citation. On balance, STACK.md's MEDIUM-HIGH rating is better supported by the evidence gathered.

**However — this is unproven on this instance, full stop.** Neither rating substitutes for empirical verification, and it could not be settled during this research pass: the PocketBase MCP environment available here is SchemaRead-only and cannot create the `paytime_boarders`/`paytime_payments` test collections needed to exercise a real create call against the live rule. This requires a live spike with PocketBase Admin UI access — create one boarder row, one linked payment row, and exercise create/list/update against the real rules — before the roadmap locks phase shape on this assumption. Both STACK.md and ARCHITECTURE.md independently arrive at the same operational conclusion despite the confidence-rating disagreement: smoke-test the createRule shape first, and have a documented fallback ready (drop to `@request.auth.is_admin = true || @request.auth.id != ""` on create, relying on the well-documented list/view/delete rule shape plus the client-side boarder-pinning already in `ManagePayment.vue` for defense in depth) if it doesn't validate.

## Secondary Reconciliation: Ledger Placement vs. Feature Ranking

ARCHITECTURE.md recommends nesting the admin ledger inside the existing `MonthlyReport.vue` tab as a sibling sub-view (`By Boarder | Ledger | Boarders`), not a new top-level tab. FEATURES.md ranks the ledger's core capabilities (roster, subject rework, boarder selector, `recorded_by`, ledger view with filters, tags, paid/unpaid-at-a-glance) uniformly as P1 for this milestone, with bulk entry, running totals, and arrears explicitly deferred to P2/P3. These are consistent, not in tension: nesting the ledger as a sub-view is a placement decision, not a scope decision, and every P1 capability FEATURES.md calls for fits inside the nested-view shell architecture proposes. The one thing worth watching during planning is that FEATURES.md's deferred P2 items (bulk entry, running totals) and P3 item (multi-month arrears) would each naturally land as further sub-views or additions within the same shell rather than new top-level surfaces — the nested-shell architecture scales into those additions without requiring a re-placement decision later.

## Implications for Roadmap

Based on combined research, the natural phase structure follows the dependency chain roster -> subject rework -> rule rewrite (highest risk) -> UI:

### Phase 1: Boarder Roster Foundation
**Rationale:** Every other feature (tags, admin-on-behalf logging, the ledger, paid/unpaid computation) reads from the roster; it has no dependencies of its own and its rules are the "safe half" of the rewrite (no relation traversal).
**Delivers:** `paytime_boarders` collection (name, tags, optional `user` link, active status) with its five rules; manual roster seed (~6 rows); `useBoarderRoster.ts` composable.
**Addresses:** Roster table-stakes features from FEATURES.md.
**Avoids:** Pitfall 4 (public roster via empty-string list rule) — smoke-test with an unauthenticated request specifically.

### Phase 2: Subject Rework — Schema, Backfill, and the Rule-Risk Spike
**Rationale:** This is the highest-risk phase in the milestone and must be isolated so its risk doesn't bleed into UI work. Sequenced additively per STACK.md/ARCHITECTURE.md's Build Order: add `boarder` as optional first, backfill the 1 existing record, run the live createRule/list-rule spike, only then flip `boarder` to required and rewrite all five rules together.
**Delivers:** `paytime_payments.boarder` field, `user`->`recorded_by` rename, backfilled record, all five rewritten rules, resolved createRule confidence (spike result recorded either way).
**Uses:** PocketBase relation-rule traversal (STACK.md section 1), `cascadeDelete: false` on both new relations (PITFALLS.md #5, ARCHITECTURE.md Pattern 3).
**Avoids:** Pitfalls 1-3, 5-7 (admin-satisfiable checks, unbound createRule, update-rule reassignment, cascade data loss, partial rewrite, required-before-backfill ordering) — all concentrated in this one phase's acceptance criteria.

### Phase 3: Admin-on-Behalf Logging
**Rationale:** Depends on Phase 2's rules being live and correct; this is the literal milestone ask and the first UI surface that exercises the new subject model end-to-end.
**Delivers:** Admin boarder selector in `ManagePayment.vue`, `recorded_by` set at write time, `PaymentLog.vue` filter updated to resolve "my boarder" via the roster.
**Implements:** ARCHITECTURE.md Pattern 6 (mapper stays subject-agnostic; branching lives in `ManagePayment.vue` only).

### Phase 4: Admin Ledger + Roster Management Views
**Rationale:** Last, because it's pure UI composition over data models finalized in Phases 1-3; also the natural place to fold in tags-as-filter since tags are already stored by this point.
**Delivers:** `MonthlyReport.vue` restructured into a shell; `MonthlyReportView.vue` (extracted), `AdminLedgerView.vue`, `BoarderRosterView.vue` (new); month/tag/boarder/category filtering; paid/unpaid-at-a-glance.
**Uses:** `DataTable` + `Column` + `MultiSelect` (STACK.md section 3), shell-owns-fetch pattern (ARCHITECTURE.md Pattern 4/Anti-Pattern 4).
**Avoids:** requestKey collisions on the new roster/ledger fetches; `getList()` 400s on the ledger's relation-traversal-plus-boolean listRule shape — use `getFullList()`/`skipTotal` from the first commit.

### Phase Ordering Rationale

- Roster before subject rework before UI is a hard dependency chain, not a preference — nothing else can be built or even meaningfully planned until the roster exists and the rule-risk spike has an answer.
- Isolating the rule rewrite into its own phase (rather than folding it into "admin-on-behalf logging") matches every research file's independent conclusion that this is the highest-risk, least-partially-completable unit of work in the milestone — it needs its own acceptance criteria and its own D-13 paste-back verification pass, not to be a subtask of a feature phase.
- The ledger/roster-management UI comes last because it is the lowest-risk, most standard-pattern work (existing `ExpensesTab.vue` precedent, already-installed PrimeVue components) — nothing here needs deep research during planning.

### Research Flags

Needs research/spike during planning:
- **Phase 2 (Subject Rework):** The createRule relation-traversal question is explicitly unresolved (see Reconciled Disagreement above) and requires a live PocketBase Admin UI spike, not desk research, before rule text is finalized. Flag this phase for `/gsd-plan-phase --research-phase` or an equivalent live-spike gate.

Standard patterns (skip deep research):
- **Phase 1 (Roster):** Straightforward CRUD collection + non-relational rules — well-documented PocketBase pattern.
- **Phase 3 (Admin-on-behalf logging):** Direct extension of an existing, working dialog (`ManagePayment.vue`) with a well-understood client/server split.
- **Phase 4 (Ledger/roster UI):** Direct precedent already exists in this codebase (`ExpensesTab.vue` shell pattern); PrimeVue components are already installed and documented for this exact use.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (with one flagged exception) | No new technology; every claim traces to official PocketBase docs or this project's own `package.json`/existing components. The one exception — createRule relation traversal off `@request.body` — is MEDIUM-HIGH per STACK.md's own rating, and is called out separately above rather than folded into the general HIGH. |
| Features | MEDIUM | Converging patterns across roommate-splitter and landlord rent-collection app categories, but no source addresses a 6-person single-house deployment directly; conclusions are extrapolated down in scale from vendor blogs/app-store listings (MEDIUM-confidence sources), not case studies of this exact shape. |
| Architecture | MEDIUM (HIGH where grounded in code) | Everything citable against actual repo files (component structure, existing patterns like `useFileToken.ts`, `ExpensesTab.vue`) is HIGH confidence. PocketBase rule-syntax claims not yet exercised against the live instance are explicitly flagged MEDIUM/LOW throughout that document. |
| Pitfalls | HIGH | Grounded almost entirely in this repo's own documented history (PROJECT.md Key Decisions, CONCERNS.md's `isSuperUser` bug, PT-RULE-01, D-13, D-31-B) rather than general web-app advice — this is project-specific analysis, not generic security guidance. |

**Overall confidence:** MEDIUM — HIGH on everything grounded in this project's own code and shipped history; the milestone's single gating technical question (createRule relation traversal off `@request.body`) remains genuinely unresolved and requires empirical verification, not further desk research, before Phase 2 can be planned in detail.

### Gaps to Address

- **createRule relation traversal off `@request.body.boarder.user`** — cannot be resolved without a live PocketBase Admin UI spike (the available MCP environment is SchemaRead-only and cannot create test collections). Must be the first concrete action in Phase 2, with a documented fallback (see Reconciled Disagreement section) ready if it fails.
- **Tag rename propagation** — PITFALLS.md flags that whether renaming a `select` field's option value in the PB Admin UI propagates to already-stored records or leaves them holding the old string is unverified; empirically verify (and paste back per D-13) before treating rename as a supported roster-admin action.
- **PocketBase relation-traversal join performance** — no official documentation addresses join cost for multi-hop relation filters in rules; not a practical concern at this project's scale (6 users), but noted as a genuine documentation gap rather than a verified non-issue.

## Sources

### Primary (HIGH confidence)
- [PocketBase Docs — Working with relations](https://pocketbase.io/docs/working-with-relations/) — dot-notation traversal, 6-level depth limit
- [PocketBase Docs — API rules and filters](https://pocketbase.io/docs/api-rules-and-filters/) — `@request.body.*`, operators, `:isset`/`:each`/`:length` modifiers
- [PocketBase JSVM — RelationField](https://pocketbase.io/jsvm/classes/RelationField.html) — `cascadeDelete` semantics
- `C:/GitRepos/lex-lib.github.io/.planning/PROJECT.md` — Current Milestone, Key Decisions, Requirements (ground truth for what's already built/decided)
- `C:/GitRepos/lex-lib.github.io/.planning/codebase/CONCERNS.md` — documented `isSuperUser = isLoggedIn` bug precedent
- Existing repo source: `PayTimeApp.vue`, `PaymentLog.vue`, `ManagePayment.vue`, `MonthlyReport.vue`, `paytimePaymentMapper.ts`, `useFileToken.ts`, `ExpensesTab.vue`, `requestKeys.spec.ts`

### Secondary (MEDIUM confidence)
- [GitHub Discussion #6073 — Removing the dry submit of the Create API rule](https://github.com/pocketbase/pocketbase/discussions/6073) — maintainer quote on `@request.body.<relation>.*` aliasing (STACK.md's basis for MEDIUM-HIGH; not treated as fully dispositive per the reconciliation above)
- [GitHub Discussion #5667 — Protect creating record with relations](https://github.com/pocketbase/pocketbase/discussions/5667) — worked create-rule example chaining ownership through one relation
- [GitHub Discussion #7013 — Filter based on relations field](https://github.com/pocketbase/pocketbase/discussions/7013) — `?=` operator semantics
- Roommate-splitter and landlord rent-collection app sources (Split Patron, Cashinator, TurboTenant, TenantCloud, RentRedi, Avail, Landlord Studio) — vendor blogs/app-store listings, cross-referenced across multiple sources for convergent patterns

### Tertiary (LOW confidence)
- Quora community answer on merging duplicate user accounts — used only to corroborate a pattern already seen in stronger sources
- PrimeVue issue-tracker cross-references on `InputChips` deprecation — WebSearch provenance, not first-party docs, though the underlying claim (deprecated in favor of `AutoComplete`) is stated directly in the tracker

---
*Research completed: 2026-08-04*
*Ready for roadmap: yes — with Phase 2's createRule question flagged as requiring a live spike before detailed planning, not further desk research*
