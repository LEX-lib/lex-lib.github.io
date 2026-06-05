# Phase 7: Toolbar — Search & Sort - Research

**Researched:** 2026-05-13
**Domain:** Vue 3 computed pipeline, PrimeVue 4 IconField / InputIcon / Select, client-side filter + sort
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** A new `WallecxToolbar.vue` component is extracted for Phase 7. It receives `searchQuery` and `sortMode` as v-model props and renders the search input + sort control in a single toolbar row. Phase 8 (view toggle) will add the view toggle button inside this same component — making it the clean extension point.
- **D-02:** Use PrimeVue **`Select` (dropdown)** for the sort control. 4 options: "Type A–Z" (default), "Type Z–A", "Name A–Z", "Name Z–A". Compact and width-safe on mobile compared to a SelectButton that must show all 4 labels simultaneously.
- **D-03:** When the search query matches no groups, show a **dynamic message** — `"No groups match '[query]'"` — echoing the user's query. Uses a different icon from the zero-records state (`mdi:needle-off`) to be visually distinct.
- **D-04:** The "no results" empty state includes a small secondary **"Clear search"** button that resets the search query to empty — allowing one-click reset without requiring the user to click into the input field.
- **D-05:** Search input uses **PrimeVue `IconField` / `InputIcon`** to show a `pi pi-search` icon on the left — icon-only treatment, no text label. Clean and space-efficient in a toolbar row.
- **D-06:** When the search input contains text, an **inline × (clear) button** appears inside the input (right side). Clears the query on click. Implemented via `IconField` with a right-side `InputIcon` conditionally rendered, or an absolute-positioned button.
- **D-07:** Search is **instant (no debounce)** — dataset is small (personal vaccination records, typically < 50 groups). "Real-time" per SEARCH-01.
- **Computed pipeline:** Extend the existing `groupedVaccinations` computed by adding a downstream `displayedGroups` computed in `WallecxApp.vue` that applies: filter by `searchQuery` → sort by `sortMode` → always re-pin Uncategorized last. The template switches from `groupedVaccinations` to `displayedGroups`. `groupedVaccinations` remains unchanged (still the source of truth for grouping logic).

### Claude's Discretion
- Whether the "Name A–Z / Name Z–A" sort uses `latestRecord.vaccine_name` (most recent record's name per group) — SORT-01 specifies `latestRecord.vaccine_name` explicitly.
- Toolbar layout: single flex row, `gap-2` or `gap-4`, same row width as the card grid below it.
- Icon for the "no results" empty state (suggested: `mdi:magnify-remove-outline` or `mdi:text-search` — distinct from `mdi:needle-off` used for zero-records).
- Exact `placeholder` text on the search InputText (suggested: `"Search by name or type…"`).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEARCH-01 | Typing in the search input filters visible group cards in real-time (case-insensitive); a group is shown if its `vaccine_type` contains the query OR any record in the group has a `vaccine_name` containing the query; empty query shows all groups | `displayedGroups` computed: `group.vaccineType.toLowerCase().includes(query) \|\| group.records.some(r => r.vaccine_name.toLowerCase().includes(query))` — pure computed over `groupedVaccinations`, zero network calls |
| SEARCH-02 | When search yields no matching groups, a distinct "no results" empty state is shown (separate from the zero-records empty state) | Fourth `v-else-if` branch in WallecxApp.vue template: `displayedGroups.length === 0 && searchQuery` — placed after `records.length === 0` branch; uses `mdi:magnify-remove-outline` + "Clear search" Button |
| SORT-01 | Sort control offers 4 options — "Type A–Z" (default), "Type Z–A", "Name A–Z", "Name Z–A"; Uncategorized card is always pinned last regardless of sort direction | `displayedGroups` computed switch on `sortMode`; split named/uncategorized before sort, rejoin after; `name-*` sorts use `latestRecord.vaccine_name` per spec |
</phase_requirements>

---

## Summary

Phase 7 is a pure frontend computed-pipeline extension with one new component (`WallecxToolbar.vue`) and two modifications to `WallecxApp.vue` (two new refs + one new computed + template changes). No new npm packages, no PocketBase queries, no new CSS custom properties. All three requirements (SEARCH-01, SEARCH-02, SORT-01) are satisfied by a single `displayedGroups` computed that wraps the existing `groupedVaccinations` computed with a filter step, a sort step, and a post-sort Uncategorized pinning step.

Phase 6 is already executed and landed. The current `WallecxApp.vue` on disk (confirmed by direct read) already contains `groupedVaccinations`, `VaccineGroup` interface, `showGroupPanel`, `selectedGroup`, the card grid template, and the Drawer wiring. Phase 7 builds on this exact state. The three conditional branches in the current template (`isLoading`, `records.length === 0`, `v-else`) need to become four branches by inserting the no-results branch between the zero-records branch and the `v-else`.

The UI-SPEC (07-UI-SPEC.md) is fully approved and provides complete template code for `WallecxToolbar.vue` and the `displayedGroups` computed. The planner's job is to sequence two execution tasks: (1) create `WallecxToolbar.vue`, and (2) extend `WallecxApp.vue` with the two refs, `displayedGroups` computed, toolbar wiring, and template branch updates.

**Primary recommendation:** Two-plan execution — Plan 1: create `WallecxToolbar.vue`; Plan 2: extend `WallecxApp.vue`. Plans can be sequenced (Plan 2 imports the component created in Plan 1) or merged into one plan with two tasks.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Search query state | Frontend (Vue ref) | — | `searchQuery: ref("")` in `WallecxApp.vue`; no server involvement — SEARCH-01 is client-side only |
| Sort mode state | Frontend (Vue ref) | — | `sortMode: ref("type-asc")` in `WallecxApp.vue`; pure display preference |
| Filter + sort logic | Frontend (computed) | — | `displayedGroups` computed: derives from `groupedVaccinations`; no async, no PocketBase |
| Toolbar UI | Frontend (component) | — | `WallecxToolbar.vue` is a dumb presentational component; all state lives in parent |
| "No results" empty state | Frontend (template branch) | — | Conditional rendering in `WallecxApp.vue` — fourth `v-else-if` |
| Group card rendering | Frontend (component) | — | `VaccinationGroupCard.vue` — unchanged; receives data from `displayedGroups` v-for |

---

## Codebase State (VERIFIED — Phase 6 already executed)

This section records exactly what exists on disk before Phase 7 touches anything. The planner must treat this as the integration baseline.

### WallecxApp.vue — Confirmed Existing State [VERIFIED: direct file read]

**Script setup — existing refs (lines 12–24):**
```typescript
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);
const selectedRecord = ref<Vaccinations | null>(null);
const showDetail = ref(false);
const fileToken = ref<string>("");
const listToken = ref<string>("");
const showManage = ref<boolean>(false);
const manageRecord = ref<Vaccinations | null>(null);
const confirm = useConfirm();
const isExporting = ref(false);
const showGroupPanel = ref(false);
const selectedGroup = ref<VaccineGroup | null>(null);
```

**VaccineGroup interface (lines 27–31) — already present, correct shape:**
```typescript
interface VaccineGroup {
  vaccineType: string;         // "COVID-19", "Flu", ..., "Uncategorized"
  records: Vaccinations[];     // order preserved from records ref (sorted -date_administered)
  latestRecord: Vaccinations;  // records[0] — most recent by date_administered
}
```

**groupedVaccinations computed (lines 33–56) — already present, unchanged by Phase 7:**
```typescript
const groupedVaccinations = computed<VaccineGroup[]>(() => {
  // Map iteration → named/uncategorized split → localeCompare sort → [...named, ...uncategorized]
});
```

**Imports (lines 1–11):**
```typescript
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import ManageVaccination from "./ManageVaccination.vue";
import VaccinationGroupCard from "./VaccinationGroupCard.vue";
import VaccinationGroupPanel from "./VaccinationGroupPanel.vue";
```

**Template conditional branches (current — 3 branches):**
1. `v-if="isLoading"` — skeleton card grid (3 skeleton Cards)
2. `v-else-if="records.length === 0"` — zero-records empty state (`mdi:needle-off`)
3. `v-else` — grouped card grid with `v-for="group in groupedVaccinations"`

**Template toolbar insertion point:** The `WallecxToolbar` must be inserted between the header row (`<div class="flex items-center justify-between mb-4">`) and the `v-if="isLoading"` block. It sits above ALL conditional branches and is always visible.

**`v-for` target to replace:** `v-for="group in groupedVaccinations"` → `v-for="group in displayedGroups"`

### VaccinationGroupCard.vue — Props Contract [VERIFIED: direct file read]

```typescript
defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>()
defineEmits<{ click: [] }>()
```

`displayedGroups` produces the same `VaccineGroup[]` shape as `groupedVaccinations` — the card's props are satisfied identically. No changes to the card component.

### VaccinationGroupPanel.vue — Unchanged [VERIFIED: direct file read]

Props: `{ records: Vaccinations[]; listToken: string }`. No Phase 7 changes.

### Vaccinations Type Interface [VERIFIED: direct file read]

```typescript
export interface Vaccinations extends RecordModel {
  vaccine_type: string;    // GROUP-02 — present since Phase 5
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  // ... other fields
}
```

`latestRecord.vaccine_name` (used in `name-asc` / `name-desc` sort) is `string` — non-optional. No null-coalescing needed for the sort comparator in the main case, but the UI-SPEC uses `?? ''` as a defensive guard (`latestRecord.vaccine_name ?? ''`) — follow that pattern.

---

## Standard Stack

### Core (no new packages — all already installed) [VERIFIED: node_modules inspection + components.d.ts]

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| PrimeVue | 4.5.5 | `IconField`, `InputIcon`, `Select`, `InputText`, `Button` | Already installed; `IconField`, `InputIcon`, `Select` not yet in `components.d.ts` but confirmed present in `node_modules/primevue/iconfield/`, `inputicon/`, `select/` |
| Vue 3 | (project baseline) | `computed`, `ref` | Already in use |
| Tailwind CSS 4 | (project baseline) | Toolbar layout (`flex`, `gap-2`, `mb-4`, `flex-1`, `w-36`) | Already in use |

**No `npm install` needed.** All three new PrimeVue components are part of the existing `primevue@4.5.5` installation.

### PrimeVue Components — Auto-Import Behavior [VERIFIED: vite.config.ts + components.d.ts]

`PrimeVueResolver` is configured in `vite.config.ts`. It resolves PrimeVue component names to their package imports automatically. `components.d.ts` is generated by `unplugin-vue-components` and already declares `InputText`, `Button`, `Card`, `Badge`, etc. When `IconField`, `InputIcon`, and `Select` are used in a template for the first time, `unplugin-vue-components` regenerates `components.d.ts` to include them.

**Critical rule:** Do NOT manually import `IconField`, `InputIcon`, `Select`, `InputText`, or `Button` in any `<script setup>` block. PrimeVueResolver handles it. Manual imports alongside auto-resolver imports cause duplicate registration warnings.

---

## Architecture Patterns

### System Architecture Diagram

```
User input (search text / sort selection)
          |
          v
WallecxToolbar.vue  ←────────────────────────────────────┐
  emits update:searchQuery                                │ v-model:search-query
  emits update:sortMode                                   │ v-model:sort-mode
          |                                               │
          v                                               │
WallecxApp.vue                                           │
  searchQuery ref ──────────────────────────────────────►│
  sortMode ref ─────────────────────────────────────────►│
          |
          v
  groupedVaccinations (computed, unchanged)
  [groups all records by vaccine_type, sorts type-asc, pins Uncategorized last]
          |
          v
  displayedGroups (computed, NEW)
  Step 1: filter by searchQuery (vaccineType OR any record.vaccine_name)
  Step 2: split named / uncategorized
  Step 3: sort named by sortMode
  Step 4: rejoin [...named, ...uncategorized]
          |
          v
  Template conditional branches:
  ┌─ v-if isLoading          → skeleton grid (unchanged)
  ├─ v-else-if records.length === 0  → zero-records empty state (unchanged)
  ├─ v-else-if displayedGroups.length === 0 && searchQuery  → no-results state (NEW)
  └─ v-else                  → card grid v-for displayedGroups (changed from groupedVaccinations)
```

### Recommended Project Structure (no changes to folder layout)

```
src/components/projects/wallecx/
├── WallecxApp.vue           # modified — new refs, displayedGroups, toolbar wiring, template branch
├── WallecxToolbar.vue       # NEW — search input + sort select; v-model:searchQuery, v-model:sortMode
├── VaccinationGroupCard.vue # UNCHANGED
├── VaccinationGroupPanel.vue# UNCHANGED
├── VaccinationDetail.vue    # UNCHANGED
├── ManageVaccination.vue    # UNCHANGED
├── AttachmentPreview.vue    # UNCHANGED
└── VaccinationList.vue      # UNCHANGED (kept on disk, not used in template)
```

### Pattern 1: v-model on Custom Components (Vue 3 defineEmits pattern)

`WallecxToolbar.vue` uses the Vue 3 `defineProps` + `defineEmits` v-model pattern for two separate bindings:

```typescript
// Source: 07-UI-SPEC.md (approved design contract)
const props = defineProps<{
  searchQuery: string;
  sortMode: string;
}>();
const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:sortMode': [value: string];
}>();
```

Parent usage in `WallecxApp.vue`:
```html
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
/>
```

Note the kebab-case prop names in the template (`search-query`, `sort-mode`) mapping to camelCase in the component (`searchQuery`, `sortMode`). Vue 3 handles this transformation automatically.

### Pattern 2: IconField with Dual InputIcon (PrimeVue 4)

PrimeVue 4 `IconField` supports both left and right `InputIcon` slots. The right `InputIcon` is conditionally rendered as the inline × clear button:

```html
<!-- Source: 07-UI-SPEC.md (approved design contract) -->
<IconField class="flex-1">
  <InputIcon class="pi pi-search" />
  <InputText
    :value="searchQuery"
    placeholder="Search by name or type…"
    class="w-full"
    @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
  />
  <InputIcon
    v-if="searchQuery"
    class="pi pi-times cursor-pointer"
    @click="emit('update:searchQuery', '')"
  />
</IconField>
```

Key detail: `InputText` uses `:value` (one-way binding) + `@input` event rather than `v-model`. This is required because the actual ref lives in the parent (`WallecxApp.vue`) and the toolbar only emits upward. Using `v-model` on `InputText` inside the toolbar would create a disconnected local state.

### Pattern 3: displayedGroups Computed Pipeline

The computed follows the filter → split → sort → rejoin pattern established by `groupedVaccinations` in Phase 6. This is the critical implementation — it must:

1. Filter on the `filtered` result (not `groupedVaccinations.value` directly) when splitting named/uncategorized
2. Skip re-sort for `type-asc` (preserve the already-sorted `groupedVaccinations` order)
3. Use `localeCompare` with `{ sensitivity: 'base' }` for case-insensitive sort (matching Phase 6 convention)

```typescript
// Source: 07-UI-SPEC.md (approved design contract — verbatim)
const displayedGroups = computed<VaccineGroup[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const filtered = query
    ? groupedVaccinations.value.filter(
        (group) =>
          group.vaccineType.toLowerCase().includes(query) ||
          group.records.some((r) => r.vaccine_name.toLowerCase().includes(query))
      )
    : groupedVaccinations.value;

  const named = filtered.filter((g) => g.vaccineType !== 'Uncategorized');
  const uncategorized = filtered.filter((g) => g.vaccineType === 'Uncategorized');

  switch (sortMode.value) {
    case 'type-desc':
      named.sort((a, b) =>
        b.vaccineType.localeCompare(a.vaccineType, undefined, { sensitivity: 'base' })
      );
      break;
    case 'name-asc':
      named.sort((a, b) =>
        (a.latestRecord.vaccine_name ?? '').localeCompare(
          b.latestRecord.vaccine_name ?? '',
          undefined,
          { sensitivity: 'base' }
        )
      );
      break;
    case 'name-desc':
      named.sort((a, b) =>
        (b.latestRecord.vaccine_name ?? '').localeCompare(
          a.latestRecord.vaccine_name ?? '',
          undefined,
          { sensitivity: 'base' }
        )
      );
      break;
    case 'type-asc':
    default:
      break; // groupedVaccinations already sorted type-asc — preserve order
  }

  return [...named, ...uncategorized];
});
```

### Pattern 4: Template Branch Ordering (four-branch conditional)

**Why ordering matters:** If `records.length === 0` is not checked before `displayedGroups.length === 0 && searchQuery`, a race condition is possible: user types into toolbar before records load, `displayedGroups` is empty, `searchQuery` is truthy → no-results state fires while records are still loading (isLoading=false but records=[]).

Correct order (top to bottom):
1. `v-if="isLoading"` — skeleton
2. `v-else-if="records.length === 0"` — zero records (fresh account, gated on raw data)
3. `v-else-if="displayedGroups.length === 0 && searchQuery"` — no search results
4. `v-else` — card grid with `displayedGroups`

### Anti-Patterns to Avoid

- **v-model on InputText in toolbar:** Using `v-model="searchQuery"` inside `WallecxToolbar.vue` would not work — the ref lives in the parent. Use `:value` + `@input` emitting upward.
- **Debouncing the search:** D-07 locks instant search. Do not add `setTimeout`, `useDebounceFn`, or `watchDebounced`.
- **Manual PrimeVue imports:** `import { IconField } from 'primevue/iconfield'` in `<script setup>` conflicts with PrimeVueResolver auto-import. Never add manual imports for PrimeVue components.
- **v-html for the no-results message:** The dynamic query string in `"No groups match '{{ searchQuery }}'"` must use `{{ }}` mustache interpolation, never `v-html`. The 07-UI-SPEC.md constraint checklist explicitly flags this.
- **Sorting inline with filter (no split first):** Sorting the full `filtered` array without splitting out Uncategorized first means Uncategorized gets mixed into alphabetical sort position ("U" between "T" and "V"). Always split → sort named only → rejoin.
- **Re-sorting for type-asc:** For the default `type-asc` mode, `groupedVaccinations` already sorts type-asc (with `localeCompare sensitivity: base`). Calling `.sort()` again is wasted work. The `default: break` in the switch is intentional.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search icon inside input | Custom CSS positioning | PrimeVue `IconField` + `InputIcon` | IconField handles left/right icon slots, InputText padding, and focus ring — all consistent with Aura theme |
| Sort dropdown | `<select>` or custom dropdown | PrimeVue `Select` with `option-label` + `option-value` | Aura-themed, accessible, keyboard-navigable, mobile-friendly out of the box |
| Debounced search | `setTimeout` wrapper | Nothing — instant search is correct here | Dataset is small; instant computed is the right call per D-07 |
| Computed composition | Single mega-computed | Two chained computeds (`groupedVaccinations` → `displayedGroups`) | Separation keeps grouping logic isolated from filter/sort; `groupedVaccinations` remains the Phase 8 (view toggle) source too |

---

## Common Pitfalls

### Pitfall 1: Uncategorized Sorts Into Alphabetical Position
**What goes wrong:** Sorting the entire `filtered` array (including Uncategorized) by `vaccineType` places Uncategorized at "U" position — between "T" and "V" groups. Breaks SORT-01 ("always pinned last").
**Why it happens:** Developer forgets to split before sorting.
**How to avoid:** Always split `filtered` into `named` (vaccineType !== 'Uncategorized') and `uncategorized` (vaccineType === 'Uncategorized') before the sort switch. Rejoin as `[...named, ...uncategorized]` after.
**Warning signs:** Test: select "Type Z–A" and verify Uncategorized is still last, not before "V" groups.

### Pitfall 2: No-Results Branch Before Zero-Records Branch
**What goes wrong:** `displayedGroups.length === 0 && searchQuery` fires while `records` is still empty (race: user types before load completes, `isLoading` is false but records=[]).
**Why it happens:** Wrong `v-else-if` ordering in template.
**How to avoid:** Branch 2 (`records.length === 0`) must always precede Branch 3 (`displayedGroups.length === 0 && searchQuery`). See Pattern 4.
**Warning signs:** "No groups match..." appearing on a fresh account even when user hasn't searched.

### Pitfall 3: InputText v-model Instead of :value + @input
**What goes wrong:** `<InputText v-model="searchQuery" />` inside `WallecxToolbar.vue` would bind to a prop (which is read-only in Vue 3). Runtime warning: "Set operation on key 'searchQuery' failed".
**Why it happens:** Forgetting that the ref lives in the parent, not the toolbar.
**How to avoid:** Use `:value="searchQuery"` and `@input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"` as specified in the UI-SPEC.
**Warning signs:** TypeScript or Vue runtime warning about mutating a prop.

### Pitfall 4: Toolbar Wrapped in a Conditional Branch
**What goes wrong:** If `WallecxToolbar` is placed inside any `v-if`/`v-else-if` branch, it disappears during loading or empty states — user cannot interact with it.
**Why it happens:** Developer places the toolbar inside the conditional block for visual grouping.
**How to avoid:** `WallecxToolbar` must be a sibling of the conditional block, inserted between the header row and the `v-if="isLoading"` block. Always rendered.
**Warning signs:** Search input disappears when data is loading.

### Pitfall 5: VaccinationGroupCard v-for Key Collision After Filter
**What goes wrong:** `:key="group.vaccineType"` on `VaccinationGroupCard` is already the pattern from Phase 6. After filtering, the remaining groups still have unique `vaccineType` values — no collision risk. However, if a developer changes the key to something else, Vue diff may re-mount cards unnecessarily.
**Why it happens:** Misunderstanding what keys are for.
**How to avoid:** Keep `:key="group.vaccineType"` — it is already unique within any filtered subset. No change needed.

### Pitfall 6: WallecxToolbar Not Imported in WallecxApp.vue
**What goes wrong:** `WallecxToolbar` is a local `.vue` file, not a PrimeVue component — PrimeVueResolver will NOT auto-import it. It must be explicitly imported.
**Why it happens:** Developer relies on auto-import for everything.
**How to avoid:** Add `import WallecxToolbar from './WallecxToolbar.vue';` to the script setup block of `WallecxApp.vue`. This is consistent with how `VaccinationGroupCard` and `VaccinationGroupPanel` are imported (both are explicit imports in the existing file).
**Warning signs:** `WallecxToolbar` renders as an unknown element in the browser.

---

## Code Examples

### WallecxToolbar.vue — Complete Component

```vue
<!-- Source: 07-UI-SPEC.md Component Specifications §1 (approved contract) -->
<script setup lang="ts">
const props = defineProps<{
  searchQuery: string;
  sortMode: string;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:sortMode': [value: string];
}>();

const sortOptions = [
  { value: 'type-asc',  label: 'Type A–Z' },
  { value: 'type-desc', label: 'Type Z–A' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];
</script>

<template>
  <div class="flex items-center gap-2 mb-4">
    <IconField class="flex-1">
      <InputIcon class="pi pi-search" />
      <InputText
        :value="searchQuery"
        placeholder="Search by name or type…"
        class="w-full"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <InputIcon
        v-if="searchQuery"
        class="pi pi-times cursor-pointer"
        @click="emit('update:searchQuery', '')"
      />
    </IconField>
    <Select
      :model-value="sortMode"
      :options="sortOptions"
      option-label="label"
      option-value="value"
      class="w-36"
      @update:model-value="emit('update:sortMode', $event)"
    />
  </div>
</template>
```

**Note on special characters:** Sort option labels use en-dash `–` (U+2013) per the UI-SPEC copywriting contract. Do not substitute a hyphen `-`. The placeholder uses horizontal ellipsis `…` (U+2026).

### WallecxApp.vue — New Refs (insertion point)

```typescript
// Source: 07-UI-SPEC.md §2a
// Insert after: const selectedGroup = ref<VaccineGroup | null>(null);
const searchQuery = ref<string>('');
const sortMode = ref<string>('type-asc');
```

### WallecxApp.vue — New Import

```typescript
// Source: 07-CONTEXT.md §Canonical Refs
// Insert after: import VaccinationGroupPanel from './VaccinationGroupPanel.vue';
import WallecxToolbar from './WallecxToolbar.vue';
```

### WallecxApp.vue — No-Results Empty State Branch

```html
<!-- Source: 07-UI-SPEC.md §2d Template changes -->
<!-- SEARCH-02: no results state — placed after records.length === 0, before v-else -->
<div
  v-else-if="displayedGroups.length === 0 && searchQuery"
  class="flex flex-col items-center py-12 gap-3"
>
  <iconify-icon
    icon="mdi:magnify-remove-outline"
    width="48"
    height="48"
    style="color: var(--color-brand-primary)"
  ></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">
    No groups match "{{ searchQuery }}"
  </p>
  <Button
    label="Clear search"
    severity="secondary"
    size="small"
    @click="searchQuery = ''"
  />
</div>
```

### WallecxApp.vue — Toolbar Insertion in Template

```html
<!-- Source: 07-UI-SPEC.md §2d -->
<!-- Insert between the header row and the v-if="isLoading" block -->
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single flat `groupedVaccinations` computed feeding template | Two-level computed (`groupedVaccinations` → `displayedGroups`) | Phase 7 | Clean separation of grouping logic vs filter/sort; Phase 8 can plug view-mode into `displayedGroups` without touching grouping |
| `v-for="group in groupedVaccinations"` | `v-for="group in displayedGroups"` | Phase 7 | Template change is one attribute; grouping logic untouched |
| Three template branches (loading / zero-records / grid) | Four branches (loading / zero-records / no-results / grid) | Phase 7 | Adds SEARCH-02 no-results state as a distinct branch |

---

## Runtime State Inventory

Step 2.5 SKIPPED — Phase 7 is not a rename, refactor, or migration phase. It adds new refs and a new computed to an existing Vue component. No stored data, no live service config, no OS-registered state, no secrets, and no build artifacts carry any string that is being changed.

---

## Environment Availability

Step 2.6: No new external dependencies identified. All Phase 7 work is pure frontend Vue/TypeScript changes against already-installed packages. PrimeVue 4.5.5 is confirmed present with `IconField`, `InputIcon`, and `Select` modules verified in `node_modules/primevue/`. Node.js v22.14.0 is available for the build toolchain.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| primevue (IconField, InputIcon, Select) | WallecxToolbar.vue | Yes | 4.5.5 | — |
| Node.js | npm run type-check / build | Yes | v22.14.0 | — |

---

## Validation Architecture

`nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is skipped per config.

---

## Security Domain

Phase 7 introduces no new data fetch, no new authentication surface, no new file handling, and no new persistence layer. The only new user-controlled input is the `searchQuery` string, which is:

- Rendered back to the user via `{{ searchQuery }}` mustache interpolation in the no-results message — not `v-html`. XSS is not possible through Vue's default text interpolation.
- Used only inside `String.prototype.includes()` for client-side filtering — no PocketBase filter strings are constructed from it.

The "no results" constraint checklist in `07-UI-SPEC.md` explicitly states: "No `v-html` — `searchQuery` is echoed via `{{ }}` mustache, never `v-html`."

No new ASVS categories apply beyond what is already addressed by prior phases.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `VaccinationGroupCard.vue` and `VaccinationGroupPanel.vue` are unchanged from Phase 6 execution (assumed Phase 6 was executed as planned) | Codebase State | These were read directly from disk — VERIFIED. Not an assumption. |
| A2 | `components.d.ts` will auto-update to include `IconField`, `InputIcon`, `Select` when first used in a template with dev server or build running | Standard Stack | If `components.d.ts` does not update, TypeScript type-check may warn about unknown components — resolve by running `npm run dev` or `npm run type-check` once |

**All other claims are VERIFIED by direct file reads or direct node_modules inspection in this session.**

---

## Open Questions

1. **Plan count: 1 plan or 2 plans?**
   - What we know: Phase 7 has two deliverables — `WallecxToolbar.vue` (new file) and `WallecxApp.vue` extensions.
   - What's unclear: Whether the planner prefers a single plan with two tasks (Task 1: toolbar component, Task 2: app extensions) or two separate plans. The State.md note says "likely 2 plans."
   - Recommendation: A single plan with two sequential tasks is sufficient (Task 1 creates the toolbar; Task 2 imports it and extends the app). This mirrors the Phase 6 Plan 1 + Plan 2 pattern but with less complexity — both tasks can safely be in one plan since Task 2 has an explicit dependency on Task 1's output.

2. **`VaccinationList.vue` handling**
   - What we know: `VaccinationList.vue` still exists on disk (kept from Phase 6 execution). It is not used in `WallecxApp.vue`'s template.
   - What's unclear: No cleanup task was specified for Phase 7.
   - Recommendation: Leave `VaccinationList.vue` on disk — it is out of scope for Phase 7 per CONTEXT.md "Files Untouched" list. Do not add a cleanup task.

---

## Sources

### Primary (HIGH confidence)
- `WallecxApp.vue` — direct file read; exact state of refs, computed, interface, template confirmed
- `VaccinationGroupCard.vue` — direct file read; props/emits contract confirmed
- `VaccinationGroupPanel.vue` — direct file read; unchanged status confirmed
- `src/types/wallecx/vaccinations/types.d.ts` — direct file read; `vaccine_name: string` (non-optional) confirmed
- `node_modules/primevue/iconfield/`, `inputicon/`, `select/` — directory listing confirmed all three modules present at PrimeVue 4.5.5
- `components.d.ts` — direct file read; auto-import registry confirmed; `IconField`/`InputIcon`/`Select` not yet registered (first use will trigger regeneration)
- `vite.config.ts` — direct file read; `PrimeVueResolver` + `unplugin-vue-components` configuration confirmed
- `.planning/phases/07-toolbar-search-sort/07-CONTEXT.md` — upstream decisions read
- `.planning/phases/07-toolbar-search-sort/07-UI-SPEC.md` — approved design contract read (APPROVED 2026-05-13)
- `.planning/config.json` — `nyquist_validation: false` confirmed

### Secondary (MEDIUM confidence)
- `.planning/phases/06-grouped-card-view-group-detail-panel/06-01-PLAN.md` — Phase 6 plan confirms `VaccineGroup` interface shape and `groupedVaccinations` computed structure
- `.planning/phases/06-grouped-card-view-group-detail-panel/06-02-PLAN.md` — Phase 6 plan confirms Drawer wiring and `VaccinationGroupPanel` import

---

## Metadata

**Confidence breakdown:**
- Codebase state (what exists on disk): HIGH — direct file reads in this session
- PrimeVue component availability: HIGH — node_modules inspected
- Computed pipeline pattern: HIGH — verbatim from approved 07-UI-SPEC.md
- Template branch ordering: HIGH — confirmed against actual WallecxApp.vue template structure
- Auto-import behavior: HIGH — vite.config.ts + components.d.ts inspected

**Research date:** 2026-05-13
**Valid until:** Until Phase 6 state changes (WallecxApp.vue or VaccinationGroupCard.vue modified) — currently stable.

## RESEARCH COMPLETE
