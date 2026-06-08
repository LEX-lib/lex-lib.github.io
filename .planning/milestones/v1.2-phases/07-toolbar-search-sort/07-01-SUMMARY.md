---
phase: 07-toolbar-search-sort
plan: "01"
subsystem: wallecx
tags: [toolbar, search, sort, primevue, presentational]
dependency_graph:
  requires: []
  provides: [WallecxToolbar.vue]
  affects: [WallecxApp.vue (Plan 2)]
tech_stack:
  added: []
  patterns: [v-model emit pattern, PrimeVue auto-import, IconField inline clear]
key_files:
  created:
    - src/components/projects/wallecx/WallecxToolbar.vue
  modified: []
decisions:
  - No manual PrimeVue imports — PrimeVueResolver auto-imports IconField, InputIcon, Select, InputText
  - ":value + @input on InputText (not v-model) — prop lives in parent; v-model would mutate prop"
  - ":model-value + @update:model-value on Select — same reason"
  - "Inline clear button via conditional second InputIcon (v-if=searchQuery)"
metrics:
  duration: 5m
  completed: "2026-05-13"
---

# Phase 7 Plan 1: WallecxToolbar.vue — New Presentational Component — Summary

**One-liner:** Purely presentational toolbar component with PrimeVue IconField search input (inline × clear) and 4-option Sort Select, emitting v-model updates upward — no local state held.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create WallecxToolbar.vue | af0c524 | src/components/projects/wallecx/WallecxToolbar.vue |

## Verification

- `npm run type-check` exits 0 — no errors
- File contains `defineProps<{ searchQuery: string; sortMode: string; }>`
- File contains `defineEmits<{ 'update:searchQuery': [value: string]; 'update:sortMode': [value: string]; }>`
- File contains all 4 sort options (type-asc, type-desc, name-asc, name-desc) with en-dash labels
- File contains `<IconField class="flex-1">`, `<InputIcon class="pi pi-search"`, `<InputText`, `<Select`
- File uses `:value="searchQuery"` + `@input` on InputText (not v-model)
- File uses `v-if="searchQuery"` on the clear InputIcon
- File contains no manual PrimeVue imports, no v-html

## Deviations from Plan

None — plan executed exactly as written. Template copied verbatim from 07-UI-SPEC.md §1.

## Known Stubs

None.

## Threat Flags

None — component is purely presentational with no network calls, no v-html, no auth surface.

## Self-Check: PASSED

- File exists: `src/components/projects/wallecx/WallecxToolbar.vue` — FOUND
- Commit af0c524 — FOUND
