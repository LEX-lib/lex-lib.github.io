# Phase 20: Site Shell & Non-App Pages - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Every non-app surface of Lexarium — site shell (CustomNavBar, App.vue), home page (HomeView, HeroSection, AboutMeSection), projects directory (ProjectsView), blog (BlogView), about (AboutView), and login (Login) — renders correctly when `.my-app-dark` is active on `<html>`. The toggle from Phase 19 already works; this phase makes the surfaces it controls actually adapt.

**In scope:** THEME-04 (HomeView/Hero/About), THEME-05 (ProjectsView), THEME-06 (BlogView), THEME-07 (Login), THEME-08 (CustomNavBar). 7 source files total.

**Out of scope:** Mini-apps (Phase 21: LexTrack, Larga, Gift Exchange/MonitoX, API Playground). Wallecx audit (Phase 22). Adding a per-user PocketBase theme sync (THEME-ADV-01). Smooth color-transition animation (THEME-ADV-02).

</domain>

<decisions>
## Implementation Decisions

### CSS Location — Hybrid Strategy
- **D-01:** Where Tailwind utilities are in use, prefer **inline `dark:` modifier utilities** (e.g. `dark:text-gray-300`, `dark:border-amber-500/30`). Most readable, easiest to grep, matches the codebase's existing styling idiom.
- **D-02:** Where hardcoded `rgba(...)` or other non-Tailwind decorative effects exist (navy/amber blobs in HeroSection, AboutMeSection, ProjectsView), add **scoped `.my-app-dark` overrides** in the same component's `<style scoped>` block. Each component owns its decorative tuning. Do NOT push these into `wallecx-overrides.css` or `base.css` — that file is for teleported PrimeVue overrides and global tokens, not per-component decoration.
- **D-03:** Where the existing custom `@theme` tokens (`bg-surface-page`, `text-typo-heading`, `border-surface-divider`, etc.) are already in use, NO new code is needed — they already switch via Phase 18's `.my-app-dark` block in `base.css`. Audit confirms; do not re-fix.

### Global CSS Variable for `color-mix` Targets
- **D-04:** HeroSection contains `background-color: color-mix(in srgb, var(--color-brand-accent) 85%, white);` — the literal `white` doesn't switch in dark mode. Add a new CSS variable in `base.css`:
  - Light mode (`@theme` block): `--color-mix-target: #ffffff`
  - Dark mode (`.my-app-dark` block): `--color-mix-target: #0d1117`
  Then change the HeroSection rule to `color-mix(in srgb, var(--color-brand-accent) 85%, var(--color-mix-target))`. One-line change that handles all current and future `color-mix(... fixed-color)` rules.
- **D-05:** This is the only `base.css` modification in Phase 20 — strictly to introduce the new variable. No other `base.css` edits.

### Brand-Color rgba Decorative Effects — Per-Component Overrides
- **D-06:** Light-mode `rgba(0, 34, 68, X)` (navy with low alpha) decorative backgrounds become nearly invisible on dark page background. Per-component scoped override approach: keep the light-mode rule, add a `.my-app-dark` rule that substitutes a higher-contrast color, typically the amber accent at similar alpha (e.g. `rgba(232, 152, 32, X * 1.5)` — alpha bumped because amber-on-dark needs less coverage to register).
- **D-07:** Light-mode `rgba(232, 152, 32, X)` (amber with low alpha) generally remains visible on dark page background. UAT first; only override if a specific blob actually disappears.
- **D-08:** Override the literal `!important` rules verbatim where they exist (e.g. AboutMeSection's tag chip background, ProjectsView's project tile background) — the `.my-app-dark` override must also use `!important` to match specificity.

### File-by-File Audit Structure
- **D-09:** Each in-scope file is its own task in the plan, executed sequentially. This makes UAT per-file and lets the executor commit atomically. Avoids "one giant change" risk.
- **D-10:** Per-task audit checklist (executor follows this for each file):
  1. Read the file
  2. List all Tailwind utility classes that reference a light-specific color (`text-gray-700`, `border-gray-200`, `bg-white`, etc.) and add `dark:` counterparts
  3. List all hardcoded `rgba(0, 34, 68, ...)` and `rgba(232, 152, 32, ...)` rules and add `.my-app-dark` scoped overrides if needed
  4. List all `color-mix(..., white)` or `..., black` rules and route through `--color-mix-target` if they should switch
  5. Verify build (`npm run type-check` + `npm run build-only`) after the file changes

### Login.vue Specifics
- **D-11:** Login.vue contains 3 hardcoded gray classes (`text-gray-*` patterns) — add `dark:text-gray-300` (or appropriate scale) inline. The colorful decorative gradients (`rgba(99, 102, 241, 0.15)`, etc.) are intentional "subtle background blobs" — they remain visible at their stated low alpha on either page background. Leave them unless UAT shows otherwise.

### CustomNavBar.vue Specifics
- **D-12:** The toggle button itself was just added in Phase 19 and uses no light-specific colors (text-current from `<Button variant="text">`, mdi icons render in current color). Verify the brand-mark Avatar (`/branding_logo.svg`) is visible on dark; if not, add a `dark:invert` utility or swap to a dark variant.
- **D-13:** The `<Menubar>` and `<Menu>` (profile dropdown) are PrimeVue components — Phase 18's variant alignment plus PrimeVue's own dark-mode-aware tokens should handle them. UAT-driven follow-up if anything bleeds; do NOT pre-emptively add `.my-app-dark .p-menubar` overrides.

### Anti-Regression
- **D-14:** Wallecx is NOT in this phase's scope. None of `src/components/projects/wallecx/**` may be modified. `wallecx-overrides.css` is also untouched. Phase 22 owns Wallecx audit.
- **D-15:** Mini-apps NOT in scope. `src/components/projects/lextrack/`, `larga/`, `gift-exchange/`, `api-playground/` all untouched. Phase 21 handles those.
- **D-16:** `src/main.ts` and `src/composables/useTheme.ts` MUST NOT be modified — they were finalized in Phases 17 + 19 respectively. The toggle's contract is fixed.

### Claude's Discretion
- Exact `dark:` color value for each replaced light-only utility — choose visually appropriate Tailwind scale value (e.g. `text-gray-700` → `dark:text-gray-300` typically).
- Whether to switch some `text-typo-body` (semantic) utilities to explicit hex if the auto-switched dark value is too muted — UAT-driven.
- Whether the per-component `.my-app-dark` override blocks live at the top or bottom of each `<style scoped>` section — bottom is conventional (group all dark overrides at the end).
- Whether to consolidate any repeated `.my-app-dark` overrides across files into a shared CSS file — defer; only do this if a clear pattern emerges after the audit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Site Shell & Non-App Pages (THEME-04, THEME-05, THEME-06, THEME-07, THEME-08)

### Roadmap
- `.planning/ROADMAP.md` §Phase 20 — Goal, success criteria SC 1–5, dependencies

### Prior Phase Context (locked patterns)
- `.planning/phases/18-dark-mode-fixes/18-CONTEXT.md` — `@custom-variant dark` alignment; `.my-app-dark` custom token overrides in `base.css`
- `.planning/phases/19-theme-infrastructure/19-CONTEXT.md` — useTheme composable contract; FOUC script in `index.html`; NavBar toggle button

### External Docs (still authoritative)
- `https://primevue.org/tailwind/#darkmode` — Tailwind dark-mode setup with PrimeVue

### Files to Modify
- `src/assets/base.css` — add `--color-mix-target` variable in both `@theme` (light) and `.my-app-dark` (dark) blocks
- `src/views/HomeView.vue` — audit + fixes (likely minimal, 11 lines)
- `src/views/ProjectsView.vue` — audit + fixes (238 lines; amber rgba overrides + likely Tailwind dark: additions)
- `src/views/BlogView.vue` — audit + fixes (17 lines, likely thin)
- `src/views/AboutView.vue` — audit + fixes (15 lines, likely thin)
- `src/components/HeroSection.vue` — audit + fixes (navy/amber rgba overrides + color-mix-target migration)
- `src/components/AboutMeSection.vue` — audit + fixes (amber rgba overrides, photo verified theme-independent)
- `src/components/Login.vue` — audit + fixes (3 hardcoded gray classes get `dark:` variants)
- `src/components/CustomNavBar.vue` — audit + fixes (mostly already correct from Phase 19; verify brand-mark Avatar visibility)

### Files Untouched (anti-regression)
- `src/main.ts` — PrimeVue darkModeSelector locked (Phase 17)
- `src/composables/useTheme.ts` — toggle contract locked (Phase 19)
- `src/composables/useIsMobile.ts` — locked (Phase 17)
- `src/assets/wallecx-overrides.css` — Wallecx-only overrides (Phases 15/17/18)
- All `src/components/projects/wallecx/**` — Phase 22 scope
- All `src/components/projects/lextrack/**`, `larga/**`, `gift-exchange/**`, `api-playground/**` — Phase 21 scope

</canonical_refs>

<code_context>
## Existing Code Insights

### What already works (no fix needed)
- Custom `@theme` tokens already switch in dark mode via `base.css`'s `.my-app-dark` override block (Phase 18). Any class like `bg-surface-page`, `text-typo-heading`, `border-surface-divider` automatically renders dark when the class is active.
- PrimeVue components on these pages (Button, Avatar, Menu, Menubar in NavBar) auto-switch via Phase 18's `@custom-variant dark` alignment.
- The about-me photo (`@/assets/about-me-photo.png`) is a photo of the dev — theme-independent. No work.

### What needs work
- **HeroSection.vue:** `color-mix(in srgb, var(--color-brand-accent) 85%, white)` rule, several `rgba(0, 34, 68, X)` decorative blobs, several `rgba(232, 152, 32, X)` decorative blobs
- **AboutMeSection.vue:** `rgba(232, 152, 32, 0.3)` border color and `rgba(232, 152, 32, 0.12) !important` tag chip background — chip background may need a `.my-app-dark` override
- **ProjectsView.vue:** `rgba(232, 152, 32, 0.12) !important` project tile background and `rgba(232, 152, 32, 0.35) !important` border — may need `.my-app-dark` overrides
- **Login.vue:** 3 hardcoded `text-gray-*` classes; decorative rgba gradients (purple/green/blue) at low alpha — gradients likely fine, gray classes need `dark:` variants
- **CustomNavBar.vue:** brand-mark Avatar visibility on dark background — verify; may need `dark:invert` or alternative source

### Reusable patterns
- Phase 18's `bg-surface-card` / `text-typo-heading` token pattern — extend wherever feasible
- Phase 18's per-component `.my-app-dark` selector pattern (used in `wallecx-overrides.css`) — repurposed in Phase 20 but scoped to component `<style scoped>` blocks (not the override CSS file, which is Wallecx-only)

</code_context>

<specifics>
## Specific Ideas

### base.css addition (D-04, D-05)

```css
@theme {
  /* ... existing ... */
  --color-mix-target: #ffffff;
}

.my-app-dark {
  /* ... existing token overrides ... */
  --color-mix-target: #0d1117;
}
```

### HeroSection color-mix migration (D-04)

Before:
```css
background-color: color-mix(in srgb, var(--color-brand-accent) 85%, white);
```

After:
```css
background-color: color-mix(in srgb, var(--color-brand-accent) 85%, var(--color-mix-target));
```

### Per-component `.my-app-dark` override pattern (D-02, D-06)

In each component's `<style scoped>` block:

```css
/* Existing light-mode decorative rule (unchanged) */
.decorative-blob-navy {
  background-color: rgba(0, 34, 68, 0.12);
}

/* Phase 20 dark-mode override: navy invisible on dark page → switch to amber */
:global(.my-app-dark) .decorative-blob-navy {
  background-color: rgba(232, 152, 32, 0.16);
}
```

Note: `:global(.my-app-dark)` is the Vue SFC pattern for piercing scoped CSS. Alternative if `:global()` is awkward: use `:deep()` or move the override to a non-scoped style block in the same SFC.

### Login.vue inline `dark:` additions (D-11)

Example:
```html
<!-- before -->
<span class="text-gray-600">Sign in to continue</span>

<!-- after -->
<span class="text-gray-600 dark:text-gray-300">Sign in to continue</span>
```

### CustomNavBar.vue Avatar verification (D-12)

If `/branding_logo.svg` looks bad on dark, options (in order of preference):
1. Add `dark:invert` to the `<Avatar>` (cheapest)
2. Add a `dark:filter dark:brightness-200` (preserves color, just brightens)
3. Swap to a dark variant SVG (e.g. `/branding_logo-dark.svg`) using a computed src

Pick whichever produces an acceptable visual; lock in the choice in plan acceptance criteria.

</specifics>

<deferred>
## Deferred Ideas

- **Animated transitions** when toggling — THEME-ADV-02; instant flip is acceptable for v3.0.
- **Per-user theme sync to PocketBase** — THEME-ADV-01.
- **Consolidating repeated `.my-app-dark` overrides into a shared CSS file** — defer until a clear duplication pattern emerges from the audit.
- **High-contrast theme variant** beyond light/dark — THEME-ADV-03.
- **Dark-variant brand logo SVG** — if a `dark:invert` filter on the existing SVG isn't acceptable, designing a separate logo asset is a polish task, not blocking.

</deferred>

---

*Phase: 20-site-shell-non-app-pages*
*Context gathered: 2026-05-18*
