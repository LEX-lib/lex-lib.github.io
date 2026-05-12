---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Vaccine Grouping
status: in_progress
last_updated: "2026-05-12T00:00:00.000Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

**Last updated:** 2026-05-12 — Milestone v1.1 (Vaccine Grouping) roadmap created; Phase 5 and Phase 6 defined.

## Project Reference

**Project:** Lexarium — Wallecx milestone v1.1 (Vaccine Grouping)
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save and retrieve their own vaccination records — text fields plus an attached scan/photo of the card — without ever losing access to them.
**Current focus:** Phase 5 — Schema, Types & Form Field (GROUP-01, GROUP-02, GROUP-03).

## Current Position

**Milestone:** v1.1 — Vaccine Grouping
**Phase:** Phase 5 — Schema, Types & Form Field
**Plan:** Not started
**Status:** Ready to plan Phase 5
**Last activity:** 2026-05-12 — v1.1 roadmap created (Phase 5 and Phase 6)

## Roadmap Snapshot

| # | Phase | Status | Requirements |
|---|-------|--------|--------------|
| 0 | Pre-Wallecx Cleanup | Complete | 3 (CLEAN-01..03) |
| 1 | Backend + Frontend Foundation | Complete | 10 (BACK-01..05, FRONT-01..05) |
| 2 | Read Path (List + Detail + Preview) | Complete | 6 (READ-01..05, READ-07; READ-06 dropped) |
| 3 | Write Path (Create / Edit / Delete) | Complete | 9 (WRITE-01..09) |
| 4 | Discovery & Polish | Complete | 5 (POLISH-01..05) |
| 5 | Schema, Types & Form Field | Not started | 3 (GROUP-01, GROUP-02, GROUP-03) |
| 6 | Grouped Card View & Group Detail Panel | Not started | 4 (GROUP-04, GROUP-05, GROUP-06, GROUP-07) |

v1.0 Coverage: 34 / 34 requirements mapped. No orphans.
v1.1 Coverage: 7 / 7 requirements mapped. No orphans.

## Performance Metrics

- Phases shipped: 5 (Phase 0, Phase 1, Phase 2, Phase 3, Phase 4)
- Plans shipped: 17 (00-01, 00-02, 01-01, 01-02, 01-03, 02-01, 02-02, 02-03, 02-04, 03-01, 03-02, 03-03, 03-04, 04-01, 04-02, 04-03, 04-04)
- Requirements verified: 33 / 34 v1.0 (READ-06 dropped); 0 / 7 v1.1
- Tests in repo: 13 (vaccinationMapper.spec.ts 10 tests + guard.spec.ts 3 tests)

## Accumulated Context

### Key Decisions (locked at planning time)

- **Mini-app, not separate deployment.** Wallecx ships as a Lexarium mini-app at `/projects/wallecx` mirroring LexTrack's structure (single `WallecxApp.vue`, sibling components, no Pinia store, local `ref` state).
- **Specific schema, not polymorphic vault.** v1 ships `wallecx_vaccinations` with the locked field set; future record types get their own collections rather than a generic discriminator.
- **Server-side per-user isolation is the auth boundary.** All five PocketBase rules enforce ownership; the route guard is UX only.
- **Single `card` file field for both image and PDF.** MIME-sniff at render time; `protected: true` plus short-lived view-time tokens.
- **Two net new runtime deps only.** `browser-image-compression@^2.0.2` and `vue-pdf-embed@^2.1.4`. FHIR rejected.
- **Coarse granularity, 5 phases (v1.0).** Justified by the privacy/security-critical nature even though it sits at the upper edge of "coarse."
- **First repo tests land in Phase 3 / 4.** Mapper spec (Phase 3) and route-guard spec (Phase 4) are non-optional.

### Key Decisions (v1.1 roadmap)

- **vaccine_type is optional in PocketBase schema but required in the form.** Existing records keep empty string (no data loss); the form enforces required for all new and edited records. This avoids a destructive migration while keeping future data clean.
- **2 phases for v1.1.** GROUP-01/02/03 (schema + types + form) land in Phase 5; GROUP-04/05/06/07 (grouped card UI + panel) land in Phase 6. The split ensures the backend field exists before the grouped view queries it.
- **Phase numbering continues from v1.0.** v1.0 ended at Phase 4; v1.1 starts at Phase 5.
- **Phase 6 is UI-heavy.** Grouped card view replaces the flat DataTable; GROUP-07 deliberately reuses the existing `VaccinationDetail.vue` dialog without modification.

### Decisions from 00-01 Execution

- **lint:secrets uses grep exit codes.** Exit 0 = match found = alert (VITE_LOGIN_ reintroduced); exit 1 = no match = clean. npm run treats exit 1 as failure, which is the intended alerting behavior. No wrapper script needed.

### Decisions from 03-04 Execution

- **useConfirm must be explicitly imported** — not auto-resolved by PrimeVueResolver. ConfirmDialog component tag IS auto-resolved. Pattern: import composable explicitly, use component tag directly.
- **Server-first delete pattern confirmed** — deleteRecord awaits pb.delete() before splice; on failure no splice (row stays visible). Implements Pitfall 4 / WRITE-06 correctly.
- **addFirst CTA via emit** — empty-state "Add your first vaccination" button emits addFirst; WallecxApp wires it to openManage(null). No prop drilling needed.

### Phase 3 Review Findings (03-REVIEW.md — WARN)

- **HIGH-01:** `pb.authStore.record!.id` non-null assertion in ManageVaccination.vue:147 — crashes if session expires at submit time. Fix: explicit null guard that re-routes to login.
- **HIGH-02:** `pendingFile` cleared only in `@hide` (onHide); rely on Dialog emit decoupling could persist stale file into next open. Fix: explicit `pendingFile.value = null` in success branch before `visible.value = false`.
- **MEDIUM-01:** Wrong comment at ManageVaccination.vue:151 — says `onCreated` calls `Object.assign` but it calls `unshift`.
- **MEDIUM-02:** `void mapToUpdateVaccination(...)` is a dead import; either use the return value as the PATCH body or remove the call.
- **MEDIUM-03:** `unshift` in `onCreated` places new records at top regardless of `date_administered` — breaks visual sort until reload.

### Decisions Pending

- Exact plan count for Phase 5 (TBD — determined at planning time).
- Exact plan count for Phase 6 (TBD — determined at planning time; likely 2 plans: grouped card component + group detail panel wiring).

### Open Todos

- ~~Execute Phase 0 Plan 01: `00-01-PLAN.md`~~ — DONE (fe93bde, e5430dd, a7e0492)
- ~~Execute Phase 0 Plan 02: `00-02-PLAN.md` — human credential rotation checkpoint (CLEAN-02).~~ — DONE (developer confirmed: "credentials rotated")
- ~~Confirm with user that `local.jsonc` credentials have been rotated out-of-band before Phase 0 work merges (CLEAN-02).~~ — DONE
- ~~Execute Phase 3 Plan 04: `03-04-PLAN.md`~~ — DONE (b9691c2, cf8cfd5)
- Track whether the chosen CSP-narrow update for Phase 2 needs a Vite recipe research pass per `research/SUMMARY.md` "Research Flags."
- ~~`.planning/phases/02-read-path/02-REVIEW.md` — 3 warnings (WR-01 stale token, WR-02 thumbUrl guard, WR-03 dialog token-less) still open~~ — DONE (all three fixed inline during Phase 4 execution; 02-REVIEW.md marked resolved 2026-05-12)
- Plan Phase 5: Schema, Types & Form Field (GROUP-01, GROUP-02, GROUP-03) — next action.

### Active Blockers

None.

### Risk Register (carried into v1.1 planning)

- **Pitfall 1 (CRITICAL):** per-user isolation only client-side — gated by Phase 1 BACK-03 + BACK-05 smoke test. RESOLVED.
- **Pitfall 2 (HIGH):** filter-string injection — addressed in Phase 3 WRITE-08 and reinforced in mapper conventions. RESOLVED.
- **Pitfall 3 (HIGH):** save loop never refreshes IDs — addressed in Phase 3 WRITE-04 + WRITE-09 test. RESOLVED.
- **Pitfall 4 (HIGH):** delete only mutates local state — addressed in Phase 3 WRITE-06. RESOLVED.
- **Pitfall 5 (HIGH):** PDF.js XSS / CVE-2024-4367 — addressed in Phase 1 FRONT-01 (version pin only; READ-06 CSP dropped — pdfjs incompatible with strict meta CSP). RESOLVED.
- **Pitfall 6 (HIGH):** orphan files on delete — addressed in Phase 3 WRITE-06 (5s 404 verification) and Phase 4 POLISH-05. RESOLVED.
- **Pitfall 7 (HIGH privacy):** EXIF GPS leak — addressed in Phase 3 WRITE-03. RESOLVED.
- **Pitfall 13 (CRITICAL operational):** dev creds in production bundle — addressed in Phase 0 (CLEAN-01..03). RESOLVED.
- **v1.1 NEW — schema migration with no data loss:** vaccine_type added as optional in PocketBase; existing records default to empty string. Verify no records deleted or corrupted after field addition.

## Session Continuity

**Last session:** 2026-05-12 — v1.1 roadmap created. Phase 5 (Schema, Types & Form Field) and Phase 6 (Grouped Card View & Group Detail Panel) defined. 7 / 7 v1.1 requirements mapped.

**Next session entry point:** Plan Phase 5 via `/gsd-plan-phase 5` — covers GROUP-01 (PocketBase field), GROUP-02 (TypeScript interface), GROUP-03 (form field + Zod validation).

**Files of interest:**

- `.planning/ROADMAP.md` — v1.1 phases appended (Phase 5, Phase 6)
- `.planning/REQUIREMENTS.md` — traceability table updated with GROUP-01..07
- `src/types/wallecx/vaccinations/types.d.ts` — target for GROUP-02 (add vaccine_type: string)
- `src/components/projects/wallecx/ManageVaccination.vue` — target for GROUP-03 (new form field)

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-12 — v1.1 roadmap created (Phase 5 and Phase 6)*
