---
phase: 7
slug: toolbar-search-sort
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-13
baseline: .planning/phases/06-grouped-card-view-group-detail-panel/06-UI-SPEC.md
---

# Phase 7 — UI Design Contract

> Visual and interaction contract for Phase 7: Toolbar — Search & Sort.
> All base design tokens, spacing, typography, color, and interaction patterns are
> inherited unchanged from Phase 6 (`06-UI-SPEC.md`), which itself inherits from the
> Phase 3 baseline. This document specifies the Phase 7 delta only: `WallecxToolbar.vue`
> (new component), modifications to `WallecxApp.vue` (new refs, new computed, new
> empty-state branch, toolbar insertion), and all new copywriting strings.
>
> Do not re-specify anything described in `06-UI-SPEC.md`. Use that file as the
> authoritative source for spacing scale, typography roles, color tokens, and
> component patterns not modified here.

---

## Design System

Fully inherited from Phase 6 UI-SPEC. No changes.

| Property | Value |
|----------|-------|
| Tool | none (PrimeVue 4 + Tailwind CSS 4) |
| Preset | MyPreset — Aura base, navy primary scale (#002244 at 500), amber highlight (#e89820) — configured in `src/main.ts` |
| Component library | PrimeVue 4 (auto-imported via `PrimeVueResolver`) |
| Icon library | `iconify-icon` web component, `mdi:*` icon set |
| Font | Rubik (Google Fonts) — weights 400, 700 |

**shadcn gate result:** Not applicable. Project uses PrimeVue 4 + Tailwind CSS 4. No `components.json`. Registry safety gate is not required.

**New PrimeVue components in Phase 7 (auto-imported — no manual import):**

| Component | Node Modules Path | Status |
|-----------|-------------------|--------|
| `IconField` | `node_modules/primevue/iconfield/` | Confirmed present (PrimeVue 4.5.5) |
| `InputIcon` | `node_modules/primevue/inputicon/` | Confirmed present (PrimeVue 4.5.5) |
| `Select` | `node_modules/primevue/select/` | Confirmed present (PrimeVue 4.5.5) |

`InputText` and `Button` are already in use from prior phases — no new entry.

**Delta:** Three new PrimeVue components enter the template (`IconField`, `InputIcon`, `Select`). No new npm packages. No new CSS custom properties.

---

## Spacing Scale

Fully inherited from Phase 6 UI-SPEC. Phase 7 adds toolbar-specific usages only.

| Token | Value | Phase 7 Usage |
|-------|-------|---------------|
| xs | 4px | Not directly used in toolbar |
| sm | 8px | Gap between search input and sort select in toolbar row (`gap-2`) |
| md | 16px | Bottom margin below the toolbar row before the card grid (`mb-4`) |
| lg | 24px | Unchanged — Drawer inner content padding (Phase 6) |
| xl | 32px | Unchanged — WallecxApp Card header row bottom margin |
| 2xl | 48px | Unchanged — Empty-state vertical padding (`py-12`) |
| 3xl | 64px | Not used |

**Toolbar row gap:** `gap-2` (8px) between search `IconField` and sort `Select`. This keeps the toolbar compact and consistent with the header row button gap.

**Toolbar bottom margin:** `mb-4` (16px) below the toolbar row — same bottom margin as the header row uses (`mb-4`). Creates uniform visual rhythm between header → toolbar → card grid.

**No new spacing exceptions.** Search input and sort select width rules are layout constraints (see Component Specifications), not spacing token overrides.

---

## Typography

Fully inherited from Phase 6 UI-SPEC. No new type roles in Phase 7.

| Role | Size | Weight | Line Height | Token / Class | Phase 7 Usage |
|------|------|--------|-------------|---------------|---------------|
| Body | 14px | 400 (Regular) | 1.5 | `text-sm` | Search input text; sort dropdown selected value text; "No groups match…" empty state message; "Clear search" button label |
| Group card title | 18px | 700 (Bold) | 1.2 | `text-lg font-bold` | Unchanged from Phase 6 |
| Heading | 24px | 700 (Bold) | 1.2 | `text-2xl font-bold` | Unchanged — "Wallecx" page title |
| Dialog Header | 14–16px | 400 (Regular) | 1.2 | PrimeVue Aura default | Unchanged — Drawer header |

**Weight constraint:** Two weights only — 400 and 700. No weight 500 or 600 anywhere in Phase 7.

**Placeholder text** (`"Search by name or type…"`) renders at PrimeVue Aura's default placeholder style — no override. Aura renders placeholder at weight 400, muted color. This is correct; do not override.

**Sort Select option labels** render at PrimeVue Aura's default dropdown option style — no override.

**Delta:** No new type roles. All Phase 7 text elements map to the existing `text-sm` (body) role.

---

## Color

Fully inherited from Phase 6 UI-SPEC. No new tokens in Phase 7.

| Role | Value | Token | Phase 7 Usage |
|------|-------|-------|---------------|
| Dominant (60%) | `#f5f7fa` | `--color-surface-page` | Unchanged — page background |
| Secondary (30%) | `#ffffff` | `--color-surface-card` | Unchanged — WallecxApp outer Card surface |
| Accent navy | `#002244` | `--color-brand-primary` | "No results" empty-state `mdi:magnify-remove-outline` icon; "Add vaccination" header button (inherited); search icon `pi pi-search` tinted by Aura default |
| Accent warm | `#e89820` | `--color-brand-accent` | Reserved — no Phase 7 usages |
| Text heading | `#0d1117` | `--color-typo-heading` | "No groups match '…'" message text in no-results empty state |
| Text body | `#3d4a5c` | `--color-typo-body` | Not directly applied in toolbar (PrimeVue Aura controls InputText and Select internal text) |
| Text muted | `#6b7280` | `--color-typo-muted` | Placeholder text in search input (PrimeVue Aura default — do not override) |
| Destructive | `#c0392b` | `--color-status-error` | No new destructive elements in Phase 7 |

**Accent reserved for (Phase 7 additions):**
- "No results" empty-state icon: `style="color: var(--color-brand-primary)"` — same pattern as Phase 6 `mdi:needle-off` icon

**"Clear search" button** uses `severity="secondary"` — PrimeVue Aura renders this as a neutral grey outlined/filled button. No custom color. Not an accent usage.

**Search `×` clear button** (inline inside `IconField`): rendered as a plain icon button — no severity prop needed. Uses `pi pi-times` icon. Color inherits from Aura's `InputText` internal icon styling. Do not apply custom color.

**Sort Select dropdown:** PrimeVue Aura renders option list with standard surface and body text colors. No overrides.

**Delta:** No new color tokens. No new amber usages. No new custom properties.

---

## Component Specifications — Phase 7 Delta

### 1. WallecxToolbar.vue — New Component

**File:** `src/components/projects/wallecx/WallecxToolbar.vue`

**Props (v-model pattern):**
```typescript
const props = defineProps<{
  searchQuery: string;
  sortMode: string;
}>();
const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:sortMode': [value: string];
}>();
```

**Sort options (declared as a constant inside `<script setup>`):**
```typescript
const sortOptions = [
  { value: 'type-asc',  label: 'Type A–Z' },
  { value: 'type-desc', label: 'Type Z–A' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];
```

**Template:**
```html
<template>
  <div class="flex items-center gap-2 mb-4">
    <!-- Search input: IconField with left search icon and conditional right clear button -->
    <IconField class="flex-1">
      <InputIcon class="pi pi-search" />
      <InputText
        :value="searchQuery"
        placeholder="Search by name or type…"
        class="w-full"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <!-- Inline × clear: only rendered when searchQuery is non-empty -->
      <InputIcon
        v-if="searchQuery"
        class="pi pi-times cursor-pointer"
        @click="emit('update:searchQuery', '')"
      />
    </IconField>

    <!-- Sort select dropdown -->
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

**Width rules:**
- Search `InputText`: `flex-1` — grows to fill remaining toolbar width after the sort select.
- Sort `Select`: `w-36` (144px) — fixed width; wide enough to display all 4 option labels without truncation at all viewport sizes ≥ 320px.

**Phase 8 extension point:** The view toggle button (Phase 8) will be appended inside this same `<div class="flex items-center gap-2 mb-4">` row, after the sort `Select`. No structural changes to this component will be needed — only a new child element added.

---

### 2. WallecxApp.vue — Modifications

#### 2a. New refs

```typescript
const searchQuery = ref<string>('');
const sortMode = ref<string>('type-asc');
```

Both declared directly after the existing `showGroupPanel` and `selectedGroup` refs, in the `// --- STATE ---` block.

#### 2b. New computed: `displayedGroups`

Added immediately after the existing `groupedVaccinations` computed:

```typescript
const displayedGroups = computed<VaccineGroup[]>(() => {
  // Step 1: filter (SEARCH-01)
  const query = searchQuery.value.trim().toLowerCase();
  const filtered = query
    ? groupedVaccinations.value.filter(
        (group) =>
          group.vaccineType.toLowerCase().includes(query) ||
          group.records.some((r) =>
            r.vaccine_name.toLowerCase().includes(query)
          )
      )
    : groupedVaccinations.value;

  // Step 2: sort (SORT-01) — split named/uncategorized first to preserve pinning
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
      // groupedVaccinations already sorted type-asc — preserve order
      break;
  }

  // Step 3: re-pin Uncategorized last regardless of sort direction (D-06 carried from Phase 6)
  return [...named, ...uncategorized];
});
```

**Key implementation notes:**
- `groupedVaccinations` is the upstream source — `displayedGroups` only filters and re-sorts; it never re-groups.
- For `type-asc`, the sort from `groupedVaccinations` is preserved (no re-sort). This avoids unnecessary work and maintains referential stability.
- `latestRecord.vaccine_name` is used for `name-asc` / `name-desc` per SORT-01 specification — this is the most recent record's vaccine name for the group.
- The Uncategorized split happens on the `filtered` array, not on `groupedVaccinations.value`, so Uncategorized pinning applies correctly even when the Uncategorized group passes the search filter.

#### 2c. Import WallecxToolbar

```typescript
import WallecxToolbar from './WallecxToolbar.vue';
```

Added alongside the other component imports at the top of `<script setup>`.

#### 2d. Template changes

**Replace** the existing `<div class="flex items-center justify-between mb-4">` header row's bottom element — no change to the header row itself.

**Insert** `<WallecxToolbar>` between the header row and the loading/empty/data sections:

```html
<!-- Toolbar: search + sort (SEARCH-01, SORT-01) -->
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
/>
```

**Replace** `v-for="group in groupedVaccinations"` with `v-for="group in displayedGroups"` in the grouped card grid.

**Add** a fourth empty-state branch between the zero-records branch and the grouped card grid. The full revised conditional block becomes:

```html
<!-- Loading state: skeleton card grid -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- Empty state: zero records total (GROUP-05 edge case — user has no vaccinations) -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon
    icon="mdi:needle-off"
    width="48"
    height="48"
    style="color: var(--color-brand-primary)"
  ></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  <Button
    label="Add your first vaccination"
    icon="pi pi-plus"
    size="small"
    @click="openManage(null)"
  />
</div>

<!-- Empty state: no search results (SEARCH-02 — user has records but search matches nothing) -->
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

<!-- Grouped card grid (GROUP-04, GROUP-05, D-03) -->
<div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <VaccinationGroupCard
    v-for="group in displayedGroups"
    :key="group.vaccineType"
    :vaccine-type="group.vaccineType"
    :records="group.records"
    :latest-record="group.latestRecord"
    :list-token="listToken"
    @click="openGroupPanel(group)"
  />
</div>
```

**Branch priority (top to bottom):**
1. `v-if="isLoading"` — loading skeleton
2. `v-else-if="records.length === 0"` — zero records (fresh account)
3. `v-else-if="displayedGroups.length === 0 && searchQuery"` — no search results
4. `v-else` — card grid (normal state or filtered/sorted state)

**Why this order matters:** Branch 2 must precede branch 3. If `records` is empty, `searchQuery` could be non-empty (user typed into toolbar before records loaded — race condition edge). Branch 2 gates on the raw record count, not the computed result.

---

### 3. VaccinationGroupCard.vue — Unchanged

Zero modifications. Confirmed by D-01 in 07-CONTEXT.md and the VIEW-02 / Phase 8 constraint carried into Phase 7.

### 4. VaccinationGroupPanel.vue — Unchanged

Zero modifications.

### 5. VaccinationDetail.vue — Unchanged

Zero modifications.

---

## Interaction States

### Toolbar States

| State | Condition | Rendering |
|-------|-----------|-----------|
| Empty query | `searchQuery === ''` | Search `InputText` shows placeholder text. No `×` clear icon visible. All groups shown per active sort. |
| Active query | `searchQuery.length > 0` | Search `InputText` shows entered text. `pi pi-times` `InputIcon` is rendered on the right side of `IconField`. Clicking it emits `update:searchQuery` with `''`. Card grid updates in real-time (no debounce — D-07). |
| No results | `displayedGroups.length === 0 && searchQuery !== ''` | Card grid replaced by no-results empty state (see below). Toolbar remains fully visible and interactive — user can still edit search or change sort. |

### No-Results Empty State

| Element | Spec |
|---------|------|
| Icon | `mdi:magnify-remove-outline`, 48x48, `style="color: var(--color-brand-primary)"` |
| Message | `"No groups match "{{ searchQuery }}""` — mustache interpolation, never `v-html` |
| Button | `label="Clear search"` `severity="secondary"` `size="small"` `@click="searchQuery = ''"` |
| Container | `class="flex flex-col items-center py-12 gap-3"` — identical to the zero-records empty state container class |

**Toolbar visibility in no-results state:** The toolbar (`WallecxToolbar`) is always rendered above the content area, regardless of which empty-state branch is active. It is never hidden when no results are found. The user must be able to clear or change the search query without navigating away.

**Note:** The toolbar is also always rendered during the loading state (it sits above the `v-if="isLoading"` block). `searchQuery` and `sortMode` interactions while loading are inert — the loading skeleton shows 3 cards regardless. `displayedGroups` will be empty during loading (no records yet), but the `v-if="isLoading"` branch fires first, so the no-results branch is never shown while loading.

### Sort Interaction

| Interaction | Result |
|-------------|--------|
| User selects "Type A–Z" | `sortMode = 'type-asc'` → `displayedGroups` preserves `groupedVaccinations` alphabetical order |
| User selects "Type Z–A" | `sortMode = 'type-desc'` → named groups reversed alphabetically; Uncategorized pinned last |
| User selects "Name A–Z" | `sortMode = 'name-asc'` → named groups sorted by `latestRecord.vaccine_name` ascending; Uncategorized pinned last |
| User selects "Name Z–A" | `sortMode = 'name-desc'` → named groups sorted by `latestRecord.vaccine_name` descending; Uncategorized pinned last |

**Sort + search composition:** Selecting a sort option while a search query is active re-sorts the already-filtered result. The pipeline is always filter → sort → pin Uncategorized. Changing sort does not reset the search query.

### Inline Clear Button (`×`)

- Rendered: when `searchQuery.length > 0`
- Hidden: when `searchQuery === ''`
- Click: emits `update:searchQuery` with `''` from `WallecxToolbar` → parent `searchQuery` ref resets → `displayedGroups` recomputes → card grid returns to full unfiltered set
- Implementation: `<InputIcon v-if="searchQuery" class="pi pi-times cursor-pointer" @click="emit('update:searchQuery', '')" />`

**Keyboard support:** `InputText` natively supports clearing via selecting all + delete. The `×` button is a convenience affordance, not the only way to clear.

---

## Copywriting Contract

All Phase 3, Phase 5, and Phase 6 copywriting inherited unchanged. Phase 7 adds:

| Element | Copy | Notes |
|---------|------|-------|
| Search input placeholder | `"Search by name or type…"` | Shown when `searchQuery` is empty; ellipsis is a Unicode horizontal ellipsis `…` (U+2026), not three periods |
| No-results message | `No groups match "{{ searchQuery }}"` | Dynamic — echoes the user's exact query via mustache interpolation; never `v-html`; quotation marks are standard double-quotes `"` |
| Clear search button label | `"Clear search"` | `severity="secondary"` `size="small"`; appears in no-results empty state only |
| Sort option — default | `"Type A–Z"` | `value: 'type-asc'`; en-dash `–` (U+2013), not hyphen |
| Sort option 2 | `"Type Z–A"` | `value: 'type-desc'`; en-dash `–` (U+2013) |
| Sort option 3 | `"Name A–Z"` | `value: 'name-asc'`; en-dash `–` (U+2013) |
| Sort option 4 | `"Name Z–A"` | `value: 'name-desc'`; en-dash `–` (U+2013) |

**En-dash character:** All four sort option labels use an en-dash `–` (U+2013) between the letter pair. Do not substitute a hyphen-minus `-` (U+002D). Copy the characters exactly from this table.

**No new destructive actions in Phase 7.** "Clear search" is a non-destructive data reset — it does not delete records. No confirmation dialog required.

**No new toast strings in Phase 7.** Search and sort are pure computed operations — no async, no error path, no success feedback required.

---

## Registry Safety

No new npm packages installed in Phase 7. All components (`IconField`, `InputIcon`, `Select`, `InputText`, `Button`) are part of PrimeVue 4.5.5 already installed in `node_modules`.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None | Not applicable — project uses PrimeVue, not shadcn |
| Third-party registries | None | Not applicable |
| npm packages (new) | None | No installs — all three new PrimeVue components verified in `node_modules/primevue/` |

**Explicit confirmation:**
- `node_modules/primevue/iconfield/index.d.ts` — confirmed present
- `node_modules/primevue/inputicon/index.d.ts` — confirmed present
- `node_modules/primevue/select/index.d.ts` — confirmed present

Registry vetting gate is not required.

---

## Constraint Checklist — Phase 7

All Phase 6 constraints carry forward unchanged. Phase 7 adds:

| Constraint | Rule | Verifiable By |
|------------|------|---------------|
| No `v-html` | `searchQuery` is echoed in the no-results message via `{{ }}` mustache, never `v-html` | `git grep "v-html" src/components/projects/wallecx` returns zero hits |
| No new PocketBase queries | `displayedGroups` is a pure computed over `groupedVaccinations.value` — zero `pb.collection(...).get*` calls added | Code review — no async calls in `displayedGroups` or `WallecxToolbar.vue` |
| No new CSS custom properties | All Phase 7 color usages (`--color-brand-primary`, `--color-typo-heading`) are pre-existing tokens | `git grep "var(--color" src/components/projects/wallecx` — all tokens are pre-existing |
| No new npm packages | `IconField`, `InputIcon`, `Select` are PrimeVue 4.5.5 — already in `node_modules` | `npm ls primevue` — no new entry in `package.json` |
| Auto-import only | `IconField`, `InputIcon`, `Select` must NOT be manually imported in `<script setup>` — PrimeVueResolver handles it | Code review — no `import { IconField }` / `import { Select }` in any Wallecx `.vue` file |
| No debounce | Search is instant (D-07) — no `setTimeout`, no `useDebounceFn`, no `watchDebounced` | Code review of `WallecxToolbar.vue` and `WallecxApp.vue` |
| Toolbar always visible | `WallecxToolbar` is rendered above all `v-if/v-else` content branches — not wrapped in any conditional | Code review of `WallecxApp.vue` template |
| No-results branch ordering | `v-else-if="displayedGroups.length === 0 && searchQuery"` must come AFTER `v-else-if="records.length === 0"` | Code review of template branch order |
| Uncategorized pinned last under all sort modes | `displayedGroups` computed splits named/uncategorized before sorting, then returns `[...named, ...uncategorized]` | Unit-test or code review of `displayedGroups` switch block |
| Sort uses `latestRecord.vaccine_name` for Name sorts | `name-asc` / `name-desc` sort comparator uses `a.latestRecord.vaccine_name` | Code review of `displayedGroups` computed |
| No modifications to VaccinationGroupCard | Zero diff on `VaccinationGroupCard.vue` | `git diff HEAD src/components/projects/wallecx/VaccinationGroupCard.vue` returns empty |
| `searchQuery` reset on Clear search | `@click="searchQuery = ''"` in no-results Button; `@click="emit('update:searchQuery', '')"` in toolbar `×` button | Code review |
| `VaccinationDetail.vue`, `VaccinationGroupPanel.vue`, `ManageVaccination.vue` untouched | Per 07-CONTEXT.md canonical refs | `git diff HEAD src/components/projects/wallecx/VaccinationGroupPanel.vue` etc. return empty |

---

## Pre-Population Sources

| Field | Source | Notes |
|-------|--------|-------|
| Design system | 06-UI-SPEC.md | Inherited unchanged |
| Spacing scale | 06-UI-SPEC.md | Inherited; Phase 7 adds toolbar gap (`gap-2` / 8px) and bottom margin (`mb-4` / 16px) usages |
| Typography roles | 06-UI-SPEC.md | Inherited; all Phase 7 text elements map to existing `text-sm` body role |
| Color tokens | 06-UI-SPEC.md + `src/assets/base.css` | Inherited; Phase 7 reuses `--color-brand-primary` for no-results icon |
| D-01 (WallecxToolbar extracted) | 07-CONTEXT.md — Decisions | Separate component with `v-model:searchQuery` + `v-model:sortMode` — locked |
| D-02 (Sort = Select dropdown) | 07-CONTEXT.md — Decisions | PrimeVue Select, 4 value/label pairs — locked |
| D-03 (no-results empty state) | 07-CONTEXT.md — Decisions | Dynamic message echoing query — locked |
| D-04 ("Clear search" button) | 07-CONTEXT.md — Decisions | `severity="secondary"` `size="small"` `label="Clear search"` — locked |
| D-05 (IconField + InputIcon) | 07-CONTEXT.md — Decisions | `pi pi-search` left icon — locked |
| D-06 (inline × clear) | 07-CONTEXT.md — Decisions | Right-side `InputIcon` conditionally rendered when non-empty — locked |
| D-07 (no debounce) | 07-CONTEXT.md — Decisions | Instant / real-time — locked |
| Sort option value/label pairs | 07-CONTEXT.md — Specifics | `type-asc` default, `type-desc`, `name-asc`, `name-desc` — locked |
| Search placeholder | 07-CONTEXT.md — Specifics | `"Search by name or type…"` — locked |
| No-results message | 07-CONTEXT.md — Specifics | `"No groups match '{{ searchQuery }}'"` — locked |
| `latestRecord.vaccine_name` for Name sort | 07-CONTEXT.md — Specifics + SORT-01 spec | Explicitly specified in requirement |
| Uncategorized pinning post-sort | 07-CONTEXT.md — Decisions (carried Phase 6 D-06) | `[...named, ...uncategorized]` pattern |
| `mdi:magnify-remove-outline` for no-results icon | 07-CONTEXT.md — Claude's Discretion | Distinct from `mdi:needle-off` (zero-records) — same pattern, different icon |
| PrimeVue component verification | `node_modules/primevue/iconfield/`, `inputicon/`, `select/` | All three confirmed present before writing spec |
| Template branch ordering rationale | Analysis of WallecxApp.vue existing branch logic | `records.length === 0` must precede `displayedGroups.length === 0 && searchQuery` |
| User input | None | All design contract questions answered by upstream artifacts and 07-CONTEXT.md; zero re-asked |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*Phase: 07-toolbar-search-sort*
*UI-SPEC created: 2026-05-13*
*Baseline: Phase 6 UI-SPEC (06-UI-SPEC.md) — all base tokens and patterns inherited*
*Next: gsd-ui-checker validates this contract; gsd-planner consumes it for task breakdown*
