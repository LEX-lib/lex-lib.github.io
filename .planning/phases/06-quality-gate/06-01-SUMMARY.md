---
phase: 06-quality-gate
plan: "01"
subsystem: test-infrastructure
tags: [vitest, pinia-testing, pocketbase-mock, ci, test-setup]
dependency_graph:
  requires: []
  provides: [test-infrastructure, pb-mock, pinia-testing-dep]
  affects: [all-phase-06-plans]
tech_stack:
  added: ["@pinia/testing@^1.0.3"]
  patterns: [vi-mock-auto-resolution, named-export-mock, vitest-run-ci-mode]
key_files:
  created:
    - src/lib/pocketbase/__mocks__/index.ts
  modified:
    - package.json
decisions:
  - Change test:unit script from "vitest" (watch) to "vitest run" (CI single-pass)
  - Use named export mock (not default) to match real pb module shape
  - Include authStore.onChange in mock to prevent useAuthStore init errors
metrics:
  duration: "2m"
  completed: "2026-04-29T10:53:59Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 6 Plan 01: Test Infrastructure Setup Summary

Vitest CI script fixed and PocketBase mock scaffold created — downstream test plans can now write spec files without boilerplate friction.

## What Was Built

Test infrastructure foundation for Phase 6 quality gate:

1. **CI-friendly test script** — `npm run test:unit` now uses `vitest run` (single pass, exits 0/1) instead of watch mode.
2. **`@pinia/testing` installed** — Required for component tests that call `useAuthStore()`.
3. **PocketBase `__mocks__/index.ts`** — Vitest auto-resolves `vi.mock('@/lib/pocketbase')` to this file, providing a chainable `pb.collection()` mock and `pb.authStore` stub.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix test:unit script and install @pinia/testing | 41dcd67 | package.json |
| 2 | Create PocketBase __mocks__/index.ts for vi.mock auto-resolution | da4d4e9 | src/lib/pocketbase/__mocks__/index.ts |

## Decisions Made

1. **Replaced `"vitest"` with `"vitest run"` in-place** — The plan offered Option A (replace) vs Option B (keep + add separate key). Option A was chosen per plan instruction: simpler, single script, no new key.

2. **Named export `export const pb`** — Matches the real module's `export const pb = new PocketBase(...)` shape. Using `export default` would break destructuring imports across the codebase.

3. **Shared `collectionMethods` object** — All `pb.collection(name)` calls return the same mock object. Tests needing per-collection control can override via `mockReturnValue` in a `beforeEach`. Documented in the mock file's JSDoc comment.

4. **`pb.authStore` includes `onChange`, `clear`, `record`** — Required per RESEARCH.md Pitfall 6: `useAuthStore` calls `pb.authStore.onChange(...)` at store creation time. Without this, any component test mounting a component that triggers `useAuthStore()` would throw.

## Verification Results

- `npm run type-check` — exits 0, no errors
- `npm run test:unit` — exits 1 with "No test files found" (expected: no spec files exist yet; this will become exit 0 once Phase 6 test files are written in plans 02-07)

Note: The plan states vitest run "exits 0 when zero files are found" but Vitest 3.x actually exits 1 for no-files. The research file (line 11) correctly documents this: "vitest run exits with code 1 ('No test files found')". This is a known Vitest 3.x behavior, not a defect introduced by this plan.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan creates infrastructure only, no UI or data rendering.

## Threat Flags

None — `__mocks__/index.ts` is a dev-only file that is never imported by production code. No new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

- [x] `src/lib/pocketbase/__mocks__/index.ts` exists
- [x] `package.json` contains `"test:unit": "vitest run"`
- [x] `package.json` devDependencies contains `@pinia/testing`
- [x] Commit `41dcd67` exists
- [x] Commit `da4d4e9` exists
- [x] `npm run type-check` exits 0
