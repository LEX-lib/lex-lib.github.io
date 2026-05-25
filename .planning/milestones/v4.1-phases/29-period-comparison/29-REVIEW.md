---
phase: 29-period-comparison
reviewed: 2026-05-25T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/components/projects/wallecx/ExpensesReportsView.vue
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 29: Code Review Report

**Reviewed:** 2026-05-25
**Depth:** standard
**Files Reviewed:** 1
**Status:** clean

## Summary

Reviewed the Phase 29 additions to `ExpensesReportsView.vue` (script lines 92-188, template lines 485-498) introduced by commits `dd29bf7` and `8bbd567`. The implementation is correct, well-commented, and adheres to every locked decision (D-01 through D-07) and to the Phase 29 patterns map.

**Correctness verified:**

- **D-01 (Month + Quarter only):** `previousPeriodRange` returns `null` for `this-year` and `custom`, and `visibleComparison` short-circuits on `null` so the template `v-if` keeps the DOM absent for excluded periods (mirrors Phase 28 D-09 gating shape).
- **D-02 (placement):** Template order is Grand Total hero → comparison line → Manage Budgets → chart → Budget vs Actual — matches the spec exactly.
- **D-03 (format):** `{arrow} ${absolute} ({±percentage}%) vs last {period}` is produced by `comparisonText`. Unicode arrows (`↑` / `↓` / `—`) per spec; `Math.round` used for whole-integer percentage; verbatim `'last month'` / `'last quarter'` labels.
- **D-04 (color semantics):** `comparisonColor` maps up=error / down=success / flat=muted via design tokens — consistent with Phase 28 Budget vs Actual.
- **D-05 (zero prior):** Percentage is `null` when `previousPeriodTotal === 0`; `comparisonText` switches to the `"(no prior spend)"` branch and omits the percentage, avoiding `Infinity%`.
- **D-06 (zero current):** Naturally absent because the comparison line lives inside `<template v-else>` (STATE 4); STATE 3 short-circuits before this template branch.
- **D-07 (both zero):** Guarded by the `grandTotal === 0 && previousPeriodTotal === 0` early return in `visibleComparison`.

**Invariants honored:**

- No new PocketBase queries — calculation is 100% client-side from `props.expenses`, preserving Phase 26 locked requestKeys and the shell-owns-data invariant.
- `dayjs` `quarterOfYear` plugin is active transitively via the existing `period.ts` import (verified at `src/lib/wallecx/period.ts:2-8`), so the inline `subtract(1, 'quarter') + startOf('quarter')` derivation is safe.
- Same `YYYY-MM-DD` string-comparison idiom as `periodExpenses` — no `Date` object comparisons, no timezone hazards.
- U+2212 minus (`−`) used at line 176 for the negative percentage sign, matching the typographic convention called out by 29-PATTERNS.md anti-pattern #6.
- Color tokens via `var(--color-status-error/success)` / `var(--color-typo-muted)` — Tailwind status utilities correctly avoided.
- `role="status"` plus `aria-label` from `comparisonAriaLabel` provides screen-reader-appropriate output (uses semantic "up/down" words and "percent", not Unicode arrows or `%`).
- No reactivity hazards: `props.expenses` is treated as read-only; computeds derive fresh values via `.filter` and `.reduce` (no in-place mutation).

**Items deliberately not flagged:**

- The em-dash `—` (U+2014) in `comparisonText`'s flat branch matches D-03 example 3 (`— No change vs last month`).
- `comparisonArrow` is currently called only from `comparisonText` (the template binds color/text/aria-label directly, not the arrow). The function is small and its purpose is symmetric with the other helpers; keeping it exported as a private helper is reasonable for readability and is not dead code.
- The percentage sign uses `>= 0` (line 176) where 29-PATTERNS.md example uses `> 0`. The only behavioral difference is when `Math.round((delta/prev)*100)` rounds to exactly `0` while direction is non-flat (e.g., delta = $0.49 against $1000 prior). The current `>= 0` produces `+0%` which is semantically truthful for an upward delta and is a defensible (arguably preferable) deviation from the patterns example. Treating as Info below for visibility, not as a bug.

No Critical or Warning issues found. Two Info-level observations follow.

## Info

### IN-01: `>= 0` vs `> 0` for positive sign selection

**File:** `src/components/projects/wallecx/ExpensesReportsView.vue:176`
**Issue:** The patterns doc (`29-PATTERNS.md` lines 221 and 371) shows `const sign = c.percentage > 0 ? '+' : '−'`, while the implementation uses `>= 0`. The two diverge only in the edge case where `Math.round` produces `0` for a non-flat direction (e.g., this period $1000.49 vs prior $1000.00 → delta > 0, percentage rounds to 0). The implementation will render `+0%` with an `↑` arrow; the pattern example would render `−0%`. Either is defensible; `+0%` is arguably more semantically honest because the direction is upward. Flagging only because the choice differs from the cited reference — no code change needed unless the team wants strict parity with the patterns doc.
**Fix:** None required. If the team prefers strict parity with `29-PATTERNS.md`, change `c.percentage >= 0` to `c.percentage > 0` on line 176. Otherwise update the patterns doc to match the implementation in a future maintenance pass.

### IN-02: `comparisonArrow` helper only called from `comparisonText`

**File:** `src/components/projects/wallecx/ExpensesReportsView.vue:159-163`
**Issue:** `comparisonArrow` is currently invoked only once, from inside `comparisonText` (line 169). The template binds `comparisonText`, `comparisonColor`, and `comparisonAriaLabel` directly but never `comparisonArrow`. The function is not dead — it's used — but a future reader may wonder why the arrow lookup is broken out.
**Fix:** None required. The current factoring is reasonable: keeping arrow selection symmetric with `comparisonColor` makes the direction-to-glyph mapping discoverable in one place, and the helper is positioned for reuse if the template ever wants to render the arrow with separate styling (e.g., bolder arrow + lighter text). If brevity is preferred, the arrow lookup could be inlined into `comparisonText` to drop ~5 lines, but the current factoring is more maintainable.

---

_Reviewed: 2026-05-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
