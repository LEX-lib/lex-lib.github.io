# Phase 8: View Toggle - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a view-toggle control inside `WallecxToolbar.vue` that switches the grouped-card area in `WallecxApp.vue` between the default 2-column grid (`grid-cols-1 sm:grid-cols-2`) and a single-column compact list (`grid-cols-1`). Selection persists for the browser session via sessionStorage and resets to the grid default on a fresh session.

**In scope:** VIEW-01 (toggle control + per-session persistence), VIEW-02 (only the wrapper grid class changes; `VaccinationGroupCard` is not modified).

**Out of scope:** Any changes to `VaccinationGroupCard.vue`, `VaccinationGroupPanel.vue`, `VaccinationDetail.vue`, `ManageVaccination.vue`, `vaccinationMapper.ts`, or the `Vaccinations` type. No new PocketBase queries. No new design tokens. No localStorage persistence (sessionStorage only — fresh session reopens to grid).

</domain>

<decisions>
## Implementation Decisions

### Toggle Control UI
- **D-01:** Use a **single PrimeVue `Button` that cycles** between modes (not a SelectButton or ToggleButton). One click flips the mode. The icon shown is the icon for the *target* mode (i.e. in grid mode the button shows the list icon meaning "switch to list"; in list mode it shows the grid icon meaning "switch to grid"). Compact, one click, one element to maintain.

### Toggle Position in Toolbar
- **D-02:** The toggle Button sits **to the right of the sort `Select`** inside `WallecxToolbar.vue`. Final toolbar row order: `[IconField (search, flex-1)] [Select (sort, w-36)] [Button (view toggle, fixed width)]`. Search remains the dominant input on the left; sort and toggle group together on the right as control-style elements. No extra divider between sort and toggle.

### Toggle Visibility
- **D-03:** The view-toggle Button is **hidden when there are no cards to lay out** — specifically during the `isLoading` skeleton, the zero-records empty state, and the no-search-results empty state. Search input and sort Select remain visible in all states (Phase 7 convention). The toggle is part of `WallecxToolbar` but receives a `showToggle` prop (or equivalent) driven by `WallecxApp` so the toolbar is the single source of layout truth and `WallecxApp` controls when the toggle is meaningful.

### Loading Skeleton
- **D-04:** The 3-card loading skeleton stays fixed at `grid grid-cols-1 sm:grid-cols-2 gap-4`. It does NOT mirror the current toggle mode, because the toggle is hidden during loading (D-03) so there is no UI affordance suggesting it should. This keeps the skeleton implementation unchanged.

### List-Mode Layout
- **D-05:** List mode is the **literal VIEW-02 swap**: the wrapper class changes from `grid grid-cols-1 sm:grid-cols-2 gap-4` to `grid grid-cols-1 gap-4`. Same `gap-4`, no `max-width` container, no centering wrapper. Cards stretch full-width on wide screens. Nothing else changes — `VaccinationGroupCard` renders identically in both modes.

### Persistence
- **D-06:** Persist `viewMode` in **sessionStorage**, NOT localStorage. SC #3 ("a fresh session always opens in the default 2-column grid view") rules out localStorage. On `WallecxApp` mount, read sessionStorage; if absent, default to `'grid'`. On every change, write sessionStorage.
- **D-07:** Storage key: **`wallecx:view-mode`** (namespaced by mini-app, kebab-case, mirrors existing conventions). Value enum: **`'grid' | 'list'`**.

### Carried Forward (locked)
- **From Phase 7 D-01:** Toggle lives inside the existing `WallecxToolbar.vue` component — Phase 7 explicitly designated this as the extension point.
- **From SC #4:** `searchQuery` and `sortMode` are unaffected by the toggle — they remain independent refs on `WallecxApp` and feed `displayedGroups` regardless of layout mode.
- **From VIEW-02:** `VaccinationGroupCard.vue` is not modified.
- **From SC #2 + #3:** Persistence is sessionStorage only; new tabs / reopened browsers reset to the grid default.

### Claude's Discretion
- Specific icons — suggest **Iconify `mdi:view-grid` and `mdi:view-list`** to match the existing `mdi:*` icons used in the empty states (`mdi:needle-off`, `mdi:magnify-remove-outline`). PrimeVue `pi-th-large` / `pi-list` is the fallback if Iconify is undesirable in a control.
- Accessibility: button needs an `aria-label` that describes the *action* (e.g. `"Switch to list view"` / `"Switch to grid view"`) — toggled in sync with the icon. Add an optional `title` tooltip with the same text.
- Button visual treatment: PrimeVue `severity="secondary"` and `size="small"` to match the inline "Clear search" button used in Phase 7 no-results state, or `text` variant for a quieter look — planner to choose based on visual balance with the sort `Select` next to it.
- `WallecxToolbar` API extension: `v-model:view-mode` prop + emit alongside the existing `v-model:search-query` and `v-model:sort-mode`, plus a `:show-toggle` boolean prop. Default the prop to `false` so toolbar consumers that don't need the toggle aren't forced to wire it (though for Phase 8 `WallecxApp` always passes `true` when cards are visible).
- `WallecxApp` mounted hook: initialize `viewMode` from sessionStorage *before* any render that depends on it, to avoid a flash from grid-default → list. Acceptable to use a `watch(viewMode, ...)` with `immediate: false` for the write side.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 8 — Goal, requirements (VIEW-01, VIEW-02), success criteria (1–4)
- `.planning/REQUIREMENTS.md` §v1.2 — VIEW-01 and VIEW-02 raw text and traceability

### Prior Phase Context (carried forward)
- `.planning/phases/07-toolbar-search-sort/07-CONTEXT.md` — Toolbar component contract (D-01 designates Phase 8 as extension point), `displayedGroups` computed wiring, "always visible toolbar" convention
- `.planning/phases/06-grouped-card-view-group-detail-panel/06-CONTEXT.md` — `groupedVaccinations` computed, `VaccineGroup` interface, Uncategorized pinning rules

### Files to Modify
- `src/components/projects/wallecx/WallecxToolbar.vue` — Add `v-model:view-mode` prop+emit, add `show-toggle` boolean prop, render the cycling Button to the right of the sort Select when `showToggle` is true
- `src/components/projects/wallecx/WallecxApp.vue` — Add `viewMode = ref<'grid' | 'list'>('grid')`, read sessionStorage on mount, watch + write on change, pass `v-model:view-mode` and `:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"` to `WallecxToolbar`, compute the grid wrapper class from `viewMode` (`grid-cols-1` vs `grid-cols-1 sm:grid-cols-2`)

### Files Untouched (locked by VIEW-02 and phase boundary)
- `src/components/projects/wallecx/VaccinationGroupCard.vue`
- `src/components/projects/wallecx/VaccinationGroupPanel.vue`
- `src/components/projects/wallecx/VaccinationDetail.vue`
- `src/components/projects/wallecx/ManageVaccination.vue`
- `src/lib/pocketbase/vaccinationMapper.ts`
- `src/types/wallecx/vaccinations/types.d.ts`

### Codebase Map (relevant maps)
- `.planning/codebase/CONVENTIONS.md` — Vue 3 `<script setup>`, Composition API, PrimeVue auto-import via `unplugin-vue-components`
- `.planning/codebase/STACK.md` — Tailwind v4, PrimeVue 4 Aura, Iconify usage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WallecxToolbar.vue` (Phase 7) — Already accepts two v-model props (`searchQuery`, `sortMode`) and renders a single flex row with `gap-2`. Adding a third v-model (`viewMode`) and a conditional Button slots in cleanly without restructuring.
- `WallecxApp.vue` — Already wires `v-model:search-query` and `v-model:sort-mode` on the toolbar. The pattern for adding `v-model:view-mode` is established.
- PrimeVue `Button` — Auto-imported via `unplugin-vue-components` + `PrimeVueResolver`. Already used elsewhere in `WallecxApp.vue` (the "Add your first vaccination" and "Clear search" buttons).
- Iconify `<iconify-icon>` — Already used in empty-state icons (`mdi:needle-off`, `mdi:magnify-remove-outline`). Phase 8 icons `mdi:view-grid` / `mdi:view-list` follow the same family.

### Established Patterns
- **State location:** All Wallecx state lives in `WallecxApp.vue` (no Pinia store). `viewMode` is a new sibling ref next to `searchQuery` and `sortMode`.
- **Persistence:** No existing sessionStorage / localStorage usage in `WallecxApp.vue` — Phase 8 introduces the first use. Read on mount, write on watch.
- **Conditional rendering:** `v-if` / `v-else-if` chain in the card area already gates the three render states (`isLoading`, `records.length === 0`, no-results, otherwise grid). The wrapper class for the grid branch is the only thing that needs to be reactive to `viewMode`.
- **Design tokens:** `var(--color-brand-primary)` (navy), `var(--color-brand-accent)` (amber) — no new tokens needed.

### Integration Points
- `WallecxApp.vue` → `WallecxToolbar.vue`: add `v-model:view-mode="viewMode"` and `:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"`.
- `WallecxApp.vue` template grid wrapper: replace literal class with a computed (e.g. `gridClass`) returning `'grid grid-cols-1 sm:grid-cols-2 gap-4'` when `viewMode === 'grid'` else `'grid grid-cols-1 gap-4'`.
- sessionStorage I/O: confined to `WallecxApp.vue`. Read in `onMounted` (or inline at setup-time if safe); write in a `watch(viewMode, ...)`.

</code_context>

<specifics>
## Specific Ideas

- Toggle Button semantics: when `viewMode === 'grid'`, button shows the *list* icon and `aria-label="Switch to list view"`. When `viewMode === 'list'`, button shows the *grid* icon and `aria-label="Switch to grid view"`. The icon represents the destination, not the current state — matches the "cycle to next mode" mental model.
- Icon suggestions (Iconify, to match existing empty-state icons):
  - List icon: `mdi:view-list` or `mdi:format-list-bulleted`
  - Grid icon: `mdi:view-grid` or `mdi:view-module`
- Storage key: `wallecx:view-mode`. Value enum: `'grid' | 'list'`. Initial read with a guard: any unexpected value falls back to `'grid'`.
- Toolbar API after Phase 8:
  ```ts
  defineProps<{
    searchQuery: string;
    sortMode: string;
    viewMode: 'grid' | 'list';
    showToggle?: boolean; // default false
  }>();
  defineEmits<{
    'update:searchQuery': [value: string];
    'update:sortMode': [value: string];
    'update:viewMode': [value: 'grid' | 'list'];
  }>();
  ```
- Grid-wrapper computed in `WallecxApp.vue`:
  ```ts
  const gridClass = computed(() =>
    viewMode.value === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  );
  ```

</specifics>

<deferred>
## Deferred Ideas

- **localStorage / cross-tab persistence** — Explicitly ruled out by SC #3. If sticky preference across sessions ever becomes wanted, that's a new v2 capability and would warrant its own phase.
- **Density toggle inside list mode** (compact / cosy / comfortable spacing) — Out of scope. List mode is a single fixed layout (`grid-cols-1` + `gap-4`).
- **Animated transition between layouts** — Not discussed as required; if added, it would be a polish phase. Vue's `<TransitionGroup>` would be the natural fit, but it's not blocking VIEW-01 or VIEW-02.
- **Keyboard shortcut for toggling view** — Out of scope. Click-only for v1.

</deferred>

---

*Phase: 08-view-toggle*
*Context gathered: 2026-05-13*
