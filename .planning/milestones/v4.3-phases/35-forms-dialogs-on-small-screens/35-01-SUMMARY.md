---
phase: 35-forms-dialogs-on-small-screens
plan: "01"
subsystem: wallecx
tags: [mobile, dialog, drawer, pwa, ios, css]
dependency_graph:
  requires:
    - 34-layout-audit-touch-targets (DragHandle.vue, wallecx-overrides.css Phase-34 rules, useMobileEnv)
    - 33-mobile-foundation (useMobileEnv.ts composable)
  provides:
    - BaseMobileDialog.vue slot contract (v-model:visible, title, isDirty, isSaving; #default + #actions slots; closeWithoutGuard)
    - wallecx-overrides.css FD-01 + LT-08 rules
  affects:
    - Plans 35-02 through 35-05 (all Manage dialog migrations consume BaseMobileDialog)
tech_stack:
  added: []
  patterns:
    - defineModel + defineExpose pattern for wrapper components
    - Drawer @before-hide + :dismissable=false for dirty-guard intercept
    - useConfirm().require() to singleton ConfirmDialog (CON-CONFIRMDIALOG-SINGLETON)
    - requestAnimationFrame + scrollIntoView({ block: center }) for FD-06 auto-scroll
    - position:sticky inside overflow-y:auto scroll container for sticky action bar
key_files:
  created:
    - src/components/projects/wallecx/BaseMobileDialog.vue
  modified:
    - src/assets/wallecx-overrides.css
decisions:
  - "D-35-01 confirmed: Dialog/Drawer split owned by BaseMobileDialog via useMobileEnv().isMobile"
  - "Pitfall 6 enforced: .wallecx-manage-actions padding-bottom is flat 0.5rem (NOT env(safe-area-inset-bottom)) — Phase-34 .p-drawer-content already absorbs the home indicator"
  - "D-35-09 confirmed: useConfirm().require() calls the WallecxApp.vue singleton ConfirmDialog; zero new <ConfirmDialog instances added"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-28"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 35 Plan 01: BaseMobileDialog.vue + wallecx-overrides.css Foundation Summary

**One-liner:** BaseMobileDialog.vue Dialog/Drawer wrapper with dirty-guard via Drawer before-hide + useConfirm singleton, DragHandle header, focusin scrollIntoView auto-scroll, and FD-01 16px iOS no-zoom + LT-08 sticky action bar CSS appended to wallecx-overrides.css.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create BaseMobileDialog.vue wrapper | 0141f40 | src/components/projects/wallecx/BaseMobileDialog.vue |
| 2 | Append FD-01 + sticky bar CSS to wallecx-overrides.css | 0a916b1 | src/assets/wallecx-overrides.css |

---

## What Was Built

### BaseMobileDialog.vue (FD-07)

A slot-based `<script setup lang="ts">` wrapper that owns the Dialog/Drawer split for all 4 Wallecx Manage dialogs. Key capabilities:

- **Dialog/Drawer split:** `v-if="isMobile"` renders `<Drawer position="bottom">` on mobile (≤639px); `v-else` renders `<Dialog modal>` on desktop. `isMobile` sourced from `useMobileEnv()` — the Phase-33 single source of truth.
- **Slot contract:** `#default` for form body (rendered once — eliminates Phase-34 v-if/v-else form duplication); `#actions` for Save/Cancel buttons routed to sticky bar on mobile / Dialog `#footer` on desktop.
- **Dirty guard (FD-09):** Drawer `@before-hide` fires on backdrop tap, swipe-down, and Esc. Guard checks `props.isDirty` — if dirty, calls `useConfirm().require()` with "Discard changes?" copy (Contract 6). Not dirty → drives close manually (`:dismissable="false"` blocks auto-close). Save/Cancel bypass via `_bypassGuard` flag set by `closeWithoutGuard()`.
- **closeWithoutGuard():** Exposed via `defineExpose`; children call this from their Save success path and explicit Cancel handler to skip the dirty guard.
- **Auto-scroll (FD-06):** `onFocusin` handler on the form container div calls `requestAnimationFrame(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }))` — mobile-only via `if (!isMobile.value) return`.
- **DragHandle:** Rendered in Drawer `#header` slot as decorative pill (Phase-34 component, no props).
- **Dark-mode CSS:** `:deep(.my-app-dark .p-dialog)` and `:deep(.my-app-dark .p-drawer)` overrides consolidated from all 4 Manage dialogs into one `<style scoped>` block.
- **No second ConfirmDialog:** Calls `useConfirm().require()` only. `grep -rc "<ConfirmDialog" src/components/projects/wallecx/` returns exactly 1 (WallecxApp.vue).

### wallecx-overrides.css additions (FD-01 + LT-08)

Two rules appended after the Phase-34 `.p-drawer-content` safe-area padding rule (append-only — no existing rules modified):

**FD-01 rule:** `@media (max-width: 640px)` sets `font-size: 16px !important` on `.p-inputtext`, `.p-inputnumber-input`, `.p-textarea`, `.p-select-label`, `.p-multiselect-label`, `.p-datepicker-input`. Prevents iOS Safari from auto-zooming focused inputs (NFR-IOS-NO-ZOOM). Non-scoped to reach teleported overlay DOM.

**LT-08 rule:** `.wallecx-manage-actions { position: sticky; bottom: 0; padding-top: 1rem; padding-bottom: 0.5rem; ... }`. Sticky action bar inside scrollable Drawer/Dialog content. Critical: `padding-bottom: 0.5rem` is FLAT — not `env(safe-area-inset-bottom)`. The outer `.p-drawer-content` already absorbs the home indicator via `max(env(safe-area-inset-bottom), 1.25rem)` (Phase 34 Pitfall 6 — no double-stack).

---

## Automated Gates

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run build` | 0 errors, 0 "exceeds"/"Skipping precaching" lines; 57 precache entries |
| `npm run test:unit` | 59/59 tests pass |
| `grep -rc "<ConfirmDialog" src/components/projects/wallecx/` | Exactly 1 (WallecxApp.vue) |

---

## Deviations from Plan

None — plan executed exactly as written. The `_bypassGuard` flag pattern was used (as specified in the plan's action block) rather than the `:bypass-guard` prop alternative mentioned in RESEARCH.md §2, because the plan explicitly specified the flag approach with `closeWithoutGuard()` expose — consistent with the "cleanest" alternative noted in the research.

---

## Known Stubs

None. BaseMobileDialog.vue is a complete implementation — all slots, guards, and auto-scroll are wired. The CSS rules are complete. No placeholder data or stub patterns introduced.

---

## Threat Flags

No new threat surface introduced. All three threats in the plan's `<threat_model>` are accepted:
- T-35-01 (dirty guard tampering): guard governs dismissal UX only, no data flow to PocketBase
- T-35-02 (scrollIntoView DoS): mobile-only, debounced by rAF, single listener on one container
- T-35-03 (FD-01 CSS info disclosure): pure presentation, no data exposure

---

## Self-Check: PASSED

- [x] `src/components/projects/wallecx/BaseMobileDialog.vue` — exists (created at 0141f40)
- [x] `src/assets/wallecx-overrides.css` FD-01 rule — present (`.p-datepicker-input`, `font-size: 16px`)
- [x] `src/assets/wallecx-overrides.css` LT-08 rule — present (`.wallecx-manage-actions`, `position: sticky`, `padding-bottom: 0.5rem`)
- [x] No `env(safe-area-inset-bottom)` in `.wallecx-manage-actions` block (Pitfall 6 confirmed clean)
- [x] Phase-34 `.p-drawer-content` rule unchanged
- [x] Commit 0141f40 exists (BaseMobileDialog.vue)
- [x] Commit 0a916b1 exists (wallecx-overrides.css)
- [x] type-check: 0 errors
- [x] build: 0 errors, 57 precache entries, 0 "exceeds"/"Skipping precaching"
- [x] test:unit: 59/59 pass
- [x] ConfirmDialog: exactly 1 in WallecxApp.vue
