# Phase 33: Mobile Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 33-mobile-foundation
**Areas discussed:** useMobileEnv API shape, Breakpoint tiers, Install-prompt capture scope, Version-upgrade posture

---

## useMobileEnv API shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single object of refs | Return { isMobile, isTablet, isStandalone, installPromptEvent, safeAreaInsets } as one object | ✓ |
| Re-export useIsMobile + add new composable | Keep useIsMobile() verbatim; useMobileEnv wraps it for one source of truth | |
| Individual exported refs | Export each ref/function separately — more granular, more files | |

**User's choice:** Single object of refs
**Notes:** useIsMobile.ts stays untouched (A-43-1); new code opts into the richer object. Cleanest single-import surface for Phases 34–37.

---

## Breakpoint tiers

| Option | Description | Selected |
|--------|-------------|----------|
| Tri-state: mobile / tablet / desktop | isMobile (≤639), isTablet (640–1023), desktop (≥1024) | ✓ |
| Binary: mobile / not-mobile | Keep single 639px threshold; iPad = desktop | |
| Tri-state with iPad as mobile | isMobile ≤819 incl. iPad portrait; tablet flag 640–819 | |

**User's choice:** Tri-state: mobile / tablet / desktop
**Notes:** iPad 768–820 is a first-class tablet tier — not mobile, not desktop. Substrate for Drawer-on-mobile / Dialog-on-tablet+ decisions in Phase 35. 639px stays aligned with Tailwind sm: + existing useIsMobile.

---

## Install-prompt capture scope

| Option | Description | Selected |
|--------|-------------|----------|
| Capture-only in P33, all UI in P37 | P33 registers App.vue listener + stores event; iOS banner unchanged; Android button + frequency in P37 | ✓ |
| Capture + minimal Android button now | P33 also wires a basic Android Install button immediately | |
| Capture + migrate banner to 30-day dismissal now | P33 also upgrades boolean dismissal to date-based 30-day rule | |

**User's choice:** Capture-only in P33, all UI in P37
**Notes:** Keeps the foundation/polish split crisp. PwaInstallBanner.vue untouched in P33.

---

## Version-upgrade posture (FND-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle both, fix-forward | Upgrade Vue + PrimeVue together; fix any regression within P33 before merge | ✓ |
| Gate PrimeVue — Vue patch only if smoke fails | Ship Vue 3.5.34; pin PrimeVue 4.3.7 if smoke reveals regression | |
| Defer all version bumps | Keep current versions; do composable + visualizer only | |

**User's choice:** Bundle both, fix-forward
**Notes:** Priority is one clean version baseline for the whole milestone. Highest-watch regression: v2.3 PrimeVue #7465 dark-mode override CSS after the minor bump.

---

## Claude's Discretion

- Reactivity source (matchMedia vs @vueuse/core useMediaQuery) — leaning useMediaQuery given FND-01 promotes @vueuse/core; planner decides as long as single-source-of-truth holds.
- installPromptEvent storage — module-scope singleton ref (A-43-4), no new Pinia store.
- Visualizer script ergonomics — name, output path, gitignore, commit-vs-regenerate.
- safeAreaInsets exposure shape — env() strings vs computed pixels vs reactive object.

## Deferred Ideas

- Android Install button + event.prompt() wiring → Phase 37.
- 30-day dismissal frequency rule (NFR-PWA-BANNER-FREQUENCY) → Phase 37.
- Migrating existing useIsMobile() callers to useMobileEnv → not in scope (backward-compatible by design).
