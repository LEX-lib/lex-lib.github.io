---
phase: 16-membership-card-toolbar
plan: 02
subsystem: ui
tags: [vue3, typescript, primevue, wallecx, toolbar, search, sort, computed, sessionStorage]

# Dependency graph
requires:
  - phase: 16-01
    provides: WallecxToolbar.vue with required sortOptions prop
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "displayedMemberships computed: filter by card_name/issuer then sort via switch — mirrors VaccinationsTab displayedGroups pattern"
    - "sessionStorage whitelist validation: restore only if stored value is in membershipSortOptions.map(o => o.value)"
    - "Four template branches: loading / no-records / no-results / data — toolbar unconditional above all branches"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/MembershipsTab.vue

key-decisions:
  - "v-model:view-mode bound to string literal 'grid' — memberships tab has no view toggle (show-toggle=false); no viewMode ref needed"
  - "No-results condition uses && searchQuery to ensure the branch only activates during active search, not when records are empty"
  - "displayedMemberships computed declared as const (not function) so Vue tracks reactive dependencies correctly"

# Metrics
duration: 3min
completed: 2026-05-15
---

# Phase 16 Plan 02: MembershipsTab Search and Sort Wiring Summary

**MembershipsTab.vue wired with real-time search and sort via WallecxToolbar — displayedMemberships computed filters by card_name/issuer and sorts by four modes with sessionStorage persistence for sort mode.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-15T08:32:44Z
- **Completed:** 2026-05-15T08:35:35Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `computed, watch` to Vue import; imported `WallecxToolbar` in MembershipsTab.vue script
- Added `SORT_MODE_STORAGE_KEY`, `membershipSortOptions` (4 options), `searchQuery` ref, `sortMode` ref
- Added `displayedMemberships` computed: filters `records` by `card_name`/`issuer` (case-insensitive partial match), then sorts by `name-asc`, `issuer-asc`, `expiry-asc`, or `recently-added` (default)
- Added `watch(sortMode)` to persist sort selection to `sessionStorage` on every change
- Added `sessionStorage` restore in `onMounted` before `isLoading = true` with whitelist validation against `membershipSortOptions`
- Inserted unconditional `<WallecxToolbar>` in template with `show-toggle="false"` and `v-model` bindings for `searchQuery` and `sortMode`
- Added no-results empty state with `mdi:magnify-remove-outline` icon and "Clear search" button (only shown when `displayedMemberships.length === 0 && searchQuery`)
- Updated data grid `v-for` from `records` to `displayedMemberships`
- `npm run type-check` exits 0 after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Update MembershipsTab script — add imports, refs, computed, sessionStorage, watch** - `1f22af2` (feat)
2. **Task 2: Update MembershipsTab template — insert WallecxToolbar, no-results state, update v-for** - `6d6ec64` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/components/projects/wallecx/MembershipsTab.vue` — script: computed/watch imports, WallecxToolbar import, sort constants, displayedMemberships computed, sessionStorage watch + restore; template: WallecxToolbar block, no-results empty state, v-for updated to displayedMemberships

## Decisions Made

- `v-model:view-mode="'grid'"` uses a string literal — memberships tab always shows grid; no `viewMode` ref required (D-03)
- No-results condition `&& searchQuery` ensures the empty state only appears during an active search, not when `records` is genuinely empty (D-10)
- Toolbar placed unconditionally above all content branches — visible during loading and empty states (D-09)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

- T-16-03 (mitigated): sessionStorage restore validates stored value against `membershipSortOptions` whitelist before assignment — unrecognised values fall back to `'recently-added'` default.
- T-16-04 (accepted): `{{ searchQuery }}` renders via Vue text interpolation, not `v-html` — no XSS vector.
- T-16-05 (mitigated): Both `sessionStorage.getItem` and `sessionStorage.setItem` are wrapped in `try/catch` — privacy-mode iframe failures are swallowed silently.

## Known Stubs

None — all data is wired. `displayedMemberships` consumes the already-loaded `records` ref; no placeholder values.

## Self-Check

- `src/components/projects/wallecx/MembershipsTab.vue` — modified, committed in 1f22af2 (script) and 6d6ec64 (template)
- `npm run type-check` exits 0 — verified after both tasks

## Self-Check: PASSED

## Requirements Completed

- **ORG-01** — Real-time search filtering membership cards by card_name and issuer is fully wired
- **ORG-02** — Client-side sort with four modes (Recently Added, Name A–Z, Issuer A–Z, Expiry Date) is fully wired

---
*Phase: 16-membership-card-toolbar*
*Completed: 2026-05-15*
