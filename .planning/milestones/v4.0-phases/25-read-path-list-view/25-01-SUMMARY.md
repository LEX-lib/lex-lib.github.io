---
phase: 25-read-path-list-view
plan: "01"
subsystem: wallecx
tags: [component, list-row, toolbar, filter, dark-mode]
dependency_graph:
  requires:
    - src/types/wallecx/expenses/types.d.ts
    - src/lib/wallecx/currency.ts
    - src/assets/base.css
  provides:
    - src/components/projects/wallecx/ExpenseItem.vue
    - src/components/projects/wallecx/ExpensesToolbar.vue
  affects:
    - src/components/projects/wallecx/ExpensesTab.vue (imported in Plan 02)
tech_stack:
  added: []
  patterns:
    - Pure v-model relay (defineProps + defineEmits, no defineModel)
    - Falsy receipt check (v-if="record.receipt") for PocketBase empty string fields
    - 44px touch targets with touch-manipulation on all icon buttons
    - Dark mode scoped CSS via :deep(.my-app-dark .p-*) overrides
    - DatePicker @update:model-value cast via instanceof Date for TypeScript overload safety
key_files:
  created:
    - src/components/projects/wallecx/ExpenseItem.vue
    - src/components/projects/wallecx/ExpensesToolbar.vue
  modified: []
decisions:
  - "DatePicker @update:model-value uses instanceof Date cast — PrimeVue DatePicker emits Date | Date[] | (Date|null)[] | null | undefined; cast to Date|null satisfies our emit type"
  - "No debounce in ExpensesToolbar — @vueuse/core not installed; reactive instant filtering matches MembershipsTab/VaccinationsTab pattern"
  - "ExpenseItem has no :deep scoped CSS — all colours are CSS variables that auto-switch under .my-app-dark; only PrimeVue component wrappers need overrides"
metrics:
  duration: "5 minutes"
  completed_date: "2026-05-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 25 Plan 01: Child Components (ExpenseItem + ExpensesToolbar) Summary

**One-liner:** Compact expense list row and v-model relay toolbar with dark mode scoped CSS, ready for ExpensesTab.vue wiring in Plan 02.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ExpenseItem.vue — compact expense list row | e05b206 | src/components/projects/wallecx/ExpenseItem.vue |
| 2 | Create ExpensesToolbar.vue — search + sort + category + date range toolbar | a8cf273 | src/components/projects/wallecx/ExpensesToolbar.vue |

## What Was Built

**ExpenseItem.vue** — Single-record compact list row:
- Left: amount `w-24 shrink-0 font-bold text-base` in `var(--color-brand-primary)`
- Middle: `flex-1 min-w-0` with date+category (12px muted) over description (14px body, truncated)
- Right: paperclip (conditional `v-if="record.receipt"` falsy check), pencil, trash — all `min-w-[44px] min-h-[44px] touch-manipulation`
- Trash uses `var(--color-status-error)`; all other colors are CSS vars (auto dark mode)
- Emits: `edit`, `delete`, `preview`

**ExpensesToolbar.vue** — Two-row filter toolbar:
- Row 1: `IconField` search + `Select` sort (`w-36`)
- Row 2: `MultiSelect` category filter + two `DatePicker` inputs; `flex-wrap` for narrow viewports
- Pure v-model relay: 5 update: emits, no internal state, no `defineModel`
- Dark mode scoped CSS: `:deep(.my-app-dark .p-inputtext/p-select/p-multiselect/p-datepicker)` overrides
- All interactive controls: `min-h-[44px]`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DatePicker @update:model-value TypeScript overload mismatch**
- **Found during:** Task 2 type-check
- **Issue:** PrimeVue DatePicker emits `Date | Date[] | (Date|null)[] | null | undefined` — using `$event` directly was not assignable to our `Date | null` emit type (TS2769)
- **Fix:** Cast via `($event instanceof Date ? $event : null)` on both DatePicker @update:model-value handlers
- **Files modified:** src/components/projects/wallecx/ExpensesToolbar.vue
- **Commit:** a8cf273 (included in task commit)

## Known Stubs

None. Both components are complete and wire-ready for Plan 02.

## Threat Flags

None. Both components introduce no new network endpoints, auth paths, or trust boundaries beyond those documented in the plan's threat model (T-25-01 through T-25-03 — all accepted).

## Self-Check: PASSED

- [x] `src/components/projects/wallecx/ExpenseItem.vue` exists
- [x] `src/components/projects/wallecx/ExpensesToolbar.vue` exists
- [x] Commit e05b206 exists
- [x] Commit a8cf273 exists
- [x] `npm run type-check` exits 0
- [x] Lint passes on Phase 25 files (pre-existing VaccinationDetail.vue ESLint error is out of scope)
