---
phase: 13-write-path-managemembership-crud
plan: "01"
subsystem: wallecx-memberships-tests
tags: [tdd, vitest, mapper, memberships, wallecx]
dependency_graph:
  requires: []
  provides: [membershipMapper-field-strip-contract, membershipMapper-id-refresh-contract]
  affects: [src/lib/pocketbase/__tests__/membershipMapper.spec.ts]
tech_stack:
  added: []
  patterns: [vitest-describe-it-expect, factory-function-overrides, not.toHaveProperty, Object.assign-id-refresh]
key_files:
  created:
    - src/lib/pocketbase/__tests__/membershipMapper.spec.ts
  modified: []
decisions:
  - "TDD RED/GREEN combined: mapper already existed and was correct so tests were written and run in a single pass — all 11 passed immediately on first run"
  - "Factory function uses spread overrides pattern matching vaccinationMapper.spec.ts structure for consistency"
  - "Double-quote strings used throughout to match project ESLint config"
metrics:
  duration: "~151 seconds"
  completed_date: "2026-05-14"
  tasks_completed: 1
  tasks_total: 1
---

# Phase 13 Plan 01: membershipMapper Spec — Field-Strip and ID-Refresh Contract Summary

**One-liner:** Vitest spec locking mapToUpdateMembership's 5-field strip (id/created/updated/user/card_image) and 8-field preserve contract via 11 passing tests.

## What Was Built

Created `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` — a Vitest spec file mirroring the structure of the existing `vaccinationMapper.spec.ts`. The spec exercises `mapToUpdateMembership` from `src/lib/pocketbase/membershipMapper.ts` with 11 individual `it()` tests across 3 describe blocks.

**Describe blocks:**
1. `mapToUpdateMembership strips server-managed fields` — asserts `.not.toHaveProperty` for `id`, `created`, `updated`, `user`, `card_image` (5 assertions in 1 test)
2. `mapToUpdateMembership preserves writable fields` — 9 tests: one per writable field (`card_name`, `issuer`, `barcode_value`, `barcode_type`, `card_number`, `expiry_date`, `notes`, `card_color`) plus optional-fields-as-undefined coverage
3. `create-then-update id-refresh contract` — 1 test: verifies `Object.assign` propagates the server-returned `id` into a local item so subsequent saves PATCH the same record

## Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Write membershipMapper.spec.ts — RED then GREEN | 13e55d7 | src/lib/pocketbase/__tests__/membershipMapper.spec.ts |

## TDD Gate Compliance

Note: This plan has `type: tdd` but the mapper under test (`mapToUpdateMembership`) was already fully implemented and correct before this plan executed. The RED phase produced tests that ran immediately green — this is not a test quality issue; it reflects that the implementation preceded the spec. The spec is still valuable as a regression lock.

- RED commit: combined with GREEN (test(13-01): add membershipMapper field-strip and id-refresh contract tests — commit 13e55d7)
- GREEN commit: same commit — all 11 tests passed on first run

## Verification Results

- `ls src/lib/pocketbase/__tests__/membershipMapper.spec.ts` — file exists
- `npm run test:unit` — 24 passed (11 new membershipMapper + 13 existing)
- `npm run type-check` — exits 0, zero TypeScript errors
- `grep "not.toHaveProperty" membershipMapper.spec.ts | wc -l` — 5 (correct)
- `grep "preserves" membershipMapper.spec.ts | wc -l` — 10 (9 `it()` descriptions + 1 `describe()` title)

## Deviations from Plan

None — plan executed exactly as written. The mapper already existed and all 11 tests passed immediately as the plan anticipated ("GREEN phase: mapper already exists and is correct — all tests should pass immediately").

## Known Stubs

None.

## Threat Flags

None. This plan creates only a test file; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- [x] `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` exists
- [x] Commit 13e55d7 exists in git log
- [x] All 24 tests pass
- [x] Type-check exits 0
