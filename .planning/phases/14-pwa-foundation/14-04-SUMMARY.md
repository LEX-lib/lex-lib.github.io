---
phase: 14-pwa-foundation
plan: "04"
subsystem: pwa
tags: [pwa, vite-plugin-pwa, workbox, manifest, service-worker, build-verification]

requires:
  - "14-03 — WallecxApp.vue with useRegisterSW needRefresh watch (PWA-06) and onMounted auth resilience (PWA-05)"
  - "14-02 — VitePWA() plugin configured in vite.config.ts with registerType:prompt; env.d.ts triple-slash reference"
  - "14-01 — vercel.json Cache-Control headers; PWA icons in public/; vite-plugin-pwa installed"

provides:
  - "Confirmed production build exits 0 with dist/sw.js (53-entry precache manifest) and dist/manifest.webmanifest generated"
  - "Workbox config fix: globIgnores excludes about-me-photo (9.85 MB) from precache; maximumFileSizeToCacheInBytes raised to 3 MiB for vendor bundle (2.57 MiB)"
  - "All PWA-01 through PWA-07 requirements satisfied across Phase 14 Plans 01-04"

affects:
  - "Phase 15 and beyond — PWA foundation is now live in the production build"

tech-stack:
  added: []
  patterns:
    - "Workbox globIgnores to exclude large non-PWA assets (photos) from precache manifest"
    - "maximumFileSizeToCacheInBytes: 3 MiB to accommodate large vendor bundle in precache"

key-files:
  created: []
  modified:
    - vite.config.ts

key-decisions:
  - "globIgnores: ['**/about-me-photo*'] — the about-me photo (9.85 MB) is a home page asset with no offline utility for the Wallecx PWA; excluded from precache to unblock the build"
  - "maximumFileSizeToCacheInBytes: 3 MiB — vendor bundle (2.57 MiB) must be in the precache for the app shell to function offline; raised limit rather than excluding it"
  - "Task 2 (human-verify) auto-approved per auto_advance:true config — human DevTools verification instructions documented below for async follow-up"

requirements-completed:
  - PWA-07

duration: "~3 min"
completed: "2026-05-14"
---

# Phase 14 Plan 04: Production Build Verification (PWA Quality Gate)

**Production build exits 0 with Workbox precache fix (globIgnores for 9.85 MB photo, 3 MiB limit for vendor bundle); dist/sw.js and dist/manifest.webmanifest verified with correct Wallecx values; all PWA-01 through PWA-07 requirements satisfied**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-14T05:37:37Z
- **Completed:** 2026-05-14T05:39:45Z
- **Tasks:** 2 (1 auto executed + 1 auto-approved checkpoint)
- **Files modified:** 1

## Accomplishments

- Ran `npm run build` — TypeScript check and Vite build both exit 0
- Identified and fixed Workbox precache size error: `about-me-photo-*.png` (9.85 MB) and `vendor-*.js` (2.57 MB) exceeded Workbox's default 2 MiB limit; applied `globIgnores` and raised `maximumFileSizeToCacheInBytes` to 3 MiB
- Verified all five acceptance checks pass: `dist/sw.js` exists with `navigateFallback`, `dist/manifest.webmanifest` has correct values (`name: Wallecx`, `scope: /`, `start_url: /projects/wallecx`, `display: standalone`, `theme_color: #002244`, 3 icons), `dist/index.html` has auto-injected manifest link, `vercel.json` present, source `index.html` has no manual manifest link
- Task 2 (Chrome DevTools human-verify) auto-approved per `auto_advance: true` config; verification instructions documented below for async follow-up

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Run production build and verify generated PWA artifacts | ee379a3 | vite.config.ts |

## Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| `vite.config.ts` | Modified | Added `globIgnores: ['**/about-me-photo*']` and `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` to workbox config |

## Decisions Made

- **globIgnores for about-me photo:** The home page photo (`about-me-photo-*.png`, 9.85 MB) is a portfolio/home-page asset with no offline utility for the Wallecx PWA. Excluding it from precache is correct — Workbox would not be able to serve it efficiently anyway, and it is not part of the Wallecx app shell. No offline functionality is lost.
- **3 MiB maximumFileSizeToCacheInBytes:** The vendor bundle (`vendor-CaoDKN1I.js`, 2.57 MiB) contains Vue, Pinia, and Vue Router — core dependencies needed for the Wallecx app shell to function offline. Raising the limit to 3 MiB (rather than excluding the vendor bundle) is the correct trade-off. The precache total is 5199.71 KiB which is reasonable for an app shell.

## Human Verification Required (Task 2 — Auto-Approved)

Task 2 was auto-approved per `auto_advance: true` configuration. The following Chrome DevTools verification should be performed asynchronously after deploying to Vercel or using `npm run preview`:

### Step A — Preview production build locally

```
npm run preview
```

Opens `http://localhost:4173`. Navigate to `http://localhost:4173/projects/wallecx`.

### Step B — Chrome DevTools → Application tab → Manifest

Confirm all of the following:
- **App name:** "Wallecx"
- **Short name:** "Wallecx"
- **Start URL:** `/projects/wallecx`
- **Scope:** `/`
- **Display:** `standalone`
- **Theme color:** `#002244` (navy)
- **Icons:** Three icon entries visible (192×192 any, 512×512 any, 512×512 maskable)
- **Installability:** No red error indicators in the "Installability" subsection

### Step C — Service Workers panel

Click **Service Workers** in the left sidebar. Confirm:
- A service worker appears with status "Activated and is running" (refresh once if "Waiting to activate")

### Step D — (Optional) Chrome Android

Visit the deployed Vercel URL (`https://lex-lib.github.io/projects/wallecx`) in Chrome Android.
Look for the "Add to Home Screen" prompt in the browser address bar.

**Note:** Lighthouse PWA audit is deprecated. Use Chrome DevTools Application panel only (per RESEARCH.md).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Workbox precache size error blocking production build**
- **Found during:** Task 1 (production build)
- **Issue:** `npm run build` exited with code 1. Workbox's `vite-plugin-pwa:build` plugin threw `Error: Configure "workbox.maximumFileSizeToCacheInBytes" to change the limit`. Two assets exceeded the default 2 MiB threshold: `assets/about-me-photo-*.png` (9.85 MB) and `assets/vendor-*.js` (2.57 MB).
- **Fix:** Added `globIgnores: ['**/about-me-photo*']` to exclude the 9.85 MB home page photo from precaching (not needed for Wallecx offline functionality). Raised `maximumFileSizeToCacheInBytes` to `3 * 1024 * 1024` (3 MiB) to allow the vendor bundle (core Vue/Pinia/Router) into the precache.
- **Files modified:** `vite.config.ts`
- **Verification:** `npm run build` exits 0; PWA output shows `53 entries (5199.71 KiB)`; all 5 checks pass
- **Committed in:** `ee379a3`

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Required fix — build was blocked. No scope creep. The globIgnores and size limit are standard Workbox configuration options documented in the vite-plugin-pwa FAQ.

## Issues Encountered

- Workbox defaulting to 2 MiB limit caused a hard build failure. The `about-me-photo` is a pre-existing large asset in the project (9.85 MB HomeView background photo) that Workbox attempted to precache due to the `*.png` glob pattern. The fix is minimal and correct.

## Known Stubs

None — all build artifacts are real and verified. The `dist/sw.js` precache contains 53 live entries.

## Threat Flags

No new security surface beyond what is documented in the plan's threat model:
- T-14-04-01 accepted: precache contains app shell assets only; no user PII
- T-14-04-02 mitigated: `vercel.json` (Plan 01) sets `Cache-Control: public, max-age=0, must-revalidate` on `/sw.js`
- T-14-04-03 accepted: `scope: "/"` is intentional per STATE.md locked decision

The `about-me-photo` exclusion from precache reduces the precache surface (not an increase).

## Next Phase Readiness

Phase 14 (PWA Foundation) is complete across all 4 plans:
- Plan 01: vite-plugin-pwa installed, icons generated, vercel.json created
- Plan 02: VitePWA() configured in vite.config.ts, env.d.ts TypeScript reference
- Plan 03: WallecxApp.vue auth resilience (PWA-05) + SW update toast (PWA-06)
- Plan 04: Production build verified, Workbox precache fix applied

All PWA-01 through PWA-07 requirements are satisfied. The app is ready for Phase 15.

## Self-Check

Checking created/modified files exist and commits are present:

- [x] `vite.config.ts` exists and contains `globIgnores` — FOUND
- [x] Commit `ee379a3` exists in git log — FOUND (verified via `git rev-parse --short HEAD`)
- [x] `dist/sw.js` exists — FOUND (generated by build)
- [x] `dist/manifest.webmanifest` contains `"name":"Wallecx"` — VERIFIED
- [x] `manifest OK: true` from final automated verification — VERIFIED

## Self-Check: PASSED

---
*Phase: 14-pwa-foundation*
*Completed: 2026-05-14*
