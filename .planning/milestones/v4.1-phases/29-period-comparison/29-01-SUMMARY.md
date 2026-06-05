---
phase: 29-period-comparison
plan: 01
subsystem: ui
tags: [vue, primevue, reports, period-comparison, chart, wallecx]

# Dependency graph
requires:
  - phase: 26-period-selector
    provides: period.ts (getPeriodRange, formatPeriodLabel, Period type, dayjs quarterOfYear plugin)
  - phase: 24-expense-tracking
    provides: ExpensesReportsView shell + Grand Total hero + props.expenses
  - phase: 28-budget-tracking
    provides: Period-gated section pattern (visibleBudgets) + STATE 4 anchor for D-02 placement
provides:
  - Period-over-period comparison line in STATE 4 of ExpensesReportsView (RPT-03)
  - Reusable comparison shape: ComparisonResult interface + 4 helpers (color/arrow/text/aria)
  - Client-side previous-period derivation (no new PocketBase queries)
affects: [future year-over-year / custom-range comparison extensions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline dayjs.subtract(1, unit).startOf/endOf(unit) for previous-period range (no new period.ts helper)"
    - "Client-side YYYY-MM-DD string-comparison filter on already-loaded props.expenses (Phase 26 invariant)"
    - "Period-gated computed returning null for excluded periods + both-zero edge case (D-01, D-07)"
    - "U+2212 minus character for negative percentage (typographic consistency with period.ts en-dash)"
    - "role='status' with descriptive aria-label for screen readers"
    - "Inline :style binding with CSS custom property tokens (no Tailwind status colors — dark-mode swap)"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/ExpensesReportsView.vue

key-decisions:
  - "Inline previousPeriodRange computed (Option A from 29-PATTERNS.md Unit 1) — no new helper in period.ts; 8 lines is lower friction than a new exported helper + tests"
  - "v-if (DOM absent) for excluded periods, not v-show — matches Phase 28 D-09 hiding pattern"
  - "ComparisonResult.percentage typed as number | null (null sentinel for zero prior period) rather than a separate flag"
  - "Math.round whole-integer percentage (no decimals) — matches D-03 format literal '+23%'"

patterns-established:
  - "Comparison payload pattern: typed result object (direction/absoluteDelta/percentage/previousLabel) + companion helper functions for presentation (color/arrow/text/aria-label)"
  - "Null-sentinel computed for period-gated UI: returns null when section should hide; template uses v-if !== null"

requirements-addressed: [RPT-03]

# Metrics
duration: ~6min (Tasks 1-2 deterministic edits; Task 3 auto-approved checkpoint)
completed: 2026-05-25
---

# Phase 29 Plan 01: Period Comparison Summary

**Add a period-over-period comparison line to `ExpensesReportsView.vue` STATE 4 — single inline span between the Grand Total hero and the Phase 28 Manage Budgets button — showing how the user's current-period spending compares to the previous equivalent period (last month or last quarter), with color-coded direction and graceful zero-prior handling.**

## Performance

- **Duration:** ~6 min (Tasks 1-2 deterministic edits; Task 3 auto-approved via `workflow.auto_advance: true`)
- **Completed:** 2026-05-25
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint, auto-approved)
- **Files modified:** 1 (single-file modification per plan scope)
- **Lines added:** 113 (+98 script, +15 template)

## Accomplishments

- `ExpensesReportsView.vue` script extended (+98 lines): `ComparisonResult` interface + 3 computeds (`previousPeriodRange`, `previousPeriodTotal`, `visibleComparison`) + 4 helper functions (`comparisonColor`, `comparisonArrow`, `comparisonText`, `comparisonAriaLabel`).
- `ExpensesReportsView.vue` template extended (+15 lines): single `<div v-if="visibleComparison !== null">` block inserted between the Grand Total hero closing `</div>` and the Phase 28 Manage Budgets `<!-- ... -->` comment (D-02 ordering preserved).
- All grep-based acceptance criteria across Tasks 1-2 satisfied (interface/computeds/helpers counts; absence of Tailwind status colors; presence of CSS custom property tokens; `role="status"`; ARIA binding).
- `npm run type-check` exits 0.
- `npm run lint` reports zero NEW errors (pre-existing `VaccinationDetail.vue:5` deferred since Phase 28 Plan 01).
- `npm run test:unit` reports 49/49 across 5 files.

## Edits Applied

### Task 1 — `src/components/projects/wallecx/ExpensesReportsView.vue` script (+98 lines)

Single Edit inserted between `periodNameLabel` (ends line 90) and the existing `// === Phase 28 — Budget vs Actual integration ===` section header (line 92), introducing the `// === Phase 29 — Period Comparison (D-01 through D-07) ===` block:

1. **`ComparisonResult` interface** — `direction` ('up' | 'down' | 'flat'), `absoluteDelta` (number), `percentage` (number | null sentinel for D-05 zero prior), `previousLabel` ('last month' | 'last quarter').
2. **`previousPeriodRange` computed** — inline `dayjs().subtract(1, 'month' | 'quarter')` derivation with `.startOf()` / `.endOf()`; returns `null` for `this-year` and `custom` (D-01 hiding gate). No `dayjs.extend(quarterOfYear)` — already extended in period.ts (anti-pattern #7 honored).
3. **`previousPeriodTotal` computed** — YYYY-MM-DD string-comparison filter on `props.expenses` + `reduce` sum (Phase 26 invariant: client-side filter on already-loaded data, no new PocketBase query).
4. **`visibleComparison` computed** — null gate for excluded periods (D-01); null gate when both periods are $0 (D-07); otherwise builds `ComparisonResult` with `direction` derived from delta sign, `percentage` set to `null` when prior is $0 (D-05) else `Math.round((delta / prior) * 100)`.
5. **`comparisonColor` helper** — returns `var(--color-status-error)` for up, `var(--color-status-success)` for down, `var(--color-typo-muted)` for flat (D-04).
6. **`comparisonArrow` helper** — `↑` / `↓` / `—`.
7. **`comparisonText` helper** — builds the display string: `↑ $X (+Y%) vs last month/quarter` normally; `↑ $X vs last month/quarter (no prior spend)` when prior is $0 (D-05); `— No change vs last month/quarter` for flat. **Uses U+2212 minus character `−` for negative percentage**, not ASCII hyphen-minus (anti-pattern #6 honored).
8. **`comparisonAriaLabel` helper** — descriptive screen-reader announcement keyed off direction and percentage availability.

### Task 2 — `src/components/projects/wallecx/ExpensesReportsView.vue` template (+15 lines)

Single Edit inserted between the Grand Total hero closing `</div>` (line 385) and the Phase 28 Manage Budgets `<!-- ... -->` comment (line 387):

```html
<!-- Phase 29 — Period-over-period comparison line (D-01 through D-07) -->
<div
  v-if="visibleComparison !== null"
  class="flex justify-center mt-1 mb-4"
  role="status"
  :aria-label="comparisonAriaLabel(visibleComparison)"
>
  <span
    class="text-sm font-medium"
    :style="{ color: comparisonColor(visibleComparison) }"
  >
    {{ comparisonText(visibleComparison) }}
  </span>
</div>
```

D-02 ordering preserved: Grand Total hero → comparison line → Manage Budgets button → chart → Budget vs Actual section.

## Verification Gates Passed

| Gate | Result |
|------|--------|
| `npm run type-check` | exit 0 |
| `npm run lint` | exit 0 NEW errors (pre-existing `VaccinationDetail.vue:5` remains deferred) |
| `npm run test:unit` | 49/49 across 5 files |
| Task 1 grep acceptance criteria (17) | All pass — interface/computeds/helpers counts, CSS token usage, absence of `dayjs.extend`, single `getFullList` |
| Task 2 grep acceptance criteria (15) | All pass — `v-if="visibleComparison !== null"`, `role="status"`, ARIA binding, `comparisonColor/Text/AriaLabel` template usage, zero Tailwind status-color utilities |

## Locked Invariants Honored

| Decision | Honored |
|----------|---------|
| **D-01** Coverage: Month + Quarter only (year + custom hidden) | `previousPeriodRange` returns `null` for `this-year` and `custom`; `visibleComparison` short-circuits to `null` → template `v-if` omits DOM entirely |
| **D-02** Placement: inline below Grand Total hero, BEFORE Manage Budgets button | Template block inserted exactly between hero closing `</div>` and Phase 28 comment |
| **D-03** Format: `{arrow} ${absolute} (±Y%) vs last {period}` | `comparisonText` returns literal `↑ $230 (+23%) vs last month` shape |
| **D-04** Color: red for up, green for down, muted for flat | `comparisonColor` returns `var(--color-status-error/success/typo-muted)` |
| **D-05** Zero prior: omit percentage, append `(no prior spend)` | `percentage` is `null` when `previousPeriodTotal === 0`; `comparisonText` branches accordingly |
| **D-06** Zero current (STATE 3): line auto-hidden | Template lives inside STATE 4 `<template v-else>` — STATE 3 sibling never renders it |
| **D-07** Both zero: line hidden | `visibleComparison` returns `null` when `grandTotal === 0 && previousPeriodTotal === 0` |

## Anti-Pattern Compliance

| Anti-Pattern | Compliance |
|--------------|-----------|
| #4 No Tailwind status-color utilities (`text-red-500`, `text-green-600`) | `grep -cE "text-(red|green|amber|yellow)-[0-9]+"` returns 0; only `:style` with CSS custom properties |
| #6 U+2212 minus character (not ASCII hyphen-minus) | Literal `−` in `comparisonText` — UTF-8 bytes E2 88 92 |
| #7 No `dayjs.extend(quarterOfYear)` duplication | `grep -c "dayjs.extend"` returns 0 in ExpensesReportsView.vue (already extended in period.ts) |
| #8 No changes to `ExpensesTab.vue` | Confirmed via `git diff` — only `ExpensesReportsView.vue` modified |
| New PocketBase queries | `grep -c "getFullList"` returns 1 (unchanged from Phase 28) — client-side derivation only |

## Task Commits

1. **Task 1: Add Phase 29 computeds + helpers** — `dd29bf7` (feat)
2. **Task 2: Insert comparison line in STATE 4 template** — `8bbd567` (feat)
3. **Task 3: Human verification checkpoint** — no commit (auto-approved by `workflow.auto_advance: true`)

**Plan metadata commit:** pending (this SUMMARY).

## Human Verification (Task 3) — Auto-Approved

Task 3 was a `checkpoint:human-verify` gate listing 7 end-to-end scenarios:

1. **This Month with positive delta** — `↑ $X (+Y%) vs last month` in red.
2. **This Month with negative delta** — `↓ $X (−Y%) vs last month` in green (U+2212 minus).
3. **This Month with $0 prior** — `↑ $X vs last month (no prior spend)`, no percentage.
4. **This Quarter vs last quarter** — `vs last quarter` literal copy (not "Q1 2026").
5. **Year and Custom periods hide the line** — DOM absent (not `display:none`).
6. **STATE 3 (empty period) auto-hides** — comparison line absent under STATE 3 sibling.
7. **Dark mode rendering** — CSS custom properties swap correctly; no washed-out hex values.

**Disposition:** Auto-approved by `workflow.auto_advance: true` config + `--auto` flag — the global preference captures user intent for autonomous progress. **The 7 scenarios will be re-surfaced as `29-HUMAN-UAT.md` by the gsd-verifier in a later step and require live user testing before milestone close.** No code commit is associated with this task.

## Requirements Addressed

- **RPT-03 (period-over-period comparison):** Complete end-to-end at the code level. Users see `↑ $X (+Y%) vs last month` (or `vs last quarter`) directly below the Grand Total hero when viewing This Month or This Quarter; year and custom periods hide the line; zero-prior gracefully omits the percentage; both-zero hides via `v-if`. Pending human UAT for visual + dark-mode confirmation.

## Decisions Made

- None beyond plan — Tasks 1 and 2 were deterministic edits per locked patterns from 29-PATTERNS.md and 29-CONTEXT.md. Task 3 was a checkpoint, not a decision. Plan-checker passed 6/6 dimensions before execution.

## Deviations from Plan

None in execution. The plan was followed exactly as written across both edits.

The pre-existing `VaccinationDetail.vue:5` eslint error (introduced in commit `b42194d` during Phase 12) remains deferred per `.planning/phases/28-budget-tracking/deferred-items.md` — out of scope for Phase 29.

## Issues Encountered

None. Type-check, unit tests, and lint of the modified file all green. Both Edits applied on first attempt with no retries.

## User Setup Required

None — no schema changes, no new collections, no new environment variables. The Phase 29 user-facing acceptance gate is the upcoming `29-HUMAN-UAT.md` re-surface of Task 3's 7 scenarios.

## Note for Orchestrator

**STATE.md and ROADMAP.md were intentionally NOT touched in this plan.** The orchestrator owns those writes after the plan completes (per execute-phase contract). Phase 29 is ready for the verifier step + roadmap update + requirements traceability mark-complete of `RPT-03`.

## Next Phase Readiness

- Phase 29 deliverable complete: single-file modification ships the period-over-period comparison line end-to-end.
- `29-HUMAN-UAT.md` re-surface pending (gsd-verifier step).
- Deferred per 29-CONTEXT.md §Deferred Ideas: year-over-year comparison, custom-range comparison, sparkline trend chart, hover-tooltip with absolute prior period total — all out of scope for RPT-03 and untouched by this plan.

## Self-Check: PASSED

- `src/components/projects/wallecx/ExpensesReportsView.vue` — FOUND (modified per Tasks 1 + 2)
- `.planning/phases/29-period-comparison/29-01-SUMMARY.md` — FOUND (this file)
- Commit `dd29bf7` (Task 1) — FOUND in git log
- Commit `8bbd567` (Task 2) — FOUND in git log

---
*Phase: 29-period-comparison*
*Plan: 01*
*Completed: 2026-05-25*
