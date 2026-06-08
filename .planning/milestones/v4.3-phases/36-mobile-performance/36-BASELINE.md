# Phase 36 — Pre-Phase Bundle Baseline

**Captured:** 2026-05-28
**Command:** `npm run analyze` (cross-env ANALYZE=true vite build)
**Report:** dist/stats.html (treemap, gzip+brotli)

## Wallecx Route Chunk

- **gzip size (pre-split):** 64.09 KB
- **raw size (pre-split):** 230.21 KB

## Top contributors inside the Wallecx route chunk

Note: chart.js lands in its own auto-generated chunk (`auto-DTj6_RAu.js`) because PrimeVue
imports it via dynamic `import('chart.js/auto')` at mount. jsbarcode and browser-image-compression
are currently co-bundled INTO WallecxApp due to the lack of explicit rolldown groups.

- WallecxApp-DE6uJHzW.js (main Wallecx route chunk) — 230.21 KB raw / **64.09 KB gzip**
- auto-DTj6_RAu.js (chart.js auto, PrimeVue dynamic import) — 203.09 KB raw / 69.60 KB gzip
- primevue-Co7j6cPu.js — 897.88 KB raw / 197.44 KB gzip
- vendor-BGSCCN9K.js (vue/pinia/router) — 2,574.41 KB raw / 849.99 KB gzip
- leaflet-B8H1xo4r.js — 173.20 KB raw / 49.48 KB gzip

Note: jsbarcode (~50 KB) and browser-image-compression (~30 KB) are bundled inside
WallecxApp-DE6uJHzW.js (not shown as separate chunks pre-split).

## All chunks pre-split (name → gzip)

| Chunk | gzip KB |
|-------|---------|
| WallecxApp-DE6uJHzW.js | 64.09 KB |
| auto-DTj6_RAu.js (chart.js) | 69.60 KB |
| primevue-Co7j6cPu.js | 197.44 KB |
| vendor-BGSCCN9K.js | 849.99 KB |
| leaflet-B8H1xo4r.js | 49.48 KB |
| pdf-DtMpRYIg.js | 96.78 KB |
| quill-DwxVAAY-.js | 55.46 KB |
| ApiPlaygroundApp-BfD-VSVn.js | 28.88 KB |
| schemas-iVEU7330.js | 16.96 KB |
| pocketbase-DkI2TF0M.js | 10.35 KB |
| index-C7NpV73x.js | 11.81 KB |

## Reduction target

Post-phase Wallecx route chunk gzip MUST be ≤ floor(64 * 0.5) KB = **≤ 32 KB** gzip.
Recorded at phase close in 36-SUMMARY.md (Plan 36-07).

The three rolldown codeSplitting groups added in Plan 36-01 (chart-js, jsbarcode,
image-compression at priority 25) plus the async tab/dialog defineAsyncComponent splits
in Plans 36-02/36-03 are the primary mechanism for achieving this reduction.

## Post-Plan-36-01 interim measurement (codeSplitting groups only)

After adding the 3 codeSplitting groups (chart-js/jsbarcode/image-compression at priority 25),
a plain `npm run build` shows the WallecxApp chunk has ALREADY dropped to:

- **WallecxApp raw (post-groups):** 113.95 KB (was 230.21 KB, -50.5%)
- **WallecxApp gzip (post-groups):** 32.81 KB (was 64.09 KB, -48.8%)
- chart-js-*.js (extracted): 203.21 KB raw / 69.66 KB gzip
- jsbarcode-*.js (extracted): 64.22 KB raw / 11.32 KB gzip
- image-compression-*.js (extracted): 51.91 KB raw / 19.90 KB gzip

This interim result nearly meets the ≤32 KB target already. Plans 36-02/36-03
(async tab/dialog splits) will push it below 32 KB definitively.
