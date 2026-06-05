---
phase: 35
plan: 04
subsystem: wallecx-forms
tags: [forms, dialogs, mobile, colorpicker, datepicker, file-upload, dirty-guard, membership]
dependency_graph:
  requires:
    - 35-01 (BaseMobileDialog.vue + wallecx-overrides.css FD-01/LT-08)
    - 35-02 (ManageExpense migration — reference pattern)
    - 35-03 (ManageBudget migration — reference pattern)
    - 33-02 (useMobileEnv composable)
  provides:
    - ManageMembership migrated to BaseMobileDialog (FD-03/04/05/09 applied)
    - ColorPicker direct v-model + card_color no-hash + {immediate:true} watcher all preserved
    - Reference pattern for ManageVaccination (35-05) — EXIF URL.createObjectURL bridge confirmed working in BaseMobileDialog context
  affects:
    - MembershipsTab.vue (parent — no changes needed; emits unchanged)
tech_stack:
  added: []
  patterns:
    - BaseMobileDialog migration (S-1 collapse, S-2 composable swap) — wave 3 / highest-risk
    - ColorPicker direct v-model invariant preserved (PrimeVue #8135)
    - card_color no-hash round-trip preserved (CON-CARD-COLOR-NO-HASH)
    - record watcher {immediate:true} preserved (Pitfall 3)
    - onRawFileChange bridge (FD-05 camera/gallery images-only → EXIF URL.createObjectURL pipeline)
    - MembershipSnapshot isDirty computed (FD-09)
    - closeWithoutGuard on save/cancel close paths
    - :inline="isMobile" DatePicker (FD-04)
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageMembership.vue
decisions:
  - "pendingFile reset moved to watch(visible, ...) falling edge — same pattern as ManageExpense. Keeps EXIF-pipeline state clean on any close path without a separate onHide handler."
  - "Gallery accept stays images-only (no application/pdf) per Phase 11 D-02 — membership card images are photos, not PDFs. This differs from ManageExpense (receipt) and ManageVaccination (record scan)."
  - "MembershipSnapshot uses individual field refs (not JSON.stringify) because the fields are discrete typed values, not a rows array. Same approach as ManageExpense."
  - "expiryDate dirty comparison uses .toISOString() ?? null to handle null safely — mirrors ManageMembership's existing expiryDate type (Date | null)."
metrics:
  duration_minutes: 15
  completed_date: "2026-05-28"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 35 Plan 04: ManageMembership Migration Summary

**One-liner:** ManageMembership collapsed from dual Dialog/Drawer branches to single BaseMobileDialog — ColorPicker direct v-model (#8135), card_color no-hash (CON-CARD-COLOR-NO-HASH), and {immediate:true} record watcher all preserved; FD-03/04/05/09 applied; 59/59 tests pass.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrate ManageMembership.vue to BaseMobileDialog, preserving ColorPicker + card_color invariants | 1da4b1c | ManageMembership.vue |

---

## What Was Built

### Task 1 — ManageMembership migration (1da4b1c)

**Pattern S-1 collapse:** The ~248-line Dialog branch + ~110-line Drawer branch (including the duplicated form content) were collapsed to a single `<BaseMobileDialog>` instance. The form body (`<form id="manage-membership-form">`) is rendered exactly once in the `#default` slot; Save/Cancel buttons are in the `#actions` slot per UI-SPEC Contract 2.

**Pattern S-2 composable swap:** `useIsMobile` replaced by `useMobileEnv` destructured as `const { isMobile }`.

**INVARIANT — ColorPicker (#8135):** `<ColorPicker v-model="cardColor" aria-label="Card colour picker" :disabled="isSaving" />` stays in the `#default` slot content with its DIRECT v-model binding. `cardColor` ref declared as `const cardColor = ref<string>('002244')` — navy default, no `#`. The preview swatch `<span :style="{ backgroundColor: '#' + cardColor }">` stays. BaseMobileDialog does NOT bind or own `cardColor`.

**INVARIANT — record watcher ({immediate:true}):** The `watch(() => record.value, (rec) => {...}, { immediate: true })` block preserved VERBATIM — including `cardColor.value = rec.card_color ?? '002244'` seed and the else-branch reset to `'002244'`.

**INVARIANT — card_color no-hash (CON-CARD-COLOR-NO-HASH):** `formData.append('card_color', cardColor.value)` remains WITHOUT a `'#' +` prefix. Load logic unchanged. `membershipMapper.ts` not modified.

**FD-09 dirty snapshot:** `MembershipSnapshot` interface + `snapshot` ref taken on `watch(visible, ...)` rising edge. `isDirty` computed compares cardName, barcodeType, barcodeValue, cardNumber, cardColor, expiryDate (ISO string or null), issuer, notes, and `pendingFile !== null`. Passed to `:is-dirty` prop. `closeWithoutGuard()` called on save success and explicit Cancel click. `pendingFile` reset to null on the falling edge of the same `visible` watcher.

**FD-04 DatePicker inline:** Expiry date DatePicker now uses `:inline="isMobile"` + `showButtonBar` (D-35-13 CORRECTED — not `touchUI` which does not exist in PrimeVue 4.5.5).

**FD-05 two-affordance upload (images only):** Mobile shows two label-wrapped hidden file inputs:
- "Take photo" — `accept="image/jpeg,image/png,image/webp"` + `capture="environment"` (rear camera)
- "Choose from gallery" — `accept="image/jpeg,image/png,image/webp"` (NO `application/pdf` — membership card images are photos, not documents per Phase 11 D-02)

Both route through the `onRawFileChange` bridge to the unchanged `onFileSelect` EXIF/URL.createObjectURL/canvas re-encode/imageCompression pipeline. Desktop retains existing `<FileUpload>` (images-only accept).

**FD-03 input attributes (Contract 7 ManageMembership):**
- Card Name: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Barcode Value: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Card Number: `inputmode="numeric" enterkeyhint="next" autocomplete="off"`
- Issuer: `inputmode="text" enterkeyhint="next" autocomplete="off"`
- Notes: `inputmode="text" enterkeyhint="done" autocomplete="off"` (last text field)
- Barcode Type Select / ColorPicker / DatePicker: no inputmode (non-text)

**Style cleanup:** Removed duplicate scoped `:deep(.my-app-dark .p-dialog/.p-drawer)` block — now owned by BaseMobileDialog (extracted in Plan 01).

**Security invariants preserved (T-35-09/T-35-10/T-35-11):** `onFileSelect` body is byte-for-byte unchanged — 10 MB size cap, `['image/jpeg','image/png','image/webp']` MIME allowlist, URL.createObjectURL EXIF canvas re-encode, and browser-image-compression all intact. `formData.append('card_color', cardColor.value)` save path unchanged.

---

## Verification Results

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 59/59 passed (membershipMapper 11/11 green) |
| `npm run build` | Clean — 57 precache entries, 0 "exceeds"/"Skipping precaching" |
| `grep -c "<BaseMobileDialog" ManageMembership.vue` | 1 |
| `<Dialog ` in ManageMembership.vue | 0 |
| `<Drawer ` in ManageMembership.vue | 0 |
| `v-model="cardColor"` present | yes |
| `formData.append('card_color', cardColor.value)` — no '#' prefix | confirmed |
| `{ immediate: true }` in record watcher | confirmed |
| `application/pdf` in gallery accept | 0 (images only) |
| `capture="environment"` present | confirmed |
| `useMobileEnv` imported | confirmed |
| `:inline="isMobile"` on DatePicker | confirmed |
| `inputmode="numeric"` on Card Number | confirmed |
| `enterkeyhint="done"` on Notes | confirmed |
| `closeWithoutGuard` called on save + cancel | confirmed |
| `src/lib/pocketbase/membershipMapper.ts` in diff | NOT in diff (unchanged) |
| `<ConfirmDialog` in wallecx/ | 1 (WallecxApp.vue only) |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None. All form functionality is wired to live data. The two mobile upload buttons route through the EXIF pipeline to PocketBase. The dirty snapshot computes from live field refs.

---

## Threat Flags

No new threat surface introduced. Modified file is a presentation-layer migration:
- T-35-09: card_color Zod `[0-9a-fA-F]{6}` validation + no-hash storage preserved — migration does not touch save/load logic
- T-35-10: onRawFileChange routes through unchanged onFileSelect (size cap + image-only MIME allowlist + EXIF strip) — mitigated
- T-35-11: EXIF strip via URL.createObjectURL/Image canvas re-encode preserved verbatim — mitigated

---

## Self-Check: PASSED

Files exist:
- `src/components/projects/wallecx/ManageMembership.vue` — FOUND

Commits exist:
- `1da4b1c` — FOUND (feat(35-04): migrate ManageMembership to BaseMobileDialog + FD-03/04/05/09)
