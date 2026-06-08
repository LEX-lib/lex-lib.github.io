---
phase: 37-pwa-install-standalone-polish
plan: "05"
subsystem: pwa-shortcuts-dispatch
tags: [pwa, manifest-shortcuts, pendingAction, safe-area, ios-eviction, guard-test]
dependency_graph:
  requires:
    - Plan 01 (shortcut PNG files in public/shortcuts/)
  provides:
    - vite.config.ts manifest.shortcuts (4 entries)
    - WallecxApp.vue pendingAction dispatch + SW toast safe-area + iOS eviction-aware copy
    - ExpensesTab/VaccinationsTab/MembershipsTab pendingAction prop + immediate watcher
    - guard.spec.ts query-preservation test (D-37-16)
  affects:
    - Phase 38 UAT (real device shortcut long-press tests now have code to exercise)
tech_stack:
  added: []
  patterns:
    - "manifest.shortcuts array in vite-plugin-pwa manifest passthrough (4 entries x name/url/icons)"
    - "pendingAction local ref + ACTION_TAB_MAP allowlist dispatch (no Pinia store)"
    - "defineProps<{ pendingAction?: string | null }> + watch immediate:true on 3 tab consumers"
    - "vue-sonner toast per-call style option for safe-area-inset-bottom (PWA-06)"
    - "isIosSafari() || isStandalone.value gating for eviction-aware auth-expired copy"
key_files:
  created: []
  modified:
    - vite.config.ts (manifest.shortcuts array — 4 entries)
    - src/components/projects/wallecx/WallecxApp.vue (5 zones: imports, setup, SW toast, onMounted eviction + dispatch, template props)
    - src/components/projects/wallecx/ExpensesTab.vue (defineProps + immediate watcher — add-expense + open-reports)
    - src/components/projects/wallecx/VaccinationsTab.vue (defineProps + immediate watcher — add-vaccination)
    - src/components/projects/wallecx/MembershipsTab.vue (defineProps + immediate watcher — add-membership)
    - src/router/__tests__/guard.spec.ts (query-preservation test — guard test count 3 -> 4)
decisions:
  - "pendingAction passed as prop (not module-scope ref) to tab components — simpler, avoids a new singleton, type-safe via defineProps"
  - "isIosSafari() duplicated inline in WallecxApp.vue per planner note — avoids lifting into useMobileEnv for Phase 37 scope"
  - "SW-update toast uses per-call style option (not global Toaster prop or CSS override) — targeted scope, does not affect other toasts site-wide"
  - "defineProps placed after defineAsyncComponent and before first reactive state declaration in each tab"
  - "pendingAction watcher placed after openManage in all 3 tabs so openManage is in scope at watcher registration time"
metrics:
  duration: "approx 25 minutes"
  completed_date: "2026-05-29"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 6
---

# Phase 37 Plan 05: Manifest Shortcuts + pendingAction Dispatch Summary

**One-liner:** Android Quick Actions wired end-to-end via manifest.shortcuts array, WallecxApp pendingAction dispatch, and immediate-watcher tab consumers, plus SW toast safe-area and iOS eviction-aware auth-expired copy.

## What Was Built

### Task 1: vite.config.ts shortcuts + guard spec query-preservation test

`vite.config.ts` manifest object extended with a `shortcuts:` array containing 4 entries:

| Shortcut | URL | Icon |
|----------|-----|------|
| Add Expense | `/projects/wallecx?action=add-expense` | `shortcuts/shortcut-add-expense.png` 96x96 any |
| Add Vaccination | `/projects/wallecx?action=add-vaccination` | `shortcuts/shortcut-add-vaccination.png` 96x96 any |
| Add Membership | `/projects/wallecx?action=add-membership` | `shortcuts/shortcut-add-membership.png` 96x96 any |
| Open Reports | `/projects/wallecx?action=open-reports` | `shortcuts/shortcut-open-reports.png` 96x96 any |

LOCKED invariants verified byte-intact:
- Line 28: `registerType: "prompt",          // LOCKED:` (NFR-PWA-AUTOUPDATE)
- Line 42: `scope: "/",                    // LOCKED:` (CON-PWA-SCOPE)

`src/router/__tests__/guard.spec.ts` gained a 4th test `"preserves query string in redirect when not authenticated"` proving `to.fullPath` (including `?action=add-expense`) survives through the auth redirect as `query.redirect` (D-37-16). Guard test count: 3 -> 4.

### Task 2: WallecxApp.vue — 5 change zones

**ZONE A (Imports):** Added `nextTick` to vue import, `useRoute` to vue-router import, new `import { useMobileEnv } from "@/composables/useMobileEnv"`.

**ZONE B (Setup):** Added:
- `const route = useRoute()`
- `const { isStandalone } = useMobileEnv()`
- `const pendingAction = ref<string | null>(null)`
- `const ACTION_TAB_MAP: Record<string, string>` with 4 keys (add-expense/add-vaccination/add-membership/open-reports)
- Local `isIosSafari()` helper with UA regex `/iPad|iPhone|iPod/` and exclusion `/CriOS|FxiOS|OPiOS|mercury/i`

**ZONE C (SW toast):** Added `style: { paddingBottom: 'env(safe-area-inset-bottom)' }` between `duration` and `action` in the `watch(needRefresh, ...)` toast call. Per-call approach — does not affect other toasts site-wide. (PWA-06)

**ZONE D (onMounted):**
- Change D1: Auth-expired toast now branches on `(isIosSafari() || isStandalone.value)` — iOS path uses exact eviction-aware copy; non-iOS path retains generic copy. (NFR-IOS-EVICTION-UX)
- Change D2: After auth check, shortcut dispatch block reads `route.query.action`, validates against ACTION_TAB_MAP allowlist, sets `activeTab.value`, awaits `nextTick()` (Pitfall 4 mitigation), sets `pendingAction.value`, then `router.replace({ query: {} })` to clear param from URL history.

**ZONE E (Template):** Added `:pending-action="pendingAction"` to all 3 tab element bindings (VaccinationsTab, MembershipsTab, ExpensesTab) — exactly 3 occurrences.

### Task 3: 3 Tab Components — defineProps + immediate watcher

Each of ExpensesTab.vue, VaccinationsTab.vue, MembershipsTab.vue received:

1. `const props = defineProps<{ pendingAction?: string | null }>()` — type-only defineProps form
2. `watch(() => props.pendingAction, (action) => { ... }, { immediate: true })` placed after `openManage` is defined

**ExpensesTab** watcher handles both `'add-expense'` (calls `openManage(null)`) and `'open-reports'` (sets `activeSubTab.value = 'reports'`).

**VaccinationsTab** watcher handles `'add-vaccination'` (calls `openManage(null)`).

**MembershipsTab** watcher handles `'add-membership'` (calls `openManage(null)`).

`{ immediate: true }` on all 3 watchers is the Pitfall 4 mitigation — a pendingAction value set before the async component mounts is observed at watcher registration time.

## ACTION_TAB_MAP Mapping Confirmation

| ACTION_TAB_MAP key | activeTab value | Tab-side handling |
|--------------------|-----------------|-------------------|
| `add-expense` | `expenses` | ExpensesTab opens ManageExpense in create mode |
| `add-vaccination` | `vaccinations` | VaccinationsTab opens ManageVaccination in create mode |
| `add-membership` | `memberships` | MembershipsTab opens ManageMembership in create mode |
| `open-reports` | `expenses` | ExpensesTab sets activeSubTab to 'reports' |

## LOCKED Line Verifications

- `registerType: "prompt",          // LOCKED:` — byte-intact (line 28, vite.config.ts)
- `scope: "/",                    // LOCKED:` — byte-intact (line 42, vite.config.ts)
- No new Pinia store created (counter.ts was pre-existing from Phase 1)
- SW toast copy `"A new version of Wallecx is available."` / `"Refresh"` / `"Later"` — byte-intact
- `navigator.storage?.persist` mitigation — byte-intact
- `<PwaInstallBanner />` mount — byte-intact
- `<ConfirmDialog />` singleton mount — byte-intact
- `wallecx-main-tabs` class — byte-intact
- All 3 tab `value=` strings (`vaccinations`/`memberships`/`expenses`) — byte-intact

## Eviction Copy Gating Confirmation

```typescript
const evictionMessage = (isIosSafari() || isStandalone.value)
  ? "iOS may have cleared local data after 7 days without opening the app. Please sign in again. Tip: pin Wallecx to your home screen to prevent this."
  : "Your session has expired. Please sign in again.";
toast.info(evictionMessage);
```

Gate: `isIosSafari()` (UA-based: `/iPad|iPhone|iPod/` AND NOT `/CriOS|FxiOS|OPiOS|mercury/i`) OR `isStandalone.value` (from useMobileEnv displayMode match). Both branches preserved in the same toast call.

## Guard Test Count Before/After

- Before Plan 05: 3 tests in `guard.spec.ts` (redirects to login, allows authenticated, allows non-guarded)
- After Plan 05: 4 tests (+ preserves query string in redirect when not authenticated)

## Gate Results

| Gate | Result |
|------|--------|
| `npm run type-check` | PASSED (0 errors) |
| `npm run test:unit` (guard.spec.ts only) | PASSED (4/4) |
| `npm run test:unit` (all) | PASSED (74/74) |
| `npm run build` | PASSED (84 precache entries, 0 exceeds, 0 Skipping precaching) |
| vite.config.ts LOCKED registerType line | VERIFIED byte-intact |
| vite.config.ts LOCKED scope line | VERIFIED byte-intact |
| ACTION_TAB_MAP 4 entries | VERIFIED |
| 3x `:pending-action="pendingAction"` in WallecxApp.vue | VERIFIED |
| 3 tabs: defineProps + immediate watcher | VERIFIED |
| SW toast style safe-area option | VERIFIED |
| Eviction copy exact string | VERIFIED |
| No new Pinia store | VERIFIED (counter.ts is pre-existing Phase 1) |

## Cross-Reference

This plan completes the visible PWA-09 (manifest shortcuts) and PWA-06 (SW toast safe-area) surface and ships NFR-IOS-EVICTION-UX (auth-expired copy). Combined with Plans 01-04 (assets, iOS meta tags, PwaInstallBanner Android branch, OfflineBanner), Phase 37 is now complete. Phase 38 UAT (real iOS + Android device install + shortcut long-press tests) can proceed.

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | be2cf40 | feat(37-05): add manifest shortcuts array and guard query-preservation test |
| 2 | d3dcfb9 | feat(37-05): WallecxApp pendingAction dispatch + SW toast safe-area + iOS eviction-aware copy |
| 3 | 6a2abdc | feat(37-05): add pendingAction prop + immediate watcher to 3 tab components (PWA-09) |

## Deviations from Plan

None - plan executed exactly as written. All tasks completed within the bounds of the plan's specifications. No architectural changes required, no bugs discovered, no blocking issues encountered.

## Known Stubs

None. All changes are fully wired: shortcuts declared in manifest reference real PNGs from Plan 01, pendingAction dispatch is wired through WallecxApp to tab props, and tab watchers call real openManage/activeSubTab functions.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes. The only new user-controlled input is `route.query.action` which is gated by the ACTION_TAB_MAP allowlist (T-37-05-01 mitigated — unknown keys silently ignored). `router.replace({ query: {} })` clears the action from URL history post-dispatch (T-37-05-03 mitigated). No threat flags beyond those already documented in the plan's threat model.

## Self-Check: PASSED

Files verified present and containing expected content:
- [x] vite.config.ts — contains `shortcuts:` array with 4 entries
- [x] src/components/projects/wallecx/WallecxApp.vue — contains ACTION_TAB_MAP, pendingAction, isIosSafari, style safe-area, eviction copy, 3x :pending-action
- [x] src/components/projects/wallecx/ExpensesTab.vue — contains defineProps, immediate watcher (add-expense + open-reports branches)
- [x] src/components/projects/wallecx/VaccinationsTab.vue — contains defineProps, immediate watcher (add-vaccination branch)
- [x] src/components/projects/wallecx/MembershipsTab.vue — contains defineProps, immediate watcher (add-membership branch)
- [x] src/router/__tests__/guard.spec.ts — contains 'preserves query string in redirect when not authenticated' test

Commits verified:
- [x] be2cf40 — feat(37-05): add manifest shortcuts array and guard query-preservation test
- [x] d3dcfb9 — feat(37-05): WallecxApp pendingAction dispatch + SW toast safe-area + iOS eviction-aware copy
- [x] 6a2abdc — feat(37-05): add pendingAction prop + immediate watcher to 3 tab components (PWA-09)
