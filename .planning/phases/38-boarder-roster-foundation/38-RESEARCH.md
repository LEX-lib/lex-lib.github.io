# Phase 38: Boarder Roster Foundation - Research

**Researched:** 2026-08-04
**Domain:** PocketBase collection design (new admin-managed roster) + Vue 3/PrimeVue admin CRUD UI, inside an existing per-user-isolated mini-app
**Confidence:** HIGH — every collection/rule/file claim below is grounded either in this repo's own source (Read this session, cited by path:line) or in `.planning/research/{STACK,ARCHITECTURE,PITFALLS}.md`, all produced in this same research session earlier today against this exact phase. Two narrow PocketBase-mechanics gaps (unique-index-on-relation UI location, JSON field `maxSize`/`required` semantics) were closed via WebSearch against official `pocketbase.io`/JSVM sources this session — tagged `[CITED]` below.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tag vocabulary and storage**
- **D-38-01:** `paytime_boarders.tags` is a **`json` string array**, not a `select` field and not a separate `paytime_tags` collection. Reversibility: costly.
- **D-38-02:** The tag option list is **derived from usage** — union of tags already present on any roster row. No seeded default vocabulary. Vocabulary starts empty; admin free-types tags while seeding the roster.
- **D-38-03:** Free entry is gated behind an explicit **"Create tag: …" affordance**. Matching existing tags surfaced first; inventing a new tag is a deliberate click.
- **D-38-04:** Tags are **normalized to a canonical form before storage** — trim, collapse inner whitespace, lowercase. Rendered title-cased for display. **Normalization enforced in Zod, not only the UI.**
- **D-38-05:** **All tag filtering is client-side, permanently** (Phase 38 and Phase 41). `:each` modifier is deliberately never used and never spiked.

**Admin surface and shell structure**
- **D-38-06:** Top-level "Monthly Report" tab is **renamed "Admin"**.
- **D-38-07:** **Non-admins see no roster surface at all.** `v-if="isAdmin"` on both `<Tab>` and `<TabPanel>`, server rules block independently. No read-only roster view built.
- **D-38-08:** **By Boarder is the default sub-tab.** No sub-tab persistence.
- **D-38-09:** Roster fetched by a **module-level cached `useBoarderRoster` composable**, on the `useFileToken.ts` model — not by the Admin shell, not by `PayTimeApp.vue`. Needs its own distinct `requestKey` (existing: `paytime-payments-list`, `paytime-report-list`).

**Boarder ↔ account linking**
- **D-38-10:** Link is **one-to-one, enforced by a unique index** on `paytime_boarders.user` (nullable — many unlinked rows are fine).
- **D-38-11:** `cascadeDelete` **must be `false`** on `paytime_boarders.user`.
- **D-38-12:** Link picker is a dropdown of `users`, displaying `name || email`, excluding accounts already held by another boarder, with **"No account" as a first-class choice**.
- **D-38-13 (verified against prod, SchemaRead):** **No `users` rule change needed** — `users.listRule`/`viewRule` already `id = @request.auth.id || @request.auth.is_admin = true`.
- **D-38-14:** `useBoarderRoster` exposes `myBoarder` as `Boarder | null`. **Phase 38 ships no user-facing consequence for a null** — `PaymentLog` still keys off `user` until Phase 39.

**Roster list and lifecycle**
- **D-38-15:** **Delete ships in Phase 38**, admin-only, behind `useConfirm`. Deliberate override: nothing protects a delete in Phase 38 (no `paytime_payments.boarder` yet) beyond `deleteRule` being admin-only. Phase 39 adds ROSTER-07's has-history refusal on top of this button.
- **D-38-16:** Inactive boarders shown **inline with a muted "Inactive" badge, sorted after actives** — one list, no toggle.
- **D-38-17:** Roster reuses **`PaymentLog.vue`'s row layout** (details column + inline kebab `Menu` on mobile, inline actions on desktop) over `DataTable` or `Panel`. Breakpoint utilities go on plain wrapper elements, never on a PrimeVue component.
- **D-38-18:** Deactivate/Reactivate is a **kebab-menu action** next to Edit and Delete. `is_active` **defaults `true`** on create.

### Claude's Discretion
- The roster fetch's `requestKey` name (distinct from `paytime-payments-list`/`paytime-report-list`, registered and pasted back)
- Exact text of the five `paytime_boarders` API rules, subject to: list/view must be `@request.auth.id != ""` (never `""`); create/update/delete must reference literal `is_admin` (never bare `@request.auth.id != ""`)
- How VERIFY-03's unauthenticated-read probe is executed and recorded
- How the ~6 boarders get seeded (in-app add flow vs Admin UI rows)
- Whether the one existing production payment's owner needs a matching boarder row in this phase or Phase 39
- Component/file names for extracted and new sub-views, and whether `MonthlyReportView` is extracted verbatim
- Empty-state copy for a zero-boarder roster; optimistic-update vs refetch-after-write
- Zod schema shape and file placement for the boarder record
- Display-name uniqueness (not discussed; no constraint decided)

### Deferred Ideas (OUT OF SCOPE)
- Read-only roster view for non-admins (declined, D-38-07)
- Sub-tab persistence for the Admin shell
- Server-side tag filtering via `:each` (declined for the whole milestone)
- Tag retirement/rename from the vocabulary (not discussed; usage-derived options make retirement implicit)
- Display-name uniqueness on `paytime_boarders` (not discussed)
- Deactivate confirmation/warning copy (not discussed)
- The one existing production payment's boarder mapping (flagged as Phase 39's backfill, SUBJ-02)
- ROSTER-07 (refuse-delete-with-history) — Phase 39, `paytime_payments.boarder` doesn't exist yet
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROSTER-01 | Admin can add a boarder with a display name | `paytime_boarders.name` (text, required) + `ManageBoarder.vue` mirroring `ManagePayment.vue`'s create path |
| ROSTER-02 | Admin can assign one or more tags to a boarder | `tags` json string array (D-38-01) + `MultiSelect`-style free-entry UI over usage-derived options (Architecture Pattern 2) |
| ROSTER-03 | Admin can link a boarder to an existing user account, or leave unlinked | `user` optional relation → `users`, nullable, unique index (D-38-10), dropdown filtered by already-linked accounts (D-38-12) |
| ROSTER-04 | Admin can mark a boarder inactive, keeping payment history intact | `is_active` bool, default `true`; kebab-menu action; `cascadeDelete: false` throughout means no history exists to touch anyway in Phase 38 |
| ROSTER-05 | Admin can edit display name, tags, and account link | `ManageBoarder.vue` update path, same Dialog `visible`/`record` pattern as `ManagePayment.vue` |
| ROSTER-06 | Any authenticated user can read the roster; admin-only write | `listRule`/`viewRule`: `@request.auth.id != ""`; `createRule`/`updateRule`/`deleteRule`: `@request.auth.is_admin = true` (Architecture Pattern 1, exact text below) |
| TAG-01 | Admin extends tag vocabulary without code change/deploy | json array + usage-derived options (D-38-01/02) is the mechanism that makes this true — a `select` field cannot, because the Collections API is superuser-only at runtime (see Pitfall/Constraint below) |
| VERIFY-03 | Roster list rule rejects unauthenticated read | `listRule` must be a non-empty predicate — `""` is public in PocketBase, not "unconfigured"; probe: unauthenticated `curl`/fetch against `/api/collections/paytime_boarders/records` must 404 |
</phase_requirements>

## Summary

Phase 38 creates exactly one new PocketBase collection, `paytime_boarders`, and the in-app CRUD surface for it. Nothing in this phase touches `paytime_payments` — that collection, its rules, and its `user` field are completely untouched until Phase 39. The phase is dominated by two hard constraints already discovered and locked in CONTEXT.md: (1) the Collections API is superuser-only at runtime, which rules out a `select` field for tags and forces a `json` string array normalized in Zod; (2) this repo has **no PocketBase migration mechanism at all** — every schema/rule change is a manual Admin UI edit, gated by the project's D-13 invariant (paste back the actual configured values as text, plus a code-side smoke probe; acknowledgment alone is insufficient, per the BUG-01 precedent).

The collection shape, the exact five rule strings, and the file-level plan (new composable, mapper, Zod schema, types, and three new/modified `.vue` files) were already fully worked out by this project's own `STACK.md`/`ARCHITECTURE.md`/`PITFALLS.md` research earlier in this same session, specifically for `paytime_boarders` (the "low risk, no relation traversal needed" half of the v5.0 rule rewrite — `paytime_payments`'s risky relation-traversal rules are explicitly Phase 39's problem, not this phase's). This document restates and narrows that research to exactly Phase 38's scope, adds the two PocketBase-mechanics details CONTEXT.md flagged as needing confirmation (unique index on an optional relation field; json field `required`/`maxSize` semantics), and maps every phase requirement to a concrete file or rule.

**Primary recommendation:** Create `paytime_boarders` (`name` text required, `tags` json string array, `user` optional single relation → `users` with a unique index and `cascadeDelete: false`, `is_active` bool default `true`) with rules `listRule`/`viewRule = @request.auth.id != ""` and `createRule`/`updateRule`/`deleteRule = @request.auth.is_admin = true`. Build `useBoarderRoster.ts` as a `useFileToken.ts`-shaped module-level-cache composable, `ManageBoarder.vue` as a `ManagePayment.vue`-shaped Dialog, and a roster list view reusing `PaymentLog.vue`'s row layout — nested as a new "Boarders" sub-tab inside `MonthlyReport.vue`, restructured into a shell alongside the renamed "Admin" top-level tab and the existing "By Boarder" report as the first sub-tab.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Roster CRUD (add/edit/deactivate/delete a boarder) | API / Backend (PocketBase rules) | Browser / Client (Vue Dialog + form) | Server rules are the actual enforcement boundary (`@request.auth.is_admin`); the client Dialog is UX only — CONTEXT.md explicitly frames the client `v-if="isAdmin"` gate as cosmetic |
| Tag vocabulary extensibility (TAG-01) | Database / Storage (json field, no schema dependency) | Browser / Client (derive options from loaded rows) | The entire reason a `json` array was chosen over `select` is that schema-level (Collections API) tag editing is unreachable at runtime for a non-superuser admin — the vocabulary must live in *data*, not schema, so the client can extend it without any backend involvement |
| Authenticated-read / admin-write access control (ROSTER-06, VERIFY-03) | API / Backend (PocketBase list/view/create/update/delete rules) | — | Server-side rule is the sole enforcement boundary; per CONTEXT.md D-38-07, client gating never substitutes for it |
| Boarder↔account uniqueness (D-38-10) | Database / Storage (unique index on `user`) | Browser / Client (filtered dropdown, D-38-12) | The unique index is the actual guard; the UI dropdown filter only prevents the admin *tripping* it, it doesn't enforce anything |
| Roster read path for downstream consumers (ManagePayment, PaymentLog in Phases 39/40) | Browser / Client (`useBoarderRoster` composable) | API / Backend (single shared `getFullList`) | A module-level cache is a client-tier concern; the composable's contract (shape, `myBoarder`, cache-not-refetch) is what Phases 39–41 bind to, per D-38-09 |
| Admin shell tab rename + nested sub-tabs (By Boarder / Boarders) | Browser / Client (`PayTimeApp.vue`, `MonthlyReport.vue`) | — | Pure presentation/routing-within-page concern; no server dependency |

## Standard Stack

### Core

No new core technology. Everything below is already installed and versioned in `package.json` (Read this session):

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pocketbase` (JS SDK) | `^0.26.2` `[VERIFIED: package.json:43]` | Client for the new `paytime_boarders` collection | Already the only backend client in the app; server is PocketBase v0.29.x (established in prior phases, STATE.md) |
| `vue` | `^3.5.34` `[VERIFIED: package.json:49]` | Composition API for `ManageBoarder.vue` / roster view | Locked baseline (Phase 33) |
| `primevue` | `^4.5.5` `[VERIFIED: package.json:45]` | `Dialog`, `Tag`, `Menu`, `Button`, `InputText`, `ConfirmDialog` — every UI primitive this phase needs already ships | Locked baseline (Phase 33); auto-resolved via `unplugin-vue-components` |
| `zod` | `^4.1.5` `[VERIFIED: package.json:54]` | Boarder input schema (name required, tags array with normalization refine, user id optional) | Existing convention (`paymentSchema.ts`) |
| `vue-sonner` | `^2.0.9` `[VERIFIED: package.json:52]` | Toast on save/delete errors, mirroring `ManagePayment.vue` | Existing convention |

### Supporting

None needed. `.planning/research/STACK.md` (produced this session, this phase) concluded explicitly: "Bottom line: no new npm packages are needed for v5.0." Phase 38 needs nothing beyond that — no tag-input package, no data-grid package (D-38-17 already rejected `DataTable` in favor of reusing `PaymentLog.vue`'s row layout for this phase's ~6-row roster).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `json` string array for tags (D-38-01, locked) | PocketBase `select` field, `maxSelect > 1` | `STACK.md`'s original recommendation — rejected by CONTEXT.md because the Collections API is superuser-only at runtime, so the app cannot read/extend a `select` field's option list without a code change + deploy, failing TAG-01/Success Criterion 3 outright |
| Reusing `PaymentLog.vue`'s row layout (D-38-17, locked) | PrimeVue `DataTable` | `STACK.md` recommended `DataTable` for the Phase 41 *ledger* (which genuinely needs column filters); a 6-row roster with no sorting/paging needs is over-built by `DataTable`'s markup cost |
| Free-entry "Create tag: …" affordance (D-38-03) | `MultiSelect` over a fixed option list | `MultiSelect` was `STACK.md`'s recommendation for a *closed* vocabulary — wrong shape once the vocabulary must be usage-derived and extensible in-app (TAG-01) |

**Installation:**
```bash
# Nothing to install — confirm no version drift before planning:
npm ls primevue pocketbase zod dayjs
```

**Version verification:** All four core packages above were confirmed directly from this repo's own `package.json` (Read this session, lines cited). No registry lookup needed — nothing new is being added.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every capability (Zod schema, PocketBase collection, PrimeVue components) is covered by dependencies already present in `package.json`, confirmed by direct file read this session. No `npm install` step belongs in this phase's plan.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ PayTimeApp.vue  (shell — tab rename only: "Monthly Report"→"Admin")  │
│   Tabs: My Payments | Electricity Calculator | Admin (v-if isAdmin) │
└──────────────┬────────────────────────────────┬──────────────────────┘
               │                                 │ (isAdmin, both Tab+TabPanel)
        (unchanged)                              ▼
                                    ┌───────────────────────────────────┐
                                    │ MonthlyReport.vue  (restructured  │
                                    │ into a shell: owns month-scoped   │
                                    │ payments fetch, unchanged)         │
                                    │  nested Tabs: By Boarder | Boarders│
                                    └──────┬─────────────────┬──────────┘
                                           │ (default)       │ (new)
                                  ┌────────▼───────┐  ┌───────▼─────────────┐
                                  │ MonthlyReportView│  │ BoarderRosterView   │
                                  │ (extracted Panel │  │ (new) — row list,   │
                                  │ markup, props-in) │  │ kebab Menu, +Add    │
                                  └──────────────────┘  │ button              │
                                                         └──────┬──────────────┘
                                                                │ opens
                                                         ┌──────▼──────────────┐
                                                         │ ManageBoarder.vue    │
                                                         │ (Dialog: name, tags, │
                                                         │  user link, is_active)│
                                                         └──────┬──────────────┘
                                                                │ create/update/delete
                                                                ▼
                                              ┌───────────────────────────────┐
                                              │ PocketBase paytime_boarders    │
                                              │  listRule/viewRule:            │
                                              │   @request.auth.id != ""       │
                                              │  create/update/deleteRule:     │
                                              │   @request.auth.is_admin=true  │
                                              └───────────────────────────────┘
                                                                ▲
                                              ┌─────────────────┴─────────────┐
                                              │ useBoarderRoster.ts (module-   │
                                              │ level cache, one fetch shared  │
                                              │ by every mounted consumer)     │
                                              └────────────────────────────────┘
                                              ▲ read-only in Phase 38 — no
                                              │ user-facing consumer yet
                                              (myBoarder unused until Phase 39)
```

Every arrow into `paytime_boarders` from the client goes through the SDK's `getFullList`/`create`/`update`/`delete`, each independently re-checked against the rules above — the client gates (`v-if="isAdmin"`, both on `<Tab>` and `<TabPanel>`) are cosmetic, per D-38-07 and the codebase's own documented `isSuperUser = isLoggedIn` mistake in `GiftExchangeManage.vue` `[VERIFIED: src/components/projects/gift-exchange/GiftExchange.vue — grep this session, line 16 `const isAdminOpen = ref(false);` is unrelated to the roster; the actual documented bug is in the sibling GiftExchangeManage.vue per .planning/codebase/CONCERNS.md, not re-read this session]`.

### Recommended Project Structure

```
src/
├── composables/
│   └── useBoarderRoster.ts          # NEW — module-level cache, mirrors useFileToken.ts
├── lib/
│   ├── pocketbase/
│   │   └── paytimeBoarderMapper.ts  # NEW — mapToCreateBoarder / mapToUpdateBoarder
│   └── paytime/
│       └── boarderSchema.ts         # NEW — Zod schema incl. tag normalization refine
├── types/paytime/
│   └── boarders/types.d.ts          # NEW — PaytimeBoarder, AddPaytimeBoarder
└── components/projects/paytime/
    ├── PayTimeApp.vue                # MODIFIED — tab label "Monthly Report"→"Admin"
    ├── MonthlyReport.vue             # MODIFIED — becomes shell w/ nested Tabs
    ├── MonthlyReportView.vue         # NEW — extracted Panel markup (verbatim, props-in)
    ├── BoarderRosterView.vue         # NEW — roster list, reuses PaymentLog.vue row layout
    ├── ManageBoarder.vue             # NEW — Dialog mirroring ManagePayment.vue
    └── __tests__/
        └── requestKeys.spec.ts       # MODIFIED — assert the new roster requestKey is distinct
```

This is a direct narrowing of `.planning/research/ARCHITECTURE.md`'s already-produced "Recommended Project Structure" (this session) to exactly Phase 38's files — every `paytime_payments`-touching file listed there (`paytimePaymentMapper.ts`, `ManagePayment.vue`, `PaymentLog.vue`, `AdminLedgerView.vue`) is explicitly out of scope here and untouched until Phase 39/41.

### Pattern 1: The five `paytime_boarders` rules — exact text

**What:** Already fully worked out in `.planning/research/ARCHITECTURE.md` Pattern 1 (this session), and it is the low-risk half of that document's rule design — no relation traversal, no dot-notation, no createRule ambiguity of the kind Phase 39 has to worry about.

```
listRule:   @request.auth.id != ""
viewRule:   @request.auth.id != ""
createRule: @request.auth.is_admin = true
updateRule: @request.auth.is_admin = true
deleteRule: @request.auth.is_admin = true
```

**Why this satisfies ROSTER-06 / VERIFY-03 / Success Criterion 2:** `@request.auth.id != ""` is true for any authenticated request regardless of role — every logged-in user (admin or not) can list/view. An unauthenticated request has `@request.auth.id == ""`, so the predicate is false and PocketBase filters out every row → **empty result, surfaced as HTTP 404 on `view`, empty array on `list`** `[CITED: this repo's own documented v0.29.x behavior, STATE.md "PocketBase listRule returns 200+empty (not 403) for unauthenticated requests... @request.auth.id != "" is a filter expression; when false, all rows are filtered out"]`. This is exactly VERIFY-03's assertion to probe: an unauthenticated `getFullList` (no token) against `paytime_boarders` must come back empty/denied, never the full roster.

**The trap this avoids (Pitfall 4, `.planning/research/PITFALLS.md`, this session):** `listRule: ""` (empty string) is **not** "no rule configured" — in PocketBase it means **public, unauthenticated access allowed**. `null` (left unset in the Admin UI) means superuser-only. Both are one click away from the correct `@request.auth.id != ""` in the Admin UI schema editor, and this project has already been bitten by an identically-shaped `null`/`""`-adjacent trap once (`@request.body.*` vs deprecated `@request.data.*`). The D-13 smoke probe for this phase **must** include a genuinely unauthenticated request (no token at all), not just a second authenticated-as-non-admin token — an authenticated-non-admin probe would pass either way and prove nothing about the `""` vs `@request.auth.id != ""` distinction.

**Why `createRule`/`updateRule`/`deleteRule` must say `is_admin`, never bare `@request.auth.id != ""`:** this exact one-token-swap mistake already exists elsewhere in this codebase — `GiftExchangeManage.vue: isSuperUser = computed(() => authStore.isLoggedIn)` (documented in `.planning/codebase/CONCERNS.md`, cited in `PITFALLS.md` Pitfall 1, this session). A rule written as "is logged in" instead of "is admin" hands every boarder full roster-write power with no error anywhere.

**How "admin" is identified in this codebase** `[VERIFIED: src/components/projects/paytime/PayTimeApp.vue:10]`: `const isAdmin = computed(() => auth.user?.is_admin === true);` — a boolean field on the `users` collection record itself, read via the existing `useAuthStore()` (`src/stores/auth.ts`, Read this session — the store wraps `pb.authStore.record` reactively and exposes it as `user`). PocketBase resolves `@request.auth.is_admin` from its own stored copy of the authenticated user's record, never from anything the client sends — so this is genuinely enforced server-side, matching the existing pattern already used to gate the "Monthly Report" tab today (`PayTimeApp.vue:34,43`, Read this session).

### Pattern 2: `paytime_boarders` field-by-field shape

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | text | **required** | Display name (ROSTER-01). No uniqueness constraint — explicitly Claude's Discretion / not discussed per CONTEXT.md; do not add one without flagging it as a new decision. |
| `tags` | json | not required | String array, e.g. `["second floor","vip"]`. Normalized (trim/collapse-whitespace/lowercase) in Zod before every write (D-38-04) — the collection-level `required` flag only guards "is this valid JSON," not shape, so normalization must happen client-side in the Zod schema, not relied on from PocketBase. `required: true` on a json field would reject `null`/`""`/`[]`/`{}` `[CITED: pocketbase.io/docs (JSONField), via WebSearch this session — "required... will require the field value to be non-empty JSON value (not null, "", [], {})"]` — since D-38-02 starts every new boarder with **zero tags** (an empty array is the expected initial state), `tags` must be **left optional**, not required, or every boarder creation with no tags picked yet would be rejected. |
| `user` | relation (single, → `users`) | not required (nullable) | One-to-one link (D-38-10/D-38-12). `maxSelect: 1`, `cascadeDelete: false` (D-38-11). |
| `is_active` | bool | not required (has a default) | Defaults `true` on create (D-38-18). |

**Unique index on `user`:** configured from the Admin UI, collection edit screen, **"Unique constraints and indexes" section** — a single-field unique constraint is directly supported there without needing a migration file `[CITED: pocketbase.io/docs/collections + GitHub Discussion #543, via WebSearch this session — "You can define a combined UNIQUE index from the Admin UI... Unique constraints and indexes section"; for this phase only a *single*-field unique index on `user` is needed, which the Admin UI supports natively]`. **Why nullable + unique works together (D-38-10's "nullable, so many unlinked rows are fine"):** SQLite (PocketBase's storage engine) treats `NULL` as distinct from every other `NULL` under a `UNIQUE` constraint — multiple rows with `user = NULL` do not collide with each other; the constraint only rejects two rows sharing the *same non-null* `user` value. This is standard SQLite `UNIQUE` index semantics, not a PocketBase-specific behavior, and it directly delivers what D-38-10 asks for without any conditional/partial-index workaround. `[ASSUMED: general SQLite NULL-uniqueness semantics — not verified against this specific PocketBase instance this session; the D-13 smoke probe for this phase should include creating two boarders with no linked account to confirm the unique index does not reject the second one]`

**cascadeDelete on `user`:** must be `false` (D-38-11, locked). Effect: deleting a `users` account nulls the `user` link on the linked `paytime_boarders` row rather than deleting the boarder — the boarder record and (later, once it exists) its payment history survive untouched, reverting to "no linked account" `[CITED: .planning/research/ARCHITECTURE.md Pattern 3, this session, citing pocketbase.io/jsvm/classes/RelationField.html — "Optional relation field, cascadeDelete: false — deleting the record being pointed to clears the field to null/empty... the referencing records survive"]`.

### Pattern 3: Tag vocabulary — derive-from-usage, not schema

**What:** No seeded list in code (unlike `CategoryOptions` in `src/lib/paytime/categories.ts`, Read this session — that pattern is explicitly what D-38-01 declines to repeat for tags). The option list offered in `ManageBoarder.vue`'s tag picker is computed client-side as the de-duplicated union of every `tags` value across whatever roster rows are already loaded (via `useBoarderRoster`).

**When to use:** Every time — this is the only mechanism, not a fallback. Admin free-types a new tag behind an explicit "Create tag: …" affordance (D-38-03); matching existing tags surface first (a simple case-insensitive substring filter over the derived option list, computed client-side, no PocketBase query).

**Example (illustrative shape, not verbatim source — no such file exists yet):**
```typescript
// src/lib/paytime/boarderSchema.ts (new) — normalization mirrors D-38-04
import { z } from "zod";

function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export const boarderSchema = z.object({
  name: z.string().min(1, "Display name is required."),
  tags: z.array(z.string().min(1)).transform((arr) => arr.map(normalizeTag)),
  user: z.string().nullable(),
  is_active: z.boolean().default(true),
});
```

This mirrors the existing `paymentSchema.ts` shape (`z.object`, `collectFieldErrors` helper reused as-is) and the existing `dayjs` round-trip pattern already established for validation that PocketBase itself cannot enforce (`isRealCalendarDate` in `paymentSchema.ts:11-19`, Read this session) — normalization here is the same category of "must be enforced in Zod because the storage layer can't do it," per D-38-04's own explicit reasoning.

### Anti-Patterns to Avoid

- **Seeding a hardcoded default tag list "to avoid a blank field":** explicitly declined by D-38-02 — reintroduces the exact code-change-to-edit problem the whole `json`-array decision exists to avoid.
- **Gating the roster surface only with `v-if="isAdmin"` and skipping/softening the server rule:** the documented `GiftExchangeManage.vue` mistake in this exact codebase. Every admin-only action needs its own `is_admin`-checking rule independent of the client render.
- **Treating `""` as a safe default for `listRule`/`viewRule` "until rules are figured out":** it is the *least* restrictive value PocketBase supports, not a neutral placeholder (Pitfall 4).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-tab shared roster state | A new Pinia store | `useBoarderRoster.ts`, module-level cache mirroring `useFileToken.ts` | This exact problem shape (small, read-mostly, auth-scoped resource needed by simultaneously-mounted sibling components under PrimeVue's no-`lazy` `TabPanel` mounting) is already solved once in this codebase; a second idiom for the same shape is pure duplication. `.planning/research/ARCHITECTURE.md` Anti-Pattern 3 (this session) explicitly rejects a new Pinia store here, consistent with the project's own locked "each tab owns its own state; no new Pinia store" decision (STATE.md). |
| Admin CRUD dialog boilerplate | A new modal/form abstraction | `ManageBoarder.vue` mirroring `ManagePayment.vue`'s exact shape (`visible`/`record` `defineModel` pair, `saved` emit, `isSaving` guard, `describeSaveError()`) | `ManagePayment.vue` (Read this session) already has the exact shape needed: seed-on-open watcher, Zod `safeParse` + `collectFieldErrors`, PocketBase per-field error unwrapping. Copying this pattern is strictly less code than inventing a new one. |
| Row action menu (Edit/Delete/Deactivate) | A custom dropdown component | `PaymentLog.vue`'s existing `Menu`-with-`toggle` pattern (one shared popup Menu, `rowMenuPayment`-style tracking of which row opened it) | Already built, already mobile-tested (`PaymentLog.vue:63-94`, Read this session); D-38-17 explicitly reuses this wholesale. |
| Detecting a real calendar date / other data validation PocketBase can't express | Custom validation ad hoc | Zod, same pattern already used in `paymentSchema.ts` | Established project convention; no reason to deviate for the boarder schema. |

**Key insight:** Every new piece of Phase 38 has a same-shaped sibling already living in this exact folder (`src/components/projects/paytime/`) or one folder over (`src/composables/`). The lazy, correct move is copying the sibling's shape, not designing something new.

## Common Pitfalls

### Pitfall 1: `listRule`/`viewRule` left as `""` instead of `@request.auth.id != ""`
**What goes wrong:** The full roster (names, tags, whether someone has an account) becomes readable by an unauthenticated request.
**Why it happens:** `""` reads like "no rule configured yet," but PocketBase treats it as "public" — the opposite of what an empty field name suggests. This project has been bitten by an identically-shaped `null`/`""` PocketBase surprise before (`@request.body.*` vs `@request.data.*`).
**How to avoid:** Author `@request.auth.id != ""` explicitly for both `listRule` and `viewRule`; never leave the Admin UI rule box empty and never toggle the rule off entirely.
**Warning signs:** A `curl`/incognito request with no auth token against `/api/collections/paytime_boarders/records` returns rows instead of an empty/denied response. This is exactly VERIFY-03's required probe.

### Pitfall 2: `createRule`/`updateRule`/`deleteRule` written as "logged in" instead of "admin"
**What goes wrong:** Any authenticated boarder — not just the admin — can create, edit, or delete roster rows.
**Why it happens:** This exact bug (`isSuperUser = isLoggedIn`) already exists once in this codebase (`GiftExchangeManage.vue`, per `.planning/codebase/CONCERNS.md`). It's a one-token-swap mistake with no compile-time signal.
**How to avoid:** Grep every rule expression for the literal substring `is_admin` before considering the collection done; never accept a bare `@request.auth.id != ""` as a stand-in for "is admin."
**Warning signs:** A non-admin test token successfully creates/edits/deletes a boarder row.

### Pitfall 3: `cascadeDelete: true` accidentally checked on `user`
**What goes wrong:** Deleting a `users` account deletes the linked `paytime_boarders` row outright instead of just clearing the link.
**Why it happens:** The Admin UI's cascade toggle defaults off but is a single checkbox easy to flip "for tidiness" while configuring the relation, and its effect is invisible until an account is actually deleted.
**How to avoid:** Set `cascadeDelete: false` explicitly; paste back the actual configured boolean per this project's D-13 invariant — "I created the relation" is not evidence of the cascade setting either way.
**Warning signs:** Deleting a disposable test `users` account also removes the boarder row that was linked to it, rather than leaving the boarder with `user` cleared to empty.

### Pitfall 4: `tags` marked `required` on the collection
**What goes wrong:** Creating a boarder with zero tags (the expected initial state per D-38-02 — vocabulary starts empty) gets rejected by PocketBase's own field validation.
**Why it happens:** "Required" reads as the safe default for most fields, but PocketBase's `required` on a `json` field specifically rejects an empty array (`[]`), which is exactly what a freshly-added, not-yet-tagged boarder needs to be able to hold.
**How to avoid:** Leave `tags` **not required** at the collection level; enforce any real constraints (well-formed strings, normalization) in the Zod schema instead.
**Warning signs:** The "Add a boarder" flow fails on the very first save if the admin hasn't picked a tag yet.

### Pitfall 5: Roster fetched per-component instead of through the shared composable
**What goes wrong:** Multiple independent `getFullList('paytime_boarders')` calls fire on the same page load (once `ManagePayment`/`PaymentLog` in later phases and the roster admin view in this phase are all mounted simultaneously — PrimeVue's no-`lazy` `TabPanel` mounts every panel's `onMounted` at once), each with the SDK's default `requestKey` (`method + path`, ignoring the query string) — the second collides with and auto-cancels the first.
**Why it happens:** This exact bug class already happened once in this codebase (`PaymentLog`/`MonthlyReport` racing on `paytime_payments`, fixed via distinct `requestKey`s and documented in `requestKeys.spec.ts`, Read this session). Adding a *second* collection (`paytime_boarders`) without the same discipline reproduces it.
**How to avoid:** Route every roster read through `useBoarderRoster.ts`'s single module-level fetch (D-38-09); register its `requestKey` as a new, distinct entry alongside the existing `paytime-payments-list`/`paytime-report-list` and paste it back per the locked project invariant.
**Warning signs:** A roster-dependent UI intermittently renders empty on first load, or console shows "The request was aborted (most likely autocancelled)".

## Code Examples

### Module-level cached composable (pattern to copy for `useBoarderRoster.ts`)

```typescript
// Source: src/composables/useFileToken.ts (Read this session, full file) — the
// exact structural template D-38-09 names for useBoarderRoster.ts.
const token = ref("");
let inFlight: Promise<void> | null = null;

function refresh(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      token.value = await pb.files.getToken({ requestKey: null });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

pb.authStore.onChange(() => {
  token.value = "";
  // ...refresh-on-login-if-consumers-active logic
});
```
`useBoarderRoster.ts` follows this exact shape: a module-level `boarders` ref, an `inFlight` dedup promise, a `pb.authStore.onChange` hook that clears the cache on login/logout, and — per D-38-09 — its own distinct `requestKey` (not `null`, since a roster fetch is not idempotent-and-cancellable the way a token fetch is; it needs to coexist with, not replace, in-flight identical fetches from sibling mounted components).

### Admin-only create/update Dialog (pattern to copy for `ManageBoarder.vue`)

```typescript
// Source: src/components/projects/paytime/ManagePayment.vue (Read this session,
// lines 27-34, 148-199) — the exact defineModel/emit/save shape ManageBoarder.vue mirrors.
const visible = defineModel<boolean>("visible", { required: true });
const record = defineModel<PaytimeBoarder | null>("record", { default: null });
const emit = defineEmits<{ saved: [] }>();

const saveBoarder = async () => {
  const parsed = boarderSchema.safeParse({ /* form fields */ });
  if (!parsed.success) {
    fieldErrors.value = collectFieldErrors(parsed.error);
    return;
  }
  const editing = record.value;
  try {
    if (editing) {
      await pb.collection("paytime_boarders").update(editing.id, mapToUpdateBoarder(parsed.data));
    } else {
      await pb.collection("paytime_boarders").create(mapToCreateBoarder(parsed.data));
    }
    emit("saved");
    visible.value = false;
  } catch (error) {
    toast.error(`Failed to save boarder: ${describeSaveError(error)}`);
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Payment subject = `users` account directly (`user` field, PayTime v1.0) | Payment subject = `paytime_boarders` row, optionally linked to a `users` account | This milestone (v5.0), starting Phase 38 | Enables logging for boarders with no login at all — Phase 38 only builds the roster; the subject rework itself is Phase 39 |
| "Monthly Report" as a single flat admin tab | "Admin" tab with nested sub-tabs (By Boarder / Boarders, Phase 41 adds Ledger) | This phase | Sets the shell shape Phase 41 extends — do not defer the shell restructure, it's cheaper to do once now than twice later (already the locked rationale in STATE.md) |

**Deprecated/outdated:** None — this is new-collection, new-UI work; nothing existing is being deprecated by Phase 38 itself (that's Phase 39's `paytime_payments.user`→`recorded_by` rename).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SQLite's `UNIQUE` constraint treats each `NULL` as distinct, so a unique index on the nullable `user` field permits multiple unlinked boarder rows without collision | Pattern 2, "Unique index on `user`" | If wrong, creating a second unlinked boarder would fail with a unique-constraint violation — easily caught by the D-13 smoke probe (create two "No account" boarders and confirm both save); low blast radius, high visibility failure |
| A2 | `.planning/research/ARCHITECTURE.md`'s Pattern 1 rule text (`@request.auth.id != ""` / `@request.auth.is_admin = true`) has not itself been executed against the live PocketBase instance in this research session — it is the same-session prior research's recommendation, not a fresh live probe | Pattern 1 | Low — these are the simplest, lowest-risk rule shapes in the whole v5.0 rewrite (no relation traversal at all, unlike Phase 39's `boarder.user` chains); still requires the phase's own D-13 paste-back + unauthenticated-probe before being treated as confirmed |

**If this table is empty:** N/A — two narrow assumptions above, both low-risk and both closed by this phase's own required D-13 smoke probe rather than left open for the planner.

## Open Questions

1. **Display-name uniqueness on `paytime_boarders.name`**
   - What we know: CONTEXT.md explicitly lists this as "not discussed; no constraint decided."
   - What's unclear: Whether two boarders can share a display name (e.g. two "Alex"es in the house).
   - Recommendation: Ship Phase 38 with no uniqueness constraint (matches CONTEXT.md's explicit non-decision); if it becomes a real problem, add a unique index later — it's a purely additive schema change with no migration risk on a small, low-volume collection.

2. **Whether the one existing production payment needs a matching boarder row in this phase**
   - What we know: CONTEXT.md marks this as Claude's Discretion, more naturally Phase 39's backfill (SUBJ-02) per the Deferred Ideas list.
   - What's unclear: Whether seeding a boarder for Cedrick (the owner of the sole existing `paytime_payments` row) in Phase 38 saves Phase 39 a step, or is premature since nothing in Phase 38 reads `paytime_payments` at all.
   - Recommendation: Defer to Phase 39 — Phase 38's roster seeding is "however the admin adds ~6 boarders in-app," and there is no dependency forcing Cedrick's row to exist before Phase 38 closes. Seeding all real boarders (Cedrick included, with his account linked) as part of the normal seeding flow is fine either way and doesn't need special-casing.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| PocketBase server | `paytime_boarders` collection creation | Assumed reachable — prod is `https://api.delveen.cc` per orchestrator-verified ground truth | v0.29.x (established, STATE.md) | None — this phase cannot proceed without Admin UI access to create the collection |
| PocketBase Admin UI access | Manual schema/rule creation (no migration tooling exists in this repo) | Assumed available to whoever executes the D-13 checkpoints | — | None — confirmed no `pb_migrations`/schema-script mechanism exists in this repo (see below); manual Admin UI is the only path |
| npm packages (primevue, pocketbase, zod, dayjs, vue-sonner) | UI/schema code | ✓ | See Standard Stack table | — |

**Missing dependencies with no fallback:** None identified — everything this phase needs is either already installed (npm) or already reachable (the prod PocketBase instance, per orchestrator-verified ground truth).

## How the collection gets created and versioned

**Plainly: by hand, through the PocketBase Admin UI. There is no migration or schema-provisioning mechanism in this repo.** Confirmed this session via direct filesystem search: no `pb_migrations` directory, no file matching `*migration*` anywhere outside `node_modules`, no `scripts/` directory `[VERIFIED: repo-root find this session — zero matches for pb_migrations or *migration* under the tracked tree]`. This matches `.planning/research/ARCHITECTURE.md`'s own explicit caveat (this session): "the PB schema and API rules are managed entirely through the PocketBase Admin UI — there is no migration file, `pb_schema.json`, or rules file checked into this repo," and `PROJECT.md`'s documented constraint that "the prod MCP env is SchemaRead-only."

**Practical consequence for planning:** every schema/rule step in this phase's plan must be a `checkpoint:human-verify`-style task requiring the human to (1) perform the Admin UI edit, (2) **paste back the actual configured field list, rule text, and cascade/index settings as text**, and (3) the plan must include a code-side smoke probe (an authenticated `getFullList`/`create` call against the live collection) that a subsequent task runs to confirm the pasted-back configuration actually behaves as described — per this project's locked D-13 invariant ("Admin-UI checkpoints require text paste-back + downstream smoke verification. Acknowledgment alone... is insufficient," STATE.md, citing the BUG-01 precedent). Acknowledgment-only ("done", "created it") must never be accepted as satisfying a schema/rule task in this phase.

## Existing PayTime app structure (what this phase's files touch)

`[VERIFIED — every claim below via direct Read this session of the cited file]`

- **`src/components/projects/paytime/PayTimeApp.vue`** (11 lines, full file read) — the tab shell. `isAdmin` computed at line 10 (`auth.user?.is_admin === true`); `v-if="isAdmin"` gates both the `<Tab>` (line 34) and `<TabPanel>` (line 43) for what is today "Monthly Report." Phase 38 changes only the tab's **label** (D-38-06, "Monthly Report"→"Admin") — the gating pattern itself is exactly what D-38-07 says to keep.
- **`src/components/projects/paytime/MonthlyReport.vue`** (200 lines, full file read) — currently a flat component: owns its own `month` ref, `loadReport()` (`getFullList` with `requestKey: "paytime-report-list"`, line 52), and renders one `Panel` per boarder (via `expand: "user"`, line 47) with `FixedCategories` rows. Phase 38 restructures this into a shell with a nested `Tabs` (By Boarder / Boarders); the existing Panel markup (lines 108-198) becomes `MonthlyReportView.vue`'s content, extracted rather than rewritten.
- **`src/components/projects/paytime/PaymentLog.vue`** (239 lines, full file read) — the row-layout precedent D-38-17 reuses wholesale: details column (category `Tag`, date, notes) + amount/proof + inline kebab `Menu` on mobile (`sm:hidden` wrapper div, lines 151-162) vs. inline `Button`s on desktop (`hidden ... sm:flex`, lines 210-227). Also the source of the `useConfirm` delete-confirmation pattern (lines 106-117) that D-38-15 reuses for boarder deletion, and the `rowMenu`/`rowMenuPayment` shared-popup-Menu pattern (lines 63-94) for the kebab actions.
- **`src/components/projects/paytime/ManagePayment.vue`** (351 lines, full file read) — the add/edit Dialog precedent: `defineModel<boolean>("visible")` / `defineModel<T | null>("record")` pair (lines 27-29), `saved` emit (line 31), a `watch([visible, record])` seed-on-open effect (lines 78-95), Zod `safeParse` + `collectFieldErrors` (lines 155-173), and `describeSaveError()` (lines 131-146) that unwraps PocketBase's per-field validation payload. `ManageBoarder.vue` mirrors this shape exactly.
- **`src/lib/pocketbase/paytimePaymentMapper.ts`** (47 lines, full file read) — the mapper convention: `mapToCreatePayment`/`mapToUpdatePayment` build a `FormData` (needed there because of the file upload; a boarder mapper with no file field can return a plain object or `FormData` — either works since PocketBase's SDK accepts both). Documents the "never send the owner field on update" discipline that does **not** apply to `paytime_boarders` in Phase 38 (there's no ownership-reassignment risk on a boarder's own `id` the way there is on `paytime_payments.user`) — `paytimeBoarderMapper.ts` can safely include every editable field on both create and update.
- **`src/lib/paytime/categories.ts`** (15 lines, full file read) — the hardcoded-options pattern D-38-01 explicitly does not repeat for tags (`CategoryOptions` is a fixed array requiring a code change to extend; tags must not be built this way).
- **`src/lib/paytime/paymentSchema.ts`** (79 lines, full file read) — Zod convention: `z.object` with per-field `error` messages, a `collectFieldErrors` helper flattening `ZodError.issues` into a `{field: message}` map, and the `isRealCalendarDate` round-trip pattern for validation PocketBase itself can't express — directly analogous to the tag-normalization refine `boarderSchema.ts` needs.
- **`src/types/paytime/payments/types.d.ts`** (27 lines, full file read) — the type convention: `interface X extends RecordModel` plus an `AddX` type via `Omit<X, "id"|"created"|"updated"|...>`. `boarders/types.d.ts` follows this exactly.
- **`src/lib/pocketbase/index.ts`** (14 lines, full file read) — the shared `pb` PocketBase client instance every collection call goes through; nothing new needed here.
- **`src/router/index.ts`** (Read this session, lines 55-84) — `/projects/paytime` is a single route (`meta: { requiresAuth: true }`, line 74) rendering `PayTimeApp.vue`; the roster stays inside this same route as a tab, never a sub-route (matches the "Tab shell, not sub-routes" locked invariant, STATE.md — sub-routes would break bookmarks).
- **`src/stores/auth.ts`** (48 lines, full file read) — `useAuthStore()` wraps `pb.authStore.record` reactively as `user`; this is the only source `isAdmin` (and, later, `myBoarder` resolution) reads from. No changes needed here for Phase 38.

## Sources

### Primary (HIGH confidence)
- `C:/GitRepos/lex-lib.github.io/src/components/projects/paytime/PayTimeApp.vue` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/components/projects/paytime/MonthlyReport.vue` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/components/projects/paytime/PaymentLog.vue` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/components/projects/paytime/ManagePayment.vue` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/lib/pocketbase/paytimePaymentMapper.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/lib/paytime/paymentSchema.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/lib/paytime/categories.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/types/paytime/payments/types.d.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/lib/pocketbase/index.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/stores/auth.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/composables/useFileToken.ts` — full file read this session
- `C:/GitRepos/lex-lib.github.io/src/router/index.ts:55-84` — read this session
- `C:/GitRepos/lex-lib.github.io/package.json` — full file read this session (version verification)
- `C:/GitRepos/lex-lib.github.io/.planning/phases/38-boarder-roster-foundation/38-CONTEXT.md` — full file read this session
- `C:/GitRepos/lex-lib.github.io/.planning/REQUIREMENTS.md` — full file read this session
- `C:/GitRepos/lex-lib.github.io/.planning/STATE.md` — full file read this session
- `C:/GitRepos/lex-lib.github.io/.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` — full files read this session (produced in this same research session for this milestone)

### Secondary (MEDIUM confidence)
- [PocketBase docs — Collections](https://pocketbase.io/docs/collections/) — Admin UI "Unique constraints and indexes" location, via WebSearch this session
- [PocketBase JSVM reference — JSONField](https://pocketbase.io/jsvm/classes/JSONField.html) — `required`/`maxSize` semantics for json fields, via WebSearch this session
- [GitHub Discussion #543 — Unique constraint across multiple fields](https://github.com/pocketbase/pocketbase/discussions/543) — confirms single-field unique constraints are Admin-UI-native, via WebSearch this session

### Tertiary (LOW confidence)
- SQLite `UNIQUE`-treats-`NULL`-as-distinct semantics (Assumption A1) — general database-engine knowledge, not verified against this specific PocketBase/SQLite instance this session; flagged explicitly as an assumption requiring the phase's own D-13 smoke probe to confirm

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, every version confirmed by direct `package.json` read
- Architecture (collection shape, rule text, file plan): HIGH — grounded in this project's own same-session `STACK.md`/`ARCHITECTURE.md` research plus direct reads of every file the phase touches
- Pitfalls: HIGH — every pitfall traces to a documented precedent already in this exact codebase (`GiftExchangeManage.vue`, `requestKeys.spec.ts`, the `""` vs `null` rule-semantics trap)
- The two WebSearch-sourced PocketBase mechanics details (unique index UI location, json field required/maxSize semantics): MEDIUM — official-source-backed but not executed against the live instance this session; both are explicitly named in this phase's required D-13 smoke probe

**Research date:** 2026-08-04
**Valid until:** 30 days (stable domain — PocketBase Admin UI mechanics and this repo's own conventions change slowly; re-verify if the PocketBase server version changes or if Phase 39's live rule-traversal spike (VERIFY-01) surfaces any surprise that would also apply to this phase's simpler rules)
