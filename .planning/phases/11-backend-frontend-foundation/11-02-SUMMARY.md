---
phase: 11-backend-frontend-foundation
plan: 02
subsystem: database
tags: [pocketbase, smoke-test, isolation, security]

requires:
  - phase: 11-01
    provides: "wallecx_memberships collection with per-user rules"
provides:
  - "Human-verified proof that per-user isolation holds across all 5 access types"
  - "Confirmation that protected card_image file URLs are inaccessible without a token"
affects: [12, 13]

tech-stack:
  added: []
  patterns:
    - "PocketBase v0.29.x returns 404 (not 403) for protected file URL access without token"
    - "PocketBase v0.29.x returns 404 (not 403) for cross-user view/update/delete — rule acts as record non-existence"

key-files:
  created: []
  modified: []

key-decisions:
  - "PocketBase v0.29.x viewRule/updateRule/deleteRule violations return 404 (not 403) — record treated as non-existent for wrong user"
  - "Protected file URL without token returns 404 in v0.29.x (not 403 as plan expected)"
  - "All isolation behaviors are correct — HTTP status differences are PB v0.29.x behavior, not security gaps"

patterns-established:
  - "Per-user isolation smoke test: list as User B returns 200+empty; view/update/delete return 404"

requirements-completed:
  - MBACK-03

duration: ~15min
completed: 2026-05-13
---

# Phase 11 Plan 02: Two-User Smoke Test Summary

**Per-user isolation confirmed across all 5 access types on `wallecx_memberships` — User B cannot see, modify, delete, or access file URLs belonging to User A**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-05-13
- **Tasks:** 1
- **Files modified:** 0 (Admin UI + API Playground testing only)

## Accomplishments

- Confirmed list isolation: User B's authenticated list returns 200 with `items:[]` — no cross-user record exposure
- Confirmed view isolation: User B cannot fetch User A's record by ID (HTTP 404)
- Confirmed update isolation: User B cannot PATCH User A's record (HTTP 404)
- Confirmed delete isolation: User B cannot DELETE User A's record (HTTP 404)
- Confirmed file URL isolation: `card_image` protected URL returns 404 without a valid token

## Developer Confirmation

Five test results (2026-05-13):
- Test 1 (List as User B): **200, empty items** ✓
- Test 2 (View User A's record as User B): **404** ✓
- Test 3 (Update User A's record as User B): **404** ✓
- Test 4 (Delete User A's record as User B): **404** ✓
- Test 5 (card_image file URL without token): **404** ✓

## Decisions Made

None — smoke test followed plan protocol exactly.

## Deviations from Plan

**1. HTTP 404 instead of 403 for Tests 2–5**
- **Plan expected:** 403 for cross-user update/delete; 403 for protected file URL
- **Actual:** 404 for all — PocketBase v0.29.x treats rule violations as "record not found" rather than "forbidden"
- **Disposition:** Accepted — security outcome is identical (no data accessible). This is a PB v0.29.x behavior change consistent with v0.29.x listRule behavior observed in Plan 01

---

**Total deviations:** 1 (HTTP status code difference — no security impact)
**Impact on plan:** MBACK-03 fully satisfied. Per-user isolation is confirmed end-to-end.

## Issues Encountered

None — all five tests produced the expected isolation outcome (different HTTP status codes, same security result).

## Next Phase Readiness

- Backend security gate cleared — safe to begin frontend work in Plan 03
- Per-user isolation confirmed before any component code is written
- PocketBase v0.29.x behavior documented for Phase 12 component development

---
*Phase: 11-backend-frontend-foundation*
*Completed: 2026-05-13*
