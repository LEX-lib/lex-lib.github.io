# Lexarium Requirements — v4.2 Budget Recovery & Hardening

**Milestone goal:** Eliminate the `404 Missing collection context` runtime error on the Expenses → Reports tab by ensuring the `wallecx_expense_budgets` PocketBase collection exists in production, and harden `ExpensesTab.vue` so a missing budgets collection no longer fires misleading toast copy or blocks expenses from loading.

**Context:** Discovered after v4.1 ship — Phase 28-01 Task 1 was a trust-based human-action checkpoint that never landed the collection in the production PocketBase instance. Surgical milestone; 2 phases.

## v1 Requirements

### Bug Recovery

- [ ] **BUG-01**: `wallecx_expense_budgets` PocketBase collection exists in production with the locked Phase 28-01 schema (4 fields: user/category/budget_type/amount) and 5 per-user rules (createRule uses v0.29.3 `@request.body.user` syntax). A code-side smoke read (`pb.collection('wallecx_expense_budgets').getList({ page: 1, perPage: 1 })`) returns 200 OK and an empty `items` array from the running app (not just the Admin UI).

- [ ] **BUG-02**: `ExpensesTab.vue` onMounted handles a missing or 404-returning `wallecx_expense_budgets` collection gracefully — expenses still load successfully even when the budgets fetch fails, the user sees an accurate toast (`'Failed to load budgets.'`) distinct from the expenses-load failure copy (`'Failed to load expenses. Pull to refresh or reload the page.'`), and the Reports tab degrades by silently rendering without the Budget vs Actual section. No misleading toast text. No console error on otherwise-healthy expense loads.

## Future Requirements (deferred to v4.3+)

These were considered for v4.2 but deferred per user scoping decision:

- **HEALTH-01** — Code-level collection health check on app boot or Reports tab mount: probe `wallecx_expense_budgets` reachability and surface an inline warning (with PB Admin UI setup steps) if missing. Prevents the same regression from re-occurring silently.
- **UAT-28-CLOSE** — Walk through Phase 28's 9 deferred UAT scenarios in `28-HUMAN-UAT.md` once the collection is healthy.
- **UAT-29-CLOSE** — Walk through Phase 29's 7 deferred UAT scenarios in `29-HUMAN-UAT.md` (period comparison validation).

## Out of Scope

| Item | Reason |
|------|--------|
| Schema-as-code / PocketBase migrations | PB instance has no migrations file in this repo; admin UI is the source of truth. Adopting migrations is its own larger initiative. |
| Auto-create missing collection from the client | Client-side cannot create collections; Admin API is admin-only. The fix is a one-time manual recreation, not a runtime auto-heal. |
| Decoupled fetches for vaccinations / memberships | Out of scope — those collections exist and load fine. Only the budgets fetch needs decoupling because it's the one that empirically fails. |
| Code-level collection health check | Deferred to v4.3 as HEALTH-01. The surgical fix in BUG-01 + BUG-02 unblocks the error; HEALTH-01 prevents the silent-regression failure mode in future. |
| Phase 28 + 29 UAT walkthrough | Deferred to v4.3 as UAT-28-CLOSE + UAT-29-CLOSE. The user explicitly scoped v4.2 surgical. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 31 | Pending |
| BUG-02 | Phase 32 | Pending |

**Coverage:**
- v4.2 requirements: 2 total
- v4.2 requirements mapped to phases: 2 (100%)
