---
phase: 13-write-path-managemembership-crud
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/lib/pocketbase/__tests__/membershipMapper.spec.ts
  - src/components/projects/wallecx/ManageMembership.vue
  - src/components/projects/wallecx/MembershipDetail.vue
  - src/components/projects/wallecx/MembershipsTab.vue
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed covering the ManageMembership CRUD write path: the PocketBase mapper unit tests, the create/edit dialog (`ManageMembership.vue`), the read-only detail panel (`MembershipDetail.vue`), and the orchestrating tab (`MembershipsTab.vue`).

Overall the implementation is solid. Security posture is good — no XSS vectors (notes rendered via `{{ }}`, never `v-html`), user ID is sourced from `pb.authStore.record?.id` with a null guard, and file uploads are size-capped with type-allowlisted EXIF stripping. The delete flow uses `confirm.require` before any mutation and splices only on server success.

Four warnings were found: a stale `fileToken` risk when editing a record without an image, an un-awaited async edge case in `openEdit`, a keyboard-inaccessible scan overlay (missing `tabindex`/`focus`), and a silent swallow of the wake-lock release error that could mask unexpected state. Three info-level items cover a `void` marker that is functionally dead, a duplicated `BARCODE_TYPE_LABELS` map, and the test suite omitting an `expand` / `collectionId` / `collectionName` strip assertion.

---

## Warnings

### WR-01: `fileToken` may be stale (empty string) when edit dialog opens for a card that has no image

**File:** `src/components/projects/wallecx/MembershipsTab.vue:53-57`

**Issue:** `openEdit` unconditionally passes the currently-cached `fileToken` to `ManageMembership` via `:token="fileToken"`. `fileToken` is only fetched inside `openDetail` when the selected record has a `card_image`. If the user opens the detail panel for a card *without* an image, `fileToken` remains `''`. Inside the edit dialog, `thumbnailUrl` will still be `null` (no image, so no harm for the thumbnail). However if the user later adds an image in the same session and then edits a different card that *does* have an image, the cached token from the previous `openDetail` call is used for the thumbnail URL — which may have expired or belong to a different auth context. The risk is low in practice but the coupling is fragile.

**Fix:** Fetch a fresh token inside `openEdit` when the record being edited has a `card_image`, mirroring the pattern already used in `openDetail`:

```typescript
async function openEdit(record: Memberships): Promise<void> {
  if (record.card_image) {
    try {
      fileToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      toast.error('Failed to load card image token.')
      console.error('MembershipsTab: getToken (edit) failed', e)
      // proceed anyway — thumbnail simply won't render
    }
  }
  manageRecord.value = record
  showDetail.value = false
  showManage.value = true
}
```

---

### WR-02: `openEdit` called from `@edit` emit is synchronous but the corrected version must be async — template call site does not await

**File:** `src/components/projects/wallecx/MembershipsTab.vue:165`

**Issue:** The template calls `@edit="openEdit(selectedRecord!)"`. The current `openEdit` is synchronous (`function openEdit`), so this is fine today. If `openEdit` is promoted to `async` (per WR-01 fix above), Vue event handlers do not propagate unhandled promise rejections to the global error handler in the same way as regular `await` call sites. The try/catch inside the async function covers the token fetch, but any error thrown *after* the try/catch (theoretically) would be silently swallowed.

**Fix:** When making `openEdit` async, ensure all error paths are caught inside the function body. The template call site `@edit="openEdit(selectedRecord!)"` is fine as-is for Vue event handlers — no change needed there — but add a `.catch` fallback or ensure the function body is fully wrapped:

```typescript
async function openEdit(record: Memberships): Promise<void> {
  try {
    if (record.card_image) {
      fileToken.value = await pb.files.getToken()
    }
    manageRecord.value = record
    showDetail.value = false
    showManage.value = true
  } catch (e: unknown) {
    toast.error('Failed to open edit dialog.')
    console.error('MembershipsTab: openEdit failed', e)
  }
}
```

---

### WR-03: Scan overlay is not keyboard-focusable — `@keydown.esc` listener on a non-interactive `div` will not fire unless the element has focus

**File:** `src/components/projects/wallecx/MembershipDetail.vue:175-176`

**Issue:** The scan overlay `div` has `@keydown.esc.stop="closeScanOverlay"` and `role="dialog" aria-modal="true"`, but the `div` has no `tabindex` attribute. A keyboard user who opens the overlay will not have focus moved into it, so `Esc` will not close the overlay via this handler. The close button is reachable by `Tab` but only after the user manually tabs to it; the `Esc` shortcut is effectively broken for keyboard users.

**Fix:** Add `tabindex="-1"` and programmatically focus the overlay `div` (or the close button) when it opens:

```vue
<!-- In template -->
<div
  ref="overlayRef"
  v-if="showScanOverlay"
  tabindex="-1"
  ...
  @keydown.esc.stop="closeScanOverlay"
>

<!-- In script -->
const overlayRef = ref<HTMLElement | null>(null)

async function openScanOverlay(): Promise<void> {
  showScanOverlay.value = true
  await nextTick()
  overlayRef.value?.focus()
  // wake lock acquisition unchanged...
}
```

---

### WR-04: `closeScanOverlay` silently swallows wake-lock release errors with an empty catch block

**File:** `src/components/projects/wallecx/MembershipDetail.vue:45-50`

**Issue:** `closeScanOverlay` wraps `wakeLock.value?.release()` in `try { ... } catch { /* ignore */ }`. An empty catch with the comment `/* ignore */` is a lint-suppressible pattern but more importantly it hides genuinely unexpected errors. The Screen Wake Lock API throws `NotAllowedError` only when the page is hidden — which is a legitimate non-error case — but other `DOMException` types (e.g., `InvalidStateError` if the sentinel was already released) would also be swallowed silently.

**Fix:** Log unexpected errors while still degrading gracefully for the expected hidden-page case:

```typescript
async function closeScanOverlay(): Promise<void> {
  showScanOverlay.value = false
  try {
    await wakeLock.value?.release()
  } catch (e: unknown) {
    // NotAllowedError is expected when page is hidden — log others
    if (e instanceof DOMException && e.name !== 'NotAllowedError') {
      console.warn('MembershipDetail: wake lock release failed', e)
    }
  }
  wakeLock.value = null
}
```

---

## Info

### IN-01: `void mapToUpdateMembership` comment-assertion is dead code

**File:** `src/components/projects/wallecx/ManageMembership.vue:227`

**Issue:** Line 227 reads `void mapToUpdateMembership; // confirms writable field set`. This expression evaluates to `undefined` and has no runtime effect. The intent (confirming the import is used and the field set is consistent) is meaningful for a developer reading the code, but it is dead code that oxlint/eslint may flag as a no-op expression. The import is already legitimately exercised by the test suite; this runtime sentinel adds no safety net.

**Fix:** Remove the line entirely. If the intent is to enforce field-set consistency at build time, the mapper's return type already documents the writable fields. Alternatively, a TypeScript compile-time check (e.g., assigning `mapToUpdateMembership` to a typed constant that is never read) achieves the same without a runtime no-op.

---

### IN-02: `BARCODE_TYPE_LABELS` map is duplicated across `MembershipCard.vue` and `MembershipDetail.vue`

**File:** `src/components/projects/wallecx/MembershipDetail.vue:14-20` and `src/components/projects/wallecx/MembershipCard.vue:35-41`

**Issue:** Both components define an identical `BARCODE_TYPE_LABELS: Record<string, string>` constant. If a new barcode type is added to `ManageMembership.vue`'s `BARCODE_TYPE_OPTIONS`, both display maps must be updated independently.

**Fix:** Extract the constant to a shared location, e.g., `src/constants/wallecx/barcodeTypes.ts`:

```typescript
export const BARCODE_TYPE_LABELS: Record<string, string> = {
  qr: 'QR',
  code128: 'Code 128',
  ean13: 'EAN-13',
  code39: 'Code 39',
  number: 'Number only',
}
```

Import in both components. Also consider co-locating `BARCODE_TYPE_OPTIONS` from `ManageMembership.vue` in the same file to keep all barcode-type knowledge in one place.

---

### IN-03: Test suite does not assert that `collectionId`, `collectionName`, and `expand` are stripped

**File:** `src/lib/pocketbase/__tests__/membershipMapper.spec.ts:28-34`

**Issue:** The "strips server-managed fields" test checks `id`, `created`, `updated`, `user`, and `card_image`. The `Memberships` interface (via `RecordModel`) also carries `collectionId`, `collectionName`, and `expand`. These are present in the `makeMembership` fixture but are not asserted as absent from the mapped payload. While `mapToUpdateMembership` does correctly omit them (by not including them in the returned object literal), the test doesn't verify this contract. A future refactor that accidentally spreads `...record` would pass the existing assertions but break the payload contract.

**Fix:** Extend the existing strip test:

```typescript
it("strips id, created, updated, user, card_image, collectionId, collectionName, expand", () => {
  expect(payload).not.toHaveProperty("id");
  expect(payload).not.toHaveProperty("created");
  expect(payload).not.toHaveProperty("updated");
  expect(payload).not.toHaveProperty("user");
  expect(payload).not.toHaveProperty("card_image");
  expect(payload).not.toHaveProperty("collectionId");
  expect(payload).not.toHaveProperty("collectionName");
  expect(payload).not.toHaveProperty("expand");
});
```

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
