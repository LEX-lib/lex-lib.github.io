# Phase 38: Boarder Roster Foundation - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver `paytime_boarders` — the canonical payment subject every later v5.0 phase builds on — as an admin-managed, in-app roster, before any payment data depends on it.

**In scope:**
- `paytime_boarders` PocketBase collection: display name, tags, optional `user` link, `is_active` flag, with all five API rules configured
- In-app roster CRUD (add / edit / deactivate / delete) reachable by the admin without the PocketBase Admin UI
- Tag assignment per boarder, with the vocabulary extensible in-app
- `MonthlyReport.vue` restructured **once** into a sub-tab shell (By Boarder / Boarders); Phase 41 adds the third Ledger tab to the same shell
- `useBoarderRoster` composable — the shared roster read path
- VERIFY-03: prove the roster list rule rejects an unauthenticated read

**Out of scope (belongs to a later phase):**
- Anything touching `paytime_payments` — no `boarder` field, no `recorded_by`, no rule rewrite (Phase 39)
- ROSTER-07's refuse-delete-with-history guard (Phase 39 — `paytime_payments.boarder` doesn't exist yet, so it would pass vacuously here)
- The admin boarder selector in `ManagePayment.vue` (Phase 40)
- The ledger view and tag *filtering* UI (Phase 41)

</domain>

<decisions>
## Implementation Decisions

### Tag vocabulary and storage

- **D-38-01:** `paytime_boarders.tags` is a **`json` string array**, not a `select` field and not a separate `paytime_tags` collection. — **Reversibility:** costly — changing the storage shape later means a data migration across every roster row plus a rewrite of the derive-options logic and its Zod schema.

  **Why the research recommendation was overridden:** RESEARCH/`STACK.md` recommended a `select` field with a code-mirrored option list. That cannot satisfy Success Criterion 3 — **PocketBase's Collections API is superuser-only**, and PayTime's admin is an ordinary `users` row with `is_admin = true`, not a PB superuser. The app therefore **cannot read a `select` field's option list at runtime**, so the options must be hardcoded (as `CategoryOptions` is today in `src/lib/paytime/categories.ts`), which makes adding a tag a code change **and** a deploy. A `json` array with options derived from stored data is the only shape that keeps tag creation fully in-app.

- **D-38-02:** The tag option list is **derived from usage** — the union of tags already present on any roster row. No seeded default vocabulary in code (a seeded list would reintroduce the exact code-change-to-edit problem D-38-01 exists to avoid). The vocabulary **starts empty**; the admin free-types tags while seeding the roster. An `InputText`/placeholder hint may carry an example so the field isn't a blank stare.

- **D-38-03:** Free entry is gated behind an **explicit "Create tag: …" affordance**. Matching existing tags are surfaced first; inventing a new tag is a deliberate click, never a side effect of typing.

- **D-38-04:** Tags are **normalized to a canonical form before storage** — trim, collapse inner whitespace, lowercase — so `Second Floor` / `second  floor` / `Second floor` all land on `second floor`. Rendered title-cased for display. **Normalization is enforced in Zod, not only in the UI**, so a hand-crafted request cannot bypass it, and so it is unit-testable. This is the mitigation for the typo-fragmentation risk that got free-text boarder names rejected at milestone scope.

- **D-38-05:** **All tag filtering is client-side, permanently — across Phase 38 and Phase 41.** The roster is ~6 rows and is already fully loaded by the read path, so filtering is a `.filter()` over an in-memory array (the v1.2 search/sort and v4.0 expense-filter precedent, both of which added zero PocketBase queries). **PocketBase's `:each` modifier is deliberately never used and never spiked** — this removes the json-array-filtering risk from the milestone rather than carrying it into Phase 41. A later phase must not assume `:each` works on this instance; it has never been exercised.

### Admin surface and shell structure

- **D-38-06:** The top-level **"Monthly Report" tab is renamed "Admin"**. By Phase 41 it holds By Boarder / Ledger / Boarders, and two of three would not be a monthly report. Renaming happens in the phase that causes it, so Phase 41 needs no second cosmetic change.

- **D-38-07:** **Non-admins see no roster surface at all.** The Admin tab keeps today's shape: `v-if="isAdmin"` on **both** `<Tab>` and `<TabPanel>`, with server rules blocking independently. ROSTER-06's authenticated-read access exists for the *machine* — the selector needs a source and a boarder must resolve their own record, both inside `useBoarderRoster`, invisibly. No read-only roster view is built. This is also what LEDGER-07 will require in Phase 41.

- **D-38-08:** **By Boarder is the default sub-tab** (today's report). Roster seeding is a one-time session; checking who paid is the daily job. Matches v4.0's precedent where the Expenses tab always opens on List. **No sub-tab persistence** (v4.0 deliberately skipped it).

- **D-38-09:** The roster is fetched by a **module-level cached `useBoarderRoster` composable**, on the `src/composables/useFileToken.ts` model (module-scope cache + in-flight dedup) — **not** by the Admin shell and **not** by `PayTimeApp.vue`. Rationale: `ManagePayment` and `PaymentLog` live *outside* the Admin tab and need the roster in Phases 39/40, so a shell-owned fetch would need a second mount-path fetch later. The composable is the structural fix for the auto-cancel class of bug — the SDK's default requestKey is `method + path` and **excludes the query string**, and every `TabPanel` mounts without `lazy`, which is exactly how the sibling-panel collision happened in PayTime v1.0 and why `useFileToken` is a singleton. It also means a non-admin only pays for a roster fetch when something actually reads it. — **Reversibility:** costly — three consumers across three phases bind to this contract.

  Note: this composable adds a new mount-path fetch, so per the locked project invariant it needs its **own distinct `requestKey`**, registered and pasted back. Existing PayTime keys: `paytime-payments-list`, `paytime-report-list`. Name not chosen during discussion — planner's call.

### Boarder ↔ account linking

- **D-38-10:** The link is **one-to-one, enforced by a unique index** on `paytime_boarders.user` (nullable, so many unlinked rows are fine). This is a correctness requirement, not tidiness: Phase 39's rule traverses `boarder.user = @request.auth.id` and Phase 40 resolves "my boarder" from the roster — two boarders on one account makes "my boarder" ambiguous, and the ambiguity surfaces as a **silently wrong payment subject, not an error**. — **Reversibility:** costly — dropping the index later is trivial, but every "my boarder" call site in Phases 39–41 is written assuming singularity.

- **D-38-11:** `cascadeDelete` **must be `false`** on `paytime_boarders.user` (carried invariant, PITFALLS #3 — deleting a user account must never destroy a boarder row). Verified per D-13 paste-back.

- **D-38-12:** The link picker is a **dropdown of `users`, displaying `name || email`, with accounts already held by another boarder excluded**, and **"No account" as a first-class choice** (account-less boarders are the milestone's premise). The unique index remains the real guard; the filtered list just stops the admin tripping it by accident.

- **D-38-13 (verified against prod, SchemaRead):** **No `users` rule change is needed.** `users.listRule` and `viewRule` are both already `id = @request.auth.id || @request.auth.is_admin = true` — the admin can list every user today. One fewer D-13 paste-back than assumed.

- **D-38-14:** `useBoarderRoster` exposes `myBoarder` as `Boarder | null`. **Phase 38 ships no user-facing consequence for a null.** `PaymentLog` still keys off `user` until Phase 39 rewrites the subject, so in Phase 38 the missing-boarder condition is unreachable and an empty-state message would ship untestable and be rewritten one phase later. Phase 39 owns that copy. A missing boarder is the **expected** state for 5 of 6 people the moment the collection is created — never an error, never a toast.

### Roster list and lifecycle

- **D-38-15:** **Delete ships in Phase 38**, admin-only, behind a `useConfirm` confirmation (the `PaymentLog` pattern; `ConfirmDialog` already lives at the `PayTimeApp.vue` shell level).

  **Concern raised and overridden by the user, recorded deliberately:** in Phase 38 nothing protects a delete — `paytime_payments.boarder` does not exist, so no payment can reference a boarder and the roster's `deleteRule` is the only guard standing. The user affirmed full CRUD in the phase named for it, on the grounds that a boarder mistyped five minutes ago should be removable rather than permanently deactivated. **Consequences the planner must honour:** the roster `deleteRule` must be admin-only (`@request.auth.is_admin = true`), and Phase 39 adds ROSTER-07's has-history refusal on top of this button rather than introducing the button.

- **D-38-16:** Inactive boarders are shown **inline with a muted "Inactive" badge, sorted after actives** — one list, no toggle, no hidden state. At ~6 rows there is no volume problem, and a visible inactive boarder is one the admin can reactivate without hunting for a filter. A `Tag severity="secondary"` plus a sort computed, not a feature.

- **D-38-17:** The roster reuses **`PaymentLog.vue`'s row layout** — details column with an inline kebab `Menu` on mobile, actions inline on desktop. Chosen over `DataTable` (research's recommendation, but that was for the Phase 41 *ledger*; a 6-row roster needs no sorting or paging, and DataTable's 390px story costs more markup) and over per-boarder `Panel` (a toggleable Panel implies collapsible detail a roster row doesn't have).

  **Carries a locked invariant:** breakpoint utilities go on **plain wrapper elements, never on a PrimeVue component**. Tailwind v4 emits real `@layer` cascade layers; PrimeVue injects its runtime CSS unlayered, and unlayered beats layered — `sm:hidden` on a `Button` is silently ignored.

- **D-38-18:** **Deactivate/Reactivate is a kebab-menu action** next to Edit and Delete — one interaction model for every row action. `is_active` **defaults `true`** on create (an admin adding a boarder is adding someone who lives there now). The Edit dialog stays about identity (name, tags, account), not lifecycle. Single write path to `is_active`, so there's no optimistic-state disagreement to test.

### Claude's Discretion

- The roster fetch's `requestKey` name (must be distinct from `paytime-payments-list` and `paytime-report-list`, registered and pasted back per the locked invariant)
- Exact text of the five `paytime_boarders` API rules, subject to the hard constraints recorded above: list/view must be `@request.auth.id != ""` (**never `""`** — PocketBase treats empty-string as *public*, not unconfigured); create/update/delete must reference the literal `is_admin` (**never** bare `@request.auth.id != ""` — see PITFALLS #1 and the real `isSuperUser = isLoggedIn` bug in `GiftExchangeManage.vue`)
- How VERIFY-03's unauthenticated-read probe is executed and recorded
- How the ~6 boarders get seeded (in-app add flow vs Admin UI rows)
- Whether the one existing production payment's owner needs a matching boarder row in this phase or Phase 39
- Component/file names for the extracted and new sub-views, and whether `MonthlyReportView` is extracted verbatim
- Empty-state copy for a roster with zero boarders; optimistic-update vs refetch-after-write
- Zod schema shape and file placement for the boarder record
- Display-name uniqueness (not discussed; no constraint decided)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and traceability
- `.planning/REQUIREMENTS.md` — ROSTER-01..06, TAG-01, VERIFY-03 are this phase's requirements; ROSTER-07 is explicitly Phase 39's. Also the Out of Scope table (placeholder `users` rows, free-text boarder names, and a free-form tag management UI were all rejected during questioning).
- `.planning/ROADMAP.md` § Phase 38 — goal, three success criteria, and the note explaining why ROSTER-07 is excluded.
- `.planning/PROJECT.md` § Current Milestone, § Constraints, § Key Decisions — `paytime_*` collection prefix, the requestKey-uniqueness invariant, and the two unvalidated v5.0 decisions (boarders as their own collection; boarder as the canonical subject).
- `.planning/STATE.md` § Accumulated Context — the D-13 paste-back invariant and the v5.0 phase-structure decisions locked at roadmap creation (including "roster CRUD UI ships in Phase 38, MonthlyReport restructured once here").

### Research (read before planning; note where this CONTEXT overrides it)
- `.planning/research/SUMMARY.md` — the reconciled research picture. **Its tag recommendation (`select` field) is overridden by D-38-01/02** for the superuser-API reason recorded there; its Phase 1 shape otherwise holds.
- `.planning/research/STACK.md` — PocketBase relation/rule syntax, tag-field trade-offs, PrimeVue component choices.
- `.planning/research/ARCHITECTURE.md` — shell/sub-view pattern, `useBoarderRoster` composable design, `cascadeDelete` placement.
- `.planning/research/PITFALLS.md` — Pitfall 1 (admin check satisfiable by any authenticated user), Pitfall 3 (`cascadeDelete: true` data loss), Pitfall 4 (roster list rule left as `""` = public roster). Pitfalls 1, 3, and 4 are **this phase's** to avoid.
- `.planning/research/FEATURES.md` — P1/P2/P3 ranking; roster is the dependency root.

### Codebase maps (predate PayTime — they describe Wallecx as the active app)
- `.planning/codebase/CONCERNS.md` — the documented `isSuperUser = isLoggedIn` bug in `GiftExchangeManage.vue`, the precedent behind Pitfall 1.
- `.planning/codebase/CONVENTIONS.md` — mini-app folder/naming conventions.
- `.planning/codebase/ARCHITECTURE.md` — shell/tab patterns.

### Source files this phase reads from or restructures
- `src/components/projects/paytime/MonthlyReport.vue` — restructured into the Admin shell; its per-boarder Panel markup becomes the By Boarder sub-view.
- `src/components/projects/paytime/PayTimeApp.vue` — the tab rename (D-38-06) and the `isAdmin` gate live here; `ConfirmDialog` is already at this level.
- `src/components/projects/paytime/PaymentLog.vue` — the row + kebab-`Menu` layout D-38-17 reuses.
- `src/components/projects/paytime/ManagePayment.vue` — the add/edit Dialog pattern (`visible`/`record` `defineModel` pair, `saved` emit, `describeSaveError()`) the boarder form should mirror.
- `src/composables/useFileToken.ts` — the module-level singleton + in-flight-dedup pattern `useBoarderRoster` copies (D-38-09).
- `src/lib/pocketbase/paytimePaymentMapper.ts` — mapper conventions, and the documented reason update mappers omit the owner field.
- `src/lib/paytime/categories.ts` — the hardcoded-options pattern D-38-01 deliberately does **not** repeat for tags.
- `src/lib/paytime/paymentSchema.ts` — Zod conventions for the boarder schema.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useFileToken.ts`** — module-level singleton with in-flight dedup and `authStore.onChange` teardown. The template for `useBoarderRoster` (D-38-09).
- **`PaymentLog.vue` row layout** — mobile-tested details column + inline kebab `Menu`, desktop inline actions. Reused wholesale for the roster list (D-38-17).
- **`ManagePayment.vue`** — reusable add/edit Dialog: `visible`/`record` `defineModel` pair, `saved` emit, `isSaving` guard, `describeSaveError()` that unwraps PocketBase per-field validation messages. The boarder form mirrors this shape.
- **`ConfirmDialog` at `PayTimeApp.vue` shell level** — already mounted; the roster's delete confirmation reuses it via `useConfirm` (which must be imported explicitly — it is *not* auto-resolved).
- **`MonthlyReport.vue`'s per-boarder Panel markup** — extracted, not rewritten, into the By Boarder sub-view.
- **`ExpensesTab.vue` → `ExpensesListView`/`ExpensesReportsView`** (frozen Wallecx, still readable) — the parent-shell + child-view SFC split precedent for the Admin shell.

### Established Patterns
- **Tab shell, not sub-routes** — sub-routes would break existing `/projects/paytime` bookmarks.
- **Every `TabPanel` mounts without `lazy`** — `v-show`, not `v-if`, so *every* panel's `onMounted` runs and sibling fetches race. `lazy` was already rejected as a fix in PayTime v1.0 because its `v-if` would destroy the calculator's unsaved input. This is why the roster read path is a shared composable and not a per-view fetch.
- **`requestKey` uniqueness (locked invariant)** — the SDK's default key is `method + path` and excludes the query string, so two differently-filtered list calls to the same collection silently abort each other. Every new mount-path fetch registers its own key.
- **Breakpoint utilities on plain wrappers, never on a PrimeVue component** — Tailwind's layered utilities lose to PrimeVue's unlayered runtime CSS.
- **Server-side isolation is the auth boundary; client gating is UX only** — every roster rule must hold on its own.
- **D-13** — any live-artifact configuration step requires the actual configured values pasted back as text **plus** a code-side smoke probe. Acknowledgement alone silently no-op'd before (v4.2 BUG-01). Every schema/rule/index step in this phase is subject to it.
- **PocketBase rule polarity** — `null` = superuser-only; **`""` = public**, not "unconfigured". This is the whole substance of VERIFY-03.
- **`@request.body.<field>` on createRule, not the deprecated `@request.data.<field>`** — confirmed against this live instance; the deprecated form returns 403.
- **`getFullList()` over `getList()`** — PB v0.29.x's count path 400s on non-trivial listRule expressions (D-31-B); `getFullList` uses `skipTotal` internally.
- **Auth** — `pb.authStore.record!.id` needs a null guard; `auth.user?.is_admin === true` is the existing admin check.

### Integration Points
- `PayTimeApp.vue` — tab rename + `isAdmin` gate on both `<Tab>` and `<TabPanel>`.
- `MonthlyReport.vue` — becomes the Admin sub-tab shell; today's body moves down one level.
- New: `paytime_boarders` collection; a boarder Zod schema and mapper under `src/lib/paytime/` and `src/lib/pocketbase/`; `src/types/paytime/boarders/types.d.ts` alongside the existing `payments/types.d.ts`; `useBoarderRoster` under `src/composables/`.
- Future consumers of `useBoarderRoster`: `PaymentLog` and `ManagePayment` (Phases 39/40) — its contract is set here.

</code_context>

<specifics>
## Specific Ideas

- **"Immediately assignable in the app" is the acceptance bar for TAG-01/Criterion 3** — not "editable somewhere". This is what forced the `json`-array shape over the `select` field, and the planner should not quietly regress it to a hardcoded option list for convenience.
- **The `:each` modifier is deliberately unexercised.** D-38-05 doesn't defer it — it declines it. Any later phase asserting json-array filtering works on this instance is asserting something unverified.
- **Delete was a considered override, not an oversight.** The concern (no guard until Phase 39) is recorded in D-38-15 with the two consequences the planner must carry.
- **`users` needs no rule change** — verified live, not assumed (D-38-13). Don't re-plan a `users` paste-back step.

</specifics>

<deferred>
## Deferred Ideas

- **Read-only roster view for non-admins** — considered and declined (D-38-07). Not scheduled; would need its own gating and verification, and LEDGER-07 wants non-admins blocked from roster management.
- **Sub-tab persistence for the Admin shell** — out of scope, consistent with v4.0's deliberate omission for the Expenses tab.
- **Server-side tag filtering via `:each`** — declined for the whole milestone (D-38-05), not deferred to a phase.
- **Tag retirement / rename from the vocabulary** — not discussed. With usage-derived options a tag disappears once no boarder holds it, so retirement is implicit; an explicit rename-across-all-boarders action was never specified. Revisit only if it hurts.
- **Display-name uniqueness on `paytime_boarders`** — raised as an available follow-up, not discussed. No constraint decided.
- **Deactivate confirmation/warning copy** — raised as an available follow-up, not discussed.
- **The one existing production payment's boarder mapping** — flagged as Claude's discretion; more naturally Phase 39's backfill (SUBJ-02).

</deferred>

---

*Phase: 38-Boarder Roster Foundation*
*Context gathered: 2026-08-04*
