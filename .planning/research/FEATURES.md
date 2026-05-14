# Feature Research: Wallecx v3.0 — PWA + Mobile-First UX

**Domain:** Progressive Web App personal records vault (vaccinations + membership/loyalty cards)
**Researched:** 2026-05-14
**Confidence:** HIGH (iOS PWA behaviour from current official sources + MDN); MEDIUM (UX patterns synthesised from multiple live app analyses); LOW-flagged where noted

---

## Scope Anchor

This research covers the PWA and mobile-first UX layer to be added in v3.0. The app already has:
- Full-screen scan overlay with wake lock (Teleport, `position:fixed;inset:0;z-index:9999`, wake lock)
- PrimeVue Tabs shell, two self-contained tabs (VaccinationsTab, MembershipsTab)
- Vercel HTTPS deployment (prerequisite for service workers already satisfied)
- navy/amber design system, Rubik font, PrimeVue Aura

Do not re-research the card grid, barcode rendering, CRUD, or auth — they are shipped. Focus: installability, offline shell, mobile layout polish, touch interactions, iOS Safari constraints.

---

## Table Stakes

Features users expect from a "wallet on your phone home screen" experience. Missing these makes the PWA feel like a clipped website, not an app.

| Feature | 1-Sentence Description | Complexity | Existing Code Dependency |
|---------|------------------------|------------|--------------------------|
| **Web App Manifest** | `manifest.json` with `name`, `short_name`, `icons` (192 + 512 PNG), `theme_color` (navy), `background_color`, `display: standalone`, `start_url: /projects/wallecx` | LOW | None — new file in `public/` |
| **Service worker with app-shell pre-cache** | `vite-plugin-pwa` with Workbox `generateSW` pre-caches all Vite-output assets so the HTML/CSS/JS shell loads instantly on repeat visits even on bad mobile signal | LOW-MED | Adds `vite-plugin-pwa` dev dep; configure in `vite.config.ts` |
| **Installable from browser** | The app must pass the PWA installability checklist (HTTPS + manifest + service worker) so Android shows the system "Add to Home Screen" banner and Chrome shows the mini-infobar | LOW | Satisfied automatically once manifest + SW exist on Vercel HTTPS |
| **Standalone display mode** | `display: standalone` removes browser address bar and controls when launched from home screen, making it feel like a native wallet app | LOW | Part of manifest — no code change |
| **Safe area insets** | CSS `env(safe-area-inset-*)` padding prevents content from hiding behind iPhone notch, Dynamic Island, and Android gesture bar at the bottom nav | LOW | `src/components/projects/wallecx/WallecxApp.vue` + any bottom-anchored UI |
| **Prevent rubber-band overscroll in standalone mode** | `overscroll-behavior: none` on `html, body` scoped to `@media (display-mode: standalone)` kills the iOS elastic bounce and Android pull-to-refresh that break wallet immersion | LOW | Add to global CSS or `WallecxApp.vue` scoped style |
| **Offline shell (not offline data)** | When the user opens the installed PWA with no network, the app shell renders (logo, tabs, nav) instead of a browser error page; data panels show a "no connection" message instead of an unhandled network error | MED | Requires SW + a catch-all offline fallback page; data fetch error handling already exists in tabs |
| **44px minimum tap targets** | Every button, card tile tap area, tab trigger, and icon button must be at least 44×44px (Apple HIG) / 48dp (Material) — avoids mis-taps on card grid at checkout | LOW | Audit existing PrimeVue components; most are already compliant; card tiles need verification |
| **Touch-friendly card grid spacing** | Cards in the 2-column grid need at least 8px gap and a minimum card height of ~80px so adjacent cards are not accidentally tapped; the existing grid already does this but needs verification on 375px viewport | LOW | Verify `MembershipCard.vue` and vaccination group panel on narrow viewports |
| **iOS Add-to-Home-Screen instruction banner** | Because iOS has no `beforeinstallprompt` event, show a one-time dismissible banner ("Tap Share → Add to Home Screen to install Wallecx") when `navigator.standalone !== true` and the user is on iOS Safari | LOW | New `PwaInstallBanner.vue` component in `WallecxApp.vue`; check `window.navigator.standalone` |

---

## Differentiators

Features that elevate the app from "PWA checkbox" to "feels like a real wallet app". Not required at launch but high value-to-effort ratio.

| Feature | 1-Sentence Description | Complexity | Existing Code Dependency |
|---------|------------------------|------------|--------------------------|
| **Android custom install prompt** | Intercept `beforeinstallprompt`, defer it, and show a tasteful in-app "Install Wallecx" button in the tab bar or settings panel that triggers the native prompt on user gesture | LOW-MED | New composable `usePwaInstall.ts`; Android only |
| **Bottom navigation bar** | Replace or supplement the current PrimeVue Tabs header with a fixed bottom nav bar (Vaccinations / Memberships / Settings icons) that respects `safe-area-inset-bottom`, matching the native wallet app pattern | MED | Requires restructuring `WallecxApp.vue`; PrimeVue has no bottom-tab component — build with Tailwind + router events |
| **Card detail as bottom sheet** | MembershipDetail.vue opens as a slide-up bottom sheet (CSS translate + transition, handle affordance bar) instead of a dialog, matching how Google Wallet and Stocard show card detail | MED | Replace or extend current PrimeVue Dialog usage in MembershipsTab; requires new `BottomSheet.vue` component or Headless UI equivalent |
| **Swipe down to dismiss bottom sheet** | Touch gesture on the handle bar or the sheet itself drags it down and dismisses on release past 30% threshold — native feel, one-handed usable | MED | Requires `vue3-touch-events` or native `pointer` event listeners in `BottomSheet.vue` |
| **Screen orientation hint for wide barcodes** | When a Code 128 / EAN-13 barcode is active in the fullscreen scan overlay, show a soft "Rotate for wider view" tooltip if in portrait and the barcode SVG is being clipped | LOW | Already have scan overlay; add `screen.orientation.type` check + conditional tooltip |
| **iOS Wake Lock guard (iOS 18.4+)** | Wake lock was broken in installed PWAs until iOS 18.4; show a graceful degradation toast ("Keep your screen on while scanning") on iOS < 18.4 rather than a silent failure | LOW | Wake lock already implemented in scan overlay; add iOS version detection and toast |
| **Update notification toast** | When a new SW version is available (Workbox `onNeedRefresh`), show a PrimeVue Toast with "Update available — tap to reload" instead of a silent background update that breaks open tabs | LOW-MED | Wire `vite-plugin-pwa`'s `useRegisterSW` composable to a toast |
| **`theme-color` meta tag** | Set `<meta name="theme-color" content="#0f172a">` (Wallecx navy) so the browser chrome turns navy in standalone mode and in the Android task switcher | LOW | Add to `index.html`; already using Vercel — no SSR concerns |
| **Splash screen / startup image** | Add `apple-touch-startup-image` link tags for common iPhone screen sizes so there's a branded splash during launch rather than white flash | LOW | Static PNG assets in `public/`; tedious but low risk |
| **Expiry push notifications** | When a membership card is within 30 days of expiry, send a push notification — requires SW push listener + PocketBase-side scheduler or a cron webhook | HIGH | Requires notification permission flow, push subscription storage in PocketBase, server-side trigger — significant new infrastructure; defer |

---

## Anti-Features

Build these and you'll regret it. Well-designed wallet PWAs explicitly exclude them.

| Anti-Feature | Why Tempting | Why Wrong for Wallecx | What to Do Instead |
|--------------|--------------|----------------------|-------------------|
| **Full offline-first with IndexedDB sync** | Google Workbox patterns make it look easy | PocketBase JS SDK has no offline mode; building a full sync layer (conflict resolution, optimistic mutation queue, re-auth offline) is a multi-week project for a personal vault that the user opens on their phone | Cache the app shell + static assets; show "no connection" state for data fetches; do not replicate PocketBase data to IndexedDB |
| **Background Sync for deferred writes** | Would let CRUD work offline | `BackgroundSyncPlugin` is unsupported on iOS entirely; Android support is fragile; a personal vault has no legitimate use case for deferred writes (you don't need to add a card while offline) | Require network for all data mutations; surface a clear "offline — changes will not save" banner |
| **Push notification infrastructure for v3.0** | Notification bell on wallet apps is expected | Requires: push subscription registration, storage in PocketBase, server-side scheduler, iOS 16.4+ + installed PWA constraint, EU restriction, `notification` permission UX — a full milestone on its own | File as a future milestone requirement; mark CONV-03 as post-v3.0 |
| **Periodic Background Sync** | Cache fresh card data in the background | Completely unsupported on iOS (any version); unreliable on Android Chrome | Network-on-open is sufficient for a personal vault; load on tab activation |
| **Force orientation lock to portrait/landscape** | Wallet cards look better in portrait | `screen.orientation.lock()` requires a PWA with `orientation` in the manifest AND the browser to honour it — iOS does not honour orientation lock at all; forcing it breaks the scan overlay which benefits from landscape | Use soft landscape hint for wide barcodes in scan overlay; leave system orientation free |
| **`display: fullscreen`** | True fullscreen, no status bar | iOS Safari does not support `display: fullscreen` for PWAs; the status bar always shows; attempting this causes layout bugs on iPhone notch devices | Use `display: standalone`; the existing fullscreen scan overlay (Teleport + `inset:0`) already achieves visual fullscreen |
| **Web NFC** | "Tap to add card" feels modern | Web NFC is Android-Chrome-only, flagged experimental, and not available in any PWA installed to home screen on iOS | Manual barcode value entry + optional card photo (already implemented) |
| **App Store submission** | Wrapping the PWA in a native shell | Adds a native build pipeline (Capacitor or Cordova) that this repo is not set up for; Vercel SPA deployment is the constraint | Rely on PWA install; the Vercel + GitHub Pages SPA pattern is the constraint |

---

## iOS Safari PWA Limitations — Critical Reference

This section is mandatory reading for any phase touching the PWA milestone. iOS is the primary target platform (personal phone wallets are predominantly iPhone in AU).

### Tier 1: Hard Blockers (Cannot Work Around)

| Limitation | Detail | Impact on Wallecx |
|------------|--------|-------------------|
| **No `beforeinstallprompt`** | iOS Safari will never fire this event. No native install banner will appear. | Must build a custom iOS-specific instruction banner. Detect iOS with `navigator.userAgent` + check `window.navigator.standalone`. |
| **EU standalone mode removed (iOS 17.4+)** | In EU countries, PWAs no longer run in standalone mode — they open in Safari tabs with no push, no badges, no home-screen functionality. | Wallecx's primary user (AU) is unaffected. If the app ever goes multi-region, EU is effectively iOS-web-only. |
| **No Background Sync** | `Background Sync API`, `Periodic Background Sync`, `Background Fetch` — all unsupported on iOS, any version. | Do not plan any offline write queue or background data refresh. |
| **No orientation lock** | `screen.orientation.lock()` is silently ignored on iOS. The manifest `orientation` key is also ignored. | Scan overlay landscape benefit is hint-only — cannot enforce. |
| **No vibration** | `navigator.vibrate()` is unimplemented on iOS. | Do not add haptic feedback via the web Vibration API. PrimeVue's built-in focus/active states are sufficient. |

### Tier 2: Conditional / Version-Gated

| Limitation | Status | Version Required | Impact |
|------------|--------|------------------|--------|
| **Push notifications** | Works, but requires: (1) installed to home screen, (2) iOS 16.4+, (3) user grants permission | iOS 16.4+ | Defer push until a dedicated notification milestone. Do not assume push in v3.0. |
| **Wake Lock API** | Broken in installed PWAs until iOS 18.4 (WebKit bug 254545 fixed). Works in Safari tab on iOS 16+ | iOS 18.4 for installed PWA | Existing wake lock code in scan overlay works in-browser. For installed PWA, add `try/catch` + toast fallback. Already done per PROJECT.md. |
| **Storage eviction** | Safari can clear all PWA storage (Cache, IndexedDB) after 7 days of inactivity. Safari 17 raised quota cap to 60% of disk, but eviction policy remains. | All iOS versions | Do not cache user data (vaccination records, card images) in the service worker cache. Cache only static app shell assets. PocketBase is the authoritative store. |
| **Storage quota** | Safari 17+: up to 60% of disk space per origin (improved from earlier 50MB cap). Adequate for app shell + static assets. | Safari 17+ | No practical concern for Wallecx — static assets are small. |

### Tier 3: iOS 26 Positive Changes (2026)

| Feature | What Changed | Impact on Wallecx |
|---------|-------------|-------------------|
| **Default web app mode** | iOS 26: every site added to Home Screen now opens as a web app (standalone-like) by default, even without a manifest. User can opt out. | Wallecx will benefit automatically if the user has iOS 26 — they get the clean no-chrome experience even if they added it before the manifest was added. |
| **Declarative Web Push (Safari 18.4)** | Simplifies push subscription setup. | Relevant only when the notification milestone is built. |

---

## Mobile Layout Patterns — Concrete Guidance

### Card Grid (MembershipsTab)

- **2-column grid at 375px (iPhone SE):** Each card must be `calc(50vw - 20px)` wide with 8–12px gap. At 375px this gives ~166px card width — sufficient for card name + barcode type badge.
- **1-column grid at < 340px:** Rare but covers Galaxy Fold inner screen; use `@media (max-width: 340px)` to switch to single column.
- **Card height:** Fixed `100px` or `aspect-ratio: 1.586` (credit card ratio) maintains visual consistency. Avoid `min-content` height — variable heights break the grid rhythm.
- **Card tap area:** The entire card tile surface is the tap target, not just a button inside it. Use `cursor: pointer` + `user-select: none` on the tile.
- **Google Wallet 2026 update:** Grid layout showing favorite cards front-and-center (confirmed by Pocket-lint report) validates the 2-column card grid approach for Wallecx.

### Card Detail View

- **Bottom sheet over dialog:** A bottom sheet (`transform: translateY`) anchored to the viewport bottom with a drag handle bar is the native-feeling pattern for card detail on mobile (Google Wallet, Stocard style). The existing `MembershipDetail.vue` uses PrimeVue Dialog — appropriate for v2.0 but consider refactoring to a bottom sheet in v3.0.
- **Bottom sheet safe area:** `padding-bottom: env(safe-area-inset-bottom, 16px)` prevents the home indicator bar from overlapping action buttons (Edit / Delete).
- **Handle bar affordance:** A 4×32px rounded pill centered at the top of the sheet signals swipeability. Do not omit this — users will not know the sheet dismisses on swipe.
- **Dismiss on swipe-down or backdrop tap:** Both must work. Swipe threshold: release when translated > 30% of sheet height.
- **Full-screen route alternative:** If the bottom sheet adds complexity, a dedicated route `/projects/wallecx/membership/:id` with a full-page layout is simpler and gives a real back-button for the scan overlay. Evaluate against the bottom sheet in the implementation phase.

### Scan Overlay (BarcodeDisplay fullscreen)

- **Already implemented** (Teleport + `position:fixed;inset:0;z-index:9999`) — correct approach for iOS where `requestFullscreen()` on non-video elements is unsupported.
- **Barcode contrast:** White `background-color` on the barcode rendering area is non-negotiable. Dark backgrounds cause scanner read failure.
- **Minimum barcode width:** 80% of screen width. On 375px this is 300px — sufficient for Code 128 at standard bar widths.
- **Bottom spacing:** Add `padding-bottom: env(safe-area-inset-bottom, 24px)` to the overlay close button area so it does not sit under the iPhone home indicator.

### Tab Navigation

- **Header tabs (current PrimeVue Tabs):** Appropriate for a two-tab app. Bottom navigation is higher-value for 5+ tabs — do not over-engineer for two tabs.
- **Tab strip safe area:** Add `padding-top: env(safe-area-inset-top, 0px)` to the tab header if the app is launched in standalone mode to avoid content hiding under the status bar.
- **Active tab indicator:** PrimeVue Aura's default underline is sufficient; ensure the active indicator colour is amber (existing design token) so it reads clearly in bright outdoor light (checkout counter use case).

### Touch Target Audit Requirements

These components need a 44×44px tap target verification before v3.0 ships:
- `MembershipCard.vue` — entire tile must be tappable (not just a button within it)
- Group panel close button in `VaccinationGroupPanel.vue`
- Edit/Delete icon buttons in `MembershipDetail.vue`
- Scan overlay close / X button
- Tab triggers in `WallecxApp.vue`

---

## Offline Strategy — Realistic for a PocketBase SPA

### What Is Achievable

| Strategy | What It Does | Complexity | Recommendation |
|----------|-------------|------------|----------------|
| **App shell pre-cache** | SW pre-caches all Vite build output (HTML, CSS, JS, fonts, icons). On repeat visits the shell loads instantly regardless of network. Data panels show loading state while fetching from PocketBase. | LOW | SHIP IN V3.0 — highest ROI PWA feature |
| **Static asset cache** | Vite-output images, PrimeVue icon font, and Rubik WOFF2 cached via `CacheFirst` strategy. | LOW | Included automatically in `generateSW` mode |
| **Offline fallback page** | SW catches navigation requests that fail (no network) and serves a simple `offline.html` or the cached `index.html` with a "No connection" banner. Prevents the ugly browser error page. | LOW-MED | SHIP IN V3.0 |
| **Stale-while-revalidate for CDN assets** | If using Google Fonts or PrimeVue CDN assets, serve cached version while fetching update. | LOW | Relevant only if CDN assets are not bundled; Vite bundles them — not needed |

### What Is Not Achievable (PocketBase Constraint)

| Strategy | Why It Fails | Verdict |
|----------|-------------|---------|
| **Offline card data reads** | PocketBase JS SDK requires a live HTTP connection. The SDK has no offline mode or local data store. Caching the JSON API responses in the SW cache is theoretically possible but you'd get stale data with no invalidation mechanism. | DO NOT BUILD |
| **Offline CRUD mutations** | Background Sync is unsupported on iOS. Android support is unreliable. A personal vault has no legitimate use case for deferred writes. | DO NOT BUILD |
| **IndexedDB data replica** | Replicating PocketBase records to IndexedDB requires a conflict resolution strategy, re-auth handling, and ongoing maintenance — a product in itself. | OUT OF SCOPE |

### Recommended Workbox Configuration

Use `vite-plugin-pwa` with `generateSW` strategy (zero custom SW code needed for v3.0):

```ts
// vite.config.ts addition
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'prompt',          // Show update toast; do not auto-reload
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
  manifest: {
    name: 'Wallecx',
    short_name: 'Wallecx',
    description: 'Your personal records vault',
    theme_color: '#0f172a',        // Lexarium navy
    background_color: '#0f172a',
    display: 'standalone',
    start_url: '/projects/wallecx',
    scope: '/projects/wallecx',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    navigateFallback: '/projects/wallecx',
    runtimeCaching: []             // No API caching — PocketBase data is online-only
  }
})
```

**Key decisions:**
- `registerType: 'prompt'` — do not silently update; show a toast via `useRegisterSW` so the user's open tabs do not break
- `navigateFallback: '/projects/wallecx'` — serves the cached app shell for all sub-routes offline (correct for SPA)
- Empty `runtimeCaching` — do not cache PocketBase API responses; no stale-data bugs
- `scope: '/projects/wallecx'` — scopes SW to Wallecx only, does not intercept other Lexarium mini-apps

### iOS Storage Eviction Implication

Because iOS can evict the service worker cache after 7 days of inactivity, the offline shell is a "better than nothing" feature, not a reliability guarantee. If the user hasn't opened Wallecx for a week, they may lose the cached shell. This is acceptable — the user still needs the network to see their cards. Document this constraint; do not over-engineer around it.

---

## Add-to-Home-Screen UX

### Android Flow

1. Browser fires `beforeinstallprompt` → intercept and `event.preventDefault()`
2. Show a subtle in-app banner or a settings panel "Install Wallecx" button
3. On user tap → call `event.prompt()` → system shows native install dialog
4. On `userChoice === 'accepted'` → dismiss banner, store flag in `localStorage` to suppress future prompts

**Composable:** `usePwaInstall.ts` — listens for `beforeinstallprompt`, exposes `canInstall` and `install()`.

### iOS Flow

iOS has no install event. The only option is user education.

1. Detect iOS: `/(iphone|ipad|ipod)/i.test(navigator.userAgent) && !window.navigator.standalone`
2. Show dismissible banner with Safari Share icon + "Add to Home Screen" instruction text
3. Dismiss on tap or after user adds to home screen (detect via `window.navigator.standalone` becoming `true` on next load)
4. Store dismiss flag in `localStorage` — do not re-show every session

**Component:** `PwaInstallBanner.vue` — renders different content for iOS vs Android, auto-hides if already installed.

**iOS 26 note:** The default web-app-mode change means iOS 26 users who add the site (even without a PWA prompt) will get standalone mode automatically. The instruction banner is still needed for iOS < 26 and for users unfamiliar with the Share sheet flow.

### Timing

- Do not show the install banner on first visit — show it only after the user has successfully logged in and viewed at least one card. The user needs to understand the app's value before being asked to install it.
- If the user dismisses the banner, wait at least 7 days before showing again. Store dismiss timestamp in `localStorage`.

---

## Feature Dependencies

```
[HTTPS + Vercel deployment] ← already satisfied
    └──required by──> [Service Worker registration]
    └──required by──> [PWA installability]

[vite-plugin-pwa + Workbox]
    └──generates──> [Service Worker]
    └──generates──> [Pre-cache manifest]
    └──exposes──> [useRegisterSW composable]
        └──required by──> [Update notification toast]

[manifest.json]
    └──required by──> [Android install prompt]
    └──required by──> [Standalone display mode]
    └──required by──> [theme_color in browser chrome]
    └──required by──> [Home screen icons]

[PwaInstallBanner.vue]
    └──requires──> [navigator.userAgent iOS detection]
    └──requires──> [window.navigator.standalone check]
    └──requires──> [localStorage dismiss flag]

[usePwaInstall.ts composable]
    └──requires──> [beforeinstallprompt event (Android only)]
    └──used by──> [Install button in WallecxApp.vue or settings]

[safe-area-inset CSS]
    └──required by──> [Bottom navigation (if added)]
    └──required by──> [Scan overlay close button]
    └──required by──> [Bottom sheet action area]

[Bottom sheet component]
    └──requires──> [touch/pointer event handling]
    └──replaces/extends──> [MembershipDetail.vue Dialog usage]
    └──enables──> [Swipe-down to dismiss]

[Offline fallback page]
    └──requires──> [Service Worker (navigateFallback)]
    └──requires──> [Cached app shell HTML]
```

---

## MVP for v3.0 — PWA Milestone

### Ship in v3.0 (High ROI, Low-Medium Complexity)

| # | Feature | Complexity | Notes |
|---|---------|------------|-------|
| 1 | Web App Manifest (`manifest.json`) | LOW | Icons, theme_color, display:standalone, start_url |
| 2 | `vite-plugin-pwa` + Workbox app shell pre-cache | LOW-MED | `generateSW` mode; no runtime API caching |
| 3 | Offline fallback (no-network state handled gracefully) | LOW-MED | `navigateFallback` + data-fetch error handling already in tabs |
| 4 | iOS Add-to-Home-Screen instruction banner | LOW | `PwaInstallBanner.vue`; detect iOS + standalone |
| 5 | Android custom install prompt | LOW-MED | `usePwaInstall.ts` composable |
| 6 | `overscroll-behavior: none` in standalone mode | LOW | Single CSS rule scoped to `display-mode: standalone` |
| 7 | Safe area inset padding | LOW | CSS variables on WallecxApp, scan overlay, and any bottom-anchored UI |
| 8 | `theme-color` meta tag | LOW | `index.html` change only |
| 9 | 44px tap target audit + fixes | LOW | Component-level CSS audit |
| 10 | Update-available toast (SW `onNeedRefresh`) | LOW-MED | Wire `useRegisterSW` to PrimeVue Toast |
| 11 | iOS Wake Lock version detection + toast | LOW | Already has try/catch; add iOS version sniff |

### Defer to v3.x (Higher Complexity or Lower ROI)

| Feature | Why Defer | When to Revisit |
|---------|-----------|-----------------|
| Bottom sheet for card detail | Medium complexity; current Dialog works; UX improvement not a blocker | After v3.0 ships and user feedback confirms friction with Dialog |
| Swipe-down gesture on bottom sheet | Depends on bottom sheet being built first | Same as above |
| Splash screen / startup images | Tedious PNG generation for many iPhone sizes; low user-visible benefit | If iOS 26 default web app mode reduces demand |
| Push expiry notifications | Full new infrastructure (subscription, storage, server scheduler) | Dedicated notification milestone post v3.0 |
| Bottom navigation bar | Only beneficial at 3+ tabs; currently 2 tabs | Add when Wallecx grows a third tab |

### Out of Scope (Explicitly)

- Offline-first CRUD / IndexedDB data replica
- Background Sync for deferred writes
- Periodic Background Sync (not supported iOS)
- Web NFC (not supported iOS)
- Orientation lock (not supported iOS)
- App Store / Play Store submission (requires native wrapper build pipeline)
- Apple Wallet / Google Wallet pass export

---

## Confidence Assessment

| Finding | Confidence | Basis |
|---------|------------|-------|
| iOS has no `beforeinstallprompt` | HIGH | MDN Web Docs + Apple WebKit bug tracker + multiple current sources |
| iOS 18.4 fixed Wake Lock in installed PWAs | HIGH | WebKit bug 254545 + magicbell.com 2026 guide |
| iOS 26 makes every home-screen site open as web app | HIGH | MacRumors + 9to5Mac April 2026 reports |
| EU iOS 17.4+ removes standalone mode | HIGH | Multiple sources citing Apple DMA compliance |
| 7-day iOS storage eviction | HIGH | magicbell.com + multiple corroborating sources |
| `overscroll-behavior: none` for native feel | HIGH | gfor.rest native-feel guide + MDN |
| `env(safe-area-inset-*)` for notch/gesture bar | HIGH | MDN Web API + Apple HIG |
| `vite-plugin-pwa` + `generateSW` as correct tool | HIGH | Official vite-plugin-pwa docs + DigitalOcean guide + multiple 2025 tutorials |
| No PocketBase offline mode | HIGH | PocketBase GitHub discussion #4379 — confirmed no offline SDK support |
| Bottom sheet pattern for card detail (native feel) | MEDIUM | Synthesis from multiple wallet UX analyses; not a single authoritative source |
| iOS push requires installed + 16.4+ | HIGH | Apple WebKit release notes + magicbell.com 2026 |
| 44px minimum tap target | HIGH | Apple HIG + WCAG 2.5.5 |
| Android `beforeinstallprompt` interception pattern | HIGH | web.dev promote-install article (official Google) |

---

## Sources

- [PWA iOS Limitations and Safari Support — magicbell.com 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Do Progressive Web Apps Work on iOS? — mobiloud.com 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Safari PWA Limitations on iOS — bswen.com 2026](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/)
- [PWAs on iOS in 2025 — Medium (ravi6997)](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)
- [iOS 26: Add Web App or Bookmark to iPhone Home Screen — MacRumors](https://www.macrumors.com/how-to/save-safari-bookmark-web-app-iphone-home-screen/)
- [iOS 26 Home Screen App Icons — 9to5Mac, April 2026](https://9to5mac.com/2026/04/14/ios-26-has-new-home-screen-setting-for-app-icons-heres-how-to-use-it/)
- [Web Apps in iOS 26 — Michael Tsai Blog](https://mjtsai.com/blog/2025/10/03/web-apps-in-ios-26/)
- [Patterns for promoting PWA installation — web.dev (Google)](https://web.dev/articles/promote-install)
- [Making PWAs installable — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Making the comprehensive guide to native-feeling PWAs — gfor.rest](https://www.gfor.rest/blog/making-pwas-feel-native)
- [Offline data — web.dev](https://web.dev/learn/pwa/offline-data/)
- [Offline-First PWAs: Service Worker Caching Strategies — magicbell.com](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies)
- [vite-plugin-pwa — GitHub](https://github.com/vite-pwa/vite-plugin-pwa)
- [vite-plugin-pwa generateSW docs — netlify](https://vite-pwa-org.netlify.app/workbox/generate-sw)
- [PocketBase offline mode — GitHub Discussion #4379](https://github.com/pocketbase/pocketbase/discussions/4379)
- [Screen Wake Lock API — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [WebKit Bug 254545 — Wake Lock in installed PWAs (iOS)](https://bugs.webkit.org/show_bug.cgi?id=254545)
- [Bottom Sheets vs Fullscreen Modals — Design for Native](https://designfornative.com/bottom-sheets-vs-fullscreen-modals/)
- [Mobile Accessibility Patterns: Bottom Sheets — TestParty](https://testparty.ai/blog/mobile-accessibility-patterns)
- [Motor Impairments and Touch Targets — Siteimprove](https://www.siteimprove.com/blog/motor-impairments-and-mobile-ui-the-touch-target-problem/)
- [Google Wallet grid layout update — Pocket-lint 2026](https://www.pocket-lint.com/google-wallet-ui-update/)

---
*Feature research for: Wallecx v3.0 PWA + Mobile-First UX*
*Researched: 2026-05-14*
