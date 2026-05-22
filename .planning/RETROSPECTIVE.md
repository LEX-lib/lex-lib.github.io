# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v4.0 — Daily Expense Tracker

**Shipped:** 2026-05-22
**Phases:** 4 (23–26) | **Plans:** 9 | **Timeline:** 2 days

### What Was Built
- wallecx_expenses + wallecx_expense_categories PocketBase collections with per-user isolation, Zod schema, expenseMapper, and 9 Vitest tests
- ManageExpense.vue CRUD dialog (Zod safeParse, isSaving guard, EXIF-stripped receipt upload, Dialog/Drawer mobile split, custom category seeding)
- Sortable/filterable/searchable expense list (5 sort modes, category multi-select, date-range, instant search) with receipt preview via AttachmentPreview
- ExpensesReportsView.vue: period selector (Month/Quarter/Year/Custom), Grand Total hero, horizontal bar chart with dark-mode reactivity and prefers-reduced-motion support
- Parent-shell + child-view SFC split pattern (ExpensesTab -> ExpensesListView + ExpensesReportsView) established

### What Worked
- TDD on pure helpers: Writing period.test.ts before period.ts caught the dayjs Q-format issue empirically before it could silently produce wrong quarter labels in production
- Phased plan waves: Phase 26 split into 3 plans (foundation -> shell refactor -> reports view) let each plan stay focused and atomic
- useChartTheme MutationObserver design: Observing document.documentElement for .my-app-dark proved correct first try; dark-mode toggle auto-re-renders chart
- SFC extraction pattern: Extracting ExpensesListView.vue in Plan 26-02 before Plan 26-03 added the Reports view made the final wiring trivially simple
- WR code review fixes in same phase: expenseMapper WR-01/WR-02/WR-03 addressed in Phase 24, not deferred; prevented compound bugs in later phases

### What Was Inefficient
- REQUIREMENTS.md traceability not updated post-phase: EXP-04/05/06 and EXP-11/12/13 remained Pending after their phases shipped; required manual correction at archive time
- dayjs Q-format assumption: RESEARCH.md assumed format([Q]Q YYYY) would work; empirical Node REPL check caught this but it required a mid-plan correction
- 39 deferred artifacts: UAT and verification gaps accumulated from prior milestones; signal that verification should happen sooner per phase

### Patterns Established
- Parent-shell + child-view SFC split: ExpensesTab as data-owning shell; ExpensesListView + ExpensesReportsView as sibling views. Reuse for future Wallecx tabs.
- Chart palette via CSS custom properties: 8 tokens (--color-chart-1..8) declared in both light and dark blocks; useChartTheme reads via getComputedStyle on MutationObserver trigger
- Period state in sessionStorage as YYYY-MM-DD strings: Not Date objects; timezone-stable; rehydrated via dayjs parse on mount
- Invalid range as soft state: role=alert inline message, not a toast/dialog; period selector stays interactive
- 4-state v-if chain discipline: loading -> invalid -> empty -> data; order matters; both sibling views follow this exactly

### Key Lessons
1. Validate plugin token coverage before planning: Query the actual runtime to confirm a library API matches its documentation. dayjs.format(Q) vs .quarter() are documented differently.
2. Keep traceability tables in sync during phase transitions: A stale REQUIREMENTS.md at milestone close adds cleanup work
3. Phased SFC extraction pays dividends immediately: Extracting sibling views as a dedicated plan step makes subsequent plans trivially focused
4. MutationObserver on html not body for this project: .my-app-dark lives on document.documentElement

### Cost Observations
- Model mix: ~100% Sonnet 4.6
- Sessions: 2-3 sessions (split by Windows restart mid-Phase 26)
- Notable: 78 commits in 2 days; type-check + 49 tests green throughout; no rework commits needed

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP | 5 | 17 | Initial pattern established (mapper + Vitest + Zod) |
| v2.0 Membership Cards | 4 | 12 | Tabs shell pattern; BarcodeDisplay try/catch |
| v2.1 Mobile PWA | 2 | 8 | PWA architectural invariants locked (prompt-only SW) |
| v3.0 Site-Wide Dark Mode | 4 | 7 | Site-wide theme; useTheme composable; FOUC prevention |
| v4.0 Daily Expense Tracker | 4 | 9 | Parent-shell + child-view SFC split; chart infrastructure; TDD on helpers |

### Cumulative Quality

| Milestone | Tests | New Tests | Notable |
|-----------|-------|-----------|---------|
| v1.0 | 13 | 13 | First mapper + guard tests |
| v2.0 | 24 | 11 | membershipMapper.spec.ts |
| v4.0 | 49 | 25 | expenseMapper.spec.ts (9) + period.test.ts (16) |

### Top Lessons (Verified Across Milestones)

1. Server-side collection rules are the real auth boundary: All five PocketBase rules must enforce @request.auth.id ownership. Validated in v1.0, v2.0, v4.0.
2. Direct v-model refs over @primevue/forms for PrimeVue ColorPicker: Issue #8135 means the controlled system ignores initial value. Established v2.0, followed v4.0.
3. requestKey must be distinct per collection: PocketBase auto-cancels identical requestKeys. Three locked keys: vaccinations-getFullList, memberships-getFullList, expenses-getFullList.
4. Phase extraction pays dividends: Extracting VaccinationsTab (v2.0), then ExpensesListView (v4.0) as dedicated plan steps keeps subsequent plans focused.
