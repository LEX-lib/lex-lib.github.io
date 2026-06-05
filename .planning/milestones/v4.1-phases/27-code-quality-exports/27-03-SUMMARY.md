---
phase: 27-code-quality-exports
plan: "03"
subsystem: expenses-export
tags: [export, expenses, vue]
key-files:
  modified:
    - src/components/projects/wallecx/ExpensesTab.vue
---

# Plan 27-03 Summary: Expenses JSON Export

## What Was Built

Added `exportJson()` async function and "Download records" button to `ExpensesTab.vue`.

- Same pattern as MembershipsTab (VaccinationsTab canonical)
- `getFullList<Expenses>({ sort: "-expense_date,-created", requestKey: "expenses-export" })`
- Envelope fields: id, amount, expense_date, category, description, notes, receipt_url, created, updated
- `receipt_url`: `r.receipt ? pb.files.getURL(r, r.receipt) : null` (receipt is protected=true per Phase 23)
- Filename: `wallecx-expenses-YYYY-MM-DD.json`
- Success toast: "Expenses exported."
- Header layout: `<h2>Expenses</h2>` stays LEFT; `flex gap-2` wraps only the right-side buttons (avoids Pitfall 5)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 4f988b4 | feat(27-02,27-03): add JSON export to MembershipsTab and ExpensesTab |

## Deviations

None.

## Self-Check: PASSED

- ✓ `import dayjs from 'dayjs'` added
- ✓ `const isExporting = ref(false)` added
- ✓ `exportJson()` with requestKey `expenses-export`
- ✓ `receipt_url` via pb.files.getURL ternary
- ✓ `<h2>` remains outside `flex gap-2` wrapper (Pitfall 5 avoided)
- ✓ `npm run type-check` exit 0
- ✓ `npm run test:unit` 49/49 green
