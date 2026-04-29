---
phase: 04-bugs-and-save-ux
plan: "03"
subsystem: lextrack-dialogs
tags: [vue3, primevue, dialog, refactor, emit, save-ux]
requirements: [UI-SAVE-01, UI-SAVE-03]

dependency_graph:
  requires:
    - "03-03: ManageSupport URL input (Phase 3 — provides the form fields this plan preserves)"
  provides:
    - "ManageSupport.vue presentational dialog with typed save emit and saving prop"
  affects:
    - "04-04: LexTrackView wires @save='handleSupportSave' and :saving='isSavingSupport'"

tech_stack:
  added: []
  patterns:
    - "defineEmits with typed tuple: save: [item: AddDsuSupport & { id?: string }]"
    - "defineProps<{ saving?: boolean }> for PrimeVue Button :loading binding"
    - "Emit-only save pattern — dialog stays presentational, parent owns PB call and close-on-success"

key_files:
  modified:
    - path: src/components/projects/lextrack/ManageSupport.vue
      change: "Removed toast stub + self-close; added saving prop, save emit, onSaveClick handler, :loading binding on Save button"
  created: []

decisions:
  - "Self-close (visible.value = false) removed from script per D-04: parent sets visible=false only after PB call resolves successfully — prevents dialog disappearing before error toast when save fails"
  - "Toast import/call removed from dialog: all toast responsibility moves to parent (LexTrackView handleSupportSave) per D-13 pattern"
  - "onSaveClick casts support.value as AddDsuSupport & { id?: string } — the id field comes from defineModel which accepts AddDsuSupport (no id); the cast satisfies the emit type without widening the defineModel shape"

metrics:
  duration: "2 minutes"
  completed: "2026-04-29T04:02:34Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
  files_created: 0
---

# Phase 4 Plan 03: ManageSupport Dialog — Save Emit Refactor Summary

**One-liner:** Refactored ManageSupport.vue from a toast-only stub with self-close into a presentational dialog that emits `save` with typed payload and accepts a `saving` prop for PrimeVue Button `:loading`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor ManageSupport.vue script — add saving prop, save emit, drop toast stub AND drop self-close | c8e4a59 | src/components/projects/lextrack/ManageSupport.vue |

## What Was Built

ManageSupport.vue is now a presentational dialog aligned with the Phase 4 D-22a pattern:

- **`defineProps<{ saving?: boolean }>`** — parent binds `:saving="isSavingSupport"` to control button state
- **`defineEmits<{ save: [item: AddDsuSupport & { id?: string }] }>`** — typed emit carries the current support model up to LexTrackView
- **`onSaveClick`** — single-line handler that emits `save` with `support.value`
- **`:loading="props.saving"`** on Save button — PrimeVue auto-disables and shows spinner while parent's PB call is in flight (UI-SAVE-03)
- **Removed** `import { toast } from "vue-sonner"` and `toast.success(...)` call — toasts now fire from parent
- **Removed** `visible.value = false` from the save click handler — D-04: close happens in parent only after PB call resolves successfully

The `defineModel` declarations for `visible` and `support` are byte-identical to Phase 3. The URL input (`<InputText type="url">`), title input, description Editor, and `header="Edit Admin"` dialog are all preserved.

## Verification

All acceptance criteria passed:

- `grep -c 'defineProps<{ saving?: boolean }>'` → `1`
- `grep -c 'save: \[item: AddDsuSupport & { id?: string }\]'` → `1`
- `grep -c ':loading="props.saving"'` → `1`
- `grep -c '@click="onSaveClick"'` → `1`
- `grep -c 'vue-sonner'` → `0`
- `grep -c 'toast.success'` → `0`
- `grep -c 'const updateSupport'` → `0`
- `grep -c 'visible.value = false'` → `0`
- `npm run type-check` → exit 0

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The component is a clean presentational dialog. It will receive real `:saving` and `@save` bindings from LexTrackView in Plan 04-04.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. T-04-03-02 (toast text leaking PB error details) is fully mitigated — component fires zero toasts post-refactor.

## Self-Check: PASSED

- `src/components/projects/lextrack/ManageSupport.vue` — FOUND (modified in place)
- Commit `c8e4a59` — FOUND (`git log --oneline | grep c8e4a59`)
