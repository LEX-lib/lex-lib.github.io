---
phase: 16
slug: membership-card-toolbar
status: approved
reviewed_at: 2026-05-15
shadcn_initialized: false
preset: none
created: 2026-05-15
baseline: .planning/phases/07-toolbar-search-sort/07-UI-SPEC.md
---

# Phase 16 — UI Design Contract

> Visual and interaction contract for Phase 16: Membership Card Toolbar.
> All base design tokens — spacing, typography, color, and interaction patterns — are
> inherited unchanged from Phase 7 (`07-UI-SPEC.md`), which is itself the established
> toolbar baseline. This document is a delta-only specification: it documents only what
> differs between Phase 7's WallecxToolbar and Phase 16's adaptation for MembershipsTab.
>
> Do not re-specify anything described in `07-UI-SPEC.md` unless it changes here.
> Use that file as the authoritative source for all tokens not listed in this document.

---

## Design System

Fully inherited from Phase 7 UI-SPEC. No changes.

| Property | Value |
|----------|-------|
| Tool | none (PrimeVue 4 + Tailwind CSS 4) |
| Preset | MyPreset — Aura base, navy primary scale (#002244 at 500), amber highlight (#e89820) — configured in `src/main.ts` |
| Component library | PrimeVue 4 (auto-imported via `PrimeVueResolver`) |
| Icon library | `iconify-icon` web component, `mdi:*` icon set |
| Font | Rubik (Google Fonts) — weights 400, 700 |

**shadcn gate result:** Not applicable. Project uses PrimeVue 4 + Tailwind CSS 4. No `components.json`. Registry safety gate is not required.

**PrimeVue components used in Phase 16:** All already confirmed present from Phase 7 and prior phases. No new PrimeVue components are introduced.

| Component | Status |
|-----------|--------|
| `IconField` | In use since Phase 7 — no change |
| `InputIcon` | In use since Phase 7 — no change |
| `Select` | In use since Phase 7 — no change |
| `InputText` | In use since prior phases — no change |
| `Button` | In use since prior phases — no change |

**Delta:** No new PrimeVue components. No new npm packages. No new CSS custom properties.

---

## Spacing Scale

Fully inherited from Phase 7 UI-SPEC. Phase 16 usages are identical to Phase 7.

| Token | Value | Phase 16 Usage |
|-------|-------|----------------|
| xs | 4px | Not directly used in toolbar |
| sm | 8px | Gap between search `IconField` and sort `Select` in toolbar row (`gap-2`) |
| md | 16px | Bottom margin below toolbar row (`mb-4`) — toolbar has its own `mb-4`; MembershipsTab header row also uses `mb-4` above toolbar |
| lg | 24px | Unchanged — inherited |
| xl | 32px | Unchanged — inherited |
| 2xl | 48px | No-results empty state vertical padding (`py-12`) |
| 3xl | 64px | Not used |

**No-results container gap:** `gap-3` (12px) — identical to Phase 7 and the existing MembershipsTab zero-records empty state. Multiple of 4, inherited pattern.

**Exceptions:** None. All spacing values are multiples of 4.

---

## Typography

Fully inherited from Phase 7 UI-SPEC. No new type roles in Phase 16.

| Role | Size | Weight | Line Height | Token / Class | Phase 16 Usage |
|------|------|--------|-------------|---------------|----------------|
| Body | 14px | 400 (Regular) | 1.5 | `text-sm` | Search input text; sort dropdown selected value; no-results message; "Clear search" button label |
| Heading | 24px | 700 (Bold) | 1.2 | `text-2xl font-bold` | Unchanged — "Wallecx" page title |

**Weight constraint:** Two weights only — 400 and 700. No weight 500 or 600 anywhere in Phase 16.

**Placeholder text** (`"Search by name or issuer…"`) renders at PrimeVue Aura's default placeholder style — no override. Do not apply custom weight or color.

**Delta:** No new type roles. All Phase 16 text elements map to the existing `text-sm` (body) role.

---

## Color

Fully inherited from Phase 7 UI-SPEC. No new tokens in Phase 16.

| Role | Value | Token | Phase 16 Usage |
|------|-------|-------|----------------|
| Dominant (60%) | `#f5f7fa` | `--color-surface-page` | Unchanged — page background |
| Secondary (30%) | `#ffffff` | `--color-surface-card` | Unchanged — WallecxApp outer Card surface |
| Accent navy | `#002244` | `--color-brand-primary` | No-results empty-state `mdi:magnify-remove-outline` icon; "Add card" header button (inherited) |
| Accent warm | `#e89820` | `--color-brand-accent` | Reserved — no Phase 16 usages |
| Text heading | `#0d1117` | `--color-typo-heading` | No-results message text |
| Text muted | `#6b7280` | `--color-typo-muted` | Placeholder text in search input (PrimeVue Aura default — do not override) |
| Destructive | `#c0392b` | `--color-status-error` | No new destructive elements in Phase 16 |

**Accent reserved for (Phase 16):**
- No-results empty-state icon: `style="color: var(--color-brand-primary)"` — same pattern as Phase 7.

**"Clear search" button** uses `severity="secondary"` — PrimeVue Aura renders this as a neutral grey button. Not an accent usage.

**Delta:** No new color tokens. No new amber usages. No new CSS custom properties.

---

## Component Specifications — Phase 16 Delta

### 1. WallecxToolbar.vue — Prop Addition (existing component)

**File:** `src/components/projects/wallecx/WallecxToolbar.vue`

**Change:** Add `sortOptions` as a required prop. Remove the hardcoded `const sortOptions = [...]` array from the component. The component becomes fully generic — it renders whatever options array it receives.

**Updated props signature:**
```typescript
withDefaults(
  defineProps<{
    searchQuery: string;
    sortMode: string;
    viewMode: 'grid' | 'list';
    sortOptions: { value: string; label: string }[];
    showToggle?: boolean;
  }>(),
  {
    showToggle: false,
  },
);
```

**Template change:** Replace `:options="sortOptions"` — no change to the attribute itself since the prop name matches the removed local const. The `Select` element already binds `:options="sortOptions"` and this remains correct after the prop replaces the local const.

**No other template changes.** The view toggle button, `IconField`, `InputIcon`, `InputText`, clear button — all unchanged.

**Width rules:** Unchanged from Phase 7.
- Search `InputText`: `flex-1`
- Sort `Select`: `w-36` (144px) — wide enough for all membership option labels including "Recently Added" (the longest label, 13 characters)

---

### 2. VaccinationsTab.vue — Sort Options Migration (existing component)

**File:** `src/components/projects/wallecx/VaccinationsTab.vue`

**Change:** Extract the vaccination sort options from `WallecxToolbar` (they no longer live there) into a module-level const in `VaccinationsTab`. Pass via the new prop.

**Add to `VaccinationsTab.vue` `<script setup>`:**
```typescript
const vaccinationSortOptions = [
  { value: 'type-asc',  label: 'Type A–Z' },
  { value: 'type-desc', label: 'Type Z–A' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];
```

**Update `WallecxToolbar` usage in template:**
```html
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
  v-model:view-mode="viewMode"
  :sort-options="vaccinationSortOptions"
  :show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"
/>
```

**No other changes to VaccinationsTab.vue.** The computed pipeline, sessionStorage pattern, and all other logic remain identical.

---

### 3. MembershipsTab.vue — Toolbar + Computed Pipeline (existing component)

**File:** `src/components/projects/wallecx/MembershipsTab.vue`

#### 3a. New imports and refs

Add `computed` to the existing `vue` import. Add `WallecxToolbar` import alongside the existing component imports.

```typescript
import { ref, onMounted, computed } from 'vue'
import WallecxToolbar from './WallecxToolbar.vue'
```

Add the following constants and refs after the existing `const confirm = useConfirm()` line, in the `// --- STATE ---` region:

```typescript
const SORT_MODE_STORAGE_KEY = 'wallecx:memberships-sort-mode';

const membershipSortOptions = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'name-asc',       label: 'Name A–Z' },
  { value: 'issuer-asc',     label: 'Issuer A–Z' },
  { value: 'expiry-asc',     label: 'Expiry Date' },
];

const searchQuery = ref<string>('');
const sortMode = ref<string>('recently-added');
```

#### 3b. sessionStorage restore in `onMounted`

Add sessionStorage restore at the top of `onMounted`, before `isLoading.value = true`:

```typescript
try {
  const stored = sessionStorage.getItem(SORT_MODE_STORAGE_KEY);
  const validModes = membershipSortOptions.map((o) => o.value);
  if (stored && validModes.includes(stored)) {
    sortMode.value = stored;
  }
} catch {
  // sessionStorage may throw in privacy-mode iframes; fall back to default silently
}
```

Add a `watch` for `sortMode` to persist on change (same pattern as `viewMode` in VaccinationsTab):

```typescript
import { ref, onMounted, computed, watch } from 'vue'

watch(sortMode, (next) => {
  try {
    sessionStorage.setItem(SORT_MODE_STORAGE_KEY, next);
  } catch {
    // sessionStorage write failures are non-fatal
  }
});
```

#### 3c. New computed: `displayedMemberships`

Add immediately after the existing refs, before `onMounted`:

```typescript
const displayedMemberships = computed<Memberships[]>(() => {
  // Step 1: filter by card_name or issuer (ORG-01)
  const query = searchQuery.value.trim().toLowerCase();
  const filtered = query
    ? records.value.filter(
        (r) =>
          r.card_name.toLowerCase().includes(query) ||
          (r.issuer ?? '').toLowerCase().includes(query)
      )
    : records.value;

  // Step 2: sort (ORG-02)
  const sorted = [...filtered];
  switch (sortMode.value) {
    case 'name-asc':
      sorted.sort((a, b) =>
        a.card_name.localeCompare(b.card_name, undefined, { sensitivity: 'base' })
      );
      break;
    case 'issuer-asc':
      sorted.sort((a, b) =>
        (a.issuer ?? '').localeCompare(b.issuer ?? '', undefined, { sensitivity: 'base' })
      );
      break;
    case 'expiry-asc':
      sorted.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });
      break;
    case 'recently-added':
    default:
      sorted.sort((a, b) => b.created.localeCompare(a.created));
      break;
  }

  return sorted;
});
```

**Key implementation notes:**
- `records.value` is the upstream source (PocketBase load order, `-created`). The `recently-added` default re-applies the same order explicitly — this is a no-op on first load, but keeps sort stable after CRUD mutations.
- `expiry_date` is an optional ISO date string (`YYYY-MM-DD`). `localeCompare` on ISO strings sorts chronologically correctly.
- Cards with falsy `expiry_date` (null, empty string, undefined) are sorted last under `expiry-asc`. Truthy check `!a.expiry_date` handles all falsy variants.
- `issuer` is nullable; `?? ''` ensures null issuers sort before named issuers under `issuer-asc` (empty string sorts first alphabetically).
- `[...filtered]` creates a shallow copy before sorting — `records.value` is never mutated.

#### 3d. Template changes

**Insert** `<WallecxToolbar>` between the header row and the loading/data/empty content branches. The toolbar is rendered unconditionally (no `v-if` wrapper):

```html
<!-- Toolbar: search + sort (ORG-01, ORG-02) — always visible -->
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
  v-model:view-mode="'grid'"
  :sort-options="membershipSortOptions"
  :show-toggle="false"
/>
```

**Note on `v-model:view-mode`:** MembershipsTab has no viewMode ref. The toolbar's `update:viewMode` emit will be a no-op since `'grid'` is a string literal. This is acceptable — the toggle button is hidden by `:show-toggle="false"`, so the emit is never triggered.

**Replace** `v-for="record in records"` with `v-for="record in displayedMemberships"` in the data state grid.

**Add** a no-results empty state branch between the zero-records branch and the data grid. The full revised conditional block:

```html
<!-- Loading state: 3 skeleton tiles -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="8rem" />
    </template>
  </Card>
</div>

<!-- Empty state: no records at all -->
<div
  v-else-if="records.length === 0"
  class="flex flex-col items-center py-12 gap-3"
>
  <iconify-icon
    icon="mdi:card-account-details-outline"
    width="48"
    height="48"
    style="color: var(--color-brand-primary)"
    aria-hidden="true"
  ></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">
    No membership cards yet.
  </p>
  <Button
    label="Add your first card"
    icon="pi pi-plus"
    size="small"
    @click="openManage(null)"
  />
</div>

<!-- Empty state: no search results (ORG-01 — records exist but search matches nothing) -->
<div
  v-else-if="displayedMemberships.length === 0 && searchQuery"
  class="flex flex-col items-center py-12 gap-3"
>
  <iconify-icon
    icon="mdi:magnify-remove-outline"
    width="48"
    height="48"
    style="color: var(--color-brand-primary)"
    aria-hidden="true"
  ></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">
    No cards match "{{ searchQuery }}"
  </p>
  <Button
    label="Clear search"
    severity="secondary"
    size="small"
    @click="searchQuery = ''"
  />
</div>

<!-- Data state: membership card grid -->
<div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <MembershipCard
    v-for="record in displayedMemberships"
    :key="record.id"
    :record="record"
    @click="openDetail(record)"
  />
</div>
```

**Branch priority (top to bottom):**
1. `v-if="isLoading"` — loading skeleton
2. `v-else-if="records.length === 0"` — zero records (fresh account or all deleted)
3. `v-else-if="displayedMemberships.length === 0 && searchQuery"` — no search results
4. `v-else` — card grid (normal, filtered, or sorted)

**Why this order matters:** Branch 2 must precede branch 3. If `records` is empty, `searchQuery` could be non-empty (toolbar always visible, user may type before records load). Branch 2 gates on the raw record count, not the computed result. This matches the Phase 7 pattern exactly.

---

### 4. MembershipCard.vue — Unchanged

Zero modifications. Phase 16 is purely a computed pipeline and toolbar wiring change — the card tile renders identically.

### 5. MembershipDetail.vue — Unchanged

Zero modifications.

### 6. ManageMembership.vue — Unchanged

Zero modifications.

### 7. BarcodeDisplay.vue — Unchanged

Zero modifications.

---

## Interaction States

### Toolbar States

| State | Condition | Rendering |
|-------|-----------|-----------|
| Empty query | `searchQuery === ''` | Search `InputText` shows placeholder. No `×` clear icon visible. All cards shown per active sort mode. |
| Active query | `searchQuery.length > 0` | Entered text shown. `×` clear button visible (44×44px touch target, `aria-label="Clear search"`). Grid updates in real-time — no debounce. |
| No results | `displayedMemberships.length === 0 && searchQuery !== ''` | Grid replaced by no-results empty state. Toolbar remains fully visible and interactive — user can still edit query or change sort. |
| Sort changed | User selects any sort option | Grid immediately reorders. Active search query is preserved — sort applies to the already-filtered set. |

### No-Results Empty State

| Element | Spec |
|---------|------|
| Icon | `mdi:magnify-remove-outline`, 48×48, `style="color: var(--color-brand-primary)"`, `aria-hidden="true"` |
| Message | `No cards match "{{ searchQuery }}"` — mustache interpolation; quotation marks are standard double-quotes `"`; never `v-html` |
| Button | `label="Clear search"`, `severity="secondary"`, `size="small"`, `@click="searchQuery = ''"` |
| Container | `class="flex flex-col items-center py-12 gap-3"` — identical to the zero-records empty state container |

**Toolbar visibility in no-results state:** `WallecxToolbar` is always rendered above all content branches. It is never conditionally hidden.

**Toolbar during loading state:** Toolbar renders above the `v-if="isLoading"` block. Interactions while loading are inert — `displayedMemberships` will be empty (no records yet), but the loading branch fires first, so no-results branch never shows while loading.

### Sort Interaction

| Sort Mode | Value | Comparator |
|-----------|-------|------------|
| Recently Added (default) | `'recently-added'` | `b.created.localeCompare(a.created)` — ISO datetime descending |
| Name A–Z | `'name-asc'` | `a.card_name.localeCompare(b.card_name, undefined, { sensitivity: 'base' })` |
| Issuer A–Z | `'issuer-asc'` | `(a.issuer ?? '').localeCompare((b.issuer ?? ''), undefined, { sensitivity: 'base' })` |
| Expiry Date | `'expiry-asc'` | ISO date string ascending; falsy `expiry_date` sorts last |

**Sort + search composition:** Selecting a sort option while a search query is active re-sorts the already-filtered result. Pipeline is always filter → sort. Changing sort does not reset `searchQuery`.

**No Uncategorized pinning:** Unlike VaccinationsTab (which has an "Uncategorized" group concept), membership cards are individual records with no group pinning logic needed.

### Inline Clear Button (`×`)

- Rendered: when `searchQuery.length > 0` (from Phase 7's existing `WallecxToolbar` implementation)
- Hidden: when `searchQuery === ''`
- Touch target: 44×44px with `touch-manipulation` (Phase 15 mobile target — already implemented in `WallecxToolbar.vue`)
- Click: emits `update:searchQuery` with `''` → `MembershipsTab.searchQuery` resets → `displayedMemberships` recomputes → full grid restored

### Session Persistence

| Key | `'wallecx:memberships-sort-mode'` |
|-----|-----------------------------------|
| Stored on | Every `sortMode` change via `watch(sortMode, ...)` |
| Restored on | `onMounted` — before `isLoading.value = true` |
| Valid values | `'recently-added'`, `'name-asc'`, `'issuer-asc'`, `'expiry-asc'` |
| Invalid / missing | Default `'recently-added'` retained silently |
| Failure handling | Silent try/catch on both read and write |

---

## Copywriting Contract

All prior phases' copywriting inherited unchanged. Phase 16 adds:

| Element | Copy | Notes |
|---------|------|-------|
| Search placeholder | `"Search by name or issuer…"` | Shown when `searchQuery` is empty; ellipsis is Unicode `…` (U+2026), not three periods |
| No-results message | `No cards match "{{ searchQuery }}"` | Dynamic — echoes exact query via mustache; quotation marks are standard double-quotes `"`; never `v-html` |
| Clear search label | `"Clear search"` | `severity="secondary"`, `size="small"`; appears in no-results empty state only |
| Sort option — default | `"Recently Added"` | `value: 'recently-added'`; no en-dash needed |
| Sort option 2 | `"Name A–Z"` | `value: 'name-asc'`; en-dash `–` (U+2013), not hyphen |
| Sort option 3 | `"Issuer A–Z"` | `value: 'issuer-asc'`; en-dash `–` (U+2013) |
| Sort option 4 | `"Expiry Date"` | `value: 'expiry-asc'`; no en-dash; soonest first, no-expiry last |

**En-dash character:** Sort options 2 and 3 use an en-dash `–` (U+2013). Do not substitute a hyphen-minus `-` (U+002D). Copy from this table exactly.

**Delta from Phase 7:** Placeholder changes from `"Search by name or type…"` to `"Search by name or issuer…"`. Sort options are entirely different (membership-specific). No-results message changes from `"No groups match…"` to `"No cards match…"`.

**No new destructive actions in Phase 16.** "Clear search" is a non-destructive reset. No confirmation dialog required.

**No new toast strings in Phase 16.** Search and sort are pure computed operations — no async, no error path, no success feedback.

---

## Registry Safety

No new npm packages installed in Phase 16. All components are part of PrimeVue 4.5.5 already installed in `node_modules`.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None | Not applicable — project uses PrimeVue, not shadcn |
| Third-party registries | None | Not applicable |
| npm packages (new) | None | No installs — all components verified in prior phases |

Registry vetting gate is not required.

---

## Constraint Checklist — Phase 16

All Phase 7 constraints carry forward. Phase 16 adds:

| Constraint | Rule | Verifiable By |
|------------|------|---------------|
| No `v-html` | `searchQuery` echoed via `{{ }}` mustache only | `git grep "v-html" src/components/projects/wallecx/MembershipsTab.vue` returns zero hits |
| No new PocketBase queries | `displayedMemberships` is a pure computed over `records.value` — zero `pb.collection(...).get*` calls added | Code review — no async calls in `displayedMemberships` |
| No new CSS custom properties | All color usages are pre-existing tokens | `git grep "var(--color" src/components/projects/wallecx/MembershipsTab.vue` — all tokens are pre-existing |
| No new npm packages | All components already in `node_modules` | `npm ls primevue` — no new entry in `package.json` |
| Auto-import only | No manual import of `IconField`, `InputIcon`, `Select` | Code review — no such imports in any Wallecx `.vue` file |
| No debounce | Search is instant (D-11) — no `setTimeout`, `useDebounceFn`, `watchDebounced` | Code review of `WallecxToolbar.vue` and `MembershipsTab.vue` |
| Toolbar always visible | `WallecxToolbar` is rendered unconditionally — not wrapped in `v-if` | Code review of `MembershipsTab.vue` template |
| No-results branch ordering | `v-else-if="displayedMemberships.length === 0 && searchQuery"` comes AFTER `v-else-if="records.length === 0"` | Code review of template branch order |
| `sortOptions` prop is required | `WallecxToolbar` `defineProps` declares `sortOptions` without a default | Code review of `WallecxToolbar.vue` props |
| VaccinationsTab still passes sort options | After removing hardcoded array from `WallecxToolbar`, `VaccinationsTab` passes `:sort-options="vaccinationSortOptions"` | `git diff` — VaccinationsTab toolbar usage includes `:sort-options` |
| `recently-added` default sort matches PocketBase load order | `records` is loaded with `sort: '-created'`; `recently-added` sorts by `b.created.localeCompare(a.created)` — same order | Code review + manual check: first load shows no visual reorder |
| Falsy expiry cards sort last under `expiry-asc` | Comparator: `if (!a.expiry_date) return 1; if (!b.expiry_date) return -1` | Code review of `displayedMemberships` switch block |
| No modification to `MembershipCard.vue` | Zero diff | `git diff HEAD src/components/projects/wallecx/MembershipCard.vue` returns empty |
| `searchQuery` reset on "Clear search" | `@click="searchQuery = ''"` in no-results Button; `×` clear handled in WallecxToolbar | Code review |
| `displayedMemberships` uses shallow copy before sort | `const sorted = [...filtered]` — `records.value` never mutated | Code review of `displayedMemberships` computed |
| sessionStorage key distinct from vaccinations | `'wallecx:memberships-sort-mode'` is a different key from `'wallecx:view-mode'` | Code review of both tabs |

---

## Pre-Population Sources

| Field | Source | Notes |
|-------|--------|-------|
| Design system | 07-UI-SPEC.md | Inherited unchanged |
| Spacing scale | 07-UI-SPEC.md | Inherited; Phase 16 usages identical to Phase 7 |
| Typography roles | 07-UI-SPEC.md | Inherited; all Phase 16 text maps to existing `text-sm` body role |
| Color tokens | 07-UI-SPEC.md | Inherited; Phase 16 reuses `--color-brand-primary` for no-results icon |
| D-01 (sortOptions as prop) | 16-CONTEXT.md — D-01 | Required prop; hardcoded array removed from WallecxToolbar — locked |
| D-02 (VaccinationsTab migration) | 16-CONTEXT.md — D-02 | Vaccination sort options move to VaccinationsTab const — locked |
| D-03 (showToggle false) | 16-CONTEXT.md — D-03 | No view toggle for memberships — locked |
| D-04 (four sort modes) | 16-CONTEXT.md — D-04 | recently-added, name-asc, issuer-asc, expiry-asc — locked |
| D-05 (default sort) | 16-CONTEXT.md — D-05 | `'recently-added'` default — locked |
| D-06 (sessionStorage) | 16-CONTEXT.md — D-06 | Key `'wallecx:memberships-sort-mode'`, silent try/catch — locked |
| D-07 (computed pipeline) | 16-CONTEXT.md — D-07 | filter then sort; `.toLowerCase().includes()` — locked |
| D-08 (layout) | 16-CONTEXT.md — D-08 | Header row → toolbar → content branches — locked |
| D-09 (toolbar always visible) | 16-CONTEXT.md — D-09 | Unconditional render — locked |
| D-10 (no-results empty state) | 16-CONTEXT.md — D-10 | `mdi:magnify-remove-outline` + dynamic message + "Clear search" button — locked |
| D-11 (no debounce, placeholder) | 16-CONTEXT.md — D-11 | Instant; `"Search by name or issuer…"` — locked |
| D-12 (inline × clear) | 16-CONTEXT.md — D-12 | Already in WallecxToolbar, no changes needed — locked |
| Expiry comparator | 16-CONTEXT.md — Specifics | `!a.expiry_date → return 1; !b.expiry_date → return -1` — locked |
| No-results message | 16-CONTEXT.md — Specifics | `"No cards match '{{ searchQuery }}'"` — locked |
| WallecxToolbar current state | `src/components/projects/wallecx/WallecxToolbar.vue` | Confirmed: `sortOptions` currently hardcoded const; view toggle behind `showToggle` prop; × clear already 44×44px touch target |
| MembershipsTab current state | `src/components/projects/wallecx/MembershipsTab.vue` | Confirmed: no `searchQuery`/`sortMode` refs; `v-for` bound to `records`; 3 template branches (loading/empty/data) |
| VaccinationsTab reference | `src/components/projects/wallecx/VaccinationsTab.vue` | Confirmed: full pattern reference for computed pipeline, sessionStorage restore on `onMounted`, watch for persistence |
| User input | None | All design contract questions answered by 16-CONTEXT.md and upstream artifacts; zero re-asked |

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

*Phase: 16-membership-card-toolbar*
*UI-SPEC created: 2026-05-15*
*Baseline: Phase 7 UI-SPEC (07-UI-SPEC.md) — all base tokens and patterns inherited; this document is delta-only*
*Next: gsd-ui-checker validates this contract; gsd-planner consumes it for task breakdown*
