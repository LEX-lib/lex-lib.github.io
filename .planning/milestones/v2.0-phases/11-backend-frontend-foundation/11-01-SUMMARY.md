---
phase: 11-backend-frontend-foundation
plan: 01
subsystem: database
tags: [pocketbase, collections, rules, file-fields, select-fields]

requires: []
provides:
  - "wallecx_memberships PocketBase collection with 10 user-defined fields"
  - "Per-user collection rules on all 5 access types (list/view/create/update/delete)"
  - "card_image file field with protected:true, image-only MIME allowlist, thumb sizes"
  - "barcode_type SELECT field with 5 locked values: qr, code128, ean13, code39, number"
affects: [11-02, 12, 13]

tech-stack:
  added: []
  patterns:
    - "PocketBase SELECT field for enum-like values instead of plain Text"
    - "protected:true on file fields containing personal data"
    - "Per-user isolation via @request.auth.id != '' && user = @request.auth.id (list/view/update/delete)"
    - "Create rule uses @request.body.user in PocketBase v0.29.x (replaces @request.data.user from v0.26.x)"

key-files:
  created: []
  modified: []

key-decisions:
  - "barcode_type is a SELECT field (not Text) with exactly 5 values: qr, code128, ean13, code39, number"
  - "card_image MIME allowlist is image-only: image/jpeg, image/png, image/webp — no application/pdf"
  - "card_image has protected:true — file URLs require a short-lived token; prevents URL-guessing on card photos"
  - "PocketBase v0.29.x create rule uses @request.body.user (not @request.data.user from v0.26.x plan)"
  - "In PocketBase v0.29.x, unauthenticated list returns 200+empty items (not 403) — per-record filter behavior"
  - "card_color stores hex WITHOUT leading # — CSS bindings will prepend # at render time"
  - "notes field is plain Text (not Editor) — prevents v-html injection risk in Phase 12 detail views"
  - "user Relation field: cascade delete OFF — membership records must not be deleted if user account is deleted"

patterns-established:
  - "PocketBase v0.29.x create rule pattern: @request.auth.id != '' && @request.body.user = @request.auth.id"
  - "File field protection pattern: protected:true + image-only MIME + thumb sizes for personal data files"

requirements-completed:
  - MBACK-01
  - MBACK-02

duration: ~20min
completed: 2026-05-13
---

# Phase 11 Plan 01: wallecx_memberships Collection Summary

**`wallecx_memberships` PocketBase collection created with 10 fields, per-user collection rules on all 5 access types, image-only protected file field, and barcode_type SELECT enum**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-05-13
- **Tasks:** 2
- **Files modified:** 0 (Admin UI configuration only)

## Accomplishments

- Created `wallecx_memberships` collection with 10 user-defined fields: user (Relation), card_name (Text, required), issuer, barcode_value, card_number, notes, card_color (Text, optional), barcode_type (Select), expiry_date (Date), card_image (File)
- Set all 5 collection rules enforcing per-user ownership; create rule uses PocketBase v0.29.x syntax `@request.body.user`
- Configured `card_image` file field: protected ON, max size 10 MB, MIME types image/jpeg+image/png+image/webp (no PDF), thumbs 100x100 and 400x0
- Configured `barcode_type` as SELECT field with exactly 5 values: qr, code128, ean13, code39, number

## Task Commits

No code commits — this plan is Admin UI configuration only.

## Files Created/Modified

None — collection created via PocketBase Admin UI.

## Decisions Made

- **PB v0.29.x create rule:** `@request.body.user` replaces the plan's `@request.data.user` — confirmed working by developer
- **Unauthenticated list returns 200+empty (not 403) in v0.29.x:** This is expected behavior; the rule acts as a per-record filter. Real isolation verified in Plan 02 smoke test
- Followed all other field specs exactly as written in the plan

## Deviations from Plan

### Version Compatibility Fix

**1. Create rule syntax — PocketBase v0.29.x**
- **Found during:** Task 2 (Set collection rules)
- **Issue:** Plan specified `@request.data.user` (correct for v0.26.x); PocketBase v0.29.x rejected this syntax
- **Fix:** Used `@request.body.user` instead — developer confirmed it worked
- **Applied rule:** `@request.auth.id != "" && @request.body.user = @request.auth.id`

**2. Unauthenticated GET returns 200+empty (not 403)**
- **Found during:** Task 2 verification step
- **Issue:** Plan expected 403 for unauthenticated list; v0.29.x returns 200 with `items:[]`
- **Disposition:** Accepted — no data is exposed; the rule filters per-record. Hard isolation tested in Plan 02

---

**Total deviations:** 2 (version compatibility — no scope creep)
**Impact on plan:** Both deviations are PocketBase v0.29.x behavior differences, not security gaps. MBACK-01 and MBACK-02 fully satisfied.

## Issues Encountered

- PocketBase v0.29.x changed create rule body accessor from `@request.data.*` to `@request.body.*`
- PocketBase v0.29.x returns 200+empty for unauthenticated list (listRule acts as filter, not gate)

## Next Phase Readiness

- `wallecx_memberships` collection fully configured — ready for Plan 02 two-user smoke test
- All 5 access rules active; per-user isolation is the security gate for all membership card operations

---
*Phase: 11-backend-frontend-foundation*
*Completed: 2026-05-13*
