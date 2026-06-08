---
phase: 02-read-path
reviewed: 2026-05-11T05:02:05Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/projects/wallecx/AttachmentPreview.vue
  - src/components/projects/wallecx/VaccinationList.vue
  - src/components/projects/wallecx/VaccinationDetail.vue
  - src/components/projects/wallecx/WallecxApp.vue
  - index.html
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: resolved
warnings_resolved: 2026-05-12
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-11T05:02:05Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files were reviewed for the Wallecx vaccination records read-path: the root app shell, list component, detail component, attachment preview component, and the SPA's HTML entry point. The implementation is generally sound — no `v-html` is used anywhere, all user-supplied text is rendered through Vue's safe mustache interpolation, and the CSP `worker-src 'self' blob:` directive is correctly set to satisfy PDF.js's blob worker requirement. The short-lived token pattern (fetch token on `openDetail`, clear on dialog `@hide`) is correctly applied.

Three warnings were found: a token passed to list-thumbnail URLs that will be stale on subsequent views, a missing empty-string guard on `record.card` inside `thumbUrl()` that produces a malformed PocketBase URL when `card` is an empty string, and a `showDetail` flag that is set to `true` before a failing `getToken` call resolves — meaning the dialog can open in a token-less state after the error path. Three info items cover stub event handlers that silently drop actions, a `console.error` left in production paths, and a naming nit on the `Vaccinations` type.

---

## Warnings

### WR-01: `listToken` is fetched once on mount and becomes stale for thumbnails

**File:** `src/components/projects/wallecx/WallecxApp.vue:22`

**Issue:** `listToken` is obtained once in `onMounted` via `pb.files.getToken()`. PocketBase short-lived file tokens expire (default 5 minutes). After expiry, every thumbnail rendered by `VaccinationList` will produce a 403 from PocketBase because the token embedded in the thumb URL is no longer valid. This differs from the detail `fileToken`, which is refreshed each time `openDetail` is called.

**Fix:** Refresh the list token on a timer (or lazily before each render) to keep it within its validity window. The simplest approach is a periodic refresh that matches the token TTL:

```ts
// In WallecxApp.vue — after initial mount, refresh listToken before expiry
const LIST_TOKEN_TTL_MS = 4 * 60 * 1000; // 4 min — safely inside PocketBase's 5-min window

let listTokenTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
    listToken.value = await pb.files.getToken();
    listTokenTimer = setInterval(async () => {
      listToken.value = await pb.files.getToken();
    }, LIST_TOKEN_TTL_MS);
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (listTokenTimer) clearInterval(listTokenTimer);
});
```

---

### WR-02: `thumbUrl()` called when `record.card` is an empty string, producing a malformed URL

**File:** `src/components/projects/wallecx/VaccinationList.vue:21-23`

**Issue:** The `Vaccinations` type declares `card: string` (non-optional). PocketBase returns an empty string `""` when no file is attached. The template correctly guards `<img v-if="data.card">` so the broken URL is never rendered — but the `thumbUrl(data)` function call in `:src` is only skipped because Vue evaluates the `:src` binding lazily when `v-if` is falsy. This guard works today, but the function itself does not validate its input. If `thumbUrl` is ever called elsewhere (e.g., in a future computed prop or unit test), `pb.files.getURL(record, "", ...)` will produce a URL ending in `/api/files/<collection>/<id>/` with no filename, which is a 404.

**Fix:** Add an explicit guard inside `thumbUrl`:

```ts
function thumbUrl(record: Vaccinations): string {
  if (!record.card) return "";
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}
```

---

### WR-03: Dialog can open in a token-less state when `getToken` fails inside `openDetail`

**File:** `src/components/projects/wallecx/WallecxApp.vue:31-42`

**Issue:** In `openDetail`, `showDetail.value = true` is set unconditionally after the `try/catch` block, regardless of whether `pb.files.getToken()` succeeded. When the token fetch fails, `fileToken` remains `""`, the error toast fires, and then the dialog still opens — passing an empty-string token to `VaccinationDetail` and on to `AttachmentPreview`. `AttachmentPreview` will then generate URLs like `...?token=` which will 403, and the PDF error fallback will show an unhelpful "Preview unavailable" message with a broken download link.

```ts
// Current — showDetail is always set true
async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
    }
  }
  showDetail.value = true; // <-- runs even after catch
}
```

**Fix:** Return early after the error, or open the dialog only on success. Records without a `card` can still open normally — only the token failure path needs blocking:

```ts
async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
      selectedRecord.value = null;
      return; // abort — do not open the dialog
    }
  }
  showDetail.value = true;
}
```

---

## Info

### IN-01: Edit and Remove handlers are silent stubs

**File:** `src/components/projects/wallecx/WallecxApp.vue:58-59`

**Issue:** `@edit="() => {}"` and `@remove="() => {}"` are bound to no-op arrow functions. Buttons in `VaccinationList` are already `disabled`, but the event still bubbles to the parent and silently does nothing. If the `disabled` guard is ever removed without wiring up the handlers, actions will silently fail with no user feedback.

**Fix:** Either remove the `@edit` and `@remove` bindings entirely (the emits will just be unheard), or add a stub that at least logs a warning during development:

```ts
function handleEditStub(): void {
  console.warn("WallecxApp: edit not yet implemented");
}
function handleRemoveStub(): void {
  console.warn("WallecxApp: remove not yet implemented");
}
```

---

### IN-02: `console.error` left in production-path catch blocks

**File:** `src/components/projects/wallecx/WallecxApp.vue:25`, `src/components/projects/wallecx/WallecxApp.vue:38`

**Issue:** Two `console.error` calls are present in paths that run in the production build. While helpful for debugging, they leak internal PocketBase error structure and collection names (`wallecx_vaccinations`) to browser consoles in production.

**Fix:** Gate behind a development check or remove entirely if `vue-sonner` toast messages are sufficient for users:

```ts
if (import.meta.env.DEV) {
  console.error("WallecxApp: getFullList failed", e);
}
```

---

### IN-03: `Vaccinations` type name uses plural where singular is conventional

**File:** `src/types/wallecx/vaccinations/types.d.ts:3`

**Issue:** The interface `Vaccinations` represents a single vaccination record (it extends `RecordModel` and has singular field names like `vaccine_name`, `dose_number`). By convention in TypeScript, interfaces and types representing a single entity use the singular form: `Vaccination`, not `Vaccinations`. The plural form suggests a collection type (e.g., `Vaccinations[]`), which causes mild confusion when reading `ref<Vaccinations | null>` or `defineProps<{ record: Vaccinations }>`.

**Fix:** Rename to `Vaccination` and update all four import sites:

```ts
// types.d.ts
export interface Vaccination extends RecordModel { ... }
export type AddVaccination = Omit<Vaccination, "id" | "created" | "updated">;
```

---

_Reviewed: 2026-05-11T05:02:05Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
