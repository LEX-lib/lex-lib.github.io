---
status: partial
phase: 08-view-toggle
source: [08-VERIFICATION.md]
started: "2026-05-13T11:05:00.000Z"
updated: "2026-05-13T11:05:00.000Z"
---

## Current Test

[awaiting human testing]

## Tests

### 1. Toggle cycles layout visually
expected: Clicking the toggle Button (to the right of the sort Select) switches the grouped-cards grid from 2-column to 1-column and back. The Button's icon shows the destination mode (list icon in grid mode, grid icon in list mode).
result: [pending]

### 2. sessionStorage persists within tab
expected: Switch to list view, navigate to another route (e.g. home), then return to /projects/wallecx — the list view should still be active (sessionStorage persisted within the tab session).
result: [pending]

### 3. sessionStorage cleared on tab close
expected: Switch to list view, close the browser tab entirely, reopen the app — the default grid view should appear (sessionStorage is cleared on tab close, per SC #3).
result: [pending]

### 4. Toggle hidden in loading / empty / no-results states
expected: The toggle Button is absent from the DOM (not just hidden) during: (a) initial loading skeleton, (b) zero-records empty state, (c) no-search-results empty state. The :show-toggle condition `!isLoading && records.length > 0 && displayedGroups.length > 0` enforces this.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
