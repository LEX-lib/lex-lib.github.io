# Technology Stack — v4.3 Wallecx Mobile Optimization

**Project:** Lexarium — Wallecx
**Milestone:** v4.3 Wallecx Mobile Optimization
**Researched:** 2026-05-26
**Overall confidence:** HIGH

## Scope of This Document

This is a **subsequent-milestone stack delta**. The validated Lexarium/Wallecx stack (Vue 3 + Vite 8 + PrimeVue 4 + Pinia + Tailwind v4 + PocketBase 0.29.x + vite-plugin-pwa 1.3.0) is **locked** and is not re-justified here. This document only catalogues **additions** and **version changes** needed to unlock the v4.3 mobile-optimization capabilities (layout audit, perf, forms/dialogs on small screens, PWA install + standalone polish).

If a capability can be delivered with code already in the locked stack, it appears in the "Capability → Implementation" section with the implementation pointer instead of a package suggestion.

## Recommended Additions

### Runtime Dependencies

| Library | Current | Target | Capability Unlocked | Mobile-relevant Gzip Impact |
|---------|---------|--------|---------------------|------------------------------|
| `@vueuse/core` | 13.9.0 (transitive via `@vueuse/motion`) | **^13.9.0 — promote to direct** | `useWindowSize`, `useScrollLock`, `useSwipe`, `useEventListener`, `usePreferredReducedMotion`, `useMediaQuery` composables required for mobile audit, scroll-trapping in dialogs, and bottom-sheet polish | 0 KB (already in graph; tree-shaken per-composable, typically <1 KB per import) |

**Why this is the only new runtime dep:** The composables we need (`useWindowSize`, `useScrollLock`, `useSwipe`, `usePreferredReducedMotion`, `useMediaQuery`) are all in `@vueuse/core`, which is already present in `node_modules` via `@vueuse/motion`'s dependency tree (`npm ls @vueuse/core` confirms `@vueuse/core@13.9.0`). Promoting it to a direct dependency in `package.json` makes the import contract explicit (no reliance on a transitive package), enables version pinning, and unlocks a half-dozen mobile-grade composables at zero net bundle cost.

**Important reconciliation:** STATE.md's v2.3 architectural notes claim `useWindowSize` is "already used" — direct grep of `src/` shows zero imports of `@vueuse/core`. The v2.3 plan was written referencing the composable but the shipped implementation used Tailwind `sm:` breakpoints and ad-hoc window listeners. v4.3 will be the first milestone to actually adopt `useWindowSize`.

### Dev Dependencies

| Library | Target | Capability Unlocked | Bundle Impact |
|---------|--------|---------------------|---------------|
| `rollup-plugin-visualizer` | **^7.0.1** | Bundle-size audit: generates a treemap HTML report after `npm run build` so we can see which chunks dominate the mobile-first-paint budget; informs lazy-import/code-split decisions for v4.3 perf work | 0 KB at runtime (dev-only) |

That is the complete additions list. Everything else mentioned in the orchestrator's questions is achievable without a new package; see "Capability → Implementation" below.

### Version Upgrades (Existing Packages)

| Package | Current | Target | Mobile Relevance |
|---------|---------|--------|------------------|
| `vue` | ^3.5.18 | **^3.5.34** | Patch-only upgrade; Vue 3.5 reactivity refactor already in place. Pure bugfixes; pulls in the latest reactivity fixes (memory + perf) without API changes. LOW risk. |
| `primevue` | ^4.3.7 | **^4.5.5** | Minor-version upgrade. 4.4/4.5 ships accessibility + a11y fixes on Drawer, Dialog, Timeline, Tree, Splitter, zIndex handling. No breaking changes flagged for v4 line. Re-verify dark-mode tokens after upgrade (project's custom Aura preset is forward-compatible per PrimeVue 4 v4-Component-Changes wiki). MEDIUM-LOW risk; recommend smoke-test on Wallecx in a branch. |
| `@primevue/auto-import-resolver` | ^4.3.7 | **^4.5.5** | Must move in lockstep with PrimeVue version. |
| `@primevue/forms` | ^4.3.9 | **^4.5.5** | Same lockstep. (Note: Wallecx Manage* dialogs intentionally do NOT use @primevue/forms — direct v-model + Zod is the locked pattern. This upgrade is for consistency, not behavior change.) |
| `vite-plugin-pwa` | ^1.3.0 | **^1.3.0 (no change)** | Already current. 1.3.0 added vite 8 peer-dep support, `onNeedRefresh` is the supported update-prompt hook we already wire. No upgrade needed for install-banner polish. |

**Not upgrading:**

| Package | Reason |
|---------|--------|
| `vite` ^8.0.0 | Already current. |
| `tailwindcss` ^4.1.12 | Already current. v4.1 ships @custom-variant + container queries we may use; no upgrade needed. |
| `pocketbase` ^0.26.2 SDK | Stable against server v0.29.3 per validated locked rule syntax. Out of v4.3 mobile scope. |
| `chart.js` ^4.5.1 | Already current and tied to PrimeVue Chart's dynamic import. Out of mobile scope. |

## Capability → Implementation (Question-by-Question)

### (a) Mobile layout & touch-target audit

**No new package needed beyond `@vueuse/core` promotion.** Implementation surface:

- **Reactive breakpoint:** `useWindowSize` from `@vueuse/core` → `const isMobile = computed(() => width.value < 640)`. Attach at the WallecxApp.vue shell level or per-tab. This formalizes the pattern v2.3 planned but never imported.
- **Touch targets (44px):** Pure Tailwind utility audit. Tailwind v4 supports `min-h-[44px]` arbitrary values; existing Wallecx code already uses `min-w-[44px] min-h-[44px]` (PwaInstallBanner.vue line 66). No package.
- **Safe-area insets:** Existing `env(safe-area-inset-*)` CSS env() vars (already in PwaInstallBanner.vue + `viewport-fit=cover` in index.html). No package.
- **No horizontal scroll:** Tailwind `overflow-x-hidden` on shells + audit. No package.
- **Modal sizing:** PrimeVue Drawer `position="bottom"` pattern already established in v2.3 for VaccinationGroupPanel + MembershipDetail; propagate to all dialogs in Wallecx (ManageVaccination, ManageMembership, ManageExpense, ManageBudget, AttachmentPreview) — code change only, no new dep.

**Integration point:** `src/components/projects/wallecx/WallecxApp.vue` (shell) + optionally `src/composables/useMobileBreakpoint.ts` (NEW thin wrapper around `useWindowSize` if reuse across 6+ components warrants extraction).

### (b) Mobile performance improvements

**Bundle-size analysis — add `rollup-plugin-visualizer` (dev-only):**

- Wire into `vite.config.ts`'s `plugins` array gated on `process.env.ANALYZE === 'true'` to keep prod builds unaffected; output to `dist/stats.html`.
- Justifies (or rejects) specific lazy-import decisions in the v4.3 perf phase.
- HIGH confidence — standard tool, current v7.0.1, March 2026 release.

**Lazy-loading & first paint:**

- **No new package.** Existing patterns: Vue Router lazy-loaded routes (already in place at `src/router/index.ts`), `defineAsyncComponent` for heavy children. ExpensesReportsView's Chart is already PrimeVue's dynamic chart.js import (v4.0 decision). Targets for v4.3: BarcodeDisplay (JsBarcode), ManageExpense's compression worker, vue-pdf-embed.
- Vite's `rolldown` code-splitting groups (already configured in vite.config.ts) are the lever; visualizer informs whether to split further (e.g., wallecx-vaccinations vs wallecx-memberships vs wallecx-expenses chunks).

**Image compression:**

- **Upload path:** `browser-image-compression@^2.0.2` (already a runtime dep, used in ManageVaccination/ManageMembership/ManageExpense for EXIF-stripped uploads). No change.
- **Build-time static assets:** **REJECT** `vite-imagetools`, `vite-plugin-image-optimizer`, and `sharp` for v4.3. Wallecx has only a handful of static PWA icons (already exported in correct sizes via `@vite-pwa/assets-generator`); about-me-photo is already globIgnored from precache. Bundle visualizer is sufficient to confirm there is no large static image to compress. If the audit surfaces a >200 KB static image, add `vite-plugin-image-optimizer` then; not before.

**List virtualization:**

- **REJECT for v4.3.** `@tanstack/vue-virtual@^3.13.25` is the right pick **when** justified (VueUse explicitly recommends it over `vue-virtual-scroller` for new code; `vue-virtual-scroller` is Vue-2-era and minimally maintained). Bundle impact is ~3–4 KB gzipped, low.
- **Why reject now:** Wallecx is a personal vault. Realistic per-user dataset sizes are: vaccinations <100, memberships <50, expenses 30–300/month (and the Reports view is already client-period-filtered to a single period — never the full history). DOM-node counts at these sizes do not bottleneck mobile Safari. Adding virtualization would burn complexity (sticky headers, group-by-vaccine-type, sort/filter computed shape) for zero perceived benefit.
- **Flag for a later milestone:** Add a runtime data-size guard (e.g., if `expenses.length > 500`, log to console or telemetry) so we have signal when it becomes warranted. Document threshold: introduce virtualization when any `wallecx_*` collection exceeds ~500 rendered rows in steady state.

**Integration point:** `vite.config.ts` (visualizer plugin) + `package.json` scripts (`"analyze": "cross-env ANALYZE=true vite build"`).

### (c) Forms & dialogs on small screens

**No new package needed.**

- **iOS 16px input-font fix:** Pure CSS. Apply globally via `src/assets/base.css`:
  ```css
  @media (max-width: 640px) {
    input, select, textarea, .p-inputtext, .p-datepicker-input { font-size: 16px; }
  }
  ```
  Verified canonical fix (CSS-Tricks 2026 + Apple WCAG guidance). Do NOT use `maximum-scale=1` / `user-scalable=no` — violates WCAG 2.1.
- **Sticky action bars:** Tailwind `sticky bottom-0` + `pb-[env(safe-area-inset-bottom)]` on Manage* dialog footers. Vue/Tailwind only.
- **Scroll trapping:** **`useScrollLock`** from `@vueuse/core` (newly promoted dep). PrimeVue Dialog and Drawer **already lock body scroll** when open — verify behavior survives bottom-sheet conversion. If a custom overlay is added (e.g., MembershipsTab's full-screen scan overlay), use `useScrollLock` against a `document.body` ref. `body-scroll-lock` npm package is unmaintained (last release 2020) — VueUse's `useScrollLock` is the modern equivalent.
- **Drawer-vs-Dialog mobile split:** Established v2.3 pattern; extend to all Manage* dialogs. Conditional `position="bottom"` Drawer below 640px, `Dialog` above. No new package.

**Integration point:** `src/assets/base.css` (the 16px fix); each `Manage*.vue` (sticky footer + Drawer/Dialog split).

### (d) PWA install + standalone polish

**No new package needed.** Existing `vite-plugin-pwa@^1.3.0` is current and ships everything required.

- **iOS standalone meta tags — verification result:** `index.html` is currently **MISSING** the iOS standalone hint meta tags. The viewport meta is correct (`viewport-fit=cover, interactive-widget=resizes-content`), but iOS-specific tags are absent. Required additions for v4.3:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Wallecx" />
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
  ```
  Note: Per Apple's 2026 guidance, `apple-mobile-web-app-capable` is "deprecated" in name only — the W3C-standard equivalent is `mobile-web-app-capable`. Ship BOTH for forward compat. The Web App Manifest (already in vite-plugin-pwa config) is the primary install vector on iOS 17.4+; the meta tags are the fallback for iOS 16.x and earlier.
- **`BeforeInstallPromptEvent` capture (Android Chrome):** `PwaInstallBanner.vue` currently only shows the iOS Safari "tap Share" banner. For Android Chrome we need to capture the `beforeinstallprompt` event. **No npm package needed** — this is a ~30-line `window.addEventListener('beforeinstallprompt', ...)` extension to `PwaInstallBanner.vue` with a `deferredPrompt` ref and an "Install" button that calls `deferredPrompt.prompt()`. Pattern documented in web.dev's "Installation prompt" guide and the love2dev "Using beforeinstallprompt" article. Reject `vue-pwa-install` npm package — it wraps the same 30 lines, is Vue 2-era, and adds an unnecessary dependency.
- **App-icon polish:** `public/` already has `pwa-192x192.png`, `pwa-512x512.png`, `pwa-64x64.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`, `wallecx-icon.svg`, plus mobile + desktop screenshots for the manifest. Verify against the PWA-icon checklist during the polish phase; regenerate via `@vite-pwa/assets-generator@^1.0.2` (already a devDep) if needed. No new package.
- **Workbox additions:** None. Current config (`registerType: 'prompt'`, NetworkOnly for /api/*, navigateFallback, globIgnores for about-me-photo, `maximumFileSizeToCacheInBytes: 3 MiB`, cleanupOutdatedCaches) is the architecturally locked surface. Adding runtime caching for static assets is already covered by the `assets/(.*)` `max-age=31536000, immutable` Vercel header (vercel.json).

**Integration point:** `index.html` (meta tags); `src/components/projects/wallecx/PwaInstallBanner.vue` (extend with `beforeinstallprompt`).

## Alternatives Considered & Rejected

| Category | Alternative | Why Rejected |
|----------|-------------|--------------|
| Virtualization | `vue-virtual-scroller` | Vue 2-era origin; VueUse explicitly recommends `@tanstack/vue-virtual` over it for new code. (Moot — we are not adding either for v4.3.) |
| Virtualization | `@tanstack/vue-virtual` | Wallecx's per-user data sizes don't warrant ~3–4 KB + integration complexity. Defer until a collection exceeds 500 rendered rows. |
| Image build pipeline | `vite-imagetools` | Wallecx has no static-image assets that would benefit from responsive transforms; PWA icons are already correctly sized. Re-evaluate only if the bundle visualizer surfaces a heavy static image. |
| Image build pipeline | `vite-plugin-image-optimizer` (Sharp + SVGO) | Same reasoning. Also pulls in a heavy Sharp native dep at build time — disproportionate. |
| Image build pipeline | `squoosh-cli` / Sharp directly | One-shot CLI tools, not build-steps. Not needed at this scale. |
| Bundle analysis | `source-map-explorer` | Works on prod bundles via sourcemaps but is a separate post-build CLI step. `rollup-plugin-visualizer` integrates into the Vite build directly, supports Rolldown, and is more idiomatic to this project's Vite-first toolchain. Choose visualizer. |
| Scroll lock | `body-scroll-lock` | Unmaintained (last release 2020); `@vueuse/core` `useScrollLock` is the modern, supported equivalent already in our dep graph. |
| PWA install plugin | `vue-pwa-install` | Vue 2-era mixin API wrapping the same `beforeinstallprompt` listener we can inline in 30 lines. Avoid a dep that doesn't earn its keep. |
| Mobile gesture lib | `@vueuse/gesture`, `vue-touch` | The single bottom-sheet gesture we'd want (swipe-down-to-dismiss) is already covered by PrimeVue Drawer's `dismissible` + drag handle. If we later need pinch/multi-touch, add `useSwipe` from `@vueuse/core` — no third lib. |
| Form library | `vee-validate`, `@primevue/forms` (for new Wallecx work) | Locked decision: Wallecx Manage* dialogs use direct v-model + Zod (Key Decision v2.0, due to PrimeVue ColorPicker issue #8135). v4.3 mobile work does not change this. |
| Native wrapper | Capacitor, Tauri, PWABuilder | Out of scope per orchestrator instruction; PWA-only target. |
| UI library swap | Any (Vuetify, Naive, Quasar) | Out of scope per orchestrator; PrimeVue stays. |
| Framework swap | Nuxt, Vue 3.6 beta | Out of scope; Vue 3.5 stays. |

## Bundle-Size Accounting (Mobile-relevant)

| Addition | Gzipped Impact | Notes |
|----------|----------------|-------|
| `@vueuse/core` promoted to direct dep | 0 KB net | Already in graph via `@vueuse/motion`. Tree-shaken per-composable; typical per-composable cost <1 KB. |
| `rollup-plugin-visualizer` | 0 KB | Dev-only; never ships. |
| PrimeVue 4.3.7 → 4.5.5 | ~0 KB | Minor version; same component surface (we don't auto-import new components). |
| Vue 3.5.18 → 3.5.34 | ~0 KB | Patch only. Reactivity refactor was already in 3.5.0. |
| iOS meta tags in `index.html` | <1 KB on the HTML response | Negligible. |
| `beforeinstallprompt` capture in PwaInstallBanner.vue | <1 KB | ~30 lines of JS in an existing component. |
| iOS 16px CSS rule | <0.1 KB | One @media block. |

**Total net mobile-runtime bundle impact: effectively 0 KB.** All capability gains come from existing graph + local code changes.

The v4.3 milestone's bundle wins will come from the **other direction**: bundle visualizer → identify >50 KB chunks → split or lazy-load. Concrete suspects to validate during the perf phase per v2.1 STATE.md notes:

- `leaflet` chunk (~150 KB) — unused on Wallecx routes; verify route-level lazy-load is intact so it never lands in the Wallecx first-paint critical path.
- `primevue` chunk size — confirm only the components auto-imported by Wallecx pages are in the per-route chunk.
- `vendor` chunk — 2.57 MiB raw / ~700 KB gzipped per Plan 14-04 notes. Investigate whether `quill`, `vue-pdf-embed`, `dompurify`, `axios`, or `leaflet` types are inadvertently in the Wallecx critical path.

## Installation

```bash
# Runtime dep promotion (no actual install — bumps from transitive to direct)
npm install @vueuse/core@^13.9.0

# Dev dep addition
npm install -D rollup-plugin-visualizer@^7.0.1 cross-env

# Version upgrades (do together; lockstep)
npm install vue@^3.5.34
npm install primevue@^4.5.5 @primevue/auto-import-resolver@^4.5.5 @primevue/forms@^4.5.5
```

Add to `package.json` scripts:

```json
"analyze": "cross-env ANALYZE=true vite build"
```

(`cross-env` is added because the project's `engines` allow Node ^20.19.0 but contributors may run Windows PowerShell, where `ANALYZE=true vite build` inline-env syntax fails.)

## Sources

- [Vue Releases (3.5.34 latest)](https://vuejs.org/about/releases)
- [Announcing Vue 3.5 — vuejs blog](https://blog.vuejs.org/posts/vue-3-5)
- [PrimeVue Releases (4.5.5 latest)](https://github.com/primefaces/primevue/releases)
- [PrimeVue v4 Component Changes wiki](https://github.com/primefaces/primevue/wiki/v4-Component-Changes)
- [vite-plugin-pwa 1.3.0 release notes](https://github.com/vite-pwa/vite-plugin-pwa/releases)
- [vite-plugin-pwa: prompt-for-update guide](https://vite-pwa-org.netlify.app/guide/prompt-for-update)
- [rollup-plugin-visualizer 7.0.1 — GitHub](https://github.com/btd/rollup-plugin-visualizer)
- [VueUse useScrollLock docs](https://vueuse.org/core/usescrolllock/)
- [VueUse useWindowSize docs](https://vueuse.org/core/usewindowsize/)
- [VueUse useVirtualList (recommends @tanstack/vue-virtual)](https://vueuse.org/core/usevirtuallist/)
- [TanStack Virtual — Vue docs](https://tanstack.com/virtual/latest/docs/framework/vue/vue-virtual)
- [TanStack/virtual repo](https://github.com/TanStack/virtual)
- [CSS-Tricks: 16px or Larger Text Prevents iOS Form Zoom](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)
- [web.dev: Installation prompt (beforeinstallprompt)](https://web.dev/learn/pwa/installation-prompt)
- [love2dev: Using beforeinstallprompt to Encourage PWA Installation](https://love2dev.com/blog/beforeinstallprompt/)
- [Apple Configuring Web Applications (apple-mobile-web-app-*)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [MagicBell: PWA iOS Limitations and Safari Support (2026)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [firt.dev iOS PWA Compatibility notes](https://firt.dev/notes/pwa-ios/)

## Confidence Assessment

| Claim | Confidence | Source(s) |
|-------|------------|-----------|
| `@vueuse/core@13.9.0` already transitive via `@vueuse/motion` | HIGH | `npm ls @vueuse/core` direct verification |
| Vue 3.5.34 is latest patch | HIGH | npm + vuejs.org/about/releases (May 2026) |
| PrimeVue 4.5.5 is latest, no breaking v4 changes | HIGH | PrimeVue Releases + v4 Component Changes wiki |
| `vite-plugin-pwa` 1.3.0 is current | HIGH | vite-pwa-org + npm |
| `rollup-plugin-visualizer` 7.0.1 is current | HIGH | GitHub + npm (March 2026 release) |
| iOS 16px input fix is canonical | HIGH | CSS-Tricks + Apple WCAG guidance + multiple corroborating sources |
| body-scroll-lock npm is unmaintained | HIGH | npm shows last publish 2020 |
| `beforeinstallprompt` capture pattern is the standard | HIGH | web.dev official guide |
| `index.html` is missing `apple-mobile-web-app-*` meta tags | HIGH | Direct file inspection |
| `useWindowSize` is not currently imported in src/ | HIGH | Direct grep verification (zero matches) |
| Wallecx data sizes don't warrant virtualization | MEDIUM | Inferred from PROJECT.md "personal vault" scope + no observed lag; threshold (500 rows) is a heuristic |
| PrimeVue 4.3 → 4.5 minor upgrade is safe | MEDIUM | Changelog reads as pure fixes; recommend branch smoke-test before merge |
| Bundle wins exist in current build | MEDIUM | Inferred from 2.57 MiB vendor chunk noted in v2.1 PWA decisions; needs visualizer to confirm |

---

*Stack delta researched 2026-05-26 for v4.3 Wallecx Mobile Optimization milestone. Locked stack (Vue 3 + Vite 8 + PrimeVue 4 + Pinia + Tailwind v4 + PocketBase 0.29.x + vite-plugin-pwa 1.3.0) is unchanged.*
