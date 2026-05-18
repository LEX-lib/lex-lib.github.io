# Roadmap: Wallecx (Lexarium milestone)

**Created:** 2026-05-10
**Mode:** YOLO, parallelization on, balanced models

## Milestones

- ✅ **v1.0 MVP** — Phases 0–4 (shipped 2026-05-12) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Vaccine Grouping** — Phases 5–6 (shipped 2026-05-12)
- ✅ **v1.2 Search, Sort & View Toggle** — Phases 7–9 (shipped 2026-05-13)
- ✅ **v2.0 Membership Cards** — Phases 10–13 (shipped 2026-05-14) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v2.1 Mobile PWA** — Phases 14–15 (shipped 2026-05-14)
- ✅ **v2.2 Sort and Search for Membership Cards** — Phase 16 (shipped 2026-05-15) — [archive](milestones/v2.2-ROADMAP.md)
- 🔄 **v2.3 UX Polish** — Phases 17–18 (in progress)

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

<details>
<summary>✅ v2.1 Mobile PWA (Phases 14–15) — SHIPPED 2026-05-14</summary>

- [x] Phase 14: PWA Foundation (4/4 plans) — completed 2026-05-14
- [x] Phase 15: Mobile Layouts (4/4 plans) — completed 2026-05-14

**Milestone goal:** Wallecx is installable as a home-screen app on iOS and Android, loads instantly on repeat visits, and is fully usable on a 375px phone viewport with correct touch targets, safe-area insets, and no horizontal scroll.

</details>

<details>
<summary>✅ v2.2 Sort and Search for Membership Cards (Phase 16) — SHIPPED 2026-05-15</summary>

- [x] Phase 16: Membership Card Toolbar (2/2 plans) — completed 2026-05-15

**Milestone goal:** Add a persistent toolbar to the Membership Cards tab so users can filter cards in real time by name or issuer and reorder the grid by name, issuer, expiry, or recently added — all as pure client-side computed changes with no new PocketBase queries.

Full details: [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md)

</details>

## v2.3 UX Polish

**Milestone goal:** Refine the Wallecx mobile experience and visual quality — bottom sheets replace drawers/dialogs on mobile, dark mode renders correctly across all Wallecx surfaces, and the redundant view toggle is hidden on small screens with list view as the forced default.

- [x] **Phase 17: Mobile Bottom Sheets & View Toggle** - Replace right drawer and centered dialog with bottom sheets on mobile (< 640px); hide view toggle on small screens (code + UAT approved 2026-05-18)
- [ ] **Phase 18: Dark Mode Fixes** - Fix PrimeVue #7465 light-mode bleed across all Wallecx surfaces when dark theme is active

---

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
- [x] 14-04-PLAN.md — Production build verification and Chrome DevTools PWA-07 installability check

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
**Plans**: 4 plans

Plans:
- [x] 15-01-PLAN.md — Viewport meta (viewport-fit=cover, interactive-widget), App.vue top safe-area, WallecxApp.vue bottom/side safe-area + overscroll-none + global dialog CSS override; verify MembershipsTab/VaccinationsTab grid classes
- [x] 15-02-PLAN.md — Touch targets on WallecxToolbar.vue, VaccinationGroupPanel.vue, MembershipCard.vue, VaccinationGroupCard.vue
- [x] 15-03-PLAN.md — Create PwaInstallBanner.vue (iOS Safari only, localStorage dismiss, Teleport to body); wire into WallecxApp.vue
- [x] 15-04-PLAN.md — [Gap closure] Replace VaccinationGroupPanel DataTable (384px min-width overflow) with v-for card list; closes UAT Gap 1

**UI hint**: yes

### Phase 17: Mobile Bottom Sheets & View Toggle
**Goal**: On phones (< 640px), the vaccination group detail and membership card detail slide up from the bottom of the screen instead of opening as a side drawer or centered dialog; the grid/list view toggle is hidden and list view is forced as the default
**Depends on**: Phase 16
**Requirements**: UX-01, UX-02, UX-03, UX-04, MOB-09
**Success Criteria** (what must be TRUE):
  1. On a phone (< 640px), tapping a vaccination group card opens a panel that slides up from the bottom of the screen, showing all records in the group and their edit/delete actions; no right-side drawer appears
  2. On a phone (< 640px), tapping a membership card opens a detail view that slides up from the bottom of the screen, showing the card details and barcode; no centered modal dialog appears
  3. The bottom sheet can be dismissed by tapping the backdrop area or a visible close button; the sheet disappears smoothly
  4. On a desktop or tablet (≥ 640px), the vaccination group detail opens as a right-side drawer and the membership card detail opens as a centered dialog — identical to the behaviour before this phase
  5. On a phone (< 640px), the grid/list toggle buttons are not visible in WallecxToolbar; the vaccination tab renders in list layout regardless of any previously stored sessionStorage value
**Plans**: 3 plans

Plans:
- [x] 17-01-PLAN.md — Create `useIsMobile` composable + add bottom-Drawer 85dvh CSS override (foundation)
- [x] 17-02-PLAN.md — `VaccinationsTab.vue`: reactive Drawer position, drag handle pill, `effectiveViewMode`, `showToggle` hidden on mobile (UX-01, UX-03, UX-04, MOB-09)
- [x] 17-03-PLAN.md — `MembershipsTab.vue`: `v-if` Dialog / `v-else` Drawer-bottom split with drag handle pill (UX-02, UX-03, UX-04)

**UI hint**: yes

### Phase 18: Dark Mode Fixes
**Goal**: Every Wallecx surface — card grids, dialogs, the group detail panel, the scan overlay, and BarcodeDisplay — renders with the correct dark palette when the `my-app-dark` class is active; no PrimeVue #7465 light-mode bleed is visible
**Depends on**: Phase 17
**Requirements**: DARK-01, DARK-02, DARK-03
**Success Criteria** (what must be TRUE):
  1. With dark mode active, the vaccination group cards and membership card tiles show dark backgrounds and light text; no white or light-grey card faces are visible in the grid
  2. With dark mode active, the ManageVaccination dialog, ManageMembership dialog, and the vaccination group detail panel (or bottom sheet on mobile) all render with dark backgrounds, dark form inputs, and legible labels — no white flash or light panel face
  3. With dark mode active, the full-screen scan overlay renders with a dark background and the barcode/QR code is clearly legible; BarcodeDisplay renders the correct foreground/background contrast without inheriting light-mode PrimeVue variables
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
| 14. PWA Foundation | v2.1 | 4/4 | Complete | 2026-05-14 |
| 15. Mobile Layouts | v2.1 | 4/4 | Complete | 2026-05-14 |
| 16. Membership Card Toolbar | v2.2 | 2/2 | Complete | 2026-05-15 |
| 17. Mobile Bottom Sheets & View Toggle | v2.3 | 3/3 | Complete (UAT approved) | 2026-05-18 |
| 18. Dark Mode Fixes | v2.3 | 0/? | Not started | - |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-18 — Phase 17 shipped (code-verified); Phase 18 next*
