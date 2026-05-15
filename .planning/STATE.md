---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: Sort and Search for Membership Cards
status: in_progress
stopped_at: Phase 16 Plan 01 complete (2026-05-15)
last_updated: "2026-05-15T05:48:44Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
  percent: 50
---

# Project State

**Last updated:** 2026-05-15 — Phase 16 Plan 01 complete. WallecxToolbar sortOptions refactored to required prop; VaccinationsTab owns vaccinationSortOptions.

## Project Reference

**Project:** Lexarium — Wallecx
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.
**Current focus:** v2.2 Sort and Search for Membership Cards — Phase 16 Plan 02: MembershipsTab toolbar wiring.

## Current Position

**Milestone:** v2.2 — Sort and Search for Membership Cards (IN PROGRESS)
**Phase:** Phase 16 — Membership Card Toolbar (In progress — 1/2 plans done)
**Plan:** 16-02
**Status:** Ready to execute 16-02

## Shipped Milestones Summary

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 0–4 | 17 | 2026-05-12 |
| v1.1 Vaccine Grouping | 5–6 | 4 | 2026-05-12 |
| v1.2 Search, Sort & View Toggle | 7–9 | 5 | 2026-05-13 |
| v2.0 Membership Cards | 10–13 | 12 | 2026-05-14 |
| v2.1 Mobile PWA | 14–15 | 8 | 2026-05-14 |

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

### v2.2 Toolbar Implementation Notes

- **Reuse WallecxToolbar.vue** — already implements search + sort + view toggle for VaccinationsTab. Adapt for MembershipsTab via a prop to hide the view toggle (membership cards are always grid-view).
- **State lives in MembershipsTab.vue** — `searchQuery` ref + `sortMode` ref → `filteredSortedMemberships` computed → passed to card grid. Mirrors the VaccinationsTab pattern.
- **No new PocketBase queries.** All filtering and sorting is client-side on the already-loaded `memberships` ref.
- **Sort modes:** Name A–Z, Issuer A–Z, Expiry Date (soonest first; cards without expiry sorted last), Recently Added.
- **Session retention for sort mode** via `sessionStorage` — same approach as VaccinationsTab.
- **Empty state** when search matches zero cards — informative message, not a blank area.
- **sortOptions is a required prop on WallecxToolbar** — each tab must pass its own sort options array. VaccinationsTab passes `vaccinationSortOptions`; MembershipsTab will pass `membershipSortOptions`. (Established in Plan 16-01.)

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

**Last session:** 2026-05-15T05:48:44Z

**Stopped at:** Phase 16 Plan 01 complete — WallecxToolbar sortOptions refactored to required prop; VaccinationsTab owns vaccinationSortOptions; type-check passes.

**Next session entry point:** Execute Plan 16-02 — wire MembershipsTab with searchQuery/sortMode refs, displayedMemberships computed, sessionStorage persistence, WallecxToolbar in template, and no-results empty state.

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-15 — v2.2 roadmap created; Phase 16 ready for planning*
