# Domain Pitfalls — v5.0 Admin Payment Ledger

**Domain:** Adding an admin-managed roster + admin-on-behalf write path + tags to an existing per-user-isolated PocketBase app (PayTime)
**Researched:** 2026-08-04
**Confidence:** HIGH — grounded in this repo's own PROJECT.md-documented PocketBase v0.29.x behavior (D-13, the `@request.body.*` fix, the `getList()` count-path 400 bug, the stored-value update-rule gap already flagged as backlog item PT-RULE-01) plus the CONCERNS.md-documented `isSuperUser = isLoggedIn` mistake already made once in this exact codebase (gift-exchange). This is project-specific analysis of PocketBase rule semantics and this app's existing code, not general web-app security advice.

> Mental model for this milestone: v5.0 is not additive, it is a **subject-model migration**. Every one of `paytime_payments`'s five API rules currently keys off `user = @request.auth.id`; all five get rewritten to traverse `boarder.user = @request.auth.id`, and one of the five (`create`, and arguably `update`) must ALSO gain an admin bypass that the old model never needed. A wrong rule doesn't crash the app — it either silently over-shares (privilege escalation) or silently returns nothing (looks like a UI bug, per this project's own documented 404-not-403 trap). Treat the rule rewrite as the highest-risk single task in the milestone.

---

## Critical Pitfalls

### Pitfall 1: Admin check that a non-admin can satisfy

**What goes wrong:**
A rule intended to gate admin-only power — writing another boarder's row, listing every boarder's payments in the new Admin Ledger — is written as "is logged in" instead of "is admin," e.g. `@request.auth.id != ""` where `@request.auth.is_admin = true` was needed. Every boarder, admin or not, gets admin powers.

**Why it happens:**
This exact bug already exists elsewhere in this codebase: `GiftExchangeManage.vue: isSuperUser = computed(() => authStore.isLoggedIn)` (CONCERNS.md, "Manage page exposed to anyone authenticated"). It's a one-token-swap mistake (`auth.id != ""` vs `auth.is_admin = true`), and PocketBase gives no compile-time signal — a wrong rule just quietly widens who can write, with no error anywhere.

**How to avoid:**
Every admin-only rule must reference `@request.auth.is_admin = true` explicitly, never bare `@request.auth.id != ""`. Author broken and fixed forms side by side for review:

- Broken: `createRule: @request.auth.id != ""`
- Fixed: `createRule: @request.auth.is_admin = true || (@request.body.boarder != "" && @request.body.boarder.user ?= @request.auth.id)`

**Warning signs:**
A non-admin test account can create/update a payment row for a boarder that isn't their own, or can pull data from the Admin Ledger's underlying `list` endpoint via a raw API call even though the UI hides the tab.

**How to avoid regressions:** grep every new/changed rule expression for the literal substring `is_admin` and confirm it's never substituted with a bare truthiness check on `@request.auth.id`.

**Phase to address:**
The `paytime_payments` rule-rewrite phase — verify with two tokens (an admin account and a non-admin account) before merging, not just the admin path.

---

### Pitfall 2: Create rule lets any authenticated user pick an arbitrary boarder

**What goes wrong:**
The rewritten `createRule` allows any authenticated caller (`@request.auth.id != ""`) without also constraining which `boarder` id they attach to the new row. A non-admin boarder submits `boarder: <someone-else's-id>` and fabricates a payment against a housemate — inflating or deflating what the ledger says that person paid.

**Why it happens:**
The v1.0 create rule only had to check `@request.body.user = @request.auth.id` because the subject *was* the account — there was no dropdown, no id to spoof. Now the subject is a relation the client picks from a `<Select>`. Nothing server-side stops the request body from naming a different relation id than the one the UI offered; the UI is not the enforcement boundary.

**How to avoid:**
Bind ownership of the relation to the caller, with an explicit admin bypass:

- Broken: `createRule: @request.auth.id != ""`
- Broken (looks safer, still wrong — checks existence, not ownership): `createRule: @request.body.boarder != ""`
- Fixed: `createRule: @request.auth.is_admin = true || @request.body.boarder.user ?= @request.auth.id`

Note `?=` (PocketBase's "any/all" relation match operator) rather than bare `=`. `boarder.user` is a single-valued relation here, so `=` would technically also work, but `?=` is the idiomatic, safety-preferred form for relation-field comparisons in PocketBase rules and avoids surprises if the relation is ever widened to multi-value.

**Warning signs:**
A non-admin successfully creates a row naming a foreign boarder id via devtools/curl, even though `ManagePayment.vue` pins non-admins to their own boarder in the UI.

**Phase to address:**
Same `paytime_payments` rule-rewrite phase as Pitfall 1 — these two checks live in one `createRule` expression and must be authored and tested together, not split across tasks.

---

### Pitfall 3: Update rule permits reassigning a row to a different boarder (stored-value evaluation)

**What goes wrong:**
PocketBase evaluates the `updateRule` filter against the record's **currently stored** state, not the state the request would produce. So `updateRule: boarder.user = @request.auth.id` passes because the *stored* boarder still belongs to the caller — and then the request's own body is applied on top, including a `boarder` field that reassigns the row to someone else. The check that looked like "you must own this row" never re-validates who the row belongs to *after* the write.

**Why it happens:**
This is the exact bug class PayTime v1.0 already hit and documented under `paytimePaymentMapper.ts`: *"`user` is deliberately omitted [from the update mapper]. PocketBase evaluates the update rule against the record's stored values, so `user = @request.auth.id` passes on a request that also sets `user` to somebody else — which would hand the record away."* The v1.0 fix was **client-side only** (the mapper never sends the owner field) — and the project's own backlog already flags the gap it leaves: *PT-RULE-01 — "The frontend never sends the owner field on update (asserted by test) but a hand-crafted API call still could."* v5.0 reproduces the identical shape on a new field name (`boarder` instead of `user`). If the rewritten rule copies the same pattern without closing it server-side, the milestone ships the same hole again, just relocated.

**How to avoid:**
Close it server-side this time. Use PocketBase's `:isset` modifier to detect whether the request body even touches the relation, and compare any submitted value against the record's **own stored value** (not the auth id) so any attempt to change it fails the rule:

- Broken: `updateRule: boarder.user = @request.auth.id` — passes on the stored value, then the body reassigns `boarder`
- Fixed (non-admin can never move a row; admin can always): `updateRule: @request.auth.is_admin = true || (boarder.user = @request.auth.id && (@request.body.boarder:isset = false || @request.body.boarder = boarder))`

Keep the client-side field omission too (defense in depth, matches the existing project convention in `mapToUpdatePayment`) — but the rule above is what actually stops a hand-crafted request, which is the whole point of PT-RULE-01.

**Warning signs:**
A non-admin's authenticated PATCH to `paytime_payments` with a `boarder` field pointing at a different boarder's id succeeds instead of returning 404.

**Phase to address:**
`paytime_payments` rule-rewrite phase. Treat this as explicitly closing PT-RULE-01 — write it into the phase's acceptance criteria rather than assuming the rewrite "naturally" absorbs it (the milestone context note itself only says "likely absorbed... re-check rather than doing it twice").

---

### Pitfall 4: Boarder-roster list rule so open it leaks the whole roster to unauthenticated callers

**What goes wrong:**
`paytime_boarders` needs to be "readable by every authenticated user" per the milestone's target features. The rule that looks like it means that is an empty string. In PocketBase, `listRule: ""` (empty string) does **not** mean "deny" or "no rule yet" — it means **public, unauthenticated access allowed**. `listRule: null` (left unset) is the one that restricts to superusers only. In the Admin UI these two states are one accidental click apart (an empty text box vs the rule toggle left off), and "readable by every authenticated user" is exactly the phrase that tempts someone to leave the box blank thinking blank means permissive-but-gated.

**Why it happens:**
This project has already been bitten by adjacent PocketBase rule-syntax surprises this exact shape — `@request.body.*` vs the deprecated `@request.data.*` reads as identical intent but behaves completely differently. `null` vs `""` is the same family of trap: the value that looks like "nothing configured yet" is actually the least restrictive one, not a safe default.

**How to avoid:**
The roster's list and view rules must be an explicit non-empty predicate:

- Broken: `listRule: ""` — public; an unauthenticated request enumerates every boarder's name and tags
- Fixed: `listRule: @request.auth.id != ""`

Apply the same fix to `viewRule`.

**Warning signs:**
A `curl` request (or an incognito tab) with no auth token against `/api/collections/paytime_boarders/records` returns the full roster.

**Phase to address:**
The `paytime_boarders` collection-creation phase — the D-13 smoke probe for this phase must include an **unauthenticated** request, not only an authenticated one, since the authenticated case will pass regardless of which rule form was used.

---

### Pitfall 5: cascadeDelete silently destroys payment history

**What goes wrong:**
Payment history is the asset this app exists to protect (per PROJECT.md's Core Value: "the admin being able to see who has and hasn't paid for a given month" must always work). Two new/changed relation fields sit upstream of it: `paytime_boarders.user` (optional link to an account) and `paytime_payments.boarder` (required link to a boarder). If either is configured with `cascadeDelete: true`:

- Deleting a `users` account (e.g. closing a former boarder's login after they move out) cascades into deleting their `paytime_boarders` row — and if *that* relation also cascades, every `paytime_payments` row that boarder ever logged disappears with it. A routine account cleanup silently erases months of payment history.
- Deleting a boarder row directly — an admin roster-management action v5.0 explicitly introduces — has the same effect on their payment history if `paytime_payments.boarder` cascades.

**Why it happens:**
PocketBase's Admin UI relation-field editor defaults the cascade toggle off, but it's a single checkbox that's easy to flip "for tidiness" while setting up the new relations, and its effect is invisible until someone actually deletes a parent record — by which point the child rows are already gone, with no undo and no soft-delete to fall back to.

**How to avoid:**
Both new/changed relations should be `cascadeDelete: false`. Deleting a `users` account must never touch `paytime_boarders`; deleting a `paytime_boarders` row must never touch `paytime_payments`. If a boarder needs to leave the active roster, prefer an `is_active`/archived flag over deletion entirely — an orphaned payment (a row whose `boarder` relation resolves to nothing) is a UI edge case to handle gracefully (show "unknown boarder," let it be filtered out or flagged), not a data-loss event. If boarder deletion must remain possible, block it in the UI when that boarder has any payment history, rather than relying on the relation config alone to prevent loss.

**Warning signs:**
Deleting a test boarder (or a test user account) in the Admin UI, or through any future roster-management screen, makes rows disappear from the payment log / monthly report / admin ledger that reference no other boarder.

**Phase to address:**
The `paytime_boarders` collection-creation phase (where both relation fields are configured). The D-13 paste-back for this phase must include the actual `cascadeDelete` boolean for both relations — "I created the relation" is not evidence either way.

---

### Pitfall 6: Partially-applied five-rule rewrite

**What goes wrong:**
Rewiring `paytime_payments` from a `user` subject to a `boarder` subject touches, all at once: the new relation field, all five API rules (list/view/create/update/delete), the 1 existing prod record's backfill, and two hardcoded client `filter:` strings (`PaymentLog.vue:38` — `` filter: `user = "${auth.user.id}"` ``, and `MonthlyReport.vue`'s grouping/`expand: "user"` logic). Because the prod MCP env is SchemaRead-only, there is no scripted or transactional migration path — every change is a separate, manual Admin-UI edit. It's easy to save 3 of 5 rules and move on, believing the migration is "basically done." Any rule left referencing the now-dropped `user` field errors at rule-evaluation time (the expression references a field that no longer exists on the collection), which breaks that *entire* operation, not just the intended change.

**Why it happens:**
This is the same failure category as v4.2's BUG-01 (a trust-based "done" signal on an Admin-UI step silently no-op'd, closed by the D-13 invariant) — except the risk here isn't "forgot to create a collection," it's "edited some but not all of five interdependent rule fields." There is no atomicity across the five rule fields in the Admin UI; each is saved independently, and none of them cross-validate against the others.

**How to avoid:**
Treat "rewrite the five rules" as one indivisible unit of work, not five separately-completable checklist items. Sequence so nothing breaks mid-migration: (1) all five rules reference `boarder`/`boarder.user`, never bare `user`; (2) the 1 existing record is backfilled with a valid `boarder` value; (3) both client `filter:` strings are updated to filter on `boarder`, not `user`; only after all three does the `user` field itself get dropped from the collection. Per this project's D-13 invariant, the phase task must require the user to paste back the actual, verbatim text of all five rule expressions as configured — not "I updated the rules" — plus a code-side smoke probe that exercises list, view, create, update, and delete against the live instance with both an admin token and a non-admin token, asserting the expected pass/fail on each.

**Warning signs:**
One of the five operations 404s (denied) or 400s (references an unknown field) while the other four appear to work fine — this is exactly the signature of a partially-applied migration, and per Pitfall 8 it will present as an unexplained empty list or a generic error, not an obvious "schema mismatch" message.

**Phase to address:**
The rule-rewrite / backfill phase — the highest-risk single phase in this milestone, because it changes both schema and every access rule simultaneously through a manual, non-transactional tool.

---

### Pitfall 7: Required-relation flip before backfill orphans the one existing record

**What goes wrong:**
If the new `boarder` relation on `paytime_payments` is marked `required: true` before the single existing prod record (Cedrick's `2026-07` electricity row, ₱123) is backfilled with a boarder id, that record is left with an empty relation. PocketBase does not retroactively enforce a newly-added `required` constraint on rows that already existed when the constraint was added, so the record survives in the database untouched — but any rule that traverses `boarder.user = ...` evaluates a null/empty relation as non-matching. The record silently vanishes from every list or view any caller makes, admin included, with no error anywhere.

**Why it happens:**
"Make the field required" and "backfill the existing data" are two separate, manually-ordered Admin-UI actions with nothing in the tooling to enforce the correct sequence. The more "obviously correct-looking" order — lock down the schema first, then fill in data — is actually the wrong order here.

**How to avoid:**
Sequence explicitly: (1) add `boarder` as an *optional* relation field first; (2) backfill the existing record via an authenticated update call; (3) verify the backfilled record round-trips through the same rules the app will use (list it as its owner, list it as admin); (4) only then flip `boarder` to required. Do not treat step 3 as implied by step 2 succeeding without error — verify the read path too, since the write can succeed while the read silently fails later for an unrelated reason (a still-broken rule, per Pitfall 6).

**Warning signs:**
The one pre-existing payment record disappears from every view (My Payments, Monthly Report, and the new Admin Ledger) after the migration — easy to write off as "test data cleanup" rather than recognize as an orphaned record, since it's a single low-value sample row.

**Phase to address:**
Same rule-rewrite / backfill phase as Pitfall 6 — sequence it as one explicit ordered checklist rather than parallelizable subtasks.

---

## Client-Side Admin Gate: Why Tampering Can't Leak Data (And What Would Make It Load-Bearing)

`isAdmin = computed(() => auth.user?.is_admin === true)` in `PayTimeApp.vue` currently drives `v-if="isAdmin"` on the Monthly Report tab, and will drive the new Admin Ledger tab and the admin-only boarder selector in `ManagePayment.vue`. `is_admin` reaches the client because it's a field on the authenticated user's own record, included in the auth response and persisted by the PocketBase SDK's default `authStore` (backed by `localStorage`, per `src/stores/auth.ts`) so the session survives a page reload.

**Why a tampered client is safe, given correct server rules:** flipping the local `isAdmin` computed — via devtools, or by editing the persisted auth-store payload in `localStorage` — only changes what Vue renders: which tabs show, which selector appears. It cannot change the `is_admin` field PocketBase itself holds for that user server-side. Every list/view/create/update/delete request PocketBase receives is re-evaluated against `@request.auth.is_admin`, which PocketBase resolves from **its own stored copy** of the record belonging to the auth token on the request — never from anything the client claims in the request body, headers, or local state. A non-admin who tricks the UI into rendering the Admin Ledger tab still gets an empty or denied result from every underlying PocketBase call, because that check happens independently, server-side, per request, regardless of what the client believes about itself.

**Specific mistakes that would make the client gate load-bearing instead of cosmetic:**

1. **A rule reads a client-suppliable field instead of the auth record.** For example, `createRule` or `updateRule` checking `@request.body.is_admin = true` — this lets a hand-crafted request simply *claim* admin in its payload, since `@request.body.*` reflects whatever the caller sent, not anything verified.
2. **An admin-only surface is gated only in the component, with no matching collection rule.** The new Admin Ledger view and the boarder-roster CRUD screen must each have their own server-side list/view/create/update rules restricting them to `@request.auth.is_admin = true`. If a developer assumes "the tab is hidden, that's enough" and never writes or updates the underlying rule, the surface is wide open to anyone who calls the API directly — this is not hypothetical, it is the exact mistake already present once in this codebase on `GiftExchangeManage.vue`, whose *only* gate is a client-side `isSuperUser` computed and an unprotected route (CONCERNS.md: "Manage page exposed to anyone authenticated").
3. **A rule's relation traversal resolves permissively on an empty/missing relation.** E.g. gating something on `boarder.tags ?= "admin"` when a boarder has no tags at all — verify what an empty relation/array actually evaluates to (should be false, not vacuously true) before relying on it, and always test the negative case (a genuine non-admin token) during the D-13 smoke probe, not only the positive case.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Omit the owner/subject field client-side on update (existing `mapToUpdatePayment` pattern) without also closing the update rule server-side | Fast, no rule authoring needed, matches the shipped v1.0 pattern | Leaves exactly the PT-RULE-01 gap open on a new field name — a hand-crafted API call can still reassign a row | Never on its own; acceptable only as a second layer alongside the server-side `:isset` guard in Pitfall 3 |
| Leave `paytime_boarders.tags` as free text instead of a fixed vocabulary | No schema decision needed up front | Typos fragment the roster ("VIP" vs "vip" vs "Vip") the same way free-text boarder names were explicitly rejected for in the Key Decisions table | Never for this milestone — the whole point of `paytime_boarders` existing is to avoid this exact fragmentation; don't reintroduce it one level down at the tag layer |
| Ship the Admin Ledger with `getList()` instead of `getFullList()`/`skipTotal` "because we'll add pagination later" | Looks like the "proper" API surface from day one | 400s immediately against this project's documented rule shape (relation traversal + boolean check) — not a future problem, a day-one bug | Never; use `getFullList()` or explicit `skipTotal: true` from the first commit |

## Integration Gotchas

Recurring PocketBase-specific traps this project has already documented — and exactly how each recurs on v5.0's new surfaces (a new tab, a new collection, new filtered queries):

| Trap | New surface it hits in v5.0 | Concrete failure |
|------|------------------------------|-------------------|
| Rule violations return **404, not 403** | New `paytime_boarders` roster list (boarder selector, roster admin screen); new Admin Ledger `paytime_payments` list; the rewritten `paytime_payments` rules generally | A wrong roster rule, or a still partially-broken rewritten rule, makes the boarder selector or ledger render an empty list — this reads as "no boarders yet" / "no payments this month," not "access denied." Any newly-empty list introduced by this milestone must be checked with a raw authenticated API call before being treated as a UI bug. |
| `createRule` needs `@request.body.*`, never the deprecated `@request.data.*` | The **entirely new** `paytime_boarders` create rule, and the **rewritten** `paytime_payments` create/update rules | Two brand-new-from-scratch rules are being authored in this milestone (roster, plus the rewritten payments rules) — each is a fresh chance to reach for the deprecated syntax and get a silent, hard-to-diagnose 403/404 that looks like a permissions bug rather than a typo. |
| SDK's default `requestKey` is `method + path`, **excludes the query string** | New `getFullList` calls: the boarder roster (for the selector inside `ManagePayment` and for any roster-management screen), and the Admin Ledger's filtered `paytime_payments` fetch (by month/tag/boarder/category) | The milestone adds at least two, likely three, new mount-path `getFullList` calls sharing collections that already have locked keys (`paytime-payments-list`, `paytime-report-list`). The Admin Ledger's `paytime_payments` fetch needs its own explicit key (e.g. `paytime-ledger-list`) or it collides with one of the existing two. The boarder-selector's `paytime_boarders` fetch inside `ManagePayment` needs a key distinct from any roster-admin screen's own `paytime_boarders` list (e.g. `paytime-boarders-select` vs `paytime-boarders-manage`) — two differently-filtered calls on the same collection is exactly the shape that silently auto-cancels one of them. |
| PrimeVue `TabPanel` mounts **every** panel unless `lazy` is set | A likely 4th tab (Admin Ledger) added to `PayTimeApp.vue`'s existing `Tabs` shell, and/or a separate boarder-roster admin screen | Today, two `onMounted` fetches already race (My Payments + Monthly Report) and each needed its own `requestKey` — that pattern is established. Adding a 4th tab adds a 3rd/4th concurrent `onMounted` fetch at page load for every admin session, further stressing the requestKey-uniqueness invariant. Keep the existing `v-if="isAdmin"` gating pattern (which genuinely unmounts, unlike `lazy`'s `v-show`) for the new tab too — do not "simplify" by relying on `lazy` for the new tab, since `lazy` was explicitly rejected once already in this codebase (it uses `v-show`, and PayTime's calculator tab needs its unsaved input preserved, not destroyed on switch) and would reintroduce the exact race that `v-if` gating avoids. |
| `getList()` totalItems COUNT path 400s on non-trivial `listRule` expressions | The rewritten `paytime_payments` rules and the new Admin Ledger's effective listRule are exactly this shape: relation traversal (`boarder.user = ...`) plus a boolean check (`@request.auth.is_admin = ...`) | Any paginated UI for the Admin Ledger — likely needed once payments accumulate across multiple boarders and months — must use `getFullList()` or `getList(page, perPage, { skipTotal: true })` from the very first implementation, never plain `getList()` "because it has built-in pagination." This project has already documented this exact rule shape breaking the count path (D-31-B). |
| Tailwind v4 utilities are layered; PrimeVue's runtime CSS is not | The new Admin Ledger's filter bar (month/tag/boarder/category selectors) and any boarder-roster admin table, both likely needing mobile-hide/show breakpoints | Follow the exact convention already established in `PaymentLog.vue` (`sm:hidden` on a wrapping `<div>` around the kebab-menu `Button`, never on the `Button` itself): breakpoint classes go on plain wrapper elements, never directly on a PrimeVue `Select`/`Button`/`DataTable`/`Tag`. A `sm:hidden` placed directly on a new filter control will be silently ignored, reproducing a bug this app already fixed once. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Admin Ledger view built with `getList()` for pagination | 400 "Something went wrong" as soon as the collection's listRule includes the relation traversal + `is_admin` check that v5.0 introduces | `getFullList()` or `getList(page, perPage, { skipTotal: true })` from the first commit (documented project workaround, D-31-B) | Immediately — this is a rule-shape bug tied to how the new rules must be written, not a scale threshold |
| Admin Ledger re-fetches on every filter toggle without a stable, distinct `requestKey` | Rapid filter changes (month, tag, boarder, category) auto-cancel each other, or a stale fetch from the sibling My Payments/Monthly Report tab collides with the ledger's | A single, stable `requestKey` per fetch purpose (e.g. `paytime-ledger-list`), matching the existing `paytime-payments-list`/`paytime-report-list` convention | As soon as more than one boarder has data and someone actually exercises the filters — not a scale problem, a day-one correctness problem |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Admin rule written as `@request.auth.id != ""` instead of `@request.auth.is_admin = true` | Any authenticated boarder gets admin read/write powers — the exact `isSuperUser = isLoggedIn` bug already present elsewhere in this codebase | Grep every new/changed rule for the literal substring `is_admin`; never accept a bare `@request.auth.id != ""` as an admin check |
| Create rule doesn't bind `boarder` to the caller (or admin) | Any boarder can fabricate a payment against another boarder's name | `createRule` must combine `@request.auth.is_admin = true` with `@request.body.boarder.user ?= @request.auth.id` for the self-service path — never accept `@request.body.boarder != ""` (existence) as a substitute for ownership |
| Update rule checks only the stored `boarder` value, not the submitted one | A non-admin PATCH can move their own row onto a different boarder (repeat of PT-RULE-01, on a new field) | Add `@request.body.boarder:isset = false \|\| @request.body.boarder = boarder` to the ownership check; keep the client-side field-omission as a second layer, never the only layer |
| Roster `listRule`/`viewRule` left as `""` instead of `@request.auth.id != ""` | Full boarder roster (names + tags) becomes public to unauthenticated requests | Test the roster list with **no** auth token as part of every smoke probe, not just with a logged-in token |
| `cascadeDelete: true` on `paytime_boarders.user` or `paytime_payments.boarder` | Deleting an account or a boarder silently wipes payment history — the one thing this app must never lose | Set both to `false`; prefer archiving boarders (`is_active` flag) over deletion; block boarder deletion in the UI when payment history exists |
| Admin-only UI (Admin Ledger, roster CRUD) gated only by a client-side `v-if`/route with no matching server rule | Reproduces the exact `GiftExchangeManage.vue` mistake already present in this codebase — the client gate becomes the only gate, and it's not one | Every admin-only view's underlying collection calls must carry their own server-side rule; treat the client `v-if` as cosmetic, never as the enforcement boundary |
| New tag/boarder/category ledger `filter:` strings built with template-literal concatenation | Same class of injection risk this project has already flagged for gift-exchange (`"` in an input value breaks PocketBase's filter parser); tag/boarder values here are admin-entered so the practical risk is lower, but month/category values come from UI controls that could still be tampered with via devtools | Use PocketBase's parameterized filter form for any value that isn't a hardcoded enum, rather than `` `month = "${value}"` `` string interpolation |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| A rule bug presents as an empty list, not an error | An admin or boarder assumes "no data yet" and either re-enters payments that already exist but are hidden by a rule mistake, or a developer chases a phantom UI bug instead of the real rule | Any list that goes newly-empty during this milestone's development must be checked against a direct authenticated API call before touching UI code — this exact 404-as-empty-list trap is already documented in this project |
| Deleting a boarder with payment history quietly orphans or destroys their rows | The admin loses the ability to answer "did this boarder ever pay?" — directly undermines the milestone's stated core value | Block deletion (or require a confirmation naming the affected row count) whenever a boarder has any `paytime_payments` history; never make deletion a single, silently-destructive click |
| Tag rename silently orphans historical filters | A boarder tagged "vip" gets relabeled "priority"; filtering the ledger by "vip" (a bookmarked view, muscle memory) returns nothing with no explanation that the tag moved | Before treating rename as a supported roster-admin action, empirically verify (and paste back per D-13) whether renaming a `select` value in the Admin UI propagates to already-stored records or leaves them holding the old string |

## "Looks Done But Isn't" Checklist

- [ ] **Rule rewrite:** All five `paytime_payments` rules were updated in the same sitting — verify by pasting back the literal text of all five, not just the ones that obviously needed to change. `list`/`view` are the easy ones to skip since a subject-field rename doesn't visually "look like" it should touch them, but they still reference the old `user` field.
- [ ] **Admin bypass:** Every rewritten rule that reads "boarder owns this row" also carries `@request.auth.is_admin = true ||`. Verify by attempting the admin-on-behalf create/update path with a **non-admin** token and confirming it's rejected — testing only that the admin token succeeds proves nothing about the boundary.
- [ ] **Update-rule reassignment guard:** Confirm a hand-crafted PATCH (not the `ManagePayment` UI) cannot move a row to a different boarder. The UI omitting the field is not evidence the server rejects it — this is the specific gap PT-RULE-01 already calls out.
- [ ] **Roster list rule:** Confirm with a genuinely unauthenticated (no-token) request that the roster is NOT publicly listable. "Readable by every authenticated user" and "readable by everyone" look identical if every manual test is performed while logged in.
- [ ] **cascadeDelete:** Paste back the actual boolean for both `paytime_boarders.user` and `paytime_payments.boarder`. "I created the relation" proves nothing about the cascade setting either way.
- [ ] **Backfill:** The 1 existing prod record has a non-empty `boarder` value and is visible post-migration in all relevant views (My Payments, Monthly Report, Admin Ledger), for both its own owner's token and an admin token.
- [ ] **requestKey uniqueness:** Every new `getFullList` call (boarder selector, roster admin screen, Admin Ledger) has its own explicit, distinct `requestKey`, and that key is added to PROJECT.md's locked-invariant list alongside the existing `paytime-payments-list`/`paytime-report-list`.
- [ ] **Tag filter correctness:** "Filter by tag X" returns exact matches only against whichever storage was chosen (select / JSON / join collection) — test a tag name that is a substring of another (e.g. "vip" vs "vip_room") to catch LIKE-based false positives.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Wrong admin rule shipped to prod (any boarder gained admin write) | MEDIUM | Fix the rule immediately via Admin UI; audit `paytime_payments` rows created/updated since the bad rule went live for anomalies (mismatched `recorded_by`, unexpected boarder ids). With only 6 users and 1 boarder in prod today, a full manual audit is feasible while the dataset stays this small. |
| `cascadeDelete` wiped payment history | HIGH — data is gone, no soft-delete exists | No in-app recovery; restore from a PocketBase backup/snapshot if one exists. This is the strongest argument for setting `cascadeDelete: false` before ever exercising boarder deletion, including in testing against prod-adjacent data. |
| Required relation flipped before backfill, orphaning the existing record | LOW | Only 1 record is affected currently; manually set its `boarder` field via an authenticated call once the relation is corrected. |
| Partially-applied rule rewrite (some of the 5 rules still reference `user`) | LOW–MEDIUM | Not destructive, just broken — walk the all-five-rules checklist again. The failure mode (404/400 on some operations, success on others) is loud enough to catch before shipping if the D-13 smoke probe is actually run against all five operations, not just one. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Admin check satisfiable by any authenticated user | `paytime_payments` rule-rewrite phase | Non-admin token attempts an admin-only action (write another boarder's row, list the Admin Ledger) and gets 404 |
| Create rule doesn't bind boarder to caller | `paytime_payments` rule-rewrite phase | Non-admin token creates a payment naming a foreign `boarder` id and gets 404; admin token succeeds against the same request shape |
| Update rule allows reassignment via stored-value evaluation | `paytime_payments` rule-rewrite phase | Non-admin token PATCHes their own row's `boarder` field to a different id and gets 404; a PATCH that omits `boarder` still succeeds for a legitimate edit |
| Roster list/view rule public (`""` vs `@request.auth.id != ""`) | `paytime_boarders` collection-creation phase | Unauthenticated (no-token) request to list/view `paytime_boarders` gets 404 |
| `cascadeDelete` destroys payment history | `paytime_boarders` collection-creation phase | Paste-back of both relation fields' `cascadeDelete` values; delete a disposable test boarder with a test payment attached and confirm the payment is NOT silently removed (or that deletion is blocked outright) |
| Partially-applied five-rule rewrite | Rule-rewrite / backfill phase | All 5 rules pasted back verbatim in one review pass; a smoke probe exercises list/view/create/update/delete with both an admin and a non-admin token |
| Required-relation flip before backfill orphans existing record | Rule-rewrite / backfill phase | The 1 existing prod record is visible in all three views post-migration, for both its owner and an admin |
| requestKey collisions on new roster/ledger fetches | Admin Ledger view phase + admin-on-behalf write path phase | PROJECT.md's requestKey invariant list is updated with the new keys before the phase closes; both sibling tabs' data is confirmed to load simultaneously on page mount |
| `getList()` 400 on ledger pagination | Admin Ledger view phase | Ledger list implemented with `getFullList()`/`skipTotal: true` from the first commit, not retrofitted after a 400 is observed in testing |
| Tag storage filter-syntax mismatch / orphaned tag rename | Tags phase | A tag whose name is a substring of another tag is used as a filter-correctness test case; if tags are `select`-based, a rename is tested against an existing tagged boarder to confirm propagate-vs-orphan behavior before rename is relied on as a supported roster-admin action |
| Client-side admin gate treated as sufficient | Every phase introducing an admin-only surface | For each new admin-only view/action, confirm a matching PocketBase rule exists independent of the Vue `v-if` — a standing code-review checklist item across the milestone, not a one-time phase task |

## Sources

| Topic | Source | Confidence |
|---|---|---|
| `@request.body.*` vs deprecated `@request.data.*` in createRule | PROJECT.md Key Decisions (confirmed against live PB instance, v4.1 Phase 28) | HIGH |
| PocketBase evaluates `updateRule` against stored record values, not post-write values | PROJECT.md Key Decisions + `paytimePaymentMapper.ts` inline documentation (PayTime v1.0) | HIGH |
| PT-RULE-01 backlog item — update rule reassignment gap not closed server-side | PROJECT.md Active/Future Candidates section | HIGH |
| `getList()` totalItems COUNT path 400s on non-trivial listRule expressions (D-31-B) | PROJECT.md Key Decisions (verified v4.2) | HIGH |
| Admin-UI checkpoints require paste-back + code-side smoke probe (D-13 invariant), precedent BUG-01 | PROJECT.md Key Decisions | HIGH |
| requestKey uniqueness — SDK default key is `method+path`, excludes query string | PROJECT.md Constraints (locked invariant) + `PaymentLog.vue`/`MonthlyReport.vue` inline comments | HIGH |
| PrimeVue `TabPanel` mounts every panel without `lazy`; `lazy` uses `v-show` and was rejected for PayTime's calculator tab | PROJECT.md Key Decisions (PayTime v1.0) | HIGH |
| Tailwind v4 layered utilities lose to PrimeVue's unlayered runtime CSS | PROJECT.md Key Decisions + `PaymentLog.vue` inline comments (PayTime v1.0) | HIGH |
| `isSuperUser = isLoggedIn` — client-only admin gate with no matching server rule | `.planning/codebase/CONCERNS.md` ("Manage page exposed to anyone authenticated", "Same isSuperUser collision") | HIGH |
| `filter:` string-concatenation injection risk in PocketBase queries | `.planning/codebase/CONCERNS.md` ("PocketBase filter-string interpolation") | HIGH |
| PocketBase `null` vs `""` rule semantics (unset = superuser-only, empty string = public) | PocketBase's documented rule-engine model, applied here to the new `paytime_boarders` roster rule | HIGH |
| `:isset` request-body modifier and `?=` relation "any/all" match operator | PocketBase's documented rule-syntax model, applied here to the rewritten create/update rules | HIGH |
| `paytime_payments` schema, existing rules, and the 1 existing prod record | PROJECT.md Context/Current State section | HIGH |

---
*Pitfalls research for: PayTime v5.0 Admin Payment Ledger — admin-on-behalf write path on a per-user-isolated PocketBase app*
*Researched: 2026-08-04*
