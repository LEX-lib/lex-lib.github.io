---
phase: 06-quality-gate
plan: "06"
subsystem: testing
tags: [vitest, vue-test-utils, pinia-testing, lextrack, integration-tests]
dependency_graph:
  requires:
    - 06-01  # test infra + @pinia/testing install + __mocks__/index.ts
    - 06-02  # defineExpose on LexTrackView.vue
  provides:
    - src/views/__tests__/LexTrackView.spec.ts
  affects:
    - src/views/LexTrackView.vue  # tested, not modified
tech_stack:
  added: []
  patterns:
    - vi.mock auto-resolution via __mocks__/index.ts
    - createTestingPinia with createSpy for Pinia action stubbing
    - PrimeVue component stubs (DatePicker, SelectButton, Card) for jsdom compatibility
    - defineExpose-based wrapper.vm access for internal state assertions
key_files:
  created:
    - src/views/__tests__/LexTrackView.spec.ts
  modified: []
decisions:
  - Stubbed DatePicker, SelectButton, Card, Button PrimeVue components to avoid matchMedia jsdom error
  - Used vi.mock auto-resolution (no factory) to rely on __mocks__/index.ts from Plan 06-01
metrics:
  duration: "~4 min"
  completed: "2026-04-29"
  tasks_completed: 1
  files_created: 1
---

# Phase 06 Plan 06: LexTrackView Integration Tests Summary

**One-liner:** LexTrackView integration tests via vi.mock(__mocks__/index.ts) + createTestingPinia + PrimeVue stubs — 5 tests covering initial load, delete, and day-status behaviors.

## What Was Built

Created `src/views/__tests__/LexTrackView.spec.ts` with 5 test cases for `LexTrackView.vue`:

1. **Initial load** — verifies `pb.collection` called for all 4 collections (dsu_supports, dsu_tasks, dsu_meetings, dsu_day_status) on mount
2. **Delete with id** — verifies `removeSupport(0)` calls `pb.collection('dsu_supports').delete('sup-1')` when item has an id
3. **Delete without id** — verifies `removeSupport(0)` does NOT call `pb.delete` for local-only items, and item is removed from array
4. **setDayStatus create** — verifies `create()` called with `{ status: 'sl' }` when dayStatus is null; dayStatus.value populated after flushPromises
5. **setDayStatus delete** — verifies `delete('status-1')` called and dayStatus set to null when setDayStatus(null) called with existing record

All 5 tests pass. Type-check passes cleanly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @pinia/testing not installed in node_modules despite being in package.json**
- **Found during:** Task 1 (pre-execution check)
- **Issue:** `@pinia/testing@^1.0.3` was listed in `package.json` devDependencies (added by Plan 06-01) but `node_modules/@pinia/` directory was absent — npm install had not been run
- **Fix:** Ran `npm install` to restore node_modules state
- **Files modified:** package-lock.json (no source changes)

**2. [Rule 1 - Bug] PrimeVue DatePicker calls matchMedia in jsdom causing all tests to fail**
- **Found during:** First test run — `TypeError: matchMedia is not a function` from `DatePicker.vue:1119`
- **Issue:** LexTrackView template renders `<DatePicker>` which calls `window.matchMedia` in its `mounted()` hook. jsdom does not implement matchMedia
- **Fix:** Added `DatePicker: true, SelectButton: true, Card: true, Button: true` to the stubs object in `makeWrapper()`
- **Files modified:** `src/views/__tests__/LexTrackView.spec.ts`

## Known Stubs

None — all test data is explicit mock data, no placeholder values in production code paths.

## Threat Flags

None — test-only file, no new production surface introduced.

## Self-Check: PASSED

- `src/views/__tests__/LexTrackView.spec.ts` — FOUND
- Commit `c5555f1` — FOUND (git log confirms)
- All 5 tests pass (`npm run test:unit -- --reporter dot LexTrackView` exit 0)
- Type-check exit 0
