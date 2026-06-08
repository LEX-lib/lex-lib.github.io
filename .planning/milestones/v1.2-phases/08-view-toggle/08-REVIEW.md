---
phase: 08-view-toggle
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/projects/wallecx/WallecxToolbar.vue
  - src/components/projects/wallecx/WallecxApp.vue
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 08: Code Review Report

**Reviewed:** 2026-05-13
**Depth:** standard
**Files Reviewed:** 2
**Status:** clean

## Summary

Phase 8 adds a cycling view-mode toggle (grid/list) to the Wallecx vaccination tracker. The implementation is split cleanly across two files: `WallecxToolbar.vue` owns the UI surface (stateless, emit-only) and `WallecxApp.vue` owns the state, persistence, and layout binding.

All critical concerns were reviewed against the threat model documented in the plans:

- **Security (T-08-01 through T-08-09):** No XSS surface is introduced. `gridClass` returns only hardcoded Tailwind strings. No `v-html`. sessionStorage input is validated with a strict literal disjunction (`stored === 'grid' || stored === 'list'`) before assignment. No `localStorage` usage. No new PocketBase queries.
- **Accessibility:** The toggle Button carries both `aria-label` and `title` attributes derived from the same ternary as the icon, so they cannot diverge. `aria-hidden="true"` on the inner `<iconify-icon>` prevents double-announcement by screen readers.
- **Vue reactivity:** `viewMode` ref, `gridClass` computed, and the `watch(viewMode)` watcher are all wired correctly. No reactivity trap patterns were found.
- **sessionStorage resilience:** Both read (onMounted) and write (watcher) are wrapped in try/catch. Invalid stored values are silently discarded.
- **show-toggle edge cases:** The condition `!isLoading && records.length > 0 && displayedGroups.length > 0` correctly suppresses the toggle during loading, on zero-records empty state, and when search produces no results.

Two informational observations are noted below. Neither affects correctness, security, or runtime behaviour.

## Info

### IN-01: watcher redundantly writes sessionStorage on initial hydration

**File:** `src/components/projects/wallecx/WallecxApp.vue:130-131, 163-169`

**Issue:** In `onMounted`, when `viewMode.value = stored` is executed (line 131), the `watch(viewMode, ...)` callback fires because Vue watchers react to any `.value` mutation on a ref, including programmatic ones set at mount. The watcher immediately calls `sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, stored)` — writing back the value that was just read from the same key. The write is harmless (the key already holds that value) and the try/catch silently absorbs any failure, but it is a redundant round-trip.

**Fix:** No action required — the behaviour is safe and the overhead is negligible (one extra `setItem` call at mount when a previously persisted value exists). If the redundancy becomes a concern in future, either add a boolean flag (`isHydrating`) set around the `onMounted` assignment to suppress the first watcher fire, or pass `{ immediate: false }` explicitly (already the default) and add a `flush: 'sync'` guard. Neither change is warranted here.

---

### IN-02: `VIEW_MODE_STORAGE_KEY` constant is declared inside `<script setup>` scope rather than at module level

**File:** `src/components/projects/wallecx/WallecxApp.vue:13`

**Issue:** Constants declared inside `<script setup>` are scoped to each component instance (they are re-evaluated when the component is created). For a string constant this adds no observable overhead, but placing shared, instance-independent constants at true module scope (outside the `<script setup>` block) is the conventional Vue 3 pattern that clearly signals intent and avoids per-instance allocation. `WallecxToolbar.vue`'s `sortOptions` array has the same characteristic but was already present from Phase 7.

**Fix:** Not required for correctness. If the file is refactored in a future phase, moving `VIEW_MODE_STORAGE_KEY` above the `<script setup>` tag into a plain `<script>` block (or extracting it to a shared constants file alongside other storage keys) would align with the conventional pattern. This is a style observation only.

---

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
