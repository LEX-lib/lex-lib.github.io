# Phase 3: Write Path — Code Review Report

**Reviewed:** 2026-05-12T00:00:00Z
**Depth:** standard
**Reviewer:** Claude (gsd-code-reviewer)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 2 |
| MEDIUM   | 4 |
| LOW      | 3 |
| INFO     | 3 |
| **Total**| **12** |

**Overall Verdict: WARN**

The write path correctly implements the five key security requirements: EXIF GPS stripping via canvas re-encode (WRITE-03), server-first delete before local splice (WRITE-06), no raw user input in PocketBase filter strings (WRITE-08), isSaving guard (WRITE-07), and the `wallecx` route carries `requiresAuth: true`. No critical security vulnerabilities were found.

Two HIGH findings require attention before ship: a null-pointer crash on `pb.authStore.record!.id` when the auth store lacks a record (edge case but reachable), and a stale `pendingFile` carried across dialog sessions when the user submits successfully without triggering `@hide` independently. Four MEDIUM findings cover correctness edge cases and code quality. Three LOW and three INFO items are minor polish.

---

## Files Reviewed

1. `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts`
2. `src/components/projects/wallecx/ManageVaccination.vue`
3. `src/components/projects/wallecx/WallecxApp.vue`
4. `src/components/projects/wallecx/VaccinationList.vue`
5. `src/lib/pocketbase/vaccinationMapper.ts` _(dependency, read for context)_
6. `src/types/wallecx/vaccinations/types.d.ts` _(dependency, read for context)_

---

## Security Requirements Verification

| Requirement | Status | Notes |
|-------------|--------|-------|
| WRITE-03 EXIF GPS strip | PASS | Canvas re-encode → `imageCompression`; PDF bypasses correctly; toast fires unconditionally |
| WRITE-04 save-loop prevention | PARTIAL — see HIGH-02 | Server record emitted to parent which `unshift`es it; but `Object.assign` into a local ref is not performed in `WallecxApp.onCreated` — comment at line 151 says it does, but the actual code does not. The dialog closes so the ref resets; re-open sets `record.value` from the list item, which IS the server record. Risk is low but the comment is misleading. |
| WRITE-06 server-first delete | PASS | `await pb.delete()` on line 80 before `splice` on line 82; catch block does not splice |
| WRITE-07 isSaving guard | PASS | `isSaving.value = true` set before async work; reset in `finally`; button `disabled` + `loading` bound to `isSaving` |
| WRITE-08 filter injection | PASS | `getFullList` uses no filter; delete uses typed `record.id`; no raw user string interpolated into filter |

---

## HIGH Issues

### HIGH-01: Non-null assertion on `pb.authStore.record!.id` crashes if session expires mid-session

**File:** `src/components/projects/wallecx/ManageVaccination.vue:147`
**Issue:** The `!` non-null assertion on `pb.authStore.record` will throw a runtime TypeError if the PocketBase session has expired or been cleared between page load and form submission. The route guard only checks auth at navigation time. A user who leaves the tab open long enough for their token to expire can trigger this crash path — the error will be swallowed by the surrounding `catch`, show a generic toast, and log an unhelpful TypeError rather than directing the user to re-authenticate.

**Recommendation:**
```typescript
// Replace line 147 with an explicit guard
const userId = pb.authStore.record?.id;
if (!userId) {
  toast.error("Session expired. Please log in again.");
  return;
}
formData.append("user", userId);
```

---

### HIGH-02: `pendingFile` not cleared after a successful save — stale file on next open

**File:** `src/components/projects/wallecx/ManageVaccination.vue:166, 175–177`
**Issue:** `visible.value = false` on line 166 triggers the Dialog's `@hide` event, which calls `onHide()` and sets `pendingFile.value = null`. This looks correct at first glance, but only holds when the PrimeVue Dialog fires `@hide` synchronously in response to the `v-model:visible` change. In the event of a Dialog that suppresses `@hide` (e.g., `closable="false"` races with the programmatic close during the `isSaving` window, or a future version of PrimeVue changes the timing), `pendingFile` will be non-null when the dialog is re-opened. The safer pattern is to clear `pendingFile` explicitly at the end of the success path, not rely solely on the Dialog lifecycle event.

**Recommendation:**
```typescript
// In onSubmit, after emitting and before setting visible.value = false
pendingFile.value = null; // explicit reset — do not rely solely on @hide
visible.value = false;
```

---

## MEDIUM Issues

### MEDIUM-01: Misleading comment — `WallecxApp.onCreated` does NOT call `Object.assign`

**File:** `src/components/projects/wallecx/ManageVaccination.vue:151–152`
**Issue:** The comment reads:
> `emit("created", created) — WallecxApp.onCreated does Object.assign(localItem, created)`

Examining `WallecxApp.vue:54–57`, `onCreated` only calls `records.value.unshift(created)`. There is no `Object.assign` call. The WRITE-04 save-loop bug prevention does not depend on `Object.assign` here — it is implicitly safe because the dialog closes (`visible.value = false`) and `record.value` is reset to `null` on next open via `openManage`. However, the comment is factually incorrect and will mislead future maintainers into thinking an invariant exists that does not.

**Recommendation:** Replace the comment with accurate description:
```typescript
// emit created record to parent; parent unshifts it into the local list.
// Save-loop prevention: dialog closes after create, so record.value resets to null
// on next open. The 'id' is only needed for PATCH (edit path), where record.value
// is set from the list item which already has the server id.
emit("created", created);
```

---

### MEDIUM-02: `void mapToUpdateVaccination` — dead reference used as documentation

**File:** `src/components/projects/wallecx/ManageVaccination.vue:158`
**Issue:** The `mapToUpdateVaccination` import is used only in a `void` expression to prevent a TypeScript "imported but unused" lint error while acting as a comment. This is an anti-pattern: the import exists, the function is not called, and the `void` expression has no runtime or compile-time effect. If the mapper contract changes, this code will not fail, giving a false sense of validation.

**Recommendation:** Either call the mapper to build the update payload (and drop the manual FormData field-by-field append for the update path), or remove the import entirely and document the field parity with a comment only:
```typescript
// UPDATE path — FormData fields mirror mapToUpdateVaccination writable set:
// vaccine_name, date_administered, dose_number, lot_number, manufacturer, location, notes
const updated = await pb
  .collection("wallecx_vaccinations")
  .update<Vaccinations>(record.value!.id, formData);
```

---

### MEDIUM-03: `onCreated` uses `unshift` but sort order is by `date_administered`, not insertion time

**File:** `src/components/projects/wallecx/WallecxApp.vue:54–57`
**Issue:** `getFullList` sorts by `-date_administered` (newest date first). `unshift` places the new record at index 0 regardless of its `date_administered` value. If a user creates a record with a historical date (e.g., "I got this vaccine two years ago"), the new row will appear at the top of the list visually but will jump to its correct sorted position only after a page reload. This is a known UI-SPEC trade-off, but there is no comment documenting the intentional decision.

**Recommendation:** If optimistic insertion is intentional, add a comment explaining the trade-off. If correct sort order is required, re-sort after insert:
```typescript
function onCreated(created: Vaccinations): void {
  records.value.unshift(created);
  // Note: optimistic insert at head; date sort is re-established on next full reload.
  // A historical date entry will appear at top until refresh.
}
```
Or, for strict sort correctness:
```typescript
function onCreated(created: Vaccinations): void {
  records.value.push(created);
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
}
```

---

### MEDIUM-04: `canvas.getContext("2d")!` — non-null assertion; silent failure on unsupported browsers

**File:** `src/components/projects/wallecx/ManageVaccination.vue:90`
**Issue:** `canvas.getContext("2d")` returns `null` in contexts where the 2D canvas API is unavailable (e.g., some headless environments, `OffscreenCanvas` misuse, or future browser restrictions). The `!` assertion bypasses the null check. If `ctx` is null, `ctx.drawImage(img, 0, 0)` throws a TypeError that propagates to the surrounding `catch`, sets `pendingFile.value = null`, and shows a generic error toast. The user loses their selected file with no clear reason.

**Recommendation:**
```typescript
const ctx = canvas.getContext("2d");
if (!ctx) {
  toast.error("Canvas not supported in this browser. Please try a different browser.");
  return;
}
ctx.drawImage(img, 0, 0);
```

---

## LOW Issues

### LOW-01: `AddVaccination` type exported but never used in the write path

**File:** `src/types/wallecx/vaccinations/types.d.ts:18`
**Issue:** `type AddVaccination = Omit<Vaccinations, "id" | "created" | "updated">` is defined but `ManageVaccination.vue` builds a `FormData` object directly and does not use this type for intermediate shaping. The type is dead export — it neither constrains the create payload nor is used by the mapper.

**Recommendation:** Either use `AddVaccination` to type-check the FormData construction via an intermediate object, or remove the export if it has no consumers.

---

### LOW-02: File size validation duplicated between `FileUpload` props and `onFileSelect`

**File:** `src/components/projects/wallecx/ManageVaccination.vue:66, 256`
**Issue:** The 10 MB limit is enforced twice: declaratively via `:maxFileSize="10485760"` on `FileUpload` (PrimeVue handles rejection before `@select` fires), and imperatively in `onFileSelect` at line 66. This is not a bug, but the duplication creates a maintenance risk — changing one without the other produces inconsistent UX.

**Recommendation:** Define a constant at module scope and reference it in both places:
```typescript
const MAX_CARD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
```

---

### LOW-03: `emit('addFirst')` in template rather than a named handler function

**File:** `src/components/projects/wallecx/VaccinationList.vue:66`
**Issue:** `@click="emit('addFirst')"` inline in the template is a minor consistency issue — the other emits (`view`, `edit`, `remove`) are dispatched in the same inline style but with data arguments. For a childless emit this is acceptable, but extracting it to a handler is more consistent with the codebase's pattern where template logic is thin.

**Recommendation:** Minor; acceptable as-is. If consistency is desired:
```typescript
function onAddFirst(): void {
  emit('addFirst');
}
```

---

## INFO Items

### INFO-01: Spec test for WRITE-04 validates mapper contract but not the actual `Object.assign` path

**File:** `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts:75–83`
**Issue:** The `create-then-update id-refresh contract` describe block tests `Object.assign` on a plain object literal, not on the actual `manageRecord` Pinia/ref value used in `WallecxApp`. The test verifies that JS `Object.assign` propagates `id`, which is trivially true and not specific to the Wallecx implementation. This test would pass even if the component used a completely different mechanism. It provides coverage confidence without actually testing the component contract.

**Recommendation:** Accept as a unit-level smoke test for the mapper. If the WRITE-04 contract is considered high-risk, add a component-level integration test using `@vue/test-utils` that mounts `ManageVaccination` and asserts the emitted `created` record has the server `id`.

---

### INFO-02: `listToken` fetched once at mount; tokens may expire during long sessions

**File:** `src/components/projects/wallecx/WallecxApp.vue:27`
**Issue:** `pb.files.getToken()` is called once in `onMounted`. PocketBase file tokens have a limited lifetime. For long-lived sessions, the `listToken` used to generate thumbnail URLs may expire, causing 401s on image requests. This is a known limitation of the current implementation and may be acceptable for a portfolio project.

**Recommendation:** Document the expiry trade-off in a comment, or implement a reactive getter that refreshes the token before building URLs if the token is older than a threshold.

---

### INFO-03: No `collectionId` / `collectionName` / `expand` fields in `Vaccinations` interface

**File:** `src/types/wallecx/vaccinations/types.d.ts`
**Issue:** The `Vaccinations` interface extends `RecordModel`, which provides `collectionId`, `collectionName`, and `expand` from PocketBase's base type. The spec test fixture (`vaccinationMapper.spec.ts:9–10`) manually adds `collectionId`, `collectionName`, and `expand` to satisfy the type, which means `RecordModel` already provides them. This is not a bug, but it confirms the type hierarchy is correct and no duplication is needed in the interface itself.

**Recommendation:** No action required. This is informational only.

---

_Reviewed: 2026-05-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
