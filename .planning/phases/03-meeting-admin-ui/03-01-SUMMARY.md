---
phase: 03-meeting-admin-ui
plan: 01
subsystem: ui
tags: [vue, composable, lextrack, duration, composition-api]

# Dependency graph
requires:
  - phase: 02-types-mappers
    provides: DurationUnit type from @/types/lextrack/dsu_meetings/constants
provides:
  - useDurationField composable encapsulating bidirectional min/hr conversion
  - First file under src/composables/lextrack/ (new directory established)
  - Pure logic seam for ManageMeeting.vue (Plan 03-05) and any future duration UI
affects: [03-05, 06-quality-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vue 3 Composition API composable returning { Ref, ComputedRef } shape"
    - "Stateless-across-instances composable (each call yields fresh refs)"

key-files:
  created:
    - src/composables/lextrack/useDurationField.ts
  modified: []

key-decisions:
  - "Composable owns seed-time round-trip only; consumer (Plan 03-05) owns runtime watcher that copies durationMinutes/unit back to defineModel ref"
  - "savedUnit ?? 'minutes' defends in depth on top of mapper-layer legacy normalization"
  - "Named export only; no barrel file (per CONVENTIONS.md / D-07 'one file, one job')"

patterns-established:
  - "Per-feature composable folder pattern: src/composables/<feature>/<useThing>.ts"
  - "Composable function signature: takes saved canonical values, returns reactive UI state + canonical computed"

requirements-completed: [UI-MEET-01, UI-MEET-02, UI-MEET-03]

# Metrics
duration: 2min
completed: 2026-04-29
---

# Phase 3 Plan 01: useDurationField Composable Summary

**Pure-logic Vue composable that bidirectionally converts `(duration_minutes, duration_unit)` ↔ `(enteredValue, unit)` for the meeting duration toggle UX**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-29T00:17:34Z
- **Completed:** 2026-04-29T00:19:16Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments

- Created `src/composables/lextrack/useDurationField.ts` — first composable in the project; new `src/composables/lextrack/` directory established.
- Composable seeds `enteredValue` and `unit` from saved meeting values, normalizing legacy `undefined` unit → `'minutes'` (defense-in-depth on top of the mapper-layer default added in 02-04).
- `durationMinutes` computed: returns `enteredValue * 60` when unit is `'hours'`, `enteredValue` when `'minutes'`, and `undefined` when `enteredValue` is null.
- `fractionDigits` computed: 2 for hours, 0 for minutes — ready for direct binding to PrimeVue `InputNumber`'s `:max-fraction-digits` in Plan 03-05.
- Type-check passes (`npm run type-check` exits 0); all six grep gates from acceptance criteria pass.

## Task Commits

1. **Task 1: Create useDurationField composable** — `111897b` (feat)

_No plan-metadata commit yet — STATE.md / ROADMAP.md / SUMMARY.md committed together as the final docs commit (see Final Commit below)._

## Files Created/Modified

- `src/composables/lextrack/useDurationField.ts` — Vue composable exporting `useDurationField(savedMinutes, savedUnit)` and the `UseDurationFieldReturn` interface. Returns `{ enteredValue: Ref<number | null>, unit: Ref<DurationUnit>, durationMinutes: ComputedRef<number | undefined>, fractionDigits: ComputedRef<number> }`. Imports `DurationUnit` from `@/types/lextrack/dsu_meetings/constants` (no relative path). No `watch()`, no I/O, no PrimeVue imports.

## Decisions Made

- **Seed-time vs runtime ownership** — The composable owns only seed-time conversion (constructor-time computation of `initialEntered` from `savedMinutes / savedUnit`). It deliberately does NOT add a `watch()` that recomputes `enteredValue` when the user toggles unit; per plan note + D-07, that runtime watcher belongs in Plan 03-05's `ManageMeeting.vue` consumer so the composable stays pure and reusable.
- **Defense-in-depth for legacy unit** — Even though `mapFromRecordMeeting` (02-04) normalizes `duration_unit ?? 'minutes'` at the read boundary, the composable also defaults `savedUnit ?? 'minutes'`. Cheap, tested-by-types, eliminates an entire class of "undefined-flows-through" bugs at the consumer.
- **No barrel file** — Per D-07 and CONVENTIONS.md, kept this as a single named export with no `index.ts`. Imports from consumer will be `@/composables/lextrack/useDurationField` directly.

## Deviations from Plan

None — plan executed exactly as written. Code matches the plan's verbatim specification character-for-character (only formatting normalized to project's 4-space indent style).

## Verification

| Check | Result |
|-------|--------|
| File exists at exact path | PASS |
| `export function useDurationField` present | PASS |
| `import type { DurationUnit } from '@/types/lextrack/dsu_meetings/constants'` present | PASS |
| Returns `enteredValue`, `durationMinutes`, `fractionDigits` (and `unit`) | PASS |
| No `export default` | PASS |
| No `from 'primevue/...'` manual imports | PASS |
| `npm run type-check` exits 0 | PASS |

## must_haves Truths Verification

| Truth | Verification |
|-------|--------------|
| 1. Seeds enteredValue + unit; legacy 'minutes' and 'hours' both round-trip | `initialUnit = savedUnit ?? 'minutes'`; entered branch on `initialUnit === 'hours' ? savedMinutes / 60 : savedMinutes` |
| 2. durationMinutes equals enteredValue when 'minutes', enteredValue * 60 when 'hours' | `unit.value === 'hours' ? enteredValue.value * 60 : enteredValue.value` (literal) |
| 3. Switching unit preserves canonical via recomputed enteredValue | Seed-time round-trip preserves canonical: `(60min, 'hours')` seeds `entered=1, unit=hours` → durationMinutes recomputes to 60. Plan 03-05 owns the runtime unit-toggle watcher (per plan's explicit instruction). |
| 4. fractionDigits is 2 when 'hours' and 0 when 'minutes' | `unit.value === 'hours' ? 2 : 0` (literal) |

## Issues Encountered

None.

## Threat Flags

None — composable is pure logic with no I/O or trust boundary. Threat T-3-04 (Tampering on conversion math) was accepted in the plan's threat register; will be unit-tested in Phase 6 (QA-01).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 03-05 (Wave 2)** can now `import { useDurationField } from '@/composables/lextrack/useDurationField'` and wire it into `ManageMeeting.vue` without any further composable changes. The plan-author's contract (four returned fields, exact types) is locked.
- **Phase 6 (QA-01)** has a tight, testable surface (one pure function, no DOM, no I/O) ready for unit tests.
- No blockers for Wave 1 sibling plans (03-02, 03-03, 03-04) — they touch disjoint files.

## Self-Check: PASSED

- File `src/composables/lextrack/useDurationField.ts` — FOUND
- Commit `111897b` — FOUND in `git log`

---
*Phase: 03-meeting-admin-ui*
*Completed: 2026-04-29*
