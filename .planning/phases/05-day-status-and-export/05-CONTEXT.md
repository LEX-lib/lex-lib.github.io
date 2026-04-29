# Phase 5: Day Status & Export - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Two new user-facing capabilities layered onto `LexTrackView.vue`:

1. **Day Status** — A SelectButton control lets the user mark the current date as Sick Leave / Vacation Leave / Holiday / Birthday Leave / Others. Setting a status hides the three activity sections and shows a simple centred banner. Clearing the status (click the active option) restores the sections.

2. **Export Day** — An "Export" button (top-right, same row as Save) produces plain-text in the exact format of the user's daily stand-up logs (see `dsu-format.md`). The text is copied to clipboard and a toast confirms.

Out of scope:
- New schema fields or collections beyond `dsu_day_status` (already created in Phase 1)
- Per-item editing inside a status-banner day (sections are hidden, not deleted)
- Multi-day or range export
- Download to file — clipboard copy is sufficient for v1

</domain>

<decisions>
## Implementation Decisions

### Day Status Control (UI-DAY-01)

- **D-01 (Placement):** The SelectButton sits in the same top row as the date picker and Save button. Day status is date-scoped so it belongs adjacent to the date picker.
- **D-02 (Component):** PrimeVue `SelectButton` — same component used for the min/hr toggle in `ManageMeeting.vue`. Options: `SL | VL | Holiday | BL | Others`. Each option maps to its full-name label and its PB value (e.g. label `"SL"` → value `"sl"`).
- **D-03 (Immediate save):** Selecting a status immediately calls `pb.collection('dsu_day_status').create(...)` or `.update(existingId, ...)` (upsert semantics — fetch by date first, then create or update). No separate Save button click required. Clearing calls `.delete(id)` on the existing record.
- **D-04 (Clear UX):** `:allowEmpty="true"` on the SelectButton — clicking the active option deselects it and triggers the delete. Consistent with the ManageMeeting min/hr toggle (`:allow-empty="false"` there, but the visual pattern is the same component).
- **D-05 (All 5 values):** Expose all five PB status values: `sl`, `vl`, `holiday`, `bl`, `others`. Display labels: `SL`, `VL`, `Holiday`, `BL`, `Others`.

### Status Banner (UI-DAY-02, UI-DAY-03)

- **D-06 (Simple centred banner):** When a status is set, the three activity `ActivityCard` columns are replaced with a single centred text message in the same grid area. Format: `{Full Status Name} — {YYYY-MM-DD}` (e.g. `Sick Leave — 2026-04-29`). Full status names: Sick Leave, Vacation Leave, Holiday, Birthday Leave, Others.
- **D-07 (v-if toggle):** Use `v-if` / `v-else` in the template: if `dayStatus` is set, show banner; else show the three `ActivityCard` columns. Pre-existing items in the arrays are preserved in local state when status is set — restoring the status (UI-DAY-03) renders those items again without refetching.
- **D-08 (Status fetch on date change):** `loadForDate` (Phase 4) is extended to also fetch the day status for the selected date from `dsu_day_status` using the same date filter. Status is stored in a `dayStatus` ref (`null` = no status).

### Export Format (EXPORT-01, EXPORT-02, EXPORT-03)

- **D-09 (Canonical source):** Export format is defined in `dsu-format.md` at the repo root. Downstream agents MUST read it before implementing the exporter.
- **D-10 (Date format):** `[MM/DD/YYYY]` — brackets included; `dayjs(selectedDate).format('[MM/DD/YYYY]')` produces this.
- **D-11 (Normal day structure):**
  ```
  [MM/DD/YYYY]
  Meetings:
  - {Title} ({duration} mins)

  Tasks:
  {jira_link} - {Title}        ← when jira_link is set
  * {description line 1}
  * {description line 2}

  - {Title}                    ← when no jira_link
  * {description line}

  Admin:
  - {link} - {Title}           ← when link is set
  - {Title}                    ← when no link
  * {description line}
  ```
- **D-12 (SL/VL/holiday day):** Date header + full status name only, no sections:
  ```
  [MM/DD/YYYY]
  Sick Leave
  ```
  Full names: Sick Leave, Vacation Leave, Holiday, Birthday Leave, Others.
- **D-13 (Duration format):** Always display stored minutes: `(15 mins)`, `(60 mins)`. No conversion to hours. Omit the duration part entirely if `duration_minutes` is null/undefined.
- **D-14 (Description → `*` bullets):** Strip Quill HTML from the `description` field; convert each non-empty paragraph/block element to a `* {text}` line. Skip empty descriptions entirely (no blank `*` lines).
- **D-15 (Export button):** Sits in the top row next to the Save button. On click: build the text string, call `navigator.clipboard.writeText(text)`, then `toast.success('Copied to clipboard!')`. Uses the same `vue-sonner` toast already wired.
- **D-16 (Skip empty sections):** If a day has no meetings, omit the `Meetings:` header entirely. Same for Tasks and Admin. Only include sections that have at least one item.

### Claude's Discretion

- **D-17 (HTML stripping implementation):** Planner picks between `DOMParser` (browser API, no new deps), a lightweight regex strip, or a small utility function. Constraint: no new npm dependencies — reuse what's present.
- **D-18 (Upsert shape for day status):** Planner decides whether to store `dayStatus` as the full PB record (with `id`) or just the status string. Storing the full record is recommended so clearing can call `.delete(id)` directly.
- **D-19 (Export button visibility while status is set):** On an SL/VL day the three sections are hidden but the export should still work — it will produce the single-line format (D-12). Export button stays visible regardless of day status.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Export format (critical)
- `dsu-format.md` — **Canonical export format spec.** FORMAT section defines the structure; EXAMPLE section shows a real day. MUST read before implementing the exporter.

### Phase 5 scope
- `.planning/ROADMAP.md` §Phase 5 — Goal and 4 success criteria (UI-DAY-01..03, EXPORT-01..03)
- `.planning/REQUIREMENTS.md` §UI: Day Status, §UI: Export — requirement text for UI-DAY-01/02/03, EXPORT-01/02/03

### Schema (locked from Phase 1)
- `.planning/pocketbase-schema.md` §dsu_day_status — collection schema: `date` (text YYYY-MM-DD), `status` (select: sl|vl|holiday|bl|others), unique index on `date`
- `src/types/lextrack/dsu_day_status/types.ts` — `DsuDayStatus` and `AddDsuDayStatus` TypeScript types
- `src/lib/pocketbase/dsuDayStatusMapper.ts` — `mapToCreateDayStatus`, `mapFromRecordDayStatus`

### Existing LexTrack code (integration targets)
- `src/views/LexTrackView.vue` — **PRIMARY MODIFICATION TARGET.** Day status ref + SelectButton + loadForDate extension + banner v-if + export handler all land here.
- `src/components/projects/lextrack/ActivityCard.vue` — NOT modified by Phase 5. The v-if that hides it is in LexTrackView's template.
- `src/composables/lextrack/useDurationField.ts` — Duration conversion composable (NOT used by export; export uses raw `duration_minutes`).

### Codebase conventions
- `.planning/codebase/CONVENTIONS.md` — `<script setup>` Composition API, `defineModel`, no manual PrimeVue imports, auto-imported components
- `.planning/phases/04-bugs-and-save-ux/04-CONTEXT.md` D-03/D-16/D-17/D-18 — `saveItem` helper shape, `loadForDate` function shape; Phase 5 extends loadForDate to also fetch day status

### Prior phase decisions
- `.planning/phases/02-types-mappers/02-CONTEXT.md` D-02 — `DsuDayStatusValue` 5-value union: `sl | vl | holiday | bl | others`; labels `bl='Birthday Leave'`, `others='Other'` (but D-12 above uses full names from user preference)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PrimeVue `SelectButton`** — already used in `ManageMeeting.vue` for the min/hr toggle; same import pattern (auto-imported, no manual import needed)
- **`vue-sonner` toast** — `toast.success('Copied to clipboard!')` follows existing pattern in the Manage* dialogs
- **`dayjs`** — already imported in `LexTrackView.vue`; `dayjs(selectedDate.value).format('MM/DD/YYYY')` produces the date string (brackets added manually: `[${dayjs(...).format('MM/DD/YYYY')}]`)
- **`pb` singleton** — already in `LexTrackView.vue`; Phase 5 adds `pb.collection('dsu_day_status')` calls
- **`loadForDate(date)`** — Phase 4 extracted this function; Phase 5 extends it to also fire `pb.collection('dsu_day_status').getFullList({ filter: 'date = "YYYY-MM-DD"' })` in the same `Promise.all`
- **`dsuDayStatusMapper.ts`** — `mapToCreateDayStatus` wraps the create payload; `mapFromRecordDayStatus` is a pass-through spread

### Established Patterns
- **Top-row controls in LexTrackView template:** `<div class="flex justify-between items-end">` contains the date picker + Save button; SelectButton and Export button join this row
- **`v-if` / `v-else` for conditional sections:** standard Vue pattern; the activity grid div gets `v-if="!dayStatus"`, banner div gets `v-else`
- **Immediate PB writes on user interaction** — Phase 4's `removeX` delete is the model: fire PB call, handle error with toast + rollback
- **`isLoading` ref dims the activity grid** — Phase 4 wired this; Phase 5 respects the same `isLoading` flag during the extended `loadForDate`

### Integration Points
- `LexTrackView.vue` script: add `dayStatus` ref (`null | DsuDayStatus`); extend `loadForDate` Promise.all to fetch status; add `setDayStatus(value)` handler that upserts/deletes
- `LexTrackView.vue` template: add `SelectButton` next to date picker; add `v-if="!dayStatus"` on activity grid; add `v-else` banner; add Export button next to Save
- Export: pure computed string from local state — no new PB calls at export time; reads `meetings.value`, `tasks.value`, `supports.value`, `dayStatus.value`

</code_context>

<specifics>
## Specific Ideas

- Export format is **exactly** as defined in `dsu-format.md` — the FORMAT section is the spec, the EXAMPLE section is a reference day. The exporter must replicate it character-for-character (modulo dynamic content).
- SL/VL/etc. export is just two lines: `[date]` then the full status name (e.g. `Sick Leave`) — no section headers, no blank lines, nothing else.
- The `SelectButton` for day status should use abbreviated display labels (`SL`, `VL`, `Holiday`, `BL`, `Others`) to keep the top row compact, but the export and banner use full names (`Sick Leave`, `Vacation Leave`, etc.).
- Duration in the export always appends ` mins` — no `hr` conversion. If `duration_minutes` is null, the parenthetical is omitted entirely: `- Standup` (no duration).
- `navigator.clipboard.writeText` is the clipboard API; it's async and may reject in non-secure contexts — catch the rejection and `toast.error('Copy failed')` as a fallback.

</specifics>

<deferred>
## Deferred Ideas

- **Download to file** — clipboard copy is sufficient for v1; `.txt` download is a nice-to-have for Phase 6 or a later milestone.
- **Hour conversion in export** — user chose to always show minutes (`60 mins` not `1hr`). If they want the toggle back later, the duration field + unit are already in the DB.
- **Export date range** — single-day only for v1. Multi-day or weekly summary is a v2 capability (CARRY-04 in PROJECT.md).
- **"Others" label in export** — Phase 2 D-02 uses `others='Other'` (singular); D-12 above uses `Others` (plural) per user preference. If the label must change in future, update `dsuDayStatusMapper.ts`.

</deferred>

---

*Phase: 05-day-status-and-export*
*Context gathered: 2026-04-29*
