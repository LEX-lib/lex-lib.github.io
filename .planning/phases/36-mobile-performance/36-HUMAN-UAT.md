---
status: partial
phase: 36-mobile-performance
source: [36-07-SUMMARY.md, 36-07-AUDIT.md]
started: 2026-05-28T00:00:00Z
updated: 2026-05-28T07:00:00Z
---

## Current Test

[testing complete for emulation pass — real-device tests deferred to Phase 38]

## Tests

### 1. Cold-load Vaccinations tab CLS ≤ 0.1
expected: skeleton (3 cards, byte-matched dims) → real cards swap in with no jarring reflow; CLS observer reports no shift > 0.1
result: pass
context: iPhone 14 Pro 390×844 mobile devtools emulation, Fast 3G throttle

### 2. Cold-load Memberships tab CLS ≤ 0.1
expected: skeleton → real cards swap in; CLS ≤ 0.1
result: pass
context: iPhone 14 Pro 390×844 mobile devtools emulation, Fast 3G throttle

### 3. Cold-load Expenses tab (List + Reports) CLS ≤ 0.1
expected: expense-row skeleton → real rows (List); period chart skeleton → real chart (Reports); CLS ≤ 0.1
result: pass
context: iPhone 14 Pro 390×844 mobile devtools emulation, Fast 3G throttle

### 4. PF-05 console log + localStorage write present
expected: 5 `[wallecx:perf]` console.info lines (one per collection on first session interaction); `wallecx:perf-baseline` JSON in Local Storage with 5 collection entries
result: pass

### 5. WebP upload MIME image/webp + edit-dialog receipt thumbnail renders
expected: upload Content-Type `image/webp`; Edit Expense "Current receipt" thumbnail renders (post fix-forward `79dda03` / `1d9747b` / `1bcf697`)
result: pass
notes: |
  Initially failed (#5 paste-back "no") for two regressions discovered during human-verify:
  1. ?thumb 404s on WebP sources (fixed `79dda03`).
  2. compressToWebP stored WebP bytes under .jpg filename, so .webp filename check missed receipts (fixed `1d9747b`).
  3. Edit Expense Current receipt 404 — missing ?token on protected file URL (fixed `1bcf697` — same plan window, matches Memberships/Vaccinations token-prop pattern).
  Re-tested after `1bcf697`; both sub-criteria pass.

### 6. Suspense fallback visible only on first tab switch
expected: skeleton on first switch to a tab (chunk download); subsequent switches show content immediately (PrimeVue Tabs `display:none`)
result: pass

### 7. Real-device cellular PF-05 baseline reading
expected: real-device PF-05 baseline numbers recorded across all 5 mount-path collections under real cellular conditions
result: blocked
blocked_by: physical-device
reason: |
  Deferred per Phase 35 D-35-13 precedent — emulation approval sufficient for Phase 36 close.
  Phase 38 UAT sweep is the formal home for this measurement.
  Phase 38b conditional virtualization trigger remains PENDING until this read.

### 8. Real-device CLS visual final-check
expected: cross-tab + cross-device CLS observation under real cellular conditions (no jarring reflow on any cold-load surface)
result: blocked
blocked_by: physical-device
reason: |
  Deferred per Phase 35 D-35-13 precedent — emulation approval at 390×844 confirmed CLS ≤ 0.1
  on tests 1-3. Real-device final-check is a Phase 38 UAT sweep item.

### 9. Edit Vaccination "Current card" thumbnail renders in edit mode
expected: when an existing record has a card_image, the Edit Vaccination dialog displays a thumbnail above the upload buttons (parity with Memberships card preview + Expenses receipt preview)
result: skipped
reason: |
  Pre-existing UX gap from Phase 03-02 (`14db449 feat(03-02): create ManageVaccination.vue`) — NOT a
  Phase 36 regression. Confirmed via `git log -S 'thumbnailUrl' -- ManageVaccination.vue` returning empty.
  Surfaced during 36-07 human-verify visual sweep but out of scope for Phase 36 PF-01..PF-09.
  Explicitly deferred to Phase 38 UAT polish per user decision.
  Implementation pattern when picked up: mirror `ManageMembership.vue` lines 142-154 (thumbnailUrl computed)
  + 445-454 (`<img v-if="thumbnailUrl">` block). Token plumbing already exists at
  `VaccinationsTab.vue:468` (`:token="fileToken"` is passed but currently ignored — ManageVaccination
  has no defineProps).

## Summary

total: 9
passed: 6
issues: 0
pending: 0
skipped: 1
blocked: 2

## Gaps

- truth: "Real-device cellular PF-05 baseline reading recorded across all 5 mount-path collections"
  status: deferred
  reason: "Deferred to Phase 38 UAT sweep per Phase 35 D-35-13 precedent (emulation approval sufficient for in-phase close)"
  severity: minor
  test: 7
  root_cause: "Physical-device unavailable during Phase 36 work window"
  artifacts: []
  missing: ["real-device cellular PF-05 measurement", "Phase 38b virtualization trigger evaluation depends on this read"]
  debug_session: ""

- truth: "Real-device CLS visual final-check across all 3 tabs"
  status: deferred
  reason: "Deferred to Phase 38 UAT sweep per Phase 35 D-35-13 precedent; emulation CLS at 390×844 already approved (tests 1-3)"
  severity: minor
  test: 8
  root_cause: "Physical-device unavailable during Phase 36 work window"
  artifacts: []
  missing: ["real-device CLS observation under real cellular conditions"]
  debug_session: ""

- truth: "Edit Vaccination dialog shows current card_image thumbnail in edit mode"
  status: deferred
  reason: "Pre-existing UX gap from Phase 03-02, NOT a Phase 36 regression. User explicitly chose Phase 38 polish deferral."
  severity: cosmetic
  test: 9
  root_cause: "ManageVaccination.vue has never rendered a current-card thumbnail (git -S 'thumbnailUrl' returns empty back to commit 14db449)"
  artifacts: ["src/components/projects/wallecx/ManageVaccination.vue"]
  missing: ["thumbnailUrl computed (mirror ManageMembership.vue:142-154)", "<img v-if=\"thumbnailUrl\"> template block (mirror ManageMembership.vue:445-454)", "defineProps<{ token?: string }>() — VaccinationsTab.vue:468 already passes :token=\"fileToken\""]
  debug_session: ""
