# Architecture

**Analysis Date:** 2026-05-10

## Pattern Overview

**Overall:** Vue 3 SPA portfolio hub with feature-based mini-applications, deployed as a static site to Vercel (via GitHub integration, auto-detected Vite preset — no `vercel.json` checked in) with a PocketBase BaaS backend.

**Key Characteristics:**
- Single-Page Application using Vue 3 Composition API with `<script setup lang="ts">` throughout
- Multi-app pattern: each mini-app lives in `src/components/projects/<app>/` and is registered as a sub-route under `/projects/`
- Lazy-loaded route components via dynamic `import()` for code splitting (see `src/router/index.ts`)
- Backend-as-a-Service: PocketBase handles auth, collections, persistence; consumed via official `pocketbase` SDK
- Auto-import of PrimeVue components via `unplugin-vue-components` with `PrimeVueResolver` (no explicit imports needed in templates)
- Composition over inheritance: setup-style Pinia stores; SFCs compose via `defineModel`/`defineProps`/`defineEmits`
- Static deployment to Vercel via GitHub push integration: Vercel auto-runs `npm run build` and serves `dist/`, with built-in SPA fallback via its default rewrite.

## Layers

**Application Bootstrap (entry):**
- Purpose: Wire up Vue app, plugins, theme, and mount to the DOM
- Location: `src/main.ts`
- Contains: `createApp(App)`, Pinia, Vue Router, PrimeVue with custom Aura preset (navy `#002244` / amber `#E89820`), `MotionPlugin` from `@vueuse/motion`
- Depends on: `App.vue`, `router/index.ts`, plugin packages
- Used by: `index.html` via `<script type="module" src="/src/main.ts">`

**Routing Layer:**
- Purpose: URL-to-component mapping with auth guard
- Location: `src/router/index.ts`
- Contains: Web-history router, lazy route definitions, `beforeEach` guard checking `meta.requiresAuth` against `useAuthStore().isLoggedIn`
- Depends on: `@/stores/auth`, lazy view/component imports
- Used by: `App.vue` via `<RouterView />`

**View Layer:**
- Purpose: Top-level page components rendered by router
- Location: `src/views/`
- Contains: `HomeView.vue`, `ProjectsView.vue`, `LexTrackView.vue`, `BlogView.vue`, `AboutView.vue`
- Depends on: Section components in `src/components/`, mini-app components in `src/components/projects/<app>/`, stores, PocketBase client
- Used by: Router (lazy `import()`)
- Note: Inconsistent — some routes resolve to `views/*View.vue` (e.g. `lextrack`), others resolve directly to `components/projects/<app>/*App.vue` (e.g. `larga`, `api-playground`, `gift-exchange/*`)

**Shared Component Layer:**
- Purpose: Reusable shell UI used by views (navbar, hero, about, login, icons)
- Location: `src/components/`
- Contains: `CustomNavBar.vue`, `HeroSection.vue`, `AboutMeSection.vue`, `Login.vue`, scaffold remnants `HelloWorld.vue`/`TheWelcome.vue`/`WelcomeItem.vue`, `icons/`
- Depends on: Stores (auth), Vue Router, PrimeVue auto-imports
- Used by: Views, `App.vue`

**Mini-App (Feature) Layer:**
- Purpose: Self-contained sub-applications
- Location: `src/components/projects/<app>/`
- Contains:
  - `lextrack/` — `LexTrackApp.vue`, `ActivityCard.vue`, `AddMeeting.vue`, `ManageMeeting.vue`, `ManageTask.vue`, `ManageSupport.vue`
  - `larga/` — `LargaApp.vue`
  - `gift-exchange/` — `GiftExchange.vue`, `GiftExchangeJoin.vue`, `GiftExchangeDraw.vue`, `GiftExchangeManage.vue`
  - `api-playground/` — `ApiPlaygroundApp.vue`
- Depends on: `@/lib/pocketbase`, `@/stores/auth`, `@/types/lextrack/*`, `@/constants/routes` (Larga only), shared utilities (`lodash-es`, `dayjs`, `dompurify`, `axios`, `leaflet`, `zod`)
- Used by: Router (and `LexTrackView.vue` which embeds LexTrack child components directly rather than mounting `LexTrackApp.vue`)

**State Management Layer:**
- Purpose: Reactive cross-component state
- Location: `src/stores/`
- Contains:
  - `auth.ts` — wraps PocketBase `pb.authStore` reactively; exposes `user`, `isLoggedIn`, `login(email, password)`, `logout()`
  - `counter.ts` — Pinia scaffold store (unused/example)
- Depends on: `pinia`, `@/lib/pocketbase`
- Used by: Router guard, `Login.vue`, `CustomNavBar.vue`, gift-exchange and api-playground apps

**Backend Client Layer:**
- Purpose: PocketBase SDK initialization and entity-level write mappers
- Location: `src/lib/pocketbase/`
- Contains:
  - `index.ts` — single `PocketBase` instance from `import.meta.env.VITE_API_BASE_URL`, exported as `pb`
  - `dsuTaskMapper.ts`, `dsuMeetingMapper.ts`, `dsuSupportMapper.ts` — `mapToUpdate*` functions stripping immutable fields before write
- Depends on: `pocketbase` package, `@/types/lextrack/*`
- Used by: Auth store, `LexTrackView.vue`, mini-apps that hit collections

**Type Layer:**
- Purpose: TypeScript record models extending PocketBase's `RecordModel`
- Location: `src/types/`
- Contains: `lextrack/dsu_tasks/types.d.ts`, `lextrack/dsu_meetings/types.d.ts`, `lextrack/dsu_supports/types.d.ts`
- Pattern: Each module exports `interface X extends RecordModel` plus a paired `AddX = Omit<X, 'id' | 'created' | 'updated'>` create-payload type
- Used by: LexTrack components, mappers

**Constants Layer:**
- Purpose: Static reference data — currently only PUV route definitions for Larga
- Location: `src/constants/routes/`
- Contains: `route-3.ts`, `route-10.ts` (each exports `route` with `name`, `color`, `stops[]`); `index.ts` re-exports as `route3`, `route10`
- Used by: `src/components/projects/larga/LargaApp.vue`

## Data Flow

**Authentication Flow:**

1. User submits credentials in `src/components/Login.vue`; form validated via `zodResolver` from `@primevue/forms/resolvers/zod`
2. `useAuthStore().login(email, password)` calls `pb.collection('users').authWithPassword(...)` in `src/stores/auth.ts`
3. PocketBase persists the auth token in its own `authStore` (localStorage by default)
4. `pb.authStore.onChange(...)` callback in `src/stores/auth.ts` updates the reactive `user` ref, flipping `isLoggedIn`
5. `Login.vue` reads `route.query.redirect` (validated to start with `/` and not `//`) and calls `router.replace(target)`
6. On subsequent navigation, `router.beforeEach` in `src/router/index.ts` checks `meta.requiresAuth` and redirects to `/login?redirect=<from.fullPath>` if `!auth.isLoggedIn`

**LexTrack Data Flow (representative CRUD):**

1. User changes the `DatePicker` in `src/views/LexTrackView.vue`; the `watch(selectedDate, ...)` fires
2. Three parallel `pb.collection('dsu_*').getFullList(options)` calls via `Promise.all`, filtered by `date ~ "<YYYY-MM-DD>"` and sorted `-created`
3. Results populate `supports`, `tasks`, `meetings` refs, passed via `v-model:section` to three `ActivityCard` instances
4. Edit/remove emit `update`/`remove` events back up; create flows happen in dialogs (`ManageMeeting`, `ManageTask`, `ManageSupport`)
5. On Save, the view iterates each list: items with `id` go through the appropriate `mapToUpdate*()` mapper before `pb.collection(...).update(id, payload)`; items without `id` are stamped with the formatted `selectedDate` and sent to `pb.collection(...).create(item)`

**Routing Flow:**

1. Browser URL change → `vue-router` matches a route in `src/router/index.ts`
2. `beforeEach` guard runs auth check
3. The matched route's `component: () => import('...')` lazy-loads the chunk (split per Vite `rolldownOptions.codeSplitting` groups: `leaflet`, `primevue`, `vendor`)
4. Component renders inside `<RouterView />` in `src/App.vue`, beneath `<CustomNavBar />` and above `<Toaster />` from `vue-sonner`

**State Management:**

- Pinia setup-style stores using `defineStore('id', () => { ... })` returning refs/computeds/functions
- Auth state is the single source of cross-cutting reactive state; mini-apps generally hold local component state via `ref()`/`computed()`
- PocketBase's own `authStore` is the persistence layer; the Pinia `auth` store is a reactive bridge over it

## Key Abstractions

**`pb` (PocketBase singleton):**
- Purpose: Single configured client used everywhere for backend access
- Examples: `src/lib/pocketbase/index.ts` (definition), imported as `import { pb } from '@/lib/pocketbase'` in stores, views, and mini-apps
- Pattern: Module-level singleton, configured from `import.meta.env.VITE_API_BASE_URL`

**Entity Mappers (`mapToUpdate*`):**
- Purpose: Strip immutable/server-managed fields before sending to PocketBase update endpoints
- Examples: `src/lib/pocketbase/dsuTaskMapper.ts`, `dsuMeetingMapper.ts`, `dsuSupportMapper.ts`
- Pattern: Pure function `(entity: X) => Pick<X, writableFields>` returning a fresh object literal

**`RecordModel` Extension Types:**
- Purpose: Strongly-typed PocketBase records with a paired `Add*` create-payload type
- Examples: `src/types/lextrack/dsu_tasks/types.d.ts`
- Pattern:
  ```ts
  export interface DsuTasks extends RecordModel { id: string; ... }
  export type AddDsuTask = Omit<DsuTasks, 'id' | 'created' | 'updated'>;
  ```

**`useAuthStore` (reactive PocketBase auth bridge):**
- Purpose: Expose PocketBase auth as Pinia-reactive state
- Location: `src/stores/auth.ts`
- Pattern: Setup store + `pb.authStore.onChange(() => user.value = pb.authStore.record)`

**Auto-imported PrimeVue components:**
- Purpose: Use `<Button>`, `<Card>`, `<Dialog>`, `<DatePicker>`, `<InputText>`, `<Form>`, `<FloatLabel>`, `<Message>`, `<Password>`, `<Checkbox>`, `<Tag>` etc. without imports in templates
- Configured: `vite.config.ts` via `Components({ resolvers: [PrimeVueResolver()] })`
- Generated types: `components.d.ts` at project root

**Mini-app convention (`<App>App.vue`):**
- Purpose: Each project route resolves to a single root component owning the entire feature
- Examples: `LargaApp.vue`, `ApiPlaygroundApp.vue`, `LexTrackApp.vue`
- Pattern: `<script setup lang="ts">` SFC, local state via `ref`/`computed`, talks directly to `pb` and PocketBase collections

## Entry Points

**HTML Entry:**
- Location: `index.html`
- Triggers: Browser load
- Responsibilities: Mounts `<div id="app">`, loads `/src/main.ts` as ES module, declares CSP meta tag

**JS Entry:**
- Location: `src/main.ts`
- Triggers: Imported by `index.html`
- Responsibilities:
  - `createApp(App)` and mount to `#app`
  - Register Pinia, Vue Router, PrimeVue (custom `MyPreset` from Aura), `MotionPlugin`
  - Global styles: `./assets/main.css`, `primeicons/primeicons.css`, `vue-sonner/style.css`
  - Configure dark-mode selector `.my-app-dark` and PrimeVue passthrough for `Button` (`p-button-sm`)

**Root Component:**
- Location: `src/App.vue`
- Triggers: Mounted by `main.ts`
- Responsibilities: Renders `<CustomNavBar>`, `<RouterView>`, `<Toaster>` (vue-sonner), `<SpeedInsights>` (`@vercel/speed-insights/vue`)

**Router:**
- Location: `src/router/index.ts`
- Triggers: Imported by `main.ts`
- Responsibilities: Define routes, install `beforeEach` auth guard, lazy-load views/mini-apps

## Error Handling

**Strategy:** Per-call `try`/`catch` inside mini-app components and `Login.vue`. There is no global error handler, error boundary component, or central error reporter.

**Patterns:**
- Async PocketBase calls in mini-apps wrap in `try { ... } catch (e) { console.error(...); toast.error(...) }` (see `GiftExchange.vue`, `ApiPlaygroundApp.vue`)
- `Login.vue` `catch (error) { console.error('Login failed:', error) }` — no user-facing toast
- `LexTrackView.vue` does NOT wrap its `getFullList`/`create`/`update` calls — failures bubble as unhandled promise rejections
- Form validation errors surface through `@primevue/forms` + `zodResolver` and render inline via `<Message v-if="$form.email?.invalid">`

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` only. No structured logger. Several debug `console.log` calls remain commented in `src/views/LexTrackView.vue`.

**Validation:** `zod` schemas resolved through `@primevue/forms`' `zodResolver` in `src/components/Login.vue`. No shared schema directory; mini-apps define schemas inline as needed.

**Authentication:** Centralized in `useAuthStore` (`src/stores/auth.ts`) and the router guard in `src/router/index.ts`. Currently only `/projects/lextrack` is gated by `meta.requiresAuth: true`. Other routes that consume auth state (api-playground, gift-exchange admin) do so via `useAuthStore().isLoggedIn` inside the component.

**Notifications:** `vue-sonner` — `<Toaster />` mounted once in `src/App.vue`; `import { toast } from 'vue-sonner'` used ad-hoc for success/error feedback.

**Animations:** `@vueuse/motion` registered globally in `src/main.ts`; consumed via `v-motion` directive with `:initial`/`:visibleOnce` bindings (see `src/views/ProjectsView.vue`).

**Sanitization:** `dompurify` used in `ApiPlaygroundApp.vue` and `LexTrackApp.vue` to sanitize HTML before render.

**Theming:** Custom PrimeVue preset (`MyPreset`) defined inline in `src/main.ts` with navy/amber brand palette; dark mode toggled by adding `.my-app-dark` to a root element. Tailwind CSS 4 via `@tailwindcss/vite` provides utility classes; CSS custom properties like `--color-brand-primary`, `--color-typo-heading` referenced from `src/assets/main.css`.

**Date handling:** `dayjs` used everywhere a date is formatted or filtered (e.g. `dayjs(newDate).format('YYYY-MM-DD')` in `src/views/LexTrackView.vue`).

**Utility functions:** `lodash-es` (`remove`, `isEmpty`) imported as named tree-shakable exports.

**Build-time:**
- Path alias `@` → `src/` configured in both `vite.config.ts` and `tsconfig.app.json`
- Manual code-splitting groups in `vite.config.ts` separate `leaflet`, `primevue`/`@primeuix`, and core `vendor` (vue, pinia, vue-router) chunks
- Deployment: Vercel pulls from the GitHub repo on push, auto-detects Vite, runs `npm run build`, and serves `dist/` with native SPA rewrite

---

*Architecture analysis: 2026-05-10*
