# Requirements: Wallecx v2.1 Mobile PWA

**Defined:** 2026-05-14
**Core Value:** Wallecx feels like a native wallet app on a phone home screen — installable, fast, and usable on any mobile browser without horizontal scrolling or cramped tap targets.

## v2.1 Requirements

Phase numbering continues from v2.0 (last phase was 13 → v2.1 starts at Phase 14).

### PWA Foundation

Prerequisites for installability: manifest, icons, service worker, Vercel headers, auth resilience, and update prompt.

- [ ] **PWA-01**: Web App Manifest served with correct MIME type — `name: "Wallecx"`, `short_name: "Wallecx"`, `display: "standalone"`, `theme_color: "#002244"`, `background_color: "#002244"`, `start_url: "/projects/wallecx"`, `scope: "/projects/wallecx"`
- [ ] **PWA-02**: PWA icons committed to `public/`: `pwa-192x192.png` (purpose: "any"), `pwa-512x512.png` (purpose: "maskable" — safe zone verified), `apple-touch-icon.png` 180×180; all generated via `@vite-pwa/assets-generator`
- [ ] **PWA-03**: Service worker registered via `vite-plugin-pwa` with `registerType: 'prompt'`, `navigateFallback: '/index.html'` (required for Vue Router HTML5 history offline), all PocketBase API calls `NetworkOnly` (no stale auth or record data served from cache)
- [ ] **PWA-04**: `vercel.json` sets `Cache-Control: no-cache` for `sw.js` and `*.webmanifest`; includes catch-all SPA rewrite rule so deep-link navigation works on Vercel without a 404
- [ ] **PWA-05**: `navigator.storage.persist()` called on Wallecx app mount; `pb.authStore.isValid` checked on every WallecxApp.vue `onMounted` — an expired or evicted session redirects to `/login?redirect=/projects/wallecx` with a `vue-sonner` info toast explaining the session expired (guards against iOS 7-day localStorage eviction of PocketBase auth token)
- [ ] **PWA-06**: When a new service worker is waiting, a non-blocking `vue-sonner` toast appears with a "Refresh" action button; tapping it calls `updateServiceWorker()` and reloads — `registerType` is never `'autoUpdate'` (both CRUD forms have unsaved state that a forced reload would destroy)
- [ ] **PWA-07**: Lighthouse PWA installability audit score passes all criteria in the production Vercel build: manifest valid, service worker registered, HTTPS, icons present, start_url responds

### Mobile Layouts

Responsive layouts, touch targets, and platform-native feel across all Wallecx screens.

- [ ] **MOB-01**: All Wallecx screens (tabs shell, both card grids, both CRUD dialogs, group detail Drawer, scan overlay, empty states) are fully usable on a 375px-wide viewport without horizontal scroll or content clipping
- [ ] **MOB-02**: All interactive elements — membership cards, vaccination group cards, toolbar buttons (search clear, sort, view toggle), drawer rows (View/Edit/Delete), dialog action buttons — have a minimum touch target of 44×44px
- [ ] **MOB-03**: Membership card grid (`MembershipsTab.vue`) uses a single-column layout on viewports < 640px and a 2-column grid on ≥ 640px (same breakpoint as the existing vaccination view toggle grid classes)
- [ ] **MOB-04**: Vaccination group card grid (`VaccinationsTab.vue`) uses the same single→2-column responsive behaviour as MOB-03; the existing view toggle (sessionStorage) continues to work — mobile default is single-column regardless of toggle state when viewport < 640px
- [ ] **MOB-05**: CRUD dialogs (`ManageVaccination.vue`, `ManageMembership.vue`) render with `max-height: 80dvh` and `overflow-y: auto` so the full form scrolls within the dialog without being pushed off-screen by the iOS soft keyboard; `interactive-widget=resizes-content` added to the `<meta name="viewport">` tag in `index.html`
- [ ] **MOB-06**: `viewport-fit=cover` added to `<meta name="viewport">`; WallecxApp.vue shell applies `env(safe-area-inset-top/bottom/left/right)` padding so content is not obscured by device notches or home indicator bars
- [ ] **MOB-07**: `overscroll-behavior: none` applied to the Wallecx app shell container to prevent the iOS pull-to-refresh gesture from triggering while scrolling card grids or dialogs
- [ ] **MOB-08**: `PwaInstallBanner.vue` shown in mobile Safari when not already in standalone mode — displays a one-time "Add to Home Screen" instruction (Share → Add to Home Screen) with a dismiss button; dismissed state persisted in `localStorage`; not shown in standalone mode, not shown on non-iOS browsers (Android uses the native `beforeinstallprompt` event instead, surfaced via the `vue-sonner` update toast flow)

---

## Deferred to v3.x

### UX Enhancements

- **UX-ADV-01**: Bottom sheet refactor for MembershipDetail and VaccinationDetail — native-feeling slide-up panel with drag handle and swipe-down dismiss (major component refactor, deferred after v2.1 validates mobile usage)
- **UX-ADV-02**: Dark mode selector fix — PrimeVue bug #7465 causes `@media (prefers-color-scheme: dark)` to override `.my-app-dark` class; workaround via `definePreset` token overrides

### Notifications

- **NOTIF-01**: Push notification for expiring membership cards (requires server-side subscription storage and trigger — deferred; iOS 16.4+ PWA prerequisite satisfied after v2.1 ships)

### Advanced PWA

- **PWA-ADV-01**: Offline data access for membership and vaccination records (blocked by PocketBase — no offline SDK; would require IndexedDB replica layer)
- **PWA-ADV-02**: Background Sync for queued CRUD operations (unsupported on iOS Safari entirely)
- **PWA-ADV-03**: Swipe-to-dismiss gestures on cards and drawers

### Barcode (from v2.0 backlog)

- **SCAN-ADV-01**: PDF417 and Aztec code formats via dynamic `bwip-js` import

### Organisation (from v2.0 backlog)

- **ORG-01**: Search/filter membership cards by name or issuer
- **ORG-02**: Sort membership cards by name, issuer, or expiry date
- **CONV-01**: JSON export of all membership card records

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Offline data access for PocketBase records | PocketBase has no offline SDK; IndexedDB replica would require a full data-sync layer — out of scope for a personal SPA |
| Push notifications | Requires server-side subscription storage and trigger infrastructure; deferred to v3.x after installability ships |
| Swipe gestures (swipe-to-delete, swipe-to-open) | High implementation cost for v2.1; usability improves but is not a blocker for mobile usability |
| Bottom sheet dialog refactor | Major component change; current PrimeVue Dialog with dvh sizing is acceptable for v2.1 |
| Dark mode fix (PrimeVue #7465) | Existing Lexarium dark mode limitation; out of Wallecx v2.1 scope |
| Android install prompt UI | The `beforeinstallprompt` flow is browser-native on Android; no custom UI needed beyond PWA-06 update toast |
| Apple Wallet / Google Wallet export | Requires server-side certificate signing |
| Camera barcode scanning | ZXing build cost exceeds benefit for v2.1 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PWA-01 | Phase 14 | Pending |
| PWA-02 | Phase 14 | Pending |
| PWA-03 | Phase 14 | Pending |
| PWA-04 | Phase 14 | Pending |
| PWA-05 | Phase 14 | Pending |
| PWA-06 | Phase 14 | Pending |
| PWA-07 | Phase 14 | Pending |
| MOB-01 | Phase 15 | Pending |
| MOB-02 | Phase 15 | Pending |
| MOB-03 | Phase 15 | Pending |
| MOB-04 | Phase 15 | Pending |
| MOB-05 | Phase 15 | Pending |
| MOB-06 | Phase 15 | Pending |
| MOB-07 | Phase 15 | Pending |
| MOB-08 | Phase 15 | Pending |

**Coverage:**
- v2.1 requirements: 15 total
- Mapped to phases: 15 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-05-14*
*Traceability updated: 2026-05-14 — phases assigned (14–15)*
