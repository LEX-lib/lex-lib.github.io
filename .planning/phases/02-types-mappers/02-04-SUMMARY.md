---
phase: 02-types-mappers
plan: "04"
subsystem: pocketbase-mappers
tags: [mappers, pocketbase, types, lextrack]
dependency_graph:
  requires: [02-01, 02-03]
  provides: [mapToCreateMeeting, mapToUpdateMeeting, mapFromRecordMeeting, mapToCreateSupport, mapToUpdateSupport, mapFromRecordSupport, mapToCreateTask, mapToUpdateTask, mapFromRecordTask]
  affects: [src/lib/pocketbase/dsuMeetingMapper.ts, src/lib/pocketbase/dsuSupportMapper.ts, src/lib/pocketbase/dsuTaskMapper.ts]
tech_stack:
  added: []
  patterns: [mapper-triple, legacy-default-normalization]
key_files:
  created: []
  modified:
    - src/lib/pocketbase/dsuMeetingMapper.ts
    - src/lib/pocketbase/dsuSupportMapper.ts
    - src/lib/pocketbase/dsuTaskMapper.ts
decisions:
  - "mapFromRecordMeeting is the single legacy-default chokepoint for duration_unit ?? 'minutes' (D-10)"
  - "mapToCreateMeeting also defaults duration_unit to 'minutes' so new rows are pre-normalized (D-14/D-15)"
  - "mapFromRecordSupport and mapFromRecordTask are pass-through spreads added for symmetry (D-12); future schema changes extend here"
  - "Pre-existing oxlint failures in site.js and vite.config.ts are out of scope (unrelated files); deferred"
metrics:
  duration: "2 min"
  completed: "2026-04-28"
  tasks_completed: 4
  files_modified: 3
---

# Phase 2 Plan 4: Mapper Triple Expansion Summary

All three PocketBase mapper files now expose the full `mapToCreate*` / `mapToUpdate*` / `mapFromRecord*` triple. Phase 3 can call `mapToCreate*` directly from `LexTrackView.vue:save()` without any further mapper-layer work.

## What Was Built

### dsuMeetingMapper.ts

Three named exports replacing the previous single-export file:

- **`mapToCreateMeeting(input: AddDsuMeeting)`** — maps create payload; defaults `duration_unit` to `'minutes'` when omitted (D-14/D-15). New rows written via this function will always have `duration_unit` populated, removing reliance on `mapFromRecord*` for future reads.
- **`mapToUpdateMeeting(meeting: DsuMeetings)`** — existing function extended to include `duration_unit` in the returned shape. Signature remains compatible with `LexTrackView.vue:141` call site.
- **`mapFromRecordMeeting(record: DsuMeetings)`** — normalizer that spreads the record and backfills `duration_unit ?? 'minutes'` for legacy rows pre-dating Phase 1's schema migration (D-10). This is the single chokepoint for the legacy default.

### dsuSupportMapper.ts

Three named exports replacing the previous single-export file:

- **`mapToCreateSupport(input: AddDsuSupport)`** — carries `link?: string` from create payload to PB.
- **`mapToUpdateSupport(support: DsuSupports)`** — extended to include `link` in the returned shape. `LexTrackView.vue:130` call site remains compatible.
- **`mapFromRecordSupport(record: DsuSupports)`** — pass-through spread; no legacy defaults needed for `link` (empty = "no link" by convention).

### dsuTaskMapper.ts

Three named exports replacing the previous single-export file:

- **`mapToCreateTask(input: AddDsuTask)`** — maps `date`, `title`, `jira_link?`, `description?` to PB create payload.
- **`mapToUpdateTask(task: DsuTasks)`** — signature identical to the previous function (no change to `LexTrackView.vue:152` call site).
- **`mapFromRecordTask(record: DsuTasks)`** — pass-through spread for symmetry; no schema changes for tasks.
- **Stale comment removed** — `//import type { DsuSupports } from '@/types/lextrack/dsu_supports/types';` dead artifact deleted.

## Legacy Default Behavior

`mapFromRecordMeeting` applies `duration_unit ?? 'minutes'` at the read path. `mapToCreateMeeting` applies the same default at the write path. Together these ensure:
1. Existing rows lacking `duration_unit` read back with the expected default.
2. New rows written through `mapToCreateMeeting` are immediately normalized.
3. The `DsuMeetings.duration_unit: DurationUnit` (required field) contract is upheld at runtime even though PB may return `undefined` for legacy rows.

## LexTrackView.vue Not Modified

`src/views/LexTrackView.vue` was not touched in this plan (Phase 3's scope). It continues to compile against the updated mapper signatures because:
- `mapToUpdateMeeting` still accepts `DsuMeetings` — the `duration_unit` addition to the return shape is additive and harmless at the `pb.collection().update()` call site.
- `mapToUpdateSupport` still accepts `DsuSupports` — same reasoning for `link`.
- `mapToUpdateTask` is structurally identical to before.

## Quality Gates

- `npm run type-check` — exits 0.
- `npm run lint` (mapper files) — ESLint exits 0 for all three rewritten files.
- Pre-existing oxlint failures in `site.js` (`nextTick` unused) and `vite.config.ts` (`fs`, `path` unused) are out of scope — see Deferred Issues below.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 5d085e8 | feat(02-04): expand dsuMeetingMapper to full triple |
| 2 | 2e5a122 | feat(02-04): expand dsuSupportMapper to full triple |
| 3 | edc20b4 | feat(02-04): expand dsuTaskMapper to full triple |

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Issues

Pre-existing oxlint failures in files outside this plan's scope:

| File | Issue | Action |
|------|-------|--------|
| `site.js` | `nextTick` imported but never used | Pre-existing; out of scope |
| `vite.config.ts` | `fs` and `path` imported but never used | Pre-existing; out of scope |

## Known Stubs

None — all three mapper functions are fully wired with real field mappings.

## Phase 6 Follow-ups

- `mapFromRecordMeeting` with `record.duration_unit = undefined` should return `{ ..., duration_unit: 'minutes' }` — add unit test.
- `mapToCreateMeeting` with `input.duration_unit` omitted should return `{ ..., duration_unit: 'minutes' }` — add unit test.
- `mapFromRecordMeeting` with `record.duration_unit = 'banana'` (invalid runtime value) returns it unchanged — add test asserting PB's select-field constraint is the enforcement point, not the mapper.

## Self-Check: PASSED

Files exist:
- src/lib/pocketbase/dsuMeetingMapper.ts — FOUND
- src/lib/pocketbase/dsuSupportMapper.ts — FOUND
- src/lib/pocketbase/dsuTaskMapper.ts — FOUND

Commits exist:
- 5d085e8 — FOUND
- 2e5a122 — FOUND
- edc20b4 — FOUND
