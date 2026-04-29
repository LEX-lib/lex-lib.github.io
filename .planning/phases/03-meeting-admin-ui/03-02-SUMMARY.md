---
phase: 03-meeting-admin-ui
plan: 02
subsystem: ui
tags: [vue, lextrack, activity-card, link-icon, tooltip, primevue-directive]

# Dependency graph
requires:
  - phase: 02-types-mappers
    provides: AddDsuSupport.link?, AddDsuTask.jira_link?, AddDsuMeeting.duration_unit? — already in src/types/lextrack/
provides:
  - Generic per-row external-link icon in ActivityCard for any SectionItem with link or jira_link
  - PrimeVue Tooltip directive registered globally as v-tooltip
  - Inline-add Enter handler that pre-seeds duration_unit/link defaults per label
affects: [03-03, 03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual PrimeVue directive registration (auto-import covers components only)"
    - "'in' type guards in a generic helper to avoid widening a Vue union prop type"
    - "label-prop branching for inline-add factory defaults"

key-files:
  created: []
  modified:
    - src/main.ts
    - src/components/projects/lextrack/ActivityCard.vue

key-decisions:
  - "Tooltip is the ONE allowed manual primevue/* import (directive, not component) — documented inline"
  - "openRowLink uses window.open(url, '_blank', 'noopener,noreferrer') per T-3-01 (anti tab-jacking)"
  - "Branch on props.label ('Meetings' | 'Admin' | else) inside hideInputGroup rather than splitting the component"
  - "Tasks gain the link icon retroactively via the generic helper — zero schema or type churn"
  - "iconify-icon with mdi:open-in-new chosen over mdi:link-variant for clearer 'external' semantics"

patterns-established:
  - "v-tooltip directive available app-wide; future components can use v-tooltip='...' without local setup"
  - "Per-row link affordance pattern: getRowLink() helper + InputGroupAddon v-if='getRowLink(item)'"

requirements-completed: [UI-ADMIN-02, UI-MEET-03]

# Metrics
duration: 3min
completed: 2026-04-29
---

# Phase 3 Plan 02: ActivityCard Link Icon + Inline-Add Defaults Summary

**Generic per-row external-link icon and pre-seeded inline-add defaults for ActivityCard, plus global PrimeVue Tooltip directive registration**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-29T00:23:57Z
- **Completed:** 2026-04-29T00:27:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Registered PrimeVue `Tooltip` directive globally in `src/main.ts` as `v-tooltip` — the documented exception to the no-manual-PrimeVue-imports rule, since `unplugin-vue-components` covers components only, not directives.
- Added `getRowLink(item)` helper in `ActivityCard.vue` using `'in' item` type guards on the existing `SectionItem` union — no type widening, no changes under `src/types/lextrack/`.
- Added `openRowLink(item)` that opens the URL via `window.open(url, '_blank', 'noopener,noreferrer')`, mitigating T-3-01 (tab-jacking).
- Inserted a new `InputGroupAddon` between the readonly title and the edit button. It renders only when `getRowLink(item)` is truthy, shows `mdi:open-in-new` (20×20), exposes `aria-label="Open link in new tab"`, and shows the URL via `v-tooltip` on hover.
- Rewrote the inline-add Enter handler to branch on `props.label`:
  - `'Meetings'` → pushes `{ title, duration_unit: 'minutes', duration_minutes: undefined }` (D-15)
  - `'Admin'` → pushes `{ title, link: undefined }` (D-16)
  - else (Tasks / future labels) → pushes `{ title }` (unchanged minimal shape)
- Captured `defineProps` as `props` so the Enter handler can read `props.label` at runtime.
- Tasks retroactively gain the link icon for any existing `jira_link` data — read-only render, zero risk per D-11.

## Task Commits

1. **Task 1: Register PrimeVue Tooltip directive in main.ts** — `08392cb` (feat)
2. **Task 2: Add per-row link icon and inline-add defaults to ActivityCard** — `b36ca98` (feat)

_Plan-metadata commit (SUMMARY.md, STATE.md, ROADMAP.md) follows as the final docs commit per protocol._

## Files Created/Modified

- `src/main.ts` — Added `import Tooltip from 'primevue/tooltip'` (with explanatory comment) and `app.directive('tooltip', Tooltip)` after the existing `app.use(PrimeVue, {...})` block. Aura preset, indigo customization, `p-button-sm` `pt` override, and `MotionPlugin` all preserved unchanged.
- `src/components/projects/lextrack/ActivityCard.vue` — (1) `defineProps` captured as `const props = ...`. (2) New `getRowLink` and `openRowLink` helpers below the existing `edit`/`remove` emitters. (3) `hideInputGroup` Enter branch now disambiguates the new-item shape via `props.label`. (4) New `<InputGroupAddon v-if="getRowLink(item)">` containing a text-variant secondary `<Button v-tooltip="getRowLink(item)" aria-label="Open link in new tab" @click="openRowLink(item)">` with the `mdi:open-in-new` iconify icon. No manual PrimeVue component imports added; the bookmark icon, readonly title input, edit/remove buttons, empty-state, and `<style scoped>` are untouched.

## Decisions Made

- **Manual Tooltip import is the documented exception** — `components.d.ts` confirmed Tooltip is not auto-registered (auto-import covers components only). Inline comment in `main.ts` explains *why* this single manual `from 'primevue/...'` is allowed so future readers don't reflexively delete it as a CLAUDE.md violation.
- **`'in' item` type guards over union widening** — Per D-12 and D-27, no changes under `src/types/lextrack/`. `'link' in item` and `'jira_link' in item` keep the helper safe across all three SectionItem variants without touching the schema-aligned types.
- **Branch on `props.label`, not split the component** — Inline-add defaults differ per section (D-15 vs D-16), but ActivityCard is generic. Using the existing `label` prop avoids an architectural split (Rule 4) while staying surgical.
- **`mdi:open-in-new` over `mdi:link-variant`** — D-08 allows either; `open-in-new` reads as "external link" universally, matching the new-tab behavior.
- **`'noopener,noreferrer'` as a comma-separated `windowFeatures` string** — Modern browsers parse this string for window.open's third arg and strip `window.opener` accordingly; this is the canonical mitigation per OWASP and T-3-01 in the plan's threat register.
- **Tasks get the icon retroactively** — D-11 explicitly invites this; the helper picks up `jira_link` on existing rows with no migration, no type change, no view-layer churn.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' code matches the plan's verbatim specification. Only the existing `<a href>` mention in T-3-02's threat register did not materialize because the plan opted for `window.open` instead of an `<a target="_blank">` anchor; the chosen path is the stronger mitigation (programmatic `noopener,noreferrer` rather than relying on the `rel` attribute being honored).

## Verification

| Check | Result |
|-------|--------|
| `import Tooltip from 'primevue/tooltip'` in src/main.ts | PASS |
| `app.directive('tooltip', Tooltip)` in src/main.ts | PASS |
| No manual PrimeVue component import in src/main.ts | PASS |
| `MyPreset` + `indigo.500` preserved in src/main.ts | PASS |
| `mdi:open-in-new` in ActivityCard.vue | PASS |
| `noopener,noreferrer` in ActivityCard.vue | PASS |
| `v-tooltip="getRowLink(item)"` in ActivityCard.vue | PASS |
| `const getRowLink` helper in ActivityCard.vue | PASS |
| `duration_unit: 'minutes'` in inline-add | PASS |
| `link: undefined` in inline-add | PASS |
| No manual PrimeVue component imports in ActivityCard.vue | PASS |
| No `console.log` in ActivityCard.vue | PASS |
| `npm run type-check` exits 0 | PASS |
| `npx oxlint src/components/projects/lextrack/ActivityCard.vue src/main.ts -D correctness` exits 0 | PASS |

## must_haves Truths Verification

| Truth | Verification |
|-------|--------------|
| 1. Admin row with a link shows the external-link icon between title and edit/delete | `<InputGroupAddon v-if="getRowLink(item)">` placed between the title `<InputText>` and the edit `<InputGroupAddon>`; icon is `mdi:open-in-new` |
| 2. Task row with a jira_link shows the same icon (D-11/D-12) | `getRowLink` returns `item.jira_link` for tasks via `'jira_link' in item` guard; same template addon renders the icon |
| 3. Clicking opens URL in new tab with `rel='noopener noreferrer'` | `openRowLink` calls `window.open(url, '_blank', 'noopener,noreferrer')` — stronger than the `rel` attribute alone |
| 4. Hovering shows the URL via PrimeVue Tooltip directive | `v-tooltip="getRowLink(item)"` on the icon Button; directive registered in main.ts via `app.directive('tooltip', Tooltip)` |
| 5. Inline-add Enter creates a meeting with `duration_unit: 'minutes'` | `if (props.label === 'Meetings') section.value.push({ title, duration_unit: 'minutes', duration_minutes: undefined })` |
| 6. Inline-add Enter creates an admin/support with `link: undefined` | `else if (props.label === 'Admin') section.value.push({ title, link: undefined })` |

## Issues Encountered

None.

## Threat Flags

None — plan's existing threat register (T-3-01 mitigated, T-3-02 accepted) covers all surface introduced. No new endpoints, auth paths, file access, or schema changes. The Tooltip directive renders text-only (T-3-02 accept disposition), and `window.open` is the same trust boundary the plan documented.

## User Setup Required

None — directive registration is automatic on app boot; the user only needs to refresh the dev server (next `npm run dev`) to see hover tooltips on saved rows with links.

## Next Phase Readiness

- **Plan 03-03 (Wave 1, ManageSupport URL input + strip dark overrides)** — independent file; unaffected.
- **Plan 03-04 (Wave 1, LexTrackView "Admin" label + console.log + dead-code removal)** — D-13 changes the `<ActivityCard label="Admin Tasks and Support" ...>` to `label="Admin"`. The branch-on-label logic added in this plan **already keys off `'Admin'`**, so 03-04's rename will activate the admin-defaults branch automatically. No coordination needed.
- **Plan 03-05 (Wave 2, ManageMeeting duration toggle)** — When the dialog opens for an inline-added meeting, the `duration_unit: 'minutes'` default seeded here gives `useDurationField` a defined value to read, satisfying the round-trip contract from 03-01.
- **Plan 03-06 (Phase gate)** — type-check + lint already green in this plan; no regressions introduced.

## Self-Check: PASSED

- File `src/main.ts` modified — FOUND (`grep -n "app.directive('tooltip', Tooltip)"` matched line 70)
- File `src/components/projects/lextrack/ActivityCard.vue` modified — FOUND (`grep -n "mdi:open-in-new"` matched line 113)
- Commit `08392cb` — FOUND in `git log`
- Commit `b36ca98` — FOUND in `git log`

---
*Phase: 03-meeting-admin-ui*
*Completed: 2026-04-29*
