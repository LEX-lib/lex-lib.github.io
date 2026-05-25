# Phase 29: Period Comparison - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a period-over-period comparison section to `ExpensesReportsView.vue` that surfaces how the user's spending in the currently-selected period compares to the previous equivalent period.

**In scope:**
- Comparison line displayed inline below the Grand Total hero (STATE 4 only)
- Coverage: `this-month` (vs last month) and `this-quarter` (vs last quarter) only
- Client-side calculation from the already-loaded expenses array (no new PocketBase queries)
- Visual distinction between positive delta (spending more — error/red) and negative delta (spending less — success/green)
- Honest handling when the previous period had $0 spend (omit percentage; show absolute only)

**Out of scope:**
- Year-over-year comparison (deferred — not in roadmap success criteria for Phase 29)
- Custom-range comparison (deferred — equivalent-prior-window logic is its own design problem)
- Multi-period trend charts / sparklines (deferred — Phase 29 ships a single comparison line)
- Comparison in STATE 3 (empty period) — STATE 4 boundary keeps it absent without extra logic
- New PocketBase queries — calculation is client-side only

</domain>

<decisions>
## Implementation Decisions

### Period Coverage

- **D-01:** Coverage is **Month + Quarter only**. The `visibleComparison` computed returns data only for `period.value === 'this-month'` (compared to last month) and `period.value === 'this-quarter'` (compared to last quarter). For `'this-year'` and `'custom'` the comparison section is entirely absent from the DOM via `v-if`. Mirrors Phase 28 D-09 hiding pattern — DOM absent, not just hidden.
  - **Rationale:** Roadmap success criteria 1-2 explicitly scope month and quarter. Year/custom are deferrable. Smallest surface area; clear extension path later.

### Section Placement

- **D-02:** Comparison line renders **inline directly under the Grand Total hero**, inside the existing `<template v-else>` (STATE 4) block in `ExpensesReportsView.vue`. Reads as a natural augmentation of the headline total. No separate card, no header divider — single line with text + arrow icon + color.
  - **Order in STATE 4:** Grand Total hero → comparison line → Manage Budgets button → chart → Budget vs Actual section.
  - **Rationale:** Most compact placement; user sees comparison at-a-glance with no scrolling. Doesn't compete with the chart or Budget vs Actual section for visual prominence.

### Display Format

- **D-03:** Comparison line format: **`{arrow} ${absolute delta} ({±percentage}%) vs last {period}`**
  - Examples:
    - `↑ $230 (+23%) vs last month`
    - `↓ $80 (−12%) vs last quarter`
    - `— No change vs last month` (zero delta)
  - Direction icon: `↑` for positive delta, `↓` for negative, `—` (em-dash) for zero.
  - Percentage uses `+` / `−` sign and rounds to whole integer (`Math.round`).
  - Absolute delta uses `formatCurrency()` from `src/lib/wallecx/currency.ts`.
  - Period suffix is `'last month'` or `'last quarter'` — verbatim, no quarter number.
  - **Rationale:** Combines three signals (direction + absolute + relative) without being noisy. Matches Phase 28's Budget vs Actual badge pattern (absolute + relative).

### Color Semantics

- **D-04:** Color tokens map to value judgment: **spending MORE = bad = error; spending LESS = good = success**.
  - Positive delta (this period > last period) → `var(--color-status-error)` (red).
  - Negative delta (this period < last period) → `var(--color-status-success)` (green).
  - Zero delta → `var(--color-typo-muted)` (gray neutral).
  - **Rationale:** Consistent with Phase 28 Budget vs Actual where over-budget = error, under-budget = success. Single mental model across the Reports view: red signals overspend.

### Edge Cases

- **D-05:** **Zero prior period** (lastPeriodTotal === 0, thisPeriodTotal > 0):
  - Display `↑ ${formatCurrency(thisPeriodTotal)} vs last {period} (no prior spend)`.
  - **Omit the percentage entirely** — `(thisPeriodTotal / 0) * 100` is undefined; do not show `+Infinity%` or fake `+100%`.
  - Color is still `--color-status-error` (positive direction).
- **D-06:** **Zero current period** (STATE 3): comparison line is automatically absent because it lives inside `<template v-else>` (STATE 4). No extra empty-period handling needed.
- **D-07:** **Both periods zero**: visibleComparison computed returns null (treated like the year/custom case) and the line is hidden via `v-if`. No "$0 vs $0" display.

### Claude's Discretion

- **Last-period boundary calculation method.** Reuse the existing period utilities in `src/lib/wallecx/period.ts` if they already expose `lastMonthStart`/`lastMonthEnd`/`lastQuarterStart`/`lastQuarterEnd`; otherwise derive inline using `dayjs().subtract(1, 'month')` / `.subtract(1, 'quarter')` with `.startOf()` / `.endOf()`. Planner/executor to read `period.ts` and choose the minimal-friction approach.
- **Reduced-motion behavior.** If a numeric tween/transition is added for delta values (e.g., on period switch), it must honor the existing `reducedMotion` computed (Phase 26 invariant: `animation.duration: 0` when prefers-reduced-motion). Otherwise rely on plain Vue reactivity with no explicit animation.
- **Accessibility labels.** Add a descriptive `aria-label` on the comparison line for screen readers (e.g., `"Spending up 23 percent versus last month"`). Specific copy is at executor's discretion within the established Wallecx ARIA conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / Requirements
- `.planning/ROADMAP.md` §Phase 29 — Success Criteria 1-4
- `.planning/REQUIREMENTS.md` §Expense Reports — RPT-03 (period-over-period comparison)

### Locked Invariants (STATE.md)
- `.planning/STATE.md` §Accumulated Context → **Phase 26 Decisions (Plan 03)** — period selector contract, sessionStorage YYYY-MM-DD strings, prefers-reduced-motion handling
- `.planning/STATE.md` §Accumulated Context → **Phase 28 Decisions** — period-gated section pattern (`v-if=visibleX.length > 0`, DOM absent for excluded periods), shell-owns-data invariant

### Existing Files to Reuse
- `src/components/projects/wallecx/ExpensesReportsView.vue` — primary modification target; existing period selector, periodExpenses, grandTotal, categoryTotals
- `src/lib/wallecx/period.ts` — period boundary helpers + `formatPeriodLabel`; verify if `last*Start/End` helpers exist
- `src/lib/wallecx/currency.ts` — `formatCurrency` for absolute delta formatting
- `src/components/projects/wallecx/ExpensesTab.vue` — shell that passes `:expenses` and `:is-loading` (no changes expected for Phase 29 since calculation is client-side from already-loaded data)

### Design Tokens
- `src/assets/base.css` — `--color-status-success`, `--color-status-error`, `--color-typo-muted`, `--color-typo-heading`, `--color-typo-body` (used for comparison line)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`periodExpenses` computed** (ExpensesReportsView.vue) — already filters `props.expenses` to the current period using `period.value` + customFrom/customTo. Phase 29 needs an analogous `previousPeriodExpenses` computed that filters to the prior equivalent window.
- **`grandTotal` computed** — sums `periodExpenses` amounts. Phase 29 needs a `previousPeriodTotal` parallel computed for the prior window.
- **`formatPeriodLabel`** (period.ts) — formats period names for display ("This Month", "Q2 2026", etc.). Phase 29 only needs the simpler `'last month'` / `'last quarter'` labels per D-03, so this util is not directly reused.
- **`formatCurrency`** (currency.ts) — used verbatim for absolute delta display.

### Established Patterns

- **Period-gated section** (Phase 28 D-09): `v-if="visibleComparison !== null"` keeps the line absent from DOM for non-applicable periods. Mirrors `<div v-if="visibleBudgets.length > 0">` from the Budget vs Actual section.
- **Color tokens for value judgment** (Phase 28): error = bad/over, success = good/under, muted = neutral. Phase 29 D-04 reuses this exact mapping.
- **Client-side period filtering** (Phase 26): all comparisons are YYYY-MM-DD string comparisons on the already-loaded `props.expenses` array — no new PocketBase queries.
- **Inline styles via `:style="{ color: 'var(--color-status-*)' }"`** — Phase 28 ExpensesReportsView precedent; planner should follow same pattern over Tailwind utility classes for status colors.

### Integration Points

- Single file modification: `src/components/projects/wallecx/ExpensesReportsView.vue`. Add:
  - Imports: dayjs (already imported), formatCurrency (already imported via Phase 28), no new packages.
  - Computeds: `previousPeriodExpenses`, `previousPeriodTotal`, `visibleComparison` (returns null | object with `direction`, `absoluteDelta`, `percentage` (nullable when prior is 0)).
  - Template: single `<div v-if>` block inside STATE 4, immediately after the Grand Total hero `<div>`, before the existing `<!-- Phase 28 — Manage Budgets entry -->` block.
- No changes to `ExpensesTab.vue`. No new PocketBase requestKey. No new collection.

</code_context>

<specifics>
## Specific Ideas

- **Arrow icons:** Plain Unicode arrows (↑ ↓ —). No icon library / no PrimeIcons class — keeps with the inline-string formatting choice and respects the muted/error/success color via parent span. (`mdi:arrow-up-bold` etc. would also work but adds visual weight; Unicode arrows match the inline-text feel of the comparison line.)
- **No period-label customization for Phase 29.** Use literal `'vs last month'` / `'vs last quarter'` — no "vs March 2026" specificity. Keeps copy short and matches the inline placement.
- **No numeric animation on period switch.** Comparison value re-derives from the computed; rely on Vue's default reactivity. Adding a tween/counter animation is deferred (would need `reducedMotion` handling and adds complexity beyond Phase 29 scope).

</specifics>

<deferred>
## Deferred Ideas

- **Year-over-year comparison** — Extend `visibleComparison` to cover `'this-year'` with `dayjs().subtract(1, 'year')`. Trivial extension; defer until user requests or until a v4.2 milestone.
- **Custom-range comparison** — Same-length preceding window for Custom periods. Raises a design question: should a 14-day window starting 2026-05-15 compare to 2026-05-01–2026-05-14 (immediately prior) or 2026-04-15–2026-04-28 (same calendar offset)? Defer until needed.
- **Multi-period trend / sparkline** — A small chart showing the last N periods. Different UX paradigm than a single comparison line; would warrant its own phase.
- **Comparison in empty period (STATE 3)** — Show "You spent nothing — down 100% vs last month" as a custom empty-period variant. Adds an empty-state copy decision; defer.
- **Period-specificity labels** — "vs March 2026" instead of "vs last month". Adds a small `formatPreviousPeriodLabel` helper. Defer until user feedback.
- **Animated counter on delta change** — Tween numeric values on period switch. Needs `reducedMotion` honor. Defer.

</deferred>

---

*Phase: 29-period-comparison*
*Context gathered: 2026-05-25*
