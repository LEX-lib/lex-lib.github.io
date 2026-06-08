# Phase 16: Membership Card Toolbar - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire `WallecxToolbar.vue` into `MembershipsTab.vue` — add `searchQuery` ref, `sortMode` ref (session-persisted), and a `displayedMemberships` computed that applies client-side filter (by `card_name` or `issuer`, case-insensitive) then sort. Show a "no results" empty state when the search yields nothing. No new PocketBase queries; all changes are pure client-side on the already-loaded `records` ref.

**In scope:** ORG-01 (search/filter by name or issuer), ORG-02 (sort by 4 modes, session-retained selection), empty state for no-match, adapting `WallecxToolbar.vue` to accept `sortOptions` as a prop.
**Out of scope:** View toggle for memberships, list-view layout for memberships, any PocketBase query changes, changes to `MembershipCard.vue`, `MembershipDetail.vue`, `ManageMembership.vue`, `BarcodeDisplay.vue`.

</domain>

<decisions>
## Implementation Decisions

### WallecxToolbar Adaptation
- **D-01:** Add a required `sortOptions: { value: string; label: string }[]` prop to `WallecxToolbar.vue`. Remove the hardcoded `sortOptions` array from the component. The component becomes fully generic — it renders whatever options array it receives.
- **D-02:** Migrate `VaccinationsTab.vue` in the same pass: move the vaccination sort options array out of `WallecxToolbar` and into `VaccinationsTab` as a `const`. Pass via the new prop. Both tabs own their own options. `WallecxToolbar` is left with no tab-specific knowledge.
- **D-03:** `showToggle` prop remains as-is. `MembershipsTab` passes `:show-toggle="false"` (no list view for memberships in v2.2). No view-toggle button appears in the memberships toolbar.

### Sort Options for MembershipsTab
- **D-04:** Four sort modes for memberships, passed as the `sortOptions` prop:
  - `{ value: 'name-asc', label: 'Name A–Z' }`
  - `{ value: 'issuer-asc', label: 'Issuer A–Z' }`
  - `{ value: 'expiry-asc', label: 'Expiry Date' }` — soonest first; cards with no `expiry_date` go last
  - `{ value: 'recently-added', label: 'Recently Added' }` — default; sort by `created` descending

### Default Sort Mode & Session Persistence
- **D-05:** Default sort mode is `'recently-added'`. Matches the PocketBase load order (`sort: '-created'`) — no visual re-ordering on first load.
- **D-06:** Persist `sortMode` to `sessionStorage` under key `'wallecx:memberships-sort-mode'`. Restore on `onMounted` (same pattern as `wallecx:view-mode` in `VaccinationsTab`). Silent try/catch on both read and write — sessionStorage failures are non-fatal.

### Computed Pipeline
- **D-07:** Add `displayedMemberships` computed to `MembershipsTab.vue`:
  1. Filter: if `searchQuery` is non-empty, keep only records where `card_name` or `issuer` contains the query (case-insensitive, `.toLowerCase().includes()`).
  2. Sort: apply `sortMode` switch:
     - `name-asc`: `localeCompare` on `card_name` (case-insensitive)
     - `issuer-asc`: `localeCompare` on `issuer ?? ''` (case-insensitive)
     - `expiry-asc`: ISO date string comparison; records with falsy `expiry_date` sort last
     - `recently-added` (default): sort by `created` descending
  3. Template switches `v-for` from `records` to `displayedMemberships`.

### Toolbar Layout & Visibility
- **D-08:** Layout matches `VaccinationsTab`: existing header row (Add card button) stays at top; `WallecxToolbar` is its own row below, above the loading/empty/data content branches.
- **D-09:** Toolbar is always visible — rendered unconditionally regardless of `isLoading` or `records.length`. Matches `VaccinationsTab` behaviour.

### Empty State (No Search Results)
- **D-10:** When `displayedMemberships.length === 0 && searchQuery` (records exist but search matches nothing): show `mdi:magnify-remove-outline` icon + dynamic message `"No cards match '{{ searchQuery }}'"` + "Clear search" secondary Button. Same structure as the vaccination no-results state.

### Search UX
- **D-11:** Search is instant (no debounce) — dataset is small (personal membership cards). Placeholder text: `"Search by name or issuer…"`.
- **D-12:** Inline × clear button inside `IconField` is already implemented in `WallecxToolbar.vue` — no changes needed to the clear behaviour.

### Claude's Discretion
- Exact `mb-4` spacing between header row and toolbar row (follow existing pattern in `VaccinationsTab`)
- Sort stability for ties (localeCompare is stable enough for personal-scale data)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 16 — Goal, requirements (ORG-01, ORG-02), success criteria

### Files to Modify
- `src/components/projects/wallecx/WallecxToolbar.vue` — Add `sortOptions` prop; remove hardcoded array
- `src/components/projects/wallecx/VaccinationsTab.vue` — Pass vaccination sort options via new prop
- `src/components/projects/wallecx/MembershipsTab.vue` — Add `WallecxToolbar`, `searchQuery` ref, `sortMode` ref (session-persisted), `displayedMemberships` computed, no-results empty state branch

### Files Untouched
- `src/components/projects/wallecx/MembershipCard.vue`
- `src/components/projects/wallecx/MembershipDetail.vue`
- `src/components/projects/wallecx/ManageMembership.vue`
- `src/components/projects/wallecx/BarcodeDisplay.vue`
- `src/types/wallecx/memberships/types.d.ts`
- `src/lib/pocketbase/membershipMapper.ts`

### Analogs and Patterns
- `src/components/projects/wallecx/VaccinationsTab.vue` — Complete reference: `searchQuery`/`sortMode`/`viewMode` refs, `displayedGroups` computed pipeline, sessionStorage restore on `onMounted`, toolbar wiring, no-results empty state pattern
- `src/components/projects/wallecx/WallecxToolbar.vue` — Current implementation to be adapted (add `sortOptions` prop)
- `.planning/phases/07-toolbar-search-sort/07-CONTEXT.md` — Original toolbar decisions (search UX, empty state structure, icon choices)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WallecxToolbar.vue` — Full toolbar skeleton already exists; only needs `sortOptions` prop added and hardcoded array removed
- `VaccinationsTab.vue` — Complete implementation of the filter→sort computed pipeline, sessionStorage persistence pattern, and no-results empty state — copy and adapt for memberships
- `Memberships` type (`src/types/wallecx/memberships/types.d.ts`) — Sortable fields: `card_name` (string), `issuer` (optional string), `expiry_date` (optional ISO date string), `created` (ISO datetime string from RecordModel)

### Established Patterns
- **Sort pipeline:** filter first, then sort (see `displayedGroups` in `VaccinationsTab.vue:64–113`)
- **SessionStorage restore:** `try { const stored = sessionStorage.getItem(key); if (validValues.includes(stored)) ref.value = stored; } catch {}` — on `onMounted`, before any render
- **No-results empty state:** `v-else-if="displayedMemberships.length === 0 && searchQuery"` branch with `mdi:magnify-remove-outline` icon + dynamic message + secondary clear button
- **Toolbar prop wiring:** `v-model:search-query="searchQuery"` / `v-model:sort-mode="sortMode"` — kebab-case prop names

### Integration Points
- `MembershipsTab.vue` template: insert `<WallecxToolbar>` after the header row div (`mb-4`), before the `v-if="isLoading"` branch
- `MembershipsTab.vue` script: import `WallecxToolbar`; add `computed` to imports from `vue`; add `searchQuery`, `sortMode` refs; add `SORT_MODE_STORAGE_KEY` const
- `WallecxToolbar.vue`: add `sortOptions` to `defineProps`, remove the inline `const sortOptions = [...]` — no template changes needed

</code_context>

<specifics>
## Specific Ideas

- Sort options const for `MembershipsTab.vue`:
  ```ts
  const SORT_MODE_STORAGE_KEY = 'wallecx:memberships-sort-mode';
  const membershipSortOptions = [
    { value: 'recently-added', label: 'Recently Added' },
    { value: 'name-asc',       label: 'Name A–Z' },
    { value: 'issuer-asc',     label: 'Issuer A–Z' },
    { value: 'expiry-asc',     label: 'Expiry Date' },
  ];
  ```
- Expiry sort comparator: `(a, b) => { if (!a.expiry_date && !b.expiry_date) return 0; if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return a.expiry_date.localeCompare(b.expiry_date); }`
- No-results message: `"No cards match '{{ searchQuery }}'"`
- "Clear search" button: `severity="secondary"`, `size="small"`, `@click="searchQuery = ''"`
- `WallecxToolbar` usage in `MembershipsTab`:
  ```html
  <WallecxToolbar
    v-model:search-query="searchQuery"
    v-model:sort-mode="sortMode"
    v-model:view-mode="'grid'"
    :sort-options="membershipSortOptions"
    :show-toggle="false"
  />
  ```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-membership-card-toolbar*
*Context gathered: 2026-05-15*
