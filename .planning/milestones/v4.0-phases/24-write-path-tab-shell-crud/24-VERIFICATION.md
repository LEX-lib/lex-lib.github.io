---
phase: 24-write-path-tab-shell-crud
verified: 2026-05-21T14:00:00Z
status: human_needed
score: 5/6 roadmap success criteria verified (SC-4 deferred to Phase 25 for UI trigger)
overrides_applied: 0
deferred:
  - truth: "Deleting an expense prompts ConfirmDialog; on confirm, server-first delete is invoked; the local list refreshes"
    addressed_in: "Phase 25"
    evidence: "Phase 25 goal: 'ExpensesTab.vue shows the authenticated user's expenses'; SC-1 requires a list view. The delete trigger surface (expense list rows) is explicitly Phase 25 work. ExpensesTab.vue deleteExpense is fully implemented and exposed via defineExpose for Phase 25 list row wiring."
human_verification:
  - test: "Open /projects/wallecx — verify tab order is Vaccinations / Membership Cards / Expenses"
    expected: "Three tabs render in that exact order; switching between tabs does not lose state on the other tabs"
    why_human: "Tab render order and state preservation under switching requires a running browser"
  - test: "Click 'Add Expense' on the Expenses tab empty state — fill in Amount (e.g. 150.00), Date (today), Category (Food), Description (Lunch) — click 'Add Expense' submit button"
    expected: "Toast 'Expense added.' appears; dialog closes; record prepends in expenses array (visible once Phase 25 list is added)"
    why_human: "PocketBase create call requires live backend; CRUD flow requires a running app"
  - test: "Open Add Expense dialog — type a new category name not in the dropdown (e.g. 'Gym') — submit — open Add Expense again"
    expected: "'Gym' appears in the category dropdown on subsequent opens"
    why_human: "Category persistence to wallecx_expense_categories requires live PocketBase"
  - test: "Select a JPEG receipt file in the Add Expense dialog"
    expected: "Toast 'Location data removed.' appears; uploaded file is smaller than source"
    why_human: "Canvas EXIF strip + browser-image-compression runs in browser; requires running app to verify network payload size"
  - test: "Toggle dark mode — open Add Expense dialog/drawer"
    expected: "Dialog/drawer renders with dark surface (var(--color-surface-card)) — no white bleed"
    why_human: "Visual dark mode rendering requires browser inspection"
---

# Phase 24: Write Path — Tab Shell + CRUD Verification Report

**Phase Goal:** A third tab "Expenses" appears in `WallecxApp.vue` after Memberships; `ManageExpense.vue` creates / edits / deletes expense records with Zod validation; users can add a custom category from within the manage flow.
**Verified:** 2026-05-21T14:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Vaccinations / Memberships / Expenses tab order in WallecxApp.vue; switching to Expenses loads without breaking prior tab state | VERIFIED | `WallecxApp.vue` lines 80–103: `<Tab value="vaccinations">`, `<Tab value="memberships">`, `<Tab value="expenses">` in that order; `<TabPanel value="expenses"><ExpensesTab /></TabPanel>` wired; `activeTab` still initialised as `ref<string>("vaccinations")` (line 14); single `<ConfirmDialog />` preserved (line 105) |
| SC-2 | Clicking "Add expense" opens ManageExpense.vue; a valid entry saves to PocketBase and appears in the user's expense list | HUMAN NEEDED | Code path fully implemented: `openManage(null)` in ExpensesTab.vue → `showManage = true` → ManageExpense.vue Dialog/Drawer opens → `onSubmit()` calls `pb.collection('wallecx_expenses').create<Expenses>()` → emits `created` → `ExpensesTab.onCreated()` calls `expenses.value.unshift(record)`. Requires running browser + PocketBase to confirm end-to-end |
| SC-3 | Editing an existing expense updates fields; saving twice quickly does not double-submit (isSaving guard) | VERIFIED | `isSaving = ref(false)` set true before first PocketBase call (line 206); submit button has `:disabled="isSaving \|\| isLoadingCategories"` and `:loading="isSaving \|\| isLoadingCategories"` in both Dialog and Drawer branches; `finally { isSaving.value = false }` releases guard; form fields also carry `:disabled="isSaving"` |
| SC-4 | Deleting an expense prompts ConfirmDialog; on confirm, server-first delete is invoked; the local list refreshes | DEFERRED | `deleteExpense` is fully implemented in ExpensesTab.vue (lines 33–51): `confirm.require()` with `header: 'Confirm Delete'`, `acceptProps: { severity: 'danger' }`, `await pb.collection('wallecx_expenses').delete(record.id)`, then local splice. Exposed via `defineExpose({ deleteExpense })` for Phase 25 list row trigger. No list rows exist yet in Phase 24 — trigger surface is Phase 25. |
| SC-5 | Selecting a custom category in the category picker creates a new row in wallecx_expense_categories for that user only; appears in subsequent entries | VERIFIED | `existingMatch` check (ManageExpense.vue line 209): if category value not found in `loadedCategories`, `pb.collection('wallecx_expense_categories').create({ user: userId, name: category.value })` fires before the expense record write. `editable` Select prop allows free-text entry. |
| SC-6 | Receipt photo upload runs through EXIF strip + browser-image-compression pipeline | VERIFIED | `onFileSelect` (ManageExpense.vue lines 123–169): canvas re-encode (`canvas.toBlob`) strips EXIF for JPEG/PNG/WebP; `imageCompression(strippedFile, { maxSizeMB: 1.5, maxWidthOrHeight: 2048 })` compresses; `pendingFile` assigned the result; PDF bypasses canvas (direct assign). Toast `'Location data removed.'` confirmed at line 164. |

**Score:** 5/6 roadmap success criteria fully verified in code (SC-4 deferred to Phase 25 for list-row UI trigger; delete logic itself is complete).

### Deferred Items

Items not yet testable through UI but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | SC-4: Delete expense — ConfirmDialog prompt and server-first delete | Phase 25 | Phase 25 goal: "ExpensesTab.vue shows the authenticated user's expenses" (list rows are the delete trigger surface). Phase 25 SC-1 requires a sortable list. The `deleteExpense` function is complete and exposed via `defineExpose` in ExpensesTab.vue for Phase 25 to wire. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/projects/wallecx/ExpensesTab.vue` | Expenses tab scaffold — empty state, Add Expense button, emit handlers, deleteExpense ready for Phase 25 | VERIFIED | 99 lines; contains `useConfirm`, `deleteExpense`, `onCreated`, `onUpdated`, empty state with exact copy "No expenses yet — add your first one.", both Add buttons wired to `openManage(null)`, `defineExpose({ deleteExpense })` |
| `src/components/projects/wallecx/ManageExpense.vue` | Full CRUD dialog — create, edit, category seeding, custom category, file upload with EXIF strip | VERIFIED | 535 lines; full implementation with all required imports, form refs, watchers, `loadCategories`, `onFileSelect`, `onSubmit`, Dialog + Drawer branches with duplicated form, scoped dark mode CSS |
| `src/components/projects/wallecx/WallecxApp.vue` | Three-tab shell with Expenses as third tab (mdi:cash-multiple icon) | VERIFIED | `import ExpensesTab` present; `<Tab value="expenses">` with `mdi:cash-multiple` iconify-icon; `<TabPanel value="expenses"><ExpensesTab /></TabPanel>`; single `<ConfirmDialog />`; `activeTab` default unchanged |
| `src/lib/wallecx/expenseSchema.ts` | expense_date .refine() with dayjs strict parse (WR-03 fix) | VERIFIED | Line 20–21: `.regex(...).refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid(), { message: 'Date is not a valid calendar date.' })` |
| `src/lib/pocketbase/expenseMapper.ts` | Fixed mapper — notes key conditionally included only when defined (WR-01 fix) | VERIFIED | Line 28: `...(record.notes !== undefined ? { notes: record.notes } : {})` — no unconditional `notes: record.notes` key |
| `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` | Stronger not.toHaveProperty assertion (WR-02 fix) | VERIFIED | Line 62: `expect(minimalPayload).not.toHaveProperty('notes')` — no `.toBeUndefined()` assertion for notes field |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `WallecxApp.vue` | `ExpensesTab.vue` | `import ExpensesTab from "./ExpensesTab.vue"` | WIRED | Line 9 of WallecxApp.vue; used at line 101 in `<TabPanel value="expenses">` |
| `ExpensesTab.vue` | `ManageExpense.vue` | `import ManageExpense from './ManageExpense.vue'` | WIRED | Line 7 of ExpensesTab.vue; used at lines 92–97 with `v-model:visible`, `v-model:record`, `@created`, `@updated` |
| `ManageExpense.vue` | `expenseMapper.ts` | `import { mapToUpdateExpense }` | WIRED | Line 7 of ManageExpense.vue; referenced at line 234 (`void mapToUpdateExpense` — mirrors ManageMembership.vue pattern confirming writable field set) |
| `ManageExpense.vue` | `expenseSchema.ts` | `import { expenseSchema, DEFAULT_EXPENSE_CATEGORIES }` | WIRED | Line 8 of ManageExpense.vue; `expenseSchema.safeParse(payload)` at line 189; `DEFAULT_EXPENSE_CATEGORIES.map(...)` at line 88 of loadCategories |
| `ManageExpense.vue` | `types/wallecx/expenses/types.d.ts` | `import type { Expenses }` | WIRED | Line 9 of ManageExpense.vue; used in `defineModel<Expenses \| null>`, emits, and typed refs |
| `ManageExpense.vue` | `types/wallecx/expense-categories/types.d.ts` | `import type { ExpenseCategories }` | WIRED | Line 10 of ManageExpense.vue; used in `loadedCategories = ref<ExpenseCategories[]>([])` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ExpensesTab.vue` | `expenses` array | `expenses.value.unshift(record)` in `onCreated`; `splice` in `onUpdated` | Yes — populated from ManageExpense.vue emitted records which are server-returned `Expenses` objects | FLOWING (write path only; Phase 25 adds read path load) |
| `ManageExpense.vue` | `loadedCategories` | `pb.collection('wallecx_expense_categories').getFullList()` in `loadCategories()` | Yes — live PocketBase query on dialog open | FLOWING |
| `ManageExpense.vue` | submit FormData | `pb.collection('wallecx_expenses').create/update()` | Yes — real PocketBase write with user-entered form refs | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for live PocketBase API calls (require running app + live backend). Build/type-check/unit-test checks are the appropriate automated gate.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| expenseSchema rejects invalid calendar date | Static code analysis | `.refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid())` confirmed at expenseSchema.ts line 21 | PASS |
| mapToUpdateExpense omits notes key when undefined | Static code analysis | `...(record.notes !== undefined ? { notes: record.notes } : {})` confirmed at expenseMapper.ts line 28 | PASS |
| expenseMapper spec uses not.toHaveProperty | Static code analysis | `expect(minimalPayload).not.toHaveProperty('notes')` at spec line 62 | PASS |
| WallecxApp.vue tab order | Static code analysis | TabList order: vaccinations → memberships → expenses confirmed; single ConfirmDialog confirmed | PASS |
| isSaving guard on submit button | Static code analysis | `:disabled="isSaving \|\| isLoadingCategories"` on Button in both Dialog and Drawer branches | PASS |
| Auth null guard before PocketBase write | Static code analysis | `const userId = pb.authStore.record?.id; if (!userId) { toast.error('Session expired. Please log in again.'); return; }` at ManageExpense.vue lines 200–204 | PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXP-04 | 24-01-PLAN.md | WallecxApp.vue updated to render third tab "Expenses" after Memberships; tab order: Vaccinations / Memberships / Expenses | SATISFIED | WallecxApp.vue three-tab shell with correct order and mdi:cash-multiple icon confirmed |
| EXP-05 | 24-02-PLAN.md | ExpensesTab.vue and ManageExpense.vue CRUD dialog; Zod safeParse, isSaving guard, EXIF receipt upload, direct v-model refs | SATISFIED (code) / HUMAN for live create | All code paths implemented and verified; live end-to-end requires human test (SC-2) |
| EXP-06 | 24-02-PLAN.md | User can add custom category from manage flow; new category persisted to wallecx_expense_categories | SATISFIED (code) / HUMAN for persistence | `existingMatch` check + `pb.collection('wallecx_expense_categories').create()` before expense write confirmed; persistence requires live test |

No orphaned requirements — REQUIREMENTS.md maps EXP-04/05/06 to Phase 24 exactly; no Phase 24 requirements in REQUIREMENTS.md that are unaccounted for in the plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ManageExpense.vue` | 234 | `void mapToUpdateExpense` (reference, not call) | INFO | Intentional — mirrors ManageMembership.vue line 227 pattern; confirms writable field set without redundant call; FormData built directly which is the correct write pattern |
| `ExpensesTab.vue` | 9–12 | `expenses = ref<Expenses[]>([])`, `isLoading = ref(false)` always false | INFO | Intentional documented stubs per Phase 24 plan; Phase 25 adds `onMounted` load. Empty state is correctly visible. No rendering path that falsely implies data loaded. |

No blockers. No critical stubs. The two INFO items are explicitly scoped to Phase 24/25 boundary and are correct for this phase's deliverable.

### Human Verification Required

#### 1. End-to-End Expense Create (SC-2)

**Test:** Log in at `/projects/wallecx`, navigate to Expenses tab, click "Add Expense". Fill in Amount: 150.00, Date: today, Category: Food (from dropdown), Description: "Lunch". Click "Add Expense" button.
**Expected:** Toast "Expense added." appears; dialog closes. (Record will not appear in a list until Phase 25 adds the read path, but the toast and dialog close confirm the PocketBase create succeeded.)
**Why human:** Requires live PocketBase backend and running dev server to exercise the actual create path.

#### 2. Category Persistence (SC-5 live test)

**Test:** Open Add Expense dialog. In the Category field, type a brand new value not in the dropdown (e.g. "Gym"). Submit successfully. Open Add Expense dialog again.
**Expected:** "Gym" now appears in the category options dropdown.
**Why human:** Requires live PocketBase to confirm `wallecx_expense_categories` row was created and is returned by `getFullList` on next dialog open.

#### 3. EXIF Strip + Compression (SC-6 live test)

**Test:** Open Add Expense dialog, click "Choose File", select a JPEG photo taken on a phone (which typically embeds GPS coordinates).
**Expected:** Toast "Location data removed." appears. If you check the browser Network tab: the uploaded multipart file is smaller than the source and no GPS EXIF block is present in the response.
**Why human:** Canvas EXIF strip and browser-image-compression run in-browser; requires a running app and a photo with actual EXIF data to confirm.

#### 4. Dark Mode Rendering

**Test:** Toggle dark mode on. Navigate to Expenses tab. Click "Add Expense".
**Expected:** ManageExpense dialog (desktop) or drawer (mobile) renders with dark surface background (`var(--color-surface-card)`) — no white bleed in the dialog body or drawer content area.
**Why human:** Visual rendering requires browser inspection.

#### 5. isSaving Double-Submit Guard (SC-3 live test)

**Test:** Open an existing expense for editing (requires Phase 25 list to be present, OR: manually open ManageExpense via ExpensesTab openManage with a mock record). Fill fields. Click "Save Changes" twice in rapid succession.
**Expected:** Only one PocketBase PATCH request fires. Submit button shows loading spinner and is disabled after first click.
**Why human:** Timing-dependent guard behavior requires a running browser; network tab or request log needed to confirm single PATCH.

### Gaps Summary

No blocking gaps identified. All six must-haves from both plans are implemented and substantive. Key links between all components are wired. Data flows through the correct paths. SC-4 (delete) is architecturally complete but its UI trigger (expense list rows) is deliberately deferred to Phase 25 — this is the intended phase boundary, not a gap.

The five human verification items are standard end-to-end behavioral checks that cannot be confirmed from static analysis alone. They are the expected UAT steps for a CRUD write path backed by a live PocketBase instance.

---

_Verified: 2026-05-21T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
