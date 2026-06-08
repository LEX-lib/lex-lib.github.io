---
plan: 08-01
phase: 08-view-toggle
status: complete
completed: "2026-05-13"
wave: 1
---

# Summary: 08-01 — WallecxToolbar.vue View Toggle Button

## What Was Built

Extended `WallecxToolbar.vue` with a `viewMode` v-model and an optional `showToggle` boolean prop. When `showToggle` is true, an icon-only PrimeVue `Button` renders to the right of the sort Select. The Button shows the *destination* icon (list icon in grid mode, grid icon in list mode) and emits the opposite mode on click. The toolbar holds no local state.

## Key Files

### Modified
- `src/components/projects/wallecx/WallecxToolbar.vue` — added `viewMode: 'grid' | 'list'` prop, `showToggle?: boolean` prop (default `false` via `withDefaults`), `update:viewMode` emit, and cycling-toggle Button conditionally rendered with `v-if="showToggle"`

## Decisions Made

- Removed `const props =` assignment from `withDefaults(defineProps<{...}>(), {...})` to avoid `@typescript-eslint/no-unused-vars` lint error — template accesses props by name directly, so the variable binding is unnecessary
- No manual `Button` import (auto-imported by PrimeVueResolver)
- Used `<iconify-icon>` custom element (globally registered in vite.config.ts, no import needed)
- `severity="secondary"` to keep the toggle neutral; `size="small"` matching the inline "Clear search" Button precedent

## Self-Check

### Must-Haves Verified

- [x] `WallecxToolbar.vue` accepts `viewMode` prop (`'grid' | 'list'`) and emits `update:viewMode`
- [x] `WallecxToolbar.vue` accepts optional `showToggle` boolean prop (default `false`)
- [x] Toggle Button renders only when `showToggle` is true (`v-if="showToggle"`)
- [x] Icon mirrors destination mode: `mdi:view-list` when `viewMode === 'grid'`, `mdi:view-grid` when `viewMode === 'list'`
- [x] Click emits the opposite mode via `emit('update:viewMode', viewMode === 'grid' ? 'list' : 'grid')`
- [x] Toolbar holds no local viewMode state
- [x] `aria-label` and `title` both use identical ternary (2 occurrences confirmed by grep)
- [x] `aria-hidden="true"` on inner `<iconify-icon>`
- [x] No `import Button`, no `v-tooltip`, no `v-html`, no storage I/O

### Checks

- lint: PASS (WallecxToolbar.vue clean; 2 pre-existing errors in other files)
- type-check: WallecxToolbar.vue has no errors (WallecxApp.vue error at line 291 is expected — resolved by Plan 2)

## Self-Check: PASSED
