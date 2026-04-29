---
phase: 06-quality-gate
reviewed: 2026-04-29T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - package.json
  - src/lib/pocketbase/__mocks__/index.ts
  - src/utils/lextrack/export.ts
  - src/views/LexTrackView.vue
  - src/lib/pocketbase/__tests__/dsuMeetingMapper.spec.ts
  - src/lib/pocketbase/__tests__/dsuTaskMapper.spec.ts
  - src/lib/pocketbase/__tests__/dsuSupportMapper.spec.ts
  - src/lib/pocketbase/__tests__/dsuDayStatusMapper.spec.ts
  - src/composables/lextrack/__tests__/useDurationField.spec.ts
  - src/types/lextrack/dsu_day_status/__tests__/constants.spec.ts
  - src/utils/lextrack/__tests__/export.spec.ts
  - src/components/projects/lextrack/__tests__/ActivityCard.spec.ts
  - src/components/projects/lextrack/__tests__/ManageMeeting.spec.ts
  - src/components/projects/lextrack/__tests__/ManageTask.spec.ts
  - src/components/projects/lextrack/__tests__/ManageSupport.spec.ts
  - src/views/__tests__/LexTrackView.spec.ts
  - eslint.config.ts
findings:
  critical: 0
  warning: 7
  info: 5
  total: 12
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

This wave covers the test infrastructure, export utility, and refactored LexTrackView introduced across phases 06-01 through 06-04. The production source files (LexTrackView.vue, export.ts, mappers, useDurationField composable) are generally well-structured with consistent error handling patterns. The primary concerns centre on: a type-unsafety hole in the update path for meetings with a potentially-undefined `duration_unit`; shared mock state in the PocketBase mock that creates latent test-isolation failures; a `findSaveButton` selector in ManageSupport tests that is too broad; and `AddDsu*` type definitions that inherit RecordModel's internal fields into "create" payloads.

---

## Warnings

### WR-01: `mapToUpdateMeeting` sends `undefined` for `duration_unit` on legacy records bypassed by cast

**File:** `src/views/LexTrackView.vue:239`

**Issue:** The `saveItem` update path casts `item as DsuMeetings` before calling `mapToUpdateMeeting`. `DsuMeetingItem` is `AddDsuMeeting & { id?: string }`, and `AddDsuMeeting.duration_unit` is `DurationUnit | undefined` (optional). When a meeting was added inline via `ActivityCard` and has `duration_unit: undefined`, the cast bypasses TypeScript's non-optional constraint on `DsuMeetings.duration_unit`. `mapToUpdateMeeting` passes the value straight through without a `?? 'minutes'` fallback (unlike `mapToCreateMeeting`). The result is a PocketBase update payload with `duration_unit: undefined`, which either clears the field on the backend or causes a validation error — neither is the intended behaviour.

**Fix:** Apply the same `?? 'minutes'` guard in `mapToUpdateMeeting`:
```typescript
export function mapToUpdateMeeting(meeting: DsuMeetings): {
    title: string;
    duration_minutes?: number;
    duration_unit: DurationUnit;
    description?: string;
} {
    return {
        title: meeting.title,
        duration_minutes: meeting.duration_minutes,
        duration_unit: meeting.duration_unit ?? 'minutes',  // match mapToCreateMeeting
        description: meeting.description,
    };
}
```
Alternatively, ensure `ActivityCard` always seeds `duration_unit: 'minutes'` on inline-added meetings before they reach `saveItem` — the test at `ActivityCard.spec.ts:48` confirms this seeding happens, but the inline path via the dialog's save handler goes directly to `saveItem`, not through `ActivityCard`'s add path.

---

### WR-02: `pb.collection` mock returns the same shared object — `mockReturnValue` set in one test persists into later tests

**File:** `src/views/__tests__/LexTrackView.spec.ts:116` and `src/lib/pocketbase/__mocks__/index.ts:23`

**Issue:** `vi.clearAllMocks()` in `beforeEach` resets call counts but does NOT reset `mockReturnValue` implementations. The `setDayStatus creates` test (line 116) calls `(pb.collection as ...).mockReturnValue(mockCollection)` to override the default mock. That override survives `vi.clearAllMocks()` and affects every subsequent test in the file. The `setDayStatus(null) deletes` test happens to override it again, so those two tests are currently safe — but any test added after them will receive `mockCollection` from test 5 instead of the default `collectionMethods` from the mock file, silently changing the resolved values for `getFullList`, `create`, `update`, `delete`.

**Fix:** Use `mockReturnValueOnce` in tests that need per-call overrides, or restore the original implementation at the end of each test using `beforeEach`/`afterEach`:
```typescript
afterEach(() => {
  // Restore default mock implementation after per-test overrides
  (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue(collectionMethods);
});
```
Or alternatively refactor to `vi.resetAllMocks()` in `beforeEach` (resets implementations too) and re-apply `mockResolvedValue` defaults inside a shared setup function.

---

### WR-03: `findSaveButton` in ManageSupport tests matches any button containing "Save" — ambiguous selector

**File:** `src/components/projects/lextrack/__tests__/ManageSupport.spec.ts:29-32`

**Issue:** The helper searches for `b.textContent?.includes('Save')`. A dialog that contains any other button whose label contains "Save" (e.g. "Save & Close", or a future "Save Draft" button) would match first or instead of the intended target. ManageMeeting and ManageTask test helpers use explicit text ("Save Meeting", "Save Task") which is unambiguous. The support helper is the outlier.

**Fix:** Pin the selector to the exact button label used in the `ManageSupport` component:
```typescript
function findSaveButton(): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    b.textContent?.trim() === 'Save Admin Item',  // or whatever the exact label is
  );
}
```
If the button label is simply "Save", document it with a comment explaining why the loose match is intentional and safe.

---

### WR-04: `AddDsuTask`, `AddDsuSupport`, and `AddDsuDayStatus` inherit `collectionId` / `collectionName` from `RecordModel` into "create" payload types

**File:** `src/types/lextrack/dsu_tasks/types.ts:13`, `src/types/lextrack/dsu_supports/types.ts:13`, `src/types/lextrack/dsu_day_status/types.ts:12`

**Issue:** All three `Add*` types are defined as `Omit<DsuX, 'id' | 'created' | 'updated'>`. `RecordModel` also exposes `collectionId` and `collectionName`; these are not omitted from the `Add*` types. As a result `AddDsuTask`, `AddDsuSupport`, and `AddDsuDayStatus` structurally include `collectionId: string` and `collectionName: string` as required fields. The test fixtures in `ManageTask.spec.ts:21-23`, `ManageSupport.spec.ts:21-22` must carry these fields to satisfy the type. Mappers correctly drop them from the output, but the type definition signals to callers that they must provide PocketBase internals in create payloads, which is misleading and error-prone.

**Fix:** Extend the `Omit` to exclude the RecordModel-internal fields:
```typescript
// dsu_tasks/types.ts
export type AddDsuTask = Omit<DsuTasks, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>;
```
Apply the same change to `AddDsuSupport` and `AddDsuDayStatus`. Update the test fixtures accordingly (remove `collectionId` / `collectionName` from `makeTask`, `makeSupport`, etc.).

---

### WR-05: `dsuMeetingMapper.spec.ts` has no test for `mapToUpdateMeeting` with a legacy record that has `duration_unit: undefined`

**File:** `src/lib/pocketbase/__tests__/dsuMeetingMapper.spec.ts:51-71`

**Issue:** The `mapToUpdateMeeting` suite tests that the output "preserves title, duration_minutes, duration_unit, description" using a `baseRecord` where `duration_unit: 'minutes'`. There is no test for the legacy-record case (a record loaded before the Phase 1 schema migration) where `duration_unit` could be `undefined`. Combined with WR-01, this means the bug path is neither guarded in the implementation nor caught by the test suite. A test like the one below would expose the implementation gap immediately:
```typescript
it('falls back to minutes for legacy records missing duration_unit', () => {
  const legacy = { ...baseRecord, duration_unit: undefined } as unknown as DsuMeetings;
  expect(mapToUpdateMeeting(legacy).duration_unit).toBe('minutes');
});
```

---

### WR-06: `LexTrackView` `updateSupport` / `updateMeeting` / `updateTask` alias the array entry directly — dialog cancel silently mutates stored state

**File:** `src/views/LexTrackView.vue:72`, `117`, `158`

**Issue:** Each `update*` handler does `support.value = supports.value[index] as AddDsuSupport`. This assigns a reference to the array element into the dialog's `v-model`. Edits inside the dialog mutate the array entry in-place immediately (Vue reactivity propagates through the shared reference). If the user opens the dialog, partially edits a field, then closes via the dialog's "X" or `Cancel` without saving, the in-memory array entry is left with the partially-edited values — the UI reflects the dirty state but no save has occurred. A subsequent "Save All" would persist the half-edited data to PocketBase.

**Fix:** Deep-clone the item before assigning to the dialog model:
```typescript
const updateMeeting = (index: number) => {
  meeting.value = { ...meetings.value[index] } as AddDsuMeeting;
  viewMeetingDialogVisibility.value = true;
};
```
Apply the same pattern to `updateTask` and `updateSupport`. The dialog's `@save` handler already does the correct thing (`meetings.value[idx] = { ...item, id: saved.id }`), so only the initial assignment needs fixing.

---

### WR-07: `LexTrackView.spec.ts` test at line 80-81 calls `pb.collection()` with no arguments to retrieve mock return — introduces a spurious call-count side effect

**File:** `src/views/__tests__/LexTrackView.spec.ts:80-81`

**Issue:**
```typescript
const collectionReturn = (pb.collection as ReturnType<typeof vi.fn>)();
expect(collectionReturn.delete).toHaveBeenCalledWith('sup-1');
```
This extra `pb.collection()` call increments the mock's `calls` array. If any assertion was checking the exact number of `pb.collection` invocations (e.g., `toHaveBeenCalledTimes(1)`) this would fail spuriously. More critically, the extra call happens with no argument, so `pb.collection.mock.calls` would include `[undefined]` after the call, which could contaminate the `collectionCalls` assertion in the first test (lines 59-63) if test isolation is imperfect.

**Fix:** Capture the mock return value before triggering the side-effectful operation, or use a stored reference:
```typescript
const { pb } = await import('@/lib/pocketbase');
const mockCollectionReturn = (pb.collection as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
expect(mockCollectionReturn.delete).toHaveBeenCalledWith('sup-1');
```
Or alternatively inspect `pb.collection.mock.results` to get the most recent return value without adding a new call.

---

## Info

### IN-01: `ActivityCard.spec.ts` button index assumption is fragile and undocumented

**File:** `src/components/projects/lextrack/__tests__/ActivityCard.spec.ts:77`

**Issue:** The comment `// buttons: [add-btn, edit-btn, remove-btn]` documents the assumed button order, but the test relies on positional indexing (`buttons[1]`, `buttons[buttons.length - 1]`). If `ActivityCard` adds or reorders buttons, the tests will silently test the wrong button or fail with an unhelpful assertion message.

**Fix:** Use `data-testid` attributes on the edit and remove buttons in `ActivityCard.vue` and query by `[data-testid="edit-0"]` / `[data-testid="remove-0"]` in the tests. This makes intent explicit and survives layout changes.

---

### IN-02: `package.json` lists `axios` and `dompurify` as production dependencies but neither is used in the LexTrack feature

**File:** `package.json:31`, `33`

**Issue:** `axios` is only imported in `src/components/projects/api-playground/ApiPlaygroundApp.vue` and `dompurify` likewise — neither is part of the LexTrack feature under review. Both are bundled into the production SPA even for users who never visit the api-playground route (no dynamic import). This inflates the bundle. The `export.ts` file explicitly comments "browser-native, no new deps" as its justification for using `DOMParser` over `dompurify`, yet `dompurify` is already present in the dependency list.

**Fix:** If `dompurify` is available, consider using it in `stripHtml` for consistent sanitisation rather than a raw `DOMParser`. Alternatively, move `axios` and `dompurify` usage in `ApiPlaygroundApp` behind a dynamic import if that component is already lazy-loaded, reducing initial bundle impact.

---

### IN-03: `eslint.config.ts` Vitest plugin scope uses `src/**/__tests__/*` (no file extension)

**File:** `eslint.config.ts:36`

**Issue:** The Vitest plugin is applied to `files: ["src/**/__tests__/*"]` — this glob has no extension filter, so it applies to any file in a `__tests__` directory, including non-TypeScript files (e.g. snapshot files, fixture JSON, markdown). ESLint ignores files it cannot parse, so this does not cause failures today, but the intent is clearly to target spec files only.

**Fix:**
```typescript
files: ["src/**/__tests__/*.spec.ts", "src/**/__tests__/*.spec.tsx"],
```

---

### IN-04: `dsuDayStatusMapper.spec.ts` — `mapToUpdateDayStatus` is not tested because it doesn't exist; the comment in the mapper noting a future update path is stale

**File:** `src/lib/pocketbase/__tests__/dsuDayStatusMapper.spec.ts:1-32`, `src/lib/pocketbase/dsuDayStatusMapper.ts:12-15`

**Issue:** The mapper file comment says "there is no mapToUpdateDayStatus … Phase 5 will implement this…". Phase 5 is now complete — `LexTrackView.vue` implements the update path inline (lines 404-407) rather than through a dedicated mapper function, bypassing the mapper layer entirely and duplicating the `{ status: value }` payload inline. This inconsistency with all other entities (which use mapper functions for both create and update) will cause drift if the `dsu_day_status` schema evolves.

**Fix:** Extract a `mapToUpdateDayStatus` function consistent with the other mappers:
```typescript
export function mapToUpdateDayStatus(status: DsuDayStatus['status']): { status: DsuDayStatus['status'] } {
    return { status };
}
```
Use it in `LexTrackView.vue` line 406. Add a corresponding test in `dsuDayStatusMapper.spec.ts`.

---

### IN-05: `useDurationField.spec.ts` does not test the `seed()` function with `savedMinutes=undefined` + `savedUnit=undefined` (double-undefined)

**File:** `src/composables/lextrack/__tests__/useDurationField.spec.ts:36-41`

**Issue:** The existing `seed()` test (line 36) calls `seed(120, 'hours')` — both arguments provided. The composable's `seed` function applies `?? undefined` and `?? 'minutes'` defaults. If both arguments are `undefined` the function should default unit to `'minutes'` and leave minutes as `undefined`. This is the most common reset-to-empty case (e.g., when the dialog is reset after a save) and it is not tested.

**Fix:**
```typescript
it('seed() with both args undefined resets to empty minutes state', () => {
  const { seed, unit, durationMinutes } = useDurationField(60, 'minutes');
  seed(undefined, undefined);
  expect(unit.value).toBe('minutes');
  expect(durationMinutes.value).toBeUndefined();
});
```

---

_Reviewed: 2026-04-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
