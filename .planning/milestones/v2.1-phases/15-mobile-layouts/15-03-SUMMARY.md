---
phase: 15-mobile-layouts
plan: 03
subsystem: ui
tags: [vue3, pwa, ios, safari, install-banner, teleport, localstorage]

# Dependency graph
requires:
  - phase: 15-mobile-layouts
    plan: 01
    provides: WallecxApp.vue with overscroll-none, safe-area insets, and non-scoped style block
provides:
  - PwaInstallBanner.vue: iOS Safari-only fixed bottom install guidance strip with localStorage dismiss
  - WallecxApp.vue: imports and renders PwaInstallBanner as a sibling after the Card root
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "iOS Safari detection via navigator.userAgent with CriOS/FxiOS/OPiOS exclusions"
    - "Standalone mode check: matchMedia + navigator.standalone (belt-and-suspenders for legacy iOS)"
    - "All localStorage access in try/catch for private browsing compatibility (silent degradation)"
    - "Teleport to body to escape WallecxApp.vue stacking context and PrimeVue Dialog z-indexes"
    - "Vue 3 Fragment: PwaInstallBanner rendered as sibling after Card in WallecxApp.vue template"

key-files:
  created:
    - src/components/projects/wallecx/PwaInstallBanner.vue
  modified:
    - src/components/projects/wallecx/WallecxApp.vue

key-decisions:
  - "amber color #e89820 (not #f59e0b) used for share icon — UI-SPEC takes precedence over RESEARCH.md example"
  - "isVisible starts as false in ref — banner hidden until onMounted confirms all three conditions (iOS Safari + not standalone + not dismissed)"
  - "z-50 (z-index 50) chosen — above normal content, below PrimeVue Dialogs (~1100) and scan overlay (9999)"
  - "paddingBottom uses inline style calc(env(safe-area-inset-bottom) + 0.75rem) — replaces py-3 bottom half"

patterns-established:
  - "Pattern: Teleport to body for fixed UI that must escape PrimeVue stacking context — mirrors scan overlay pattern"
  - "Pattern: localStorage try/catch for private browsing — established pattern from WallecxApp.vue navigator.storage.persist()"

requirements-completed: [MOB-01, MOB-08]

# Metrics
duration: 2min
completed: 2026-05-14
---

# Phase 15 Plan 03: PWA Install Banner Summary

**PwaInstallBanner.vue created with iOS Safari detection (isIosSafari excludes CriOS/FxiOS/OPiOS), isInStandaloneMode (matchMedia + navigator.standalone), localStorage dismiss with try/catch, Teleport to body, amber share icon, white text, 44px dismiss button; wired into WallecxApp.vue as a sibling after the Card root**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-14T09:40:00Z
- **Completed:** 2026-05-14T09:42:00Z
- **Tasks:** 2 (both edit tasks)
- **Files modified:** 2 (PwaInstallBanner.vue created; WallecxApp.vue modified)

## Accomplishments

- `PwaInstallBanner.vue` created at `src/components/projects/wallecx/PwaInstallBanner.vue` with complete iOS detection, standalone check, localStorage dismiss, and Teleport-to-body fixed strip
- `isIosSafari()` correctly excludes Chrome iOS (CriOS), Firefox iOS (FxiOS), Opera iOS (OPiOS), and Mercury browser per D-04 and RESEARCH.md Pitfall 5
- `isInStandaloneMode()` checks both `window.matchMedia('(display-mode: standalone)')` and `window.navigator.standalone` — belt-and-suspenders coverage for older iOS versions
- All `localStorage` access wrapped in try/catch — private browsing (which throws DOMException) degrades silently; banner simply does not show
- Banner uses navy `#002244` background, amber `#e89820` `mdi:share-variant` icon, white `#ffffff` instruction text with bolded "Share" and "Add to Home Screen", and a 44×44px `mdi:close` dismiss button at `rgba(255,255,255,0.7)`
- `paddingBottom: calc(env(safe-area-inset-bottom) + 0.75rem)` via inline style provides home indicator clearance
- Teleport to `body` ensures the banner escapes WallecxApp.vue's stacking context and PrimeVue Dialog z-indexes (~1100); banner uses `z-50` (50) — safe below both Dialog and scan overlay (9999)
- `WallecxApp.vue` updated with import `PwaInstallBanner from './PwaInstallBanner.vue'` and `<PwaInstallBanner />` render tag after `</Card>` and before the SFC root `</template>` — Vue 3 Fragment allows multiple root elements
- `npm run type-check` passes with zero errors
- `npm run build-only` completes without errors (validates Teleport and Fragment are correctly used)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PwaInstallBanner.vue** — `8541e8c` (feat)
2. **Task 2: Import and render PwaInstallBanner in WallecxApp.vue** — `2460e60` (feat)

## Files Created/Modified

- `src/components/projects/wallecx/PwaInstallBanner.vue` — new component: 75 lines; iOS Safari detection + standalone check + localStorage dismiss + Teleport fixed strip
- `src/components/projects/wallecx/WallecxApp.vue` — 2-line addition: import statement + render tag

## Decisions Made

- Amber color `#e89820` used for share icon — the UI-SPEC specifies this value; the RESEARCH.md Pattern 5 example used `#f59e0b` (Tailwind amber-500) which differs slightly. UI-SPEC takes precedence.
- `isVisible` ref starts as `false` — banner is unconditionally hidden until `onMounted` confirms all three conditions are true simultaneously. This prevents flash-of-banner on non-iOS platforms.
- `z-50` (z-index 50) for banner — confirmed safe below PrimeVue Dialogs (~1100) and scan overlay (9999) per RESEARCH.md Pitfall 3.
- `paddingBottom` via inline `:style` uses `calc(env(safe-area-inset-bottom) + 0.75rem)` which replaces the `py-3` Tailwind class bottom padding — the inline style takes precedence over the Tailwind class for the bottom axis only, which is the intended behaviour.

## Deviations from Plan

None — plan executed exactly as written. The UI-SPEC color `#e89820` was used for the share icon (the RESEARCH.md Pattern 5 example showed `#f59e0b`; this is a documentation discrepancy, not a plan deviation — the UI-SPEC is the authoritative source).

## Issues Encountered

None.

## User Setup Required

None — the banner activates automatically on iOS Safari when the user visits `/projects/wallecx` in browser mode (not standalone). No configuration or build step required beyond the existing PWA setup from Phase 14.

## Next Phase Readiness

- Phase 15 complete. All three plans (15-01 viewport foundation, 15-02 touch targets, 15-03 PWA install banner) are committed.
- v2.1 Mobile PWA milestone is complete.
- No blockers.

## Known Stubs

None — banner shows real instructions with real detection logic. No placeholder text or mock data.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| T-15-05 | PwaInstallBanner.vue | localStorage key `wallecx_pwa_banner_dismissed` stores non-sensitive boolean flag — accepted per threat register |
| T-15-06 | PwaInstallBanner.vue | navigator.userAgent iOS detection — UA spoofing causes cosmetic banner on non-iOS; not a security issue — accepted |
| T-15-07 | PwaInstallBanner.vue | Teleport to body render is v-if controlled; no persistent DOM pollution — accepted |

All three threat items were pre-assessed in the plan's threat model with `accept` disposition.

## Self-Check: PASSED

- `src/components/projects/wallecx/PwaInstallBanner.vue` exists: confirmed
- `wallecx_pwa_banner_dismissed` present in PwaInstallBanner.vue: confirmed (line 4)
- `Teleport to="body"` present in PwaInstallBanner.vue: confirmed (line 44)
- `CriOS|FxiOS|OPiOS` exclusion present in PwaInstallBanner.vue: confirmed (line 10)
- WallecxApp.vue grep returns 2 lines for PwaInstallBanner: confirmed (line 9: import, line 99: render tag)
- Commit `8541e8c` exists: confirmed
- Commit `2460e60` exists: confirmed
- `npm run type-check` passes: confirmed (zero output = zero errors)
- `npm run build-only` completes without errors: confirmed

---
*Phase: 15-mobile-layouts*
*Completed: 2026-05-14*
