---
phase: 03-meeting-admin-ui
plan: 03
subsystem: ui
tags: [vue, lextrack, dialog, link-input, support, admin]

# Dependency graph
requires:
  - phase: 02-types-mappers
    provides: "AddDsuSupport.link?: string — already in src/types/lextrack/dsu_supports/types.ts"
  - phase: 03-meeting-admin-ui
    plan: 02
    provides: "ActivityCard renders the link icon when support.link is truthy (downstream consumer of this field)"
provides:
  - "Admin/Support edit dialog captures the optional URL via a typed InputText bound to support.link"
  - "Aura-default dialog visuals (no dark Tailwind overrides)"
  - "Default Quill rendering inside the Support Editor (no :pt override)"
affects: [03-04, 03-05, 03-06, 04-*]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "InputText type='url' for browser-level URL hint (PB validates server-side per Phase 1 D-12)"
    - "Aura-default styling for Manage* dialogs (Tailwind utility overrides removed)"

key-files:
  created: []
  modified:
    - src/components/projects/lextrack/ManageSupport.vue

key-decisions:
  - "URL input uses plain InputText with type='url' (no client-side regex; PB URL field validates on save)"
  - "Dialog header stays 'Edit Support' and filename stays ManageSupport.vue per D-13 (only the LexTrackView section label becomes 'Admin' in plan 03-04)"
  - "editorStyle constant + :pt override removed; Editor renders default Quill styling per D-18"
  - "Save button keeps bg-indigo-600/hover:bg-indigo-700 per D-19 (matches Aura indigo preset)"
  - "updateSupport handler unchanged — Phase 4 (UI-SAVE-01) owns persistence per D-17"
  - "Dropped unused Toaster and ref imports (oxlint correctness baseline)"

patterns-established:
  - "Manage* dialog body uses 'space-y-4 p-4' wrapper with no dark overrides — same template will apply to ManageMeeting in plan 03-05"

requirements-completed: [UI-ADMIN-01]

# Metrics
duration: ~8min
completed: 2026-04-29
---

# Phase 3 Plan 03: ManageSupport URL Input + Strip Dark Overrides Summary

**Wire the optional URL field into the Admin/Support edit dialog and de-darken the dialog so it matches the Aura indigo preset, while keeping the Phase 4 persistence boundary intact.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-29T00:32:17Z
- **Completed:** 2026-04-29T00:40:21Z
- **Tasks:** 1
- **Files modified:** 1

## What Changed

### `src/components/projects/lextrack/ManageSupport.vue`

**Script setup**
- Removed unused `Toaster` import from `vue-sonner` and unused `ref` import from `vue` (dead code; oxlint correctness baseline).
- Removed the `editorStyle` constant (was only consumed by the now-deleted `:pt` override on `<Editor>`).
- `updateSupport` body is unchanged in spirit — still `toast.success('Support is updated successfully!')` followed by `visible.value = false`. Added a one-line comment marking the Phase 4 boundary (UI-SAVE-01) so the next maintainer knows where persistence will land.

**Template**
- Removed the dark wrapper classes `bg-gray-700/50 rounded-lg` from the outer dialog body `div`. Kept `space-y-4 p-4` per D-20.
- Removed `bg-gray-700 text-white` from the title `InputText`'s `class`.
- **Added** the URL input between the title and the Editor (D-14, D-25 ordering):
  ```vue
  <InputText v-model="support.link" type="url" placeholder="Link (optional)" class="w-full" />
  ```
- Removed `:pt="editorStyle"` from `<Editor>` so it renders with default Quill styling per D-18.
- Kept the Save button's `bg-indigo-600 hover:bg-indigo-700` Tailwind utilities per D-19 (matches the Aura indigo preset configured in `src/main.ts`).
- Dialog `header="Edit Support"`, `position="right"`, `:style="{ width: '40vw' }"`, modal flag, `<style scoped></style>` empty block — all left intact per D-13.

## Verification

| Gate | Command | Result |
|------|---------|--------|
| Type-check | `npm run type-check` | PASS (no errors) |
| oxlint correctness | `npx oxlint src/components/projects/lextrack/ManageSupport.vue -D correctness` | PASS (0 warnings, 0 errors) |
| URL binding | `grep -q 'v-model="support.link"' …` | PASS |
| URL type | `grep -q 'type="url"' …` | PASS |
| Placeholder | `grep -q 'placeholder="Link (optional)"' …` | PASS |
| Dark bg stripped | `! grep -q "bg-gray-700" …` | PASS |
| text-white stripped | `! grep -q "text-white" …` | PASS |
| `:pt="editorStyle"` removed | `! grep -q ':pt="editorStyle"' …` | PASS |
| `editorStyle` constant gone | `! grep -q "const editorStyle" …` | PASS |
| Indigo Save preserved | `grep -q "bg-indigo-600 hover:bg-indigo-700" …` | PASS |
| Dialog header unchanged | `grep -q 'header="Edit Support"' …` | PASS |
| No PB persistence (Phase 4 boundary) | `! grep -q "pb.collection" …` | PASS |
| No console.log | `! grep -q "console.log" …` | PASS |
| No manual PrimeVue imports | `! grep -E "^import (Button\|InputText\|Dialog\|Editor) from 'primevue/" …` | PASS |

All 14 acceptance criteria pass. The dialog now shows three rows (Title, Link, Editor) with Aura-default styling and an indigo Save button; the link field round-trips through the existing v-model binding.

## Plan must_haves Truth Table

| Truth | Status |
|-------|--------|
| Admin/Support dialog has a URL InputText bound to support.link between title and Editor | PASS |
| URL input uses type='url' for browser hint and paste handling | PASS |
| Dialog body has no dark Tailwind overrides (bg-gray-700, text-white removed) | PASS |
| Editor :pt override is removed (default Quill rendering) | PASS |
| Save button keeps bg-indigo-600 / hover:bg-indigo-700 (D-19) | PASS |
| updateSupport handler is unchanged (Phase 4 boundary) | PASS |

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | 389a63c | feat(03-03): add URL input + strip dark overrides in ManageSupport.vue |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

- **T-3-03 (Tampering, Editor default render)** — Accept disposition. `:pt` removed; Editor falls back to Quill 2.0 default rendering, which sanitizes by default. Single-user app — no new attack surface.
- **T-3-05 (Input Validation, URL input type='url')** — Accept disposition. `type="url"` is a browser hint only; PB's URL field validates on save (Phase 1 D-12). Phase 6 tests will revisit if needed.

No new threat surface introduced beyond what the plan accepted.

## Boundary Compliance

- **Phase 4 boundary (D-17, ROADMAP)** — `updateSupport` still toasts and closes the dialog; no `pb.collection` calls added. UI-SAVE-01 will replace the body in Phase 4.
- **D-13 (label rename scoped to LexTrackView only)** — Dialog header, filename, and placeholders unchanged. `LexTrackView`'s section label change lands in plan 03-04.
- **D-27 (no type changes in Phase 3)** — `src/types/lextrack/dsu_supports/types.ts` not touched; `link?: string` was already added in Phase 2 plan 02-03.

## Self-Check: PASSED

- File `src/components/projects/lextrack/ManageSupport.vue`: FOUND
- Commit `389a63c`: FOUND in git log
