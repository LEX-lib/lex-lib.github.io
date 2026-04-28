# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev          # Vite dev server with hot reload
npm run build        # Type-check + build (production bundle to dist/, also copies index.html → 404.html for SPA fallback on GitHub Pages)
npm run preview      # Preview the production build
npm run test:unit    # Vitest (jsdom environment); pass a filename or pattern to run a single test, e.g. `npm run test:unit -- MyComponent`
npm run type-check   # vue-tsc --build only
npm run lint         # Runs lint:oxlint then lint:eslint (both with --fix)
npm run format       # Prettier on src/
npm run deploy       # Build + publish dist/ to gh-pages branch
```

Node engine: `^20.19.0 || >=22.12.0`. Vite is aliased to `rolldown-vite` in package.json.

## Architecture

**Stack**: Vue 3 (Composition API, `<script setup>`) + TypeScript + Vite + Pinia + Vue Router + PrimeVue (Aura preset, custom indigo primary) + Tailwind v4 + PocketBase backend. Deployed as a static SPA to GitHub Pages (custom domain via `public/CNAME` if present; SPA fallback handled by the `dist/index.html → dist/404.html` copy in the build script).

**Path alias**: `@/*` → `src/*` (configured in `vite.config.ts` and tsconfig).

**App entry** (`src/main.ts`): registers Pinia, the router, PrimeVue with a custom Aura-based preset (indigo primary, `.my-app-dark` dark-mode selector, default small buttons via `pt`), and `@vueuse/motion`. Global styles live in `src/assets/main.css` plus PrimeIcons and `vue-sonner/style.css`.

**Routing** (`src/router/index.ts`): uses `createWebHistory` with `import.meta.env.BASE_URL`. Most feature views are lazy-loaded. A global `beforeEach` guard checks `meta.requiresAuth` against `useAuthStore().isLoggedIn` and redirects to `/login` with a `redirect` query param. Currently only `/projects/lextrack` is auth-gated.

**PocketBase integration** (`src/lib/pocketbase/`): a single shared `pb` instance (`index.ts`) is created from `import.meta.env.VITE_API_BASE_URL`. Auth state lives in `src/stores/auth.ts` — the Pinia store wraps `pb.authStore`, exposes `user` / `isLoggedIn` / `login` / `logout`, and reactively syncs via `pb.authStore.onChange`. Per-collection mappers (e.g. `dsuTaskMapper.ts`, `dsuMeetingMapper.ts`, `dsuSupportMapper.ts`) convert internal types into the shape PocketBase update calls expect — when adding fields to a LexTrack entity, update both the type under `src/types/lextrack/<entity>/` and its corresponding mapper.

**LexTrack feature** (the auth-gated DSU tracker): orchestrated by `src/views/LexTrackView.vue`, which holds the date-keyed lists of `dsu_tasks`, `dsu_supports`, and `dsu_meetings` and composes `ActivityCard`, `AddMeeting`, `ManageMeeting`, `ManageTask`, and `ManageSupport` from `src/components/projects/lextrack/`. Types are split per entity under `src/types/lextrack/<entity>/`.

**Auto-imports**: PrimeVue components are auto-imported via `unplugin-vue-components` + `@primevue/auto-import-resolver` — do not add manual `import Button from 'primevue/button'` statements; the generated `components.d.ts` is the source of truth for available globals. `<iconify-icon>` is registered as a custom element in `vite.config.ts`, so use it directly in templates.

**Project components** (`src/components/projects/<project>/`) are organized per side-project (`lextrack`, `larga`, `gift-exchange`). Each project's routes are declared in `src/router/index.ts`; gift-exchange has sub-routes (`/join`, `/draw`, `/manage`) with `/projects/gift-exchange` redirecting to `/join`.

## Environment variables

Vite mode-based: `.env`, `.env.development`, `.env.production`, plus gitignored `*.local` overrides for secrets. Variables must be prefixed `VITE_` to reach client code. Currently used: `VITE_API_BASE_URL` (PocketBase URL), `VITE_APP_NAME`.

## Linting

Two-stage lint: `oxlint` (correctness rules, respects `.gitignore`) runs first, then `eslint` with the Vue + TypeScript flat config (`eslint.config.ts`) which layers `pluginVue` essentials, `vueTsConfigs.recommended`, Vitest rules for `src/**/__tests__/*`, oxlint compatibility, and Prettier skip-formatting. Format with `prettier` (uses `@prettier/plugin-oxc`).

<!-- GSD:project-start source:PROJECT.md -->
## Project

**LexTrack Optimization**

LexTrack is the auth-gated daily-stand-up tracker living inside the `lex-lib.github.io` Vue 3 SPA. It captures three buckets of daily work — **Meetings**, **Tasks**, and **Admin** — backed by PocketBase, and replaces the user's manual plain-text jotting (see `quarter-3-logs.txt`). This project optimizes the existing implementation: aligns it with the formal requirements doc, fixes correctness bugs, and adds the workflow features the user actually needs based on a quarter's worth of real-world logs.

**Core Value:** Capturing a day's stand-up activity must be **fast, complete, and durable** — the user can sit down at the end of any day, fill in their three buckets, and trust that the data is saved correctly and readable later.

### Constraints

- **Tech stack** — Must stay within current stack: Vue 3 Composition API, PocketBase, PrimeVue, Tailwind v4. No framework swaps.
- **Schema** — PocketBase collections: minimize migrations; additive changes only (new optional fields, new collection for day status). No renames or destructive migrations on existing data.
- **Auth** — All LexTrack routes remain auth-gated via existing `meta.requiresAuth` + `useAuthStore`.
- **Backwards compat** — Existing data in `dsu_meetings`, `dsu_tasks`, `dsu_supports` must continue to render correctly.
- **Bundle size** — Static SPA on GitHub Pages; avoid heavy new dependencies. Reuse PrimeVue / lodash-es / dayjs already present.
- **Deployment** — `npm run deploy` (gh-pages) must continue to work; the build copies `dist/index.html → dist/404.html` for SPA fallback.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.8.0 - Source code, Vue components, and configuration
- Vue 3.5.18 - UI framework using Composition API and `<script setup>`
- CSS 4 - Styling via Tailwind CSS v4 and PrimeVue themes
- HTML - Templates (processed via Vue SFCs)
## Runtime
- Node.js ^20.19.0 || >=22.12.0
- npm (latest, inferred from lockfile `package-lock.json`)
- Lockfile: `package-lock.json` (present)
## Frameworks
- Vue 3.5.18 - Progressive UI framework
- Vue Router 4.5.1 - Client-side routing with lazy-loaded feature views
- Pinia 3.0.3 - State management (reactive auth store in `src/stores/auth.ts`)
- PrimeVue 4.3.7 - Component library (Aura preset with indigo primary color)
- Tailwind CSS 4.1.12 - Utility-first CSS framework
- @tailwindcss/vite 4.1.12 - Vite integration for Tailwind
- Vite (rolldown-vite) - Build tool and dev server
- @vitejs/plugin-vue 6.0.1 - Vue SFC compilation
- unplugin-vue-components 29.0.0 - Auto-component import resolution
- @primevue/auto-import-resolver 4.3.7 - PrimeVue component auto-import
- vite-plugin-vue-devtools 8.0.0 - Vue DevTools integration
- Vitest 3.2.4 - Unit test runner (jsdom environment)
- @vitest/eslint-plugin 1.3.4 - ESLint integration for test files
- @vue/test-utils 2.4.6 - Vue component testing utilities
- jsdom 26.1.0 - DOM simulation for Node.js tests
- ESLint 9.31.0 - JavaScript linter (flat config in `eslint.config.ts`)
- oxlint 1.8.0 - Fast, production-grade linter (correctness rules)
- eslint-plugin-oxlint ~1.8.0 - oxlint integration for ESLint
- eslint-plugin-vue ~10.3.0 - Vue-specific ESLint rules
- @vue/eslint-config-typescript 14.6.0 - TypeScript ESLint configuration
- @vue/eslint-config-prettier 10.2.0 - Prettier integration for ESLint
- Prettier 3.6.2 - Code formatter
- @prettier/plugin-oxc 0.0.4 - Oxc parser plugin for Prettier
- vue-tsc 3.0.4 - Vue TypeScript compiler
- @vue/tsconfig 0.7.0 - Recommended TypeScript configuration for Vue
## Key Dependencies
- @primeuix/themes 1.2.3 - PrimeVue theme system and design tokens
- primeicons 7.0.0 - Icon library for PrimeVue
- iconify-icon 3.0.0 - Custom `<iconify-icon>` element for inline SVG icons
- @primevue/forms 4.3.9 - Form handling with validation resolvers
- dayjs 1.11.18 - Date/time formatting and manipulation (used in LexTrack views)
- lodash-es 4.17.21 - Utility functions (tree-shakeable ES modules)
- @types/lodash-es 4.17.12 - TypeScript types for lodash-es
- zod 4.1.5 - Schema validation (integrated with PrimeVue forms via zodResolver)
- @vueuse/motion 3.0.3 - Motion and animation library for Vue
- vue-sonner 2.0.8 - Toast notifications (used in LexTrack and Gift Exchange)
- leaflet 1.9.4 - JavaScript library for interactive maps (used in Larga project)
- leaflet-control-geocoder 3.3.0 - Geocoding control for Leaflet (address lookup)
- @types/leaflet 1.9.20 - TypeScript types for Leaflet
- quill 2.0.3 - Rich text editor (available for content editing features)
- pocketbase 0.26.2 - JavaScript SDK for PocketBase API client
- @vercel/speed-insights 1.3.1 - Vercel Web Analytics for performance insights
- gh-pages 6.3.0 - Publish to GitHub Pages branch
- Deploy command: `npm run deploy`
- jiti 2.4.2 - Runtime TypeScript module loader
- npm-run-all2 8.0.4 - Task runner for parallel/sequential scripts
- @types/jsdom 21.1.7 - TypeScript types for jsdom
- @types/node 22.16.5 - TypeScript types for Node.js
- @vue/language-server 3.0.6 - Language support for Vue files
## Configuration
- `.env` - Shared defaults across all modes
- `.env.development` - Development overrides
- `.env.production` - Production overrides
- `.env.local`, `.env.development.local`, `.env.production.local` - Gitignored local overrides for secrets
- `VITE_APP_NAME` - Application display name
- `VITE_API_BASE_URL` - PocketBase backend URL
- `VITE_FEATURE_FLAG_EXAMPLE` - Example feature flag (string or boolean)
- `VITE_LOGIN_EMAIL` - Demo/testing login email (optional)
- `VITE_LOGIN_PASSWORD` - Demo/testing login password (optional)
- `vite.config.ts` - Vite configuration with Vue plugin, auto-import resolver, Tailwind integration, and `iconify-icon` custom element registration
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json` - TypeScript configurations
- `vitest.config.ts` - Test environment (jsdom), excludes e2e tests
- `eslint.config.ts` - Flat ESLint config (Vue, TypeScript, Vitest, oxlint, Prettier)
- `src/assets/main.css` - Global styles and PrimeVue/Tailwind integration
- PrimeVue Aura preset with custom indigo primary colors
- Dark mode selector: `.my-app-dark` class on document root
## Platform Requirements
- Node.js 20.19.0 or 22.12.0+
- npm (any recent version)
- VSCode + Volar extension (Vue) recommended
- Static hosting (GitHub Pages)
- PocketBase backend instance (external service)
- Custom domain via `public/CNAME` (optional)
- GitHub Pages (dist/ folder deployed to gh-pages branch)
- Static SPA with client-side routing fallback (`dist/404.html` copies from `dist/index.html`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Vue components: PascalCase (e.g., `ActivityCard.vue`, `CustomNavBar.vue`, `ManageMeeting.vue`)
- TypeScript files: camelCase or PascalCase depending on context (e.g., `dsuMeetingMapper.ts`, `index.ts`)
- Type definition files: `types.d.ts` suffix (e.g., `dsu_meetings/types.d.ts`)
- Store files: camelCase (e.g., `auth.ts`, `counter.ts`)
- Mapper files: camelCase with Mapper suffix (e.g., `dsuMeetingMapper.ts`, `dsuTaskMapper.ts`)
- camelCase for all functions and methods (e.g., `toggleDarkMode`, `hideInputGroup`, `updateMeeting`, `mapToUpdateMeeting`)
- Event handlers use camelCase prefixed with action verb (e.g., `removeSupport`, `updateTask`, `removeTask`)
- Private/internal functions follow same camelCase convention
- camelCase for all variables, refs, and computed properties (e.g., `selectedDate`, `viewMeetingDialogVisibility`, `support`, `meetings`)
- Descriptive names preferred: `viewMeetingDialogVisibility` over `dialog`
- Boolean refs include descriptive prefix: `viewSupportDialogVisibility`, `showInputGroup`
- PascalCase for interfaces and types (e.g., `DsuMeetings`, `AddDsuMeeting`, `SectionItem`)
- Union types defined inline or with descriptive PascalCase names
- Type utility patterns: `Add` prefix for creation types (e.g., `AddDsuMeeting`, `AddDsuTask`, `AddDsuSupport`)
- Omit pattern used for derived types: `Omit<DsuMeetings, 'id' | 'created' | 'updated'>`
## Code Style
- Prettier version 3.6.2 with @prettier/plugin-oxc
- No explicit `.prettierrc` file; uses Prettier defaults
- Prettier runs on `src/` directory only: `prettier --write src/`
- Formatting enforced via lint script
- Two-stage lint pipeline:
- Both linters run in fix mode
- eslint-plugin-vue v10.3.0 for Vue 3 specific rules
- eslint-plugin-oxlint v1.8.0 integrates oxlint rules into ESLint
- @vitest/eslint-plugin for test file patterns
## Import Organization
- `@/` → `./src/` (configured in `tsconfig.app.json` and `vite.config.ts`)
- Used consistently across all files; relative paths avoided
## Error Handling
- Try-catch blocks for async operations (e.g., `pb.collection(...).getFullList()`)
- Promise.all for concurrent async operations with type safety
- Type guards for runtime checks: `if (event instanceof KeyboardEvent)`, `if (typeof redirectRaw === 'string')`
- Console logging for debugging (appears throughout; not error boundary focused)
- Error propagation in auth flow: login errors caught and logged to console
## Logging
- `console.log()` for debug output (scattered throughout components)
- `console.error()` for error tracking in try-catch blocks
- Toast notifications for user feedback: `toast.success('Meeting is updated successfully!')` from vue-sonner
- Commented-out console logs indicate removed debug statements
## Comments
- Section separators for logical groupings (e.g., `/** SUPPORTS */`, `/** MEETINGS */`, `/** TASKS */`)
- Inline comments for complex logic (sparse in current codebase)
- JSDoc-style comments not enforced; minimal in practice
- Not used in current codebase
- Type hints via TypeScript provide most documentation
## Function Design
- Functions typically 3-20 lines
- Larger functions break logic into sections with comments
- Event handlers often single-line when simple: `const edit = (index: number) => emit('update', index)`
- Typed parameters required in TypeScript files
- Union types acceptable: `SectionItem = AddDsuMeeting | AddDsuSupport | AddDsuTask`
- Destructuring common for complex objects
- Explicit return types in function signatures
- Mapper functions return shaped objects: `{ title, duration_minutes?, description? }`
- Void functions used for mutations and event emission
## Module Design
- Named exports for utilities and mappers: `export function mapToUpdateMeeting(...)`
- Default export for Vue components: `export default component`
- Pinia store: `export const useAuthStore = defineStore(...)`
- Used for route organization: `src/constants/routes/index.ts` re-exports from `route-3.ts` and `route-10.ts`
- Not heavily used for component organization (individual imports preferred)
## Vue 3 Composition API Patterns
- `<script setup lang="ts">` used exclusively
- Composable pattern leveraged with `defineStore` (Pinia)
- No setup function; all reactive state at top level
- `ref<T>()` for primitive and complex types: `ref(new Date())`, `ref<DsuSupportItem[]>([])`
- `computed()` for derived state: `computed(() => isEmpty(meetings.value) && ...)`
- `watch()` for side effects with proper async handling
- `defineModel()` for two-way binding: `const visible = defineModel('visible', { ... })`
- `defineProps()` with TypeScript generics: `defineProps<{ label: string }>()`
- `defineEmits()` with typed tuples: `defineEmits<{ update: [index: number]; remove: [index: number] }>()`
- v-model directives for nested component state
## PrimeVue Component Usage
- Components auto-imported via unplugin-vue-components with PrimeVueResolver
- No manual import statements required for PrimeVue components
- Components declared in template immediately available
- Icon element (iconify-icon) registered as custom element in `vite.config.ts`
## TypeScript Configuration
- TypeScript 5.8.0
- Strict type checking enforced across app and vitest configs
- `@vue/tsconfig` base config with DOM libs
- Path alias `@/*` maps to `./src/*`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Composition API with TypeScript for type safety
- Centralized state management via Pinia stores
- Client-side routing with Vue Router (auth-gated routes)
- RESTful backend integration with PocketBase SDK
- Component-driven UI using PrimeVue component library (auto-imported via unplugin-vue-components)
- Feature-based project organization within components
## Layers
- Purpose: Entry points for major routes; orchestrate page-level state and component communication
- Location: `src/views/*.vue`
- Contains: View components (HomeView, LexTrackView, ProjectsView, AboutView)
- Depends on: Vue Router, child components, stores, backend client
- Used by: Vue Router (routing system)
- Example: `src/views/LexTrackView.vue` orchestrates three activity sections (meetings, tasks, supports), watches date selection, manages dialogs, and coordinates save operations across all entities
- Purpose: Reusable UI components organized by project/feature
- Location: `src/components/` (generic) and `src/components/projects/<project>/*.vue` (feature-specific)
- Contains: Presentational components, dialog/modal components, activity cards
- Depends on: PrimeVue, Iconify, child components, type definitions
- Used by: Views and other components
- Example: `src/components/projects/lextrack/ActivityCard.vue` is a generic activity section renderer used for meetings, tasks, and supports
- Purpose: Centralized reactive state and computed properties
- Location: `src/stores/*.ts`
- Contains: Pinia stores using composition API pattern
- Depends on: Pinia, PocketBase client
- Used by: Views and components
- Examples:
- Purpose: Backend communication and type mapping
- Location: `src/lib/pocketbase/`
- Contains: PocketBase client instance, entity mappers
- Depends on: PocketBase SDK, type definitions
- Used by: Views and stores
- Example: `src/lib/pocketbase/index.ts` exports singleton `pb` instance; `dsuMeetingMapper.ts`, `dsuTaskMapper.ts`, `dsuSupportMapper.ts` transform API responses for updates
- Purpose: Define domain entity contracts and API shape
- Location: `src/types/lextrack/<entity>/types.d.ts`
- Contains: TypeScript interfaces extending PocketBase RecordModel
- Depends on: PocketBase SDK types
- Used by: Components, views, mappers, stores
- Example: `src/types/lextrack/dsu_meetings/types.d.ts` defines `DsuMeetings` (full record) and `AddDsuMeeting` (create/update payload)
- Purpose: Application-wide configuration and route constants
- Location: `src/constants/`, `src/router/`, `src/main.ts`
- Contains: Route definitions, theme presets, environment vars
- Depends on: Vue, PrimeVue
- Used by: Router, app initialization
## Data Flow
## Key Abstractions
- Purpose: Represent day-to-day work items tracked in LexTrack
- Examples: 
- Pattern: Each entity extends PocketBase `RecordModel` and provides:
- Purpose: Edit/update entity details with rich form controls
- Examples: `ManageMeeting.vue`, `ManageTask.vue`, `ManageSupport.vue`, `AddMeeting.vue`
- Pattern: Each dialog:
- Purpose: Render a section of activities with add/edit/remove operations
- Location: `src/components/projects/lextrack/ActivityCard.vue`
- Pattern: Accepts v-model binding to array of `SectionItem` (union of Add types)
- Emits `update(index)` and `remove(index)` events to parent
- Supports quick-add via input group (Enter → append, Esc → dismiss)
- Purpose: Transform entity data for PocketBase updates (omit internal fields)
- Examples: `mapToUpdateMeeting()`, `mapToUpdateTask()`, `mapToUpdateSupport()`
- Pattern: Function takes full entity, returns object with only updatable fields
- Ensures `id`, `created`, `updated` never sent to backend
## Entry Points
- Location: `src/main.ts`
- Triggers: HTML app div mount
- Responsibilities: 
- Location: `src/router/index.ts`
- Triggers: Browser navigation
- Responsibilities:
- Location: `src/views/LexTrackView.vue`
- Triggers: Navigation to `/projects/lextrack` (auth required)
- Responsibilities:
- Location: `src/App.vue`
- Triggers: Root component mount
- Responsibilities:
## Error Handling
- Success notifications: `toast.success('Meeting is updated successfully!')` in ManageMeeting.vue, etc.
- No explicit error handling: API calls in LexTrackView `save()` and watch handlers lack try/catch
- Auth errors: PocketBase SDK throws, router guard redirects to login on auth failure
- Type safety: TypeScript interfaces catch shape mismatches at compile time
## Cross-Cutting Concerns
- Approach: Inline `console.log()` statements (see LexTrackView.vue lines 34, 40, 58, 64, 84, 90)
- No structured logging framework
- Approach: None implemented at component/view layer
- Type-based: TypeScript interfaces provide compile-time shape validation
- Runtime: PocketBase SDK validates on backend; frontend sends as-is
- Approach: Token-based via PocketBase
- Flow: Login form → `auth.login()` → PocketBase authWithPassword → authStore update → reactive store update → router guard allows
- Persistence: PocketBase SDK manages token in localStorage; persists across sessions
- Guard: Router beforeEach checks `auth.isLoggedIn` computed property
- Approach: `unplugin-vue-components` with `PrimeVueResolver()`
- Effect: PrimeVue components (Button, Dialog, Card, InputText, etc.) used without explicit imports
- Generated file: `components.d.ts` (auto-generated, not in repo)
- Convention: Allows clean template code; component availability verified at type-check time
- Approach: PrimeVue Aura theme with Indigo primary color customization (src/main.ts)
- CSS Framework: Tailwind CSS v4 with Vite plugin
- Styling: Scoped `<style scoped>` in components + Tailwind classes in templates
- Dark Mode: Built-in PrimeVue dark mode selector `.my-app-dark` (not actively toggled in current code)
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
