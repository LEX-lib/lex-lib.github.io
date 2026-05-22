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
- ✅ **v2.3 UX Polish** — Phases 17–18 (shipped 2026-05-18)
- ✅ **v3.0 Site-Wide Dark Mode** — Phases 19–22 (shipped 2026-05-19) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Daily Expense Tracker** — Phases 23–26 (shipped 2026-05-22) — [archive](milestones/v4.0-ROADMAP.md)

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

<details>
<summary>✅ v2.3 UX Polish (Phases 17–18) — SHIPPED 2026-05-18</summary>

- [x] Phase 17: Mobile Bottom Sheets & View Toggle (3/3 plans) — completed 2026-05-18
- [x] Phase 18: Dark Mode Fixes (1/1 plan) — completed 2026-05-18

**Milestone goal:** Refine the Wallecx mobile experience and visual quality — bottom sheets replace drawers/dialogs on mobile, dark mode renders correctly across all Wallecx surfaces, and the redundant view toggle is hidden on small screens with list view as the forced default.

</details>

<details>
<summary>✅ v3.0 Site-Wide Dark Mode (Phases 19–22) — SHIPPED 2026-05-19</summary>

- [x] Phase 19: Theme Infrastructure (1/1 plan) — completed 2026-05-18
- [x] Phase 20: Site Shell & Non-App Pages (1/1 plan) — completed 2026-05-18
- [x] Phase 21: Mini-App Dark Mode Sweep (4/4 plans) — completed 2026-05-19
- [x] Phase 22: Wallecx Audit (1/1 plan) — completed 2026-05-19

**Milestone goal:** Every Lexarium surface renders correctly in dark mode, with a manual NavBar toggle and an OS-preference-aware first-visit default.

Full details: [milestones/v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.0 Daily Expense Tracker (Phases 23–26) — SHIPPED 2026-05-22</summary>

- [x] Phase 23: Backend & Type Foundation (1/1 plan) — completed 2026-05-21
- [x] Phase 24: Write Path — Tab Shell + CRUD (2/2 plans) — completed 2026-05-21
- [x] Phase 25: Read Path — List View (2/2 plans) — completed 2026-05-21
- [x] Phase 26: Reporting View (3/3 plans) — completed 2026-05-22

**Milestone goal:** Add a third Wallecx record type — expenses — with daily logging, period-tabbed reporting (month / quarter / year / custom), and per-category breakdown charts. Wallecx expands from static personal records (vaccinations, memberships) into time-series spending data.

Full details: [milestones/v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

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
| 18. Dark Mode Fixes | v2.3 | 1/1 | Complete (UAT approved) | 2026-05-18 |
| 19. Theme Infrastructure | v3.0 | 1/1 | Complete (UAT approved) | 2026-05-18 |
| 20. Site Shell & Non-App Pages | v3.0 | 1/1 | Complete (UAT approved) | 2026-05-18 |
| 21. Mini-App Dark Mode Sweep | v3.0 | 4/4 | Complete (UAT approved) | 2026-05-19 |
| 22. Wallecx Audit | v3.0 | 1/1 | Complete (UAT approved) | 2026-05-19 |
| 23. Backend & Type Foundation | v4.0 | 1/1 | Complete (UAT approved) | 2026-05-21 |
| 24. Write Path — Tab Shell + CRUD | v4.0 | 2/2 | Complete (UAT approved) | 2026-05-21 |
| 25. Read Path — List View | v4.0 | 2/2 | Complete (UAT approved) | 2026-05-21 |
| 26. Reporting View | v4.0 | 3/3 | Complete (UAT approved) | 2026-05-22 |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-22 — v4.0 Daily Expense Tracker shipped and archived. All 27 phases complete across 9 milestones.*
