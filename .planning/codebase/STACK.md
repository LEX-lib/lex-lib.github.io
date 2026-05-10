# Technology Stack

**Analysis Date:** 2026-05-10

## Languages

**Primary:**
- TypeScript ~5.8.0 — All `src/**/*.ts` and `<script setup lang="ts">` blocks in `.vue` SFCs
- Vue SFC (`.vue`) — Single File Components throughout `src/`, declared in `tsconfig.app.json` (`"include": ["env.d.ts", "src/**/*", "src/**/*.vue"]`)

**Secondary:**
- HTML — Single entry `index.html`
- CSS — Tailwind utility classes plus scoped SFC styles; legacy site styles in `site.css`

## Runtime

**Environment:**
- Node.js — Engines pinned in `package.json`: `^20.19.0 || >=22.12.0`
- Browser target: ES modules via Vite; DOM types via `@vue/tsconfig/tsconfig.dom.json`

**Package Manager:**
- npm (lockfile: `package-lock.json` present, ~376 KB)

## Frameworks

**Core:**
- Vue ^3.5.18 — Composition API with `<script setup lang="ts">` (`src/main.ts`)
- Vue Router ^4.5.1 — Web history mode with lazy-loaded routes (`src/router/index.ts`)
- Pinia ^3.0.3 — Store registered in `src/main.ts`; stores at `src/stores/auth.ts`, `src/stores/counter.ts`
- PrimeVue ^4.3.7 — UI library with Aura preset; custom navy/amber `MyPreset` defined in `src/main.ts` via `definePreset(Aura, ...)`; `darkModeSelector: ".my-app-dark"`
- `@primevue/forms` ^4.3.9 — Form integration for PrimeVue
- `@primeuix/themes` ^1.2.3 — Aura theme + `definePreset` utility

**Testing:**
- Vitest ^3.2.4 — Test runner (`vitest.config.ts`) configured with `environment: 'jsdom'`, excludes `e2e/**`
- `@vue/test-utils` ^2.4.6 — Vue component test helpers
- jsdom ^26.1.0 — DOM environment for unit tests
- `@vitest/eslint-plugin` ^1.3.4 — ESLint integration for tests under `src/**/__tests__/*`

**Build/Dev:**
- Vite ^8.0.0 — Build/dev server (`vite.config.ts`); uses Rolldown via `build.rolldownOptions` with manual code-splitting groups (`leaflet`, `primevue`, `vendor`)
- `@vitejs/plugin-vue` ^6.0.1 — Vue SFC plugin; configured with `isCustomElement: (tag) => tag === "iconify-icon"`
- `vite-plugin-vue-devtools` ^8.0.0 — Devtools (loaded only when `NODE_ENV !== 'production'`)
- `unplugin-vue-components` ^29.0.0 + `@primevue/auto-import-resolver` ^4.3.7 — Auto-imports PrimeVue components (registry generated to `components.d.ts`)
- `@tailwindcss/vite` ^4.1.12 — Tailwind v4 plugin
- `vue-tsc` ^3.0.4 — Vue type checking (`npm run type-check`)
- `gh-pages` ^6.3.0 — **Legacy.** Predates the Vercel migration; `npm run deploy` is no longer the active deployment path. Candidate for removal.

## Key Dependencies

**Critical (runtime):**
- `pocketbase` ^0.26.2 — Backend SDK; client at `src/lib/pocketbase/index.ts` (`new PocketBase(VITE_API_BASE_URL)`)
- `axios` ^1.13.6 — HTTP client; used by API Playground (`src/components/projects/api-playground/ApiPlaygroundApp.vue`)
- `leaflet` ^1.9.4 + `leaflet-control-geocoder` ^3.3.0 + `@types/leaflet` ^1.9.20 — Maps for Larga (`src/components/projects/larga/LargaApp.vue`); dynamically imported
- `vue-router` ^4.5.1 — Routing
- `pinia` ^3.0.3 — State management
- `primevue` ^4.3.7 + `primeicons` ^7.0.0 — UI components and icon font
- `tailwindcss` ^4.1.12 — Utility CSS
- `iconify-icon` ^3.0.0 — Web component for icon rendering (registered as a custom element in `vite.config.ts`)
- `@vueuse/motion` ^3.0.3 — `MotionPlugin` registered in `src/main.ts`
- `vue-sonner` ^2.0.8 — Toast notifications; `<Toaster />` mounted in `src/App.vue`; styles imported in `src/main.ts`
- `quill` ^2.0.3 — Rich text editor
- `dompurify` ^3.3.3 + `@types/dompurify` ^3.0.5 — HTML sanitization
- `dayjs` ^1.11.18 — Date handling
- `lodash-es` ^4.17.21 + `@types/lodash-es` ^4.17.12 — Utility functions
- `zod` ^4.1.5 — Schema validation

**Infrastructure:**
- `@vercel/speed-insights` ^1.3.1 — Vue integration mounted in `src/App.vue` via `<SpeedInsights />`

## Configuration

**Environment:**
- `.env`, `.env.development`, `.env.production` — present at project root (loaded by Vite per mode); listed in `.gitignore`
- Type definitions for env vars live in `env.d.ts` under `ImportMetaEnv`:
  - `VITE_APP_NAME`
  - `VITE_API_BASE_URL`
  - `VITE_FEATURE_FLAG_EXAMPLE`
  - `VITE_LOGIN_EMAIL`
  - `VITE_LOGIN_PASSWORD`

**Build:**
- `vite.config.ts` — Plugin chain (vue, vueDevTools, Components, tailwindcss); `@` alias to `./src`; rolldown code-splitting
- `vitest.config.ts` — Merges `vite.config.ts` and overrides `test.environment` to `jsdom`
- `tsconfig.json` — Project references to `tsconfig.node.json`, `tsconfig.app.json`, `tsconfig.vitest.json`
- `tsconfig.app.json` — Extends `@vue/tsconfig/tsconfig.dom.json`; path alias `@/*` → `./src/*`; excludes `__tests__`
- `tsconfig.node.json` — Extends `@tsconfig/node22/tsconfig.json`; covers `vite.config.*`, `vitest.config.*`, `eslint.config.*`
- `tsconfig.vitest.json` — Extends `tsconfig.app.json`; adds `node` and `jsdom` types
- `eslint.config.ts` — Flat config: `vueTsConfigs.recommended`, `pluginVue.configs["flat/essential"]`, `pluginVitest.configs.recommended`, `pluginOxlint.configs["flat/recommended"]`, plus prettier `skipFormatting`
- Linters: `oxlint` ~1.8.0 + `eslint` ^9.31.0 — run sequentially via `npm run lint` (`run-s lint:*`)
- `prettier` 3.6.2 + `@prettier/plugin-oxc` ^0.0.4 — `npm run format` targets `src/`
- `index.html` — Sets a strict Content Security Policy (`default-src 'self'`, `connect-src *`, allows Google Fonts)
- `components.d.ts` — Auto-generated PrimeVue component type registry (managed by `unplugin-vue-components`)

**Build pipeline:**
- `npm run build` runs `run-p type-check "build-only {@}"` then `cp dist/index.html dist/404.html`. The 404 copy is **legacy** GitHub Pages SPA fallback; Vercel doesn't need it (handled via its default rewrite). Safe to drop.
- `npm run deploy` builds and pushes via `gh-pages -d dist` — **legacy**, not the live path. Vercel auto-deploys on `git push` to the connected branch.

## Platform Requirements

**Development:**
- Node.js `^20.19.0 || >=22.12.0`
- npm (matching `package-lock.json`)
- A reachable PocketBase instance (URL via `VITE_API_BASE_URL`)

**Production:**
- Static hosting on **Vercel** via GitHub push integration. Vercel auto-detects Vite, builds with `npm run build`, and serves `dist/`. No `vercel.json` is checked in — using the auto-detected Vite preset. Repo name `lex-lib.github.io` is a vestige of the prior GitHub Pages setup; the live URL is the Vercel domain (and/or a configured custom domain on Vercel).
- `@vercel/speed-insights` reports Real-User Metrics to the Vercel project (`<SpeedInsights />` in `src/App.vue`).
- Backend hosted separately (PocketBase server reachable from the browser per `connect-src *` CSP)

---

*Stack analysis: 2026-05-10*
