---
phase: 04-bugs-and-save-ux
plan: 01
subsystem: lextrack-dialog
tags: [vue3, primevue, dialog, refactor, emit, loading-state]
requirements: [UI-SAVE-01, UI-SAVE-03]

dependency_graph:
  requires:
    - "03-05: ManageMeeting duration composable wiring (Phase 3 final)"
    - "02-01: AddDsuMeeting type definition"
  provides:
    - "ManageMeeting presentational dialog with save emit and saving prop"
    - "Foundation for 04-04: parent @save handler wiring"
  affects:
    - "04-04: LexTrackView must wire @save='handleMeetingSave' and :saving='isSavingMeeting'"

tech_stack:
  added: []
  patterns:
    - "defineEmits<{ save: [item: T] }> typed emit carrying dialog model value"
    - "defineProps<{ saving?: boolean }> bound to PrimeVue Button :loading"
    - "onSaveClick single-line emit handler replacing toast stub"

key_files:
  created: []
  modified:
    - src/components/projects/lextrack/ManageMeeting.vue

decisions:
  - "Cast meeting.value as AddDsuMeeting & { id?: string } in onSaveClick — safe because parent v-models the same DsuMeetingItem reference (Pitfall #6 from RESEARCH.md)"
  - "Used props.saving (explicit) rather than bare saving in template binding — consistent with codebase convention of explicit prop access"
  - "Preserved defineModel shapes for visible and meeting exactly — Phase 3 wiring is final"

metrics:
  duration: "2 minutes"
  completed: "2026-04-29T04:02:41Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 4 Plan 01: ManageMeeting Save Emit Refactor Summary

**One-liner:** ManageMeeting.vue refactored from toast-only stub to presentational dialog emitting typed `save` event with `saving` prop wired to PrimeVue Button `:loading`.

## What Was Built

Surgical refactor of `src/components/projects/lextrack/ManageMeeting.vue` to make it a fully presentational dialog component:

- **Removed** `import { toast } from "vue-sonner"` and the `updateMeeting()` toast stub
- **Added** `defineProps<{ saving?: boolean }>()` so the parent can drive the Save button spinner
- **Added** `defineEmits<{ save: [item: AddDsuMeeting & { id?: string }] }>()` matching the `update`/`remove` emit pattern from `ActivityCard.vue`
- **Added** `onSaveClick()` single-line handler: `emit('save', meeting.value as AddDsuMeeting & { id?: string })`
- **Updated** Save button: `<Button :loading="props.saving" @click="onSaveClick" ...>`
- **Preserved** all Phase 3 `useDurationField` wiring (import + invocation + two watchers + SelectButton options) byte-for-byte

## Verification

All acceptance criteria passed:

| Check | Result |
|-------|--------|
| `defineProps<{ saving?: boolean }>` count = 1 | PASS |
| `save: [item: AddDsuMeeting & { id?: string }]` count = 1 | PASS |
| `:loading="props.saving"` count = 1 | PASS |
| `@click="onSaveClick"` count = 1 | PASS |
| `vue-sonner` count = 0 | PASS |
| `toast.success` count = 0 | PASS |
| `const updateMeeting` count = 0 | PASS |
| `useDurationField` count = 2 (import + call) | PASS |
| `npm run type-check` exits 0 | PASS |

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Refactor ManageMeeting: emit save, saving prop, drop toast stub | 6435556 |

## Deviations from Plan

None — plan executed exactly as written. All four steps (remove toast import, add props/emits, replace updateMeeting, update button) applied cleanly.

## Known Stubs

None. The component now correctly emits `save` upward. Parent wiring (`@save="handleMeetingSave"` and `:saving="isSavingMeeting"`) lands in Plan 04-04 as designed.

## Threat Flags

No new threat surface introduced. This plan moves toast responsibility from the dialog to the parent — net reduction in information-disclosure risk (T-04-01-02 from the plan's threat model: dialog now fires no toasts, so raw PB error details can never leak through this component).

## Self-Check

- [x] File exists: `src/components/projects/lextrack/ManageMeeting.vue` — FOUND
- [x] Commit exists: `6435556` — FOUND (git log --oneline confirms)
