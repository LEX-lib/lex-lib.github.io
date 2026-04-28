---
phase: 01-schema-foundation
plan: 01
subsystem: database
tags: [pocketbase, schema, migration, access-rules, unique-index]

requires: []
provides:
  - Step-by-step PocketBase admin UI migration runbook for Phase 1 schema changes
  - Explicit access rules (all five) for dsu_day_status to prevent public exposure
  - Verbatim CREATE UNIQUE INDEX SQL for dsu_day_status.date
  - Idempotent pre-flight checks so the doc is safe to re-read after partial application
  - Rollback instructions for each of the three schema changes
affects:
  - 01-02 (verify-schema.ts smoke script — must assert the same field names, types, rules, and index as this doc)
  - Phase 2 (types and mappers must match the field names and types documented here)
  - Phase 3 (UI components reference duration_unit and link fields described here)

tech-stack:
  added: []
  patterns:
    - "Idempotent migration doc: each section opens with a pre-flight check (skip if already applied)"
    - "Security-explicit rules: all five PocketBase rule fields listed individually with the exact rule string"
    - "Verbatim SQL in docs: index SQL shown as a copy-pasteable block to avoid typos"

key-files:
  created:
    - .planning/pocketbase-schema.md
  modified: []

key-decisions:
  - "duration_unit is an optional Select field (minutes/hours) with no backfill — existing records treated as minutes by Phase 2 mapper"
  - "dsu_supports.link is a URL field type (server-side format validation) not a plain text field"
  - "dsu_day_status.date is plain Text (YYYY-MM-DD) not PocketBase Date type — avoids RFC3339 timezone coercion"
  - "All five access rules on dsu_day_status explicitly set to @request.auth.id != '' (blank = public in PocketBase)"
  - "Unique index enforced via SQL in Indexes tab, not the deprecated per-field Unique checkbox"

patterns-established:
  - "Migration doc pattern: pre-flight idempotency check -> numbered click-through steps -> verification -> rollback note"

requirements-completed:
  - SCHEMA-04

duration: 2min
completed: 2026-04-28
---

# Phase 1 Plan 01: Schema Foundation Migration Doc Summary

**Step-by-step PocketBase admin UI runbook covering `duration_unit` (select) on `dsu_meetings`, `link` (URL) on `dsu_supports`, and the new `dsu_day_status` collection with auth-only access rules and unique date index**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-28T11:44:57Z
- **Completed:** 2026-04-28T11:47:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `.planning/pocketbase-schema.md` (277 lines) covering all three Phase 1 schema changes
- All five `dsu_day_status` access rules explicitly set to `@request.auth.id != ""` (9 occurrences in doc; grep count >= 5 requirement met)
- Verbatim unique index SQL (`CREATE UNIQUE INDEX idx_dsu_day_status_date ON dsu_day_status (date)`) included for copy-paste
- Three rollback notes present (one per schema change; grep count = 6)
- Idempotency pre-flight check at top of each section prevents destructive re-execution

## Task Commits

1. **Task 1: Write `.planning/pocketbase-schema.md`** - `05593aa` (docs)

**Plan metadata commit:** *(follows with this SUMMARY.md)*

## Files Created/Modified

- `.planning/pocketbase-schema.md` — Step-by-step PocketBase admin UI migration runbook for all three Phase 1 schema changes; includes pre-flight checks, numbered click-throughs, rollback notes, and a post-migration smoke test invocation instruction

## Decisions Made

- `duration_unit` is optional Select with no default backfill — Phase 2 mapper treats `undefined` as `'minutes'` to preserve existing record rendering (D-09)
- `dsu_supports.link` uses PocketBase URL field type for server-side format validation, not plain text (D-12)
- `dsu_day_status.date` uses plain Text type (not PocketBase Date) to avoid RFC3339 serialization timezone coercion (D-13)
- All five access rules on `dsu_day_status` listed explicitly — blank rules in PocketBase mean public access (T-1-01 mitigation)
- Unique index added via Indexes tab SQL, not the deprecated per-field Unique checkbox (removed in PB 0.14+)

## Deviations from Plan

None — plan executed exactly as written. All spec values encoded verbatim from CONTEXT.md decisions D-09 through D-14 and RESEARCH.md patterns.

## Issues Encountered

None.

## User Setup Required

The migration in `.planning/pocketbase-schema.md` must be applied **manually** by the user against the live PocketBase instance before Phase 2 work can be verified. After applying, run:

```sh
npm run verify:schema
```

(The `verify:schema` npm script and `.planning/phases/01-schema-foundation/verify-schema.ts` are delivered in Plan 02.)

## Known Stubs

None — this plan produces documentation only. No frontend data wiring.

## Threat Flags

None — this plan creates only a documentation file in `.planning/`. No new network endpoints, auth paths, or schema changes are introduced to the codebase itself (the schema changes are applied by the user following the doc).

## Next Phase Readiness

- Plan 01-02 (smoke-test script `verify-schema.ts`) can now proceed — the field names, types, rule strings, and index SQL documented here are the canonical spec the smoke script must assert.
- Phase 2 (Types and Mappers) can use the field names and types in this doc as the definitive reference.
- Blocker: user must apply the three schema changes from `.planning/pocketbase-schema.md` to the live PocketBase instance before Plan 02's smoke script can pass.

---
*Phase: 01-schema-foundation*
*Completed: 2026-04-28*
