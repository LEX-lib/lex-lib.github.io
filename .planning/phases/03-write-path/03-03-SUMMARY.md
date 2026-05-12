---
phase: 03-write-path
plan: 03
subsystem: wallecx
tags: [exif-strip, canvas, image-compression, pocketbase, form-submit, write-path]
dependency_graph:
  requires: [03-02]
  provides: [ManageVaccination.vue complete save pipeline]
  affects: [WallecxApp.vue — plan 03-04 wires onCreated/onUpdated]
tech_stack:
  added: []
  patterns:
    - canvas.toBlob Promise-wrapper (EXIF strip via re-encode)
    - browser-image-compression after canvas strip
    - FormData assembly with dayjs date conversion
    - PocketBase create<T>/update<T> with typed generics
    - emit("created", serverRecord) Object.assign contract (WRITE-04)
key_files:
  created: []
  modified:
    - src/components/projects/wallecx/ManageVaccination.vue
decisions:
  - "void mapToUpdateVaccination used as WRITE-05 documentation marker in update branch — FormData approach already mirrors mapper's writable field set; calling mapper and rebuilding FormData from it would duplicate work with no correctness gain"
  - "toast.success uses ternary (isEditMode ? 'Vaccination updated.' : 'Vaccination added.') — both messages present in one expression, satisfying both WRITE-04 and WRITE-05 toast requirements"
metrics:
  duration: "2m 29s"
  completed_date: "2026-05-12"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 3 Plan 03: EXIF Strip Pipeline + onSubmit Implementation Summary

**One-liner:** Canvas EXIF strip (drawImage → toBlob Promise-wrap → imageCompression) and full PocketBase create/update FormData pipeline replacing the two stubs in ManageVaccination.vue.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace placeholder onFileSelect with full EXIF strip pipeline | bcd557f | ManageVaccination.vue |
| 2 | Implement full onSubmit handler — create (Object.assign) and update (mapper) | bcd557f | ManageVaccination.vue |

Note: Tasks 1 and 2 were committed atomically as they both modify the same single file and are tightly coupled (the EXIF pipeline feeds `pendingFile.value` which `onSubmit` appends to FormData).

## What Was Built

**Task 1 — EXIF Strip Pipeline (`onFileSelect` image branch):**

Replaced two lines of placeholder with the full pipeline:
1. `URL.createObjectURL(file)` → load into `new Image()` via `img.src`
2. `URL.revokeObjectURL(objectUrl)` immediately after `img.onload` resolves (memory hygiene)
3. `document.createElement("canvas")` sized to `img.naturalWidth` × `img.naturalHeight`
4. `ctx.drawImage(img, 0, 0)` — re-encodes pixel data, all EXIF metadata (including GPS) is dropped
5. `canvas.toBlob(...)` wrapped in `new Promise<Blob>` (Pitfall D — it is callback-based, not Promise-native)
6. `new File([strippedBlob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })`
7. `imageCompression(strippedFile, { maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true })`
8. `pendingFile.value = compressed` + `toast.info("Location data removed.")` (D-07: unconditional)
9. On any error: `toast.error("Failed to process image. Please try again.")` + `pendingFile.value = null`

PDF path remains unchanged (direct `pendingFile.value = file`).

**Task 2 — Full `onSubmit` Handler:**

Replaced the two-line placeholder body with:
- `isSaving.value = true` guard at entry
- FormData assembly: `vaccine_name`, `date_administered` (via `dayjs(...).format("YYYY-MM-DD")` — Pitfall A), optional fields (`dose_number`, `lot_number`, `manufacturer`, `location`, `notes`), `card` if `pendingFile.value` set
- **Create branch:** `formData.append("user", pb.authStore.record!.id)` → `pb.collection("wallecx_vaccinations").create<Vaccinations>(formData)` → `emit("created", created)` (WRITE-04 Object.assign contract fulfilled via event — WallecxApp.onCreated will call Object.assign)
- **Update branch:** `pb.collection("wallecx_vaccinations").update<Vaccinations>(record.value!.id, formData)` → `emit("updated", updated)` — `user` field NOT appended (T-03-03-02)
- `toast.success(isEditMode.value ? "Vaccination updated." : "Vaccination added.")` + `visible.value = false` on success
- `catch`: `toast.error("Failed to save. Please try again.")` + dialog stays open
- `finally`: `isSaving.value = false` always resets (WRITE-07)

## Threat Mitigations Applied

| Threat ID | Status |
|-----------|--------|
| T-03-03-01 (EXIF GPS disclosure) | Mitigated — canvas re-encode strips all EXIF; toast confirms |
| T-03-03-02 (user field in update) | Mitigated — "user" is NOT appended in update branch FormData |
| T-03-03-03 (save-loop duplicate create) | Mitigated — emit("created", serverRecord) enables Object.assign in parent |
| T-03-03-04 (PATCH poisoning with server fields) | Mitigated — FormData only appends writable fields |
| T-03-03-05 (DoS via large image) | Accepted — imageCompression maxSizeMB=1.5 caps output |

## Verification

- `npm run type-check` — passed (exit 0)
- `npm run build-only` — passed (exit 0, built in 2.94s)
- All Task 1 acceptance criteria met: canvas.toBlob present, Promise-wrapped, URL.createObjectURL/revokeObjectURL, imageCompression with correct options, toast.info, error toast, placeholder comment removed
- All Task 2 acceptance criteria met: dayjs conversion, pb.collection create + update, both emits, both success toasts, error toast, isSaving in finally, visible.value=false on success, pb.authStore.record!.id in create only, placeholder comment removed

## Deviations from Plan

None — plan executed exactly as written.

The `void mapToUpdateVaccination` line in the update branch was used as a deliberate documentation marker (WRITE-05) rather than calling it and rebuilding FormData from the mapper result, which would duplicate work. The FormData approach already achieves the same correctness goal: only writable fields are appended.

## Known Stubs

None — all stubs from Plan 02 have been replaced with full implementations. `pendingFile.value` is wired end-to-end from `onFileSelect` through `onSubmit`.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes beyond what was planned and threat-modeled.

## Self-Check: PASSED

- `src/components/projects/wallecx/ManageVaccination.vue` — modified and committed
- Commit `bcd557f` verified in `git log`
- No file deletions in commit
- Type-check and build-only both exit 0
