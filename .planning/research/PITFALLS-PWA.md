# Pitfalls Research — Wallecx v3.0 PWA + Mobile-First

**Domain:** Adding PWA (vite-plugin-pwa / Workbox) + mobile-first layout to an existing Vue 3 SPA backed by PocketBase, deployed on Vercel.
**Researched:** 2026-05-14
**Confidence:** HIGH for iOS storage eviction (WebKit official blog + multiple verified sources), HIGH for vite-plugin-pwa configuration (official docs), HIGH for PrimeVue Dialog + keyboard (GitHub issue tracker), MEDIUM for Vercel-specific service worker interactions (community + official docs), MEDIUM for Tailwind v4 / PrimeVue dark-mode conflict (GitHub issue tracker, no official fix confirmed).

> This document covers pitfalls introduced by the v3.0 PWA + mobile milestone only. Pitfalls already catalogued and resolved in v1.0–v2.0 (barcode rendering, ColorPicker, per-user isolation, save-loop, wake lock, fullscreen overlay) are not repeated here.

---

## Section 1: iOS Safari PWA — Storage Eviction and Session Loss

### IOS-1: PocketBase auth token silently disappears after 7 days of inactivity — user is logged out with no warning

**Severity:** CRITICAL

**Mechanism:**
PocketBase's default `LocalAuthStore` persists the JWT auth token in `localStorage` under the key `pocketbase_auth`. iOS Safari (all versions through iOS 17+) implements a "7-day cap on all script-writable storage." Specifically: if the origin has no user interaction within 7 days of browser use, all script-written storage — `localStorage`, `sessionStorage`, `IndexedDB`, Cache Storage, and service worker registrations — is **deleted in its entirety**. This is not a graceful expiry; the entire `pocketbase_auth` key is removed, leaving `pb.authStore.isValid === false`.

The user opens the PWA after a holiday, and the app silently shows a blank state or a login redirect. No error is thrown; the app behaves as if the user never logged in. They may not understand why their cards are gone.

**iOS storage behaviour specifics (HIGH confidence — webkit.org):**
- Safari uses a least-recently-used eviction policy.
- Eviction is triggered by: (1) exceeding overall quota, (2) device storage pressure, or (3) no user interaction within the lookback window.
- When an origin is evicted, **all** its storage types are deleted simultaneously. There is no partial eviction.
- Home Screen PWA mode was previously exempt from this cap, but that exemption was removed as of iOS 17.4 (March 2024). A home-screen-added Wallecx PWA has the same risk as a browser tab.
- Persistent storage (`navigator.storage.persist()`) can request exemption, but WebKit grants it heuristically. For a home-screen PWA it often grants it, but there is no guarantee. The `persist()` call requires a user gesture (or is triggered by the PWA being added to the home screen).

**Prevention:**
1. Call `navigator.storage.persist()` on app startup, inside `onMounted` in `App.vue` or `WallecxApp.vue`. Gate behind feature detection: `if (navigator.storage?.persist) { await navigator.storage.persist(); }`. This increases the likelihood of storage exemption when the app is added to the home screen.
2. On every `onMounted` of `WallecxApp.vue`, check `pb.authStore.isValid`. If false, call `pb.authStore.clear()` and redirect to `/login` with a toast: "Your session expired. Please log in again." Never silently land on an empty state.
3. Do not use `sessionStorage` for any Wallecx UI state (view toggle, selected tab) that should survive a page reload — `sessionStorage` is also subject to eviction and is cleared on every app restart in standalone mode on iOS.
4. Do not attempt to "re-login automatically" using stored credentials (`VITE_LOGIN_*`) — this pattern is already flagged as a security risk in `CONCERNS.md` and would be a plaintext credential in the bundle.
5. Display a "signed in as [user]" indicator in the Wallecx tab header. Users who return after inactivity immediately see whether they are still signed in before trying to use the app.

**Phase:** PWA foundation phase (service worker setup). The `persist()` call and auth-validity check must be wired before any other PWA feature ships.

---

### IOS-2: Clearing Safari history also clears the PWA's localStorage — no warning to user

**Severity:** HIGH

**Mechanism:**
On iOS, "Clear History and Website Data" in Safari Settings wipes all script-writable storage for all origins, including PWAs added to the home screen. Many users do this to free space or for privacy, not realising it logs them out of home-screen PWAs. The PWA's service worker registration is also deleted, so the next open downloads the entire app again.

This differs from Android Chrome where installed PWA storage is isolated from the browser's "Clear History" action.

**Prevention:**
1. Same as IOS-1 prevention: check `pb.authStore.isValid` on mount and redirect gracefully.
2. Add a user-facing note in any "About" or help section: "On iPhone, clearing Safari history will log you out of this app."
3. Do not store anything in localStorage that cannot be re-fetched from PocketBase on login. Wallecx currently stores only the auth token and `sessionStorage` view-toggle prefs — this is already a good pattern.

**Phase:** PWA foundation phase. The graceful auth-invalid redirect is the only code change required.

---

### IOS-3: PocketBase auth token survives service worker update, but the service worker scope change can silently log the user out

**Severity:** HIGH

**Mechanism:**
`localStorage` is NOT intercepted by the service worker — it is a browser primitive that bypasses the fetch event entirely. The PocketBase token in `pocketbase_auth` persists across service worker installs and updates without any special handling. This is the good news.

The bad news: if the service worker `scope` changes (e.g., the manifest `start_url` moves from `/` to `/projects/wallecx`), the browser may treat this as a different registration, deregister the old service worker, and — on iOS — this deregistration can trigger storage cleanup for the old scope. The auth token is stored under the top-level origin (`/`), so in practice a scope change on Vercel is unlikely to evict it, but it is a risk during PWA initial setup if the scope is misconfigured.

**Prevention:**
1. Set the service worker scope to `/` (the root) in `vite-plugin-pwa` config: `scope: '/'`. This is the default and should not be changed. Do not set `start_url` to a deep path like `/projects/wallecx` — set it to `/?source=pwa` so the app shell loads then routes to the correct view.
2. Never change the service worker scope after initial deployment. If scope must change, force users to clear the old service worker manually or use a `ServiceWorkerRegistration.unregister()` cleanup script on app boot.
3. On every app startup after a service worker update, re-check `pb.authStore.isValid` and call `pb.collection('users').authRefresh()` if valid but nearing expiry (token `exp` within 7 days). PocketBase's `autoRefreshThreshold` option can automate this for superuser auth; for regular users, manually call `pb.collection('users').authRefresh()` in a startup hook.

**Phase:** PWA foundation phase (service worker config). Token refresh wiring can be a separate task in the same phase.

---

## Section 2: Service Worker Update UX

### SW-1: Users stuck on a stale cached app version indefinitely — the "invisible update" trap

**Severity:** CRITICAL

**Mechanism:**
When vite-plugin-pwa is configured with `registerType: 'autoUpdate'`, the new service worker installs and immediately takes control (`skipWaiting: true`, `clientsClaim: true`). Open tabs are reloaded automatically. This sounds safe, but:
- A user filling in the vaccination form loses unsaved data when the auto-reload fires.
- On iOS Safari standalone mode, the reload may cause the app to exit standalone mode and open in Safari (a known iOS quirk with forceful navigation).

When configured with `registerType: 'prompt'` (the default), the new service worker waits in `waiting` state indefinitely if the user never closes and reopens the app. A user who keeps the PWA open for days (e.g., pinned to home screen, never force-quit) will run the old version forever. Meanwhile Vercel has served a new build; the API responses may have a different shape.

Both strategies have failure modes specific to this stack.

**Recommended strategy for Wallecx:** Use `registerType: 'prompt'` with a **non-blocking toast notification** (not a blocking modal). The toast appears at the bottom of the screen: "An update is available. [Refresh now]". This gives users control without forcing data loss, and surfaces the update to users who keep the app open.

**Prevention:**

1. Install vite-plugin-pwa and configure as follows:
   ```typescript
   // vite.config.ts
   VitePWA({
     registerType: 'prompt',
     workbox: {
       globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
       navigateFallback: 'index.html',
       navigateFallbackDenylist: [/^\/api/],
     },
     manifest: { /* ... */ },
   })
   ```

2. In `App.vue` (or a dedicated `PwaUpdateNotifier.vue`), use `useRegisterSW` from `virtual:pwa-register/vue`:
   ```typescript
   import { useRegisterSW } from 'virtual:pwa-register/vue'
   const { needRefresh, updateServiceWorker } = useRegisterSW()
   // Show a PrimeVue Toast when needRefresh.value === true
   // Call updateServiceWorker() when user taps "Refresh"
   ```

3. Wire `needRefresh` to a `vue-sonner` toast (already in the stack): "New version available" with a "Refresh" action button. Do NOT use a blocking Dialog or Drawer — the update prompt should never interrupt active use.

4. Add periodic SW update checks with `periodicSyncForUpdates: 3600` (check hourly) so long-running sessions eventually get prompted even if the app is never closed.

5. Never use `autoUpdate` for Wallecx because the vaccination and membership forms can have unsaved state. An auto-reload mid-form loses data with no recovery.

**Phase:** PWA foundation phase. The update notifier component must be wired at the same time as the service worker is first registered — not added later.

---

### SW-2: Service worker update leaves the app in a broken state — old and new chunks mixed

**Severity:** HIGH

**Mechanism:**
When vite-plugin-pwa generates the service worker precache manifest, each asset filename includes a content hash (e.g., `wallecx-abc123.js`). When a new build deploys, chunk hashes change. If a user's tab has the old service worker active while Vercel serves the new index.html (possible during the brief transition window), the tab may request old chunk hashes that no longer exist on Vercel. This produces 404s for JS chunks, breaking the app entirely.

This is the "stale chunk" problem: the old service worker serves stale `index.html` from cache (which references old chunk names), but when those chunks are requested, they 404 because Vercel only keeps the latest build's assets.

**Prevention:**
1. Use `workbox.cleanupOutdatedCaches: true` (vite-plugin-pwa default is true in `generateSW` mode). This removes old precache entries when the new service worker activates.
2. Ensure `globPatterns` in the workbox config captures all chunk file patterns: `['**/*.{js,css,html,ico,png,svg,woff2}']`. Missing a pattern means some chunks are served from Vercel's CDN (not cache) and may 404 after a redeploy.
3. Set Vercel to serve assets with long cache TTLs for hashed filenames and short/no-cache for `index.html` and `sw.js`. Add a `vercel.json`:
   ```json
   {
     "headers": [
       { "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
       { "source": "/(.*\\.js|.*\\.css)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
     ]
   }
   ```
4. The `navigateFallback: 'index.html'` in workbox ensures navigations (URL bar entries, link clicks) always hit the cached `index.html`, preventing the old-index-new-chunks mismatch from being compounded by a network-fetched index.

**Phase:** PWA foundation phase. The `vercel.json` headers must be committed at the same time as the service worker is first deployed.

---

## Section 3: Vue Router + Service Worker Offline Navigation

### ROUTER-1: Navigating to `/projects/wallecx` offline shows a white screen — navigateFallback not configured

**Severity:** CRITICAL

**Mechanism:**
Vue Router uses HTML5 history mode (`createWebHistory()`). When the user navigates offline by typing a URL or clicking a link, the browser issues a network request for that URL. Without a service worker, Vercel's 404.html handles this (the existing `cp dist/index.html dist/404.html` build script). With a service worker, the browser's fetch event intercepts the navigation — but if `navigateFallback` is not configured, the service worker has no response for `/projects/wallecx` and returns a network error, producing a white screen.

**Prevention:**
1. Set `workbox.navigateFallback: 'index.html'` in the vite-plugin-pwa config. This tells the service worker: for any navigation request that doesn't match a precached asset, respond with the cached `index.html`.
2. Add `workbox.navigateFallbackDenylist: [/^\/api/, /^\/_vercel/]` to exclude API and Vercel infrastructure paths from the fallback. Without this, a failed API call that triggers a navigation would incorrectly serve `index.html`.
3. Ensure `index.html` is in the precache manifest. vite-plugin-pwa includes it by default in `generateSW` mode.
4. The existing Vercel `404.html` fallback (from the build script) is not used when the service worker is active — the SW intercepts navigation before Vercel's edge network can respond.

**Phase:** PWA foundation phase. This is a prerequisite for the PWA to be usable offline in any form.

---

### ROUTER-2: Offline PocketBase fetch fails silently — user sees blank card list, not an offline message

**Severity:** HIGH

**Mechanism:**
Wallecx's vaccination and membership fetches call PocketBase (`VITE_API_BASE_URL`) which is a remote server, not a cached resource. When offline, these fetches throw a `TypeError: Failed to fetch` (network error). The current error handling in `VaccinationsTab.vue` and `MembershipsTab.vue` shows a generic error state (or nothing at all if not handled). A user opening the PWA offline expects to see their cached cards — but PocketBase responses are not cached by the service worker, so the lists are empty.

This is a fundamental limitation: Wallecx is an online-first app (`PROJECT.md` explicitly lists "Offline-first / PWA support" as Out of Scope). However, the service worker being present without explicit handling creates a misleading experience: the app shell loads (from cache) but all content is missing.

**Prevention:**
1. In `VaccinationsTab.vue` and `MembershipsTab.vue`, catch network errors from PocketBase fetches and display a clear offline message: "You're offline. Connect to the internet to view your records."
2. Check `navigator.onLine` on mount and watch the `online`/`offline` events: `window.addEventListener('offline', () => { isOffline.value = true; })`. Show a persistent PrimeVue `Message` (severity: `warn`) at the top of each tab.
3. Do NOT attempt to cache PocketBase API responses in the service worker's runtime cache for this milestone. Caching dynamic authenticated API responses introduces cache invalidation complexity (stale card data, auth header mismatch) that is out of scope. The "online-only" model from `PROJECT.md` remains valid — the PWA improvement is app-shell caching, not data caching.
4. The workbox `navigateFallbackDenylist` must exclude the PocketBase API base URL pattern so the service worker never tries to serve a cached response for API calls.

**Phase:** PWA foundation phase (offline detection). The user-facing offline message is table stakes for PWA — do not ship the service worker without it.

---

## Section 4: PrimeVue Dialog + Mobile Keyboard

### DLG-1: ManageMembership.vue and ManageVaccination.vue Dialogs pushed partially off-screen by soft keyboard on iOS

**Severity:** HIGH

**Mechanism:**
PrimeVue `Dialog` uses `position: fixed` and centers itself with a CSS transform. On iOS Safari, when a text input inside the dialog receives focus, the soft keyboard opens and the browser resizes the visual viewport (the visible area) but does NOT resize the layout viewport. The CSS `vh` unit is computed against the layout viewport (full screen), so a dialog centered with `top: 50vh` appears to jump up — or more often, the dialog's bottom is clipped below the keyboard with no way to scroll to the Submit button.

This affects both `ManageVaccination.vue` (vaccine name, date, lot, notes fields) and `ManageMembership.vue` (card number, issuer, expiry fields). Both dialogs have submit buttons near the bottom.

This is a known PrimeVue issue (GitHub issues #1855, #3972) with no framework-level fix as of 2026. The `dvh` (dynamic viewport height) unit was standardised in 2023 (Baseline Widely Available June 2025) but PrimeVue's internal Dialog positioning still uses `vh`-equivalent logic in its inline styles.

**Prevention:**
1. Set `maximizable: false` and add `style="width: 95vw; max-height: 80dvh; overflow-y: auto"` on both Dialog components. The `80dvh` cap using the dynamic viewport height unit accounts for the keyboard-reduced visible area.
2. Add `pt` (passthrough) overrides on the Dialog's `content` slot to ensure `overflow-y: auto` is set on the content wrapper, making form fields scrollable within the dialog when the keyboard is open.
3. Add the following to the viewport meta tag (already in `index.html` for most Vite projects): `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`. The `interactive-widget=resizes-content` attribute tells iOS Safari to resize the layout viewport when the keyboard opens — this makes `dvh` reflect the keyboard-reduced space, and the dialog re-centers correctly.
   > WARNING: `interactive-widget=resizes-content` changes layout behaviour globally. Test that the full-screen scan overlay (which uses `position: fixed; inset: 0`) still covers the full screen when the keyboard is NOT open.
4. As a simpler fallback for the submit button: ensure the Submit button is at the `footer` slot of the Dialog (not inside the `default` slot content area). PrimeVue's Dialog footer is rendered outside the scrollable content panel, so it remains accessible above the keyboard.

**Phase:** Mobile layout phase. Must be tested on a real iOS device with the keyboard open — simulator keyboard does not resize the viewport.

---

### DLG-2: PrimeVue Drawer (group detail panel) behaves unexpectedly with keyboard open on small screens

**Severity:** MEDIUM

**Mechanism:**
The vaccination group detail Drawer (`VaccinationGroupPanel`) is a bottom-sheet (`position="bottom"`). On iOS, when an interactive element inside the Drawer receives focus, the keyboard opens. PrimeVue Drawer does not implement scroll-locking within its content — the entire page behind the drawer can scroll when the user tries to scroll within the drawer's content area, especially on iPhone SE-class screens (375px width).

**Prevention:**
1. Add `pt:root="{ style: 'max-height: 70dvh; overflow-y: auto;' }"` to the `<Drawer>` component to cap its height to 70% of the dynamic viewport height. This ensures the Drawer fits within the visible area even with the keyboard open.
2. Prevent background scroll while the Drawer is open: `document.body.style.overflow = 'hidden'` in the Drawer's `show` event, restored in the `hide` event. This is a workaround for PrimeVue's lack of built-in scroll-lock for Drawer.
3. Remove any form fields from within Drawers (keep them in Dialogs). Drawers should remain read-only detail views. ManageVaccination and ManageMembership are already Dialog-based — enforce this boundary in the architecture.

**Phase:** Mobile layout phase.

---

## Section 5: Tailwind v4 + PrimeVue 4 Responsive Conflicts

### CSS-1: PrimeVue dark mode generates `@media (prefers-color-scheme: dark)` instead of the `.my-app-dark` class selector

**Severity:** HIGH

**Mechanism:**
Lexarium uses `darkModeSelector: '.my-app-dark'` in the PrimeVue preset config (`src/main.ts`). However, PrimeVue 4.x has a confirmed bug (GitHub issue #7465) where the generated theme CSS uses `@media (prefers-color-scheme: dark)` instead of the custom dark class selector. The result: toggling dark mode via the `my-app-dark` class on the HTML element does not change PrimeVue component backgrounds (Card, Dialog, Drawer, etc.). Only the system-level dark mode preference applies.

This bug exists independently of the PWA milestone but will be exposed more sharply on mobile where system dark mode is commonly enabled and toggling between modes is a normal user action.

**Prevention:**
1. Verify the issue is present by inspecting the generated CSS for `:root` variable assignments: look for `@media (prefers-color-scheme: dark)` wrapping PrimeVue design tokens. If present, apply the workaround.
2. Workaround: in the PrimeVue `definePreset` call in `src/main.ts`, explicitly declare the dark mode CSS under the custom selector:
   ```typescript
   definePreset(Aura, {
     semantic: {
       colorScheme: {
         dark: {
           // Override dark-mode tokens here to force the .my-app-dark selector
         },
       },
     },
   })
   ```
   Check the PrimeVue Aura preset source for which tokens need overriding.
3. Alternative: switch `darkModeSelector` to `'system'` and use the OS preference as the truth source (no toggle button). This sidesteps the bug but removes user control. Acceptable if Wallecx does not ship a manual dark toggle.
4. Do NOT attempt to manually edit the generated PrimeVue CSS — it is dynamically generated at runtime from the preset and cannot be patched in a build step.

**Phase:** Mobile layout phase. The dark mode conflict must be resolved before the PWA ships to avoid users seeing mixed light/dark component states.

---

### CSS-2: Tailwind v4 utility classes cannot override PrimeVue component styles without CSS layer configuration

**Severity:** MEDIUM

**Mechanism:**
Tailwind v4 generates utilities in a `utilities` CSS layer. PrimeVue 4 (styled mode) injects its component styles into the document without a declared layer, which in CSS cascade order places them after any `@layer` declarations. This means PrimeVue styles have higher specificity than Tailwind utilities — a `class="!text-white"` important modifier may still lose to a PrimeVue inline `:style` binding.

In practice on this project: attempts to add responsive Tailwind classes to PrimeVue `Dialog`, `Card`, or `Button` components may silently have no effect, causing confusion during mobile layout work.

**Prevention:**
1. Add PrimeVue to the Tailwind CSS layer order in the main CSS file (`src/assets/main.css` or wherever Tailwind is configured):
   ```css
   @layer theme, base, primevue, components, utilities;
   ```
   This places the `primevue` layer before `utilities`, allowing Tailwind utilities to win.
2. Alternatively, use Tailwind's `!important` modifier (prefix `!`) sparingly on properties that must override PrimeVue: e.g., `class="!w-full !max-w-none"` on Dialog content.
3. Prefer PrimeVue's `pt` (passthrough) prop for component-internal style overrides rather than CSS specificity battles. PrimeVue's passthrough bypasses the styled-mode CSS entirely.
4. Verify the `@tailwindcss/vite` plugin version supports the `@layer` ordering declaration — Tailwind v4 moved from `tailwind.config.js` to pure CSS configuration.

**Phase:** Mobile layout phase. Establish the layer order before any responsive layout work begins — retrofitting is painful.

---

## Section 6: vite-plugin-pwa + Vite 8 Rolldown

### VITE-1: vite-plugin-pwa compatibility with Vite 8 rolldown — verified compatible but code-splitting config may conflict

**Severity:** MEDIUM

**Mechanism:**
The codebase already uses `vite: ^8.0.0` with rolldown via `rolldownOptions.output.codeSplitting.groups` in `vite.config.ts`. This is a rolldown-specific API with no Rollup fallback.

vite-plugin-pwa has updated its peer dependency to include Vite 8, and the plugin hooks are reported to work with rolldown. However, the `rolldownOptions.output.codeSplitting.groups` configuration (the `leaflet`, `primevue`, `vendor` split groups in `vite.config.ts`) interacts with the service worker precache manifest: each output chunk gets a filename, and vite-plugin-pwa must include all chunk filenames in `self.__WB_MANIFEST`. If rolldown generates unexpected chunk names (e.g., changes the hash or split boundaries), the precache manifest may miss chunks, leaving them network-only and breaking offline use.

**Prevention:**
1. After installing vite-plugin-pwa, run `npm run build` and inspect the `dist/sw.js` generated file. Search for `self.__WB_MANIFEST` and verify it lists all JS chunk files including the rolldown-split `leaflet`, `primevue`, and `vendor` chunks.
2. Set `globPatterns` to be explicit: `['**/*.{js,css,html,ico,png,svg,webp,woff2}']` to catch all chunk types.
3. If a chunk is missing from the precache manifest, add it to `workbox.additionalManifestEntries` manually: `[{ url: '/assets/leaflet-[hash].js', revision: null }]`. Using `revision: null` tells Workbox to treat the URL as immutable (hash-versioned).
4. Pin `vite-plugin-pwa` to an exact version on first install (e.g., `0.21.0`) rather than using `^` range — the plugin is under active development and minor versions occasionally change manifest generation behaviour.

**Phase:** PWA foundation phase. Run the manifest inspection step as part of the definition-of-done for service worker setup.

---

## Section 7: Maskable Icons

### ICON-1: Missing maskable icons cause clipped or white-backgrounded app icons on Android

**Severity:** MEDIUM

**Mechanism:**
Android (10+) uses adaptive icons, which apply a circular or squircle mask to app icons. If the PWA web manifest provides only `purpose: "any"` icons (standard icons), Android places the icon in the center of a white circle, clipping any content near the edges and looking visually inconsistent with native apps. The Lexarium navy icon on a white Android circle would look amateurish and mismatched.

On iOS, the manifest `icons` array is ignored entirely — iOS uses the `apple-touch-icon` meta tag or a manually added screenshot for home screen icons.

**Prevention:**
1. Generate two icon sets for the manifest:
   - `purpose: "any"` — standard icon, used as fallback and for desktop.
   - `purpose: "maskable"` — the same icon with 10% padding around the edges (the "safe zone" is the central 80% of the canvas). The outer 10% edge may be cropped on some platforms.
2. Use [Maskable.app Editor](https://maskable.app/editor) to verify safe zone compliance before adding icons to the manifest.
3. Add iOS-specific touch icons in `index.html`:
   ```html
   <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
   ```
   This is the only icon iOS uses for the home screen — manifest icons are ignored on iOS.
4. Minimum icon sizes for the manifest: 192x192 and 512x512 (required by Chrome install criteria). Include both sizes in both `any` and `maskable` variants.
5. vite-plugin-pwa's `manifest.icons` array handles this:
   ```typescript
   icons: [
     { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
     { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
     { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
     { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
   ]
   ```

**Phase:** PWA foundation phase (manifest and icon setup). All four icons must exist in `public/icons/` before deployment.

---

## Phase Assignment Summary

| Pitfall | Code | Severity | Phase |
|---------|------|----------|-------|
| PocketBase token evicted by iOS 7-day storage cap | IOS-1 | CRITICAL | PWA Foundation — `navigator.storage.persist()` + auth check on mount |
| Safari "Clear History" wipes PWA localStorage | IOS-2 | HIGH | PWA Foundation — graceful auth-invalid redirect |
| Service worker scope change can trigger storage eviction | IOS-3 | HIGH | PWA Foundation — scope config + token refresh on startup |
| Users stuck on stale version indefinitely (prompt vs autoUpdate) | SW-1 | CRITICAL | PWA Foundation — `registerType: 'prompt'` + update toast |
| Old and new JS chunks mixed after Vercel redeploy | SW-2 | HIGH | PWA Foundation — `vercel.json` cache headers |
| `/projects/wallecx` offline shows white screen (no navigateFallback) | ROUTER-1 | CRITICAL | PWA Foundation — workbox `navigateFallback: 'index.html'` |
| Offline PocketBase fetch shows blank list, not offline message | ROUTER-2 | HIGH | PWA Foundation — `navigator.onLine` detection + Message component |
| Dialog pushed off-screen by iOS soft keyboard | DLG-1 | HIGH | Mobile Layout — `max-height: 80dvh` + `interactive-widget` viewport |
| Drawer scroll-lock missing on small screens | DLG-2 | MEDIUM | Mobile Layout — `overflow: hidden` body lock |
| PrimeVue dark mode ignores `.my-app-dark` class selector | CSS-1 | HIGH | Mobile Layout — PrimeVue preset dark mode fix |
| Tailwind utilities cannot override PrimeVue styles | CSS-2 | MEDIUM | Mobile Layout — CSS `@layer` order declaration |
| vite-plugin-pwa + rolldown code-splitting chunks missing from precache | VITE-1 | MEDIUM | PWA Foundation — manifest inspection after first build |
| No maskable icons → clipped/white-backgrounded Android icon | ICON-1 | MEDIUM | PWA Foundation — icon set generation |

---

## Sources

**HIGH confidence — official documentation:**
- [WebKit Blog — Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) — authoritative iOS storage eviction rules
- [MDN — Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — quota and eviction mechanism reference
- [vite-plugin-pwa docs — Auto Update](https://vite-pwa-org.netlify.app/guide/auto-update) — autoUpdate vs prompt strategy, data loss warning
- [vite-plugin-pwa docs — Prompt for Update](https://vite-pwa-org.netlify.app/guide/prompt-for-update) — `useRegisterSW` API
- [Vite 8 announcement — rolldown compatibility](https://vite.dev/blog/announcing-vite8) — plugin compatibility confirmed
- [web.dev — Maskable icons](https://web.dev/articles/maskable-icon) — safe zone and platform requirements
- [MDN — StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) — persist() API

**HIGH confidence — GitHub issue tracker (official project):**
- [PrimeVue issue #7465](https://github.com/primefaces/primevue/issues/7465) — dark mode selector bug with `.app-dark` + Tailwind 4.x
- [PrimeVue issue #1855](https://github.com/primefaces/primevue/issues/1855) — Dialog/OverlayPanel mobile adaptation issues
- [PrimeVue issue #3972](https://github.com/primefaces/primevue/issues/3972) — Dialog fullscreen/mobile parameter request
- [PocketBase discussion #3478](https://github.com/pocketbase/pocketbase/discussions/3478) — AuthStore Safari localStorage issue

**MEDIUM confidence — community and verified secondary sources:**
- [MagicBell — PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — 7-day eviction, 50MB cap, standalone storage, EU DMA impact
- [Solita — Apple PWA EU reversal](https://www.solita.fi/blogs/apple-ends-support-for-pwas-in-eu-and-reversed-its-decision/) — EU standalone mode removal and reinstatement timeline
- [Vercel Community — 404 on SPA subpaths](https://community.vercel.com/t/404-on-refresh-direct-access-for-spa-subpaths-vercel-deployment/12593) — Vercel SPA routing and service worker interaction
- [DeepWiki — PocketBase JS SDK token management](https://deepwiki.com/pocketbase/js-sdk/4.4-token-management-and-auto-refresh) — `isValid`, `authRefresh`, `autoRefreshThreshold`
- [Gearbox Solutions — PrimeVue with Tailwind 4.0](https://gearboxgo.com/articles/web-application-development/primevue-with-tailwind-40/) — CSS layer configuration for Tailwind 4 + PrimeVue 4
- [Francisco Moretti — Fix mobile keyboard overlap with dvh](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport) — `dvh` and `interactive-widget` solution

---

*Pitfalls research for: Wallecx v3.0 PWA + Mobile-First milestone*
*Researched: 2026-05-14*
*Confidence: HIGH for iOS storage and vite-plugin-pwa, MEDIUM for Vercel SW interactions and CSS conflicts*
