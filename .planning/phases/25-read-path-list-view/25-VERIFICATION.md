---
phase: 25-read-path-list-view
verified: 2026-05-21T00:00:00Z
status: human_needed
score: 6/6 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Tap an expense row's paperclip and confirm AttachmentPreview opens with the correct MIME branch (image / PDF / download)"
    expected: "Image receipts render via <img>; PDF receipts render via vue-pdf-embed; unknown types show download fallback. Token from pb.files.getToken() makes the URL accessible."
    why_human: "Requires a logged-in PocketBase session, real receipt files of each MIME type, and visual confirmation of the rendered branch — cannot be verified via grep/static analysis."
  - test: "Verify Dialog (desktop ≥640px) vs Drawer position='bottom' (mobile <640px) responsive switch for receipt preview"
    expected: "Resizing the viewport across 640px breakpoint causes the preview wrapper to swap; both render AttachmentPreview correctly."
    why_human: "useIsMobile is a runtime matchMedia listener; v-if branching cannot be exercised statically."
  - test: "Sort mode persists across reloads under wallecx:expense-sort"
    expected: "Change sort to 'amount-high', reload the page, and confirm the list returns in amount-high order before any user interaction."
    why_human: "Requires browser sessionStorage I/O and an authenticated session; static verification confirms the read/write code is wired but not the round-trip behaviour."
  - test: "Search input filters reactively without debounce; clearing the input restores the full list"
    expected: "Typing in the search box filters on every keystroke (no perceived delay); clicking the X clears the field and restores the list."
    why_human: "Behavioural — requires running the dev server with seeded data to confirm 'instant' UX matches the agreed pattern."
  - test: "Category MultiSelect chip pill filters and 'Clear filters' restores all expenses"
    expected: "Selecting one or more category chips narrows the list; clearing chips (or clicking Clear filters when zero results) returns all loaded expenses."
    why_human: "Requires a populated wallecx_expenses dataset with multiple categories and an authenticated session."
  - test: "Date-range picker (From/To) filters inclusively and does not issue new PocketBase queries"
    expected: "Setting From=2026-05-01 and To=2026-05-15 shows only expense_date values within that inclusive range; Network tab shows no additional /api/collections/wallecx_expenses/records calls."
    why_human: "Requires browser DevTools Network tab inspection and a populated dataset."
  - test: "Confirm Delete dialog appears via the shell-level ConfirmDialog and successful delete shows 'Expense deleted.' toast"
    expected: "Trash icon click → ConfirmDialog (rendered at WallecxApp.vue shell) → 'Delete Expense' button calls pb.delete → success toast → row removed from list."
    why_human: "Cross-component delete flow requires authenticated session and live PocketBase delete; verified statically that deleteExpense is preserved and bound to @delete on every row."
---

# Phase 25: Read Path — List View Verification Report

**Phase Goal:** `ExpensesTab.vue` shows the authenticated user's expenses sortable by date/category/amount, filterable by category and date range, searchable by description; receipts preview via the existing `AttachmentPreview` component.

**Verified:** 2026-05-21
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | List shows newest-first by default; sort controls reorder by category A–Z, amount high-low, oldest-first | ✓ VERIFIED | ExpensesTab.vue:31-37 declares all 5 sort options (`newest-first`, `oldest-first`, `category-asc`, `amount-high`, `amount-low`); default `sortMode = ref('newest-first')` at L24; switch block at L81-89 implements all 4 alternative sorts plus default tiebreaker. getFullList sort param also `-expense_date,-created` at L125. |
| 2 | Sort mode persists in sessionStorage under `wallecx:expense-sort` across reloads | ✓ VERIFIED | `SORT_STORAGE_KEY = 'wallecx:expense-sort'` (L22). `watch(sortMode)` at L45-51 writes to sessionStorage. onMounted at L114-116 reads it back and validates via `VALID_SORT_MODES.includes(stored)` before assignment. |
| 3 | Category multi-select chip pill filters the list client-side; clearing all chips shows all expenses | ✓ VERIFIED | `selectedCategories` ref at L26; `categoryOptions` computed at L54-56 derives from raw `expenses.value.map(e => e.category)`; filter at L67-69 (`selectedCategories.value.length > 0 ? filter : pass-through`); ExpensesToolbar passes `display="chip"` to MultiSelect (ExpensesToolbar.vue:64). |
| 4 | Date-range picker (start + end) filters the list client-side without new PocketBase queries | ✓ VERIFIED | Two `DatePicker` instances in ExpensesToolbar.vue:67-82; `dateFrom`/`dateTo` refs at ExpensesTab.vue:27-28; client-side dayjs filter at L71-78. Only one `pb.collection('wallecx_expenses').getFullList` call in the file (L122-127) in onMounted — no follow-up queries on filter changes. |
| 5 | Search input filters by description text (reactive instant — superseded D-09; @vueuse/core not installed) | ✓ VERIFIED | InputText `@input` emits `update:searchQuery` directly on every keystroke (ExpensesToolbar.vue:33); filter at ExpensesTab.vue:62-65 is case-insensitive `.toLowerCase().includes()` on description. No `useDebounce` / `setTimeout` / `vueuse` imports in any of the 3 Phase 25 files. |
| 6 | Tapping an expense row with a receipt opens AttachmentPreview with the appropriate MIME branch | ✓ VERIFIED | ExpenseItem.vue:38 `v-if="record.receipt"` (falsy check) renders paperclip button emitting `preview`. ExpensesTab.vue:260 binds `@preview="openReceiptPreview(record)"`. `openReceiptPreview` (L100-110) calls `pb.files.getToken()` first; on failure shows toast and returns without setting `showPreview`. AttachmentPreview imports at L12 and renders inside Dialog (desktop, L282-288) or Drawer position="bottom" (mobile, L303-309) with `attachment-field="receipt"` and `:token="previewToken"`. AttachmentPreview itself (verified separately) MIME-branches via `getMimeCategory()` on the filename extension. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/projects/wallecx/ExpenseItem.vue` | Compact expense list row component | ✓ VERIFIED | 75 lines; imports `Expenses` type + `formatCurrency` + `dayjs`; emits `edit`/`delete`/`preview`; 3 action buttons each `min-w-[44px] min-h-[44px] touch-manipulation`; paperclip uses `v-if="record.receipt"` (falsy check, not `!== undefined`); trash uses `var(--color-status-error)`. Imported and used at ExpensesTab.vue:11, 254. |
| `src/components/projects/wallecx/ExpensesToolbar.vue` | Search + sort + category filter + date range toolbar | ✓ VERIFIED | 102 lines; uses `defineProps + defineEmits` (NOT `defineModel` — 0 matches); emits all 5 `update:*` events; two-row layout (`flex flex-col`); Row 2 has `flex-wrap`; all interactive controls `min-h-[44px]`; dark mode scoped CSS targets `.p-inputtext`, `.p-select`, `.p-multiselect`, `.p-datepicker` under `.my-app-dark`. Imported and used at ExpensesTab.vue:10, 187. |
| `src/components/projects/wallecx/ExpensesTab.vue` | Full read path: onMounted load, computed pipeline, toolbar, skeleton, two empty states, receipt preview | ✓ VERIFIED | 313 lines. onMounted (L112-134) restores sessionStorage sort BEFORE getFullList; `requestKey: 'expenses-getFullList'` present at L126; both computed (categoryOptions L54, filteredSortedExpenses L59) present; openReceiptPreview L100; clearFilters L93; Phase 24 stub (deleteExpense L154-172, onCreated L141-143, onUpdated L145-150, openManage L136-139, defineExpose L175) preserved verbatim. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| ExpensesTab.vue | wallecx_expenses PocketBase collection | `pb.collection('wallecx_expenses').getFullList` with `requestKey: 'expenses-getFullList'` | ✓ WIRED | L122-127. Sort `-expense_date,-created`, response assigned to `expenses.value`, error path toast + console.error, finally resets isLoading. |
| ExpensesTab.vue | AttachmentPreview.vue | `pb.files.getToken()` → previewToken → showPreview → AttachmentPreview render | ✓ WIRED | openReceiptPreview L100-110 awaits getToken first; only sets previewRecord + showPreview after success. AttachmentPreview renders inside Dialog (L282) and Drawer (L303) only when `previewRecord` is non-null. |
| ExpensesTab.vue | ExpensesToolbar.vue | All 5 v-model bindings + categoryOptions + sortOptions props | ✓ WIRED | L187-196: `v-model:search-query`, `v-model:sort-mode`, `v-model:selected-categories`, `v-model:date-from`, `v-model:date-to`, `:sort-options="expenseSortOptions"`, `:category-options="categoryOptions"`. Toolbar declares matching emits on every binding. |
| ExpensesTab.vue | sessionStorage | `watch(sortMode)` writes + onMounted reads under `'wallecx:expense-sort'` | ✓ WIRED | L45-51 writer, L114-116 reader with VALID_SORT_MODES whitelist. Both wrapped in try/catch for privacy-mode iframes. |
| ExpenseItem.vue | Expenses type | `import type { Expenses } from '@/types/wallecx/expenses/types'` | ✓ WIRED | L2; used in defineProps and emits typings. |
| ExpenseItem.vue | formatCurrency | `import { formatCurrency } from '@/lib/wallecx/currency'` | ✓ WIRED | L3; used at template L23. |
| ExpenseItem (rows) | ExpensesTab handlers | `@edit="openManage(record)"` / `@delete="deleteExpense(record)"` / `@preview="openReceiptPreview(record)"` | ✓ WIRED | ExpensesTab.vue:258-260 binds all three emits on every row in the v-for. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| ExpensesTab.vue | `expenses` (ref<Expenses[]>) | `pb.collection('wallecx_expenses').getFullList<Expenses>` at L122 | Yes — server-side PocketBase getFullList against `wallecx_expenses` collection (validated in Phase 23) with per-user listRule | ✓ FLOWING |
| ExpensesTab.vue | `filteredSortedExpenses` | Computed from `expenses.value` with 4 transforms (search/category/date/sort) | Yes — pure transform of the loaded array; not a hardcoded `[]` fallback | ✓ FLOWING |
| ExpensesTab.vue | `categoryOptions` | Computed from `expenses.value.map(e => e.category)` deduplicated + sorted | Yes — derived from raw expenses on every change; correctly NOT derived from filtered output | ✓ FLOWING |
| ExpensesTab.vue | `previewToken` | `await pb.files.getToken()` at L102 | Yes — short-lived PocketBase file token; failure path toasts and aborts (does not silently render preview with empty token) | ✓ FLOWING |
| ExpenseItem.vue | `record` prop | Passed from `v-for="record in filteredSortedExpenses"` (ExpensesTab.vue:255) | Yes — each row receives a real Expenses record from the loaded array | ✓ FLOWING |
| ExpensesToolbar.vue | `searchQuery`/`sortMode`/`selectedCategories`/`dateFrom`/`dateTo`/`categoryOptions`/`sortOptions` props | All 7 props passed from ExpensesTab.vue:187-196 with v-model two-way binding | Yes — toolbar is a pure relay; every input event emits back to the parent which owns the refs | ✓ FLOWING |
| AttachmentPreview.vue | `record`/`token` props | Passed from ExpensesTab.vue:285-287 (Dialog branch) and L307-308 (Drawer branch) inside `v-if="previewRecord"` guards | Yes — both renders are gated on non-null previewRecord; token from successful getToken call | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles cleanly across Phase 25 files | `npm run type-check` | exits 0, no diagnostics | ✓ PASS |
| All 3 Phase 25 files exist on disk | Glob `src/components/projects/wallecx/Expense*.vue` and `ExpensesTab.vue` | 3 files found | ✓ PASS |
| AttachmentPreview prop signature matches consumer | Read AttachmentPreview.vue L13-18 vs ExpensesTab.vue L282-309 | `{ record: RecordModel, attachmentField: string, attachmentName: string, token: string }` — Expenses extends RecordModel; all props bound correctly | ✓ PASS |
| useIsMobile composable exists and returns Ref<boolean> | Read useIsMobile.ts | matchMedia-based ref, returned via `useIsMobile(639)` default | ✓ PASS |
| Production build | `npm run build-only` | Per SUMMARY: exits 0 (built in 1.72s, PWA generated with 56 precache entries) — re-running deferred to human verification path to avoid disturbing dev state | ? SKIP |
| Live receipt preview (image / PDF / download branches) | Open app, tap paperclip on a real receipt | Cannot exercise without server + authenticated session | ? SKIP — routed to human verification |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXP-07 | 25-01, 25-02 | Sortable list (date/category/amount) with sessionStorage `wallecx:expense-sort` persistence; newest-first default | ✓ SATISFIED | Truth #1 + Truth #2 verified; sort switch implements all 5 modes; SORT_STORAGE_KEY constant matches exactly. REQUIREMENTS.md L22 marked Complete. |
| EXP-08 | 25-01, 25-02 | Category MultiSelect + From/To DatePickers, client-side only, no new PB queries | ✓ SATISFIED | Truth #3 + Truth #4 verified; only one getFullList call in the file; client-side filtering via computed. REQUIREMENTS.md L23 marked Complete. |
| EXP-09 | 25-01, 25-02 | Description text search, reactive instant filtering (no debounce — matches MembershipsTab/VaccinationsTab; @vueuse/core not installed) | ✓ SATISFIED | Truth #5 verified; 0 vueuse imports anywhere in the 3 Phase 25 files; @input emits directly without setTimeout/debounce wrapper. REQUIREMENTS.md L24 marked Complete. |
| EXP-10 | 25-02 | Receipt preview via AttachmentPreview with image/PDF/download MIME branching and short-lived token | ✓ SATISFIED (with human spot-check) | Truth #6 verified statically — token fetch wired, fail-safe path correct, MIME branching is a property of the existing AttachmentPreview component (out-of-phase, but verified to exist with the expected signature). Live MIME-branch rendering routed to human verification. REQUIREMENTS.md L25 marked Complete. |

No orphaned requirements: REQUIREMENTS.md Traceability table assigns EXP-07/08/09/10 to Phase 25 only; both plans (25-01 and 25-02) declare them in `requirements:` frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/projects/wallecx/ExpensesTab.vue | 153 | `// Wired here per STATE.md invariant: ConfirmDialog at WallecxApp.vue shell level only.` — substring match on `ConfirmDialog` | ℹ️ Info | Documentation comment only; no `<ConfirmDialog />` template element exists. Phase 24 stub directive ("preserve verbatim") supersedes the grep-based 0-match acceptance criterion. The invariant intent (no rendered ConfirmDialog in this tab) is satisfied. SUMMARY documented this deviation. |

No blocker or warning anti-patterns. Specifically verified absent:
- `TODO` / `FIXME` / `XXX` / `HACK` / `PLACEHOLDER` — 0 matches across all 3 files
- `return null` / `return {}` / `return []` as stub implementations — 0 matches (the `let result = expenses.value` chain returns the live computed value, not a hardcoded `[]`)
- Hardcoded empty props passed to child components — `<ExpenseItem :record="record" ...>` receives live data from the v-for; `<AttachmentPreview :record="previewRecord" :token="previewToken" ...>` is gated on non-null `v-if="previewRecord"` and a populated token
- `@vueuse/core` imports — 0 matches in any of the 3 Phase 25 files
- `defineModel` in ExpensesToolbar.vue — 0 matches (uses `defineProps + defineEmits` as required)

### Invariant Spot-Check (User-Requested)

| Invariant | Status | Evidence |
|-----------|--------|----------|
| `categoryOptions` derives from raw `expenses.value` (NOT `filteredSortedExpenses`) | ✓ HOLDS | ExpensesTab.vue:54-56 — `[...new Set(expenses.value.map(e => e.category))].sort()` |
| v-if chain order: `isLoading` → `expenses.length === 0` → `filteredSortedExpenses.length === 0` → `v-else` | ✓ HOLDS | ExpensesTab.vue:199 (v-if), 205 (v-else-if expenses), 231 (v-else-if filtered), 253 (v-else) |
| `requestKey: 'expenses-getFullList'` in getFullList call | ✓ HOLDS | ExpensesTab.vue:126 |
| `pb.files.getToken()` called before opening AttachmentPreview | ✓ HOLDS | ExpensesTab.vue:102 awaited first; `showPreview.value = true` only on success (L109); failure path returns early (L106) |
| sessionStorage key exactly `wallecx:expense-sort` | ✓ HOLDS | ExpensesTab.vue:22 |
| No `<ConfirmDialog />` template element in ExpensesTab.vue | ✓ HOLDS | Only a documentation comment matches (L153); no template element. ConfirmDialog renders at WallecxApp.vue shell level per STATE.md invariant. |
| No `@vueuse/core` import in any of the 3 Phase 25 files | ✓ HOLDS | 0 matches across ExpenseItem.vue, ExpensesToolbar.vue, ExpensesTab.vue |
| ExpensesToolbar uses `defineProps + defineEmits` (NOT `defineModel`) | ✓ HOLDS | ExpensesToolbar.vue:2-18; 0 `defineModel` matches |
| Phase 24 stub code preserved (`deleteExpense`, `onCreated`, `onUpdated`, `openManage`, `defineExpose`) | ✓ HOLDS | ExpensesTab.vue:136-139 (openManage), 141-143 (onCreated), 145-150 (onUpdated), 154-172 (deleteExpense with full useConfirm + delete + toasts), 175 (defineExpose) — all intact |

### Human Verification Required

Seven behavioural items routed to human verification. They are listed in full in the frontmatter `human_verification:` block. Summary:

1. AttachmentPreview MIME branch rendering for image/PDF/unknown receipts (live session required)
2. Dialog vs Drawer responsive swap across 640px viewport breakpoint (runtime matchMedia)
3. sessionStorage round-trip for sort persistence across reload
4. Reactive search filter feels instant (UX confirmation)
5. Category MultiSelect filter + Clear filters reset (populated dataset required)
6. Date-range inclusive filter and no follow-up network calls (DevTools Network tab)
7. Delete flow end-to-end with shell ConfirmDialog and success toast

### Gaps Summary

No blocking gaps. All 6 ROADMAP Success Criteria, all 3 artifacts, all 7 key links, and all 4 phase requirements (EXP-07/08/09/10) are verified statically. The only deviation is the `ConfirmDialog` substring match on a documentation comment inside the preserved Phase 24 `deleteExpense` function — the practical invariant (no rendered ConfirmDialog in this tab; shell-level only) is upheld and explicitly documented in 25-02-SUMMARY.md.

TypeScript compiles cleanly. ExpensesToolbar correctly uses `defineProps + defineEmits` (not `defineModel`), `@vueuse/core` is absent everywhere in the 3 Phase 25 files (matching the RESEARCH critical finding that the package is not installed), and the data-flow trace shows real PocketBase data reaching the rendered rows.

Status is `human_needed` (not `passed`) because the visible read-path behaviours (responsive Dialog/Drawer, MIME-branched receipt rendering, sessionStorage round-trip, instant reactive search, delete flow with shell ConfirmDialog) cannot be exercised programmatically without an authenticated session and seeded data. Static verification is complete and clean.

---

*Verified: 2026-05-21*
*Verifier: Claude (gsd-verifier)*
