# Phase 36 — Audit (Plan 36-07)

**Run:** 2026-05-28

## Bundle Reduction (D-36-03)

| Metric | Pre-phase | Post-phase | Delta |
|--------|-----------|------------|-------|
| Wallecx route chunk gzip | 64.09 KB | 2.13 KB | -96.7% |

Reduction target met: **YES** (target was ≤ 32 KB; actual 2.13 KB — exceeded by 15×)

New extracted chunks (gzip):
- chart-js-CtAnzIgd.js: 69.66 KB gzip
- jsbarcode-BFRzlDv_.js: 11.32 KB gzip
- image-compression-BrYFZKRI.js: 19.90 KB gzip

WallecxApp raw: 5.00 KB (was 230.21 KB pre-phase); gzip: 2.13 KB (was 64.09 KB pre-phase)

Notes: The codeSplitting groups (chart-js/jsbarcode/image-compression at priority 25, Plan 36-01)
plus the async tab splits (WallecxApp.vue defineAsyncComponent, Plan 36-02) plus the async
dialog splits (ManageVaccination/ManageMembership/ManageExpense, Plans 36-03/04/05) all
contributed to the 96.7% reduction in the Wallecx route chunk.

## NFR-PWA-PRECACHE-FITS (`npm run build`)

- "exceeds" matches: 0
- "Skipping precaching" matches: 0
- Precache entries: 73 (plain build) / 74 (analyze build — stats.html included in analyze mode only)
- All chunks within 3 MiB maximumFileSizeToCacheInBytes limit
- Build output confirms 500 kB advisory warning is from vendor/primevue chunks (expected; these chunks
  existed pre-phase and are within the 3 MiB Workbox limit)

## Automated Gates

| Gate | Result |
|------|--------|
| npm run type-check | 0 errors (exit 0) |
| npm run test:unit | 59/59 passing |
| npm run lint | 1 error: VaccinationDetail.vue:5 — grandfathered; no new errors |

## Grep Audit

| # | Audit | Command | Result | Pass |
|---|-------|---------|--------|------|
| A1 | registerType LOCKED byte-intact | `Select-String vite.config.ts 'registerType: "prompt"'` | 1 match | PASS |
| A2 | scope LOCKED byte-intact | `Select-String vite.config.ts 'scope: "/"'` | 1 match | PASS |
| A3 | maximumFileSizeToCacheInBytes LOCKED | `Select-String vite.config.ts 'maximumFileSizeToCacheInBytes: 3'` | 1 match | PASS |
| A4 | navigateFallback LOCKED byte-intact | `Select-String vite.config.ts 'navigateFallback: "index.html"'` | 1 match | PASS |
| A5 | vite.config new chunk groups | `Select-String vite.config.ts 'chart-js\|jsbarcode\|image-compression'` | 3 matches | PASS |
| A6 | index.html preconnect | `Select-String index.html 'rel="preconnect".*lexarium-backend.fly.dev'` | 1 match | PASS |
| A7 | index.html dns-prefetch | `Select-String index.html 'rel="dns-prefetch".*lexarium-backend.fly.dev'` | 1 match | PASS |
| A8 | viewport CON-VIEWPORT-FIT byte-intact | `Select-String index.html 'viewport-fit=cover, interactive-widget=resizes-content'` | 1 match | PASS |
| A9 | VaccinationsTab vaccinations-getFullList requestKey | `Select-String VaccinationsTab.vue 'vaccinations-getFullList'` | 1 match | PASS |
| A10 | MembershipsTab memberships-getFullList preserved | `Select-String MembershipsTab.vue 'memberships-getFullList'` | 1 match | PASS |
| A11 | ExpensesTab expenses-getFullList preserved | `Select-String ExpensesTab.vue 'expenses-getFullList'` | 1 match | PASS |
| A12 | ExpensesTab expense-budgets-getFullList preserved | `Select-String ExpensesTab.vue 'expense-budgets-getFullList'` | 1 match | PASS |
| A13 | ExpensesReportsView expense-categories-getFullList preserved | `Select-String ExpensesReportsView.vue 'expense-categories-getFullList'` | 1 match | PASS |
| A14 | ExpensesTab expenses-export preserved (out-of-scope) | `Select-String ExpensesTab.vue 'expenses-export'` | 1 match | PASS |
| A15 | CON-PB-COUNT-BUG — no new getList calls | `Get-ChildItem wallecx/ *.vue -Recurse \| Select-String 'pb\.collection.*\.getList\('` | 0 matches | PASS |
| A16 | ConfirmDialog singleton | `Get-ChildItem wallecx/ *.vue -Recurse \| Select-String '<ConfirmDialog'` | 1 match (WallecxApp.vue) | PASS |
| A17 | No orphaned imageCompression() calls in Manage*.vue | `Get-ChildItem wallecx/ Manage*.vue -Recurse \| Select-String 'imageCompression\('` | 0 matches | PASS |
| A18 | No orphaned imageCompression imports | `Get-ChildItem wallecx/ *.vue -Recurse \| Select-String 'import imageCompression from'` | 0 matches | PASS |
| A19 | ManageExpense Pitfall-4 fix (type: 'image/webp') | `Select-String ManageExpense.vue "type: 'image/webp'"` | 1 match | PASS |
| A20 | BR-2 BarcodeDisplay untouched (Phase 36) | `git diff --name-only HEAD~20 HEAD -- BarcodeDisplay.vue` | 0 lines (not modified) | PASS |

**All 20 audits PASS: YES**

## WebP Sample Size Delta

Deferred to Phase 38 real-device session (no dev-test upload performed during Phase 36 execution).
The compressToWebP helper enforces: maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: false,
fileType: 'image/webp', exifOrientation: -1 (strips EXIF/location data).
