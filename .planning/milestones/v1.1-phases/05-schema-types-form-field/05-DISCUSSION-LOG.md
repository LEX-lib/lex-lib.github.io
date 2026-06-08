# Phase 5: Schema, Types & Form Field - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 05-schema-types-form-field
**Areas discussed:** Field position in form, Placeholder / hint text, Edit-mode UX for old records

---

## Field position in form

| Option | Description | Selected |
|--------|-------------|----------|
| First field — before Vaccine Name | Category leads: type first, then brand details. Mirrors grouped view concept. | ✓ |
| Second — right after Vaccine Name | Brand name stays first; type is a secondary grouping field. | |
| Last visible field — before Card attachment | Least disruptive but buries a required field. | |

**User's choice:** First field — before Vaccine Name
**Notes:** Logical because Phase 6 makes vaccine_type the top-level grouping concept; leading with it in the form reinforces this mental model.

---

## Placeholder / hint text

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — include placeholder text | `placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"` | ✓ |
| No — label alone is enough | "Vaccine Type *" is self-explanatory. | |

**User's choice:** Yes — include placeholder text
**Notes:** Free-text field without a dropdown needs concrete examples so users know what level of categorization is expected.

---

## Edit-mode UX for old records

| Option | Description | Selected |
|--------|-------------|----------|
| Zod validates on submit only — no special UX | User sees empty field, fills it in, saves. Validation fires on submit if empty. | ✓ |
| Show a hint banner in the dialog | Info message: "Vaccine Type is now required — please fill it in." | |

**User's choice:** Zod validates on submit only — no special UX
**Notes:** Same pattern as other required fields (vaccine_name, date_administered). No special treatment needed.

---

## Claude's Discretion

- Mapper update scope — `mapToUpdateVaccination` requires no change; `vaccine_type` is automatically included since only server-managed fields are stripped
- PocketBase field schema level — optional at schema (empty string allowed for existing records); required only at form/Zod layer
- Exact label text — "Vaccine Type *" matching existing required-field convention

## Deferred Ideas

None.
