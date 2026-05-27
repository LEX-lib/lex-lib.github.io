---
phase: 34-layout-audit-touch-targets
plan: "01"
subsystem: wallecx-mobile-css
tags: [css, touch-target, sticky, safe-area, drag-handle, viewport-meta]
dependency_graph:
  requires: [33-mobile-foundation]
  provides: [DragHandle.vue, wallecx-overrides-phase34-rules, wallecx-main-tabs-class, locked-viewport-meta]
  affects: [34-02, 34-03]
tech_stack:
  added: []
  patterns: [css-only-sticky, env-safe-area, tailwind-dark-utility, non-scoped-css-override]
key_files:
  created:
    - src/components/projects/wallecx/DragHandle.vue
  modified:
    - src/assets/wallecx-overrides.css
    - src/components/projects/wallecx/WallecxApp.vue
    - index.html
decisions:
  - "CSS-only sticky via .wallecx-main-tabs .p-tablist with !important overrides — no JS wrapper div needed"
  - "52px hardcoded offset for .wallecx-tab-toolbar top to avoid CSS variable complexity (Plan 02 can tune if needed)"
  - "DragHandle.vue has no script/props/emits — purely presentational with callers owning isMobile gating"
metrics:
  duration: "~3 minutes"
  completed: "2026-05-27"
  tasks_completed: 3
  files_changed: 4
---

# Phase 34 Plan 01: CSS Foundation + DragHandle + Viewport Lock Summary

**One-liner:** CSS spine for the Phase 34 mobile audit — DragHandle pill component, four wallecx-overrides.css rule blocks (44px icon-button floor, sticky TabList, sticky-toolbar class, bottom-Drawer safe-area), wallecx-main-tabs class on WallecxApp Tabs, and LOCKED viewport meta comment.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create shared DragHandle.vue component | 9ee21cb | src/components/projects/wallecx/DragHandle.vue |
| 2 | Append CSS rule blocks + add wallecx-main-tabs class | 294c3b9 | src/assets/wallecx-overrides.css, src/components/projects/wallecx/WallecxApp.vue |
| 3 | Lock index.html viewport meta + confirm dvh invariant | a16f9fe | index.html |

---

## Automated Gates

| Gate | Result |
|------|--------|
| `npm run type-check` | PASS — 0 errors |
| `npm run test:unit` | PASS — 59/59 tests |
| `npm run build` | PASS — 0 "exceeds" / 0 "Skipping precaching"; 57 precache entries |
| `npm run lint` | PASS — 0 new errors (pre-existing VaccinationDetail.vue:5 grandfathered) |

---

## Deliverables

### DragHandle.vue (Task 1)

`src/components/projects/wallecx/DragHandle.vue` — visual-only presentational component:
- Tailwind pill: `w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600`
- `aria-hidden="true"` — decorative, not interactive
- No `<script setup>` block, no props, no emits
- Callers control `v-if="isMobile"` gating (per D-34-03)
- Importable as `import DragHandle from './DragHandle.vue'` by Plans 02 and 03 consumers

### wallecx-overrides.css additions (Task 2)

Four rule blocks appended after the existing `.my-app-dark .p-card` block (all existing rules byte-intact):

1. **LT-01 icon-button floor:** `.p-button.p-button-icon-only { min-width: 44px; min-height: 44px }` — closes the 32px Aura `sm.iconOnlyWidth` gap from main.ts global PT
2. **LT-01 tab trigger floor:** `.wallecx-main-tabs .p-tab { min-height: 44px }` — scoped to top-level tabs only via discriminating class
3. **LT-05 sticky chrome** (mobile only via `@media (max-width: 639px)`):
   - `.wallecx-main-tabs .p-tablist` — `position: sticky !important; top: env(safe-area-inset-top); z-index: 10; overflow: visible !important` — overrides PrimeVue's `position: relative; overflow: hidden` at equal specificity
   - `.wallecx-tab-toolbar` — `position: sticky; top: calc(env(safe-area-inset-top) + 52px); z-index: 9; background + border-bottom`
   - `.my-app-dark .wallecx-tab-toolbar` — `background: #1a1f2e` (matches existing card override)
4. **LT-03 bottom-Drawer safe-area:** `.p-drawer-bottom .p-drawer-content { padding-bottom: max(env(safe-area-inset-bottom), 1rem); padding-left/right: env(safe-area-inset-left/right) }` — targets content element only, does NOT change 85dvh panel height

### WallecxApp.vue (Task 2)

Single template change: `<Tabs v-model:value="activeTab" class="wallecx-main-tabs">` — discriminating class that scopes both the tab-trigger min-height and the sticky TabList overrides.

### index.html (Task 3)

LOCKED HTML comment added immediately before line 6 viewport meta:
```html
<!-- LOCKED: viewport-fit=cover is required for env(safe-area-inset-*) non-zero values (CON-VIEWPORT-FIT / LT-09). Do not remove. -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```
Both `viewport-fit=cover` and `interactive-widget=resizes-content` tokens preserved byte-intact.

### dvh Invariant (Task 3)

Confirmed 0 matches for `100vh`, `h-screen`, `min-h-screen` in `src/components/projects/wallecx/` via `git grep`. No migration required — invariant already clean.

---

## Decisions Made

1. **CSS-only sticky (no JS wrapper div):** The plan considered lifting `<TabList>` outside `<Tabs>` but `<TabPanels>` requires being inside `<Tabs>` for `$pcTabs` provide/inject context. CSS override on `.wallecx-main-tabs .p-tablist` with `position: sticky !important; overflow: visible !important` is the correct approach — avoids PrimeVue structural modification entirely.

2. **52px hardcoded toolbar offset:** Rather than a CSS variable set by WallecxApp.vue template, a hardcoded `calc(env(safe-area-inset-top) + 52px)` approximation is used for the `.wallecx-tab-toolbar` top value (per RESEARCH.md A3 — accepted approximation). Plan 02 can tune if post-implementation visual check shows offset issues.

3. **No !important on .p-tab and .p-button rules:** Specificity is sufficient over Aura element-level rules; `!important` reserved for the `position` and `overflow` sticky overrides where PrimeVue injects equal-specificity rules at later source order.

---

## Contracts Established for Plans 02 and 03

- **`<DragHandle />`** — importable from `./DragHandle.vue`; callers supply `v-if="isMobile"` where the same Drawer renders on desktop
- **`.wallecx-tab-toolbar`** — CSS class; plan 02 applies to toolbar wrapper divs: `:class="isMobile ? 'wallecx-tab-toolbar' : ''"`
- **`wallecx-main-tabs`** on `<Tabs>` — ensures sticky `.p-tablist` and tab min-height rules scope correctly

---

## Deviations from Plan

None — plan executed exactly as written. All four CSS blocks match the verbatim content from the plan. The `wallecx-main-tabs` class was added as the sole WallecxApp.vue change. The LOCKED comment was added without altering the meta tag content.

---

## Known Stubs

None. This plan adds CSS rules and a visual component. No data-bound elements were introduced.

---

## Threat Flags

No new threat surface introduced. Plan 34-01 threat model (T-34-01 and T-34-02) confirmed mitigated:
- T-34-01: CSS scoped to Wallecx chunk; z-index 9/10 sit below modal masks; no auth/confirm surfaces repositioned
- T-34-02: LOCKED comment + byte-intact meta tag; verify step asserted both `viewport-fit=cover` and `interactive-widget=resizes-content` survived

---

## Self-Check

### Created files exist:
- `src/components/projects/wallecx/DragHandle.vue` — FOUND (commit 9ee21cb)
- `src/assets/wallecx-overrides.css` — MODIFIED (commit 294c3b9)
- `src/components/projects/wallecx/WallecxApp.vue` — MODIFIED (commit 294c3b9)
- `index.html` — MODIFIED (commit a16f9fe)

### Commits exist:
- 9ee21cb — feat(34-01): create shared DragHandle.vue component
- 294c3b9 — feat(34-01): append touch-target, sticky-chrome, safe-area rules; add wallecx-main-tabs
- a16f9fe — feat(34-01): lock index.html viewport meta with LOCKED comment (LT-09)

### Must-have truths verified:
- [x] DragHandle.vue exists, renders Phase-17 pill, importable
- [x] Every icon-only PrimeVue button: .p-button.p-button-icon-only min-width/height 44px
- [x] WallecxApp tab triggers: .wallecx-main-tabs .p-tab min-height 44px
- [x] Sticky TabList on mobile with env(safe-area-inset-top)
- [x] .wallecx-tab-toolbar reusable sticky class present
- [x] Bottom Drawer content safe-area padding present
- [x] index.html LOCKED comment with viewport-fit=cover + interactive-widget=resizes-content
- [x] 0 occurrences of 100vh/h-screen/min-h-screen in src/components/projects/wallecx/

## Self-Check: PASSED
