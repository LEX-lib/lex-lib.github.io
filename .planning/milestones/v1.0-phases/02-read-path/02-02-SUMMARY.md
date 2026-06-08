---
phase: 02-read-path
plan: "02"
subsystem: ui
tags: [vue3, primevue, datatable, skeleton, pocketbase, dayjs, iconify]

# Dependency graph
requires:
  - phase: 01-backend-frontend-foundation
    provides: Vaccinations type (src/types/wallecx/vaccinations/types.d.ts), pb singleton (src/lib/pocketbase/index.ts), WallecxApp.vue shell

provides:
  - VaccinationList.vue — three-state DataTable component (skeleton/empty/data) with view/edit/remove emits
  - List thumbnail rendering via pb.files.getURL with listToken and 100x100 thumb
  - Skeleton loading state preventing empty-state flash (3 rows, 5 columns)
  - Empty state with mdi:needle-off icon and "No vaccination records yet." copy
  - Disabled Edit/Remove buttons pre-wired for Phase 3 write path

affects:
  - 02-04 (WallecxApp.vue wiring — consumes VaccinationList with :records, :is-loading, :list-token, @view/@edit/@remove)
  - 02-03 (VaccinationDetail.vue — sibling component opened via view emit)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PrimeVue DataTable skeleton pattern — fake skeletonRows array (length 3) with Skeleton in every #body slot
    - Three-state v-if/v-else-if/v-else template branching (isLoading / empty / data)
    - pb.files.getURL with { thumb, token } options for authenticated thumbnail URLs
    - iconify-icon web component for mdi:* icons (no import required)
    - defineEmits with typed tuple notation [record: Vaccinations] for row actions

key-files:
  created:
    - src/components/projects/wallecx/VaccinationList.vue
  modified: []

key-decisions:
  - "skeletonRows uses Array.from({ length: 3 }, (_, i) => ({ id: String(i) })) — dummy objects with id field satisfy DataTable's key requirement and ensure 3 visible rows"
  - "thumbUrl() called only inside v-if=data.card guard — prevents pb.files.getURL from receiving empty filename on records without attachment (T-02-02-03)"
  - "Edit and Remove buttons carry :disabled=true in Phase 2 — emitter hooks pre-wired for Phase 3 without exposing write actions prematurely (T-02-02-04)"
  - "listToken passed as prop from WallecxApp.vue — aligns with Open Question #1 resolution: separate list token generated alongside getFullList for thumbnail auth"

patterns-established:
  - "VaccinationList skeleton pattern: Array.from fake rows + Skeleton in #body slots — use for any DataTable with async data in Wallecx"
  - "Three-state component template: v-if=isLoading / v-else-if=records.length===0 / v-else — canonical Wallecx loading pattern"

requirements-completed:
  - READ-01
  - READ-04
  - READ-05

# Metrics
duration: 2min
completed: "2026-05-11"
---

# Phase 2 Plan 02: VaccinationList.vue Summary

**PrimeVue DataTable list component with three states — skeleton loading (3 rows, 5 columns), needle-off empty state, and striped data rows with 100x100 thumbnails, authenticated via listToken**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-11T03:12:25Z
- **Completed:** 2026-05-11T03:13:43Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `VaccinationList.vue` with all three DataTable states exactly as specified in the plan and UI-SPEC
- Loading state: `skeletonRows` array of length 3 feeds DataTable with Skeleton in every column slot — prevents layout flash and communicates data is incoming
- Empty state: centered `mdi:needle-off` icon (48x48, brand-primary color) with exact copy "No vaccination records yet." — no CTA (Phase 2 is read-only)
- Data state: `striped-rows` DataTable with thumbnail column (48x48 img or mdi:image-off placeholder), vaccine name, formatted date (DD MMM YYYY via dayjs), dose number (with `?? "—"` fallback), and action buttons
- Security: zero `v-html` usage; `v-if="data.card"` guards thumbnail URL construction; Edit/Remove disabled; listToken always included in thumbnail URL

## Task Commits

1. **Task 1: Create VaccinationList.vue — three-state DataTable component** - `ed410a7` (feat)

**Plan metadata:** (committed after SUMMARY)

## Files Created/Modified

- `src/components/projects/wallecx/VaccinationList.vue` — Three-state DataTable: skeleton loading / empty state / data rows with thumbnails; emits view/edit/remove; accepts records, isLoading, listToken props

## Decisions Made

None beyond what was pre-decided in the plan. Followed plan and UI-SPEC exactly as written — column widths, skeleton config, empty-state copy, button labels, disabled states, and icon names all matched spec.

## Deviations from Plan

None — plan executed exactly as written.

The plan's action block, UI-SPEC, and threat model were fully consistent. All acceptance criteria verified before commit:
- `striped-rows` on data-state DataTable
- `skeletonRows` with `Array.from({ length: 3 }, ...)` — 3 dummy objects
- `mdi:needle-off` in empty state
- "No vaccination records yet." exact copy
- "View Record" button label (not "View")
- `:disabled="true"` on both Edit and Remove (2 hits)
- Zero `v-html` occurrences
- No manual PrimeVue component imports
- `npm run type-check` exits 0

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `VaccinationList.vue` is ready to be consumed by `WallecxApp.vue` (Plan 02-04)
- Props interface: `{ records: Vaccinations[], isLoading: boolean, listToken: string }`
- Emits: `view: [record: Vaccinations]`, `edit: [record: Vaccinations]`, `remove: [record: Vaccinations]`
- `WallecxApp.vue` wiring (02-04) must: generate `listToken` via `pb.files.getToken()` alongside `getFullList` in `onMounted`; pass `:list-token="listToken"`; bind `@view="openDetail"` and stub `@edit/@remove`

## Self-Check: PASSED

- `src/components/projects/wallecx/VaccinationList.vue` — FOUND
- `.planning/phases/02-read-path/02-02-SUMMARY.md` — FOUND
- Commit `ed410a7` — FOUND

---
*Phase: 02-read-path*
*Completed: 2026-05-11*
