---
phase: 06-grouped-card-view-group-detail-panel
fixed_at: 2026-05-12T00:00:00Z
review_path: .planning/phases/06-grouped-card-view-group-detail-panel/06-REVIEW.md
iteration: 1
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 06: Code Review Fix Report

**Fixed at:** 2026-05-12T00:00:00Z
**Source review:** .planning/phases/06-grouped-card-view-group-detail-panel/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 1 (WR-01 only; IN-01, IN-02, IN-03 excluded by fix_scope: critical_warning)
- Fixed: 1
- Skipped: 0

## Fixed Issues

### WR-01: `onUpdated` does not re-sort records after edit — stale `latestRecord` on cards

**Files modified:** `src/components/projects/wallecx/WallecxApp.vue`
**Commit:** 40221f2
**Applied fix:** Added the same `records.value.sort((a, b) => dayjs(b.date_administered).diff(dayjs(a.date_administered)))` call used in `onCreated` immediately after the in-place splice in `onUpdated`. This keeps the `records` array in descending `date_administered` order so that `groupedVaccinations` computed's assumption that `recs[0]` is the most-recent record per group remains correct after any edit that changes `date_administered`.

---

_Fixed: 2026-05-12T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
