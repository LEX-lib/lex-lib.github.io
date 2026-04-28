# Codebase Structure

**Analysis Date:** 2026-04-28

## Directory Layout

```
lex-lib.github.io/
├── src/                                     # Application source code
│   ├── main.ts                              # App initialization, plugin setup, theme config
│   ├── App.vue                              # Root component (navbar, router outlet, toaster)
│   ├── router/
│   │   └── index.ts                         # Route definitions, auth guard
│   ├── stores/
│   │   ├── auth.ts                          # Authentication state (Pinia store)
│   │   └── counter.ts                       # Example store (unused)
│   ├── views/
│   │   ├── HomeView.vue                     # Home page (under construction)
│   │   ├── LexTrackView.vue                 # LexTrack orchestrator view
│   │   ├── ProjectsView.vue                 # Project directory/hub
│   │   └── AboutView.vue                    # About page
│   ├── components/
│   │   ├── Login.vue                        # Login form component
│   │   ├── CustomNavBar.vue                 # Navigation bar
│   │   ├── icons/
│   │   │   └── Icon*.vue                    # Icon components (unused)
│   │   └── projects/
│   │       ├── lextrack/                    # LexTrack project components
│   │       │   ├── LexTrackApp.vue          # Alternative implementation (commented in view)
│   │       │   ├── ActivityCard.vue         # Generic activity section (meetings/tasks/supports)
│   │       │   ├── ManageMeeting.vue        # Meeting edit dialog
│   │       │   ├── ManageTask.vue           # Task edit dialog
│   │       │   ├── ManageSupport.vue        # Support edit dialog
│   │       │   └── AddMeeting.vue           # Meeting add dialog
│   │       ├── gift-exchange/               # Gift exchange project (MonitoX)
│   │       │   ├── GiftExchange.vue
│   │       │   ├── GiftExchangeDraw.vue
│   │       │   ├── GiftExchangeJoin.vue
│   │       │   └── GiftExchangeManage.vue
│   │       └── larga/
│   │           └── LargaApp.vue             # Larga project
│   ├── lib/
│   │   └── pocketbase/
│   │       ├── index.ts                     # PocketBase client singleton
│   │       ├── dsuMeetingMapper.ts          # Meeting entity mapper
│   │       ├── dsuTaskMapper.ts             # Task entity mapper
│   │       └── dsuSupportMapper.ts          # Support entity mapper
│   ├── types/
│   │   └── lextrack/
│   │       ├── dsu_meetings/
│   │       │   └── types.d.ts               # DsuMeetings interface & AddDsuMeeting type
│   │       ├── dsu_tasks/
│   │       │   └── types.d.ts               # DsuTasks interface & AddDsuTask type
│   │       └── dsu_supports/
│   │           └── types.d.ts               # DsuSupports interface & AddDsuSupport type
│   ├── constants/
│   │   └── routes/
│   │       ├── index.ts                     # Route constants export
│   │       ├── route-3.ts                   # Route definition
│   │       └── route-10.ts                  # Route definition
│   └── assets/                              # Static assets
│       ├── main.css                         # Global styles
│       ├── base.css                         # Base reset styles
│       ├── branding_logo.svg
│       ├── logo.svg
│       └── about-me-photo.png
├── public/                                  # Static files served as-is
├── dist/                                    # Build output (generated)
├── .planning/                               # Documentation (this file)
│   └── codebase/
├── package.json                             # Dependencies, scripts, version
├── tsconfig.json                            # TypeScript project refs
├── tsconfig.app.json                        # App-specific TypeScript config
├── tsconfig.node.json                       # Node-specific TypeScript config
├── tsconfig.vitest.json                     # Test-specific TypeScript config
├── vite.config.ts                           # Vite build config, plugin setup
├── components.d.ts                          # Auto-generated PrimeVue component types (DO NOT EDIT)
├── tailwind.config.js                       # Tailwind CSS config (if present)
└── eslint.config.js                         # ESLint config (if present)
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code
- Contains: Vue components, TypeScript logic, stores, type definitions, assets
- Key files: `main.ts` (entry), `App.vue` (root component)

**`src/router/`:**
- Purpose: Application routing and navigation guards
- Contains: Route definitions, middleware (auth guard)
- Key files: `src/router/index.ts` (single route definition file)

**`src/stores/`:**
- Purpose: Global reactive state management via Pinia
- Contains: Store definitions using Composition API
- Key files: 
  - `src/stores/auth.ts` (active: user auth state)
  - `src/stores/counter.ts` (example, unused)

**`src/views/`:**
- Purpose: Page-level components mapped to routes
- Contains: Views that orchestrate child components and manage page state
- Key files:
  - `src/views/LexTrackView.vue` (primary focus: date picker, three activity sections, save orchestration)
  - `src/views/ProjectsView.vue` (hub listing Larga, LexTrack, MonitoX)

**`src/components/`:**
- Purpose: Reusable UI components
- Contains: Presentational components, dialogs, project-specific feature components
- Subdirectories:
  - `src/components/projects/` (feature projects: lextrack, larga, gift-exchange)
  - `src/components/icons/` (icon SVG components, unused)

**`src/components/projects/lextrack/`:**
- Purpose: LexTrack project-specific components
- Contains: Views for activity management (meetings, tasks, supports)
- Key files:
  - `ActivityCard.vue` (generic activity list renderer, used 3x in LexTrackView)
  - `ManageMeeting.vue`, `ManageTask.vue`, `ManageSupport.vue` (edit dialogs)
  - `AddMeeting.vue` (add dialog, currently unused in LexTrackView)
  - `LexTrackApp.vue` (alternative implementation, not in use)

**`src/lib/pocketbase/`:**
- Purpose: Backend integration layer
- Contains: PocketBase client, entity mappers
- Key files:
  - `src/lib/pocketbase/index.ts` (singleton `pb` export, initialized with VITE_API_BASE_URL)
  - `dsuMeetingMapper.ts`, `dsuTaskMapper.ts`, `dsuSupportMapper.ts` (transform entities for updates)

**`src/types/lextrack/`:**
- Purpose: TypeScript type definitions for LexTrack entities
- Contains: Domain model interfaces extending PocketBase RecordModel
- Structure: One subdirectory per entity (dsu_meetings, dsu_tasks, dsu_supports)
- Key files:
  - Each `types.d.ts` defines `Dsu<Entity>` (full record) and `AddDsu<Entity>` (create/update payload)

**`src/constants/`:**
- Purpose: Application-wide constants
- Contains: Route constants (route-3.ts, route-10.ts)
- Current use: Minimal; route definitions are in router/index.ts

**`src/assets/`:**
- Purpose: Static images, logos, CSS
- Contains: SVG branding, photo assets, global styles

## Key File Locations

**Entry Points:**
- `src/main.ts`: App creation, plugin initialization (Pinia, Router, PrimeVue)
- `src/App.vue`: Root component (navbar, router outlet)
- `src/router/index.ts`: Route definitions and auth guard
- `index.html`: HTML entry point (not shown, generated by Vite)

**Configuration:**
- `package.json`: Dependencies, scripts, Node engines
- `vite.config.ts`: Build setup, plugin config (Vue, unplugin-vue-components, Tailwind)
- `tsconfig.json`: TypeScript configuration references
- `tsconfig.app.json`: App source TypeScript settings (target, module, lib, etc.)

**Core Logic (LexTrack Focus):**
- `src/views/LexTrackView.vue`: Main orchestrator
  - Date selection, activity fetching, dialog coordination, save logic
  - 162 lines: refs for meetings/tasks/supports, watchers, save function
  - Depends on: `pb` client, three mapper functions, three type imports
- `src/lib/pocketbase/index.ts`: PocketBase singleton
  - Single line export: `export const pb = new PocketBase(baseUrl)`
  - Initialized once, shared across app
- `src/lib/pocketbase/dsu*Mapper.ts`: Entity transformations
  - Each mapper: 1 exported function taking full entity, returning updatable fields only

**State Management:**
- `src/stores/auth.ts`: Authentication
  - Uses PocketBase authStore reactively
  - Exports: `useAuthStore()` with `user`, `isLoggedIn`, `login()`, `logout()`

**Type Contracts:**
- `src/types/lextrack/dsu_meetings/types.d.ts`: `DsuMeetings`, `AddDsuMeeting`
- `src/types/lextrack/dsu_tasks/types.d.ts`: `DsuTasks`, `AddDsuTask`
- `src/types/lextrack/dsu_supports/types.d.ts`: `DsuSupports`, `AddDsuSupport`

**Components:**
- `src/components/projects/lextrack/ActivityCard.vue`: Generic list renderer
  - Accepts v-model array of `SectionItem` (union type)
  - Emits: `update(index)`, `remove(index)`
- `src/components/projects/lextrack/ManageMeeting.vue`: Meeting editor dialog
- `src/components/projects/lextrack/ManageTask.vue`: Task editor dialog
- `src/components/projects/lextrack/ManageSupport.vue`: Support editor dialog

**Testing:**
- Not visible in structure; vitest configured in package.json scripts but no test files found

**Generated Files:**
- `components.d.ts`: Auto-generated by unplugin-vue-components (lists all PrimeVue component types)
- `dist/`: Build output (generated on build, includes 404.html copy)

## Naming Conventions

**Files:**
- Vue components: PascalCase (e.g., `ActivityCard.vue`, `LexTrackView.vue`)
- TypeScript utilities: camelCase (e.g., `dsuMeetingMapper.ts`)
- Type definition files: `types.d.ts` (convention for .d.ts type-only files)
- Stores: camelCase + `.ts` (e.g., `auth.ts`, `counter.ts`)
- Styles: scoped `<style scoped>` in components; global CSS in `src/assets/main.css`

**Directories:**
- Project features: kebab-case (e.g., `gift-exchange`, `lextrack`, `larga`)
- Entity folders: snake_case matching PocketBase collection names (e.g., `dsu_meetings`, `dsu_tasks`, `dsu_supports`)
- Functional folders: camelCase (e.g., `pocketbase`, `routes`)

**Variables & Functions:**
- Components: PascalCase in imports/type names (e.g., `ActivityCard`, `DsuMeetings`)
- Instance properties: camelCase (e.g., `selectedDate`, `isNoEntry`, `viewMeetingDialogVisibility`)
- Functions: camelCase (e.g., `updateMeeting()`, `removeMeeting()`, `mapToUpdateMeeting()`)
- Constants: UPPER_SNAKE_CASE (e.g., in routes/index.ts, though minimal usage)

**Types:**
- Interfaces: PascalCase prefixed with domain (e.g., `DsuMeetings`, `AddDsuMeeting`)
- Union types: lowercase (e.g., `SectionItem = AddDsuMeeting | AddDsuSupport | AddDsuTask`)
- Generic model types: Extend from `RecordModel` (PocketBase convention)

## Where to Add New Code

**New LexTrack Feature (New Activity Type):**
1. Type definition: Create `src/types/lextrack/dsu_<entity>/types.d.ts`
   - Define `Dsu<Entity> extends RecordModel` with fields
   - Define `AddDsu<Entity> = Omit<Dsu<Entity>, 'id' | 'created' | 'updated'>`
2. Mapper: Create `src/lib/pocketbase/dsu<Entity>Mapper.ts`
   - Export `mapToUpdate<Entity>(entity: Dsu<Entity>): { /* updatable fields */ }`
3. Dialog component: Create `src/components/projects/lextrack/Manage<Entity>.vue`
   - Accept `visible` and `entity` v-model
   - Use PrimeVue form controls matching entity fields
4. Update LexTrackView.vue:
   - Import type and mapper
   - Add refs for `<entity>.value` and `view<Entity>DialogVisibility.value`
   - Add update/remove functions
   - Add ActivityCard in template with new section
   - Add save loop for the new collection

**New Component (Generic or Project-Specific):**
- Generic UI: `src/components/<ComponentName>.vue`
- Project-specific: `src/components/projects/<project-name>/<ComponentName>.vue`
- Will be auto-imported if using PrimeVue components via unplugin-vue-components
- Manual import required for custom components

**New Page/Route:**
1. Create view component: `src/views/<FeatureName>View.vue`
2. Add route in `src/router/index.ts`:
   ```typescript
   {
     path: '/path',
     name: 'name',
     component: () => import('@/views/<FeatureName>View.vue'),
     meta: { requiresAuth: true } // if protected
   }
   ```
3. Add navigation link in `CustomNavBar.vue` or `ProjectsView.vue`

**New Store:**
1. Create `src/stores/<feature>.ts` using Composition API pattern:
   ```typescript
   export const use<Feature>Store = defineStore('<feature>', () => {
     const state = ref(initialValue)
     const computed = computed(() => derived)
     function action() { /* ... */ }
     return { state, computed, action }
   })
   ```
2. Use in components: `const store = use<Feature>Store()`

**Utilities / Helper Functions:**
- PocketBase mappers: `src/lib/pocketbase/<entity>Mapper.ts`
- Custom composables: Create `src/composables/<feature>.ts` (not currently used)
- Global constants: Add to `src/constants/<domain>/`

**Tests:**
- Unit tests: Co-locate with source or in `src/**/*.spec.ts` / `src/**/*.test.ts`
- Config: `vitest` configured in `vite.config.ts` and `tsconfig.vitest.json`
- Run: `npm run test:unit` (watch), `npm run test:unit -- --coverage`

## Special Directories

**`src/components/projects/`:**
- Purpose: Feature projects with isolated namespaces
- Generated: No
- Committed: Yes
- Structure: Each project gets subdirectory (lextrack, larga, gift-exchange) with independent components
- Note: LexTrack is the primary focus; other projects serve as separate features

**`components.d.ts` (generated):**
- Purpose: Type definitions for auto-imported PrimeVue components
- Generated: Yes (by unplugin-vue-components on build/dev)
- Committed: Should NOT be committed (add to .gitignore if not already)
- Update: Automatic when components are used in templates

**`dist/` (build output):**
- Purpose: Built application for deployment
- Generated: Yes (by `vite build`)
- Committed: No (add to .gitignore)
- Special: Build script copies `dist/index.html` to `dist/404.html` for GitHub Pages SPA routing

**`.planning/codebase/` (documentation):**
- Purpose: Architecture and structure documentation
- Generated: No (manual or via GSD commands)
- Committed: Yes
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

## Path Aliases

**`@/*` → `src/*`:**
- Configured in `vite.config.ts`: `alias: { '@': './src' }`
- Used throughout for clean imports: `import ActivityCard from "@/components/..."`
- Applies to both `.ts` and `.vue` files

---

*Structure analysis: 2026-04-28*
