---
phase: 04-discovery-polish
plan: "01"
subsystem: wallecx
tags: [bug-fix, code-quality, security, ux]
dependency_graph:
  requires: [03-04-SUMMARY.md]
  provides: [null-safe auth, token-refresh lifecycle, thumbUrl guard, dialog abort on error, date-sort correctness, prod-gated analytics]
  affects: [WallecxApp.vue, VaccinationList.vue, ManageVaccination.vue, App.vue]
tech_stack:
  added: []
  patterns: [setInterval/onUnmounted lifecycle pair, optional-chaining null guard, early-return on async failure]
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/WallecxApp.vue
    - src/components/projects/wallecx/VaccinationList.vue
    - src/App.vue
decisions:
  - "WR-01 interval placed inside the existing onMounted try block — if initial getToken fails the interval is not started, so no refresh fires on a dead session"
  - "onUnmounted always clears the timer even if it was never started (null guard is cheap and safe)"
  - "MEDIUM-03 uses dayjs diff on date_administered strings — consistent with how the getFullList sort and displayDate helper already use dayjs"
  - "SpeedInsights v-if uses import.meta.env.PROD (boolean) rather than import.meta.env.MODE === 'production' — idiomatic Vite"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-12"
  tasks_completed: 2
  files_modified: 4
---

# Phase 4 Plan 01: Code Review Fixes Summary

One-liner: Patched five code-review advisories (HIGH-01/02, WR-01/02/03) plus MEDIUM-03 date-sort and SpeedInsights PROD gate across four files — no new dependencies, no new components.

## What Was Built

Seven targeted patches across four files clearing all open HIGH and WARN advisories from Phase 2 and Phase 3 reviews, plus the SpeedInsights gate from the POLISH-05 checklist.

### Task 1 — ManageVaccination.vue (HIGH-01, HIGH-02) [commit 1fdf25e]

**HIGH-01:** Replaced `pb.authStore.record!.id` non-null assertion with `pb.authStore.record?.id` optional chaining plus an explicit early-return guard that shows a "Session expired" toast and sets `isSaving.value = false`. The crash path on expired sessions is eliminated.

**HIGH-02:** Added `pendingFile.value = null` in the success branch of `onSubmit` before `visible.value = false`. Previously the reset relied solely on the `@hide` event (which fires after the dialog close animation completes). Re-opening the dialog immediately after a successful save could carry the old file reference into the new session. Now reset is explicit and synchronous.

### Task 2 — WallecxApp.vue, VaccinationList.vue, App.vue [commit 2bcb5df]

**WR-01 — listToken refresh interval:** Added `setInterval` inside `onMounted` immediately after the initial `listToken.value = await pb.files.getToken()` call. The interval fires every 4 minutes (within PocketBase's 5-minute token TTL). Added `onUnmounted` to clear the timer. `onUnmounted` is imported from `vue`; `dayjs` was already imported for MEDIUM-03.

**WR-02 — thumbUrl empty-string guard:** Added `if (!record.card) return "";` as the first line of `thumbUrl` in VaccinationList.vue. Previously calling `pb.files.getURL(record, "", ...)` with an empty card field would produce a malformed URL.

**WR-03 — openDetail abort on getToken failure:** Inside the `catch` block of `openDetail`, added `selectedRecord.value = null; return;` before the function could proceed to `showDetail.value = true`. The dialog no longer opens in a token-less state; the user sees an error toast and the dialog stays closed.

**MEDIUM-03 — date-sorted insert in onCreated:** Replaced `records.value.unshift(created)` with `records.value.push(created)` followed by `records.value.sort((a, b) => dayjs(b.date_administered).diff(dayjs(a.date_administered)))`. Historical records with a past `date_administered` are now inserted at the correct position rather than always at the top.

**SpeedInsights PROD gate:** Added `v-if="import.meta.env.PROD"` to `<SpeedInsights />` in `src/App.vue`. The component is no longer mounted during local development, eliminating spurious analytics pings and satisfying POLISH-05 checklist item 19.

## Deviations from Plan

None — plan executed exactly as written. All patches matched the specified before/after snippets.

## Verification Results

```
npm run type-check   → exit 0 (vue-tsc --build, no errors)
npm run test:unit    → 10/10 tests passed (vaccinationMapper.spec.ts)
```

Grep confirmations:
- `grep "LIST_TOKEN_TTL_MS" WallecxApp.vue`      → 2 hits (declaration + interval call)
- `grep "onUnmounted" WallecxApp.vue`             → 2 hits (import + callback)
- `grep "selectedRecord.value = null" WallecxApp.vue` → 1 hit (inside openDetail catch)
- `grep "records.value.sort" WallecxApp.vue`      → 1 hit (inside onCreated)
- `grep "if (!record.card) return" VaccinationList.vue` → 1 hit
- `grep "import.meta.env.PROD" App.vue`           → 1 hit

## Known Stubs

None — no stub values or placeholder text introduced by this plan.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are within existing trust boundaries. The `setInterval` background timer was assessed in the plan threat model as T-04-01-02 (accepted: getToken on expired session returns 401 caught by the console.warn handler — no privilege escalation).

## Self-Check: PASSED

- `src/components/projects/wallecx/WallecxApp.vue` — exists, contains LIST_TOKEN_TTL_MS, onUnmounted, date-sort
- `src/components/projects/wallecx/VaccinationList.vue` — exists, contains `if (!record.card) return ""`
- `src/App.vue` — exists, contains `v-if="import.meta.env.PROD"`
- Commit 1fdf25e — Task 1 (HIGH-01, HIGH-02 in ManageVaccination.vue)
- Commit 2bcb5df — Task 2 (WR-01/02/03, MEDIUM-03, SpeedInsights gate)
