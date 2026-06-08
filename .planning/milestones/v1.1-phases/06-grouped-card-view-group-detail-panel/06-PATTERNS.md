# Phase 6: Grouped Card View & Group Detail Panel - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 4 (1 modified, 2 new, 1 retired)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/projects/wallecx/WallecxApp.vue` | orchestrator/controller | request-response + event-driven | `src/components/projects/wallecx/WallecxApp.vue` (self) | exact — modify in-place |
| `src/components/projects/wallecx/VaccinationGroupCard.vue` | component (presentational) | transform (prop-in / event-out) | `src/components/projects/wallecx/VaccinationList.vue` | role-match — same thumbUrl + displayDate helpers, same design tokens |
| `src/components/projects/wallecx/VaccinationGroupPanel.vue` | component (data display) | CRUD-read (DataTable over prop array) | `src/components/projects/wallecx/VaccinationList.vue` | exact — same DataTable/Column/Button pattern, reduced column set |
| `src/components/projects/wallecx/VaccinationList.vue` | retired | — | n/a — file kept, not mounted | — |

---

## Pattern Assignments

### `src/components/projects/wallecx/WallecxApp.vue` (orchestrator — modify in-place)

**Analog:** itself — `src/components/projects/wallecx/WallecxApp.vue`

**Existing imports block** (lines 1-8) — add `computed` to the vue import:
```typescript
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import ManageVaccination from "./ManageVaccination.vue";
// NEW imports:
import VaccinationGroupCard from "./VaccinationGroupCard.vue";
import VaccinationGroupPanel from "./VaccinationGroupPanel.vue";
```
Note: `VaccinationGroupCard` and `VaccinationGroupPanel` are local components in the same directory — they require explicit relative imports (not auto-imported by PrimeVueResolver). All PrimeVue components (`Drawer`, `Badge`, `Card`, `Skeleton`, `Dialog`, `Button`, `ConfirmDialog`) remain without manual imports — they are auto-resolved.

**Existing state block** (lines 10-20) — new refs follow the same `ref<T>` pattern:
```typescript
// EXISTING — do not change
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);
const selectedRecord = ref<Vaccinations | null>(null);
const showDetail = ref(false);
const fileToken = ref<string>("");
const listToken = ref<string>("");
const showManage = ref<boolean>(false);
const manageRecord = ref<Vaccinations | null>(null);

// NEW — add after existing state block, before LIST_TOKEN_TTL_MS
const showGroupPanel = ref(false);
const selectedGroup = ref<VaccineGroup | null>(null);
```

**New VaccineGroup interface + groupedVaccinations computed** — add after state declarations, before `onMounted`:
```typescript
interface VaccineGroup {
  vaccineType: string;       // display name; "Uncategorized" for empty vaccine_type
  records: Vaccinations[];   // order preserved from records ref (sorted -date_administered)
  latestRecord: Vaccinations; // records[0] — most recent by date_administered
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
      latestRecord: recs[0], // records already sorted -date_administered; [0] is most recent
    };
    if (key === "") {
      uncategorized.push(group);
    } else {
      named.push(group);
    }
  }

  // D-05: alphabetical case-insensitive; D-06: Uncategorized pinned last
  named.sort((a, b) =>
    a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
  );

  return [...named, ...uncategorized];
});
```

**New openGroupPanel handler** — add after `openManage` function (line 71 area), before `exportJson`:
```typescript
function openGroupPanel(group: VaccineGroup): void {
  selectedGroup.value = group;
  showGroupPanel.value = true;
}
```

**Existing openDetail — no changes** (lines 53-66). It is called from VaccinationGroupPanel via `@view="openDetail"`. The Drawer does NOT close when the Dialog opens (D-02): `openDetail` must NOT touch `showGroupPanel`.

**Template replacement** — replace lines 191-199 (`<VaccinationList ... />`) with:
```html
<!-- Loading state: skeleton card grid -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- Empty state (D-02 from VaccinationList.vue pattern) -->
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

<!-- Grouped card grid (D-03: 2 cols desktop / 1 col mobile) -->
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

<!-- Drawer for group detail panel (D-01: slides from right) -->
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

**Existing Dialog block** (lines 213-227) — leave exactly as-is. The `@hide` handler on Dialog (line 219) already resets `selectedRecord` and `fileToken`.

---

### `src/components/projects/wallecx/VaccinationGroupCard.vue` (new component, presentational)

**Analog:** `src/components/projects/wallecx/VaccinationList.vue`

**Imports pattern** — copy from VaccinationList.vue lines 1-4, same three imports:
```typescript
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```

**defineProps pattern** — mirrors VaccinationList.vue lines 6-10 style (`defineProps<{...}>()`):
```typescript
const props = defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>();
```

**defineEmits pattern** — same typed-emit syntax as VaccinationList.vue lines 12-17:
```typescript
const emit = defineEmits<{
  click: [];
}>();
```

**thumbUrl helper** — copy exactly from VaccinationList.vue lines 22-25 (same function body, same guard, same `thumb: "100x100"` + `token: props.listToken`):
```typescript
function thumbUrl(record: Vaccinations): string {
  if (!record.card) return ""; // guard against empty-string card field
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}
```

**displayDate helper** — copy from VaccinationList.vue line 27-29 (same `DD MMM YYYY` format used in the list):
```typescript
function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
```

**Template — Card + content slot** — card slot pattern from WallecxApp.vue template (line 167-228 outer Card):
```html
<template>
  <Card
    class="cursor-pointer hover:shadow-md transition-shadow"
    @click="emit('click')"
  >
    <template #content>
      <!-- Type name + badge row (D-04) -->
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg font-bold" style="color: var(--color-brand-primary)">
          {{ vaccineType }}
        </span>
        <Badge
          :value="`${records.length} record${records.length !== 1 ? 's' : ''}`"
          severity="secondary"
        />
      </div>
      <!-- Last administered date -->
      <p class="text-sm mb-2" style="color: var(--color-typo-body)">
        Last: {{ displayDate(latestRecord.date_administered) }}
      </p>
      <!-- Thumbnail or placeholder — mirrors VaccinationList.vue lines 74-88 -->
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

**Thumbnail + placeholder pattern source:** VaccinationList.vue lines 74-88 — `v-if="data.card"` with `<img>`, `v-else` with `<iconify-icon icon="mdi:image-off">`.

**Design tokens in use** (all from VaccinationList.vue / VaccinationDetail.vue — no new tokens):
- `var(--color-brand-primary)` — type name text
- `var(--color-typo-body)` — date text
- `var(--color-typo-muted)` — placeholder icon

---

### `src/components/projects/wallecx/VaccinationGroupPanel.vue` (new component, DataTable inside Drawer)

**Analog:** `src/components/projects/wallecx/VaccinationList.vue` — same DataTable + Column + Button structure, reduced to 4 data columns + 1 action column

**Imports pattern** — subset of VaccinationList.vue (no `pb` import needed — no thumbnail in Drawer):
```typescript
import dayjs from "dayjs";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
```

**defineProps pattern** — mirrors VaccinationList.vue style:
```typescript
defineProps<{
  records: Vaccinations[];
  listToken: string; // kept for API consistency; unused in Drawer columns
}>();
```

**defineEmits pattern** — same typed-emit syntax as VaccinationList.vue lines 12-17:
```typescript
const emit = defineEmits<{
  view: [record: Vaccinations];
}>();
```

**displayDate helper** — identical to VaccinationList.vue lines 27-29:
```typescript
function displayDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}
```

**Template — DataTable with 4 columns + View Record action** — structural copy of VaccinationList.vue lines 72-116 (data state block), stripped to GROUP-06 columns:
```html
<template>
  <DataTable :value="records" striped-rows table-style="min-width: 24rem">
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

**Key differences from VaccinationList.vue:**
- No loading skeleton (Drawer is only mounted when `selectedGroup` is set — data is already available)
- No empty-state block (Drawer never opens for a group with zero records)
- No thumbnail column
- No Edit / Remove buttons — "View Record" only (GROUP-06)
- `table-style="min-width: 24rem"` (narrower than VaccinationList's `30rem`)

**Null/fallback pattern** — copy directly from VaccinationList.vue lines 95-96:
- `data.dose_number ?? "—"` for optional number
- `data.lot_number || "—"` for optional string

---

### `src/components/projects/wallecx/VaccinationList.vue` (retired — file kept, not mounted)

No patterns to extract for new work. File remains on disk; `WallecxApp.vue` template no longer contains `<VaccinationList>`. The `components.d.ts` entry for `VaccinationList` will persist (auto-generated) and is harmless.

---

## Shared Patterns

### Auto-import contract (applies to all three modified/new files)

**Source:** `components.d.ts` lines 19-68 + `vite.config.ts` PrimeVueResolver
**Apply to:** All `.vue` files in the wallecx directory

PrimeVue components (`Card`, `Button`, `DataTable`, `Column`, `Badge`, `Drawer`, `Skeleton`, `Dialog`, `ConfirmDialog`) do NOT need `import` statements in `<script setup>`. They are resolved globally by `unplugin-vue-components` + `PrimeVueResolver`.

`Drawer` and `Badge` are not yet in `components.d.ts` (confirmed: absent from line scan). They will be auto-added on first `npm run dev` / `npm run build`. This is expected — not an error.

Local wallecx components (`VaccinationGroupCard`, `VaccinationGroupPanel`, `ManageVaccination`, `VaccinationDetail`) ARE local files and require explicit relative imports in the files that use them.

### Design token contract (applies to all three modified/new files)

**Source:** `src/components/projects/wallecx/VaccinationDetail.vue` lines 21-48, `VaccinationList.vue` lines 56-68

No new CSS variables. Use only:
```
var(--color-brand-primary)   — navy; headings, prominent labels, icons
var(--color-brand-accent)    — amber; (not used in Phase 6 scope)
var(--color-typo-heading)    — label/heading text inside cards
var(--color-typo-body)       — body text inside cards
var(--color-typo-muted)      — de-emphasized text, placeholder icons
```

### `pb.files.getURL` thumbnail pattern (applies to VaccinationGroupCard.vue)

**Source:** `src/components/projects/wallecx/VaccinationList.vue` lines 22-25
```typescript
function thumbUrl(record: Vaccinations): string {
  if (!record.card) return "";
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}
```
Always guard `!record.card` before calling `getURL`. Pass `token: props.listToken` (not `fileToken` — that is only for the single-record Dialog view).

### Null-coalescing display pattern (applies to VaccinationGroupPanel.vue)

**Source:** `src/components/projects/wallecx/VaccinationDetail.vue` lines 29-33, `VaccinationList.vue` lines 95-96
```
data.dose_number ?? "—"   // optional number — use ?? (0 is a valid dose)
data.lot_number || "—"    // optional string — use || (empty string = falsy = show dash)
```

### Empty-state block pattern (applies to WallecxApp.vue template replacement)

**Source:** `src/components/projects/wallecx/VaccinationList.vue` lines 55-69 — copy the `v-else-if="records.length === 0"` block verbatim. The `openManage(null)` call replaces `emit('addFirst')` since the handler is now in the parent.

### Event handler naming convention

**Source:** `WallecxApp.vue` lines 68-71, 125-131, 133-136

Handler naming follows `on<Action>` for callbacks receiving emitted events (`onCreated`, `onUpdated`) and `open<Thing>` for functions that set visibility state (`openDetail`, `openManage`, `openDelete`, `openGroupPanel`). New handler `openGroupPanel` follows this exact pattern.

---

## No Analog Found

All four files have close analogs within the wallecx directory. No files require falling back to RESEARCH.md patterns exclusively — though RESEARCH.md patterns for `groupedVaccinations` computed and the `<Drawer>` template block are authoritative complements to the codebase excerpts above.

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/types/wallecx/`, `components.d.ts`
**Files scanned:** 5 source files read in full (`WallecxApp.vue`, `VaccinationList.vue`, `VaccinationDetail.vue`, `ManageVaccination.vue`, `types.d.ts`) + `components.d.ts`
**Pattern extraction date:** 2026-05-12
