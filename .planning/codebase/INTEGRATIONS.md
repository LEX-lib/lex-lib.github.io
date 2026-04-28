# External Integrations

**Analysis Date:** 2026-04-28

## APIs & External Services

**PocketBase Backend:**
- Service: PocketBase (self-hosted or cloud instance)
- Purpose: Primary backend API for LexTrack DSU tracker and user authentication
- SDK/Client: `pocketbase@0.26.2` (JavaScript SDK)
- Configuration: Base URL via `VITE_API_BASE_URL` environment variable
- Location: Initialized in `src/lib/pocketbase/index.ts`

**Vercel Web Analytics:**
- Service: Vercel Speed Insights
- Purpose: Performance monitoring and user analytics
- SDK/Client: `@vercel/speed-insights@1.3.1` (Vue integration)
- Implementation: `<SpeedInsights />` component in `src/App.vue`
- Auth: No auth required (tracked via deployment/domain)

## Data Storage

**Databases:**
- PocketBase (Remote)
  - Connection: REST API via `VITE_API_BASE_URL`
  - Client: `pocketbase` JavaScript SDK
  - Collections managed:
    - `users` - User authentication and profiles
    - `dsu_tasks` - LexTrack task entries (date, title, jira_link, description)
    - `dsu_meetings` - LexTrack meeting entries (date, title, duration_minutes, description)
    - `dsu_supports` - LexTrack support entries (date, title, description)

**File Storage:**
- Local filesystem only (no cloud storage integration)
- Assets served from `public/` folder (favicon.ico, branding_logo.svg)
- Build output: `dist/` folder deployed to GitHub Pages

**Caching:**
- Browser cache via HTTP headers
- Service Worker: Not implemented
- In-memory state: Pinia stores (auth, feature state)

## Authentication & Identity

**Auth Provider:**
- PocketBase built-in authentication
- Implementation: Email/password via `pb.collection('users').authWithPassword(email, password)`
- Flow:
  1. User enters credentials in `src/components/Login.vue`
  2. `useAuthStore().login(email, password)` calls PocketBase
  3. Auth state stored in `pb.authStore` and synced to Pinia
  4. Route guard in `src/router/index.ts` checks `meta.requiresAuth` against `useAuthStore().isLoggedIn`
  5. Logged-in user accessible via `useAuthStore().user` (RecordModel from PocketBase)

**Signup:**
- Disabled (commented out in `src/stores/auth.ts`)
- Current approach: PocketBase admin creates users directly

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Rollbar, or similar integration)
- Client-side errors logged to browser console only

**Logs:**
- Browser console via `console.log/warn/error`
- No centralized logging service
- Debug environment variables can be logged in development mode (commented example in `src/main.ts`)

## CI/CD & Deployment

**Hosting:**
- GitHub Pages (static hosting)
- Deploy command: `npm run deploy` (via `gh-pages@6.3.0`)
- Deployment workflow:
  1. Build via `npm run build` (type-check + Vite bundle + copy 404.html fallback)
  2. Push dist/ to gh-pages branch
  3. GitHub Pages serves from gh-pages branch root
- SPA routing: `/404.html` fallback enables all routes to resolve to index.html

**Custom Domain:**
- Supported via `public/CNAME` file (checked in source tree)
- GitHub Pages reads CNAME on deployment

**CI Pipeline:**
- No GitHub Actions workflows detected
- Manual deployment (run `npm run deploy` locally)

## Environment Configuration

**Required env vars:**
- `VITE_API_BASE_URL` - PocketBase backend URL (e.g., `https://pb.example.com`)
- `VITE_APP_NAME` - Application display name (default in `.env`)

**Optional env vars:**
- `VITE_FEATURE_FLAG_EXAMPLE` - Feature flag for conditional logic
- `VITE_LOGIN_EMAIL` - Demo/testing credential
- `VITE_LOGIN_PASSWORD` - Demo/testing credential

**Secrets location:**
- `.env.local` (gitignored) - Development secrets
- `.env.production.local` (gitignored) - Production secrets
- GitHub Pages: No secrets management (all client-side)
- PocketBase credentials: Stored in `pb.authStore` after login (in-memory, cleared on logout)

## External Map & Geocoding

**Larga Project (Map Feature):**
- Leaflet 1.9.4 - Interactive map rendering
- leaflet-control-geocoder 3.3.0 - Address lookup and reverse geocoding
- No tile server specified; assumes default OpenStreetMap provider
- Used in `src/components/projects/larga/LargaApp.vue`
- CSS: Leaflet stylesheets loaded from CDN and local dist

## Webhooks & Callbacks

**Incoming:**
- None detected (SPA only, no webhook receivers)

**Outgoing:**
- PocketBase API calls (create, read, update, delete operations)
- Vercel Speed Insights analytics (one-way data transmission)

## Third-Party Integrations

**Toast Notifications:**
- vue-sonner 2.0.8 - Toast/notification library
- Used in LexTrack forms (AddMeeting, ManageTask, ManageSupport, etc.)
- Styling: `vue-sonner/style.css` included in `src/main.ts`

**Rich Text Editing:**
- Quill 2.0.3 - Available (included in dependencies) but usage not yet detected in codebase
- Ready for content/description editing features

**Date/Time Handling:**
- dayjs 1.11.18 - Date formatting and parsing
- Used in `src/views/LexTrackView.vue` for date filtering and formatting
- Format used: `YYYY-MM-DD` (ISO string)

**Icon Library:**
- iconify-icon 3.0.0 - Custom `<iconify-icon>` web component
- Registered as custom element in `vite.config.ts`
- Can load icons from multiple sources (Iconify, FontAwesome, Material Icons, etc.)

**Validation:**
- Zod 4.1.5 - Schema validation library
- Integrated with PrimeVue forms via `@primevue/forms` and `zodResolver`
- Used in `src/components/Login.vue` for login form validation

---

*Integration audit: 2026-04-28*
