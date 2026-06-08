---
phase: 14-pwa-foundation
plan: "01"
subsystem: infra
tags: [pwa, vite-plugin-pwa, workbox, vercel, service-worker, icons]

requires: []
provides:
  - vite-plugin-pwa@1.3.0, workbox-window@7.4.1, workbox-build@7.4.1, @vite-pwa/assets-generator@1.0.2 installed as devDependencies
  - vercel.json with Cache-Control headers for sw.js and *.webmanifest, and SPA catch-all rewrite
  - public/wallecx-icon.svg as 512x512 square navy/white PWA icon source for @vite-pwa/assets-generator
affects:
  - 14-02-PLAN.md (uses @vite-pwa/assets-generator + wallecx-icon.svg to generate PNG icons)
  - 14-03-PLAN.md (adds VitePWA plugin to vite.config.ts — requires vite-plugin-pwa installed)
  - 14-04-PLAN.md (modifies WallecxApp.vue — requires vite-plugin-pwa for virtual module types)

tech-stack:
  added:
    - vite-plugin-pwa@1.3.0
    - workbox-window@7.4.1
    - workbox-build@7.4.1
    - "@vite-pwa/assets-generator@1.0.2"
  patterns:
    - vercel.json Cache-Control pattern for sw.js (no-cache) and assets (immutable)
    - Square SVG icon source for @vite-pwa/assets-generator (512x512 viewBox, navy/white)

key-files:
  created:
    - vercel.json
    - public/wallecx-icon.svg
  modified:
    - package.json

key-decisions:
  - "package-lock.json is in .gitignore — committed package.json only for Task 1"
  - "sharp native binary loads OK on Windows with Node 22.14.0 — icon generation can run natively (no WSL needed)"
  - "wallecx-icon.svg uses <text> element for W letterform (not a path) — acceptable for PWA icon source as @vite-pwa/assets-generator rasterizes SVG via sharp"

patterns-established:
  - "Pattern: vercel.json Cache-Control — no-cache for mutable files (sw.js, *.webmanifest, *.html), immutable for hashed assets (/assets/*)"
  - "Pattern: Square SVG icon source — 512x512 viewBox, navy background, white letterform, no rx on rect to avoid double-masking"

requirements-completed:
  - PWA-02
  - PWA-04

duration: 3min
completed: 2026-05-14
---

# Phase 14 Plan 01: PWA Foundation — Dependencies, vercel.json, Icon Source

**vite-plugin-pwa + workbox devDependencies installed, vercel.json with CDN cache headers created, and public/wallecx-icon.svg 512x512 navy/white square PWA icon source committed**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-14T05:21:31Z
- **Completed:** 2026-05-14T05:24:11Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Installed all four PWA devDependencies (vite-plugin-pwa, workbox-window, workbox-build, @vite-pwa/assets-generator) — verified loadable from node_modules
- Created vercel.json with correct Cache-Control headers preventing Vercel CDN from caching stale sw.js, plus SPA catch-all rewrite for Vue Router HTML5 mode
- Created public/wallecx-icon.svg as a dedicated square 512x512 PWA icon source with navy (#002244) background and white W letterform

## Task Commits

Each task was committed atomically:

1. **Task 1: Install PWA devDependencies** - `abed8fc` (chore)
2. **Task 2: Create vercel.json** - `99866b5` (chore)
3. **Task 3: Create public/wallecx-icon.svg** - `fd7d00a` (feat)

**Plan metadata:** (committed with SUMMARY and STATE updates)

## Files Created/Modified
- `package.json` - Added vite-plugin-pwa@^1.3.0, workbox-window@^7.4.1, workbox-build@^7.4.1, @vite-pwa/assets-generator@^1.0.2 to devDependencies
- `vercel.json` - Cache-Control headers for sw.js, *.webmanifest, *.html, /assets/*; SPA rewrite
- `public/wallecx-icon.svg` - 512x512 square SVG with navy background and white W letterform for icon generation

## Decisions Made

- **package-lock.json is in .gitignore** — committing package.json only is the project convention. The lockfile remains untracked.
- **sharp native binary loads on Windows** — `node -e "require('sharp'); console.log('sharp OK')"` returned `sharp OK` with Node 22.14.0. No WSL workaround needed for Plan 02 icon generation.
- **wallecx-icon.svg uses `<text>` element** — the W letterform is a CSS-font `<text>` element rather than an SVG path. This is acceptable as @vite-pwa/assets-generator rasterizes via sharp, which renders text elements. If the generated PNG looks poor (missing font), Plan 02 can replace with an SVG path — noted for next task.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (icon generation): All prerequisites met. @vite-pwa/assets-generator installed. sharp loads on Windows. wallecx-icon.svg ready as source.
- Plan 03 (vite.config.ts): vite-plugin-pwa installed. Package is loadable.
- Plan 04 (WallecxApp.vue): No blockers from this plan.
- **One concern:** wallecx-icon.svg uses a `<text>` element for the W. If sharp's SVG text rendering is inconsistent on Windows (font substitution), the generated PNG may look different from expected. If Plan 02 icons look poor, replace the `<text>` with an SVG `<path>` for the W letterform.

## Self-Check

- [x] `package.json` contains all 4 devDependencies — VERIFIED
- [x] `node_modules/vite-plugin-pwa` exists — VERIFIED
- [x] `vercel.json` is valid JSON with 4 header rules and 1 rewrite — VERIFIED
- [x] `public/wallecx-icon.svg` contains viewBox 512x512, #002244, fill="#ffffff" — VERIFIED
- [x] Commits abed8fc, 99866b5, fd7d00a exist in git log — VERIFIED

---
*Phase: 14-pwa-foundation*
*Completed: 2026-05-14*
