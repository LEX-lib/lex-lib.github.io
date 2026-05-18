---
phase: 17
plan: "02"
subsystem: wallecx
tags: [mobile, bottom-sheet, drawer, view-toggle, vaccinations, wave-2]
dependency_graph:
  requires:
    - "17-01 (useIsMobile composable + .p-drawer-bottom .p-drawer-content 85dvh cap)"
  provides:
    - "VaccinationsTab.vue: reactive Drawer position (mobile bottom sheet for vaccination group panel)"
    - "VaccinationsTab.vue: drag-handle pill in #header slot (mobile-only)"
    - "VaccinationsTab.vue: effectiveViewMode computed (forces list layout on mobile without touching viewMode ref)"
    - "VaccinationsTab.vue: showToggle && !isMobile (hides view toggle on mobile)"
  affects:
    - "17-03 (MembershipsTab v-if/v-else Dialog/Drawer split — sibling Wave 2 plan; independent file)"
tech_stack:
  added: []
  patterns:
    - "First reactive PrimeVue Drawer :position binding in the codebase (D-04)"
    - "First custom <template #header> slot on PrimeVue Drawer (D-05)"
    - "Read-only computed layer above a persisted ref (effectiveViewMode over viewMode) — preserves sessionStorage round-trip across resizes (D-12, D-13)"
key_files:
  created: []
  modified:
    - "src/components/projects/wallecx/VaccinationsTab.vue"
decisions:
  - "D-04 implemented: <Drawer :position=\"isMobile ? 'bottom' : 'right'\"> — :breakpoints prop removed (superseded)"
  - "D-05 implemented: drag handle pill rendered via custom #header slot with v-if=\"isMobile\"; title always rendered as <span class=\"font-semibold\">"
  - "D-11 implemented: WallecxToolbar :show-toggle adds && !isMobile — toggle hidden on mobile, toolbar component itself unchanged (D-15 preserved)"
  - "D-12 implemented: effectiveViewMode computed reads isMobile ? 'list' : viewMode.value; gridClass reads effectiveViewMode (viewMode ref and sessionStorage watch untouched)"
  - "D-13 preserved: no sessionStorage reset on resize — when user returns to desktop, effectiveViewMode falls back to stored viewMode value"
  - "D-15 preserved: WallecxToolbar.vue NOT modified (verified via git status)"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-05-18"
  tasks_completed: 2
  files_changed: 1
  commits: 2
---

# Phase 17 Plan 02: VaccinationsTab — Reactive Drawer + Mobile View Toggle Suppression Summary

Wired the Wave 1 `useIsMobile` composable into `VaccinationsTab.vue` to deliver four mobile UX behaviours from a single tightly-scoped file change: bottom-sliding Drawer on mobile (right-sliding on desktop), drag-handle pill in the Drawer header (mobile-only), hidden grid/list toggle on mobile, and forced list layout on mobile via a read-only `effectiveViewMode` computed that leaves the persisted `viewMode` preference untouched.

## What Shipped

### Files Modified

**`src/components/projects/wallecx/VaccinationsTab.vue`**
- Added `import { useIsMobile } from "@/composables/useIsMobile";` after the existing `WallecxToolbar` import.
- Instantiated `const isMobile = useIsMobile();` alongside `viewMode` and other state refs.
- Added `const effectiveViewMode = computed(() => isMobile.value ? 'list' : viewMode.value);` immediately before the existing `gridClass` computed, with a comment block documenting D-12/D-13.
- Changed `gridClass` to read `effectiveViewMode.value === 'list'` (was `viewMode.value === 'list'`).
- `WallecxToolbar :show-toggle` binding now ends with `&& !isMobile` so the grid/list toggle is hidden on mobile while still allowing the underlying `v-model:view-mode="viewMode"` to round-trip to sessionStorage on desktop.
- Drawer for the vaccination group detail panel:
  * `position="right"` replaced with `:position="isMobile ? 'bottom' : 'right'"` (reactive — D-04).
  * `:header="selectedGroup?.vaccineType ?? ''"` removed and replaced with a custom `<template #header>` slot.
  * `:breakpoints="{ '641px': '92vw' }"` removed (superseded by reactive position — D-04).
  * `:style="{ width: '30rem' }"` and `v-model:visible`, `@hide` handler unchanged.
  * New `#header` slot renders a centered flex column containing a `v-if="isMobile"` drag-handle pill (`w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600` with `aria-hidden="true"`) above a `<span class="font-semibold">` title (always rendered).
- `viewMode` ref declaration, `onMounted` sessionStorage read, and `watch(viewMode, ...)` sessionStorage write — all unchanged (D-12).

## Acceptance Criteria — All Pass

### Task 1 (script: useIsMobile + effectiveViewMode + gridClass)
- [x] File contains `import { useIsMobile } from "@/composables/useIsMobile";`.
- [x] File contains `const isMobile = useIsMobile();`.
- [x] File contains `const effectiveViewMode = computed(() => isMobile.value ? 'list' : viewMode.value);`.
- [x] File contains `effectiveViewMode.value === 'list'` inside `gridClass`.
- [x] File still contains `const viewMode = ref<'grid' | 'list'>('grid');` (underlying ref unchanged).
- [x] File still contains the `watch(viewMode, ...)` block with `sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, next);` (watch unchanged).
- [x] `viewMode\.value === 'list'` not present anywhere (replaced).
- [x] `npm run type-check` exits 0.

### Task 2 (template: Drawer position, #header slot, showToggle, drag handle pill)
- [x] Contains `:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0 && !isMobile"`.
- [x] Contains `:position="isMobile ? 'bottom' : 'right'"`.
- [x] Contains `<template #header>` with the drag handle pill markup: `w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600`, `aria-hidden="true"`, and `v-if="isMobile"`.
- [x] Contains `{{ selectedGroup?.vaccineType ?? '' }}` inside `<span class="font-semibold">`.
- [x] No `position="right"` static attribute (replaced by reactive binding).
- [x] No `:header="selectedGroup?.vaccineType ?? ''"` prop (replaced by #header slot — mutually exclusive in PrimeVue Drawer).
- [x] No `:breakpoints="{ '641px': '92vw' }"` on the Drawer (removed; the only remaining `:breakpoints` is on the unrelated VaccinationDetail Dialog at line 460).
- [x] `@hide="selectedGroup = null"` handler unchanged.
- [x] `<Dialog v-model:visible="showDetail">` (VaccinationDetail) and `<ManageVaccination v-model:visible="showManage">` blocks unchanged.
- [x] `npm run type-check` exits 0.
- [x] `npm run build-only` exits 0.
- [x] `WallecxToolbar.vue` NOT in `git status` modified files (anti-regression D-15 preserved).

### Plan-Level
- [x] Each task committed atomically.
- [x] Only `VaccinationsTab.vue` modified by this plan.
- [x] All four success criteria (UX-01, UX-03 vaccination side, UX-04 vaccination side, MOB-09) delivered.

## Verification Output

- `npm run type-check` → exit 0.
- `npm run build-only` → exit 0; `dist/assets/WallecxApp-Cd27_xlJ.js` 183.48 kB (gzip 52.41 kB); PWA precache 56 entries (4964.23 KiB).

## Commits

| # | Hash      | Task                                                                                          | Files                                            |
|---|-----------|-----------------------------------------------------------------------------------------------|--------------------------------------------------|
| 1 | `b302b41` | `feat(17-02): wire useIsMobile and effectiveViewMode into VaccinationsTab`                    | `src/components/projects/wallecx/VaccinationsTab.vue` |
| 2 | `1b7ce14` | `feat(17-02): reactive Drawer position, drag-handle pill header, hide toggle on mobile`       | `src/components/projects/wallecx/VaccinationsTab.vue` |

## Pitfalls Avoided

- **`:breakpoints` prop and reactive `:position` are mutually conflicting.** The `:breakpoints="{ '641px': '92vw' }"` rule resized the right-side Drawer at narrow widths but never changed its anchor edge. Once `:position` itself responds to viewport, the breakpoints rule is meaningless and was removed entirely — confirmed by grep that returns zero hits for the exact prop on the Drawer.
- **`:header` prop vs `#header` slot are mutually exclusive in PrimeVue Drawer.** The `:header="selectedGroup?.vaccineType ?? ''"` was deleted at the same time the `<template #header>` slot was introduced. If both had been left, PrimeVue would have rendered the static prop and ignored the slot, breaking the drag-handle pill on mobile.
- **`v-model:view-mode="viewMode"` kept binding to the underlying ref (not `effectiveViewMode`).** This was the critical D-12/D-13 invariant: the toolbar must keep two-way binding to `viewMode` so the user's desktop selection still round-trips to sessionStorage. Only the *display* layer (`gridClass`) reads `effectiveViewMode`. If we had bound the toolbar to `effectiveViewMode`, a mobile session would silently overwrite the user's desktop preference with `'list'` on first interaction.
- **`WallecxToolbar.vue` was not touched.** D-15 (toolbar is the control point, callers decide visibility) was preserved by routing the mobile-suppression logic through the existing `showToggle` prop. Verified via `git status` — only `VaccinationsTab.vue` is in the modified set for this plan.
- **`viewMode` ref + sessionStorage watch left untouched.** Both the declaration on line 30 and the `watch(viewMode, ...)` block on lines 170–176 are byte-for-byte unchanged from before the plan started. Verified via direct line read.

## Deviations from Plan

None — plan executed exactly as written. CONTEXT.md §Specific Ideas drag-handle pill markup used verbatim. Comment blocks added inline with the new code reference the relevant decisions (D-12, D-13, D-04, D-05) for future readers.

## Hand-off to Plan 17-03 (Wave 2 sibling)

Plan 17-03 (MembershipsTab v-if/v-else Dialog/Drawer split) is independent of this plan — different file, different decisions (D-06/D-07/D-08). Both Wave 2 plans share only:
- `useIsMobile` composable (Wave 1 17-01).
- `.p-drawer-bottom .p-drawer-content { max-height: 85dvh }` CSS rule from 17-01, which now also applies to the new bottom-positioned vaccination Drawer at runtime.

The drag-handle pill markup in this plan is the canonical reference for plan 17-03's identical-but-unconditional pill in the MembershipsTab `<Drawer v-else>` branch.

## Self-Check: PASSED

- `src/components/projects/wallecx/VaccinationsTab.vue` modifications verified via Grep.
- Commits `b302b41` and `1b7ce14` exist in `git log`.
- `WallecxToolbar.vue` NOT modified (verified via `git status`).
- `npm run type-check` exit 0; `npm run build-only` exit 0.
