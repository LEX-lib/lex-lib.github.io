---
phase: 05-schema-types-form-field
reviewed: 2026-05-12T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/types/wallecx/vaccinations/types.d.ts
  - src/components/projects/wallecx/ManageVaccination.vue
  - src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-05-12
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the `Vaccinations` type definition, the `ManageVaccination` form component, and the vaccination mapper unit tests. There are no security or data-loss issues. Three warnings cover a reset gap on dialog reopen, a non-null assertion on a canvas context that can return `null` in certain environments, and a missing `vaccine_type` field in the mapper and tests. Three info items cover redundant fields in the type definition, the unconditional "Location data removed" toast, and a dead import reference in the component.

---

## Warnings

### WR-01: `pendingFile` not reset when dialog reopens for a new record

**File:** `src/components/projects/wallecx/ManageVaccination.vue:184-186`

**Issue:** `onHide` resets `pendingFile` when the dialog closes, and `onSubmit` resets it on successful save (line 174). However, if the parent closes the dialog without submitting (e.g., user clicks X) and then immediately reopens it for a different record, the `onHide` path is correct. But if `visible` is toggled programmatically to `false` then back to `true` without the `@hide` event firing (which can happen when using `v-model:visible` if the parent sets it directly), `onHide` is never called and the previous `pendingFile` survives into the new session. There is no reset guard in `initialValues` or a `watch(visible, ...)` handler.

**Fix:** Add a watcher on `visible` to reset `pendingFile` when it becomes `true`:

```ts
import { watch } from "vue";

watch(visible, (val) => {
  if (val) pendingFile.value = null;
});
```

This is a belt-and-suspenders guard alongside `onHide`, and is safe to have both.

---

### WR-02: Non-null assertion on `canvas.getContext("2d")` can crash in headless/offscreen environments

**File:** `src/components/projects/wallecx/ManageVaccination.vue:92`

**Issue:** `const ctx = canvas.getContext("2d")!` uses a TypeScript non-null assertion. `getContext` returns `null` when the browser cannot create a 2D rendering context (e.g., GPU resource exhaustion, certain privacy-hardened browsers, or during Vitest/jsdom unit tests). The null assertion suppresses the type error but does not guard the runtime crash — `ctx.drawImage(...)` on line 93 will throw a `TypeError: Cannot read properties of null`.

**Fix:** Add an explicit null check and fall through to the catch block:

```ts
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to acquire canvas 2D context.");
ctx.drawImage(img, 0, 0);
```

The surrounding `try/catch` will then handle this gracefully via the existing error toast.

---

### WR-03: `vaccine_type` stripped by `mapToUpdateVaccination` — update payload omits a required writable field

**File:** `src/lib/pocketbase/vaccinationMapper.ts:3-21`

**Issue:** `mapToUpdateVaccination` does not include `vaccine_type` in its return object. The type definition (`types.d.ts:8`) marks `vaccine_type` as a required (non-optional) string field, and the component's Zod schema (`ManageVaccination.vue:42`) requires it. When an update is submitted via FormData (lines 131-169), `vaccine_type` is appended directly to `FormData` in the component — that path is fine. However, the mapper is the declared "canonical writable field set" (line 166 comment) and it disagrees with the actual writable fields. This is a maintenance hazard: any future code that uses `mapToUpdateVaccination` as the source of truth for an update payload will silently drop the vaccine type on every update.

The mapper should either include `vaccine_type` to stay consistent with the component's FormData path, or its scope should be explicitly documented as excluding it (but the comment at line 166 says the opposite).

**Fix:** Add `vaccine_type` to the mapper's return type and body:

```ts
export function mapToUpdateVaccination(record: Vaccinations): {
  vaccine_type: string;
  vaccine_name: string;
  date_administered: string;
  // ... rest unchanged
} {
  return {
    vaccine_type: record.vaccine_type,
    vaccine_name: record.vaccine_name,
    // ... rest unchanged
  };
}
```

And update the spec to assert `payload.vaccine_type === "Flu"` in the "preserves writable fields" describe block.

---

## Info

### IN-01: `Vaccinations` interface re-declares fields already on `RecordModel`

**File:** `src/types/wallecx/vaccinations/types.d.ts:4-7`

**Issue:** `RecordModel` from PocketBase already declares `id: string`, `created: string`, and `updated: string`. Redeclaring them in the extending interface is harmless but adds noise and risks a future type mismatch if PocketBase ever changes those field types on the base.

**Fix:** Remove the three redundant lines:

```ts
export interface Vaccinations extends RecordModel {
  // id, created, updated come from RecordModel — remove them
  user: string;
  vaccine_type: string;
  // ...
}
```

---

### IN-02: "Location data removed" toast fires unconditionally on every image upload

**File:** `src/components/projects/wallecx/ManageVaccination.vue:118`

**Issue:** `toast.info("Location data removed.")` fires for every image processed, including images that never had GPS/EXIF data (e.g., screenshots, generated images). This is a minor UX issue acknowledged inline with the comment `// D-07: unconditional on every image upload`. If the comment documents an intentional design decision, no action is needed; flagging it here for awareness.

**Fix (optional):** If the intent is to only notify when EXIF data was actually present, a library like `exifr` could be used to detect GPS tags before stripping. Otherwise, changing the message to something neutral like "Image processed." avoids a potentially misleading implication.

---

### IN-03: `mapToUpdateVaccination` imported but its return value is never used in the update path

**File:** `src/components/projects/wallecx/ManageVaccination.vue:10, 166`

**Issue:** The mapper is imported on line 10 and referenced with `void mapToUpdateVaccination` on line 166. The `void` expression is used to suppress a "no-unused-vars" lint warning while keeping the import for documentation intent. This is an unusual pattern — the import stays in the bundle but contributes no runtime behaviour. The inline comment documents the rationale, but it is a dead-code smell.

**Fix:** If the mapper is serving only as a design contract reference, consider removing the import and stating the field contract in a comment. If the mapper should be the authoritative serialiser, refactor `onSubmit` to call it and derive the FormData fields from its output — this would also fix WR-03 above.

---

_Reviewed: 2026-05-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
