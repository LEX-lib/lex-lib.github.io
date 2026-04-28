---
phase: 02-types-mappers
plan: "03"
subsystem: types
tags: [types, lextrack, dsu_supports, dsu_tasks, rename, pocketbase]
dependency_graph:
  requires: []
  provides:
    - src/types/lextrack/dsu_supports/types.ts
    - src/types/lextrack/dsu_tasks/types.ts
  affects:
    - src/lib/pocketbase/dsuSupportMapper.ts
    - src/lib/pocketbase/dsuTaskMapper.ts
    - src/views/LexTrackView.vue
tech_stack:
  added: []
  patterns:
    - "git mv for .d.ts → .ts rename preserving history"
    - "RecordModel import normalized to public 'pocketbase' entry"
key_files:
  created: []
  modified:
    - src/types/lextrack/dsu_supports/types.ts
    - src/types/lextrack/dsu_tasks/types.ts
decisions:
  - "link?: string added as optional between title and description (matches PB URL field: required=false)"
  - "No constants.ts created for either entity — neither has enum-shaped field (D-05)"
  - "Import normalized from pocketbase/dist/pocketbase.es to 'pocketbase' (D-16)"
metrics:
  duration: "~2m 26s"
  completed: "2026-04-28"
  tasks_completed: 3
  files_changed: 2
---

# Phase 02 Plan 03: DSU Supports & Tasks Type Renames Summary

**One-liner:** Renamed dsu_supports and dsu_tasks type files from `.d.ts` to `.ts`; added `link?: string` to `DsuSupports` and normalized the `RecordModel` import path to `'pocketbase'`.

## What Was Done

### Task 1 — dsu_supports: rename + link field + import normalization

`git mv src/types/lextrack/dsu_supports/types.d.ts → types.ts`

Three changes in one commit (`cd2681e`):

1. **File rename** — `.d.ts` → `.ts` (D-05: ambient declaration moves to plain `.ts` for use in both type and re-export contexts).
2. **`link?: string` added** — inserted between `title` and `description`, matching PB's `dsu_supports.link` URL field (type=URL, required=false). Optional `?` encodes both "no link set" and "empty string" without a nullable union — consistent with how `description?: string` is handled in the codebase.
3. **Import normalized** — `from "pocketbase/dist/pocketbase.es"` → `from 'pocketbase'` (D-16). The `/dist/` subpath was a private internal path; the public entry is correct and stable.

`git log --follow` confirms rename history is intact.

### Task 2 — dsu_tasks: rename only (no field changes)

`git mv src/types/lextrack/dsu_tasks/types.d.ts → types.ts`

Single commit (`c9b2af0`). Content is identical in shape — only formatting normalized (single space inside braces, single quotes, blank line before `AddDsuTask`). The import was already `from 'pocketbase'` so no path fix was needed. No `constants.ts` created — tasks have no enum-shaped field in this phase (D-05).

`git log --follow` confirms rename history is intact.

### Task 3 — Type-check and lint verification

- `npm run type-check` (vue-tsc): exits 0
- `npm run lint` (oxlint + eslint): the two modified files pass with 0 errors. Pre-existing failures in `site.js` and `vite.config.ts` (unused `nextTick`, `fs`, `path` imports) are out of scope for this plan — logged to `deferred-items.md`.

## Decisions Made

- **`link?: string` is optional** — matches PB `required: false` on the URL field. `string | undefined` covers both a URL string and a missing/empty value. No `string | null` union (consistent with `description?: string` in the same interface).
- **Field order** — `id, created, updated, date, title, link, description` — matches the intended UI rendering order for Phase 3 (`ManageSupport.vue`).
- **`AddDsuSupport` includes `link`** — the `Omit` pattern only omits `id | created | updated`. `link` is optional on the create payload (the `?` makes it safe to omit at construction time), so no special handling needed.
- **No `constants.ts`** for either entity — neither `dsu_supports` nor `dsu_tasks` has an enum-shaped field in Phase 2. D-05 explicitly forbids placeholder files.

## Git History Verification

```
git log --follow --oneline src/types/lextrack/dsu_supports/types.ts
cd2681e feat(02-03): rename dsu_supports types.d.ts → types.ts; add link?: string
31c77e0 Add mini-applications

git log --follow --oneline src/types/lextrack/dsu_tasks/types.ts
c9b2af0 feat(02-03): rename dsu_tasks types.d.ts → types.ts (symmetry-only)
31c77e0 Add mini-applications
```

History is intact through the rename for both files.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `cd2681e` | feat | dsu_supports rename + link field + import normalization |
| `c9b2af0` | feat | dsu_tasks rename (symmetry-only, no field changes) |

## Deviations from Plan

### Pre-existing Lint Errors (out of scope)

**Found during:** Task 3
**Issue:** `npm run lint` exits 1 due to `no-unused-vars` in `site.js` (nextTick) and `vite.config.ts` (fs, path). These are not in files modified by this plan and pre-date Phase 2.
**Action:** Logged to `.planning/phases/02-types-mappers/deferred-items.md`. Not fixed (scope boundary rule).
**Files modified:** None.

No other deviations — plan executed as written.

## Known Stubs

None — no placeholder values or hardcoded empty data introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced in this plan. The `link?: string` addition is a type-only change; the T-2-02 threat (XSS via javascript: URI in rendered anchor) is deferred to Phase 3 per the plan's threat register.

## Self-Check: PASSED

- `src/types/lextrack/dsu_supports/types.ts` exists: FOUND
- `src/types/lextrack/dsu_tasks/types.ts` exists: FOUND
- `src/types/lextrack/dsu_supports/types.d.ts` absent: CONFIRMED
- `src/types/lextrack/dsu_tasks/types.d.ts` absent: CONFIRMED
- Commit `cd2681e` exists: FOUND
- Commit `c9b2af0` exists: FOUND
