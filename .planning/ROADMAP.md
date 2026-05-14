# Roadmap: Wallecx (Lexarium milestone)

**Created:** 2026-05-10
**Mode:** YOLO, parallelization on, balanced models

## Milestones

- ✅ **v1.0 MVP** — Phases 0–4 (shipped 2026-05-12) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Vaccine Grouping** — Phases 5–6 (shipped 2026-05-12)
- ✅ **v1.2 Search, Sort & View Toggle** — Phases 7–9 (shipped 2026-05-13)
- ✅ **v2.0 Membership Cards** — Phases 10–13 (shipped 2026-05-14) — [archive](milestones/v2.0-ROADMAP.md)

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

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-14 — v2.0 complete. All 4 milestones shipped. Wallecx is a dual-tab vault (vaccinations + membership cards).*
