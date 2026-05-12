# Phase 6: Grouped Card View & Group Detail Panel - Research

**Researched:** 2026-05-12
**Domain:** Vue 3 Composition API — computed grouping, PrimeVue Drawer + Card + Badge, Tailwind grid layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Group detail panel uses a **PrimeVue Drawer** (slides in from the right). No existing Drawer pattern in Wallecx — this is a new component for the mini-app.
- **D-02:** When the user clicks a record row inside the Drawer, the existing `VaccinationDetail.vue` Dialog opens **on top of the Drawer** — the Drawer stays visible behind the Dialog. No auto-close of the Drawer when the Dialog opens. User closes the Dialog and is immediately back in the group panel.
- **D-03:** Group cards use a **responsive grid — 2 columns on desktop, 1 column on mobile**. Tailwind classes: `grid grid-cols-1 sm:grid-cols-2 gap-4`.
- **D-04:** The most visually prominent element on each group card is the **vaccine type name (large/bold) with a badge showing the record count** (e.g., "3 records"). Last administered date and thumbnail of the most recent card scan are secondary info below the type name.
- **D-05:** Group cards are sorted **alphabetically by vaccine type name** (case-insensitive).
- **D-06:** The **"Uncategorized" group card is always pinned last** — after all alphabetically sorted named groups. Records with `vaccine_type === ""` belong to this group.

### Claude's Discretion

- Where the grouping computation lives: `WallecxApp.vue` computed property vs. extracted composable. Either is fine — keep it simple.
- Whether `VaccinationList.vue` is repurposed as the Drawer's record list, or a new `VaccinationGroupPanel.vue` component is created. The DataTable column set for the Drawer list differs from the old flat list (GROUP-06 specifies: vaccine name, date administered, dose number, lot number — 4 columns, no thumbnail, no action buttons except "View Record").
- Whether the group card is its own `VaccinationGroupCard.vue` component or rendered inline in `WallecxApp.vue`. Either acceptable if clean.
- Drawer width and any responsive breakpoints for the Drawer.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GROUP-04 | Wallecx home view displays one card per `vaccine_type` group showing: type name, number of records in the group, most recent `date_administered`, and a thumbnail of the latest card scan (if present) | Computed grouping over `records` ref; `pb.files.getURL` with `thumb: "100x100"` + `listToken`; PrimeVue `Card` + `Badge` components confirmed in PrimeVue 4.5.5 |
| GROUP-05 | Records with an empty `vaccine_type` are grouped under a single "Uncategorized" card | Sentinel logic: `vaccine_type === ""` (or falsy) maps to display key `"Uncategorized"` and sorts last via `sort()` comparator |
| GROUP-06 | User can click a vaccine group card to open a detail panel listing all records in that group (vaccine brand/name, date administered, dose number, lot number) | PrimeVue `Drawer` (position="right", v-model:visible) + DataTable inside; `Drawer` confirmed available in PrimeVue 4.5.5 at `node_modules/primevue/drawer/` |
| GROUP-07 | User can click a record row inside the group detail panel to open the existing full-detail dialog (`VaccinationDetail.vue`) | `openDetail(record)` already exists in `WallecxApp.vue`; Drawer stays open (D-02); `showDetail` / `fileToken` state wiring is unchanged |
</phase_requirements>

---

## Summary

Phase 6 replaces the flat `VaccinationList.vue` DataTable in `WallecxApp.vue` with a grouped card grid and adds a PrimeVue Drawer that slides in from the right when a user clicks a group card. All required state lives in `WallecxApp.vue` following the existing pattern — a single `computed` transforms the already-fetched `records` ref into a sorted array of groups, and two new refs (`selectedGroup`, `showGroupPanel`) control the Drawer. No new PocketBase queries, no new dependencies, no changes to `VaccinationDetail.vue`.

The codebase already has everything this phase needs. PrimeVue 4.5.5 ships `Drawer` and `Badge` in `node_modules/primevue/` and both are auto-resolved by `PrimeVueResolver` (confirmed via `vite.config.ts`). The `thumbUrl()` pattern from `VaccinationList.vue` can be directly reproduced in the group card component using `pb.files.getURL` with `thumb: "100x100"` and `listToken`. The `openDetail(record)` function and the `Dialog > VaccinationDetail` wiring in `WallecxApp.vue` remain untouched — the Drawer simply calls the same function from its row buttons.

The two files that need to be created are `VaccinationGroupCard.vue` (single group card: type name, record count badge, last date, thumbnail) and `VaccinationGroupPanel.vue` (Drawer content: DataTable with 4 columns + "View Record" button per row). `WallecxApp.vue` is the orchestrator: it gains the grouping computed, the two new refs, the `openGroupPanel(group)` handler, and replaces the `<VaccinationList>` tag with the group card grid + `<Drawer>`.

**Primary recommendation:** Implement as two plans — Plan 1: grouping computed + `VaccinationGroupCard.vue` + grid in `WallecxApp.vue`; Plan 2: `VaccinationGroupPanel.vue` + Drawer wiring in `WallecxApp.vue` + Drawer-to-Dialog passthrough.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Grouping computation (GROUP-04, GROUP-05) | Frontend (WallecxApp.vue) | — | Records already in memory as `Vaccinations[]`; pure client-side `computed` transform, no new API calls |
| Group card display (GROUP-04) | Frontend (VaccinationGroupCard.vue) | WallecxApp.vue grid | Presentational; receives a group object as prop, renders thumbnail + badge + date |
| Drawer panel (GROUP-06) | Frontend (VaccinationGroupPanel.vue inside WallecxApp Drawer) | — | Overlay panel owned by WallecxApp, content isolated in child component |
| Detail dialog activation (GROUP-07) | Frontend (WallecxApp.vue openDetail) | VaccinationDetail.vue | Existing function; Drawer emits `view` event which parent routes to existing Dialog |
| Thumbnail URL generation | Frontend (VaccinationGroupCard.vue) | — | `pb.files.getURL` with `listToken` — same as VaccinationList.vue `thumbUrl()` pattern |
| PocketBase data fetch | Frontend (WallecxApp.vue onMounted) | — | No change — `records` ref already populated, listToken already managed |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PrimeVue Drawer | 4.5.5 [VERIFIED: node_modules/primevue/drawer/] | Slide-in overlay panel for group detail (D-01) | Already installed; locked decision D-01 |
| PrimeVue Badge | 4.5.5 [VERIFIED: node_modules/primevue/badge/] | Record count badge on group cards (D-04) | Already installed; auto-resolved |
| PrimeVue Card | 4.5.5 [VERIFIED: components.d.ts] | Group card container | Already used in WallecxApp.vue outer wrapper |
| PrimeVue DataTable + Column | 4.5.5 [VERIFIED: components.d.ts] | Record list inside Drawer (GROUP-06) | Already used in VaccinationList.vue |
| Vue 3 computed | current [VERIFIED: WallecxApp.vue import] | Grouping derivation from records ref | Existing pattern in codebase |
| dayjs | installed [VERIFIED: WallecxApp.vue import] | Date formatting in group cards + panel | Already used throughout Wallecx |
| pb.files.getURL | PocketBase SDK 0.26.8 [VERIFIED: node_modules/pocketbase] | Thumbnail URL with `thumb: "100x100"` + listToken | Existing pattern from VaccinationList.vue |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| iconify-icon (mdi:image-off) | installed [VERIFIED: VaccinationList.vue] | Placeholder when group card has no thumbnail | When `latestRecord.card` is falsy |
| Tailwind grid utilities | v4 [VERIFIED: vite.config.ts] | `grid grid-cols-1 sm:grid-cols-2 gap-4` responsive layout | Group card grid (D-03 locked) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PrimeVue Drawer | Custom slide panel | Drawer already ships in 4.5.5; custom solution adds complexity with no benefit |
| DataTable in Drawer | Simple `<ul>` list | DataTable gives consistent striped rows, empty state, skeleton — already established Wallecx pattern |
| Separate composable for grouping | Inline computed in WallecxApp.vue | Composable adds a file for minimal gain; inline computed matches existing pattern (no store, no composables) |

**No new npm installs required.** All components and utilities are already present.

---

## Architecture Patterns

### System Architecture Diagram

```
User navigates to /projects/wallecx
              |
              v
      WallecxApp.vue (onMounted)
              |
       pb.getFullList<Vaccinations>()
              |
        records.value []
              |
       computed: groupedVaccinations
              |
    [sort alphabetically, "Uncategorized" last]
              |
    VaccinationGroupCard.vue grid (D-03)
    [grid grid-cols-1 sm:grid-cols-2 gap-4]
         /          |          \
    Card A        Card B     Uncategorized
   (type, count, (type, count,  (count, last
    date, thumb)  date, thumb)   date, thumb)
         |
    @click = openGroupPanel(group)
         |
    selectedGroup.value = group.records
    showGroupPanel.value = true
         |
    <Drawer position="right" v-model:visible="showGroupPanel">
         |
    VaccinationGroupPanel.vue
    [DataTable: name | date | dose | lot | View Record]
         |
    @view = openDetail(record)   [Drawer stays open — D-02]
         |
    fileToken = await pb.files.getToken()
    showDetail.value = true
         |
    <Dialog> over <Drawer>
    VaccinationDetail.vue [UNCHANGED]
```

### Recommended Project Structure

```
src/components/projects/wallecx/
├── WallecxApp.vue              # MODIFIED — add groupedVaccinations computed,
│                               # selectedGroup + showGroupPanel refs,
│                               # openGroupPanel() handler, replace <VaccinationList>
│                               # with card grid + <Drawer>
├── VaccinationGroupCard.vue    # NEW — single group card: type name (bold),
│                               # Badge (record count), last date, thumbnail or placeholder
├── VaccinationGroupPanel.vue   # NEW — Drawer content: DataTable 4 cols + View Record button
├── VaccinationList.vue         # RETIRED from WallecxApp — no longer mounted in main view;
│                               # file kept (not deleted) — the Drawer uses VaccinationGroupPanel
│                               # with different columns, so reuse is not clean
├── VaccinationDetail.vue       # UNTOUCHED (GROUP-07)
├── ManageVaccination.vue       # UNTOUCHED
└── AttachmentPreview.vue       # UNTOUCHED
```

### Pattern 1: Grouping Computed in WallecxApp.vue

**What:** A `computed` that reduces `records.value` into an array of group objects, sorted alphabetically with "Uncategorized" pinned last.

**When to use:** Whenever the parent already holds the flat records array and a pure derived value is needed — no side effects, no new PocketBase calls.

**Example:**
```typescript
// Source: VERIFIED from WallecxApp.vue existing computed pattern + CONTEXT.md §Specifics
import { ref, computed } from "vue";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

interface VaccineGroup {
  vaccineType: string;   // display name — "Uncategorized" for empty vaccine_type
  records: Vaccinations[];
  latestRecord: Vaccinations; // records[0] — already sorted -date_administered
}

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
      latestRecord: recs[0], // PocketBase sort: -date_administered, so [0] is most recent
    };
    if (key === "") {
      uncategorized.push(group);
    } else {
      named.push(group);
    }
  }

  // D-05: alphabetical (case-insensitive); D-06: Uncategorized pinned last
  named.sort((a, b) =>
    a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
  );

  return [...named, ...uncategorized];
});
```

### Pattern 2: PrimeVue Drawer Usage

**What:** Overlay panel that slides from the right. Uses `v-model:visible` two-way binding. Auto-resolved by `PrimeVueResolver` — no manual import needed.

**When to use:** GROUP-06 — when user clicks a group card.

**Example:**
```typescript
// Source: VERIFIED from node_modules/primevue/drawer/index.d.ts
// DrawerProps confirmed: visible, position, header, modal, dismissable
// DrawerEmits confirmed: update:visible, show, hide, after-hide, after-show
const showGroupPanel = ref(false);
const selectedGroup = ref<VaccineGroup | null>(null);

function openGroupPanel(group: VaccineGroup): void {
  selectedGroup.value = group;
  showGroupPanel.value = true;
}
```

```html
<!-- Template — Drawer is auto-imported via PrimeVueResolver -->
<Drawer
  v-model:visible="showGroupPanel"
  position="right"
  :header="selectedGroup?.vaccineType ?? ''"
  :style="{ width: '30rem' }"
  :breakpoints="{ '641px': '92vw' }"
>
  <VaccinationGroupPanel
    v-if="selectedGroup"
    :records="selectedGroup.records"
    :list-token="listToken"
    @view="openDetail"
  />
</Drawer>
```

**Critical:** Drawer staying open when Dialog opens (D-02) is automatic — PrimeVue Dialog is `modal` and overlays on top of whatever is rendered. No manual z-index management needed.

### Pattern 3: VaccinationGroupCard.vue Structure

**What:** Single group card using PrimeVue `Card`, displaying type name + Badge + last date + thumbnail.

**When to use:** Rendered in the group grid loop inside `WallecxApp.vue`.

**Example:**
```html
<!-- Source: VERIFIED from VaccinationList.vue thumbUrl pattern + CONTEXT.md §Specifics -->
<!-- VaccinationGroupCard.vue -->
<script setup lang="ts">
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const props = defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>();

const emit = defineEmits<{ click: [] }>();

function thumbUrl(record: Vaccinations): string {
  if (!record.card) return "";
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
</script>

<template>
  <Card
    class="cursor-pointer hover:shadow-md transition-shadow"
    @click="emit('click')"
  >
    <template #content>
      <!-- Type name + badge -->
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg font-bold" style="color: var(--color-brand-primary)">
          {{ vaccineType }}
        </span>
        <Badge :value="`${records.length} record${records.length !== 1 ? 's' : ''}`" severity="secondary" />
      </div>
      <!-- Last administered date -->
      <p class="text-sm mb-2" style="color: var(--color-typo-body)">
        Last: {{ displayDate(latestRecord.date_administered) }}
      </p>
      <!-- Thumbnail -->
      <img
        v-if="latestRecord.card"
        :src="thumbUrl(latestRecord)"
        :alt="`${vaccineType} vaccination card thumbnail`"
        class="w-12 h-12 object-cover rounded"
      />
      <iconify-icon
        v-else
        icon="mdi:image-off"
        width="32"
        height="32"
        style="color: var(--color-typo-muted)"
      ></iconify-icon>
    </template>
  </Card>
</template>
```

### Pattern 4: VaccinationGroupPanel.vue (Drawer content)

**What:** DataTable inside the Drawer listing all records in the selected group. Follows the VaccinationList.vue skeleton/data/empty pattern but with 4 columns (name, date, dose, lot) + a View Record button column.

**When to use:** Rendered inside the `<Drawer>` when a group is selected.

**Columns (GROUP-06):** Vaccine Name | Date Administered | Dose | Lot Number | (View Record button)

```html
<!-- Source: VERIFIED from VaccinationList.vue DataTable pattern -->
<script setup lang="ts">
import dayjs from "dayjs";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

defineProps<{
  records: Vaccinations[];
  listToken: string;  // included for prop API consistency; not needed for Drawer columns
}>();

const emit = defineEmits<{
  view: [record: Vaccinations];
}>();

function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
</script>

<template>
  <DataTable :value="records" striped-rows>
    <Column field="vaccine_name" header="Vaccine" />
    <Column header="Date" style="width: 8rem">
      <template #body="{ data }">{{ displayDate(data.date_administered) }}</template>
    </Column>
    <Column header="Dose" style="width: 4rem">
      <template #body="{ data }">{{ data.dose_number ?? '—' }}</template>
    </Column>
    <Column header="Lot" style="width: 6rem">
      <template #body="{ data }">{{ data.lot_number || '—' }}</template>
    </Column>
    <Column header="" style="width: 8rem">
      <template #body="{ data }">
        <Button size="small" label="View Record" @click="emit('view', data)" />
      </template>
    </Column>
  </DataTable>
</template>
```

### Pattern 5: WallecxApp.vue Template Replacement

**What:** Replace `<VaccinationList>` with the group card grid + `<Drawer>`. The `<Dialog>` block for `VaccinationDetail` stays exactly as-is.

```html
<!-- BEFORE (Phase 5 state) -->
<VaccinationList
  :records="records"
  :is-loading="isLoading"
  :list-token="listToken"
  @view="openDetail"
  @edit="openManage"
  @remove="openDelete"
  @add-first="openManage(null)"
/>

<!-- AFTER (Phase 6) -->

<!-- Loading state -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- Empty state (no records at all) -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:needle-off" width="48" height="48"
    style="color: var(--color-brand-primary)"></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  <Button label="Add your first vaccination" icon="pi pi-plus" size="small"
    @click="openManage(null)" />
</div>

<!-- Grouped card grid -->
<div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <VaccinationGroupCard
    v-for="group in groupedVaccinations"
    :key="group.vaccineType"
    :vaccine-type="group.vaccineType"
    :records="group.records"
    :latest-record="group.latestRecord"
    :list-token="listToken"
    @click="openGroupPanel(group)"
  />
</div>

<!-- Drawer for group detail panel (D-01) -->
<Drawer
  v-model:visible="showGroupPanel"
  position="right"
  :header="selectedGroup?.vaccineType ?? ''"
  :style="{ width: '30rem' }"
  :breakpoints="{ '641px': '92vw' }"
  @hide="selectedGroup = null"
>
  <VaccinationGroupPanel
    v-if="selectedGroup"
    :records="selectedGroup.records"
    :list-token="listToken"
    @view="openDetail"
  />
</Drawer>
```

### Anti-Patterns to Avoid

- **Closing the Drawer when Dialog opens:** D-02 is explicit — `openDetail()` must NOT set `showGroupPanel.value = false`. Do not add any Drawer-closing side effect to `openDetail`.
- **Triggering a new PocketBase query for grouping:** `records` is already fetched. Do not call `pb.collection(...).getFullList` again in the grouping computed or panel.
- **Manually importing Drawer or Badge:** `PrimeVueResolver` auto-imports all PrimeVue components. Manual `import` in `<script setup>` is wrong pattern for this project (confirmed: no manual PrimeVue component imports in any Wallecx component).
- **Using `v-html` for vaccine type names or dates:** All user data must render via `{{ }}` interpolation — established constraint from POLISH-05 and WRITE-06.
- **Using new CSS variables or bespoke colors:** POLISH-02 locked — only `var(--color-brand-primary)`, `var(--color-brand-accent)`, `var(--color-typo-heading)`, `var(--color-typo-body)`, `var(--color-typo-muted)`.
- **Using `records[0]` as "most recent" without trusting sort order:** `records` ref is sorted `-date_administered` on fetch (confirmed: `getFullList({ sort: "-date_administered" })`). Each group's records array is populated in iteration order — these will be in descending date order as long as the Map iteration preserves insertion order (which JavaScript Maps do). `latestRecord = records[0]` is safe.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-in overlay panel | Custom CSS/JS animated div | PrimeVue `Drawer` | Handles z-index, backdrop, escape key, focus trap, accessibility — already installed |
| Record count pill | Custom styled `<span>` | PrimeVue `Badge` | Consistent Aura theming, severity variants, already installed |
| Alphabetical sort | Manual bubble sort / `reduce` | `Array.sort` + `localeCompare` | `localeCompare` handles case-insensitive natural language sort correctly; custom sorts miss locale edge cases |
| Group state management | Pinia store or Vuex | `ref` + `computed` in WallecxApp | Existing pattern — no store used anywhere in Wallecx; parent-owns-state is the established contract |

---

## Common Pitfalls

### Pitfall 1: Drawer + Dialog z-index conflict

**What goes wrong:** The Drawer and Dialog both manage their own z-index via PrimeVue's `autoZIndex` system. In rare configurations they can compete.

**Why it happens:** Both use `autoZIndex: true` by default, which increments a global counter.

**How to avoid:** Do not set `baseZIndex` on either component unless a conflict is observed. PrimeVue's autoZIndex manager opens Dialog on top of Drawer naturally because Dialog is mounted after (D-02 behavior is automatic). Verified via `DrawerProps` — `modal: true` (default) creates a mask that Dialog renders above.

**Warning signs:** If Dialog appears behind the Drawer mask, add `:base-z-index="1000"` to Dialog in `WallecxApp.vue`.

### Pitfall 2: `selectedGroup` not reset on Drawer close

**What goes wrong:** User opens group A, closes Drawer, opens group B — panel still shows group A's records because `selectedGroup` was not cleared.

**Why it happens:** `v-model:visible` controls visibility but does not reset `selectedGroup`.

**How to avoid:** Use `@hide="selectedGroup = null"` on the `<Drawer>` element. VaccinationGroupPanel uses `v-if="selectedGroup"` so it unmounts cleanly on hide.

### Pitfall 3: Map iteration order giving wrong "most recent" record

**What goes wrong:** `latestRecord = records[0]` picks up the wrong record as the thumbnail/date source.

**Why it happens:** The grouping loop pushes records into Map buckets in the iteration order of `records.value`. Since `records.value` is already sorted `-date_administered`, each bucket's `[0]` is the most recent. However, if `records.value` sort order ever changes, this breaks silently.

**How to avoid:** Trust the `getFullList({ sort: "-date_administered" })` sort contract documented in WallecxApp.vue. Add a comment on `latestRecord` assignment: `// records already sorted -date_administered; [0] is most recent`.

### Pitfall 4: `Drawer` not in components.d.ts until first use

**What goes wrong:** TypeScript shows "unknown component Drawer" even though it's auto-imported.

**Why it happens:** `unplugin-vue-components` updates `components.d.ts` when the component is first encountered in a `.vue` file. Until then the generated type declaration doesn't include `Drawer` or `Badge`.

**How to avoid:** Run `npm run dev` (or `npm run build`) after adding `<Drawer>` and `<Badge>` to templates — the plugin regenerates `components.d.ts` automatically. This is not an error in the implementation; it's the normal lifecycle of auto-import. `npm run type-check` may fail until the dev server has been started once.

### Pitfall 5: Empty-state shown incorrectly when records exist

**What goes wrong:** User has records but sees empty state because the empty state condition checks `records.length === 0` but the `groupedVaccinations` computed is also what drives the grid. If there is any mismatch between the two conditions, one renders incorrectly.

**How to avoid:** Use a single unified conditional: `v-if="isLoading"` → skeleton; `v-else-if="records.length === 0"` → empty state; `v-else` → grid. The `groupedVaccinations` computed over `records.value` cannot be non-empty if `records.length === 0`, so these conditions are safe.

### Pitfall 6: `VaccinationList.vue` still mounted after replacement

**What goes wrong:** WallecxApp.vue template still references `<VaccinationList>` after the replacement, causing both old DataTable and new card grid to render.

**Why it happens:** Forgetting to remove the old `<VaccinationList>` block when adding the new card grid.

**How to avoid:** Remove the entire `<VaccinationList ... />` tag from WallecxApp.vue template as the first action of the plan. `VaccinationList.vue` file is kept (not deleted) but not referenced from the template.

---

## Code Examples

### Grouping + Sorting Type Definition

```typescript
// Source: VERIFIED from types.d.ts + CONTEXT.md §Code Context
interface VaccineGroup {
  vaccineType: string;      // "COVID-19", "Flu", ..., "Uncategorized"
  records: Vaccinations[];  // all records in the group, order preserved from records ref
  latestRecord: Vaccinations; // records[0] — most recent by date_administered
}
```

### New WallecxApp.vue State Additions

```typescript
// Source: VERIFIED from WallecxApp.vue existing state pattern
const showGroupPanel = ref(false);
const selectedGroup = ref<VaccineGroup | null>(null);

function openGroupPanel(group: VaccineGroup): void {
  selectedGroup.value = group;
  showGroupPanel.value = true;
}
```

### Existing `openDetail` — No Changes Required

```typescript
// Source: VERIFIED from WallecxApp.vue lines 53–66
// D-02: openDetail is called from VaccinationGroupPanel; Drawer stays open
// No modification needed — function already handles token + showDetail correctly
async function openDetail(record: Vaccinations): Promise<void> {
  // ... existing implementation unchanged ...
}
```

### localeCompare Sort (D-05, D-06)

```typescript
// Source: VERIFIED MDN — localeCompare with sensitivity: "base" is case-insensitive
named.sort((a, b) =>
  a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
);
return [...named, ...uncategorized]; // D-06: Uncategorized always last
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PrimeVue `Sidebar` component | PrimeVue `Drawer` component | PrimeVue v4 | `Sidebar` was renamed to `Drawer`; API is the same but component name changed — use `<Drawer>`, not `<Sidebar>` |

**Deprecated/outdated:**
- `<Sidebar>` (PrimeVue v3 name): Replaced by `<Drawer>` in PrimeVue v4. `node_modules/primevue/` contains `drawer/` — no `sidebar/` directory. [VERIFIED: node_modules scan]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Each group's records maintain `-date_administered` order from the global `records` ref, so `records[0]` in each bucket is the most recent | Architecture Patterns — Pattern 1 | Wrong record shown as "latest" for thumbnail/date; low visual impact, not a data integrity issue |
| A2 | PrimeVue Dialog renders above PrimeVue Drawer without manual z-index configuration (D-02 behavior is automatic) | Common Pitfalls — Pitfall 1 | Dialog may render behind Drawer mask; easy fix: add `baseZIndex` to Dialog |

**All other claims are VERIFIED against codebase or official PrimeVue 4.5.5 type definitions.**

---

## Open Questions

1. **Drawer width on desktop**
   - What we know: CONTEXT.md leaves Drawer width to Claude's discretion
   - What's unclear: Whether `30rem` (suggested in Code Examples) is wide enough for a DataTable with 5 columns on mid-size screens
   - Recommendation: Start with `30rem` desktop / `92vw` mobile. The DataTable `table-style="min-width: 24rem"` will trigger horizontal scroll if content overflows — this is acceptable.

2. **VaccinationList.vue fate**
   - What we know: CONTEXT.md allows either repurposing VaccinationList or creating new VaccinationGroupPanel; column set differs
   - What's unclear: Whether keeping an unreferenced VaccinationList.vue file causes confusion
   - Recommendation: Create new `VaccinationGroupPanel.vue` — the 4-column Drawer DataTable is different enough from the 5-column VaccinationList DataTable (no thumbnail column, no edit/remove buttons) that reuse would require prop gymnastics. Keep `VaccinationList.vue` in the file system (do not delete) in case it's needed again.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is a pure frontend code change. No external CLI tools, services, or runtimes beyond `npm run dev` / `npm run build` are required. All dependencies are already installed and verified in `node_modules`.

---

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. Section omitted.

---

## Security Domain

Phase 6 introduces no new authentication, session, file upload, or data persistence surface. All data is already fetched and guarded by the existing PocketBase per-user rules (established in Phase 1 BACK-03). The only user-facing rendering is vaccine type names and dates via `{{ }}` mustache interpolation — no `v-html` anywhere in scope. ASVS analysis is inherited from prior phases with no new threat surface.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/primevue/drawer/index.d.ts` — Full DrawerProps, DrawerSlots, DrawerEmits API [VERIFIED]
- `node_modules/primevue/badge/index.d.ts` — Full BadgeProps API [VERIFIED]
- `node_modules/primevue/package.json` — Version 4.5.5 [VERIFIED]
- `src/components/projects/wallecx/WallecxApp.vue` — Existing state/handler/template patterns [VERIFIED]
- `src/components/projects/wallecx/VaccinationList.vue` — thumbUrl pattern, DataTable skeleton pattern [VERIFIED]
- `src/components/projects/wallecx/VaccinationDetail.vue` — Props interface, unchanged contract [VERIFIED]
- `src/types/wallecx/vaccinations/types.d.ts` — Vaccinations interface with vaccine_type: string [VERIFIED]
- `components.d.ts` — Auto-resolved PrimeVue components list; Drawer and Badge absent (not yet used) [VERIFIED]
- `vite.config.ts` — PrimeVueResolver auto-import configuration [VERIFIED]
- `.planning/config.json` — nyquist_validation: false [VERIFIED]
- `.planning/phases/06-grouped-card-view-group-detail-panel/06-CONTEXT.md` — Locked decisions D-01..D-06 [VERIFIED]

### Secondary (MEDIUM confidence)
- `.planning/phases/05-schema-types-form-field/05-UI-SPEC.md` — Design token constraints, no new tokens policy [VERIFIED from project artifact]
- `.planning/STATE.md` — Phase 5 complete, records ref established, no new PocketBase queries needed [VERIFIED from project artifact]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified in node_modules at exact installed version
- Architecture: HIGH — derived directly from reading actual source files; no inference needed
- Pitfalls: HIGH — identified from actual code patterns and PrimeVue API edge cases
- Grouping algorithm: HIGH — JavaScript Map iteration order is spec-guaranteed; localeCompare confirmed

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable stack; PrimeVue 4.x API is not fast-moving)
