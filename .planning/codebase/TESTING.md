# Testing Patterns

**Analysis Date:** 2026-05-10

## Test Framework

**Runner:**
- **Vitest 3.2.4** with **jsdom 26**
- Config: `vitest.config.ts` (merged with `vite.config.ts` so all aliases and plugins apply to tests)
  ```ts
  // vitest.config.ts
  export default mergeConfig(viteConfig, defineConfig({
    test: {
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "e2e/**"],
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
  }));
  ```

**Component Testing:**
- `@vue/test-utils ^2.4.6` is installed but no usage exists yet

**Assertion Library:**
- Vitest's built-in `expect` (Chai-compatible)

**Run Commands:**
```bash
npm run test:unit     # Run Vitest in default (watch) mode
npm run type-check    # Type-check tests via tsconfig.vitest.json
```
There are no `--coverage`, `--run`, or `--ui` script aliases yet — pass them inline (`npx vitest run`, `npx vitest --coverage`).

## Current Test Coverage

**No test files currently exist.** A repo-wide search for `*.test.*`, `*.spec.*`, and `__tests__/` directories under `src/` returned zero results. The infrastructure (Vitest, jsdom, `@vue/test-utils`, ESLint Vitest plugin, Vitest tsconfig) is fully wired up and ready, but no specs have been authored.

This is the **highest-leverage gap** in the codebase quality posture. New PRs should establish at least one example test per category (store, mapper, component) to seed conventions.

## Test File Organization (recommended, derived from config)

**Location:** Co-located in `__tests__/` folders next to source. The TS config and ESLint scoping both expect `src/**/__tests__/*`:
```
// tsconfig.vitest.json
"include": ["src/**/__tests__/*", "env.d.ts"]

// eslint.config.ts:35
{ ...pluginVitest.configs.recommended, files: ["src/**/__tests__/*"] }
```

**Naming:** Use `<Subject>.spec.ts` or `<Subject>.test.ts`. Both extensions are picked up by Vitest defaults.

**Layout (recommended):**
```
src/
├── stores/
│   ├── auth.ts
│   └── __tests__/
│       └── auth.spec.ts
├── lib/pocketbase/
│   ├── dsuTaskMapper.ts
│   └── __tests__/
│       └── dsuTaskMapper.spec.ts
└── components/projects/lextrack/
    ├── ActivityCard.vue
    └── __tests__/
        └── ActivityCard.spec.ts
```

End-to-end tests (Playwright/Cypress) would live at `e2e/` at the repo root — already excluded from Vitest in `vitest.config.ts:10`.

## TS Configuration for Tests

`tsconfig.vitest.json` extends the app config and overrides `lib` and `types`:
```json
{
  "extends": "./tsconfig.app.json",
  "include": ["src/**/__tests__/*", "env.d.ts"],
  "exclude": [],
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.vitest.tsbuildinfo",
    "lib": [],
    "types": ["node", "jsdom"]
  }
}
```
Notes:
- `@/*` path alias works in tests (inherited via `tsconfig.app.json` and Vite alias merging)
- Test files are excluded from `tsconfig.app.json` build (`"exclude": ["src/**/__tests__/*"]`), so they only type-check via the vitest project

## Recommended Test Structure

**Suite organization (Vitest globals are NOT auto-injected — import them):**
```ts
// src/stores/__tests__/auth.spec.ts (recommended)
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/stores/auth";

vi.mock("@/lib/pocketbase", () => ({
  pb: {
    authStore: { record: null, onChange: vi.fn(), clear: vi.fn() },
    collection: vi.fn(() => ({ authWithPassword: vi.fn() })),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("starts logged out when authStore.record is null", () => {
    const auth = useAuthStore();
    expect(auth.isLoggedIn).toBe(false);
  });
});
```

## Mocking

**Framework:** Vitest's built-in `vi.fn()` / `vi.mock()` / `vi.spyOn()`.

**What to Mock:**
- PocketBase client (`@/lib/pocketbase`) — never hit a real backend in unit tests
- `vue-sonner`'s `toast` — assert calls with `toast.success`/`toast.error` spies
- `axios` requests in `ApiPlaygroundApp.vue` — mock `axios` directly or use `vi.mock("axios")`
- `vue-router`'s `useRouter`/`useRoute` — provide a minimal stub via `vi.mock("vue-router", ...)` or pass a test router via `mount(..., { global: { plugins: [router] } })`

**What NOT to Mock:**
- Pinia stores under test — drive them via their public API (`auth.login(...)`)
- Pure mappers (`mapToUpdateTask`) — test the actual implementation

**Example for component tests:**
```ts
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing"; // not yet installed; recommend adding
import ActivityCard from "@/components/projects/lextrack/ActivityCard.vue";
```

## Fixtures and Factories

No fixtures yet. Recommended location: `src/__fixtures__/` or co-located `__tests__/fixtures/`. Factories should produce typed payloads matching `Add<Entity>` shapes:
```ts
import type { AddDsuTask } from "@/types/lextrack/dsu_tasks/types";
export const makeAddDsuTask = (overrides: Partial<AddDsuTask> = {}): AddDsuTask => ({
  date: "2026-05-10",
  title: "Sample task",
  jira_link: undefined,
  description: undefined,
  ...overrides,
});
```

## Coverage

- No coverage threshold or `coverage` config in `vitest.config.ts` currently
- ESLint already ignores `**/coverage/**` (`eslint.config.ts:25`), so generating reports won't cause lint noise
- Recommended: install `@vitest/coverage-v8` and add an `npm run test:coverage` script targeting `npx vitest run --coverage`

## Test Types (target distribution)

**Unit:**
- `src/lib/pocketbase/*Mapper.ts` — pure functions, easy wins
- `src/stores/*.ts` — Pinia setup stores with mocked `pb`
- Helpers like `sanitize()` if extracted from `LexTrackApp.vue`

**Component:**
- Modal components (`ManageTask.vue`, `ManageMeeting.vue`, `ManageSupport.vue`) — test `defineModel` two-way binding and toast emission
- `ActivityCard.vue` — emit assertions for `update` / `remove` events, keyboard handler in `hideInputGroup`
- `Login.vue` — Zod resolver short-circuits on invalid form, redirect query handling

**Integration / View:**
- `LexTrackView.vue` `watch(selectedDate)` triggers `Promise.all` against three mocked PocketBase collections
- Router auth guard (`src/router/index.ts:70-79`) — redirects to `/login` when `auth.isLoggedIn` is false

**E2E:** Not present. Excluded from Vitest by `exclude: [...configDefaults.exclude, "e2e/**"]`.

## Common Patterns to Adopt

**Async testing:**
```ts
it("loads activities for a date", async () => {
  const view = mount(LexTrackView);
  await flushPromises();
  expect(view.findAllComponents(ActivityCard)).toHaveLength(3);
});
```

**Error testing:**
```ts
it("toasts on failed lobby validation", async () => {
  const toastSpy = vi.spyOn(toast, "error");
  // ... trigger validateLobby with no code
  expect(toastSpy).toHaveBeenCalledWith("Please enter a lobby code");
});
```

**Vitest ESLint plugin scoping:**
- The Vitest plugin is only active inside `src/**/__tests__/*` (`eslint.config.ts:34-36`). Keep test helpers within this glob, or extend the scoping if extracting test utilities elsewhere.

---

*Testing analysis: 2026-05-10*
