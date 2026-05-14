---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Mobile PWA
status: in_progress
stopped_at: ""
last_updated: "2026-05-14T05:29:37Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 4
  completed_plans: 2
---

# Project State

**Last updated:** 2026-05-14 — Phase 14 Plan 02 complete. PWA icons generated, VitePWA() added to vite.config.ts, env.d.ts type reference added.

## Project Reference

**Project:** Lexarium — Wallecx
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.
**Current focus:** v2.1 Mobile PWA — Phase 14: PWA Foundation is next.

## Current Position

**Milestone:** v2.1 — Mobile PWA (IN PROGRESS)
**Phase:** Phase 14 — PWA Foundation (2/4 plans complete)
**Plan:** 14-03 is next (WallecxApp.vue auth resilience + SW update toast)
**Status:** Executing. Plans 14-01 and 14-02 complete.

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

Known deferred items at close: 7 (carried from v1.0 close)

## Session Continuity

**Last session:** 2026-05-14T05:29:37Z

**Stopped at:** Plan 14-02 complete (2/2 tasks committed: 23bd6a1, 4ba2081)

**Next session entry point:** Execute Plan 14-03 — WallecxApp.vue auth resilience (navigator.storage.persist, pb.authStore.isValid check) + SW update toast (useRegisterSW, needRefresh watch).

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-14 — v2.1 Mobile PWA roadmap created; status set to planning; current phase 14*
