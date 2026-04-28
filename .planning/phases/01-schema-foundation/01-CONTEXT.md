# Phase 1: Schema Foundation - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply additive PocketBase schema changes (add `dsu_meetings.duration_unit`, add `dsu_supports.link`, create `dsu_day_status` collection with `date` unique index) and ship a step-by-step migration document at `.planning/pocketbase-schema.md`. Existing data must continue to render. No destructive migrations. No frontend changes in this phase.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy

- **D-01:** Schema is applied **manually via the PocketBase admin UI** by the user. No `pb_migrations/` JSON files in this repo.
- **D-02:** `.planning/pocketbase-schema.md` contains **step-by-step admin UI instructions** — numbered click-throughs with exact field names, types, options, and validation rules — written so the user can follow them without thinking.
- **D-03:** Each change in the doc has a **brief rollback note** ("To undo: delete this field" / "To undo: drop this collection"). Additive-only changes mean rollback is mostly trivial, but the note is mandatory for every change.
- **D-04:** Phase 1 ships a **smoke-test script** at `.planning/phases/01-schema-foundation/verify-schema.ts` (or equivalent runnable file) that hits the configured `VITE_API_BASE_URL` and confirms each new field/collection exists. This script is the gate before Phase 2 starts.

### Access Rules

- **D-05:** Existing `dsu_meetings`, `dsu_tasks`, `dsu_supports` collections currently use the **auth-only rule** `@request.auth.id != ""` (any logged-in user). LexTrack is single-user by design (PROJECT.md out-of-scope: multi-user collaboration).
- **D-06:** The new `dsu_day_status` collection adopts the **same auth-only rules** for `listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule`. Consistency over future-proofing.
- **D-07:** No `owner` / `user` reference field on `dsu_day_status`. PROJECT.md locks single-user as out-of-scope; don't add fields we won't enforce.
- **D-08:** **Single unique DB index on `dsu_day_status.date`** (PocketBase collection-level index). One status per date — updates replace the prior status. Frontend code can rely on this constraint (no need to dedupe client-side).

### Claude's Discretion

The user did not explicitly discuss these — Claude has flexibility within the boundaries below. Downstream agents should follow these defaults unless they conflict with other constraints.

- **D-09 (Backfill behavior, dsu_meetings.duration_unit):** Add as an **optional select field** with values `minutes` / `hours` and **no default value backfilled**. Existing records will have `duration_unit` undefined; the Phase 2 mapper / Phase 3 UI will treat `undefined` as `'minutes'` (the legacy default). Rationale: avoids forcing PB to write to every existing row; legacy data still renders correctly.
- **D-10 (Field type, dsu_meetings.duration_unit):** PocketBase **select field** (constrained values: `minutes`, `hours`). Prevents typos, plays well with TypeScript literal-union types.
- **D-11 (Field type, dsu_day_status.status):** PocketBase **select field** (constrained values: `sl`, `vl`, `holiday`). Same rationale as D-10.
- **D-12 (Field type, dsu_supports.link):** PocketBase **URL field** type (built-in URL validation). Marked optional. Empty string and `null` both treated as "no link" by the frontend.
- **D-13 (Field type, dsu_day_status.date):** PocketBase **plain text** field formatted as `YYYY-MM-DD`, matching how the existing `dsu_*` collections store the date column. Avoids timezone surprises that PB's `date` type can introduce.
- **D-14 (Schema file location):** Migration doc at `.planning/pocketbase-schema.md` (not under the phase directory) — it's a project-level reference that downstream phases also consult.

### Folded Todos

None — no project-level todos cross-referenced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Constraints (additive schema only, backwards compat, single-user)
- `.planning/REQUIREMENTS.md` §Schema — SCHEMA-01/02/03/04 acceptance text
- `.planning/ROADMAP.md` §Phase 1 — Goal and success criteria

### Codebase context
- `.planning/codebase/STACK.md` — PocketBase 0.26.2 client version (sets the admin-UI version this doc must match)
- `.planning/codebase/INTEGRATIONS.md` — PocketBase integration details, env-var conventions
- `src/lib/pocketbase/index.ts` — Single shared `pb` client instance; `VITE_API_BASE_URL` is the PB host
- `src/types/lextrack/dsu_meetings/types.d.ts` — Current `DsuMeetings` shape (Phase 2 reference; not edited in Phase 1)
- `src/types/lextrack/dsu_supports/types.d.ts` — Current `DsuSupports` shape (Phase 2 reference; not edited in Phase 1)

### External docs (for the planner / researcher)
- PocketBase admin docs (current version) — Collection rules syntax, field types, indexes. Researcher should fetch the version-matched docs (PocketBase JS SDK 0.26.x → PB server 0.22+).

### To be created in this phase
- `.planning/pocketbase-schema.md` — Migration document (output of this phase)
- `.planning/phases/01-schema-foundation/verify-schema.ts` — Smoke-test script (output of this phase)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`pb` client** (`src/lib/pocketbase/index.ts`) — already-configured PocketBase client; the verify-schema script can import it directly via the `@/` alias if it runs through Vite, or instantiate its own from `VITE_API_BASE_URL` if it runs as a plain Node script.
- **Auth store** (`src/stores/auth.ts`) — exposes `pb.collection('users').authWithPassword(...)`. The verify script needs an authenticated session to read from rule-protected collections; can reuse the store or auth directly with `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` from `env.d.ts`.

### Established Patterns
- **No PB migrations folder** in this repo. Schema lives on the remote PB server; this repo holds only client + types.
- **Date format convention** — All existing `dsu_*` collections store `date` as a `YYYY-MM-DD` text string (`src/views/LexTrackView.vue:102` filters with `dayjs(...).format('YYYY-MM-DD')`). New `dsu_day_status.date` follows the same convention (D-13).
- **Mapper pattern** — Each PB collection has a `dsu*Mapper.ts` for converting types to update payloads (`src/lib/pocketbase/dsu*Mapper.ts`). Phase 2 will extend this; Phase 1 leaves it untouched.

### Integration Points
- **Verify script invocation** — Add an npm script (e.g. `verify:schema`) so the user can run it from the project root. Use `tsx` or rely on a Vitest-style runner if available; choose whatever requires zero new dependencies.
- **Schema doc consumers** — The user (running through it manually), and the verify script (which encodes the same expectations programmatically).

</code_context>

<specifics>
## Specific Ideas

- The user's `quarter-3-logs.txt` shows `SL` / `VL` as whole-day entries — those map directly to `dsu_day_status.status` enum values. The third value is `holiday` (no other variants for v1 per PROJECT.md out-of-scope: half-day / partial-day).
- The migration doc should be **idempotent-safe to read** — if the user has already applied a step, re-reading the doc shouldn't suggest doing it again destructively. Each step starts with "Verify [field/collection] does not exist; if it does, skip."

</specifics>

<deferred>
## Deferred Ideas

- **Migration tooling** — moving to `pb_migrations/` JSON-based migrations is rejected for v1 (D-01) but tracked here for if PB schema changes accelerate post-v1.
- **Owner-scoped access** — rejected for v1 (D-07); revisit if multi-user ever moves out of PROJECT.md "Out of Scope".
- **Backfill default for legacy `dsu_meetings`** — chose D-09 (no backfill, frontend treats undefined as minutes). If this proves brittle in Phase 3, the alternative (PB-side backfill) is documented here.

### Reviewed Todos (not folded)
None.

</deferred>

---

*Phase: 01-schema-foundation*
*Context gathered: 2026-04-28*
