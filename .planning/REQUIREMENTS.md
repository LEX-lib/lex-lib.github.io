# Requirements: LexTrack Optimization

**Defined:** 2026-04-28
**Core Value:** Capturing a day's stand-up activity must be fast, complete, and durable.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Schema (PocketBase)

- [ ] **SCHEMA-01**: `dsu_meetings` collection has a `duration_unit` field (`'minutes' | 'hours'`) so the form can accept duration in either unit while persisting minutes
- [ ] **SCHEMA-02**: `dsu_supports` collection has an optional `link?: string` field for Admin URLs (service desk tickets, MHD, etc.)
- [ ] **SCHEMA-03**: New `dsu_day_status` collection exists with `{date: string, status: 'sl' | 'vl' | 'holiday'}` and a unique constraint on `date`
- [ ] **SCHEMA-04**: All schema changes are documented in `.planning/pocketbase-schema.md` with the exact PocketBase admin steps (or migration JSON) needed to apply them

### Types & Mappers

- [ ] **TYPES-01**: TypeScript types in `src/types/lextrack/dsu_meetings/types.d.ts` reflect the new `duration_unit` field (and helpers if needed)
- [ ] **TYPES-02**: TypeScript types in `src/types/lextrack/dsu_supports/types.d.ts` include the new optional `link` field
- [ ] **TYPES-03**: New types under `src/types/lextrack/dsu_day_status/types.d.ts` for the day-status collection
- [ ] **TYPES-04**: PocketBase mappers in `src/lib/pocketbase/` cover the new fields and the new collection (read + update + create)

### UI: Meetings

- [ ] **UI-MEET-01**: Meeting form (`ManageMeeting.vue` and inline add) lets the user enter duration as a number plus a min/hr toggle
- [ ] **UI-MEET-02**: When the unit is hours, the value is converted to minutes for storage (and back for display)
- [ ] **UI-MEET-03**: Existing meetings (with only `duration_minutes` set) render correctly with the toggle defaulting to minutes

### UI: Admin

- [ ] **UI-ADMIN-01**: Admin/Support form (`ManageSupport.vue` and inline add) has a URL input for the optional `link`
- [ ] **UI-ADMIN-02**: Admin entries in `ActivityCard` show a small link icon when a `link` is set (clickable, opens in new tab)
- [ ] **UI-ADMIN-03**: The "Admin Tasks and Support" label is shortened to "Admin" to match the requirements doc terminology

### UI: Day Status

- [ ] **UI-DAY-01**: A "Mark day as…" control on `LexTrackView.vue` lets the user set the day's status to SL / VL / Holiday (or clear it)
- [ ] **UI-DAY-02**: When a day status is set, the three activity sections are hidden and a status banner is shown instead
- [ ] **UI-DAY-03**: Clearing the day status restores the activity sections (with any pre-existing items intact)

### UI: Per-item Save

- [ ] **UI-SAVE-01**: The Save button inside each Manage* dialog persists that single item to PocketBase (create or update) and closes the dialog on success
- [ ] **UI-SAVE-02**: The page-level Save button still works for batch save of all unsaved local items
- [ ] **UI-SAVE-03**: The save indicator (loading spinner / disabled button) is visible during the save call

### UI: Export

- [ ] **EXPORT-01**: An "Export day" button on `LexTrackView.vue` produces text matching the format of `quarter-3-logs.txt`
- [ ] **EXPORT-02**: The exporter handles SL / VL / Holiday days correctly (single line, no sections)
- [ ] **EXPORT-03**: The exported text can be copied to clipboard (toast confirms)

### Bug Fixes

- [ ] **BUG-01**: On page mount, the items for `selectedDate` are fetched from PocketBase (currently only happens on date change)
- [ ] **BUG-02**: Removing an item via the trash icon calls `pb.collection(...).delete(id)` for items that exist in PocketBase; local-only items are dropped without an API call
- [ ] **BUG-03**: A failed save / fetch / delete surfaces an error toast via `vue-sonner`; UI rolls back optimistic mutations
- [ ] **BUG-04**: All `console.log` statements in `src/views/LexTrackView.vue` and `src/components/projects/lextrack/*` are removed
- [ ] **BUG-05**: The large commented-out Dialog block at the bottom of `LexTrackView.vue`'s template is removed

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

Filled in during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | TBD | Pending |
| SCHEMA-02 | TBD | Pending |
| SCHEMA-03 | TBD | Pending |
| SCHEMA-04 | TBD | Pending |
| TYPES-01 | TBD | Pending |
| TYPES-02 | TBD | Pending |
| TYPES-03 | TBD | Pending |
| TYPES-04 | TBD | Pending |
| UI-MEET-01 | TBD | Pending |
| UI-MEET-02 | TBD | Pending |
| UI-MEET-03 | TBD | Pending |
| UI-ADMIN-01 | TBD | Pending |
| UI-ADMIN-02 | TBD | Pending |
| UI-ADMIN-03 | TBD | Pending |
| UI-DAY-01 | TBD | Pending |
| UI-DAY-02 | TBD | Pending |
| UI-DAY-03 | TBD | Pending |
| UI-SAVE-01 | TBD | Pending |
| UI-SAVE-02 | TBD | Pending |
| UI-SAVE-03 | TBD | Pending |
| EXPORT-01 | TBD | Pending |
| EXPORT-02 | TBD | Pending |
| EXPORT-03 | TBD | Pending |
| BUG-01 | TBD | Pending |
| BUG-02 | TBD | Pending |
| BUG-03 | TBD | Pending |
| BUG-04 | TBD | Pending |
| BUG-05 | TBD | Pending |
| QA-01 | TBD | Pending |
| QA-02 | TBD | Pending |
| QA-03 | TBD | Pending |
| QA-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 0 (filled by roadmap)
- Unmapped: 31 ⚠️ (will resolve in roadmap phase)

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 after initial definition*
