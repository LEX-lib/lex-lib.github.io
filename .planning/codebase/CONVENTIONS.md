# Coding Conventions

**Analysis Date:** 2026-04-28

## Naming Patterns

**Files:**
- Vue components: PascalCase (e.g., `ActivityCard.vue`, `CustomNavBar.vue`, `ManageMeeting.vue`)
- TypeScript files: camelCase or PascalCase depending on context (e.g., `dsuMeetingMapper.ts`, `index.ts`)
- Type definition files: `types.d.ts` suffix (e.g., `dsu_meetings/types.d.ts`)
- Store files: camelCase (e.g., `auth.ts`, `counter.ts`)
- Mapper files: camelCase with Mapper suffix (e.g., `dsuMeetingMapper.ts`, `dsuTaskMapper.ts`)

**Functions:**
- camelCase for all functions and methods (e.g., `toggleDarkMode`, `hideInputGroup`, `updateMeeting`, `mapToUpdateMeeting`)
- Event handlers use camelCase prefixed with action verb (e.g., `removeSupport`, `updateTask`, `removeTask`)
- Private/internal functions follow same camelCase convention

**Variables:**
- camelCase for all variables, refs, and computed properties (e.g., `selectedDate`, `viewMeetingDialogVisibility`, `support`, `meetings`)
- Descriptive names preferred: `viewMeetingDialogVisibility` over `dialog`
- Boolean refs include descriptive prefix: `viewSupportDialogVisibility`, `showInputGroup`

**Types:**
- PascalCase for interfaces and types (e.g., `DsuMeetings`, `AddDsuMeeting`, `SectionItem`)
- Union types defined inline or with descriptive PascalCase names
- Type utility patterns: `Add` prefix for creation types (e.g., `AddDsuMeeting`, `AddDsuTask`, `AddDsuSupport`)
- Omit pattern used for derived types: `Omit<DsuMeetings, 'id' | 'created' | 'updated'>`

## Code Style

**Formatting:**
- Prettier version 3.6.2 with @prettier/plugin-oxc
- No explicit `.prettierrc` file; uses Prettier defaults
- Prettier runs on `src/` directory only: `prettier --write src/`
- Formatting enforced via lint script

**Linting:**
- Two-stage lint pipeline:
  1. **oxlint** (v1.8.0): Runs first with `-D correctness` flag (strict correctness rules only)
     - Command: `oxlint . --fix -D correctness --ignore-path .gitignore`
  2. **eslint** (v9.31.0): Runs second for Vue/TypeScript rules
     - Command: `eslint . --fix`
- Both linters run in fix mode
- eslint-plugin-vue v10.3.0 for Vue 3 specific rules
- eslint-plugin-oxlint v1.8.0 integrates oxlint rules into ESLint
- @vitest/eslint-plugin for test file patterns

**Combined lint command:**
```bash
npm run lint          # Runs: run-s lint:oxlint lint:eslint
npm run lint:oxlint   # oxlint . --fix -D correctness --ignore-path .gitignore
npm run lint:eslint   # eslint . --fix
npm run format        # prettier --write src/
```

## Import Organization

**Order:**
1. Vue framework imports (`import { ... } from 'vue'`)
2. External libraries (`pinia`, `vue-router`, `lodash-es`, etc.)
3. PrimeVue and UI component imports
4. Type imports (`import type { ... }`)
5. Local imports using `@/` alias (`@/components`, `@/stores`, `@/lib`, `@/types`)
6. Relative imports (rarely used; `@/` alias preferred)

**Examples from codebase:**
```typescript
// From LexTrackView.vue
import { computed, ref, watch } from 'vue'
import { remove, isEmpty } from 'lodash-es'
import ActivityCard from "@/components/projects/lextrack/ActivityCard.vue"
import type { AddDsuTask, DsuTasks } from "@/types/lextrack/dsu_tasks/types"
import { pb } from '@/lib/pocketbase'
```

**Path Aliases:**
- `@/` → `./src/` (configured in `tsconfig.app.json` and `vite.config.ts`)
- Used consistently across all files; relative paths avoided

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (e.g., `pb.collection(...).getFullList()`)
- Promise.all for concurrent async operations with type safety
- Type guards for runtime checks: `if (event instanceof KeyboardEvent)`, `if (typeof redirectRaw === 'string')`
- Console logging for debugging (appears throughout; not error boundary focused)
- Error propagation in auth flow: login errors caught and logged to console

**Examples:**
```typescript
// From Login.vue
try {
  await auth.login(values.email, values.password)
  await router.replace(target)
} catch (error) {
  console.error('Login failed:', error)
}

// From LexTrackView.vue
const [supportsList, tasksList, meetingsList] = await Promise.all([
  pb.collection('dsu_supports').getFullList<DsuSupports>(options),
  pb.collection('dsu_tasks').getFullList<DsuTasks>(options),
  pb.collection('dsu_meetings').getFullList<DsuMeetings>(options)
])
```

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- `console.log()` for debug output (scattered throughout components)
- `console.error()` for error tracking in try-catch blocks
- Toast notifications for user feedback: `toast.success('Meeting is updated successfully!')` from vue-sonner
- Commented-out console logs indicate removed debug statements

## Comments

**When to Comment:**
- Section separators for logical groupings (e.g., `/** SUPPORTS */`, `/** MEETINGS */`, `/** TASKS */`)
- Inline comments for complex logic (sparse in current codebase)
- JSDoc-style comments not enforced; minimal in practice

**JSDoc/TSDoc:**
- Not used in current codebase
- Type hints via TypeScript provide most documentation

## Function Design

**Size:**
- Functions typically 3-20 lines
- Larger functions break logic into sections with comments
- Event handlers often single-line when simple: `const edit = (index: number) => emit('update', index)`

**Parameters:**
- Typed parameters required in TypeScript files
- Union types acceptable: `SectionItem = AddDsuMeeting | AddDsuSupport | AddDsuTask`
- Destructuring common for complex objects

**Return Values:**
- Explicit return types in function signatures
- Mapper functions return shaped objects: `{ title, duration_minutes?, description? }`
- Void functions used for mutations and event emission

## Module Design

**Exports:**
- Named exports for utilities and mappers: `export function mapToUpdateMeeting(...)`
- Default export for Vue components: `export default component`
- Pinia store: `export const useAuthStore = defineStore(...)`

**Barrel Files:**
- Used for route organization: `src/constants/routes/index.ts` re-exports from `route-3.ts` and `route-10.ts`
- Not heavily used for component organization (individual imports preferred)

## Vue 3 Composition API Patterns

**Script Setup:**
- `<script setup lang="ts">` used exclusively
- Composable pattern leveraged with `defineStore` (Pinia)
- No setup function; all reactive state at top level

**Reactive State:**
- `ref<T>()` for primitive and complex types: `ref(new Date())`, `ref<DsuSupportItem[]>([])`
- `computed()` for derived state: `computed(() => isEmpty(meetings.value) && ...)`
- `watch()` for side effects with proper async handling

**Component Communication:**
- `defineModel()` for two-way binding: `const visible = defineModel('visible', { ... })`
- `defineProps()` with TypeScript generics: `defineProps<{ label: string }>()`
- `defineEmits()` with typed tuples: `defineEmits<{ update: [index: number]; remove: [index: number] }>()`
- v-model directives for nested component state

**Examples:**
```typescript
// From ActivityCard.vue
const section = defineModel<SectionItem[]>('section', { required: true })
defineProps<{ label: string }>()
const emit = defineEmits<{
  update: [index: number]
  remove: [index: number]
}>()

// From ManageMeeting.vue
const visible = defineModel('visible', {
  type: Boolean,
  default: false,
  required: true,
})
const meeting = defineModel<AddDsuMeeting>('meeting', { required: true })
```

## PrimeVue Component Usage

- Components auto-imported via unplugin-vue-components with PrimeVueResolver
- No manual import statements required for PrimeVue components
- Components declared in template immediately available
- Icon element (iconify-icon) registered as custom element in `vite.config.ts`

## TypeScript Configuration

**Strict Mode:**
- TypeScript 5.8.0
- Strict type checking enforced across app and vitest configs
- `@vue/tsconfig` base config with DOM libs
- Path alias `@/*` maps to `./src/*`

---

*Convention analysis: 2026-04-28*
