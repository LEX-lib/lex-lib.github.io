---
phase: 17
plan: "01"
subsystem: wallecx
tags: [mobile, composable, css-override, foundation, wave-1]
dependency_graph:
  requires: []
  provides:
    - "src/composables/useIsMobile.ts (reactive Ref<boolean> for mobile breakpoint)"
    - ".p-drawer-bottom .p-drawer-content { max-height: 85dvh } in wallecx-overrides.css"
  affects:
    - "Wave 2 plans 17-02 and 17-03 (consumers of useIsMobile and the bottom-Drawer cap)"
tech_stack:
  added: []
  patterns:
    - "First composable in src/composables/ — establishes convention for reactive composables"
    - "Extends the Phase 15 wallecx-overrides.css teleport-aware override pattern (.p-dialog-content) to PrimeVue Drawer (.p-drawer-bottom .p-drawer-content)"
key_files:
  created:
    - "src/composables/useIsMobile.ts"
  modified:
    - "src/assets/wallecx-overrides.css"
decisions:
  - "D-01 confirmed: 85dvh cap for bottom-anchored Drawer content (15% backdrop visible for tap-to-dismiss)"
  - "D-02 confirmed: CSS override (not :deep() in component <style scoped>) — same teleport-to-body rationale as Phase 15 .p-dialog-content rule"
  - "D-02 scoping refinement: selector is .p-drawer-bottom .p-drawer-content (descendant of position-wrapper class), NOT unscoped .p-drawer-content — prevents desktop right-side Drawer height regression"
  - "D-09 confirmed: useIsMobile composable shape uses MediaQueryList change listener (option A from CONTEXT.md §Claude's Discretion) — registered onMounted, removed onUnmounted"
  - "D-10 confirmed: 639px breakpoint matches Tailwind sm: threshold (640px)"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-18"
  tasks_completed: 2
  files_changed: 2
  commits: 2
---

# Phase 17 Plan 01: Foundation (useIsMobile composable + bottom-Drawer CSS cap) Summary

Foundation layer for Phase 17 mobile bottom sheets: introduced the first `src/composables/` entry (`useIsMobile`) as a reactive `Ref<boolean>` over `window.matchMedia('(max-width: 639px)')`, and extended the Wallecx CSS override file with a position-scoped `.p-drawer-bottom .p-drawer-content { max-height: 85dvh }` rule that leaves desktop right-side Drawer height untouched.

## What Shipped

### Files Created

**`src/composables/useIsMobile.ts`** (21 lines)
- New directory `src/composables/` (first composable in the project).
- Named export `useIsMobile(breakpoint = 639): Ref<boolean>`.
- Initial value seeded synchronously from `window.matchMedia(...).matches` so consumers see the correct value on first render.
- `MediaQueryList.addEventListener('change', handler)` registered in `onMounted`; mirrored `removeEventListener` in `onUnmounted` to avoid listener leaks across consumer unmount/remount cycles.
- Single-quote, no-semicolon TS style (matches the newer `MembershipsTab.vue`); type-only import for `Ref`.
- Wave 2 consumers will import via `@/composables/useIsMobile`.

### Files Modified

**`src/assets/wallecx-overrides.css`** (+13 lines)
- Header `Covers:` comment extended to mention "the bottom-anchored Drawer used by VaccinationGroupPanel and MembershipDetail wrappers on mobile (Phase 17 D-01, D-02)".
- Existing `.p-dialog-content { max-height: 80dvh; overflow-y: auto }` rule **left intact** (no edits).
- Appended `.p-drawer-bottom .p-drawer-content { max-height: 85dvh; overflow-y: auto }` block, prefaced with a comment block explaining the scoping rationale and tap-to-dismiss backdrop allowance.

## Acceptance Criteria — All Pass

### Task 1 (useIsMobile composable)
- [x] File `src/composables/useIsMobile.ts` exists.
- [x] Contains exact `export function useIsMobile(breakpoint = 639): Ref<boolean>` signature.
- [x] Contains `window.matchMedia(\`(max-width: ${breakpoint}px)\`)` template literal interpolation.
- [x] Contains `query.addEventListener('change', handler)`.
- [x] Contains `query.removeEventListener('change', handler)`.
- [x] Contains `onMounted(` and `onUnmounted(`.
- [x] Imports from `'vue'` with `type Ref` in the import list.
- [x] `npm run type-check` exits 0.

### Task 2 (wallecx-overrides.css)
- [x] Contains exact selector `.p-drawer-bottom .p-drawer-content {`.
- [x] Rule body contains both `max-height: 85dvh` and `overflow-y: auto`.
- [x] Original `.p-dialog-content` rule with `max-height: 80dvh` is still present.
- [x] Regression guard: `grep ^\.p-drawer-content` returns zero matches (no unscoped rule).
- [x] Header comment contains both `Phase 17` and `bottom-anchored Drawer`.
- [x] `npm run build-only` exits 0 (CSS parses, bundled into Wallecx chunk).

### Plan-Level
- [x] Each task committed atomically.
- [x] No Vue components or unrelated files touched (`git diff --name-only HEAD~2 HEAD` shows exactly the two intended files).

## Verification Output

- `npm run type-check` → exit 0 (no new TS errors).
- `npm run build-only` → exit 0; build emitted `dist/assets/WallecxApp-BP1HCkpS.js` 183.00 kB (gzip 52.22 kB). CSS bundled into the Wallecx lazy-loaded chunk as designed. PWA precache (56 entries, 4963.76 KiB) generated.

## Commits

| # | Hash      | Task                                                                  | Files                                  |
|---|-----------|-----------------------------------------------------------------------|----------------------------------------|
| 1 | `78e897c` | `feat(17-01): add useIsMobile reactive media-query composable`        | `src/composables/useIsMobile.ts`       |
| 2 | `d036ac3` | `feat(17-01): cap bottom-anchored Drawer content at 85dvh`            | `src/assets/wallecx-overrides.css`     |

## Pitfalls Avoided

- **Unscoped `.p-drawer-content` would cap desktop right-side Drawer too.** The selector is explicitly `.p-drawer-bottom .p-drawer-content` so the existing desktop VaccinationGroupPanel (`position="right"`) keeps its 30rem-wide full-height Drawer. Verified via the regression-guard grep for `^\.p-drawer-content` (zero matches).
- **Listener leak across consumer unmount.** `addEventListener` is mirrored by `removeEventListener` in `onUnmounted`. Same handler reference is reused for add/remove so removal is effective.
- **Initial-value timing.** Initial `isMobile` value is seeded synchronously from `query.matches` (not deferred to `onMounted`) so SSR-shaped first render and the first synchronous render both see the correct value — important because Wave 2 templates branch on `isMobile` immediately (`v-if="!isMobile"` Dialog vs `v-else` Drawer in MembershipsTab).
- **No premature consumer wiring.** `VaccinationsTab.vue`, `MembershipsTab.vue`, `MembershipDetail.vue`, `VaccinationGroupPanel.vue`, `WallecxToolbar.vue` and `WallecxApp.vue` are all untouched — Wave 2 plans (17-02, 17-03) will consume the foundation.

## Deviations from Plan

None — plan executed exactly as written. CONTEXT.md §Specific Ideas code snippets used verbatim per the plan's action block. Style (single quotes, no semicolons) matches the plan's explicit instruction (PATTERNS.md §TypeScript style notes — MembershipsTab.vue style).

## Hand-off to Wave 2

Wave 2 plans (17-02 and 17-03) can now:
- `import { useIsMobile } from '@/composables/useIsMobile'` in `VaccinationsTab.vue` and `MembershipsTab.vue`.
- Render `<Drawer position="bottom">` instances knowing their `.p-drawer-content` is automatically capped at 85dvh and scrolls internally — no per-component CSS work required.
- Render `<Drawer position="right">` (existing VaccinationGroupPanel desktop case) without height regression — the 85dvh cap is scoped to bottom-position Drawers only.

## Self-Check: PASSED

- `src/composables/useIsMobile.ts` exists (verified).
- `src/assets/wallecx-overrides.css` contains the new scoped rule and retains the original (verified via Grep).
- Commits `78e897c` and `d036ac3` exist in `git log` on the current branch (verified below).
