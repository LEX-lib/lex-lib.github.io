---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: — Search, Sort & View Toggle
status: Phase 7 complete (07-01, 07-02 done); Phase 8 next
last_updated: "2026-05-13T02:02:00.000Z"
last_activity: 2026-05-13 — 07-02 executed (WallecxApp.vue search/sort wiring, d3cce20)
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 23
  completed_plans: 23
  percent: 100
---

# Project State

**Last updated:** 2026-05-13 — Phase 7 complete: 07-02 executed (WallecxApp.vue search/sort wiring, d3cce20).

## Project Reference

**Project:** Lexarium — Wallecx milestone v1.2 (Search, Sort & View Toggle)
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save and retrieve their own vaccination records — text fields plus an attached scan/photo of the card — without ever losing access to them.
**Current focus:** Phase 6 — Grouped Card View & Group Detail Panel (GROUP-04, GROUP-05, GROUP-06, GROUP-07). Phases 7 and 8 are queued for v1.2.

## Current Position

**Milestone:** v1.2 — Search, Sort & View Toggle
**Phase:** Phase 7 (complete); Phase 8 next
**Plan:** 08-01-PLAN.md (next — View Toggle)
**Status:** 07-01 complete (af0c524); 07-02 complete (d3cce20); Phase 7 done
**Last activity:** 2026-05-13 — 07-02 executed: WallecxApp.vue search/sort wiring complete (d3cce20)

## Roadmap Snapshot

| # | Phase | Status | Requirements |
|---|-------|--------|--------------|
| 0 | Pre-Wallecx Cleanup | Complete | 3 (CLEAN-01..03) |
| 1 | Backend + Frontend Foundation | Complete | 10 (BACK-01..05, FRONT-01..05) |
| 2 | Read Path (List + Detail + Preview) | Complete | 6 (READ-01..05, READ-07; READ-06 dropped) |
| 3 | Write Path (Create / Edit / Delete) | Complete | 9 (WRITE-01..09) |
| 4 | Discovery & Polish | Complete | 5 (POLISH-01..05) |
| 5 | Schema, Types & Form Field | Complete | 3 (GROUP-01, GROUP-02, GROUP-03) |
| 6 | Grouped Card View & Group Detail Panel | Not started | 4 (GROUP-04, GROUP-05, GROUP-06, GROUP-07) |
| 7 | Toolbar — Search & Sort | Not started | 3 (SEARCH-01, SEARCH-02, SORT-01) |
| 8 | View Toggle | Not started | 2 (VIEW-01, VIEW-02) |

v1.0 Coverage: 34 / 34 requirements mapped. No orphans.
v1.1 Coverage: 7 / 7 requirements mapped. No orphans.
v1.2 Coverage: 5 / 5 requirements mapped. No orphans.

## Performance Metrics

- Phases shipped: 7 (Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6)
- Plans shipped: 21 (00-01, 00-02, 01-01, 01-02, 01-03, 02-01, 02-02, 02-03, 02-04, 03-01, 03-02, 03-03, 03-04, 04-01, 04-02, 04-03, 04-04, 06-01, 06-02, 07-01, 07-02)
- Requirements verified: 33 / 34 v1.0 (READ-06 dropped); 7 / 7 v1.1; 3 / 5 v1.2 (SEARCH-01, SEARCH-02, SORT-01)
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

### Key Decisions (v1.2 roadmap)

- **2 phases for v1.2.** SEARCH-01/02 and SORT-01 land in Phase 7 (toolbar component + computed filter/sort logic — query-like operations that compose together); VIEW-01/02 land in Phase 8 (presentation-layer layout toggle + session persistence — a separable concern with a clean delivery boundary).
- **No new PocketBase queries.** All v1.2 requirements are pure client-side computed/ref changes over the existing `groupedVaccinations` computed in `WallecxApp.vue`. No new runtime deps required.
- **VaccinationGroupCard reused unchanged.** VIEW-02 explicitly prohibits modifying the card component — only the grid layout class on the container changes.
- **View persistence via sessionStorage.** VIEW-01 specifies browser session persistence; sessionStorage is the natural fit (resets on new tab/window, survives in-tab navigation).
- **Phase numbering continues from v1.1.** v1.1 ended at Phase 6; v1.2 starts at Phase 7.

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

- Exact plan count for Phase 7 (TBD — determined at planning time; likely 2 plans: toolbar component + computed extensions).
- Exact plan count for Phase 8 (TBD — determined at planning time; likely 1 plan: view toggle button + sessionStorage persistence).

### Open Todos

- ~~Execute Phase 0 Plan 01: `00-01-PLAN.md`~~ — DONE (fe93bde, e5430dd, a7e0492)
- ~~Execute Phase 0 Plan 02: `00-02-PLAN.md` — human credential rotation checkpoint (CLEAN-02).~~ — DONE (developer confirmed: "credentials rotated")
- ~~Confirm with user that `local.jsonc` credentials have been rotated out-of-band before Phase 0 work merges (CLEAN-02).~~ — DONE
- ~~Execute Phase 3 Plan 04: `03-04-PLAN.md`~~ — DONE (b9691c2, cf8cfd5)
- Track whether the chosen CSP-narrow update for Phase 2 needs a Vite recipe research pass per `research/SUMMARY.md` "Research Flags."
- ~~`.planning/phases/02-read-path/02-REVIEW.md` — 3 warnings (WR-01 stale token, WR-02 thumbUrl guard, WR-03 dialog token-less) still open~~ — DONE (all three fixed inline during Phase 4 execution; 02-REVIEW.md marked resolved 2026-05-12)
- Execute Phase 6 plans: `06-01-PLAN.md` (VaccinationGroupCard.vue + groupedVaccinations), `06-02-PLAN.md` (VaccinationGroupPanel.vue + Drawer wiring) — next action.
- Plan Phase 7 via `/gsd-plan-phase 7` after Phase 6 is complete.

### Active Blockers

None.

### Risk Register (carried into v1.2 planning)

- **Pitfall 1 (CRITICAL):** per-user isolation only client-side — gated by Phase 1 BACK-03 + BACK-05 smoke test. RESOLVED.
- **Pitfall 2 (HIGH):** filter-string injection — addressed in Phase 3 WRITE-08 and reinforced in mapper conventions. RESOLVED.
- **Pitfall 3 (HIGH):** save loop never refreshes IDs — addressed in Phase 3 WRITE-04 + WRITE-09 test. RESOLVED.
- **Pitfall 4 (HIGH):** delete only mutates local state — addressed in Phase 3 WRITE-06. RESOLVED.
- **Pitfall 5 (HIGH):** PDF.js XSS / CVE-2024-4367 — addressed in Phase 1 FRONT-01 (version pin only; READ-06 CSP dropped — pdfjs incompatible with strict meta CSP). RESOLVED.
- **Pitfall 6 (HIGH):** orphan files on delete — addressed in Phase 3 WRITE-06 (5s 404 verification) and Phase 4 POLISH-05. RESOLVED.
- **Pitfall 7 (HIGH privacy):** EXIF GPS leak — addressed in Phase 3 WRITE-03. RESOLVED.
- **Pitfall 13 (CRITICAL operational):** dev creds in production bundle — addressed in Phase 0 (CLEAN-01..03). RESOLVED.
- **v1.1 NEW — schema migration with no data loss:** vaccine_type added as optional in PocketBase; existing records default to empty string. Verify no records deleted or corrupted after field addition.
- **v1.2 NEW — Uncategorized pinning under all sort modes:** SORT-01 requires Uncategorized always pinned last. The computed sort logic must handle this as a post-sort fixup, not inline, to avoid coupling with the sort direction.

## Session Continuity

**Last session:** 2026-05-13T02:02:00Z

**Next session entry point:** Plan and execute Phase 8 — View Toggle (VIEW-01, VIEW-02).

**Files of interest:**

- `src/components/projects/wallecx/WallecxApp.vue` — extended in 07-02 (d3cce20); target for Phase 8 view toggle
- `src/components/projects/wallecx/WallecxToolbar.vue` — Phase 8 extends this with a toggle button
- `.planning/phases/07-toolbar-search-sort/07-02-SUMMARY.md` — 07-02 execution summary

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-12 — v1.2 roadmap created (Phase 7: Toolbar — Search & Sort, Phase 8: View Toggle)*
