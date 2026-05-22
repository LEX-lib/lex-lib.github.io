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
- 🔄 **v4.1 Gap Resolution & Feature Completeness** — Phases 27–30 (in progress)

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

### v4.1 Gap Resolution & Feature Completeness (Phases 27–30) — IN PROGRESS

- [ ] **Phase 27: Code Quality & Exports** - Fix two deferred code quality issues and add JSON export to Memberships and Expenses tabs
- [ ] **Phase 28: Budget Tracking** - New wallecx_expense_budgets collection + actual-vs-budget reporting in Reports tab
- [ ] **Phase 29: Period Comparison** - Extend ExpensesReportsView with period-over-period comparison section
- [ ] **Phase 30: UAT Sweep** - Structured UAT pass over phases 10–25 untested scenarios with regression fixes

---

## Phase Details

### Phase 27: Code Quality & Exports
**Goal**: The Memberships and Expenses tabs expose a one-click JSON download, and two deferred code-quality defects in the expense mapper are corrected
**Depends on**: Phase 26 (shipped)
**Requirements**: CQ-01, CQ-02, EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):
  1. Entering Feb 31 or Apr 31 in the expense date field shows a validation error and blocks save
  2. When editing an expense with no notes, the PATCH payload sent to PocketBase does not contain a `notes` key (verified by mapper unit test using `not.toHaveProperty`)
  3. User can click a Download JSON button on the Memberships tab and receive a valid JSON file containing all their membership card records
  4. User can click a Download JSON button on the Expenses tab and receive a valid JSON file containing all their expense records
  5. Both export downloads work in dark mode and on mobile viewport
**Plans**: 3 plans
Plans:
- [ ] 27-01-PLAN.md — Verify CQ-01 & CQ-02 via test suite run; mark complete in REQUIREMENTS.md
- [ ] 27-02-PLAN.md — Add memberships JSON export (MembershipsTab.vue)
- [ ] 27-03-PLAN.md — Add expenses JSON export (ExpensesTab.vue)
**UI hint**: yes

### Phase 28: Budget Tracking
**Goal**: Users can set monthly and yearly budget targets per expense category and see actual-vs-budget comparisons in the Reports tab
**Depends on**: Phase 27
**Requirements**: RPT-01, RPT-02
**Success Criteria** (what must be TRUE):
  1. User can open a budget management UI and set a monthly budget target for any expense category
  2. User can set a yearly budget target per category as an alternative to monthly
  3. Budget targets are stored in PocketBase and survive page refresh (per-user isolation — one user cannot see another's budgets)
  4. The Reports tab shows each category's actual spend alongside its budget target with a visual over/under indicator
  5. A category with no budget set is shown without a budget bar (no placeholder clutter)
**Plans**: TBD
**UI hint**: yes

### Phase 29: Period Comparison
**Goal**: Users can see how their spending this period compares to the previous equivalent period, without leaving the Reports tab
**Depends on**: Phase 28
**Requirements**: RPT-03
**Success Criteria** (what must be TRUE):
  1. When viewing This Month, a comparison section shows last month's total and the delta (amount + percentage)
  2. When viewing This Quarter, a comparison section shows last quarter's total and the delta
  3. The comparison is calculated client-side from the already-loaded expenses array (no new PocketBase queries)
  4. A positive delta (spending more) and negative delta (spending less) are visually distinguished
**Plans**: TBD
**UI hint**: yes

### Phase 30: UAT Sweep
**Goal**: Every deferred UAT scenario from phases 10–25 has been executed and any regressions discovered are fixed
**Depends on**: Phase 29
**Requirements**: QA-01
**Success Criteria** (what must be TRUE):
  1. UAT scenarios for Phase 10 (2 pending), Phase 11 (1 pending), and Phase 12 (6 pending) are executed and marked pass or fail
  2. UAT scenarios for Phases 18, 20, 21, and 22 (unknown status) are executed and marked pass or fail
  3. UAT scenarios for Phase 25 (7 pending) are executed and marked pass or fail
  4. Any scenario that fails results in a regression fix committed before the phase is marked complete
  5. All 49+ existing Vitest tests remain green after any regression fixes
**Plans**: TBD

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
| 27. Code Quality & Exports | v4.1 | 0/3 | Not started | — |
| 28. Budget Tracking | v4.1 | 0/? | Not started | — |
| 29. Period Comparison | v4.1 | 0/? | Not started | — |
| 30. UAT Sweep | v4.1 | 0/? | Not started | — |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-22 — Phase 27 planned: 3 plans across 2 waves (CQ-01/CQ-02 verification + memberships export + expenses export).*
