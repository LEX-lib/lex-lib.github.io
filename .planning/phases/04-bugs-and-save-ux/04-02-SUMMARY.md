---
phase: 04-bugs-and-save-ux
plan: "02"
subsystem: lextrack/dialogs
tags: [vue3, primevue, dialog, refactor, emit, loading-state]
requirements: [UI-SAVE-01, UI-SAVE-03]

dependency_graph:
  requires:
    - "src/types/lextrack/dsu_tasks/types.ts (AddDsuTask — Phase 2 final)"
    - "ActivityCard.vue defineEmits pattern (Phase 3)"
  provides:
    - "ManageTask.vue presentational dialog that emits `save` and accepts `saving` prop"
  affects:
    - "src/views/LexTrackView.vue (Plan 04-04 will wire @save handler and :saving binding)"

tech_stack:
  added: []
  patterns:
    - "defineProps<{ saving?: boolean }> for PrimeVue :loading binding"
    - "defineEmits<{ save: [item: T & { id?: string }] }> typed event payload"
    - "onSaveClick emits save event; parent owns PB call and toast"

key_files:
  modified:
    - path: "src/components/projects/lextrack/ManageTask.vue"
      description: "Refactored from local toast stub to presentational dialog emitting save event"

decisions:
  - "D-22a confirmed: emit save event up to parent, matching existing update/remove pattern from ActivityCard"
  - "D-08 applied: PrimeVue Button :loading auto-disables; no separate :disabled needed"
  - "Toast import + toast.success call removed from dialog; toasts move to parent in Plan 04-04"

metrics:
  duration_minutes: 2
  completed_date: "2026-04-29T04:02:33Z"
  tasks_completed: 1
  files_modified: 1
---

# Phase 4 Plan 02: ManageTask Save Emit Refactor Summary

ManageTask.vue refactored from a local toast-only stub into a presentational dialog that emits a typed `save` event carrying the task payload and accepts a `saving` prop wired to PrimeVue Button `:loading`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor ManageTask.vue — add saving prop, save emit, drop toast stub | b96928e | src/components/projects/lextrack/ManageTask.vue |

## What Was Built

`ManageTask.vue` is now a fully presentational dialog component:

- **`saving?: boolean` prop** added via `defineProps<{ saving?: boolean }>()` — bound to Save button's `:loading` for spinner + auto-disable during in-flight PB calls (UI-SAVE-03, D-08).
- **`save` emit** added via `defineEmits<{ save: [item: AddDsuTask & { id?: string }] }>()` — fires when user clicks Save, carrying the current `task.value` cast to `AddDsuTask & { id?: string }` (UI-SAVE-01, D-22a).
- **`onSaveClick`** replaces the `updateTask` toast stub — delegates persistence to the parent by emitting `save`.
- **`toast` import and `toast.success` call removed** — toast firing now belongs to the parent's `handleTaskSave` handler (Plan 04-04, D-13).
- **`defineModel` declarations for `visible` and `task` unchanged** — Phase 3 work preserved exactly.
- **Save button updated** from `@click="updateTask"` to `:loading="props.saving" @click="onSaveClick"`.

## Verification Results

All acceptance criteria passed:

| Check | Result |
|-------|--------|
| `defineProps<{ saving?: boolean }>` count = 1 | PASS |
| `save: [item: AddDsuTask & { id?: string }]` count = 1 | PASS |
| `:loading="props.saving"` count = 1 | PASS |
| `@click="onSaveClick"` count = 1 | PASS |
| `vue-sonner` count = 0 | PASS |
| `toast.success` count = 0 | PASS |
| `const updateTask` count = 0 | PASS |
| `npm run type-check` exits 0 | PASS |

## Deviations from Plan

None — plan executed exactly as written. All four steps applied in order, no unexpected issues.

## Known Stubs

None. The dialog is intentionally presentational until Plan 04-04 wires the parent handler. The `@save` event is real and typed; the parent wiring is the next planned step, not a stub in this component.

## Threat Surface Scan

No new threat surface introduced. The dialog emits only — no PB calls, no network access, no new endpoints. The STRIDE threat register in the plan's `<threat_model>` covers all relevant paths:

- T-04-02-01 (rapid double-click): mitigated by PrimeVue `:loading` auto-disable.
- T-04-02-02 (toast leaking PB errors): mitigated — component fires no toasts post-refactor.
- T-04-02-03 (stale auth token): transferred to parent's catch block (Plan 04-04).
- T-04-02-04 (jira_link injection): unchanged — ActivityCard's `noopener,noreferrer` window.open is the mitigation (Phase 3, T-3-01).

## Self-Check: PASSED

- `src/components/projects/lextrack/ManageTask.vue` — file exists and was modified.
- Commit `b96928e` exists in git log.
- No unexpected file deletions.
- No untracked generated files.
