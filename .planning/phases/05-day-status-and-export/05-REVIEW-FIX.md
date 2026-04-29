---
phase: 05-day-status-and-export
fixed_at: 2026-04-29T00:00:00Z
review_path: .planning/phases/05-day-status-and-export/05-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-04-29
**Source review:** .planning/phases/05-day-status-and-export/05-REVIEW.md
**Iteration:** 1

## Summary

- Findings in scope: 6 (1 Critical, 5 Warning; Info findings excluded per fix_scope=critical_warning)
- Fixed: 6
- Skipped: 0

All six in-scope findings were applied cleanly. Type-check and lint passed with zero errors after all fixes.

---

## Fixed Issues

### CR-01: `setDayStatus` unguarded against concurrent invocations — duplicate-record race

**Files modified:** `src/views/LexTrackView.vue`
**Commit:** 892967a
**Applied fix:**
- Added `isSavingStatus = ref(false)` alongside the other `isSaving*` flags.
- `setDayStatus` now returns early if `isSavingStatus.value` is already true (drops concurrent calls).
- `isSavingStatus` is set true at function entry and reset to false in `finally` blocks on both branches.
- Template SelectButton now binds `:disabled="isLoading || isSavingStatus"`.

---

### WR-01: `setDayStatus` passes `date` in the PB update payload via `mapToCreateDayStatus`

**Files modified:** `src/views/LexTrackView.vue`
**Commit:** 892967a
**Applied fix:**
- Update branch now sends `{ status: value as DsuDayStatus['status'] }` directly instead of routing through `mapToCreateDayStatus`. The `date` field is no longer included in update payloads.

---

### WR-02: `setDayStatus` does not handle `value === undefined` — type gap with PrimeVue `allowEmpty`

**Files modified:** `src/views/LexTrackView.vue`
**Commit:** 892967a
**Applied fix:**
- Changed `if (value === null)` to `if (value == null)` to catch both `null` and `undefined` emitted by SelectButton.
- Updated JSDoc comment to reflect `== null` semantics.

---

### WR-03: `DAY_STATUS_OPTIONS` and `STATUS_FULL_NAMES` duplicate — and diverge from — the canonical constants

**Files modified:** `src/types/lextrack/dsu_day_status/constants.ts`, `src/views/LexTrackView.vue`
**Commit:** 7d31901
**Applied fix:**
- `constants.ts`: fixed `others: 'Other'` → `others: 'Others'` (canonical correction).
- `constants.ts`: added `DSU_DAY_STATUS_SHORT_LABELS` export mapping values to their abbreviated UI labels (SL, VL, Holiday, BL, Others), as the reviewer recommended to avoid inlining short labels.
- `LexTrackView.vue`: import `DSU_DAY_STATUS_VALUES`, `DSU_DAY_STATUS_LABELS`, `DSU_DAY_STATUS_SHORT_LABELS` from the shared constants module.
- Replaced hardcoded `DAY_STATUS_OPTIONS` array with `DSU_DAY_STATUS_VALUES.map(v => ({ label: DSU_DAY_STATUS_SHORT_LABELS[v], value: v }))`.
- Removed local `STATUS_FULL_NAMES` record; `statusFullName` computed now uses `DSU_DAY_STATUS_LABELS[dayStatus.value.status]` directly.

---

### WR-04: `document.execCommand('copy')` deprecated — ships without browser-compatibility guard or comment

**Files modified:** `src/views/LexTrackView.vue`
**Commit:** 51977c1
**Applied fix:**
- Wrapped the entire execCommand block in `if (typeof document.execCommand === 'function') { ... } else { toast.error(...) }`.
- Added a three-line deprecation comment noting the API status and replacement guidance.

---

### WR-05: `exportDay` swallows `navigator.clipboard.writeText` rejection with no logging

**Files modified:** `src/views/LexTrackView.vue`
**Commit:** 51977c1
**Applied fix:**
- Changed bare `catch {` to `catch (clipErr) {` in the `navigator.clipboard.writeText` try-block.
- Added `console.warn('[lextrack export] navigator.clipboard rejected, falling back to execCommand', clipErr)` before falling through.

---

## Skipped Issues

None — all in-scope findings were successfully fixed.

---

_Fixed: 2026-04-29_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
