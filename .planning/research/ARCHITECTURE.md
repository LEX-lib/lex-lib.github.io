# Architecture Research

**Domain:** Vue 3 SPA mini-app — admin-managed roster + ownership-model rewrite on a PocketBase-backed payment tracker (Lexarium PayTime v5.0)
**Researched:** 2026-08-04
**Confidence:** MEDIUM overall — HIGH for everything grounded in the actual code (cited file:line below); MEDIUM/LOW for PocketBase rule syntax not yet exercised against the live instance (flagged UNCONFIRMED throughout, per the project's own stated risk)

> **Caveat on "current behaviour" claims below:** the PB schema and API rules are managed entirely through the PocketBase Admin UI — there is no migration file, `pb_schema.json`, or rules file checked into this repo (confirmed: no `*migration*`/`*pb_schema*` files exist under the repo root). Every claim about *current* rule text is therefore sourced from `.planning/PROJECT.md`'s prose/Key Decisions (which is itself derived from live-instance testing during earlier phases, e.g. the Phase 28 `@request.body.user` confirmation), not from a file I can cite a line number in. Claims about current *component* behaviour are cited against the actual `.vue`/`.ts` files.

## Standard Architecture

### System Overview — current vs. v5.0

```
CURRENT (v1.0)                                   v5.0 TARGET
┌─────────────────────────┐                      ┌─────────────────────────────────────┐
│ PayTimeApp.vue           │                      │ PayTimeApp.vue  (UNCHANGED)          │
│  Tabs: log/calc/report   │                      │  Tabs: log/calc/report               │
└──────┬───────────┬───────┘                      └──────┬────────────┬─────────────────┘
       │           │ (isAdmin)                           │            │ (isAdmin)
┌──────▼──────┐ ┌──▼────────────┐             ┌──────────▼──────┐ ┌──▼─────────────────────────┐
│ PaymentLog  │ │ MonthlyReport │             │ PaymentLog        │ │ MonthlyReport.vue (SHELL)  │
│ own rows,   │ │ own fetch,    │             │ (own boarder      │ │ fetches boarders (shared   │
│ user filter │ │ expand:"user" │             │ resolved via      │ │ composable) + month-scoped │
└──────┬──────┘ └───────────────┘             │ useBoarderRoster) │ │ payments; nested Tabs:     │
       │                                       └──────┬────────────┘ │  By Boarder | Ledger |     │
┌──────▼──────┐                                        │              │  Boarders                  │
│ ManagePayment│  create: {user: auth.id, ...}          │              └──┬──────────┬──────────┬───┘
│ (own row    │  update: omits user (rule evaluated     │                 │          │          │
│  only)      │  against STORED value)                 ▼          ┌──────▼───┐ ┌────▼──────┐ ┌─▼────────────┐
└─────────────┘                                 ┌──────────────┐  │Monthly   │ │AdminLedger│ │BoarderRoster │
paytime_payments.user → users (required,        │ManagePayment │  │ReportView│ │View (new) │ │View (new)    │
cascadeDelete:true)                             │(admin gets a │  │(props-   │ │props-only,│ │props-only,   │
                                                 │boarder Select│  │only,     │ │client-side│ │+ManageBoarder│
                                                 │ from the     │  │extracted │ │filter over│ │dialog        │
                                                 │ roster;      │  │Panels    │ │the same   │ └──────────────┘
                                                 │ non-admin    │  │markup)   │ │payments   │
                                                 │ pinned to    │  └──────────┘ │list)      │
                                                 │ own boarder) │                └───────────┘
                                                 └──────────────┘
paytime_payments.boarder → paytime_boarders (required, cascadeDelete:FALSE — blocks
  accidental deletion of a boarder with history instead of silently destroying it)
paytime_payments.recorded_by → users (optional, cascadeDelete:false — audit-only)
paytime_boarders.user → users (optional, cascadeDelete:false — nulls on account deletion)
```

### Component Responsibilities

| Component | Responsibility | New / Modified |
|-----------|-----------------|-----------------|
| `paytime_boarders` (PocketBase collection) | Canonical payment subject; admin-managed roster, tags, optional `users` link | New (Admin UI) |
| `paytime_payments.boarder` | Replaces `user` as the subject relation | New field |
| `paytime_payments.recorded_by` | Audit trail — who actually wrote the row (repurposed from `user`) | Repurposed field (rename, not new) |
| `useBoarderRoster.ts` | Module-level cached fetch of the roster, shared by every consumer | New composable |
| `ManageBoarder.vue` | Admin CRUD dialog for one boarder | New |
| `ManagePayment.vue` | Gains admin boarder selector; non-admin path unchanged in spirit (pinned to own subject) but payload field renames | Modified |
| `PaymentLog.vue` | List filter moves from `user = id` to a boarder-resolved filter | Modified |
| `MonthlyReport.vue` | Becomes the admin-tab **shell**: owns the roster + payments fetch, hosts three nested views | Modified (restructured) |
| `MonthlyReportView.vue` | The current per-boarder Panels markup, extracted, now pure props-in | New (extraction) |
| `AdminLedgerView.vue` | Flat, filterable (month/tag/boarder/category) ledger table | New |
| `BoarderRosterView.vue` | Roster list + `ManageBoarder` wiring, admin-only | New |
| `paytimeBoarderMapper.ts` | Create/update payload shaping for boarders | New |
| `paytimePaymentMapper.ts` | Field renames (`user`→`boarder`/`recorded_by`); update-omission rationale extended | Modified |
| `boarderSchema.ts` | Zod schema for boarder create/edit | New |
| `types/paytime/boarders/types.d.ts` | `PaytimeBoarder` + `AddPaytimeBoarder` | New |
| `types/paytime/payments/types.d.ts` | `PaytimePayment.user` → `boarder`/`recorded_by` | Modified |

## Recommended Project Structure

```
src/
├── composables/
│   └── useBoarderRoster.ts          # NEW — module-level cache, mirrors useFileToken.ts
├── lib/
│   ├── pocketbase/
│   │   ├── paytimePaymentMapper.ts  # MODIFIED — boarder/recorded_by instead of user
│   │   └── paytimeBoarderMapper.ts  # NEW
│   └── paytime/
│       ├── categories.ts            # unchanged
│       ├── paymentSchema.ts         # unchanged
│       └── boarderSchema.ts         # NEW
├── types/paytime/
│   ├── payments/types.d.ts          # MODIFIED
│   └── boarders/types.d.ts          # NEW
└── components/projects/paytime/
    ├── PayTimeApp.vue               # UNCHANGED (no new top-level tab — see Pattern 4)
    ├── PaymentLog.vue               # MODIFIED — filter + own-boarder resolution
    ├── ManagePayment.vue            # MODIFIED — admin Select, payload rename
    ├── ManageBoarder.vue            # NEW
    ├── MonthlyReport.vue            # MODIFIED — becomes the admin-tab shell
    ├── MonthlyReportView.vue        # NEW — extracted Panels markup
    ├── AdminLedgerView.vue          # NEW
    ├── BoarderRosterView.vue        # NEW
    └── __tests__/
        ├── requestKeys.spec.ts      # MODIFIED — mock shape, +1 new key assertion
        └── paymentEdit.spec.ts      # MODIFIED — mock shape (boarder/recorded_by)
```

### Structure Rationale

Every new file slots into a folder that already exists and already has a same-shaped sibling (`paytimeBoarderMapper.ts` next to `paytimePaymentMapper.ts`, `boarderSchema.ts` next to `paymentSchema.ts`, `ManageBoarder.vue` next to `ManagePayment.vue`). Nothing here introduces a new top-level folder, a new state-management layer, or a new library — every new file is a same-shaped twin of an existing one, or a direct extraction from one.

## Architectural Patterns

### Pattern 1: Ownership model rewrite — five rules, concretely

**paytime_boarders (new collection) — low risk, no relation traversal needed:**

```
listRule:   @request.auth.id != ""
viewRule:   @request.auth.id != ""
createRule: @request.auth.is_admin = true
updateRule: @request.auth.is_admin = true
deleteRule: @request.auth.is_admin = true
```
Every authenticated user can read the whole roster (the selector and a boarder's own-record lookup both need this); only the admin can write it. No dot-notation, no relation JOIN — this is the safe half of the rewrite.

**paytime_payments — the risky half:**

```
listRule:   @request.auth.is_admin = true || boarder.user = @request.auth.id
viewRule:   @request.auth.is_admin = true || boarder.user = @request.auth.id
deleteRule: @request.auth.is_admin = true || boarder.user = @request.auth.id
updateRule: @request.auth.is_admin = true || boarder.user = @request.auth.id
createRule: @request.auth.is_admin = true ||
            (@request.body.boarder:isset = true && @request.body.boarder.user = @request.auth.id)
```

**What's confirmed vs. not, and why the risk is uneven across these five:**

- `boarder.user = @request.auth.id` for **list/view/update/delete** is evaluated against the record's **stored** relation — this shape of dot-notation JOIN (up to 6 levels deep) is documented, general PocketBase behaviour: [Working with relations](https://pocketbase.io/docs/working-with-relations/), [API rules and filters](https://pocketbase.io/docs/api-rules-and-filters/) (MEDIUM confidence — official docs, not yet exercised on *this* instance). This is the exact expression PROJECT.md already flags as "the key risk to settle before the plan locks" — general PocketBase support is doc-confirmed, but untested here. **UNCONFIRMED on this instance; smoke-test before writing app code against it** (see Build Order, step 5).
- The **createRule** is the riskiest of the five, and this is a finding beyond what PROJECT.md already flagged: it needs to chase a relation **off `@request.body`** (`@request.body.boarder.user`), not off a stored record — because at create time there is no stored record yet. I could not find PocketBase documentation that explicitly confirms dot-chaining works off `@request.body.<relField>` the way it does off a stored field; the docs only clearly demonstrate direct equality (`@request.body.user = @request.auth.id`) and modifiers like `:isset`/`:changed` on body values, not relation traversal through them. **Mark `@request.body.boarder.user = @request.auth.id` UNCONFIRMED — it needs its own smoke test, independent of and in addition to the list/view/update/delete check.**
  - **Fallback if createRule chaining doesn't work:** since `ManagePayment.vue` already pins non-admins to their own boarder client-side (Pattern 4/6 below), the create path's real-world traffic never sends a foreign `boarder` id from a non-admin — the client-side pin plus the **list/view rule** (which *is* the well-documented shape) is enough defense in depth for a personal boarding-house app with 6 users. If the createRule expression above doesn't validate, drop to `@request.auth.is_admin = true || @request.auth.id != ""` (any authenticated user may create) and rely on list/view/delete to bound what they can subsequently see or touch. This is a legitimate, honestly-weaker fallback, not a silent gap — write it down as a known trade-off if taken.
- `@request.auth.is_admin = true` (a direct field on the auth record, no relation) is standard, low-risk PocketBase syntax and is very likely already live in the current `paytime_payments` rules (PROJECT.md: MonthlyReport is "gated... server-side in the list/view rules", PROJECT.md line 169) — but note PayTime has **never had an end-to-end browser smoke test** (PROJECT.md line 27), so even this existing expression is technically unverified in production. Low risk, still worth confirming in the same smoke-test pass rather than assuming.

**The stored-value update-rule concern carries over exactly, and gets worse if left unmitigated:**

`paytimePaymentMapper.ts:21-30` documents that `mapToUpdatePayment` deliberately omits `user` because PocketBase evaluates the update rule against the record's **stored** value, not the submitted one — so a request that also *sets* `user` to someone else would still pass `user = @request.auth.id` (checked against the old, still-current value) and reassign the record. The same mechanism applies identically to `boarder`: if a hand-crafted request included `boarder: <someone-else's-id>`, `boarder.user = @request.auth.id` still passes (I still own the row *right now*), and the update would silently hand the payment to someone else. **Carry the mitigation forward unchanged: the update mapper must keep omitting the owner-equivalent field (now `boarder`) exactly as it omits `user` today.** Optionally close the gap server-side too — this is backlog item **PT-RULE-01** (PROJECT.md line 188, already flagged as "likely absorbed by v5.0's rule rewrite — re-check rather than doing it twice"):

```
updateRule: @request.auth.is_admin = true ||
  (boarder.user = @request.auth.id &&
   (@request.body.boarder:isset = false || @request.body.boarder.user = @request.auth.id))
```

This reuses the same unconfirmed `@request.body.<rel>.<field>` shape as the createRule fallback above, so treat it as optional hardening layered on top of the mapper-level fix, not a replacement for it.

### Pattern 2: What happens to the existing `user` field

**Repurpose it — don't keep both, don't drop it.** With exactly one production record (`paytime_payments` id `4fsz8cnwo7s05fu`, owned by Cedrick — PROJECT.md line 239, and the literal fixture in `requestKeys.spec.ts:5-19`), a straight PocketBase Admin UI **rename** of `user` → `recorded_by` is the cheapest possible path: it's a relation-to-`users` field being renamed, not retyped, so the one stored value survives untouched with zero conversion. Then:

- **`boarder`** — new required relation to `paytime_boarders`, `cascadeDelete: false` (Pattern 3).
- **`recorded_by`** (renamed from `user`) — flip it from required to **optional**, `cascadeDelete: false`. It stops being the access-control subject and becomes pure audit metadata: "who actually typed this in," which matters once an admin can write rows on someone else's behalf. Nothing in Pattern 1's rules references `recorded_by` at all — it has no access-control role, so it never needs to be defended against reassignment, and the payment mapper can simply never include it on `mapToUpdatePayment` (set once at create, immutable thereafter — matches audit-log semantics and sidesteps another owner-field-on-update class of bug for free).
- Non-admin creates: `recorded_by = auth.user.id` (same as `boarder`'s resolved-own-id) — self-recorded.
- Admin-on-behalf creates: `recorded_by = auth.user.id` (the admin), `boarder = <selected boarder>` — the two fields diverge, which is the whole point of adding it.

### Pattern 3: `cascadeDelete` semantics — the one to get right

PocketBase's cascade behaviour (MEDIUM confidence, official docs + cross-referenced GitHub discussions on [`RelationField`](https://pocketbase.io/jsvm/classes/RelationField.html) and issue reports like [#6498](https://github.com/pocketbase/pocketbase/issues/6498)):

- **Required relation field, `cascadeDelete: false`** — deleting the record being pointed *to* is **blocked**: "Failed to delete record. Make sure that the record is not part of a required relation reference."
- **Required or optional relation field, `cascadeDelete: true`** — deleting the record being pointed *to* **deletes every record that references it** through that field.
- **Optional relation field, `cascadeDelete: false`** — deleting the record being pointed *to* **clears the field to null/empty** on every record that references it; the referencing records survive.

Applied here:

| Field | Required? | cascadeDelete | Effect of deleting the *target* record |
|-------|-----------|----------------|------------------------------------------|
| `paytime_payments.boarder` | **Required** | **false** | Deleting a `paytime_boarders` row that still has payments is **blocked** by PocketBase — an admin cannot fat-finger a boarder deletion and wipe their payment history. This is the correct, safe default. |
| `paytime_payments.recorded_by` | Optional | false | Deleting a `users` account nulls `recorded_by` on any rows they logged (their own or on someone else's behalf). Payment history is untouched; only "who typed this" attribution is lost for that admin's past entries. Acceptable — it's advisory metadata, not the subject. |
| `paytime_boarders.user` | Optional | false | Deleting a `users` account nulls the `user` link on the linked boarder row. The boarder record and every payment attached to it survive untouched — the boarder simply reverts to "no linked account," the same state as a boarder who never had one. This is exactly the desired v5.0 behaviour (admin logs on behalf of boarders without accounts). |

**Flag explicitly — the trap to avoid:** setting `cascadeDelete: true` on `paytime_payments.boarder` is the single most dangerous checkbox in this whole migration. With it enabled, deleting a boarder silently deletes every payment they ever had, with no separate confirmation beyond whatever the boarder-delete UI shows. Given the project's own D-13 invariant ("Admin-UI checkpoints require text paste-back + downstream smoke verify" — PROJECT.md line 300, locked after BUG-01's silent no-op), this field's cascade setting specifically should be part of the paste-back verification, not just acknowledged.

### Pattern 4: Where the admin ledger view lives

**Recommendation: nest it inside the existing admin tab, don't add a new top-level tab, don't bolt a filter mode onto the existing report.** PROJECT.md itself rules out the filter-mode option ("Distinct from the existing per-boarder monthly report" — target features list). Between a new top-level tab and a nested sub-view, the codebase already has a direct precedent for exactly this situation — a tab whose content grows a second, structurally different view: Wallecx's `ExpensesTab.vue` → `ExpensesListView.vue` + `ExpensesReportsView.vue` (`ExpensesTab.vue:233-260`). The shell (`ExpensesTab.vue`) owns the fetch(es) and dialogs; the two views are pure `props`-in, `emit`-up siblings switched by a nested `<Tabs>`.

Apply the identical shape here, reusing the file that's already wired into `PayTimeApp.vue` and already admin-gated (`PayTimeApp.vue:34,43-45`) as the shell — **`MonthlyReport.vue` becomes the shell**, not a new file:

- `MonthlyReport.vue` (shell) — keeps the existing month-scoped payments fetch (`requestKey: "paytime-report-list"`, `MonthlyReport.vue:52`) and gains the roster fetch (via `useBoarderRoster`, Pattern 5). Hosts a nested `Tabs`: **By Boarder | Ledger | Boarders**.
- `MonthlyReportView.vue` (new) — the current per-boarder `Panel` markup (`MonthlyReport.vue:108-198`) extracted verbatim, now receiving `payments`/`boarders`/`month` as props instead of fetching.
- `AdminLedgerView.vue` (new) — flat table, own local filter state (tag/boarder/category — client-side `computed()` over an already-fetched list, exactly like `ExpensesReportsView`'s period selector filters an already-fetched `expenses` prop rather than re-querying).
- `BoarderRosterView.vue` (new) — roster CRUD, reuses the same already-fetched `boarders` ref; no extra fetch.

**Why not a new top-level tab:** it would need its own `v-if="isAdmin"` `Tab`/`TabPanel` pair in `PayTimeApp.vue` *and* its own independent `onMounted` fetch with a third distinct `requestKey` — not wrong, but it duplicates the roster fetch and the payments-for-a-month fetch across two unrelated admin surfaces instead of one, and fragments a single "admin view" mental model into two tabs for what is, from the boarder's or the outside observer's perspective, one feature.

**The `requestKey` trap still applies and needs a deliberate answer, not an accident.** `TabPanel` renders `v-if="lazy ? active : true"` — without `lazy`, **every** panel mounts immediately (documented behaviour this project already hit and fixed once: `useFileToken.ts:14-17`, and asserted by `requestKeys.spec.ts`). If `MonthlyReportView` and `AdminLedgerView` both fetched independently in their own `onMounted`, both would fire the moment the admin tab first renders (its nested `Tabs` also has no `lazy`), racing on default keys exactly like `PaymentLog`/`MonthlyReport` used to. Two ways out, both already established in this codebase:

1. **Preferred, matches the `ExpensesTab` budgets/expenses precedent exactly:** the shell fetches once and passes props down; the two/three child views never call `pb.collection()` themselves. No new `requestKey` needed for them at all.
2. If the ledger's filter needs (arbitrary month range, tag, boarder, category) genuinely can't reuse the report's single-month-equality query, keep the report's fetch in the shell as today and add **one more**, explicit, shell-owned fetch for the ledger under a **new, distinct key** — e.g. `paytime-ledger-list` — extending the project's locked `requestKey`-uniqueness invariant (currently `paytime-payments-list`, `paytime-report-list` — PROJECT.md line 265) to three keys, still all declared in one file where `requestKeys.spec.ts` can assert their distinctness in one place.

Recommend **option 2's data-fetching split, option 1's ownership discipline**: both fetches live in the shell's `onMounted`/`watch`, neither child view fetches for itself.

### Pattern 5: Boarder-data fetching — composable over Pinia

Three consumers need the roster: `ManagePayment.vue` (admin selector + a non-admin's own-boarder resolution), `AdminLedgerView.vue` (filter dropdown + row labels), `MonthlyReportView.vue`/`BoarderRosterView.vue` (row labels / CRUD list). `PaymentLog.vue` does **not** need the full roster — its own list filter only needs *its own* boarder id, which it can get from the same shared cache without holding the whole list in a template.

Evaluated against the options in the question:

- **Fetch per component** — rejected. Three independent `getFullList('paytime_boarders')` calls, mounted simultaneously in different corners of the app (PrimeVue's no-`lazy` mounting applies here too, since `ManagePayment` lives inside the "My Payments" tab and the ledger/report live in the "Monthly Report" tab, and both top-level tabs' content exists in the DOM once `PayTimeApp.vue` renders) reintroduces the exact `requestKey`-collision class of bug this project has already paid down twice (`useFileToken`, `requestKeys.spec.ts`).
- **Hoist into `PayTimeApp.vue` and pass down** — rejected. `PayTimeApp.vue` today has zero data-fetching responsibility (`PayTimeApp.vue:1-11`, it only computes `isAdmin`); giving it a roster fetch means threading `boarders` as a prop through `PaymentLog` → `ManagePayment` on one branch and through `MonthlyReport` → its children on the other, for no benefit over the composable below.
- **A Pinia store** — rejected, but seriously weighed against the standing decision "each tab owns its own state; no new Pinia store" (PROJECT.md line 280, validated v2.0). The roster genuinely *is* cross-tab shared state, which is the shape of thing that decision was written for — however, this codebase already has a working, precedented answer to "cross-tab shared state without Pinia": `useFileToken.ts`, a module-level-cache composable. It solves the identical problem (a small, read-mostly, auth-scoped resource needed by simultaneously-mounted sibling components, with in-flight-dedup so concurrent mounts collapse to one request) for file tokens today. Reaching for the pattern already in the codebase beats introducing a new one for the same shape of problem — Pinia would only earn its keep if the roster needed write-broadcast to many more independent consumers than the three here, which it doesn't.
- **A composable with a module-level cache** — **recommended.** New `src/composables/useBoarderRoster.ts`, mirroring `useFileToken.ts:19-73` structurally: a module-level `boarders` ref, an `inFlight` promise for dedup, `consumers`/`timer` bookkeeping optional (the roster doesn't need periodic refresh the way a 180s-expiring token does — a one-shot fetch on first mount, refreshed only after a boarder is created/edited/deleted via an explicit `refresh()` call from `ManageBoarder`'s `saved` handler, is enough), and a `pb.authStore.onChange` hook clearing the cache on login/logout so a stale roster never survives a user switch.

### Pattern 6: Data flow for admin-on-behalf logging

```
Non-admin flow (unchanged in spirit):
  ManagePayment mounts → useBoarderRoster() → find(b => b.user === auth.user.id)
    → savePayment(): boarder = myBoarder.id, recorded_by = auth.user.id
    → mapToCreatePayment({ boarder, recorded_by, ...parsed.data }) → FormData → create

Admin-on-behalf flow (new):
  ManagePayment mounts, isAdmin → useBoarderRoster() → renders Select of all boarders
    → admin picks a boarder (possibly one with no linked `users` account)
    → savePayment(): boarder = selected.id, recorded_by = auth.user.id  ← diverge from boarder
    → same mapToCreatePayment / same create call — no branching needed in the mapper itself,
      only in how ManagePayment resolves which boarder id to send
```

The mapper does not need to know or care whether the caller is an admin — it always receives a resolved `{ boarder, recorded_by }` pair. All the admin/non-admin branching stays in `ManagePayment.vue`'s template (show/hide the `Select`) and in one small helper (`isAdmin ? selectedBoarderId : myBoarder.value?.id`), not duplicated into the mapper or the schema.

## Data Flow

### Payment list flow (per-user, post-rewrite)

```
PaymentLog.vue onMounted
  → useBoarderRoster() resolves "my boarder" (boarders.value.find(b => b.user === auth.user.id))
  → pb.collection('paytime_payments').getFullList({
        filter: `boarder = "${myBoarder.id}"`,
        requestKey: "paytime-payments-list"   // unchanged key, unchanged collision-avoidance rationale
     })
```
If `myBoarder` is undefined (an authenticated user with no linked boarder row — shouldn't happen post-backfill, but not impossible if a new `users` account is created before the admin links a boarder to it), fall back to an empty list + the existing "No payments logged yet" empty state rather than sending a filter with an undefined id.

### Admin shell flow

```
MonthlyReport.vue (shell) onMounted / watch(month)
  → useBoarderRoster()                                    (shared, one fetch across the whole app)
  → pb.collection('paytime_payments').getFullList({
        filter: `month = "..."`, expand: 'boarder',
        requestKey: 'paytime-report-list'                  (unchanged)
     })                                                    → passed to MonthlyReportView
  → (if ledger needs a broader query) second getFullList with requestKey 'paytime-ledger-list'
     → passed to AdminLedgerView, which applies tag/boarder/category filters client-side
```
`expand: 'user'` (`MonthlyReport.vue:47`) becomes `expand: 'boarder'` (nested `boarder.user` expand only if the ledger/report ever need the *linked account's* name rather than the boarder's own `name` field — likely unnecessary, since the boarder's own display name is the more correct label to show regardless of whether they have an account).

## Anti-Patterns

### Anti-Pattern 1: `cascadeDelete: true` on `paytime_payments.boarder`
**What people do:** enable cascade delete "to keep things tidy" when removing a boarder who's moved out.
**Why it's wrong:** it silently deletes every payment that boarder ever logged — the one thing this whole milestone exists to preserve.
**Do this instead:** required + `cascadeDelete: false` (Pattern 3) — PocketBase then refuses the boarder deletion outright while payments exist, forcing a deliberate decision (reassign, or just leave the boarder in the roster tagged "inactive").

### Anti-Pattern 2: Sending `boarder` on `mapToUpdatePayment`
**What people do:** treat `boarder` like any other editable field and include it in the update payload "for completeness."
**Why it's wrong:** the update rule is evaluated against the *stored* value (`paytimePaymentMapper.ts:21-30`), so a payload that also changes `boarder` passes the ownership check on the old value and silently reassigns the row on write.
**Do this instead:** omit it from update payloads entirely, exactly as `user` is omitted today — this is a rename of an existing, tested discipline, not a new one.

### Anti-Pattern 3: A new Pinia store for the roster
**What people do:** reach for global state management the moment data needs to cross a tab boundary.
**Why it's wrong:** violates the project's own validated decision (PROJECT.md line 280) for no gain the composable pattern doesn't already provide, and adds a second cross-component-sharing idiom next to the one (`useFileToken`) already proven in this codebase.
**Do this instead:** `useBoarderRoster.ts`, module-level cache, same shape as `useFileToken.ts`.

### Anti-Pattern 4: Letting the ledger and report views fetch independently
**What people do:** give each new sub-view its own `onMounted` + `getFullList`, because that's the "normal" Vue instinct.
**Why it's wrong:** PrimeVue mounts every `TabPanel` without `lazy` (already documented and tested in this codebase — `useFileToken.ts:14-17`, `requestKeys.spec.ts`), so two sibling sub-views both fetching on mount race on `requestKey`s exactly like `PaymentLog`/`MonthlyReport` did before the fix.
**Do this instead:** shell-owns-the-fetch, views are props-in/emit-up (Pattern 4), or — if two genuinely different queries are unavoidable — two shell-owned fetches under two explicit, distinct keys, never a fetch inside a sub-view component.

### Anti-Pattern 5: Writing a backfill migration script for one row
**What people do:** reach for a code-path migration on reflex, because "backfill" sounds like it needs one.
**Why it's wrong:** there is exactly one production `paytime_payments` record (PROJECT.md line 239); a script here is pure ceremony — write it, test it, run it once, delete it, for work a 10-second Admin UI edit does identically.
**Do this instead:** manual Admin UI edit of the one record's `boarder` field, verified via the project's own D-13 paste-back + smoke-query pattern (Build Order, step 4).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PocketBase (`paytime_boarders`, `paytime_payments` rules) | Admin UI-managed rules using dot-notation relation traversal | The single-hop `boarder.user = @request.auth.id` shape used in list/view/update/delete is doc-confirmed in general (MEDIUM confidence, not yet tested on this instance — the project's own flagged risk). The `@request.body.boarder.user` shape needed for a fully server-enforced createRule is **not** clearly documented and should be treated as a separate, additional unknown, not the same risk restated — smoke-test both, independently, before committing to the rule text above. |
| PocketBase nested `expand` | `expand: 'boarder'` (and optionally `boarder.user`) on `getFullList` | Multi-level expand is a documented PocketBase capability; the specific two-hop expand this app would use has not been exercised against the live instance either — low risk, but part of the same smoke-test pass. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| `ManagePayment.vue` ↔ `useBoarderRoster` | Composable call, shared module-level ref | Same shape as `ManagePayment.vue` ↔ `useFileToken` already in the file (`ManagePayment.vue:35`) |
| `MonthlyReport.vue` (shell) ↔ `MonthlyReportView` / `AdminLedgerView` / `BoarderRosterView` | Props down (`payments`, `boarders`, `month`), events up (`@edit`, `@delete`, `@saved`) | Mirrors `ExpensesTab.vue` ↔ `ExpensesListView`/`ExpensesReportsView` exactly (`ExpensesTab.vue:241-258`) |
| `PaymentLog.vue` ↔ `useBoarderRoster` | Composable call, resolves "my boarder" only, never renders the full list | Lighter-weight consumer than the admin-side ones |

## Build Order

Respects "schema before mappers before UI, roster before selector, selector before ledger," plus the migration and rule-risk sequencing called for in the question.

1. **Schema (Admin UI):** create `paytime_boarders` (fields: `name`, `tags`, optional `user` relation) + its five rules (Pattern 1). Paste-back + smoke verify per D-13.
2. **Manual roster seed (Admin UI, not code):** one `paytime_boarders` row per real person (~6), linking `user` where an account exists. Not a code path — one-time reference-data entry.
3. **Schema (Admin UI):** add `boarder` (required relation to `paytime_boarders`, `cascadeDelete: false`) to `paytime_payments`. Rename `user` → `recorded_by`, flip to optional, uncheck `cascadeDelete` (Pattern 2/3). **Leave the old `user`-based rules live** — don't touch rules yet, so the app keeps working during migration.
4. **Manual backfill (Admin UI, not code):** set the one existing payment's `boarder` to Cedrick's boarder id. Paste-back the record + a code-side smoke query (`getFullList({ filter: 'boarder != ""' })` returns 1) per D-13.
5. **Rule risk spike (no app code):** manually verify, against the live instance, that (a) `boarder.user = @request.auth.id` resolves correctly as a stored-value filter, and (b) `@request.body.boarder.user = @request.auth.id` resolves correctly as a create-time filter. Gates whether Pattern 1's rules proceed as written or fall back to the createRule fallback (or, worst case, PROJECT.md's own stated fallback of denormalizing the account id onto each payment).
6. **Schema (Admin UI):** rewrite the five `paytime_payments` rules to the boarder-based versions (Pattern 1). Paste-back + smoke-verify against both an admin session and a non-admin session.
7. **Code:** `src/types/paytime/boarders/types.d.ts` (new type; depends only on the schema existing).
8. **Code:** `src/types/paytime/payments/types.d.ts` update (`user` → `boarder` + `recorded_by`).
9. **Code:** `src/lib/paytime/boarderSchema.ts` (depends on 7).
10. **Code:** `src/lib/pocketbase/paytimeBoarderMapper.ts` (depends on 7, 9).
11. **Code:** `src/lib/pocketbase/paytimePaymentMapper.ts` update (depends on 8).
12. **Code:** `src/composables/useBoarderRoster.ts` (depends on 7 only).
13. **Code:** `ManageBoarder.vue` (depends on 9, 10).
14. **Code:** `ManagePayment.vue` update — admin `Select` + payload rename (depends on 11, 12). *("Selector before ledger": this is the selector.)*
15. **Code:** `PaymentLog.vue` update — own-boarder resolution + filter change (depends on 12).
16. **Code:** restructure `MonthlyReport.vue` into the shell; extract `MonthlyReportView.vue` (depends on 8, 12).
17. **Code:** `AdminLedgerView.vue` (depends on 16, 12). *(Ledger, after the selector and after the shell exist.)*
18. **Code:** `BoarderRosterView.vue` (depends on 13, 16).
19. **Tests:** update `requestKeys.spec.ts` and `paymentEdit.spec.ts` mock shapes; add specs for `useBoarderRoster` and `paytimeBoarderMapper`, mirroring existing coverage depth (185 tests today).
20. **Verification:** full manual smoke pass exercising both the new rules and the restructured admin tab — a natural place to finally close the long-open **PT-SMOKE-01** backlog item (PROJECT.md line 187), since this is the first time the schema gets end-to-end exercised against live PocketBase.

## Scaling Considerations

Not relevant at this scale — this is a ~6-user boarding house app. The only "scale" concern worth naming is the roster staying small and read-mostly forever, which is precisely what makes the module-level-cache composable (Pattern 5) sufficient and a Pinia store unnecessary.

## Sources

- `C:/GitRepos/lex-lib.github.io/.planning/PROJECT.md` (Current Milestone, Key Decisions, Requirements sections — cited by line throughout)
- `C:/GitRepos/lex-lib.github.io/src/components/projects/paytime/PayTimeApp.vue`, `PaymentLog.vue`, `ManagePayment.vue`, `MonthlyReport.vue` (read in full)
- `C:/GitRepos/lex-lib.github.io/src/lib/pocketbase/paytimePaymentMapper.ts`
- `C:/GitRepos/lex-lib.github.io/src/composables/useFileToken.ts`
- `C:/GitRepos/lex-lib.github.io/src/components/projects/wallecx/ExpensesTab.vue` (parent-shell + child-view precedent)
- `C:/GitRepos/lex-lib.github.io/src/components/projects/paytime/__tests__/requestKeys.spec.ts`, `paymentEdit.spec.ts`
- [PocketBase docs — Working with relations](https://pocketbase.io/docs/working-with-relations/) (MEDIUM confidence — dot-notation JOIN depth/behaviour)
- [PocketBase docs — API rules and filters](https://pocketbase.io/docs/api-rules-and-filters/) (MEDIUM confidence — `@request.body`/`@request.auth` semantics)
- [PocketBase JSVM reference — RelationField](https://pocketbase.io/jsvm/classes/RelationField.html) (MEDIUM confidence — `cascadeDelete` semantics)
- [GitHub Issue #6498 — required relation delete failure message](https://github.com/pocketbase/pocketbase/issues/6498) (MEDIUM confidence, corroborating community report)
- [GitHub Discussion #5667 — protecting create with relation ownership](https://github.com/pocketbase/pocketbase/discussions/5667) (LOW/MEDIUM — community discussion, not official docs; basis for flagging the createRule shape as unconfirmed rather than asserting it works)

---
*Architecture research for: PayTime v5.0 Admin Payment Ledger*
*Researched: 2026-08-04*
