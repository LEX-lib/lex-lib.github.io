---
phase: 26-reporting-view
plan: "01"
subsystem: wallecx
tags: [chart-js, dayjs, dark-mode, css-tokens, composable, tdd]
dependency_graph:
  requires:
    - src/assets/base.css
    - src/composables/useTheme.ts
    - src/lib/wallecx/currency.ts
  provides:
    - chart.js@^4.5.1 runtime dependency
    - 8 chart palette CSS tokens (light + dark)
    - src/lib/wallecx/period.ts
    - src/composables/useChartTheme.ts
  affects:
    - src/components/projects/wallecx/ExpensesReportsView.vue (Plan 03 will consume)
    - src/components/projects/wallecx/ExpensesTab.vue (Plan 02 + 03 will refactor)
tech_stack:
  added:
    - chart.js@^4.5.1
  patterns:
    - dayjs plugin registration at module top (idempotent dayjs.extend)
    - MutationObserver on document.documentElement for dark-mode class tracking
    - Reactive CSS-variable refs via getComputedStyle for canvas theming
    - TDD red/green commit cycle on pure helper modules
key_files:
  created:
    - src/lib/wallecx/period.ts
    - src/lib/wallecx/period.test.ts
    - src/composables/useChartTheme.ts
  modified:
    - package.json
    - src/assets/base.css
decisions:
  - "dayjs format token Q is NOT extended by quarterOfYear plugin — '[Q]Q YYYY' produces 'QQ 2026' not 'Q2 2026'. Use .quarter() accessor via template literal instead. Plan/RESEARCH suggestion was empirically wrong."
  - "MutationObserver attached to document.documentElement (NOT document.body) — useTheme.ts puts .my-app-dark on <html>. UI-SPEC sample code observing <body> was wrong for this project; defensively observes both."
  - "8-color chart palette declared in BOTH @theme and .my-app-dark blocks so chart bars auto-swap under dark mode without JS palette logic — composable just re-reads via getComputedStyle on class mutation."
  - "chart.js installed as runtime dependency (not dev) — PrimeVue Chart performs dynamic import('chart.js/auto') at mount time; without it the chart silently no-ops."
requirements_completed:
  - EXP-11
  - EXP-12
  - EXP-13
metrics:
  duration: "8 min"
  completed_date: "2026-05-22"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 2
---

# Phase 26 Plan 01: Foundation (chart.js + palette tokens + period.ts + useChartTheme) Summary

**chart.js@^4.5.1 + 16 chart palette CSS variables (light + dark) + dayjs-period helper with quarterOfYear plugin + dark-mode-aware Chart.js theme composable — all four foundation artifacts ready for Wave 2 and Wave 3.**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-05-22T01:26:11Z
- **Completed:** 2026-05-22T01:34:33Z
- **Tasks:** 3 (all autonomous, 1 with TDD red/green/green cycle)
- **Files created:** 3 (period.ts, period.test.ts, useChartTheme.ts)
- **Files modified:** 2 (package.json, src/assets/base.css)

## Accomplishments

- **chart.js@^4.5.1 installed** as a runtime dependency in the correct alphabetic slot of package.json (between `browser-image-compression` and `dayjs`). Required so PrimeVue Chart's `import('chart.js/auto')` resolves at component-mount time (silent no-op otherwise — PrimeVue does not declare chart.js as a peer dep).
- **16 new CSS variables** added to `src/assets/base.css`: `--color-chart-1` through `--color-chart-8` declared in both the `@theme` block (light values) and the `.my-app-dark` block (dark values). Exact hex values from the UI-SPEC palette table. Group comment header (`Chart palette (Phase 26)`) added in the light block to match existing token groupings.
- **`src/lib/wallecx/period.ts`** created with all 8 documented exports:
  - `Period` type, `VALID_PERIODS` readonly array, three storage key constants
  - `isValidPeriod` type guard (whitelist validation)
  - `getPeriodRange(period, customFrom, customTo)` returning `{ from: Dayjs; to: Dayjs }` for all 4 periods
  - `formatPeriodLabel(period, customFrom, customTo)` returning the human-friendly string per the UI-SPEC copywriting contract (en-dash U+2013 separator on custom ranges, NOT hyphen-minus)
  - `dayjs.extend(quarterOfYear)` at module top — guarantees `startOf('quarter')` / `endOf('quarter')` / `.quarter()` work everywhere the module is imported
- **`src/lib/wallecx/period.test.ts`** with 16 Vitest assertions covering: VALID_PERIODS contents and order, 3 storage key values, isValidPeriod whitelist behavior (positive + 7 garbage cases), quarterOfYear plugin sanity (the load-bearing test — fails silently if regressed), boundary math for all 4 periods, all 7 formatPeriodLabel branches (incl. en-dash separator).
- **`src/composables/useChartTheme.ts`** created with 7 reactive refs (`paletteColors`, `axisColor`, `mutedColor`, `headingColor`, `gridColor`, `surfaceColor`, `dividerColor`). Synchronous initial read in setup so first chart render has correct theme; MutationObserver on `document.documentElement` (with defensive `document.body` fallback) re-reads CSS variables on class mutation; `onBeforeUnmount` tears down the observer to prevent leaks.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install chart.js + add 8 chart palette CSS tokens** — `0a31a10` (feat)
2. **Task 2 (RED): Add failing tests for period.ts** — `6e8617d` (test) — failed at import resolution (period.ts didn't exist yet)
3. **Task 2 (GREEN): Implement period.ts helper** — `ce7e04e` (feat) — 16/16 tests pass
4. **Task 3: Create useChartTheme composable** — `d5edb49` (feat)

## Files Created/Modified

- `package.json` — added `"chart.js": "^4.5.1"` in correct alphabetic position
- `src/assets/base.css` — 8 chart palette tokens in `@theme` block + 8 in `.my-app-dark` block (16 total new CSS variables)
- `src/lib/wallecx/period.ts` — dayjs period math + label formatting helper with quarterOfYear plugin registration
- `src/lib/wallecx/period.test.ts` — 16 Vitest assertions covering all exports and edge cases
- `src/composables/useChartTheme.ts` — dark-mode-aware Chart.js theme composable (7 reactive refs + MutationObserver lifecycle)

## Decisions Made

- **dayjs format token `Q` is NOT extended by `quarterOfYear` plugin.** Plan and 26-RESEARCH.md both specified `now.format('[Q]Q YYYY')` for the this-quarter label. Empirically (Node REPL after `dayjs.extend(quarterOfYear)`), `[Q]Q YYYY` produces `QQ 2026` not `Q2 2026` — the plugin patches `.quarter()` / `.startOf('quarter')` / `.endOf('quarter')` / `.add('quarter')` / `.isSame(..., 'quarter')` accessors but does NOT extend `format()` token grammar. Switched to template literal: `` `Q${now.quarter()} ${now.format('YYYY')}` ``. Documented inline with a NOTE comment so future maintainers don't try to "simplify" back to a format string.
- **MutationObserver attaches to `document.documentElement`, not `document.body`.** Project's `useTheme.ts` (line 13) applies `.my-app-dark` to `<html>`. UI-SPEC sample code was incorrect for this project. Composable observes both elements defensively (no perf cost — both are class-attribute-filtered).
- **Chart palette tokens declared in CSS** (rather than computed in JS) so dark-mode swap is automatic. The composable just re-reads via `getComputedStyle` when the class mutates — no JS palette lookup table.
- **chart.js installed as runtime dep.** PrimeVue 4.3.x performs dynamic `import('chart.js/auto')` at mount; without the package installed the import silently resolves to nothing and the chart never renders.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] dayjs format string `[Q]Q YYYY` produces `QQ 2026`, not `Q2 2026`**
- **Found during:** Task 2 GREEN phase — test `'this-quarter → Q[1-4] YYYY'` failed with `expected 'QQ 2026' to match /^Q[1-4] \d{4}$/`
- **Issue:** The plan and 26-RESEARCH.md asserted that after `dayjs.extend(quarterOfYear)` the format token `Q` would be recognized by `format()`. Empirically false: the plugin only patches the `.quarter()` accessor and quarter-aware versions of `.startOf` / `.endOf` / `.add` / `.subtract` / `.isSame` / `.isBefore` / `.isAfter`. The `format()` tokenizer is unchanged, so `[Q]` is the literal `Q` and the second `Q` is also passed through unchanged (returns the character itself rather than substituting the quarter number).
- **Fix:** Replaced `now.format('[Q]Q YYYY')` with the template literal `` `Q${now.quarter()} ${now.format('YYYY')}` `` in `formatPeriodLabel`'s `this-quarter` branch. Added an inline NOTE comment documenting the empirical finding so future maintainers don't revert.
- **Files modified:** `src/lib/wallecx/period.ts`
- **Verification:** All 16 Vitest assertions pass (including the regex `/^Q[1-4] \d{4}$/` and the calendar-quarter-start sanity check that confirms the plugin IS loaded for the boundary math).
- **Committed in:** `ce7e04e` (Task 2 GREEN commit) — included alongside the initial implementation

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal — single-line implementation change in `formatPeriodLabel`. The user-visible behavior is identical to what was specified (Q[1-4] YYYY label). The fix is more robust than the original (doesn't depend on undocumented format-token extension behavior). All other Task 2 behavior — plugin registration, range math, en-dash separators, storage keys — matched the plan exactly.

## TDD Gate Compliance

Plan task 2 had `tdd="true"`. Gate sequence verified:

1. **RED gate** — `6e8617d` `test(26-01): add failing tests for period.ts helper` — vitest run confirmed `Failed to resolve import "./period"` before implementation.
2. **GREEN gate** — `ce7e04e` `feat(26-01): implement period.ts helper` — vitest run after implementation: `16 passed (16)`.
3. **REFACTOR gate** — not needed; implementation was clean as written.

## Issues Encountered

- One issue documented under Deviations (the `[Q]Q YYYY` format-token mismatch). Discovered via TDD red-then-green — the failing assertion immediately surfaced the empirical discrepancy from the plan's stated dayjs behavior, demonstrating the value of the TDD gate on this task.

## Known Stubs

None. All 4 deliverables (chart.js dep, 16 CSS tokens, period.ts, useChartTheme.ts) are complete and ready for Wave 2 / Wave 3 consumption.

## Threat Flags

None. This plan introduces no new attack surface — no auth, no input parsing, no network calls, no schema changes at trust boundaries. The threat register entries in the plan (T-26-01 chart.js supply chain, T-26-02 MutationObserver scope, T-26-03 quarterOfYear plugin DoS) are all addressed:

- T-26-01 (accept) — chart.js pinned to `^4.5.1` SemVer caret; lockfile pins resolved version; MIT-licensed industry library.
- T-26-02 (accept) — observer scoped to `attributeFilter: ['class']` on `<html>` and `<body>` only; tears down in `onBeforeUnmount`.
- T-26-03 (mitigate) — plugin registration at module top; Vitest test (`getPeriodRange('this-quarter', null, null).from.format('MM-DD')` equals a calendar-quarter start) verifies the plugin is loaded; if a future change removes the plugin the test fails in CI.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

All Wave 1 (foundation) artifacts are ready for downstream waves:

- **Wave 2 (Plan 02): ExpensesTab.vue shell refactor + ExpensesListView.vue extraction** — does not depend on Wave 1 artifacts directly, but the file split is needed before Wave 3 wires in ExpensesReportsView.vue.
- **Wave 3 (Plan 03): ExpensesReportsView.vue + sub-tab wiring** — consumes all four Wave 1 artifacts:
  - imports `{ getPeriodRange, formatPeriodLabel, VALID_PERIODS, PERIOD_STORAGE_KEY, PERIOD_FROM_STORAGE_KEY, PERIOD_TO_STORAGE_KEY, isValidPeriod }` from `@/lib/wallecx/period`
  - imports `{ useChartTheme }` from `@/composables/useChartTheme`
  - chart.js is auto-resolved by PrimeVue Chart's dynamic import at component mount
  - chart datasets reference `--color-chart-1..8` via the palette ref returned by useChartTheme

No blockers, no open todos.

## Self-Check: PASSED

- [x] `node_modules/chart.js/package.json` exists
- [x] `package.json` contains `"chart.js": "^4.5.1"` (alphabetic slot verified)
- [x] `src/assets/base.css` contains 16 chart-* tokens (8 light + 8 dark)
- [x] Group comment `Chart palette (Phase 26)` present in @theme block
- [x] Both `--color-mix-target` declarations preserved
- [x] `src/lib/wallecx/period.ts` exists with 8 exports
- [x] `src/lib/wallecx/period.test.ts` exists with 16 assertions
- [x] `dayjs.extend(quarterOfYear)` on line 8 (before first export on line 10)
- [x] En-dash U+2013 appears 4× in period.ts (>= 3 required)
- [x] `src/composables/useChartTheme.ts` exists
- [x] `observer.observe(document.documentElement` present (1 match)
- [x] `MutationObserver` present (3 matches: import unnecessary, type, instantiation, refresh callback)
- [x] No `@vueuse/core` import anywhere in src/ (0 matches)
- [x] `onBeforeUnmount` import + usage + null-assign
- [x] Commit `0a31a10` exists (Task 1)
- [x] Commit `6e8617d` exists (Task 2 RED)
- [x] Commit `ce7e04e` exists (Task 2 GREEN)
- [x] Commit `d5edb49` exists (Task 3)
- [x] `npm run type-check` exits 0
- [x] `npm run build-only` exits 0 (built in 3.55s)
- [x] `npx vitest run src/lib/wallecx/period.test.ts` exits 0 (16 passed)

---
*Phase: 26-reporting-view*
*Completed: 2026-05-22*
