---
phase: 06-quality-gate
plan: 08
subsystem: testing
tags: [vitest, vue-test-utils, pocketbase, LexTrackView]

requires:
  - phase: 06-quality-gate-06-07
    provides: Phase gate approved; QA-02 identified as PARTIAL needing 2 additional tests

provides:
  - defineExpose extended with selectedDate, handleMeetingSave, handleTaskSave, handleSupportSave
  - Test 6: date-change watcher test (selectedDate → loadForDate)
  - Test 7: handleMeetingSave create-path test (no id → pb.create called)

affects: []

tech-stack:
  added: []
  patterns: [expose-for-testing pattern — add refs/handlers to defineExpose so tests can drive them directly]

key-files:
  created: []
  modified:
    - src/views/LexTrackView.vue
    - src/views/__tests__/LexTrackView.spec.ts

key-decisions:
  - "Used wrapper.vm.selectedDate = new Date(...) to trigger the watch(selectedDate) watcher — requires selectedDate in defineExpose"
  - "Save test pushes item into wrapper.vm.meetings before calling handleMeetingSave so indexOf lookup succeeds"

patterns-established:
  - "Expose-for-testing: expose internal refs/handlers via defineExpose so unit tests can drive component logic without template interaction"

requirements-completed: [QA-02]

duration: 5min
completed: 2026-04-29
---

# Phase 06-08: Gap Closure — QA-02 Date-Change and Save Tests

**LexTrackView.spec.ts extended to 7 passing tests — date-change watcher and meeting create-path now covered, QA-02 fully satisfied**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-29T20:40:00Z
- **Completed:** 2026-04-29T20:43:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended `defineExpose` in `LexTrackView.vue` with `selectedDate`, `handleMeetingSave`, `handleTaskSave`, `handleSupportSave` (4 new identifiers, 12 total)
- Added test 6: assigning a new Date to `wrapper.vm.selectedDate` fires the `watch(selectedDate, ...)` watcher and triggers `loadForDate` for all 4 collections
- Added test 7: calling `wrapper.vm.handleMeetingSave` with an item lacking an `id` calls `pb.collection('dsu_meetings').create` with the correct title
- Full suite: 81/81 tests passing across 12 spec files; type-check and lint clean

## Task Commits

1. **Task 1 + 2: defineExpose extension and 2 new tests** — `6f5dc1a` (test(06-08))

## Files Created/Modified
- `src/views/LexTrackView.vue` — defineExpose block extended with 4 additional identifiers
- `src/views/__tests__/LexTrackView.spec.ts` — 2 new it() blocks appended inside existing describe

## Decisions Made
- Both tasks combined into one commit since they are tightly coupled (expose → test uses expose)
- `wrapper.vm.selectedDate = new Date(...)` directly mutates the Ref object returned by defineExpose; Vue's reactivity fires the watcher correctly in jsdom

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED

- `grep -c "selectedDate," src/views/LexTrackView.vue` → 2 (declaration + defineExpose) ✓
- `grep "handleMeetingSave," src/views/LexTrackView.vue` → matches defineExpose line ✓
- `npm run test:unit -- LexTrackView` → 7 tests passing ✓
- `npm run test:unit` → 81 tests passing (12 files) ✓
- `npm run type-check` → exit 0 ✓
- `npm run lint` → 0 warnings, 0 errors ✓
- QA-02: PARTIAL → SATISFIED ✓

## Next Phase Readiness

Phase 6 gap closure complete. All 31 v1 requirements satisfied. Milestone v1.0 closed.

---
*Phase: 06-quality-gate*
*Completed: 2026-04-29*
