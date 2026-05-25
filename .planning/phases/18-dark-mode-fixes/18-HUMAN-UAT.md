# Phase 18 Human UAT — Dark Mode Sweep

**Phase:** 18 — Dark Mode Fixes
**Plan:** 18-01
**Created:** 2026-05-18
**Tester:** _________________________
**Date executed:** _________________________
**Result:** [ ] PASS [ ] FAIL [ ] PARTIAL

---

## Scope

This UAT covers the full Wallecx component sweep under `.my-app-dark` after Phase 18 Plan 01 ships the Tailwind v4 `@custom-variant dark` rule and the luminance-based contrast helper in `MembershipCard.vue`.

**Important:** There is **no in-app dark-mode toggle** — that is explicitly out of scope per `REQUIREMENTS.md`. UAT enters dark mode by manually adding the `my-app-dark` class to `<html>` via Chrome / Firefox DevTools (D-11).

---

## 1. DevTools Toggle Instructions (D-11)

**To enter dark mode:**

1. Open DevTools (F12 or Right-click → Inspect)
2. Switch to the **Elements** panel
3. Select the root `<html>` element at the top of the DOM tree
4. Add (or extend) the attribute: `class="my-app-dark"`
   - If `<html>` already has a `class` attribute, append `my-app-dark` to the existing list separated by a space
5. Page should immediately re-render with dark surfaces

**To leave dark mode:**

- Remove the `my-app-dark` class from `<html>` (delete it from the class list); do NOT reload — toggling via DevTools is the only sanctioned UAT path

**Tip:** You can keep `<html>` selected and toggle the class on/off rapidly to A/B compare light vs dark for any given surface.

---

## 2. Pre-Flight Verification

Run this once before starting the sweep. If it fails, **abort UAT** and report — Task 1 of plan 18-01 did not ship correctly.

| Step | Expected | Result |
|------|----------|--------|
| Open `http://localhost:5173/projects/wallecx` (or the deployed URL) | Wallecx app loads | [ ] PASS [ ] FAIL |
| Toggle `.my-app-dark` on `<html>` via DevTools | `<body>` background visibly changes to dark; PrimeVue surfaces (e.g. Card backgrounds in non-Wallecx areas if any) update | [ ] PASS [ ] FAIL |
| Inspect computed styles on any element with a `dark:` Tailwind utility | The `dark:` rule resolves (e.g. `dark:bg-surface-900` produces the dark colour) | [ ] PASS [ ] FAIL |

**If pre-flight fails:** The `@custom-variant dark` rule is missing from `src/assets/base.css` or in the wrong place. Stop UAT, escalate, do not continue with the per-component sweep.

---

## 3. Full Wallecx Component Sweep (D-10)

Every Vue file under `src/components/projects/wallecx/` gets a visual check in both themes, on desktop and mobile. Tick all four columns per row. Add free-form notes for any bleed observed.

**Desktop:** Resize browser to ≥ 1024px wide. **Mobile:** Resize to **375px** wide (iPhone SE / smallest target) via DevTools Device Toolbar.

| # | Component | Light-mode OK? | Dark-mode OK? | Mobile (375px) OK? | Notes |
|---|-----------|:--------------:|:-------------:|:------------------:|-------|
| 1 | `WallecxApp.vue` (app shell) | [ ] | [ ] | [ ] | |
| 2 | `WallecxToolbar.vue` (search + sort + view toggle) | [ ] | [ ] | [ ] | |
| 3 | `VaccinationsTab.vue` | [ ] | [ ] | [ ] | |
| 4 | `VaccinationList.vue` | [ ] | [ ] | [ ] | |
| 5 | `VaccinationGroupCard.vue` | [ ] | [ ] | [ ] | |
| 6 | `VaccinationGroupPanel.vue` (right Drawer on desktop / bottom sheet on mobile) | [ ] | [ ] | [ ] | |
| 7 | `VaccinationDetail.vue` | [ ] | [ ] | [ ] | |
| 8 | `ManageVaccination.vue` (dialog) | [ ] | [ ] | [ ] | |
| 9 | `MembershipsTab.vue` | [ ] | [ ] | [ ] | |
| 10 | `MembershipCard.vue` (tile in grid) | [ ] | [ ] | [ ] | |
| 11 | `MembershipDetail.vue` (centered Dialog on desktop / bottom sheet on mobile) | [ ] | [ ] | [ ] | |
| 12 | `ManageMembership.vue` (dialog) | [ ] | [ ] | [ ] | |
| 13 | `BarcodeDisplay.vue` (within MembershipDetail + within scan overlay) | [ ] | [ ] | [ ] | **BR-2 invariant — see §6** |
| 14 | `AttachmentPreview.vue` | [ ] | [ ] | [ ] | |
| 15 | `PwaInstallBanner.vue` | [ ] | [ ] | [ ] | |

---

## 4. DARK-01 Scenarios — Card Grids

### 4.1 Vaccination Group Cards Grid

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 4.1.1 | Open VaccinationsTab in dark mode, desktop | Group cards have dark card faces (not white); group title / count text legible against the dark surface | [ ] PASS [ ] FAIL |
| 4.1.2 | Same in mobile 375px | One-column layout; cards still dark, text still legible | [ ] PASS [ ] FAIL |
| 4.1.3 | Toggle dark mode off then on while staring at a group card | Card switches without leaving any white border / white interior bleed | [ ] PASS [ ] FAIL |

**Failure signal:** any white card face visible in the vaccination grid in dark mode → DARK-01 regression.

### 4.2 Membership Card Tiles Grid

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 4.2.1 | Open MembershipsTab in dark mode with a card whose `card_color` is dark (e.g. `002244` navy) | Tile background = user's chosen navy; text rows (card name, issuer, expires) render in **white** (`#ffffff`) | [ ] PASS [ ] FAIL |
| 4.2.2 | Open MembershipsTab in dark mode with a card whose `card_color` is light (e.g. `ffff00` pale yellow, `f0f8ff` alice-blue, or any pastel) | Tile background = user's chosen light colour; text rows render in **near-black** (`#0d1117`) — i.e. legible, NOT white | [ ] PASS [ ] FAIL |
| 4.2.3 | Same two cards in **light mode** | Identical contrast behaviour as dark mode — `card_color` is theme-independent (D-06) | [ ] PASS [ ] FAIL |
| 4.2.4 | Inspect a tile with DevTools | The `style` attribute on the Card root contains BOTH `background-color: #....` AND `color: #ffffff` or `color: #0d1117` depending on luminance | [ ] PASS [ ] FAIL |
| 4.2.5 | Verify no white card faces appear in the grid in dark mode | Tile backgrounds use the user's chosen `card_color` — they should never default to white in dark mode | [ ] PASS [ ] FAIL |

**Failure signal:** any pale tile with white text (or any dark tile with near-black text) → luminance helper not applied. Any tile rendered with a white background not matching the stored `card_color` → DARK-01 root-fix regression.

---

## 5. DARK-02 Scenarios — Dialogs + Group Detail

### 5.1 ManageVaccination Dialog (desktop)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 5.1.1 | Click "Add vaccination" in VaccinationsTab while in dark mode | Dialog opens with dark header, dark backdrop, dark body | [ ] PASS [ ] FAIL |
| 5.1.2 | All form inputs (text, date, select, file picker) | Inputs render with dark backgrounds and legible labels | [ ] PASS [ ] FAIL |
| 5.1.3 | Action buttons (Cancel / Save) | Visible and on-brand for dark theme | [ ] PASS [ ] FAIL |

### 5.2 ManageMembership Dialog (desktop)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 5.2.1 | Click "Add membership" in MembershipsTab while in dark mode | Dialog opens with dark surfaces; labels legible | [ ] PASS [ ] FAIL |
| 5.2.2 | ColorPicker swatch interaction | Swatch UI renders correctly in dark mode (NB: PrimeVue #8135 v-model workaround is unrelated to dark mode — just verify the swatch is visible) | [ ] PASS [ ] FAIL |
| 5.2.3 | All form inputs and Save/Cancel buttons | Dark backgrounds, legible labels | [ ] PASS [ ] FAIL |

### 5.3 VaccinationGroupPanel (drawer / bottom sheet)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 5.3.1 | Click a vaccination group at **desktop ≥ 640px** in dark mode | Right-side Drawer opens with dark `bg-surface-900` background, light text (`dark:text-surface-400`), dark `dark:border-surface-700` border (Phase 17 utilities) | [ ] PASS [ ] FAIL |
| 5.3.2 | Click a vaccination group at **mobile < 640px** in dark mode | Drawer slides up from the bottom (bottom sheet), dark surface, legible text | [ ] PASS [ ] FAIL |
| 5.3.3 | The drag handle pill at the top of the mobile bottom sheet | Pill is **dark grey** (`bg-gray-600`); NOT light grey. Toggle dark mode off → pill turns light grey (`bg-gray-300`). This proves D-09 carry-forward fires after D-01. | [ ] PASS [ ] FAIL |

### 5.4 MembershipDetail (dialog / bottom sheet)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 5.4.1 | Click a membership card in **desktop ≥ 640px** in dark mode | Centered Dialog opens with dark surface | [ ] PASS [ ] FAIL |
| 5.4.2 | Click a membership card in **mobile < 640px** in dark mode | Bottom sheet slides up; dark surface; drag pill is dark grey (`bg-gray-600`) | [ ] PASS [ ] FAIL |
| 5.4.3 | The 4×4 `card_color` swatch on the detail surface | Swatch shows the user's chosen `card_color` (unmodified); the `#<hex>` label next to it uses `var(--color-typo-body)` and is legible in both themes | [ ] PASS [ ] FAIL |
| 5.4.4 | BarcodeDisplay inside the detail | Renders correctly (see §6 for BR-2 invariant) | [ ] PASS [ ] FAIL |

**Failure signal:** white dialog header, white border around dialog/drawer, light input fields inside an otherwise-dark dialog → DARK-02 regression (variant rule didn't reach teleported DOM, or a `dark:` utility is missing on a specific element).

---

## 6. DARK-03 Scenarios — Scan Overlay + BarcodeDisplay

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 6.1 | Open a membership card's "Scan" button (renders the full-screen overlay) in dark mode | Overlay covers viewport; close button (top-right) visible | [ ] PASS [ ] FAIL |
| 6.2 | **CRITICAL — BR-2 invariant (D-07):** the rendered barcode itself | Barcode strokes are **BLACK** (`#000000`) on a **WHITE** (`#ffffff`) background, in BOTH light and dark themes. Inspect via DevTools if uncertain. | [ ] PASS [ ] FAIL |
| 6.3 | Chrome around BarcodeDisplay (labels, container, surrounding area) | Renders correctly for the active theme; the barcode card area itself stays black-on-white | [ ] PASS [ ] FAIL |
| 6.4 | Scan overlay surrounding-area background (the `position:fixed inset:0` surface around the barcode) | Renders correctly in both themes (currently hardcoded `#ffffff` per D-08; visually verify no bleed surrounds the barcode that breaks scannability) | [ ] PASS [ ] FAIL |
| 6.5 | Close the overlay | Returns to MembershipDetail; no orphaned overlay artefacts; wake lock released (battery indicator returns to normal on phone) | [ ] PASS [ ] FAIL |

**If 6.2 fails:** This is a **BR-2 regression** — someone touched `BARCODE_FOREGROUND` or `BARCODE_BACKGROUND` in `BarcodeDisplay.vue`. Flag immediately and revert.

---

## 7. Mobile-Specific Sweep (375px viewport, dark mode active)

Resize the browser viewport to exactly **375px wide** AND ensure `.my-app-dark` is on `<html>`.

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 7.1 | VaccinationsTab card grid at 375px | One-column layout; cards dark; no horizontal scroll | [ ] PASS [ ] FAIL |
| 7.2 | MembershipsTab card grid at 375px | One-column layout; tiles preserve user `card_color`; legible foreground per luminance | [ ] PASS [ ] FAIL |
| 7.3 | VaccinationGroupPanel as bottom sheet | Slides up from bottom; drag pill is **dark grey** (D-09 carry-forward) | [ ] PASS [ ] FAIL |
| 7.4 | MembershipDetail as bottom sheet | Slides up from bottom; drag pill is **dark grey**; content scrolls within sheet | [ ] PASS [ ] FAIL |
| 7.5 | ManageVaccination and ManageMembership dialogs at 375px | Dialog content cap respected (80dvh per Phase 15 D-06); dark surface; no horizontal scroll | [ ] PASS [ ] FAIL |
| 7.6 | Toolbar grid/list view toggle on VaccinationsTab at 375px | Toggle is HIDDEN (MOB-09 from Phase 17); does not break dark-mode layout | [ ] PASS [ ] FAIL |

---

## 8. Failure-Mode Catalog — What Light-Mode Bleed Looks Like

Use this as a quick visual reference while sweeping. If you see any of the following, record it under the "Notes" column of the relevant Sweep row in §3, and capture the component name + selector for follow-up.

| Symptom | Likely Cause | Diagnostic |
|---------|--------------|------------|
| White card face in a grid while in dark mode | DARK-01 regression — `@custom-variant dark` rule is missing or malformed | Check `src/assets/base.css` line 2–3 for the exact rule from D-01; rebuild |
| White header / white border on a Dialog or Drawer in dark mode | DARK-02 regression — a PrimeVue CSS variable isn't switching for `.my-app-dark` | Inspect `--p-dialog-background` / `--p-drawer-background` in computed styles; may need a targeted `wallecx-overrides.css` rule under D-03/D-04 (follow-up plan) |
| Light input field inside an otherwise-dark dialog | DARK-02 regression — a Tailwind `dark:` utility isn't firing OR PrimeVue input variable not aligned | Confirm pre-flight test 2 still passes; if so, the input lacks a `dark:` utility — record component + line |
| Drag handle pill is light grey on a mobile bottom sheet in dark mode | D-09 regression — `dark:bg-gray-600` isn't firing | Re-check `@custom-variant dark` rule placement; rebuild |
| Barcode rendered with any colour combination other than pure black on pure white | DARK-03 / BR-2 regression — `BarcodeDisplay.vue` constants were touched | Stop UAT immediately; `BARCODE_FOREGROUND` / `BARCODE_BACKGROUND` are locked invariants |
| Membership tile text unreadable on its `card_color` (e.g. white on pale yellow) | Luminance helper not applied — Task 2 regression | Inspect tile root in DevTools; the `style` attribute MUST include both `background-color:` and a luminance-derived `color:` |
| User-chosen `card_color` modified in dark mode (e.g. desaturated or replaced) | D-05 violation | The implementation should NEVER touch `props.record.card_color`; only the computed text foreground changes |
| Bleed not listed above on a Wallecx component | Component-specific gap | Record under §3 "Notes" column. A follow-up plan may add a targeted `src/assets/wallecx-overrides.css` rule under D-03; do NOT add overrides pre-emptively |

---

## 9. Sign-Off

| Field | Value |
|-------|-------|
| Tester name | _________________________ |
| UAT date | _________________________ |
| Overall result | [ ] PASS [ ] FAIL [ ] PARTIAL |
| Components sweep complete (15/15)? | [ ] YES [ ] NO — list missing: ____________ |
| Critical findings (BR-2, D-05 violations, etc.)? | _________________________ |
| Deferred items (record-but-don't-block) | _________________________ |
| Recommended follow-up plan? | [ ] None — ship as-is [ ] Targeted overrides in `wallecx-overrides.css` (list selectors): _________________________ |
| Signature | _________________________ |

---

*Phase 18 Plan 01 UAT — generated from `18-CONTEXT.md` D-10 and D-11, and `REQUIREMENTS.md` DARK-01/02/03.*
*Override rules are NOT pre-listed here per D-03 — overrides are added only if UAT reveals bleed that D-01 alone doesn't fix.*

---

## Phase 30 UAT Results

**Date executed:** 2026-05-25 (Phase 30 sweep)
**Overall:** ✓ PASS

| Section | Total | Passed | Failed | Skipped | Notes |
|---------|-------|--------|--------|---------|-------|
| §2 Pre-flight | 3 | 3 | 0 | 0 | `@custom-variant dark` rule confirmed in place |
| §3 Component sweep (15 Wallecx components × 3 viewports) | 15 | 15 | 0 | 0 | All components render correctly across light/dark/375px |
| §4 DARK-01 card grids (vaccination groups + membership tiles) | 8 | 8 | 0 | 0 | Luminance helper applied correctly; no white card faces |
| §5 DARK-02 dialogs + drawers | 13 | 13 | 0 | 0 | All dialogs/drawers themed correctly; drag pills dark grey; ColorPicker swatch visible |
| §6 DARK-03 scan overlay + barcode (BR-2 invariant) | 5 | 5 | 0 | 0 | **BR-2 invariant holds** — barcode strokes #000000 on #ffffff in BOTH themes |
| §7 Mobile 375px sweep | 6 | 6 | 0 | 0 | Drag pills dark grey; no horizontal scroll; dialogs respect 80dvh cap |

### Failures
None — all 50 section-level checks pass.

### Critical Findings
- **BR-2 invariant verified** — barcode foreground/background constants preserved; no regression
- No DARK-01/02/03 regressions detected
- No D-05 violations (user-chosen `card_color` is theme-independent and not mutated)

### Sign-off
- Tester: Phase 30 sweep (user-driven)
- Date: 2026-05-25
- Overall result: ✓ PASS
- Components sweep complete (15/15): YES
- Recommended follow-up: None — ship as-is
