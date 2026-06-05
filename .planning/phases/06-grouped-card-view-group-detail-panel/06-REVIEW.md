---
phase: 06-grouped-card-view-group-detail-panel
reviewed: 2026-05-12T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/projects/wallecx/VaccinationGroupCard.vue
  - src/components/projects/wallecx/VaccinationGroupPanel.vue
  - src/components/projects/wallecx/WallecxApp.vue
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-05-12T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed for the grouped card view and group detail panel feature. The overall implementation is sound: grouping logic is correct, the Drawer/panel lifecycle is properly guarded with `v-if`, token refresh is handled, and the delete/create flows maintain descending sort order. One logic bug was found in `onUpdated` — a missing re-sort after editing a record's `date_administered` field. Three info-level items cover an unused prop, redundant explicit imports, and an inline multi-statement event handler.

---

## Warnings

### WR-01: `onUpdated` does not re-sort records after edit — stale `latestRecord` on cards

**File:** `src/components/projects/wallecx/WallecxApp.vue:174-177`

**Issue:** `onCreated` (line 169) re-sorts `records.value` after insertion to maintain descending `date_administered` order. `onUpdated` replaces the record in-place but never re-sorts. The `groupedVaccinations` computed (line 46) assumes `recs[0]` is the most-recent record per group. If the user edits a record's `date_administered` to an earlier or later date, the group card will display a stale "Last administered" date and potentially the wrong thumbnail until the page is reloaded.

**Fix:** Add the same sort call used in `onCreated` after splicing the updated record in:

```ts
function onUpdated(updatedRecord: Vaccinations): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id);
  if (idx !== -1) records.value[idx] = updatedRecord;
  // Re-sort to keep date_administered descending, so latestRecord (recs[0]) stays accurate
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
}
```

---

## Info

### IN-01: `listToken` prop in `VaccinationGroupPanel` is declared but never used

**File:** `src/components/projects/wallecx/VaccinationGroupPanel.vue:6-8`

**Issue:** The `listToken` prop is declared in `defineProps` with a comment acknowledging it is unused ("included for API consistency; unused in Drawer columns"). It is passed from `WallecxApp.vue` line 282 but serves no function. This is dead data-flow — the prop is computed and bound for no effect, and its presence may mislead future maintainers into thinking it is needed.

**Fix:** If there is no concrete plan to use `listToken` in this panel (e.g., for future thumbnail rendering), remove it from both the `defineProps` declaration and the parent's `:list-token` binding. If it is a forward-looking placeholder, add a `// TODO(phase-N): used when thumbnail column is added` comment to make intent explicit.

---

### IN-02: `VaccinationGroupCard` and `VaccinationGroupPanel` are explicitly imported in `WallecxApp.vue` despite being auto-registered globally

**File:** `src/components/projects/wallecx/WallecxApp.vue:9-10`

**Issue:** `components.d.ts` confirms that `VaccinationGroupCard` (line 68) and `VaccinationGroupPanel` (line 69) are registered as global components by `unplugin-vue-components`. The same file also globally registers `VaccinationDetail`, `ConfirmDialog`, `Dialog`, `Drawer`, `ManageVaccination`, etc. — all of which are used in `WallecxApp.vue` without explicit imports. The two new explicit imports are redundant and inconsistent with the prevailing pattern in the codebase.

**Fix:** Remove the two import lines:

```ts
// Remove these — they are auto-imported globally
// import VaccinationGroupCard from "./VaccinationGroupCard.vue";
// import VaccinationGroupPanel from "./VaccinationGroupPanel.vue";
```

Note: `ManageVaccination` (line 8) has the same redundancy but is pre-existing; fixing it is optional and out of this phase's scope.

---

### IN-03: Inline multi-statement `@hide` handler on Dialog

**File:** `src/components/projects/wallecx/WallecxApp.vue:307`

**Issue:** The Dialog's `@hide` handler contains two statements chained with a semicolon: `selectedRecord = null; fileToken = ''`. Inline multi-statement handlers are harder to read, cannot be easily tested, and resist future extension without refactoring.

**Fix:** Extract to a named function:

```ts
function onDetailHide(): void {
  selectedRecord.value = null;
  fileToken.value = "";
}
```

```html
<Dialog ... @hide="onDetailHide">
```

---

_Reviewed: 2026-05-12T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
