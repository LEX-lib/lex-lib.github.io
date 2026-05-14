# Architecture Patterns — PWA Integration (v3.0 milestone)

**Domain:** vite-plugin-pwa integration with existing Vite 8 + Vue Router 4 SPA (Wallecx/Lexarium)
**Researched:** 2026-05-14
**Confidence:** HIGH (official vite-plugin-pwa docs, Vite docs, Workbox docs, GitHub issue tracker)

---

## Question Scope

This document answers six integration questions for adding PWA capabilities to the existing Lexarium SPA:

1. SPA routing — service worker interaction with Vue Router HTML5 history mode and the 404.html fallback
2. PocketBase auth — which caching strategy for auth API calls
3. Manifest location and injection mechanism
4. Service worker registration: main.ts vs auto-registration
5. Standalone display mode + router guard interaction
6. Mobile viewport meta tags — current index.html adequacy

---

## Integration Points

### Plugin Version

Install `vite-plugin-pwa@^1.3.0`. Version 1.3.0 (released 2026-05-05) explicitly adds Vite 8 peer dependency support. The Rolldown bundler used by this project (via `rolldownOptions` in `vite.config.ts`) is API-compatible with Rollup plugins, and the vite-plugin-pwa maintainers confirmed hooks are optimised for rolldown-vite. No compatibility shims needed.

**Confidence:** HIGH — confirmed via GitHub issue #918 and release notes.

### Interaction with rolldownOptions.output.codeSplitting

The existing `vite.config.ts` uses `build.rolldownOptions.output.codeSplitting` with `groups` for `leaflet`, `primevue`, and `vendor`. The vite-plugin-pwa plugin operates at the build manifest injection level (it processes the final output), not at the chunking level. The two configurations do not conflict. The service worker's precache manifest will simply include the additional chunk files the codeSplitting groups produce.

---

## 1. SPA Routing — Service Worker and HTML5 History Mode

### The Problem

Vue Router uses `createWebHistory()` (HTML5 pushState mode). When a user navigates directly to `/projects/wallecx` or `/login` after installing the PWA, the request goes through the service worker before any server. If the service worker has no rule for that URL, it falls through to the network. If the network returns a 404 (because the host has no server-side routing), the user sees an error.

### The Vercel SPA Routing Layer

The project currently copies `dist/index.html` to `dist/404.html` in the build step. On Vercel this is the GitHub Pages compatibility shim — it is not needed for Vercel deployments, which use `vercel.json` rewrites. **Verify whether `vercel.json` already contains a catch-all rewrite** (`{ "source": "/(.*)", "destination": "/index.html" }`). If it does, Vercel handles navigation requests before the service worker on first load. After the SW is installed, the SW intercepts all subsequent navigations.

### navigateFallback — The Service Worker Solution

In the `workbox` block of the VitePWA plugin config, set:

```ts
workbox: {
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [
    /^\/api\//,            // exclude PocketBase API calls (none in this project, but defensive)
    /\.[a-z]{2,}$/i,       // exclude direct file requests (assets, images)
  ],
}
```

`navigateFallback: '/index.html'` instructs the service worker: "for any navigation request that isn't a precached asset, serve `/index.html`." This is exactly what Vue Router needs — the SPA bootstraps from `index.html`, Vue Router reads `window.location.pathname`, and routes to the correct component.

**Do not** rely on the `dist/404.html` file to handle navigation when a SW is active — the SW intercepts the navigation before it reaches the server.

### navigateFallbackDenylist

The denylist regex prevents the SW from serving `index.html` for requests that should genuinely fail or go to the network:
- Any future PocketBase API URL patterns
- File extension requests (`.svg`, `.png`, `.js`, `.css`) — these should be handled by the precache or return a real 404

### Relationship to dist/404.html

Keep the `dist/404.html` build step. It serves two purposes:
1. Handles navigation on **first visit** (before SW is installed) on Vercel if no `vercel.json` rewrite exists
2. Handles the GitHub Pages deploy target mentioned in `CLAUDE.md` (GitHub Pages has no catch-all rewrite, it serves `404.html` on unknown paths)

After SW installation, `navigateFallback` takes over and `404.html` is no longer exercised for navigation. The two mechanisms are complementary, not competing.

---

## 2. PocketBase Auth — Caching Strategy

### Recommendation: Network-Only for all PocketBase API calls

PocketBase auth calls (login, token refresh, auth-with-password) and all collection API calls must be **Network-Only** inside the service worker. Never cache them.

```ts
workbox: {
  runtimeCaching: [
    {
      // Match all PocketBase API traffic
      urlPattern: ({ url }) => url.hostname === 'your-pocketbase-host.pockethost.io',
      handler: 'NetworkOnly',
    },
  ],
}
```

Replace `your-pocketbase-host.pockethost.io` with the actual PocketBase hostname from `VITE_API_BASE_URL`.

### Justification

**Auth token security:** The PocketBase auth token is stored in `localStorage` via `pb.authStore` and accessed by `useAuthStore`. The service worker runs in a separate context and cannot access `localStorage`. If the SW cached an authenticated response, it could serve stale user data to a different authenticated user on the same device (e.g., after logout and re-login). Network-Only eliminates this risk entirely.

**Data freshness:** Vaccination records and membership cards are the product. Serving stale records offline would show the user data they have already deleted or updated — worse than showing an offline error.

**PocketBase token format:** PocketBase issues short-lived JWT tokens. The token expiry and refresh are managed by the `pb.authStore`. The service worker has no visibility into token validity, so it cannot conditionally serve cached responses.

**What about offline?** The `PROJECT.md` explicitly lists "Offline-first / PWA support" as out of scope for Wallecx (`Online-only, matching the rest of Lexarium`). The PWA milestone adds installability and mobile UX — not offline data access. Network-Only is therefore correct: if the user is offline, PocketBase calls fail at the network layer, and the Vue component shows its existing loading/error state.

### Static Asset Caching Strategy: Cache-First

The precache manifest (auto-generated by vite-plugin-pwa) handles all built JS/CSS/HTML chunks using **Cache-First with network fallback** by default. This is correct for versioned assets — the service worker serves the app shell instantly from cache, then Workbox checks for updates in the background.

The app icons, manifest, and `index.html` itself are also precached. Set `Cache-Control: no-store` or `public, max-age=0, must-revalidate` on `sw.js`, `index.html`, and `manifest.webmanifest` in `vercel.json` so the browser always fetches the latest SW registration script.

---

## 3. Manifest Location and Injection

### Where the manifest lives

The plugin generates `manifest.webmanifest` (or `manifest.json` — controlled by `manifestFilename` option, default is `manifest.webmanifest`) in the **build output directory** (`dist/`). You do not create it manually in `public/`.

Place icon assets in `public/` (e.g. `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`) and reference them in the plugin `manifest.icons` array. The plugin copies them to `dist/` at build time.

### How it gets injected into index.html

At build time the plugin injects into `dist/index.html`:
```html
<link rel="manifest" href="/manifest.webmanifest">
```

It also injects the service worker registration script (script tag in `<head>` or as an inline script, depending on `injectRegister` setting — see section 4).

**You do not manually edit `index.html`** to add the manifest link. The plugin handles it.

### Manifest configuration example (vite.config.ts)

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Lexarium — Wallecx',
    short_name: 'Wallecx',
    description: 'Personal records vault — vaccinations and membership cards',
    theme_color: '#002244',         // brand navy, must match theme-color meta in index.html
    background_color: '#002244',
    display: 'standalone',
    scope: '/',
    start_url: '/projects/wallecx', // open to the app directly on launch
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})
```

`start_url: '/projects/wallecx'` means installed PWA opens to the Wallecx vault directly rather than the Lexarium home page. This is the correct UX for a vault mini-app. The router guard will redirect to `/login` if the session has expired.

---

## 4. Service Worker Registration

### Recommended approach: injectRegister: 'auto' (default)

Do not touch `src/main.ts` for registration. Set `injectRegister: 'auto'` (the default) in the plugin config. The plugin generates a `/registerSW.js` file and injects a `<script>` tag for it into `index.html` at build time.

The registration script calls:
```js
window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
})
```

This fires after the Vue app mounts. Because the service worker registers on `load` (not `DOMContentLoaded`), the first paint is never blocked.

### Why not in main.ts

Registering in `main.ts` manually (via `navigator.serviceWorker.register('/sw.js')`) would work but loses three plugin features:
- Automatic update detection via `workbox-window`
- `virtual:pwa-register/vue` composable for showing an update toast
- `registerType: 'autoUpdate'` automatic reload on new SW activation

If the team wants an "update available" toast in a future phase, import `useRegisterSW` from `virtual:pwa-register/vue` in a top-level component (e.g., `App.vue`) — this automatically handles registration and exposes `needRefresh` and `offlineReady` refs. No changes to `main.ts` needed.

### registerType: 'autoUpdate' vs 'prompt'

For Wallecx, use `registerType: 'autoUpdate'`. The app has no long-running forms that would be disrupted by a silent reload (CRUD dialogs are short-lived). AutoUpdate means the new SW activates and the page reloads silently when the user next navigates, without a "reload to update" prompt. This matches the online-only, low-interruption UX goal.

---

## 5. Standalone PWA Mode + Router Guard

### How standalone interacts with the router

When the PWA is installed and launched from the home screen, the browser opens it in a standalone WebView. The URL is `start_url` from the manifest — in this project, `/projects/wallecx`. Vue Router's `beforeEach` guard runs as normal: it checks `useAuthStore().isLoggedIn` and redirects to `/login` if the session has expired.

**This works correctly** because:
- The service worker, router guard, and auth store are all same-origin JavaScript — there is no boundary between them in terms of execution
- `pb.authStore` checks the token in `localStorage`; if expired, `isLoggedIn` is `false`, and the guard redirects to `{ name: 'login', query: { redirect: '/projects/wallecx' } }`
- The `/login` route is not `requiresAuth`, so the guard allows it through
- After login, the `redirect` query param restores the user to Wallecx — the same flow as the browser version

**Standalone mode does not break the guard.** The guard runs in the same JS context as a normal browser tab.

### iOS standalone and auth redirect caution

One known iOS quirk: if the auth flow requires navigating to an **external domain** (e.g., OAuth provider), iOS Safari opens a new browser tab instead of staying in the standalone window, and the user must manually return to the PWA. This project uses PocketBase auth (same origin, not OAuth redirect), so this issue does not apply. The login page at `/login` is same-origin and renders within the standalone window without issue.

### Scope boundary

The manifest `scope: '/'` covers the entire origin. All routes (`/`, `/login`, `/projects/wallecx`, etc.) are within scope. If the user navigates to a URL outside the scope (e.g., the PocketBase admin panel on a different origin), iOS drops them to Safari. This is expected and correct.

### Back button in standalone

When the user navigates: Home → /projects/wallecx → (back), the browser's back history works within the standalone window on Android Chrome. On iOS Safari in standalone mode, the native back gesture works for history within the session but there is no visible back button in the UI chrome. The existing `CustomNavBar` provides in-app navigation, which is sufficient.

---

## 6. Mobile Viewport Meta Tags

### Current state: index.html line 6

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

This is **adequate for PWA installability** but **missing two required PWA manifest-linked tags**:

| Tag | Current | Required for PWA | Action |
|-----|---------|------------------|--------|
| `viewport` | `width=device-width, initial-scale=1.0` | `width=device-width,initial-scale=1` | Functionally equivalent — no change needed |
| `theme-color` | Missing | Must match manifest `theme_color` | Add `<meta name="theme-color" content="#002244">` |
| `apple-touch-icon` | Missing | Required for iOS Add to Home Screen | Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">` |
| `description` | Missing | Lighthouse PWA audit | Add `<meta name="description" content="...">` |

The `theme-color` meta tag must match `manifest.theme_color` exactly (the plugin warns if they differ). The icon file must exist in `public/` before building.

The `<link rel="icon" type="image/svg+xml" href="/branding_logo.svg" />` on line 5 serves as the browser tab favicon but is not used for the PWA home screen icon — separate PNG icons are required for that.

### Minimum additions to index.html

```html
<meta name="theme-color" content="#002244" />
<meta name="description" content="Wallecx — personal records vault for vaccinations and membership cards" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
```

The `<link rel="manifest" ...>` tag is injected automatically by the plugin at build time — do not add it manually.

---

## File Change Map

| File | Change Type | What Changes | Phase |
|------|-------------|--------------|-------|
| `package.json` | Add dep | `vite-plugin-pwa@^1.3.0` | 1 |
| `vite.config.ts` | Modify | Import and configure `VitePWA()` plugin in `plugins[]` array; add `workbox.navigateFallback`, `workbox.runtimeCaching` (NetworkOnly for PocketBase host), `manifest` object | 1 |
| `index.html` | Modify | Add `theme-color` meta, `apple-touch-icon` link, `description` meta; manifest link injected automatically at build time | 1 |
| `public/pwa-192x192.png` | New file | PWA icon — 192×192 PNG | 1 |
| `public/pwa-512x512.png` | New file | PWA icon — 512×512 PNG (also used as maskable) | 1 |
| `public/apple-touch-icon.png` | New file | iOS Add to Home Screen icon — 180×180 PNG | 1 |
| `vercel.json` | New or modify | Add `Cache-Control: no-store` header for `sw.js`, `index.html`, `manifest.webmanifest`; add catch-all rewrite to `index.html` if not already present; add `Content-Type: application/manifest+json` for `*.webmanifest` | 1 |
| `src/App.vue` | Optional modify | Import `useRegisterSW` from `virtual:pwa-register/vue` if an update-available toast is desired | 2 |
| `env.d.ts` | Optional modify | Add `/// <reference types="vite-plugin-pwa/vue" />` for TypeScript virtual module resolution | 1 |

**No changes to:**
- `src/main.ts` — registration is handled by the plugin's injected script
- `src/router/index.ts` — guard logic is unchanged; works correctly in standalone mode
- Any Wallecx component — PWA layer is below the component tree

---

## Caching Strategy Summary

| Request Type | Strategy | Rationale |
|--------------|----------|-----------|
| Built JS/CSS/HTML chunks (versioned) | CacheFirst (precache) | Static, content-hashed filenames; safe to cache indefinitely |
| `index.html`, `sw.js`, `manifest.webmanifest` | NetworkFirst / no-cache via headers | Must not be cached; SW updates depend on fresh registration |
| PocketBase API calls (auth + collections) | NetworkOnly | Auth security, data freshness; offline not a goal |
| PocketBase file/thumbnail URLs | NetworkOnly | Short-lived signed URLs; caching would produce broken image requests |
| Static public assets (SVG icon, PNG icons) | CacheFirst (precache) | Included in precache manifest automatically |
| Google Fonts or external CDN | Not applicable | No external fonts/CDN in current stack (Rubik loaded via CSS in `main.css`) |

---

## Build Order (Phase Dependencies)

The order below respects hard dependencies. Each step is independently verifiable.

### Step 1 — Icon Assets (prerequisite for everything)

Create the three PNG files and place them in `public/`:
- `pwa-192x192.png` — 192×192, any brand-consistent design
- `pwa-512x512.png` — 512×512 (used for both regular and maskable; for a proper maskable icon, content must be inside the "safe zone" — centred with 20% padding)
- `apple-touch-icon.png` — 180×180

**Why first:** The build fails if `VitePWA.manifest.icons[].src` references files that don't exist in `public/`.

### Step 2 — vite.config.ts Plugin Configuration

Install `vite-plugin-pwa`, add `VitePWA()` to `plugins[]`. Configure `manifest`, `workbox.navigateFallback`, and `workbox.runtimeCaching` (NetworkOnly for PocketBase host).

**Why second:** Must be present before a build can generate the SW and manifest.

### Step 3 — index.html Meta Tag Additions

Add `theme-color`, `description`, and `apple-touch-icon` link. These are independent of the plugin but must be in place for Lighthouse PWA audit to pass and for iOS home screen display to work correctly.

**Why third:** Can be done simultaneously with Step 2, but should be done before testing.

### Step 4 — vercel.json Headers

Add `Cache-Control` headers for SW, manifest, and index.html. Add the catch-all rewrite if not already present.

**Why fourth:** Without correct headers, Vercel may cache `sw.js` and prevent SW updates from propagating.

### Step 5 — Build and Smoke Test

Run `npm run build` and verify:
- `dist/manifest.webmanifest` exists and contains correct icon paths
- `dist/sw.js` exists
- `dist/index.html` contains the injected `<link rel="manifest">` and the `<script src="/registerSW.js">` (or inline script)
- `dist/registerSW.js` exists (if `injectRegister: 'auto'` used script mode)

### Step 6 — Lighthouse PWA Audit (optional but recommended)

Run Lighthouse in Chrome DevTools against the preview build (`npm run preview`). PWA audit checks: manifest validity, SW registration, HTTPS (reported as warning in preview mode), icons, viewport, theme-color.

### Step 7 — Update Toast (optional, Phase 2)

If an update-available notification is wanted, add `useRegisterSW` import to `App.vue` and build a toast component. This is independent of Step 1-6 and can be deferred.

---

## Architecture Diagram (post-PWA layer)

```
Browser / Installed PWA
        │
        ▼
Service Worker (sw.js — generated by workbox)
  ├── Precache: index.html, assets/*, *.js chunks, *.css, icons
  ├── navigateFallback: /index.html (for all non-file navigation requests)
  └── runtimeCaching: NetworkOnly for pb.example.com/*
        │
        ▼
Vue SPA (index.html bootstraps)
  ├── src/main.ts         (unchanged)
  ├── src/router/index.ts (unchanged — beforeEach guard works as-is in standalone)
  │     └── /projects/wallecx (requiresAuth: true)
  │           └── WallecxApp.vue → VaccinationsTab + MembershipsTab
  └── src/stores/auth.ts  (unchanged — pb.authStore in localStorage, readable in SW context)
        │
        ▼
PocketBase (remote host)
  ├── auth API   → NetworkOnly (never cached)
  └── collections → NetworkOnly (never cached)
```

---

## Anti-Patterns to Avoid

### Do not cache PocketBase API responses

Caching auth or collection responses creates stale-data risk and potential data leakage after logout. Use `NetworkOnly` for the entire PocketBase host.

### Do not use StaleWhileRevalidate for PocketBase

`StaleWhileRevalidate` serves cached data while fetching fresh data in the background. For a personal records vault, showing stale vaccination or membership records while the fresh data loads is confusing and potentially harmful (showing deleted records). Stick with `NetworkOnly`.

### Do not register the SW manually in main.ts alongside plugin auto-registration

Using both `injectRegister: 'auto'` and a manual `navigator.serviceWorker.register()` call in `main.ts` causes double registration. The plugin's virtual module composable (`useRegisterSW`) handles everything needed. Do not add manual registration.

### Do not set start_url to '/' unless the intent is to land on the Lexarium home page

The manifest's `start_url` determines where the installed PWA opens. Setting `/` opens the portfolio hub. Setting `/projects/wallecx` opens the vault directly — the correct UX for Wallecx as a dedicated installable app. The router guard handles auth redirection from this URL if the session has expired.

### Do not remove dist/404.html from the build

The `dist/404.html` file handles navigation before the SW is installed (first load on GitHub Pages or Vercel without a catch-all rewrite). Remove it and first-time visitors who bookmark a deep route get a real 404.

---

## Open Questions / Flags for Phase Execution

| Topic | Question | Recommendation |
|-------|----------|----------------|
| Vercel catch-all rewrite | Does `vercel.json` already exist with a rewrite rule? | Check before Phase execution; add if missing |
| PocketBase host URL | What is the exact hostname in `VITE_API_BASE_URL`? | Read from `.env.production` and use as the `urlPattern` hostname in `runtimeCaching` |
| Maskable icon safe zone | Is the 512×512 PNG maskable-compliant? | Content must be in central 60% of canvas; use Maskable.app to verify |
| `env.d.ts` virtual module types | Does `vite-plugin-pwa/vue` need to be added to `tsconfig.json`? | Yes — add `"types": ["vite-plugin-pwa/vue"]` or `/// <reference types="vite-plugin-pwa/vue" />` in `env.d.ts` if using the composable |
| Rubik font loading | Is Rubik loaded from Google Fonts (external) or bundled? | Inspect `src/assets/main.css`; if Google Fonts, add a separate `runtimeCaching` CacheFirst rule for `fonts.googleapis.com` and `fonts.gstatic.com` |

---

## Sources

- [vite-plugin-pwa official docs — Guide](https://vite-pwa-org.netlify.app/guide/) — HIGH confidence
- [vite-plugin-pwa — PWA Minimal Requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements) — HIGH confidence
- [vite-plugin-pwa — Register Service Worker](https://vite-pwa-org.netlify.app/guide/register-service-worker) — HIGH confidence
- [vite-plugin-pwa — generateSW Workbox options](https://vite-pwa-org.netlify.app/workbox/generate-sw) — HIGH confidence
- [vite-plugin-pwa — Vue framework guide](https://vite-pwa-org.netlify.app/frameworks/vue) — HIGH confidence
- [vite-plugin-pwa — Vercel deployment](https://vite-pwa-org.netlify.app/deployment/vercel) — HIGH confidence
- [GitHub: vite-plugin-pwa Vite 8 support issue #918](https://github.com/vite-pwa/vite-plugin-pwa/issues/918) — HIGH confidence
- [vite-plugin-pwa v1.3.0 release notes](https://github.com/vite-pwa/vite-plugin-pwa/releases) — HIGH confidence
- [vite-plugin-pwa vue-router example vite.config.ts](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/examples/vue-router/vite.config.ts) — HIGH confidence
- Direct inspection: `vite.config.ts`, `index.html`, `src/main.ts`, `src/router/index.ts` — HIGH confidence
- [Vue Router HTML5 history mode docs](https://router.vuejs.org/guide/essentials/history-mode.html) — HIGH confidence

---
*Architecture research for: Lexarium PWA integration — v3.0 PWA + mobile-responsive milestone*
*Researched: 2026-05-14*
