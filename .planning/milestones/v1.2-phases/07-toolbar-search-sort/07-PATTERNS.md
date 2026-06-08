# Phase 7: Toolbar — Search & Sort - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 2 (1 new, 1 modified)
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/projects/wallecx/WallecxToolbar.vue` | component (presentational) | event-driven (emit upward) | `src/components/projects/wallecx/VaccinationGroupCard.vue` | role-match |
| `src/components/projects/wallecx/WallecxApp.vue` | component (orchestrator) | CRUD + transform (computed pipeline) | `src/components/projects/wallecx/WallecxApp.vue` (self) | exact |

---

## Pattern Assignments

### `src/components/projects/wallecx/WallecxToolbar.vue` (presentational component, emit-upward)

**Analog:** `src/components/projects/wallecx/VaccinationGroupCard.vue`

This is the closest role-match: a presentational component in the same folder that receives typed props and fires typed emits. `WallecxToolbar` is more purely presentational — it holds no local state, only emits upward.

**Note on v-model pattern:** No existing Wallecx component exposes dual `update:*` v-model emits (all existing emits are domain events like `click`, `view`, `created`). The `defineProps` + `defineEmits<{ 'update:X': [value: T] }>` pattern for v-model is sourced from the approved UI-SPEC (verbatim) and matches Vue 3 core convention. The planner should treat the UI-SPEC as the authoritative code source for this component — it is a complete, approved contract.

**Imports pattern** — `VaccinationGroupCard.vue` lines 1–4:
```typescript
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```
WallecxToolbar has NO imports in `<script setup>` — no Vue imports needed (`defineProps`/`defineEmits` are compiler macros), no PrimeVue imports (auto-imported via PrimeVueResolver). The script block contains only `defineProps`, `defineEmits`, and the `sortOptions` constant.

**defineProps + defineEmits pattern** — `VaccinationGroupCard.vue` lines 6–15 (shape to follow):
```typescript
const props = defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
```

For WallecxToolbar, apply this same structure with two v-model emits:
```typescript
// WallecxToolbar.vue — complete <script setup> block (from 07-UI-SPEC.md §1)
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
```
Note: en-dash characters above are U+2013. Copy from UI-SPEC to preserve the exact Unicode character.

**Core template pattern** — `VaccinationGroupCard.vue` lines 28–63 (card with emit on click):
```html
<Card class="cursor-pointer hover:shadow-md transition-shadow" @click="emit('click')">
  <template #content>
    ...
  </template>
</Card>
```

WallecxToolbar's template uses a flat `<div>` row rather than a Card. Emit calls are inline on the elements (no handler functions):
```html
<!-- WallecxToolbar.vue — complete <template> block (from 07-UI-SPEC.md §1) -->
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
Note: `placeholder` uses horizontal ellipsis U+2026 (`…`). `:value` + `@input` on InputText (NOT `v-model`) — the ref lives in the parent.

**No-manual-import rule** (from `VaccinationGroupCard.vue` pattern — it imports `dayjs` and `pb` but NOT PrimeVue components):
- `IconField`, `InputIcon`, `InputText`, `Select`, `Button` — auto-imported by PrimeVueResolver. Never add `import { IconField } from 'primevue/iconfield'` etc. to any `<script setup>` block.

---

### `src/components/projects/wallecx/WallecxApp.vue` (orchestrator, CRUD + computed transform)

**Analog:** `src/components/projects/wallecx/WallecxApp.vue` (self — current on-disk state is the exact integration baseline)

The planner inserts code at specific points in the existing file. The full current file is reproduced below by section so the planner knows exactly where each insertion lands.

---

#### CURRENT STATE — Imports block (lines 1–10)

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

**Phase 7 insertion — add after line 10 (after VaccinationGroupPanel import):**
```typescript
import WallecxToolbar from './WallecxToolbar.vue';
```
Pattern: local `.vue` imports are explicit (not auto-imported). Follows the same pattern as `VaccinationGroupCard` and `VaccinationGroupPanel` imports.

---

#### CURRENT STATE — Refs block (lines 12–24)

```typescript
// --- STATE ---
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

**Phase 7 insertion — add after `selectedGroup` ref (after line 24):**
```typescript
const searchQuery = ref<string>('');
const sortMode = ref<string>('type-asc');
```
Pattern: `ref<string>('')` — typed generic, explicit empty string default. Matches `fileToken` and `listToken` style.

---

#### CURRENT STATE — VaccineGroup interface (lines 27–31)

```typescript
interface VaccineGroup {
  vaccineType: string;         // "COVID-19", "Flu", ..., "Uncategorized"
  records: Vaccinations[];     // order preserved from records ref (sorted -date_administered)
  latestRecord: Vaccinations;  // records[0] — most recent by date_administered
}
```
No changes. `displayedGroups` produces the same `VaccineGroup[]` shape.

---

#### CURRENT STATE — groupedVaccinations computed (lines 33–56)

```typescript
const groupedVaccinations = computed<VaccineGroup[]>(() => {
  const map = new Map<string, Vaccinations[]>();
  for (const record of records.value) {
    const key = record.vaccine_type?.trim() || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(record);
  }
  const named: VaccineGroup[] = [];
  const uncategorized: VaccineGroup[] = [];
  for (const [key, recs] of map.entries()) {
    const group: VaccineGroup = {
      vaccineType: key === "" ? "Uncategorized" : key,
      records: recs,
      latestRecord: recs[0],
    };
    if (key === "") uncategorized.push(group);
    else named.push(group);
  }
  named.sort((a, b) =>
    a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
  );
  return [...named, ...uncategorized];
});
```
No changes. `displayedGroups` is inserted immediately after line 56.

**Phase 7 insertion — new computed after groupedVaccinations (insert after line 56):**
```typescript
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
      break;
  }

  return [...named, ...uncategorized];
});
```
Pattern: `computed<VaccineGroup[]>(() => { ... })` — typed generic, same as `groupedVaccinations`. Split/sort/rejoin mirrors the same `[...named, ...uncategorized]` pattern from `groupedVaccinations`. `localeCompare` with `{ sensitivity: 'base' }` — matches Phase 6 convention exactly.

---

#### CURRENT STATE — Template structure (lines 211–320)

The template has three top-level sections inside `<Card><template #content>`:

1. **Header row** (lines 215–234): `<div class="flex items-center justify-between mb-4">` — always visible
2. **Three conditional branches** (lines 236–273):
   - `v-if="isLoading"` — skeleton grid (lines 237–243)
   - `v-else-if="records.length === 0"` — zero-records empty state (lines 246–260)
   - `v-else` — grouped card grid with `v-for="group in groupedVaccinations"` (lines 263–273)
3. **Drawer + dialogs** (lines 275–319): always rendered after the conditional block

**Phase 7 template change 1 — insert WallecxToolbar after header row, before the `v-if="isLoading"` block:**

Current line 234 ends the header `</div>`. Insert immediately after it, before line 236:
```html
<!-- Toolbar: search + sort (SEARCH-01, SORT-01) — always visible -->
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
/>
```
Pattern: prop binding uses kebab-case (`search-query`, `sort-mode`) — Vue 3 maps these to camelCase props automatically. Mirrors how `VaccinationGroupCard` uses `:vaccine-type`, `:latest-record` (kebab-case in template, camelCase in defineProps).

**Phase 7 template change 2 — add no-results branch between zero-records and v-else:**

Current structure (3 branches):
```
v-if="isLoading"
v-else-if="records.length === 0"
v-else  ← card grid
```

New structure (4 branches):
```html
<!-- Branch 1: loading skeleton — UNCHANGED (lines 237-243 current) -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- Branch 2: zero records — UNCHANGED (lines 246-260 current) -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:needle-off" width="48" height="48" style="color: var(--color-brand-primary)"></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  <Button label="Add your first vaccination" icon="pi pi-plus" size="small" @click="openManage(null)" />
</div>

<!-- Branch 3: no search results (SEARCH-02) — NEW -->
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

<!-- Branch 4: grouped card grid — v-for target changed from groupedVaccinations to displayedGroups -->
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

Empty-state container pattern (from current lines 246–260):
- `class="flex flex-col items-center py-12 gap-3"` — identical for both zero-records and no-results states
- `iconify-icon` web component with `style="color: var(--color-brand-primary)"`
- `<p class="text-sm" style="color: var(--color-typo-heading)">` for message text
- PrimeVue `Button` with `size="small"` as CTA

No-results state uses the same container class but a different icon (`mdi:magnify-remove-outline` vs `mdi:needle-off`) and adds `severity="secondary"` to the Clear button.

**Phase 7 template change 3 — `v-for` target replacement:**
- Find: `v-for="group in groupedVaccinations"`
- Replace with: `v-for="group in displayedGroups"`
- All other card props (`:vaccine-type`, `:records`, `:latest-record`, `:list-token`, `@click`) are unchanged — `displayedGroups` produces the same `VaccineGroup[]` shape.

---

## Shared Patterns

### Empty State Structure
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 246–260
**Apply to:** No-results branch in WallecxApp.vue
```html
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
```
The no-results branch copies this container class and element structure exactly. Only the icon, message text, button label, and button severity differ.

### defineProps + defineEmits Typed Pattern
**Source:** `src/components/projects/wallecx/VaccinationGroupCard.vue` lines 6–15
**Apply to:** WallecxToolbar.vue `<script setup>`
```typescript
const props = defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
```
WallecxToolbar follows this same structure: typed generic `defineProps<{...}>()` and typed generic `defineEmits<{...}>()`. No runtime options object form.

### localeCompare Sort Convention
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 52–54
**Apply to:** All sort comparators in `displayedGroups` computed
```typescript
named.sort((a, b) =>
  a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
);
```
All `localeCompare` calls in `displayedGroups` must use `{ sensitivity: 'base' }` (or `"base"`) — case-insensitive, accent-insensitive. Matches Phase 6 convention.

### Uncategorized Pin Pattern
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 40–55
**Apply to:** `displayedGroups` computed final return
```typescript
const named: VaccineGroup[] = [];
const uncategorized: VaccineGroup[] = [];
// ... populate named and uncategorized ...
return [...named, ...uncategorized];
```
`displayedGroups` applies this same split-then-rejoin pattern on the `filtered` array (not on `groupedVaccinations.value` directly).

### Kebab-Case Props in Template
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 264–272
**Apply to:** WallecxToolbar usage in WallecxApp.vue template
```html
<VaccinationGroupCard
  v-for="group in groupedVaccinations"
  :key="group.vaccineType"
  :vaccine-type="group.vaccineType"
  :records="group.records"
  :latest-record="group.latestRecord"
  :list-token="listToken"
  @click="openGroupPanel(group)"
/>
```
All multi-word prop bindings use kebab-case in templates (`:vaccine-type`, not `:vaccineType`). Apply same convention to `<WallecxToolbar v-model:search-query="searchQuery" v-model:sort-mode="sortMode" />`.

### Explicit Local Component Import
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 8–10
**Apply to:** WallecxToolbar import in WallecxApp.vue
```typescript
import ManageVaccination from "./ManageVaccination.vue";
import VaccinationGroupCard from "./VaccinationGroupCard.vue";
import VaccinationGroupPanel from "./VaccinationGroupPanel.vue";
```
Local `.vue` sibling components use relative `"./ComponentName.vue"` imports. They are never auto-imported by PrimeVueResolver. Add `import WallecxToolbar from './WallecxToolbar.vue';` alongside these three.

---

## No Analog Found

No files fall into this category. Both files have strong analogs:
- `WallecxToolbar.vue` — `VaccinationGroupCard.vue` provides the defineProps/defineEmits shape; the UI-SPEC provides the complete component code.
- `WallecxApp.vue` — the file itself is the analog (modification, not new creation).

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/` (primary), `src/components/projects/` (secondary cross-check for v-model emit pattern)
**Files scanned:** 7 Wallecx components + 12 other project components (grep scan)
**Key finding on v-model emit pattern:** No existing component in the codebase uses `'update:X': [value: T]` emit syntax — WallecxToolbar is the first. The pattern is sourced from Vue 3 docs convention and the approved 07-UI-SPEC.md, not from an existing analog. This is expected and documented.
**Pattern extraction date:** 2026-05-13
