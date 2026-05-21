# Requirements: Lexarium v4.0 Daily Expense Tracker

**Defined:** 2026-05-19
**Core Value:** Authenticated users can log daily expenses, review period totals (monthly / quarterly / yearly / custom), and see per-category spending breakdowns — joining vaccinations and membership cards as the third record type in Wallecx.

## v4.0 Requirements

### Backend & Type Foundation

- [x] **EXP-01**: `wallecx_expenses` PocketBase collection with fields: `id` (auto), `user` (relation to users), `amount` (number, decimal, > 0), `expense_date` (date, required), `category` (text, references a name from `wallecx_expense_categories`), `description` (text, short, required), `notes` (text, longer, optional), `receipt` (file, single image, optional). 5 per-user access rules (list, view, create, update, delete) enforcing `@request.auth.id = user.id` server-side. — Validated Phase 23
- [x] **EXP-02**: `wallecx_expense_categories` PocketBase collection with fields: `id`, `user` (relation), `name` (text, required, unique within user via compound index). DEFAULT_EXPENSE_CATEGORIES constant defined (Food, Transport, Bills, Health, Shopping, Entertainment, Other); lazy per-user seeding is Phase 24. 5 per-user rules. — Validated Phase 23
- [x] **EXP-03**: TypeScript types in `src/types/wallecx/expenses/types.d.ts` (extending PocketBase `RecordModel`); Zod schema for write-path validation; `expenseMapper.ts` matching the existing `vaccinationMapper`/`membershipMapper` pattern (strip read-only fields on write, id-refresh contract). 9 Vitest tests pass. — Validated Phase 23

### Write Path — Tab Shell + CRUD

- [ ] **EXP-04**: `WallecxApp.vue` updated to render a third tab "Expenses" after the existing Memberships tab. Tab order: Vaccinations / Memberships / Expenses.
- [ ] **EXP-05**: `ExpensesTab.vue` and `ManageExpense.vue` CRUD dialog. Manage dialog matches the existing Wallecx pattern: Zod `safeParse`, `isSaving` guard preventing double-submit, server-first delete via `useConfirm`, EXIF-stripped receipt photo upload, conditional file field, direct `v-model` refs (no `@primevue/forms` due to PrimeVue ColorPicker #8135 lessons).
- [ ] **EXP-06**: User can add a custom category from within the manage flow (e.g., inline "Add new category…" option in the category picker). New category is persisted to `wallecx_expense_categories` for that user only.

### Read Path — List View

- [ ] **EXP-07**: `ExpensesTab.vue` list view shows all of the authenticated user's expenses, sortable by date (newest/oldest), category (A–Z), and amount (high/low). Sort mode persists in sessionStorage under `wallecx:expense-sort` (mirrors view-toggle session pattern from Phase 8).
- [ ] **EXP-08**: Filter by category (multi-select chip pill or dropdown) and by date range (start + end). Filters are client-side computed; no new PocketBase queries.
- [ ] **EXP-09**: Client-side search by description text (mirrors `WallecxToolbar` search pattern — debounced input filtering the already-loaded expenses list).
- [ ] **EXP-10**: Receipt photo preview when available via the existing `AttachmentPreview` component (image/PDF/download branching with short-lived view-time tokens — BR-1 from STATE.md).

### Reporting View

- [ ] **EXP-11**: Period-tabbed reporting view inside `ExpensesTab.vue` (or as a sub-component / second sub-tab — TBD in discuss-phase). Period tabs: This Month / This Quarter / This Year / Custom range (with start/end date pickers).
- [ ] **EXP-12**: Each period view shows the grand total spend for that period.
- [ ] **EXP-13**: Each period view shows a per-category breakdown chart (bar or pie — TBD) using PrimeVue Chart (Chart.js wrapper) — installed if not already present.

---

## Deferred to v4.x

- **EXP-ADV-01**: Budget tracking — set monthly/yearly budget per category; reporting shows actual vs budget; visual indicator when approaching/exceeding limit
- **EXP-ADV-02**: Recurring expenses — mark an expense as recurring (monthly/weekly); auto-create future entries on a schedule
- **EXP-ADV-03**: Multi-currency support — currency field per expense; FX conversion at report time
- **EXP-ADV-04**: Period-over-period comparison — this month vs last; quarter-over-quarter delta indicators
- **EXP-ADV-05**: Tags + merchant/place fields (from "Comprehensive" option dropped in scoping discussion)
- **EXP-ADV-06**: Receipt OCR — auto-extract amount/date/merchant from photo
- **EXP-ADV-07**: Expense JSON export (groups with **CONV-01** vaccination/membership exports — could batch all three in one phase)

## Carried over from prior milestones

- **CONV-01**: JSON export of all membership card records (mirrors vaccination export)
- **CONV-03**: Expiry date reminders (requires notification infrastructure)
- **SCAN-ADV-01**: PDF417 and Aztec barcode formats via dynamic `bwip-js` import
- **PWA-ADV-01..03**: Offline data access, background sync, swipe-to-dismiss gestures
- **THEME-ADV-01..04**: PocketBase theme sync, animated transitions, sepia/high-contrast variants, native `color-scheme` declarations
- **LexTrack DatePicker/TabView contrast** and **API Playground sign-off** — Phase 21 visual spot-checks deferred

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bank/wallet integration / auto-import | Per-issuer OAuth or screen-scraping; excessive complexity |
| Multi-currency / FX conversion | Single-currency assumed for v4.0; deferred as EXP-ADV-03 |
| Budget tracking | Deferred to v4.x as EXP-ADV-01 (keeps v4.0 bounded) |
| Recurring/subscription auto-entry | Deferred as EXP-ADV-02 |
| Receipt OCR / auto-fill | Deferred as EXP-ADV-06 |
| Period-over-period comparison | Deferred as EXP-ADV-04 |
| Shared/group expenses (split with others) | Out of scope; per-user privacy is the default |
| Investment / asset tracking | Different domain; out of Wallecx scope |
| Calendar view | List + chart is enough; calendar can be a future polish |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXP-01 | Phase 23 | Complete (2026-05-21) |
| EXP-02 | Phase 23 | Complete (2026-05-21) |
| EXP-03 | Phase 23 | Complete (2026-05-21) |
| EXP-04 | Phase 24 | Pending |
| EXP-05 | Phase 24 | Pending |
| EXP-06 | Phase 24 | Pending |
| EXP-07 | Phase 25 | Pending |
| EXP-08 | Phase 25 | Pending |
| EXP-09 | Phase 25 | Pending |
| EXP-10 | Phase 25 | Pending |
| EXP-11 | Phase 26 | Pending |
| EXP-12 | Phase 26 | Pending |
| EXP-13 | Phase 26 | Pending |

**Coverage:**
- v4.0 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---

*Requirements defined: 2026-05-19*
*Traceability: Phases 23–26, 13/13 requirements mapped*
