# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with hot-reload
npm run build        # Type-check + production build (copies dist/index.html → dist/404.html for GitHub Pages SPA routing)
npm run build-only   # Production build without type-check
npm run preview      # Preview production build locally
npm run type-check   # Vue TSC type checking
npm run test:unit    # Run Vitest unit tests (jsdom environment)
npm run lint         # Run oxlint + eslint with --fix in sequence
npm run format       # Prettier format on src/
npm run deploy       # Build + deploy to GitHub Pages via gh-pages
```

## Architecture

**Lexarium** is a Vue 3 SPA portfolio/projects hub deployed to GitHub Pages. It hosts multiple mini-applications as sub-routes under `/projects/`.

### Tech Stack

- **Vue 3** with Composition API (`<script setup lang="ts">`) throughout
- **Vue Router 4** — routes defined in `src/router/index.ts` with lazy-loaded dynamic imports
- **Pinia** — stores in `src/stores/`; `auth.ts` wraps PocketBase's auth store reactively
- **PrimeVue 4** — auto-imported via `unplugin-vue-components` with `PrimeVueResolver`; uses Aura theme (indigo) configured in `src/main.ts`
- **Tailwind CSS 4** — via `@tailwindcss/vite` plugin; utility-first styling with dark theme support (`my-app-dark` class)
- **PocketBase** — backend for auth and data; client initialized in `src/lib/pocketbase/index.ts`

### Routing & Auth Guard

Routes live in `src/router/index.ts`. Protected routes use `meta.requiresAuth: true`; the `beforeEach` guard checks `useAuthStore().isLoggedIn` and redirects to `/login` if unauthenticated. Currently only `/projects/lextrack` requires auth.

### Mini-Applications

Each sub-app lives under `src/components/projects/<app>/`:

| App | Route | Notes |
|-----|-------|-------|
| **LexTrack** | `/projects/lextrack` | Task/meeting/support tracker; uses PocketBase collections (`dsu_tasks`, `dsu_meetings`, `dsu_supports`) with entity mappers in `src/lib/pocketbase/` |
| **Larga** | `/projects/larga` | PUV transit helper; uses Leaflet + geocoder |
| **Gift Exchange (MonitoX)** | `/projects/gift-exchange/*` | Secret Santa app with join/draw/manage sub-routes |
| **API Playground** | `/projects/api-playground` | Postman-like API testing tool |

### Environment Variables

Defined in `env.d.ts` under `ImportMetaEnv`. Files loaded by Vite per mode: `.env`, `.env.development`, `.env.production`.

Key variables:
- `VITE_APP_NAME` — app title
- `VITE_API_BASE_URL` — backend base URL

### Key Conventions

- Path alias `@` maps to `src/`
- PocketBase record types in `src/types/` extend `RecordModel`
- Route name constants exported from `src/constants/routes/`
- Zod used for schema validation; `dayjs` for dates; `lodash-es` for utilities
- `vue-sonner` for toast notifications; `@vueuse/motion` for animations
