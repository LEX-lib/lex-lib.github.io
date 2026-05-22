# Requirements: Lexarium — Wallecx v4.1

**Defined:** 2026-05-22
**Core Value:** Each authenticated user can save, retrieve, and display their own vaccination records, membership/loyalty cards, and daily expenses — without ever losing access to them.

## v4.1 Requirements

### Code Quality

- [x] **CQ-01**: Expense date field rejects invalid calendar dates (e.g. Feb 31, Apr 31) with a clear validation error
- [x] **CQ-02**: `mapToUpdateExpense` omits the `notes` key entirely when notes is undefined; mapper test asserts `not.toHaveProperty('notes')`

### Data Export

- [x] **EXPORT-01**: User can download all membership card records as a single JSON file from the Memberships tab
- [x] **EXPORT-02**: User can download all expense records as a single JSON file from the Expenses tab

### Expense Reports

- [ ] **RPT-01**: User can set a monthly or yearly budget target per expense category (stored in PocketBase, per-user isolation)
- [ ] **RPT-02**: User can view actual-vs-budget reporting for each category in the Reports tab (budget bar + actual + over/under indicator)
- [ ] **RPT-03**: User can view a period-over-period comparison in the Reports tab (this month vs last month, this quarter vs last quarter, with delta)

### Quality Assurance

- [ ] **QA-01**: UAT scenarios from phases 10–25 with unknown or partial status are executed; regressions found are fixed

## Future Requirements

### Advanced Export

- **EXPORT-03**: Bulk export across all record types (vaccinations + memberships + expenses) in a single archive
- **EXP-ADV-02**: Recurring expenses (mark as recurring; auto-create future entries)
- **EXP-ADV-03**: Multi-currency support (currency field + FX conversion at report time)

### Advanced Reporting

- **EXP-ADV-05**: Expense breakdown by tag or custom label (beyond category)
- **EXP-ADV-06**: Projected spend based on recurring pattern

## Out of Scope

| Feature | Reason |
|---------|--------|
| Budget alerts / push notifications | Requires notification infrastructure not yet in scope |
| Shared budgets / household tracking | Per-user privacy is the default; sharing is out of scope |
| CSV export format | JSON export covers the use case; CSV adds formatting complexity |
| OCR receipt scanning | Manual entry acceptable; ZXing/OCR build cost is high |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CQ-01 | Phase 27 | Complete (verified 2026-05-22) |
| CQ-02 | Phase 27 | Complete (verified 2026-05-22) |
| EXPORT-01 | Phase 27 | Complete (verified 2026-05-22) |
| EXPORT-02 | Phase 27 | Complete (verified 2026-05-22) |
| RPT-01 | Phase 28 | Pending |
| RPT-02 | Phase 28 | Pending |
| RPT-03 | Phase 29 | Pending |
| QA-01 | Phase 30 | Pending |

**Coverage:**
- v4.1 requirements: 8 total
- Mapped to phases: 8 (100%)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 — traceability updated after v4.1 roadmap creation (phases 27–30)*
