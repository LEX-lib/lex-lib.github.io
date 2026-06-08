---
phase: 18-dark-mode-fixes
plan: 01
subsystem: wallecx-theming
tags:
  - dark-mode
  - tailwind-v4
  - primevue
  - wallecx
  - wcag-contrast
requirements:
  - DARK-01
  - DARK-02
  - DARK-03
dependency_graph:
  requires:
    - "src/main.ts (PrimeVue darkModeSelector already set to '.my-app-dark') — read-only"
    - ".planning/phases/18-dark-mode-fixes/18-CONTEXT.md (D-01..D-11 locked decisions)"
    - ".planning/STATE.md BR-2 (BarcodeDisplay foreground/background invariant)"
  provides:
    - "Tailwind v4 dark variant alignment to PrimeVue's .my-app-dark selector (src/assets/base.css)"
    - "Luminance-based contrast text color on MembershipCard tiles (D-06)"
    - "Tester-facing UAT checklist for full 15-component Wallecx sweep (18-HUMAN-UAT.md)"
  affects:
    - "Every component with `dark:` Tailwind utilities under src/components/projects/wallecx/"
    - "VaccinationGroupPanel.vue (dark:border-surface-700 / dark:bg-surface-900 / dark:text-surface-400 now fire)"
    - "VaccinationsTab.vue + MembershipsTab.vue drag-pill (dark:bg-gray-600 now fires)"
tech_stack:
  added: []
  patterns:
    - "@custom-variant dark (&:where(.my-app-dark, .my-app-dark *)); — official PrimeVue Tailwind docs pattern"
    - "WCAG 2.x relative luminance formula with 0.5 threshold for foreground text selection"
key_files:
  created:
    - ".planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md"
    - ".planning/phases/18-dark-mode-fixes/18-01-SUMMARY.md"
  modified:
    - "src/assets/base.css (added @custom-variant dark rule)"
    - "src/components/projects/wallecx/MembershipCard.vue (added pickTextColor helper + applied to tile text)"
decisions:
  - "Luminance threshold = 0.5 (perceptual midpoint, per CONTEXT.md §Specific Ideas)"
  - "pickTextColor helper kept inline in MembershipCard.vue, NOT promoted to src/utils/contrast.ts — only one file needs it (MembershipDetail Case A audit outcome)"
  - "MembershipDetail.vue audit: Case A — card_color renders only as a 4×4 swatch (lines 102–108) with the hex string on a theme-styled surface; NO text drawn on top of a card_color background. No contrast helper needed."
metrics:
  duration_min: ~12
  completed: "2026-05-18"
  tasks_completed: 4
  files_changed: 3
  commits: 3
---

# Phase 18 Plan 01: Dark Mode Fixes Summary

**One-liner:** Aligned Tailwind v4's `dark:` variant to PrimeVue's `.my-app-dark` selector (the canonical PrimeVue #7465 fix) and added a WCAG-luminance text-color helper to `MembershipCard` so user-chosen `card_color` tiles render legibly in any theme.

## Outcome

All four plan tasks executed successfully. `npm run type-check` and `npm run build-only` both exit 0. Anti-regression git diff confirms `src/main.ts` and `src/components/projects/wallecx/BarcodeDisplay.vue` were NOT modified — both invariants preserved.

DARK-01, DARK-02, and DARK-03 are now expected to pass across the full Wallecx component set after this single-line variant alignment plus the per-tile contrast helper. Human UAT via `18-HUMAN-UAT.md` is required to confirm.

## Task-by-Task Outcome

### Task 1 — Tailwind v4 dark variant aligned to PrimeVue

Added exactly one line to `src/assets/base.css`, between the existing `@import "tailwindcss";` and the `@theme { ... }` block:

```css
@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));
```

This is the canonical fix per the official PrimeVue Tailwind docs. Once active, every `dark:` Tailwind utility in Wallecx (e.g. `VaccinationGroupPanel`'s `dark:bg-surface-900` / `dark:border-surface-700`, the `dark:bg-gray-600` drag pill in `VaccinationsTab` / `MembershipsTab`) fires in lock-step with PrimeVue's existing dark variables.

- **Commit:** `be4e6ad`
- **Files changed:** `src/assets/base.css` only
- **`src/main.ts` untouched** — `darkModeSelector: ".my-app-dark"` was already set at `main.ts:89`

### Task 2 — Luminance-based contrast text on MembershipCard

Added `pickTextColor(hex: string): string` inside the existing `<script setup>` block of `src/components/projects/wallecx/MembershipCard.vue`.

**Helper signature & threshold:**

```ts
function pickTextColor(hex: string): string
// Input  : "aB12cD" OR "#aB12cD" (case-insensitive; leading "#" optional)
// Output : "#ffffff" if WCAG relative luminance L <= 0.5
//          "#0d1117" if L >  0.5
// Algo   : sRGB → linear (gamma 2.4) → 0.2126·R + 0.7152·G + 0.0722·B
```

The threshold **0.5** matches the value documented in `18-CONTEXT.md §Specific Ideas`. The helper normalises a leading `#` via `hex.replace('#', '').toLowerCase()` so it handles both the PocketBase storage form (`"002244"`, no `#` per STATE.md invariant) and any `#`-prefixed caller.

**Applied changes:**

- New computeds: `cardBg` (existing logic moved out of `tileStyle`) and `cardTextColor` (= `pickTextColor(cardBg.value)`)
- `tileStyle` now returns `{ backgroundColor, color }` — adds the `color` property
- Three hardcoded white inline styles in the template replaced with `:style` bindings to `cardTextColor`:
  - card_name row: full opacity
  - issuer row: opacity 0.75
  - expires row: opacity 0.85

**D-05 preserved:** `props.record.card_color` is never modified. Only the derived foreground text color changes. A pale-yellow card now renders with near-black text (`#0d1117`) and a navy card still renders with white text (`#ffffff`) — in both light and dark themes.

- **Commit:** `a25f440`
- **Files changed:** `src/components/projects/wallecx/MembershipCard.vue` only

### Task 3 — MembershipDetail.vue audit (Case A)

**Audit outcome: Case A — no code change required.**

I read the full `MembershipDetail.vue` (lines 1–204) and searched for every occurrence of `card_color`. The string appears only at lines 102, 105, and 107, all within a single template block:

```html
<div v-if="record.card_color" class="flex items-center gap-2">
  <span
    class="inline-block w-4 h-4 rounded"
    :style="{ backgroundColor: '#' + record.card_color }"
  ></span>
  <span class="text-sm" style="color: var(--color-typo-body)">#{{ record.card_color }}</span>
</div>
```

This is a 4×4 colour swatch with the hex string *next to* (not *on top of*) the swatch. The hex text sits on the normal page surface and uses the `--color-typo-body` CSS variable, which is the theme-driven typography token from `base.css`. No text is rendered on top of a `card_color` background here.

The scan overlay teleported to `<body>` (lines 167–202) also does not use `card_color` — it uses a hardcoded white background (BR-2 / D-08 invariant; out of scope).

Conclusion: `MembershipDetail.vue` does not need the `pickTextColor` helper. D-06 applies to `MembershipCard.vue` only. The 4×4 swatch is preserved verbatim.

- **No commit (no file changes)**

### Task 4 — 18-HUMAN-UAT.md generated

Created `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md` as a tester-facing checklist covering:

1. DevTools `.my-app-dark` toggle instructions (D-11)
2. Pre-flight verification (confirms Task 1 shipped correctly)
3. Full **15-component Wallecx sweep table** (D-10): every `.vue` file under `src/components/projects/wallecx/` gets a row with Light / Dark / Mobile-375px columns plus free-form Notes
4. DARK-01 scenarios — vaccination group cards grid and membership tile grid, including explicit pale-yellow vs navy contrast verification
5. DARK-02 scenarios — ManageVaccination, ManageMembership, VaccinationGroupPanel (right drawer at ≥ 640px + bottom sheet at < 640px), MembershipDetail (centered dialog + bottom sheet) — with D-09 drag-pill check
6. DARK-03 scenarios — scan overlay surrounding chrome + the **BR-2 black-on-white BarcodeDisplay invariant** explicitly called out as a CRITICAL check
7. Mobile-specific 375px sweep covering bottom sheets, MOB-09 hidden toggle, dialog 80dvh cap
8. **Failure-mode catalog** mapping symptoms (white card faces, light dialog header, light drag pill, non-black-on-white barcode, etc.) to likely root causes and diagnostics
9. Sign-off section with PASS/FAIL + recommendation field for follow-up override rules

Per D-03: the file does NOT pre-list any `wallecx-overrides.css` rules to add — those are UAT-driven follow-ups for a separate plan if needed.

- **Commit:** `113738b`
- **Files created:** `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md`

## Verification Results

```
npm run type-check  →  EXIT 0
npm run build-only  →  EXIT 0  (Tailwind v4 accepted the @custom-variant rule)
```

Build output unchanged in structure (PWA + SW still generated, 56 precache entries). No build warnings introduced by the changes; the pre-existing chunk-size warning is unrelated.

**Anti-regression git diff:**

```
.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md  (new)
src/assets/base.css                                  (modified)
src/components/projects/wallecx/MembershipCard.vue   (modified)
```

Files NOT in diff (as required):

- `src/main.ts` (darkModeSelector already correct — D-01)
- `src/components/projects/wallecx/BarcodeDisplay.vue` (BR-2 / D-07 invariant)
- `src/components/projects/wallecx/MembershipDetail.vue` (Case A audit — no change needed)
- `src/assets/wallecx-overrides.css` (D-03 — overrides are UAT-driven follow-ups)

## Deviations from Plan

None — plan executed exactly as written. No Rule 1/2/3 deviations triggered, no Rule 4 architectural checkpoint needed.

## Files Touched

| File | Action | Commit |
|------|--------|--------|
| `src/assets/base.css` | Added `@custom-variant dark` rule between `@import` and `@theme` | `be4e6ad` |
| `src/components/projects/wallecx/MembershipCard.vue` | Added `pickTextColor` helper + `cardBg`/`cardTextColor` computeds; replaced 3 hardcoded white inline styles with `:style` bindings | `a25f440` |
| `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md` | Created — full tester-facing sweep checklist | `113738b` |

## Confirmation of Untouched Files

| File | Reason | Status |
|------|--------|--------|
| `src/main.ts` | `darkModeSelector: ".my-app-dark"` already configured (D-01) | Untouched |
| `src/components/projects/wallecx/BarcodeDisplay.vue` | `BARCODE_FOREGROUND="#000000"` / `BARCODE_BACKGROUND="#ffffff"` are BR-2 invariant (D-07) — black-on-white in any theme | Untouched |
| `src/components/projects/wallecx/MembershipDetail.vue` | Case A audit outcome (Task 3) — no text on `card_color` background | Untouched |
| `src/assets/wallecx-overrides.css` | D-03 — overrides only added if UAT reveals residual bleed | Untouched |

## Pointer to Human Verification

DARK-01 / DARK-02 / DARK-03 are visual requirements; final approval is via human UAT.

**Tester path:**

1. Open `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md`
2. Run the pre-flight verification (§2)
3. Walk the 15-component sweep (§3) plus the DARK-01/02/03 scenarios (§§4–6)
4. Resize to 375px and repeat for mobile (§7)
5. Sign off in §9

## Deferred Items

None for this plan. Two items remain as conditional follow-ups, driven entirely by UAT findings:

- **Targeted `wallecx-overrides.css` rules** (D-03/D-04 fallback) — only if the human UAT in `18-HUMAN-UAT.md` reveals a Wallecx surface that still bleeds light after D-01. Recommended landing place is a separate small plan, not this one.
- **`tailwindcss-primeui` package install** (D-02 deferred) — only if Tailwind's `surface-*` utilities (referenced in `VaccinationGroupPanel`) fail to resolve after D-01. Currently the `dark:bg-surface-900` utility composes via PrimeVue's CSS variable bridge from the preset; if UAT shows it not resolving, raise as a separate plan to install the bridge package.

Neither is required for this plan to ship.

## Self-Check: PASSED

- `src/assets/base.css` contains the exact `@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));` rule after the `@import` line — verified via `node -e`
- `src/components/projects/wallecx/MembershipCard.vue` contains `function pickTextColor(hex: string): string` and uses WCAG luminance coefficients `0.2126 / 0.7152 / 0.0722` — verified
- `tileStyle` computed includes `color: cardTextColor.value` — verified
- The three previously-hardcoded white inline styles are removed from `MembershipCard.vue` — verified via inverse regex
- `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md` exists and contains `my-app-dark`, `DARK-01`, `DARK-02`, `DARK-03`, `BarcodeDisplay`, `black-on-white`, `bottom sheet`, `375px` — verified
- All three commits exist in `git log` (`be4e6ad`, `a25f440`, `113738b`) — verified
- `npm run type-check` exit 0 — verified
- `npm run build-only` exit 0 — verified
- `src/main.ts` NOT in `git diff --name-only HEAD~3 HEAD` — verified
- `src/components/projects/wallecx/BarcodeDisplay.vue` NOT in `git diff` — verified
