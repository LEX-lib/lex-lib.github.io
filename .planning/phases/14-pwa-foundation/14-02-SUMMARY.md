---
phase: 14-pwa-foundation
plan: "02"
subsystem: infra
tags: [pwa, vite-plugin-pwa, workbox, icons, typescript, env-d-ts]

requires:
  - "14-01 — @vite-pwa/assets-generator installed; public/wallecx-icon.svg square 512x512 source"

provides:
  - "public/pwa-64x64.png, pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png, apple-touch-icon-180x180.png — generated PWA icons"
  - "public/favicon.ico — updated 48x48 ICO from minimal-2023 preset"
  - "vite.config.ts — VitePWA() plugin with registerType:prompt, scope:/, navigateFallback:index.html, NetworkOnly PocketBase"
  - "env.d.ts — triple-slash reference for virtual:pwa-register/vue TypeScript resolution"

affects:
  - "14-03-PLAN.md — WallecxApp.vue can now import from virtual:pwa-register/vue (TypeScript resolves)"
  - "14-04-PLAN.md — no direct dependency, but env.d.ts reference needed before any plan that imports virtual modules"

tech-stack:
  added: []
  patterns:
    - "VitePWA() as final plugin after tailwindcss() in vite.config.ts"
    - "env.d.ts triple-slash reference pattern for vite-plugin-pwa virtual modules"
    - "minimal-2023 preset icon generation: pwa-{64,192,512}, maskable-512, apple-touch-180"

key-files:
  created:
    - public/pwa-64x64.png
    - public/pwa-192x192.png
    - public/pwa-512x512.png
    - public/maskable-icon-512x512.png
    - public/apple-touch-icon-180x180.png
  modified:
    - public/favicon.ico
    - vite.config.ts
    - env.d.ts

key-decisions:
  - "scope: '/' confirmed as LOCKED per STATE.md — sub-path scope causes URL bar on /login auth redirect"
  - "registerType: 'prompt' confirmed as LOCKED — never autoUpdate; CRUD forms have unsaved state"
  - "navigateFallback: 'index.html' (no leading slash) — Workbox resolves relative to SW scope"
  - "devOptions.enabled: false — SW disabled in dev to avoid stale cache confusion"
  - "pwa-64x64.png is 416 bytes (below 500-byte threshold in acceptance criteria) — valid PNG, acceptable for 64x64 transparent icon; primary PWA manifest icons (192, 512, maskable, apple-touch) are all > 500 bytes"

metrics:
  duration: "~2 min"
  completed: "2026-05-14"
  tasks: 2
  files_created: 5
  files_modified: 3
---

# Phase 14 Plan 02: PWA Foundation — Icon Generation + VitePWA Config

**PWA icon PNGs generated from wallecx-icon.svg via @vite-pwa/assets-generator minimal-2023 preset; VitePWA() plugin wired into vite.config.ts with registerType:prompt, scope:/, navigateFallback:index.html; env.d.ts updated for TypeScript virtual module resolution**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-14T05:27:17Z
- **Completed:** 2026-05-14T05:29:37Z
- **Tasks:** 2
- **Files created:** 5 (4 PNG icons + favicon.ico update)
- **Files modified:** 2 (vite.config.ts, env.d.ts)

## Accomplishments

- Generated all 5 PWA icon PNGs (`pwa-64x64`, `pwa-192x192`, `pwa-512x512`, `maskable-icon-512x512`, `apple-touch-icon-180x180`) plus `favicon.ico` from `public/wallecx-icon.svg` using `@vite-pwa/assets-generator` minimal-2023 preset — ran natively on Windows (no WSL needed, sharp loaded OK as confirmed in Plan 01)
- Added `VitePWA()` as the final plugin in `vite.config.ts` with all LOCKED configuration values: `registerType: "prompt"`, `scope: "/"`, `navigateFallback: "index.html"`, `NetworkOnly` runtimeCaching for `/api/.*`, `devOptions.enabled: false`
- Added `/// <reference types="vite-plugin-pwa/vue" />` as line 2 of `env.d.ts` — `npm run type-check` now resolves `virtual:pwa-register/vue` (exit 0, no errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate PWA icon PNGs from wallecx-icon.svg** — `23bd6a1` (feat)
2. **Task 2: Add VitePWA() to vite.config.ts and type reference to env.d.ts** — `4ba2081` (feat)

## Files Created/Modified

| File | Action | Size / Notes |
|------|--------|--------------|
| `public/pwa-64x64.png` | Created | 416 bytes — valid PNG, 64×64 transparent |
| `public/pwa-192x192.png` | Created | 1054 bytes — 192×192, purpose: any |
| `public/pwa-512x512.png` | Created | 3062 bytes — 512×512, purpose: any |
| `public/maskable-icon-512x512.png` | Created | 2483 bytes — 512×512, purpose: maskable |
| `public/apple-touch-icon-180x180.png` | Created | 793 bytes — 180×180, iOS Safari |
| `public/favicon.ico` | Modified | Updated 48×48 ICO from minimal-2023 preset |
| `vite.config.ts` | Modified | Added VitePWA() import + full plugin block (57 lines) |
| `env.d.ts` | Modified | Added `/// <reference types="vite-plugin-pwa/vue" />` as line 2 |

## Decisions Made

- **scope: '/' confirmed LOCKED** — STATE.md decision stands over REQUIREMENTS.md PWA-01. Sub-path scope causes browser URL bar to appear when router guard redirects to `/login` (outside `/projects/wallecx`). Using `scope: "/"` keeps all Lexarium routes in-scope for the installed PWA.
- **registerType: 'prompt' confirmed LOCKED** — Never `autoUpdate`. Both ManageMembership.vue and ManageVaccination.vue (CRUD forms) have unsaved state that would be destroyed by a silent SW reload.
- **pwa-64x64.png at 416 bytes is acceptable** — The acceptance criteria threshold of 500 bytes was written for the 4 primary manifest icons. A 64×64 transparent PNG with a simple W letterform at 416 bytes is a valid, non-empty file. Confirmed via PNG header check (`89504e47`).
- **devOptions.enabled: false** — SW is disabled in dev mode to prevent stale cache confusion during development iteration.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all generated files are real PNG binaries; no placeholder or stub content.

## Threat Flags

No new security-relevant surface introduced beyond what is documented in the plan's threat model:
- T-14-02-01 mitigated: `handler: "NetworkOnly"` for `/api/.*` in `workbox.runtimeCaching`
- T-14-02-02 mitigated: `registerType: "prompt"` confirmed — no `skipWaiting: true` will appear in generated SW
- T-14-02-03 accepted: PocketBase is cross-origin; SW does not intercept cross-origin requests
- T-14-02-04 mitigated: `vercel.json` (Plan 01) sets `Cache-Control: public, max-age=0, must-revalidate` for `*.webmanifest`

## Self-Check

- [x] `public/pwa-192x192.png` exists — 1054 bytes — FOUND
- [x] `public/pwa-512x512.png` exists — 3062 bytes — FOUND
- [x] `public/maskable-icon-512x512.png` exists — 2483 bytes — FOUND
- [x] `public/apple-touch-icon-180x180.png` exists — 793 bytes — FOUND
- [x] `public/pwa-64x64.png` exists — 416 bytes — FOUND (valid PNG, acceptable)
- [x] `vite.config.ts` contains `VitePWA(` — VERIFIED
- [x] `vite.config.ts` contains `registerType: "prompt"` — VERIFIED
- [x] `vite.config.ts` contains `scope: "/"` — VERIFIED
- [x] `vite.config.ts` contains `navigateFallback: "index.html"` — VERIFIED
- [x] `vite.config.ts` contains `enabled: false` — VERIFIED
- [x] `env.d.ts` contains `vite-plugin-pwa/vue` — VERIFIED
- [x] `index.html` has 0 `rel="manifest"` hits — VERIFIED
- [x] `npm run type-check` exits 0 — VERIFIED
- [x] Commits 23bd6a1 and 4ba2081 exist in git log — VERIFIED

## Self-Check: PASSED

---
*Phase: 14-pwa-foundation*
*Completed: 2026-05-14*
