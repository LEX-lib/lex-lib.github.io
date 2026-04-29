---
phase: 03-meeting-admin-ui
plan: 04
subsystem: ui
tags: [vue, lextrack, cleanup, label, refactor]

# Dependency graph
requires:
  - phase: 03-meeting-admin-ui
    plan: 02
    provides: "ActivityCard inline-add Admin branch keys off props.label === 'Admin' — needs the rename to activate"
provides:
  - "Third ActivityCard section labeled 'Admin' (was 'Admin Tasks and Support')"
  - "Zero console.log statements in src/views/LexTrackView.vue"
  - "No commented-out Dialog/AddMeeting/Button/LexTrackApp blocks remaining in the template"
affects: [03-05, 03-06, 04-*]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Surgical cleanup: behavior-preserving deletes only (Phase 4 boundary on save handler and fetch watcher honored)"

key-files:
  created: []
  modified:
    - src/views/LexTrackView.vue

key-decisions:
  - "Section label string is exactly 'Admin' (capitalized, no trailing space) — required by Plan 03-02's ActivityCard inline-add Admin branch which keys off props.label === 'Admin'"
  - "All eight console.log occurrences removed (six active + two commented diagnostic stubs in watcher and save())"
  - "Commented-out template blocks removed wholesale: <!-- <LexTrackApp/> -->, <!-- <Button label='Show'> -->, <!-- <Dialog header='Add DSU Update'> --> through its end-tag, and <!-- <AddMeeting ...> -->"
  - "Save handler body and fetch watcher Promise.all triple are byte-identical aside from the deleted // console.log lines (Phase 4 owns the actual refactor of those paths)"
  - "AddMeeting import was already absent — no import-cleanup needed (D-23 verification was a no-op as predicted by the plan)"
  - "// task.value = ... commented diagnostic in updateTask kept as-is — it is not a console statement and not in the BUG-04 scope"

patterns-established:
  - "Plan 03-04's surgical-only diff is the template for any future LexTrackView cleanup — never touch save()/watcher bodies until their owning phase"

requirements-completed: [UI-ADMIN-03, BUG-04, BUG-05]

# Metrics
duration: ~3min
completed: 2026-04-29
---

# Phase 3 Plan 04: LexTrackView "Admin" Label + Console.log/Dead-Code Cleanup Summary

**Three surgical edits in `src/views/LexTrackView.vue`: rename the third ActivityCard section to "Admin", strip every `console.log` (active and commented), and delete the dead commented-out Dialog/AddMeeting/Button/LexTrackApp blocks — all while keeping the Phase 4 boundary on save/fetch logic intact.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-29T00:44:41Z
- **Completed:** 2026-04-29T00:47:44Z
- **Tasks:** 1
- **Files modified:** 1

## What Was Built

### Edit 1 — Section Label Rename (D-13, UI-ADMIN-03)

`<ActivityCard label="Admin Tasks and Support" .../>` → `<ActivityCard label="Admin" .../>`. Capitalization and spelling matter: Plan 03-02's inline-add Enter handler in `ActivityCard.vue` branches on `props.label === 'Admin'` to seed `link: undefined` for new admin entries. With this rename in place, that branch is now reachable in production.

### Edit 2 — Console.log Removal (BUG-04, D-21)

Eight console references stripped:
- Active calls in `updateSupport`, `removeSupport`, `updateMeeting`, `removeMeeting`, `updateTask`, `removeTask` (six)
- Commented diagnostic at top of watcher: `//console.log('Selected date changed:', newDate);`
- Commented diagnostic at end of watcher: `//console.log(supportsList);`
- Commented diagnostic at end of `save()`: `//console.log(supports.value);`

Plus the leftover `//console.log(index);` inside `updateTask` (which had been left alongside `// task.value = tasks.value[index] as AddDsuTask;` — the latter is a non-console comment and stays per the surgical scope).

`grep -n "console" src/views/LexTrackView.vue` now returns nothing.

### Edit 3 — Commented-Out Template Cleanup (BUG-05, D-22)

Removed:
- `<!-- <LexTrackApp/> -->` (top of `<template>`)
- `<!-- <Button label="Show" @click="visible = true" /> -->`
- The full ~40-line `<!-- <Dialog v-model:visible="visible" header="Add DSU Update"> ... </Dialog> -->` block
- The `<!-- <AddMeeting v-model:visible="addMeetingDialogVisibility" v-model:meetings="meetings" /> -->` comment

Net effect on the template: between the closing `</Card>` and the live `<ManageMeeting>` element, the file now has a single blank line for breathing room — exactly what the plan asked for.

### Edit 4 — `AddMeeting` Import Check (D-23)

No-op as the plan predicted. No `import.*AddMeeting` line existed in this file (the only `<AddMeeting>` reference was inside the now-removed comment). Verified post-edit: `! grep -q "import.*AddMeeting" src/views/LexTrackView.vue`.

## Verification Evidence

All grep acceptance criteria pass:

| Check | Command | Result |
|-------|---------|--------|
| New label present | `grep -c 'label="Admin"' src/views/LexTrackView.vue` | 1 |
| Old label gone | `grep -c "Admin Tasks and Support" src/views/LexTrackView.vue` | 0 |
| No console.log | `grep -c "console" src/views/LexTrackView.vue` | 0 |
| No `<AddMeeting` | `grep -c "<AddMeeting" src/views/LexTrackView.vue` | 0 |
| No `<LexTrackApp/>` | `grep -c "<LexTrackApp/>" src/views/LexTrackView.vue` | 0 |
| `<ManageMeeting>` present | `grep -c "<ManageMeeting" src/views/LexTrackView.vue` | 1 |
| `<ManageTask>` present | `grep -c "<ManageTask" src/views/LexTrackView.vue` | 1 |
| `<ManageSupport>` present | `grep -c "<ManageSupport" src/views/LexTrackView.vue` | 1 |
| `save()` still defined | `grep -c "const save = async" src/views/LexTrackView.vue` | 1 |
| `watch(selectedDate)` still defined | `grep -c "watch(selectedDate" src/views/LexTrackView.vue` | 1 |

Tooling gates:

- `npm run type-check` exits 0 (vue-tsc --build clean)
- `npx oxlint src/views/LexTrackView.vue -D correctness` reports `Found 0 warnings and 0 errors. Finished in 13ms on 1 file with 87 rules using 22 threads.`

Diff stats: `1 file changed, 1 insertion(+), 65 deletions(-)` — the single insertion is the renamed `label="Admin"` ActivityCard line; the 65 deletions are eight console references plus the commented-out template blocks. No save/watcher logic touched.

## Threat Model Outcome

T-3-06 (Information disclosure via `console.log` debug output) — **mitigated**. With every `console.log` removed from `LexTrackView.vue`, entity payloads (support, meeting, task arrays) no longer leak to the browser console on edit/remove actions. Defense-in-depth for any future shared-device scenario. No new attack surface introduced (pure deletion + a string rename).

## Deviations from Plan

None — plan executed exactly as written. Edit 4's import check was a no-op as the plan predicted.

## Phase 4 Boundary Compliance

The plan explicitly carved out the save handler and fetch watcher (Phase 4 owns BUG-01, BUG-02, BUG-03, UI-SAVE-01/02/03). Verified:

- The `watch(selectedDate, async (newDate : Date) => { ... })` body still contains:
  - The commented-out single-fetch alternates at the original location (lines 99-103 post-edit)
  - The `Promise.all([pb.collection(...).getFullList<...>(options), ...])` triple
  - The `supports.value = supportsList; tasks.value = tasksList; meetings.value = meetingsList;` assignments
  - Only the leading `//console.log('Selected date changed:', newDate);` and trailing `//console.log(supportsList);` lines were removed (per Edit 2 scope)
- The `save()` body still contains the three `for...of` loops with `pb.collection(...).update/create` calls intact
  - Only the trailing `//console.log(supports.value);` line was removed (per Edit 2 scope)
- The `/** SUPPORTS */ /** SUPPORTS */` (and equivalent for MEETINGS / TASKS) double-comment section separators are preserved per CONVENTIONS.md and explicitly out of BUG-04 scope
- The empty `<style scoped></style>` block is preserved

## Self-Check: PASSED

- File `src/views/LexTrackView.vue` exists and reflects all four edits — confirmed via grep table above.
- Commit `708c6d4` exists in git log:

```
$ git log --oneline -1
708c6d4 refactor(03-04): clean LexTrackView and rename Admin section label
```

- Diff scope is exactly `src/views/LexTrackView.vue` only (no incidental files touched).
- The unstaged `assets/index-okczvBpm.js` was left untouched per execution instructions.
