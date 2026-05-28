---
phase: 35
plan: 02
subsystem: wallecx-forms
tags: [forms, dialogs, mobile, datepicker, file-upload, dirty-guard]
dependency_graph:
  requires:
    - 35-01 (BaseMobileDialog.vue + wallecx-overrides.css FD-01/LT-08)
    - 33-02 (useMobileEnv composable)
  provides:
    - ManageExpense migrated to BaseMobileDialog (reference pattern for plans 03-05)
    - FD-04 inline DatePicker on 4 standalone expense sites
  affects:
    - ExpensesTab.vue (parent — no changes needed; emits unchanged)
    - ExpensesListView.vue (no changes needed)
tech_stack:
  added: []
  patterns:
    - BaseMobileDialog migration (S-1 collapse, S-2 composable swap)
    - onRawFileChange bridge (FD-05 camera/gallery → EXIF pipeline)
    - isDirty snapshot computed (FD-09)
    - closeWithoutGuard on save/cancel close paths
    - :inline="isMobile" DatePicker (FD-04)
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageExpense.vue
    - src/components/projects/wallecx/ExpensesToolbar.vue
    - src/components/projects/wallecx/ExpensesReportsView.vue
decisions:
  - "onHide pendingFile reset moved to watch(visible, ...) in ManageExpense — BaseMobileDialog relays @hide but component-local state reset is cleaner via explicit visible watcher with the same snapshot logic already present."
  - "snapshot.hasPendingFile always initialized to false on open — pendingFile is always null at dialog-open (reset in visible watcher); any file selection after open sets isDirty=true via pendingFile !== null check."
  - "Both camera and gallery inputs carry accept= attributes as client hints (T-35-05); onFileSelect MIME validation is the real security gate and remains unmodified."
metrics:
  duration_minutes: 20
  completed_date: "2026-05-28"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 35 Plan 02: ManageExpense Migration + Expense DatePicker Inline Summary

**One-liner:** ManageExpense collapsed from dual Dialog/Drawer branches to single BaseMobileDialog with FD-03/04/05/09 treatment; 4 standalone expense DatePicker sites switched to :inline=isMobile.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrate ManageExpense.vue to BaseMobileDialog + FD-03/04/05/09 | c58645e | ManageExpense.vue |
| 2 | Apply :inline="isMobile" to ExpensesToolbar + ExpensesReportsView DatePickers (FD-04) | ad245f0 | ExpensesToolbar.vue, ExpensesReportsView.vue |

---

## What Was Built

### Task 1 — ManageExpense migration (c58645e)

**Pattern S-1 collapse:** The ~265-line Dialog branch + ~130-line Drawer branch were collapsed to a single `<BaseMobileDialog>` instance. The form body (`<form id="manage-expense-form">`) is rendered exactly once in the `#default` slot; Save/Cancel buttons are in the `#actions` slot per UI-SPEC Contract 2.

**Pattern S-2 composable swap:** `useIsMobile` replaced by `useMobileEnv` destructured as `const { isMobile }`.

**FD-09 dirty snapshot:** `ExpenseSnapshot` interface + `snapshot` ref taken on `watch(visible, ...)` rising edge. `isDirty` computed compares amount, expenseDate (ISO string), category, description, notes, and `pendingFile !== null`. Passed to `:is-dirty` prop. `closeWithoutGuard()` called on save success and explicit Cancel click.

**FD-04 DatePicker inline:** Expense date DatePicker now uses `:inline="isMobile"` + `showButtonBar` (D-35-13 corrected — not `touchUI` which does not exist in PrimeVue 4.5.5).

**FD-05 two-affordance upload:** Mobile shows two label-wrapped hidden file inputs:
- "Take photo" — `accept="image/jpeg,image/png,image/webp"` + `capture="environment"` (rear camera)
- "Choose from gallery" — `accept="image/jpeg,image/png,image/webp,application/pdf"` (no capture)

Both route through the `onRawFileChange` bridge to the unchanged `onFileSelect` EXIF/compression pipeline. Desktop retains existing `<FileUpload>`.

**FD-03 input attributes:** Amount InputNumber: `inputmode="decimal" enterkeyhint="next" autocomplete="off"`. Description InputText: `inputmode="text" enterkeyhint="next" autocomplete="off"`. Notes Textarea: `inputmode="text" enterkeyhint="done" autocomplete="off"`. Category Select: `enterkeyhint="next"`.

**Style cleanup:** Removed duplicate scoped `:deep(.my-app-dark .p-dialog/.p-drawer)` block from ManageExpense.vue — now owned by BaseMobileDialog (extracted in Plan 01).

**Security invariant preserved (T-35-04):** `onFileSelect` body is byte-for-byte unchanged — 10 MB size cap, `allowedTypes` MIME allowlist, and EXIF canvas re-encode path all intact.

### Task 2 — ExpensesToolbar + ExpensesReportsView inline DatePickers (ad245f0)

**ExpensesToolbar.vue:** Added `useMobileEnv` import and `const { isMobile }` to script setup (file previously had no imports at all). Added `:inline="isMobile"` to both From and To DatePicker sites. The `@update:model-value="emit('update:dateFrom', ($event instanceof Date ? $event : null))"` cast patterns are preserved verbatim on both pickers (inline DatePicker still emits `Date | null`).

**ExpensesReportsView.vue:** Added `useMobileEnv` import and `const { isMobile }` declaration adjacent to `useChartTheme()`. Added `:inline="isMobile"` + `showButtonBar` to the `customFrom` and `customTo` DatePickers. No period/comparison/budget/chart logic changed.

---

## Verification Results

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 59/59 passed |
| `npm run build` | Clean — 57 precache entries, 0 "exceeds"/"Skipping precaching" |
| `npm run lint` | VaccinationDetail.vue:5 only (grandfathered) |
| `grep -c "<BaseMobileDialog" ManageExpense.vue` | 1 |
| `<Dialog ` in ManageExpense.vue | 0 |
| `<Drawer ` in ManageExpense.vue | 0 |
| `:inline="isMobile"` in ExpensesToolbar.vue | 2 |
| `:inline="isMobile"` in ExpensesReportsView.vue | 2 |
| `touchUI` in 3 modified files | 0 (comment only — "not touchUI") |
| `<ConfirmDialog` in wallecx/ | 1 (WallecxApp.vue only) |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None. All form functionality is wired to live data. The two mobile upload buttons route through the EXIF pipeline to PocketBase. The dirty snapshot computes from live field refs.

---

## Threat Flags

No new threat surface introduced. The three modified files are all presentation-layer changes:
- ManageExpense camera inputs carry `accept=` client hints only; `onFileSelect` validation is the real gate (T-35-04 mitigated, T-35-05 accepted, T-35-06 mitigated — all documented in plan threat register)
- ExpensesToolbar and ExpensesReportsView changes are DatePicker attribute-only; no new network endpoints, auth paths, or schema changes

---

## Self-Check: PASSED

Files exist:
- `src/components/projects/wallecx/ManageExpense.vue` — FOUND
- `src/components/projects/wallecx/ExpensesToolbar.vue` — FOUND
- `src/components/projects/wallecx/ExpensesReportsView.vue` — FOUND

Commits exist:
- `c58645e` — FOUND (feat(35-02): migrate ManageExpense to BaseMobileDialog + FD-03/04/05/09)
- `ad245f0` — FOUND (feat(35-02): apply :inline=isMobile to ExpensesToolbar + ExpensesReportsView DatePickers (FD-04))
