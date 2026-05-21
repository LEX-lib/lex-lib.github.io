---
phase: 25-read-path-list-view
discussion_date: 2026-05-21
status: complete
areas_discussed: 4
decisions_locked: 18
---

# Phase 25 Discussion Log

## Areas Selected for Discussion

1. Expense row design (layout + actions)
2. Filter UI placement (existing vs new component)
3. Date range filter UX (picker style)
4. Receipt preview access (tap flow)

---

## Discussion Outcomes

### Expense Row Design

**Question:** Compact list row vs card vs DataTable?
**Decision:** Compact list row → new `ExpenseItem.vue` component (D-01)

**Question:** Row actions — inline icon buttons vs swipe vs overflow menu?
**Decision:** Inline pencil + trash icon buttons on right side, 44px touch targets (D-02)

### Filter UI Placement

**Question:** Extend `WallecxToolbar.vue` vs new `ExpensesToolbar.vue`?
**Decision:** New `ExpensesToolbar.vue` — does NOT modify existing toolbar, protecting Vaccinations/Memberships tabs (D-05)

**Sub-decisions locked:**
- v-model bindings: search-query, sort-mode, selected-categories (string[]), date-from (Date|null), date-to (Date|null) (D-06)
- Category filter: PrimeVue MultiSelect, options derived client-side from loaded expenses (D-07)
- Search: 300ms debounce via useDebounce from @vueuse/core (D-09)

### Date Range Filter UX

**Question:** Two always-visible DatePicker inputs vs single RangePicker vs quick presets?
**Decision:** Two PrimeVue DatePicker inputs always visible — From and To (D-08). Quick presets deferred.

### Receipt Preview Access

**Question:** Tap row → detail panel → receipt? OR tap paperclip icon → direct AttachmentPreview?
**Decision:** Tap receipt icon on row → direct AttachmentPreview (D-13, D-14, D-15)

**Pattern confirmed:** Same as MembershipsTab WR-03 — fetch `pb.files.getToken()` before opening preview; token failure shows toast and does NOT open preview.

---

## All Locked Decisions

| ID | Decision |
|----|----------|
| D-01 | Compact list row → new ExpenseItem.vue |
| D-02 | Inline pencil + trash icon buttons (44px touch targets) |
| D-03 | sessionStorage key `wallecx:expense-sort`, default `newest-first` |
| D-04 | Sort options: newest-first, oldest-first, category-asc, amount-high, amount-low |
| D-05 | New ExpensesToolbar.vue — WallecxToolbar.vue unchanged |
| D-06 | v-model: search-query, sort-mode, selected-categories, date-from, date-to |
| D-07 | Category filter: MultiSelect, options from loaded expenses (client-side) |
| D-08 | Date range: two DatePicker inputs always visible |
| D-09 | Search: 300ms debounce via useDebounce |
| D-10 | filteredSortedExpenses computed: search → category → date range → sort |
| D-11 | dayjs for date comparison; expense_date is YYYY-MM-DD string; >= from, <= to |
| D-12 | Filter-empty state: "No expenses match your filters." + "Clear filters" button |
| D-13 | receipt field non-empty → show mdi:paperclip icon on row |
| D-14 | Receipt icon tap → openReceiptPreview → pb.files.getToken() → AttachmentPreview |
| D-15 | showPreview + previewRecord + previewToken refs in ExpensesTab |
| D-16 | onMounted: getFullList({ sort: '-expense_date,-created', requestKey: 'expenses-getFullList' }) |
| D-17 | Loading: 3 skeleton rows matching ExpenseItem row height |
| D-18 | Dark mode: scoped CSS .my-app-dark variable overrides |

---

## Deferred Items

- Quick-preset date filters (Today / This week / This month)
- Running total at bottom of filtered list
- Period-tabbed reporting view (Phase 26)
- ExpenseDetail panel

---

*Discussed: 2026-05-21*
