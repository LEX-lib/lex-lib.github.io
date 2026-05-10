---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-05-10T14:32:00.985Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
  percent: 50
---

# Project State

**Last updated:** 2026-05-10 (Phase 0 planned)

## Project Reference

**Project:** Lexarium — Wallecx milestone (Phase 1: Vaccination Records)
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save and retrieve their own vaccination records — text fields plus an attached scan/photo of the card — without ever losing access to them.
**Current focus:** Phase 0 (Pre-Wallecx Cleanup) — strip `VITE_LOGIN_*` plumbing and add a regression guard before introducing sensitive health-data surface.

## Current Position

**Milestone:** Wallecx (Phase 1 of the broader personal records vault)
**Phase:** Phase 0 — Pre-Wallecx Cleanup
**Plan:** 1 of 2 complete (00-01-PLAN.md done, 00-02-PLAN.md pending)
**Status:** Executing Phase 0 — Plan 01 complete
**Progress:** [█████░░░░░] 50%

```
[█░░░░░░░░░░░░░░░░░░░] 10%
Phase 0  Phase 1  Phase 2  Phase 3  Phase 4
(Phase 0: 1/2 plans)
```

## Roadmap Snapshot

| # | Phase | Status | Requirements |
|---|-------|--------|--------------|
| 0 | Pre-Wallecx Cleanup | Ready to execute | 3 (CLEAN-01..03) |
| 1 | Backend + Frontend Foundation | Not started | 10 (BACK-01..05, FRONT-01..05) |
| 2 | Read Path (List + Detail + Preview) | Not started | 7 (READ-01..07) |
| 3 | Write Path (Create / Edit / Delete) | Not started | 9 (WRITE-01..09) |
| 4 | Discovery & Polish | Not started | 5 (POLISH-01..05) |

Coverage: 34 / 34 v1 requirements mapped. No orphans.

## Performance Metrics

- Phases shipped: 0
- Plans shipped: 1 (00-01 — 2 min, 3 tasks, 3 files)
- Requirements verified: 2 / 34 (CLEAN-01, CLEAN-03)
- Tests in repo: 0 (will become 1 in Phase 3, 2 in Phase 4 — first tests ever)

## Accumulated Context

### Key Decisions (locked at planning time)

- **Mini-app, not separate deployment.** Wallecx ships as a Lexarium mini-app at `/projects/wallecx` mirroring LexTrack's structure (single `WallecxApp.vue`, sibling components, no Pinia store, local `ref` state).
- **Specific schema, not polymorphic vault.** v1 ships `wallecx_vaccinations` with the locked field set; future record types get their own collections rather than a generic discriminator.
- **Server-side per-user isolation is the auth boundary.** All five PocketBase rules enforce ownership; the route guard is UX only.
- **Single `card` file field for both image and PDF.** MIME-sniff at render time; `protected: true` plus short-lived view-time tokens.
- **Two net new runtime deps only.** `browser-image-compression@^2.0.2` and `vue-pdf-embed@^2.1.4`. FHIR rejected.
- **Coarse granularity, 5 phases.** Justified by the privacy/security-critical nature even though it sits at the upper edge of "coarse."
- **First repo tests land in Phase 3 / 4.** Mapper spec (Phase 3) and route-guard spec (Phase 4) are non-optional.

### Decisions from 00-01 Execution

- **lint:secrets uses grep exit codes.** Exit 0 = match found = alert (VITE_LOGIN_ reintroduced); exit 1 = no match = clean. npm run treats exit 1 as failure, which is the intended alerting behavior. No wrapper script needed.

### Decisions Pending

- Phase folder naming convention (decided at planning time, not now).
- Exact CI grep guard mechanism for CLEAN-03 (CI script vs pre-commit vs `npm run lint:secrets`) — resolved: `npm run lint:secrets` chosen, delivered in 00-01.
- Whether the Phase 4 JSON export includes a download-link bundle or pure references — interpretation finalized during Phase 4 planning.

### Open Todos

- ~~Execute Phase 0 Plan 01: `00-01-PLAN.md`~~ — DONE (fe93bde, e5430dd, a7e0492)
- Execute Phase 0 Plan 02: `00-02-PLAN.md` — human credential rotation checkpoint (CLEAN-02).
- Confirm with user that `local.jsonc` credentials have been rotated out-of-band before Phase 0 work merges (CLEAN-02).
- Track whether the chosen CSP-narrow update for Phase 2 needs a Vite recipe research pass per `research/SUMMARY.md` "Research Flags."
- Track whether the EXIF + `browser-image-compression` ordering needs a research pass before Phase 3 planning per `research/SUMMARY.md` "Research Flags."

### Active Blockers

None.

### Risk Register (carried into planning)

- **Pitfall 1 (CRITICAL):** per-user isolation only client-side — gated by Phase 1 BACK-03 + BACK-05 smoke test.
- **Pitfall 2 (HIGH):** filter-string injection — addressed in Phase 3 WRITE-08 and reinforced in mapper conventions.
- **Pitfall 3 (HIGH):** save loop never refreshes IDs — addressed in Phase 3 WRITE-04 + WRITE-09 test.
- **Pitfall 4 (HIGH):** delete only mutates local state — addressed in Phase 3 WRITE-06.
- **Pitfall 5 (HIGH):** PDF.js XSS / CVE-2024-4367 — addressed in Phase 1 FRONT-01 (version pin) + Phase 2 READ-06 (narrow CSP).
- **Pitfall 6 (HIGH):** orphan files on delete — addressed in Phase 3 WRITE-06 (5s 404 verification) and Phase 4 POLISH-05 ("Looks Done But Isn't" sweep).
- **Pitfall 7 (HIGH privacy):** EXIF GPS leak — addressed in Phase 3 WRITE-03.
- **Pitfall 13 (CRITICAL operational):** dev creds in production bundle — addressed in Phase 0 (CLEAN-01..03).

## Session Continuity

**Last session:** 2026-05-10 — Executed 00-01-PLAN.md. Removed VITE_LOGIN_ from env.d.ts and CLAUDE.md; added lint:secrets to package.json. 3 tasks, 3 commits (fe93bde, e5430dd, a7e0492). TypeScript passes, lint:secrets clean.

**Next session entry point:** Execute `00-02-PLAN.md` (CLEAN-02 — credential rotation human checkpoint).

**Files of interest for the next session:**

- `.planning/phases/00-pre-wallecx-cleanup/00-02-PLAN.md` — human credential rotation checkpoint (next plan)
- `.planning/phases/00-pre-wallecx-cleanup/00-01-SUMMARY.md` — completed plan summary
- `.planning/ROADMAP.md` — phase structure and success criteria

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
