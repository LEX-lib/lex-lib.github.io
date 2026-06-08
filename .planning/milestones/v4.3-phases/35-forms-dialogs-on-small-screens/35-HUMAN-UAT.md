---
status: partial
phase: 35-forms-dialogs-on-small-screens
source: [35-VERIFICATION.md, 35-06-PLAN.md]
started: 2026-05-28
updated: 2026-05-28
---

## Current Test

[real-device confirmation of items 1–3 (iOS no-zoom, sticky bar above keyboard, camera launch) carried forward to Phase 38 Mobile UAT Sweep]

## Tests

### 1. iOS no-zoom on input focus (FD-01 / NFR-IOS-NO-ZOOM)
expected: Tapping any input in a Manage dialog on real iOS Safari does NOT trigger page-level zoom (font-size ≥ 16px on .p-inputtext et al keeps the page at zoom 1.0).
result: passed at 390px DevTools emulation 2026-05-28 (16px rule confirmed via grep + visual). Real-device confirmation carried to Phase 38.

### 2. Sticky Save/Cancel bar above virtual keyboard (LT-08 / FD-06)
expected: Save/Cancel bar remains visible above the OS virtual keyboard on iOS Safari + Android Chrome; focused input scrolled into view via scrollIntoView({block:'center'}).
result: passed at emulation 2026-05-28. Real-device keyboard behavior (iOS overlay vs Android resizes-content) carried to Phase 38.

### 3. Camera + gallery two-affordance (FD-05)
expected: ManageExpense / ManageMembership / ManageVaccination each show "Take photo" (capture="environment" → rear camera) AND "Choose from gallery" controls; both feed the existing EXIF/compression/WebP pipeline. ManageBudget has no upload.
result: passed at emulation 2026-05-28 (buttons render, files feed onFileSelect). Real-device camera launch carried to Phase 38.

### 4. DatePicker popup overlay on mobile (FD-04)
expected: All 5 DatePicker sites (ManageExpense date, ExpensesToolbar From/To, ExpensesReportsView custom range, ManageVaccination date, ManageMembership expiry) open as a tap-to-open popup overlay on mobile (NOT an inline always-visible calendar). The 16px no-zoom rule keeps the popup usable.
result: passed at 375×667 emulation 2026-05-28 AFTER the inline→popup revert (commit f8eb9c7). Initial :inline="isMobile" approach (D-35-13 first correction) was rejected during human-verify because inline calendars crowded the always-rendered Expenses filter toolbar + Reports custom range. D-35-13 RE-CORRECTED to popup-everywhere.

### 5. Dirty-state discard guard (FD-09 / NFR-DRAWER-DIRTY-GUARD)
expected: Backdrop tap / swipe-down / Esc on a mobile Drawer containing a CRUD form with changes prompts "Discard changes?" via the shell ConfirmDialog singleton. Without changes the dialog closes immediately. Save and explicit Cancel bypass the guard via closeWithoutGuard().
result: passed at emulation 2026-05-28. Real-device gesture confirmation (touch swipe-down on iOS, back-gesture on Android) carried to Phase 38.

### 6. Invariants — ColorPicker round-trip + Vaccination date pre-fill
expected: In ManageMembership, picking a color, saving, and reopening shows the same color (direct v-model #8135 + card_color no-hash). In ManageVaccination Edit mode, Date Administered pre-fills with the record's date (direct v-model #8191 + [visible, record] {immediate:true} merged watcher per WR-02).
result: passed at emulation 2026-05-28 (membershipMapper.spec.ts 11/11 green; grep confirms invariants).

### 7. Desktop renders modals (regression check)
expected: At a full-width desktop browser, the 4 Manage dialogs render as centered PrimeVue Dialog modals (not bottom Drawers); no sticky action bar CSS; no inline DatePicker.
result: passed at emulation 2026-05-28.

## Summary

total: 7
passed: 7
issues: 0
pending: 0 (3 carried forward to Phase 38 for real-device reaffirmation)
skipped: 0
blocked: 0

## Gaps

None blocking. Items 1–3 (iOS no-zoom / sticky-above-real-keyboard / actual camera launch) require real iPhone + Android hardware to fully confirm and are by design deferred to **Phase 38 Mobile UAT Sweep** — the device matrix phase. The emulation walkthrough at 375×667 + 390×844 passed and the code/CSS audit (35-06-AUDIT.md) is clean.

## Deviations Recorded

- **FD-04 inline → popup revert (commit f8eb9c7).** During this checkpoint, `:inline="isMobile"` on the always-rendered Expenses filter toolbar (From/To) + Reports custom range produced two huge always-visible inline calendars that crowded the list before any data showed. User chose popup-everywhere. D-35-13 RE-CORRECTED in 35-CONTEXT.md; ROADMAP + REQUIREMENTS FD-04 updated accordingly.
- **WR-01 + WR-02 fixes (commit 1cd0d46).** Code review found isSaving wasn't reset on dismiss in ManageExpense/Membership/Vaccination (stuck Save button after a mid-save discard); fixed by mirroring ManageBudget's onHide pattern. Also merged ManageVaccination's snapshot + seed watchers into one to remove registration-order fragility.
