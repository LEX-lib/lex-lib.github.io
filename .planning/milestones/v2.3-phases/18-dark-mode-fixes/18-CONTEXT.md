# Phase 18: Dark Mode Fixes - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

When the parent Lexarium app applies `.my-app-dark` to `<html>`, every Wallecx surface — card tiles, dialogs, the group detail panel/bottom sheet, the full-screen scan overlay, and BarcodeDisplay — renders with the correct dark palette. No PrimeVue #7465 "light-mode bleed" is visible. Desktop and mobile both behave correctly.

**Root cause** (confirmed during discussion): The project already configures PrimeVue with `darkModeSelector: ".my-app-dark"` in `src/main.ts`, but `src/assets/base.css` is missing the matching Tailwind v4 `@custom-variant` rule. Result: when `.my-app-dark` is on `<html>`, PrimeVue components switch to dark variables correctly, but Tailwind's `dark:` utilities in Wallecx components stay light — producing the partial-dark "bleed" the requirements describe.

**In scope:** DARK-01 (card tiles), DARK-02 (4 dialogs + VaccinationGroupPanel/bottom sheet), DARK-03 (scan overlay + BarcodeDisplay), plus a full sweep of the remaining Wallecx components to catch any peripheral bleed.

**Out of scope:** In-app dark-mode toggle (Lexarium-level concern per REQUIREMENTS.md), installing `tailwindcss-primeui` (not needed for this fix), refactoring components to use semantic surface utilities, dimming/recoloring user-chosen `card_color`, redesigning components for dark mode.

</domain>

<decisions>
## Implementation Decisions

### Root Fix — Tailwind / PrimeVue Variant Alignment
- **D-01:** Add **`@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));`** to `src/assets/base.css` (after `@import "tailwindcss";`). This is the canonical fix per the official PrimeVue Tailwind docs (https://primevue.org/tailwind/#darkmode). It aligns Tailwind v4's `dark:` variant with PrimeVue's `.my-app-dark` selector. Once added, all existing `dark:` utility classes in Wallecx (e.g. `dark:bg-surface-700`, `dark:text-surface-300`) activate together with PrimeVue's dark variables. PrimeVue handles its own components automatically; per-component dark CSS is not needed for surfaces the components already style.
- **D-02:** **No new npm packages.** `tailwindcss-primeui` is NOT installed and not added in this phase. Existing `dark:bg-surface-*` utilities in the codebase (VaccinationGroupPanel uses `bg-surface-0 dark:bg-surface-900`, etc.) are kept as-is and will start firing correctly after D-01.

### Per-Component Overrides (Fallback Only)
- **D-03:** If a Wallecx component still bleeds after D-01 (PrimeVue Aura defaults don't suit Wallecx's navy primary on a specific surface), add targeted overrides in **`src/assets/wallecx-overrides.css`** — NOT in per-component `<style scoped>` blocks. PrimeVue Dialog/Drawer teleport to `<body>` and scoped CSS never reaches them (Phase 15 / 17 established pattern). One file, one source of truth for dark-mode CSS overrides.
- **D-04:** Override strategy when D-03 is needed: prefer **PrimeVue CSS variable overrides** (e.g. `.my-app-dark .p-card { --p-card-background: #1a1a2e; }`) over direct property overrides. Variables compose with PrimeVue's internal styling; future PrimeVue updates won't break them.

### MembershipCard `card_color` Contrast
- **D-05:** **User-chosen `card_color` stays as-is.** The user's color identifies the card; we do not dim, desaturate, or replace it in dark mode.
- **D-06:** Add a **luminance-based text-color computation** in `MembershipCard.vue` (and `MembershipDetail.vue` where the card_color is rendered). Compute a contrast-aware foreground (`#ffffff` for dark backgrounds, `#0d1117` for light) using a simple WCAG luminance formula. Apply via inline `style` alongside the existing `backgroundColor`. Contrast logic must work in BOTH themes — `card_color` is theme-independent.

### BarcodeDisplay — Locked from Phase 12
- **D-07:** `BARCODE_FOREGROUND = '#000000'` and `BARCODE_BACKGROUND = '#ffffff'` constants in `BarcodeDisplay.vue` REMAIN UNCHANGED in any theme. Black-on-white maximizes scannability — a Phase 12 invariant (STATE.md BR-2). DARK-03 applies only to the SURROUNDING area around BarcodeDisplay (its container, labels, the modal/scan-overlay background) — never to the barcode's own foreground/background.

### Scan Overlay — DARK-03
- **D-08:** The full-screen scan overlay (rendered via viewport `position:fixed;inset:0;z-index:9999` per the Phase 12 iOS pattern, not the Fullscreen API) renders with a dark background in either theme (it is already a dark fullscreen surface for scanner usability). Confirm via UAT that no Tailwind utility on the overlay's surrounding labels causes light bleed; only fix if observed.

### Drag Handle Pill (Phase 17 Carry-Forward)
- **D-09:** The drag handle pill in `VaccinationsTab.vue` and `MembershipsTab.vue` already uses `bg-gray-300 dark:bg-gray-600`. After D-01 activates the variant alignment, the `dark:bg-gray-600` rule will fire correctly on mobile bottom sheets in dark mode. No change required to pill markup.

### Verification Scope
- **D-10:** **Full Wallecx component sweep** during human UAT. After D-01 is applied, every component in `src/components/projects/wallecx/` (15 files) gets a visual check in both light and dark mode, on desktop and mobile. The DARK-01/02/03 requirements are the headline surfaces but the milestone goal is "dark mode renders correctly across all Wallecx surfaces."
- **D-11:** **DevTools class toggle for UAT.** Tester adds `class="my-app-dark"` to `<html>` via DevTools to enter dark mode. No production code adds a toggle (REQUIREMENTS.md: "Dark mode toggle in-app — out of scope"). Documented in `18-HUMAN-UAT.md`.

### Claude's Discretion
- Whether the luminance threshold for D-06 is 0.5 (perceptual) or another WCAG-derived value — pick a sensible default; document in the plan.
- Whether the luminance helper lives inline in `MembershipCard.vue` or in a small `src/utils/contrast.ts` module — DRY only if both files end up needing it; otherwise inline is fine.
- Specific hex values for any fallback overrides under D-03 — derived from the existing brand palette (`src/assets/base.css`) and PrimeVue Aura's dark scheme.
- The exact list of surfaces that need targeted overrides under D-03 — driven entirely by what the full-sweep UAT reveals after D-01 is applied. Aim for the smallest set of overrides; don't pre-emptively add rules.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### External Docs (PrimeVue official)
- `https://primevue.org/tailwind/#darkmode` — Tailwind dark-mode setup with PrimeVue. Source of D-01.

### Requirements
- `.planning/REQUIREMENTS.md` §Dark Mode (DARK-01, DARK-02, DARK-03) and §Out of Scope ("Dark mode toggle in-app")

### Roadmap
- `.planning/ROADMAP.md` §Phase 18 — Goal, success criteria (SC 1–3), requirements list

### Project State
- `.planning/STATE.md` §Architectural Invariants — locked rules including BR-2 (BarcodeDisplay foreground/background constants)

### Prior Phase Context (patterns and constants to carry forward)
- `.planning/phases/12-read-path-card-grid-barcode-display-and-detail/12-CONTEXT.md` — BarcodeDisplay BARCODE_FOREGROUND/BACKGROUND module-level constants (locked)
- `.planning/phases/15-mobile-layouts/15-CONTEXT.md` — D-06 (`.p-dialog-content` 80dvh) and the established `wallecx-overrides.css` pattern for teleported PrimeVue DOM
- `.planning/phases/17-mobile-bottom-sheets-view-toggle/17-CONTEXT.md` — D-09/D-10 (useIsMobile composable, 639px breakpoint), the bottom Drawer pattern, `wallecx-overrides.css` extension precedent
- `.planning/phases/17-mobile-bottom-sheets-view-toggle/17-SUMMARY.md` files — pill markup using `dark:bg-gray-600` that depends on D-01 to activate

### Files to Modify
- `src/assets/base.css` — add `@custom-variant dark` rule (the core fix)
- `src/components/projects/wallecx/MembershipCard.vue` — add luminance-based text color computation (D-05, D-06)
- `src/components/projects/wallecx/MembershipDetail.vue` — apply contrast text color where `card_color` is rendered (D-06)
- `src/assets/wallecx-overrides.css` — IF and only if D-03 fallback overrides are needed after full-sweep UAT

### Files Untouched (anti-regression)
- `src/main.ts` — `darkModeSelector` is already correct; do not modify
- `src/components/projects/wallecx/BarcodeDisplay.vue` — BARCODE_FOREGROUND/BACKGROUND locked (D-07)
- All other Wallecx components: changes only if UAT reveals bleed that D-01 alone doesn't fix

</canonical_refs>

<code_context>
## Existing Code Insights

### Currently configured
- `src/main.ts:89` — `darkModeSelector: ".my-app-dark"` already set in the PrimeVue config (correct)
- `src/main.ts:31-77` — `MyPreset` defines light + dark color schemes for primary (navy in light, amber in dark) and highlight; Aura's other surface tokens come from the base preset
- `src/assets/base.css` — Tailwind v4 entry (`@import "tailwindcss";`) + `@theme` block with named brand/surface/typo/status colors. **No `@custom-variant` for dark mode — this is the missing piece.**
- `src/assets/wallecx-overrides.css` — existing single-file home for selectors that need to reach teleported PrimeVue DOM (Dialog content cap, bottom Drawer height)

### Existing `dark:` utility usage in Wallecx (will activate after D-01)
- `VaccinationGroupPanel.vue:26,32` — `dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400`
- `VaccinationsTab.vue:430` — `dark:bg-gray-600` on drag handle pill
- `MembershipsTab.vue:291` — `dark:bg-gray-600` on drag handle pill
- (Note: numeric `surface-*` Tailwind classes referenced here are NOT defined in `@theme` in base.css — they come from PrimeVue's CSS variable bridge via the preset. Verify after D-01 that these utilities resolve; if they don't, consider installing `tailwindcss-primeui` as a deferred follow-up, NOT in this phase.)

### Locked patterns
- BarcodeDisplay foreground/background hex constants (BR-2)
- `wallecx-overrides.css` as the single source for teleported-DOM CSS
- No in-app theme toggle (REQUIREMENTS.md out-of-scope)

### Integration points (no changes required, but verify in UAT)
- `WallecxApp.vue` — imports `wallecx-overrides.css`; any new CSS rule there ships with the Wallecx lazy-loaded chunk only
- `CustomNavBar.vue` — site-wide nav; out of scope; verify no Wallecx-specific dark bleed leaks here

</code_context>

<specifics>
## Specific Ideas

- The exact custom-variant line to add to `src/assets/base.css`:
  ```css
  @import "tailwindcss";

  @custom-variant dark (&:where(.my-app-dark, .my-app-dark *));

  @theme {
    /* ... existing theme block ... */
  }
  ```

- Luminance-based text-color helper for MembershipCard (sketch):
  ```ts
  function pickTextColor(hex: string): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.5 ? '#0d1117' : '#ffffff';
  }
  ```
  Applied via inline style next to the existing `backgroundColor`:
  ```ts
  const tileStyle = computed(() => {
    const bg = props.record.card_color ? '#' + props.record.card_color : '#002244';
    return { backgroundColor: bg, color: pickTextColor(bg) };
  });
  ```

- UAT toggle instruction (for `18-HUMAN-UAT.md`):
  ```
  To enter dark mode: open DevTools → Elements panel → select <html> →
  add attribute `class="my-app-dark"` (or extend existing class list).
  To leave: remove the class.
  ```

</specifics>

<deferred>
## Deferred Ideas

- **Install `tailwindcss-primeui`** — only if D-01 alone leaves Tailwind's `surface-*` utilities unresolved. Track as backlog if observed during UAT.
- **In-app dark-mode toggle** — explicitly out of scope per REQUIREMENTS.md; Lexarium-level concern.
- **Dimming/desaturating MembershipCard `card_color` in dark mode** — rejected during discussion; user color identity stays intact.
- **Component redesign for dark mode** — out of scope; this phase is a corrective fix, not a redesign.
- **`prefers-color-scheme`-driven auto dark-mode** — would couple Wallecx to OS preference; deferred to a Lexarium-level decision.

</deferred>

---

*Phase: 18-dark-mode-fixes*
*Context gathered: 2026-05-18*
*Primary source: PrimeVue official Tailwind dark-mode docs (https://primevue.org/tailwind/#darkmode)*
