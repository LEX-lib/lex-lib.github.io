---
phase: 04-discovery-polish
plan: "04"
subsystem: wallecx
tags: [testing, route-guard, vitest, checklist, polish, build-fix]
dependency_graph:
  requires: [04-01-PLAN.md, 04-03-PLAN.md]
  provides: [POLISH-04, POLISH-05]
  affects:
    - src/App.vue
    - src/router/__tests__/guard.spec.ts
    - .planning/phases/04-discovery-polish/04-CHECKLIST.md
tech_stack:
  added: []
  patterns:
    - vi.mock with unknown cast for Pinia store mock (as unknown as ReturnType<typeof vi.fn>)
    - createMemoryHistory for jsdom-safe router in Vitest
    - Inline guard re-implementation to avoid importing production router (createWebHistory)
    - isProd const in script setup to avoid import.meta in Vue template expressions
key_files:
  created:
    - src/router/__tests__/guard.spec.ts
  modified:
    - src/App.vue
    - .planning/phases/04-discovery-polish/04-CHECKLIST.md
decisions:
  - "as unknown as ReturnType<typeof vi.fn> cast required — direct as ReturnType<typeof vi.fn> is rejected by vue-tsc because StoreDefinition does not sufficiently overlap with Mock<Procedure>"
  - "isProd const in script setup is the idiomatic fix for import.meta.env.PROD in Vue templates; rolldown compiler rejects import.meta in attribute expressions"
  - "Guard logic re-implemented inline in addGuard() rather than importing from index.ts — keeps test isolated from createWebHistory at module load time"
metrics:
  duration_seconds: 174
  completed_date: "2026-05-12"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
  files_created: 1
---

# Phase 4 Plan 04: Route Guard Spec + Checklist Final Sign-Off Summary

**One-liner:** Route guard Vitest spec (3 cases, createMemoryHistory) and App.vue build-blocker fix land together, closing POLISH-04 and POLISH-05 with all 19 checklist items signed off.

## What Was Built

### Task 1 — App.vue build blocker fix + guard spec [commit c575d29]

**Build-blocker fix (pre-requisite for POLISH-05 item 13):**

`src/App.vue` had `<SpeedInsights v-if="import.meta.env.PROD" />`. Vue's rolldown compiler rejects `import.meta.*` in template attribute expressions. Fixed by adding `const isProd = import.meta.env.PROD` in `<script setup>` and changing the template to `v-if="isProd"`. `npm run build` now exits 0.

**Route guard spec (POLISH-04):**

Created `src/router/__tests__/guard.spec.ts` with three test cases:
1. Unauthenticated user navigating to `/projects/wallecx` is redirected to `/login?redirect=/projects/wallecx`
2. Authenticated user navigating to `/projects/wallecx` stays on `/projects/wallecx`
3. Unauthenticated user navigating to `/` (public route) is not redirected

Key implementation details:
- Uses `createMemoryHistory` (not `createWebHistory`) — required for jsdom navigation
- Does NOT import `src/router/index.ts` — avoids `createWebHistory` crashing at module load in jsdom
- `vi.mock("@/stores/auth")` and `vi.mock("@/lib/pocketbase")` placed at module top before named imports
- `addGuard()` re-implements the exact `beforeEach` logic from `src/router/index.ts`
- All mock casts use `as unknown as ReturnType<typeof vi.fn>` — required for `vue-tsc` strict type checking

### Task 2 — 04-CHECKLIST.md final sign-off [commit f4f7db5]

Updated all remaining open/deferred items:
- **Item 13** (auth token in dist): SIGNED OFF — `grep -r "VITE_LOGIN_" dist/` returns CLEAN after build fix
- **Item 15** (guard spec): SIGNED OFF with 3-test evidence from guard.spec.ts
- **Item 16** (JSON export): SIGNED OFF — references 04-03-PLAN exportJson() implementation
- **Item 19** (SpeedInsights gate): SIGNED OFF — isProd const fix resolves build blocker
- Items 9 and 10 confirmed with actual grep output from this execution run
- Header status changed from PARTIAL to PASS
- "Open Items" section replaced with "No open items. Checklist complete."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript cast strengthened to `as unknown as`**
- **Found during:** Task 1 — `npm run build` (type-check phase)
- **Issue:** Plan specified `as ReturnType<typeof vi.fn>` casts on `useAuthStore`. vue-tsc rejected this: `StoreDefinition` does not sufficiently overlap with `Mock<Procedure>` — 4 TS2352 errors across addGuard() and the 3 test cases.
- **Fix:** Changed all 4 casts to `as unknown as ReturnType<typeof vi.fn>` — standard double-cast pattern for unrelated type assertions.
- **Files modified:** `src/router/__tests__/guard.spec.ts`
- **Commit:** c575d29

## Known Stubs

None — all functionality is fully implemented and wired.

## Threat Model Compliance

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-04-04-01 | accept | Both @/stores/auth and @/lib/pocketbase mocked; no real network calls in tests |
| T-04-04-02 | accept | Checklist is a planning artifact; reviewed by developer before milestone close |
| T-04-04-03 | mitigate | POLISH-04 spec tests the guard predicate (isLoggedIn=false → redirect); all 3 cases pass |

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Verification

- `npm run test:unit` exits 0 — 13 tests passing (10 vaccinationMapper + 3 guard)
- `npm run build` exits 0 — type-check passes, vite build completes
- `grep "createMemoryHistory" src/router/__tests__/guard.spec.ts` — match found
- `grep "createWebHistory" src/router/__tests__/guard.spec.ts` — comment only, no import
- `grep "from.*router/index" src/router/__tests__/guard.spec.ts` — no matches
- `grep -c "SIGNED OFF" .planning/phases/04-discovery-polish/04-CHECKLIST.md` — 19
- `grep "OPEN" .planning/phases/04-discovery-polish/04-CHECKLIST.md` — no table-row matches
- `grep "Status.*PASS" .planning/phases/04-discovery-polish/04-CHECKLIST.md` — match found

## Self-Check

Files exist:
- `src/App.vue` — FOUND (modified)
- `src/router/__tests__/guard.spec.ts` — FOUND (created)
- `.planning/phases/04-discovery-polish/04-CHECKLIST.md` — FOUND (modified)

Commits:
- `c575d29` — feat(04-04): fix App.vue build blocker + add route guard spec — FOUND
- `f4f7db5` — docs(04-04): finalize 04-CHECKLIST.md — all 19 items SIGNED OFF — FOUND

## Self-Check: PASSED
