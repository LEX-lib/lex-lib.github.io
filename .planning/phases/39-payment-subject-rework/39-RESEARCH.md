# Phase 39: Payment Subject Rework - Research

**Researched:** 2026-08-05
**Domain:** PocketBase v0.29.x relation-based access-rule migration on a live single-user-subject collection; Vue 3 read-path continuity
**Confidence:** MEDIUM-HIGH — the schema-shape decisions and codebase facts are HIGH (read directly from source); the two PocketBase syntax forms this phase's design depends on (createRule relation traversal, `:isset`) are MEDIUM (official docs confirm `:isset`; the createRule traversal form rests on a maintainer GitHub statement, not the official docs page); one newly-surfaced delete-behavior claim is LOW and flagged as an open risk, not a fact to design against.

## Summary

This phase is a live-instance schema migration, not new feature code. Every fact the planner needs about *what exists today* is already pinned down verbatim in `39-CONTEXT.md` and `38-COLLECTION.md` (re-verified here, not re-derived) — this document's job is to fill the two gaps CONTEXT explicitly asked for: (1) whether the two unproven PocketBase rule-syntax forms this phase's design depends on are real, and (2) the exact current shape of every source file the rename/subject-swap touches, so the planner does not have to guess a symbol name.

On (1): the **list/view/update traversal form** (`boarder.user = @request.auth.id`, evaluated against a stored record) is standard, officially documented dot-notation — no risk. The **createRule traversal form** (`@request.body.boarder.user = @request.auth.id`, evaluated against a submitted-but-not-yet-persisted body) is **not on the official docs page** for API rules; it rests entirely on a direct statement from PocketBase's maintainer in GitHub Discussion #6073, confirmed by a worked example in Discussion #5667. This is exactly why VERIFY-01 exists as a live spike rather than a documented certainty — treat the maintainer statement as strong circumstantial evidence, not proof. The **`:isset` modifier** and its `(@request.body.X:isset = false || @request.body.X = X)` combination form ARE confirmed by the official docs page directly, with the identical pattern shown in a community discussion — this is the more solid of the two unproven forms, though D-39-07 still correctly demands it be probed live alongside the traversal (both untested on *this* instance).

A third, previously-unflagged finding surfaced during this research and is reported as an open risk, not a locked fact: a GitHub issue (#6498, LOW confidence, not officially documented) reports that PocketBase can outright **refuse** to delete a record when it's referenced elsewhere by a `required: true` + `cascadeDelete: false` relation — rather than succeeding and leaving an orphan. If this holds on the live instance, D-39-16's destructive VERIFY-05 test ("delete the boarder, the payment must survive orphaned") may instead observe a blocked delete with an error response. Both outcomes are informative; the plan should not assume which one occurs and should record whichever is actually observed.

On (2): every mapper, schema, type, component, and spec file this phase touches has been read in full below, with the exact current field names, signatures, and test assertions that change.

**Primary recommendation:** Treat VERIFY-01 as a real go/no-go gate exactly as `39-CONTEXT.md` already designs it — spike the createRule traversal (and the `:isset` guard) against the live `paytime_payments` collection (Admin UI temporarily reverted, or a reverted-rule window) with a real non-admin token before authoring the final five rules, because no amount of research can substitute for the fact that the specific mechanism (createRule against submitted-body values, before the v0.24 dry-submit removal's scoping) is externally documented only via a maintainer's forum comment, not the PocketBase reference docs.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Payment ownership / access control | API / Backend (PocketBase rules) | Browser/Client (boarder pinning in `ManagePayment`) | Server rules are the enforcement boundary (locked project invariant); client pinning is UX/defense-in-depth only, never claimed as the boundary |
| Boarder-subject resolution (`myBoarder`) | Browser/Client (`useBoarderRoster` composable) | — | Pure read-side convenience computed over an already-fetched roster; no new backend capability |
| Schema/rule migration (relation add, rename, cascade flags, rule rewrite) | Database / Storage (PocketBase Admin UI, manual) | — | No scripted migration path exists (prod MCP env is SchemaRead-only); this is a first-class manual, D-13-gated task, not application code |
| Read-path continuity (`PaymentLog`, `MonthlyReport`) | Browser/Client (Vue components) | API / Backend (filter/expand strings sent to PocketBase) | Presentation and query-shape changes only; no new endpoint |
| Delete-guard for boarders with history (ROSTER-07) | Browser/Client (client pre-check, per D-39-13) | Database / Storage (possible incidental server-side block — see Open Questions) | Locked as client-enforced per D-39-13; the database tier may *also* refuse the delete as a side effect of the required-relation config, which is a bonus, not the design |

## User Constraints (from CONTEXT.md)

### Locked Decisions

All sixteen decisions (D-39-01 through D-39-16) in `.planning/phases/39-payment-subject-rework/39-CONTEXT.md` are locked and reproduced there in full — this research does not restate them verbatim to avoid drift, but treats every one as binding, in particular:

- Rename `user` → `recorded_by` (not add-and-drop); boarder-first, rename-last sequencing inside one indivisible five-rule commit (D-39-01, D-39-04).
- `recorded_by`: optional, `cascadeDelete: false`. `boarder`: `maxSelect:1`, `cascadeDelete: false`, required only after backfill, no index (D-39-02, D-39-03).
- ROADMAP's admin-bypass fallback binds if the createRule traversal spike fails; PROJECT.md's denormalise fallback is superseded (D-39-06).
- `:isset` rule-level guard closes VERIFY-04/PT-RULE-01, not mapper-omission alone (D-39-07).
- Uniform traversal + admin-OR-branch shape on all five rules (D-39-08).
- `PaymentLog` empty state, `ManagePayment` null-boarder guard living in the dialog not the button, `MonthlyReport`'s minimal `expand: "boarder"` swap, unchanged requestKeys (D-39-09 through D-39-12).
- ROSTER-07 is a client pre-check only ("no RESTRICT mode" — see Open Questions for a research-surfaced complication to this premise); D-39-14's user-supplied dual tokens at a blocking checkpoint; D-39-15's seed-data prerequisite task; D-39-16's destructive throwaway-account VERIFY-05 proof (D-39-13 through D-39-16).

### Claude's Discretion

- VERIFY-01/`:isset` spike harness mechanics (throwaway probe collection vs. reverted rule on `paytime_payments`) — **narrowed by this research: a throwaway collection is not viable** (see Package/Environment section below); the two remaining options are a temporarily-reverted rule window on the real collection, or Admin-UI-only manual probing without reverting anything.
- Exact rule text (subject to D-39-08's hard constraints).
- SUBJ-02 backfill mechanics (which boarder row, who performs it, how proven).
- Whether `boarder` is required at the Zod layer; how `paymentSchema`/types/mapper absorb the rename.
- Empty-state/guard copy wording.
- Cleanup mechanics for D-39-15 seed data and D-39-16 throwaway rows.
- Whether WR-01's dead-relation UX gets handling this phase or stays latent.

### Deferred Ideas (OUT OF SCOPE)

- Visible `recorded_by` marker in the UI, admin boarder selector in `ManagePayment` — both Phase 40 (BEHALF-01/03).
- Zero-payment/unpaid-boarder report rows, tag filtering, the ledger view — Phase 41 (LEDGER-05 and others).
- Prettier-formatting PayTime sources (PT-FMT-01), server-required `amount` (PT-AMOUNT-01).
- Server-side enforcement of ROSTER-07 beyond whatever PocketBase does incidentally — not deferred, *unavailable* by design (no RESTRICT mode as a configurable feature).
- Display-name uniqueness on `paytime_boarders` — undiscussed, no constraint.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUBJ-01 | Every payment identifies the boarder it belongs to | Additive-migration mechanics (Don't Hand-Roll / Common Pitfalls); confirmed `boarder` field shape via 39-CONTEXT.md's live-schema citation |
| SUBJ-02 | The one production record backfilled, no data loss | D-39-01's free backfill via rename (the row's `user` already is Cedrick); sequencing in Pitfall 7 |
| SUBJ-03 | Every payment records who entered it | The rename mechanics (Question 4) confirm data survives a rename; `recorded_by` inherits the existing row's value automatically |
| SUBJ-04 | Boarder w/ linked account sees exactly their own payments | `PaymentLog.vue`'s current filter (read below) shows exactly what changes: `user = "{id}"` → `boarder = "{myBoarder.id}"` |
| SUBJ-05 | Non-admin cannot write another boarder's payment, server-side | Pitfall/Security section — createRule ownership-binding via `@request.body.boarder.user` (Question 1) |
| SUBJ-06 | Admin can create/edit/delete for any boarder | Uniform admin-OR-branch shape (Question 1/2); current live rules lack this on write (confirmed defect) |
| SUBJ-07 | Deleting an account never destroys payment history | `cascadeDelete` semantics (Question 6); current `user` field IS `cascadeDelete:true` — live defect this phase closes |
| ROSTER-07 | Refuse-delete-of-boarder-with-history | Question 6 — RESTRICT-mode research, with a surfaced complication (Open Questions) |
| VERIFY-01 | createRule traversal proven live before rule text finalized | Question 1 — full syntax analysis and confidence caveat |
| VERIFY-02 | Two-token five-rule sweep, cross-boarder isolation | Question 3 — auth mechanics, status-code map, probe harness options |
| VERIFY-04 | Update rule rejects reassignment | Question 2 — `:isset` syntax confirmed |
| VERIFY-05 | `cascadeDelete` confirmed false via real deletions | Question 6 — orphan vs. RESTRICT-like refusal, both outcomes documented |

## 1. PocketBase v0.29.x relation traversal in API rules — the critical question

**Two genuinely different mechanisms exist. Do not conflate them.**

### Stored-record traversal (list, view, update, delete rules) — documented, no risk

Plain dot-notation against the record as it currently exists in the database:

```
boarder.user = @request.auth.id
```

`[CITED: pocketbase.io/docs/working-with-relations]` — "Nested relation references in `expand`, `filter` or `sort` are supported via dot-notation and up to 6-levels depth." This phase needs 2 levels (`payments.boarder` → `boarders.user`), well inside the limit. This is the exact mechanism `MonthlyReport.vue` already exercises via `expand: "user"` today, one hop shallower — not new ground for this app.

### Submitted-body traversal (create rule only) — the unproven mechanism

```
@request.body.boarder.user = @request.auth.id
```

This evaluates the relation chain against the **submitted-but-not-yet-persisted** create payload, not a stored record. `[CITED: GitHub Discussion #6073]` — PocketBase maintainer Gani Georgiev, discussing removal of the "dry submit" step in v0.24: *"There is no change in the behavior for the rule: `@request.auth.id != "" && @request.auth.id = customer.user.id`... record fields like `customer.*` are still accessible and it is essentially an alias for `@request.body.customer.*`."* A worked example exists in `[CITED: GitHub Discussion #5667]`: `"@request.auth.id != "" && @request.data.user = @request.auth.id && @request.data.category.user = @request.auth.id"` (pre-v0.23 `@request.data.*` syntax; this project already confirmed the v0.29.x form is `@request.body.*`, per the locked "createRule uses @request.body.user, not deprecated @request.data.user" fact).

**Confidence gap, stated plainly:** I fetched the official `api-rules-and-filters` docs page directly during this research and it does **not** show a `@request.body.<relation>.<field>` example anywhere — the createRule traversal form is real, per the maintainer's direct statement, but it is community/maintainer-forum evidence, not reference-documentation evidence. `[ASSUMED]`-adjacent: treat as MEDIUM confidence, not HIGH, and do not skip VERIFY-01's live spike on the strength of this citation. This exactly matches `39-CONTEXT.md`'s and `STACK.md`'s own framing — this research raises confidence from "believed" to "maintainer-confirmed," nothing more.

### The v0.24 "dry submit" removal — checked, does not threaten this design

Same discussion, maintainer's own scoping: *"Most validations remain unaffected. Relations to other collections continue working. Only `@collection.*` self-references to the same collection being created are impacted."* `paytime_payments.boarder → paytime_boarders` is a relation to a different collection — the unaffected case. `[CITED: GitHub Discussion #6073]`

### Operator choice

Both `boarder` and `recorded_by` are `maxSelect: 1` (single relations) — use plain `=`, not `?=`. `[CITED: pocketbase.io/docs/api-rules-and-filters]` confirms `?=` ("any/at-least-one-of") only changes behavior for fields with array-like/multi-record values; on a single relation it is a no-op, so `=` is correct and matches this project's existing style.

## 2. The `:isset` modifier and stored-value comparison — CONFIRMED, more solid of the two forms

`[CITED: pocketbase.io/docs/api-rules-and-filters]` (fetched directly this session) — exact documented example: `@request.body.role:isset = false` disallows a client from submitting that field at all. The combined "unset or unchanged" pattern D-39-07 specifies:

```
(@request.body.boarder:isset = false || @request.body.boarder = boarder)
```

is independently confirmed by `[CITED: GitHub Discussion #4208]`, which shows the identical shape: `(@request.body.businessPartner:isset = false || @request.body.businessPartner=businessPartner)` — comparing a submitted field directly against the bare stored field name in the same expression is exactly this documented idiom, not a novel construction.

**Known limitation, checked and not applicable here:** `[CITED: pocketbase.io/docs/api-rules-and-filters]` — `:isset` cannot detect newly-uploaded files, because file uploads are evaluated separately from the rest of the body and can't be serialized for the isset check. `boarder`/`recorded_by` are relation fields, not files — this limitation does not touch VERIFY-04. (It is however a live, unrelated fact about the `screenshot` field: `mapToUpdatePayment` already handles that field's asymmetry — send-only-when-picked — through ordinary conditional logic, not `:isset`, so nothing here changes that.)

**FormData vs. JSON — checked, no gotcha found.** `ManagePayment.vue` sends `mapToUpdatePayment`'s output as multipart `FormData` (required for the `screenshot` file field), not JSON. No documentation or discussion surfaced any `:isset` behavior difference between JSON and multipart bodies — PocketBase parses both into the same internal request-data structure before rule evaluation. Not finding a documented gotcha is not the same as confirming none exists; this is exactly the kind of thing VERIFY-01's live spike should incidentally exercise (submit the update via the real multipart path, not a hand-rolled JSON curl, when proving `:isset`).

## 3. Probing a live instance — mechanics, status codes, and the throwaway-collection question

### Authentication

`[CITED: pocketbase.io/docs/authentication]` + confirmed pattern: `POST /api/collections/users/auth-with-password` with JSON body `{"identity": "<email>", "password": "<password>"}` returns a response containing `.token` (a JWT) and `.record`. Use that token as the `Authorization` header value on subsequent requests (no `Bearer ` prefix needed for PocketBase's own API, unlike many other JWT-based APIs — the SDK sends the raw token string). D-39-14 requires the user to supply this (email+password, or a pre-minted token) for both an admin and a non-admin account at a blocking checkpoint; Phase 38's executor had neither, which is exactly what left ROSTER-06's authenticated-non-admin write path unproven.

### Status codes — the exact map VERIFY-02 needs

`[CITED: pocketbase.io/docs/api-rules-and-filters]` (fetched directly), corroborated by `[CITED: GitHub Discussion #2704 / #2785 / #2351]` (community reports matching the documented design intent):

| Rule | Denial outcome |
|------|-----------------|
| `listRule` | HTTP 200, `items: []`, `totalItems: 0` — **not** an error |
| `createRule` | HTTP 400 |
| `viewRule` / `updateRule` / `deleteRule` | HTTP 404 |
| Any rule set to `null` (locked/superuser-only) hit by a non-superuser | HTTP 403 |

This exactly matches Phase 38's own probe evidence (`38-COLLECTION.md`: tokenless POST → 400; tokenless list → 200+empty) and this project's own recorded fact ("rule violations return 404 not 403") — that fact is specifically about view/update/delete, and the 400-for-create / 200-empty-for-list cases are the two easily-forgotten exceptions to it. **VERIFY-02's sweep must assert the correct status per operation, not a single expected code across all five** — asserting 404 on a denied create, or 400 on a denied update, will look like the probe itself is broken.

### Can a throwaway probe collection be created without superuser rights?

**No — confirmed, not merely restated.** `[CITED: pocketbase.io/docs/api-collections]` — listing, creating, and updating collections via the Collections API are each explicitly superuser-only operations. `38-COLLECTION.md` already established the prod MCP environment grants `SchemaRead`/`RecordRead` but not `RecordCreate`/schema-write; this research confirms the *general* PocketBase rule (not just this project's MCP grant), so even a differently-configured tool couldn't route around it without an actual superuser credential.

**Consequence for D-39-05:** the VERIFY-01/`:isset` spike harness cannot use a disposable scratch collection created on the fly. The two remaining options, both already implied by CONTEXT's phrasing ("throwaway probe collection vs a reverted rule on `paytime_payments`"), narrow to one real choice: **temporarily point the spike at the real `paytime_payments` collection** — either (a) add the `boarder` field, write the candidate createRule/updateRule text, run the two-token probe, and only then move on to the final rule authoring pass, or (b) do it inside the Admin UI by hand with the real collection's rule fields, reverting immediately after each observation is recorded. Both require the D-39-14 checkpoint's real non-admin token; neither can be faked with a scratch collection.

`[CITED: pocketbase.io/docs/api-collections]` also confirms, separately: "API Rules are ignored when the action is performed by an authorized superuser" — i.e. a superuser/admin token bypasses every rule unconditionally. This matters for VERIFY-02: the *admin* half of the two-token sweep proves the admin-OR-branch works as UX/consistency, but PocketBase would let an admin through on rules that had **no** admin branch at all, since a true superuser bypasses rules entirely. **The app's admin (`is_admin = true` on a `users` row) is not a PocketBase superuser** — it's an ordinary authenticated user whose own row happens to have that boolean, so it IS subject to the collection's rules and the explicit `@request.auth.is_admin = true ||` branch is load-bearing, not redundant. Do not confuse "admin token" in VERIFY-02 with "superuser token" — they are different privilege tiers in this project, and only the superuser tier bypasses rules for free.

## 4. Field rename semantics

`[CITED: GitHub-sourced synthesis, not the official docs page directly — see confidence note]`: PocketBase's Admin UI field rename preserves the underlying column and its stored data (internally uses a rename/temp-name strategy so no data is dropped or recreated) — this matches D-39-01's premise that the one production row's `user` value survives as `recorded_by` with zero extra backfill step.

**What does NOT carry over automatically: rule text.** API rules are stored independently of field definitions; renaming a field does **not** propagate into rule expressions that reference the old name. This directly confirms **D-39-04's step 3 is several edits, not one** — the rename itself is one Admin-UI action, but all five rules that will eventually reference `boarder`/`recorded_by` must be authored/pasted in by hand regardless of the rename; nothing in PocketBase does this for you. This is exactly consistent with `39-CONTEXT.md`'s own framing ("One indivisible commit: rename... AND rewrite all five rules together") — this research found no mechanism that would make that lighter than planned, only confirmation that the manual path is the only path.

**Confidence caveat:** I did not find this specific behavior on the official docs pages I fetched directly (`api-rules-and-filters`, `working-with-relations`); it comes from search-engine synthesis of community/deepwiki sources. Treat "rename preserves data" as MEDIUM (it matches this project's own D-39-01 premise and PocketBase's general reputation for non-destructive schema edits) and "rules don't auto-update" as the safer, lower-risk assumption to plan around regardless of confidence — planning for a manual five-rule rewrite is strictly safer than assuming an automatic propagation that, if wrong, silently leaves stale rule text in place.

## 5. Additive relation migration order — required-flip and the `''`-not-`NULL` trap

No official PocketBase documentation was found stating whether flipping `required: true` on a relation field retroactively validates pre-existing rows. `[ASSUMED, consistent with this project's own PITFALLS.md Pitfall 7]`: PocketBase does not retroactively enforce a newly-added `required` constraint against rows that existed before the constraint was added — the row is not rejected or auto-migrated, it simply keeps whatever value (including empty) it already had. The risk is not "the flip breaks," it's that a row left with an empty `boarder` after the flip will fail every `boarder.user = ...` rule traversal silently, disappearing from every list without an error — precisely what Pitfall 7 already documents and D-39-04's boarder-first-backfill-then-required sequencing exists to prevent. **Sequence exactly as `39-CONTEXT.md`/Pitfall 7 specify: backfill before the required flip, and verify the read path (not just the write) round-trips post-flip** — a successful backfill write does not by itself prove the read-side rule traversal resolves correctly.

The `''`-not-`NULL` fact is independently confirmed twice already in this project's own artifacts (`38-COLLECTION.md`'s partial-unique-index reasoning; `PaytimeBoarder.user`'s type docblock) — `[VERIFIED: 38-COLLECTION.md]` an unset `maxSelect:1` relation reads back as `""`, never `null`. This has one concrete consequence for the required flip that D-39-03 doesn't spell out explicitly: **once `boarder` is `required: true`, a row can never again round-trip back to `""`** through any write path — every future create/update must supply a real boarder id or PocketBase's own required-field validation rejects the write outright (this is ordinary required-field behavior, not the relation-specific quirk; flagging it only because `mapToUpdatePayment`'s "send only what changed" convention could tempt someone to omit `boarder` on an edit the way it already omits the owner field — omitting a *required* field on update is fine only because PocketBase merges partial updates against the stored row, so an omitted required field simply keeps its existing non-empty value; this is different from the owner-field omission, which is deliberate to prevent reassignment, not a required-ness accident).

## 6. Orphaned relations and delete behavior — confirmed AND an open risk to flag

### Confirmed: `cascadeDelete: false` leaves a dangling id, not a blocked update

`38-REVIEW.md`'s WR-01 already demonstrates this empirically on `paytime_boarders.user`: deleting the linked `users` account leaves the boarder row's `user` field holding a nonexistent id (not cleared to `''`), and the *next* unrelated edit that round-trips that stale id through `mapToUpdateBoarder` gets rejected by PocketBase's relation-target-exists validation — with no UI cue why. `[VERIFIED: 38-REVIEW.md:69-83]` — this is the precedent D-39-02's "optional + never resend" mitigation for `recorded_by` is built on, and it transfers directly: `recorded_by` must never be resent on update (mirrors the existing `mapToUpdatePayment` convention for `user` today), for the same reason.

### Open risk: does a required-relation config make deletion of the *target* fail outright?

`[flagged, LOW confidence, not officially documented]`: `GitHub issue #6498` reports that PocketBase refuses to delete a record when it is referenced elsewhere by a relation field configured `required: true` + `cascadeDelete: false`, returning an error ("Failed to delete record. Make sure that the record is not part of a required relation reference.") rather than succeeding and leaving the reference dangling. I fetched PocketBase's official `working-with-relations` docs page directly and it does **not** mention this behavior either way — this is solely a user-filed issue report, unconfirmed by a maintainer in the fetched content, and may describe an edge case, a version-specific behavior, or a misconfiguration rather than a general rule.

**Why this matters for this specific phase, concretely:** once `paytime_payments.boarder` is `required: true` + `cascadeDelete: false` (exactly D-39-03's target config), this reported behavior — if it holds on this instance — predicts that **deleting a `paytime_boarders` row that any payment still references would be refused by PocketBase itself**, server-side, independent of the client pre-check D-39-13 already plans. That would be strictly better than the CONTEXT's stated premise ("no RESTRICT mode... an admin issuing a hand-crafted request can still orphan payments") — it would mean the hand-crafted-request threat D-39-13 accepts as unmitigated might not actually be exploitable on this instance.

Separately, `[CITED: GitHub Discussion #1812]` — the maintainer directly confirms a real, documented RESTRICT-equivalent IS possible via API rules: a `deleteRule` of the form `@collection.paytime_payments.boarder != id` on `paytime_boarders` would refuse a non-admin's delete attempt if any payment still references that boarder. The maintainer's own caveat: **"admins will still be able to delete the record because API rules don't apply for them"** — but "them" means PocketBase *superusers*, not this app's `is_admin` users (see Question 3's clarification of that distinction) — so a `deleteRule` of this shape would actually bind even against this app's admin, which is a stronger guarantee than D-39-13 asks for, not a weaker one. **This is not proposed as a design change** — D-39-13 is locked as a client-only pre-check — but the planner and the D-39-16/VERIFY-05 task should go in expecting one of two possible observations, not assuming success-with-orphan is the only outcome:

1. **Delete succeeds, payment left pointing at a dead id** — matches D-39-13/D-39-16's stated expectation exactly.
2. **Delete is refused with an error** (400/403, message referencing the required relation) — payment and boarder both survive untouched. This would still satisfy VERIFY-05's actual goal (payment history is never destroyed) by an even stronger mechanism than expected, but the *test script* as literally written in D-39-16 ("delete the boarder — the payment must survive, orphaned") would need its assertion loosened to "the payment must survive" without insisting on the orphaned-not-blocked outcome.

Record whichever is actually observed as the D-13 paste-back for that step, rather than assuming which branch fires ahead of time.

## Standard Stack

No new libraries. `[CITED: .planning/research/STACK.md]` already confirms the entire v5.0 milestone (Phases 38–41) needs zero new npm packages — every capability resolves inside the existing Vue 3 + PrimeVue 4 + PocketBase JS SDK `^0.26.2` + Zod 4 + dayjs stack. This phase specifically needs no new PrimeVue component either (no new UI surface beyond the read-path continuity swaps already described in `39-CONTEXT.md`).

### Installation

```bash
# Nothing to install — confirm no drift before planning:
npm ls primevue pocketbase zod dayjs
```

## Package Legitimacy Audit

**Not applicable.** This phase installs no external packages — it is a PocketBase schema/rule migration plus Vue component edits against the existing dependency set. No `package.json` change is expected; if the planner finds one is needed, re-run the Package Legitimacy Gate at that point.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │   PocketBase Admin UI (manual, D-13-gated)   │
                    │   add boarder (optional) → backfill →        │
                    │   VERIFY-01 spike → rename user→recorded_by  │
                    │   → flip cascadeDelete/required → rewrite    │
                    │   all 5 rules together                       │
                    └───────────────────┬───────────────────────────┘
                                        │ (schema/rules now live)
                                        ▼
┌──────────────┐   getFullList()   ┌─────────────────────┐   getFullList()  ┌──────────────────┐
│ PaymentLog   │──filter:boarder──▶│  paytime_payments    │◀──expand:boarder─│  MonthlyReport    │
│ (My Payments)│   =myBoarder.id   │  (list/view/create/  │   group by       │  (By Boarder)     │
└──────┬───────┘                  │   update/delete rules │   boarder        └──────────────────┘
       │ create/edit                │   traverse           │
       ▼                            │   boarder.user /     │
┌──────────────┐   create/update    │   recorded_by         │
│ ManagePayment│──writes boarder,──▶│                       │
│ (dialog)     │  recorded_by       └──────────┬────────────┘
└──────┬───────┘                              │ reads boarder.user via
       │ resolves myBoarder                    │ stored-record traversal
       ▼                                       ▼
┌──────────────────┐   getFullList()   ┌──────────────────┐
│ useBoarderRoster │◀──────────────────│  paytime_boarders │
│ (myBoarder,      │                   │  (existing,       │
│  boarders)       │──delete pre-check▶│   Phase 38)       │
└──────────────────┘   counts payments └──────────────────┘
                        per boarder before
                        allowing delete
                        (ROSTER-07, client)
```

A reader tracing SUBJ-04's "boarder sees exactly their own payments": `PaymentLog.vue` mounts → `useBoarderRoster()` resolves `myBoarder` from the already-fetched roster → the payments `getFullList` filter switches from `user = "{authId}"` to `boarder = "{myBoarder.id}"` (or the fetch is skipped entirely per D-39-09 if `myBoarder` is null) → PocketBase's `listRule` (`boarder.user = @request.auth.id || is_admin`) independently re-confirms the same ownership server-side.

### Recommended Project Structure

No new directories. Every file this phase touches already exists (see Code Examples / codebase-reading section below); this is an in-place-edit phase, not a new-surface phase.

### Pattern: additive-then-required schema migration (locked shape, D-39-04)

**What:** add the new relation optional → backfill the single existing row → prove read+write against the new field → only then flip to required and rewrite rules.
**When to use:** any relation retarget on a collection with live data, whenever `cascadeDelete`/`required` need to change together, per PocketBase's own field-retargeting limitation (Section 5 above — no automatic ID remap on an in-place retarget).
**Example (sequence, not code — this is a manual Admin UI + REST probe sequence, not a scripted migration):**
```
1. Admin UI: add `boarder` (optional, → paytime_boarders, cascadeDelete:false)
2. Admin UI: set the one row's `boarder` to Cedrick's boarder-row id
3. VERIFY-01 spike: probe @request.body.boarder.user createRule form,
   probe :isset updateRule form — both against a temporarily-adjusted
   rule text on the SAME collection (no throwaway collection possible,
   see Section 3)
4. Client: switch reads/writes to `boarder`, keep sending `user` too
5. One indivisible commit: rename user→recorded_by, flip both
   cascadeDelete flags, flip `boarder` required, paste in all 5 final
   rules together
6. VERIFY-02: two-token five-rule sweep against the now-final rules
```

### Anti-Patterns to Avoid

- **Treating "admin token" as "superuser token" during VERIFY-02.** This app's admin is an ordinary authenticated `users` row with `is_admin: true` — it is subject to every collection rule, unlike a true PocketBase superuser, which bypasses rules entirely (Section 3). Conflating the two would make the admin-OR-branch look "always redundant" during testing when it is in fact load-bearing.
- **Assuming the createRule traversal form is proven because it's cited in research.** It is maintainer-confirmed, not documentation-confirmed (Section 1) — VERIFY-01 must still run.
- **Reverting a spike rule and forgetting to restore it before authoring the final five.** Since no throwaway collection is possible, the spike necessarily touches the real collection's rule fields temporarily — track this as an explicit revert step in the plan, not an implicit assumption.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ownership-through-relation on create | A server-side hook / custom validation endpoint | The documented (maintainer-confirmed) `@request.body.boarder.user = @request.auth.id` createRule form | PocketBase's rule engine already does this; a custom hook duplicates logic PocketBase resolves natively, and this project has no Go/JS hook infrastructure today |
| Update-reassignment guard | A pre-save hook comparing old/new values | The documented `:isset` + stored-field comparison form (Section 2) | Confirmed official-docs pattern; no hook needed |
| Refuse-delete-with-history | A custom cascade-check service | Client pre-check (locked, D-39-13) — optionally reinforced by whatever the required-relation config does server-side incidentally (Section 6) | PocketBase has no first-class RESTRICT toggle, but a `deleteRule` referencing `@collection.paytime_payments.boarder != id` is the closest built-in equivalent if this phase ever revisits server enforcement (out of scope now per D-39-13, noted for future reference only) |

**Key insight:** every mechanism this phase needs (ownership binding, reassignment guard, cascade control) already exists as PocketBase rule syntax or field configuration — no server hook code, no custom Go/JS extension, no new npm package. The risk in this phase is 100% "is the documented/maintainer-confirmed syntax actually honored by this specific live v0.29.x instance," which is exactly what VERIFY-01/02/04/05 exist to answer, not "what do we need to build."

## Common Pitfalls

(Full detail already lives in `.planning/research/PITFALLS.md`, Pitfalls 1/2/3/6/7 — this section adds only what's new since that document was written, plus this session's findings.)

### Pitfall (new): Confusing "admin token" with "superuser token" during VERIFY-02

**What goes wrong:** A tester uses the app's admin account for the "admin" half of the two-token sweep and concludes the admin-OR-branch is unnecessary because "the admin token gets through anyway" — not realizing that if the admin-OR-branch were accidentally dropped, an app-admin (not a PB superuser) would fail the exact same way a non-admin does.
**Why it happens:** PocketBase superusers bypass ALL rules; this project's "admin" is a bool flag on an ordinary `users` row, a materially different privilege tier that IS subject to rules.
**How to avoid:** Explicitly test the admin-OR-branch's own removal as a negative case if time allows — or at minimum, know which of the two tiers the "admin token" in D-39-14 actually is (an ordinary authenticated user with `is_admin:true`, never the PocketBase `_superusers` collection) before drawing conclusions from the sweep.
**Warning signs:** A rule missing its `@request.auth.is_admin = true ||` branch still appears to work correctly during manual testing because the tester is unknowingly using a PB superuser session rather than the app's own admin account.

### Pitfall (new): Assuming D-39-16's delete-orphan test has only one possible outcome

**What goes wrong:** The plan treats "boarder delete succeeds, payment survives orphaned" as the only valid VERIFY-05 result and doesn't script a branch for "boarder delete is refused."
**Why it happens:** `39-CONTEXT.md`'s own D-39-13 language ("no RESTRICT mode... delete succeeds and leaves a dangling id") states this as settled fact; this research surfaced a LOW-confidence, unofficial report (`#6498`) that a required+non-cascading relation may cause PocketBase to refuse the delete instead.
**How to avoid:** Write the D-39-16 verification step to record whichever outcome actually happens (success-with-orphan vs. refused-with-error) rather than asserting one in advance; both outcomes satisfy the real goal (payment history survives).
**Warning signs:** The plan's verification script hard-codes an expectation of a 2xx delete response and treats a 400/403 as a test failure rather than as a second valid pass condition.

## Code Examples

Verified patterns read directly from this codebase this session (not paraphrased) — exact current shape before this phase's edits.

### `paytimePaymentMapper.ts` — full current contents (both functions)

```typescript
// Source: src/lib/pocketbase/paytimePaymentMapper.ts (read in full, 47 lines)
export function mapToCreatePayment(payment: AddPaytimePayment): FormData {
  const formData = new FormData();
  formData.append("user", payment.user);
  formData.append("category", payment.category);
  formData.append("month", payment.month);
  formData.append("payment_date", payment.payment_date);
  if (payment.amount != null) formData.append("amount", String(payment.amount));
  if (payment.notes) formData.append("notes", payment.notes);
  if (payment.screenshot) formData.append("screenshot", payment.screenshot);
  return formData;
}

// `user` is deliberately omitted [on update]. PocketBase evaluates the update
// rule against the record's stored values, so `user = @request.auth.id`
// passes on a request that also sets `user` to somebody else — which would
// hand the record away. Never send an owner field on update.
export function mapToUpdatePayment(
  payment: Omit<AddPaytimePayment, "user">,
): FormData {
  const formData = new FormData();
  formData.append("category", payment.category);
  formData.append("month", payment.month);
  formData.append("payment_date", payment.payment_date);
  if (payment.amount != null) formData.append("amount", String(payment.amount));
  formData.append("notes", payment.notes ?? "");
  if (payment.screenshot) formData.append("screenshot", payment.screenshot);
  return formData;
}
```

**What changes:** `mapToCreatePayment` appends `user` — becomes append `boarder` (and, per D-39-01, `recorded_by := auth.user.id` since that's what the create path knows and always sends going forward). `mapToUpdatePayment`'s `Omit<AddPaytimePayment, "user">` type parameter and its owner-omission docblock/discipline extend verbatim to `boarder`/`recorded_by` — this is the exact pattern PITFALLS.md Pitfall 3 already names as "the v1.0 fix was client-side only... reproduces the identical shape on a new field name."

### `paytimePaymentMapper.spec.ts` — exact assertions that break

```typescript
// Source: src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts (read in full)
const base: AddPaytimePayment = {
  user: "user123",              // ← field name changes to `boarder` (+ new recorded_by)
  category: "electricity",
  month: "2026-07",
  payment_date: "2026-07-28",
};
// it("maps required fields") asserts formData.get("user") === "user123" — breaks
// it("never sends user") on mapToUpdatePayment asserts formData.has("user") === false
//   — must become formData.has("boarder") === false (and has("recorded_by") === false)
```

### `types/paytime/payments/types.d.ts` — full current contents

```typescript
// Source: src/types/paytime/payments/types.d.ts (12 lines, read in full)
export interface PaytimePayment extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;                 // ← becomes `boarder: string; recorded_by: string;`
  category: PaymentCategory;
  month: string;
  payment_date: string;
  amount?: number;
  notes?: string;
  screenshot?: string;
}
export type AddPaytimePayment = Omit<
  PaytimePayment, "id" | "created" | "updated" | "screenshot"
> & { screenshot?: File };
```

**Note the precedent already sitting in `types/paytime/boarders/types.d.ts`** for how this project documents PocketBase's `''`-not-`null` relation-storage quirk inline on the type itself — the new `boarder`/`recorded_by` fields on `PaytimePayment` should carry the same style of docblock once `recorded_by` is optional (can be `""` after this phase, matching `PaytimeBoarder.user`'s existing comment verbatim in spirit).

### `PaymentLog.vue` — the exact filter string and its surrounding comment

```typescript
// Source: src/components/projects/paytime/PaymentLog.vue:35-45 (read in full)
payments.value = await pb.collection("paytime_payments").getFullList<PaytimePayment>({
  filter: `user = "${auth.user.id}"`,      // ← becomes boarder = "${myBoarder.value.id}"
  sort: "-payment_date",
  requestKey: "paytime-payments-list",     // ← UNCHANGED per D-39-12
});
```

D-39-09's empty state requires this call to be **skipped entirely** when `myBoarder` (from `useBoarderRoster()`) is null — currently the `if (!auth.user) return;` guard is the only early-return; a second guard on `myBoarder` needs adding alongside it, and the template's existing `v-else-if="!payments.length"` "No payments logged yet." branch needs a sibling branch for the null-boarder case per D-39-09.

### `MonthlyReport.vue` — the exact `expand`/grouping logic that changes

```typescript
// Source: src/components/projects/paytime/MonthlyReport.vue:41-77 (read in full)
const payments = await pb.collection("paytime_payments").getFullList<PaytimePayment>({
  filter: `month = "${dayjs(month.value).format("YYYY-MM")}"`,
  expand: "user",                          // ← becomes "boarder"
  sort: "payment_date",
  requestKey: "paytime-report-list",       // ← UNCHANGED per D-39-11
});
// byUser Map keyed on payment.user, row.userName from expand.user.name||email
//   ← becomes byBoarder keyed on payment.boarder, row.boarderName from expand.boarder.name
```

`ReportRow.userId`/`userName` fields, the `byUser` Map variable name, and the `row.userId`/`row.userName` template bindings (lines 25-26, 56-77, 121-122) all reference `user`-shaped naming that D-39-11 rewrites to `boarder`-shaped — this is a rename-through, not a logic change: the label source moves from `expand.user.name || email` to `expand.boarder.name` (boarder name always exists per `paytime_boarders.name` being required — no `|| email` fallback needed on the new source).

### `ManagePayment.vue` — the exact `savePayment` create-path line that changes

```typescript
// Source: src/components/projects/paytime/ManagePayment.vue:184-187 (read in full)
await pb.collection("paytime_payments")
  .create(mapToCreatePayment({ user: auth.user.id, ...parsed.data }));
// ← becomes: .create(mapToCreatePayment({ boarder: myBoarder.value.id, recorded_by: auth.user.id, ...parsed.data }))
```

D-39-10 requires `ManagePayment` to resolve `myBoarder` from `useBoarderRoster()` on dialog open (not on mount — the dialog is not always visible) and, when null, render the same no-boarder message in place of the form with Save disabled — this is new state this component doesn't have today (it currently has no dependency on `useBoarderRoster` at all).

### `useBoarderRoster.ts` — the exact contract Phase 39 is the first real consumer of

```typescript
// Source: src/composables/useBoarderRoster.ts (79 lines, read in full)
export function useBoarderRoster() {
  onMounted(() => { consumers += 1; void refresh(); });
  onUnmounted(() => { consumers -= 1; });
  const myBoarder = computed<PaytimeBoarder | null>(() => {
    const authId = pb.authStore.record?.id;
    if (!authId) return null;
    return boarders.value.find((boarder) => boarder.user === authId) ?? null;
  });
  return { boarders, myBoarder, refresh };
}
```

`38-REVIEW.md`'s IN-02 flagged `myBoarder` as having no production consumer yet — this phase is exactly that consumer, in both `PaymentLog` and `ManagePayment`. No changes needed to this file itself; it already returns exactly the shape D-39-09/D-39-10 need.

### `BoarderRosterView.vue` — where the D-39-13 delete pre-check attaches

```typescript
// Source: src/components/projects/paytime/BoarderRosterView.vue:50-58 (read in full)
const removeBoarder = async (boarder: PaytimeBoarder) => {
  try {
    await pb.collection("paytime_boarders").delete(boarder.id);
    // ...
  } catch { toast.error("Failed to delete boarder"); }
};
const deleteBoarder = (boarder: PaytimeBoarder) => {
  confirm.require({ header: "Delete boarder", message: `Delete ${boarder.name}? ...`, accept: () => removeBoarder(boarder) });
};
```

D-39-13's count-payments-first pre-check inserts **before** `confirm.require` is called (or inside `deleteBoarder`, before building the confirm message) — the existing `useConfirm` + `ConfirmDialog`-at-shell-level pattern is reused as-is; the new logic is an added `paytime_payments` count query (filtered by `boarder = boarder.id`) gating whether `deleteBoarder` shows the delete-confirm dialog or a refusal message naming the count, offering Deactivate (`toggleActive`, already implemented in this same file) instead.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `paytime_payments.user` as the payment subject | `paytime_payments.boarder` as the subject, `recorded_by` for attribution | This phase | Enables admin-on-behalf logging (Phase 40) for boarders with no account at all — the entire reason v5.0 exists |
| Write rules with no admin branch (`updateRule`/`deleteRule` = `user = @request.auth.id` only) | Uniform admin-OR-branch on all five rules | This phase | Closes the live SUBJ-06 defect (admin cannot edit/delete others' payments today) |
| `cascadeDelete: true` on the owner relation | `cascadeDelete: false` on both `boarder` and `recorded_by` | This phase | Closes the live SUBJ-07 defect (deleting a user account destroys their payment history today) |

**Deprecated/outdated:** `@request.data.*` syntax — confirmed dead on this instance (returns 403), already a locked project fact; nothing new to add. `PT-SMOKE-01`/`PT-RULE-01` (backlog items from PayTime v1.0) are precisely what VERIFY-02/VERIFY-04 close, not new problems.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@request.body.<relation>.<field>` createRule traversal works as the maintainer describes on this exact v0.29.x instance | §1 | VERIFY-01 fails; ROADMAP's admin-bypass fallback applies (already a documented, safe fallback path — not a blocker, but changes rule text and accepts a partial-client-only SUBJ-05 per D-39-06) |
| A2 | Renaming a field via Admin UI preserves data and does not auto-update rule text | §4 | If rule text somehow DID auto-update, no harm (manual rewrite would be redundant, not wrong); if data were NOT preserved, SUBJ-02/03 would fail outright and must be caught immediately by the D-13 paste-back after the rename step |
| A3 | Flipping a relation to `required` does not retroactively validate/reject pre-existing empty-valued rows | §5 | If wrong (PocketBase does reject), the flip step itself would surface an error immediately — self-detecting, low risk, since the flip happens after backfill anyway per D-39-04's sequencing |
| A4 | A `required:true` + `cascadeDelete:false` relation may cause PocketBase to refuse deleting the referenced target record outright (GH #6498), rather than always succeeding-with-orphan | §6 | If wrong, D-39-16's test proceeds exactly as CONTEXT describes (delete succeeds, orphan observed); if right, the test's expected outcome needs the two-branch handling described in Common Pitfalls — either way, VERIFY-05's actual goal (no data loss) is satisfied, only the test script's phrasing needs to tolerate both outcomes |
| A5 | `:isset` behaves identically whether the request body is JSON or multipart/form-data | §2 | If wrong, VERIFY-04's live probe (which should exercise the real multipart update path, not a JSON curl) would surface this immediately as a probe failure, not a silent gap |

**None of these are user-facing product decisions** — all five are PocketBase engine-behavior questions that D-39-14/VERIFY-01/VERIFY-04/VERIFY-05's live probes are specifically designed to resolve empirically. The plan should treat each as "probe and record the actual result," not "assume and proceed."

## Open Questions

1. **Does PocketBase refuse to delete a `paytime_boarders` row referenced by a required, non-cascading `paytime_payments.boarder`?**
   - What we know: a GitHub issue (unofficial, LOW confidence) reports this exact refusal behavior for an analogous config (required + cascadeDelete:false back-reference blocking deletion of the target).
   - What's unclear: whether this is version-specific, intentional, or itself a reported bug; official docs are silent.
   - Recommendation: do not design around either outcome — D-39-16's live destructive probe will observe the truth directly on this instance; record whichever happens as the D-13 evidence, and treat a refused-delete as an even stronger (not weaker) proof of SUBJ-07/ROSTER-07's real-world safety than the orphan-and-survive outcome CONTEXT anticipated.

2. **Is the `@request.body.boarder.user` createRule form definitely supported on this project's specific PocketBase server build?**
   - What we know: maintainer-confirmed general PocketBase behavior (GitHub Discussion #6073), not project-specific, not in the official reference docs.
   - What's unclear: this exact server's patch version and whether any regression exists between the maintainer's statement (made in the context of the v0.24 dry-submit change) and the version this project runs.
   - Recommendation: VERIFY-01 resolves this directly and is already mandatory per D-39-04/ROADMAP criterion 1 — no further research can substitute for the live spike.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `curl` | VERIFY-01/02/04/05 raw REST probes | ✓ | 8.11.0 (this dev machine) | — |
| `node` | JSON-parsing probe scripts (per Phase 38's own `node -e` pattern) | ✓ | v22.14.0 (this dev machine) | — |
| PocketBase MCP tools (`describe_collection`, `list_records`) | Orchestrator-side schema/record reads (SchemaRead/RecordRead only, confirmed by 38-COLLECTION.md) | ✓ (orchestrator), ✗ (executor, per Phase 38's own recorded gap) | prod env, SchemaRead + RecordRead, no RecordCreate/SchemaWrite | Raw `curl` REST probes with a user-supplied token (D-39-14) — the actual planned mechanism, not a fallback of last resort |
| Admin token + non-admin token | D-39-14's blocking checkpoint, VERIFY-01/02/04/05 | ✗ — must be supplied by the user at execution time | — | None; this is precisely why D-39-14 is a blocking checkpoint, not an automated step |

**Missing dependencies with no fallback:** the admin and non-admin tokens themselves — by design, per D-39-14, the plan must include a `checkpoint:human-verify` (or equivalent blocking) task requesting them before any live-probe task can run.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (unchanged this phase) | PocketBase's existing `authWithPassword`/JWT session, untouched |
| V3 Session Management | No (unchanged this phase) | n/a |
| V4 Access Control | **Yes — the core of this phase** | PocketBase collection API rules (list/view/create/update/delete), rewritten per D-39-08's uniform traversal + admin-OR-branch shape; never a bare `@request.auth.id != ""` on a write rule (locked constraint, PITFALLS Pitfall 1) |
| V5 Input Validation | Yes | Zod (`paymentSchema`) client-side; PocketBase's own field-type/required validation server-side — neither is new to this phase, both extend to the renamed/added fields |
| V6 Cryptography | No | n/a — no crypto surface touched |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Admin check satisfiable by any authenticated user (one-token-swap bug, already live once in this codebase on `GiftExchangeManage.vue`) | Elevation of Privilege | Literal `@request.auth.is_admin = true` on every write branch — never bare `@request.auth.id != ""` (PITFALLS Pitfall 1) |
| Create-rule doesn't bind the submitted `boarder` to the caller | Elevation of Privilege / Tampering | `@request.body.boarder.user = @request.auth.id \|\| @request.auth.is_admin = true` (PITFALLS Pitfall 2; this phase's Section 1) |
| Update-rule evaluated against stored value lets a hand-crafted PATCH reassign the row | Tampering | `:isset` guard (PITFALLS Pitfall 3; this phase's Section 2) — accepted as the exact fix for the already-known PT-RULE-01 backlog item |
| Partially-applied five-rule rewrite leaves some rules referencing a dropped field | Denial of Service (self-inflicted — an entire operation 400/404s) | Author and paste back all five together, in one D-13 evidence block (PITFALLS Pitfall 6) |
| Hand-crafted admin delete of a boarder with history (accepted threat, not mitigated this phase) | Tampering / Repudiation | Recorded explicitly as an accepted threat in `39-SECURITY.md` per D-39-13 — client pre-check only; do not describe as server-enforced in any artifact |
| Fallback branch (if VERIFY-01 fails): hand-crafted non-admin create against another boarder not blocked server-side | Elevation of Privilege (accepted, partial) | Recorded as an accepted threat per D-39-06 if and only if the fallback fires; client-side boarder pinning is defense-in-depth only in that branch |

## Sources

### Primary (HIGH confidence)
- `pocketbase.io/docs/api-rules-and-filters` — fetched directly this session; `:isset` syntax, status-code-per-rule map, `?=` operator semantics
- `.planning/phases/39-payment-subject-rework/39-CONTEXT.md`, `.planning/phases/38-boarder-roster-foundation/38-COLLECTION.md`, `38-REVIEW.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — read in full this session, ground truth for locked decisions and live schema
- Every source file listed under Code Examples — read in full this session via `Read`, not grepped

### Secondary (MEDIUM confidence)
- `pocketbase.io/docs/working-with-relations` — fetched directly; dot-notation depth limit (confirmed) — did not confirm cascade-delete/RESTRICT behavior (absence noted, not filled in)
- GitHub Discussion #6073 (maintainer statement, createRule traversal + v0.24 dry-submit scoping)
- GitHub Discussion #5667 (worked create-rule relation-ownership example)
- GitHub Discussion #4208 (`:isset` combined-guard pattern, community-confirmed matching official docs' single-field example)
- GitHub Discussion #1812 (maintainer statement on `deleteRule`-based RESTRICT-equivalent and the superuser-bypass caveat)

### Tertiary (LOW confidence)
- GitHub Issue #6498 — unofficial report of required-relation delete refusal; not corroborated by official docs or a maintainer response in the fetched content; flagged as an open question, not a design input
- Field-rename-preserves-data synthesis (search-engine aggregation, not a direct official-docs fetch)
- Required-relation-flip-doesn't-retroactively-validate (no direct citation found; consistent with this project's own PITFALLS.md Pitfall 7 reasoning)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, confirmed against `STACK.md` and `package.json`
- Architecture: HIGH — every file/pattern read directly this session, not inferred
- PocketBase rule-syntax forms (createRule traversal, `:isset`): MEDIUM — official docs confirm `:isset`; createRule traversal rests on maintainer statement only, exactly why VERIFY-01 is a live gate
- Delete/orphan behavior: LOW on the newly-surfaced RESTRICT-like refusal claim — explicitly flagged as an open question for the live VERIFY-05 probe to resolve, not a fact to plan around

**Research date:** 2026-08-05
**Valid until:** 30 days (PocketBase server version and this project's schema are the volatile inputs; re-verify if the server is upgraded before this phase executes)
