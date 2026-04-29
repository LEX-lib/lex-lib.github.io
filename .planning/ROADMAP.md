# Roadmap: LexTrack Optimization

## Overview

Six phases move the LexTrack stand-up tracker from its current state — correct data model intent, several silent bugs, and zero tests — to a fully aligned, durable, and tested implementation. The dependency chain is strict: PocketBase schema must exist before TypeScript types, types before UI. Meeting/Admin UI changes and code-quality cleanup land in Phase 3. The two critical data-correctness bugs (initial load and delete persistence) plus per-item save land together in Phase 4. Day Status and Export are new top-level features delivered in Phase 5. Phase 6 consolidates the full test suite over both new and existing code paths.

## Phases

- [x] **Phase 1: Schema Foundation** - Apply additive PocketBase schema changes and document migration steps
- [x] **Phase 2: Types & Mappers** - Bring TypeScript contracts and mapper functions into alignment with new schema
- [x] **Phase 3: Meeting & Admin UI** - Wire duration unit toggle for meetings, URL field for admin, label rename, and remove dead code (2026-04-29)
- [x] **Phase 4: Core Bug Fixes & Save UX** - Fix initial-load, delete persistence, per-item dialog save, and surface loading/error feedback (2026-04-29)
- [x] **Phase 5: Day Status & Export** - Add whole-day status (SL/VL/Holiday) and day export matching quarter-3-logs.txt format (2026-04-29)
- [ ] **Phase 6: Quality Gate** - Ship Vitest unit and component tests covering all new and existing LexTrack code

## Phase Details

### Phase 1: Schema Foundation
**Goal**: All required PocketBase collection changes exist and are documented so every subsequent phase has a stable data contract to build against
**Depends on**: Nothing (first phase)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04
**Success Criteria** (what must be TRUE):
  1. `dsu_meetings` has a `duration_unit` field accepting `'minutes'` or `'hours'`
  2. `dsu_supports` has an optional `link` field
  3. A `dsu_day_status` collection exists with `date`, `status`, and a unique constraint on `date`
  4. `.planning/pocketbase-schema.md` contains exact PocketBase admin steps (or migration JSON) to apply each change with zero data loss on existing records
**Plans:** 3 plans
Plans:
- [x] 01-01-PLAN.md — Write .planning/pocketbase-schema.md migration runbook
- [x] 01-02-PLAN.md — Write verify-schema.ts smoke test + npm run verify:schema script
- [x] 01-03-PLAN.md — User applies migration manually + runs smoke test (phase gate)

### Phase 2: Types & Mappers
**Goal**: TypeScript interfaces and PocketBase mapper functions fully reflect the new schema so components can import correct types without casting or workarounds
**Depends on**: Phase 1
**Requirements**: TYPES-01, TYPES-02, TYPES-03, TYPES-04
**Success Criteria** (what must be TRUE):
  1. `DsuMeetings` type includes `duration_unit: 'minutes' | 'hours'` and `npm run type-check` passes
  2. `DsuSupports` type includes `link?: string` and `npm run type-check` passes
  3. New `DsuDayStatus` types exist under `src/types/lextrack/dsu_day_status/types.d.ts`
  4. Mapper functions for all three modified/new entities handle read, create, and update operations without omitting the new fields
**Plans:** 6/6 plans executed
Plans:
- [x] 02-01-PLAN.md — Rename dsu_meetings types.d.ts → types.ts, add duration_unit, create constants.ts
- [x] 02-02-PLAN.md — Create new dsu_day_status types.ts and constants.ts (5-value status enum)
- [x] 02-03-PLAN.md — Rename dsu_supports + dsu_tasks types.d.ts → types.ts, add link?: string to supports
- [x] 02-04-PLAN.md — Rewrite meeting/support/task mappers as full triple (mapToCreate/Update/FromRecord)
- [x] 02-05-PLAN.md — Create new dsuDayStatusMapper (mapToCreate + mapFromRecord only; no mapToUpdate per D-11)
- [x] 02-06-PLAN.md — Phase gate: type-check + lint + grep audit of all 4 ROADMAP success criteria

### Phase 3: Meeting & Admin UI
**Goal**: Users can enter meeting durations in hours or minutes, attach URLs to admin entries, and see the correct "Admin" section label — with all dead code removed from the codebase
**Depends on**: Phase 2
**Requirements**: UI-MEET-01, UI-MEET-02, UI-MEET-03, UI-ADMIN-01, UI-ADMIN-02, UI-ADMIN-03, BUG-04, BUG-05
**Success Criteria** (what must be TRUE):
  1. Meeting form shows a number input alongside a min/hr toggle; entering `1 hr` stores `60` minutes and displays back as `1 hr`
  2. Existing meetings that only have `duration_minutes` render correctly with the toggle defaulting to minutes
  3. Admin form includes a URL input; saved admin entries show a clickable link icon in ActivityCard when a link is set
  4. The activity section previously labeled "Admin Tasks and Support" is now labeled "Admin"
  5. `npm run lint` passes with zero warnings; no `console.log` statements remain in `LexTrackView.vue` or any lextrack component; the commented-out Dialog block is gone
**Plans:** 6 plans
Plans:
- [x] 03-01-PLAN.md — Create useDurationField composable (min↔hr conversion + reactive state)
- [x] 03-02-PLAN.md — ActivityCard link icon + inline-add defaults; register vTooltip directive
- [x] 03-03-PLAN.md — ManageSupport URL input + strip dark Tailwind overrides
- [x] 03-04-PLAN.md — LexTrackView "Admin" label + remove console.logs + remove commented Dialog block
- [x] 03-05-PLAN.md — ManageMeeting duration toggle integration + strip dark overrides (Wave 2)
- [x] 03-06-PLAN.md — Phase gate: type-check, lint, grep audit, dev-server smoke
**UI hint**: yes

### Phase 4: Core Bug Fixes & Save UX
**Goal**: The page loads data immediately on mount, deletes actually remove records from PocketBase, the per-item dialog Save button persists to the backend, and users see clear feedback during every async operation
**Depends on**: Phase 3
**Requirements**: BUG-01, BUG-02, BUG-03, UI-SAVE-01, UI-SAVE-02, UI-SAVE-03
**Success Criteria** (what must be TRUE):
  1. Opening LexTrack shows today's items immediately without requiring the user to touch the date picker
  2. Clicking the trash icon on a PocketBase-persisted item removes it from the backend; a page reload confirms it is gone
  3. Clicking Save inside a Manage* dialog persists that single item to PocketBase and closes the dialog on success
  4. A failed save, fetch, or delete surfaces an error toast via `vue-sonner`; the UI does not silently discard the failure
  5. The Save button (page-level and dialog-level) is visibly disabled with a loading indicator during any in-flight async call
**Plans:** 5 plans
Plans:
- [x] 04-01-PLAN.md — ManageMeeting refactor (emit save + :saving prop)
- [x] 04-02-PLAN.md — ManageTask refactor (emit save + :saving prop)
- [x] 04-03-PLAN.md — ManageSupport refactor (emit save + :saving prop + drop self-close)
- [x] 04-04-PLAN.md — LexTrackView PB wiring (loadForDate, optimistic delete, saveItem, dialog handlers, batch save, dim wrapper)
- [x] 04-05-PLAN.md — Phase gate (type-check + lint + 6-req grep audit + 10-verification human smoke)
**UI hint**: yes

### Phase 5: Day Status & Export
**Goal**: Users can mark a whole day as Sick Leave, Vacation Leave, or Holiday and export any day's activity to text matching their existing quarter-3-logs.txt format
**Depends on**: Phase 4
**Requirements**: UI-DAY-01, UI-DAY-02, UI-DAY-03, EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. A "Mark day as…" control on LexTrackView lets the user select SL, VL, or Holiday (or clear the status) for the currently selected date
  2. When a day status is set, the three activity sections are replaced by a status banner; clearing the status restores them with any pre-existing items intact
  3. An "Export day" button produces text that matches the format of `quarter-3-logs.txt`, including a single-line representation for SL/VL/Holiday days
  4. Clicking the export action copies the text to the clipboard and a toast confirms the copy succeeded
**Plans:** 3 plans
Plans:
**Wave 1**
- [x] 05-01-PLAN.md — LexTrackView script wiring: dayStatus ref, DAY_STATUS_OPTIONS, extend loadForDate, setDayStatus, selectedStatus, statusFullName, stripHtml, buildExportString, exportDay
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 05-02-PLAN.md — LexTrackView template wiring: restructure top row (SelectButton + Export Day button), v-if on activity grid, v-else status banner
**Wave 3** *(blocked on Wave 2 completion)*
- [x] 05-03-PLAN.md — Phase gate: type-check + lint + build + grep audit + human smoke test (5 scenarios)
**UI hint**: yes

### Phase 6: Quality Gate
**Goal**: A Vitest test suite exists that covers all new code paths and the most critical existing LexTrack behaviors, and CI-friendly test scripts are in place
**Depends on**: Phase 5
**Requirements**: QA-01, QA-02, QA-03, QA-04
**Success Criteria** (what must be TRUE):
  1. `npm run test:unit` executes in non-watch mode and all tests pass
  2. Mapper functions, the duration unit converter, day-status logic, and the exporter each have unit tests
  3. `LexTrackView.vue` component tests cover initial load, date change, save, delete, and day status interactions; `ActivityCard.vue` tests cover add-via-Enter, edit, and remove
  4. `npm run lint` and `npm run type-check` both pass cleanly after all test files are added
**Plans:** 7 plans
Plans:
**Wave 1** *(parallel)*
- [x] 06-01-PLAN.md — Tooling setup: fix test:unit script to vitest run, install @pinia/testing, create PB __mocks__
- [x] 06-02-PLAN.md — Extract buildExportString + stripHtml to src/utils/lextrack/export.ts
**Wave 2** *(blocked on Wave 1 — parallel with each other)*
- [x] 06-03-PLAN.md — Unit tests: all 4 mappers + useDurationField composable + day-status constants
- [x] 06-04-PLAN.md — Unit tests: export utils (buildExportString, stripHtml) + ActivityCard component tests
**Wave 3** *(blocked on Wave 2 — parallel with each other)*
- [ ] 06-05-PLAN.md — Component tests: ManageMeeting, ManageTask, ManageSupport (save emit)
- [ ] 06-06-PLAN.md — Component tests: LexTrackView (initial load, delete, day status)
**Wave 4** *(blocked on Wave 3)*
- [ ] 06-07-PLAN.md — Phase gate: npm run test:unit + lint + type-check all pass + human verify

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Foundation | 3/3 | Complete | 2026-04-28 |
| 2. Types & Mappers | 6/6 | Complete | 2026-04-28 |
| 3. Meeting & Admin UI | 6/6 | Complete | 2026-04-29 |
| 4. Core Bug Fixes & Save UX | 5/5 | Complete | 2026-04-29 |
| 5. Day Status & Export | 3/3 | Complete | 2026-04-29 |
| 6. Quality Gate | 0/7 | Not started | - |
