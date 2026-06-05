---
phase: 21-mini-app-dark-mode-sweep
plan: 03
subsystem: gift-exchange
tags:
  - dark-mode
  - gift-exchange
  - monitox
  - tailwind
  - vue3
dependency-graph:
  requires:
    - Phase 18 `@custom-variant dark` rule in base.css
    - Phase 18 `.my-app-dark` dark token block in base.css (surface-page, surface-card, surface-divider, typo-heading, typo-body, typo-muted)
    - Phase 19 useTheme composable / NavBar toggle (controls `.my-app-dark` on `<html>`)
  provides:
    - MonitoX (Gift Exchange) rendering correctly in dark mode across all 4 sub-routes (landing, join, draw, manage)
  affects:
    - THEME-11 (MonitoX/Gift Exchange dark mode requirement) — structurally satisfied
    - ROADMAP §Phase 21 SC 3 — Gift Exchange contribution complete
tech-stack:
  added: []
  patterns:
    - "Mechanical `dark:` pairing (Phase 18 pattern) — every light-only Tailwind utility paired with appropriate dark variant; no semantic-token refactor (D-12 lock)"
    - "Custom theme tokens (`dark:bg-surface-page`, `dark:bg-surface-card`, `dark:text-typo-heading`, `dark:text-typo-body`, `dark:text-typo-muted`, `dark:border-surface-divider`) used as dark targets where applicable"
    - "Colored chips/badges (blue/yellow/red/green) paired with `dark:bg-{color}-900/30` + `dark:text-{color}-300` / `dark:border-{color}-800` opacity-modified pattern (D-11)"
key-files:
  created:
    - .planning/phases/21-mini-app-dark-mode-sweep/21-03-SUMMARY.md
  modified:
    - src/components/projects/gift-exchange/GiftExchange.vue
    - src/components/projects/gift-exchange/GiftExchangeJoin.vue
    - src/components/projects/gift-exchange/GiftExchangeDraw.vue
    - src/components/projects/gift-exchange/GiftExchangeManage.vue
decisions:
  - "Mechanical sweep was the correct approach — pre-flight inspection confirmed all 4 MonitoX files use light-default utilities (`bg-gray-50`, `bg-white`, `text-gray-900`, `border-gray-200`); no dark-hardcoded structure like LexTrack had"
  - "No status-color utilities (`bg-status-*` / `text-status-*`) found in any of the 4 files — D-13 trivially satisfied without needing exclusions"
  - "Action buttons with `bg-black` / `bg-blue-600` / `bg-red-600` (theme-independent brand/CTA colors) left without dark-pairing — their hover states (`hover:bg-gray-800`, `hover:bg-blue-700`, etc.) are action states on already-dark buttons, intentionally theme-independent"
metrics:
  duration: ~12 minutes
  completed: 2026-05-19
  tasks_completed: 5 (Task 1: GiftExchange.vue; Task 2: GiftExchangeJoin.vue; Task 3: GiftExchangeDraw.vue; Task 4: GiftExchangeManage.vue + build; Task 5: this SUMMARY)
  commits: 4 atomic feature commits + 1 docs commit
---

# Phase 21 Plan 03: MonitoX (Gift Exchange) Dark Mode Summary

Mechanical `dark:` Tailwind pairing applied across all 4 MonitoX
(Gift Exchange) source files so each sub-route (landing, join, draw,
manage) now renders correctly in **both** light and dark themes. Pair-only
sweep — no semantic-token refactor (D-12 lock honored), no status-color
utility paired (D-13 lock honored).

## Deviations from Plan

None — pre-flight inspection confirmed all 4 files were light-default
(opposite of LexTrack's dark-hardcoded state). Plan executed exactly as
written; the precedent-noted "checkpoint if dark-hardcoded" branch did
not trigger.

## Files modified

| File | Lines added | Lines removed | Pairings applied |
|------|---|---|---|
| `GiftExchange.vue` | +31 | -31 | Page bg, card bg, gray text (5 levels), gray borders, yellow code chip, admin panel inner bg, participants table grays, hover state on collapse toggle |
| `GiftExchangeJoin.vue` | +27 | -27 | Page bg, card bg, gray text (4 levels), gray borders, blue lobby info chip (bg+border+text), red lock icon, green success icon, yellow code chip |
| `GiftExchangeDraw.vue` | +20 | -20 | Page bg, card bg, gray text, gray borders, blue lobby info chip, yellow waiting icon, flip-card back panel |
| `GiftExchangeManage.vue` | +45 | -45 | Page bg, card bg, lobby selection grid (selected vs unselected variants), create-lobby modal, all form labels/borders, shareable-link blue chips (`bg-white` codes inside), participants table (header, rows, hover, status pills green/yellow) |

**Total: ~123 line replacements** (slightly above the planner's `~103`
estimate; difference accounts for paired hover states and previously
uncounted nested elements in the manage table).

## Pairings applied — by category

### Surface tokens (auto-switch via Phase 18 `.my-app-dark` block)
- `bg-white` → `dark:bg-surface-card` (cards, code samples in share-link section)
- `bg-gray-50` → `dark:bg-surface-page` (page shell, inset panels)
- `bg-gray-100` → `dark:bg-surface-page` (admin inner panel, table head, drawn-name pill)
- `bg-gray-200` (none present)

### Typography tokens
- `text-gray-900` → `dark:text-typo-heading` (page title, main text color)
- `text-gray-800` → `dark:text-typo-heading` (lobby name in selection grid)
- `text-gray-700` → `dark:text-typo-body` (form labels)
- `text-gray-600` → `dark:text-typo-body` (subheading text, body copy)
- `text-gray-500` → `dark:text-typo-muted` (helper text, code-mono lobby codes, empty states)
- `text-gray-400` → `dark:text-typo-muted` (deep-muted helper text)
- `text-gray-300` → `dark:text-typo-muted` (collapsible toggle)

### Borders
- `border-gray-200` → `dark:border-surface-divider` (panel borders, table dividers)
- `border-gray-300` → `dark:border-surface-divider` (input borders, separator rules)
- `border-gray-100` → `dark:border-surface-divider` (table row dividers)
- `border-b` (no color) → `dark:border-surface-divider` (top divider above footer count, admin table header)

### Colored chips (D-11 opacity-modified pattern)
- Blue (lobby info chip in Join/Draw, "Share These Links" panel in Manage, "Selected lobby" highlight):
  `bg-blue-50` + `border-blue-200` + `text-blue-700/800/900/600` →
  `dark:bg-blue-900/30` + `dark:border-blue-800` + `dark:text-blue-300/400`
- Yellow (code display, "waiting" pill, clock icon):
  `bg-yellow-100` + `border-yellow-300` + `text-yellow-500/600/800` →
  `dark:bg-yellow-900/30` + `dark:border-yellow-700` + `dark:text-yellow-300`
- Green (check-circle icon, "ready" pill, "drawing started" status):
  `text-green-600/800` + `bg-green-100` →
  `dark:text-green-300` + `dark:bg-green-900/30`
- Red (lock icon for "enrollment closed" / "access denied"):
  `text-red-500` → `dark:text-red-300`
  (Note: `bg-red-500`, `bg-red-600` action buttons NOT paired — they are
   theme-independent CTA colors, same pattern as `bg-black`.)

### Theme-independent buttons (intentionally NOT paired)
- `bg-black` action button (Enroll, Validate Lobby, Check Status) and its
  `hover:bg-gray-800` state — black is a theme-independent brand CTA color
- `bg-red-600` action button (Start Drawing Event, Delete Lobby) — brand
  destructive accent, theme-independent
- `bg-blue-600` action button (Create Lobby, Copy Link) — brand primary
  CTA, theme-independent
- These buttons stay visually identical in both themes, matching their
  white text and the LexTrack precedent for `bg-indigo-500` brand pills.

## D-12 / D-13 invariant confirmation

**D-12 (no semantic-token refactor):** All existing light-default
utilities (`bg-white`, `bg-gray-50`, `text-gray-700`, etc.) are
preserved verbatim — only `dark:*` paired variants were appended.
No `bg-white` was replaced with `bg-surface-card`. No re-architecture
of the markup, props, scripts, or computeds. Diff is purely additive
class tokens. **Confirmed compliant.**

**D-13 (status colors stay theme-independent):**

```
grep -E "(bg|text)-status-" src/components/projects/gift-exchange/*.vue
```

Returns **zero matches** across all 4 files. No `--color-status-*`
custom token is used by MonitoX, so D-13 is trivially satisfied —
no exclusion logic needed, the constraint had no surface to violate.

## Anti-regression confirmation

```
git diff --name-only HEAD~4 HEAD
```

returns exactly:

```
src/components/projects/gift-exchange/GiftExchange.vue
src/components/projects/gift-exchange/GiftExchangeDraw.vue
src/components/projects/gift-exchange/GiftExchangeJoin.vue
src/components/projects/gift-exchange/GiftExchangeManage.vue
```

(SUMMARY.md is committed in a separate `docs(21-03)` commit, after
this file is written.)

**None of the locked anti-regression files appear in the diff:**
- `src/main.ts` — untouched
- `src/composables/useTheme.ts` — untouched
- `src/composables/useIsMobile.ts` — untouched
- `src/assets/base.css` — untouched (no new tokens added)
- `src/assets/wallecx-overrides.css` — untouched
- `src/components/projects/wallecx/**` — untouched
- `src/components/projects/lextrack/**` — untouched
- `src/components/projects/larga/**` — untouched
- `src/components/projects/api-playground/**` — untouched
- `src/views/**` — untouched
- `index.html` — untouched

## THEME-11 trace

THEME-11 (MonitoX/Gift Exchange dark mode) decomposes into the four
sub-routes called out in ROADMAP §Phase 21 SC 3 ("Gift Exchange renders
correctly in dark mode across all sub-routes (join, draw, manage,
result)"):

- **Landing / index** (`/projects/gift-exchange`) →
  `GiftExchange.vue` now uses paired `dark:bg-surface-page` shell,
  `dark:bg-surface-card` main card, semantic typo tokens for all text,
  paired yellow code chip, paired green check-circle, paired admin
  participants table.
- **Join sub-route** (`/projects/gift-exchange/join`) →
  `GiftExchangeJoin.vue` now uses paired surface tokens for the 4
  view-states (lobby-code entry, enrollment-closed, enrollment form,
  success), paired blue lobby info chip, paired status icons (red/green).
- **Draw sub-route** (`/projects/gift-exchange/draw`) →
  `GiftExchangeDraw.vue` now uses paired surface tokens for the
  lobby+code login flow and the flip-card "back" panel reveal,
  paired blue lobby info chip, paired yellow waiting state.
- **Manage sub-route** (`/projects/gift-exchange/manage`) →
  `GiftExchangeManage.vue` now uses paired surface tokens for the
  lobby selection grid, create-lobby modal, shareable-links blue panel,
  and the participants management table (header, rows, hover, status
  pills both green and yellow).

The "result" sub-route from SC 3 maps to the flip-card "back" state
inside both `GiftExchange.vue` and `GiftExchangeDraw.vue` — both have
their `bg-white text-black` reveal panels and `text-gray-500` /
`text-gray-400` muted captions paired.

## Verification results

| Check | Command | Exit code |
|---|---|---|
| TypeScript type-check | `npm run type-check` | **0 (PASS)** |
| Production build | `npm run build-only` | **0 (PASS)** — built in 5.76s |

`build-only` emitted the standard chunk-size advisory for `vendor.js`
(unrelated to this plan; identical advisory was present pre-plan).
PWA precache regeneration succeeded (56 entries / 4976.89 KiB).

GiftExchange chunks visible in the build output (`GiftExchangeJoin`,
`GiftExchangeManage`, plus the implicit landing/draw chunks under the
`gift-exchange` route) all built cleanly.

## Acceptance criteria — per-task verification

| Task | Acceptance check | Result |
|---|---|---|
| Task 1 | `grep -E "\b(bg-white\|text-gray-\d+\|border-gray-\d+\|bg-gray-\d+)\b" GiftExchange.vue \| grep -v "dark:"` | ZERO unpaired lines (only `bg-black`/`hover:bg-gray-800` button states remain, intentionally not paired) |
| Task 2 | Same grep against `GiftExchangeJoin.vue` | ZERO unpaired lines |
| Task 3 | Same grep against `GiftExchangeDraw.vue` | ZERO unpaired lines |
| Task 4 | Same grep against `GiftExchangeManage.vue` + `npm run build-only` | ZERO unpaired lines; build PASS |
| All | `grep -E "(bg\|text)-status-" gift-exchange/*.vue \| grep "dark:"` | ZERO matches (D-13) |

Note on remaining `bg-black`/`hover:bg-gray-800`/`bg-red-600`/
`bg-blue-600` lines: these are **theme-independent action button
backgrounds** (and their hover-darken states). Pairing them with
`dark:bg-*` would have made the buttons disappear into the dark
surface or visually inconsistent across themes. Same precedent as
LexTrack's brand indigo CTA decision.

## Known Stubs

None introduced by this plan.

## Threat Flags

None — pair-only Tailwind class additions; no new network endpoints,
auth paths, file access patterns, or schema changes.

## TDD Gate Compliance

N/A — plan type is `execute`, not `tdd`.

## Open items / UAT pending

Visible runtime UAT (375px + ≥640px viewports, light + dark themes)
deferred to consolidated `21-HUMAN-UAT.md` (delivered in plan 21-04
per D-21). Specific items to spot-check during that pass:

1. **Flip-card front panel** (`bg-gradient-to-br from-red-600 to-red-800`)
   on both GiftExchange.vue and GiftExchangeDraw.vue — the red gradient
   is intentionally theme-independent (gift-box brand visual). Verify it
   reads cleanly on both light and dark page backgrounds.
2. **`border-gold` decoration** (`#ffd700` hex in scoped `<style>`) on
   the flip-card back panel — verify gold-on-light-card AND
   gold-on-dark-card both feel festive (no change made here; theme-
   independent decorative accent).
3. **Yellow code display chip** (`bg-yellow-100` light /
   `dark:bg-yellow-900/30` dark) — confirm the 4-character monospace
   code stays prominent against both backgrounds.
4. **Status pills in Manage table** (green "Ready" / yellow "Waiting")
   — confirm the `/30` opacity dark variant gives enough contrast against
   the dark table row hover state.
5. **Lobby selection grid "selected" state** (`border-blue-500 bg-blue-50`
   light / `dark:bg-blue-900/30` dark) vs unselected
   (`border-gray-200 dark:border-surface-divider`) — confirm the
   selected-card emphasis still reads in dark mode.

## Self-Check: PASSED

Verified that all claimed files/commits exist:

- `src/components/projects/gift-exchange/GiftExchange.vue` — FOUND (HEAD)
- `src/components/projects/gift-exchange/GiftExchangeJoin.vue` — FOUND (HEAD)
- `src/components/projects/gift-exchange/GiftExchangeDraw.vue` — FOUND (HEAD)
- `src/components/projects/gift-exchange/GiftExchangeManage.vue` — FOUND (HEAD)
- 4 atomic feature commits exist in `git log`:
  - `8e17b9d` feat(21-03): pair dark: variants on GiftExchange.vue
  - `fc2a017` feat(21-03): pair dark: variants on GiftExchangeJoin.vue
  - `85b4da3` feat(21-03): pair dark: variants on GiftExchangeDraw.vue
  - `5f7d05b` feat(21-03): pair dark: variants on GiftExchangeManage.vue
- `npm run type-check` exited 0
- `npm run build-only` exited 0 (5.76s)
- Anti-regression locked files NOT in `git diff --name-only HEAD~4 HEAD`
- D-12 honored (no semantic-token refactor; pair-only)
- D-13 honored (zero `bg-status-*` / `text-status-*` paired, zero present in MonitoX)
