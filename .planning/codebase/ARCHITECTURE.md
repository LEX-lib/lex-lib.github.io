# Architecture

**Analysis Date:** 2026-04-28

## Pattern Overview

**Overall:** Vue 3 SPA with PocketBase Backend Integration

**Key Characteristics:**
- Composition API with TypeScript for type safety
- Centralized state management via Pinia stores
- Client-side routing with Vue Router (auth-gated routes)
- RESTful backend integration with PocketBase SDK
- Component-driven UI using PrimeVue component library (auto-imported via unplugin-vue-components)
- Feature-based project organization within components

## Layers

**View Layer (Routing):**
- Purpose: Entry points for major routes; orchestrate page-level state and component communication
- Location: `src/views/*.vue`
- Contains: View components (HomeView, LexTrackView, ProjectsView, AboutView)
- Depends on: Vue Router, child components, stores, backend client
- Used by: Vue Router (routing system)
- Example: `src/views/LexTrackView.vue` orchestrates three activity sections (meetings, tasks, supports), watches date selection, manages dialogs, and coordinates save operations across all entities

**Component Layer:**
- Purpose: Reusable UI components organized by project/feature
- Location: `src/components/` (generic) and `src/components/projects/<project>/*.vue` (feature-specific)
- Contains: Presentational components, dialog/modal components, activity cards
- Depends on: PrimeVue, Iconify, child components, type definitions
- Used by: Views and other components
- Example: `src/components/projects/lextrack/ActivityCard.vue` is a generic activity section renderer used for meetings, tasks, and supports

**State Management Layer:**
- Purpose: Centralized reactive state and computed properties
- Location: `src/stores/*.ts`
- Contains: Pinia stores using composition API pattern
- Depends on: Pinia, PocketBase client
- Used by: Views and components
- Examples:
  - `src/stores/auth.ts`: User authentication state (login, logout, isLoggedIn computed)
  - `src/stores/counter.ts`: Example store (not actively used in LexTrack)

**Data Access / Integration Layer:**
- Purpose: Backend communication and type mapping
- Location: `src/lib/pocketbase/`
- Contains: PocketBase client instance, entity mappers
- Depends on: PocketBase SDK, type definitions
- Used by: Views and stores
- Example: `src/lib/pocketbase/index.ts` exports singleton `pb` instance; `dsuMeetingMapper.ts`, `dsuTaskMapper.ts`, `dsuSupportMapper.ts` transform API responses for updates

**Type System / Contract Layer:**
- Purpose: Define domain entity contracts and API shape
- Location: `src/types/lextrack/<entity>/types.d.ts`
- Contains: TypeScript interfaces extending PocketBase RecordModel
- Depends on: PocketBase SDK types
- Used by: Components, views, mappers, stores
- Example: `src/types/lextrack/dsu_meetings/types.d.ts` defines `DsuMeetings` (full record) and `AddDsuMeeting` (create/update payload)

**Configuration / Constants Layer:**
- Purpose: Application-wide configuration and route constants
- Location: `src/constants/`, `src/router/`, `src/main.ts`
- Contains: Route definitions, theme presets, environment vars
- Depends on: Vue, PrimeVue
- Used by: Router, app initialization

## Data Flow

**LexTrack Date Selection & Activity Fetch:**

1. User selects date in `LexTrackView.vue` date picker
2. `watch(selectedDate)` fires and constructs PocketBase filter
3. Parallel API calls via `Promise.all()` to fetch three collections:
   - `pb.collection('dsu_supports').getFullList<DsuSupports>()`
   - `pb.collection('dsu_tasks').getFullList<DsuTasks>()`
   - `pb.collection('dsu_meetings').getFullList<DsuMeetings>()`
4. Results populate reactive refs: `supports.value`, `tasks.value`, `meetings.value`
5. Template renders three `ActivityCard` components with v-model binding to each section

**Activity Management (Create/Update/Delete):**

1. User interacts in ActivityCard (add title → create new, edit → dialog, delete → remove)
2. For new item: ActivityCard emits to LexTrackView, pushed to local array
3. For existing item: LexTrackView maps item to dialog (e.g., `ManageMeeting`), manages visibility
4. Dialog component (`ManageTask`, `ManageMeeting`, `ManageSupport`) displays form, v-model binding updates parent
5. On save click: User calls `save()` in LexTrackView
6. Save loop iterates each section:
   - If item has `id`: Call mapper (e.g., `mapToUpdateMeeting()`) → `pb.collection().update(id, mappedData)`
   - If no `id`: Create new entry → `pb.collection().create(item)`, set date

**State Management Flow (Authentication):**

1. `src/stores/auth.ts` wraps PocketBase authStore
2. On app mount/auth change: `user.value` updates from `pb.authStore.record`
3. Router beforeEach guard checks `to.meta.requiresAuth`
4. If route requires auth and `!auth.isLoggedIn`: Redirect to login with return path
5. Login form calls `auth.login(email, password)` which triggers `pb.collection('users').authWithPassword()`
6. PocketBase authStore updates → store reactive refs update → guards allow navigation

## Key Abstractions

**Activity Entity (Meetings, Tasks, Supports):**
- Purpose: Represent day-to-day work items tracked in LexTrack
- Examples: 
  - `src/types/lextrack/dsu_meetings/types.d.ts` → `DsuMeetings` interface
  - `src/types/lextrack/dsu_tasks/types.d.ts` → `DsuTasks` interface
  - `src/types/lextrack/dsu_supports/types.d.ts` → `DsuSupports` interface
- Pattern: Each entity extends PocketBase `RecordModel` and provides:
  - Read-only fields: `id`, `created`, `updated`
  - Core fields: `date` (YYYY-MM-DD), `title`
  - Entity-specific fields: `duration_minutes` (meetings), `jira_link` (tasks), `description` (optional on all)
  - Derived type `AddDsuXxx = Omit<DsuXxx, 'id' | 'created' | 'updated'>` for payloads

**Dialog / Modal Management:**
- Purpose: Edit/update entity details with rich form controls
- Examples: `ManageMeeting.vue`, `ManageTask.vue`, `ManageSupport.vue`, `AddMeeting.vue`
- Pattern: Each dialog:
  - Uses `defineModel('visible', { type: Boolean })` to bind visibility
  - Uses `defineModel('entity', { required: true })` to v-model form data
  - Imports type from `src/types/lextrack/<entity>/`
  - Uses PrimeVue Editor, InputText, InputNumber for rich UX
  - Calls `toast.success()` via vue-sonner on submit

**Activity Card (Generic List/CRUD):**
- Purpose: Render a section of activities with add/edit/remove operations
- Location: `src/components/projects/lextrack/ActivityCard.vue`
- Pattern: Accepts v-model binding to array of `SectionItem` (union of Add types)
- Emits `update(index)` and `remove(index)` events to parent
- Supports quick-add via input group (Enter → append, Esc → dismiss)

**Mapper Functions:**
- Purpose: Transform entity data for PocketBase updates (omit internal fields)
- Examples: `mapToUpdateMeeting()`, `mapToUpdateTask()`, `mapToUpdateSupport()`
- Pattern: Function takes full entity, returns object with only updatable fields
- Ensures `id`, `created`, `updated` never sent to backend

## Entry Points

**Application Root:**
- Location: `src/main.ts`
- Triggers: HTML app div mount
- Responsibilities: 
  - Create Vue app instance
  - Register Pinia, Vue Router, PrimeVue plugins
  - Apply theme preset (Aura theme with Indigo primary color)
  - Mount to DOM

**Router Entry:**
- Location: `src/router/index.ts`
- Triggers: Browser navigation
- Responsibilities:
  - Define all routes (home, login, projects, lextrack, larga, gift-exchange variants)
  - Implement auth guard via `router.beforeEach()` checking `to.meta.requiresAuth`
  - LexTrack route `/projects/lextrack` is auth-gated

**LexTrack View Entry:**
- Location: `src/views/LexTrackView.vue`
- Triggers: Navigation to `/projects/lextrack` (auth required)
- Responsibilities:
  - Initialize date picker with today's date
  - Set up watchers for date changes → API fetches
  - Manage three activity arrays (meetings, tasks, supports) as local refs
  - Manage three dialog visibility states
  - Coordinate save operation across all three collections

**App Shell:**
- Location: `src/App.vue`
- Triggers: Root component mount
- Responsibilities:
  - Render `CustomNavBar` navigation
  - Render `RouterView` for route content
  - Initialize `Toaster` (vue-sonner notifications)
  - Load `SpeedInsights` (Vercel analytics)

## Error Handling

**Strategy:** Toast-based user feedback with implicit error suppression

**Patterns:**
- Success notifications: `toast.success('Meeting is updated successfully!')` in ManageMeeting.vue, etc.
- No explicit error handling: API calls in LexTrackView `save()` and watch handlers lack try/catch
- Auth errors: PocketBase SDK throws, router guard redirects to login on auth failure
- Type safety: TypeScript interfaces catch shape mismatches at compile time

**Risk:** API failures in save/fetch loops will crash silently without user feedback (see CONCERNS.md)

## Cross-Cutting Concerns

**Logging:** 
- Approach: Inline `console.log()` statements (see LexTrackView.vue lines 34, 40, 58, 64, 84, 90)
- No structured logging framework

**Validation:**
- Approach: None implemented at component/view layer
- Type-based: TypeScript interfaces provide compile-time shape validation
- Runtime: PocketBase SDK validates on backend; frontend sends as-is

**Authentication:**
- Approach: Token-based via PocketBase
- Flow: Login form → `auth.login()` → PocketBase authWithPassword → authStore update → reactive store update → router guard allows
- Persistence: PocketBase SDK manages token in localStorage; persists across sessions
- Guard: Router beforeEach checks `auth.isLoggedIn` computed property

**Component Auto-Import:**
- Approach: `unplugin-vue-components` with `PrimeVueResolver()`
- Effect: PrimeVue components (Button, Dialog, Card, InputText, etc.) used without explicit imports
- Generated file: `components.d.ts` (auto-generated, not in repo)
- Convention: Allows clean template code; component availability verified at type-check time

**Theme & Styling:**
- Approach: PrimeVue Aura theme with Indigo primary color customization (src/main.ts)
- CSS Framework: Tailwind CSS v4 with Vite plugin
- Styling: Scoped `<style scoped>` in components + Tailwind classes in templates
- Dark Mode: Built-in PrimeVue dark mode selector `.my-app-dark` (not actively toggled in current code)

---

*Architecture analysis: 2026-04-28*
