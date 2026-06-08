---
phase: 04-discovery-polish
plan: "03"
subsystem: wallecx
tags: [export, json, pocketbase, polish, ux]
dependency_graph:
  requires: [04-01-PLAN.md]
  provides: [POLISH-03]
  affects: [src/components/projects/wallecx/WallecxApp.vue]
tech_stack:
  added: []
  patterns:
    - isExporting ref guard (prevents double-click on async action)
    - pb.files.getURL with 2 args only (no token — static reference URLs)
    - Blob + URL.createObjectURL + anchor.click() browser download pattern
    - pb.authStore.record?.id null-safe session-expiry guard
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/WallecxApp.vue
decisions:
  - "Export card_url uses pb.files.getURL(r, r.card) with NO token — the exported JSON is a reference document, not a time-limited download bundle; card URLs still require auth to fetch the binary"
  - "isExporting ref guards the button at both :disabled and :loading bindings and early-returns in exportJson() — single concurrent getFullList enforced"
  - "Session-expiry guard matches HIGH-01 fix pattern: pb.authStore.record?.id with toast.error on null, consistent with ManageVaccination.vue"
metrics:
  duration_seconds: 88
  completed_date: "2026-05-12"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 4 Plan 03: JSON Export Button Summary

**One-liner:** `exportJson()` with `isExporting` guard and "Download records" button added to WallecxApp.vue — exports full vaccination record set as dated JSON with static card URL references (no token).

## What Was Built

Added JSON export capability to `WallecxApp.vue`:

- `isExporting` ref declared after existing state declarations, before the listToken timer block
- `exportJson()` async function inserted after `openManage()`:
  - Double-click guard via `isExporting.value` early return
  - Session-expiry guard via `pb.authStore.record?.id` null check with `toast.error`
  - `getFullList<Vaccinations>({ sort: "-date_administered" })` fetch
  - Maps each record to export shape: all 7 writable fields + `card_url` (2-arg `pb.files.getURL`, no token) + `created` + `updated`
  - Wraps in `{ exported_at, record_count, records }` envelope
  - Blob → `URL.createObjectURL` → anchor click → `URL.revokeObjectURL` download pattern
  - Filename: `wallecx-vaccinations-YYYY-MM-DD.json` via `dayjs().format("YYYY-MM-DD")`
  - `toast.success` on success, `toast.error` on failure, `isExporting = false` in finally
- Header row template replaced: single Button → `<div class="flex gap-2">` wrapping "Download records" (secondary, pi-download, :disabled/:loading="isExporting") + "Add vaccination" (primary, pi-plus)

## Threat Model Compliance

All 4 STRIDE threats from the plan's threat register are addressed:

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-04-03-01 | accept | card_url is a reference; binary still 403s without auth |
| T-04-03-02 | mitigate | PocketBase collection rule (BACK-03) enforces per-user isolation on getFullList |
| T-04-03-03 | mitigate | `isExporting` ref + :disabled + :loading on button |
| T-04-03-04 | mitigate | `pb.authStore.record?.id` null-safe early return with toast |

## Verification

- `npm run type-check` — exits 0
- `npm run test:unit` — 10/10 tests pass (vaccinationMapper.spec.ts)
- `grep "exportJson"` — 3 matches (function definition line 73, console.error line 119, @click binding line 180)
- `grep "isExporting"` — 6 matches (ref declaration, guard, setter, finally, :disabled, :loading)
- `grep "pb.files.getURL"` — 1 match, line 99: `pb.files.getURL(r, r.card)` — NO trailing `, {` (no token)
- `grep "pi-download"` — 1 match (line 175)
- `grep "getFullList"` — 2 functional matches (onMounted fetch + exportJson fetch)

## Deviations from Plan

None — plan executed exactly as written. `dayjs` and `onUnmounted` were already present (added by 04-01), so no duplicate imports were added.

## Known Stubs

None — the export function is fully wired. `card_url` is intentionally a reference URL (not embedded binary); this is the specified behavior per POLISH-03.

## Threat Flags

None — no new network endpoints or trust boundaries introduced beyond what the plan's threat model already covers.

## Self-Check

Files exist:
- `src/components/projects/wallecx/WallecxApp.vue` — FOUND (modified)

Commits:
- `916a4c8` — feat(04-03): add exportJson() and Download records button to WallecxApp.vue — FOUND

## Self-Check: PASSED
