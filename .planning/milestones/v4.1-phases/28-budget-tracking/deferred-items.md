# Phase 28 — Deferred Items

Out-of-scope issues encountered during execution that are NOT caused by current task changes.

## Pre-existing lint error

- **File:** `src/components/projects/wallecx/VaccinationDetail.vue:5`
- **Error:** `'props' is assigned a value but never used  @typescript-eslint/no-unused-vars`
- **Discovered during:** Plan 28-01 Task 3 (`npm run lint` post-mapper-creation)
- **Last touched commit:** `b42194d refactor(12-02): make AttachmentPreview generic; update VaccinationDetail call site`
- **Reason deferred:** Unrelated to Phase 28 budget tracking; introduced in Phase 12. Per executor scope boundary, only fix issues directly caused by current task changes.
- **Suggested follow-up:** Address in a dedicated lint-cleanup plan or alongside future VaccinationDetail.vue work.
