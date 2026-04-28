# Phase 2: Types & Mappers - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring TypeScript interfaces in `src/types/lextrack/<entity>/` and PocketBase mapper functions in `src/lib/pocketbase/dsu*Mapper.ts` into alignment with the live Phase 1 schema. Establishes the typed contract every later phase builds against. No UI changes, no feature work — just types, constants, and mappers.

</domain>

<decisions>
## Implementation Decisions

### Status Enum

- **D-01:** `DsuDayStatus.status` type is the **5-value union**: `'sl' | 'vl' | 'holiday' | 'bl' | 'others'` — matching the live schema (CONTEXT.md Phase 1 D-11 set 3 values; user added 2 more in the admin UI).
- **D-02:** Value meanings (these inform Phase 5 UI labels):
  - `sl` = Sick Leave
  - `vl` = Vacation Leave
  - `holiday` = Holiday
  - `bl` = **Birthday Leave** (PH company perk; 1-day off in birth month)
  - `others` = generic catch-all (training, conferences, company events, anything not in the four above)
- **D-03:** PROJECT.md and REQUIREMENTS.md will be amended by the planner/executor to reflect the 5-value enum; this supersedes Phase 1 D-11 narrowness.

### Enum Constants & File Layout

- **D-04:** Each entity gets **two files** under `src/types/lextrack/<entity>/`:
  - `types.ts` — TypeScript types/interfaces (renamed from existing `types.d.ts`; ambient declarations move to plain `.ts` so the file can be used for both types and re-exports)
  - `constants.ts` — runtime values, `as const` arrays, label maps
- **D-05:** Existing `types.d.ts` files (meetings, supports, tasks) are **renamed to `types.ts`**; same content (no breaking changes to imports — TS resolves both). Constants files are added for `dsu_meetings` (duration_unit values + labels) and `dsu_day_status` (status values + labels). Tasks and supports get a `constants.ts` only if there's something to put there (currently nothing — a placeholder file is **not** created).
- **D-06:** Constant naming convention: `DSU_<ENTITY>_<FIELD>_VALUES` (e.g. `DSU_DAY_STATUS_VALUES`, `DSU_MEETING_DURATION_UNIT_VALUES`) and `DSU_<ENTITY>_<FIELD>_LABELS` for the human-readable map.
- **D-07:** Type derivation: literal-union types (`DsuDayStatusValue`) are derived from the `as const` array via `(typeof DSU_DAY_STATUS_VALUES)[number]` so the values + type stay in sync.
- **D-08:** Label maps are full coverage — every value in the constant array has a label entry (TS can enforce via `Record<DsuDayStatusValue, string>`).

### Mapper Coverage

- **D-09:** Every entity exposes the **full mapper triple**:
  - `mapToCreate*(input: AddDsu*) → CreatePayload` — used when saving a new record
  - `mapToUpdate*(record: Dsu*) → UpdatePayload` — already exists; preserved
  - `mapFromRecord*(record: PB record) → Dsu*` — normalizes raw PB output (e.g. fills `duration_unit ?? 'minutes'` for legacy rows)
- **D-10:** Legacy-default normalization lives in the **mapper layer** (`mapFromRecord*`). View code receives normalized data; never sees `undefined` for fields with implicit defaults like `duration_unit`.
- **D-11:** `dsu_day_status` mapper exposes only `mapToCreate` + `mapFromRecord` (no `mapToUpdate`) — semantics are "set status for a date" (upsert via fetch-then-create-or-create-replacing-by-unique-index), never "edit existing fields". If Phase 5 finds it needs an update path, this can be revisited.
- **D-12:** **Phase 2 normalizes all three existing mappers** (`dsuMeetingMapper`, `dsuTaskMapper`, `dsuSupportMapper`) to the new triple-export shape, even where there's no schema change. Symmetry across the codebase before Phase 3 starts touching components.

### `duration_unit` Typing

- **D-13:** `DsuMeetings.duration_unit: 'minutes' | 'hours'` (**required** in the read-shape; `mapFromRecord` fills `'minutes'` for legacy rows that lack the field).
- **D-14:** `AddDsuMeeting.duration_unit?: 'minutes' | 'hours'` (**optional** on create payload; the create mapper defaults to `'minutes'` if omitted, matching legacy semantics).
- **D-15:** Net effect: components reading meetings always see a non-null `duration_unit`; the create form may omit it without breaking the type contract.

### Import Path & Add-Type Pattern

- **D-16:** All `RecordModel` imports normalize to `import type { RecordModel } from 'pocketbase'` (the public package entry, matching `dsu_tasks` and the PB docs). The two files currently importing from `pocketbase/dist/pocketbase.es` are corrected.
- **D-17:** `AddDsu*` types **keep the current `Omit` pattern**: `AddDsuMeeting = Omit<DsuMeetings, 'id' | 'created' | 'updated'>`. No refactor to `Pick`-based explicit definitions — minimizes diff in `LexTrackView.vue`.

### Claude's Discretion

The user explicitly discussed all four major areas. Anything not specified is left to Claude's judgement within these limits:
- **D-18 (file naming):** New collection's directory uses `dsu_day_status/` (matches existing `dsu_meetings`, `dsu_tasks`, `dsu_supports` snake_case convention).
- **D-19 (export style):** `export type ...` for types, `export const ...` for runtime values; no default exports (matches existing files).
- **D-20 (no barrel file):** Don't add `src/types/lextrack/index.ts`. Existing imports use the per-entity path (`@/types/lextrack/dsu_meetings/types`); adding a barrel introduces import churn that doesn't pay off. Revisit if Phase 5+ shows lots of multi-entity imports.

### Folded Todos

None — no project-level todos cross-referenced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Constraints (additive only, single-user)
- `.planning/REQUIREMENTS.md` §Types & Mappers — TYPES-01/02/03/04 acceptance text
- `.planning/ROADMAP.md` §Phase 2 — Goal and success criteria

### Phase 1 (locked)
- `.planning/phases/01-schema-foundation/01-CONTEXT.md` — Schema decisions D-01–D-14
- `.planning/phases/01-schema-foundation/01-03-SUMMARY.md` — **Live status-values deviation (5 values vs 3); read this for the canonical list of live PB shapes**
- `.planning/phases/01-schema-foundation/01-VERIFICATION.md` — Live PB schema confirmed via smoke-test
- `.planning/pocketbase-schema.md` — Field types, names, optionality (the source of truth for PB shape)

### Codebase context
- `.planning/codebase/CONVENTIONS.md` — Existing TS patterns (defineModel, defineProps, no default exports)
- `.planning/codebase/STRUCTURE.md` — Directory layout (`src/types/lextrack/<entity>/`, `src/lib/pocketbase/`)
- `src/types/lextrack/dsu_meetings/types.d.ts` — Existing shape (must extend, not replace)
- `src/types/lextrack/dsu_supports/types.d.ts` — Existing shape
- `src/types/lextrack/dsu_tasks/types.d.ts` — Existing shape (no schema change but mapper gets normalized)
- `src/lib/pocketbase/dsuMeetingMapper.ts` — Existing mapper (single function; gets expanded)
- `src/lib/pocketbase/dsuSupportMapper.ts` — Existing mapper
- `src/lib/pocketbase/dsuTaskMapper.ts` — Existing mapper
- `src/lib/pocketbase/index.ts` — Shared `pb` client; not modified in Phase 2
- `src/views/LexTrackView.vue` — Consumer of types/mappers; not modified in Phase 2 but planner should be aware of import surface

### External docs
- PocketBase JS SDK docs — `RecordModel` type, collection method signatures (researcher fetches latest if needed)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Existing `mapToUpdate*` functions** — keep their signature; new exports added alongside them.
- **`Omit<Entity, 'id' | 'created' | 'updated'>` pattern** for `AddDsu*` — already in use; preserved.
- **`@/` path alias** — types and mappers use `@/types/lextrack/...` and `@/lib/pocketbase/...`; new files follow the same pattern.

### Established Patterns
- **One file per entity for types** (`<entity>/types.d.ts` → `<entity>/types.ts`). Constants get a sibling file (`<entity>/constants.ts`) only when there's something to put there.
- **No default exports** anywhere in `src/types/` or `src/lib/`.
- **`as const` arrays** are not yet used in the project; Phase 2 introduces the convention via `DSU_*_VALUES`.

### Integration Points
- `src/views/LexTrackView.vue` imports `AddDsu*` types directly — these don't change in shape, only the `duration_unit` literal type is added (where applicable).
- `LexTrackView.vue:125-158 save()` currently passes `AddDsu*` straight to `pb.collection().create()`. Phase 3 will switch this to use `mapToCreate*`. Phase 2 only ensures the function exists.
- Phase 5 (Day Status UI) will import `DSU_DAY_STATUS_VALUES` and `DSU_DAY_STATUS_LABELS` directly for the dropdown.
- Phase 3 (Meeting & Admin UI) will import `DSU_MEETING_DURATION_UNIT_VALUES` and labels for the unit toggle.

</code_context>

<specifics>
## Specific Ideas

- The `as const` + `(typeof X)[number]` pattern for deriving union types is a TS idiom worth committing to project-wide — Phase 2 introduces it, future phases can extend it (e.g. Phase 5 if any new enum-shaped fields appear).
- Label maps should be plain English strings, not i18n keys. PROJECT.md doesn't list internationalization as a requirement.
- The `bl = Birthday Leave` semantic comes from PH company HR norms — flag this in the label so the UI is unambiguous.

</specifics>

<deferred>
## Deferred Ideas

- **Barrel file at `src/types/lextrack/index.ts`** — rejected for v1 (D-20). Revisit if multi-entity imports become common.
- **Stricter `Pick`-based add types** — rejected for v1 (D-17). Revisit if `Omit` causes type-inference issues.
- **i18n / locale-aware labels** — out of scope per PROJECT.md (no i18n requirement).
- **Zod-based runtime validators derived from the `as const` arrays** — possible follow-up if Phase 5 forms need richer validation. Not needed for v1.
- **Generated PocketBase types via `pocketbase-typegen`** — could replace hand-maintained types entirely. Bigger lift; revisit when schema changes accelerate.

### Reviewed Todos (not folded)
None.

</deferred>

---

*Phase: 02-types-mappers*
*Context gathered: 2026-04-28*
