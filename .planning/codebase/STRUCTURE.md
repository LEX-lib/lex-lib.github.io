# Codebase Structure

**Analysis Date:** 2026-05-10

## Directory Layout

```
lex-lib.github.io/
├── public/                          # Static assets served as-is by Vite
│   ├── branding_logo.svg
│   └── favicon.ico
├── assets/                          # Legacy/static assets at project root (not bundled by Vite)
│   ├── about-me-photo.png
│   ├── cv.pdf
│   ├── undraw_accept_request_re_d81h.svg
│   └── undraw_coding_re_iv62-TX-_gsuG.svg
├── src/
│   ├── main.ts                      # App bootstrap entry — Vue, Pinia, Router, PrimeVue, Motion
│   ├── App.vue                      # Root component — NavBar + RouterView + Toaster + SpeedInsights
│   ├── assets/                      # Bundled assets (CSS, images)
│   │   ├── base.css
│   │   ├── main.css                 # Brand CSS variables, Tailwind layer
│   │   ├── about-me-photo.png
│   │   ├── branding_logo.svg
│   │   └── logo.svg
│   ├── router/
│   │   └── index.ts                 # Route table + beforeEach auth guard
│   ├── stores/                      # Pinia stores
│   │   ├── auth.ts                  # PocketBase auth bridge (used)
│   │   └── counter.ts               # Scaffold example (unused)
│   ├── views/                       # Top-level route components
│   │   ├── HomeView.vue
│   │   ├── ProjectsView.vue
│   │   ├── LexTrackView.vue
│   │   ├── BlogView.vue
│   │   └── AboutView.vue
│   ├── components/                  # Shared shell UI
│   │   ├── CustomNavBar.vue
│   │   ├── HeroSection.vue
│   │   ├── AboutMeSection.vue
│   │   ├── Login.vue                # Mounted by /login route
│   │   ├── HelloWorld.vue           # Vue scaffold remnant
│   │   ├── TheWelcome.vue           # Vue scaffold remnant
│   │   ├── WelcomeItem.vue          # Vue scaffold remnant
│   │   ├── icons/                   # Vue scaffold icon SFCs
│   │   │   ├── IconCommunity.vue
│   │   │   ├── IconDocumentation.vue
│   │   │   ├── IconEcosystem.vue
│   │   │   ├── IconSupport.vue
│   │   │   └── IconTooling.vue
│   │   └── projects/                # Mini-app feature folders
│   │       ├── lextrack/
│   │       │   ├── LexTrackApp.vue
│   │       │   ├── ActivityCard.vue
│   │       │   ├── AddMeeting.vue
│   │       │   ├── ManageMeeting.vue
│   │       │   ├── ManageTask.vue
│   │       │   └── ManageSupport.vue
│   │       ├── larga/
│   │       │   └── LargaApp.vue
│   │       ├── gift-exchange/
│   │       │   ├── GiftExchange.vue
│   │       │   ├── GiftExchangeJoin.vue
│   │       │   ├── GiftExchangeDraw.vue
│   │       │   └── GiftExchangeManage.vue
│   │       └── api-playground/
│   │           └── ApiPlaygroundApp.vue
│   ├── lib/
│   │   └── pocketbase/              # Backend SDK + entity write mappers
│   │       ├── index.ts             # `pb` singleton from VITE_API_BASE_URL
│   │       ├── dsuTaskMapper.ts
│   │       ├── dsuMeetingMapper.ts
│   │       └── dsuSupportMapper.ts
│   ├── types/                       # Type definitions (.d.ts)
│   │   └── lextrack/
│   │       ├── dsu_tasks/types.d.ts
│   │       ├── dsu_meetings/types.d.ts
│   │       └── dsu_supports/types.d.ts
│   └── constants/
│       └── routes/                  # Static PUV route data for Larga
│           ├── index.ts             # Re-exports route3, route10
│           ├── route-3.ts
│           └── route-10.ts
├── index.html                       # Vite HTML entry — mounts /src/main.ts
├── components.d.ts                  # Auto-generated PrimeVue component types
├── env.d.ts                         # ImportMetaEnv type augmentation
├── vite.config.ts                   # Vite config — alias @, code splitting, plugins
├── tsconfig.json                    # Root TS project references
├── tsconfig.app.json                # App-side TS (paths: @/* → ./src/*)
├── tsconfig.node.json
├── tsconfig.vitest.json
├── vitest.config.ts
├── package.json
├── site.css                         # Legacy stylesheet (root-level)
├── README.md
└── CLAUDE.md                        # Project instructions for Claude Code
```

## Directory Purposes

**`src/`:**
- Purpose: All bundled application source
- Contains: Entry, root component, routing, state, types, mini-apps
- Key files: `src/main.ts`, `src/App.vue`, `src/router/index.ts`

**`src/views/`:**
- Purpose: Top-level page components mounted by Vue Router
- Contains: One file per "shell" route (Home, Projects, LexTrack, Blog, About)
- Key files: `src/views/HomeView.vue`, `src/views/ProjectsView.vue`, `src/views/LexTrackView.vue`
- Note: NOT all routes have a view here — most mini-apps are routed directly to their `*App.vue` under `src/components/projects/`

**`src/components/`:**
- Purpose: Reusable UI shells and shared components used by views
- Contains: Navbar, hero, about-me, login form, scaffold remnants, icons, and the `projects/` subtree of mini-apps
- Key files: `src/components/CustomNavBar.vue`, `src/components/Login.vue`, `src/components/HeroSection.vue`, `src/components/AboutMeSection.vue`

**`src/components/projects/<app>/`:**
- Purpose: Per-mini-app feature folders
- Contains: A primary `<App>App.vue` plus per-feature subcomponents
- Key files: `LexTrackApp.vue`, `LargaApp.vue`, `GiftExchangeJoin.vue`, `ApiPlaygroundApp.vue`

**`src/router/`:**
- Purpose: Routing configuration
- Contains: Single `index.ts` with route table and auth guard
- Key files: `src/router/index.ts`

**`src/stores/`:**
- Purpose: Pinia setup-style stores
- Contains: `auth.ts` (PocketBase auth bridge), `counter.ts` (unused scaffold)
- Key files: `src/stores/auth.ts`

**`src/lib/`:**
- Purpose: Third-party integrations and helpers
- Contains: Currently only `pocketbase/` — SDK singleton plus entity mappers
- Key files: `src/lib/pocketbase/index.ts`, `src/lib/pocketbase/dsuTaskMapper.ts`

**`src/types/`:**
- Purpose: TypeScript declaration files for PocketBase records
- Contains: One folder per LexTrack collection with a `types.d.ts`
- Key files: `src/types/lextrack/dsu_tasks/types.d.ts`

**`src/constants/`:**
- Purpose: Static reference data
- Contains: Currently only `routes/` (Larga PUV route data)
- Key files: `src/constants/routes/index.ts`, `src/constants/routes/route-3.ts`, `src/constants/routes/route-10.ts`

**`src/assets/`:**
- Purpose: Bundled CSS and images imported by SFCs
- Contains: `main.css` (entry stylesheet imported in `main.ts`), `base.css`, brand SVGs, photos
- Key files: `src/assets/main.css`, `src/assets/branding_logo.svg`

**`public/`:**
- Purpose: Static files served at site root without bundling
- Contains: `branding_logo.svg`, `favicon.ico`

**`assets/` (project root, NOT `src/assets/`):**
- Purpose: Legacy static files (predates Vue migration); not bundled
- Contains: CV PDF, undraw illustrations, photos

## Key File Locations

**Entry Points:**
- `index.html`: Browser entry; loads `/src/main.ts`
- `src/main.ts`: App bootstrap; registers plugins, mounts `<App>` to `#app`
- `src/App.vue`: Root component; renders `<CustomNavBar>`, `<RouterView>`, `<Toaster>`, `<SpeedInsights>`

**Configuration:**
- `vite.config.ts`: Vite plugins (vue, devtools, unplugin-vue-components+PrimeVueResolver, tailwindcss), `@` alias, manual code-splitting groups
- `tsconfig.app.json`: TS paths (`@/* → ./src/*`)
- `env.d.ts`: `ImportMetaEnv` shape for `VITE_*` env vars
- `package.json`: Scripts (`dev`, `build`, `preview`, `test:unit`, `lint`, `format`, `type-check`), engines (node `^20.19.0 || >=22.12.0`)
- `components.d.ts`: Auto-generated PrimeVue component types (committed)

**Core Logic:**
- `src/router/index.ts`: All routes + auth guard
- `src/stores/auth.ts`: Auth state (PocketBase reactive bridge)
- `src/lib/pocketbase/index.ts`: `pb` singleton

**Testing:**
- `vitest.config.ts`: Vitest setup (jsdom)
- `tsconfig.vitest.json`: Test-specific TS config
- Note: No actual test files exist yet (no `__tests__/` or `*.spec.ts`/`*.test.ts` files found in `src/`)

**Build Output:**
- `dist/`: Production build (gitignored). Vercel builds + serves this on every push (no `vercel.json` — auto-detected Vite preset).

## Naming Conventions

**Files:**
- Vue SFCs: `PascalCase.vue` (`LexTrackApp.vue`, `ActivityCard.vue`, `CustomNavBar.vue`)
- Mini-app root: `<Name>App.vue` (`LargaApp.vue`, `ApiPlaygroundApp.vue`, `LexTrackApp.vue`)
- View components: `<Name>View.vue` (`HomeView.vue`, `ProjectsView.vue`)
- TS modules: `camelCase.ts` (`dsuTaskMapper.ts`, `auth.ts`, `counter.ts`)
- Type declarations: `types.d.ts` inside a collection-named folder
- Route constants: `route-<N>.ts` (kebab-case with numeric suffix)
- Config files: lowercase (`vite.config.ts`, `tsconfig.app.json`)

**Directories:**
- All lowercase, kebab-case for multi-word: `gift-exchange/`, `api-playground/`
- Per-collection type folders use the PocketBase collection name verbatim (snake_case): `dsu_tasks/`, `dsu_meetings/`, `dsu_supports/`
- Mini-app folders match the route slug: `lextrack/`, `larga/`, `gift-exchange/`, `api-playground/`

**Identifiers (TypeScript):**
- Interfaces / Types: `PascalCase` (`DsuTasks`, `AddDsuTask`, `Project`, `KeyValueRow`)
- Functions / variables: `camelCase` (`mapToUpdateTask`, `selectedDate`, `viewMeetingDialogVisibility`)
- Pinia stores: `useXxxStore` (`useAuthStore`, `useCounterStore`)
- Vue refs/state: `camelCase` ref names (`isEnrolled`, `participantsCount`)

**Routes (route names in `src/router/index.ts`):**
- kebab-case strings: `home`, `login`, `projects`, `larga`, `lextrack`, `gift-exchange-join`, `gift-exchange-draw`, `gift-exchange-manage`, `api-playground`, `blog`

## Where to Add New Code

**New mini-app:**
- Primary code: `src/components/projects/<new-app>/<NewApp>App.vue` (plus subcomponents in same folder)
- Register route: add entry to `src/router/index.ts` with `path: '/projects/<new-app>'`, `name: '<new-app>'`, lazy `component: () => import('@/components/projects/<new-app>/<NewApp>App.vue')`
- If auth required: add `meta: { requiresAuth: true }`
- If wraps in a view shell: add `src/views/<NewApp>View.vue` and route to it instead (follow `LexTrackView.vue` pattern)
- Surface in directory: add a `Project` entry in `src/views/ProjectsView.vue` `projects` array

**New PocketBase collection integration:**
- Type declaration: `src/types/<feature>/<collection_snake_case>/types.d.ts` — export `interface X extends RecordModel` and `AddX = Omit<X, 'id' | 'created' | 'updated'>`
- Write mapper (if updates strip fields): `src/lib/pocketbase/<entity>Mapper.ts` exporting `mapToUpdate<Entity>(...)`
- Consume via `import { pb } from '@/lib/pocketbase'` then `pb.collection('<name>').getFullList<X>(options)`

**New shared component:**
- Reusable across views: `src/components/<ComponentName>.vue`
- Mini-app-specific: keep inside the mini-app's `src/components/projects/<app>/` folder

**New view (top-level page):**
- File: `src/views/<Name>View.vue`
- Register in `src/router/index.ts`

**New Pinia store:**
- File: `src/stores/<storeName>.ts`
- Use setup-style: `export const useXxxStore = defineStore('xxx', () => { ... })`
- Follow `src/stores/auth.ts` pattern for any PocketBase-backed reactive state

**New utility / lib integration:**
- Folder per integration under `src/lib/<integration>/index.ts`
- Follow the `pocketbase/` pattern: a singleton `index.ts` plus per-entity helper modules

**New static reference data:**
- File: `src/constants/<category>/<item>.ts` and re-export from `src/constants/<category>/index.ts`

**New TypeScript type:**
- For PocketBase records: `src/types/<feature>/<collection>/types.d.ts`
- For inline component types: define in the SFC `<script setup>` block (current convention — see `interface Project` in `src/views/ProjectsView.vue`, `interface KeyValueRow` in `ApiPlaygroundApp.vue`)

**Test files:**
- Per `tsconfig.app.json` `exclude`, tests live in `src/**/__tests__/` directories
- Naming would follow Vitest conventions (`*.spec.ts` / `*.test.ts`); no examples exist yet

## Special Directories

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (gitignored)
- Note: Built and served by Vercel on push (no `vercel.json` — auto-detected Vite preset)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**`public/`:**
- Purpose: Static assets served verbatim from site root
- Generated: No
- Committed: Yes

**`assets/` (project root):**
- Purpose: Legacy static files predating the Vue migration (CV, undraw illustrations)
- Generated: No
- Committed: Yes
- Note: Distinct from `src/assets/`; not imported by the Vue app — candidate for cleanup

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (this file's home)
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Per project policy

**`components.d.ts`:**
- Purpose: Auto-generated PrimeVue component type declarations
- Generated: Yes (by `unplugin-vue-components`)
- Committed: Yes (currently shows as modified in git status)

---

*Structure analysis: 2026-05-10*
