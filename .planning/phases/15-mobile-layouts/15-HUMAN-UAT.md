---
status: partial
phase: 15-mobile-layouts
source: [15-VERIFICATION.md]
started: 2026-05-14T00:00:00Z
updated: 2026-05-14T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. 375px viewport — no horizontal scroll
expected: On a real 375px-wide iPhone viewport, all Wallecx screens (both tab grids, both CRUD dialogs, group detail drawer, scan overlay, empty states) can be used without horizontal scrolling or content clipping
result: [pending]

### 2. Notched iPhone — safe area padding
expected: On a notched iPhone (notch or Dynamic Island), the nav bar clears the notch via env(safe-area-inset-top), and card content clears the home indicator via env(safe-area-inset-bottom)
result: [pending]

### 3. iOS keyboard — dialog scrolls within bounds
expected: Opening a CRUD dialog (ManageVaccination or ManageMembership) on an iPhone and tapping into a text field causes the form to scroll within the dialog (max-height 80dvh, overflow-y auto) without pushing content off-screen; Save/Cancel buttons remain reachable without dismissing the keyboard
result: [pending]

### 4. Install banner — appears once in Safari, dismissed by X
expected: Visiting Wallecx in iOS Safari (not installed) shows the amber share-icon banner; tapping X dismisses it; refreshing or revisiting does not show it again
result: [pending]

### 5. Install banner — hidden in standalone mode
expected: After installing Wallecx to home screen and opening from there, the install banner does not appear (standalone mode detected correctly)
result: [pending]

### 6. Dialog submit button height — default PrimeVue Button ≥44px
expected: Default-size (not size="small") PrimeVue Buttons in CRUD dialogs render at 44px or taller on a real device (PrimeVue Aura theme default)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
