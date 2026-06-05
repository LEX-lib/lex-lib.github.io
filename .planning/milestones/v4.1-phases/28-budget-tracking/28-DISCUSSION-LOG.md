# Phase 28: Budget Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 28-budget-tracking
**Areas discussed:** Budget management UI, Budget visualization in Reports, Period filter for budget comparison

---

## Budget Management UI

### Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| Button in Reports tab header | A 'Manage Budgets' button in ExpensesReportsView — contextual, discovered where budgets are used | ✓ |
| Button in main Expenses tab header | Alongside 'Download records' and 'Add Expense' in ExpensesTab.vue — always visible | |
| Inline in category rows | Each category row has an edit icon — no separate dialog, higher friction for initial setup | |

**User's choice:** Button in Reports tab header

---

### Management UI Form

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog/Drawer showing all categories as a list | Dialog (desktop) / bottom Drawer (mobile) with all categories as rows, each with amount input and Monthly/Yearly toggle | ✓ |
| One category at a time via Popover | Pick a category → small popover for amount + type. Lighter but more steps | |
| You decide | Leave visual design to Claude | |

**User's choice:** Dialog/Drawer showing all categories as a list

---

### Category Source

| Option | Description | Selected |
|--------|-------------|----------|
| All categories from wallecx_expense_categories | Full user-defined category list; existing requestKey 'expense-categories-getFullList' | ✓ |
| Only categories from expense history | Derives from loaded expenses array — no extra PocketBase call | |
| You decide | Leave category sourcing to Claude | |

**User's choice:** All categories from wallecx_expense_categories

---

## Budget Visualization in Reports

### Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Separate section below the chart with progress bars | Keeps existing chart; additive budget section below with progress bar rows | ✓ |
| Replace existing chart with combined view | Current chart replaced by dual-bar actual/budget per category — bigger redesign | |
| Inline under each chart bar row | Custom HTML overlay over Chart.js canvas — high implementation complexity | |

**User's choice:** Separate section below the chart with progress bars

---

### Over/Under Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Colored text badge + amount | "Under by $X" (green) or "Over by $X" (red) using --color-status-* tokens | ✓ |
| Icon + percentage only | Green/red arrow + percentage — more compact, less precise | |
| You decide — match existing status token conventions | Leave visual treatment to Claude | |

**User's choice:** Colored text badge + amount

---

## Period Filter for Budget Comparison

### Period Gating

| Option | Description | Selected |
|--------|-------------|----------|
| Budget section only shows for matching periods | Monthly on 'this-month', yearly on 'this-year', Quarter/Custom hidden | ✓ |
| Always shown with pro-rating | Quarter = budget × 3, custom pro-rates by day count — complex math | |
| Always shown with 'reference only' note | Visible all periods but muted note for non-matching — potentially confusing | |

**User's choice:** Budget section only shows for matching periods (no pro-rating)

---

## Claude's Discretion

- Budget type per category: each category independently toggles M/Y — not a global mode
- Collection schema and field structure for `wallecx_expense_budgets`
- Save behavior in the management dialog (upsert pattern)
- New component structure (`ManageBudget.vue`)

## Deferred Ideas

- Monthly vs yearly area was skipped by user (not selected for discussion) — treated as Claude's discretion
- Budget alerts / push notifications (out of scope per REQUIREMENTS.md)
- Pro-rating for Quarter/Custom periods
