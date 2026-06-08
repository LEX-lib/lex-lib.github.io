---
phase: 6
slug: grouped-card-view-group-detail-panel
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-12
baseline: .planning/phases/05-schema-types-form-field/05-UI-SPEC.md
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for Phase 6: Grouped Card View & Group Detail Panel.
> All base design tokens, spacing, typography, color, and interaction patterns are
> inherited from the Phase 3 baseline (`.planning/phases/03-write-path/03-UI-SPEC.md`)
> via Phase 5. This document specifies the Phase 6 delta: the grouped card grid,
> the PrimeVue Drawer panel, and the card/panel copywriting.

---

## Design System

Fully inherited from Phase 3 UI-SPEC. No changes.

| Property | Value |
|----------|-------|
| Tool | none (PrimeVue 4 + Tailwind CSS 4) |
| Preset | MyPreset — Aura base, navy primary scale (#002244 at 500), amber highlight (#e89820) — configured in `src/main.ts` |
| Component library | PrimeVue 4 (auto-imported via `PrimeVueResolver`) |
| Icon library | `iconify-icon` web component, `mdi:*` icon set |
| Font | Rubik (Google Fonts) — weights 400, 700 |

**shadcn gate result:** Not applicable. Project uses PrimeVue 4 + Tailwind CSS 4. No `components.json`. Registry safety gate is not required.

**New PrimeVue components in Phase 6 (auto-imported — no manual import):** `Drawer`, `Badge`.
Both are confirmed present at `node_modules/primevue/drawer/` and `node_modules/primevue/badge/` (PrimeVue 4.5.5).

**Delta:** Two new PrimeVue components enter the template (`Drawer`, `Badge`). No new npm packages. No new CSS custom properties.

---

## Spacing Scale

Fully inherited from Phase 3 UI-SPEC. Phase 6 adds group-card-specific usages.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-text gap inside group card (`gap-1`); badge-to-title gap (`gap-2` covers this) |
| sm | 8px | Gap between buttons in WallecxApp header row (`gap-2`); thumbnail margin-top inside card |
| md | 16px | Grid gap between group cards (`gap-4`); card body internal vertical spacing (`mb-2` between elements) |
| lg | 24px | Drawer inner content padding (PrimeVue Aura default); empty-state vertical padding (`py-12`) — unchanged |
| xl | 32px | WallecxApp Card content header row bottom margin (`mb-4`) — unchanged |
| 2xl | 48px | Empty-state vertical padding (`py-12`) — unchanged from Phase 3 |
| 3xl | 64px | Not used |

Exceptions:
- Group card grid: `grid grid-cols-1 sm:grid-cols-2 gap-4` — gap is 16px (md), locked by D-03.
- Loading skeleton grid: same `grid grid-cols-1 sm:grid-cols-2 gap-4` with 3 skeleton cards.
- Drawer width: `30rem` desktop, `92vw` at breakpoint `641px` — locked by research recommendation (RESEARCH.md Open Question 1).
- Thumbnail size on group card: 48x48px (`w-12 h-12`) — functional sizing, not a spacing token.
- Drawer panel DataTable `table-style="min-width: 24rem"` — ensures horizontal scroll on narrow drawers rather than column collapse.

---

## Typography

Fully inherited from Phase 3 UI-SPEC. Phase 6 adds one additional role: group card type name.

| Role | Size | Weight | Line Height | Token / Class | Used For |
|------|------|--------|-------------|---------------|----------|
| Group card title | 18px | 700 (Bold) | 1.2 | `text-lg font-bold` | Vaccine type name on each group card — most prominent element (D-04) |
| Body | 14px | 400 (Regular) | 1.5 | `text-sm` | "Last: DD MMM YYYY" date line; Drawer DataTable cell values; "View Record" button label |
| Heading | 24px | 700 (Bold) | 1.2 | `text-2xl font-bold` | WallecxApp page title "Wallecx" — unchanged |
| Dialog Header | 14–16px | 400 (Regular) | 1.2 | PrimeVue Aura default | Drawer header (vaccine type name) — PrimeVue Aura renders at preset default; no override |

**Weight constraint:** Two weights only — 400 and 700. No weight 500 or 600. Badge text is rendered by PrimeVue Aura at its internal weight; no override applied.

**Delta:** `text-lg font-bold` (18px, weight 700) added for group card type name. All other sizes unchanged.

---

## Color

Fully inherited from Phase 3 UI-SPEC. No new tokens in Phase 6.

| Role | Value | Token | Phase 6 Usage |
|------|-------|-------|---------------|
| Dominant (60%) | `#f5f7fa` | `--color-surface-page` | Unchanged — page background |
| Secondary (30%) | `#ffffff` | `--color-surface-card` | WallecxApp outer Card; each VaccinationGroupCard PrimeVue Card surface |
| Accent (10%) | `#002244` | `--color-brand-primary` | Group card type name text; empty-state `mdi:needle-off` icon; "Add vaccination" header button; "Add your first vaccination" empty-state button |
| Accent warm | `#e89820` | `--color-brand-accent` | Reserved — no Phase 6 usages |
| Text heading | `#0d1117` | `--color-typo-heading` | "Last: …" date line on group cards; empty-state message text |
| Text body | `#3d4a5c` | `--color-typo-body` | Drawer DataTable cell values |
| Text muted | `#6b7280` | `--color-typo-muted` | `mdi:image-off` placeholder icon color on group cards without a thumbnail |
| Divider | `#e8ecf2` | `--color-surface-divider` | DataTable row borders inside Drawer (PrimeVue Aura default) |
| Destructive | `#c0392b` | `--color-status-error` | No new destructive elements in Phase 6 — inherited from Phase 3 |

**Accent reserved for (Phase 6 usages):**
- Group card type name text: `style="color: var(--color-brand-primary)"`
- Empty-state icon: `style="color: var(--color-brand-primary)"` (inherited from Phase 3 pattern)
- PrimeVue primary `<Button>` fills: "Add vaccination" header button, "Add your first vaccination" empty-state CTA

**No new accent usages** beyond the group card type name (which re-uses the same navy as all other primary elements). No amber usages in Phase 6.

**Badge severity:** `severity="secondary"` — PrimeVue Aura renders this as a neutral grey pill. No custom color override.

**Card hover state:** `hover:shadow-md transition-shadow` via Tailwind — shadow deepens on hover to signal clickability. No color change on hover.

**Delta:** No new color tokens. Group card type name uses `--color-brand-primary` (already in use). Thumbnail placeholder icon uses `--color-typo-muted` (already in use).

---

## Component Specifications — Phase 6 Delta

### 1. WallecxApp.vue — Modifications

**New state refs:**
```typescript
const showGroupPanel = ref(false);
const selectedGroup = ref<VaccineGroup | null>(null);
```

**New computed (grouping — inline in WallecxApp.vue, no separate composable):**
```typescript
interface VaccineGroup {
  vaccineType: string;      // "COVID-19", "Flu", ..., "Uncategorized"
  records: Vaccinations[];  // all records for this group; order preserved from records ref
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
    if (key === "") uncategorized.push(group);
    else named.push(group);
  }
  // D-05: case-insensitive alphabetical; D-06: Uncategorized pinned last
  named.sort((a, b) =>
    a.vaccineType.localeCompare(b.vaccineType, undefined, { sensitivity: "base" })
  );
  return [...named, ...uncategorized];
});
```

**New handler:**
```typescript
function openGroupPanel(group: VaccineGroup): void {
  selectedGroup.value = group;
  showGroupPanel.value = true;
}
```

**Anti-pattern:** `openDetail` must NOT set `showGroupPanel.value = false` — D-02 requires the Drawer stays open when the Dialog opens.

**Template replacement — replace `<VaccinationList ... />` with:**

```html
<!-- Loading state: skeleton card grid -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- Empty state (GROUP-05 edge case: zero records total) -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <iconify-icon icon="mdi:needle-off" width="48" height="48"
    style="color: var(--color-brand-primary)"></iconify-icon>
  <p class="text-sm" style="color: var(--color-typo-heading)">No vaccination records yet.</p>
  <Button label="Add your first vaccination" icon="pi pi-plus" size="small"
    @click="openManage(null)" />
</div>

<!-- Grouped card grid (GROUP-04, GROUP-05) -->
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

<!-- Drawer for group detail panel (GROUP-06, D-01) -->
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

**Note:** The existing `<VaccinationList ... />` tag is removed from the template. `VaccinationList.vue` file is kept on disk but not referenced. The existing `<ConfirmDialog />`, `<ManageVaccination />`, and `<Dialog> > <VaccinationDetail>` blocks are unchanged.

---

### 2. VaccinationGroupCard.vue — New Component

**File:** `src/components/projects/wallecx/VaccinationGroupCard.vue`

**Props:**
```typescript
defineProps<{
  vaccineType: string;
  records: Vaccinations[];
  latestRecord: Vaccinations;
  listToken: string;
}>()
defineEmits<{ click: [] }>()
```

**Visual layout (top to bottom inside `<Card #content>`):**
1. Row: type name (`text-lg font-bold`, navy) + Badge (record count, `severity="secondary"`) — `flex items-center gap-2 mb-2`
2. "Last: DD MMM YYYY" date line — `text-sm`, `--color-typo-heading`, `mb-2`
3. Thumbnail `<img>` (48x48, `object-cover rounded`) if `latestRecord.card`; else `mdi:image-off` icon 32x32 in `--color-typo-muted`

**Badge value format:** `` `${records.length} record${records.length !== 1 ? 's' : ''}` ``
Examples: "1 record", "3 records"

**Hover state:** `cursor-pointer hover:shadow-md transition-shadow` on the `<Card>` element.

**Thumbnail URL:** `pb.files.getURL(latestRecord, latestRecord.card, { thumb: "100x100", token: listToken })`

**Thumbnail alt text:** `` `${vaccineType} vaccination card thumbnail` ``

**Clickability:** `@click="emit('click')"` on the outer `<Card>`. Entire card surface is clickable.

---

### 3. VaccinationGroupPanel.vue — New Component

**File:** `src/components/projects/wallecx/VaccinationGroupPanel.vue`

**Props:**
```typescript
defineProps<{
  records: Vaccinations[];
  listToken: string;  // included for API consistency; not used in Drawer columns
}>()
defineEmits<{ view: [record: Vaccinations] }>()
```

**DataTable columns (GROUP-06):**

| Column | Header | Width | Body |
|--------|--------|-------|------|
| `vaccine_name` | "Vaccine" | auto | `field="vaccine_name"` |
| `date_administered` | "Date" | 8rem | `dayjs(data.date_administered).format("DD MMM YYYY")` |
| `dose_number` | "Dose" | 4rem | `data.dose_number ?? '—'` |
| `lot_number` | "Lot" | 6rem | `data.lot_number \|\| '—'` |
| (action) | "" | 8rem | `<Button size="small" label="View Record" @click="emit('view', data)" />` |

**DataTable config:** `:value="records"` `striped-rows` `table-style="min-width: 24rem"`

**Empty state inside Drawer:** PrimeVue DataTable renders its own empty-row message when `records` is empty. No custom empty state needed — this state cannot normally occur (a group card is only shown when it has records), but the DataTable handles it gracefully by default.

**"View Record" button:** `size="small"` default severity (primary navy fill). Click calls `emit('view', data)` which routes to `openDetail(record)` in WallecxApp — Drawer stays open (D-02).

---

### 4. VaccinationList.vue — Retired from Main View

`VaccinationList.vue` is no longer mounted in `WallecxApp.vue`. The file is kept on disk (not deleted) for reference. The Drawer uses `VaccinationGroupPanel.vue` with a different 4-column set.

---

## Interaction States

### Group Card Grid

| State | Condition | Rendering |
|-------|-----------|-----------|
| Loading | `isLoading === true` | `grid grid-cols-1 sm:grid-cols-2 gap-4` with 3 `<Card>` skeleton placeholders (`<Skeleton height="6rem" />` each) |
| Empty | `!isLoading && records.length === 0` | `mdi:needle-off` icon (48x48, navy) + "No vaccination records yet." text + "Add your first vaccination" button |
| Data | `!isLoading && records.length > 0` | Grouped card grid — one `VaccinationGroupCard` per group, sorted alphabetically with "Uncategorized" last |

**Hover on group card:** `hover:shadow-md transition-shadow` — shadow depth increases. Cursor changes to `cursor-pointer`. No color change. No scale transform.

**Click on group card:** `openGroupPanel(group)` called → `selectedGroup.value = group` → `showGroupPanel.value = true` → Drawer slides in from right.

### Drawer Panel

| State | Condition | Rendering |
|-------|-----------|-----------|
| Closed | `showGroupPanel === false` | Drawer not visible; `selectedGroup === null` (reset on `@hide`) |
| Open | `showGroupPanel === true` | Drawer slides in from right at `30rem` width; header shows selected group's vaccine type name; `VaccinationGroupPanel` renders inside |
| Drawer + Dialog | Both `showGroupPanel` and `showDetail` are `true` | Dialog renders on top of Drawer (PrimeVue autoZIndex — Dialog mounts after Drawer and increments global z-index counter automatically). Drawer mask is visible behind Dialog. No manual z-index override needed. |

**Drawer close:** User clicks the X button or clicks outside (PrimeVue default modal behavior). `@hide` fires → `selectedGroup = null` → `VaccinationGroupPanel` unmounts via `v-if`.

**Dialog from Drawer:** User clicks "View Record" in `VaccinationGroupPanel` → `emit('view', record)` → WallecxApp `openDetail(record)` → fileToken fetched → `showDetail = true`. Drawer stays open (D-02 locked). User closes Dialog → immediately back in Drawer panel.

### "View Record" Button in Drawer

- Default severity (primary navy fill), `size="small"`.
- No loading state on the button — file token fetch latency handled by `openDetail`'s existing error path.
- If `pb.files.getToken()` fails: error toast "Failed to load attachment. Refresh to try again." — Dialog does not open. Drawer stays open.

---

## Copywriting Contract

All Phase 3 and Phase 5 copywriting inherited unchanged. Phase 6 adds:

| Element | Copy | Context |
|---------|------|---------|
| Drawer header — named group | "{vaccine type name}" | e.g., "COVID-19", "Flu" — the exact string from `vaccineType` field via `{{ }}`, never `v-html` |
| Drawer header — uncategorized group | "Uncategorized" | Capital U; exact string literal; displayed when `vaccine_type === ""` |
| Badge — singular | "1 record" | PrimeVue Badge `:value` — template literal `` `${n} record` `` |
| Badge — plural | "{n} records" | PrimeVue Badge `:value` — template literal `` `${n} records` `` |
| Group card date line | "Last: DD MMM YYYY" | e.g., "Last: 15 Jan 2025" — `dayjs(latestRecord.date_administered).format("DD MMM YYYY")` |
| Drawer — "View Record" button | "View Record" | Button label in DataTable action column (GROUP-07) |
| Drawer — Vaccine column header | "Vaccine" | DataTable `<Column header="Vaccine">` |
| Drawer — Date column header | "Date" | DataTable `<Column header="Date">` |
| Drawer — Dose column header | "Dose" | DataTable `<Column header="Dose">` |
| Drawer — Lot column header | "Lot" | DataTable `<Column header="Lot">` |
| Dose absent | "—" | Em-dash for missing `dose_number` (null/undefined) |
| Lot absent | "—" | Em-dash for missing `lot_number` (empty/null) |
| Empty state message (zero records) | "No vaccination records yet." | Unchanged from Phase 3 — reused in grouped view |
| Empty state CTA | "Add your first vaccination" | Unchanged from Phase 3 — reused in grouped view |
| Thumbnail alt text | "{vaccineType} vaccination card thumbnail" | e.g., "COVID-19 vaccination card thumbnail" |

**Date format in Drawer DataTable:** `DD MMM YYYY` — e.g. "15 Jan 2025". Consistent with the old `VaccinationList.vue` format.

**No new destructive actions in Phase 6.** All destructive actions (delete) remain in the existing Phase 3 pattern and are not accessible from the Drawer panel. The Drawer is read-only.

---

## Registry Safety

No new npm packages installed in Phase 6. All components (`Drawer`, `Badge`, `Card`, `DataTable`, `Column`, `Button`, `Skeleton`) are part of PrimeVue 4.5.5 already installed in `node_modules`.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None | Not applicable — project uses PrimeVue, not shadcn |
| Third-party registries | None | Not applicable |
| npm packages (new) | None | No installs — all PrimeVue components verified in `node_modules/primevue/` |

**Explicit confirmation:** Phase 6 requires zero new dependencies. `Drawer` and `Badge` are confirmed in `node_modules/primevue/drawer/index.d.ts` and `node_modules/primevue/badge/index.d.ts` respectively. Registry vetting gate is not required.

---

## Constraint Checklist — Phase 6

Constraints inherited from Phase 3 apply unchanged. Phase 6 adds:

| Constraint | Rule | Verifiable By |
|------------|------|---------------|
| No `v-html` | Vaccine type names, dates, lot numbers rendered via `{{ }}` mustache or prop text; never `v-html` | `git grep "v-html" src/components/projects/wallecx` returns zero hits |
| Drawer stays open on Dialog open | `openDetail` must NOT set `showGroupPanel.value = false` — D-02 locked | Code review of `openDetail` in WallecxApp.vue |
| `selectedGroup` reset on Drawer hide | `@hide="selectedGroup = null"` on `<Drawer>` | Code review of WallecxApp.vue template |
| No new PocketBase queries | Grouping computed uses `records.value` already in memory — no additional `getFullList` or `getFirstListItem` calls | Code review — no `pb.collection(...).get*` calls in VaccinationGroupCard or VaccinationGroupPanel |
| No new CSS custom properties | Phase 6 uses only existing tokens: `--color-brand-primary`, `--color-typo-heading`, `--color-typo-body`, `--color-typo-muted` | `git grep "var(--color" src/components/projects/wallecx` — all tokens are pre-existing |
| Auto-import only | `Drawer` and `Badge` must NOT be manually imported in `<script setup>` — PrimeVueResolver handles it | Code review — no `import { Drawer }` or `import { Badge }` in any Wallecx component |
| D-05: alphabetical sort | `localeCompare` with `sensitivity: "base"` for case-insensitive sort | Code review of `groupedVaccinations` computed |
| D-06: Uncategorized last | `[...named, ...uncategorized]` return order in `groupedVaccinations` computed | Code review |
| D-06: sentinel logic | `vaccine_type === ""` (or falsy after `.trim()`) maps to "Uncategorized" display key | Code review of grouping loop |
| latestRecord assumption documented | `records[0]` comment: "records already sorted -date_administered; [0] is most recent" | Code comment in computed |
| `VaccinationList.vue` removed from template | No `<VaccinationList>` tag in WallecxApp.vue template after Phase 6 | `git grep "VaccinationList" src/components/projects/wallecx/WallecxApp.vue` returns zero tag usages |

---

## Pre-Population Sources

| Field | Source | Notes |
|-------|--------|-------|
| Design system | Phase 3 UI-SPEC.md | Inherited unchanged |
| Spacing scale | Phase 3 UI-SPEC.md | Inherited; Phase 6 adds grid gap (md/16px) and card mb-2 usages |
| Typography — body/heading | Phase 3 UI-SPEC.md | Inherited; Phase 6 adds `text-lg font-bold` for group card title |
| Color tokens | Phase 3 UI-SPEC.md + `src/assets/base.css` | Inherited; Phase 6 reuses `--color-brand-primary` for card title, `--color-typo-muted` for placeholder icon |
| D-01 (Drawer) | 06-CONTEXT.md — Decisions | PrimeVue Drawer, slides from right — locked |
| D-02 (Dialog on top) | 06-CONTEXT.md — Decisions | Drawer stays open; Dialog renders above — locked |
| D-03 (grid layout) | 06-CONTEXT.md — Decisions | `grid grid-cols-1 sm:grid-cols-2 gap-4` — locked |
| D-04 (card hierarchy) | 06-CONTEXT.md — Decisions | Type name (large/bold) + badge — most prominent — locked |
| D-05 (alphabetical sort) | 06-CONTEXT.md — Decisions | `localeCompare sensitivity: "base"` — locked |
| D-06 (Uncategorized last) | 06-CONTEXT.md — Decisions | `[...named, ...uncategorized]` — locked |
| Drawer width 30rem / 92vw | 06-RESEARCH.md — Open Question 1 | Recommendation: 30rem desktop, 92vw ≤ 641px |
| VaccinationGroupPanel columns | 06-CONTEXT.md — Claude's Discretion + RESEARCH.md Pattern 4 | 4 columns: Vaccine, Date, Dose, Lot + View Record |
| Badge format "N record(s)" | 06-CONTEXT.md — Specifics | Template literal with singular/plural |
| Date format "Last: DD MMM YYYY" | 06-CONTEXT.md — Specifics | dayjs format |
| Thumbnail 100x100 + listToken | 06-RESEARCH.md — Pattern 3 + VaccinationList.vue thumbUrl pattern | `pb.files.getURL(record, record.card, { thumb: "100x100", token: listToken })` |
| Empty-state copy | Phase 3 UI-SPEC.md — Copywriting | "No vaccination records yet." + "Add your first vaccination" — reused unchanged |
| mdi:image-off placeholder | 06-CONTEXT.md — Specifics + VaccinationList.vue | Existing pattern for missing thumbnails |
| `VaccinationList.vue` fate | 06-RESEARCH.md — Open Question 2 | Kept on disk, not deleted, not referenced from template |
| Anti-pattern: no Drawer-close in openDetail | 06-RESEARCH.md — Anti-Patterns | D-02 enforcement |
| Anti-pattern: no new PocketBase query | 06-RESEARCH.md — Anti-Patterns | Records already in memory |
| User input | None | All design contract questions answered by upstream artifacts; zero re-asked |

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

*Phase: 06-grouped-card-view-group-detail-panel*
*UI-SPEC created: 2026-05-12*
*Baseline: Phase 3 UI-SPEC (03-UI-SPEC.md) — all base tokens and patterns inherited via Phase 5*
*Next: gsd-ui-checker validates this contract; gsd-planner consumes it for task breakdown*
