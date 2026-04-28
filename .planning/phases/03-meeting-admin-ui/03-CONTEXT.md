# Phase 3: Meeting & Admin UI - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the new Phase 1/2 fields into the LexTrack UI:
1. Duration unit toggle (min/hr) on `ManageMeeting.vue` and inline-add in `ActivityCard.vue`
2. URL field on `ManageSupport.vue` and a clickable link icon on Admin and Task rows in `ActivityCard.vue`
3. Rename the section label "Admin Tasks and Support" → "Admin" in `LexTrackView.vue`
4. Strip dark Tailwind overrides from the two Manage* dialogs to match Aura indigo
5. Remove `console.log`s from `LexTrackView.vue` and the commented-out Dialog block

**Phase 3 is forms-only.** Persistence (per-item dialog Save, initial load, delete-to-PB, error/loading states) is Phase 4. Phase 3 changes what the forms LOOK like and CAPTURE; Phase 4 changes how they SAVE.

</domain>

<decisions>
## Implementation Decisions

### Duration Toggle UX

- **D-01:** UI is a **PrimeVue `SelectButton`** (segmented control) with two options: `min` and `hr`. Auto-imported via `unplugin-vue-components`; no manual import needed.
- **D-02:** Layout: number input + SelectButton on the **same row, toggle to the right of the input**. Use Tailwind flex (e.g. `flex gap-2 items-center`) to align them; the input takes flex-1 and the toggle is intrinsic width.
- **D-03:** Storage convention (matches Phase 1/2):
  - `duration_minutes` always stores the canonical minute value
  - `duration_unit` stores how the user entered it (`'minutes'` or `'hours'`)
  - When unit = hours: input shows the user's entered value (e.g. `1.5`); on save we compute `duration_minutes = entered * 60`
  - When unit = minutes: `duration_minutes` is the entered value directly
- **D-04:** Round-trip behavior on edit (D-15 from Phase 2 carries forward — read normalizes legacy `undefined` to `'minutes'`):
  - If saved `duration_unit === 'hours'`, the dialog shows the input as `duration_minutes / 60` and the toggle reads `hr`
  - If saved `duration_unit === 'minutes'` (or undefined for legacy), input shows `duration_minutes` and toggle reads `min`
- **D-05:** Decimals allowed when unit is `hr` (PrimeVue `InputNumber` with `:min-fraction-digits="0" :max-fraction-digits="2"`). When unit is `min`, force integers (`:max-fraction-digits="0"`).
- **D-06:** Constants source: import `DSU_MEETING_DURATION_UNIT_VALUES` and `DSU_MEETING_DURATION_UNIT_LABELS` from `@/types/lextrack/dsu_meetings/constants`. The SelectButton's `options` prop maps the values; the `optionLabel` resolves via the LABELS map (`min` / `hr`).
- **D-07:** A small Vue composable `useDurationField()` (in `src/composables/lextrack/useDurationField.ts`) encapsulates the conversion both ways (entered ↔ minutes; unit ↔ display). Reused by `ManageMeeting.vue` and any future component that needs the same UX. **One file, one job.**

### Admin Link Affordance

- **D-08:** Saved link surfaces as a **small external-link icon** in the InputGroup row in `ActivityCard.vue`, between the title input and the existing edit/delete buttons. Use `iconify-icon` with `mdi:open-in-new` (or `mdi:link-variant`).
- **D-09:** Click behavior: opens `link` in a **new tab with `rel="noopener noreferrer"`** (security: avoid window.opener tab-jacking). Visible only when `link` is truthy (`v-if="item.link"`).
- **D-10:** A hover tooltip shows the URL itself (PrimeVue `Tooltip` directive — `v-tooltip="item.link"`). Tooltip auto-imports via the existing PrimeVue plugin setup; if it doesn't, register the `vTooltip` directive in `main.ts`.
- **D-11:** **Same icon pattern applies to existing `jira_link` on Tasks.** This is one-shot: ActivityCard's row template gets a generic "show link icon if a link field is present on this item." Tasks gain the icon retroactively for existing data — zero risk because we only show, not edit.
- **D-12:** Generic per-row link helper inside `ActivityCard.vue`: a computed that picks `item.link` (Admin/Support) OR `item.jira_link` (Tasks) OR `undefined`. The icon renders if either is set. No type widening — the union type already permits both fields via the existing `SectionItem` type.

### Section Label & Form Copy

- **D-13:** **Only the section label changes.** `LexTrackView.vue` template `<ActivityCard label="Admin Tasks and Support" .../>` → `label="Admin"`. ManageSupport dialog header (`Edit Support`), placeholders (`Support Title`), filename (`ManageSupport.vue`), and the underlying PocketBase collection name (`dsu_supports`) all stay unchanged. **Minimal blast radius**; user-visible vocab is "Admin" everywhere users actually see in the workflow.
- **D-14:** Add the URL input to `ManageSupport.vue` between the title and the description Editor (logical visual hierarchy). Placeholder: `Link (optional)`. Plain `InputText` with `type="url"` for browser hint and paste handling. No client-side validation in Phase 3 — PB's URL field validates on save (Phase 1 D-12).

### Inline-Add Defaults

- **D-15:** When user adds a meeting via Enter key in `ActivityCard.vue`, the new object includes `duration_unit: 'minutes'` (default) and `duration_minutes: undefined` (no value yet — toggle visible, number empty until they edit). Dialog opens cleanly when they click edit.
- **D-16:** When user adds an admin entry via Enter key, the new object includes `link: undefined`. The icon doesn't render (D-09 visibility). Dialog opens with empty link field.
- **D-17:** **Phase 3 does NOT change the local-state-only behavior** of inline-add. Items still live in `supports.value` / `meetings.value` arrays in `LexTrackView.vue` until the page-level Save runs. Phase 4 owns the persistence path.

### Dialog Visual Style

- **D-18:** **Strip dark Tailwind overrides** from `ManageMeeting.vue` and `ManageSupport.vue`:
  - Remove `bg-gray-700/50` from outer `div`
  - Remove `bg-gray-700`, `text-white`, `inputClass="bg-gray-700 text-white..."` from individual inputs
  - Remove the `:pt` Editor override (`editorStyle` constant goes away — Editor renders default Quill styling)
- **D-19:** **Keep button styling** (`bg-indigo-600 hover:bg-indigo-700`) — it matches the Aura indigo preset configured in `main.ts`. PrimeVue Button's auto-class from the preset will color them correctly even without these utility classes; the Tailwind classes are belt-and-suspenders. Leave as-is to avoid Phase 4 churn.
- **D-20:** Dialog body uses sensible spacing only — `p-4 space-y-4` (already present). No new theme tokens, no Card wrapper inside the Dialog.

### Bug Cleanup

- **D-21:** Remove all `console.log` statements in `src/views/LexTrackView.vue` and `src/components/projects/lextrack/*.vue` (BUG-04). Grep gate: `! grep -r "console.log" src/views/LexTrackView.vue src/components/projects/lextrack/`.
- **D-22:** Remove the large commented-out `<Dialog v-model:visible="visible" header="Add DSU Update">` block at the bottom of `LexTrackView.vue`'s `<template>` (lines ~200-245) plus the surrounding `<!--  <AddMeeting ...-->` comment (BUG-05). Grep gate: the file's `<!--` comment-block count drops to 0.
- **D-23:** While cleaning, also remove unused imports introduced during cleanup (e.g. `AddMeeting` import if it's only used in the commented block) — but **do not aggressively refactor**. Stay surgical to keep diff focused and reviewable.

### Claude's Discretion

- **D-24 (Component ordering in ManageMeeting):** Title → Duration row (input + toggle) → Description Editor → Save button. (Matches existing visual order; only Duration row gets restructured.)
- **D-25 (Component ordering in ManageSupport):** Title → Link → Description Editor → Save button. (Title-then-link mirrors `ManageMeeting`'s title-then-duration; description always last as the largest input.)
- **D-26 (Toggle placement in inline-add row):** The inline `InputGroup` Enter-key add stays minimal (just title + suffix icon). Duration entry is a dialog-only thing. Inline-add doesn't show the toggle.
- **D-27 (No type changes):** No file under `src/types/lextrack/` is modified in Phase 3. Types and constants from Phase 2 are imported and used; nothing redefined.

### Folded Todos

None — no project-level todos cross-referenced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Constraints (no framework swaps, single-user)
- `.planning/REQUIREMENTS.md` §UI: Meetings / Admin / Bug Fixes — UI-MEET-01/02/03, UI-ADMIN-01/02/03, BUG-04, BUG-05
- `.planning/ROADMAP.md` §Phase 3 — Goal and 5 success criteria

### Phase 1 (locked)
- `.planning/phases/01-schema-foundation/01-CONTEXT.md` D-09/D-10/D-12 — `duration_unit` optional, `link` URL field
- `.planning/pocketbase-schema.md` §1, §2 — Field shapes

### Phase 2 (locked)
- `.planning/phases/02-types-mappers/02-CONTEXT.md` D-13/D-14/D-15 — `duration_unit` typing rules; D-09 mapper triple
- `src/types/lextrack/dsu_meetings/types.ts` — `DsuMeetings`, `AddDsuMeeting`, `DurationUnit` re-export source
- `src/types/lextrack/dsu_meetings/constants.ts` — `DSU_MEETING_DURATION_UNIT_VALUES`, `DSU_MEETING_DURATION_UNIT_LABELS`
- `src/types/lextrack/dsu_supports/types.ts` — `DsuSupports.link?`
- `src/lib/pocketbase/dsuMeetingMapper.ts` — Mapper triple with legacy default
- `src/lib/pocketbase/dsuSupportMapper.ts` — Mapper triple with link

### Codebase context
- `.planning/codebase/CONVENTIONS.md` — Vue Composition API patterns, no manual PrimeVue imports
- `.planning/codebase/STRUCTURE.md` — `src/components/projects/lextrack/` layout
- `src/views/LexTrackView.vue` — **Modified by Phase 3:** Section label, console.logs, commented Dialog block (BUG-04, BUG-05). Initial-load / delete / save are Phase 4.
- `src/components/projects/lextrack/ActivityCard.vue` — **Modified:** Link icon affordance (D-08–D-12), inline-add default (D-15/D-16)
- `src/components/projects/lextrack/ManageMeeting.vue` — **Modified:** Duration toggle (D-01–D-07), strip dark overrides (D-18)
- `src/components/projects/lextrack/ManageSupport.vue` — **Modified:** Link input (D-14), strip dark overrides (D-18)
- `src/components/projects/lextrack/ManageTask.vue` — **NOT modified by Phase 3.** Tasks already have `jira_link` field; ActivityCard's generic link icon picks it up automatically (D-11/D-12). Dialog itself is unchanged.
- `src/main.ts` — Verify `vTooltip` directive registers; if not, the planner adds it (D-10)
- `components.d.ts` — Auto-import map; SelectButton auto-imports

### External docs
- PrimeVue 4.x docs: `SelectButton`, `InputNumber` (`maxFractionDigits`), `Tooltip` directive — researcher confirms current API if needed

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PrimeVue auto-import** — `SelectButton` and `Tooltip` directive available without manual import (per `unplugin-vue-components` + PrimeVueResolver)
- **`@vueuse/motion`** is loaded — could animate the toggle if desired, but keep it simple for v1
- **`vue-sonner` toast** is already wired — used by Phase 4 for save feedback (Phase 3 doesn't add toasts)
- **`iconify-icon`** custom element is registered in `vite.config.ts` — use directly in templates (`<iconify-icon icon="mdi:open-in-new" .../>`)
- **`@/types/lextrack/dsu_meetings/constants`** — already has `DSU_MEETING_DURATION_UNIT_VALUES` (`['minutes', 'hours']`) and labels (`{ minutes: 'min', hours: 'hr' }`)

### Established Patterns
- **`<script setup>` Composition API** with `defineModel` for v-model, `defineProps`, `defineEmits` (see existing `ActivityCard.vue`, `ManageMeeting.vue`)
- **Tailwind utility classes inline** — no scoped styles in lextrack components today
- **No barrel exports** in `src/composables/` (composables don't exist yet — Phase 3 introduces the first one at `src/composables/lextrack/useDurationField.ts`)
- **Iconify naming convention** — kebab-case `mdi:icon-name` strings (matches existing usage like `mdi:bookmark-box-outline`)

### Integration Points
- `LexTrackView.vue` template → `<ActivityCard label="Admin Tasks and Support" .../>` — change to `"Admin"` (D-13)
- `ActivityCard.vue` row template → add link icon between title and edit/delete buttons (D-08)
- `ActivityCard.vue` `hideInputGroup` Enter handler → set `duration_unit: 'minutes'` for new meetings, `link: undefined` for new admin entries (D-15/D-16)
- `ManageMeeting.vue` Duration row → replace single `InputNumber` with `useDurationField` composable + SelectButton (D-01–D-07)
- `ManageSupport.vue` form → add `<InputText v-model="support.link" type="url">` between title and Editor (D-14)

### Type Implications
- `ActivityCard.vue` already uses a `SectionItem` union type — no widening needed for the link icon (the union already covers `link` and `jira_link`)
- `useDurationField()` composable returns reactive refs — typed as `Ref<number | null>` for the input value (allows `null` while empty), `Ref<DurationUnit>` for the unit, plus a computed `Ref<number | undefined>` for the canonical minutes

</code_context>

<specifics>
## Specific Ideas

- The user's `quarter-3-logs.txt` shows `(1hr)`, `(55mins)`, `(20mins)`, `(2 hours)` — the toggle MUST handle this faithfully. D-04 round-trip ensures `(1hr)` saved with `unit=hours, minutes=60` displays back as `1` + `hr`, not `60` + `min`.
- Duration of `(2 hours)` from logs → entered as `2` with toggle on `hr` → stored as `duration_minutes: 120, duration_unit: 'hours'` → re-display as `2 hr`.
- `(55mins)` → entered as `55` with toggle on `min` → stored as `duration_minutes: 55, duration_unit: 'minutes'` → re-display as `55 min`.
- The link icon's `mdi:open-in-new` reads as "external link" universally; if it feels noisy with many rows, the planner may pick `mdi:link-variant` (chain icon) instead. Either is fine.

</specifics>

<deferred>
## Deferred Ideas

- **Per-item dialog Save persistence** — UI-SAVE-01/02/03; phase 4 owns.
- **Initial-load / delete-to-PB / error toasts** — BUG-01/02/03; phase 4 owns.
- **Smart-display unit auto-pick** (e.g. show `1 hr` if minutes ≥ 60) — rejected for v1 (D-04 keeps faithful round-trip)
- **URL validation on the client** — rejected for v1; PB's URL field validates server-side. Revisit in Phase 6 tests if needed.
- **Renaming `ManageSupport.vue` → `ManageAdmin.vue`** — rejected (D-13). Revisit if vocab ever expands beyond just the section label.
- **Animations on the toggle** — out of scope; `@vueuse/motion` is available but not used here.
- **Phase 3 fix of pre-existing lint errors** in `vite.config.ts` and `site.js` — declined; these are unrelated to LexTrack and have lived since before this milestone. A separate housekeeping commit can clean them.
- **Aggressive component restyle** to a unified Aura look — only the dialog dark-overrides come off. Full visual polish is a separate scope.

### Reviewed Todos (not folded)
None.

</deferred>

---

*Phase: 03-meeting-admin-ui*
*Context gathered: 2026-04-28*
