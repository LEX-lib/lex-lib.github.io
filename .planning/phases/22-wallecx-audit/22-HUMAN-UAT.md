# Phase 22 — Wallecx Audit · Human UAT

**Phase:** 22 — Wallecx Audit (v3.0 milestone closer)
**Plan:** 22-01
**Generated:** 2026-05-19
**Status:** Ready for human verification
**Tester:** _________________________
**Date executed:** _________________________
**Result:** [ ] PASS [ ] FAIL [ ] PARTIAL

> v3.0 milestone closer — confirms Phase 18's Wallecx dark mode still holds with the NavBar toggle (Phase 19) wired up. This is a **6-vector regression spot-check**, not a re-walk of Phase 18's full 15-component sweep (per 22-CONTEXT D-01).

---

## How to toggle the theme

The Phase 19 NavBar sun/moon button is the primary entry point. The DevTools fallback is documented for edge cases.

### Primary path — NavBar toggle (Phase 19)

1. Click the sun/moon button in the `CustomNavBar` header (visible on every route, including `/projects/wallecx`)
2. Icon flips immediately; `useTheme` writes the new value to `localStorage` under the key `lexarium:theme`
3. `.my-app-dark` is added to / removed from `<html>` synchronously; first paint on subsequent loads matches the stored value via the inline FOUC script in `index.html`

### Fallback — DevTools manual toggle

Useful when reproducing a specific edge case (e.g., toggling mid-dialog without triggering the NavBar button's click handler):

1. Open DevTools (F12) → **Elements** panel
2. Select the root `<html>` element
3. Add (or extend) the attribute `class="my-app-dark"` — append to existing classes separated by a space
4. To leave dark mode, remove the class. **Do not reload** — let the class change drive the re-paint

### First-visit default

OS preference (`prefers-color-scheme: dark`) seeds the initial theme on a fresh browser profile per Phase 19 D-06. `localStorage.lexarium:theme` overrides on subsequent visits.

---

## Pre-flight verification

Before walking the vectors, confirm the toggle is wired up correctly. If pre-flight fails, abort UAT — Phase 19's infrastructure regressed independently of Phase 22.

| Step | Expected | Result |
|------|----------|--------|
| `npm run dev` and open `/projects/wallecx` in a Chromium browser | Wallecx loads; NavBar visible with a sun/moon button | [ ] PASS [ ] FAIL |
| Click the NavBar toggle | `<html>` gains `.my-app-dark`; page bg flips to dark; icon swaps | [ ] PASS [ ] FAIL |
| Refresh the page (Ctrl+R) while dark | First paint is already dark; no white flash | [ ] PASS [ ] FAIL |
| Inspect `localStorage` in DevTools → Application | Key `lexarium:theme` is `"dark"` | [ ] PASS [ ] FAIL |

---

## Vector 1: Toggle interaction (mid-Wallecx, with dialog open) — SC-1

**Why it matters:** Phase 18 confirmed the static `.my-app-dark` Wallecx surfaces. Phase 19 added the runtime toggle. This vector confirms PrimeVue dialog/drawer surfaces re-paint live without dismounting, including teleported DOM.

1. Open `/projects/wallecx` in **LIGHT** mode
2. Click the NavBar sun/moon button
   - **Expect:** NavBar icon flips · page background goes dark · `VaccinationsTab` group cards switch to dark surface · `MembershipsTab` tiles keep the user's `card_color` with contrast-aware text (Phase 18 `pickTextColor` luminance helper still firing)
3. Open the **Add Vaccination** dialog (`ManageVaccination.vue`) — leave it open
4. Click the NavBar toggle again (light → dark, or dark → light) while the dialog is mounted
   - **Expect:** dialog body re-paints immediately to the new theme · no white flash on the dialog surface · form inputs (text, date, file) adapt · Save / Cancel buttons stay legible · backdrop dims correctly
5. Close the dialog. Repeat steps 3–4 with the **Add Membership** dialog (`ManageMembership.vue`)
   - **Expect:** same behaviour · `ColorPicker` swatch panel adapts · the chosen `card_color` swatch itself is theme-independent (user's input is not mutated by the toggle)

**Failure signal:** dialog body retains the old theme until reopen → DARK-02 / variant-alignment regression. Surfacing only the dialog header → teleport-DOM variant-rule miss.

---

## Vector 2: Route transitions (theme persistence) — SC-2

**Why it matters:** Confirms `useTheme` survives Vue Router navigation and that no route-level reset clobbers `.my-app-dark` on `<html>`.

1. On `/projects/wallecx` in **dark** mode, navigate to `/projects`
   - **Expect:** still dark · no flash · projects index shell respects theme
2. Navigate back to `/projects/wallecx`
   - **Expect:** still dark on re-entry · no FOUC on the Wallecx shell
3. Walk this full circuit (each step should keep the theme):
   - `/projects/wallecx` (dark) → `/` (home) → `/blog` → `/projects/lextrack` → back to `/projects/wallecx`
   - **Expect:** dark across all routes · no transient white background between route transitions · Wallecx renders dark on re-entry
4. Repeat the full circuit starting from **light** mode
   - **Expect:** light persists across all routes; no surprise dark surface bleeds through

**Failure signal:** Wallecx flashes white on re-entry → Phase 18 token override wasn't applied before the first paint of the lazy-loaded chunk.

---

## Vector 3: FOUC on hard reload while dark — SC-2

**Why it matters:** The Phase 19 inline FOUC script in `index.html` reads `localStorage.lexarium:theme` and applies `.my-app-dark` to `<html>` before Vue mounts. Combined with Phase 18's `.my-app-dark` overrides in `base.css`, Wallecx should never flash white on a cold reload.

1. With Wallecx in **dark** mode, hard refresh (Ctrl+F5 / Cmd+Shift+R)
   - **Expect:** first paint is already dark · no white flash · NavBar moon icon already shown · Wallecx grid shell is dark
2. Switch to the **vaccinations** tab; hard refresh
   - **Expect:** same — no FOUC, no white flash on the vaccinations grid
3. Switch to the **memberships** tab; hard refresh
   - **Expect:** same — no FOUC; membership tiles paint with the user's `card_color` and the luminance-aware text immediately
4. Toggle to **light** mode; hard refresh
   - **Expect:** first paint is already light · NavBar sun icon already shown

**Failure signal:** white flash visible (even briefly) → inline FOUC script regression (Phase 19) OR a `.my-app-dark` override is gated on JS that runs after first paint.

---

## Vector 4: Bottom sheets in dark mode — SC-1

**Why it matters:** Phase 17 added the bottom-sheet pattern; Phase 18 added the drag-pill dark variant (`bg-gray-300 dark:bg-gray-600`); Phase 19's toggle now drives `dark:`. Confirms the carry-forward chain still fires when the toggle is the trigger (not a DevTools class poke).

1. Resize browser to **< 640px** (or DevTools Device Toolbar → iPhone SE 375px)
2. In **dark** mode on the **vaccinations** tab: tap any group card
   - **Expect:** drawer slides up from the bottom · drawer body has a dark background · drag handle pill is visible (`bg-gray-600` against the dark drawer) · group records list is legible · edit / delete actions visible
3. Repeat for the **membership** card detail bottom sheet (tap any membership tile in mobile dark mode)
   - **Expect:** same — dark drawer surface · legible content · drag pill visible · close affordance reachable
4. **Toggle theme WHILE a bottom sheet is open** (use the NavBar button — reach it via a desktop-width device toolbar emulating mobile width if needed, or use the DevTools fallback)
   - **Expect:** drawer re-paints to the new theme without dismissing · drag pill swaps from `bg-gray-600` (dark) to `bg-gray-300` (light) live · scroll position preserved

**Failure signal:** drag pill stays light grey on dark drawer → `dark:bg-gray-600` not firing under runtime toggle. Drawer body white → DARK-02-class regression in `wallecx-overrides.css` for `.p-drawer-bottom`.

---

## Vector 5: BarcodeDisplay BR-2 invariant — SC-4

**Why it matters:** BR-2 (locked in Phase 12 / STATE.md) requires the barcode to render black-on-white in **both** themes. The constants `BARCODE_FOREGROUND = '#000000'` and `BARCODE_BACKGROUND = '#ffffff'` in `BarcodeDisplay.vue` are theme-independent. This vector confirms no Phase-19/20/21 change accidentally inverted or theme-coupled the barcode rectangle.

1. Open any membership card that has a barcode (open `MembershipDetail` — dialog on desktop, bottom sheet on mobile)
2. In **LIGHT** mode:
   - **Expect:** barcode strokes are **BLACK** on a **WHITE** rectangle · surrounding dialog chrome is light
3. Toggle to **DARK** mode (NavBar button — keep the same membership detail open)
   - **Expect:** barcode strokes are **STILL BLACK** on a **STILL WHITE** rectangle · ONLY the surrounding dialog/sheet chrome adapts to dark · the barcode rectangle itself is visually unchanged
4. Inspect via DevTools (computed styles on the canvas/svg root)
   - **Expect:** the rendered fill / stroke values are literally `#000000` and `#ffffff` (or equivalent rgb)
5. Open the full-screen **scan overlay** (the `/projects/wallecx` scan flow) for the same card
   - **Expect:** barcode in the overlay is also black-on-white in BOTH themes · close button reachable in both themes

**Failure signal:** any non-black barcode stroke, any non-white barcode rectangle, or any theme-coupled inversion → **BR-2 regression**. Stop UAT immediately and revert the offending change to `BarcodeDisplay.vue`.

---

## Vector 6: PWA standalone install + toggle + re-open — SC-3

**Why it matters:** Phase 14 shipped the PWA; Phase 19 added the toggle. This vector confirms the toggle works identically inside the installed PWA window and that the choice persists across hard-close / re-open. Per 22-CONTEXT D-07, this is a UAT step (not a code task).

1. Install Wallecx as a PWA:
   - **Chrome:** DevTools → Application → Manifest → Install, OR the install icon in the address bar
   - **Phone:** Add to Home Screen
2. Open the installed standalone window/app
   - **Expect:** standalone chrome (no browser tab) · Wallecx renders · NavBar toggle button is reachable on every route (Phase 19 D-toggle visible)
3. Toggle to **dark** mode inside the standalone window
   - **Expect:** Wallecx re-paints to dark · `localStorage.lexarium:theme` updates within the standalone context
4. Hard-close the standalone (force quit on mobile / close the standalone window on desktop)
5. Re-open the standalone
   - **Expect:** chosen theme persists · first paint is dark (FOUC script fires inside the standalone too) · no white flash · NavBar moon icon already shown
6. Walk a quick sanity loop inside the standalone: open a vaccination group → toggle theme → close drawer → switch tabs
   - **Expect:** identical behaviour to the in-browser flow

> **Informational, not a fail:** iOS standalone has a known 7-day localStorage eviction window. If testing across an eviction event, the theme should fall back gracefully to OS-preference + first-visit default per Phase 19 D-06. This is documented and not a Phase 22 regression.

**Failure signal:** standalone shows the NavBar toggle but clicking it does not update `.my-app-dark` → `useTheme` regression in standalone context. Theme does not persist across hard close → localStorage eviction earlier than the 7-day window (separate concern; document and continue).

---

## Sign-off

| Vector | Description | Pass | Fail | Notes |
|--------|-------------|:----:|:----:|-------|
| 1 | Toggle interaction (mid-Wallecx + dialog open) — SC-1 | [ ] | [ ] | |
| 2 | Route transitions (theme persistence) — SC-2 | [ ] | [ ] | |
| 3 | FOUC on hard reload while dark — SC-2 | [ ] | [ ] | |
| 4 | Bottom sheets in dark mode — SC-1 | [ ] | [ ] | |
| 5 | BarcodeDisplay BR-2 invariant — SC-4 | [ ] | [ ] | |
| 6 | PWA standalone install + toggle + re-open — SC-3 | [ ] | [ ] | |

| Field | Value |
|-------|-------|
| Approved by | _________________________ |
| Date | _________________________ |
| Overall result | [ ] PASS [ ] FAIL [ ] PARTIAL |
| Critical findings (BR-2 violations, etc.) | _________________________ |
| Opportunistic fix needed (per D-03)? | [ ] None [ ] `wallecx-overrides.css` selector(s): _________________________ |

On approval, run `/gsd-complete-milestone` to archive v3.0.

---

## Anti-regression reminder (footer)

No Wallecx source files were modified by Phase 22's plan. Per 22-CONTEXT D-01, this is a **spot-check on 6 regression vectors**, not a re-walk of Phase 18's full 15-component sweep (already approved in Phase 18 UAT).

If any vector fails, the executor should open an **opportunistic fix** in `src/assets/wallecx-overrides.css` using the Phase 18 selector pattern (`.my-app-dark .p-*`), per D-03 — and **NOT** modify any locked file per D-04:

- `src/main.ts`, `src/composables/useTheme.ts`, `src/composables/useIsMobile.ts`
- `src/assets/base.css`, `index.html`
- `src/components/CustomNavBar.vue`, `HeroSection.vue`, `AboutMeSection.vue`, `Login.vue`
- All `src/views/**`
- All `src/components/projects/{lextrack,larga,gift-exchange,api-playground}/**`
- `src/components/projects/wallecx/BarcodeDisplay.vue` (BR-2 constants `#000000` / `#ffffff`)

Per D-05, BarcodeDisplay constants are an absolute hard lock — any deviation is a BR-2 regression and is in scope for immediate revert, not opportunistic polish.

---

*Phase 22 Plan 01 UAT — generated per 22-CONTEXT D-01 (6-vector spot-check) and D-08 (deliverables list). Format mirrors `21-HUMAN-UAT.md`.*

---

## Phase 30 UAT Results

**Date executed:** 2026-05-25 (Phase 30 sweep)
**Overall:** ✓ PASS (with V6 deferred)

| Vector | Description | Result | Notes |
|--------|-------------|--------|-------|
| Pre-flight | NavBar toggle + hard refresh + localStorage | passed | Phase 19 toggle infrastructure intact |
| V1 | Toggle interaction mid-Wallecx + dialog open (SC-1) | passed | Dialog body re-paints live; no white flash |
| V2 | Route transitions theme persistence (SC-2) | passed | Theme survives Vue Router navigation; no FOUC on re-entry |
| V3 | FOUC on hard reload while dark (SC-2) | passed | Inline FOUC script fires before Vue mounts |
| V4 | Bottom sheets in dark mode (SC-1) | passed | Drag pill swaps `bg-gray-600` ↔ `bg-gray-300` on live toggle |
| V5 | BarcodeDisplay BR-2 invariant (SC-4) | **passed** | **BR-2 holds** — barcode #000000 on #ffffff in both themes |
| V6 | PWA standalone install + toggle + re-open (SC-3) | **deferred** | Requires PWA install flow — defer to future cycle (per Phase 30 CONTEXT D-08: deferred-with-reason acceptable) |

### Failures
None — V6 explicitly deferred, not failed.

### Critical Findings
- **BR-2 invariant verified** — no regression to `BARCODE_FOREGROUND` / `BARCODE_BACKGROUND` constants
- Phase 19 NavBar toggle still drives Phase 18 `.my-app-dark` overrides correctly

### Sign-off
- Approved by: Phase 30 sweep (user-driven)
- Date: 2026-05-25
- Overall result: ✓ PASS (V6 deferred to future cycle)
- Critical findings: none
- Opportunistic fix needed: None
