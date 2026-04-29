---
phase: 06-quality-gate
plan: 02
subsystem: lextrack-export-utility
tags: [refactor, utility-extraction, testability, defineExpose]
dependency_graph:
  requires: []
  provides:
    - src/utils/lextrack/export.ts (stripHtml, buildExportString, ExportData)
    - LexTrackView.vue defineExpose (supports, dayStatus, meetings, tasks, removeSupport, removeMeeting, removeTask, setDayStatus)
  affects:
    - src/views/LexTrackView.vue
    - src/views/__tests__/LexTrackView.spec.ts (06-06 integration tests)
    - src/utils/lextrack/__tests__/export.spec.ts (06-03 unit tests)
tech_stack:
  added: []
  patterns:
    - Utility extraction from Vue SFC script setup to standalone TypeScript module
    - ExportData typed parameter interface replacing reactive ref reads
    - defineExpose for Vue Test Utils wrapper.vm access
key_files:
  created:
    - src/utils/lextrack/export.ts
  modified:
    - src/views/LexTrackView.vue
decisions:
  - stripHtml not re-exported from LexTrackView.vue (only buildExportString and ExportData needed by consumers; stripHtml is an internal utility within export.ts)
metrics:
  duration: ~8 minutes
  completed_date: "2026-04-29T10:54:31Z"
  tasks_completed: 3
  files_changed: 2
---

# Phase 6 Plan 02: Extract Export Utilities and Add defineExpose Summary

Extract `buildExportString` and `stripHtml` from `LexTrackView.vue` into `src/utils/lextrack/export.ts` as named exports, and add `defineExpose` to `LexTrackView.vue` for Vue Test Utils access in Plan 06-06 integration tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/utils/lextrack/export.ts | a33c970 | src/utils/lextrack/export.ts (created) |
| 2 | Update LexTrackView.vue imports | fc387a3 | src/views/LexTrackView.vue |
| 3 | Add defineExpose to LexTrackView.vue | 95f41b2 | src/views/LexTrackView.vue |

## What Was Built

**`src/utils/lextrack/export.ts`** — New standalone utility module containing:
- `stripHtml(html: string): string[]` — DOMParser-based HTML stripping for Quill content
- `ExportData` interface — typed parameter object for `buildExportString`
- `buildExportString(data: ExportData): string` — canonical DSU export formatter

**`LexTrackView.vue` changes:**
- Added `import { buildExportString, type ExportData } from '@/utils/lextrack/export'`
- Removed 65+ lines of local function definitions (`stripHtml` and `buildExportString`)
- Updated `exportDay()` to call `buildExportString({ ... } satisfies ExportData)` with reactive values passed as data properties
- Added `defineExpose({ supports, dayStatus, meetings, tasks, removeSupport, removeMeeting, removeTask, setDayStatus })` before `</script>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `stripHtml` from LexTrackView.vue import**
- **Found during:** Task 2 lint run
- **Issue:** Plan specified `import { stripHtml, buildExportString, type ExportData }` but `stripHtml` is not called directly in `LexTrackView.vue` — it's only used internally within `export.ts`. ESLint `@typescript-eslint/no-unused-vars` flagged it as an error.
- **Fix:** Import only `buildExportString` and `type ExportData` from the utility module. `stripHtml` remains exported from `export.ts` for use by test files in Plan 06-03.
- **Files modified:** `src/views/LexTrackView.vue`
- **Commit:** fc387a3

## Verification Results

- `npm run type-check` — PASS
- `npm run lint` — PASS (0 errors, 0 warnings)
- `npm run build` — PASS (bundle output: LexTrackView-D3ha36Kg.js 26.06 kB gzip: 8.50 kB)
- `grep -v "^//" src/views/LexTrackView.vue | grep -c "defineExpose"` — output: `1`
- `grep -c "export function stripHtml" src/utils/lextrack/export.ts` — output: `1`
- `grep -c "export function buildExportString" src/utils/lextrack/export.ts` — output: `1`
- `grep -c "export interface ExportData" src/utils/lextrack/export.ts` — output: `1`
- `grep -c "const stripHtml" src/views/LexTrackView.vue` — output: `0` (removed)
- `grep -c "const buildExportString" src/views/LexTrackView.vue` — output: `0` (removed)

## Known Stubs

None. All exported functions are fully implemented with complete logic ported from the original LexTrackView.vue.

## Threat Flags

None. This refactor introduces no new network endpoints, auth paths, file access patterns, or schema changes. The `DOMParser` usage in `stripHtml` remains the same as before (T-06-02 accepted in threat model).

## Self-Check: PASSED

- `src/utils/lextrack/export.ts` exists: FOUND
- `src/views/LexTrackView.vue` contains `from '@/utils/lextrack/export'`: FOUND
- `src/views/LexTrackView.vue` contains `defineExpose(`: FOUND
- Commits a33c970, fc387a3, 95f41b2 all exist in git log: VERIFIED
