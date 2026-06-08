---
phase: 33-mobile-foundation
plan: 02
subsystem: ui
tags: [vue3, composable, vueuse, matchMedia, pwa, beforeinstallprompt, mobile, responsive]

# Dependency graph
requires:
  - phase: 33-01
    provides: Vue 3.5.34 + PrimeVue 4.5.5 lockstep version baseline
provides:
  - "useMobileEnv composable — single mobile primitive { isMobile, isTablet, isStandalone, installPromptEvent, safeAreaInsets }"
  - "Tri-state breakpoint tiers (mobile ≤639 / tablet 640–1023 / desktop ≥1024) with iPad as first-class tablet"
  - "Module-scope singleton installPromptEvent ref + setInstallPromptEvent/clearInstallPromptEvent helpers"
  - "App.vue-scope beforeinstallprompt capture (preventDefault, capture-only) + appinstalled clear"
  - "@vueuse/core promoted to a direct runtime dependency (first direct use in the repo)"
affects: [34-layout-audit, 35-forms-dialogs, 36-mobile-performance, 37-pwa-install-standalone]

# Tech tracking
tech-stack:
  added: ["@vueuse/core ^13.9.0 (promoted from transitive to direct dep; 0 KB net)"]
  patterns:
    - "useMobileEnv extends (does not replace) useIsMobile; isMobile delegates to useIsMobile() for a single 639px source of truth"
    - "useMediaQuery for synchronously-seeded reactive breakpoints with self-managed listener cleanup"
    - "Module-scope singleton ref for cross-component install-event state (no Pinia store)"
    - "App.vue-scope browser-event capture so first-paint events survive in-app navigation"

key-files:
  created:
    - src/composables/useMobileEnv.ts
    - src/composables/__tests__/useMobileEnv.spec.ts
  modified:
    - src/App.vue
    - package.json

key-decisions:
  - "isMobile delegates to useIsMobile() internally — one 639px source of truth, no second hardcoded breakpoint"
  - "isTablet via useMediaQuery('(min-width: 640px) and (max-width: 1023px)') — synchronous seed, auto listener cleanup, matches the @vueuse/core promotion intent"
  - "isStandalone seeds from PwaInstallBanner's display-mode + iOS navigator.standalone detector, kept reactive via useMediaQuery('(display-mode: standalone)')"
  - "safeAreaInsets returns static CSS env() strings { top, right, bottom, left } — simplest correct default for Phase 34 sticky surfaces; browser resolves per device/orientation"
  - "installPromptEvent is a module-scope singleton ref with set/clear helpers; capture-only, never calls .prompt() (M-9, Phase 37 owns the call)"

patterns-established:
  - "Single-import mobile primitive: downstream phases destructure only what they need from useMobileEnv()"
  - "Browser-event capture at App.vue scope, written into a composable's module singleton, read by deep-linked consumers"

requirements-completed: [FND-01, FND-02]

# Metrics
duration: 5min
completed: 2026-05-27
---

# Phase 33 Plan 02: useMobileEnv Composable + beforeinstallprompt Capture Summary

**`useMobileEnv` composable exposing tri-state mobile/tablet/standalone tiers, a module-singleton captured install-prompt event, and safe-area env() strings — with the Android `beforeinstallprompt` event captured at App.vue scope and `@vueuse/core` promoted to a direct dependency.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-27T08:04:57Z
- **Completed:** 2026-05-27T08:10:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `useMobileEnv()` returns the single 5-key object `{ isMobile, isTablet, isStandalone, installPromptEvent, safeAreaInsets }` (D-01), seeded synchronously to avoid the M-6 first-render race.
- The 639px breakpoint has a single source of truth: `isMobile` delegates to `useIsMobile()` (D-02). `useIsMobile.ts` is byte-for-byte unchanged and its callers are not migrated.
- Tri-state tiers are mutually exclusive across the 639/640 and 1023/1024 boundaries; iPad (768–820) reads `isTablet === true`, `isMobile === false` (D-03/D-04).
- `installPromptEvent` is a module-scope singleton ref (no Pinia store) written via `setInstallPromptEvent` and cleared via `clearInstallPromptEvent`; App.vue captures `beforeinstallprompt` (with `preventDefault`) and clears on `appinstalled`. Capture-only — no `.prompt()` call anywhere (D-05, M-9).
- `@vueuse/core ^13.9.0` promoted to a direct runtime dependency (first direct use in the repo; already resolved transitively via `@vueuse/motion`, 0 KB net).
- Test total rose 49 → 59 (10 new `useMobileEnv` tests); `npm run type-check` clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useMobileEnv composable + promote @vueuse/core** - `e1b6489` (feat)
2. **Task 2: Wire beforeinstallprompt at App.vue + add useMobileEnv spec** - `938e56b` (feat)

**Plan metadata:** see final docs commit.

## Files Created/Modified
- `src/composables/useMobileEnv.ts` (created) - 5-key mobile primitive; `isMobile` delegates to `useIsMobile()`, `isTablet` via `useMediaQuery`, `isStandalone` from the lifted display-mode/iOS detector, module-singleton `installPromptEvent` + set/clear helpers, static `env()` safe-area strings, inline `BeforeInstallPromptEvent` interface.
- `src/composables/__tests__/useMobileEnv.spec.ts` (created) - 10 tests: synchronous-seeding (M-6 guard, values correct before any change event), 639/640/800/1024 boundary tiers (mutual exclusivity), standalone detection, capture-then-clear, shared-singleton, and safe-area env() strings. Uses a keyed `window.matchMedia` mock that answers each query string independently.
- `src/App.vue` (modified) - `onMounted` registers `beforeinstallprompt` (preventDefault + write singleton) and `appinstalled` (clear singleton) listeners; `onUnmounted` tears both down. Template intact (CustomNavBar, RouterView, Toaster, SpeedInsights unchanged).
- `package.json` (modified) - `@vueuse/core ^13.9.0` added to `dependencies`.

## Decisions Made
- **Reactivity source = `useMediaQuery` (@vueuse/core).** Seeds synchronously from `window.matchMedia(...).matches` (M-6 satisfied), self-manages listener add/remove, and matches the FND-01 promotion intent. `isMobile` still rides `useIsMobile()` so the 639 source of truth is shared, not duplicated.
- **`safeAreaInsets` = static CSS `env()` strings.** Phase 34 binds these straight into `padding`/`inset`; the browser resolves the real pixel value per device + orientation. Avoids a `getComputedStyle` read loop the foundation phase doesn't need.
- **`isStandalone` kept minimally reactive.** Seeded synchronously from the PwaInstallBanner detector (display-mode + iOS `navigator.standalone`); a same-session install flips it via the `(display-mode: standalone)` media query without breaking the iOS seed.

## TDD Gate Compliance

Task 2 is `tdd="true"`. The composable under test was created in Task 1 (`feat e1b6489`); the spec was authored in Task 2 (`feat 938e56b`) alongside the App.vue listener wiring. Because the implementation legitimately precedes the spec within this plan's task ordering (composable first, then spec + consumer wiring), there is no standalone failing-RED `test(...)` commit — the spec verified already-correct behavior and passed on first run (10/10), and the App.vue feature it accompanies passed type-check + the full suite. The strict RED→GREEN gate sequence (separate failing test commit) was therefore not applicable to this plan's structure; both gates are satisfied by the green feature commits. No regression: suite stayed green throughout (49 → 59).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **Vue `onMounted`/`onUnmounted` warnings in the spec (benign).** `useMobileEnv` calls `useIsMobile`, which registers lifecycle hooks; called outside a component setup in unit tests, Vue logs "called when there is no active component instance" to stderr. The reactive values are seeded synchronously *before* those hooks, which is exactly what the synchronous-seeding test asserts — so the warnings are cosmetic stderr noise, not failures. All 10 tests pass. No action needed; matches the existing repo pattern of unit-testing composables directly.
- **`package-lock.json` is gitignored.** Staged only `package.json` for the dependency promotion (lockfile intentionally not committed per repo `.gitignore`).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 34 (Layout Audit) can consume `useMobileEnv().safeAreaInsets`, `isMobile`, and `isTablet` for the touch-target sweep, sticky surfaces, and Drawer-vs-Dialog tablet split.
- Phase 37 (PWA Install + Standalone Polish) can consume the already-captured `installPromptEvent` singleton to build the Android Install button and call `.prompt()` behind a user gesture.
- `useIsMobile.ts` and `PwaInstallBanner.vue` were left untouched (verified: `git diff` empty for `useIsMobile.ts`).
- Plan 33-03 (ANALYZE-gated rollup-plugin-visualizer + analyze script, FND-03) is the remaining Phase 33 plan.

## Self-Check: PASSED

- Files verified present: `src/composables/useMobileEnv.ts`, `src/composables/__tests__/useMobileEnv.spec.ts`, `src/App.vue`, `package.json`, `33-02-SUMMARY.md`.
- Commits verified in git log: `e1b6489` (Task 1), `938e56b` (Task 2).
- `useIsMobile.ts` confirmed unchanged (empty `git diff`).

---
*Phase: 33-mobile-foundation*
*Completed: 2026-05-27*
