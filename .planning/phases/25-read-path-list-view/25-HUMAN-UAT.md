---
status: partial
phase: 25-read-path-list-view
source: [25-VERIFICATION.md]
started: 2026-05-21T00:00:00Z
updated: 2026-05-21T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Tap an expense row's paperclip and confirm AttachmentPreview opens with the correct MIME branch (image / PDF / download)
expected: Image receipts render via `<img>`; PDF receipts render via vue-pdf-embed; unknown types show download fallback. Token from `pb.files.getToken()` makes the URL accessible.
result: [pending]

### 2. Verify Dialog (desktop >=640px) vs Drawer position='bottom' (mobile <640px) responsive switch for receipt preview
expected: Resizing the viewport across the 640px breakpoint causes the preview wrapper to swap; both render AttachmentPreview correctly.
result: [pending]

### 3. Sort mode persists across reloads under `wallecx:expense-sort`
expected: Change sort to 'amount-high', reload the page, and confirm the list returns in amount-high order before any user interaction.
result: [pending]

### 4. Search input filters reactively without debounce; clearing the input restores the full list
expected: Typing in the search box filters on every keystroke (no perceived delay); clicking the X clears the field and restores the list.
result: [pending]

### 5. Category MultiSelect chip pill filters and 'Clear filters' restores all expenses
expected: Selecting one or more category chips narrows the list; clearing chips (or clicking Clear filters when zero results) returns all loaded expenses.
result: [pending]

### 6. Date-range picker (From/To) filters inclusively and does not issue new PocketBase queries
expected: Setting From=2026-05-01 and To=2026-05-15 shows only expense_date values within that inclusive range; Network tab shows no additional /api/collections/wallecx_expenses/records calls.
result: [pending]

### 7. Confirm Delete dialog appears via the shell-level ConfirmDialog and successful delete shows 'Expense deleted.' toast
expected: Trash icon click -> ConfirmDialog (rendered at WallecxApp.vue shell) -> 'Delete Expense' button calls pb.delete -> success toast -> row removed from list.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
