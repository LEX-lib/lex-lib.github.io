---
phase: 35
plan: 05
subsystem: wallecx-forms
tags: [forms, dialogs, mobile, datepicker, file-upload, dirty-guard, vaccination, exif]
dependency_graph:
  requires:
    - 35-01 (BaseMobileDialog.vue + wallecx-overrides.css FD-01/LT-08)
    - 35-02 (ManageExpense migration — reference pattern)
    - 35-03 (ManageBudget migration — reference pattern)
    - 35-04 (ManageMembership migration — EXIF URL.createObjectURL bridge confirmed)
    - 33-02 (useMobileEnv composable)
  provides:
    - ManageVaccination migrated to BaseMobileDialog (FD-03/04/05/09 applied)
    - administeredDate direct v-model + [visible, record] tuple watch {immediate:true} preserved (D-33-01-A / #8191)
    - Two-Form collapse confirmed safe via Vue provide/inject through slot boundary (RESEARCH Pitfall 4)
    - Final migration complete — all 4 Manage dialogs now render through BaseMobileDialog
  affects:
    - VaccinationsTab.vue (parent — no changes needed; emits unchanged)
tech_stack:
  added: []
  patterns:
    - BaseMobileDialog migration (S-1 collapse, S-2 composable swap) — wave 4 / final migration
    - administeredDate direct v-model invariant preserved (D-33-01-A / PrimeVue #8191)
    - [visible, record] tuple watch {immediate:true} preserved (Pitfall 5)
    - manual dateAdministeredError required-check in onSubmit preserved
    - onRawFileChange bridge (FD-05 camera images-only + gallery images+PDF)
    - VaccinationSnapshot isDirty computed (FD-09)
    - closeWithoutGuard on save/cancel close paths
    - :inline="isMobile" DatePicker showButtonBar (FD-04)
    - pendingFile reset moved to watch(visible, ...) falling edge (same as ManageMembership)
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageVaccination.vue
decisions:
  - "Two <Form> instances collapsed to ONE: the Dialog branch Form (~225) and Drawer branch Form (~343) rendered identical markup; BaseMobileDialog hosts the Device split internally; ONE Form in #default slot is correct. Vue's provide/inject for @primevue/forms follows DOM parentage through the slot boundary (RESEARCH Pitfall 4)."
  - "pendingFile reset moved to watch(visible, ...) falling edge — same pattern as ManageMembership/ManageExpense. Keeps EXIF-pipeline state clean on any close path without a separate onHide handler."
  - "Gallery accept includes application/pdf (vaccination cards can be scanned PDFs). Camera input remains images-only (capture=environment cannot produce PDFs). This differs from ManageMembership (images-only per Phase 11 D-02)."
  - "VaccinationSnapshot reads from initialValues computed rather than individual field refs — vaccination form uses @primevue/forms Form (not direct v-model per field), so initialValues is the canonical field-value source at open time."
  - "administeredDate is included in VaccinationSnapshot via administeredDate.value?.toISOString() ?? null — the only direct-v-model field outside the Form, consistent with its invariant status."
  - "Form rendered with id='manage-vaccination-form' so the external Save button in #actions slot can target it via form='manage-vaccination-form'. PrimeVue Form component passes unknown attrs to its underlying <form> element via Vue attr inheritance."
metrics:
  duration_minutes: 12
  completed_date: "2026-05-28"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 35 Plan 05: ManageVaccination Migration Summary

**One-liner:** ManageVaccination collapsed from dual Dialog/Drawer Form branches to single BaseMobileDialog — administeredDate direct v-model (#8191 / D-33-01-A) and [visible,record] tuple watch {immediate:true} preserved verbatim; two-Form collapse confirmed safe; FD-03/04/05/09 applied; 59/59 tests pass.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrate ManageVaccination.vue to BaseMobileDialog, collapse two Forms to one, preserve administeredDate invariant | c21b5d3 | ManageVaccination.vue |

---

## What Was Built

### Task 1 — ManageVaccination migration (c21b5d3)

**Pattern S-1 collapse (two-Form → one-Form):** The ~109-line Dialog branch (including its `<Form>`) and ~99-line Drawer branch (including its duplicate `<Form>`) were collapsed to a single `<BaseMobileDialog>` instance. ONE `<Form>` body lives in the `#default` slot; Save/Cancel buttons are in the `#actions` slot per UI-SPEC Contract 2. This is safe because: (a) `v-if/v-else` ensured mutual exclusivity — only one Form was ever mounted; (b) Vue's provide/inject for `@primevue/forms` follows DOM parentage through the slot boundary (RESEARCH Pitfall 4); (c) both branches had byte-identical Form markup.

**Pattern S-2 composable swap:** `useIsMobile` replaced by `useMobileEnv` destructured as `const { isMobile }`.

**INVARIANT — administeredDate (#8191 / D-33-01-A, Pitfall 5):** `administeredDate = ref<Date | null>(null)` stays declared in ManageVaccination. Its DatePicker uses DIRECT `v-model="administeredDate"` and is NOT `name`-bound to `@primevue/forms` — it sits inside the Form's visual layout but bypasses the Form's field registry. The `[visible, record]` tuple watch is preserved VERBATIM:
```typescript
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, rec]) => {
    if (!isVisible) return;
    administeredDate.value = rec ? new Date(rec.date_administered) : null;
    dateAdministeredError.value = '';
  },
  { immediate: true },
);
```
Manual `dateAdministeredError` required-check in `onSubmit` preserved unchanged.

**FD-09 dirty snapshot:** `VaccinationSnapshot` interface + `snapshot` ref taken on `watch(visible, ...)` rising edge. `isDirty` computed compares all 7 form fields (via `initialValues` computed) + `administeredDate.value?.toISOString() ?? null` + `pendingFile !== null`. Passed to `:is-dirty` prop. `pendingFile` reset on falling edge of the same `visible` watcher (same pattern as ManageMembership). `closeWithoutGuard()` called on save success and explicit Cancel click.

**FD-04 DatePicker inline:** `<DatePicker v-model="administeredDate" :inline="isMobile" fluid dateFormat="dd M yy" showButtonBar :disabled="isSaving" />` — D-35-13 CORRECTED (not `touchUI`).

**FD-05 two-affordance upload (images + PDF for vaccination records):** Mobile shows two label-wrapped hidden file inputs:
- "Take photo" — `accept="image/jpeg,image/png,image/webp"` + `capture="environment"` (rear camera, images only — camera cannot produce PDFs)
- "Choose from gallery" — `accept="image/jpeg,image/png,image/webp,application/pdf"` (includes PDF — vaccination cards can be scanned documents)

Both route through the `onRawFileChange` bridge to the unchanged `onFileSelect` EXIF/URL.createObjectURL/canvas re-encode/imageCompression pipeline. Desktop retains existing `<FileUpload>` (images+PDF accept).

**FD-03 input attributes (Contract 7 ManageVaccination):**
- Vaccine Type: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Vaccine Name: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Dose Number InputNumber: `inputmode="numeric" enterkeyhint="next" autocomplete="off"`
- Lot Number: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Manufacturer: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Location: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Notes Textarea: `inputmode="text" enterkeyhint="done" autocomplete="off"` (last text field)
- DatePicker: no inputmode (date picker, not text)

**Style cleanup:** Removed duplicate scoped `:deep(.my-app-dark .p-dialog/.p-drawer)` block — now owned by BaseMobileDialog (extracted in Plan 01).

**Form id wiring:** `<Form id="manage-vaccination-form" ...>` allows the external Save button (`form="manage-vaccination-form"`) in the `#actions` slot to trigger form submission across the slot boundary. PrimeVue Form passes unknown attrs to the underlying `<form>` element via Vue attr inheritance.

**Security invariants preserved (T-35-12/T-35-13/T-35-14):**
- T-35-12: Manual `dateAdministeredError` required-check in onSubmit is preserved; dirty guard governs dismissal only — cannot bypass save validation.
- T-35-13: `onRawFileChange` routes through unchanged `onFileSelect` (10 MB size cap + MIME allowlist incl. PDF + EXIF strip) — byte-for-byte unchanged.
- T-35-14: EXIF strip via URL.createObjectURL/Image canvas re-encode preserved verbatim.

---

## Verification Results

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 59/59 passed |
| `npm run build` | Clean — 57 precache entries, 0 "exceeds"/"Skipping precaching" |
| `grep -c "<BaseMobileDialog" ManageVaccination.vue` | 1 |
| `grep -c "<Form" ManageVaccination.vue` | 1 (two collapsed to one) |
| `<Dialog ` in ManageVaccination.vue | 0 |
| `<Drawer` in ManageVaccination.vue | 0 |
| `v-model="administeredDate"` direct (not name-bound) | confirmed |
| `[visible.value, record.value] as const` tuple watch | confirmed |
| `{ immediate: true }` in tuple watch | confirmed |
| `application/pdf` in gallery accept | confirmed |
| `capture="environment"` present | confirmed |
| `useMobileEnv` imported | confirmed |
| `:inline="isMobile"` on DatePicker | confirmed |
| `inputmode="numeric"` on Dose Number | confirmed |
| `enterkeyhint="done"` on Notes | confirmed |
| `closeWithoutGuard` called on save + cancel | confirmed |
| `<ConfirmDialog` in wallecx/ | 1 (WallecxApp.vue only) |
| ManageVaccination.vue lint | 0 errors (VaccinationDetail.vue:5 is grandfathered) |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None. All form functionality is wired to live data. The two mobile upload buttons route through the EXIF pipeline to PocketBase. The dirty snapshot computes from live field refs and `initialValues`.

---

## Threat Flags

No new threat surface introduced. Modified file is a presentation-layer migration:
- T-35-12: Manual `dateAdministeredError` required-check in onSubmit preserved — dirty guard does not bypass save validation.
- T-35-13: `onRawFileChange` routes through unchanged `onFileSelect` (size cap + MIME allowlist + EXIF strip) — mitigated.
- T-35-14: EXIF strip via URL.createObjectURL/Image canvas re-encode preserved verbatim — mitigated.

---

## Self-Check: PASSED

Files exist:
- `src/components/projects/wallecx/ManageVaccination.vue` — FOUND

Commits exist:
- `c21b5d3` — FOUND (feat(35-05): migrate ManageVaccination to BaseMobileDialog + FD-03/04/05/09)
