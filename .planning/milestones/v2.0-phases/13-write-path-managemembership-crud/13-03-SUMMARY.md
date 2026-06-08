---
phase: 13-write-path-managemembership-crud
plan: "03"
subsystem: wallecx/memberships
tags: [vue3, primevue, crud, confirm-dialog, server-first-delete, emits, write-state]
dependency_graph:
  requires:
    - 13-02-SUMMARY.md  # ManageMembership.vue built in Plan 02
    - 12-04-SUMMARY.md  # MembershipsTab.vue read path from Phase 12
  provides:
    - src/components/projects/wallecx/MembershipDetail.vue  # extended with edit/delete emits
    - src/components/projects/wallecx/MembershipsTab.vue    # extended with full CRUD write state
  affects:
    - Full membership card CRUD flow end-to-end
tech_stack:
  added: []
  patterns:
    - useConfirm explicit import (not auto-resolved by PrimeVueResolver)
    - Server-first delete — await pb.delete() before splice; no splice on failure
    - defineEmits<{ edit: []; delete: [] }> cross-component emit pattern
    - openEdit: close-detail-first then open-manage transition (D-05)
    - unshift prepend for newest-first ordering on create
    - In-place record replacement on update (findIndex + array index assignment)
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/MembershipDetail.vue
    - src/components/projects/wallecx/MembershipsTab.vue
decisions:
  - "ConfirmDialog NOT added to MembershipsTab.vue — WallecxApp.vue instance at line 33 used per D-06; useConfirm broadcasts to the app-shell-level instance"
  - "openEdit closes detail dialog before opening manage to avoid overlapping modal stacking"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 13 Plan 03: MembershipsTab + MembershipDetail Write Path Wiring Summary

**One-liner:** MembershipsTab.vue extended with full CRUD write state (useConfirm, showManage, deleteCard server-first), MembershipDetail.vue extended with Edit/Delete action button emits wired through to ManageMembership dialog.

## What Was Built

### MembershipDetail.vue — Edit/Delete action emits

Added `defineEmits<{ edit: []; delete: [] }>` to the script setup and an action row at the bottom of the detail content (inside the root `<div class="flex flex-col gap-4">`, after the Card Photo section, before the Teleport scan overlay block):

- **Edit button** — `severity="secondary"`, `icon="pi pi-pencil"`, `aria-label="Edit card"`, emits `'edit'`
- **Delete button** — `severity="danger"`, `icon="pi pi-trash"`, `aria-label="Delete card"`, emits `'delete'`
- Teleport scan overlay (lines 165+) untouched

### MembershipsTab.vue — Full CRUD write state

**New imports:**
- `useConfirm` from `primevue/useconfirm` (explicit — not auto-resolved)
- `ManageMembership` from `./ManageMembership.vue`

**New state:**
- `showManage = ref<boolean>(false)`
- `manageRecord = ref<Memberships | null>(null)`
- `const confirm = useConfirm()`

**New handlers:**
- `openEdit(record)` — sets manageRecord, closes detail, opens manage (D-05)
- `openManage(record | null)` — sets manageRecord, opens manage (for CTA buttons)
- `openDelete(record)` — `confirm.require()` with plain-text message including card_name (D-11)
- `deleteCard(record)` — server-first `await pb.delete()`, splice only on success, error toast on failure (no splice)
- `onCreated(created)` — `records.value.unshift(created)` prepend for newest-first
- `onUpdated(updatedRecord)` — `findIndex` + in-place array index replace

**Template changes:**
- "Add card" header button: `:disabled="true"` removed, `@click="openManage(null)"` added
- "Add your first card" empty-state button: same change
- `<MembershipDetail>` gains `@edit="openEdit(selectedRecord!)"` and `@delete="openDelete(selectedRecord!)"`
- `<ManageMembership v-model:visible="showManage" v-model:record="manageRecord" :token="fileToken" @created="onCreated" @updated="onUpdated" />` added after the detail Dialog

**Critical omission enforced:** No `<ConfirmDialog />` tag added — WallecxApp.vue line 33 provides the single app-shell instance (D-06).

## Commits

| Hash | Message |
|------|---------|
| 908c8cb | feat(13-03): extend MembershipDetail.vue with edit/delete emits and action buttons |
| ba17bb4 | feat(13-03): extend MembershipsTab.vue with full CRUD write state and handlers |

## Deviations from Plan

None — plan executed exactly as written.

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `defineEmits` in MembershipDetail.vue — 1 line | PASS |
| `emit('edit')` and `emit('delete')` — 1 line each | PASS |
| `pi-pencil` and `pi-trash` icons | PASS |
| `aria-label="Edit card"` and `aria-label="Delete card"` | PASS |
| Teleport — 2 lines (opening + closing, unchanged) | PASS |
| `useConfirm` explicit import in MembershipsTab.vue | PASS |
| `ManageMembership` import | PASS |
| `showManage` — ≥3 lines | PASS — 4 lines |
| `manageRecord` — ≥3 lines | PASS — 4 lines |
| `openManage(null)` — 2 lines (both CTA buttons) | PASS |
| `openEdit` + `openDelete` — ≥4 lines | PASS — 4 lines |
| server-first delete pattern (splice only on success) | PASS |
| `records.value.unshift` — 1 line (onCreated) | PASS |
| `ConfirmDialog` — 0 lines in MembershipsTab.vue | PASS |
| `v-model:visible="showManage"` — 1 line | PASS |
| `@created="onCreated"` and `@updated="onUpdated"` | PASS |
| `npm run type-check` exits 0 | PASS |
| `npm run build` exits 0 | PASS |
| `npm run test:unit` — 24 tests passing | PASS |

## Threat Surface Scan

All STRIDE mitigations from plan threat model implemented:

| Threat ID | Mitigation | Implemented |
|-----------|-----------|-------------|
| T-13-03-01 | card_name in confirm message via template literal — not v-html | PASS — `confirm.require({ message: \`Delete "${record.card_name}"?...\` })` |
| T-13-03-02 | Server-first delete — splice only after await pb.delete() | PASS |
| T-13-03-03 | Cross-user delete rejected by PocketBase deleteRule | PASS — transfer to server (Phase 11) |
| T-13-03-04 | No ConfirmDialog tag in MembershipsTab.vue | PASS |
| T-13-03-05 | Stale selectedRecord on race — accepted low risk | PASS — openEdit is synchronous |

No new threat surface introduced beyond plan's threat model.

## Known Stubs

None — all CRUD paths are fully wired end-to-end. Both CTA buttons call `openManage(null)`. Detail dialog Edit/Delete buttons emit through to live handlers in MembershipsTab. ManageMembership.vue (Plan 02) handles real PocketBase create/update. deleteCard awaits real PocketBase delete.

## Checkpoint Reached

This plan ends at a `checkpoint:human-verify` gate. The two auto tasks are complete and committed. Human verification of the full CRUD flow in the browser is required before Phase 13 is marked complete.

## Self-Check: PASSED

- MembershipDetail.vue: FOUND (908c8cb committed)
- MembershipsTab.vue: FOUND (ba17bb4 committed)
- Commit 908c8cb: FOUND — feat(13-03): extend MembershipDetail.vue with edit/delete emits and action buttons
- Commit ba17bb4: FOUND — feat(13-03): extend MembershipsTab.vue with full CRUD write state and handlers
- 24 tests passing: CONFIRMED
- type-check: PASS
- build: PASS
