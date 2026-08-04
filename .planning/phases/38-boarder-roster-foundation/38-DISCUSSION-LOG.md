# Phase 38: Boarder Roster Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 38-Boarder Roster Foundation
**Areas discussed:** Tag vocabulary mechanism, Admin tab shell + naming, Boarder-account link rules, Inactive vs delete affordance

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Tag vocabulary mechanism | How a tag enters the vocabulary and how it's stored; REQUIREMENTS/research say `select` field, but Criterion 3 wants no code change or deploy | ✓ |
| Admin tab shell + naming | Is the tab still "Monthly Report"? Does a non-admin see a Boarders sub-view at all? | ✓ |
| Boarder-account link rules | Two boarders on one account? User with no boarder record? How `useBoarderRoster` resolves "my boarder" | ✓ |
| Inactive vs delete affordance | Delete button before ROSTER-07's guard exists? How inactive boarders display | ✓ |

**User's choice:** all four.

---

## Tag vocabulary mechanism

**Finding presented before the first question:** PocketBase's Collections API is superuser-only, and PayTime's admin is an ordinary `users` row with `is_admin = true` — so the app cannot read a `select` field's option list at runtime, and the options would have to be code-mirrored (like today's `CategoryOptions`). That makes adding a tag a code change plus a deploy, i.e. Success Criterion 3 failing.

### Q1 — Storage and extension mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| `paytime_tags` collection + relation (Recommended) | Tiny new collection, `tags` becomes a multi-relation; admin adds a tag in-app, immediately in the MultiSelect. Costs a collection + 5 rules; grazes the "free-form tag management UI" Out-of-Scope line | |
| `select` field + code-mirrored options | Research's recommendation; simplest schema, native `?=` filtering. But adding a tag = Admin UI edit + code edit + deploy; select-rename propagation unverified | |
| `json` array + options derived from usage | Options are the union of tags already on the roster, plus free entry. Fully in-app, no new collection. Costs: typo fragmentation, and `:each` filtering unverified on this instance | ✓ |

**User's choice:** `json` array + options derived from usage.
**Notes:** Chosen over the research recommendation specifically because it's the only option where Criterion 3 ("immediately assignable in the app") is honestly true. The two costs it carries were then closed by Q2 and Q3.

### Q2 — Normalization of a newly typed tag

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize + explicit create step (Recommended) | Canonical form (trim, collapse whitespace, lowercase) enforced in Zod so a hand-crafted request can't bypass it; title-cased for display; a distinct "Create tag: …" row makes invention deliberate | ✓ |
| Normalize only, silent create | Same canonicalization, no confirmation. Catches casing/whitespace but not a genuine misspelling | |
| Store exactly as typed | No normalization; self-policing by eye at this scale. Accepts `2nd Floor` / `2nd floor` as distinct filter values | |

**User's choice:** Normalize + explicit create step.
**Notes:** Closes the typo-fragmentation risk that got free-text boarder names rejected at milestone scope. Zod-enforced rather than UI-only, so it's unit-testable.

### Q3 — Where tag filtering happens, and whether to spike `:each`

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side only, never filter tags server-side (Recommended) | `.filter()` over the already-loaded ~6-row array, per the v1.2 search/sort and v4.0 expense-filter precedent. Deletes the `:each` risk from the milestone rather than carrying it into Phase 41 | ✓ |
| Prove `:each` now, use it in Phase 41 | D-13 smoke probe against the live instance; knowing beats guessing, but spends a spike on a capability nothing needs at 6 rows | |
| Client-side now, note `:each` as unverified | Same filtering, gap recorded in writing. No spike, no risk, but the question stays open | |

**User's choice:** Client-side only, never filter tags server-side.
**Notes:** This is a decline, not a deferral — `:each` is deliberately never exercised in this milestone. Recorded so a later phase doesn't assume it works.

### Q4 — Seeded default vocabulary?

| Option | Description | Selected |
|--------|-------------|----------|
| Start empty (Recommended) | Admin free-types tags while adding the 6 boarders; the vocabulary establishes itself in that one session. A seeded-in-code list would be the exact code-change-to-edit problem that ruled out `select` | ✓ |
| Seed a small default list in code | Mirror `DEFAULT_EXPENSE_CATEGORIES`; gives a starting point, but editing it is a deploy and it coexists with derived values as a second source of truth | |

**User's choice:** Start empty.

---

## Admin tab shell + naming

### Q1 — Top-level tab name

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to "Admin" (Recommended) | By Phase 41 the tab holds By Boarder / Ledger / Boarders, and "Monthly Report" would misdescribe two of three. One rename, in the phase that causes it | ✓ |
| Keep "Monthly Report" | Zero churn on a familiar label; costs a stale name | |
| Rename to "House" | Frames by subject not role; vaguer about why a non-admin can't see it | |

**User's choice:** Rename to "Admin".

### Q2 — What a non-admin sees of the roster surface

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing — the whole Admin tab stays hidden (Recommended) | Keeps today's `v-if="isAdmin"` on both `<Tab>` and `<TabPanel>` with server rules blocking independently. ROSTER-06's read access serves `useBoarderRoster`, not a screen | ✓ |
| Read-only roster visible to everyone | "Who else lives here / who's on my meter group", but a new unasked-for capability with its own gating, and a third state alongside LEDGER-07's requirement | |

**User's choice:** Nothing — the whole Admin tab stays hidden.

### Q3 — Default sub-tab

| Option | Description | Selected |
|--------|-------------|----------|
| By Boarder — today's report (Recommended) | Preserves muscle memory; the daily job is checking who paid, not seeding. Matches v4.0 always opening Expenses on List | ✓ |
| Boarders — the roster | Self-explanatory on day one when the roster is empty; wrong default every session after, with no sub-tab persistence planned | |

**User's choice:** By Boarder.

### Q4 — Who fetches the roster

| Option | Description | Selected |
|--------|-------------|----------|
| `useBoarderRoster` module-level cached composable (Recommended) | Mirrors `useFileToken.ts`: module-scope cache + in-flight dedup, shared no matter what mounts first. Structural fix for the auto-cancel class of bug; non-admins only fetch when something reads it | ✓ |
| Admin shell owns it, props down | Straight `ExpensesTab` precedent, but `ManagePayment`/`PaymentLog` live outside the Admin tab, so Phase 40 needs a second fetch and a second key | |
| `PayTimeApp.vue` shell owns it, props down to everything | One fetch, one key, no composable — but every non-admin pays for it on every visit, and it threads a prop through three tab layers | |

**User's choice:** `useBoarderRoster` module-level cached composable.

---

## Boarder-account link rules

### Q1 — Link cardinality and enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| One-to-one, enforced by a unique index (Recommended) | Nullable unique index on `paytime_boarders.user`. Matters because Phase 39 traverses `boarder.user = @request.auth.id` and Phase 40 resolves "my boarder" — ambiguity surfaces as a silently wrong subject, not an error | ✓ |
| One-to-one, enforced in the UI only | Dropdown hides taken accounts; no schema work, but a hand-crafted request or relink sequence can still duplicate | |
| Allow many boarders per account | Useful if one person ever pays as two subjects, but nothing asks for it and it makes "my boarder" plural everywhere in 39–41 | |

**User's choice:** One-to-one, enforced by a unique index.

**Live verification performed mid-area (prod, SchemaRead):** `users.listRule` and `viewRule` are already `id = @request.auth.id || @request.auth.is_admin = true` — the admin can list every user today, so the link picker needs no `users` rule change. One fewer D-13 paste-back than assumed.

### Q2 — Logged-in user with no boarder record

| Option | Description | Selected |
|--------|-------------|----------|
| Return null; no UI change in Phase 38 (Recommended) | `myBoarder: Boarder \| null`; `PaymentLog` still keys off `user` until Phase 39, so the condition is unreachable here and a message would ship untestable | ✓ |
| Return null + inline message in PaymentLog now | Friendlier and the copy exists early, but untestable in Phase 38 and rewritten in Phase 39 | |
| Throw / toast an error | Wrong shape — "not on the roster yet" is the expected state for 5 of 6 people the moment the collection exists | |

**User's choice:** Return null; no UI change in Phase 38.

### Q3 — Account-link picker behaviour

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown of users, already-linked ones excluded (Recommended) | `name \|\| email`, filtered so the unique index can't be tripped through the UI, with "No account" as a first-class choice | ✓ |
| Dropdown of all users, no exclusion | Less code; lets the index reject duplicates via `describeSaveError()`. Turns a preventable mistake into an error message | |
| Type an email, resolve on save | No list fetch, reads naturally, but free text against a closed set — a typo becomes "no such account" | |

**User's choice:** Dropdown of users, already-linked ones excluded.

---

## Inactive vs delete affordance

### Q1 — Does Phase 38 expose Delete?

| Option | Description | Selected |
|--------|-------------|----------|
| Deactivate only — no Delete button (Recommended) | In Phase 38 nothing protects a delete: `paytime_payments.boarder` doesn't exist, so the roster's `deleteRule` is the only guard. ROSTER-04's inactive flag covers the real need; Phase 39 adds Delete beside the guard | |
| Delete button, admin-only, with confirm | Full CRUD in the phase named for it, reusing `useConfirm` + the shell-level `ConfirmDialog`. Honest that a boarder mistyped five minutes ago should be removable. Accepts one phase of unguarded deletion | ✓ |
| Delete only for boarders with no payments | Sounds like the middle ground, but the check is vacuously true for every boarder in Phase 38 and needs rewriting in Phase 39 | |

**User's choice:** Delete button, admin-only, with confirm.
**Notes:** Recommendation was against this; the concern (no guard until Phase 39) was stated before the question and the user chose full CRUD anyway. Recorded in CONTEXT.md D-38-15 as a deliberate override, with the two consequences the planner must carry: the roster `deleteRule` must be admin-only, and Phase 39's ROSTER-07 refusal is added *on top of* this existing button rather than introducing it.

### Q2 — How inactive boarders appear

| Option | Description | Selected |
|--------|-------------|----------|
| Inline, muted "Inactive" badge, sorted after actives (Recommended) | One list, no toggle, no hidden state. At ~6 rows a visible inactive boarder is one the admin can reactivate without hunting for a filter | ✓ |
| Hidden behind a "Show inactive" toggle | Keeps the working list current, but adds a filter control + state for ~8 rows and makes a deactivated boarder look deleted | |
| Separate "Inactive" section below | Explicit grouping, slightly more markup, section empty for most of the roster's life | |

**User's choice:** Inline, muted "Inactive" badge, sorted after actives.

### Q3 — Roster list shape

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse PaymentLog's row layout (Recommended) | Details column + inline kebab `Menu` on mobile, actions inline on desktop — already shipped and mobile-tested. Carries the invariant that breakpoint classes go on plain wrappers, never on a PrimeVue component | ✓ |
| PrimeVue `DataTable` | Research's recommendation, but that was for the Phase 41 ledger; a 6-row roster needs no sorting or paging, and DataTable's 390px story costs more markup | |
| `Panel` per boarder | Sibling-looking to today's MonthlyReport Panels, but a toggleable Panel implies collapsible detail a roster row doesn't have | |

**User's choice:** Reuse PaymentLog's row layout.

### Q4 — Deactivate location and `is_active` default

| Option | Description | Selected |
|--------|-------------|----------|
| Kebab-menu action; new boarders active by default (Recommended) | One interaction model for every row action; Edit dialog stays about identity, not lifecycle; single write path to `is_active` | ✓ |
| Toggle switch in the Edit dialog | One place owns every attribute, but two extra taps for the most common non-create action | |
| Both — kebab action and dialog toggle | Fast path plus full control, but two write paths to one field that can disagree about optimistic state | |

**User's choice:** Kebab-menu action; new boarders active by default.

---

## Claude's Discretion

- The roster fetch's `requestKey` name (must be distinct from `paytime-payments-list` / `paytime-report-list`, registered and pasted back)
- Exact text of the five `paytime_boarders` API rules, within the recorded hard constraints (list/view `@request.auth.id != ""` never `""`; create/update/delete must reference `is_admin`)
- How VERIFY-03's unauthenticated-read probe is executed and recorded
- How the ~6 boarders get seeded (in-app vs Admin UI rows)
- Whether the one existing production payment's owner needs a matching boarder row now or in Phase 39
- Component/file names for extracted and new sub-views; whether `MonthlyReportView` is extracted verbatim
- Empty-state copy for a zero-boarder roster; optimistic-update vs refetch-after-write
- Zod schema shape and file placement for the boarder record
- Display-name uniqueness (no constraint decided)

## Deferred Ideas

- Read-only roster view for non-admins — considered and declined, not scheduled
- Sub-tab persistence for the Admin shell — out of scope, consistent with v4.0
- Server-side tag filtering via `:each` — declined for the whole milestone, not deferred
- Tag retirement / rename across all boarders — never specified; retirement is implicit with usage-derived options
- Display-name uniqueness on `paytime_boarders` — offered, not discussed
- Deactivate confirmation/warning copy — offered, not discussed
- The one existing production payment's boarder mapping — more naturally Phase 39's backfill (SUBJ-02)

**No scope creep occurred** — every area stayed inside the roster boundary; the payment-subject, selector, and ledger questions were all left to Phases 39–41 by the phase boundary itself.
