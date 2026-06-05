---
phase: 27-code-quality-exports
verified: 2026-05-22T00:00:00Z
status: human_needed
score: 4/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Trigger a Memberships export while DevTools Network tab is open and dark mode is active; resize to 375px viewport"
    expected: "Download records button is visible, correctly styled in dark mode, tappable at mobile viewport, and the downloaded file opens as valid JSON"
    why_human: "Dark mode rendering and mobile viewport tap-target size cannot be verified by static code analysis"
  - test: "Trigger an Expenses export while DevTools Network tab is open and dark mode is active; resize to 375px viewport"
    expected: "Download records button is visible next to Add Expense, correctly styled in dark mode, tappable at mobile viewport, and the downloaded file opens as valid JSON"
    why_human: "Dark mode rendering and mobile viewport tap-target size cannot be verified by static code analysis"
---

# Phase 27: Code Quality & Exports — Verification Report

**Phase Goal:** The Memberships and Expenses tabs expose a one-click JSON download, and two deferred code-quality defects in the expense mapper are corrected
**Verified:** 2026-05-22T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Expense date field rejects invalid calendar dates (e.g. Feb 31, Apr 31) with a validation error | VERIFIED | `expenseSchema.ts:21` — `.refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid(), { message: 'Date is not a valid calendar date.' })` present and confirmed |
| 2 | When editing an expense with no notes, PATCH payload does not contain `notes` key (verified by mapper unit test using `not.toHaveProperty`) | VERIFIED | `expenseMapper.ts:28` — `...(record.notes !== undefined ? { notes: record.notes } : {})`. Test at `expenseMapper.spec.ts:62` — `expect(minimalPayload).not.toHaveProperty("notes")` |
| 3 | User can click a Download JSON button on the Memberships tab and receive a valid JSON file | VERIFIED | `MembershipsTab.vue:170-217` — full `exportJson()` with correct envelope shape, `memberships-export` requestKey, Blob download, success/error toasts, finally block |
| 4 | User can click a Download JSON button on the Expenses tab and receive a valid JSON file | VERIFIED | `ExpensesTab.vue:101-147` — full `exportJson()` with correct envelope shape, `expenses-export` requestKey, Blob download, success/error toasts, finally block |
| 5 | Both export downloads work in dark mode and on mobile viewport | ? UNCERTAIN | Code is correctly structured (PrimeVue Button with `severity="secondary"`, `size="small"`, `icon="pi pi-download"`); visual rendering in dark mode and tap-target at mobile viewport cannot be verified statically |

**Score:** 4/5 truths verified (1 requires human)

---

### Deferred Items

None.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/wallecx/expenseSchema.ts` | CQ-01: `expense_date` `.refine()` with dayjs strict parse | VERIFIED | Line 21 — exact pattern confirmed |
| `src/lib/pocketbase/expenseMapper.ts` | CQ-02: conditional spread for `notes` field | VERIFIED | Line 28 — `record.notes !== undefined` guard confirmed |
| `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` | "drops notes when undefined" test using `not.toHaveProperty` | VERIFIED | Line 62 — `expect(minimalPayload).not.toHaveProperty("notes")` confirmed |
| `.planning/REQUIREMENTS.md` | CQ-01 and CQ-02 marked `[x]` complete | VERIFIED | Both show `[x]` with traceability rows showing "Complete (verified 2026-05-22)" |
| `src/components/projects/wallecx/MembershipsTab.vue` | exportJson() function + Download records button | VERIFIED | Lines 170–217 (script) + lines 223–241 (template) |
| `src/components/projects/wallecx/ExpensesTab.vue` | exportJson() function + Download records button | VERIFIED | Lines 101–147 (script) + lines 153–167 (template) |

**REQUIREMENTS.md documentation gap (non-blocking):** EXPORT-01 and EXPORT-02 remain `[ ]` unchecked in REQUIREMENTS.md and "Pending" in the traceability table, despite the implementation being complete. Plans 27-02 and 27-03 did not include a task to update REQUIREMENTS.md for these two items. This does not block goal achievement but should be resolved by marking EXPORT-01 and EXPORT-02 as `[x]` in REQUIREMENTS.md.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `MembershipsTab.vue exportJson()` | `pb.collection('wallecx_memberships').getFullList` | `requestKey: 'memberships-export'` | WIRED | Line 183 confirmed; distinct from `memberships-getFullList` (line 100) |
| `MembershipsTab.vue template` | Download records Button | `<div class="flex gap-2">` wrapper | WIRED | Lines 224–240 — both buttons grouped under `flex gap-2` inside `flex items-center justify-between mb-4` |
| `exportJson() finally block` | `isExporting.value = false` | try/catch/finally pattern | WIRED | Line 215 — inside `finally {}` block |
| `ExpensesTab.vue exportJson()` | `pb.collection('wallecx_expenses').getFullList` | `requestKey: 'expenses-export'` | WIRED | Line 114 confirmed; distinct from `expenses-getFullList` (line 51) |
| `ExpensesTab.vue template` | Download records Button | `<div class="flex gap-2">` on right side; h2 on left | WIRED | Lines 154–166 — `<h2>` is a direct child of `justify-between`, `flex gap-2` wraps only the two buttons |
| `ExpensesTab.vue exportJson() finally` | `isExporting.value = false` | try/catch/finally pattern | WIRED | Line 146 — inside `finally {}` block |
| `expenseMapper.ts mapToUpdateExpense` | conditional notes spread | `record.notes !== undefined` guard | WIRED | Line 28 — result returned, function exported |
| `expenseMapper.spec.ts` | `not.toHaveProperty("notes")` assertion | "drops notes when undefined" test | WIRED | Line 62 — correct assertion, not `toBeUndefined()` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `MembershipsTab.vue exportJson()` | `allRecords` | `pb.collection("wallecx_memberships").getFullList<Memberships>()` | Yes — authenticated PocketBase query, not static | FLOWING |
| `ExpensesTab.vue exportJson()` | `allRecords` | `pb.collection("wallecx_expenses").getFullList<Expenses>()` | Yes — authenticated PocketBase query, not static | FLOWING |
| `expenseMapper.ts` | return value of `mapToUpdateExpense` | `record` parameter — caller provides real `Expenses` record | Yes — passthrough of caller-supplied data | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — export functions require browser runtime (Blob API, URL.createObjectURL, anchor.click) and an authenticated PocketBase session; neither is available without a running server. Logic correctness verified by code inspection.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CQ-01 | 27-01-PLAN.md | Expense date field rejects invalid calendar dates | SATISFIED | `expenseSchema.ts:21` `.refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid(), ...)` |
| CQ-02 | 27-01-PLAN.md | `mapToUpdateExpense` omits `notes` key when undefined; test uses `not.toHaveProperty` | SATISFIED | `expenseMapper.ts:28` conditional spread; `expenseMapper.spec.ts:62` correct assertion |
| EXPORT-01 | 27-02-PLAN.md | User can download all membership card records as JSON from Memberships tab | SATISFIED (code) | `MembershipsTab.vue` exportJson() + Download records button fully implemented |
| EXPORT-02 | 27-03-PLAN.md | User can download all expense records as JSON from Expenses tab | SATISFIED (code) | `ExpensesTab.vue` exportJson() + Download records button fully implemented |

**REQUIREMENTS.md checkbox status:** CQ-01 `[x]`, CQ-02 `[x]` — correct. EXPORT-01 `[ ]`, EXPORT-02 `[ ]` — still unchecked despite implementation being complete. The traceability table still shows "Pending" for EXPORT-01 and EXPORT-02. This is a documentation inconsistency; the code fully satisfies both requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | None found |

No stubs, placeholders, empty implementations, or hardcoded data detected in any phase-27-modified file. Both `exportJson()` functions use real PocketBase queries with authenticated user guards. All toast messages are substantive. All `finally` blocks are present and correct.

---

### Human Verification Required

#### 1. Dark Mode Export Buttons (Memberships)

**Test:** Enable dark mode (`my-app-dark` class active), navigate to the Memberships tab, verify the "Download records" button is visible and correctly styled. Click it while authenticated.
**Expected:** Button renders with correct secondary styling in dark mode. A file named `wallecx-memberships-YYYY-MM-DD.json` downloads. The JSON contains `exported_at`, `record_count`, and `records[]` with the correct field set.
**Why human:** Dark mode visual correctness depends on PrimeVue Aura theme token resolution at runtime; cannot be verified by static grep.

#### 2. Dark Mode Export Buttons (Expenses)

**Test:** Enable dark mode, navigate to the Expenses tab. Verify the "Expenses" h2 is on the left, and both "Add Expense" and "Download records" buttons are grouped on the right. Click "Download records" while authenticated.
**Expected:** Layout is correct (h2 left / buttons right). Button renders correctly in dark mode. A file named `wallecx-expenses-YYYY-MM-DD.json` downloads. The JSON contains the correct envelope and field set.
**Why human:** Same as above — dark mode rendering and layout correctness require browser inspection.

#### 3. Mobile Viewport Export (both tabs)

**Test:** Resize to 375px (or use DevTools mobile emulation). Verify the "Download records" button is visible and has an adequate tap target on both Memberships and Expenses tabs.
**Expected:** Button is visible without horizontal scroll; tap target is at least 44px tall (PrimeVue `size="small"` typically satisfies this).
**Why human:** Mobile tap-target and overflow behaviour requires viewport rendering.

---

### Gaps Summary

No functional gaps found. The phase goal is achieved in code:

- CQ-01 is live (`expenseSchema.ts:21`) and tested
- CQ-02 is live (`expenseMapper.ts:28`) and tested with the correct assertion
- EXPORT-01 is fully implemented in `MembershipsTab.vue`
- EXPORT-02 is fully implemented in `ExpensesTab.vue`

**One documentation inconsistency to address before closing the phase:**
REQUIREMENTS.md still shows `[ ]` for EXPORT-01 and EXPORT-02 and "Pending" in the traceability table. Plans 27-02 and 27-03 did not include a REQUIREMENTS.md update task for these items. This should be corrected by changing `[ ]` to `[x]` and updating the traceability status to "Complete (verified 2026-05-22)" for both EXPORT-01 and EXPORT-02.

**One human verification item remains:** Success Criterion 5 (dark mode + mobile viewport) requires browser inspection.

---

_Verified: 2026-05-22T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
