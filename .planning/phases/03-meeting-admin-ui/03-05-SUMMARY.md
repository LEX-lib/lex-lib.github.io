---
phase: 03-meeting-admin-ui
plan: 05
subsystem: ui
tags: [vue, lextrack, dialog, duration-toggle, select-button, composable-consumer]

# Dependency graph
requires:
  - phase: 03-meeting-admin-ui
    plan: 01
    provides: "useDurationField composable (src/composables/lextrack/useDurationField.ts) — bidirectional min/hr conversion"
  - phase: 02-types-mappers
    provides: "AddDsuMeeting type (duration_unit?: DurationUnit), DSU_MEETING_DURATION_UNIT_VALUES + _LABELS"
provides:
  - "Meeting edit dialog wired to InputNumber + SelectButton flex row with composable-driven round-trip"
  - "Reference-identity meeting watcher to re-seed enteredValue/unit when parent rebinds"
  - "Output watcher mirroring durationMinutes/unit back to v-model meeting"
  - "Aura-default Meeting dialog visuals (no dark Tailwind overrides)"
affects: [03-06, 04-*, 06-quality-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composable consumer pattern: parent owns runtime watchers wrapping a pure-logic composable"
    - "Reference-identity watcher (() => meeting.value) over deep watch to avoid feedback loop with output writer"
    - "PrimeVue SelectButton with :allow-empty='false' to lock the union type domain"
    - "Reactive InputNumber :max-fraction-digits driven by composable's fractionDigits computed (D-05)"

key-files:
  created: []
  modified:
    - src/components/projects/lextrack/ManageMeeting.vue

key-decisions:
  - "Reference-identity watch on meeting.value (not deep) — deep watcher would fight the output writer's writes and create a feedback loop"
  - "Output writer assigns BOTH duration_minutes and duration_unit on every change, not just minutes — D-03 requires both fields stay in sync"
  - "Inline ?? 'minutes' fallback in re-seed watcher matches the composable's defense-in-depth on top of mapper-layer normalization (D-04 legacy behavior)"
  - "SelectButton :allow-empty='false' chosen over leaving default — without it the user could deselect both options and push unit to null, violating the DurationUnit union"
  - "updateMeeting body unchanged (still toast-only) per D-17 — Phase 4 (UI-SAVE-01) owns persistence"
  - "editorStyle constant + :pt override removed (D-18); ref + Toaster imports removed (oxlint correctness baseline, mirrors 03-03)"

patterns-established:
  - "ManageMeeting and ManageSupport now share the same Aura-default dialog body shell ('space-y-4 p-4' wrapper, no dark overrides, indigo Save button)"
  - "Composable-with-watcher consumer pattern is now reusable for any future entity that needs the same UX"

requirements-completed: [UI-MEET-01, UI-MEET-02, UI-MEET-03]

# Metrics
duration: ~2min
completed: 2026-04-29
---

# Phase 3 Plan 05: ManageMeeting Duration Toggle Integration Summary

**Wire the `useDurationField` composable + SelectButton into `ManageMeeting.vue` so meeting durations round-trip faithfully between `(1 hr / 60 min)` and `(55 mins)`, while stripping dark Tailwind overrides and keeping the indigo Save button — all without crossing the Phase 4 persistence boundary.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-29T00:52:23Z
- **Completed:** 2026-04-29T00:54:36Z
- **Tasks:** 1
- **Files modified:** 1

## What Changed

### `src/components/projects/lextrack/ManageMeeting.vue`

**Script setup**
- Imported `watch` from `vue` (replacing the unused `ref`).
- Dropped `Toaster` from `vue-sonner` (was unused).
- Imported `DSU_MEETING_DURATION_UNIT_VALUES`, `DSU_MEETING_DURATION_UNIT_LABELS`, and the `DurationUnit` type from `@/types/lextrack/dsu_meetings/constants`.
- Imported `useDurationField` from `@/composables/lextrack/useDurationField` (Wave 1 / 03-01 dependency).
- Removed the `editorStyle` constant (was only consumed by the now-deleted `:pt` override on `<Editor>`).
- Seeded the composable from the current meeting at script-setup time:
  ```ts
  const { enteredValue, unit, durationMinutes, fractionDigits } = useDurationField(
    meeting.value.duration_minutes,
    meeting.value.duration_unit,
  );
  ```
- Added a **reference-identity watcher** on `meeting.value` that re-seeds `enteredValue` and `unit` when the parent binds a different meeting (e.g. user opens a different row). Inline conversion mirrors the composable's seed-time logic so legacy meetings (`duration_unit === undefined`) default to `'minutes'`.
- Added an **output watcher** on `[durationMinutes, unit]` that writes both `duration_minutes` and `duration_unit` back into `meeting.value` on every UI change.
- Built `durationUnitOptions` once at module level by mapping the constants tuple to `{ value, label }` records consumable by SelectButton.
- `updateMeeting` body unchanged in spirit — still `toast.success('Meeting is updated successfully!')`. Added a one-line comment marking the Phase 4 boundary (UI-SAVE-01).

**Template**
- Removed the dark wrapper classes `bg-gray-700/50 rounded-lg` from the outer dialog body `div`. Kept `space-y-4 p-4` per D-20.
- Removed `bg-gray-700 text-white` from the title `InputText`'s `class` (now plain `class="w-full"`).
- **Replaced** the single duration row:
  ```vue
  <InputNumber v-model="meeting.duration_minutes" placeholder="Duration (minutes)"
               class="w-full" inputClass="bg-gray-700 text-white w-full rounded-md" />
  ```
  with a **flex row** of InputNumber bound to `enteredValue` + SelectButton bound to `unit`:
  ```vue
  <div class="flex gap-2 items-center">
    <InputNumber v-model="enteredValue" placeholder="Duration" class="flex-1"
                 :min="0" :min-fraction-digits="0"
                 :max-fraction-digits="fractionDigits" />
    <SelectButton v-model="unit" :options="durationUnitOptions"
                  optionLabel="label" optionValue="value"
                  :allow-empty="false" aria-label="Duration unit" />
  </div>
  ```
  Per D-02, the toggle sits to the right of the input. Per D-05, `:max-fraction-digits` is reactive (2 when hours, 0 when minutes). Per D-06, options come from the constants module.
- Removed `:pt="editorStyle"` from `<Editor>` so it renders default Quill styling (D-18).
- Kept the Save button's `bg-indigo-600 hover:bg-indigo-700` Tailwind utilities per D-19 (matches the Aura indigo preset configured in `src/main.ts`).
- Dialog `header="Add New Meeting"`, `position="right"`, `:style="{ width: '40vw' }"`, modal flag, `<style scoped></style>` empty block — all left intact.

## Plan must_haves Truth Table (10 truths)

| # | Truth | Verification |
|---|-------|--------------|
| 1 | Meeting dialog shows InputNumber + SelectButton on the same row | Template wraps both in `<div class="flex gap-2 items-center">` |
| 2 | SelectButton offers two options ('minutes', 'hours') labeled 'min' and 'hr' | `durationUnitOptions = DSU_MEETING_DURATION_UNIT_VALUES.map(v => ({ value: v, label: DSU_MEETING_DURATION_UNIT_LABELS[v] }))` — VALUES is `['minutes','hours'] as const`, LABELS is `{ minutes: 'min', hours: 'hr' }` |
| 3 | Entering 1 with unit='hours' writes duration_minutes=60 and duration_unit='hours' back into the v-model | Composable `durationMinutes = unit==='hours' ? entered*60 : entered` (1*60=60); output watcher writes both fields |
| 4 | Entering 55 with unit='minutes' writes duration_minutes=55 and duration_unit='minutes' | Composable returns `entered` directly when unit='minutes'; output watcher writes both |
| 5 | A meeting saved with duration_minutes=120 / duration_unit='hours' opens displaying entered=2, toggle=hr | Composable seed: `initialUnit='hours'` → `initialEntered = 120/60 = 2`; refs default to those values |
| 6 | A meeting saved with duration_minutes=55 / duration_unit='minutes' opens displaying entered=55, toggle=min | Composable seed: `initialUnit='minutes'` → `initialEntered = 55` (no division) |
| 7 | A legacy meeting with duration_minutes=30 / duration_unit=undefined opens displaying entered=30, toggle=min | Composable seed: `savedUnit ?? 'minutes'` → unit='minutes' → entered = savedMinutes (30); the re-seed watcher in the consumer applies the same `?? 'minutes'` fallback for parent-side rebinds |
| 8 | InputNumber maxFractionDigits=2 when unit=hours, =0 when unit=minutes | `:max-fraction-digits="fractionDigits"` bound to `computed(() => unit.value === 'hours' ? 2 : 0)` |
| 9 | Dialog body has no dark Tailwind overrides | `! grep -q "bg-gray-700"` and `! grep -q "text-white"` PASS; `:pt="editorStyle"` removed; outer wrapper is plain `space-y-4 p-4` |
| 10 | Save button keeps bg-indigo-600 / hover:bg-indigo-700 | `class="w-full bg-indigo-600 hover:bg-indigo-700"` preserved on the Button |

## Verification

| Gate | Command | Result |
|------|---------|--------|
| Type-check | `npm run type-check` | PASS |
| oxlint correctness | `npx oxlint src/components/projects/lextrack/ManageMeeting.vue -D correctness` | PASS (0 warnings, 0 errors) |
| Composable file from Wave 1 exists | `test -f src/composables/lextrack/useDurationField.ts` | PASS |
| `useDurationField` imported and called | grep | PASS (double-quoted; functionally equivalent to plan's single-quoted gate text) |
| `<SelectButton` present | grep | PASS |
| `v-model="unit"` on SelectButton | grep | PASS |
| `v-model="enteredValue"` on InputNumber | grep | PASS |
| `:max-fraction-digits="fractionDigits"` reactive (D-05) | grep | PASS |
| `DSU_MEETING_DURATION_UNIT_VALUES` and `_LABELS` imported (D-06) | grep | PASS |
| Round-trip watcher present (`next.duration_minutes / 60`) | grep | PASS |
| Write-back watcher writes both fields (D-03) | grep | PASS |
| `:allow-empty="false"` on toggle | grep | PASS |
| `class="flex gap-2 items-center"` flex row (D-02) | grep | PASS |
| Dark backgrounds stripped (D-18, `! grep "bg-gray-700"`) | grep | PASS |
| `text-white` stripped | grep | PASS |
| Editor `:pt="editorStyle"` removed (D-18) | grep | PASS |
| `editorStyle` constant dropped | grep | PASS |
| Indigo Save preserved (D-19) | grep | PASS |
| Dialog header unchanged (`header="Add New Meeting"`) | grep | PASS |
| No PocketBase persistence added (Phase 4 boundary) | `! grep -q "pb.collection"` | PASS |
| No `console.log` | grep | PASS |
| No manual PrimeVue component imports | grep | PASS |

All 21 acceptance criteria pass. The single grep gate the plan author wrote with single-quoted import path (`from '@/composables/lextrack/useDurationField'`) was satisfied semantically — the file uses double-quoted strings (`from "@/composables/lextrack/useDurationField"`), matching the plan's verbatim spec snippet which itself uses double quotes throughout. Documented here for traceability; no functional difference.

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | e38b4fc | feat(03-05): wire useDurationField + SelectButton in ManageMeeting.vue |

## Deviations from Plan

None — plan executed exactly as written. Code matches the plan's verbatim specification character-for-character (formatting normalized to project's 2-space indent style for Vue templates, matching existing `ManageSupport.vue` after 03-03).

## Threat Model Compliance

- **T-3-04 (Tampering, useDurationField → meeting.duration_minutes)** — Mitigate disposition. The conversion math lives in the composable (`useDurationField.ts`), is deterministic, and is gated on the InputNumber's `:min="0"` (rejects negative values client-side). PB validation enforces non-negative server-side. Phase 6 (QA-01) will add unit tests for the composable's conversion behavior.

No new threat surface introduced.

## Boundary Compliance

- **Phase 4 boundary (D-17, ROADMAP)** — `updateMeeting` still toasts and closes the dialog; no `pb.collection` calls added. UI-SAVE-01 will replace the body in Phase 4.
- **D-13 (label rename scoped to LexTrackView only)** — Dialog header `"Add New Meeting"` and filename unchanged.
- **D-27 (no type changes in Phase 3)** — `src/types/lextrack/dsu_meetings/types.ts` and `constants.ts` not touched; `duration_unit?: DurationUnit` was added to `AddDsuMeeting` in Phase 2 plan 02-01.

## Threat Flags

None — all surface introduced by this plan was anticipated by the plan's own `<threat_model>` (T-3-04, mitigate). No new endpoints, no auth paths, no file access, no schema changes.

## Issues Encountered

None.

## User Setup Required

None — composable is pre-built (Wave 1), constants and types pre-existing (Phase 2), PrimeVue SelectButton auto-imports.

## Next Plan Readiness

- **Plan 03-06 (Phase gate)** — All four ROADMAP Phase 3 success criteria touching meetings are now satisfied by code:
  - SC1 (meeting form min/hr toggle, 1 hr → 60 min round-trip) — wired via this plan.
  - SC2 (legacy `duration_minutes`-only render with toggle defaulted to minutes) — wired via this plan + composable's `?? 'minutes'`.
  - SC3 (admin URL + clickable link icon) — wired by 03-02 + 03-03.
  - SC4 (Admin section label) — wired by 03-04.
  - SC5 (lint + console.log + commented Dialog block clean) — wired by 03-04.
- **Phase 4 (UI-SAVE-01)** can now replace `updateMeeting`'s body with a `pb.collection('dsu_meetings').create / update` call without touching the duration UI; both `meeting.duration_minutes` and `meeting.duration_unit` are kept in sync by the output watcher.
- **Phase 6 (QA-01)** has a clean composable surface (already covered) plus a component surface (this dialog) with a deterministic round-trip table to test against.

## Self-Check: PASSED

- File `src/components/projects/lextrack/ManageMeeting.vue` — FOUND
- Commit `e38b4fc` — FOUND in `git log`
- Composable file `src/composables/lextrack/useDurationField.ts` (Wave 1 dependency) — FOUND

---
*Phase: 03-meeting-admin-ui*
*Completed: 2026-04-29*
