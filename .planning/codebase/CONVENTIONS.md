# Coding Conventions

**Analysis Date:** 2026-05-10

## Naming Patterns

**Files:**
- Vue SFCs use **PascalCase**: `CustomNavBar.vue`, `LexTrackView.vue`, `ManageTask.vue`, `ActivityCard.vue`
- TypeScript modules use **camelCase**: `auth.ts`, `counter.ts`, `dsuTaskMapper.ts`, `dsuMeetingMapper.ts`
- Type declarations live at `src/types/<feature>/<entity>/types.d.ts` (e.g. `src/types/lextrack/dsu_tasks/types.d.ts`)
- Route constant files use kebab-case with numeric suffixes: `route-3.ts`, `route-10.ts`
- PocketBase-collection folders use **snake_case** to mirror the backend table: `src/types/lextrack/dsu_tasks/`, `dsu_meetings/`, `dsu_supports/`
- Mini-app feature folders use **kebab-case**: `src/components/projects/api-playground/`, `gift-exchange/`, `lextrack/`, `larga/`
- Barrel `index.ts` is used in `src/router/`, `src/lib/pocketbase/`, `src/constants/routes/`

**Functions / Methods:**
- **camelCase** verbs: `validateLobby`, `fetchStats`, `mapToUpdateTask`, `removeMeeting`, `scrollToAboutMe`
- Action handlers in views are `addX`/`updateX`/`removeX`/`editX` (`src/views/LexTrackView.vue:37-91`)
- Mappers follow `mapTo<Action><Entity>`: `mapToUpdateTask`, `mapToUpdateMeeting`, `mapToUpdateSupport` (`src/lib/pocketbase/dsuTaskMapper.ts:4`)

**Variables / Refs:**
- **camelCase** for `ref`/`reactive`/`computed`: `selectedDate`, `viewTaskDialogVisibility`, `responseStatus`
- Boolean refs use `is*` / `has*` / `show*` / `loading` prefixes: `isLoading`, `isSaving`, `isCollectionsLoading`, `isEnrolled`, `showSidebar`, `showSaveModal`, `lobbyValidated`

**Types / Interfaces:**
- **PascalCase** with no `I` prefix: `Project`, `KeyValueRow`, `DsuTasks`, `AddDsuTask`, `SectionItem`
- "Create" payload types use the `Add<Entity>` shape via `Omit<Entity, "id" | "created" | "updated">` (`src/types/lextrack/dsu_tasks/types.d.ts:12`)
- Union literal types: `type HttpMethod = "GET" | "POST" | ...`, `type AuthType = "none" | "basic" | "bearer"` (`src/components/projects/api-playground/ApiPlaygroundApp.vue:18-27`)

**Constants:**
- Route name strings are **kebab-case** in `src/router/index.ts`: `"gift-exchange-join"`, `"api-playground"`
- PocketBase collection identifiers are **snake_case** matching backend: `pb.collection("dsu_tasks")`, `pb.collection("gift_exchange_participants")`

## Code Style

**Formatting:**
- **Prettier 3.6.2** with `@prettier/plugin-oxc`. No `.prettierrc.*` is checked in, so defaults apply: 2-space indent, double quotes (observed throughout), semicolons, trailing commas (Prettier v3 default `all`)
- Run `npm run format` to format `src/`
- ESLint defers formatting to Prettier via `@vue/eslint-config-prettier/skip-formatting` (`eslint.config.ts:9,38`)

**Linting:**
- **oxlint ~1.8.0** runs first: `oxlint . --fix -D correctness --ignore-path .gitignore`
- **ESLint 9** (flat config in `eslint.config.ts`) composes:
  - `pluginVue.configs["flat/essential"]`
  - `vueTsConfigs.recommended`
  - `pluginVitest.configs.recommended` scoped to `src/**/__tests__/*`
  - `pluginOxlint.configs["flat/recommended"]` (avoids double-flagging)
  - `skipFormatting`
- `npm run lint` chains both via `run-s lint:*`
- Globally ignored: `**/dist/**`, `**/dist-ssr/**`, `**/coverage/**`, `assets/*.js`, `assets/*.css`
- Per-file disables (top-of-file): `<!-- eslint-disable vue/multi-word-component-names -->` (`src/components/Login.vue:1`); `<!-- eslint-disable @typescript-eslint/no-explicit-any -->` (`ApiPlaygroundApp.vue:1`, `GiftExchangeJoin.vue:1`)

**TypeScript Strictness:**
- `tsconfig.app.json` extends `@vue/tsconfig/tsconfig.dom.json` (which enables `strict: true` and DOM lib) and excludes tests
- `tsconfig.vitest.json` extends app config, includes only `src/**/__tests__/*`, adds `node` + `jsdom` types
- Path alias `"@/*": ["./src/*"]` defined in both `tsconfig.app.json:8-10` and `vite.config.ts:27-29`
- `npm run type-check` -> `vue-tsc --build`; `npm run build` runs type-check + build-only in parallel via `run-p`

## Import Organization

**Order observed (consistent, not enforced by rule):**
1. Vue / framework: `import { ref, computed, watch } from "vue"`
2. Third-party: `import dayjs from "dayjs"`, `import { remove, isEmpty } from "lodash-es"`, `import { toast } from "vue-sonner"`, `import axios, { type AxiosError } from "axios"`
3. Internal absolute imports via `@/`: `import { pb } from "@/lib/pocketbase"`, `import { useAuthStore } from "@/stores/auth"`
4. Component imports (`@/`): `import ManageTask from "@/components/projects/lextrack/ManageTask.vue"`
5. `import type` is used for type-only imports and is freely interleaved next to the related runtime import

**Path Aliases:**
- One alias only: `@` -> `./src`
- Inconsistency: some `lib/pocketbase` imports include the `.ts` extension (`src/views/LexTrackView.vue:20-22`). Standardize on omitting the extension.

**Auto-imported (no explicit import needed):**
- All PrimeVue components via `unplugin-vue-components` + `PrimeVueResolver()` (`vite.config.ts:21-23`); types in `components.d.ts` at repo root. Use `<Button>`, `<Dialog>`, `<DatePicker>`, `<InputText>`, `<Menubar>`, `<Avatar>`, `<Card>`, `<Tag>`, `<Form>` directly.
- Custom app components are also auto-resolved (see `components.d.ts:14-57`), though most files still `import` them explicitly for clarity.

## Vue 3 Component Patterns

**Script Setup:**
- 100% of SFCs use `<script setup lang="ts">` (no Options API, no `defineComponent`)
- `defineProps<{}>()` generic form: `defineProps<{ label: string }>()` (`src/components/projects/lextrack/ActivityCard.vue:12`)
- `defineEmits<{}>()` tuple-style: `defineEmits<{ update: [index: number]; remove: [index: number] }>()` (`ActivityCard.vue:16-19`)
- `defineModel<T>(name, options)` for two-way bindings, with `required: true` and explicit defaults (`ManageTask.vue:5-13`, `ActivityCard.vue:10`). Parents bind via `v-model:section`, `v-model:visible`, `v-model:task` (`src/views/LexTrackView.vue:192-272`)

**Reactivity:**
- Prefer `ref` for primitives, arrays, and form state. `reactive` reserved for grouped object form state (`Login.vue:41-44` `initialValues`)
- `computed` for derived state: `isLoggedIn`, `methodColor`, `avatarImage`, `isNoEntry`
- `watch` callbacks are explicitly typed: `watch(selectedDate, async (newDate: Date) => { ... })` (`LexTrackView.vue:99`)
- Lifecycle: only `onMounted` is used

**Custom Element Allowlist:**
- `iconify-icon` is registered via Vue compiler option in `vite.config.ts:14-18`. Use as `<iconify-icon icon="mdi:home" width="24" height="24"></iconify-icon>`

## Error Handling

```ts
// src/components/projects/gift-exchange/GiftExchangeJoin.vue:23-56
loading.value = true;
try {
  const records = await pb.collection("lobbies").getFullList({ filter: ... });
  if (records.length === 0) { toast.error("Invalid lobby code"); return; }
  toast.success(`Joined lobby: ${lobby.value.lobby_name}`);
} catch (e: any) {
  toast.error("Error validating lobby: " + e.message);
} finally {
  loading.value = false;
}
```
- Async ops wrap in `try / catch / finally`. Surface errors to the user via `toast.error(...)`; log diagnostics with `console.error`.
- Error variables are typed `: any` with file-level `// eslint-disable @typescript-eslint/no-explicit-any`. Prefer narrowing via `instanceof Error`/type guard for new code.
- `Login.vue:35-38` only `console.error`s on failure (no toast) — pattern to standardize is toast + log.
- No global error handler / Pinia error store; each component handles its own failures.

**Validation (Zod 4 + PrimeVue Forms):**
```ts
// src/components/Login.vue:46-56
const resolver = ref(zodResolver(z.object({
  email: z.email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  password: z.string().min(1, { message: "Password is required." }),
})));
```
Submit handlers receive `FormSubmitEvent` from `@primevue/forms` and short-circuit on `!valid` (`Login.vue:16-17`).

## Logging

- `console.*` only — no logger abstraction.
- Pattern: `console.error("Login failed:", error)` for caught errors; `console.error("Error fetching stats", e)` for non-blocking background fetches (`GiftExchangeJoin.vue:71`).
- Many `console.log` debug calls are commented out (e.g., `LexTrackView.vue:83,100,124,164`) — remove rather than comment out before merging.
- Recommended pattern for env-gated dev logs is shown in `src/main.ts:16-23` (`if (import.meta.env.DEV) { console.info(...) }`).

## User Notifications

- `<Toaster />` mounted once in `src/App.vue:9`; CSS imported in `src/main.ts:12` (`import "vue-sonner/style.css"`)
- Usage: `import { toast } from "vue-sonner"` then `toast.success(msg)` / `toast.error(msg)`
- Used in `ApiPlaygroundApp.vue`, `GiftExchange*.vue`, `lextrack/Manage*.vue`, `lextrack/AddMeeting.vue`

## Dates and Utilities

- **dayjs** for all date formatting. Format PocketBase date filters and payloads as `"YYYY-MM-DD"`:
  ```ts
  // src/views/LexTrackView.vue:104,135
  filter: `date ~ "${dayjs(newDate).format("YYYY-MM-DD")}"`
  item.date = dayjs(selectedDate.value).format("YYYY-MM-DD");
  ```
  Avoid `new Date().toISOString().split("T")[0]` (legacy in `LexTrackApp.vue:84` and initial state of `LexTrackView.vue:31`).
- **lodash-es** named imports only (never default), to keep tree-shaking working: `import { remove, isEmpty } from "lodash-es"` (`LexTrackView.vue:3`).

## HTML Sanitization

When binding user-supplied HTML (Quill output) via `v-html`, always wrap with **DOMPurify**:
```ts
// src/components/projects/lextrack/LexTrackApp.vue:3-5
import DOMPurify from "dompurify";
const sanitize = (html: string) => DOMPurify.sanitize(html);
```
Template: `<div v-html="sanitize(task.description)"></div>`. Never bind raw user HTML.

## Styling

**Tailwind CSS 4:**
- Imported in `src/assets/base.css` (`@import "tailwindcss"`) and registered as Vite plugin (`vite.config.ts:8,24`)
- Brand design tokens exposed via `@theme` in `src/assets/base.css:3-27` — `--color-brand-primary` (`#002244`), `--color-brand-accent` (`#e89820`), `--color-surface-card`, `--color-typo-heading`, etc.
- Reference tokens via Tailwind utilities (`bg-surface-card`, `border-surface-divider`) **or** inline `style="color: var(--color-typo-heading)"` for one-offs (used heavily in `ProjectsView.vue`, `AboutMeSection.vue`, `HeroSection.vue`)

**Dark theme:**
- PrimeVue `darkModeSelector: ".my-app-dark"` in `src/main.ts:88`. Toggle this class on a root element to switch PrimeVue components into dark mode.

**Scoped styles:** Use `<style scoped>` for gradients, complex hover/transition effects, or PrimeVue overrides; keep utilities first.

**PrimeVue overrides:**
- Prefer the `pt` (pass-through) prop per-instance: `:pt="{ input: { class: 'w-full ...' } }"` (`LexTrackApp.vue:149-156`, `ManageTask.vue:23`)
- Global theming via `definePreset(Aura, { semantic: { primary: { ... } } })` in `src/main.ts:30-76` — extend the navy/amber preset rather than introducing new colors. Global `pt` defaults applied: `button.root.class = "p-button-sm"` (`src/main.ts:93-99`).

## Animations

`@vueuse/motion` directives applied inline:
```vue
<!-- src/views/ProjectsView.vue:58-62 -->
<div v-motion
  :initial="{ opacity: 0, y: -20 }"
  :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 0.6 } }">
```
Plugin registered via `app.use(MotionPlugin)` (`src/main.ts:101`). Common variants: `:initial`, `:visibleOnce`, with `transition: { duration, delay }`. Stagger lists by multiplying `delay` by `index` (`ProjectsView.vue:95`).

## Module Design

**Pinia stores — setup syntax exclusively:**
```ts
// src/stores/auth.ts
export const useAuthStore = defineStore("auth", () => {
  const user = ref<RecordModel | null>(pb.authStore.record);
  const isLoggedIn = computed(() => !!user.value);
  pb.authStore.onChange(() => { user.value = pb.authStore.record; });
  // ...
  return { user, isLoggedIn, login, logout };
});
```
Bridge external reactive sources (e.g., `pb.authStore.onChange`) inside the store closure.

**Barrel files:** `index.ts` re-exports a small surface area (`src/constants/routes/index.ts`).

**Type-only modules:** Place under `src/types/<feature>/<entity>/types.d.ts`. Export the read shape (extending PocketBase `RecordModel`) and an `Add<Entity>` payload via `Omit`.

## Comments

- Section headers in long components: `// --- STATE MANAGEMENT ---`, `// --- LOGIC ---` (`LexTrackApp.vue:14,53,76`)
- Domain blocks in views/stores use `/** SUPPORTS */` markers (`LexTrackView.vue:26-27,47-48,69-70`)
- Avoid commented-out code; remove or convert into TODOs with a Jira-style reference
- JSDoc/TSDoc not currently used — type signatures + descriptive names carry intent

---

*Convention analysis: 2026-05-10*
