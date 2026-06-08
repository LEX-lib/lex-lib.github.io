---
phase: 17
plan: "03"
subsystem: wallecx
tags: [mobile, bottom-sheet, drawer, dialog, v-if-v-else, wave-2]
dependency_graph:
  requires:
    - "17-01 (useIsMobile composable + .p-drawer-bottom .p-drawer-content 85dvh cap)"
  provides:
    - "MembershipsTab.vue v-if/v-else Dialog/Drawer split around <MembershipDetail>"
  affects:
    - "Mobile UX for the Memberships tab (UX-02, UX-03, UX-04 — membership side)"
tech_stack:
  added: []
  patterns:
    - "First v-if/v-else Dialog/Drawer split in the codebase — both wrappers share v-model:visible, @hide handler, and child component with identical event wiring"
    - "Custom <template #header> slot on PrimeVue Drawer rendering a drag handle pill above the title"
key_files:
  created: []
  modified:
    - "src/components/projects/wallecx/MembershipsTab.vue"
decisions:
  - "D-06 implemented: desktop renders <Dialog v-if=\"!isMobile\">, mobile renders <Drawer v-else position=\"bottom\">"
  - "D-07 implemented: 85dvh cap inherited from the shared .p-drawer-bottom .p-drawer-content rule (plan 17-01); no per-component CSS"
  - "D-08 implemented: identical @hide=\"selectedRecord = null; fileToken = ''\" handler on both wrappers; openEdit (lines 122–126) already closes detail before opening manage — unchanged"
  - "D-14 preserved (anti-regression): WallecxToolbar in MembershipsTab continues to pass :show-toggle=\"false\" — no toolbar change"
  - "D-15 preserved (anti-regression): WallecxToolbar.vue not modified"
  - "MembershipDetail.vue not modified (Files Untouched per 17-CONTEXT.md): only its wrapper changes"
  - "Drag handle pill is unconditional inside the Drawer (no v-if=\"isMobile\") because the Drawer is itself the v-else mobile branch — pill is implicitly mobile-only"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-18"
  tasks_completed: 2
  files_changed: 1
  commits: 2
---

# Phase 17 Plan 03: MembershipDetail Bottom Sheet (Mobile) Summary

Wave 2 consumer of the `useIsMobile` composable from plan 17-01. Splits the existing centered `<Dialog>` wrapper around `<MembershipDetail>` in `MembershipsTab.vue` into a `v-if="!isMobile"` Dialog (desktop, unchanged) and a `v-else` `<Drawer position="bottom">` (mobile, new). Both wrappers share the same `v-model:visible`, `@hide` handler, and child `<MembershipDetail>` — only the chrome differs.

## What Shipped

### Files Modified

**`src/components/projects/wallecx/MembershipsTab.vue`** (+35 / −1 lines)
- Added import: `import { useIsMobile } from '@/composables/useIsMobile'` (single-quote, no-semicolon, matches file style).
- Added ref: `const isMobile = useIsMobile()` immediately after `const confirm = useConfirm()`.
- Wrapped the existing Dialog with `v-if="!isMobile"` as the **first** attribute so the `v-else` sibling pairing is unambiguous; modal/header/style/breakpoints/`v-model:visible`/`@hide`/child block are otherwise unchanged.
- Added `<Drawer v-else v-model:visible="showDetail" position="bottom" @hide="…">` as the mobile branch with a custom `<template #header>` slot rendering a centered drag handle pill (`w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600`, `aria-hidden="true"`) above a `<span class="font-semibold">Membership Card</span>` title.
- The same `<MembershipDetail v-if="selectedRecord" :record :token @edit @delete />` child block lives inside each wrapper — the `v-if="selectedRecord"` guard is preserved in both branches.
- No `<script setup>` function (`openDetail`, `openEdit`, `openManage`, `openDelete`, `deleteCard`, `onCreated`, `onUpdated`) was touched.
- `<WallecxToolbar :show-toggle="false">` block (lines 180–186) was not touched (D-14 anti-regression).
- `<ManageMembership>` block was not touched.

### Files Untouched (Anti-Regression)

- `src/components/projects/wallecx/MembershipDetail.vue` — wrapper-only change, child component unchanged.
- `src/components/projects/wallecx/WallecxToolbar.vue` — D-15.
- `src/components/projects/wallecx/ManageMembership.vue` — out of scope.
- `src/composables/useIsMobile.ts` — created in plan 17-01, only consumed here.
- `src/assets/wallecx-overrides.css` — `.p-drawer-bottom .p-drawer-content { max-height: 85dvh }` rule from 17-01 is the height cap; no per-component CSS added.

## Acceptance Criteria — All Pass

### Task 1 (Imports + isMobile ref)
- [x] Exact `import { useIsMobile } from '@/composables/useIsMobile'` line present.
- [x] Exact `const isMobile = useIsMobile()` line present.
- [x] `const confirm = useConfirm()` unchanged.
- [x] WallecxToolbar block with `:show-toggle="false"` unchanged.
- [x] `npm run type-check` exits 0.

### Task 2 (v-if Dialog / v-else Drawer split)
- [x] `<Dialog v-if="!isMobile" v-model:visible="showDetail" …>` is the desktop branch — all original props/handlers preserved.
- [x] `<Drawer v-else v-model:visible="showDetail" position="bottom" @hide="…">` is the mobile branch.
- [x] Both wrappers have exactly the same `@hide="selectedRecord = null; fileToken = ''"` handler (D-08).
- [x] `<MembershipDetail` appears exactly twice in the file template (one per wrapper) — verified by grep.
- [x] Drag handle pill markup present inside Drawer `#header` slot with `w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600`, `aria-hidden="true"`, and `<span class="font-semibold">Membership Card</span>`.
- [x] `<MembershipDetail v-if="selectedRecord" …>` guard preserved inside both wrappers.
- [x] `<WallecxToolbar … :show-toggle="false" />` block preserved (D-14).
- [x] `<ManageMembership v-model:visible="showManage" …>` block preserved.
- [x] `MembershipDetail.vue` NOT in `git diff --name-only HEAD~2 HEAD` (anti-regression).
- [x] `WallecxToolbar.vue` NOT in `git diff --name-only HEAD~2 HEAD` (anti-regression).
- [x] `npm run type-check` exits 0.
- [x] `npm run build-only` exits 0.

### Plan-Level
- [x] Each task committed atomically.
- [x] `git diff --name-only HEAD~2 HEAD` returns exactly `src/components/projects/wallecx/MembershipsTab.vue`.

## Verification Output

- `npm run type-check` → exit 0 (no new TS errors).
- `npm run build-only` → exit 0; build emitted `dist/assets/WallecxApp-y7r3HMYE.js` 184.08 kB (gzip 52.54 kB). Drawer is auto-resolved by `PrimeVueResolver` — no explicit import needed; bundle size delta is minimal (~1 kB JS) since `<Drawer>` was already in the Wallecx chunk via `VaccinationsTab.vue`.
- `git diff --name-only HEAD~2 HEAD` → exactly one path: `src/components/projects/wallecx/MembershipsTab.vue`.

## Commits

| # | Hash      | Task                                                                                                                  | Files                                                  |
|---|-----------|-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| 1 | `91e818a` | `feat(17-03): import useIsMobile and add isMobile ref to MembershipsTab`                                              | `src/components/projects/wallecx/MembershipsTab.vue`   |
| 2 | `0b0c102` | `feat(17-03): split MembershipDetail wrapper into Dialog/Drawer-bottom by viewport`                                   | `src/components/projects/wallecx/MembershipsTab.vue`   |

## Pitfalls Avoided

- **Double `v-model:visible` binding race.** Both wrappers bind `v-model:visible="showDetail"`, but only one renders at a time (mutually exclusive via `v-if`/`v-else`), so there is no double-binding hazard — confirmed by PATTERNS.md §MembershipsTab.vue ("only one renders at a time, no double-binding risk").
- **MembershipDetail.vue accidental modification.** The plan explicitly forbids touching the child; verified via `git diff --name-only HEAD~2 HEAD` — only `MembershipsTab.vue` is in the diff.
- **Toolbar regression on Memberships tab.** D-14 anti-regression: `:show-toggle="false"` is preserved on `<WallecxToolbar>` in this file. No toolbar code path changed.
- **Pill conditional drift from VaccinationsTab pattern.** In `VaccinationsTab.vue` (plan 17-02), the pill uses `v-if="isMobile"` because the same Drawer renders on both desktop (right) and mobile (bottom) with reactive `:position`. Here, the Drawer itself is the mobile-only `v-else` branch, so the pill is unconditional — matching PATTERNS.md guidance.
- **Edit/Delete flow asymmetry.** Both wrappers wire `@edit="openEdit(selectedRecord!)"` and `@delete="openDelete(selectedRecord!)"` to the SAME child component instance shape. `openEdit` already toggles `showDetail.value = false` before `showManage.value = true`, so the same close-detail-then-open-manage sequence runs whether the closed wrapper is the Dialog or the Drawer.
- **No-op @hide on backdrop tap and close button.** PrimeVue Drawer fires `@hide` on both backdrop tap and built-in close button (same as Dialog), so the `selectedRecord = null; fileToken = ''` clear runs in every dismiss path.

## Deviations from Plan

None — plan executed exactly as written. CONTEXT.md §Specific Ideas markup and PATTERNS.md §MembershipsTab.vue expanded snippet used verbatim. Style (single quotes, no semicolons in the new lines) matches the file's existing convention.

## Hand-off

This is the final Wave 2 plan for Phase 17 (Memberships side). Combined with plan 17-02 (Vaccinations side, separate Wave 2), Phase 17 success criteria SC-2, SC-3, and SC-4 are now fully covered for both tabs:
- **SC-2:** On phones, tapping a membership card opens a bottom-sliding Drawer (no centered Dialog). ✅
- **SC-3:** Bottom sheet dismissible via backdrop tap or PrimeVue's built-in close button (default Drawer behavior preserved). ✅
- **SC-4 (membership side):** On desktop, membership card detail opens as a centered Dialog — identical pre-phase behavior. ✅

## Self-Check: PASSED

- `src/components/projects/wallecx/MembershipsTab.vue` contains `import { useIsMobile } from '@/composables/useIsMobile'` (verified via Grep, line 11).
- `src/components/projects/wallecx/MembershipsTab.vue` contains `const isMobile = useIsMobile()` (verified via Grep, line 21).
- `<Drawer v-else position="bottom">` block with drag handle pill and `<MembershipDetail>` child verified via Grep (line 283 `v-else`, line 291 pill class).
- Two `@hide=` occurrences confirmed via `grep -c` (2).
- Two `<MembershipDetail` tag usages confirmed via Grep at lines 272 and 297.
- `:show-toggle="false"` still present (1 occurrence via `grep -c`).
- Commits `91e818a` and `0b0c102` exist in `git log` on the current branch.
- `git diff --name-only HEAD~2 HEAD` returns exactly `src/components/projects/wallecx/MembershipsTab.vue` — no collateral damage to `MembershipDetail.vue`, `WallecxToolbar.vue`, or `ManageMembership.vue`.
