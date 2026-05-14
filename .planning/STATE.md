---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Mobile PWA
status: complete
stopped_at: Phase 15 fully verified (2026-05-14)
last_updated: "2026-05-14T11:30:00.000Z"
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

**Last updated:** 2026-05-14 — Phase 15 Mobile Layouts fully complete (4/4 plans, gap closure Plan 04 executed, verification passed). Milestone v2.1 complete.

## Project Reference

**Project:** Lexarium — Wallecx
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.
**Current focus:** v2.1 Mobile PWA — Phase 15: Mobile Layouts is next.

## Current Position

**Milestone:** v2.1 — Mobile PWA (IN PROGRESS)
**Phase:** Phase 15 — Mobile Layouts (4/4 plans complete — verified)
**Plan:** All plans executed (15-01, 15-02, 15-03, 15-04). Verification passed.
**Status:** Milestone v2.1 complete. All phases and plans done.

## Shipped Milestones Summary

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 0–4 | 17 | 2026-05-12 |
| v1.1 Vaccine Grouping | 5–6 | 4 | 2026-05-12 |
| v1.2 Search, Sort & View Toggle | 7–9 | 5 | 2026-05-13 |
| v2.0 Membership Cards | 10–13 | 12 | 2026-05-14 |

## Accumulated Context

### Architectural Invariants (locked)

- **Mini-app, not separate deployment.** Wallecx ships as a Lexarium mini-app at `/projects/wallecx`.
- **Specific collections, not polymorphic vault.** Each record type has its own PocketBase collection (`wallecx_vaccinations`, `wallecx_memberships`).
- **Server-side per-user isolation is the auth boundary.** All five PocketBase rules enforce ownership; the route guard is UX only.
- **Tab shell, not sub-routes.** PrimeVue Tabs with string-typed `activeTab`; each tab owns its own state; no new Pinia store.
- **Direct v-model refs for ManageMembership.vue.** PrimeVue ColorPicker issue #8135 — controlled system ignores initial value. This is the established pattern for membership write path.
- **ConfirmDialog at WallecxApp.vue shell level only.** `useConfirm` broadcasts to single app-shell-level instance; not duplicated in tab components.
- **requestKey per collection.** `'memberships-getFullList'` and `'vaccinations-getFullList'` (or equivalent) must stay distinct to prevent PocketBase auto-cancel.
- **card_color stored without `#` prefix.** All CSS bindings prepend `#`. Zod validates `[0-9a-fA-F]{6}`.
- **iOS fullscreen via viewport overlay.** `position:fixed;inset:0;z-index:9999` — not the Fullscreen API.
- **JsBarcode always in try/catch.** Throws synchronously on invalid input. On catch, render `card_number` as large plain text.

### v2.1 PWA Architectural Decisions (new)

- **registerType: 'prompt' only — never autoUpdate.** Both CRUD forms have unsaved state; a silent SW reload would destroy it.
- **All PocketBase API calls: NetworkOnly.** Auth token lives in localStorage (inaccessible to SW context); stale data risk is unacceptable for a personal vault.
- **navigateFallback: 'index.html' is mandatory.** Without it, navigating to `/projects/wallecx` offline = white screen (SPA routing requirement).
- **vercel.json must ship in the same deployment as the first SW.** Vercel may cache sw.js indefinitely without `Cache-Control: no-cache` headers.
- **navigator.storage.persist() on WallecxApp.vue mount.** Mitigates (does not guarantee) iOS 7-day localStorage eviction of PocketBase auth token.
- **scope: '/' not '/projects/wallecx'.** Scoping to sub-path breaks cross-route navigation within the installed PWA.
- **Do NOT add `<link rel="manifest">` manually.** vite-plugin-pwa auto-injects it at build time.

### v2.1 PWA Build Decisions (Plan 14-04)

- **globIgnores: ['**/about-me-photo*']** — the about-me home page photo (9.85 MB) is excluded from Workbox precache; not needed offline for Wallecx PWA functionality.
- **maximumFileSizeToCacheInBytes: 3 MiB** — vendor bundle (2.57 MiB, contains Vue/Pinia/Router) must be precached for app shell offline; 3 MiB limit accommodates it.
- **Task 2 human-verify auto-approved** — per auto_advance:true config; Chrome DevTools verification instructions documented in 14-04-SUMMARY.md for async follow-up.

### Open Todos

None.

### Active Blockers

None.

## Deferred Items

Items acknowledged and deferred at v1.0 milestone close on 2026-05-13:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 00: 00-HUMAN-UAT.md | partial — 1 pending scenario |
| uat_gap | Phase 08: 08-HUMAN-UAT.md | partial — 4 pending scenarios |
| verification_gap | Phase 00: 00-VERIFICATION.md | human_needed |
| verification_gap | Phase 02: 02-VERIFICATION.md | human_needed |
| verification_gap | Phase 04: 04-VERIFICATION.md | human_needed |
| verification_gap | Phase 05: 05-VERIFICATION.md | human_needed |
| verification_gap | Phase 08: 08-VERIFICATION.md | human_needed |

| uat_gap | Phase 14: 14-HUMAN-UAT.md | partial — 3 pending scenarios (Chrome DevTools PWA install, iOS standalone, offline precache) |

Known deferred items at close: 8 (7 from v1.0 + 1 from Phase 14)

## Session Continuity

**Last session:** 2026-05-14T11:30:00.000Z

**Stopped at:** Milestone v2.1 complete — all phases and plans verified (2026-05-14)

**Next session entry point:** Milestone v2.1 complete. Start a new milestone or deploy (`/gsd-progress` to review).

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-14 — Phase 15 gap closure Plan 04 complete; verification passed; milestone v2.1 done*
