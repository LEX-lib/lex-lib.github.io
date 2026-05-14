---
phase: 15-mobile-layouts
plan: 01
subsystem: ui
tags: [vue3, tailwind, primevue, ios, safe-area, pwa, viewport-meta]

# Dependency graph
requires:
  - phase: 14-pwa-foundation
    provides: WallecxApp.vue shell, PWA service worker, navigator.storage.persist pattern
provides:
  - viewport-fit=cover and interactive-widget=resizes-content in index.html (all env() CSS functions now non-zero on notch devices)
  - env(safe-area-inset-top) on CustomNavBar in App.vue (notch clearance)
  - env(safe-area-inset-bottom/left/right) + overscroll-none on WallecxApp.vue Card root (home indicator clearance, pull-to-refresh lock)
  - Global .p-dialog-content CSS override (max-height 80dvh + overflow-y auto) for all 4 Wallecx dialogs
affects: [15-02-touch-targets, 15-03-pwa-install-banner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Safe-area insets via inline :style with env(safe-area-inset-*) — requires viewport-fit=cover in meta"
    - "Non-scoped <style> block in SFC for targeting PrimeVue internal DOM classes (.p-dialog-content)"
    - "Tailwind overscroll-none on scroll container root prevents iOS pull-to-refresh"

key-files:
  created: []
  modified:
    - index.html
    - src/App.vue
    - src/components/projects/wallecx/WallecxApp.vue

key-decisions:
  - "Top safe-area placed on CustomNavBar in App.vue (not inside CustomNavBar.vue) — single touch point, avoids modifying shared component"
  - "Non-scoped <style> block mandatory for .p-dialog-content — scoped adds data-v- attribute that never matches PrimeVue internal DOM"
  - "overscroll-none via Tailwind class (not inline style) — Tailwind v4 generates overscroll-behavior: none correctly"
  - "MembershipsTab.vue and VaccinationsTab.vue grid classes already correct — no edits required (D-14, D-15 confirmed)"

patterns-established:
  - "Pattern: viewport-fit=cover, safe-area padding, and overscroll lock must ship together — never ship viewport-fit=cover alone (Pitfall 2)"
  - "Pattern: non-scoped <style> in WallecxApp.vue for global PrimeVue CSS overrides targeting .p-* classes"

requirements-completed: [MOB-01, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07]

# Metrics
duration: 10min
completed: 2026-05-14
---

# Phase 15 Plan 01: Viewport Foundation Summary

**viewport-fit=cover + interactive-widget=resizes-content in index.html, env(safe-area-inset-top) on CustomNavBar, env(safe-area-inset-bottom/left/right) + overscroll-none + global .p-dialog-content scroll fix on WallecxApp.vue root**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-14T09:20:00Z
- **Completed:** 2026-05-14T09:30:00Z
- **Tasks:** 3 (2 edit tasks + 1 verify-only task)
- **Files modified:** 3 (index.html, src/App.vue, src/components/projects/wallecx/WallecxApp.vue)

## Accomplishments

- Viewport meta updated with `viewport-fit=cover` and `interactive-widget=resizes-content` — env() CSS functions now resolve to non-zero values on notch iPhones; keyboard-triggered layout shift handled declaratively by the browser
- CustomNavBar in App.vue gets `paddingTop: env(safe-area-inset-top)` — notch / Dynamic Island no longer overlaps the nav bar
- WallecxApp.vue Card root gets `overscroll-none` class and `paddingBottom/Left/Right: env(safe-area-inset-*)` — home indicator clearance on all sides, iOS pull-to-refresh disabled during card grid scrolling
- Empty `<style scoped>` block replaced with non-scoped `<style>` containing `.p-dialog-content { max-height: 80dvh; overflow-y: auto; }` — all 4 Wallecx CRUD dialogs constrained and scrollable when iOS soft keyboard is open
- MembershipsTab.vue and VaccinationsTab.vue grid classes verified correct (`grid grid-cols-1 sm:grid-cols-2 gap-4` on all 3 locations) — no edits needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Update viewport meta in index.html and add top safe-area to App.vue** - `394ee37` (feat)
2. **Task 2: Add safe-area insets, overscroll lock, and global dialog CSS to WallecxApp.vue** - `9378a9b` (feat)
3. **Task 3: Verify responsive grid classes in MembershipsTab.vue and VaccinationsTab.vue** - verify-only, no commit needed

## Files Created/Modified

- `index.html` — viewport meta updated: appended `viewport-fit=cover, interactive-widget=resizes-content`
- `src/App.vue` — CustomNavBar element receives `:style="{ paddingTop: 'env(safe-area-inset-top)' }"`
- `src/components/projects/wallecx/WallecxApp.vue` — Card root gets `class="overscroll-none"` and `:style` with bottom/left/right env() values; empty `<style scoped>` replaced with non-scoped `<style>` block containing global `.p-dialog-content` rule

## Decisions Made

- Top safe-area padding applied to `<CustomNavBar>` in App.vue (not inside CustomNavBar.vue) — this avoids modifying the shared nav component and keeps the inset at the shell boundary where it belongs
- Non-scoped `<style>` block is mandatory for `.p-dialog-content` — Vue SFC `scoped` compiles to `.p-dialog-content[data-v-xxxxxx]` which never matches PrimeVue's internally rendered DOM
- `overscroll-none` Tailwind class used (not inline style) — Tailwind v4 correctly generates `overscroll-behavior: none` and is the established pattern

## Deviations from Plan

None — plan executed exactly as written. Task 3 grid class verification confirmed classes already correct (D-14, D-15), no edits required as expected.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Viewport foundation is complete. All `env(safe-area-inset-*)` values will now resolve on notch devices.
- Plan 02 (touch targets) can proceed independently — it reads WallecxToolbar.vue, VaccinationGroupPanel.vue, MembershipCard.vue, VaccinationGroupCard.vue.
- Plan 03 (PwaInstallBanner.vue) can proceed independently — it creates a new component and renders it from WallecxApp.vue.
- No blockers.

## Known Stubs

None — all changes are direct CSS/style additions with no placeholder values.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. CSS env() values are browser-provided read-only constants (T-15-01 accepted). Non-scoped `.p-dialog-content` CSS rule affects only max-height/overflow with no security boundary crossed (T-15-02 accepted).

## Self-Check: PASSED

- `index.html` modified: confirmed (grep returns line 6 match for `viewport-fit=cover`)
- `src/App.vue` modified: confirmed (grep returns line 10 match for `safe-area-inset-top`)
- `src/components/projects/wallecx/WallecxApp.vue` modified: confirmed (overscroll-none line 66, p-dialog-content line 104)
- Commit `394ee37` exists: confirmed (`git log --oneline`)
- Commit `9378a9b` exists: confirmed (`git log --oneline`)
- `npm run type-check` passes: confirmed (zero errors)

---
*Phase: 15-mobile-layouts*
*Completed: 2026-05-14*
