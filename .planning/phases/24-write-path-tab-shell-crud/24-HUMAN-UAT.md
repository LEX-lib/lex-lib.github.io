---
status: partial
phase: 24-write-path-tab-shell-crud
source: [24-VERIFICATION.md]
started: 2026-05-21T13:20:00Z
updated: 2026-05-21T13:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end expense create
expected: Fill form (Amount, Date, Category, Description), click "Add Expense" → "Expense added." toast fires and dialog closes; record prepends in expenses array
result: [pending]

### 2. Category persistence
expected: Type a new category name not in dropdown list (e.g. "Gym"), submit → on next dialog open "Gym" appears in category dropdown options
result: [pending]

### 3. EXIF strip confirmation
expected: Select a phone JPEG as receipt → "Location data removed." toast appears; uploaded file is smaller than original and has no GPS metadata
result: [pending]

### 4. Dark mode rendering
expected: Toggle dark mode → ManageExpense dialog/drawer renders with dark surface background, no white bleed on panel or content area
result: [pending]

### 5. isSaving double-submit guard
expected: Open edit dialog, fill form, click "Save Changes" twice rapidly → only single PATCH fires; button shows loading spinner on second click and is unresponsive
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
