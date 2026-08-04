# Technology Stack — v5.0 Admin Payment Ledger

**Project:** Lexarium — PayTime
**Milestone:** v5.0 Admin Payment Ledger
**Researched:** 2026-08-04
**Overall confidence:** MEDIUM-HIGH on the critical relation-rule question (official docs + direct maintainer statement, not yet exercised against this project's live instance); HIGH on everything else

## Scope of This Document

This is a **subsequent-milestone stack delta**, replacing the stale v4.3 (Wallecx-scoped) version of this file. The locked Lexarium/PayTime stack — Vue 3 + Vite 8 (rolldown) + PrimeVue 4 (Aura) + Pinia + Vue Router + Tailwind v4 + PocketBase (JS SDK `^0.26.2`, server v0.29.x) + Zod 4 + dayjs + `vue-sonner` — is **not** re-justified here. This document answers exactly the four questions posed for v5.0: PocketBase relation-rule traversal, tag storage, PrimeVue components for tag UI + a filterable ledger, and PocketBase migration mechanics for retargeting a relation field with one live record.

**Bottom line: no new npm packages are needed for v5.0.** Every capability resolves inside the already-installed stack.

---

## 1. THE CRITICAL QUESTION — relation-field traversal in PocketBase API rules

**Verdict: supported, with a documented syntax, in both list/view rules and create rules. The milestone's `boarder.user`-traversal design is sound. This does NOT replace the milestone's own "prove it early" live smoke probe — see the confidence note below.**

### Documented syntax and depth limit

Official docs, *Working with relations* (`https://pocketbase.io/docs/working-with-relations/`):

> "Nested relation references in `expand`, `filter` or `sort` are supported via dot-notation and up to 6-levels depth."

This milestone needs 2 levels (`paytime_payments.boarder` → `paytime_boarders.user`) — well inside the documented limit. That quote is framed around `expand`/`filter`/`sort` generically; every rule example in *API rules and filters* (`https://pocketbase.io/docs/api-rules-and-filters/`) uses the identical dot-notation parser, so the depth ceiling applies to rules too.

### List/view rules (record already exists)

Plain dot-notation against the stored record — no `@request.body` prefix needed:

```
boarder.user = @request.auth.id
```

Mirrors the pattern already validated in `MonthlyReport.vue`'s `expand: "user"`.

### Create rules (record doesn't exist yet)

This is the part that could have invalidated the design. PocketBase's own maintainer (Gani Georgiev) directly confirmed, in GitHub Discussion #6073 ("Removing the dry submit of the Create API rule"), that a bare relation reference in a create rule is resolved against the *submitted* body:

> "There is no change in the behavior for the rule: `@request.auth.id != "" && @request.auth.id = customer.user.id`."
> "record fields like `customer.*` are still accessible and it is essentially an alias for `@request.body.customer.*`."

`customer`/`user` maps 1:1 onto this project's `boarder`/`user`. An earlier discussion (#5667) shows the identical pattern working end-to-end for an ownership-through-relation create rule:

> `"@request.auth.id != "" && @request.data.user = @request.auth.id && @request.data.category.user = @request.auth.id"`

(written in the pre-v0.23 `@request.data.*` syntax — this project already validated during v4.1 Phase 28 that the current v0.29.x form is `@request.body.*`, per the locked Key Decision "PocketBase v0.29.3 createRule uses `@request.body.user` (NOT deprecated `@request.data.user`)"; the same substitution applies here.)

**Recommendation — write create rules explicitly, matching this project's convention:**

```
@request.body.boarder.user = @request.auth.id
```

Both the bare (`boarder.user`) and explicit (`@request.body.boarder.user`) forms are confirmed equivalent by the maintainer; use the explicit form for the same reason the project already writes `@request.body.user` instead of bare `user` — it reads unambiguously as "the submitted value" six months from now.

### The v0.24 "dry submit" removal — checked, does not affect this design

PocketBase v0.24 removed a "dry submit" step (`createRule` previously ran after a temporary insert-then-rollback of the record being created). The maintainer's own scoping of the change (same discussion, #6073):

> Most validations remain unaffected. Relations to *other* collections continue working. Only `@collection.*` self-references to the same collection being created are impacted.

`paytime_payments.boarder → paytime_boarders` is a relation to a *different* collection — exactly the unaffected case, not a self-reference. This project runs PocketBase v0.29.x (post-0.24, per prior Key Decisions), so this behavior is already baked into the live server and poses no risk to the design.

### Operator choice

Both `paytime_payments.boarder` and `paytime_boarders.user` should be **single** relations (`maxSelect` ≤ 1 — "optional link to a `users` account" is a 0-or-1 relationship). Use plain `=`, not `?=`. The `?` "any/at-least-one" prefix operator only matters once a hop passes through a *multi*-valued relation/select/file field; using `=` where a field is secretly multi-valued silently becomes "all must match" instead of "any" — worth remembering if either relation is ever widened later, but not a concern for the fields as currently scoped.

### Update rule — carries forward an already-flagged concern

`PT-RULE-01` in PROJECT.md ("likely absorbed by v5.0's rule rewrite — re-check rather than doing it twice") is exactly this pattern applied to `user`. The rewritten update rule needs the same reassignment guard, now on `boarder`:

```
boarder.user = @request.auth.id && (@request.body.boarder:isset = false || @request.body.boarder = boarder)
```

`:isset` (documented in *API rules and filters*) distinguishes "the client didn't send this field" from "the client sent it back unchanged."

### Performance caveat

**Not documented.** Neither official doc mentions join cost for relation-traversal filters, and no GitHub discussion surfaced one. At this project's actual scale (6 users, a household's worth of payment rows) a 2-hop join carries no realistic performance exposure — noting the silence for completeness, not as a design constraint.

### Confidence note (read before treating this as settled)

The classify-confidence seam scores generic `webfetch`/`websearch` provenance as LOW regardless of source quality. The citations above are first-party PocketBase docs plus a direct maintainer statement on the project's own GitHub repo — about as strong as external verification gets short of Context7-indexed docs or running it locally. **This has not been exercised against this project's live v0.29.x PocketBase instance.** The milestone's own risk note ("Believed supported in v0.29.x but not yet tested on this instance... prove it early") stands exactly as written — this research raises confidence from "believed" to "documented and maintainer-confirmed," it does not substitute for the live smoke probe (create one `paytime_boarders` row, one linked `paytime_payments` row, and exercise a create/list/update against the real rules before the roadmap locks phase shape on this assumption).

---

## Recommended Stack (deltas only)

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| PocketBase (server) | v0.29.x (existing, unchanged) | Relation-rule access control for the boarder→user ownership chain | Confirmed dot-notation relation traversal in both list/view and create rules — see section 1. No server upgrade needed. |
| PocketBase JS SDK | `^0.26.2` (existing, `package.json`) | Client `expand` queries mirroring rule traversal | SDK's `expand` option already accepts multi-level dot-notation strings (`expand: "boarder.user"`); same mechanism as the currently-shipped `expand: "user"` in `MonthlyReport.vue`, one level deeper |

No new core technology. This milestone is schema + UI work on the existing stack.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | — | **None.** Tags, the admin boarder selector, and the filterable ledger are fully covered by a PocketBase field-type choice (section 2) and already-installed PrimeVue components (section 3) |

### Development Tools

No new dev tooling. The existing Vitest + Zod + TypeScript setup covers testing the new mapper (`boarderMapper.ts`-style) and rewritten-rule expectations the same way `paymentSchema.spec.ts` already does.

## Installation

```bash
# Nothing to install for v5.0 — confirm no drift before planning:
npm ls primevue pocketbase zod dayjs
```

---

## 2. Multi-value tags: `select` vs `json` array vs a separate tags collection

**Recommendation: PocketBase `select` field, `maxSelect > 1`, fixed vocabulary maintained by the admin in the PB Admin UI schema editor — exactly what the milestone context already assumes ("admin edits the schema to add a tag").**

| Option | Server-side filter on "has tag X"? | Filter syntax | Verdict |
|--------|-------------------------------------|-----------------|---------|
| **`select`, `maxSelect > 1`** | **Yes** — documented array-field operators apply | `tags ?= "vegetarian"` (any-of-equal); `tags:length > 0`; `tags:each ...` | **Recommended** |
| `json` array | **No** dedicated array operator; only a loose substring `~` match against the serialized JSON text | `tags ~ '"vegetarian"'` | Reject |
| Separate `paytime_tags` collection + multi-relation | Yes — relation fields support the same `?=`/`:each`/`:length` operators as `select` | `tags.name ?= "vegetarian"` | Overkill for this milestone's scale |

**Why `select` over `json`:** the *API rules and filters* docs scope the `?` any-of prefix and the `:each`/`:length` modifiers to "multiple `select`, `file` and `relation` type fields" — JSON arrays are not in that list. The only documented JSON-array workaround is a loose `~` substring match against the serialized text (e.g. `tags ~ '"vip"'`), which has no type safety, no PB Admin UI dropdown validating legal values, and a real false-positive risk (a tag literally named `"vi"` would substring-match inside `"vip"` depending on quoting). A typo in a JSON array silently becomes an unfilterable, un-validated new "tag."

**Why `select` over a separate tags collection:** a relation-based tags collection filters identically (`tags.name ?= "..."`) and is the right call for a large or frequently-renamed vocabulary, or one that needs per-tag metadata (color, description, audit trail). This is a boarding house with a small, admin-controlled, rarely-changing tag set — precisely the case the milestone context already frames as "admin edits the schema." A `select` field gets the same filterability with zero extra collection, zero extra join hop, and zero extra CRUD screen to build.

## 3. PrimeVue 4 components for tag input/display and the filterable ledger

All of the following are **already installed** (`primevue@^4.5.5`) and auto-resolve via `unplugin-vue-components`'s `PrimeVueResolver`, exactly like every PrimeVue component PayTime already uses (`Select`, `Panel`, `Dialog`, `Tabs`, …) — no new import wiring, with one caveat below.

| Component | Use it for | Why |
|-----------|-------------|-----|
| **`MultiSelect`** | Admin assigning tags to a boarder in the roster editor; the tag filter in the ledger's column-filter UI | Closed-set picker whose emitted value (array of strings) matches the `select` field's stored shape directly — no mapping layer |
| **`Tag`** | Read-only tag pill display (boarder roster row, ledger row) | Purpose-built small colored-label component; loop one `<Tag>` per string |
| **`DataTable` + `Column`** | The admin ledger view — filter by month/tag/boarder/category | Built-in `filterDisplay="menu"`/`"row"` with a per-column `filterElement` slot — drop `MultiSelect` in as the filter UI for tags/boarder/category columns; also supports `groupRowsBy` if grouping by boarder or tag ends up reading better than a flat filtered list |
| **`Select`** | Month picker in the ledger filter bar | Same single-choice pattern already used elsewhere in PayTime |

**Do NOT use `Chips`/`InputChips` or `AutoComplete` (multiple mode) for tag *input*.** Both are built for **freeform, user-typed** tag creation. PrimeVue's own issue tracker documents `InputChips` as deprecated in favor of `AutoComplete`'s `multiple` mode — but neither fits a **closed fixed vocabulary**: a typo'd freeform entry isn't in the `select` field's option list, so PocketBase rejects the write (400) rather than silently accepting a new tag. `MultiSelect` is correct here precisely because it can only emit values already in the option list.

**Do NOT use `DataView` for the ledger.** It's a plain list/grid renderer with no built-in filter-menu machinery — using it would mean hand-building the exact filter UI `DataTable` already ships, for a feature whose entire point is filtering.

**Auto-import caveat (same rule as `useConfirm`):** the components above are Vue *components* and auto-resolve fine. If either new view needs a PrimeVue *composable* (`useConfirm`, `useToast`, `useDialog`), that still needs an explicit `import { useX } from 'primevue/usex'` — `unplugin-vue-components` only resolves components, never composables. None of the four v5.0 target features appear to need a composable beyond what PayTime already imports.

## 4. PocketBase migration mechanics — retargeting a required relation field with 1 existing record

A relation field just stores raw record-ID strings from whichever collection it currently points at. The Admin UI *does* let you change a relation field's target collection via its "Collection" dropdown, but it **performs no automatic ID remapping**. Flipping `paytime_payments.user` (→ `users`) to point at `paytime_boarders` in place would leave the 1 existing row holding a `users` record ID that doesn't exist in `paytime_boarders` — a silently dangling reference that only surfaces later, when a rule or `expand` traversal quietly matches nothing.

**Recommended sequence — additive, not an in-place retarget — consistent with this project's D-13 invariant (Admin-UI checkpoints require paste-back + a code-side smoke verify, not acknowledgment alone):**

1. Create `paytime_boarders`; create one boarder row for Cedrick, linking its `user` relation to his existing `users` id.
2. Add a **new** `boarder` relation field (→ `paytime_boarders`, single, **not required yet**) onto `paytime_payments`, alongside the still-present `user` field.
3. Backfill the 1 existing payment row: set `boarder` to Cedrick's new boarder-row id via the Admin UI.
4. Flip `boarder` to required; rewrite all 5 API rules to route ownership through `boarder.user` (section 1); run a code-side smoke probe — a one-off `getFullList` against `paytime_payments` with `expand: "boarder.user"` on the live instance, confirming the join resolves and the returned owner matches expectations — the exact paste-back-and-verify pattern already locked in for this project.
5. Only once the smoke probe passes, delete the now-unused `user` relation field.

This stays a manual Admin UI sequence, not a scripted PocketBase JS/Go migration file — matching how this project already treats schema changes ("Schema changes go through the PB Admin UI — the prod MCP env is SchemaRead-only," per PROJECT.md). General PocketBase migration mechanics (flip `Required: true` on a field, save the collection) are well documented and unremarkable; the risk worth flagging is specific to this project — retargeting a relation field in place on a field with a live, non-null value is the one move to avoid.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| PocketBase `select` field for tags | `json` array field | Never for filterable tags — no native array-contains operator. Only defensible if tags become display-only and are never filtered. |
| PocketBase `select` field for tags | Separate `paytime_tags` collection + relation | If the vocabulary grows large, needs per-tag metadata (color/description), or changes often enough that editing the `select` field's option list becomes a bottleneck |
| `MultiSelect` for tag assignment | `AutoComplete` (multiple mode) | Only if the vocabulary needs to grow dynamically from user input rather than stay admin-curated |
| `DataTable` for the ledger | `DataView` | Only if filtering/sorting is dropped entirely in favor of a pure display list |
| Additive field + backfill + drop-old-field | In-place relation field retargeting | Never on a required field holding live data — safe only on a field that's still empty/unused |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `json` field for tags | No documented `?=`/`:each`/`:length` array-filter support; only lossy `~` substring matching | `select` field, `maxSelect > 1` |
| `Chips` / `InputChips` component | Deprecated by PrimeVue in favor of `AutoComplete`; also the wrong UX for a closed vocabulary (freeform typing vs. picking from a fixed list) | `MultiSelect` |
| `AutoComplete` (multiple) for tag *assignment* | Built for freeform/dynamic suggestions, not a closed fixed vocabulary — a typo attempts a write PocketBase rejects | `MultiSelect` |
| `DataView` for the ledger | No built-in filter-menu/`filterElement` machinery — rebuilds what `DataTable` already provides | `DataTable` + `Column` |
| In-place relation-field retargeting on a field with existing data | No automatic ID remapping; produces a silently dangling reference | Additive new field + manual backfill + drop old field (section 4) |
| Any new tag-input npm package (`vue-tags-input`, `vue3-tags-input`, etc.) | `MultiSelect` (already installed) fully covers a closed-vocabulary tag picker | `MultiSelect` |
| A scripted PocketBase JS/Go migration file for this schema change | Prod MCP env is SchemaRead-only; the project's own D-13 invariant requires manual Admin UI + paste-back + code-side smoke verify, not trust in a migration script's reported success | Manual Admin UI sequence (section 4) |

## Stack Patterns by Variant

**If the tag vocabulary later needs per-tag color or a description:**
- Migrate from `select` to the separate-collection + relation approach.
- Because a `select` field's options are bare strings — no room for attached metadata — while a relation lets each tag carry its own fields with the filter syntax barely changing (`?=` still works, just against `.name` instead of the bare field).

**Boarders with no linked `user` at all (this is the milestone's premise, not an edge case):**
- `boarder.user = @request.auth.id` naturally evaluates to no-match when `boarder.user` is empty — no special-casing required. PocketBase treats an empty relation traversal as simply not matching.
- Because the rule only needs to grant *self-service* access when a link exists; boarders without an account remain fully manageable through the separate `@request.auth.is_admin = true` bypass clause already established in `MonthlyReport.vue`'s rules.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `pocketbase@^0.26.2` (JS SDK) | PocketBase server v0.29.x | `expand` accepts the same multi-level dot-notation as server-side rules/filters; already exercised by `MonthlyReport.vue`'s `expand: "user"` — extending to `expand: "boarder.user"` is the identical mechanism one hop deeper |
| `primevue@^4.5.5` | `unplugin-vue-components@^29.0.0` + `@primevue/auto-import-resolver@^4.5.5` | `MultiSelect`, `Tag`, `DataTable`, `Column` all auto-resolve; only composables need explicit imports (existing project convention, same rule as `useConfirm`) |

## Sources

- [Working with relations — PocketBase Docs](https://pocketbase.io/docs/working-with-relations/) — dot-notation relation traversal, documented 6-level depth limit
- [API rules and filters — PocketBase Docs](https://pocketbase.io/docs/api-rules-and-filters/) — `@request.body.*`, `@collection.*`, operator list, `:isset`/`:each`/`:length` modifiers
- [Removing the dry submit of the Create API rule — Discussion #6073](https://github.com/pocketbase/pocketbase/discussions/6073) — maintainer (Gani Georgiev) confirmation that bare relation dot-notation in `createRule` is an alias for `@request.body.<relation>.*`, and that the v0.24 dry-submit removal only affects self-references
- [API Rules - Protect creating record with relations — Discussion #5667](https://github.com/pocketbase/pocketbase/discussions/5667) — worked create-rule example chaining ownership through one relation
- [How to filter based on relations field — Discussion #7013](https://github.com/pocketbase/pocketbase/discussions/7013) — `?=` any-of operator semantics for relation/array fields
- PrimeVue issue tracker (`InputChips` deprecation notice, `AutoComplete` multiple-mode status) — WebSearch, cross-referenced against multiple open issues in `primefaces/primevue`
- `C:/GitRepos/lex-lib.github.io/package.json` — confirms every version cited above is what's actually installed; confirms nothing new is required
- `C:/GitRepos/lex-lib.github.io/.planning/PROJECT.md` — v5.0 milestone context, existing validated decisions (`@request.body.user` convention, D-13 invariant, `paytime_*` collection prefix, `users.is_admin` bypass pattern, PT-RULE-01 open concern)

## Confidence Assessment

| Claim | Confidence | Source(s) |
|-------|------------|-----------|
| PocketBase supports dot-notation relation traversal up to 6 levels in filters | HIGH (official docs, direct quote) | pocketbase.io/docs/working-with-relations |
| List/view rules can traverse `boarder.user` against the stored record | HIGH (official docs pattern, matches existing project usage) | pocketbase.io/docs/api-rules-and-filters + this project's own `expand: "user"` precedent |
| Create rules can traverse `@request.body.boarder.user` against the submitted body | MEDIUM-HIGH (maintainer's direct statement + a worked community example; not yet run against this project's live instance) | GitHub Discussions #6073, #5667 |
| The v0.24 dry-submit removal does not affect this project's (non-self-referencing) relation chain | HIGH (maintainer's explicit scoping of the change) | GitHub Discussion #6073 |
| `select` fields support `?=`/`:each`/`:length` array filtering; `json` fields do not | HIGH (official docs enumerate field types those modifiers apply to) | pocketbase.io/docs/api-rules-and-filters |
| `InputChips`/`Chips` is deprecated in favor of `AutoComplete` multiple mode | HIGH (PrimeVue's own issue tracker states this directly) | primefaces/primevue GitHub issues |
| `DataTable` column `filterElement` accepts arbitrary components (e.g. `MultiSelect`) for custom filter UI | HIGH (standard, long-documented PrimeVue pattern) | PrimeVue DataTable filtering docs |
| Retargeting a relation field's collection in the Admin UI does not remap existing stored IDs | HIGH (follows directly from how relation fields are documented to store raw IDs; no migration/remap feature is documented anywhere) | Inference from pocketbase.io/docs/working-with-relations + absence of any documented remap feature |
| No performance caveat is documented for relation-traversal joins in rules | Explicitly a gap, not a finding | Absence across both official docs and all GitHub discussions searched |

---

*Stack delta researched 2026-08-04 for v5.0 Admin Payment Ledger. Locked stack (Vue 3 + Vite 8 + PrimeVue 4 + Pinia + Tailwind v4 + PocketBase v0.29.x server / SDK `^0.26.2` + Zod 4 + dayjs + `vue-sonner`) is unchanged. This document supersedes the prior (v4.3, Wallecx-scoped) contents of this file.*
