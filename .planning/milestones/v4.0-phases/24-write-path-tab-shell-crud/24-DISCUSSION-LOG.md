# Phase 24: Write Path — Tab Shell + CRUD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 24 — Write Path — Tab Shell + CRUD
**Areas discussed:** Category picker UX, ExpensesTab scaffold, Amount input component, Category seeding UX

---

## Category picker UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline editable Select | PrimeVue Select with editable=true — user types a new name directly into the dropdown field | ✓ |
| Sentinel option + inline input | Last item is "Add new category..." — reveals InputText below Select | |
| Second mini-dialog | Selecting "Add new category..." opens a Dialog-within-Dialog | |

**User's choice:** Inline editable Select

**Follow-up — When is the new category created?**

| Option | Description | Selected |
|--------|-------------|----------|
| On expense save | Two-call sequence: create category → create/update expense | ✓ |
| On blur / immediately | Category created in background when focus moves away | |

**Notes:** Category creation happens only on final expense save. If the typed value already exists in the loaded list, no new category is created. If category creation fails, the expense save is aborted with a toast error.

---

## ExpensesTab scaffold

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state + Add button only | Phase 24 delivers empty state + "Add Expense" button. Phase 25 adds the list. | ✓ |
| Basic unfiltered list | Phase 24 also builds the list; Phase 25 adds toolbar/filtering on top | |

**User's choice:** Empty state + Add button only

**Notes:** Clean phase boundary. Phase 24 ExpensesTab.vue template should structure its empty-state area so Phase 25's list is a drop-in replacement.

---

## Amount input component

| Option | Description | Selected |
|--------|-------------|----------|
| InputNumber (no currency mode) | Plain decimal InputNumber, PHP label beside the field | ✓ |
| InputNumber with currency mode | InputNumber with mode='currency', currency='PHP' — shows ₱ in the field | |

**User's choice:** InputNumber (no currency mode)

**Notes:** minFractionDigits=2, maxFractionDigits=2, :min=0.01. PHP label displayed as static text beside the input. Avoids mobile keyboard quirks with currency mode.

---

## Category seeding UX

| Option | Description | Selected |
|--------|-------------|----------|
| Loading state in the Select | Category Select disabled with "Loading categories..." while seeding | ✓ |
| Silent seed | Dialog opens normally, Select briefly empty, populates after seeding | |

**User's choice:** Loading state in the Select

**Notes:** Submit button also disabled while seeding. Once Promise.all resolves, Select is enabled and populated with the 7 defaults.

---

## Claude's Discretion

- Exact Expenses tab icon (mdi:cash-multiple recommended)
- Description character counter
- Toast wording for CRUD success messages
- Whether to apply WR-03 date regex `.refine()` fix to expenseSchema as part of Phase 24

## Deferred Ideas

- Category management screen (rename/delete user categories)
- WR-01/02/03 Phase 23 code review fixes (run `/gsd-code-review-fix 23` separately)
