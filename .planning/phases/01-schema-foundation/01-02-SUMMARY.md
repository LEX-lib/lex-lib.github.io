---
phase: 01-schema-foundation
plan: 02
subsystem: schema-verification
tags: [pocketbase, smoke-test, schema, node-script, dx]
dependency_graph:
  requires: [01-01-SUMMARY.md, .planning/pocketbase-schema.md]
  provides: [verify-schema.ts, npm:verify:schema]
  affects: [package.json]
tech_stack:
  added: [tsx@^4.21.0]
  patterns: [dual-path-superuser-auth, process-env-secrets, top-level-await-esm]
key_files:
  created:
    - .planning/phases/01-schema-foundation/verify-schema.ts
  modified:
    - package.json
decisions:
  - "Use process.env (not import.meta.env) — script runs in Node, not Vite"
  - "Dual-path auth: _superusers (PB 0.23+) try-caught with pb.admins fallback (PB <0.23)"
  - "Separate failed counter with process.exit(1) at end — all assertions run before exit"
  - "Pin tsx ^4.21.0 in devDependencies for reproducible npm run verify:schema"
metrics:
  duration: "2 min"
  completed: "2026-04-28"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
requirements: [SCHEMA-01, SCHEMA-02, SCHEMA-03]
---

# Phase 1 Plan 2: Schema Smoke-Test Script Summary

**One-liner:** Node-runnable TypeScript smoke-test asserting live PocketBase schema matches Phase 1 spec via pb.collections.getOne with dual-path superuser auth and descriptive PASS/FAIL output.

## What Was Built

### Task 1 — `.planning/phases/01-schema-foundation/verify-schema.ts` (commit: ad99f70)

159-line top-level-await ESM TypeScript script that:

1. Loads `VITE_API_BASE_URL`, `VITE_LOGIN_EMAIL`, `VITE_LOGIN_PASSWORD` from `process.env` (populated by `tsx --env-file=.env.local`). Exits 1 immediately with a clear error if any are missing.
2. Authenticates via dual-path: first tries `pb.collection('_superusers').authWithPassword()` (PB 0.23+), falls back to `(pb as any).admins.authWithPassword()` (PB <0.23). If both fail, prints both error messages and a guidance note, then exits 1.
3. Asserts **SCHEMA-01**: `dsu_meetings.duration_unit` — type=select, maxSelect=1, values=[minutes,hours], required=false.
4. Asserts **SCHEMA-02**: `dsu_supports.link` — type=url, required=false.
5. Asserts **SCHEMA-03**: `dsu_day_status` collection — base type; `date` field (text, required=true); `status` field (select, maxSelect=1, values=[sl,vl,holiday], required=true); all five access rules equal `@request.auth.id != ""`; indexes array contains a string with UNIQUE and date.
6. Prints `PASS:` or `FAIL:` per assertion. Exits 0 if all pass; exits 1 with a count of failures if any fail.

### Task 2 — `package.json` (commit: 935d6bc)

Two edits:
- Added `"verify:schema": "tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts"` to `scripts`.
- Added `"tsx": "^4.21.0"` to `devDependencies` (alphabetical insertion before `typescript`).

No other scripts or dependencies were changed.

## Deviations from Plan

None — plan executed exactly as written.

## Auth Gate Coverage

The script handles both known PocketBase auth API paths:

| Path | API | PB Version |
|------|-----|------------|
| Modern | `pb.collection('_superusers').authWithPassword()` | 0.23+ |
| Legacy | `(pb as any).admins.authWithPassword()` | <0.23 |

The header comment documents the superuser credential requirement and explains why regular `users` collection logins return 403 on the collections management API.

## Security Threat Coverage

| Threat ID | Status |
|-----------|--------|
| T-1-02 (credential disclosure) | Mitigated — all three env vars read exclusively from `process.env`; acceptance criterion grep verified no hardcoded URL/email/password string literals |
| T-1-03 (auth denial-of-service) | Mitigated — dual-path auth with descriptive guidance message on both-paths-fail |
| T-1-06 (supply-chain, pocketbase SDK) | Accepted per CONTEXT.md D-06 — same risk as production app |

## Known Stubs

None. The script is complete and functional. Live execution is deferred to Plan 03 (requires a migrated PocketBase instance and `.env.local` with superuser credentials — intentional; Plan 01 documents the migration steps the user must apply first).

## Self-Check Results

Checked below.
