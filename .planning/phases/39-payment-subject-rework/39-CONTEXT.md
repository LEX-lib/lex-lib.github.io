# Phase 39: Payment Subject Rework - Context

**Gathered:** 2026-08-05
**Status:** Ready for planning

<domain>
## Phase Boundary

`paytime_payments` identifies a **boarder**, not an account, as its subject — migrated additively, proven against the live instance with real tokens, and finalized as one indivisible five-rule rewrite, with the single existing production record preserved throughout.

**In scope:**
- `paytime_payments.boarder` relation → `paytime_boarders` (optional first, required after backfill), `cascadeDelete: false`
- The existing `user` relation **renamed** to `recorded_by` (SUBJ-03), made optional, `cascadeDelete` flipped to `false`
- SUBJ-02 backfill of the one pre-existing production record
- All five `paytime_payments` API rules rewritten as one unit, including the update-reassignment guard (VERIFY-04, closing PT-RULE-01)
- VERIFY-01 live spike of the relation-traversal createRule form **before** rule text is finalized
- VERIFY-02 two-token five-rule sweep with cross-boarder isolation both directions (also closes PT-SMOKE-01)
- VERIFY-05 destructive confirmation that `cascadeDelete: false` holds on both new relations
- ROSTER-07 refuse-delete-of-boarder-with-history (moved here from Phase 38)
- Minimal read-path continuity: `PaymentLog` filters by boarder, `MonthlyReport` groups by boarder, `ManagePayment` writes boarder on create

**Out of scope (belongs to a later phase):**
- The admin boarder selector in `ManagePayment` — Phase 40 (BEHALF-01/03). Phase 39 always pins to the logged-in user's own boarder.
- Any visible `recorded_by` marker in the UI — Phase 40, when admin-on-behalf rows first exist to distinguish
- Zero-payment / unpaid-boarder rows in the report — LEDGER-05, Phase 41
- Tag filtering, the ledger view, tag visibility on payment surfaces — Phase 41
- Prettier-formatting the PayTime sources (PT-FMT-01), making `amount` server-required (PT-AMOUNT-01)

</domain>

<decisions>
## Implementation Decisions

### Field migration shape

- **D-39-01:** The existing `paytime_payments.user` relation is **renamed to `recorded_by`**, not dropped and not left alongside a new field. PocketBase's rename preserves the column and its data, and the one production row's `user` **is** Cedrick, who did record it — so SUBJ-03 is backfilled for free with zero extra step. Ends with two relations (`boarder`, `recorded_by`), not three. — **Reversibility:** one-way — undoing the rename after the client has migrated means another schema edit plus reverting mapper, Zod schema, types, `PaymentLog`'s filter and `MonthlyReport`'s `expand`, all of which change in the same commit as the rename.

  **Live schema fact this decision rests on** (verified 2026-08-05 via `describe_collection`, prod): `paytime_payments.user` is `type: relation` → `_pb_users_auth_`, `maxSelect: 1`, `required: true`, **`cascadeDelete: true`**. That last value means **SUBJ-07 is false today** — deleting a user account destroys their payment history right now. It is not a new risk introduced by this phase; it is a live defect this phase closes.

- **D-39-02:** `recorded_by` ends as **`cascadeDelete: false` AND optional** (`required` dropped). `false` is mandatory for SUBJ-07/VERIFY-05. Optional is the mitigation for `38-REVIEW.md` WR-01: with `cascadeDelete: false`, a deleted account leaves a dead relation id, and a *required* dead id makes any write path that resends the field 400 with nothing in the UI explaining why — reproduced on the payments collection, where it matters more than on the roster. **The update mapper MUST NOT resend `recorded_by`**, for the same reason `mapToUpdatePayment` already omits `user`: PocketBase evaluates the update rule against stored values, so an owner-ish field must never be re-sent.

- **D-39-03:** `paytime_payments.boarder` is `maxSelect: 1`, **`cascadeDelete: false`** (VERIFY-05), `required: true` **only after** the backfill is confirmed, and carries **no index**. Many payments per boarder is the point, so there is nothing to constrain, and at ~7 boarders an index earns nothing measurable while costing another paste-back. Phase 38's `''`-not-`NULL` empty-relation trap does not bite here: once `required` with a real backfilled value, no row is ever unlinked.

- **D-39-04:** **Sequencing is boarder-first, rename-last** — and the rename lands *inside* the indivisible commit:
  1. Add `boarder` as **optional**; backfill the one production record; prove the traversal (VERIFY-01).
  2. Client switches to writing/reading `boarder` while **still sending `user`**, which is still a valid field. The app is never broken.
  3. One indivisible commit: rename `user` → `recorded_by`, flip its `cascadeDelete` to false and drop `required`, flip `boarder` to `required`, and rewrite all five rules together.

  Rename-first was rejected: between the rename and the client update, `mapToCreatePayment` would be appending a field that no longer exists — a window in which PayTime cannot log a payment at all. Big-bang was rejected because it flips `boarder` to required before the spike resolves.

### Spike, fallback, and rule text

- **D-39-05:** The VERIFY-01 spike harness is **Claude's discretion**, hard-constrained to: a **real non-admin token** (not tokenless — a tokenless probe cannot distinguish an admin-gated rule from a merely-authenticated one, which is exactly the gap Phase 38 left open), a **positive and a negative case**, and the **raw response pasted back** per D-13.

- **D-39-06:** **ROADMAP.md's fallback binds. `PROJECT.md` line 41's fallback is superseded.** The two documents disagreed and this discussion settles it:
  - **Binding (ROADMAP § Phase 39 criterion 1):** if the traversal fails, createRule falls back to **admin-bypass on create**, with ownership carried by the well-documented list/view/update/delete rule shape plus **client-side boarder pinning**. Only rule text changes; this phase and every later phase survive intact.
  - **Superseded (PROJECT.md line 41):** "denormalising the account id onto each payment". Rejected — it reintroduces the field D-39-01 just renamed, under a different name, creating two sources of truth for ownership that can disagree, and PROJECT.md itself concedes it "changes the phase shape".
  - **Accepted consequence of the fallback branch:** a hand-crafted non-admin create against another boarder would **not** be blocked server-side, so **SUBJ-05 becomes partially client-only**. If the fallback fires, this must be recorded as an *accepted threat* in `39-SECURITY.md` and as a deviation — never claimed as server-enforced.

- **D-39-07:** VERIFY-04 is closed by an **`:isset` guard in the update rule**, not by mapper omission alone:
  ```
  (boarder.user = @request.auth.id || @request.auth.is_admin = true)
  && (@request.body.boarder:isset = false || @request.body.boarder = boarder)
  ```
  Mapper omission alone *is* PT-RULE-01 — client-mitigated only — reproduced on the new field, and VERIFY-04 would pass by assertion rather than by probe. **`:isset` and the `@request.body.X = <stored field>` comparison are a SECOND probe target**, alongside the traversal: both forms are unproven on this instance and need the same live treatment before the rule text locks. (`mapToUpdatePayment` naturally won't send `boarder` either — it builds an explicit field list — but that is incidental, not the guarantee.)

- **D-39-08:** All five rules take the **uniform traversal + admin OR-branch** shape — one mental model across list/view/create/update/delete, with the admin branch on **every** write rule so SUBJ-06 holds without special-casing. Live `listRule`/`viewRule` are already admin-aware; `create`/`update`/`delete` are owner-only today, which is why SUBJ-06 fails now.

  **Hard constraints on the exact text (carried invariants, non-negotiable):**
  - Never `""` — PocketBase treats empty-string as **public**, not "unconfigured"
  - Never bare `@request.auth.id != ""` on a write rule — that is satisfiable by *any* authenticated user (research PITFALLS #1; the real `isSuperUser = isLoggedIn` bug in `GiftExchangeManage.vue`)
  - Literal `is_admin` on every write branch
  - `@request.body.` on createRule, **never** the deprecated `@request.data.` — confirmed against this instance, the deprecated form 403s
  - All five authored and pasted back **together** — a partially-applied rewrite is PITFALLS Pitfall 6

### Read-path continuity

- **D-39-09:** `PaymentLog` gets an **explicit no-boarder empty state**. When `myBoarder` is null it **skips the fetch entirely** and renders a distinct message ("no boarder record linked to your account yet — ask the admin to link you"), separate from today's "No payments logged yet." A boarderless user has no *identity*, not no *payments*, and skipping the fetch avoids filtering on an empty id. This is the copy D-38-14 deliberately deferred out of Phase 38. **`myBoarder === null` is the expected steady state for 5 of 6 accounts** — never an error, never a toast.

- **D-39-10:** **"Log a Payment" stays visible** even when `myBoarder` is null; the guard lives in **`ManagePayment`**, not on the button. The dialog resolves `myBoarder` from `useBoarderRoster` on open and, if null, shows the same no-boarder message in place of the form with Save disabled. One place owns the condition — the place that would otherwise 400 — and it is the natural seam Phase 40's admin boarder selector drops into, so the guard isn't rewritten one phase later.

- **D-39-11:** `MonthlyReport` gets a **minimal swap only**: `expand: "user"` → `expand: "boarder"`, group on `payment.boarder`, label from `expand.boarder.name`. Boarder name replacing `name || email` is strictly better. **No `recorded_by` marker** (no admin-on-behalf rows exist until Phase 40, so it would ship unexercised — the same reasoning that deferred D-38-14) and **no zero-payment boarder rows** (LEDGER-05, Phase 41).

- **D-39-12:** **Both existing requestKeys are unchanged** — `paytime-payments-list` and `paytime-report-list`. Same two mount-path fetches; only their filters change. `paytime-boarders-list` (Phase 38) is the distinct third. Renaming would churn a locked invariant and its assertion spec for cosmetic gain. Any *new* mount-path fetch still registers its own distinct key and pastes it back.

### Delete guard and verification evidence

- **D-39-13:** ROSTER-07's refusal is a **client pre-check in the roster**, and this is recorded honestly rather than claimed as server enforcement. **PocketBase relations offer only cascade-or-orphan — there is no RESTRICT mode.** With `cascadeDelete: false` on `payments.boarder`, a boarder delete *succeeds* and leaves payments pointing at a dead id. So before deleting, `BoarderRosterView` counts that boarder's payments; if any exist it refuses with a message naming the count and offers **Deactivate** instead (which is what ROSTER-04 was designed for). A boarder with **zero** payments still deletes freely — preserving D-38-15's explicit user override that a boarder mistyped five minutes ago should be removable.

  **Accepted threat the planner must record, not paper over:** an admin issuing a hand-crafted request can still orphan payments. `39-SECURITY.md` records this as accepted; nothing in the phase may describe ROSTER-07 as server-enforced.

- **D-39-14:** **The user supplies both tokens at a blocking checkpoint.** A plan task stops and asks for an admin token and a non-admin token (or the credentials to mint them); the executor then runs the full sweep programmatically and pastes back raw responses. This closes the Phase 38 gap **at its root** — that executor had "no browser/admin credentials available" and had to resolve the base URL from a committed `dist/` artifact, which is why ROSTER-06's authenticated-non-admin write half is still proven by rule text only. Manual hand-running was rejected: 10+ cases by hand is where evidence quality dies in transcription.

- **D-39-15:** A **prerequisite task seeds the test data** before the sweep, because cross-boarder isolation "in both directions" is impossible with one linked boarder — and **only one boarder is linked today**. The task links a **second existing account** (of the 6 users) to a roster boarder through the Phase 38 Admin › Boarders UI, and logs one payment for each of the two boarders. Using the shipped roster CRUD also re-exercises Phase 38's UI as a side benefit. Seed payments must be recognisable and disposable.

  **Constraint:** the pre-existing `2026-07` electricity record (₱123, Cedrick `4ygxbt0zey088di`) is **never a delete-case target** — SUBJ-02 promises to preserve it.

- **D-39-16:** VERIFY-05 is proven **destructively on a throwaway account + throwaway boarder**, not by schema paste-back. Create a disposable user account, a disposable boarder linked to it, and a payment against that boarder; then **delete the account** (the payment must survive) and **delete the boarder** (the payment must survive, orphaned). Schema paste-back alone was rejected as exactly the acknowledgment-only pattern D-13 exists to forbid, and VERIFY-05's own wording demands the attempted deletion. Deleting a real inactive boarder was rejected — it destroys real data to prove a flag, and the D-39-13 pre-check should be refusing that delete anyway if the boarder has history. The orphaned test payment needs cleanup.

### Claude's Discretion

- The VERIFY-01 / `:isset` spike harness — throwaway probe collection vs a reverted rule on `paytime_payments` vs anything else — subject to D-39-05's constraints (real non-admin token, positive + negative case, raw response pasted back).
- Exact text of the five rewritten rules, subject to D-39-08's hard constraints.
- SUBJ-02 backfill mechanics: which boarder row the one production record maps to, who performs the Admin UI edit, and how it's proven. (Flagged as available-but-not-discussed; `38-CONTEXT.md` already routed this here from Phase 38.) No migration script — REQUIREMENTS.md Out of Scope: one record, a manual edit with D-13 paste-back is smaller than the script.
- Whether `boarder` is `required` at the **Zod** layer and how `paymentSchema` / `types` / `paytimePaymentMapper` absorb the rename. Note the Phase 38 platform constraint: **PocketBase v0.23+ has no per-field defaults**, so anything the schema guarantees has no server-side backstop and any write path bypassing the mapper loses it.
- Empty-state and guard copy wording (D-39-09 / D-39-10 fix the behaviour, not the strings).
- Cleanup mechanics for the D-39-15 seed payments and the D-39-16 throwaway rows.
- Whether WR-01's dead-relation UX gets user-facing handling in this phase or stays a known latent issue.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and traceability
- `.planning/ROADMAP.md` § Phase 39 — goal, six success criteria, and **the binding fallback definition** (criterion 1). This is the authority over PROJECT.md line 41 per D-39-06.
- `.planning/REQUIREMENTS.md` — SUBJ-01..07, ROSTER-07, VERIFY-01/02/04/05 are this phase's twelve requirements. Also the Out of Scope table: **no migration script for the backfill**, no audit-log collection, no dispute workflow.
- `.planning/PROJECT.md` § Current Milestone, § Constraints, § Key Decisions — the `paytime_*` prefix, the requestKey-uniqueness invariant, the two still-unvalidated v5.0 decisions (boarders as their own collection; boarder as canonical subject), and the PayTime v1.0 decision rows (protected file field, `month` as text, update-mappers-omit-owner, breakpoints-on-wrappers). **Line 41's denormalise fallback is superseded — see D-39-06.**
- `.planning/STATE.md` § Accumulated Context + § Blockers — the D-13 paste-back invariant, the additive-migration and indivisible-five-rule decisions locked at roadmap creation, and the four ⚠ Phase 39 blockers (unproven traversal; WR-01 dead relation; ROSTER-06's rule-text-only write proof; no server-side backstop for `is_active`/whitespace names).

### Phase 38 artifacts (direct dependency — read these, not just their summaries)
- `.planning/phases/38-boarder-roster-foundation/38-CONTEXT.md` — D-38-01..18. Especially **D-38-09** (`useBoarderRoster` contract, set in 38 and consumed here), **D-38-14** (`myBoarder` null semantics; this phase owns the copy), **D-38-15** (delete shipped deliberately; ROSTER-07 stacks on top of that button, does not introduce it), **D-38-05** (`:each` declined for the whole milestone — do not assume json-array filtering works here).
- `.planning/phases/38-boarder-roster-foundation/38-COLLECTION.md` — the live `paytime_boarders` schema and both recorded rule probes, including the partial unique index `WHERE user != ''`.
- `.planning/phases/38-boarder-roster-foundation/38-REVIEW.md` — **WR-01**, the dead-relation-after-account-deletion finding that D-39-02 mitigates for `recorded_by`.
- `.planning/phases/38-boarder-roster-foundation/38-SECURITY.md` — the 13-threat model (7 mitigated, 6 accepted) this phase's threats extend, including T-38-04 (`cascadeDelete: false` by design).
- `.planning/phases/38-boarder-roster-foundation/38-PATTERNS.md` — file-to-analog mapping from the roster phase.

### Research (read before planning)
- `.planning/research/PITFALLS.md` — **Pitfalls 1, 2, 6, 7 are this phase's to avoid** (admin check satisfiable by any authenticated user; partially-applied rule rewrite). Pitfall 3 (`cascadeDelete: true` data loss) is *live right now* on `paytime_payments.user` — see D-39-01.
- `.planning/research/STACK.md` — PocketBase relation and rule syntax, including relation-traversal forms.
- `.planning/research/ARCHITECTURE.md` — `cascadeDelete` placement, shell/sub-view pattern.
- `.planning/research/SUMMARY.md` — reconciled research picture; note `38-CONTEXT.md` records where Phase 38 overrode its tag recommendation.

### Live schema (verified 2026-08-05, prod, SchemaRead)
- `paytime_payments` (`pbc_1550650043`) — `user` relation → `_pb_users_auth_`, `maxSelect: 1`, `required: true`, **`cascadeDelete: true`**; `category` select (electricity/internet/others/boarding_fee); `month` text; `payment_date` date; `amount` number optional; `notes` text optional; `screenshot` file `protected: true`, 5 image MIMEs; no indexes.
- Live rules today: list/view `user = @request.auth.id || @request.auth.is_admin = true`; create `@request.auth.id != "" && @request.body.user = @request.auth.id`; update/delete `user = @request.auth.id` (**no admin branch — this is why SUBJ-06 fails today**).
- `paytime_boarders` (`pbc_3712673815`) — `name` text required, `tags` json, `user` relation `maxSelect: 1` `cascadeDelete: false`, `is_active` bool; partial unique index on `user WHERE user != ''`.

### Source files this phase modifies or reads from
- `src/lib/pocketbase/paytimePaymentMapper.ts` — `mapToCreatePayment` appends `user` (becomes `boarder` + `recorded_by`); `mapToUpdatePayment`'s docblock records **exactly why an owner field is never re-sent on update** — the reasoning D-39-02 and D-39-07 both depend on.
- `src/components/projects/paytime/PaymentLog.vue` — filters `user = "{auth.user.id}"` with `requestKey: "paytime-payments-list"`; gains the D-39-09 empty state.
- `src/components/projects/paytime/ManagePayment.vue` — the create/edit dialog; gains the D-39-10 null-boarder guard and writes `boarder`.
- `src/components/projects/paytime/MonthlyReport.vue` — `expand: "user"`, `byUser` Map keyed on `payment.user`, label `expand.user.name || email`, `requestKey: "paytime-report-list"`; D-39-11's minimal swap. Already the two-sub-tab shell (By Boarder / Boarders).
- `src/components/projects/paytime/BoarderRosterView.vue` — hosts the D-39-13 delete pre-check.
- `src/composables/useBoarderRoster.ts` — module-level cache, in-flight dedup, `authStore.onChange` reset, `requestKey: "paytime-boarders-list"`, `myBoarder` resolved by `boarder.user === authId`. **This phase is its first real consumer beyond the roster view.**
- `src/lib/paytime/paymentSchema.ts` — Zod conventions; the native UTC round-trip calendar check (dayjs strict parse is a **no-op** here, `customParseFormat` is never registered).
- `src/lib/paytime/boarderSchema.ts` + `src/lib/pocketbase/paytimeBoarderMapper.ts` — where Phase 38's `is_active` default and whitespace-name rejection live, with no server backstop.
- `src/types/paytime/payments/types.d.ts` and `src/types/paytime/boarders/types.d.ts` — the record/Add types the rename touches.
- `src/composables/useFileToken.ts` + `src/lib/paytime/screenshotUrls.ts` — the protected-file token path both list views depend on; unchanged, but any new payment view needs it.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useBoarderRoster()`** — already delivers `{ boarders, myBoarder, refresh }` with a module-level cache and in-flight dedup. `PaymentLog` and `ManagePayment` are the Phase 39/40 consumers its docblock already names. No new fetch path is needed for the subject rework.
- **`mapToUpdatePayment`'s omit-the-owner pattern** — already implemented and already asserted by a test. Extends verbatim to `boarder`/`recorded_by`.
- **`useConfirm` + shell-level `ConfirmDialog`** — mounted at `PayTimeApp.vue`; the ROSTER-07 refusal reuses it (`useConfirm` must be imported explicitly — it is *not* auto-resolved by PrimeVueResolver).
- **`describeSaveError()`** in `ManagePayment` — unwraps PocketBase per-field validation messages; the natural surface for any rule rejection that reaches the UI.
- **`MonthlyReport`'s two-sub-tab shell** — Phase 38 already restructured it, so Phase 39 changes only the data shape inside the By Boarder panel. No restructuring pass.
- **`BoarderRosterView`'s row + kebab `Menu` layout** and its Deactivate action — the ROSTER-07 refusal offers Deactivate as the alternative, so both halves already exist.

### Established Patterns
- **`requestKey` uniqueness (locked invariant)** — the SDK's default key is `method + path` and **excludes the query string**, so two differently-filtered list calls to the same collection silently abort each other. Both PayTime payment keys already exist and stay.
- **Every `TabPanel` mounts without `lazy`** — `v-show`, not `v-if`, so *every* panel's `onMounted` runs and sibling fetches race. `lazy` was rejected in PayTime v1.0 because its `v-if` would destroy the calculator's unsaved input. This is why the roster read is a shared composable.
- **`getFullList()` over `getList()`** — PB v0.29.x's count path 400s on non-trivial listRule expressions (D-31-B); `getFullList` uses `skipTotal` internally. The rewritten rules are *more* complex than the ones that trip it, so this matters more, not less.
- **PocketBase rule polarity** — `null` = superuser-only, **`""` = public** (not "unconfigured").
- **`@request.body.<field>` on createRule**, never the deprecated `@request.data.<field>`.
- **Update rules evaluate against STORED values** — the whole reason D-39-07 needs an `:isset` guard and the mapper omits owner fields.
- **PocketBase v0.23+ has no per-field defaults**; an unset `maxSelect: 1` relation stores `''`, not `NULL`.
- **Breakpoint utilities on plain wrappers, never on a PrimeVue component** — Tailwind's layered utilities lose to PrimeVue's unlayered runtime CSS.
- **D-13** — every live-artifact configuration step needs actual configured values pasted back as text **plus** a code-side smoke probe. This phase is almost entirely D-13 steps.
- **Server-side isolation is the auth boundary; client gating is UX only** — which is precisely why D-39-06's fallback branch and D-39-13's pre-check must be recorded as accepted threats rather than presented as enforcement.

### Integration Points
- `paytime_payments` schema (Admin UI, D-13 gated): add `boarder`; rename `user` → `recorded_by`; flip both `cascadeDelete` values; flip `boarder` to required; rewrite five rules.
- `paytimePaymentMapper.ts` — create appends `boarder` + `recorded_by`; update appends neither.
- `PaymentLog.vue` → filter by `myBoarder.id`; new empty state; skip fetch on null.
- `ManagePayment.vue` → writes `boarder`; null-boarder guard; the seam Phase 40 extends with the admin selector.
- `MonthlyReport.vue` → `expand: "boarder"`, group by `payment.boarder`, label `expand.boarder.name`.
- `BoarderRosterView.vue` → delete pre-check counting payments per boarder.
- Types + Zod schema absorb the rename; existing spec files (`paytimePaymentMapper`, `paymentSchema`, `paymentEdit`, `requestKeys`) all need updating in step.

</code_context>

<specifics>
## Specific Ideas

- **`cascadeDelete: true` on `paytime_payments.user` is a live defect, not a hypothetical.** Verified against prod on 2026-08-05. SUBJ-07 ("deleting a user account never destroys payment history") is **false today**. Any plan that treats SUBJ-07 as a nice-to-have has misread the current state.
- **Two documents disagreed about the fallback and ROADMAP wins (D-39-06).** `PROJECT.md` line 41 needs correcting at the next phase transition. Do not let a downstream agent re-derive the denormalise fallback from PROJECT.md.
- **`:isset` is a second unproven syntax form, not a footnote.** The user chose the rule-level guard over mapper-only mitigation, which means VERIFY-04's evidence depends on `:isset` and `@request.body.X = <stored>` working on this instance. Probe both in the same pass as the traversal.
- **"Refused" for ROSTER-07 means client-refused.** There is no RESTRICT in PocketBase. The phase must say so plainly in its verification and security artifacts.
- **Phase 38's credential gap is the thing to not repeat.** Its executor could not authenticate, so ROSTER-06's authenticated-non-admin write half remains rule-text-only. D-39-14 exists specifically to close that, and VERIFY-02 is where ROSTER-06's open half gets settled too.
- **Cross-boarder isolation "both directions" is not possible with the current data** — one boarder is linked. D-39-15's setup task is a hard prerequisite of VERIFY-02, not a convenience.
- **The one production record (`2026-07` electricity, ₱123, Cedrick) is never a delete-case target.**

</specifics>

<deferred>
## Deferred Ideas

- **Visible `recorded_by` marker on payment/report rows** — Phase 40. No admin-on-behalf rows exist until then, so it would ship unexercised and untestable (the same reasoning that deferred D-38-14 out of Phase 38).
- **Zero-payment / unpaid-boarder rows in the report** — LEDGER-05, Phase 41.
- **Admin boarder selector in `ManagePayment`** — BEHALF-01/03, Phase 40. D-39-10 deliberately puts the null-boarder guard where that selector will land so the guard isn't rewritten.
- **WR-01 dead-relation user-facing handling** — flagged as Claude's discretion; may stay a known latent issue in this phase. D-39-02 removes the *required*-field variant of it for `recorded_by`, but a dead id can still exist.
- **Server-side enforcement of ROSTER-07** — not deferred, *unavailable*. PocketBase has no RESTRICT mode. Revisit only if PocketBase gains one.
- **Display-name uniqueness on `paytime_boarders`** — still not discussed (carried from `38-CONTEXT.md`). No constraint decided.
- **`PT-AMOUNT-01`** (make `amount` server-required) and **`PT-FMT-01`** (Prettier the PayTime sources) — REQUIREMENTS.md Future Requirements, not v5.0 scope. Note the source files this phase edits are still unformatted.
- **Orphan `.claude/worktrees/` vitest duplicates** — housekeeping recorded in STATE.md; run vitest with `--exclude '**/.claude/**'` or add the line to `vitest.config.ts`. Not this phase's job, but it will inflate this phase's test counts if ignored.

</deferred>

---

*Phase: 39-Payment Subject Rework*
*Context gathered: 2026-08-05*
