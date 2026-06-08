# Phase 11: Backend + Frontend Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 11-backend-frontend-foundation
**Areas discussed:** card_image file constraints, barcode_type field type, Plan structure

---

## card_image File Constraints

### PDF Support

| Option | Description | Selected |
|--------|-------------|----------|
| Image-only (JPG/PNG/WebP) | MIME allowlist: image/jpeg,image/png,image/webp. Membership cards are physical cards — photos only. Matches MWRITE-04. | ✓ |
| Image + PDF (same as vaccination card) | Mirror Phase 1 exactly — covers PDF loyalty card edge case | |

**User's choice:** Image-only (JPG/PNG/WebP)
**Notes:** Vaccination field includes PDF because vaccination certificates exist as PDFs. Membership cards don't have that use case.

### Size Cap and Thumbs

| Option | Description | Selected |
|--------|-------------|----------|
| 10MB cap, thumbs 100x100 + 400x0 (same as vaccination card) | Mirror Phase 1 exactly. protected:true. Proven pattern. | ✓ |
| 5MB cap, thumbs 100x100 + 400x0 | Smaller cap for photo-only uploads | |
| 10MB cap, no thumbs | Skip thumb generation — raw file URL only | |

**User's choice:** 10MB cap, thumbs 100x100 + 400x0 (same as vaccination card)
**Notes:** Follow Phase 1 pattern exactly for consistency.

---

## barcode_type Field Type

| Option | Description | Selected |
|--------|-------------|----------|
| PocketBase select field (enum values) | 5 allowed values in Admin UI. Server rejects values outside set. Requires Admin UI schema change for new types. | ✓ |
| Plain text field | Free text — consistent with how vaccine_type works. Relies on Zod client-side validation. | |

**User's choice:** PocketBase select field (enum values)
**Notes:** Value set is closed and known. Server-side validation is safer. This departs from ROADMAP.md which says "text" — documented in CONTEXT.md specifics.

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans: backend schema \| smoke test \| frontend (mirror Phase 1) | 11-01: PocketBase setup. 11-02: Two-user smoke test. 11-03: Frontend foundation. | ✓ |
| 2 plans: backend+smoke-test combined \| frontend | Saves one plan unit but buries the human checkpoint. | |

**User's choice:** 3 plans — mirror Phase 1 exactly
**Notes:** Smoke test must remain a separate human-action checkpoint plan. Phase 1 pattern is proven.

---

## Claude's Discretion

- Field ordering in PocketBase Admin UI walkthrough
- Exact wording of smoke-test confirmation message

## Deferred Ideas

None.
