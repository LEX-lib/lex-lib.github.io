---
phase: 28-budget-tracking
plan: 02
subsystem: ui
tags: [vue, primevue, dialog, drawer, upsert, budget, wallecx, manage, modal]

# Dependency graph
requires:
  - phase: 28-budget-tracking
    provides: ExpenseBudget type + wallecx_expense_budgets collection (Plan 01)
  - phase: 24-expense-tracking
    provides: ManageExpense.vue Dialog/Drawer split analog (mirrored 1:1)
  - phase: 15-mobile-layouts
    provides: 44px touch-target invariant + useIsMobile composable
provides:
  - ManageBudget.vue bulk-upsert modal (Dialog/Drawer split) ready to mount in ExpensesReportsView
  - Promise.all upsert loop pattern (create/update/delete-on-zero) for bulk budget CRUD
  - Pre-population on dialog open via watch(visible) seeded from props (shell-owns-data invariant)
affects: [28-03-reports-integration, future bulk-upsert modals]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bulk upsert via Promise.all per row: create | update | delete-on-zero"
    - "Pre-population on visible=true watcher (no immediate, no record defineModel)"
    - "Shell-owns-data: component receives :categories and :budgets props, never fetches"

key-files:
  created:
    - src/components/projects/wallecx/ManageBudget.vue
  modified: []

key-decisions:
  - "Single-quote string style throughout script section (matches ManageExpense.vue analog)"
  - "Promise.all partial-failure acceptance documented inline per RESEARCH Pitfall 4 (no PocketBase transactions; parent re-fetches on 'saved')"
  - "watch(visible) without { immediate: true } — initial open seeds rows, subsequent opens re-seed to address stale state (RESEARCH Pitfall 6)"
  - "InputNumber min=0 and amount<=0||null treated as delete (no separate delete button per UI-SPEC)"

patterns-established:
  - "ManageBudget bulk-upsert template: defineModel('visible') + props.categories/budgets + emit('saved') + Promise.all loop"
  - "Dialog/Drawer split mirrors ManageExpense.vue with substitutions: literal header, no record defineModel, no FileUpload, no validation schema"

requirements-completed: [RPT-01]

# Metrics
duration: ~3min
completed: 2026-05-24
---

# Phase 28 Plan 02: ManageBudget.vue Summary

**Bulk-upsert budget management modal (Dialog/Drawer split) with per-category amount + monthly/yearly toggle, Promise.all create/update/delete-on-zero loop, and pre-population from props on open — RPT-01 UI half ready for Plan 03 integration.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-24T15:40:00Z (approx)
- **Completed:** 2026-05-24T15:43:42Z
- **Tasks:** 1 (auto)
- **Files created:** 1 (240 lines)

## Accomplishments

- `ManageBudget.vue` SFC created with `<script setup lang="ts">` + template + scoped style (240 lines, plan target ~260)
- Dialog (desktop, !isMobile) and Drawer (mobile) variants share identical form structure with distinct `for`/`id` namespacing (`budget-amount-${idx}` vs `budget-amount-m-${idx}`) to avoid duplicate-id collisions when both render in test/SSR contexts
- Promise.all upsert loop handles three branches: blank/zero+existing → delete; blank/zero+new → skip; non-zero+existing → update; non-zero+new → create
- All 16 grep-based acceptance criteria pass
- `npm run type-check` exits 0 (clean)
- `npm run lint` against `ManageBudget.vue` reports zero errors (only the pre-existing `VaccinationDetail.vue` lint error remains — already deferred per Plan 01)

## RESEARCH.md Pitfalls Addressed

All six RESEARCH.md pitfalls mitigated:

| Pitfall | Mitigation in `ManageBudget.vue` |
|---------|----------------------------------|
| **1. PocketBase v0.29 createRule body syntax** | N/A in this file — handled server-side per Plan 01. Client never sends `user` field on UPDATE payload (line 81-84 `{ budget_type, amount }` only). |
| **2. PrimeVue auto-import naming** | Zero explicit `import * from 'primevue/*'` lines. Components Dialog, Drawer, InputNumber, SelectButton, Button are resolved by `PrimeVueResolver` via `unplugin-vue-components`. |
| **3. requestKey collisions** | This component performs only writes (`create`/`update`/`delete`) — no `getFullList` calls, so no requestKey assigned here. Plan 03 will use locked `'expense-budgets-getFullList'`. |
| **4. No PocketBase transactions / Promise.all partial failure** | Documented inline (script lines 60-64): partial commits are acceptable for personal budget data; parent re-fetches on `'saved'` emit. |
| **5. defineModel two-way binding** | `const visible = defineModel('visible', { type: Boolean, default: false, required: true })` — parent can bind via `v-model:visible`, mutation in `onSubmit` (`visible.value = false`) propagates back without explicit emit. |
| **6. Stale state on reopen** | `watch(visible, (isOpen) => { if (!isOpen) return; ... })` rebuilds `localRows` from `props.categories` + `budgetMap` on every open, ensuring fresh state when user adds a new category in Plan 03's parent and reopens the dialog. |

## Acceptance Criteria — All Pass

| Criterion | Expected | Actual |
|-----------|----------|--------|
| `defineModel('visible'` | 1 | 1 |
| `defineProps<{` | 1 | 1 |
| `wallecx_expense_budgets` | ≥3 | 3 (delete + update + create) |
| `'Budgets saved.'` | 1 | 1 |
| `'Failed to save budgets. Please try again.'` | 1 | 1 |
| `'Session expired. Please log in again.'` | 1 | 1 |
| `'Save Budgets'` | ≥2 | 2 (Dialog + Drawer button labels) |
| `'Manage Budgets'` | ≥2 | 2 (Dialog header + Drawer header span) |
| `min-h-[44px]` | ≥4 | 6 (InputNumber + SelectButton + Button × 2 variants) |
| `useIsMobile()` | 1 | 1 |
| `:deep(.my-app-dark .p-dialog)` | 1 | 1 |
| `:deep(.my-app-dark .p-drawer)` | 1 | 1 |
| `import ... from 'primevue/...'` | 0 | 0 |
| `getFullList` | 0 | 0 |
| `npm run type-check` | exit 0 | exit 0 |
| `npm run lint` (this file) | clean | clean |

## Task Commits

1. **Task 1: Create ManageBudget.vue (script + template + style)** — `91ab207` (feat)

**Plan metadata commit:** pending (this SUMMARY)

## Files Created/Modified

- `src/components/projects/wallecx/ManageBudget.vue` (240 lines) — Bulk-upsert budget management modal. Dialog for desktop, Drawer for mobile. Renders all categories as rows pre-populated from `:budgets` prop; Save Budgets button fires Promise.all upsert. Emits `'saved'` on success; auth-null guard returns early with toast.

## No PrimeVue Explicit Imports — Confirmed

```bash
grep -c "import .* from 'primevue/" src/components/projects/wallecx/ManageBudget.vue
# → 0
```

Verified: Dialog, Drawer, InputNumber, SelectButton, and Button are all auto-imported via `PrimeVueResolver` in `vite.config.ts`. The locked invariant from 28-PATTERNS.md §No Analog Found note holds.

## Decisions Made

- None beyond plan. Task 1 `<action>` block was followed verbatim; all string literals match the locked UI-SPEC Copywriting Contract exactly.

## Deviations from Plan

None — Task 1 executed exactly as written.

The pre-existing eslint error in `VaccinationDetail.vue:5` (logged to `deferred-items.md` during Plan 01) was confirmed still pending and remains OUT of scope per success criteria.

## Issues Encountered

None. Type-check exited cleanly, lint reports zero errors on the new file. The Vite plugin `unplugin-vue-components` will regenerate `components.d.ts` to include `ManageBudget` on next dev/build run — no manual update needed.

## User Setup Required

None — no external service configuration. PocketBase collection rules were already configured in Plan 01.

## Next Phase Readiness

- **Plan 28-03 (Reports integration):** UNBLOCKED — `ManageBudget.vue` is ready to mount in `ExpensesReportsView.vue` with:
  ```html
  <ManageBudget v-model:visible="..." :categories="..." :budgets="..." @saved="..." />
  ```
  Plan 03 must:
  1. Fetch categories and budgets in the parent (shell-owns-data) using requestKey `'expense-budgets-getFullList'`
  2. Pass them as props
  3. Re-fetch on `'saved'` event to reflect server state (per Pitfall 4 partial-failure note)

## Self-Check: PASSED

- `src/components/projects/wallecx/ManageBudget.vue` — FOUND
- `.planning/phases/28-budget-tracking/28-02-SUMMARY.md` — FOUND (this file)
- Commit `91ab207` (Task 1) — FOUND in git log

---
*Phase: 28-budget-tracking*
*Plan: 02*
*Completed: 2026-05-24*
