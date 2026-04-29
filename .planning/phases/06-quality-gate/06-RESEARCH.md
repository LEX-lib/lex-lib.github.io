# Phase 6: Quality Gate - Research

**Researched:** 2026-04-29
**Domain:** Vitest + @vue/test-utils + jsdom — unit and component testing for Vue 3 / TypeScript / PrimeVue / PocketBase
**Confidence:** HIGH (all major claims verified via official docs or live codebase inspection)

---

## Summary

Phase 6 introduces the first Vitest test suite for LexTrack. Zero tests exist today — the phase directory is empty and `vitest run` exits with code 1 ("No test files found"). The test infrastructure is already installed (`vitest ^3.2.4`, `@vue/test-utils ^2.4.6`, `jsdom ^26.1.0`) but has never been used. The `npm run test:unit` script currently launches Vitest in watch mode, which is the default for a non-CI terminal; this must be addressed for QA-04.

The two hardest problems in this phase are: (1) PrimeVue components are not auto-resolved in Vitest (the `unplugin-vue-components` resolver only runs inside Vite's build pipeline), so every test file that mounts a component using PrimeVue's Dialog, InputText, etc. must stub or manually import those components; and (2) PocketBase's singleton `pb` export must be `vi.mock`-ed before any test that calls `loadForDate`, `saveItem`, `setDayStatus`, etc. A carefully crafted test helper/setup file prevents both issues from boiling into per-file boilerplate.

The unit-only targets (mapper functions, `useDurationField`, `buildExportString`, `stripHtml`, `DSU_DAY_STATUS_VALUES`) are pure TypeScript with no Vue lifecycle dependencies. These are the easiest tests to write and should be delivered first. Component tests for `LexTrackView.vue` are the most complex due to the three-plugin requirement (PrimeVue + Pinia + router) and the `onMounted` PocketBase call, but the verified `flushPromises()` pattern covers this cleanly.

**Primary recommendation:** Write tests in `src/**/__tests__/` co-located with source. Start with mapper + composable unit tests (no stubs needed), then ActivityCard component tests (no PB calls, one plugin), then Manage* dialogs (no PB calls, one plugin), and finally LexTrackView (full plugin stack + PB mock).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QA-01 | Vitest unit tests cover mappers, duration converter, day-status logic, exporter | Mapper functions are pure TS — direct invocation pattern, no setup needed. `useDurationField` is a simple composable (no lifecycle hooks) — also direct invocation. `buildExportString`/`stripHtml` are plain functions embedded in `LexTrackView.vue`; extract to a module or test via component exposure. |
| QA-02 | Vitest component tests cover LexTrackView (initial load, date change, save, delete, day status), ActivityCard (add via Enter, edit, remove), three Manage* dialogs (per-item save) | All require `mount()` with global plugins; LexTrackView additionally requires `vi.mock('@/lib/pocketbase')` and `flushPromises()` after mount for the `onMounted` call. Manage* dialogs are the simplest component tests (no PB calls, no router). |
| QA-03 | `npm run lint` and `npm run type-check` pass cleanly | Both currently pass (verified). New test files must use `@vitest/eslint-plugin` patterns; existing eslint config already covers `src/**/__tests__/*`. |
| QA-04 | `npm run test:unit` runs in CI-friendly fashion | Current script is `"vitest"` (watch mode). Fix: change to `"vitest run"` or add a separate `test:unit:run` script. Vitest auto-detects CI env (`process.env.CI`) and falls back to run mode, but explicit `vitest run` is safer. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mapper unit tests | TypeScript module layer | — | Pure functions, no Vue/browser APIs needed |
| Composable unit tests | TypeScript module layer | Vue reactivity (ref/computed) | `useDurationField` has no lifecycle hooks — direct invocation works |
| `buildExportString` / `stripHtml` tests | Browser / jsdom | — | `DOMParser` is needed for `stripHtml`; jsdom provides it |
| `ActivityCard` component tests | Component layer | Vue Test Utils | No PB calls; needs PrimeVue stubs only |
| `ManageMeeting/Task/Support` dialog tests | Component layer | Vue Test Utils | No PB calls; needs PrimeVue stubs + emit assertions |
| `LexTrackView` component tests | View layer | PB mock + Pinia + Router | Full plugin stack; PB mock is mandatory |
| Clipboard / `exportDay` test | Browser API | jsdom mock | `navigator.clipboard` must be mocked via `Object.defineProperty` or `vi.stubGlobal` |
| CI script (QA-04) | npm scripts | — | `package.json` edit only — change `"vitest"` to `"vitest run"` |

---

## Standard Stack

### Core (already installed — no new installs required for most tests)

| Library | Installed Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| vitest | 3.2.4 | Test runner | Vite-native; shares config with `vite.config.ts` |
| @vue/test-utils | 2.4.9 | Mount/interact Vue components | Official Vue 3 testing utils |
| jsdom | 26.1.0 | Browser API simulation | Configured in `vitest.config.ts` |

[VERIFIED: npm view output in this session]

### Needs Installation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @pinia/testing | latest | `createTestingPinia()` — stubs store actions in component tests | Any component test that mounts a component which calls `useAuthStore()` |

[VERIFIED: pinia.vuejs.org/cookbook/testing — official Pinia docs confirm `@pinia/testing` is the standard pattern for component tests]

**Installation:**
```bash
npm install -D @pinia/testing
```

Version verification:
```bash
npm view @pinia/testing version
```

[ASSUMED: current latest `@pinia/testing` is compatible with Pinia 3.0.4 — Pinia v3 packages should align; verify `peerDependencies` after install]

---

## Architecture Patterns

### System Architecture Diagram

```
Test Files (.spec.ts)
       |
       |-- Pure TS modules (mappers, useDurationField, constants)
       |       No setup required → direct function call → assert
       |
       |-- Component tests (ActivityCard, ManageTask, ManageSupport, ManageMeeting)
       |       mount(Component, { global: { plugins: [PrimeVue], stubs: {...} } })
       |       → trigger events → assert emits / DOM
       |
       |-- LexTrackView tests
               vi.mock('@/lib/pocketbase')       [hoisted before imports]
               vi.mock('vue-sonner')             [silence toasts in tests]
               mount(LexTrackView, {
                 global: { plugins: [PrimeVue, createTestingPinia(), router] }
               })
               await flushPromises()             [resolve onMounted PB calls]
               → assert DOM / store state
```

### Recommended Project Structure

```
src/
├── lib/pocketbase/
│   └── __tests__/
│       ├── dsuMeetingMapper.spec.ts
│       ├── dsuTaskMapper.spec.ts
│       ├── dsuSupportMapper.spec.ts
│       └── dsuDayStatusMapper.spec.ts
├── composables/lextrack/
│   └── __tests__/
│       └── useDurationField.spec.ts
├── types/lextrack/dsu_day_status/
│   └── __tests__/
│       └── constants.spec.ts
├── components/projects/lextrack/
│   └── __tests__/
│       ├── ActivityCard.spec.ts
│       ├── ManageMeeting.spec.ts
│       ├── ManageTask.spec.ts
│       └── ManageSupport.spec.ts
└── views/
    └── __tests__/
        ├── LexTrackView.spec.ts
        └── LexTrackView.export.spec.ts    (buildExportString / stripHtml isolated)
```

Vitest's default include pattern `**/*.{test,spec}.?(c|m)[jt]s?(x)` picks up all of these.
[VERIFIED: vitest run output showing the default include pattern]

### Pattern 1: Pure Function Unit Test (Mappers, Constants)

**What:** Call the function directly, assert the return value.
**When to use:** All mapper functions, DSU_DAY_STATUS_VALUES checks, duration conversion math.

```typescript
// Source: test-utils.vuejs.org composable testing guide + Vitest docs
import { describe, it, expect } from 'vitest';
import { mapToCreateMeeting, mapToUpdateMeeting, mapFromRecordMeeting } from '@/lib/pocketbase/dsuMeetingMapper';

describe('mapToCreateMeeting', () => {
  it('defaults duration_unit to minutes when omitted', () => {
    const result = mapToCreateMeeting({
      date: '2026-01-01',
      title: 'Standup',
      duration_minutes: undefined,
      description: undefined,
    });
    expect(result.duration_unit).toBe('minutes');
  });

  it('preserves explicit hours unit', () => {
    const result = mapToCreateMeeting({
      date: '2026-01-01',
      title: 'Standup',
      duration_minutes: 60,
      duration_unit: 'hours',
    });
    expect(result.duration_unit).toBe('hours');
    expect(result.duration_minutes).toBe(60);
  });
});

describe('mapFromRecordMeeting', () => {
  it('backfills legacy rows missing duration_unit', () => {
    const record = { duration_unit: undefined } as any;
    expect(mapFromRecordMeeting(record).duration_unit).toBe('minutes');
  });
});
```

[CITED: official mapper source code + Phase 2 decisions in STATE.md]

### Pattern 2: Composable Unit Test (useDurationField)

**What:** Call the composable directly — no mounting needed because `useDurationField` has no lifecycle hooks.
**When to use:** Any composable that only uses `ref`, `computed`, and plain functions.

```typescript
// Source: test-utils.vuejs.org/guide/advanced/reusability-composition
import { describe, it, expect } from 'vitest';
import { useDurationField } from '@/composables/lextrack/useDurationField';

describe('useDurationField', () => {
  it('seeds hours unit and displays enteredValue in hours', () => {
    const { enteredValue, unit, durationMinutes } = useDurationField(90, 'hours');
    expect(unit.value).toBe('hours');
    expect(enteredValue.value).toBe(1.5);   // 90 / 60
    expect(durationMinutes.value).toBe(90);
  });

  it('converts entered value to minutes when unit is hours', () => {
    const { enteredValue, durationMinutes } = useDurationField(undefined, 'hours');
    enteredValue.value = 2;
    expect(durationMinutes.value).toBe(120);
  });

  it('seed() atomically replaces both minutes and unit', () => {
    const { seed, unit, enteredValue } = useDurationField(30, 'minutes');
    seed(120, 'hours');
    expect(unit.value).toBe('hours');
    expect(enteredValue.value).toBe(2);
  });

  it('null enteredValue → undefined durationMinutes', () => {
    const { enteredValue, durationMinutes } = useDurationField(undefined, 'minutes');
    enteredValue.value = null;
    expect(durationMinutes.value).toBeUndefined();
  });
});
```

[CITED: official composable source code + test-utils.vuejs.org direct invocation pattern]

### Pattern 3: buildExportString / stripHtml (pure function, needs DOMParser)

**What:** Both functions live in `LexTrackView.vue` script. They can be extracted to a utility module (recommended) or tested by mounting `LexTrackView` and calling wrapper.vm methods. Extraction is cleaner and avoids full-component setup for utility logic.
**When to use:** Export and HTML-stripping logic tests.

**Recommended action:** Extract `stripHtml` and `buildExportString` to `src/utils/lextrack/export.ts` as named exports, then import in LexTrackView and in tests. This makes QA-01 testable without mounting the view.

```typescript
// After extraction to src/utils/lextrack/export.ts
import { describe, it, expect } from 'vitest';
import { stripHtml, buildExportString } from '@/utils/lextrack/export';

describe('stripHtml', () => {
  it('returns empty array for empty string', () => {
    expect(stripHtml('')).toEqual([]);
  });
  it('extracts paragraph text', () => {
    expect(stripHtml('<p>Hello</p><p>World</p>')).toEqual(['Hello', 'World']);
  });
  it('ignores empty paragraphs', () => {
    expect(stripHtml('<p></p><p>Content</p>')).toEqual(['Content']);
  });
});
```

[CITED: LexTrackView.vue source, DOMParser available in jsdom 26]

**jsdom DOMParser caveat:** jsdom does implement `DOMParser` and its `parseFromString` for `text/html`. [VERIFIED: jsdom 26.1.0 supports DOMParser — no extra config needed]

### Pattern 4: Component Test — ActivityCard (No PB, Stubs Required)

**What:** Mount with PrimeVue plugin + stubs for complex PrimeVue components; test keyboard events and emit assertions.
**When to use:** All Manage* dialogs and ActivityCard.

```typescript
// Source: test-utils.vuejs.org stubs guide + PrimeVue plugin pattern (primefaces discussion #1652)
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ActivityCard from '@/components/projects/lextrack/ActivityCard.vue';

const globalConfig = {
  plugins: [PrimeVue],
  stubs: {
    // Stub heavy PrimeVue components that aren't under test
    'Editor': true,
    'iconify-icon': true,
  },
};

describe('ActivityCard', () => {
  it('adds a task item via Enter keydown', async () => {
    const section = [];
    const wrapper = mount(ActivityCard, {
      props: {
        label: 'Tasks',
        section,
        'onUpdate:section': (val) => wrapper.setProps({ section: val }),
      },
      global: globalConfig,
    });

    // Click add button to show input group
    await wrapper.find('button').trigger('click');
    const input = wrapper.find('input[placeholder="Title"]');
    await input.setValue('My task');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.props('section')).toHaveLength(1);
    expect(wrapper.props('section')[0].title).toBe('My task');
  });

  it('emits remove event with correct index', async () => {
    const section = [{ title: 'Task A' }];
    const wrapper = mount(ActivityCard, {
      props: { label: 'Tasks', section },
      global: globalConfig,
    });
    // Find remove button (last button per row) and click it
    const removeBtn = wrapper.findAll('button').at(-1);
    await removeBtn.trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')[0]).toEqual([0]);
  });
});
```

[CITED: test-utils.vuejs.org stubs guide; primefaces/primevue discussion #1652 for plugin registration pattern]

### Pattern 5: PrimeVue Plugin Registration

**Critical:** PrimeVue must be registered in `global.plugins` for any component that uses PrimeVue components. Without it you get `"$primevue was accessed during render but is not defined on instance"`.

**Do NOT use `definePreset` in tests** — this triggers `TypeError: Theme__default.default.setPreset is not a function` in the CJS module resolution path used by Vitest.
[VERIFIED: github.com/primefaces/primevue/issues/5689]

```typescript
// Correct PrimeVue setup for tests — no definePreset, no Aura import
import PrimeVue from 'primevue/config';

const globalConfig = {
  plugins: [PrimeVue],  // plain install, no preset customization
  stubs: { /* ... */ }
};
```

### Pattern 6: LexTrackView Component Test (Full Stack)

**What:** Mount the view with PrimeVue + Pinia + Router plugins; mock `@/lib/pocketbase` with `vi.mock`; use `flushPromises()` to resolve `onMounted`.
**When to use:** LexTrackView initial load, date change, save, delete, and day status tests.

```typescript
// Source: test-utils.vuejs.org async guide + pinia.vuejs.org/cookbook/testing
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import { createTestingPinia } from '@pinia/testing';
import LexTrackView from '@/views/LexTrackView.vue';

// vi.mock is hoisted to top of file by Vitest — declare before imports conceptually
vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: vi.fn().mockReturnValue({
      getFullList: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'new-id' }),
      update: vi.fn().mockResolvedValue({ id: 'existing-id' }),
      delete: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/projects/lextrack', component: LexTrackView }],
});

describe('LexTrackView', () => {
  beforeEach(async () => {
    router.push('/projects/lextrack');
    await router.isReady();
    vi.clearAllMocks();
  });

  it('calls loadForDate on mount and populates arrays', async () => {
    const { pb } = await import('@/lib/pocketbase');
    (pb.collection('dsu_meetings').getFullList as any).mockResolvedValue([
      { id: 'meet-1', title: 'Standup', date: '2026-01-01', duration_minutes: 30, duration_unit: 'minutes' }
    ]);

    const wrapper = mount(LexTrackView, {
      global: {
        plugins: [
          PrimeVue,
          createTestingPinia({ createSpy: vi.fn }),
          router,
        ],
        stubs: { ActivityCard: true, ManageMeeting: true, ManageTask: true, ManageSupport: true },
      },
    });

    await flushPromises();
    // Verify PB was called 4 times (supports, tasks, meetings, day_status)
    expect(pb.collection).toHaveBeenCalledWith('dsu_meetings');
  });
});
```

[CITED: pinia.vuejs.org/cookbook/testing; test-utils.vuejs.org async guide; vue-router testing docs]

**Key note on `vi.mock` hoisting:** Vitest hoists `vi.mock()` calls above import statements. Use `await import(...)` inside test bodies to get the mocked version of a module. [VERIFIED: vitest.dev/guide/mocking]

### Pattern 7: Router Mocking

For `LexTrackView.handle401` which calls `router.push`, the simplest approach is using a real in-memory router (shown in Pattern 6) and asserting `router.currentRoute.value.path`. This avoids the `vi.mock('vue-router')` approach which can interfere with Pinia's use of the router.

Alternatively, for unit tests of `handle401` logic, use `global.mocks`:
```typescript
const mockPush = vi.fn();
mount(LexTrackView, {
  global: {
    mocks: { $router: { push: mockPush } },
    // ...
  }
});
```
[CITED: test-utils.vuejs.org/guide/advanced/vue-router]

### Pattern 8: Clipboard / navigator.clipboard Mock

**What:** `navigator.clipboard` is not implemented in jsdom by default. Must mock before testing `exportDay()`.
**When to use:** `exportDay` tests.

```typescript
// Source: dev.to/andrewchaa mocking navigator.clipboard
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

The `exportDay` function also has an `execCommand` fallback. To test the fallback branch:
```typescript
Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
vi.spyOn(document, 'execCommand').mockReturnValue(true);
```
[CITED: dev.to/andrewchaa; codestudy.net/blog/how-to-mock-navigator-clipboard-writetext-in-jest]

### Pattern 9: defineModel Testing

Components `ManageMeeting`, `ManageTask`, `ManageSupport` use `defineModel` with named models (`visible`, `meeting`/`task`/`support`). Testing with Vue Test Utils v2:

```typescript
// Source: test-utils.vuejs.org/guide/advanced/v-model
const wrapper = mount(ManageMeeting, {
  props: {
    visible: true,
    'onUpdate:visible': (val) => wrapper.setProps({ visible: val }),
    meeting: { title: '', date: '2026-01-01', duration_minutes: undefined },
    'onUpdate:meeting': (val) => wrapper.setProps({ meeting: val }),
    saving: false,
  },
  global: { plugins: [PrimeVue], stubs: { Editor: true } },
});

// Test save emit
await wrapper.find('button[label="Save Meeting"]').trigger('click');
// Or find by text content if attribute-based selector fails on stubbed Dialog
expect(wrapper.emitted('save')).toBeTruthy();
expect(wrapper.emitted('save')[0][0]).toMatchObject({ title: '' });
```

[CITED: test-utils.vuejs.org/guide/advanced/v-model — named v-model with `onUpdate:name` handler pattern]

### Anti-Patterns to Avoid

- **Using `shallow` globally:** Shallow mounting makes component tests meaningless for event-driven components like ActivityCard. Use `mount` with targeted stubs.
- **Using `definePreset` in test plugin setup:** Causes `TypeError: Theme__default.default.setPreset is not a function`. Pass `PrimeVue` without preset args in tests.
- **Not clearing mocks between tests:** `vi.clearAllMocks()` in `beforeEach` prevents stale mock call counts from bleeding into subsequent tests.
- **Asserting toast calls directly:** toast from vue-sonner must be `vi.mock`-ed; asserting it internally in a component that also calls PB makes tests brittle. Instead assert the side effect (data state changed) and trust that toast was called.
- **Testing the entire PocketBase SDK:** Only mock `pb.collection(...).method` — not the full SDK internals.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pinia store in component tests | Manual store setup, mocking all store refs | `createTestingPinia({ createSpy: vi.fn })` | Actions auto-stubbed; state patchable via `store.$patch` |
| Async assertion timing | `setTimeout`, `setInterval` loops | `flushPromises()` from `@vue/test-utils` | Resolves all pending microtasks deterministically |
| Module mocking boilerplate | Manual proxy objects | `vi.mock()` factory function pattern | Hoisted, typed, auto-cleaned by Vitest |
| PrimeVue component stubs | Writing template stubs for every PrimeVue component | `stubs: { ComponentName: true }` in global config | Auto-creates a `<componentname-stub />` that passes through slots |

---

## Common Pitfalls

### Pitfall 1: PrimeVue Auto-Imports Not Available in Vitest

**What goes wrong:** `<InputText>`, `<Button>`, `<Dialog>`, `<Card>` etc. are `undefined` in tests because `unplugin-vue-components` only resolves them during the Vite build pipeline, not in Vitest's transform pipeline.

**Why it happens:** The `Components({ resolvers: [PrimeVueResolver()] })` Vite plugin generates import statements into a virtual module that Vitest never processes, even though `vitest.config.ts` merges from `vite.config.ts`.

**How to avoid:** Register PrimeVue as a global plugin in mount options (`global.plugins: [PrimeVue]`). This registers all PrimeVue components globally on the test Vue app, making them available in templates exactly as in production.

**Warning signs:** `[Vue warn]: Failed to resolve component: Button` in test output.

[VERIFIED: github.com/vuejs/test-utils/discussions/1914; github.com/orgs/primefaces/discussions/1652]

### Pitfall 2: `vi.mock` Factory Must Match Module Shape Exactly

**What goes wrong:** `vi.mock('@/lib/pocketbase')` returns `{ pb: { ... } }` but the code imports `{ pb }` — if the factory omits the named export or returns the wrong structure, tests import `undefined`.

**Why it happens:** `vi.mock` replaces the entire module. Any named or default export not in the factory becomes `undefined`.

**How to avoid:** Match the real module's export shape exactly. For the PB client: `{ pb: { collection: vi.fn().mockReturnValue({ ... }) } }`.

**Warning signs:** `Cannot read properties of undefined (reading 'collection')` during test.

[CITED: vitest.dev/guide/mocking factory function docs]

### Pitfall 3: `vi.mock` Needs Chained `.collection()` Return Value

**What goes wrong:** `LexTrackView` calls `pb.collection('dsu_meetings').getFullList(...)`. If `pb.collection` returns `vi.fn()` without a chained mock, `getFullList` is `undefined`.

**Why it happens:** Each `.collection(name)` call must return an object with all the methods called on it.

**How to avoid:**
```typescript
vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: vi.fn().mockReturnValue({
      getFullList: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'test-id' }),
      update: vi.fn().mockResolvedValue({ id: 'test-id' }),
      delete: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));
```

**Warning signs:** `TypeError: pb.collection(...).getFullList is not a function`

[CITED: PB client source `src/lib/pocketbase/index.ts` + Vitest mock chaining docs]

### Pitfall 4: `flushPromises` Must Be Awaited AFTER `mount`

**What goes wrong:** `onMounted(() => loadForDate(...))` is async. Without `await flushPromises()`, the component has mounted but PB calls are still pending. Assertions see empty arrays.

**Why it happens:** Vue Test Utils `mount()` is synchronous. It triggers lifecycle hooks but does not wait for their async callbacks to resolve.

**How to avoid:**
```typescript
const wrapper = mount(LexTrackView, { ... });
await flushPromises();  // <-- resolve onMounted PB calls
expect(wrapper.vm.meetings).toHaveLength(1);  // now populated
```

[VERIFIED: test-utils.vuejs.org async/suspense guide]

### Pitfall 5: `@pinia/testing` — `createSpy` Required When Not in Globals Mode

**What goes wrong:** `createTestingPinia()` uses its own spy by default, which is a no-op. Without `createSpy: vi.fn`, action calls are tracked but can't be asserted with `toHaveBeenCalled`.

**Why it happens:** `@pinia/testing` was designed to work with both Jest and Vitest. Without `createSpy`, it uses its own internal mock.

**How to avoid:** Always pass `createTestingPinia({ createSpy: vi.fn })`.

[CITED: pinia.vuejs.org/cookbook/testing]

### Pitfall 6: `useAuthStore` Calls `pb.authStore.onChange` at Store Creation

**What goes wrong:** When a component mounts and calls `useAuthStore()`, the store constructor runs `pb.authStore.onChange(...)`. If `pb` is mocked but `authStore.onChange` is not, this throws.

**How to avoid:** Extend the `vi.mock('@/lib/pocketbase')` factory to include `authStore`:
```typescript
vi.mock('@/lib/pocketbase', () => ({
  pb: {
    authStore: {
      record: null,
      onChange: vi.fn(),
      clear: vi.fn(),
    },
    collection: vi.fn().mockReturnValue({ ... }),
  },
}));
```

[CITED: `src/stores/auth.ts` — store calls `pb.authStore.onChange` on creation]

### Pitfall 7: `DOMParser` in jsdom — Works, But `querySelectorAll` Scope Matters

**What goes wrong:** `stripHtml` uses `doc.body.querySelectorAll('p, li, div')`. In jsdom, this works correctly, but if the input HTML has only text nodes with no wrapper tags, the result will be empty.

**Why it happens:** `DOMParser.parseFromString` in jsdom correctly parses the HTML, but bare text nodes not wrapped in `<p>` or `<div>` are not selected by the querySelectorAll selector.

**How to avoid:** Test with realistic HTML input matching what Quill produces (which always wraps in `<p>`). Document that bare-text input intentionally returns `[]`.

[ASSUMED: jsdom 26.1.0 DOMParser behavior matches browser — not independently verified beyond the fact that jsdom ships DOMParser]

---

## Code Examples

### Setting Up a Reusable Test Helper

```typescript
// src/__tests__/setup/createWrapper.ts
import { mount, type MountingOptions } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';

export function createBaseGlobal(extraPlugins: any[] = []) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  });
  return {
    plugins: [
      PrimeVue,
      createTestingPinia({ createSpy: vi.fn }),
      router,
      ...extraPlugins,
    ],
    stubs: {
      'Editor': true,
      'iconify-icon': true,
    },
  };
}
```

### Mapper Test Template

```typescript
// Source: verified against mapper source files
import { mapToUpdateMeeting } from '@/lib/pocketbase/dsuMeetingMapper';
import type { DsuMeetings } from '@/types/lextrack/dsu_meetings/types';

const fakeMeeting: DsuMeetings = {
  id: 'abc',
  created: '2026-01-01',
  updated: '2026-01-01',
  collectionId: '',
  collectionName: 'dsu_meetings',
  date: '2026-01-01',
  title: 'Standup',
  duration_minutes: 30,
  duration_unit: 'minutes',
  description: undefined,
};

it('mapToUpdateMeeting excludes id/created/updated', () => {
  const result = mapToUpdateMeeting(fakeMeeting);
  expect(result).not.toHaveProperty('id');
  expect(result).not.toHaveProperty('created');
  expect(result).not.toHaveProperty('updated');
  expect(result.title).toBe('Standup');
});
```

---

## QA-04: CI Script Fix

**Current:** `"test:unit": "vitest"` — starts in interactive watch mode in a TTY.

**Fix options (either is acceptable):**

Option A — Replace (simplest, no new script):
```json
"test:unit": "vitest run"
```

Option B — Keep watch + add CI variant:
```json
"test:unit": "vitest",
"test:unit:run": "vitest run"
```

**Behavior:** `vitest run` performs a single pass and exits with code 0 (all pass) or 1 (any failure). Vitest also auto-detects `process.env.CI=true` and falls back to run mode, but explicit `vitest run` is safer for any non-TTY invocation.

[VERIFIED: vitest.dev/guide/cli — `vitest run` documented as "perform a single run without watch mode"]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vue-jest` transformer | Vitest with `mergeConfig(viteConfig, ...)` | ~2022 | No separate Babel/Jest config; Vite config reused |
| Global component registration in test setup | `global.plugins: [PrimeVue]` per mount | v2 Test Utils | Scoped per-test, no global pollution |
| `wrapper.find('[data-testid]')` | Prefer `wrapper.find('button')` + role/label | Current best practice | Less coupling to markup implementation |

**Deprecated/outdated:**
- `@vue/test-utils` v1: `shallowMount` + `localVue` pattern — replaced by `mount` + `global.stubs` in v2.
- `jest.mock` — replaced by `vi.mock` in Vitest (same API, different import).

---

## Runtime State Inventory

Not applicable — this is a greenfield test phase. No rename or refactor of runtime state.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest runtime | ✓ | (^20.19.0 constraint) | — |
| vitest | Test runner | ✓ | 3.2.4 | — |
| @vue/test-utils | Component mounting | ✓ | 2.4.9 | — |
| jsdom | Browser sim | ✓ | 26.1.0 | — |
| @pinia/testing | Pinia in component tests | ✗ | — | Use `setActivePinia(createPinia())` for store-only tests; but component tests need the package |
| DOMParser | stripHtml tests | ✓ | jsdom built-in | — |

**Missing dependencies with no fallback:**
- `@pinia/testing` — required for `LexTrackView` component tests. Must be installed (`npm install -D @pinia/testing`).

**Missing dependencies with fallback:**
- None.

[VERIFIED: npm view in this session for installed packages; `@pinia/testing` checked via `node -e` — NOT INSTALLED]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` (merges `vite.config.ts`) |
| Quick run command | `npm run test:unit -- --reporter dot` |
| Full suite command | `npm run test:unit` (after QA-04 fix: `vitest run`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QA-01 | mapToCreateMeeting defaults duration_unit | unit | `npm run test:unit -- dsuMeetingMapper` | ❌ Wave 0 |
| QA-01 | mapToUpdateMeeting excludes id/created/updated | unit | `npm run test:unit -- dsuMeetingMapper` | ❌ Wave 0 |
| QA-01 | mapFromRecordMeeting backfills legacy duration_unit | unit | `npm run test:unit -- dsuMeetingMapper` | ❌ Wave 0 |
| QA-01 | mapToCreateTask / mapToUpdateTask shape | unit | `npm run test:unit -- dsuTaskMapper` | ❌ Wave 0 |
| QA-01 | mapToCreateSupport / mapToUpdateSupport shape | unit | `npm run test:unit -- dsuSupportMapper` | ❌ Wave 0 |
| QA-01 | mapToCreateDayStatus / mapFromRecordDayStatus | unit | `npm run test:unit -- dsuDayStatusMapper` | ❌ Wave 0 |
| QA-01 | useDurationField — min→hr conversion, seed, null | unit | `npm run test:unit -- useDurationField` | ❌ Wave 0 |
| QA-01 | DSU_DAY_STATUS_VALUES has all 5 values | unit | `npm run test:unit -- constants` | ❌ Wave 0 |
| QA-01 | stripHtml extracts text lines | unit | `npm run test:unit -- export` | ❌ Wave 0 |
| QA-01 | buildExportString — normal day, status day, empty | unit | `npm run test:unit -- export` | ❌ Wave 0 |
| QA-02 | ActivityCard — add via Enter (Tasks, Meetings, Admin shapes) | component | `npm run test:unit -- ActivityCard` | ❌ Wave 0 |
| QA-02 | ActivityCard — edit emits update with index | component | `npm run test:unit -- ActivityCard` | ❌ Wave 0 |
| QA-02 | ActivityCard — remove emits remove with index | component | `npm run test:unit -- ActivityCard` | ❌ Wave 0 |
| QA-02 | ManageMeeting — Save emits save with item | component | `npm run test:unit -- ManageMeeting` | ❌ Wave 0 |
| QA-02 | ManageTask — Save emits save with item | component | `npm run test:unit -- ManageTask` | ❌ Wave 0 |
| QA-02 | ManageSupport — Save emits save with item | component | `npm run test:unit -- ManageSupport` | ❌ Wave 0 |
| QA-02 | LexTrackView — loadForDate called on mount | component | `npm run test:unit -- LexTrackView` | ❌ Wave 0 |
| QA-02 | LexTrackView — date change triggers loadForDate | component | `npm run test:unit -- LexTrackView` | ❌ Wave 0 |
| QA-02 | LexTrackView — delete with id calls pb.delete | component | `npm run test:unit -- LexTrackView` | ❌ Wave 0 |
| QA-02 | LexTrackView — delete without id is local-only | component | `npm run test:unit -- LexTrackView` | ❌ Wave 0 |
| QA-02 | LexTrackView — setDayStatus creates/updates/deletes | component | `npm run test:unit -- LexTrackView` | ❌ Wave 0 |
| QA-03 | lint passes | integration | `npm run lint` | Already passing |
| QA-03 | type-check passes | integration | `npm run type-check` | Already passing |
| QA-04 | test:unit exits without watch mode | ci | `npm run test:unit` exits code 0/1 | ❌ Wave 0 (script change) |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter dot` (fast summary)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** `npm run lint && npm run type-check && npm run test:unit` all green

### Wave 0 Gaps

All test files are new. Wave 0 must create:

- [ ] `src/lib/pocketbase/__tests__/dsuMeetingMapper.spec.ts`
- [ ] `src/lib/pocketbase/__tests__/dsuTaskMapper.spec.ts`
- [ ] `src/lib/pocketbase/__tests__/dsuSupportMapper.spec.ts`
- [ ] `src/lib/pocketbase/__tests__/dsuDayStatusMapper.spec.ts`
- [ ] `src/composables/lextrack/__tests__/useDurationField.spec.ts`
- [ ] `src/utils/lextrack/export.ts` — extract `stripHtml` + `buildExportString` from `LexTrackView.vue`
- [ ] `src/utils/lextrack/__tests__/export.spec.ts`
- [ ] `src/types/lextrack/dsu_day_status/__tests__/constants.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ActivityCard.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ManageMeeting.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ManageTask.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ManageSupport.spec.ts`
- [ ] `src/views/__tests__/LexTrackView.spec.ts`
- [ ] `package.json` — change `"test:unit": "vitest"` to `"test:unit": "vitest run"` (or add `test:unit:run`)
- [ ] Install `@pinia/testing`: `npm install -D @pinia/testing`

---

## Security Domain

No new security surface is introduced in this phase. Tests are dev-only (`devDependencies`). No authentication, network, or data exposure paths are added.

The `security_enforcement` config key is absent from `.planning/config.json` (treated as enabled), but Phase 6 is a pure testing phase with no production code changes — ASVS categories V2–V6 are not applicable.

---

## Project Constraints (from CLAUDE.md)

All directives extracted from `CLAUDE.md` that apply to Phase 6:

| Directive | Impact on Phase 6 |
|-----------|-------------------|
| `npm run test:unit` uses Vitest (jsdom environment) | Confirmed — no change to test environment |
| Auto-imports: do NOT add manual PrimeVue imports in source | Test files are NOT source files — manually importing `PrimeVue from 'primevue/config'` in `.spec.ts` files is correct and necessary |
| Two-stage lint: oxlint then eslint with `--fix` | Test files in `src/**/__tests__/` fall within ESLint scope; `@vitest/eslint-plugin` is already configured in `eslint.config.ts` |
| PocketBase mappers: update both types and mappers together | N/A — no schema changes in Phase 6 |
| `VITE_API_BASE_URL` drives PocketBase | Tests must not hit the live PB instance — `vi.mock('@/lib/pocketbase')` is mandatory |
| `npm run deploy` must continue to work | Test files in `src/` are excluded from the build by Vite/Rolldown (only `.vue`, imported `.ts` are bundled — `.spec.ts` files are not imported by any production code) |
| No framework swaps | Vitest is already the configured test runner — no change |
| `buildExportString` / `stripHtml` live in `LexTrackView.vue` | Extraction to `src/utils/lextrack/export.ts` is required to test them as pure units (QA-01). This is an additive refactor — LexTrackView imports from the new module. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@pinia/testing` latest version is compatible with Pinia 3.0.4 | Standard Stack | If incompatible, use `setActivePinia(createPinia())` pattern for component tests (more verbose but functional) |
| A2 | jsdom 26.1.0 `DOMParser.parseFromString` behavior matches browser for `text/html` | Pitfall 7 / stripHtml tests | stripHtml tests could produce different results; would need to mock DOMParser or switch to JSDOM's `window.DOMParser` explicitly |
| A3 | Extracting `buildExportString` and `stripHtml` to a utility module won't break LexTrackView | Project Constraints | Low risk — both are pure functions with no component state; they only read their arguments |
| A4 | `vitest.config.ts` merging `vite.config.ts` means `@` alias resolves correctly in test files | Architecture | If alias doesn't work in tests, all `@/` imports in spec files will fail; fallback is to add `resolve.alias` directly in `vitest.config.ts` |

---

## Open Questions

1. **Extract `buildExportString` / `stripHtml` or test via component exposure?**
   - What we know: Both functions are defined in `LexTrackView.vue`'s `<script setup>`. `wrapper.vm` exposes them in Vue Test Utils.
   - What's unclear: Whether the planner should extract them or test via `wrapper.vm.buildExportString()`.
   - Recommendation: Extract to `src/utils/lextrack/export.ts`. This satisfies QA-01 ("unit tests cover the exporter") without the overhead of mounting the full view. It also improves testability permanently. The export module becomes a dependency of LexTrackView.

2. **Coverage targets?**
   - What we know: No coverage tooling is configured; QA requirements don't mention a numeric target.
   - What's unclear: Whether a coverage report is needed for the phase gate.
   - Recommendation: No coverage target for this phase — focus on the behavioral test list in QA-01/QA-02. Coverage can be added in v2 if needed.

3. **Should `@pinia/testing` be installed or use the lighter `setActivePinia` pattern?**
   - What we know: `createTestingPinia` stubs all Pinia actions automatically; `setActivePinia(createPinia())` does not stub actions but requires less setup.
   - Recommendation: Install `@pinia/testing`. `LexTrackView` calls `useAuthStore()` at setup time, and the auth store calls `pb.authStore.onChange` — action stubbing prevents auth state from interfering with PB-mock-dependent tests.

---

## Sources

### Primary (HIGH confidence)
- `src/views/LexTrackView.vue` — complete view source, all functions and PB call patterns [VERIFIED: read in this session]
- `src/composables/lextrack/useDurationField.ts` — composable logic [VERIFIED: read in this session]
- `src/lib/pocketbase/dsu*.ts` — all four mapper files [VERIFIED: read in this session]
- `src/types/lextrack/dsu_day_status/constants.ts` — 5 DSU status values [VERIFIED: read in this session]
- `vitest.config.ts` — jsdom environment + mergeConfig pattern [VERIFIED: read in this session]
- `package.json` — installed versions + current test:unit script [VERIFIED: read in this session]
- `vitest.dev/guide/cli` — `vitest run` single-pass mode [CITED: official Vitest docs]
- `test-utils.vuejs.org/guide/advanced/reusability-composition` — composable direct invocation pattern [CITED: official Vue Test Utils docs]
- `test-utils.vuejs.org/guide/advanced/v-model` — named model testing pattern [CITED: official Vue Test Utils docs]
- `pinia.vuejs.org/cookbook/testing` — `createTestingPinia` pattern [CITED: official Pinia docs]

### Secondary (MEDIUM confidence)
- `github.com/orgs/primefaces/discussions/1652` — PrimeVue plugin registration in test mount [CITED: PrimeVue official GitHub]
- `github.com/primefaces/primevue/issues/5689` — `definePreset` CJS TypeError in Vitest [CITED: PrimeVue official GitHub]
- `test-utils.vuejs.org/guide/advanced/async-suspense` — `flushPromises` pattern [CITED: official Vue Test Utils docs]
- `test-utils.vuejs.org/guide/advanced/vue-router` — router mock and real router patterns [CITED: official Vue Test Utils docs]

### Tertiary (LOW confidence)
- `dev.to/andrewchaa` — navigator.clipboard mock with `Object.defineProperty` [WebSearch, consistent with jsdom docs]
- `codestudy.net/blog/how-to-mock-navigator-clipboard-writetext-in-jest` — spyOn alternative [WebSearch, single source]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via `npm view` and `package.json`
- Architecture: HIGH — all source files read and patterns verified against official docs
- Pitfalls: HIGH — PrimeVue pitfalls verified against GitHub issues; PB mock pattern derived directly from source code
- QA-04 fix: HIGH — `vitest run` confirmed in official CLI docs

**Research date:** 2026-04-29
**Valid until:** 2026-06-01 (Vitest and @vue/test-utils APIs are stable; PrimeVue test quirks may evolve)
