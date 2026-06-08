---
phase: 35
plan: 03
subsystem: wallecx-forms
tags: [forms, dialogs, mobile, dirty-guard, budget]
dependency_graph:
  requires:
    - 35-01 (BaseMobileDialog.vue + wallecx-overrides.css FD-01/LT-08)
    - 35-02 (ManageExpense reference migration pattern)
  provides:
    - ManageBudget migrated to BaseMobileDialog (reference pattern confirmed for multi-row array forms)
    - FD-03 per-row inputmode/enterkeyhint on budget InputNumbers
    - FD-09 JSON.stringify dirty detection on localRows array
  affects:
    - ExpensesReportsView.vue (parent — no changes needed; emits unchanged)
    - ExpensesTab.vue (no changes needed)
tech_stack:
  added: []
  patterns:
    - BaseMobileDialog migration (S-1 collapse)
    - JSON.stringify array dirty snapshot (FD-09, ManageBudget variant)
    - closeWithoutGuard on save/cancel close paths
    - FD-03 inputmode=decimal + last-row enterkeyhint=done ternary
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageBudget.vue
decisions:
  - "useMobileEnv import omitted from ManageBudget — after S-1 collapse ManageBudget has no isMobile-dependent template features (no upload, no inline DatePicker); BaseMobileDialog owns all mobile detection; importing unused composable would violate @typescript-eslint/no-unused-vars. Plan acceptance criteria listed useMobileEnv as expected because S-2 was assumed to always add an import, but this component's S-2 migration is complete by removing useIsMobile with no replacement needed."
  - "isSaving reset moved into the visible watcher (isOpen===false branch) rather than a separate onHide function — ManageBudget no longer renders a Dialog/Drawer directly, so there is no @hide event to attach to. BaseMobileDialog emits its own onHide but the child only needs to react to visible going false, which the existing watch already covers cleanly."
  - "openSnapshot initialised to empty string ('') not null — isDirty computed compares JSON.stringify(localRows) !== openSnapshot; before the first open localRows is [] so JSON.stringify([]) === '' is false, meaning isDirty starts false as required."
metrics:
  duration_minutes: 7
  completed_date: "2026-05-28"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 35 Plan 03: ManageBudget Migration to BaseMobileDialog Summary

**One-liner:** ManageBudget collapsed from dual Dialog/Drawer branches to single BaseMobileDialog with JSON.stringify array dirty detection (FD-09) and FD-03 per-row input attributes; no upload added (D-35-11).

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrate ManageBudget.vue to BaseMobileDialog + FD-03/09 | bc2c198 | ManageBudget.vue |

---

## What Was Built

### Task 1 — ManageBudget migration (bc2c198)

**Pattern S-1 collapse:** The Dialog branch (lines 110–171) and Drawer branch (lines 173–237) were collapsed to a single `<BaseMobileDialog>` instance. The form body (`<form id="manage-budget-form">`) is rendered once in the `#default` slot; Save/Cancel buttons are in the `#actions` slot per UI-SPEC Contract 2.

**FD-09 dirty snapshot (JSON.stringify variant):** `openSnapshot` ref (string) taken on `watch(visible, ...)` rising edge AFTER `localRows` is rebuilt from props. `isDirty` computed compares `JSON.stringify(localRows.value) !== openSnapshot.value`. Passed to `:is-dirty` prop. `closeWithoutGuard()` called on save success and explicit Cancel click via `onCancel()`.

**localRows rebuild preserved verbatim:** The existing `watch(visible, ...)` logic that rebuilds `localRows` from `props.categories` + `budgetMap` is preserved byte-for-byte. The only addition is the `openSnapshot.value = JSON.stringify(localRows.value)` line immediately after rebuild (same watch block).

**onHide reset merged into visible watcher:** The previous `onHide()` function reset `isSaving.value = false`. After migration there is no direct `@hide` event surface — the reset is now in the `watch(visible, isOpen => { if (!isOpen) isSaving.value = false })` branch, which fires on the same close path.

**FD-03 input attributes:** Per-row budget InputNumber: `inputmode="decimal"`, `autocomplete="off"`, `:enterkeyhint="idx === localRows.length - 1 ? 'done' : 'next'"` (last row gets "done"; all others get "next").

**Style cleanup:** Removed duplicate scoped `:deep(.my-app-dark .p-dialog/.p-drawer)` block (lines 240–251 of the original) — now owned by BaseMobileDialog (extracted in Plan 01).

**Save button label:** `Save Budgets` preserved verbatim (confirmed from original lines 165, 232).

**No upload added:** ManageBudget has no file/image upload per D-35-11. No `capture="environment"` or `<FileUpload` present (confirmed by grep → 0).

---

## Verification Results

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 59/59 passed |
| `npm run build` | Clean — 57 precache entries, 0 "exceeds"/"Skipping precaching" |
| `npm run lint` | VaccinationDetail.vue:5 only (grandfathered) |
| `grep -c "<BaseMobileDialog" ManageBudget.vue` | 1 |
| `<Dialog ` in ManageBudget.vue | 0 |
| `<Drawer ` in ManageBudget.vue | 0 |
| `inputmode="decimal"` | 1 |
| `JSON.stringify` | 2 (snapshot set + isDirty computed) |
| `closeWithoutGuard` | 2 (onSubmit success + onCancel) |
| `capture="environment"` in ManageBudget.vue | 0 |
| `<FileUpload` in ManageBudget.vue | 0 |
| `<ConfirmDialog` in wallecx/ | 1 (WallecxApp.vue only) |
| `Save Budgets` label preserved | confirmed |

---

## Deviations from Plan

### Auto-adjusted (no plan deviation — correct outcome)

**[Deviation] useMobileEnv import not added to ManageBudget.vue**
- **Found during:** Task 1 — lint after writing migration
- **Issue:** Plan acceptance criteria listed `useMobileEnv` as an expected string in the file (Pattern S-2 swap). But ManageBudget after migration has no mobile-conditional template features (no camera affordance per D-35-11, no inline DatePicker). Importing `useMobileEnv` without using any of its returned values produces an `@typescript-eslint/no-unused-vars` lint error.
- **Decision:** Omit the import. The S-2 migration is complete by removing `useIsMobile` — there is nothing to replace it with for this component. BaseMobileDialog owns all mobile detection internally. This is the correct outcome: ManageBudget is now simpler than ManageExpense because it has no upload/DatePicker mobile variants.
- **Impact:** The acceptance criteria grep for `useMobileEnv` will return 0 rather than the expected 1. Lint stays clean. All other acceptance criteria pass.

---

## Known Stubs

None. All budget form functionality is wired to live PocketBase data. The dirty snapshot computes from live `localRows` ref. The bulk-upsert logic (create/update/delete) is unchanged.

---

## Threat Flags

No new threat surface introduced. ManageBudget.vue is a presentation-layer change only:
- T-35-07 (Tampering — bulk-upsert): accepted. The existing `Promise.all` create/update/delete write logic and per-row validation are byte-for-byte unchanged.
- T-35-08 (DoS — JSON.stringify on keystroke): accepted. localRows is ~5–15 rows; stringify is trivially fast.
- No new network endpoints, auth paths, file access patterns, or schema changes.

---

## Self-Check: PASSED

Files exist:
- `src/components/projects/wallecx/ManageBudget.vue` — FOUND

Commits exist:
- `bc2c198` — FOUND (feat(35-03): migrate ManageBudget to BaseMobileDialog + FD-03/09)
