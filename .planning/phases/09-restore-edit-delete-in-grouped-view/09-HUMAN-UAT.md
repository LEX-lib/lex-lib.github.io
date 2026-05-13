---
status: partial
phase: 09-restore-edit-delete-in-grouped-view
source: [09-VERIFICATION.md]
started: 2026-05-13T11:45:00Z
updated: 2026-05-13T11:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Edit pre-fill confirmation
expected: Opening a record's Edit dialog (via the new Edit button in the group drawer) shows ManageVaccination with all fields (vaccine_name, date_administered, dose_number, lot_number, vaccine_type, notes) pre-populated from the selected row's data
result: [pending]

### 2. Delete confirmation dialog and row removal
expected: Clicking the Delete button in the group drawer shows ConfirmDialog with the record's vaccine_name in plain text; confirming removes the row from both the panel and the card grid without any JavaScript errors
result: [pending]

### 3. Post-edit/delete Drawer refresh (stale-state WR-01/WR-02)
expected: Code review flagged that selectedGroup is a snapshot ref — after editing or deleting a record, the open Drawer may show stale data until closed. Team decision: acceptable for Phase 9 sign-off (close Drawer to refresh), or must WR-01/WR-02 fixes land first?
result: [pending]

### 4. Regression check — existing features
expected: Add vaccination button opens ManageVaccination for a new record; search filters the card grid; sort reorders groups; view toggle (list/grid) switches layout; all continue to work after CRUD operations from the drawer
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
