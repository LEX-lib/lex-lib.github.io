# External Integrations

**Analysis Date:** 2026-05-10

## APIs & External Services

**Backend (BaaS):**
- PocketBase — Primary backend for auth and data
  - SDK/Client: `pocketbase` ^0.26.2; singleton at `src/lib/pocketbase/index.ts` (`export const pb = new PocketBase(baseUrl)`)
  - Base URL: `import.meta.env.VITE_API_BASE_URL`
  - Used in: `src/stores/auth.ts`, `src/views/LexTrackView.vue`, `src/components/projects/api-playground/ApiPlaygroundApp.vue`, `src/components/projects/gift-exchange/GiftExchange.vue` (and Join/Draw/Manage variants)
  - Collections in use:
    - `users` — Authentication (`pb.collection("users").authWithPassword(...)`)
    - `dsu_tasks`, `dsu_meetings`, `dsu_supports` — LexTrack tracker entities; mappers at `src/lib/pocketbase/dsuTaskMapper.ts`, `dsuMeetingMapper.ts`, `dsuSupportMapper.ts`
    - `api_requests` — API Playground saved-request store (CRUD via `getFullList`, `create`, `update`, `delete`)
    - `gift_exchange_participants` — Secret Santa participants and assignments

**Maps & Geocoding (Larga — `src/components/projects/larga/LargaApp.vue`):**
- Google Maps tile server — Hybrid satellite tiles via `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}` (no API key; loaded directly by Leaflet)
- OpenStreetMap Nominatim — Forward geocoding via `leaflet-control-geocoder` (`L.Control.Geocoder.nominatim(...)`); attribution given to OpenStreetMap contributors
- Leaflet ^1.9.4 — Client-side map rendering (lazy-imported)

**HTTP Client (API Playground — `src/components/projects/api-playground/ApiPlaygroundApp.vue`):**
- `axios` ^1.13.6 — Generic HTTP client used to issue user-defined requests
- Default sample endpoint: `https://jsonplaceholder.typicode.com/posts/1`
- Constraint: only `http://` and `https://` protocols are accepted (validated in component)

**Telemetry:**
- Vercel Speed Insights — `@vercel/speed-insights/vue`; `<SpeedInsights />` mounted in `src/App.vue`

**Fonts:**
- Google Fonts — Allowed via CSP in `index.html` (`style-src ... https://fonts.googleapis.com`, `font-src ... https://fonts.gstatic.com`)

## Data Storage

**Databases:**
- PocketBase (remote) — Schemaful collections (see list above)
  - Connection: `VITE_API_BASE_URL`
  - Client: `pocketbase` SDK (`pb.collection(name).getFullList | create | update | delete`)
  - Realtime/subscriptions: not detected in current usage

**File Storage:**
- Not detected (no PocketBase file fields, S3/GCS clients, or upload endpoints found)

**Caching:**
- None

**Local/Browser State:**
- PocketBase auth store persists tokens via the SDK's default cookie/localStorage strategy
- Pinia stores in `src/stores/` hold reactive UI state

## Authentication & Identity

**Auth Provider:**
- PocketBase native auth — Implemented in `src/stores/auth.ts`
  - Login: `pb.collection("users").authWithPassword(email, password)`
  - Reactive sync: `pb.authStore.onChange(() => user.value = pb.authStore.record)`
  - Logout: `pb.authStore.clear()`
  - `isLoggedIn` computed from `!!user.value`
- Route guard: `src/router/index.ts` `beforeEach` redirects unauthenticated users to `/login` for routes with `meta.requiresAuth: true` (currently only `/projects/lextrack`)
- Dev convenience: `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` env vars (declared in `env.d.ts`) enable shortcut login during development

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, Rollbar, etc. detected)

**Performance:**
- Vercel Speed Insights — Browser-side Core Web Vitals via `@vercel/speed-insights/vue`

**Logs:**
- `console` only; no structured logging library

## CI/CD & Deployment

**Hosting:**
- **Vercel** — Active hosting. Connected to the GitHub repo; auto-deploys on push using the auto-detected Vite preset (no `vercel.json` in the repo). Builds with `npm run build`, serves `dist/`, and applies its default SPA rewrite for unknown paths.
- `@vercel/speed-insights` (`^1.3.1`) — Wired in `src/App.vue` (`<SpeedInsights />`); reports RUM to the Vercel project.
- Repo name `lex-lib.github.io` is a vestige of an earlier GitHub Pages setup.

**CI Pipeline:**
- No GitHub Actions / workflow files detected at project root. Vercel runs the build itself on each push to the connected branch.

## Environment Configuration

**Required env vars (declared in `env.d.ts`):**
- `VITE_APP_NAME` — Application title
- `VITE_API_BASE_URL` — PocketBase backend base URL (consumed in `src/lib/pocketbase/index.ts`)
- `VITE_FEATURE_FLAG_EXAMPLE` — Example feature flag (string or boolean)
- `VITE_LOGIN_EMAIL` — Dev-only login shortcut
- `VITE_LOGIN_PASSWORD` — Dev-only login shortcut

**Secrets location:**
- `.env`, `.env.development`, `.env.production` at project root — present and excluded by `.gitignore` (along with `.env.local`, `.env.test`, `.env.*.local`)
- TLS material (`*.pem`, `*.key`, `*.crt`, `*.cert`, `*.p12`, `*.pfx`) explicitly ignored by `.gitignore`

## Webhooks & Callbacks

**Incoming:**
- None (static SPA — no server-side webhook receivers)

**Outgoing:**
- None directly from the app code; the API Playground (`src/components/projects/api-playground/ApiPlaygroundApp.vue`) lets the end-user issue arbitrary HTTP calls but is not a programmatic webhook integration

## Security Notes

- Content Security Policy declared inline in `index.html`:
  - `default-src 'self'`
  - `script-src 'self'` (no inline scripts allowed)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `img-src 'self' data: https: blob:`
  - `connect-src *` (broad — required because API Playground calls user-supplied URLs and PocketBase URL is configurable)
  - `font-src 'self' data: https://fonts.gstatic.com`
  - `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`
- HTML sanitization available via `dompurify` ^3.3.3 for any user-supplied rich text rendered through `quill`

---

*Integration audit: 2026-05-10*
