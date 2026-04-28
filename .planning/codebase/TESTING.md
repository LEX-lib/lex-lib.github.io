# Testing Patterns

**Analysis Date:** 2026-04-28

## Current State

**No tests currently exist in this codebase.** Test infrastructure is configured but no test files have been written.

## Test Framework

**Runner:**
- Vitest v3.2.4
- Config: `vitest.config.ts`
- Uses jsdom environment for DOM testing
- Merges vite.config.ts settings with test-specific configuration

**Assertion Library:**
- Vitest built-in assertion library (uses expect syntax)

**Run Commands:**
```bash
npm run test:unit                  # Run all unit tests
npm run test:unit -- --watch       # Watch mode
npm run test:unit -- --coverage    # Coverage report
```

**Vitest Configuration:**

From `vitest.config.ts`:
```typescript
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
```

## Test File Organization

**Intended Location:**
- Test files should be placed in `src/**/__tests__/` directories
- ESLint config specifies: `{ ...pluginVitest.configs.recommended, files: ['src/**/__tests__/*'] }`

**Naming Convention:**
- Pattern: `*.test.ts` or `*.spec.ts` (from `.gitignore`: `*.test.ts`, `*.spec.ts` files are gitignored in output)
- Tests should use TypeScript for consistency with source code

**Intended Structure:**
```
src/
├── components/
│   ├── __tests__/
│   │   ├── ActivityCard.test.ts
│   │   └── CustomNavBar.test.ts
│   └── ...
├── stores/
│   ├── __tests__/
│   │   ├── auth.test.ts
│   │   └── counter.test.ts
│   └── ...
└── ...
```

## TypeScript Configuration for Tests

**Test-specific config:** `tsconfig.vitest.json`

```json
{
  "extends": "./tsconfig.app.json",
  "include": ["src/**/__tests__/*", "env.d.ts"],
  "exclude": [],
  "compilerOptions": {
    "lib": [],
    "types": ["node", "jsdom"]
  }
}
```

- Extends app config but overrides libs to include jsdom globals
- Only includes test files (`src/**/__tests__/*`)
- Main tsconfig.app.json excludes tests: `"exclude": ["src/**/__tests__/*"]`

## Recommended Test Patterns

Since no tests exist yet, these are patterns that should be established:

### Vue Component Testing Pattern

For Vue components with Composition API, use `@vue/test-utils`:

```typescript
// Example: src/components/__tests__/ActivityCard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ActivityCard from '@/components/projects/lextrack/ActivityCard.vue'
import type { AddDsuMeeting } from '@/types/lextrack/dsu_meetings/types'

describe('ActivityCard.vue', () => {
  it('renders with label prop', () => {
    const wrapper = mount(ActivityCard, {
      props: {
        label: 'Meetings',
        section: [] as AddDsuMeeting[],
      },
    })
    expect(wrapper.find('.title').text()).toContain('Meetings')
  })

  it('emits update event on edit', async () => {
    const wrapper = mount(ActivityCard, {
      props: {
        label: 'Meetings',
        section: [{ title: 'Test' } as AddDsuMeeting],
      },
    })
    
    await wrapper.find('[data-testid="edit-btn"]').trigger('click')
    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
```

### Pinia Store Testing Pattern

For store functions using Composition API pattern:

```typescript
// Example: src/stores/__tests__/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with no user', () => {
    const auth = useAuthStore()
    expect(auth.isLoggedIn).toBe(false)
  })

  it('updates isLoggedIn on user change', () => {
    const auth = useAuthStore()
    // Mock pb.authStore.record
    expect(auth.isLoggedIn).toBe(false)
  })
})
```

### Mapper Function Testing Pattern

For pure utility functions like mappers:

```typescript
// Example: src/lib/pocketbase/__tests__/dsuMeetingMapper.test.ts
import { describe, it, expect } from 'vitest'
import { mapToUpdateMeeting } from '@/lib/pocketbase/dsuMeetingMapper'
import type { DsuMeetings } from '@/types/lextrack/dsu_meetings/types'

describe('dsuMeetingMapper', () => {
  it('maps DsuMeetings to update payload', () => {
    const meeting: DsuMeetings = {
      id: '1',
      created: '2026-04-28',
      updated: '2026-04-28',
      date: '2026-04-28',
      title: 'Team Sync',
      duration_minutes: 30,
      description: 'Weekly sync',
    }

    const result = mapToUpdateMeeting(meeting)
    
    expect(result).toEqual({
      title: 'Team Sync',
      duration_minutes: 30,
      description: 'Weekly sync',
    })
    expect(result).not.toHaveProperty('id')
  })
})
```

## Mocking

**Framework:** Vitest built-in `vi` utilities

**Patterns for Future Tests:**
- Mock PocketBase collections: `vi.mock('@/lib/pocketbase')`
- Mock router navigation: `vi.mock('vue-router')`
- Mock store methods with `vi.spyOn()`
- Mock async operations with `vi.mocked().mockResolvedValue()`

**What to Mock:**
- External API calls (PocketBase collections)
- Router push/replace operations
- Store mutations and actions

**What NOT to Mock:**
- Internal component logic
- Utility functions (test them directly)
- Vue composition API functions (ref, computed, watch)

## Fixtures and Factories

**Test Data Location:** `src/__tests__/fixtures/` (recommended but not yet created)

**Example Pattern:**

```typescript
// src/__tests__/fixtures/lextrack.ts
import type { DsuMeetings, DsuTasks, DsuSupports } from '@/types/lextrack'

export const createMockMeeting = (overrides?: Partial<DsuMeetings>): DsuMeetings => ({
  id: '1',
  created: '2026-04-28',
  updated: '2026-04-28',
  date: '2026-04-28',
  title: 'Team Sync',
  duration_minutes: 30,
  description: 'Weekly meeting',
  ...overrides,
})

export const mockMeetingsList: DsuMeetings[] = [
  createMockMeeting({ id: '1', title: 'Meeting 1' }),
  createMockMeeting({ id: '2', title: 'Meeting 2' }),
]
```

## Coverage

**Requirements:** Not currently enforced

**View Coverage:**
```bash
npm run test:unit -- --coverage
```

**Recommended Targets:**
- Stores: 80%+ (business logic)
- Utilities/Mappers: 90%+ (pure functions)
- Components: 60%+ (UI testing harder; focus on logic)

## Test Types

**Unit Tests:**
- Scope: Individual functions, stores, mappers
- Approach: Test inputs/outputs in isolation; mock external dependencies
- Examples: `mapToUpdateMeeting`, store functions, utility helpers

**Integration Tests:**
- Scope: Component + store interactions, component + API calls
- Approach: Mock only network layer (PocketBase), test component state flow
- Examples: ActivityCard with store state, LexTrackView with multiple components

**E2E Tests:**
- Not currently set up
- Framework would be Playwright or Cypress if added
- ESLint config excludes `e2e/**` directory

## Patterns in Codebase to Test

### Async State Management (from LexTrackView.vue)

Should test:
- Date watch triggers data fetch
- Promise.all parallel loading
- Type casting safety with generics
- State updates from API responses

```typescript
// Pattern to test:
watch(selectedDate, async (newDate: Date) => {
  const options: RecordFullListOptions = { ... }
  const [supportsList, tasksList, meetingsList] = await Promise.all([
    pb.collection('dsu_supports').getFullList<DsuSupports>(options),
    // ...
  ])
  supports.value = supportsList
  tasks.value = tasksList
  meetings.value = meetingsList
})
```

### Form Validation (from Login.vue)

Should test:
- Zod validation schema
- Form submission with valid/invalid data
- Error message display
- Router redirect on success
- Try-catch error handling

```typescript
// Pattern to test:
const login = async ({ valid, values }: FormSubmitEvent) => {
  if(!valid) return
  try {
    await auth.login(values.email, values.password)
    await router.replace(target)
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

### Two-Way Model Binding (from ActivityCard.vue)

Should test:
- defineModel reactivity
- v-model binding in parent
- Emit events on user action
- Array mutations

```typescript
// Pattern to test:
const section = defineModel<SectionItem[]>('section', { required: true })
const emit = defineEmits<{
  update: [index: number]
  remove: [index: number]
}>()
```

## Setup Instructions for First Tests

1. Create `src/__tests__/` directory for shared fixtures
2. Create component test directory: `src/components/__tests__/`
3. Create store test directory: `src/stores/__tests__/`
4. Create lib test directory: `src/lib/__tests__/`
5. Write tests following patterns above
6. Run `npm run test:unit -- --watch` during development
7. Before commits: `npm run test:unit` and check coverage

---

*Testing analysis: 2026-04-28*
