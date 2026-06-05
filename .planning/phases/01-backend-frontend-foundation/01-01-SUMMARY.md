---
phase: 01-backend-frontend-foundation
plan: 01
subsystem: database
tags: [pocketbase, collections, access-rules, per-user-isolation]

requires:
  - phase: 00-pre-wallecx-cleanup
    provides: Clean codebase without dev credentials; safe to introduce health-data surface

provides:
  - wallecx_vaccinations PocketBase collection with 9 fields (user, vaccine_name, date_administered, dose_number, lot_number, location, manufacturer, notes, card)
  - card file field configured: protected=true, 10 MB cap, MIME allowlist, thumbs 100x100+400x0
  - Five per-user access rules enforcing server-side isolation (listRule, viewRule, updateRule, deleteRule, createRule)
  - Composite index idx_wallecx_vaccinations_user_date on (user, date_administered)

affects: [01-02-backend-frontend-foundation, 01-03-backend-frontend-foundation, 02-read-path, 03-write-path]

tech-stack:
  added: []
  patterns:
    - PocketBase v0.29.3 createRule syntax uses @request.body.user (not @request.data.user — deprecated pre-v0.23)

key-files:
  created: []
  modified: []

key-decisions:
  - "PocketBase v0.29.3 uses @request.body.user in createRule, not @request.data.user (syntax changed in v0.23)"
  - "Composite index created via Admin UI Indexes section (Option A)"
  - "notes field configured as plain Text (not Editor) to prevent v-html risk in Phase 2"
  - "cascade delete OFF on user Relation field — vaccination records must survive account deletion"

patterns-established:
  - "createRule pattern for user-owned collections in PocketBase v0.29+: @request.auth.id != \"\" && @request.body.user = @request.auth.id"
  - "list/view/update/delete rules pattern: @request.auth.id != \"\" && user = @request.auth.id"

requirements-completed:
  - BACK-01
  - BACK-02
  - BACK-03
  - BACK-04

duration: ~20min
completed: 2026-05-11
---

# Phase 1: Backend + Frontend Foundation — Plan 01 Summary

**wallecx_vaccinations PocketBase collection created with 9 fields, protected file field, 5 per-user access rules, and composite index — server-side isolation foundation complete**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-11
- **Completed:** 2026-05-11
- **Tasks:** 2 (both human-action checkpoints)
- **Files modified:** 0 (Admin UI only)

## Accomplishments

- `wallecx_vaccinations` collection created with all 9 locked fields: `user` (Relation, required, cascade delete OFF), `vaccine_name` (Text, required), `date_administered` (Date, required), `dose_number` (Number, optional), `lot_number`, `location`, `manufacturer`, `notes` (Text, optional), `card` (File, optional)
- `card` file field fully configured: `protected: true`, max 10 MB (10485760 bytes), MIME allowlist `image/jpeg,image/png,image/webp,application/pdf`, thumbs `100x100,400x0`
- All five collection rules set verbatim: listRule/viewRule/updateRule/deleteRule = `@request.auth.id != "" && user = @request.auth.id`; createRule = `@request.auth.id != "" && @request.body.user = @request.auth.id`
- Composite index `idx_wallecx_vaccinations_user_date` on `(user, date_administered)` created via Admin UI (Option A)

## Task Commits

No code commits — this plan is a PocketBase Admin UI checklist. State is in the PocketBase database.

1. **Task 1: Create collection fields** — Developer confirmed "fields created"
2. **Task 2: Set rules and index** — Developer confirmed "rules and index set, option A"

## Files Created/Modified

None — this plan configures PocketBase via the Admin UI, not the codebase.

## Decisions Made

- **createRule syntax correction:** Plan specified `@request.data.user` but PocketBase v0.29.3 rejected it ("failed to resolve field"). Corrected to `@request.body.user` — this is the correct syntax for PocketBase v0.23+. All future phases should use `@request.body.*` for request body field access in rules.
- **Index method:** Option A (Admin UI Indexes section) used successfully — no JS migration needed.

## Deviations from Plan

### Auto-fixed Issues

**1. createRule syntax for PocketBase v0.23+**
- **Found during:** Task 2 (setting collection rules)
- **Issue:** Plan specified `@request.data.user` (correct for v0.22–v0.26 per research). PocketBase v0.29.3 returned "invalid left operand '@request.data.user' - failed to resolve field".
- **Fix:** Changed to `@request.body.user` — the correct accessor for request body fields in PocketBase v0.23+.
- **Files modified:** None (Admin UI only)
- **Verification:** Rule saved without error; createRule is now `@request.auth.id != "" && @request.body.user = @request.auth.id`

---

**Total deviations:** 1 (syntax correction for PocketBase v0.29.3)
**Impact on plan:** Necessary version-compatibility fix. Security intent unchanged — createRule still enforces that submitted `user` field must equal authenticated user's ID.

## Issues Encountered

- Research's `@request.data.user` syntax was based on PocketBase v0.22–v0.26 maintainer guidance. v0.29.3 has moved to `@request.body.*` namespace. This should be noted for all future phases that add PocketBase collection rules.

## Next Phase Readiness

- Backend collection fully configured and ready for the two-user smoke test (Plan 02)
- BACK-01, BACK-02, BACK-03, BACK-04 all satisfied
- `wallecx_vaccinations` is queryable by `(user, date_administered DESC)` via the new composite index
- Frontend foundation (Plan 03) can proceed after smoke test confirms isolation

---
*Phase: 01-backend-frontend-foundation*
*Completed: 2026-05-11*
