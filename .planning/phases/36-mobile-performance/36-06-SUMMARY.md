---
phase: 36-mobile-performance
plan: "06"
subsystem: wallecx
tags: [performance, webp, image-compression, refactor]
dependency_graph:
  requires: [36-01-SUMMARY.md]
  provides: [compressToWebP adoption in all 3 Manage dialogs]
  affects: [ManageExpense.vue, ManageMembership.vue, ManageVaccination.vue]
tech_stack:
  added: []
  patterns:
    - "shared compressToWebP helper replaces 3 inline imageCompression({...}) call blocks"
    - "Pitfall 4 fix: new File wrapper type updated to 'image/webp' in ManageExpense"
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageExpense.vue
    - src/components/projects/wallecx/ManageMembership.vue
    - src/components/projects/wallecx/ManageVaccination.vue
decisions:
  - "D-36-09 honored: EXIF strip stays inline per-file (3 implementations differ; unification out of scope)"
  - "D-36-10 honored: fileType: 'image/webp' lives in the shared helper; callers only call compressToWebP(strippedFile)"
  - "Pitfall 4 closed: ManageExpense new File wrapper changes type from file.type to 'image/webp'; ManageMembership/Vaccination assign File directly (helper returns image/webp already)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-28"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 36 Plan 06: WebP Migration — ManageExpense/Membership/Vaccination Summary

**One-liner:** Migrated 3 inline `imageCompression({maxSizeMB:1.5, maxWidthOrHeight:2048, useWebWorker:true})` blocks to the shared `compressToWebP(strippedFile)` helper; fixed Pitfall 4 MIME mismatch in ManageExpense's `new File` wrapper.

## What Was Done

Replaced the byte-identical `imageCompression(strippedFile, { ... })` call in each of the three Manage dialogs with a single call to the `compressToWebP` helper introduced in Plan 36-01. The helper centralizes the option block and adds `fileType: 'image/webp'` (D-36-10). Each file's direct `import imageCompression from 'browser-image-compression'` was removed.

### Per-file changes

| File | Import change | Call change | Assignment | Pitfall 4 |
|------|--------------|-------------|------------|-----------|
| ManageExpense.vue | `imageCompression` → `compressToWebP` | 4-line block → 1 line | `new File([compressed], file.name, { type: 'image/webp' })` | Fixed — was `file.type` |
| ManageMembership.vue | `imageCompression` → `compressToWebP` | 4-line block → 1 line | `pendingFile.value = compressed` (direct, no wrapper) | N/A |
| ManageVaccination.vue | `imageCompression` → `compressToWebP` | 4-line block → 1 line | `pendingFile.value = compressed` (direct, no wrapper) | N/A |

### Invariants preserved (all verified)

- PDF bypass (`if (file.type === 'application/pdf')`) byte-intact in ManageExpense and ManageVaccination
- EXIF strip (canvas re-encode in ManageExpense; Image+objectURL in ManageMembership+ManageVaccination) byte-intact in all 3
- `toast.info('Location data removed.')` byte-intact in all 3
- ColorPicker direct v-model in ManageMembership (PrimeVue #8135) untouched
- `card_color` no-hash invariant (CON-CARD-COLOR-NO-HASH) untouched
- `administeredDate` direct v-model in ManageVaccination (D-33-01-A) untouched
- `{ immediate: true }` record watcher in ManageMembership untouched
- Phase 35 D-35-05 gallery PDF support in ManageVaccination untouched
- Single ConfirmDialog at WallecxApp.vue shell level — unchanged

## Grep Audit Results

All 3 files: 0 `imageCompression(` calls remaining (verified post-commit).
All 3 files: 0 `import imageCompression from` lines remaining.
ManageExpense.vue: 1 `{ type: 'image/webp' }` (Pitfall 4 closed).
ManageExpense.vue + ManageVaccination.vue: PDF bypass lines present.

## Gates

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 59/59 passed (membershipMapper 11 green) |
| `npm run lint` | Clean except grandfathered VaccinationDetail.vue:5 (pre-existing) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Surface Scan

T-36-15 (PDFs compressed): Mitigated — PDF early-return byte-intact in ManageExpense and ManageVaccination; verified by grep.
T-36-16 (EXIF retained): Mitigated — EXIF strip stays inline per-file; helper receives already-stripped File.
T-36-17 (MIME mismatch): Mitigated — ManageExpense File wrapper updated to `'image/webp'`; ManageMembership/Vaccination assign helper File directly (type is already `image/webp`).

No new threat surface introduced.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 — ManageExpense | 15ad3f3 | feat(36-06): migrate ManageExpense to compressToWebP helper; fix Pitfall 4 |
| 2 — ManageMembership | fa31147 | feat(36-06): migrate ManageMembership to compressToWebP helper |
| 3 — ManageVaccination | 5e12e97 | feat(36-06): migrate ManageVaccination to compressToWebP helper |

## Self-Check: PASSED

- ManageExpense.vue modified: confirmed
- ManageMembership.vue modified: confirmed
- ManageVaccination.vue modified: confirmed
- All 3 task commits exist: 15ad3f3, fa31147, 5e12e97
- 0 `imageCompression(` calls in Manage*.vue: confirmed
- Pitfall 4 fix (`'image/webp'` in ManageExpense File wrapper): confirmed
