# Technology Stack

**Analysis Date:** 2026-04-28

## Languages

**Primary:**
- TypeScript 5.8.0 - Source code, Vue components, and configuration
- Vue 3.5.18 - UI framework using Composition API and `<script setup>`

**Secondary:**
- CSS 4 - Styling via Tailwind CSS v4 and PrimeVue themes
- HTML - Templates (processed via Vue SFCs)

## Runtime

**Environment:**
- Node.js ^20.19.0 || >=22.12.0

**Package Manager:**
- npm (latest, inferred from lockfile `package-lock.json`)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Vue 3.5.18 - Progressive UI framework
- Vue Router 4.5.1 - Client-side routing with lazy-loaded feature views
- Pinia 3.0.3 - State management (reactive auth store in `src/stores/auth.ts`)
- PrimeVue 4.3.7 - Component library (Aura preset with indigo primary color)
- Tailwind CSS 4.1.12 - Utility-first CSS framework
- @tailwindcss/vite 4.1.12 - Vite integration for Tailwind

**Build/Dev:**
- Vite (rolldown-vite) - Build tool and dev server
- @vitejs/plugin-vue 6.0.1 - Vue SFC compilation
- unplugin-vue-components 29.0.0 - Auto-component import resolution
- @primevue/auto-import-resolver 4.3.7 - PrimeVue component auto-import
- vite-plugin-vue-devtools 8.0.0 - Vue DevTools integration

**Testing:**
- Vitest 3.2.4 - Unit test runner (jsdom environment)
- @vitest/eslint-plugin 1.3.4 - ESLint integration for test files
- @vue/test-utils 2.4.6 - Vue component testing utilities
- jsdom 26.1.0 - DOM simulation for Node.js tests

**Linting & Formatting:**
- ESLint 9.31.0 - JavaScript linter (flat config in `eslint.config.ts`)
- oxlint 1.8.0 - Fast, production-grade linter (correctness rules)
- eslint-plugin-oxlint ~1.8.0 - oxlint integration for ESLint
- eslint-plugin-vue ~10.3.0 - Vue-specific ESLint rules
- @vue/eslint-config-typescript 14.6.0 - TypeScript ESLint configuration
- @vue/eslint-config-prettier 10.2.0 - Prettier integration for ESLint
- Prettier 3.6.2 - Code formatter
- @prettier/plugin-oxc 0.0.4 - Oxc parser plugin for Prettier

**Type Checking:**
- vue-tsc 3.0.4 - Vue TypeScript compiler
- @vue/tsconfig 0.7.0 - Recommended TypeScript configuration for Vue

## Key Dependencies

**UI & Components:**
- @primeuix/themes 1.2.3 - PrimeVue theme system and design tokens
- primeicons 7.0.0 - Icon library for PrimeVue
- iconify-icon 3.0.0 - Custom `<iconify-icon>` element for inline SVG icons
- @primevue/forms 4.3.9 - Form handling with validation resolvers

**Utilities:**
- dayjs 1.11.18 - Date/time formatting and manipulation (used in LexTrack views)
- lodash-es 4.17.21 - Utility functions (tree-shakeable ES modules)
- @types/lodash-es 4.17.12 - TypeScript types for lodash-es
- zod 4.1.5 - Schema validation (integrated with PrimeVue forms via zodResolver)

**Animation & Motion:**
- @vueuse/motion 3.0.3 - Motion and animation library for Vue
- vue-sonner 2.0.8 - Toast notifications (used in LexTrack and Gift Exchange)

**Mapping & Geolocation:**
- leaflet 1.9.4 - JavaScript library for interactive maps (used in Larga project)
- leaflet-control-geocoder 3.3.0 - Geocoding control for Leaflet (address lookup)
- @types/leaflet 1.9.20 - TypeScript types for Leaflet

**Rich Text Editing:**
- quill 2.0.3 - Rich text editor (available for content editing features)

**Backend Integration:**
- pocketbase 0.26.2 - JavaScript SDK for PocketBase API client
  - Used to interact with collections: `dsu_tasks`, `dsu_meetings`, `dsu_supports`, `users`
  - Auth management via `pb.authStore`

**Monitoring & Analytics:**
- @vercel/speed-insights 1.3.1 - Vercel Web Analytics for performance insights
  - Integrated as `<SpeedInsights />` component in `src/App.vue`

**Deployment:**
- gh-pages 6.3.0 - Publish to GitHub Pages branch
- Deploy command: `npm run deploy`

**Development Utilities:**
- jiti 2.4.2 - Runtime TypeScript module loader
- npm-run-all2 8.0.4 - Task runner for parallel/sequential scripts
- @types/jsdom 21.1.7 - TypeScript types for jsdom
- @types/node 22.16.5 - TypeScript types for Node.js
- @vue/language-server 3.0.6 - Language support for Vue files

## Configuration

**Environment Variables (Vite mode-based):**
- `.env` - Shared defaults across all modes
- `.env.development` - Development overrides
- `.env.production` - Production overrides
- `.env.local`, `.env.development.local`, `.env.production.local` - Gitignored local overrides for secrets

**Required Environment Variables:**
- `VITE_APP_NAME` - Application display name
- `VITE_API_BASE_URL` - PocketBase backend URL
- `VITE_FEATURE_FLAG_EXAMPLE` - Example feature flag (string or boolean)
- `VITE_LOGIN_EMAIL` - Demo/testing login email (optional)
- `VITE_LOGIN_PASSWORD` - Demo/testing login password (optional)

**Build Configuration:**
- `vite.config.ts` - Vite configuration with Vue plugin, auto-import resolver, Tailwind integration, and `iconify-icon` custom element registration
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json` - TypeScript configurations
- `vitest.config.ts` - Test environment (jsdom), excludes e2e tests
- `eslint.config.ts` - Flat ESLint config (Vue, TypeScript, Vitest, oxlint, Prettier)

**CSS/Theme:**
- `src/assets/main.css` - Global styles and PrimeVue/Tailwind integration
- PrimeVue Aura preset with custom indigo primary colors
- Dark mode selector: `.my-app-dark` class on document root

## Platform Requirements

**Development:**
- Node.js 20.19.0 or 22.12.0+
- npm (any recent version)
- VSCode + Volar extension (Vue) recommended

**Production:**
- Static hosting (GitHub Pages)
- PocketBase backend instance (external service)
- Custom domain via `public/CNAME` (optional)

**Deployment Target:**
- GitHub Pages (dist/ folder deployed to gh-pages branch)
- Static SPA with client-side routing fallback (`dist/404.html` copies from `dist/index.html`)

---

*Stack analysis: 2026-04-28*
