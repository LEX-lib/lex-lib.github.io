---
phase: 21-mini-app-dark-mode-sweep
plan: 01
subsystem: lextrack
tags:
  - dark-mode
  - lextrack
  - tailwind
  - vue3
  - semantic-tokens
  - phase-18-tokens
dependency-graph:
  requires:
    - Phase 18 `@custom-variant dark` rule in base.css
    - Phase 18 `.my-app-dark` dark token block in base.css (surface-page, surface-card, surface-divider, typo-heading, typo-body, typo-muted)
    - Phase 19 useTheme composable / NavBar toggle (controls `.my-app-dark` on `<html>`)
  provides:
    - LexTrack mini-app rendering correctly in BOTH light and dark themes via semantic-token utilities (no more dark-only hardcoding)
  affects:
    - THEME-09 (LexTrack dark mode requirement) — structurally satisfied
    - ROADMAP §Phase 21 SC 1 — LexTrack contribution complete
tech-stack:
  added: []
  patterns:
    - "Phase 18 semantic-token refactor (Option A) instead of mechanical `dark:` pairing"
    - "Scoped wrapper classes (`.lextrack-datepicker`, `.lextrack-tabview`) for PrimeVue inline `<style>` overrides to prevent global leakage"
    - "`var(--color-surface-card)` / `var(--color-typo-heading)` / `var(--color-surface-divider)` inside `!important` overrides so they auto-switch via Phase 18's `.my-app-dark` block"
key-files:
  created:
    - .planning/phases/21-mini-app-dark-mode-sweep/21-01-SUMMARY.md
  modified:
    - src/components/projects/lextrack/LexTrackApp.vue
    - src/components/projects/lextrack/AddMeeting.vue
    - src/components/projects/lextrack/ManageMeeting.vue
    - src/components/projects/lextrack/ManageSupport.vue
    - src/components/projects/lextrack/ManageTask.vue
  unchanged_but_audited:
    - src/components/projects/lextrack/ActivityCard.vue
decisions:
  - "Option A (semantic-token refactor) selected over Option B (mechanical `dark:` pairing) per user approval at the architectural-decision checkpoint"
  - "Scope wrapper classes added to LexTrackApp's inline `<style>` block so the `!important` PrimeVue overrides do not leak to other mini-apps"
  - "ActivityCard.vue audited — no hardcoded gray/white utilities; left untouched"
metrics:
  duration: ~25 minutes (post-checkpoint resume)
  completed: 2026-05-19
  tasks_completed: 2 (Task 1: LexTrackApp refactor; Task 2: 4 dialog refactors; Task 3: this SUMMARY)
  commits: 5 atomic feature commits + 1 docs commit
---

# Phase 21 Plan 01: LexTrack Dark Mode (Semantic-Token Refactor) Summary

LexTrack refactored from dark-only hardcoded styling to Phase 18 semantic
tokens so the mini-app now renders correctly in **both** light and dark
themes via the auto-switching `.my-app-dark` block in `src/assets/base.css`.

## Deviations from Plan

### Architectural Deviation — Option A (semantic-token refactor) instead of "mechanical dark: pairing"

**Trigger:** Rule 4 (architectural decision) — surfaced at the
checkpoint after Task 1's initial read.

**Discovery:** The plan as written assumed LexTrack used the
"light Tailwind utilities + missing `dark:` pair" pattern from Phase 18
(MonitoX et al.). The actual file state was the opposite — LexTrack was
**dark-only and hardcoded** (`bg-gray-900`, `bg-gray-800`, `bg-gray-700`,
`text-white`, `text-gray-300`, `text-gray-400`, `border-gray-600`,
`border-gray-700`, plus an inline `<style>` block with hardcoded
`#374151` / `#f9fafb` / `#4b5563` PrimeVue overrides). Mechanical
`dark:`-pairing would have left the file broken in light mode forever.

**User decision (logged in checkpoint):** Option A — refactor to Phase
18 semantic tokens so LexTrack becomes genuinely theme-aware. Scope
stays bounded to the 6 LexTrack files; no `base.css` change; no new
tokens introduced.

**Plan frontmatter contract note:** The plan's `<must_haves>` block
literally required "Every existing light-only Tailwind utility …
has a paired `dark:` variant." With the file state being dark-only,
that contract was structurally inapplicable. Option A satisfies the
**purpose** of THEME-09 (LexTrack renders correctly in dark mode) more
robustly than literal `dark:` pairing would have.

## Files modified

| File | Lines added | Lines removed | Refactor summary |
|------|---|---|---|
| `LexTrackApp.vue` | +122 | -59 | All page/card/list/form backgrounds, headings, body text, dividers, and inline-style PrimeVue overrides converted to semantic tokens. Inline `<style>` rules scoped under `.lextrack-datepicker` / `.lextrack-tabview` so they no longer leak to other mini-apps. |
| `AddMeeting.vue` | +9 | -5 | Dialog panel + InputText + InputNumber + Editor `:pt` classes → semantic tokens. |
| `ManageMeeting.vue` | +9 | -5 | Same pattern as AddMeeting. |
| `ManageSupport.vue` | +8 | -4 | Same pattern, slightly smaller (no InputNumber). |
| `ManageTask.vue` | +9 | -5 | Same pattern, includes Jira Link InputText. |
| `ActivityCard.vue` | 0 | 0 | **Audited — no light/dark-only utilities present.** Two `style="color: #024"` icon refs use a navy brand-adjacent hex that reads acceptably in both themes; out of scope per D-13 token-locked status colors. Left untouched. |

## Token mapping applied

Per the canonical mapping from the resume objective:

| Replaced (dark-hardcoded) | With (semantic, auto-switching) | Where |
|---|---|---|
| `bg-gray-900` (page background) | `bg-surface-page` | LexTrackApp shell |
| `bg-gray-800` (card/panel) | `bg-surface-card` | LexTrackApp main card |
| `bg-gray-700/50`, `bg-gray-900/50` (sub-panel) | `bg-surface-page/60` | All dialog panels + LexTrackApp sub-lists |
| `bg-gray-700` (input/list-item bg) | `bg-surface-card` | All InputText, InputNumber, Editor passes |
| `text-white` (heading) | `text-typo-heading` | All `<h3 class="font-bold ...">` |
| `text-gray-300` (body text) | `text-typo-body` | List item descriptions |
| `text-gray-400` (muted text) | `text-typo-muted` | Empty-state lines, helper labels |
| `border-gray-600`, `border-gray-700` | `border-surface-divider` | DatePicker input, TabView nav, list rows |
| Inline `#374151` / `#f9fafb` / `#4b5563` hex | `var(--color-surface-card)` / `var(--color-typo-heading)` / `var(--color-surface-divider)` | LexTrackApp.vue inline `<style>` block |
| `bg-gray-600 text-white` chip (mins pill) | `bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300` | Meeting duration pill (non-status, non-semantic color → Tailwind dark variant pair) |
| `text-indigo-400` (Jira link) | `text-indigo-600 dark:text-indigo-300` | Jira links in task cards (theme-aware accent) |

**No new `--color-*` tokens added to `base.css`.** Phase 18 token set was sufficient.

## Inline `<style>` block handling (LexTrackApp.vue)

The previous `<style>` block hardcoded dark-only hex literals with
`!important` to force PrimeVue datepicker/tabview parts into dark colors:

```css
.p-datepicker-header,
.p-tabview-nav-link {
  background: #374151 !important;
  color: #f9fafb !important;
  ...
}
```

**Approach chosen:** Option 2 from the resume protocol — replace literal
hex with CSS variables so the same rule auto-switches between themes.
**Additionally** added `.lextrack-datepicker` and `.lextrack-tabview`
scope prefixes so these `!important` overrides cannot leak into other
mini-apps that also use PrimeVue DatePicker / TabView (Wallecx,
ApiPlayground, etc.).

```css
.lextrack-datepicker .p-datepicker-header,
.lextrack-tabview .p-tabview-nav-link {
  background: var(--color-surface-card) !important;
  color: var(--color-typo-heading) !important;
  border-bottom: 1px solid var(--color-surface-divider) !important;
}
```

The selected-tab highlight rule was split into a light variant (`#4f46e5`,
indigo-600) and a dark variant (`#a5b4fc`, indigo-300) gated by
`.my-app-dark` — since the original hardcoded `#a5b4fc` would have washed
out against a light tab background. The selected-date highlight stays
`#4f46e5 / #ffffff` in both themes (intentional brand accent on a
filled pill, theme-independent like the indigo CTAs).

## Anti-regression confirmation

`git diff --name-only HEAD~5 HEAD` returned exactly:

```
src/components/projects/lextrack/AddMeeting.vue
src/components/projects/lextrack/LexTrackApp.vue
src/components/projects/lextrack/ManageMeeting.vue
src/components/projects/lextrack/ManageSupport.vue
src/components/projects/lextrack/ManageTask.vue
```

**None of the locked anti-regression files appear in the diff:**
- `src/main.ts` — untouched
- `src/composables/useTheme.ts` — untouched
- `src/composables/useIsMobile.ts` — untouched
- `src/assets/base.css` — untouched (no new tokens added)
- `src/assets/wallecx-overrides.css` — untouched
- `src/components/projects/wallecx/**` — untouched
- `src/components/projects/larga/**` — untouched
- `src/components/projects/gift-exchange/**` — untouched
- `src/components/projects/api-playground/**` — untouched
- `src/views/**` — untouched
- `index.html` — untouched

## THEME-09 trace

THEME-09 (LexTrack dark mode) decomposes into ROADMAP §Phase 21 SC 1
sub-surfaces:

- **Task lists** → `LexTrackApp.vue` "Logged Tasks for Today" list now
  uses `bg-surface-card border-surface-divider text-typo-heading` for
  each row, `text-typo-body` for descriptions, `text-typo-muted` for
  empty states.
- **Meeting forms** → `AddMeeting.vue`, `ManageMeeting.vue`, plus the
  inline meeting form in `LexTrackApp.vue` all use
  `bg-surface-page/60` panel, `bg-surface-card text-typo-body` inputs,
  `bg-indigo-100/dark:bg-indigo-900/30` mins chip.
- **Support requests** → `ManageSupport.vue` + LexTrackApp's Admin
  Support tab use the same semantic-token pattern as the meeting forms.
- **Dialogs** → All four `Manage*`/`AddMeeting` dialogs use
  `bg-surface-page/60` panel, semantic-token inputs, and the same
  shared `editorStyle` constant (Editor `:pt` toolbar + content now
  carry `bg-surface-card border-surface-divider text-typo-body`).
- **Tables/charts** → PrimeVue DataTable / Chart not directly used in
  LexTrack's current surface; Phase 18 `@custom-variant` alignment
  would handle them automatically if added later.

## Verification results

| Check | Command | Exit code |
|---|---|---|
| TypeScript type-check | `npm run type-check` | **0 (PASS)** |
| Production build | `npm run build-only` | **0 (PASS)** — built in 2.81s |

`build-only` emitted the expected chunk-size advisory for vendor.js but
nothing related to LexTrack or the refactor. PWA precache regeneration
succeeded.

## Light-mode rendering assumption

Because the working tree's current `.my-app-dark` state was not visually
tested as part of this resume, light-mode rendering is **expected** to
use the Phase 18 light tokens:

| Token | Light value | Dark value |
|---|---|---|
| `--color-surface-page` | `#f5f7fa` | `#0d1117` |
| `--color-surface-card` | `#ffffff` | `#1a1a2e` |
| `--color-surface-divider` | `#e8ecf2` | `#2a3142` |
| `--color-typo-heading` | `#0d1117` | `#f5f7fa` |
| `--color-typo-body` | `#3d4a5c` | `#cbd5e1` |
| `--color-typo-muted` | `#6b7280` | `#9ca3af` |

Visual UAT will confirm both modes in the consolidated phase-level
`21-HUMAN-UAT.md` (delivered in plan 21-04). The structural contract is
already satisfied: every previously-hardcoded surface now reads a
variable that has both a light and a dark value defined in `base.css`.

## ActivityCard outcome

Audit of `src/components/projects/lextrack/ActivityCard.vue` found:
- No `bg-gray-*`, `bg-white`, `text-gray-*`, `text-white`, `border-gray-*` utilities
- Two `style="color: #024"` inline-style references on `<iconify-icon>` elements (rendered inside `<InputGroupAddon>`). `#024` is a dark navy that reads acceptably on PrimeVue's auto-switching addon backgrounds in both themes.
- Uses PrimeVue `<Card>`, `<Button>`, `<InputGroup>`, `<InputText>` — these auto-switch via Phase 18's `@custom-variant` alignment.

**Result:** Zero changes required. File deliberately left out of `git diff`.

## Open items / UAT pending

Visible runtime UAT (375px + ≥640px viewports, light + dark themes)
deferred to consolidated `21-HUMAN-UAT.md` per D-21. Specific items to
spot-check during that pass:

1. PrimeVue **Editor** toolbar — confirm semantic-token `:pt` classes
   on toolbar + content sub-parts actually paint the Quill editor
   surface correctly in both themes (Editor's internal DOM may have
   defaults that override our `:pt` classes).
2. **DatePicker** popup panel in light mode — verify
   `bg-surface-card border-surface-divider` reads cleanly on the
   floating panel against the underlying page.
3. **TabView** selected-tab inkbar — currently kept as `bg-indigo-500`
   (theme-independent brand accent); verify it remains legible
   against `.my-app-dark .lextrack-tabview .p-tabview-nav-link.p-highlight`
   (`#a5b4fc`).
4. **`#024` iconify color in ActivityCard** — if visibility against
   a light addon background is poor, follow-up plan can swap to a
   semantic-token-driven color. Documented but not changed in this plan.

## Known Stubs

None introduced by this plan.

## Threat Flags

None — refactor is a pure CSS/markup change with no new network endpoints,
auth paths, file access patterns, or schema changes.

## TDD Gate Compliance

N/A — plan type is `execute`, not `tdd`.

## Self-Check: PASSED

Verified that all claimed files/commits exist:

- `src/components/projects/lextrack/LexTrackApp.vue` — FOUND (HEAD)
- `src/components/projects/lextrack/AddMeeting.vue` — FOUND (HEAD)
- `src/components/projects/lextrack/ManageMeeting.vue` — FOUND (HEAD)
- `src/components/projects/lextrack/ManageSupport.vue` — FOUND (HEAD)
- `src/components/projects/lextrack/ManageTask.vue` — FOUND (HEAD)
- 5 atomic feature commits exist in `git log` (2317754, 5e2ddb6, c57945b, 4c0768c, 602d926)
- `npm run type-check` exited 0
- `npm run build-only` exited 0
- Anti-regression locked files NOT in `git diff --name-only HEAD~5 HEAD`
