---
phase: 02-types-mappers
plan: "05"
subsystem: pocketbase-mappers
tags: [mappers, pocketbase, types, lextrack, day-status]
dependency_graph:
  requires: [02-02]
  provides: [mapToCreateDayStatus, mapFromRecordDayStatus]
  affects: [src/lib/pocketbase/dsuDayStatusMapper.ts]
tech_stack:
  added: []
  patterns: [create-only-mapper, pass-through-spread, upsert-semantics]
key_files:
  created:
    - src/lib/pocketbase/dsuDayStatusMapper.ts
  modified: []
decisions:
  - "No mapToUpdateDayStatus: day-status semantics are set-status-for-a-date (D-11); Phase 5 decides between fetch-then-replace or delete-then-create strategies"
  - "mapFromRecordDayStatus is a pass-through spread — brand-new collection has no legacy defaults to normalize; chokepoint retained for future field additions (D-12)"
  - "Return type uses DsuDayStatus['status'] indexed access instead of importing DsuDayStatusValue separately — fewer imports, type stays coupled to the entity interface"
metrics:
  duration: "1 min"
  completed: "2026-04-28"
  tasks_completed: 2
  files_modified: 1
---

# Phase 2 Plan 5: dsuDayStatusMapper Summary

New mapper file for the `dsu_day_status` collection exposing only `mapToCreateDayStatus` and `mapFromRecordDayStatus` — intentionally omitting `mapToUpdateDayStatus` per D-11 (day-status semantics are "set status for a date" via upsert, not field-level edit).

## What Was Built

### dsuDayStatusMapper.ts

Two named exports in a new file at `src/lib/pocketbase/dsuDayStatusMapper.ts`:

- **`mapToCreateDayStatus(input: AddDsuDayStatus)`** — maps `date: string` and `status: DsuDayStatus['status']` from the `AddDsuDayStatus` create payload into the exact shape PocketBase expects for `pb.collection('dsu_day_status').create(payload)`. No defaults needed — both fields are required by PB schema and enforced as non-optional by the TypeScript type.
- **`mapFromRecordDayStatus(record: DsuDayStatus)`** — pass-through spread returning `DsuDayStatus`. No legacy defaults apply because `dsu_day_status` is a new collection (Phase 1); every existing record was written with the current schema. The spread is retained for symmetry with the other three mappers (D-12) and as the future chokepoint for read-side normalization if new fields are added.

## Intentional Absence of mapToUpdateDayStatus

Per CONTEXT.md D-11, day-status records represent a date-keyed state: "what is the status for this date?" Phase 5's UI will implement set-status as one of:

1. **Fetch-then-create-or-replace**: check if a record exists for the date; if yes, delete and re-create (or call `update` directly with an id).
2. **Delete-then-create**: blindly delete by date, then create fresh.

Neither strategy needs a mapper-layer transform of an existing record's fields — the update payload shape is identical to the create payload shape (`{ date, status }`). If Phase 5's planner finds a compelling reason for an explicit `mapToUpdateDayStatus`, D-11 can be revisited and this file extended.

## Quality Gates

- `npm run type-check` — exits 0.
- `npm run lint` (mapper file) — oxlint and ESLint both exit 0 on `dsuDayStatusMapper.ts`.
- Pre-existing oxlint failures in `site.js` and `vite.config.ts` are out of scope — same as Plan 02-04.
- Negation gate confirmed: `! grep -q "mapToUpdateDayStatus" src/lib/pocketbase/dsuDayStatusMapper.ts` — PASSES.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 1a75bd8 | feat(02-05): create dsuDayStatusMapper with mapToCreate + mapFromRecord only |

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Issues

Pre-existing oxlint failures carried from Plan 02-04 (unrelated files, out of scope):

| File | Issue | Action |
|------|-------|--------|
| `site.js` | `nextTick` imported but never used | Pre-existing; out of scope |
| `vite.config.ts` | `fs` and `path` imported but never used | Pre-existing; out of scope |

## Known Stubs

None — both functions are fully wired. `mapToCreateDayStatus` returns a real payload from real inputs; `mapFromRecordDayStatus` is intentionally a pass-through (not a stub — the design is documented).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: type-drift | src/lib/pocketbase/dsuDayStatusMapper.ts | `mapFromRecordDayStatus` passes through `status` without runtime validation against the 5-value tuple. If PB schema gains a 6th status value, it flows silently into application code. Accepted for Phase 2 per T-2-02 in plan threat model; Phase 6 will add unit test asserting the boundary. |

## Phase 5 / Phase 6 Follow-ups

- Phase 5 planner: decide between fetch-then-replace vs delete-then-create strategy for `dsu_day_status` upsert; if a distinct update payload shape is needed, extend this file with `mapToUpdateDayStatus` and revisit D-11.
- Phase 6: add unit test for `mapFromRecordDayStatus` with a valid record — confirm pass-through equality.
- Phase 6: add unit test asserting `mapToCreateDayStatus` extracts only `date` and `status` (no extra fields leak through).

## Self-Check: PASSED

Files exist:
- src/lib/pocketbase/dsuDayStatusMapper.ts — FOUND

Commits exist:
- 1a75bd8 — FOUND
