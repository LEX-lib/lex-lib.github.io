# Phase 29: Period Comparison - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 29-period-comparison
**Areas discussed:** Period coverage, Section placement & format, Color semantics, Edge cases

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Period coverage | Roadmap explicitly scopes This Month + This Quarter. Should we also wire This Year (vs last year) and Custom (vs equivalent prior window), or hide for those periods (Phase 28 D-09 pattern)? | ✓ |
| Section placement & format | Where in STATE 4 does the comparison live? What does it display — total only, total + delta, total + delta + percentage, trend arrow / sparkline? | ✓ |
| Color semantics for the delta | Is spending MORE visually bad (red), LESS good (green)? Or neutral with arrows only? | ✓ |
| Edge cases (zero prior, custom, empty) | Divide-by-zero handling; zero-current-period; custom-range equivalent-prior window. | ✓ |

**User's choice:** All four areas

---

## Area 1: Period Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Month + Quarter only | Strict roadmap scope. visibleComparison returns data for `this-month` and `this-quarter` only; absent (v-if false) for year/custom. Matches Phase 28 D-09. | ✓ |
| Month + Quarter + Year | Extend to `this-year` vs last year using `dayjs.subtract(1, 'year')`. Custom still hidden. | |
| All four (Month + Quarter + Year + Custom) | Custom uses same-length window immediately preceding customFrom. Most complete; most edge cases. | |

**User's choice:** Month + Quarter only
**Notes:** Smallest surface area; year/custom deferrable. Honors strict roadmap success criteria 1-2.

---

## Area 2: Section Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inline under Grand Total hero | Single line directly below the Grand Total. Most compact; comparison reads as natural augmentation of the headline number. | ✓ |
| Separate card between chart and Budget vs Actual | Labeled card with header. More prominent but adds vertical space and may feel redundant with chart. | |
| Top of STATE 4 (above Grand Total) | Comparison shows first, then Grand Total. Foregrounds trend but reads awkwardly. | |

**User's choice:** Inline under Grand Total hero

---

## Area 2: Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Arrow + absolute delta + percentage | `↑ $230 (+23%) vs last month` — direction icon + dollar + percentage. Three signals in one line. | ✓ |
| Percentage only | `↑ +23% vs last month` — cleanest; loses absolute-scale signal. | |
| Absolute delta only | `↑ $230 more than last month` — loses relative-scale signal. | |
| Full breakdown (last period total + delta + percentage) | `Last month: $1,004.56 — ↑ $230 (+23%)` — most complete; overkill for inline placement. | |

**User's choice:** Arrow + absolute delta + percentage

---

## Area 3: Color Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Up=error red, Down=success green | Positive delta = `--color-status-error`; negative = `--color-status-success`; zero = `--color-typo-muted`. Mirrors Phase 28 Budget vs Actual. | ✓ |
| Neutral (both arrows muted) | Both directions in `--color-typo-muted`. No value judgment. | |
| Up=brand-primary, Down=brand-primary | Both in `--color-brand-primary`. Distinguishes only via arrow + text. | |

**User's choice:** Up=error red, Down=success green
**Notes:** Single mental model across Reports view — red = overspending. Consistent with Phase 28 Budget vs Actual.

---

## Area 4: Zero Prior Period

| Option | Description | Selected |
|--------|-------------|----------|
| Show absolute only, omit percentage | `↑ $230 vs last month (no prior spend)` — honest framing; no fake +Infinity% / +100%. | ✓ |
| Show as +100% | `↑ $230 (+100%) vs last month` — reads naturally but mathematically arbitrary. | |
| Hide the comparison entirely | If lastPeriodTotal === 0, section is absent. Conservative. | |

**User's choice:** Show absolute only, omit percentage

---

## Area 4: Zero Current Period

| Option | Description | Selected |
|--------|-------------|----------|
| Hide — STATE 3 already covers empty | Comparison lives inside STATE 4 only, so it's absent during empty-period state. No extra logic. | ✓ |
| Show comparison even in STATE 3 (custom empty state) | "You spent nothing — down 100% vs last month". Adds an empty-period variant. | |

**User's choice:** Hide — STATE 3 already covers empty

---

## Claude's Discretion (areas user deferred)

- Last-period boundary calculation method — reuse existing `src/lib/wallecx/period.ts` helpers if present, otherwise derive inline using `dayjs().subtract(...)`.
- Reduced-motion behavior — if any numeric tween is added, honor the existing `reducedMotion` computed (Phase 26 invariant). Default: rely on plain Vue reactivity, no explicit animation.
- Accessibility labels — descriptive `aria-label` for screen readers (e.g., "Spending up 23 percent versus last month"); specific copy at executor's discretion.

## Deferred Ideas

- Year-over-year comparison (trivial extension; defer)
- Custom-range comparison with same-length preceding window
- Multi-period trend / sparkline
- Animated counter on delta change
- Period-specificity labels ("vs March 2026" instead of "vs last month")
- Comparison in empty period (STATE 3) variant
