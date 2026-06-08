---
phase: 03-write-path
plan: "04"
subsystem: wallecx
tags:
  - crud-wiring
  - confirm-dialog
  - delete-flow
  - vue3
  - primevue
dependency_graph:
  requires:
    - 03-02  # ManageVaccination.vue shell
    - 03-03  # EXIF strip pipeline + onSubmit
  provides:
    - full-crud-ui  # user can add, edit, delete vaccination records
  affects:
    - WallecxApp.vue
    - VaccinationList.vue
tech_stack:
  added:
    - "primevue/useconfirm (explicit import — useConfirm composable)"
  patterns:
    - "server-first delete: await pb.delete() before splice (WRITE-06 / Pitfall 4)"
    - "plain-text confirm message: template literal into confirm.require — no v-html (D-09)"
    - "unshift for optimistic newest-first ordering on create"
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/WallecxApp.vue
    - src/components/projects/wallecx/VaccinationList.vue
decisions:
  - "useConfirm must be explicitly imported from primevue/useconfirm — it is NOT auto-resolved by PrimeVueResolver (Pitfall C)"
  - "ConfirmDialog component tag IS auto-resolved — no import needed in script"
  - "deleteRecord awaits pb.delete() before splice; on failure, no splice — row stays visible (Pitfall 4)"
  - "Empty-state CTA button emits addFirst which WallecxApp wires to openManage(null) — no prop drilling needed"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-05-12"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
  lines_added: 79
  lines_removed: 8
---

# Phase 3 Plan 04: WallecxApp Wiring + Delete Flow Summary

**One-liner:** Full CRUD wired in WallecxApp.vue via useConfirm/ConfirmDialog delete flow + ManageVaccination v-model binding; VaccinationList Edit/Remove enabled with empty-state CTA.

## What Was Built

This plan connects all user-facing CRUD entry points to the ManageVaccination dialog and delete confirm flow that were implemented in Plans 02 and 03.

### WallecxApp.vue Changes (commit b9691c2)

- Added explicit `import { useConfirm } from "primevue/useconfirm"` (not auto-resolved)
- Added `import ManageVaccination from "./ManageVaccination.vue"` (local component)
- Added refs: `showManage`, `manageRecord`; composable: `confirm = useConfirm()`
- Implemented `openManage(record | null)` — sets manageRecord + opens dialog
- Implemented `onCreated(created)` — `records.value.unshift(created)` (newest-first per UI-SPEC)
- Implemented `onUpdated(updatedRecord)` — find by id and replace in records array
- Implemented `openDelete(record)` — calls `confirm.require()` with plain-text message (no v-html, D-09)
- Implemented `deleteRecord(record)` — awaits `pb.collection("wallecx_vaccinations").delete(record.id)` before splice; on failure does NOT splice (Pitfall 4 / WRITE-06)
- Template: added "Add vaccination" Button in header row (D-01, always visible)
- Template: replaced `@edit="() => {}"` and `@remove="() => {}"` stubs with real handlers
- Template: added `@add-first="openManage(null)"` on VaccinationList
- Template: mounted `<ConfirmDialog />` once (D-08)
- Template: mounted `<ManageVaccination v-model:visible="showManage" v-model:record="manageRecord" @created="onCreated" @updated="onUpdated" />`

### VaccinationList.vue Changes (commit cf8cfd5)

- Added `addFirst: []` to defineEmits (D-02 empty-state CTA event)
- Removed `:disabled="true"` from Edit button
- Removed `:disabled="true"` from Remove button
- Replaced empty-state `<div>` with version that includes "Add your first vaccination" Button emitting `addFirst`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-03-04-01 | confirm.require message uses template literal — rendered as plain string by PrimeVue; no v-html |
| T-03-04-02 | deleteRecord awaits pb.delete() before splice; on failure no splice |
| T-03-04-03 | No filter-string interpolation in any pb call (getFullList uses sort param; delete uses record.id directly) |

## Verification Results

- `npm run test:unit` — PASS (10/10 tests, vaccinationMapper.spec.ts)
- `npm run type-check` — PASS (exit 0, no errors)
- `npm run build` — PASS (exit 0, WallecxApp-CMYxoApq.js 67.68 kB)
- `git grep "v-html" src/components/projects/wallecx/` — only in comment (D-09 note), no template usage
- `git grep 'disabled="true"' src/components/projects/wallecx/VaccinationList.vue` — zero hits
- `git grep 'import.*useConfirm' src/components/projects/wallecx/WallecxApp.vue` — confirmed explicit import
- Checkpoint human-verify: auto-approved (--auto flag active)

## Known Stubs

None — all event handlers are fully wired. No placeholder data. No TODO/FIXME in modified files.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | b9691c2 | feat(03-04): wire WallecxApp.vue — add button, CRUD handlers, ConfirmDialog, ManageVaccination |
| Task 2 | cf8cfd5 | feat(03-04): enable Edit/Remove buttons and add empty-state CTA in VaccinationList.vue |

## Self-Check: PASSED
