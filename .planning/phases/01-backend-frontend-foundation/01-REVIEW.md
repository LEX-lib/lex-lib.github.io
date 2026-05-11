---
phase: 01-backend-frontend-foundation
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/types/wallecx/vaccinations/types.d.ts
  - src/lib/pocketbase/vaccinationMapper.ts
  - src/components/projects/wallecx/WallecxApp.vue
  - src/router/index.ts
  - package.json
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Phase 1 Wallecx skeleton: TypeScript type definitions, PocketBase mapper, the Vue component shell, router registration, and `package.json`. The auth guard wiring is correct — `/projects/wallecx` requires authentication — and the mapper correctly strips server-managed fields (`id`, `created`, `updated`, `user`, `card`) before updates. No critical security issues were found; per-user isolation is delegated to PocketBase server-side rules, which is the correct architecture.

Three warnings were found: a redundant field on the `Vaccinations` interface that duplicates a `RecordModel` base field, a fragile error-classification pattern in the component that swallows PocketBase-specific error detail, and a missing `isLoggedIn` reactive guard in the component that could allow a brief data fetch if the auth token expires mid-session. Three info items cover the `card` field type opacity, an unused commented-out `signup` method exposed in a store return, and a missing route name constant for `wallecx`.

---

## Warnings

### WR-01: `Vaccinations` interface re-declares fields already on `RecordModel`

**File:** `src/types/wallecx/vaccinations/types.d.ts:4-6`

**Issue:** `RecordModel` (from the `pocketbase` SDK) already declares `id: string`, `created: string`, and `updated: string`. Redeclaring them in the extending interface is harmless today but causes confusion: if the SDK changes their types (e.g., to `Date`), the child interface silently shadows rather than inheriting the corrected type, defeating the purpose of extending `RecordModel`.

**Fix:**
```ts
// Remove the three redundant declarations; RecordModel already provides them
export interface Vaccinations extends RecordModel {
  user: string;
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
  card: string;
}
```

---

### WR-02: Component catches all errors uniformly — PocketBase auth errors are indistinguishable from network errors

**File:** `src/components/projects/wallecx/WallecxApp.vue:18-21`

**Issue:** The `catch (e: unknown)` block in `onMounted` displays a generic toast for every failure. PocketBase returns a `ClientResponseError` with a `status` property. A 401/403 (token expired, rule denied) will show "Failed to load vaccination records" rather than redirecting to `/login`, leaving the user on a broken authenticated screen with no recovery path. This also masks data-isolation rule failures silently.

**Fix:**
```ts
import { ClientResponseError } from "pocketbase";
import { useRouter } from "vue-router";

const router = useRouter();

// inside onMounted catch block:
} catch (e: unknown) {
  if (e instanceof ClientResponseError && (e.status === 401 || e.status === 403)) {
    toast.error("Session expired. Please log in again.");
    await router.push({ name: "login" });
  } else {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  }
}
```

---

### WR-03: No reactive guard against auth state expiry during session

**File:** `src/components/projects/wallecx/WallecxApp.vue:12-24` / `src/router/index.ts:77-86`

**Issue:** The `beforeEach` guard is an entry-time check only. Once the component is mounted, PocketBase's auth token can expire and `pb.authStore.record` becomes `null`, but `records` is never cleared and the component continues to render stale data. For a health records app (vaccinations), displaying a previous user's records to a logged-out or switched-user context is a data hygiene concern.

**Fix:** Watch `useAuthStore().isLoggedIn` inside the component and clear records + redirect if it becomes false:
```ts
import { watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn) {
      records.value = [];
      router.push({ name: "login" });
    }
  }
);
```

---

## Info

### IN-01: `card` field on `Vaccinations` is typed as `string` but likely holds a file/relation token

**File:** `src/types/wallecx/vaccinations/types.d.ts:15`

**Issue:** PocketBase file fields are stored as filename strings, but accessing them requires constructing a URL via `pb.files.getURL()`. Typing `card` as `string` is not wrong, but provides no indication of its semantic role. If `card` is a file field, downstream code may attempt to use the raw string as a URL directly, which will not work correctly.

**Fix:** Add a JSDoc comment to signal intent:
```ts
/** PocketBase file field — use `pb.files.getURL(record, record.card)` to get the download URL */
card: string;
```

---

### IN-02: Commented-out `signup` function is exported in the store return statement

**File:** `src/stores/auth.ts:34`

**Issue:** The `signup` function body is commented out (lines 19–28), but the return object comment stub `, signup` remains. The comment is cosmetically harmless but signals unfinished work and can confuse future contributors about what the store exposes.

**Fix:** Either remove the comment reference entirely or extract `signup` into a separate tracked task:
```ts
// Before:
return { user, isLoggedIn, login, logout }; //, signup, logout

// After (cleaned up):
return { user, isLoggedIn, login, logout };
```

---

### IN-03: Wallecx route uses a hardcoded string name instead of a route constant

**File:** `src/router/index.ts:66`

**Issue:** All other mini-apps (LexTrack, Larga, etc.) share the same pattern, so this is a systemic convention rather than a Wallecx-only issue. However, since the project convention (per CLAUDE.md) states "Route name constants exported from `src/constants/routes/`", the new `wallecx` route should follow this pattern. Currently the name `"wallecx"` is a magic string that must be duplicated anywhere `router.push({ name: "wallecx" })` is called.

**Fix:** Add a `wallecx` route name constant in `src/constants/routes/` following the existing naming pattern, then reference it in `src/router/index.ts` and in `WR-02`'s fix above.

---

_Reviewed: 2026-05-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
