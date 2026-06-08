---
phase: 06-grouped-card-view-group-detail-panel
plan: "01"
subsystem: wallecx-frontend
tags: [vue3, primevue, grouping, computed, card-grid, GROUP-04, GROUP-05]
dependency_graph:
  requires:
    - "05-01: vaccine_type field in Vaccinations interface"
    - "05-02: ManageVaccination form field (GROUP-03)"
    - "04-xx: WallecxApp.vue base structure, records ref, listToken pattern"
  provides:
    - "VaccinationGroupCard.vue: single group card component (type name, badge, last date, thumbnail)"
    - "groupedVaccinations computed: Map-based grouping over records ref, alphabetical sort, Uncategorized last"
    - "openGroupPanel handler and showGroupPanel/selectedGroup refs (Drawer wiring ready for Plan 2)"
    - "Responsive 2-column card grid replacing flat DataTable in WallecxApp.vue"
  affects:
    - "06-02: Drawer wiring (VaccinationGroupPanel) builds on showGroupPanel/selectedGroup refs added here"
tech_stack:
  added: []
  patterns:
    - "Map-based grouping computed in WallecxApp.vue (no composable — inline per existing pattern)"
    - "PrimeVue Card + Badge auto-imported via PrimeVueResolver (no manual import)"
    - "thumbUrl pattern copied from VaccinationList.vue with !record.card guard"
    - "localeCompare sensitivity:base for case-insensitive alphabetical sort"
    - "v-if/v-else-if/v-else three-state conditional (loading/empty/data) in template"
key_files:
  created:
    - src/components/projects/wallecx/VaccinationGroupCard.vue
  modified:
    - src/components/projects/wallecx/WallecxApp.vue
decisions:
  - "Deferred VaccinationGroupPanel import to Plan 2 to avoid missing-module type error"
  - "Deferred Drawer template block to Plan 2 (comment placeholder left in WallecxApp.vue)"
  - "Used --color-typo-heading for last-date line (plan spec) rather than --color-typo-body (PATTERNS.md)"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-05-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 06 Plan 01: Grouped Card View — SUMMARY

**One-liner:** VaccinationGroupCard.vue with PrimeVue Card+Badge grid and groupedVaccinations computed property replacing the flat DataTable in WallecxApp.vue, sorted alphabetically with Uncategorized pinned last.

## What Was Built

### Task 1 — VaccinationGroupCard.vue (new)
`src/components/projects/wallecx/VaccinationGroupCard.vue` — presentational group card component:
- Props: `vaccineType: string`, `records: Vaccinations[]`, `latestRecord: Vaccinations`, `listToken: string`
- Emits: `click: []`
- `thumbUrl()` helper: `!record.card` guard + `pb.files.getURL` with `thumb:"100x100"` and `token: props.listToken`
- `displayDate()` helper: `dayjs(iso).format("DD MMM YYYY")`
- Template: PrimeVue `<Card>` (auto-imported), type name `text-lg font-bold` in `--color-brand-primary`, `<Badge>` with singular/plural "N record(s)", last-date `text-sm` in `--color-typo-heading`, `v-if latestRecord.card` img block / `v-else` `mdi:image-off` iconify placeholder
- No `v-html` anywhere; no manual Badge or Card imports

**Commit:** `6e29ebb`

### Task 2 — WallecxApp.vue (modified)
Four changes applied to `src/components/projects/wallecx/WallecxApp.vue`:

1. **Import block:** `computed` added to vue import; `VaccinationGroupCard` imported (VaccinationGroupPanel deferred to Plan 2)
2. **State refs:** `showGroupPanel = ref(false)` and `selectedGroup = ref<VaccineGroup | null>(null)` added after `isExporting`
3. **VaccineGroup interface + groupedVaccinations computed + openGroupPanel handler:**
   - `interface VaccineGroup { vaccineType, records, latestRecord }`
   - `groupedVaccinations` computed: Map iteration over `records.value`, key = `vaccine_type?.trim() || ""`, named groups sorted by `localeCompare` with `sensitivity:"base"`, uncategorized array spread last (`[...named, ...uncategorized]`)
   - `openGroupPanel(group)` sets `selectedGroup.value` and `showGroupPanel.value = true`
4. **Template replacement:** `<VaccinationList>` tag removed; replaced with:
   - `v-if="isLoading"`: 3-card skeleton grid (`grid grid-cols-1 sm:grid-cols-2 gap-4`)
   - `v-else-if="records.length === 0"`: needle-off empty state with "Add your first vaccination" CTA
   - `v-else`: `<VaccinationGroupCard v-for="group in groupedVaccinations">` grid
   - Comment placeholder for Drawer (wired in Plan 2)
- `openDetail` untouched — Drawer stays open when Dialog opens (D-02)
- `VaccinationList.vue` kept on disk, not deleted

**Commit:** `bab7bf9`

## Verification Results

| Check | Result |
|-------|--------|
| `VaccinationGroupCard.vue` exists | PASS |
| `defineProps` with all 4 required props | PASS |
| `defineEmits` with `click: []` | PASS |
| `thumbUrl` with `!record.card` guard and `thumb:"100x100"` | PASS |
| `displayDate` using `dayjs(iso).format("DD MMM YYYY")` | PASS |
| `text-lg font-bold` + `var(--color-brand-primary)` | PASS |
| Badge with singular/plural template literal | PASS |
| `v-if latestRecord.card` img + `v-else` mdi:image-off | PASS |
| No `import { Badge }` or `import { Card }` | PASS |
| No `v-html` | PASS |
| `computed` in vue import | PASS |
| `const showGroupPanel = ref(false)` | PASS |
| `const selectedGroup = ref<VaccineGroup \| null>(null)` | PASS |
| `interface VaccineGroup {` with all 3 fields | PASS |
| `const groupedVaccinations = computed<VaccineGroup[]>(` | PASS |
| `localeCompare(b.vaccineType, undefined, { sensitivity: "base" })` | PASS |
| `return [...named, ...uncategorized]` | PASS |
| `function openGroupPanel(group: VaccineGroup): void` | PASS |
| `grid grid-cols-1 sm:grid-cols-2 gap-4` in template | PASS |
| `VaccinationGroupCard` with all required prop bindings + `@click` | PASS |
| No `<VaccinationList` tag in WallecxApp.vue | PASS |
| `openDetail` does not reference `showGroupPanel` | PASS |
| `npm run type-check` exits 0 | PASS |

## Deviations from Plan

### Auto-deferred: VaccinationGroupPanel import and Drawer block

**Found during:** Task 2 planning

**Situation:** Plan 2 (06-02-PLAN.md) creates `VaccinationGroupPanel.vue`. Importing it here would cause a missing-module type error since the file doesn't yet exist. The plan itself notes: "Alternatively, defer the VaccinationGroupPanel import to Plan 2 — the executor's choice if it avoids a type error."

**Decision:** Deferred `import VaccinationGroupPanel` and the full `<Drawer>` template block to Plan 2. A comment placeholder `<!-- Drawer placeholder — wired in Plan 2 (06-02-PLAN.md) -->` marks the insertion point. The `showGroupPanel` and `selectedGroup` refs are in place; Plan 2 connects them to the Drawer.

**Impact:** Zero — Plan 2 (GROUP-06/07) completes the Drawer wiring. This plan fully delivers GROUP-04 and GROUP-05 as required.

**Files modified:** `src/components/projects/wallecx/WallecxApp.vue`

## Threat Surface Scan

No new threat surface. Phase 6 Plan 1 is a pure read-only frontend display transformation:
- All user data rendered via `{{ }}` mustache — no `v-html` anywhere (T-06-01 mitigated)
- No new PocketBase queries — `records.value` already fetched in `onMounted`
- No new authentication surface, file upload, or data persistence

Existing threat mitigations (BACK-03 per-user rules, WRITE-08 parameterised filters, WRITE-03 EXIF strip, POLISH-05 checklist) remain in force.

## Known Stubs

None. All data flows are wired:
- `groupedVaccinations` computed derives from `records.value` (live ref from PocketBase fetch)
- `VaccinationGroupCard` renders real prop data via mustache interpolation
- The Drawer is intentionally absent in this plan (deferred to Plan 2, documented above)

## Self-Check

**Files exist:**
- `src/components/projects/wallecx/VaccinationGroupCard.vue` — FOUND
- `src/components/projects/wallecx/WallecxApp.vue` (modified) — FOUND

**Commits exist:**
- `6e29ebb` — FOUND (feat(06-01): create VaccinationGroupCard.vue)
- `bab7bf9` — FOUND (feat(06-01): update WallecxApp.vue — grouping computed + card grid)

## Self-Check: PASSED
