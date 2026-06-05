---
phase: 16-membership-card-toolbar
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/projects/wallecx/WallecxToolbar.vue
  - src/components/projects/wallecx/VaccinationsTab.vue
  - src/components/projects/wallecx/MembershipsTab.vue
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the shared `WallecxToolbar` component (new in this phase), `VaccinationsTab` (existing — integrating the toolbar), and `MembershipsTab` (existing — integrating the toolbar).

`WallecxToolbar.vue` is well-structured. It correctly uses one-way `:value` + `@input` on `InputText` (compatible with v-model passthrough from parent), guards the view-toggle button behind `v-if="showToggle"`, and has adequate ARIA labels and touch targets.

`VaccinationsTab.vue` integration is clean. The toolbar binding, conditional `showToggle` logic, and sessionStorage persistence pattern are all correct. No issues found in this file.

`MembershipsTab.vue` has two notable issues: one is a Vue runtime bug (v-model applied to a string literal), and one is a misleading prop pass that could cause stale-token reads in the edit flow.

---

## Warnings

### WR-01: v-model applied to a string literal — runtime write-back will silently fail

**File:** `src/components/projects/wallecx/MembershipsTab.vue:183`

**Issue:** `v-model:view-mode="'grid'"` binds to the string literal `'grid'`. Vue's v-model writes back via `update:viewMode` emission. Since a string literal is not a reactive reference, the write-back target is invalid. Vue will emit a runtime warning ("Extraneous non-emits event listeners") and discard the update. This is harmless only because `showToggle` is `false` and the toggle button never fires — but it is a semantic error that will trip up future developers and will surface as a Vue warning in the browser console.

The correct pattern when `viewMode` is fixed and the toggle is disabled is a plain one-way binding.

**Fix:**
```html
<!-- Before (incorrect — v-model on a literal): -->
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
  v-model:view-mode="'grid'"
  :sort-options="membershipSortOptions"
  :show-toggle="false"
/>

<!-- After (correct — one-way bind for the fixed value): -->
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
  :view-mode="'grid'"
  :sort-options="membershipSortOptions"
  :show-toggle="false"
/>
```

---

### WR-02: Stale `fileToken` passed to `ManageMembership` when opening "Add card" flow

**File:** `src/components/projects/wallecx/MembershipsTab.vue:276`

**Issue:** `ManageMembership` receives `:token="fileToken"`. The `fileToken` ref is only populated inside `openDetail` (when a card with a `card_image` is opened). When a user opens "Add card" directly via `openManage(null)` (line 174), `fileToken` retains whatever value it held from the last `openDetail` call in the same session. `ManageMembership` uses `token` to construct an authenticated image preview URL for the existing card image in edit mode — passing a stale token in create mode is benign today (the dialog ignores it in create mode), but passing a stale-then-expired token in edit mode (when opened via `openEdit` without a fresh `openDetail` first) could produce a broken image preview.

**Fix:** Clear `fileToken` before entering `ManageMembership` in the edit path, or fetch a fresh token inside `openEdit` similarly to `openDetail`:
```typescript
function openEdit(record: Memberships): void {
  manageRecord.value = record
  showDetail.value = false
  // fileToken was set during openDetail — still fresh; no action needed here,
  // but add a guard comment so future authors don't remove the openDetail requirement:
  // NOTE: fileToken is valid because openEdit is only reachable via MembershipDetail,
  // which is only mounted after a successful openDetail() token fetch.
  showManage.value = true
}
```
Alternatively, fetch a fresh token unconditionally inside `openEdit` to remove the implicit ordering dependency.

---

## Info

### IN-01: Inline style on button — should use a CSS class or Tailwind utilities

**File:** `src/components/projects/wallecx/WallecxToolbar.vue:35`

**Issue:** The clear-search `<button>` uses `style="background: none; border: none; padding: 0;"`. The rest of the template uses Tailwind utilities. Mixing inline styles and Tailwind utilities is inconsistent and harder to override in dark-mode or themed contexts.

**Fix:**
```html
<button
  v-if="searchQuery"
  class="min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer
         bg-transparent border-0 p-0"
  aria-label="Clear search"
  @click="emit('update:searchQuery', '')"
>
```

---

### IN-02: `VaccinationDetail` used in template but not explicitly imported

**File:** `src/components/projects/wallecx/VaccinationsTab.vue:444`

**Issue:** `<VaccinationDetail>` appears in the template but has no corresponding `import` statement in `<script setup>`. This works at runtime because `unplugin-vue-components` registers all wallecx components as globals (confirmed in `components.d.ts` line 81). However, the explicit imports for `ManageVaccination`, `VaccinationGroupCard`, and `VaccinationGroupPanel` create an inconsistent pattern — a future developer may not realise `VaccinationDetail` is available and add a broken import.

This is not a bug given the project's auto-import setup, but the inconsistency warrants a note.

**Fix:** Either import explicitly to match the other imports in the file, or remove the explicit imports for the other three components and rely on auto-import consistently across the whole file. Explicit imports are preferable in this codebase as they make dependencies traceable.
```typescript
import VaccinationDetail from './VaccinationDetail.vue';
```

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
