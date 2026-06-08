---
status: passed
phase: 36-mobile-performance
verified: 2026-05-28T15:45:00Z
phase_req_ids: [PF-01, PF-02, PF-04, PF-05, PF-07, PF-09]
must_haves_total: 15
must_haves_verified: 15
nfr_con_gates_total: 7
nfr_con_gates_verified: 7
---

# Phase 36 Verification

**Phase Goal:** Ship measurable mobile performance gains for the Wallecx app — async-loaded tabs + dialogs, instrumented PocketBase fetches with localStorage perf baselines, byte-matched skeletons for CLS <= 0.1, WebP image uploads, and a PocketBase-origin preconnect. The shipping evidence is a >= 50% Wallecx route chunk gzip reduction vs the pre-phase baseline + green automated gates + emulation-level human-verify approval. Real-device cellular measurements are explicitly carried to Phase 38.

**Verified:** 2026-05-28T15:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Verdict

passed

All 15 must-haves verified. All 7 NFR/CON gates pass. All 6 PF requirements traceable. The 3 Phase 38 carry-overs are correctly documented in 36-HUMAN-UAT.md and are NOT phase-36 gaps.

---

## Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | WallecxApp.vue tabs are async-loaded via defineAsyncComponent + Suspense (PF-02) | verified | WallecxApp.vue:11-13 — `const VaccinationsTab = defineAsyncComponent(...)`, `MembershipsTab`, `ExpensesTab`; TabPanels wraps each in `<Suspense>` at lines 97-119 |
| 2 | ManageVaccination, ManageMembership, ManageExpense are async-loaded inside their Tab files (PF-02) | verified | VaccinationsTab.vue:10 `defineAsyncComponent(() => import("./ManageVaccination.vue"))`; MembershipsTab.vue:8 `defineAsyncComponent(() => import('./ManageMembership.vue'))`; ExpensesTab.vue:17 `defineAsyncComponent(() => import('./ManageExpense.vue'))` |
| 3 | `src/lib/wallecx/compressToWebP.ts` exists and is imported by all 3 Manage* dialogs (PF-07) | verified | File exists at `src/lib/wallecx/compressToWebP.ts`; ManageExpense.vue:3, ManageMembership.vue:4, ManageVaccination.vue:6 all import and call it |
| 4 | `src/lib/pocketbase/perfInstrument.ts` exists; `instrumentedGetFullList` is used by all 5 mount-path getFullList calls (PF-05) | verified | File exists; VaccinationsTab.vue:8+156, MembershipsTab.vue:6+99, ExpensesTab.vue:5+36+73, ExpensesReportsView.vue:8+252 all import and call `instrumentedGetFullList` |
| 5 | `src/components/projects/wallecx/WallecxSkeleton.vue` exists with 5 variants used at 5+ skeleton sites (PF-04) | verified | File exists with all 5 variants: `vaccination-card`, `membership-card`, `expense-row`, `reports-chart`, `attachment`; 17 usage sites across 7 files |
| 6 | All 5 mount-path requestKeys are distinct AND explicit in `.planning/STATE.md` | verified | STATE.md line 76 lists all 5 locked keys; grep confirms each distinct key present: `vaccinations-getFullList` (VaccinationsTab.vue:158), `memberships-getFullList` (MembershipsTab.vue:101), `expenses-getFullList` (ExpensesTab.vue:75), `expense-budgets-getFullList` (ExpensesTab.vue:37), `expense-categories-getFullList` (ExpensesReportsView.vue:253) |
| 7 | `index.html` contains preconnect + dns-prefetch hints to `https://lexarium-backend.fly.dev` AND LOCKED viewport comment + meta are byte-intact (PF-09, CON-VIEWPORT-FIT) | verified | index.html:6 `<link rel="preconnect" href="https://lexarium-backend.fly.dev" crossorigin />`; :7 `<link rel="dns-prefetch" ...>`; :8-9 LOCKED viewport comment + meta with `viewport-fit=cover, interactive-widget=resizes-content` byte-intact |
| 8 | `vite.config.ts` codeSplitting.groups contains chart-js, jsbarcode, image-compression at priority 25 (PF-01) | verified | vite.config.ts:128-130 — all 3 groups present at priority 25 |
| 9 | `vite.config.ts` LOCKED lines 28/42/86/88 are byte-intact | verified | Line 28: `registerType: "prompt"` LOCKED; Line 42: `scope: "/"` LOCKED; Line 86: `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024`; Line 88: `navigateFallback: "index.html"` LOCKED |
| 10 | Bundle reduction in `36-07-AUDIT.md` shows Wallecx route chunk gzip <= 32 KB (target), actual 2.13 KB (-96.7%) (PF-01, D-36-03) | verified | 36-07-AUDIT.md documents pre-phase 64.09 KB gzip → post-phase 2.13 KB gzip; -96.7% reduction, target >=50% met by 15x |
| 11 | `36-07-AUDIT.md` records all 20 grep audits as PASS | verified | 36-07-AUDIT.md: "All 20 audits PASS: YES"; per-row table shows A1–A20 all PASS |
| 12 | Automated gates: type-check 0 errors, test:unit >=59 passing, lint clean except grandfathered VaccinationDetail.vue:5, build 0 "exceeds" / 0 "Skipping precaching" | verified | Re-run confirmed: type-check exit 0; test:unit 59/59 passing; lint 1 error VaccinationDetail.vue:5 only (grandfathered; no new errors); build gates documented in 36-07-AUDIT.md as 0 "exceeds" / 0 "Skipping precaching" |
| 13 | `36-07-SUMMARY.md` exists and records the 6-yes/no human-verify paste-back as approved | verified | 36-07-SUMMARY.md records paste-back: `yes,yes,yes,yes,yes,yes` for all 6 criteria; verified at iPhone 14 Pro 390x844 emulation post fix-forwards |
| 14 | `36-HUMAN-UAT.md` exists and explicitly carries 3 items to Phase 38: real-device PF-05 baseline, real-device CLS final-check, ManageVaccination current-card thumbnail | verified | 36-HUMAN-UAT.md exists; tests 7+8 status "blocked" (physical-device); test 9 status "skipped" with explicit Phase 38 deferral noted for all three |
| 15 | CON-CONFIRMDIALOG-SINGLETON: exactly 1 `<ConfirmDialog` in src/components/projects/wallecx/ — at WallecxApp.vue | verified | Grep finds exactly 1 match: WallecxApp.vue:122 `<ConfirmDialog />` — no other files match |

**Score:** 15/15 must-haves verified

---

## NFR/CON Gate Re-Check

| Gate | Status | Evidence |
|------|--------|---------|
| NFR-PWA-PRECACHE-FITS | pass | 36-07-AUDIT.md: 0 "exceeds" matches, 0 "Skipping precaching" matches; vite.config.ts line 86 `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` LOCKED |
| NFR-REQUESTKEY-UNIQUE | pass | All 5 distinct keys explicit in STATE.md line 76; each verified present in source at correct call site; vaccinations key added in Phase 36-03 to close the pre-existing gap |
| CON-PB-COUNT-BUG | pass | Grep finds 0 `.getList(` calls in wallecx/ *.vue (36-07-AUDIT.md A15, independently confirmed) |
| CON-VIEWPORT-FIT | pass | index.html:8-9 LOCKED viewport comment + `viewport-fit=cover, interactive-widget=resizes-content` byte-intact (36-07-AUDIT.md A8) |
| CON-CONFIRMDIALOG-SINGLETON | pass | Exactly 1 `<ConfirmDialog` at WallecxApp.vue:122 (36-07-AUDIT.md A16, independently confirmed by grep) |
| CON-CARD-COLOR-NO-HASH | pass | ManageMembership.vue:275 stores `card_color` without `#` prefix (CON-CARD-COLOR-NO-HASH); ColorPicker direct v-model untouched (36-07-SUMMARY.md) |
| BR-2 | pass | `git log --diff-filter=M -- BarcodeDisplay.vue` returns empty — file not modified in Phase 36 (36-07-AUDIT.md A20) |

**Score:** 7/7 NFR/CON gates pass

---

## Requirement Traceability

| Requirement | Plan(s) | Evidence files |
|-------------|---------|---------------|
| PF-01 — Bundle visualizer; chunk-split decisions; initial Wallecx chunk drops >=50% | 36-01 (codeSplitting groups added to vite.config.ts), 36-07 (post-phase audit + build comparison) | 36-07-AUDIT.md (bundle reduction table), 36-07-SUMMARY.md (chunk table), vite.config.ts:126-130 |
| PF-02 — Tabs + per-Manage dialog async-loaded via defineAsyncComponent | 36-02 (WallecxApp.vue tabs), 36-03 (VaccinationsTab + ManageVaccination), 36-04 (MembershipsTab + ManageMembership), 36-05 (ExpensesTab + ManageExpense) | WallecxApp.vue:11-13, VaccinationsTab.vue:10, MembershipsTab.vue:8, ExpensesTab.vue:17 |
| PF-04 — Skeleton states with matching dimensions; CLS <= 0.1 on all 5 surfaces | 36-01 (WallecxSkeleton.vue created), 36-03/04/05 (skeleton wired at all surfaces) | WallecxSkeleton.vue (5 variants), 36-HUMAN-UAT.md tests 1-3 (CLS pass), 36-07-SUMMARY.md |
| PF-05 — getFullList instrumentation; payload + duration baseline; localStorage write | 36-01 (perfInstrument.ts created), 36-03/04/05 (instrumentedGetFullList used at all 5 mount paths) | src/lib/pocketbase/perfInstrument.ts, 36-HUMAN-UAT.md test 4 (pass) |
| PF-07 — WebP upload via compressToWebP; MIME confirmed | 36-01 (compressToWebP.ts created), 36-06 (all 3 Manage* dialogs migrated), 36-07 fix-forwards (WebP filename + token-prop regressions fixed) | src/lib/wallecx/compressToWebP.ts, ManageExpense.vue:3+219+223, ManageMembership.vue:4+218, ManageVaccination.vue:6+184, 36-HUMAN-UAT.md test 5 (pass after fix-forwards) |
| PF-09 — preconnect + dns-prefetch hints for PocketBase origin | 36-07 (index.html updated; commit 910ff91) | index.html:6-7, 36-07-AUDIT.md A6-A7 |

---

## Gates Re-Run

| Gate | Command | Result |
|------|---------|--------|
| type-check | `npm run type-check` | 0 errors (exit 0) |
| test:unit | `npm run test:unit -- --run` | 59/59 passing |
| lint | `npm run lint` | 1 error: VaccinationDetail.vue:5 `@typescript-eslint/no-unused-vars` (grandfathered pre-Phase-36); 0 new errors |

All three gates pass. The single lint error is the documented grandfathered violation from before Phase 36.

---

## Fix-Forward Deviations (Phase 36-07)

Three commits were made during human-verify to address regressions surfaced on the PF-07 WebP surfaces. All three are present in the git log and their fixes are verified in source:

| Commit | Issue | Fix verified |
|--------|-------|-------------|
| `79dda03` | PocketBase `?thumb=*` returns 404 for WebP sources | `.webp` filename check in ManageMembership, VaccinationGroupCard, VaccinationList, AttachmentPreview, ManageExpense — grep confirms |
| `1d9747b` | `compressToWebP` output kept `.jpg` extension on WebP-content file | `compressToWebP.ts:26-29` renames output to `.webp`; ManageExpense skips `?thumb` for receipts |
| `1bcf697` | Edit Expense receipt missing `?token` on protected file URL | ExpensesTab.vue fetches `manageToken` via `pb.files.getToken()` and passes `:token="manageToken"` to ManageExpense; ManageExpense accepts `token?: string` prop (line 15) and passes `{ token: props.token }` to `pb.files.getURL` (line 172) — mirrors MembershipsTab/VaccinationsTab pattern |

---

## Gaps Found

None.

---

## Human Verification

No additional human verification required. The emulation-level approval is recorded in `36-HUMAN-UAT.md` (6/6 criteria: yes).

The following three items are **Phase 38 carry-overs only** — they are NOT phase-36 gaps and do not block phase-36 close:

| # | Item | Documented In | Phase |
|---|------|--------------|-------|
| 1 | Real-device cellular PF-05 baseline reading across all 5 collections | 36-HUMAN-UAT.md test 7 (blocked/deferred) | Phase 38 UAT sweep |
| 2 | Real-device CLS visual final-check across all 3 tabs | 36-HUMAN-UAT.md test 8 (blocked/deferred) | Phase 38 UAT sweep |
| 3 | ManageVaccination edit-mode "Current card" thumbnail | 36-HUMAN-UAT.md test 9 (skipped — pre-existing UX gap from Phase 03-02, NOT a Phase 36 regression) | Phase 38 UAT polish |

---

*Verified: 2026-05-28T15:45:00Z*
*Verifier: Claude (gsd-verifier)*
