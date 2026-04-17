# AGENTS.md

Compact ramp-up guide for AI agents working in this repo. See `CLAUDE.md` for additional context.

## Commands

```bash
npm run dev          # dev server (hot-reload)
npm run build        # run-p type-check + build-only, then cp dist/index.html dist/404.html
npm run build-only   # vite build only, no type-check
npm run preview      # preview production build
npm run type-check   # vue-tsc --build
npm run test:unit    # vitest (watch by default; use `vitest run` for CI/single pass)
npm run lint         # run-s: oxlint first, then eslint (both --fix)
npm run format       # prettier --write src/
npm run deploy       # npm run build && gh-pages -d dist
```

## Non-obvious build facts

- `npm run build` runs `type-check` and `build-only` **in parallel** (`run-p`), then copies `dist/index.html → dist/404.html`. The 404 copy is required for GitHub Pages SPA routing — do not skip it.
- Vite is aliased to `rolldown-vite` in devDependencies (Rolldown-powered fork), not standard Vite.
- Manual chunks are defined: `leaflet`, `primevue`, `vendor` (Vue/Pinia/vue-router).

## Lint / format order

Run in this order before committing: `format` → `lint` → `type-check`.  
`lint` is sequential: oxlint (Rust, correctness rules) runs before eslint (Vue/TS/Vitest rules).  
ESLint uses flat config (`eslint.config.ts`), covers `**/*.{ts,mts,tsx,vue}`.

## Tests

- Environment: `jsdom`; config in `vitest.config.ts` (merges full `vite.config.ts`).
- Test files live in `src/**/__tests__/` (e.g. `src/components/__tests__/HelloWorld.spec.ts`).
- No setup files configured. No e2e suite.
- Single run (non-watch): `npx vitest run`

## Environment variables

All `.env*` files are **gitignored** — recreate locally. Required files:

| File               | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `.env`             | Shared placeholder (`VITE_APP_NAME`, `VITE_FEATURE_FLAG_EXAMPLE`) |
| `.env.development` | `VITE_API_BASE_URL=https://lexarium-backend.fly.dev`              |
| `.env.production`  | `VITE_API_BASE_URL=https://lexarium-backend.fly.dev`              |

Dev-only shortcuts: `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` (pre-fill login form).  
`VITE_API_BASE_URL` drives the PocketBase client (`src/lib/pocketbase/index.ts`).

## Architecture

**Lexarium** — Vue 3 SPA, GitHub Pages, multiple mini-apps under `/projects/`.

### Path alias

`@` → `src/` (both in `vite.config.ts` and `tsconfig.app.json`).

### Routing & auth

Only `/projects/lextrack` has `meta.requiresAuth: true`. The `beforeEach` guard redirects unauthenticated users to `{ name: 'login', query: { redirect: to.fullPath } }`.

`src/constants/routes/` is **not** router config — it holds raw GPS stop arrays for Larga's PUV routes (route-3.ts = red, route-10.ts = blue).

### PocketBase

Singleton `pb` exported from `src/lib/pocketbase/index.ts`.

Collections and types:

| Collection     | Interface     | Add type        | Mapper                 |
| -------------- | ------------- | --------------- | ---------------------- |
| `dsu_tasks`    | `DsuTasks`    | `AddDsuTask`    | `mapToUpdateTask()`    |
| `dsu_meetings` | `DsuMeetings` | `AddDsuMeeting` | `mapToUpdateMeeting()` |
| `dsu_supports` | `DsuSupports` | `AddDsuSupport` | `mapToUpdateSupport()` |

All record interfaces extend PocketBase's `RecordModel`. `Add*` types omit `id`, `created`, `updated`. Mappers extract only mutable fields for update payloads.

Auth store (`src/stores/auth.ts`) syncs reactively with `pb.authStore.onChange`.

### PrimeVue

Components are **auto-imported** via `unplugin-vue-components` + `PrimeVueResolver`. Do **not** manually import PrimeVue components in `<script setup>`.

Theme: Aura preset with full indigo palette override. Dark mode toggled by adding `.my-app-dark` to `document.documentElement` (not `prefers-color-scheme`). All buttons globally get `p-button-sm` via passthrough.

### Tailwind CSS 4

Uses `@tailwindcss/vite` plugin — **no `tailwind.config.js`**. Imported as `@import "tailwindcss"` in `src/assets/base.css`.

### iconify-icon

Registered as a custom element in Vite's Vue compiler options (`isCustomElement: tag === 'iconify-icon'`). Imported with `import 'iconify-icon'` in `main.ts`. No manual component registration needed.

## TypeScript

Three tsconfig references: `tsconfig.app.json` (src), `tsconfig.node.json` (vite config files), `tsconfig.vitest.json` (tests, types: `["node", "jsdom"]`).  
Type-check uses `vue-tsc --build` which processes all three.

## No CI / no pre-commit hooks

No `.github/workflows/`, no Husky, no lint-staged. Verification is manual.
