---
status: partial
phase: 28-budget-tracking
source: [28-VERIFICATION.md]
started: 2026-05-25T00:00:00.000Z
updated: 2026-05-25T00:00:00.000Z
---

## Current Test

[awaiting human testing — 9 scenarios pending]

## Tests

### 1. Scenario 1 — Set a monthly budget (RPT-01 + per-user isolation + persistence)
expected: |
  1. Log in as a test user with at least 2-3 expenses across at least 2 categories (e.g., Food, Transport) in the current month.
  2. Open Wallecx → Expenses tab → Reports sub-tab → ensure period is "This Month".
  3. Confirm existing chart renders and Grand Total shows. Confirm Manage Budgets button is visible just below the Grand Total hero (right-aligned).
  4. Click Manage Budgets — Dialog should open on desktop / bottom Drawer on mobile (test both viewport widths).
  5. Confirm every category from wallecx_expense_categories appears as a row.
  6. Enter 1000 for Food (Monthly toggle), 500 for Transport (Monthly toggle).
  7. Click Save Budgets → toast "Budgets saved." should fire and dialog closes.
  8. Refresh the page (Ctrl/Cmd-R). Open Manage Budgets again — Food and Transport rows should be pre-populated with 1000 and 500.
  9. Confirm the "Budget vs Actual" section below the chart shows TWO rows (Food + Transport) with progress bars, actual amounts, and Under/Over badges.
result: pending

### 2. Scenario 2 — Set a yearly budget for a third category (RPT-01 yearly type + period switching)
expected: |
  1. Switch period to "This Year".
  2. Open Manage Budgets. Confirm Food still shows 1000 (monthly) and Transport 500 (monthly).
  3. For a third category (e.g., Entertainment), enter 12000 and toggle Yearly. Save.
  4. Confirm Budget vs Actual section now shows ONLY the Entertainment row (the only yearly budget).
  5. Switch period back to "This Month" → confirm Budget vs Actual section shows only Food + Transport (monthly only).
result: pending

### 3. Scenario 3 — Quarter and Custom periods hide the section entirely (D-09)
expected: |
  1. Switch period to "This Quarter" → confirm Budget vs Actual section is NOT rendered (no heading, no rows, no empty space placeholder).
  2. Switch period to "Custom", pick a valid range → confirm the section is NOT rendered.
result: pending

### 4. Scenario 4 — Categories without a budget are omitted (D-06 / RPT-02)
expected: |
  Confirm any category for which you did NOT set a budget does NOT appear in the Budget vs Actual section (no empty bars, no placeholder rows for unbudgeted categories).
result: pending

### 5. Scenario 5 — Delete by clearing InputNumber to zero
expected: |
  1. Open Manage Budgets → clear the Food InputNumber (delete the value so it's blank).
  2. Click Save Budgets → toast fires, dialog closes.
  3. Confirm Food no longer appears in Budget vs Actual section.
result: pending

### 6. Scenario 6 — Over/Under badge color coding (RPT-02 visual feedback)
expected: |
  1. If Food monthly actual exceeds its budget: progress bar fills to 100% in --color-status-error (red), badge shows "Over by $X" in red.
  2. If Food actual is below budget: bar is --color-status-success (green), badge shows "Under by $X" in green.
  3. If exactly equal: badge shows "On budget" in green.
result: pending

### 7. Scenario 7 — Per-user isolation (RPT-01 security)
expected: |
  1. Log out, log in as a different user.
  2. Confirm THIS user sees NO budgets (or their own, if they have any) — never the previous user's budgets.
result: pending

### 8. Scenario 8 — Dark mode rendering (Phase 22 invariant)
expected: |
  1. Toggle dark mode via the NavBar.
  2. Re-open Manage Budgets → verify Dialog/Drawer background uses var(--color-surface-card), text is legible.
  3. Verify Budget vs Actual section badges and progress bars render correctly in dark mode.
result: pending

### 9. Checkpoint A — PocketBase wallecx_expense_budgets collection exists with v0.29.3 rules
expected: |
  Confirm in the PocketBase Admin UI that:
  - Collection `wallecx_expense_budgets` exists (Base collection, exact lowercase name with underscores).
  - Fields: `user` (Relation → users, required, max select 1, cascade delete=false), `category` (Text required min 1 max 200), `budget_type` (Text required, pattern `^(monthly|yearly)$`), `amount` (Number required min 0).
  - API Rules (PocketBase v0.29.3 syntax with @request.body.user):
    * List rule: `user = @request.auth.id`
    * View rule: `user = @request.auth.id`
    * Create rule: `@request.auth.id != "" && @request.body.user = @request.auth.id`
    * Update rule: `user = @request.auth.id`
    * Delete rule: `user = @request.auth.id`
result: pending (user confirmed during Plan 28-01 Task 1 via "approved" — re-surfaced here for milestone-close verification)

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps
