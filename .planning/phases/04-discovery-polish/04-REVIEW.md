---
phase: 04-discovery-polish
reviewed: 2026-05-12T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/views/ProjectsView.vue
  - src/App.vue
  - src/components/projects/wallecx/WallecxApp.vue
  - src/components/projects/wallecx/VaccinationList.vue
  - src/components/projects/wallecx/ManageVaccination.vue
  - src/router/__tests__/guard.spec.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
verdict: WARN
---

# Phase 4: Discovery & Polish — Code Review Report

**Reviewed:** 2026-05-12
**Depth:** standard
**Files Reviewed:** 6
**Verdict:** WARN — No critical/security issues. Three warnings represent logic correctness gaps that should be addressed before shipping; three info items are low-priority hygiene.

---

## Summary

All six Phase 4 source files were reviewed. Security requirements verified:

- **POLISH-03 (exportJson token-free URL):** PASS. `pb.files.getURL(r, r.card)` called without a token; access is gated server-side by PocketBase collection rules. No token is embedded in the export payload.
- **HIGH-01 (null-safe auth in ManageVaccination):** PARTIAL PASS. `pb.authStore.record?.id` with early return is correctly implemented in the CREATE branch (lines 147–152). One `!` non-null assertion remains at line 166 in the UPDATE branch (`record.value!.id`). The assertion is logically safe — the `else` block is only reachable when `isEditMode.value === true`, which guarantees `record.value !== null`. However it violates the stated no-`!`-assertion policy and should be replaced.
- **WR-03 (openDetail abort on token failure):** PASS. The `return` after `toast.error` at line 62 correctly prevents `showDetail.value = true` from being reached. Dialog does not open in a token-less state.

---

## Warnings

### WR-A: `onMounted` conflates two distinct failures under one misleading toast

**File:** `src/components/projects/wallecx/WallecxApp.vue:29-46`
**Issue:** `getFullList` (line 31) and `pb.files.getToken()` (line 33) share a single try/catch block. If records load successfully but the token fetch fails, the user sees "Failed to load vaccination records." — an inaccurate message. Worse, `listTokenTimer` is never started, so thumbnails remain broken for the entire session with no retry path. This is a silent degradation that looks like a hard failure.
**Fix:**
```typescript
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
    return;
  } finally {
    isLoading.value = false;
  }

  // Separate try: token failure does not mask a successful record load
  try {
    listToken.value = await pb.files.getToken();
    listTokenTimer = setInterval(async () => {
      try {
        listToken.value = await pb.files.getToken();
      } catch (e) {
        console.warn("WallecxApp: listToken refresh failed", e);
      }
    }, LIST_TOKEN_TTL_MS);
  } catch (e: unknown) {
    console.warn("WallecxApp: initial listToken fetch failed — thumbnails unavailable", e);
    toast.warn("Card thumbnails unavailable. Refresh to retry.");
  }
});
```

---

### WR-B: `onUpdated` does not re-sort after date change

**File:** `src/components/projects/wallecx/WallecxApp.vue:133-136`
**Issue:** `onCreated` (line 128) correctly re-sorts the list after insert. `onUpdated` only performs an in-place splice (line 135) with no sort step. If a user edits a record and changes `date_administered`, the display order becomes stale — older records appear above newer ones until the page is hard-refreshed.
**Fix:**
```typescript
function onUpdated(updatedRecord: Vaccinations): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id);
  if (idx !== -1) records.value[idx] = updatedRecord;
  // Re-sort to maintain date-administered descending order (mirrors getFullList sort)
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
}
```

---

### WR-C: Remaining `!` non-null assertion in UPDATE path

**File:** `src/components/projects/wallecx/ManageVaccination.vue:166`
**Issue:** `record.value!.id` uses a TypeScript non-null assertion. While logically safe (the `else` branch is only reached when `isEditMode.value === true`, which means `record.value !== null`), this pattern was explicitly called out in HIGH-01 requirements as something to eliminate. A future refactor that changes the branching condition would not produce a compile-time error — it would produce a runtime crash.
**Fix:**
```typescript
} else {
  // Record is guaranteed non-null by isEditMode (computed from record.value !== null)
  // but use optional chaining + early return for type safety without assertion
  const recordId = record.value?.id;
  if (!recordId) {
    toast.error("Cannot update: record not found.");
    isSaving.value = false;
    return;
  }
  void mapToUpdateVaccination;
  const updated = await pb
    .collection("wallecx_vaccinations")
    .update<Vaccinations>(recordId, formData);
  emit("updated", updated);
}
```

---

## Info

### IN-01: `mapToUpdateVaccination` is imported but never called

**File:** `src/components/projects/wallecx/ManageVaccination.vue:10,163`
**Issue:** `mapToUpdateVaccination` is imported (line 10) and then referenced only as `void mapToUpdateVaccination` (line 163) to avoid the "unused import" lint warning. The mapper is never actually invoked — it acts as a documentation anchor. The FormData fields are constructed manually in parallel, meaning mapper and FormData can silently diverge. If a writable field is added to the mapper but not to the FormData block, the update will silently omit it.
**Fix:** Either call the mapper and derive FormData from its output (aligning both), or remove the import and add a code comment linking to the mapper file as a cross-reference. The current `void` trick suppresses lint but adds false confidence that the mapper is exercised at runtime.

---

### IN-02: `listToken` initial fetch failure is silent in the error log label

**File:** `src/components/projects/wallecx/WallecxApp.vue:43`
**Issue:** The outer catch block logs `"WallecxApp: getFullList failed"` regardless of which await inside the try block actually threw. If the failure was from `pb.files.getToken()`, the log label is misleading and will slow down future debugging. (This is secondary to WR-A but exists even after WR-A is fixed if the fix retains a catch with a generic label.)
**Fix:** Use distinct log labels per catch block, as shown in the WR-A fix above.

---

### IN-03: Guard spec re-implements production guard logic rather than exercising it

**File:** `src/router/__tests__/guard.spec.ts:49-58`
**Issue:** The `addGuard` function in the spec mirrors the production `beforeEach` logic manually rather than importing and registering the real guard. This is intentional (the comment at line 26 explains why `src/router/index.ts` is not imported), but it creates a test-to-production skew risk. If the production guard logic changes (e.g., a second condition is added), the spec will still pass because it tests its own copy of the old logic.
**Fix (low priority):** Consider extracting the guard logic into a standalone function in `src/router/guard.ts` that is imported by both `src/router/index.ts` and the test. This makes the spec exercise the real production function without pulling in the full router initialisation.

```typescript
// src/router/guard.ts
import type { NavigationGuard } from "vue-router";
import { useAuthStore } from "@/stores/auth";

export const requiresAuthGuard: NavigationGuard = (to, _from, next) => {
  const auth = useAuthStore();
  if (to.matched.some((r) => r.meta?.requiresAuth)) {
    if (!auth.isLoggedIn) {
      next({ name: "login", query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
};
```

---

## Security Requirements Verification

| Requirement | Status | Evidence |
|---|---|---|
| POLISH-03: exportJson uses no token in card_url | PASS | `WallecxApp.vue:99` — `pb.files.getURL(r, r.card)` with no token argument |
| HIGH-01: no `!` non-null assertion on auth | PARTIAL | CREATE branch uses `?.id` with early return (line 147). UPDATE branch still uses `record.value!.id` (line 166) — see WR-C |
| HIGH-02: pendingFile explicit reset on submit | PASS | `ManageVaccination.vue:171` — `pendingFile.value = null` before `visible.value = false`; also cleared in `onHide` (line 182) |
| WR-03: openDetail aborts on token failure | PASS | `WallecxApp.vue:61-63` — `return` prevents `showDetail.value = true` |
| WR-01: listToken refresh timer | PASS | `WallecxApp.vue:34-40` — `setInterval` at 4-min TTL; `clearInterval` in `onUnmounted` |
| WR-02: thumbUrl null guard | PASS | `VaccinationList.vue:23` — early return `""` when `!record.card` |
| No v-html in Wallecx | PASS | No `v-html` directive in any Wallecx component template |
| No template-literal filter strings | PASS | Template literals in `:alt` attributes only; no PocketBase filter interpolation |

---

## Files With No Issues

- `src/views/ProjectsView.vue` — Wallecx tile appended correctly; type definition, router link, and status badge all consistent with existing project entries.
- `src/App.vue` — `isProd` correctly assigned from `import.meta.env.PROD` as a `const`; `<SpeedInsights v-if="isProd" />` gates Vercel analytics correctly. No issues.
- `src/router/__tests__/guard.spec.ts` — Three test cases cover unauthenticated redirect (with correct `query.redirect`), authenticated pass-through, and public route access. Mock hoisting order is correct (`vi.mock` before named imports). `setActivePinia` in `beforeEach` prevents Pinia store bleed between tests. Guard logic is correct. (See IN-03 for a low-priority structural observation.)

---

_Reviewed: 2026-05-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
