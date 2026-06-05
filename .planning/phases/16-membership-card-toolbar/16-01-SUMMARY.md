---
phase: 16-membership-card-toolbar
plan: 01
subsystem: ui
tags: [vue3, typescript, primevue, wallecx, toolbar, props, refactor]

# Dependency graph
requires:
  - phase: 07-toolbar-search-sort
    provides: WallecxToolbar.vue generic toolbar component (search + sort + view toggle)
  - phase: 10-tabs-shell-vaccinationstab-extraction
    provides: VaccinationsTab.vue self-contained tab component using WallecxToolbar
provides:
  - WallecxToolbar.vue with required sortOptions prop — decoupled from vaccination-specific data
  - VaccinationsTab.vue owns vaccinationSortOptions and passes via :sort-options binding
affects:
  - 16-02 (MembershipsTab toolbar integration — WallecxToolbar now accepts arbitrary sortOptions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parent-owned sort options: each tab component declares its own sortOptions array and passes it to WallecxToolbar via required prop"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/WallecxToolbar.vue
    - src/components/projects/wallecx/VaccinationsTab.vue

key-decisions:
  - "sortOptions moved to required prop (no withDefaults default) — callers must supply their own options array, preventing silent fallback to vaccination-specific values"
  - "vaccinationSortOptions placed immediately before // --- GROUPING --- comment — keeps sort config co-located with the computed logic that consumes sortMode values"

patterns-established:
  - "Tab-owned sort options pattern: each tab declares const <name>SortOptions and passes to WallecxToolbar via :sort-options prop; enables WallecxToolbar reuse across tabs with different sort semantics"

requirements-completed: [ORG-01, ORG-02]

# Metrics
duration: 2min
completed: 2026-05-15
---

# Phase 16 Plan 01: WallecxToolbar sortOptions prop refactor Summary

**WallecxToolbar decoupled from vaccination-specific data by promoting sortOptions from a hardcoded internal const to a required TypeScript prop, with VaccinationsTab owning its own vaccinationSortOptions array.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-15T05:46:42Z
- **Completed:** 2026-05-15T05:48:44Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed hardcoded vaccination sort labels from WallecxToolbar.vue — the generic toolbar no longer knows about "Type A-Z" or vaccination-specific sort modes
- Added `sortOptions: { value: string; label: string }[]` as a required prop to WallecxToolbar defineProps — TypeScript enforces that all callers supply sort options
- VaccinationsTab.vue now declares `vaccinationSortOptions` and passes it via `:sort-options="vaccinationSortOptions"` — existing sort behavior preserved exactly
- `npm run type-check` exits 0 — both files satisfy TypeScript together with the new required prop

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor WallecxToolbar — move sortOptions from hardcoded const to required prop** - `4c0a76d` (refactor)
2. **Task 2: Update VaccinationsTab — add vaccinationSortOptions const and pass via :sort-options prop** - `526b3b0` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/components/projects/wallecx/WallecxToolbar.vue` — sortOptions added as required prop; hardcoded const removed; template :options binding unchanged
- `src/components/projects/wallecx/VaccinationsTab.vue` — vaccinationSortOptions const added; :sort-options binding added to WallecxToolbar usage

## Decisions Made

- sortOptions is required with no default in withDefaults — intentional, prevents accidental use without providing context-appropriate sort labels
- Sort values (`type-asc`, `type-desc`, `name-asc`, `name-desc`) in vaccinationSortOptions are identical to the removed hardcoded const — no behavior change for VaccinationsTab

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. sortOptions is a typed array of {value, label} objects passed from parent components — no user-controlled input reaches it (T-16-01: accept). searchQuery renders via Vue text interpolation, not v-html (T-16-02: accept).

## Known Stubs

None — all data wired correctly. VaccinationsTab sort behavior unchanged; WallecxToolbar renders options from prop.

## Self-Check

- `src/components/projects/wallecx/WallecxToolbar.vue` — modified, committed in 4c0a76d
- `src/components/projects/wallecx/VaccinationsTab.vue` — modified, committed in 526b3b0
- `npm run type-check` exits 0 — verified

## Self-Check: PASSED

## Next Phase Readiness

- WallecxToolbar is now generic and ready for MembershipsTab (Plan 16-02) to pass its own sort options (Name A-Z, Issuer A-Z, Expiry Date, Recently Added)
- No blockers — TypeScript compilation clean, VaccinationsTab behavior unchanged

---
*Phase: 16-membership-card-toolbar*
*Completed: 2026-05-15*
