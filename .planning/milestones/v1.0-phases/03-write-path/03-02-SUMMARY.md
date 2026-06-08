---
phase: 03-write-path
plan: "02"
subsystem: wallecx-write-path
tags: [vue, primevue, zod, form-validation, file-upload, dialog]
dependency_graph:
  requires: [03-01]
  provides: [ManageVaccination shell for 03-03, 03-04]
  affects: [src/components/projects/wallecx/ManageVaccination.vue]
tech_stack:
  added: []
  patterns:
    - PrimeVue Form + zodResolver with validate-on-submit
    - defineModel for visible + record (create/edit mode switch)
    - FileUpload mode=basic :auto=false with MIME/size client validation
    - isSaving ref as double-submit guard (WRITE-07)
key_files:
  created:
    - src/components/projects/wallecx/ManageVaccination.vue
  modified: []
decisions:
  - "onSubmit is a placeholder stub — full PocketBase create/update implementation deferred to Plan 03 by design"
  - "imageCompression/dayjs/pb/mapToUpdateVaccination imported now; void-called to suppress unused warnings until Plan 03 wires them"
metrics:
  duration: "3 minutes"
  completed: "2026-05-12"
---

# Phase 3 Plan 02: ManageVaccination.vue — Dialog Shell Summary

**One-liner:** Unified create/edit dialog shell with PrimeVue Form + zodResolver, FileUpload MIME/size validation, and isSaving guard.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create ManageVaccination.vue — Dialog shell, Zod form, FileUpload | 14db449 | src/components/projects/wallecx/ManageVaccination.vue |

## Acceptance Criteria Verification

- File exists: `src/components/projects/wallecx/ManageVaccination.vue` — PASS
- `npm run type-check` exits 0 — PASS
- Contains `zodResolver` from `@primevue/forms/resolvers/zod` — PASS
- Contains `Form, FormSubmitEvent` from `@primevue/forms` — PASS
- Contains `defineModel("visible"` — PASS
- Contains `defineModel` for `record` typed `Vaccinations` — PASS
- Contains `isSaving = ref(false)` — PASS
- Contains `isEditMode = computed` — PASS
- Contains `dialogHeader = computed` — PASS
- Contains `mode="basic"` — PASS
- Contains `:auto="false"` — PASS
- Contains `@select="onFileSelect"` — PASS
- Contains `:closable="!isSaving"` — PASS
- Contains `:loading="isSaving"` — PASS
- Contains `:disabled="isSaving"` — PASS
- Does NOT contain `customUpload` — PASS
- Does NOT contain `v-html` — PASS
- Does NOT contain `required_error` — PASS
- Contains `"Vaccine name is required."` — PASS
- Contains `"Date administered is required."` — PASS
- Contains `emit.*created` — PASS
- Contains `emit.*updated` — PASS
- Contains `"File type not supported. Use JPEG, PNG, WebP, or PDF."` — PASS
- Contains `"File too large. Maximum size is 10 MB."` — PASS

## Deviations from Plan

None — plan executed exactly as written.

The `void imageCompression; void dayjs; void pb; void mapToUpdateVaccination;` calls at the bottom of the script block suppress TypeScript/ESLint unused-import warnings for dependencies imported now but wired in Plan 03. This is idiomatic for staged implementation and does not affect runtime behavior.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `onSubmit` — no PocketBase call | ManageVaccination.vue | ~75 | Intentional. Plan 03 adds create/update handlers. Plan 02 only establishes the shell contract. |
| Image EXIF pipeline | ManageVaccination.vue | ~70 | Intentional. Plan 03 adds the canvas EXIF strip + compression pipeline. |

## Threat Surface Scan

No new network endpoints or auth paths introduced. Component is a pure UI shell with no PocketBase calls in this plan. MIME/size validation (T-03-02-02, T-03-02-03) and isSaving double-submit guard (T-03-02-04) implemented as planned. No v-html (T-03-02-05 mitigated).

## Self-Check: PASSED

- `src/components/projects/wallecx/ManageVaccination.vue` exists — FOUND
- Commit `14db449` exists — FOUND
- `npm run type-check` exits 0 — CONFIRMED
