# Phase 7: Toolbar — Search & Sort - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `WallecxToolbar.vue` component above the grouped card grid containing a search input and sort control. Extend `groupedVaccinations` (or add a new downstream computed) to apply client-side filter and sort logic. Show a distinct "no results" empty state when search yields no matching groups.

**In scope:** SEARCH-01 (real-time filter), SEARCH-02 (no-results empty state), SORT-01 (4 sort options, Uncategorized pinned last).
**Out of scope:** View toggle (Phase 8), any new PocketBase queries, changes to `VaccinationGroupCard.vue`, changes to `VaccinationGroupPanel.vue`, changes to `VaccinationDetail.vue`.

</domain>

<decisions>
## Implementation Decisions

### Toolbar Component Structure
- **D-01:** A new `WallecxToolbar.vue` component is extracted for Phase 7. It receives `searchQuery` and `sortMode` as v-model props and renders the search input + sort control in a single toolbar row. Phase 8 (view toggle) will add the view toggle button inside this same component — making it the clean extension point.

### Sort Control UI
- **D-02:** Use PrimeVue **`Select` (dropdown)** for the sort control. 4 options: "Type A–Z" (default), "Type Z–A", "Name A–Z", "Name Z–A". Compact and width-safe on mobile compared to a SelectButton that must show all 4 labels simultaneously.

### "No Results" Empty State (SEARCH-02)
- **D-03:** When the search query matches no groups, show a **dynamic message** — `"No groups match '[query]'"` — echoing the user's query. Uses a different icon from the zero-records state (`mdi:needle-off`) to be visually distinct.
- **D-04:** The "no results" empty state includes a small secondary **"Clear search"** button that resets the search query to empty — allowing one-click reset without requiring the user to click into the input field.

### Search Input UX (SEARCH-01)
- **D-05:** Search input uses **PrimeVue `IconField` / `InputIcon`** to show a `pi pi-search` icon on the left — icon-only treatment, no text label. Clean and space-efficient in a toolbar row.
- **D-06:** When the search input contains text, an **inline × (clear) button** appears inside the input (right side). Clears the query on click. Implemented via `IconField` with a right-side `InputIcon` conditionally rendered, or an absolute-positioned button.
- **D-07:** Search is **instant (no debounce)** — dataset is small (personal vaccination records, typically < 50 groups). "Real-time" per SEARCH-01.

### Computed Pipeline (Claude's Discretion)
- Extend the existing `groupedVaccinations` computed by adding a downstream `displayedGroups` computed in `WallecxApp.vue` that applies: filter by `searchQuery` → sort by `sortMode` → always re-pin Uncategorized last. The template switches from `groupedVaccinations` to `displayedGroups`. `groupedVaccinations` remains unchanged (still the source of truth for grouping logic).

### Carried Forward (Phase 6 — locked)
- **D-05 (Phase 6):** Default sort is case-insensitive alphabetical by `vaccineType`. This is "Type A–Z" in SORT-01's 4-option set — no change needed to the existing sort in `groupedVaccinations`.
- **D-06 (Phase 6):** "Uncategorized" is always pinned last regardless of sort direction. The `displayedGroups` computed re-applies this post-sort fixup under all 4 sort modes.

### Claude's Discretion
- Whether the "Name A–Z / Name Z–A" sort uses `latestRecord.vaccine_name` (most recent record's name per group) as specified in SORT-01, or a different field — SORT-01 specifies `latestRecord.vaccine_name` explicitly.
- Toolbar layout: single flex row, `gap-2` or `gap-4`, same row width as the card grid below it.
- Icon for the "no results" empty state (suggested: `mdi:magnify-remove-outline` or `mdi:text-search` — distinct from `mdi:needle-off` used for zero-records).
- Exact `placeholder` text on the search InputText (suggested: `"Search by name or type…"`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 7 — Goal, requirements (SEARCH-01, SEARCH-02, SORT-01), success criteria

### Files to Create
- `src/components/projects/wallecx/WallecxToolbar.vue` — New component; search input (IconField + InputIcon + inline clear) + sort Select dropdown; exposes `v-model:searchQuery` and `v-model:sortMode`

### Files to Modify
- `src/components/projects/wallecx/WallecxApp.vue` — Import + wire WallecxToolbar; add `searchQuery` ref and `sortMode` ref; add `displayedGroups` computed (filter + sort + Uncategorized pin); switch template from `groupedVaccinations` to `displayedGroups`; add "no results" empty state branch (distinct from zero-records branch)

### Files Untouched
- `src/components/projects/wallecx/VaccinationGroupCard.vue` — No changes (VIEW-02 / Phase 8 constraint carried into Phase 7)
- `src/components/projects/wallecx/VaccinationGroupPanel.vue` — No changes
- `src/components/projects/wallecx/VaccinationDetail.vue` — No changes
- `src/components/projects/wallecx/ManageVaccination.vue` — No changes
- `src/lib/pocketbase/vaccinationMapper.ts` — No changes
- `src/types/wallecx/vaccinations/types.d.ts` — No changes

### Analogs and Patterns
- `.planning/phases/06-grouped-card-view-group-detail-panel/06-CONTEXT.md` — VaccineGroup interface definition, groupedVaccinations computed structure, design token constraints
- `src/components/projects/wallecx/WallecxApp.vue` — Existing orchestrator: refs, computed, event handlers, Drawer wiring, empty states — patterns to follow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WallecxApp.vue` — `groupedVaccinations` computed already produces sorted `VaccineGroup[]` with Uncategorized pinned last. `displayedGroups` wraps this.
- `WallecxApp.vue` — `records` ref + three empty-state branches (`isLoading`, `records.length === 0`, else). Phase 7 adds a fourth branch: `displayedGroups.length === 0 && searchQuery` for "no results".
- PrimeVue `Select` — auto-imported via `unplugin-vue-components` + `PrimeVueResolver`; no manual import.
- PrimeVue `IconField` / `InputIcon` — auto-imported; used for icon-left search input.

### Established Patterns
- **State management:** All Wallecx state in `WallecxApp.vue`. New refs: `searchQuery: ref("")`, `sortMode: ref("type-asc")`.
- **Design tokens:** `var(--color-brand-primary)` (navy), `var(--color-brand-accent)` (amber) — no new tokens.
- **Empty state structure:** `mdi:*` Iconify icon + `text-sm` message + optional CTA Button — matches the zero-records state pattern. "No results" uses this same structure with a different icon + dynamic message + "Clear search" secondary button.
- **PrimeVue auto-import:** No manual imports needed for `Select`, `InputText`, `IconField`, `InputIcon`, `Button`.

### Integration Points
- `WallecxApp.vue` → `WallecxToolbar.vue`: `v-model:search-query="searchQuery"` and `v-model:sort-mode="sortMode"`.
- `displayedGroups` replaces `groupedVaccinations` in the template's `v-for`. `groupedVaccinations` computed itself is unchanged.
- "Clear search" button in "no results" state: `@click="searchQuery = ''"`.
- "Clear search" in toolbar input: same `searchQuery = ''` assignment.

</code_context>

<specifics>
## Specific Ideas

- Sort options as value/label pairs for the PrimeVue Select:
  - `{ value: 'type-asc', label: 'Type A–Z' }` (default)
  - `{ value: 'type-desc', label: 'Type Z–A' }`
  - `{ value: 'name-asc', label: 'Name A–Z' }`
  - `{ value: 'name-desc', label: 'Name Z–A' }`
  - "Name" sort uses `latestRecord.vaccine_name` per SORT-01 spec.
- "No results" message: `"No groups match '{{ searchQuery }}'"` — dynamic interpolation in template.
- "Clear search" button label: `"Clear search"`, `severity="secondary"`, `size="small"`.
- Search input placeholder: `"Search by name or type…"`.
- Uncategorized pinning: post-sort fixup — `[...namedSorted, ...uncategorized]` pattern (same as Phase 6 `groupedVaccinations`).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-toolbar-search-sort*
*Context gathered: 2026-05-12*
