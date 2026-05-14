# Roadmap: Wallecx (Lexarium milestone)

**Created:** 2026-05-10
**Mode:** YOLO, parallelization on, balanced models

## Milestones

- ✅ **v1.0 MVP** — Phases 0–4 (shipped 2026-05-12) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Vaccine Grouping** — Phases 5–6 (shipped 2026-05-12)
- ✅ **v1.2 Search, Sort & View Toggle** — Phases 7–9 (shipped 2026-05-13)
- ✅ **v2.0 Membership Cards** — Phases 10–13 (shipped 2026-05-14) — [archive](milestones/v2.0-ROADMAP.md)
- [ ] **v2.1 Mobile PWA** — Phases 14–15

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0–4) — SHIPPED 2026-05-12</summary>

- [x] Phase 0: Pre-Wallecx Cleanup (2/2 plans) — completed 2026-05-10
- [x] Phase 1: Backend + Frontend Foundation (3/3 plans) — completed 2026-05-11
- [x] Phase 2: Read Path (4/4 plans) — completed 2026-05-11
- [x] Phase 3: Write Path (4/4 plans) — completed 2026-05-12
- [x] Phase 4: Discovery & Polish (4/4 plans) — completed 2026-05-12

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Vaccine Grouping (Phases 5–6) — SHIPPED 2026-05-12</summary>

- [x] Phase 5: Schema, Types & Form Field (2/2 plans) — completed 2026-05-12
- [x] Phase 6: Grouped Card View & Group Detail Panel (2/2 plans) — completed 2026-05-12

**Milestone goal:** Reorganize the Wallecx view from a flat date-sorted list into vaccine-type group cards so users can instantly find all records for a specific vaccine category.

</details>

<details>
<summary>✅ v1.2 Search, Sort & View Toggle (Phases 7–9) — SHIPPED 2026-05-13</summary>

- [x] Phase 7: Toolbar — Search & Sort (2/2 plans) — completed 2026-05-13
- [x] Phase 8: View Toggle (2/2 plans) — completed 2026-05-13
- [x] Phase 9: Restore Edit & Delete in Grouped View (1/1 plan) — completed 2026-05-13

**Milestone goal:** Add a persistent toolbar above the Wallecx grouped card view so users can filter groups by vaccine name/type, sort them, and switch between grid and list layouts — all via pure client-side computed/ref changes with no new PocketBase queries.

</details>

<details>
<summary>✅ v2.0 Membership Cards (Phases 10–13) — SHIPPED 2026-05-14</summary>

- [x] Phase 10: Tabs Shell — VaccinationsTab Extraction (2/2 plans) — completed 2026-05-13
- [x] Phase 11: Backend + Frontend Foundation (3/3 plans) — completed 2026-05-13
- [x] Phase 12: Read Path — Card Grid, Barcode Display & Detail (4/4 plans) — completed 2026-05-13
- [x] Phase 13: Write Path — ManageMembership CRUD (3/3 plans) — completed 2026-05-14

**Milestone goal:** Add a second Wallecx vault record type — membership/loyalty/insurance/ID cards — with barcode and QR code rendering, a full-screen scan overlay for counter use, a coloured card grid, and full CRUD. Wallecx becomes a tabbed shell switching between Vaccinations and Membership Cards.

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

---

## v2.1 Mobile PWA

**Milestone goal:** Wallecx is installable as a home-screen app on iOS and Android, loads instantly on repeat visits, and is fully usable on a 375px phone viewport with correct touch targets, safe-area insets, and no horizontal scroll.

- [ ] **Phase 14: PWA Foundation** - Install prerequisites: manifest, icons, service worker, Vercel cache headers, auth resilience, and update toast
- [ ] **Phase 15: Mobile Layouts** - Responsive grids, 44px touch targets, dvh dialogs, safe-area insets, overscroll lock, and iOS install banner

## Phase Details

### Phase 14: PWA Foundation
**Goal**: Wallecx is installable on any device — manifest, icons, and service worker are deployed with correct Vercel cache headers; auth survives iOS storage eviction; users are prompted before any service worker update discards unsaved form state
**Depends on**: Phase 13 (v2.0 complete)
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, PWA-06, PWA-07
**Success Criteria** (what must be TRUE):
  1. Visiting `/projects/wallecx` on Chrome Android shows a browser "Add to Home Screen" prompt (manifest valid, SW registered, HTTPS confirmed)
  2. Installing to home screen on iOS Safari opens Wallecx in standalone mode (no browser chrome) with the navy splash background
  3. After installing and opening from the home screen a second time, the app shell loads without a network request (precache hit)
  4. Letting the iOS device sit for 8+ days and re-opening the installed PWA redirects to `/login` with a "Session expired" toast instead of a blank screen
  5. When a new service worker is waiting, a non-blocking toast with a "Refresh" button appears — tapping it reloads the app; no forced reload happens while a CRUD dialog is open
**Plans**: 4 plans

Plans:
- [x] 14-01-PLAN.md — Install PWA packages, create vercel.json, create square icon SVG source
- [x] 14-02-PLAN.md — Generate PWA icon PNGs, configure vite.config.ts VitePWA plugin, add env.d.ts type reference
- [x] 14-03-PLAN.md — Modify WallecxApp.vue with auth resilience and SW update toast
- [ ] 14-04-PLAN.md — Production build verification and Chrome DevTools PWA-07 installability check

**UI hint**: yes

### Phase 15: Mobile Layouts
**Goal**: Every Wallecx screen is fully usable on a 375px phone viewport — card grids are single-column, touch targets are 44px minimum, CRUD dialogs scroll within the viewport when the iOS keyboard is open, notch/home-indicator areas are clear, and iOS users are guided to install the app
**Depends on**: Phase 14
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07, MOB-08
**Success Criteria** (what must be TRUE):
  1. On a 375px wide iPhone viewport, all Wallecx screens (both tab grids, both CRUD dialogs, group detail drawer, scan overlay, empty states) can be used without horizontal scrolling or content clipping
  2. The membership card grid shows one card per row on phones (< 640px) and two per row on tablets (≥ 640px); the vaccination group grid follows the same breakpoint behaviour
  3. Tapping any interactive element — card tile, toolbar button, drawer action row, dialog button — triggers the action without requiring precision; every target is at least 44×44px
  4. Opening a CRUD dialog on an iPhone and tapping into a text field causes the form to scroll within the dialog (not push content off-screen); the Save/Cancel buttons remain reachable without dismissing the keyboard
  5. On a notched iPhone, the Wallecx shell content sits inside the safe area — no text or buttons are hidden behind the notch, Dynamic Island, or home indicator bar
  6. On iOS Safari (not standalone), a dismissible "Add to Home Screen" instruction banner appears once; it does not reappear after dismissal, and it is not shown in standalone mode
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Pre-Wallecx Cleanup | v1.0 | 2/2 | Complete | 2026-05-10 |
| 1. Backend + Frontend Foundation | v1.0 | 3/3 | Complete | 2026-05-11 |
| 2. Read Path | v1.0 | 4/4 | Complete | 2026-05-11 |
| 3. Write Path | v1.0 | 4/4 | Complete | 2026-05-12 |
| 4. Discovery & Polish | v1.0 | 4/4 | Complete | 2026-05-12 |
| 5. Schema, Types & Form Field | v1.1 | 2/2 | Complete | 2026-05-12 |
| 6. Grouped Card View & Group Detail Panel | v1.1 | 2/2 | Complete | 2026-05-12 |
| 7. Toolbar — Search & Sort | v1.2 | 2/2 | Complete | 2026-05-13 |
| 8. View Toggle | v1.2 | 2/2 | Complete | 2026-05-13 |
| 9. Restore Edit & Delete in Grouped View | v1.2 | 1/1 | Complete | 2026-05-13 |
| 10. Tabs Shell — VaccinationsTab Extraction | v2.0 | 2/2 | Complete | 2026-05-13 |
| 11. Backend + Frontend Foundation | v2.0 | 3/3 | Complete | 2026-05-13 |
| 12. Read Path — Card Grid, Barcode Display & Detail | v2.0 | 4/4 | Complete | 2026-05-13 |
| 13. Write Path — ManageMembership CRUD | v2.0 | 3/3 | Complete | 2026-05-14 |
| 14. PWA Foundation | v2.1 | 3/4 | In progress | - |
| 15. Mobile Layouts | v2.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-14 — Plan 14-03 complete; WallecxApp.vue extended with auth resilience (navigator.storage.persist, pb.authStore.isValid) and SW update toast (useRegisterSW, needRefresh watch)*
