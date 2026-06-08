---
phase: 00-pre-wallecx-cleanup
plan: 01
subsystem: infra
tags: [vite, typescript, env, lint, grep, security]

# Dependency graph
requires: []
provides:
  - env.d.ts without VITE_LOGIN_EMAIL and VITE_LOGIN_PASSWORD declarations
  - lint:secrets npm script that fails (exit 0) if VITE_LOGIN_ is reintroduced under src/
  - CLAUDE.md without credential variable documentation
affects:
  - 00-pre-wallecx-cleanup (plan 02 — credential rotation confirmation)
  - All future plans touching env.d.ts or package.json lint pipeline

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grep-based secret regression guard: lint:secrets chains into npm run lint via run-s lint:*"

key-files:
  created: []
  modified:
    - env.d.ts
    - package.json
    - CLAUDE.md

key-decisions:
  - "lint:secrets uses standard grep exit codes: exits 0 (match found = fail) when VITE_LOGIN_ is present, exits 1 (no match = pass) when clean; npm run treats exit 1 as script failure, which is the intended alert behavior"

patterns-established:
  - "Secret regression guards use grep -r <pattern> src/ as lint:* scripts so they chain into npm run lint automatically with no extra wiring"

requirements-completed: [CLEAN-01, CLEAN-03]

# Metrics
duration: 2min
completed: 2026-05-10
---

# Phase 0 Plan 01: Pre-Wallecx Cleanup (Credential Scrub) Summary

**Removed VITE_LOGIN_EMAIL and VITE_LOGIN_PASSWORD from env.d.ts and CLAUDE.md, and added a grep-based lint:secrets regression guard to package.json**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-10T14:27:03Z
- **Completed:** 2026-05-10T14:29:19Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Stripped VITE_LOGIN_EMAIL and VITE_LOGIN_PASSWORD type declarations from ImportMetaEnv — tsc no longer exposes the credential variable names in type-checked code (T-00-01 mitigated)
- Added `lint:secrets` script (`grep -r VITE_LOGIN_ src/`) to package.json — automatically included in every `npm run lint` invocation via `run-s lint:*` (CLEAN-03 delivered)
- Removed the credential variable bullet from CLAUDE.md's Environment Variables section — future agents and developers will not be misled into reinstating the variables (T-00-04 mitigated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove VITE_LOGIN_ declarations from env.d.ts** - `fe93bde` (chore)
2. **Task 2: Add lint:secrets npm script to package.json** - `e5430dd` (chore)
3. **Task 3: Remove VITE_LOGIN_ bullet from CLAUDE.md** - `a7e0492` (docs)

## Files Created/Modified

- `env.d.ts` - Removed VITE_LOGIN_EMAIL and VITE_LOGIN_PASSWORD from ImportMetaEnv; three remaining declarations intact
- `package.json` - Added `"lint:secrets": "grep -r VITE_LOGIN_ src/"` to scripts section between lint:eslint and lint
- `CLAUDE.md` - Removed `VITE_LOGIN_EMAIL / VITE_LOGIN_PASSWORD — dev login shortcuts` bullet from Key variables list

## Decisions Made

- `lint:secrets` uses plain grep exit-code convention (exit 0 = matches found = alert; exit 1 = no matches = clean). No wrapper script needed — npm run treats exit 1 as failure, which is the desired alert behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 0 Plan 01 complete. All three files modified and committed.
- TypeScript compilation passes after env.d.ts changes.
- `npm run lint:secrets` exits 1 (clean — no VITE_LOGIN_ in src/).
- Ready for Plan 02 (`00-02-PLAN.md`): credential rotation human checkpoint (CLEAN-02).

---
*Phase: 00-pre-wallecx-cleanup*
*Completed: 2026-05-10*
