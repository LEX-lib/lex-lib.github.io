# Phase 27: Code Quality & Exports — Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 27 delivers: (1) confirm that deferred code-quality fixes CQ-01 and CQ-02 are working correctly by running the test suite, and (2) add a one-click JSON download button to both the Memberships tab and the Expenses tab, following the established vaccination export pattern from v1.0.

**This phase does NOT add new backend collections, new UI routes, or new Pinia stores.**

</domain>

<decisions>
## Implementation Decisions

### CQ-01 & CQ-02 Status
- **D-01:** Both fixes are **already implemented** in the live codebase:
  - CQ-01 (`expense_date` dayjs `.refine()` calendar validation) — live in `src/lib/wallecx/expenseSchema.ts:21`
  - CQ-02 (conditional notes spread + `not.toHaveProperty` assertion) — live in `src/lib/pocketbase/expenseMapper.ts:28` and `src/lib/pocketbase/__tests__/expenseMapper.spec.ts:62`
- **D-02:** Plans must include a **verification step**: run `npm run test:unit`, confirm all 9 expenseMapper tests and the expense schema validation tests pass. Mark CQ-01 and CQ-02 as verified in REQUIREMENTS.md. **No re-implementation needed.**

### Export Payload Shape — Memberships
- **D-03:** Include a `card_image_url` field: `r.card_image ? pb.files.getURL(r, r.card_image) : null`
  - Mirrors the vaccination `card_url` field exactly
  - URL is static (no token); requires PocketBase auth to access but serves as a complete backup reference
- **D-04:** Include all writable domain fields: `id`, `card_name`, `issuer`, `card_number`, `card_color`, `expiry_date`, `notes`, `card_image_url`, `created`, `updated`
- **D-05:** Export uses a fresh `getFullList` call — ALL user records, regardless of active search/sort filters

### Export Payload Shape — Expenses
- **D-06:** Include a `receipt_url` field: `r.receipt ? pb.files.getURL(r, r.receipt) : null`
  - Receipt field is `protected=true` — URL alone won't work without a token, but included for completeness/backup value
- **D-07:** Include all writable domain fields: `id`, `amount`, `expense_date`, `category`, `description`, `notes`, `receipt_url`, `created`, `updated`
- **D-08:** Export uses a fresh `getFullList` call — ALL user records, regardless of active filters (date range, category, search)

### Export Button Placement
- **D-09:** Both Memberships and Expenses tabs: place the "Download records" button in the **main tab header row** (the existing `flex items-center justify-between` row), alongside the "Add card" / "Add Expense" button
  - Mirrors VaccinationsTab exactly — always visible, not gated behind a sub-tab
  - ExpensesTab has List/Reports sub-tabs, but the download button lives above them in the shell header — consistent with the established pattern

### Export Implementation Pattern (from VaccinationsTab)
- **D-10:** `isExporting` ref guard (POLISH-03 pattern) — prevent double-click
- **D-11:** Check `pb.authStore.record?.id` null guard before proceeding
- **D-12:** `getFullList` with appropriate `sort` parameter (`-created` for memberships, `-expense_date,-created` for expenses)
- **D-13:** Wrap in `exported_at` + `record_count` + `records[]` envelope (same structure as vaccination export)
- **D-14:** Blob → `URL.createObjectURL` → anchor → click → `URL.revokeObjectURL` cleanup
- **D-15:** Download filenames: `wallecx-memberships-{YYYY-MM-DD}.json` and `wallecx-expenses-{YYYY-MM-DD}.json`
- **D-16:** Toast on success (`"Membership cards exported."` / `"Expenses exported."`); toast on error (`"Export failed. Please try again."`)
- **D-17:** Button label: `"Download records"`, icon: `"pi pi-download"`, severity: `"secondary"`, size: `"small"` (matches VaccinationsTab button exactly)

### Claude's Discretion
- Exact field ordering in the JSON payload envelope (within the decisions above, Claude can choose logical grouping)
- Whether to add a `requestKey` to the export `getFullList` call (acceptable either way; export is a one-off user action, not a reactive subscription)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Export Pattern Reference
- `src/components/projects/wallecx/VaccinationsTab.vue` — Lines 210–260: the canonical `exportJson()` implementation to mirror for memberships and expenses

### Code Quality Fix Reference
- `src/lib/wallecx/expenseSchema.ts` — Line 21: CQ-01 fix already live (dayjs `.refine()` calendar validation)
- `src/lib/pocketbase/expenseMapper.ts` — Lines 16–30: CQ-02 fix already live (conditional notes spread)
- `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` — Lines 59–63: CQ-02 test assertion already correct (`not.toHaveProperty`)

### Membership Types
- `src/types/wallecx/memberships/types.d.ts` — Memberships interface (fields available for export)

### Expense Types
- `src/types/wallecx/expenses/types.d.ts` — Expenses interface (fields available for export)

### Tab Files to Modify
- `src/components/projects/wallecx/MembershipsTab.vue` — Add `exportJson` function + "Download records" button in header row
- `src/components/projects/wallecx/ExpensesTab.vue` — Add `exportJson` function + "Download records" button in header row

### Project Constraints
- `.planning/PROJECT.md` §Constraints — Tech stack locked; no new packages needed for export

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VaccinationsTab.vue:exportJson()` — Complete reference implementation (auth guard, isExporting, getFullList, envelope, Blob/anchor, revokeObjectURL, toast)
- `toast` from `vue-sonner` — already imported in both MembershipsTab.vue and ExpensesTab.vue
- `pb` from `@/lib/pocketbase` — already imported in both tabs
- `dayjs` — already imported in VaccinationsTab; needs import added to MembershipsTab and ExpensesTab for the filename date stamp
- `isExporting` ref pattern — POLISH-03, established in VaccinationsTab

### Established Patterns
- Export button placement: header row `flex items-center justify-between mb-4` → wrap both buttons in a `flex gap-2` div
- `getFullList` with `requestKey` for memberships: `'memberships-getFullList'` (already in use for the read path — export should use a **different** requestKey such as `'memberships-export'` to avoid cancelling the tab's live data subscription)
- Similarly for expenses: `'expenses-export'` rather than `'expenses-getFullList'`

### Integration Points
- MembershipsTab.vue `<template>` line 172: existing header `<div class="flex items-center justify-between mb-4">` — needs to wrap "Add card" + new "Download records" in a `<div class="flex gap-2">`
- ExpensesTab.vue `<template>` line 103: existing header `<div class="flex items-center justify-between mb-4">` — same pattern

</code_context>

<specifics>
## Specific Ideas

- Export filenames should follow the established `wallecx-{type}-YYYY-MM-DD.json` convention (already in use for vaccinations)
- The "Download records" button should be **disabled + loading** while `isExporting` is true (same props as VaccinationsTab)
- No changes needed to `WallecxToolbar.vue` — exports live in the tab shell, not the toolbar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 27-code-quality-exports*
*Context gathered: 2026-05-22*
