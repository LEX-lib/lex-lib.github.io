---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Mobile PWA
status: planning
stopped_at: context exhaustion at 92% (2026-05-14)
last_updated: "2026-05-14T04:04:19.962Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

**Last updated:** 2026-05-14 — v2.1 Mobile PWA roadmap created. Phases 14–15 defined. 15 requirements mapped (PWA-01..07, MOB-01..08). Ready to plan Phase 14.

## Project Reference

**Project:** Lexarium — Wallecx
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.
**Current focus:** v2.1 Mobile PWA — Phase 14: PWA Foundation is next.

## Current Position

**Milestone:** v2.1 — Mobile PWA (PLANNING)
**Phase:** Phase 14 — PWA Foundation (not started)
**Plan:** No plan yet — run `/gsd-plan-phase 14` to begin
**Status:** Roadmap complete. Awaiting phase planning.

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

**Last session:** 2026-05-14T04:04:19.950Z

**Stopped at:** context exhaustion at 92% (2026-05-14)

**Next session entry point:** Run `/gsd-plan-phase 14` to plan Phase 14: PWA Foundation (PWA-01..07).

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-14 — v2.1 Mobile PWA roadmap created; status set to planning; current phase 14*
