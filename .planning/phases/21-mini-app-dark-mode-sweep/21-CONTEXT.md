# Phase 21: Mini-App Dark Mode Sweep - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Every mini-app under `src/components/projects/` — LexTrack, Larga, Gift Exchange (MonitoX), API Playground — renders correctly in dark mode. Each app gets its own atomic plan so per-app commits and UAT remain isolated. The mechanical pattern is already established from Phases 18 + 20: inline `dark:` Tailwind utilities for light-only classes, `:global(.my-app-dark)` scoped overrides for non-Tailwind decoratives.

**In scope:** THEME-09 (LexTrack), THEME-10 (Larga), THEME-11 (MonitoX/Gift Exchange), THEME-12 (API Playground). 11 source files total across 4 mini-apps.

**Out of scope:** Wallecx (Phase 22). PocketBase theme sync (THEME-ADV-01). Animated transitions (THEME-ADV-02). Refactoring existing CSS to use semantic tokens beyond what's needed for dark mode. Switching Larga's Leaflet map tile provider (OSM default tiles stay light in both themes).

</domain>

<decisions>
## Implementation Decisions

### Plan Structure — 4 Plans, One Per Mini-App
- **D-01:** Each mini-app is its own plan. **21-01** LexTrack, **21-02** Larga, **21-03** MonitoX, **21-04** API Playground. Atomic per-app commits; if one mini-app's UAT fails, the others still ship cleanly. Consistent with prior phases' "one plan per cohesive surface" pattern (Phases 17, 18, 19).
- **D-02:** All four plans are in Wave 1 with `depends_on: []` (no inter-app dependencies). Plans run sequentially (LexTrack → Larga → MonitoX → API Playground) — easier UAT than parallel; total task volume is modest enough not to warrant worktree isolation.
- **D-03:** Each plan generates its own SUMMARY.md but defers the per-app HUMAN UAT items to a single consolidated `21-HUMAN-UAT.md` at phase level (avoids 4 separate UAT docs for what is one conceptual sweep).

### LexTrack Strategy (Plan 21-01)
- **D-04:** 5 files, ~53 light-only utility instances. Mechanical sweep: for each `bg-white` add `dark:bg-surface-card`; for each `text-gray-700` add `dark:text-typo-body`; for `border-gray-200` add `dark:border-surface-divider`. Prefer existing custom-theme tokens (Phase 18 dark overrides apply automatically) over inventing new Tailwind scale values.
- **D-05:** Tables in LexTrackApp.vue — PrimeVue DataTable likely handles its own dark mode via Phase 18 variant alignment. UAT-driven follow-up if PrimeVue Table bleeds.
- **D-06:** Manage* dialogs (ManageMeeting, ManageTask, ManageSupport, AddMeeting) — verify each in dark mode. Each has ~5 light-only utilities. Same mechanical pairing.

### Larga Strategy (Plan 21-02)
- **D-07:** Leaflet map tiles **stay light in both themes**. Map tiles are the content; OSM default tiles are universally legible. Switching to a dark tile provider (CartoDB Dark Matter, etc.) is deferred — see Deferred Ideas.
- **D-08:** Only theme the Vue/PrimeVue chrome around the map: route picker, geocoder input wrapper, route info panels, controls. LargaApp.vue has 0 light-only Tailwind utilities (most styling is via Leaflet's own CSS), so the plan is mostly UAT-driven: open Larga in dark mode, fix what visibly bleeds, document outcome in SUMMARY.
- **D-09:** Do NOT modify `leaflet/dist/leaflet.css` or `leaflet-control-geocoder/dist/Control.Geocoder.css`. If geocoder input becomes illegible on dark background, add a scoped `:global(.my-app-dark) .leaflet-control-geocoder-form input` override in LargaApp.vue's `<style scoped>` block.

### MonitoX Strategy (Plan 21-03)
- **D-10:** 4 files (GiftExchange.vue + Join + Draw + Manage), ~103 light-only utility instances total. Mechanical sweep, same pattern as LexTrack but higher volume. The user already observed that MonitoX is the most visibly broken in dark mode.
- **D-11:** Use existing custom-theme tokens wherever they map (`bg-surface-card`, `text-typo-heading`, `border-surface-divider`) — they already switch automatically via Phase 18. For colors outside the semantic token set (e.g., `bg-red-100`, `text-green-700` for status indicators), pair with appropriate `dark:` Tailwind scale equivalents (`dark:bg-red-900/30`, `dark:text-green-300`).
- **D-12:** Do NOT refactor MonitoX to a fully token-driven CSS structure — that's a separate cleanup phase, not Phase 21's scope. The job is to pair every light utility with a dark counterpart, not to redesign.
- **D-13:** Status colors (success/warning/error/info) — REQUIREMENTS.md says custom `--color-status-*` tokens stay theme-independent (Phase 18 D-04 lock). Don't add dark overrides for those; they're already designed for both themes.

### API Playground Strategy (Plan 21-04)
- **D-14:** 1 file (ApiPlaygroundApp.vue), 184 color/style references. Investigate at execution time — many references are likely PrimeVue props or hex strings in inline styles. Mechanical sweep: pair any light-only inline `style="background: #fff"` with a `:global(.my-app-dark)` override, OR convert to a CSS variable in the file's scoped style.
- **D-15:** **Syntax highlighting** — at execution time, executor checks if a syntax highlighter library is imported (Prism, Highlight.js, Shiki, etc.). If present AND its theme stylesheet is light-only (e.g., `prism.css`, `prism-light.css`), swap to a dark variant conditionally:
  - Option A: Import the dark stylesheet alongside and use a CSS-only switch (light/dark stylesheets gated by `.my-app-dark` selector)
  - Option B: Dynamically import the appropriate stylesheet based on `useTheme()` value
  Choose whichever is cleaner given how the file currently structures highlight. If NO syntax highlighter is found, no-op and document in SUMMARY.
- **D-16:** Headers/body editor — if API Playground uses raw `<textarea>` or `<pre><code>` for request body without highlighting, just ensure the background/text colors switch via existing token tokens. No new highlighter dependency.

### Cross-Plan Decisions
- **D-17:** **CSS location** — Same hybrid as Phase 20: inline `dark:` Tailwind utilities where applicable, `:global(.my-app-dark)` scoped overrides for non-Tailwind decoratives. No mini-app gets its own `*-overrides.css` file unless the volume of overrides justifies it (UAT-driven judgment).
- **D-18:** **Anti-regression locked files (NO mini-app may modify):**
  - `src/main.ts` (Phase 17)
  - `src/composables/useTheme.ts` (Phase 19)
  - `src/composables/useIsMobile.ts` (Phase 17)
  - `src/assets/base.css` (Phases 18, 20)
  - `src/assets/wallecx-overrides.css` (Phase 18 — Wallecx-only)
  - `src/components/projects/wallecx/**` (Phase 22 scope)
  - Other mini-app directories not being modified in that specific plan
- **D-19:** Per-plan acceptance criteria asserts via `git diff --name-only` that none of the locked files appear in that plan's commits.
- **D-20:** Each plan ends with `npm run type-check` + `npm run build-only` both exit 0.

### Verification
- **D-21:** **One consolidated `21-HUMAN-UAT.md`** at phase level (not per-plan). Format mirrors Phase 20's UAT doc: per-mini-app checklist sections, both viewports (375px + ≥ 640px), both themes (light + dark), failure-mode catalog. Each mini-app has its own checklist subsection.
- **D-22:** Phase verification runs once after all 4 plans complete, asserts that all THEME-09..12 contracts hold structurally.

### Claude's Discretion
- Exact dark Tailwind scale value when no semantic token applies (`text-gray-700` → `dark:text-gray-300` typically; `bg-yellow-100` → `dark:bg-yellow-900/30` typically).
- Whether to consolidate repeated overrides within a mini-app into a shared utility class — defer unless duplication is heavy.
- For API Playground specifically, whether the syntax highlighter (if present) needs Option A (dual stylesheet) or Option B (dynamic import).
- Whether Larga ends up with zero code changes (acceptable if UAT confirms the existing chrome already works via Phase 18 + 20 token overrides).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Mini-App Dark Mode Sweep (THEME-09, THEME-10, THEME-11, THEME-12)

### Roadmap
- `.planning/ROADMAP.md` §Phase 21 — Goal, success criteria SC 1–4

### Prior Phase Context (locked patterns)
- `.planning/phases/18-dark-mode-fixes/18-CONTEXT.md` — `@custom-variant dark` alignment; status colors stay theme-independent (BR-2)
- `.planning/phases/19-theme-infrastructure/19-CONTEXT.md` — useTheme composable; NavBar toggle
- `.planning/phases/20-site-shell-non-app-pages/20-CONTEXT.md` — `--color-mix-target` var; `:global(.my-app-dark)` scoped override pattern; hybrid CSS strategy

### External Docs (still authoritative)
- `https://primevue.org/tailwind/#darkmode` — Tailwind dark-mode setup with PrimeVue (anchors the whole milestone)

### Files to Modify

**Plan 21-01 (LexTrack):**
- `src/components/projects/lextrack/LexTrackApp.vue` (34 light-only utilities)
- `src/components/projects/lextrack/ActivityCard.vue` (verify; likely 0)
- `src/components/projects/lextrack/AddMeeting.vue` (5 light-only utilities)
- `src/components/projects/lextrack/ManageMeeting.vue` (5)
- `src/components/projects/lextrack/ManageSupport.vue` (4)
- `src/components/projects/lextrack/ManageTask.vue` (5)

**Plan 21-02 (Larga):**
- `src/components/projects/larga/LargaApp.vue` (0 light-only utilities; UAT-driven additions only)

**Plan 21-03 (MonitoX):**
- `src/components/projects/gift-exchange/GiftExchange.vue` (30 light-only utilities)
- `src/components/projects/gift-exchange/GiftExchangeJoin.vue` (24)
- `src/components/projects/gift-exchange/GiftExchangeDraw.vue` (18)
- `src/components/projects/gift-exchange/GiftExchangeManage.vue` (31)

**Plan 21-04 (API Playground):**
- `src/components/projects/api-playground/ApiPlaygroundApp.vue` (184 color refs; volume + syntax-highlight investigation at execution)

### Files Untouched (anti-regression, ALL plans)
- `src/main.ts`
- `src/composables/useTheme.ts`
- `src/composables/useIsMobile.ts`
- `src/assets/base.css`
- `src/assets/wallecx-overrides.css`
- `src/components/projects/wallecx/**`
- `index.html` (Phase 19 FOUC script locked)
- All views (`src/views/**`) and global components (`src/components/Hero*`, `About*`, `Login.vue`, `CustomNavBar.vue`) — these were Phase 20 scope

</canonical_refs>

<code_context>
## Existing Code Insights

### What already works (from Phases 18 + 20)
- Custom `@theme` token utilities (`bg-surface-card`, `text-typo-heading`, `border-surface-divider`, `bg-surface-page`) automatically switch via `.my-app-dark` overrides in `base.css`. Anywhere these are used, no `dark:` variant is needed.
- PrimeVue components (Button, Card, Dialog, DataTable, etc.) auto-switch via the Phase 18 `@custom-variant` alignment.
- `--color-mix-target` switches to `#0d1117` in dark mode.

### What needs work
- **LexTrack (5 files):** Plain Tailwind `bg-white`, `text-gray-*`, `border-gray-*` utilities throughout — pair with `dark:` variants
- **Larga (1 file):** No Tailwind grays; mostly Leaflet CSS — UAT-driven, likely zero or minimal changes
- **MonitoX (4 files):** Heaviest count — Tailwind-utility-driven UI with lots of colored chips/badges
- **API Playground (1 file):** Heavy inline styles (184 color references) + possible syntax highlighter

### Reusable patterns from prior phases
- Inline `dark:` utility pattern: `bg-white dark:bg-surface-card`
- `:global(.my-app-dark)` scoped override pattern (Phase 20 D-02)
- `!important` matching specificity (Phase 20 D-08) — applies when source rule uses `!important`

### Integration points
- All four mini-apps consume `useTheme` indirectly: the toggle from Phase 19 already controls `.my-app-dark` on `<html>`, so each mini-app's CSS just needs to respond to the class being present
- LexTrack's tables: PrimeVue DataTable handles its own dark mode via variant alignment; UAT will confirm

</code_context>

<specifics>
## Specific Ideas

### Mechanical sweep pattern (D-04, D-10, D-11)

Before:
```html
<div class="bg-white border border-gray-200 p-4">
  <h2 class="text-gray-800 font-bold">Task</h2>
  <p class="text-gray-600">Description</p>
</div>
```

After:
```html
<div class="bg-white dark:bg-surface-card border border-gray-200 dark:border-surface-divider p-4">
  <h2 class="text-gray-800 dark:text-typo-heading font-bold">Task</h2>
  <p class="text-gray-600 dark:text-typo-body">Description</p>
</div>
```

Use custom theme tokens (`dark:bg-surface-card` etc.) over Tailwind grays (`dark:bg-gray-800`) where they apply — they already switch automatically via Phase 18.

### Colored chip/badge dark pairing (D-11)

Before:
```html
<span class="bg-red-100 text-red-700 px-2 py-1 rounded">Expired</span>
```

After:
```html
<span class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">Expired</span>
```

`/30` opacity on the dark background keeps the chip subtle on a dark page.

### Larga Leaflet geocoder override (D-09)

If the geocoder input becomes illegible on dark page:

```vue
<style scoped>
:global(.my-app-dark) .leaflet-control-geocoder-form input {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
</style>
```

### API Playground syntax highlighter pattern (D-15)

Option A — dual stylesheet, CSS-only switch:
```css
/* In the file's <style> block, or imported alongside */
.my-app-dark .code-highlight { /* dark theme rules */ }
/* light theme stays as-is in the existing default */
```

Option B — dynamic import based on `useTheme()`:
```ts
import { useTheme } from '@/composables/useTheme'
import { watchEffect } from 'vue'

const { theme } = useTheme()
watchEffect(async () => {
  if (theme.value === 'dark') {
    await import('prismjs/themes/prism-tomorrow.css')
  } else {
    await import('prismjs/themes/prism.css')
  }
})
```

Choose based on what the file currently does for highlighting. If no highlighter is found, skip both.

</specifics>

<deferred>
## Deferred Ideas

- **Larga dark map tiles** — Switch to CartoDB Dark Matter or similar dark tile provider. Defer until users actually complain or until Larga gets a polish phase.
- **MonitoX semantic token refactor** — Replace `bg-white`/`text-gray-*` with `bg-surface-card`/`text-typo-*` throughout. Cleaner future-state but a separate cleanup phase.
- **Smooth theme transitions** (THEME-ADV-02) — CSS variable interpolation between light/dark — animation polish.
- **Per-mini-app theme override** — e.g. Wallecx always dark regardless of site theme — out of scope; not a milestone goal.
- **Syntax highlighter consolidation** — If multiple mini-apps end up needing highlighters, consider centralizing in a shared component. Premature for v3.0.

</deferred>

---

*Phase: 21-mini-app-dark-mode-sweep*
*Context gathered: 2026-05-18*
