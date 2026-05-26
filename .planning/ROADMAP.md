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
- ✅ **v4.1 Gap Resolution & Feature Completeness** — Phases 27–30 (shipped 2026-05-25) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v4.2 Budget Recovery & Hardening** — Phases 31–32 (shipped 2026-05-26)

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

<details>
<summary>✅ v4.1 Gap Resolution & Feature Completeness (Phases 27–30) — SHIPPED 2026-05-25</summary>

- [x] Phase 27: Code Quality & Exports (3/3 plans) — completed 2026-05-22
- [x] Phase 28: Budget Tracking (3/3 plans) — completed 2026-05-25
- [x] Phase 29: Period Comparison (1/1 plan) — completed 2026-05-25
- [x] Phase 30: UAT Sweep (8/8 plans) — completed 2026-05-25

**Milestone goal:** Close v4.0 deferred code-quality items, ship budget tracking + period comparison features, and run a structured UAT sweep over deferred scenarios from phases 10–25 to clear UAT debt before v4.1 ships.

**Sweep result:** Phase 30 walked 82 in-scope scenarios — 80 passed, 1 deferred (PWA standalone install), 0 failed. BR-2 barcode invariant verified twice. Regression floor (49/49 Vitest tests) intact throughout.

Full details: [milestones/v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)

</details>

---

### v4.2 Budget Recovery & Hardening (Phases 31–32) — SHIPPED 2026-05-26

- [x] **Phase 31: Re-create wallecx_expense_budgets PocketBase collection** — Manual Admin UI step per Phase 28-01 spec + code-side smoke read verification (BUG-01) — 2026-05-26
- [x] **Phase 32: Decouple budgets fetch in ExpensesTab.vue** — Independent try/catches with accurate toast copy; graceful degradation when budgets fail (BUG-02) — 2026-05-26

---

## Phase Details

### Phase 31: Re-create wallecx_expense_budgets PocketBase Collection
**Goal**: The `wallecx_expense_budgets` PocketBase collection exists in production with the locked Phase 28-01 schema, and the running Wallecx app can successfully `getList` from it.
**Depends on**: Phase 28-01 spec (collection schema reference)
**Requirements**: BUG-01
**Success Criteria** (what must be TRUE):
  1. PocketBase Admin UI shows a collection named exactly `wallecx_expense_budgets` (lowercase, underscores)
  2. The collection has 4 fields with correct types and constraints: `user` (Relation → users, required, max 1, cascade=false), `category` (Text required, min 1, max 200), `budget_type` (Text required, pattern `^(monthly|yearly)$`), `amount` (Number required, min 0)
  3. The collection has all 5 API rules: listRule/viewRule/updateRule/deleteRule = `user = @request.auth.id`; createRule = `@request.auth.id != "" && @request.body.user = @request.auth.id` (v0.29.3 `@request.body.user` syntax)
  4. Running `pb.collection('wallecx_expense_budgets').getList({ page: 1, perPage: 1 })` from the live Wallecx app (browser console or via the existing `loadBudgets` helper) returns 200 OK with an empty `items` array (NOT a `404 Missing collection context`)
  5. After Phase 31 ships, refreshing the Expenses tab no longer shows any error toast on mount (assumes Phase 32 has not yet shipped; otherwise the toast was already suppressed)
**Plans**: TBD (single human-action checkpoint plan likely)
**UI hint**: no (pure PocketBase config)

### Phase 32: Decouple Budgets Fetch in ExpensesTab.vue
**Goal**: `ExpensesTab.vue` onMounted loads expenses and budgets via independent try/catches, so a missing/failing budgets fetch does NOT fail or mislead the expenses fetch UX, and toast copy accurately identifies which collection failed.
**Depends on**: Phase 31 (so that the success case can also be verified)
**Requirements**: BUG-02
**Success Criteria** (what must be TRUE):
  1. With both collections healthy: `npm run dev` → Expenses tab loads without any toast and shows both List + Reports sub-tabs working
  2. With `wallecx_expense_budgets` collection missing (temporary test): expenses STILL load successfully; no expenses-related error toast; a single toast `'Failed to load budgets.'` fires (not `'Failed to load expenses...'`); Reports sub-tab opens without error and Budget vs Actual section is absent (auto-hidden because `budgets.value` stays as `[]`)
  3. The Reports sub-tab's period-over-period comparison line (Phase 29) still renders normally regardless of budgets fetch outcome
  4. Console error log message identifies the budgets failure distinctly (e.g., `console.error('ExpensesTab: loadBudgets failed', e)` separate from the existing `'ExpensesTab: getFullList failed'`)
  5. `npm run type-check`, `npm run lint` (no NEW errors beyond pre-existing VaccinationDetail.vue:5), and `npm run test:unit` (49/49) all pass
**Plans**: 1 plan
  - [ ] 32-01-PLAN.md — Refactor loadBudgets with context param and split onMounted into independent try/catches
**UI hint**: no (no visible UI changes beyond toast copy correction)

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
| 27. Code Quality & Exports | v4.1 | 3/3 | Complete (UAT approved) | 2026-05-22 |
| 28. Budget Tracking | v4.1 | 3/3 | Complete (UAT deferred) | 2026-05-25 |
| 29. Period Comparison | v4.1 | 1/1 | Complete (UAT deferred) | 2026-05-25 |
| 30. UAT Sweep | v4.1 | 8/8 | Complete (80/82 passed, 1 deferred) | 2026-05-25 |
| 31. Re-create wallecx_expense_budgets collection | v4.2 | 1/1 | Complete | 2026-05-26 |
| 32. Decouple budgets fetch in ExpensesTab.vue | v4.2 | 1/1 | Complete | 2026-05-26 |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-25 — v4.2 Budget Recovery & Hardening started. Phases 31–32 scoped; 2 BUG requirements. Surgical milestone targeting a production runtime error discovered after v4.1 ship.*
