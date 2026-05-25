# Phase 29: Period Comparison - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** 1 (1 modified, 0 new)
**Analogs found:** 5 / 5 logical units — all in-file precedents

---

## File Classification

| New/Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/ExpensesReportsView.vue` | MODIFIED | component (read-path view) | computed-derived render | self (extend in place) — Phase 28 Budget vs Actual block | self / exact |

**Scope reminder:** Phase 29 ships as a single-file modification. No new components, no new PocketBase queries, no new packages, no new type files, no new lib helpers (unless an inline dayjs calculation is the chosen path per CONTEXT.md D-08 discretion).

---

## Pattern Assignments

Each logical unit below maps to an existing precedent in `ExpensesReportsView.vue` (Phase 26 + Phase 28). The planner should treat the existing file as the single template — Phase 29 augments it in three layered passes: imports/types (none new), `<script setup>` computeds + helpers, template additions inside STATE 4.

---

### Unit 1: `previousPeriodRange` computed (new) — prior-window boundary

**Role:** computed; **Data flow:** pure derive

**Analog:** `periodRange` computed in `ExpensesReportsView.vue` (lines 60-62) which delegates to `getPeriodRange()` in `src/lib/wallecx/period.ts` (lines 29-45).

**Pattern to mirror** (current file lines 60-62):
```typescript
const periodRange = computed(() =>
  getPeriodRange(period.value, customFrom.value, customTo.value),
)
```

**Adaptation for Phase 29:**

`src/lib/wallecx/period.ts` only exposes **current-period** boundaries via `getPeriodRange`. There is no `lastMonthStart`/`lastQuarterEnd` helper. Per CONTEXT.md D-08 (Claude's Discretion), the planner has two minimal-friction options:

- **Option A — Inline derivation** (lowest blast radius; preferred):
  ```typescript
  const previousPeriodRange = computed<{ from: Dayjs; to: Dayjs } | null>(() => {
    const now = dayjs()
    if (period.value === 'this-month') {
      const prev = now.subtract(1, 'month')
      return { from: prev.startOf('month'), to: prev.endOf('month') }
    }
    if (period.value === 'this-quarter') {
      const prev = now.subtract(1, 'quarter')
      return { from: prev.startOf('quarter'), to: prev.endOf('quarter') }
    }
    return null  // 'this-year' and 'custom' → no comparison (D-01)
  })
  ```
  - `dayjs` is already imported (line 3). `Dayjs` type is not — either import it from `'dayjs'` alongside the default import, or leave the return type inferred.
  - `quarterOfYear` plugin is auto-extended by `period.ts` at module-top (line 8); importing `period.ts` indirectly (already done) ensures `.subtract(1, 'quarter')` + `.startOf('quarter')` work. Do NOT re-call `dayjs.extend()`.

- **Option B — New helper in `period.ts`:** add `getPreviousPeriodRange(period, customFrom, customTo)` mirroring the existing `getPeriodRange` switch shape (returning `{ from, to } | null`). Only worth the file-level change if a future phase will also need it. Phase 29 does not require it.

**Recommendation for planner:** Option A. Smallest surface area, no new exports, no `period.ts` test churn. Inline the 8-line computed directly under the existing `periodRange` computed.

---

### Unit 2: `previousPeriodExpenses` computed (new) — prior-window filter

**Role:** computed; **Data flow:** array filter

**Analog:** `periodExpenses` computed in `ExpensesReportsView.vue` (lines 65-70).

**Pattern to mirror verbatim** (current file lines 64-70):
```typescript
const periodExpenses = computed<Expenses[]>(() => {
  if (dateRangeError.value) return []
  const fromStr = periodRange.value.from.format('YYYY-MM-DD')
  const toStr = periodRange.value.to.format('YYYY-MM-DD')
  return props.expenses.filter(e => e.expense_date >= fromStr && e.expense_date <= toStr)
})
```

**Adaptation for Phase 29:**
```typescript
const previousPeriodExpenses = computed<Expenses[]>(() => {
  const range = previousPeriodRange.value
  if (!range) return []
  const fromStr = range.from.format('YYYY-MM-DD')
  const toStr = range.to.format('YYYY-MM-DD')
  return props.expenses.filter(e => e.expense_date >= fromStr && e.expense_date <= toStr)
})
```

- Same `YYYY-MM-DD` string-comparison idiom (Phase 26 locked invariant — line 117 in STATE.md "Client-side period filtering").
- No `dateRangeError` guard needed — D-01 already excludes `'custom'`, so invalid-range state never reaches this computed.
- Same `props.expenses` source — confirms STATE.md "Both sibling views consume the same `:expenses`" invariant. No new PocketBase query.

---

### Unit 3: `previousPeriodTotal` computed (new) — prior-window sum

**Role:** computed; **Data flow:** array reduce

**Analog:** `grandTotal` computed in `ExpensesReportsView.vue` (lines 73-75).

**Pattern to mirror verbatim** (current file lines 73-75):
```typescript
const grandTotal = computed(() =>
  periodExpenses.value.reduce((sum, e) => sum + e.amount, 0),
)
```

**Adaptation for Phase 29:**
```typescript
const previousPeriodTotal = computed(() =>
  previousPeriodExpenses.value.reduce((sum, e) => sum + e.amount, 0),
)
```

Single-line clone. No `formatCurrency` here — formatting happens in Unit 5.

---

### Unit 4: `visibleComparison` computed (new) — period-gated payload

**Role:** computed; **Data flow:** synthesis (direction + delta + percentage)

**Analog:** `visibleBudgets` computed in `ExpensesReportsView.vue` (lines 100-108).

**Pattern to mirror** (current file lines 99-108):
```typescript
const visibleBudgets = computed<ExpenseBudget[]>(() => {
  if (period.value === 'this-month') {
    return props.budgets.filter((b) => b.budget_type === 'monthly')
  }
  if (period.value === 'this-year') {
    return props.budgets.filter((b) => b.budget_type === 'yearly')
  }
  return []  // this-quarter and custom: section hidden entirely (D-09)
})
```

**Adaptation for Phase 29** — return either `null` (hide via `v-if`) or a fully-formed payload:
```typescript
type ComparisonPayload = {
  direction: 'up' | 'down' | 'flat'
  arrow: '↑' | '↓' | '—'
  absoluteDelta: number          // already signed-stripped; format-ready
  percentage: number | null      // null when prior is 0 (D-05)
  periodSuffix: 'last month' | 'last quarter'
  colorToken: string             // CSS var literal, e.g. 'var(--color-status-error)'
}

const visibleComparison = computed<ComparisonPayload | null>(() => {
  // D-01: coverage gate — month + quarter only
  let suffix: 'last month' | 'last quarter'
  if (period.value === 'this-month')        suffix = 'last month'
  else if (period.value === 'this-quarter') suffix = 'last quarter'
  else return null  // 'this-year', 'custom' → DOM absent (mirrors Phase 28 D-09)

  const thisTotal = grandTotal.value
  const lastTotal = previousPeriodTotal.value

  // D-07: both zero → hide entirely
  if (thisTotal === 0 && lastTotal === 0) return null

  const delta = thisTotal - lastTotal
  const absoluteDelta = Math.abs(delta)

  // Direction + arrow + color (D-03, D-04)
  let direction: 'up' | 'down' | 'flat'
  let arrow: '↑' | '↓' | '—'
  let colorToken: string
  if (delta > 0)      { direction = 'up';   arrow = '↑'; colorToken = 'var(--color-status-error)' }
  else if (delta < 0) { direction = 'down'; arrow = '↓'; colorToken = 'var(--color-status-success)' }
  else                { direction = 'flat'; arrow = '—'; colorToken = 'var(--color-typo-muted)' }

  // D-05: zero prior period → omit percentage (no +Infinity, no fake +100%)
  const percentage = lastTotal === 0
    ? null
    : Math.round((delta / lastTotal) * 100)

  return { direction, arrow, absoluteDelta, percentage, periodSuffix: suffix, colorToken }
})
```

**Key parallels with Phase 28 `visibleBudgets`:**
- Same `period.value === 'this-X'` early-return shape.
- Same "return non-null only for in-scope periods" contract → drives `v-if` in template.
- Same "DOM absent" gating semantics (Phase 28 D-09, STATE.md Phase 28 Decisions §Period-gated visibleBudgets pattern).

---

### Unit 5: `formatComparisonLine` helper (new, optional) — display string

**Role:** utility (component-local); **Data flow:** pure transform

**Analog:** `badgeLabel(b)` helper in `ExpensesReportsView.vue` (lines 115-120).

**Pattern to mirror** (current file lines 115-120):
```typescript
function badgeLabel(b: ExpenseBudget): string {
  const actual = actualFor(b.category)
  if (actual > b.amount) return `Over by ${formatCurrency(actual - b.amount)}`
  if (actual < b.amount) return `Under by ${formatCurrency(b.amount - actual)}`
  return 'On budget'
}
```

**Adaptation for Phase 29** — emit the full text per D-03 + D-05 + D-07 + flat-case copy:
```typescript
function formatComparisonLine(c: ComparisonPayload): string {
  // Flat → "— No change vs last month" (D-03 example 3)
  if (c.direction === 'flat') {
    return `${c.arrow} No change vs ${c.periodSuffix}`
  }
  // Zero prior period → omit percentage; append "(no prior spend)" (D-05)
  if (c.percentage === null) {
    return `${c.arrow} ${formatCurrency(c.absoluteDelta)} vs ${c.periodSuffix} (no prior spend)`
  }
  // Normal case → "↑ $230 (+23%) vs last month" (D-03 example 1)
  const sign = c.percentage > 0 ? '+' : '−'  // U+2212 minus, NOT hyphen-minus (matches period.ts en-dash convention)
  return `${c.arrow} ${formatCurrency(c.absoluteDelta)} (${sign}${Math.abs(c.percentage)}%) vs ${c.periodSuffix}`
}
```

**Inlining alternative:** The above logic is small enough to inline directly in the template via `{{ }}` interpolation. The planner may collapse Unit 5 into Unit 4 (let `visibleComparison` return a pre-formatted `text` field) or into the template itself. Either approach is acceptable; extracting to a helper improves testability if a Vitest unit test is added.

**Note on minus sign character:** Use U+2212 (`−`) to match the existing en-dash convention in `period.ts` line 64 (`' – '` U+2013) and `D-03` example 2 (`(−12%)`). Do NOT use ASCII hyphen-minus `-`. This is a typographic detail the executor must honor.

---

### Unit 6: Template addition — comparison line in STATE 4

**Role:** template; **Data flow:** Vue interpolation

**Analog:** Two precedents — the Grand Total hero block (lines 378-385) for typography/spacing, and the Phase 28 Manage Budgets button block (lines 388-399) for the inline status color via `:style` pattern.

**Pattern to mirror — placement order in STATE 4** (current file lines 377-449):
```
<template v-else>
  Grand Total hero               (lines 378-385)
  Manage Budgets button          (lines 388-399)     ← Phase 28
  Chart container                 (lines 401-408)
  Budget vs Actual section       (lines 410-448)     ← Phase 28
</template>
```

**New ordering for Phase 29** (CONTEXT.md D-02 — "Grand Total hero → comparison line → Manage Budgets button → chart → Budget vs Actual section"):
```
<template v-else>
  Grand Total hero
  Comparison line                 ← NEW (Phase 29)
  Manage Budgets button
  Chart container
  Budget vs Actual section
</template>
```

**Template excerpt to insert** between current lines 385 and 388:
```html
<!-- Phase 29 — Period-over-period comparison (D-01, D-02, D-03, D-04, D-05, D-06, D-07) -->
<div
  v-if="visibleComparison !== null"
  class="flex justify-center mb-4"
  role="status"
  :aria-label="comparisonAriaLabel"
>
  <span
    class="text-sm font-medium"
    :style="{ color: visibleComparison.colorToken }"
  >
    {{ formatComparisonLine(visibleComparison) }}
  </span>
</div>
```

**Styling pattern parallels:**
- **Inline `:style="{ color: 'var(--color-status-*)' }"`** — exact pattern lifted from `progressFillStyle` (lines 132-142) and `badgeStyle` (lines 122-130). Do NOT use Tailwind `text-red-500` / `text-green-500` utilities; status colors flow through CSS custom properties to honor dark-mode theme swaps (Phase 22 invariant).
- **`text-sm font-medium`** — typography weight one step heavier than the muted "Total spend —" label above (line 379 uses `text-sm` without weight), one step lighter than the `text-3xl font-bold` hero (line 382). Reads as augmentation, not headline.
- **`flex justify-center mb-4`** — center horizontally to match the centered Grand Total hero block above; `mb-4` mirrors the Manage Budgets button's outer `mb-4` (line 388) for consistent vertical rhythm.
- **`role="status"`** — semantic anchor for the announcement (not a region/alert). Mirrors the Phase 26 `role="alert"` usage at line 342 but uses the lower-priority `status` since the comparison is informational, not error.

**Aria-label computed** (per D-08 — accessibility discretion):
```typescript
const comparisonAriaLabel = computed<string>(() => {
  const c = visibleComparison.value
  if (!c) return ''
  if (c.direction === 'flat') return `No change in spending versus ${c.periodSuffix}`
  if (c.percentage === null) {
    return `Spending ${c.direction} ${formatCurrency(c.absoluteDelta)} versus ${c.periodSuffix}, no prior spend`
  }
  return `Spending ${c.direction} ${Math.abs(c.percentage)} percent versus ${c.periodSuffix}`
})
```

Mirrors the screen-reader-friendly label style used at line 422 (Budget vs Actual `aria-label`).

---

## Shared Patterns

### Period-Gated Section (`v-if` → DOM Absent)

**Source:** Phase 28 D-09 (STATE.md line 157) + current file lines 411 (`v-if="visibleBudgets.length > 0"`)
**Apply to:** Comparison line `v-if="visibleComparison !== null"`

Section must be **entirely absent from the DOM** for excluded periods (`this-year`, `custom`) — not merely hidden via `display: none` or `v-show`. This:
1. Prevents screen readers from announcing an empty region.
2. Avoids layout flicker during period switches.
3. Eliminates any need to short-circuit downstream computeds when the section is invisible.

The `visibleComparison` computed returns `null` for excluded periods; the `v-if` consumes that directly. Mirror Phase 28's pattern shape **exactly**.

### Inline Style for Status Color

**Source:** `ExpensesReportsView.vue` lines 122-142 (`badgeStyle`, `progressFillStyle`), and line 344 (`style="color: var(--color-status-error)"`)
**Apply to:** Comparison line color binding

Always bind status colors via `:style="{ color: '...' }"` or `style="color: var(--color-status-*)"`, never via Tailwind text-color utility classes. Reason: CSS custom properties auto-swap between light/dark mode via `.my-app-dark` block in `src/assets/base.css`; Tailwind utilities resolve to fixed hex values that bypass the theme system.

| Token | Phase 29 use |
|-------|--------------|
| `--color-status-error` | Positive delta (spending more — D-04) |
| `--color-status-success` | Negative delta (spending less — D-04) |
| `--color-typo-muted` | Zero delta (D-04) |

### Client-Side Period Filtering (No New Queries)

**Source:** Phase 26 invariant (STATE.md line 117 — "Both sibling views consume the same `:expenses` + `:is-loading` from the shell") + Phase 28 reuse pattern.
**Apply to:** `previousPeriodExpenses` computed

All Phase 29 calculation is client-side over `props.expenses`. **Do NOT**:
- Add a new `getFullList` call.
- Introduce a new `requestKey`.
- Modify `ExpensesTab.vue` to fetch a separate "previous expenses" array.

The full-history expenses array already loaded by the shell is sufficient — any prior month/quarter within the dataset is reachable via `YYYY-MM-DD` string comparison.

### dayjs `.subtract` + `.startOf` + `.endOf` for Boundaries

**Source:** `src/lib/wallecx/period.ts` lines 36-37 (`now.startOf('month')`, `now.startOf('quarter')`) + dayjs `quarterOfYear` plugin (extended at line 8)
**Apply to:** `previousPeriodRange` computed (Unit 1)

The plugin patches `.startOf('quarter')`, `.endOf('quarter')`, `.subtract(N, 'quarter')`, and `.quarter()` accessors. It does **NOT** extend `format()` token grammar (locked invariant — STATE.md Phase 26 Decisions Plan 01). Phase 29 doesn't need format tokens (D-03 uses literal `'last month'` / `'last quarter'`), so this constraint doesn't apply, but the planner should be aware that any "Q4 2025" style suffix would require `\`Q${prev.quarter()} ${prev.format('YYYY')}\`` interpolation, not a format token.

### Reduced-Motion Honor (Conditional)

**Source:** `reducedMotion` computed in current file lines 172-175 + STATE.md Phase 26 line 129
**Apply to:** Only if a numeric tween or transition is added — see CONTEXT.md D-08 + §specifics ("No numeric animation on period switch")

Default for Phase 29: **no animation**. Comparison value re-derives via Vue reactivity on `period.value` change. If a future tween is added (deferred per §specifics), it must consume the existing `reducedMotion` computed and set `duration: 0` when `prefers-reduced-motion: reduce` matches.

### Toast Notifications

**Source:** `vue-sonner` `toast.error` / `toast.success` — used throughout the file
**Apply to:** **None required for Phase 29.** All Phase 29 logic is read-only derivation from already-loaded data; no fetch failure paths, no write paths. The planner should NOT add a toast.

### Touch Target Minimum (44px)

**Source:** Phase 15 invariant (referenced throughout the file)
**Apply to:** **None required for Phase 29.** The comparison line is not interactive — it's a `<span>` inside a non-clickable `<div role="status">`. The planner should NOT add `min-h-[44px]`.

---

## No Analog Found

| Concern | Reason | Recommendation |
|---------|--------|----------------|
| Unicode arrow string literal (`↑` `↓` `—`) | No precedent in codebase — Phase 28 uses `pi pi-sliders-h` PrimeIcons class, mdi icons (`<iconify-icon>`) elsewhere; no inline Unicode glyph in any Wallecx component. | Per CONTEXT.md §specifics: use plain Unicode arrows in the comparison-line string. No icon library, no PrimeIcons class. Verified: `↑` U+2191, `↓` U+2193, `—` (em-dash) U+2014. Embed as literal characters in the `.vue` template / string — UTF-8 source file encoding handles it. Per D-03 example 3, the flat case is **em-dash** U+2014, not en-dash U+2013. |
| Divide-by-zero handling for percentage delta | Wallecx has no existing percentage calculation that risks division by zero — Phase 28 Budget vs Actual computes `(actual / budget) * 100` but assumes `budget > 0` (upstream delete-on-zero invariant per Phase 28 line 137 comment). | Per CONTEXT.md D-05: when `lastTotal === 0` and `thisTotal > 0`, `visibleComparison.percentage` returns `null` and `formatComparisonLine` appends `' (no prior spend)'`. Explicit guard in Unit 4 — do NOT compute `(thisTotal / 0) * 100`. |
| Signed-percentage display with `+` prefix | All existing currency/number displays use `formatCurrency` (no sign prefix) or raw `Math.round` (no sign). | Format inline per Unit 5: `const sign = c.percentage > 0 ? '+' : '−'` then concatenate with `Math.abs(c.percentage)`. Use U+2212 minus for the negative sign (matches typographic convention of the codebase — `period.ts` line 64 en-dash). |
| `role="status"` for non-error inline announcements | Current file uses `role="alert"` (line 342) for the invalid-range error and `role="img"` (line 404) for the chart. No `role="status"` precedent. | Add `role="status"` to the comparison-line wrapper. Standard ARIA pattern: `status` is `aria-live="polite"` by default, appropriate for non-error informational updates. Lower priority than `alert`. |

---

## Anti-Pattern Warnings

Based on prior phase pitfalls in this same file and adjacent specs:

### Do NOT extract a separate `PeriodComparison.vue` component.

**Why:** Phase 29 scope is a single-line read-only derivation from data already in `ExpensesReportsView.vue`. Extracting a child component would:
- Require a 4-prop interface (`thisPeriodTotal`, `previousPeriodTotal`, `periodSuffix`, `isVisible`) for zero reuse benefit (no other view consumes this).
- Force re-export of the `ComparisonPayload` type or duplicate the format logic.
- Violate the "smallest surface area" principle the CONTEXT.md scope explicitly chose.

**Correct approach:** All 5 logical units live inside the existing `ExpensesReportsView.vue` script block; template addition is one `<div>` inside the existing `<template v-else>`.

### Do NOT add a new PocketBase query for previous expenses.

**Why:** STATE.md Phase 26 line 117 locks "client-side period filtering via YYYY-MM-DD string comparison on the already-loaded expenses array — no new PocketBase queries." Phase 29 must honor this; the already-loaded `props.expenses` covers all historical months/quarters.

**Anti-pattern:** Calling `pb.collection('wallecx_expenses').getFullList(...)` with a date filter for the prior window. Adds a redundant network round-trip and risks `requestKey` collision with `'expenses-getFullList'`.

### Do NOT break STATE 4 template ordering (D-02).

**Why:** CONTEXT.md D-02 locks the order: `Grand Total hero → comparison line → Manage Budgets button → chart → Budget vs Actual section`. The comparison line must render **between** the Grand Total `<div>` (currently lines 378-385) and the Manage Budgets `<div>` (currently lines 388-399).

**Anti-pattern:** Inserting the comparison line below the chart (e.g., near the Budget vs Actual section) — would force the user to scroll past the chart to see the headline comparison, defeating "at-a-glance" intent.

### Do NOT use Tailwind status-color utilities (`text-red-500`, `text-green-600`).

**Why:** Phase 22 dark-mode invariant — all status colors flow through CSS custom properties (`--color-status-error`, `--color-status-success`, `--color-typo-muted`). Tailwind hex utilities bypass the `.my-app-dark` theme swap and produce wrong-contrast text in dark mode. Phase 28 already established the `:style="{ color: 'var(--color-status-*)' }"` precedent (lines 122-142).

**Correct:** `:style="{ color: visibleComparison.colorToken }"` where `colorToken` is the CSS-var string from Unit 4.

### Do NOT render `(+Infinity%)` or `(+100%)` when prior period is zero.

**Why:** Math: `n / 0 = Infinity` is JavaScript runtime behavior that would render literally in the template. CONTEXT.md D-05 requires omitting the percentage entirely with a `' (no prior spend)'` suffix instead.

**Correct:** `visibleComparison.percentage === null` branch in `formatComparisonLine` skips the `(±N%)` clause and appends `' (no prior spend)'`. Validated explicitly in Unit 4.

### Do NOT use the ASCII hyphen-minus for the negative percentage sign.

**Why:** Typographic consistency with the rest of the codebase. `period.ts` line 64 uses U+2013 en-dash (`' – '`). CONTEXT.md D-03 example 2 explicitly uses U+2212 minus (`(−12%)`). Mixing `-12%` (hyphen-minus) with `+23%` produces visually unbalanced glyphs in Rubik (the font used).

**Correct:** `const sign = c.percentage > 0 ? '+' : '−'  // U+2212`

### Do NOT add `dayjs.extend(quarterOfYear)` again.

**Why:** Already extended at the top of `src/lib/wallecx/period.ts` (line 8). `dayjs.extend` is idempotent but re-extending obscures the dependency chain. The `period.ts` import in `ExpensesReportsView.vue` line 12-19 brings the extension transitively.

**Correct:** Just call `dayjs().subtract(1, 'quarter').startOf('quarter')` — the plugin is already active.

### Do NOT add new sessionStorage keys.

**Why:** Phase 29 has no persistent state of its own. Visibility is fully derived from `period.value` (which has its own `wallecx:expense-period` key from Phase 26). Adding a key (e.g., for "comparison shown last") would violate "smallest surface area."

**Correct:** Pure computeds, no `sessionStorage.setItem` for any Phase 29 state.

### Do NOT touch `ExpensesTab.vue`.

**Why:** CONTEXT.md §code_context line 126 — "No changes to `ExpensesTab.vue`. No new PocketBase requestKey. No new collection." The calculation is fully client-side from already-loaded data; no prop wiring or fetch change is needed.

**Correct:** Single-file modification limited to `ExpensesReportsView.vue`. If the planner finds itself opening `ExpensesTab.vue`, re-read the scope.

---

## Metadata

**Analog search scope:**
- `src/components/projects/wallecx/ExpensesReportsView.vue` — read in full (lines 1-473); all 6 logical units have in-file precedents.
- `src/lib/wallecx/period.ts` — confirmed no `lastMonthStart` / `lastQuarterEnd` helpers exist (only current-period via `getPeriodRange`). Decision: inline derivation per CONTEXT.md D-08.
- `src/lib/wallecx/currency.ts` — `formatCurrency` reused verbatim.
- `.planning/phases/28-budget-tracking/28-PATTERNS.md` — used as structural template for this map.
- `.planning/STATE.md` — Phase 26 + Phase 28 invariants cross-checked (period filtering, period-gated v-if, shell-owns-data, reduced-motion handling).
- `.planning/phases/29-period-comparison/29-CONTEXT.md` — all 7 decisions D-01 through D-07 + 3 discretion items mapped to specific units.

**Files scanned:** 5 source/spec files read end-to-end. Zero new source files required.

**Confidence:** HIGH — every Phase 29 logical unit has a 1:1 in-file precedent within the same view (`ExpensesReportsView.vue`). The only items without prior codebase analog (Unicode arrow literal, divide-by-zero null guard, U+2212 minus sign, `role="status"` ARIA) are explicit and minor; all are locked by CONTEXT.md decisions.

**Pattern extraction date:** 2026-05-25
