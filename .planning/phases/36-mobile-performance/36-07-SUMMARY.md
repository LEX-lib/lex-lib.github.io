---
phase: 36-mobile-performance
plan: "07"
subsystem: wallecx
tags: [performance, preconnect, dns-prefetch, automated-gates, human-verify, phase-close]
dependency_graph:
  requires: [36-01-SUMMARY.md, 36-02-SUMMARY.md, 36-03-SUMMARY.md, 36-04-SUMMARY.md, 36-05-SUMMARY.md, 36-06-SUMMARY.md]
  provides:
    - PocketBase-origin preconnect + dns-prefetch hints in index.html (PF-09)
    - post-phase audit + 20/20 grep audits PASS (NFR/CON invariants)
    - explicit 5-key requestKey invariant in STATE.md (NFR-REQUESTKEY-UNIQUE closed)
    - human-verify checkpoint approval at 390×844 emulation
  affects: [phase 37 (PWA install + standalone polish), phase 38 (UAT sweep + real-device measurements)]
tech_stack:
  added: []
  patterns:
    - "Resource hints in <head>: preconnect FIRST (TLS + DNS), dns-prefetch SECOND (fallback). crossorigin required on preconnect for fetch API."
    - "Token-prop pattern for protected file URLs: parent Tab fetches pb.files.getToken(); Manage* dialog accepts token?: string and passes it to pb.files.getURL (mirrors Memberships/Vaccinations)."
key_files:
  created:
    - .planning/phases/36-mobile-performance/36-07-AUDIT.md
  modified:
    - index.html
    - .planning/STATE.md
    - src/components/projects/wallecx/ManageExpense.vue
    - src/components/projects/wallecx/ExpensesTab.vue
    - src/components/projects/wallecx/MembershipsTab.vue
    - src/components/projects/wallecx/VaccinationsTab.vue
    - src/components/projects/wallecx/VaccinationList.vue
    - src/components/projects/wallecx/VaccinationGroupCard.vue
    - src/components/projects/wallecx/AttachmentPreview.vue
    - src/components/projects/wallecx/ManageMembership.vue
    - src/lib/wallecx/compressToWebP.ts
decisions:
  - "D-36-11 honored: preconnect scope ONLY for https://lexarium-backend.fly.dev — no other origins added (no scope creep)."
  - "LOCKED viewport comment + meta byte-intact verified by grep audit A8."
  - "Fix-forward deviations (3 commits) folded under plan 36-07 — pattern matches Phase 35 close: regressions surfaced during human-verify are fixed in the same plan window when they map directly to the plan's surfaces."
  - "ManageVaccination edit-mode 'Current card' thumbnail explicitly deferred to Phase 38 UAT polish — pre-existing UX gap from Phase 03-02, NOT a Phase 36 regression. (Documented in 36-HUMAN-UAT.md.)"
metrics:
  duration: "spans 2026-05-28 work session (across pause/resume for WebP fix-forwards)"
  completed: "2026-05-28"
  tasks_completed: 4
  tasks_total: 4
  files_modified: 9
requirements_completed: [PF-01, PF-09]
---

# Phase 36 Plan 07: Phase Close — Preconnect + Audit + STATE Update + Human-Verify Summary

**One-liner:** Phase 36 closed with PocketBase-origin preconnect/dns-prefetch hints, a 20/20 grep+gate audit confirming all NFR/CON invariants, the explicit 5-key requestKey invariant in STATE.md, and human-verify approval at 390×844 emulation across all 3 tabs (CLS ≤ 0.1, PF-05 instrumentation present, WebP MIME confirmed, Suspense fallback first-switch-only).

## Plan 36-07 Task Recap

| Task | Type | Result | Commit |
|------|------|--------|--------|
| T1 — index.html preconnect + dns-prefetch | auto | DONE; LOCKED viewport byte-intact | `910ff91` |
| T2 — Post-phase analyze + automated gates + grep audit (`36-07-AUDIT.md`) | auto | DONE; 20/20 audits PASS; gates green; Wallecx route chunk 64.09 KB → 2.13 KB gzip (-96.7%, target -≥50% met 15×) | `512b344` |
| T3 — STATE.md requestKey invariant (5 keys explicit) | auto | DONE | `9358c5c` |
| T4 — Human-verify checkpoint (CLS + PF-05 + WebP MIME + Suspense) | checkpoint:human-verify | APPROVED `yes,yes,yes,yes,yes,yes` post fix-forwards | n/a (paste-back) |

## Fix-Forward Deviations (committed during human-verify)

Three regressions surfaced during the first human-verify pass. All map directly to Phase 36 surfaces (PF-07 WebP migration). Fix-forward under plan 36-07 mirrors the Phase 35 close pattern.

| # | Commit | Issue | Fix |
|---|--------|-------|-----|
| 1 | `79dda03` | PocketBase `?thumb=*` returns 404 for WebP sources; 5 wallecx surfaces broke after PF-07. | `.webp` filename fallback added to: ManageMembership card, VaccinationGroupCard, VaccinationList, AttachmentPreview 400×400, ManageExpense receipt. |
| 2 | `1d9747b` | `compressToWebP` stored WebP bytes under the original `.jpg` filename, so the `.webp` filename check (fix #1) missed receipts. | `compressToWebP` now renames its output to `.webp`; ManageExpense `onFileSelect` uses the helper output directly (drops the post-helper `new File` wrapper that re-applied `.jpg`); ManageExpense receipt thumbnail ALWAYS skips `?thumb` (also covers legacy DB records). |
| 3 | `1bcf697` | Edit Expense "Current receipt" 404 — `pb.files.getURL(record, filename, {})` carried no token; `wallecx_expenses` viewRule is `@request.auth.id != "" && user = @request.auth.id`. Pre-existing latent bug; deterministic after fix #2 removed `?thumb`. | ExpensesTab fetches `manageToken` via `pb.files.getToken()` when openManage runs in edit mode; passes `:token` to `<ManageExpense>`; clears on dialog close. ManageExpense accepts `token?: string` prop and passes `{ token: props.token }` to `pb.files.getURL`. Mirrors MembershipsTab/VaccinationsTab + ManageMembership/ManageVaccination pattern exactly. |
| 4 | `014e8e7` | **Code-review HIGH (`36-REVIEW.md`)** — MembershipsTab shared `fileToken` cleared by detail Dialog's async `@hide` handler AFTER ManageMembership opens, blanking the card-image thumbnail mid-render in edit-from-detail flow. Introduced in Phase 36-04 (`3cc013a`) when `:token="fileToken"` was added without an independent token lifecycle. | Mirrors fix #3 exactly: new `manageToken` ref separate from shared `fileToken`; `openEdit` + `openManage` made async; await `pb.files.getToken()` before opening (graceful fallback on failure); ManageMembership binds `:token="manageToken"`; `watch(showManage)` clears on close. Also picked up the MEDIUM (async openEdit) in the same commit. |

**Total deviations:** 4 fix-forward commits, all in scope (Phase 36 WebP / token-prop surface). No scope creep. Gates re-verified green after each. The 4th was discovered by the post-phase code-review agent (`36-REVIEW.md`, commit `7214b7c`) and resolved before phase close.

## Bundle Reduction (D-36-03) — Phase 36 Final Number

| Metric | Pre-phase (36-BASELINE) | Post-phase (36-07-AUDIT) | Delta | Target |
|--------|------------------------|--------------------------|-------|--------|
| Wallecx route chunk gzip | 64.09 KB | **2.13 KB** | **−96.7%** | ≥50% (met **15×**) |
| Wallecx route chunk raw | 230.21 KB | 5.00 KB | −97.8% | — |

New extracted chunks (gzip): `chart-js` 69.66 KB · `jsbarcode` 11.32 KB · `image-compression` 19.90 KB.

## Automated Gates (final)

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors (exit 0) |
| `npm run test:unit` | **59/59 passing** |
| `npm run lint` | clean except grandfathered `VaccinationDetail.vue:5` |
| `npm run build` | 0 "exceeds" lines, 0 "Skipping precaching" lines (NFR-PWA-PRECACHE-FITS) |
| `npm run analyze` | 3 vendor chunks present + Wallecx route chunk in target range |

## Grep Audit — All 20 PASS

See `36-07-AUDIT.md` for the per-row table. Highlights:
- vite.config.ts LOCKED lines 28/42/86/88 — all 4 byte-intact (A1-A4)
- 3 new vendor groups present (A5)
- index.html preconnect + dns-prefetch + CON-VIEWPORT-FIT byte-intact (A6-A8)
- All 5 mount-path requestKeys distinct (A9-A13), export-path preserved (A14)
- CON-PB-COUNT-BUG — 0 `.getList(` calls introduced (A15)
- CON-CONFIRMDIALOG-SINGLETON — 1 `<ConfirmDialog` at WallecxApp.vue only (A16)
- 0 orphaned `imageCompression()` calls or imports in `wallecx/` Manage*.vue (A17-A18)
- ManageExpense Pitfall-4 fix preserved: `type: 'image/webp'` (A19)
- BR-2: BarcodeDisplay.vue not modified in Phase 36 (A20)

## Human-Verify Checkpoint (Task 4) — Paste-Back

```
1 cold-load Vaccinations CLS≤0.1:                  yes
2 cold-load Memberships CLS≤0.1:                   yes
3 cold-load Expenses (List + Reports) CLS≤0.1:     yes
4 PF-05 console + localStorage write present:       yes
5 WebP upload MIME image/webp + receipt thumbnail:  yes  (post-fix 79dda03 / 1d9747b / 1bcf697)
6 Suspense fallback only on first tab switch:       yes
```

Verified at iPhone 14 Pro 390×844 mobile devtools emulation per Phase 35 D-35-13 precedent.

## WebP Sample Size Delta

Deferred to Phase 38 real-device session (no isolated dev-test pre/post measurement performed during Phase 36 execution — observed in normal usage during human-verify and reduction was visible but not numerically recorded).

## Phase 38 Carry-Overs (acknowledged)

| # | Item | Origin | Note |
|---|------|--------|------|
| 1 | Real-device cellular PF-05 baseline reading | Phase 36 plan (D-35-13 precedent) | Phase 38b conditional virtualization trigger remains PENDING until this read |
| 2 | Real-device CLS visual final-check | Phase 36 plan (D-35-13 precedent) | Cross-tab + cross-device sweep |
| 3 | ManageVaccination edit-mode "Current card" thumbnail | NEW — surfaced during 36-07 human-verify | Pre-existing UX gap from Phase 03-02 (not a Phase 36 regression). Pattern to apply: mirror ManageMembership lines 142-154 (thumbnailUrl computed) + lines 445-454 (template `<img v-if="thumbnailUrl">`). Token plumbing already exists at `VaccinationsTab.vue:468` and was wired through during the same pattern review. |

## Phase 36 Roll-Up — All 7 Plans Complete

| Plan | One-liner | Commit-range head |
|------|-----------|-------------------|
| 36-01 | 5 helpers (WallecxSkeleton, perfInstrument, compressToWebP) + vite.config.ts vendor groups + baseline captured | `62557ee` |
| 36-02 | WallecxApp.vue tabs converted to defineAsyncComponent + Suspense | `76c8677` |
| 36-03 | VaccinationsTab — async ManageVaccination + instrumented getFullList + skeleton consolidation + NEW `vaccinations-getFullList` requestKey | `1b3a0c5` |
| 36-04 | MembershipsTab — async ManageMembership + instrumented getFullList + skeleton consolidation | `61cf00c` |
| 36-05 | ExpensesTab — async ManageExpense + instrumented expenses/budgets/categories getFullList + 2 skeleton consolidations | `6e4a6b8` |
| 36-06 | WebP migration in all 3 Manage* upload paths via shared compressToWebP helper | `242cce6` |
| 36-07 | Preconnect + dns-prefetch + post-phase audit + STATE.md 5-key invariant + human-verify | _this summary_ |

### Phase 36 Functional Requirements (all 6 PF — satisfied)

| Req | Plan(s) | Evidence |
|-----|---------|----------|
| PF-01 | 36-01 + 36-07 | Pre/post bundle visualizer comparison; 64.09 KB → 2.13 KB recorded |
| PF-02 | 36-02 + 36-03/04/05 | 3 tabs + 3 Manage dialogs async-loaded; Wallecx route chunk −96.7% |
| PF-04 | 36-01 + 36-03/04/05 | WallecxSkeleton 5 variants → 5 inline skeletons consolidated + 6 Suspense fallbacks; CLS ≤ 0.1 confirmed at 390×844 across all 3 tabs |
| PF-05 | 36-01 + 36-03/04/05 | instrumentedGetFullList wraps all 5 mount-path collections; localStorage `wallecx:perf-baseline` + console.info verified |
| PF-07 | 36-01 + 36-06 (+ fix-forwards) | 3 Manage* upload paths produce WebP-typed Files via shared compressToWebP; MIME confirmed `image/webp` in human-verify |
| PF-09 | 36-07 | preconnect + dns-prefetch hints to https://lexarium-backend.fly.dev present in index.html |

### Bound NFR/CON Gates — All Preserved

- **NFR-PWA-PRECACHE-FITS** — 0 "exceeds" / 0 "Skipping precaching" in `npm run build`
- **NFR-REQUESTKEY-UNIQUE** — closed for VaccinationsTab; all 5 mount-path keys explicit in STATE.md
- **CON-PB-COUNT-BUG** — 0 new `.getList(` calls introduced
- **CON-VIEWPORT-FIT** — LOCKED viewport comment + meta byte-intact (A8)
- **CON-CONFIRMDIALOG-SINGLETON** — 1 `<ConfirmDialog` at WallecxApp.vue (A16)
- **CON-CARD-COLOR-NO-HASH** — ManageMembership ColorPicker direct v-model untouched
- **BR-2** — BarcodeDisplay.vue not modified this phase (A20)

### vite.config.ts LOCKED lines

Lines 28/42/86/88 — all byte-intact (A1-A4 grep audit).

## Next Phase Readiness

- Wallecx mobile performance milestone v4.3 wave 36 closes here. Wave 37 begins: **PWA Install + Standalone Polish** (`/gsd-discuss-phase 37`).
- Phase 38 picks up: real-device PF-05 baseline, real-device CLS final-check, Phase 38b virtualization trigger evaluation, ManageVaccination current-card thumbnail UX gap (now logged in `36-HUMAN-UAT.md`).
- No blockers carried into 37. The phase-37 plan does not depend on the deferred real-device measurements.

---
*Phase: 36-mobile-performance*
*Completed: 2026-05-28*
