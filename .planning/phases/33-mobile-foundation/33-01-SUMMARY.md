---
phase: 33-mobile-foundation
plan: 01
subsystem: infra
tags: [vue, primevue, version-bump, datepicker, primevue-forms, dependency-baseline]

# Dependency graph
requires:
  - phase: 32-decouple-budgets
    provides: stable v4.2 baseline (49/49 test floor, grandfathered VaccinationDetail.vue:5 lint exception)
provides:
  - One clean v4.3 version baseline — Vue 3.5.34 + PrimeVue 4.5.5 lockstep (primevue + @primevue/auto-import-resolver + @primevue/forms)
  - FND-04 delivered — every later v4.3 phase builds against the bumped Vue/PrimeVue
  - Established pattern (D-33-01-A) — NEW Form-bound DatePickers in PrimeVue 4.4.0+ must use direct v-model, NOT @primevue/forms initialValues
affects: [34-layout-audit, 35-forms-dialogs, 36-mobile-performance, 37-pwa-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct v-model ref for Form-bound DatePicker (PrimeVue Forms #8191/#7806 workaround) — seeded on dialog-open via visible+record watch, validated manually"
    - "Lockstep PrimeVue version pin — primevue, @primevue/auto-import-resolver, @primevue/forms all at the same minor (^4.5.x)"

key-files:
  created: []
  modified:
    - "package.json — 4 version-string bumps (vue, primevue, @primevue/forms, @primevue/auto-import-resolver)"
    - "src/components/projects/wallecx/ManageVaccination.vue — date_administered moved from @primevue/forms binding to direct v-model ref (administeredDate)"

key-decisions:
  - "PrimeVue stays at 4.5.5 — no pin-back (D-07 fix-forward posture). The DatePicker regression was fixed in consuming code, not by reverting the bump."
  - "ManageVaccination date_administered binds via direct v-model ref, not @primevue/forms — PrimeVue Forms 4.4.0+ ignores initialValues/setFieldValue for a Form-bound DatePicker (primefaces/primevue#8191, #7806). This is the reliable binding path and matches the existing ManageExpense.vue / ManageMembership.vue pattern."

patterns-established:
  - "D-33-01-A: Any NEW Form-bound DatePicker on the v4.3 PrimeVue 4.5.5 baseline must use a direct v-model ref (seeded on dialog-open, manually required-validated) instead of @primevue/forms initialValues, until primefaces/primevue#8191 is fixed upstream."

requirements-completed: [FND-04]

# Metrics
duration: ~2h (incl. human-verify smoke-test wait + fix-forward)
completed: 2026-05-27
---

# Phase 33 Plan 01: Vue + PrimeVue Lockstep Version Baseline Summary

**Bumped Vue 3.5.18→3.5.34 (patch) and PrimeVue 4.3.7→4.5.5 (minor) lockstep with @primevue/auto-import-resolver + @primevue/forms, establishing one clean v4.3 baseline; the 4.5 smoke-test surfaced a PrimeVue Forms DatePicker regression (#8191/#7806) that was fixed-forward by rebinding ManageVaccination's date field to a direct v-model ref.**

## Performance

- **Duration:** ~2h (includes human-verify smoke-test wait + fix-forward)
- **Started:** 2026-05-27 (Task 1 committed 15:40 +0800)
- **Completed:** 2026-05-27
- **Tasks:** 2 (Task 1 auto, Task 2 checkpoint:human-verify — PASSED)
- **Files modified:** 2 (package.json, ManageVaccination.vue)

## Accomplishments

- **FND-04 delivered:** four version-string bumps in `package.json`, all in lockstep:
  - `vue` `^3.5.18` → `^3.5.34` (patch, dependencies)
  - `primevue` `^4.3.7` → `^4.5.5` (minor, dependencies)
  - `@primevue/forms` `^4.3.9` → `^4.5.5` (lockstep, dependencies)
  - `@primevue/auto-import-resolver` `^4.3.7` → `^4.5.5` (lockstep, devDependencies)
- **Automated gate green on the bumped baseline:** `npm run type-check` exit 0; `npm run build` exit 0 (57 precache entries, no "exceeds"/"Skipping precaching" lines — NFR-PWA-PRECACHE-FITS holds); `npm run test:unit` 49/49 (5 files); `npm run lint` clean except the pre-existing grandfathered `VaccinationDetail.vue:5` error (consistent with v4.2 close).
- **One clean version baseline established for the whole v4.3 milestone** — no mixed Vue-new/PrimeVue-old state; Plans 33-02 and 33-03 build against the bumped Vue/PrimeVue.
- **6-surface manual smoke-test + #7465 dark-mode no-flash PASSED** (user re-verified after the fix-forward): Drawer, Dialog, ManageExpense DatePicker (touchUI), FileUpload (capture), MultiSelect, ColorPicker direct-v-model all working; dark-mode Dialog + Drawer open with no white-flash (#7465 override intact across the 4.3→4.5 minor).

## Task Commits

1. **Task 1: Bump Vue + PrimeVue lockstep + automated gate** — `931aef0` (feat)
2. **Task 2: Fix-forward — ManageVaccination DatePicker rebind** — `2acd29f` (fix) *(surfaced during the Task 2 human-verify smoke-test)*

In-progress tracking commit: `dcc27b8` (docs — marked plan in-progress, paused at Task 2 checkpoint).

**Plan metadata:** committed with this SUMMARY (docs: complete plan).

## Files Created/Modified

- `package.json` — four dependency version-string bumps (vue, primevue, @primevue/forms, @primevue/auto-import-resolver) to the v4.3 baseline. No other dependency churn; `vite-plugin-pwa` untouched; `vite.config.ts` untouched.
- `src/components/projects/wallecx/ManageVaccination.vue` — `date_administered` pulled out of the `@primevue/forms` Form into a direct v-model ref (`administeredDate`), seeded on the dialog-open rising edge via a `[visible, record]` watch, with manual required-validation in `onSubmit` (`dateAdministeredError`). DatePicker template binding changed from `name="date_administered"` (Form-bound) to `v-model="administeredDate"`. Form `initialValues` no longer carries `date_administered`.

## Decisions Made

- **PrimeVue stays at 4.5.5 — no pin-back.** Per D-07 fix-forward posture, the regression was fixed within this plan in consuming code rather than by reverting the minor bump or splitting the baseline.
- **date_administered binds via direct v-model, not @primevue/forms.** This is the reliable binding path on the 4.5 baseline and mirrors the already-established `expenseDate` / `expiryDate` direct-v-model pattern in `ManageExpense.vue` and `ManageMembership.vue`.

## Deviations from Plan

### Auto-fixed Issues

**1. [D-33-01-A — Rule 1 Bug] PrimeVue Forms DatePicker initial-value regression on the 4.3→4.5 minor**
- **Found during:** Task 2 (D-08 manual PrimeVue smoke-test on the bumped baseline)
- **Issue:** PrimeVue Forms 4.4.0+ ignores `initialValues` / `setFieldValue` for a Form-bound DatePicker (primefaces/primevue#8191, #7806). On the 4.5.5 baseline, opening ManageVaccination in **Edit** mode rendered the "Date Administered" field **blank** — the stored `date_administered` was no longer hydrated into the Form-controlled DatePicker. This is a functional regression directly caused by this plan's minor bump.
- **Fix:** Pulled `date_administered` out of `@primevue/forms` into a direct v-model ref (`administeredDate`), seeded on the dialog-open rising edge via a `() => [visible.value, record.value]` watch (reading `record` so Add → empty and Edit → stored date stay in sync, and re-seeding on every open rather than only on record change), with manual required-validation in `onSubmit`. Mirrors the existing `expenseDate`/`expiryDate` direct-v-model pattern in ManageExpense.vue / ManageMembership.vue. PrimeVue left at 4.5.5 (no pin-back, per D-07).
- **Files modified:** `src/components/projects/wallecx/ManageVaccination.vue`
- **Verification:** Post-fix automated gate — type-check 0, test:unit 49/49, build 0, lint clean except grandfathered VaccinationDetail.vue:5. User re-verified the smoke-test and replied "approved": Edit Vaccination now shows the stored date; Add validates a required empty date; the other 5 PrimeVue surfaces + #7465 dark-mode no-flash all pass.
- **Committed in:** `2acd29f`

---

**Total deviations:** 1 auto-fixed (1 bug — Rule 1, regression introduced by the planned bump).
**Impact on plan:** The fix was required for correctness (Edit mode rendered a blank date). It stayed within the plan's fix-forward mandate (D-07) — no PrimeVue pin-back, no baseline split, no scope creep. Touched only the one consuming component the regression affected.

## Issues Encountered

- The PrimeVue 4.4.0+ Forms DatePicker regression (above) was the only issue. Resolved via the direct-v-model rebind; no other PrimeVue surface regressed on the minor bump.

## Forward-Looking Note (Phase 35 — Forms & Dialogs / BaseMobileDialog rollout)

- When `ManageVaccination.vue` is migrated to `BaseMobileDialog` in Phase 35, the date field is **already a direct v-model ref (`administeredDate`)**, NOT Form-bound — the migration must preserve this binding, the dialog-open seed watch, and the manual `dateAdministeredError` validation. Do not attempt to fold the date back into `@primevue/forms`.
- **Broader rule (D-33-01-A):** Any NEW Form-bound DatePicker introduced on the v4.3 PrimeVue 4.5.5 baseline must use a direct v-model ref (seeded on dialog-open, manually required-validated) instead of `@primevue/forms` `initialValues`, until primefaces/primevue#8191 is fixed upstream. This now applies uniformly to all four Manage dialogs' date fields (ManageExpense, ManageMembership, ManageVaccination already conform; ManageBudget has no date field).

## Scope Confirmation

- **`useIsMobile.ts`, `App.vue`, and `vite.config.ts` were NOT touched by this plan.** Those are owned by Plan 33-02 (FND-01/02 useMobileEnv + App.vue beforeinstallprompt listener) and Plan 33-03 (FND-03 visualizer / vite.config.ts) respectively — file ownership kept clean for the strictly-sequential package.json waves.
- `git diff` for this plan touches exactly `package.json` (4 version strings) and `ManageVaccination.vue` (the fix-forward). No other dependency churn; `vite-plugin-pwa` unchanged.

## Next Phase Readiness

- v4.3 dependency baseline is locked: Plan 33-02 (`useMobileEnv` + App.vue `beforeinstallprompt`) and Plan 33-03 (visualizer) build against Vue 3.5.34 + PrimeVue 4.5.5.
- Both 33-02 and 33-03 modify `package.json` → must run sequentially after this plan (no parallel package.json edits). No blockers.

## Self-Check: PASSED

- `package.json` modified — FOUND (commit 931aef0, 4 version-string bumps verified in commit stat)
- `src/components/projects/wallecx/ManageVaccination.vue` modified — FOUND (direct v-model `administeredDate` confirmed at lines 28, 50-58, 253)
- Commit `931aef0` (Task 1) — FOUND
- Commit `2acd29f` (Task 2 fix-forward) — FOUND
- Automated gate re-confirmed on HEAD: type-check exit 0; test:unit 49/49 (5 files) — VERIFIED

---
*Phase: 33-mobile-foundation*
*Completed: 2026-05-27*
