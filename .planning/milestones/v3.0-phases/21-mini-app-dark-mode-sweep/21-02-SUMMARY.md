---
phase: 21-mini-app-dark-mode-sweep
plan: 02
subsystem: larga / dark-mode
tags:
  - dark-mode
  - larga
  - leaflet
  - vue3
  - theme-10
requirements:
  - THEME-10
dependency-graph:
  requires:
    - THEME-05 (Phase 18 — @custom-variant dark + .my-app-dark token overrides)
    - THEME-08 (Phase 19 — useTheme composable + NavBar toggle)
  provides:
    - THEME-10 (Larga renders correctly in dark mode)
  affects:
    - LargaApp.vue scoped styles (geocoder input legibility on dark surfaces)
tech-stack:
  added: []
  patterns:
    - ":global(.my-app-dark) scoped override targeting Leaflet-injected DOM"
    - "var(--color-surface-card / --color-typo-body / --color-surface-divider) tokens from base.css"
key-files:
  created:
    - .planning/phases/21-mini-app-dark-mode-sweep/21-02-SUMMARY.md
  modified:
    - src/components/projects/larga/LargaApp.vue
decisions:
  - "Applied D-09 verbatim override pattern proactively for the Leaflet geocoder input — its bundled CSS (leaflet-control-geocoder/dist/Control.Geocoder.css) hardcodes a light background that would be unreadable on a dark page surface; this is a structural fact, not a UAT-only judgment"
  - "Left every other Larga surface untouched — the PrimeVue Card/Button chrome auto-switches via Phase 18 variant alignment, and the file contains 0 light-only Tailwind utilities (re-confirmed by re-grep)"
  - "Honored D-07 — no tile-provider switch attempted; map tiles intentionally stay light in both themes"
  - "Honored D-09 — no external Leaflet CSS file was modified; the override lives entirely in LargaApp.vue's <style scoped> block"
metrics:
  duration: ~6 minutes
  completed: 2026-05-19
  tasks: 2
  files-modified: 1
  files-created: 1
---

# Phase 21 Plan 02: Larga Dark Mode Audit Summary

Audited LargaApp.vue end-to-end and added the D-09 verbatim `:global(.my-app-dark)` override for the Leaflet geocoder input; all other Larga chrome already adapts via Phase 18/20 token overrides without source changes.

## 1. Audit Scope

Every styled surface in `src/components/projects/larga/LargaApp.vue` (210 → 223 lines) was inspected for light-only color values that would bleed under `.my-app-dark`:

| Surface | Type | Light-only colors? | Adaptation source |
| ------- | ---- | ------------------ | ----------------- |
| Tailwind utilities throughout the template | Tailwind | **No** — re-grepped `bg-white\|text-gray-\|border-gray-\|bg-gray-` → 0 matches | n/a |
| `<Card>` wrapping the entire app | PrimeVue | No | Phase 18 `@custom-variant dark` + token alignment auto-switches PrimeVue Card surface |
| `<Button>` route picker buttons (PrimeVue) | PrimeVue | No | Same as above — PrimeVue Button auto-switches |
| Inline `style="margin-bottom: 1rem"` (line 184) | Inline style | No (spacing only — no color value) | n/a |
| Inline `style="margin-right: 0.5rem"` (line 192) | Inline style | No (spacing only) | n/a |
| Inline `style="margin-top: 1rem"` (line 195) | Inline style | No (spacing only) | n/a |
| `<h4>Routes passing near searched place:</h4>` | Plain HTML | No (inherits color from PrimeVue Card body) | Inherits from Card |
| `<ul><li>` for nearby routes | Plain HTML | No (inherits) | Inherits from Card |
| `<style scoped> #map { height: 70vh; width: 100% }` | Scoped CSS | No (geometry only — no color) | n/a |
| Leaflet map tiles (Google satellite via `https://mt1.google.com/vt/lyrs=y`) | Runtime tile layer | **Locked light** | D-07 intentional invariant |
| Leaflet **geocoder input** (`.leaflet-control-geocoder-form input`) | External Leaflet plugin CSS (out-of-Vue DOM) | **Yes** — `Control.Geocoder.css` ships `background: white; color: black` | **Override added** (see §2) |
| Leaflet popups / markers | External Leaflet CSS | No realistic dark-mode bleed in this view (popups are content overlays; user-readable in both themes) | D-09 lock — not modified |

Leaflet selectors directly referenced in LargaApp.vue source: **none** (the geocoder is added programmatically via `geocoderFn({...}).addTo(map)` — its DOM is injected by Leaflet outside Vue's scope, which is precisely why the `:global(...)` syntax is required to reach it).

## 2. Audit Outcome — Option B (Specific Override Applied)

This plan used **Option B** from the plan's decision tree: a single targeted `:global(.my-app-dark)` override was added at the bottom of LargaApp.vue's existing `<style scoped>` block.

### Override added (verbatim D-09 pattern)

```css
:global(.my-app-dark) .leaflet-control-geocoder-form input {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
```

**Selector**: `:global(.my-app-dark) .leaflet-control-geocoder-form input`
**Rationale**: `leaflet-control-geocoder/dist/Control.Geocoder.css` (locked per D-09) defines the input with a light background. Under `.my-app-dark`, the surrounding PrimeVue Card surface becomes dark, so the geocoder input would render as a bright white slab — illegible against the dark Card backdrop and visually broken. The override substitutes the dark-aware `@theme` tokens defined in `base.css` (Phase 18) so the input matches the surrounding surface in both themes.

**Why `:global(...)` is required**: Vue 3 SFC scoped CSS adds a per-component data attribute to selectors, which only matches elements inside the component's Vue-rendered DOM. The Leaflet geocoder's `<input>` is created and mounted by Leaflet at runtime, **outside** Vue's component tree, so a normal scoped rule would not reach it. `:global(...)` pierces scope precisely for this case.

**Tokens used** (all defined and dark-overridden in `src/assets/base.css` from Phase 18):
- `--color-surface-card` — matches the surrounding Card background
- `--color-typo-body` — body text color, ensures input text is readable on the new background
- `--color-surface-divider` — subtle border consistent with other input chrome in dark mode

No other surface in LargaApp.vue required intervention.

## 3. D-07 Invariant Confirmed

**Leaflet tile provider is unchanged.** The runtime `L.tileLayer(...)` call in `onMounted` still loads `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}` (the existing Google satellite tiles); no dark-mode-conditional swap was introduced, no CartoDB Dark Matter or alternate provider was added, and no new tile layer was registered. Map tiles render the same in both light and dark themes — they ARE the content, and a light tile is legible in either theme.

## 4. D-09 Invariant Confirmed

**No external Leaflet CSS file was modified.** Neither `node_modules/leaflet/dist/leaflet.css` nor `node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css` appears in `git diff --name-only`. The geocoder fix lives entirely within `src/components/projects/larga/LargaApp.vue`'s `<style scoped>` block, using `:global(...)` to pierce Vue scope rather than editing the Leaflet stylesheet.

## 5. Anti-Regression Confirmation

`git diff` against the merge base for this plan's commit (HEAD prior to this plan = `e1f2e11`, commit for this plan = `7b16e7e`) shows the modified file set is:

- `src/components/projects/larga/LargaApp.vue` (+13 lines, only inside the existing `<style scoped>` block)
- `.planning/phases/21-mini-app-dark-mode-sweep/21-02-SUMMARY.md` (new, this file)

Locked files NOT in the diff (verified):

- `src/main.ts` — not modified
- `src/composables/useTheme.ts` — not modified
- `src/composables/useIsMobile.ts` — not modified
- `src/assets/base.css` — not modified
- `src/assets/wallecx-overrides.css` — not modified
- `src/components/projects/wallecx/**` — not modified
- `src/components/projects/lextrack/**` — not modified
- `src/components/projects/gift-exchange/**` — not modified
- `src/components/projects/api-playground/**` — not modified
- `src/views/**` — not modified
- `index.html` — not modified
- `package.json`, `package-lock.json` — not modified (no new dependency)
- `node_modules/leaflet/dist/leaflet.css` — not modified
- `node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css` — not modified

## 6. THEME-10 Trace

THEME-10 ("Larga renders correctly in dark mode") is satisfied by the union of three mechanisms — each Larga surface routes to exactly one:

| Larga surface | Adapts via | Source |
| ------------- | ---------- | ------ |
| Route picker buttons | PrimeVue Button variant tokens | Phase 18 `@custom-variant dark` alignment (auto) |
| Card wrapping the app | PrimeVue Card surface tokens | Phase 18 (auto) |
| `<h4>` "Routes passing near…" heading | Inherited typography from Card | Phase 18 (auto) |
| Nearby-routes `<ul>` / `<li>` | Inherited typography from Card | Phase 18 (auto) |
| `#map` container | Geometry only (no color); the Leaflet canvas inside is content | n/a |
| **Leaflet geocoder input** | **`:global(.my-app-dark)` scoped override** | **This plan — `LargaApp.vue` `<style scoped>`** |
| Leaflet map tiles | Locked light in both themes by design | D-07 |
| Leaflet popups / attribution / zoom controls | Leaflet defaults (legible enough on light tiles, which is what they overlay) | D-09 — not in scope; revisit if UAT shows bleed |

Contributes to ROADMAP §Phase 21 SC 2: *"Larga renders correctly in dark mode — Leaflet map controls, geocoder input, route panels, and route list are legible; the map tiles themselves may stay light-mode-styled."* All four named surfaces (controls, geocoder input, route panels, route list) are accounted for above.

## 7. Verification Results

| Command | Exit code | Notes |
| ------- | --------- | ----- |
| `npm run type-check` | **0** (PASS) | `vue-tsc --build` — no type errors |
| `npm run build-only` | **0** (PASS) | `vite build` succeeded; produced `dist/assets/LargaApp-Dh4bxCkr.css` (0.17 kB — confirms the new scoped override block is in the production bundle) |

Both ran in the working tree at HEAD `7b16e7e` (after the Task 1 commit, before this SUMMARY's commit).

## 8. Open Items / UAT Pending

The following visible runtime checks are deferred to the consolidated `21-HUMAN-UAT.md` (deliverable of plan 21-04 per D-03 and D-21 — explicitly NOT this plan):

- **[HIGHEST RISK] Geocoder input legibility**: Visually confirm at 375px and ≥640px viewports in dark mode that the geocoder input search box has a dark background with light text and a visible border, matching the surrounding PrimeVue Card. If the contrast is insufficient or if the placeholder text becomes invisible, follow-up: add `::placeholder` rule alongside the existing override. (Tracked as the single highest-risk surface in this plan.)
- **Geocoder dropdown / results pane**: The `.leaflet-control-geocoder-alternatives` dropdown (search suggestions) was not overridden by this plan — its visibility on dark only manifests when the user actually types. If UAT shows white-on-white results, add a parallel `:global(.my-app-dark) .leaflet-control-geocoder-alternatives` rule in a follow-up plan or under THEME-10 UAT cleanup.
- **Leaflet attribution / zoom buttons / popup chrome**: These overlay the (light) map tiles, so they remain readable; D-09 keeps Leaflet CSS untouched. If a future phase decides to dim the tile attribution box on dark page chrome, that's a separate decision outside Phase 21 scope.
- **Route picker buttons**: PrimeVue Button variants should auto-switch. UAT to confirm selected vs. outlined states both remain visually distinct on dark.
- **Card title "Map"**: Confirms inherited typography is legible.

## TDD Gate Compliance

N/A — this plan is `type: execute`, not `type: tdd`. No RED/GREEN/REFACTOR gate is mandated. Verification is via type-check + build-only, both green.

## Self-Check: PASSED

- `src/components/projects/larga/LargaApp.vue` — FOUND (modified, +13 lines)
- Commit `7b16e7e` (Task 1 — geocoder override) — FOUND in `git log`
- `:global(.my-app-dark) .leaflet-control-geocoder-form input` rule — FOUND at lines 218–222 of LargaApp.vue
- `npm run type-check` exit 0 — verified above
- `npm run build-only` exit 0 — verified above (LargaApp scoped CSS chunk emitted at 0.17 kB)
- No locked file in `git diff` — verified in §5
