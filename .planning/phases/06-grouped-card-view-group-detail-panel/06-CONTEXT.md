# Phase 6: Grouped Card View & Group Detail Panel - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the flat `VaccinationList.vue` DataTable with a grouped card view — one PrimeVue Card per `vaccine_type` — and a PrimeVue Drawer that opens when a user clicks a group card, listing all records in that group. Each record row in the Drawer opens the existing `VaccinationDetail.vue` Dialog (unchanged).

**In scope:** GROUP-04 (group cards), GROUP-05 (Uncategorized card), GROUP-06 (Drawer panel with record list), GROUP-07 (opens existing VaccinationDetail dialog).
**Out of scope:** Any changes to `VaccinationDetail.vue`, `ManageVaccination.vue`, `vaccinationMapper.ts`, the create/edit flow, the delete flow, the JSON export, or PocketBase schema.

</domain>

<decisions>
## Implementation Decisions

### Panel Implementation
- **D-01:** Group detail panel uses a **PrimeVue Drawer** (slides in from the right). No existing Drawer pattern in Wallecx — this is a new component for the mini-app.
- **D-02:** When the user clicks a record row inside the Drawer, the existing `VaccinationDetail.vue` Dialog opens **on top of the Drawer** — the Drawer stays visible behind the Dialog. No auto-close of the Drawer when the Dialog opens. User closes the Dialog and is immediately back in the group panel.

### Card Grid Layout
- **D-03:** Group cards use a **responsive grid — 2 columns on desktop, 1 column on mobile**. Tailwind classes: `grid grid-cols-1 sm:grid-cols-2 gap-4`.
- **D-04:** The most visually prominent element on each group card is the **vaccine type name (large/bold) with a badge showing the record count** (e.g., "3 records"). Last administered date and thumbnail of the most recent card scan are secondary info below the type name.

### Group Card Ordering + Uncategorized Placement
- **D-05:** Group cards are sorted **alphabetically by vaccine type name** (case-insensitive).
- **D-06:** The **"Uncategorized" group card is always pinned last** — after all alphabetically sorted named groups. Records with `vaccine_type === ""` belong to this group.

### Claude's Discretion
- Where the grouping computation lives: `WallecxApp.vue` computed property vs. extracted composable. Either is fine — keep it simple.
- Whether `VaccinationList.vue` is repurposed as the Drawer's record list, or a new `VaccinationGroupPanel.vue` component is created. The DataTable column set for the Drawer list differs from the old flat list (GROUP-06 specifies: vaccine name, date administered, dose number, lot number — 4 columns, no thumbnail, no action buttons except "View Record").
- Whether the group card is its own `VaccinationGroupCard.vue` component or rendered inline in `WallecxApp.vue`. Either acceptable if clean.
- Drawer width and any responsive breakpoints for the Drawer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 6 — Goal, requirements (GROUP-04, GROUP-05, GROUP-06, GROUP-07), success criteria

### Files to Modify
- `src/components/projects/wallecx/WallecxApp.vue` — Replace `<VaccinationList>` usage with group cards grid; add `<Drawer>` component; manage `selectedGroup` state and `showGroupPanel` ref; wire `openGroupPanel(group)` and `openDetail(record)` from Drawer rows
- `src/components/projects/wallecx/VaccinationList.vue` — Either repurposed for the Drawer's record list (with adjusted columns) or replaced by a new component — Claude's decision

### Files to Create (likely)
- `src/components/projects/wallecx/VaccinationGroupCard.vue` (or inline in WallecxApp) — Single group card: type name (large), record count badge, last administered date, thumbnail of most recent card scan if present
- `src/components/projects/wallecx/VaccinationGroupPanel.vue` (or inline) — Drawer content: DataTable of records in the selected group with columns: vaccine name, date administered, dose number, lot number; each row has a "View Record" button that emits to open VaccinationDetail

### Files Untouched
- `src/components/projects/wallecx/VaccinationDetail.vue` — No changes (GROUP-07)
- `src/components/projects/wallecx/ManageVaccination.vue` — No changes
- `src/lib/pocketbase/vaccinationMapper.ts` — No changes
- `src/types/wallecx/vaccinations/types.d.ts` — No changes (vaccine_type already added in Phase 5)

### Analogs and Patterns
- `src/components/projects/wallecx/WallecxApp.vue` — Existing orchestrator pattern: refs, computed, event handlers, Dialog wiring; Drawer follows the same approach
- `src/components/projects/wallecx/VaccinationList.vue` — DataTable + skeleton pattern to reference for the Drawer's record list
- `.planning/phases/03-write-path/03-CONTEXT.md` — Confirm dialog, isSaving guard (not needed here but referenced for PrimeVue pattern consistency)
- `.planning/phases/04-discovery-polish/04-CONTEXT.md` — Design token constraints (no new tokens, navy/amber only)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WallecxApp.vue` — `records` ref (already fetched as `Vaccinations[]`, sorted `-date_administered`) is the source data. Group computation can be a `computed` over this ref — no new PocketBase queries needed for the grouped view.
- `VaccinationList.vue` — DataTable + Skeleton + empty-state pattern. The Drawer panel list follows the same DataTable pattern but with different columns (name, date, dose, lot + "View Record" button).
- `VaccinationDetail.vue` — Already wired in `WallecxApp.vue` as a Dialog; opening it from the Drawer is additive (same `openDetail(record)` function + same `showDetail`/`fileToken` refs).
- `thumbUrl()` utility in `VaccinationList.vue` — Can be reused for the latest card thumbnail on group cards.

### Established Patterns
- **State management:** All Wallecx state lives in `WallecxApp.vue` (refs). New state: `selectedGroup` (the active group's records), `showGroupPanel` (Drawer visibility).
- **PrimeVue auto-import:** `Drawer` is auto-imported via `unplugin-vue-components` + `PrimeVueResolver` — no manual import needed.
- **Design tokens:** `var(--color-brand-primary)` (navy), `var(--color-brand-accent)` (amber), `var(--color-typo-heading)`, `var(--color-typo-body)` — same as all other Wallecx components. No new tokens.
- **Empty state:** If user has zero records at all, the grouped view shows the same empty-state message/CTA as the current `VaccinationList.vue` (needle-off icon + "No vaccination records yet." + "Add your first vaccination" CTA).

### Integration Points
- Grouping logic: `computed(() => groupByVaccineType(records.value))` — produces `Array<{ vaccineType: string; records: Vaccinations[] }>` sorted alphabetically with "Uncategorized" pinned last.
- Drawer state: `selectedGroup` ref holds the clicked group's records array; `showGroupPanel` controls Drawer visibility.
- VaccinationDetail Dialog: `openDetail(record)` already exists — just call it from the Drawer's "View Record" row button. Drawer stays open (D-02).

</code_context>

<specifics>
## Specific Ideas

- Group card content (from large to small):
  1. Vaccine type name — `text-lg font-bold`, navy (`var(--color-brand-primary)`)
  2. Record count badge — e.g., PrimeVue `<Badge :value="group.records.length + ' records'" severity="secondary" />`
  3. Last administered: `text-sm` — `"Last: DD MMM YYYY"`
  4. Thumbnail: if the most recent record has `card`, show `<img>` with `thumb=100x100`; else show `mdi:image-off` placeholder icon
- Drawer header text: the selected group's `vaccineType` name (e.g., "COVID-19" or "Uncategorized")
- Drawer record list columns: Vaccine Name | Date Administered | Dose | Lot Number | (View Record button)
- "Uncategorized" display name: the string `"Uncategorized"` (capital U, displayed exactly this way to the user)
- Grouping sentinel: records where `vaccine_type === ""` or `vaccine_type` is falsy map to the "Uncategorized" group

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-grouped-card-view-group-detail-panel*
*Context gathered: 2026-05-12*
