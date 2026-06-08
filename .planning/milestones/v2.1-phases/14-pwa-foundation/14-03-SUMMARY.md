---
phase: 14-pwa-foundation
plan: "03"
subsystem: wallecx
tags: [pwa, auth-resilience, service-worker, vue-sonner, pocketbase, ios]

requires:
  - "14-02 — env.d.ts triple-slash reference for virtual:pwa-register/vue TypeScript resolution; VitePWA() plugin configured with registerType:prompt"

provides:
  - "WallecxApp.vue — auth resilience (PWA-05): navigator.storage.persist() + pb.authStore.isValid onMounted check with toast.info + router.push to /login"
  - "WallecxApp.vue — SW update prompt (PWA-06): useRegisterSW needRefresh watch fires toast.info with duration:Infinity and Refresh/Later action buttons"

affects:
  - "14-04-PLAN.md — no direct dependency; WallecxApp.vue is the app shell, both PWA behaviors are now active on production build"

tech-stack:
  added: []
  patterns:
    - "useRegisterSW() from virtual:pwa-register/vue — needRefresh Ref + updateServiceWorker() for SW update prompt"
    - "watch(needRefresh) + toast.info(duration:Infinity) + action/cancel buttons pattern for SW update UX"
    - "pb.authStore.isValid synchronous JWT expiry check in onMounted — complements router guard (which checks !!user.value)"
    - "navigator.storage?.persist optional-chain guard for iOS < 17 compatibility"

key-files:
  created: []
  modified:
    - src/components/projects/wallecx/WallecxApp.vue

key-decisions:
  - "useRegisterSW comment explains: do NOT use useAuthStore().isLoggedIn — it checks !!user.value not token expiry; pb.authStore.isValid is the correct synchronous JWT check"
  - "navigator.storage.persist() wrapped in if(navigator.storage?.persist) + try/catch — best-effort only; no UI shown based on return value"
  - "toast.info() fires BEFORE await router.push() in session expiry path — toast is visible during navigation transition"
  - "duration: Infinity on SW update toast — user must explicitly act; no auto-dismiss"

metrics:
  duration: "~1.5 min"
  completed: "2026-05-14"
  tasks: 1
  files_created: 0
  files_modified: 1
---

# Phase 14 Plan 03: Auth Resilience and SW Update Toast (WallecxApp.vue)

**WallecxApp.vue extended with useRegisterSW needRefresh watch (toast.info duration:Infinity, Refresh/Later actions) for PWA-06 SW update prompt, and onMounted navigator.storage.persist() + pb.authStore.isValid JWT expiry check with toast.info + router.push for PWA-05 auth resilience**

## Performance

- **Duration:** ~1.5 min
- **Started:** 2026-05-14T05:33:08Z
- **Completed:** 2026-05-14T05:34:30Z
- **Tasks:** 1
- **Files created:** 0
- **Files modified:** 1

## Accomplishments

- Replaced the `<script setup>` block in `WallecxApp.vue` with the complete PWA-05 + PWA-06 additions:
  - Added `useRegisterSW()` destructure — `needRefresh` Ref and `updateServiceWorker` function
  - Added `watch(needRefresh)` that fires `toast.info("A new version of Wallecx is available.", { duration: Infinity, ... })` with "Refresh" (calls `updateServiceWorker(true)`) and "Later" (sets `needRefresh.value = false`) action buttons
  - Added `onMounted` with `navigator.storage?.persist` optional-chain guard for iOS < 17 compatibility
  - Added `pb.authStore.isValid` check on mount — fires `toast.info("Your session has expired. Please sign in again.")` then `await router.push({ name: "login", query: { redirect: "/projects/wallecx" } })` when JWT is expired
- Template block (`<ConfirmDialog />`, `<Tabs>`, `<VaccinationsTab />`, `<MembershipsTab />`) is unchanged
- `npm run type-check` exits 0 — `virtual:pwa-register/vue` resolves via `env.d.ts` triple-slash reference from Plan 02
- All 11 automated verification checks pass

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add auth resilience and SW update toast to WallecxApp.vue | 9f0ca79 | src/components/projects/wallecx/WallecxApp.vue |

## Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| `src/components/projects/wallecx/WallecxApp.vue` | Modified | `<script setup>` block extended from 6 lines to 60 lines; `<template>` and `<style scoped>` unchanged |

## Decisions Made

- **pb.authStore.isValid over useAuthStore().isLoggedIn** — The Pinia store's `isLoggedIn` checks `!!user.value` (non-null record), not JWT expiry. After iOS 8-day dormancy the record can be non-null but the token expired. `pb.authStore.isValid` is a synchronous JWT expiry check that catches this case. Documented in inline comment per RESEARCH.md Pitfall 5.
- **navigator.storage?.persist optional-chain** — iOS < 17 does not support `navigator.storage`. The optional-chain `navigator.storage?.persist` prevents a TypeError on older devices. Best-effort: no UI is shown based on the return value.
- **toast.info before router.push** — Toast fires before navigation so it is visible during the transition to the login screen. The user sees the message briefly as they are redirected.
- **duration: Infinity on SW update toast** — Never auto-dismissed. User must explicitly click "Refresh" or "Later". Prevents the update prompt from disappearing while the user is in the middle of a CRUD dialog.

## Deviations from Plan

None — plan executed exactly as written. The acceptance criterion "MUST NOT contain useAuthStore().isLoggedIn in this check" is satisfied: the string appears only in an inline comment (`// Do NOT use useAuthStore().isLoggedIn here`) explaining why the pattern is avoided, not in executable code.

## Known Stubs

None — all code is wired and functional. Both `needRefresh` watch and `onMounted` auth check are live behaviors on every WallecxApp.vue mount.

## Threat Flags

No new security surface beyond what is documented in the plan's threat model:
- T-14-03-01 mitigated: `pb.authStore.isValid` check on `onMounted` redirects to `/login` before any PocketBase API call when JWT is expired — catches iOS 8-day dormancy scenario
- T-14-03-02 mitigated: `registerType: 'prompt'` (from Plan 02) + `duration: Infinity` toast — user explicitly clicks "Refresh"; no forced reload
- T-14-03-03 accepted: `navigator.storage.persist()` return value is not exposed in UI; graceful degradation with try/catch
- T-14-03-04 accepted: PocketBase is cross-origin; SW does not intercept cross-origin requests; login redirect hits the real `/login` route

## Self-Check

Checking created/modified files exist and commits are present:

- [x] `src/components/projects/wallecx/WallecxApp.vue` exists — FOUND
- [x] Commit `9f0ca79` exists in git log — FOUND
- [x] All 11 automated verify checks return `true` — VERIFIED
- [x] `npm run type-check` exits 0 — VERIFIED
- [x] Template block unchanged (`<ConfirmDialog />`, `<VaccinationsTab />`, `<MembershipsTab />`) — VERIFIED

## Self-Check: PASSED

---
*Phase: 14-pwa-foundation*
*Completed: 2026-05-14*
