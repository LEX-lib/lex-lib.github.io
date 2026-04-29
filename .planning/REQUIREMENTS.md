# Requirements: LexTrack Optimization

**Defined:** 2026-04-28
**Core Value:** Capturing a day's stand-up activity must be fast, complete, and durable.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Schema (PocketBase)

- [x] **SCHEMA-01**: `dsu_meetings` collection has a `duration_unit` field (`'minutes' | 'hours'`) so the form can accept duration in either unit while persisting minutes
- [x] **SCHEMA-02**: `dsu_supports` collection has an optional `link?: string` field for Admin URLs (service desk tickets, MHD, etc.)
- [x] **SCHEMA-03**: New `dsu_day_status` collection exists with `{date: string, status: 'sl' | 'vl' | 'holiday'}` and a unique constraint on `date`
- [x] **SCHEMA-04**: All schema changes are documented in `.planning/pocketbase-schema.md` with the exact PocketBase admin steps (or migration JSON) needed to apply them

### Types & Mappers

- [x] **TYPES-01**: TypeScript types in `src/types/lextrack/dsu_meetings/types.d.ts` reflect the new `duration_unit` field (and helpers if needed)
- [x] **TYPES-02**: TypeScript types in `src/types/lextrack/dsu_supports/types.d.ts` include the new optional `link` field
- [x] **TYPES-03**: New types under `src/types/lextrack/dsu_day_status/types.d.ts` for the day-status collection
- [x] **TYPES-04**: PocketBase mappers in `src/lib/pocketbase/` cover the new fields and the new collection (read + update + create)

### UI: Meetings

- [x] **UI-MEET-01**: Meeting form (`ManageMeeting.vue` and inline add) lets the user enter duration as a number plus a min/hr toggle
- [x] **UI-MEET-02**: When the unit is hours, the value is converted to minutes for storage (and back for display)
- [x] **UI-MEET-03**: Existing meetings (with only `duration_minutes` set) render correctly with the toggle defaulting to minutes

### UI: Admin

- [x] **UI-ADMIN-01**: Admin/Support form (`ManageSupport.vue` and inline add) has a URL input for the optional `link`
- [x] **UI-ADMIN-02**: Admin entries in `ActivityCard` show a small link icon when a `link` is set (clickable, opens in new tab)
- [x] **UI-ADMIN-03**: The "Admin Tasks and Support" label is shortened to "Admin" to match the requirements doc terminology

### UI: Day Status

- [ ] **UI-DAY-01**: A "Mark day as…" control on `LexTrackView.vue` lets the user set the day's status to SL / VL / Holiday (or clear it)
- [ ] **UI-DAY-02**: When a day status is set, the three activity sections are hidden and a status banner is shown instead
- [ ] **UI-DAY-03**: Clearing the day status restores the activity sections (with any pre-existing items intact)

### UI: Per-item Save

- [x] **UI-SAVE-01**: The Save button inside each Manage* dialog persists that single item to PocketBase (create or update) and closes the dialog on success
- [x] **UI-SAVE-02**: The page-level Save button still works for batch save of all unsaved local items
- [x] **UI-SAVE-03**: The save indicator (loading spinner / disabled button) is visible during the save call

### UI: Export

- [ ] **EXPORT-01**: An "Export day" button on `LexTrackView.vue` produces text matching the format of `quarter-3-logs.txt`
- [ ] **EXPORT-02**: The exporter handles SL / VL / Holiday days correctly (single line, no sections)
- [ ] **EXPORT-03**: The exported text can be copied to clipboard (toast confirms)

### Bug Fixes

- [x] **BUG-01**: On page mount, the items for `selectedDate` are fetched from PocketBase (currently only happens on date change)
- [x] **BUG-02**: Removing an item via the trash icon calls `pb.collection(...).delete(id)` for items that exist in PocketBase; local-only items are dropped without an API call
- [x] **BUG-03**: A failed save / fetch / delete surfaces an error toast via `vue-sonner`; UI rolls back optimistic mutations
- [x] **BUG-04**: All `console.log` statements in `src/views/LexTrackView.vue` and `src/components/projects/lextrack/*` are removed
- [x] **BUG-05**: The large commented-out Dialog block at the bottom of `LexTrackView.vue`'s template is removed

### Quality

- [ ] **QA-01**: Vitest unit tests cover the new mappers, the duration unit converter, the day-status logic, and the exporter
- [ ] **QA-02**: Vitest component tests cover `LexTrackView.vue` (initial load, date change, save, delete, day status), `ActivityCard.vue` (add via Enter, edit, remove), and the three Manage* dialogs (per-item save)
- [ ] **QA-03**: `npm run lint` and `npm run type-check` pass cleanly
- [ ] **QA-04**: `npm run test:unit` runs in CI-friendly fashion (no watch mode by default in scripts; or a documented `test:unit:run` variant)

## v2 Requirements

Tracked but deferred.

### Workflow

- **CARRY-01**: Autocomplete a Jira ID from prior days when typing in the Task title field
- **CARRY-02**: "Duplicate from yesterday" button to copy yesterday's task list as a starting point
- **CARRY-03**: Multi-link tasks (`links: string[]`) if the description-based workaround proves insufficient
- **CARRY-04**: Quarterly summary generator (the section at the bottom of `quarter-3-logs.txt`)

### UX Polish

- **POLISH-01**: Markdown-friendly paste for description fields (auto-convert pasted bullet lists)
- **POLISH-02**: Mobile-first layout for the three-column activity grid
- **POLISH-03**: Half-day / partial-day status types
- **POLISH-04**: Drag-to-reorder items within a section

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-link tasks for v1 | User confirmed `jira_link` stays single; extras go in description |
| Real-time multi-user collaboration | LexTrack is single-user by design |
| Mobile-app build | Static SPA on GitHub Pages; web-only |
| Auth provider swap (OAuth, magic link) | Existing PocketBase email/password is sufficient |
| Schema renames or destructive migrations | Backwards compat constraint — additive changes only |
| Carry-over / autocomplete | Deferred to v2 (high UX effort, not blocking core value) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 1 | Complete (01-03) |
| SCHEMA-02 | Phase 1 | Complete (01-03) |
| SCHEMA-03 | Phase 1 | Complete (01-03) |
| SCHEMA-04 | Phase 1 | Complete (01-01) |
| TYPES-01 | Phase 2 | Complete |
| TYPES-02 | Phase 2 | Complete (02-03) |
| TYPES-03 | Phase 2 | Complete (02-02) |
| TYPES-04 | Phase 2 | Complete (02-04, 02-05) |
| UI-MEET-01 | Phase 3 | Complete (03-05) |
| UI-MEET-02 | Phase 3 | Complete (03-05) |
| UI-MEET-03 | Phase 3 | Complete (03-02, reaffirmed by 03-05 round-trip) |
| UI-ADMIN-01 | Phase 3 | Complete (03-03) |
| UI-ADMIN-02 | Phase 3 | Complete (03-02) |
| UI-ADMIN-03 | Phase 3 | Complete (03-04) |
| BUG-04 | Phase 3 | Complete (03-04) |
| BUG-05 | Phase 3 | Complete (03-04) |
| BUG-01 | Phase 4 | Complete (04-04) |
| BUG-02 | Phase 4 | Complete (04-04) |
| BUG-03 | Phase 4 | Complete (04-04) |
| UI-SAVE-01 | Phase 4 | Complete (04-01, 04-02, 04-03, 04-04) |
| UI-SAVE-02 | Phase 4 | Complete (04-04) |
| UI-SAVE-03 | Phase 4 | Complete (04-01, 04-02, 04-03, 04-04) |
| UI-DAY-01 | Phase 5 | Partial — script (05-01); template (05-02) |
| UI-DAY-02 | Phase 5 | Partial — script (05-01); template (05-02) |
| UI-DAY-03 | Phase 5 | Partial — script (05-01); template (05-02) |
| EXPORT-01 | Phase 5 | Partial — script (05-01); template (05-02) |
| EXPORT-02 | Phase 5 | Partial — script (05-01); template (05-02) |
| EXPORT-03 | Phase 5 | Partial — script (05-01); template (05-02) |
| QA-01 | Phase 6 | Pending |
| QA-02 | Phase 6 | Pending |
| QA-03 | Phase 6 | Pending |
| QA-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-29 after Phase 4 gate PASS*
