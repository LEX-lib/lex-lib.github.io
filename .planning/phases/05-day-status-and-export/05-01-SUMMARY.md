---
phase: 05-day-status-and-export
plan: 01
subsystem: ui
tags: [vue3, pocketbase, dayjs, clipboard, export, day-status, lextrack]

# Dependency graph
requires:
  - phase: 04-bugs-and-save-ux
    provides: loadForDate function shape, saveItem helper, handle401 pattern, LexTrackView.vue script structure
  - phase: 02-types-mappers
    provides: DsuDayStatus type, DsuDayStatusValue union, dsuDayStatusMapper (mapToCreateDayStatus, mapFromRecordDayStatus)
provides:
  - dayStatus ref (DsuDayStatus | null) reactive state in LexTrackView.vue
  - setDayStatus handler (upsert/delete PB dsu_day_status via create/update/delete)
  - selectedStatus computed (string | null for SelectButton v-model)
  - statusFullName computed (full human-readable status name for banner and export)
  - buildExportString() pure function returning canonical dsu-format.md text from local state
  - exportDay() async handler writing to clipboard with toast feedback
  - stripHtml() utility using DOMParser to extract text lines from Quill HTML
  - DAY_STATUS_OPTIONS constant (5 options with label/value pairs)
  - Extended loadForDate Promise.all now fetches dsu_day_status alongside entities
affects:
  - 05-02 (template wiring — binds SelectButton, banner v-if/v-else, Export button to the new refs/handlers)
  - 05-03 (verification gate — smoke-tests all Phase 5 features)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "upsert semantics: fetch id from dayStatus ref, then create if null / update if present / delete on clear"
    - "DOMParser HTML stripping for Quill description fields — browser-native, zero new deps"
    - "buildExportString reads only local reactive state (no PB calls at export time)"
    - "navigator.clipboard.writeText rejection caught and surfaced via toast.error"

key-files:
  created: []
  modified:
    - src/views/LexTrackView.vue

key-decisions:
  - "05-01: setDayStatus uses update path (not delete-then-create) when dayStatus.value exists — preserves record id, avoids double-write race"
  - "05-01: STATUS_FULL_NAMES uses 'Others' (plural) per user preference D-12, not 'Other' from DSU_DAY_STATUS_LABELS"
  - "05-01: stripHtml queries p, li, div elements to capture both paragraph and list item content from Quill"
  - "05-01: buildExportString blank-line separator inserted between non-empty sections (lines.length > 1 guard)"

patterns-established:
  - "loadForDate four-way Promise.all: supports, tasks, meetings, day_status fetched simultaneously"
  - "Status day export: two lines only — date header + full status name, no section headers"

requirements-completed:
  - UI-DAY-01
  - UI-DAY-02
  - UI-DAY-03
  - EXPORT-01
  - EXPORT-02
  - EXPORT-03

# Metrics
duration: 2min
completed: 2026-04-29
---

# Phase 5 Plan 01: Day Status & Export Script Logic Summary

**Day status upsert/delete handler plus clipboard export builder added to LexTrackView.vue script — all Phase 5 reactive state and async logic with zero template changes**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-29T09:46:05Z
- **Completed:** 2026-04-29T09:48:32Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Extended `loadForDate` Promise.all to fetch `dsu_day_status` as a fourth concurrent query, storing the result in the new `dayStatus` ref
- Added `setDayStatus(value)` with full upsert semantics — creates, updates, or deletes the PB record immediately on user interaction with proper `handle401` coverage
- Added `buildExportString()` pure function that produces canonical dsu-format.md output from local state only (no PB calls), handling normal days and status days differently per D-12
- Added `exportDay()` async handler, `stripHtml()` DOMParser utility, `selectedStatus` computed, `statusFullName` computed, and `DAY_STATUS_OPTIONS` constant

## Task Commits

Each task was committed atomically:

1. **Task 1: Add day status imports, state, and handlers to LexTrackView.vue script** - `155ed73` (feat)

**Plan metadata:** (pending final metadata commit)

## Files Created/Modified

- `src/views/LexTrackView.vue` - Added 167 lines of script logic: imports, DAY_STATUS_OPTIONS, dayStatus ref, extended loadForDate, setDayStatus, selectedStatus, statusFullName, STATUS_FULL_NAMES, stripHtml, buildExportString, exportDay

## Decisions Made

- `setDayStatus` implements update-in-place (not delete-then-create) when an existing record is found in `dayStatus.value` — preserves the record id across status changes and avoids a race condition window
- `STATUS_FULL_NAMES['others']` is `'Others'` (plural) to match user preference from D-12, intentionally diverging from `DSU_DAY_STATUS_LABELS` which uses singular `'Other'`
- `stripHtml` queries `p, li, div` elements to capture both paragraph and list-item content Quill may produce
- Blank-line separator between non-empty export sections uses `lines.length > 1` guard to avoid a leading blank before the first section

## Deviations from Plan

None — plan executed exactly as written. All seven steps applied cleanly; type-check exits 0 with no errors.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 5 script logic is in place and type-checked
- Plan 05-02 can immediately wire the template: SelectButton with `@change="setDayStatus"`, `v-if`/`v-else` banner toggle, and Export button calling `exportDay`
- No blockers

---
*Phase: 05-day-status-and-export*
*Completed: 2026-04-29*
