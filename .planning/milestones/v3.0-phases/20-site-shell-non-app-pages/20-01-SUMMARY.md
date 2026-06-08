---
phase: 20-site-shell-non-app-pages
plan: 01
subsystem: site-shell
tags: [dark-mode, theming, css-variables, vue-scoped-css, accessibility]
requires:
  - phase: 18
    provides: "@custom-variant dark + .my-app-dark token overrides in base.css"
  - phase: 19
    provides: "useTheme composable + NavBar toggle button + FOUC script"
provides:
  - "Site shell dark mode coverage for HeroSection, AboutMeSection, ProjectsView, BlogView, AboutView, Login, CustomNavBar"
  - "--color-mix-target reusable CSS variable for theme-aware color-mix(...) calls"
  - "Per-component :global(.my-app-dark) override pattern (proven in Vue SFC <style scoped>)"
affects:
  - src/assets/base.css
  - src/components/HeroSection.vue
  - src/components/AboutMeSection.vue
  - src/views/ProjectsView.vue
  - src/components/Login.vue
  - src/views/BlogView.vue
  - src/views/AboutView.vue
  - src/components/CustomNavBar.vue
tech-stack:
  added: []
  patterns:
    - ":global(.my-app-dark) <selector> inside <style scoped> for piercing Vue scoped CSS"
    - "var(--color-mix-target) as the second color in color-mix(...) for theme-aware blends"
    - "!important specificity matching between light + dark override rules"
key-files:
  created:
    - .planning/phases/20-site-shell-non-app-pages/20-HUMAN-UAT.md
  modified:
    - src/assets/base.css
    - src/components/HeroSection.vue
    - src/components/AboutMeSection.vue
    - src/views/ProjectsView.vue
    - src/components/Login.vue
    - src/views/BlogView.vue
    - src/views/AboutView.vue
    - src/components/CustomNavBar.vue
decisions:
  - "Used :global(.my-app-dark) inside <style scoped> rather than non-scoped style block or shared CSS file — keeps decorative tuning component-local (D-02)"
  - "Introduced single new --color-mix-target var in base.css; the only base.css edit in Phase 20 (D-05)"
  - "ProjectsView WIP tag dark text uses literal #fdf3dc (light amber) rather than --color-brand-accent-light token (which is dark amber in dark mode) — D-08 specificity reasoning preserved"
  - "AboutView placeholder upgraded with bg-surface-page + token-based heading rather than left bare — minimal-effort consistency with other views"
  - "HomeView.vue intentionally untouched; inherits theme behavior from HeroSection + AboutMeSection children"
metrics:
  duration_minutes: 12
  tasks_completed: 8
  files_modified: 8
  files_created: 1
  commits: 8
  completed: "2026-05-18"
---

# Phase 20 Plan 01: Site Shell & Non-App Pages Summary

**One-liner:** Audited 7 site-shell surfaces and added `--color-mix-target` plus per-component `:global(.my-app-dark)` scoped overrides + Tailwind `dark:` utility variants so HomeView, ProjectsView, BlogView, AboutView, Login, and CustomNavBar all render correctly when `.my-app-dark` is on `<html>`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add --color-mix-target var to base.css | 7ab0f5a | src/assets/base.css |
| 2 | HeroSection color-mix + navy blob overrides | 1c2d182 | src/components/HeroSection.vue |
| 3 | AboutMeSection social-btn hover override | 26b7cd3 | src/components/AboutMeSection.vue |
| 4 | ProjectsView WIP + Active chip overrides | 436367f | src/views/ProjectsView.vue |
| 5 | Login dark: variants for text-black classes | cc41976 | src/components/Login.vue |
| 6 | BlogView dark:opacity-80 + AboutView placeholder styling | a9c41f0 | src/views/BlogView.vue, src/views/AboutView.vue |
| 7 | CustomNavBar Avatar dark:invert | 0a6c108 | src/components/CustomNavBar.vue |
| 8 | 20-HUMAN-UAT.md | 69ec2f3 | .planning/phases/20-site-shell-non-app-pages/20-HUMAN-UAT.md |

## Key Changes Per File

### `src/assets/base.css`
- Added `--color-mix-target: #ffffff` in `@theme` block (light).
- Added `--color-mix-target: #0d1117` in `.my-app-dark` block (dark).
- No other lines modified. Existing Phase 18 token overrides preserved.

### `src/components/HeroSection.vue`
- Migrated `color-mix(in srgb, var(--color-brand-accent) 85%, white)` → `..., var(--color-mix-target))` so the CTA hover lightens toward white in light mode and toward dark page-bg in dark mode.
- Refactored 3 inline-style navy decorative blobs (`rgba(0, 34, 68, X)`) to classes `.hero-blob-navy-1/2/3` with paired light + `:global(.my-app-dark)` rules that switch to amber rgba on dark.
- Left the 2 amber decorative blobs (`rgba(232, 152, 32, X)`) as inline styles unchanged (per D-07).

### `src/components/AboutMeSection.vue`
- Added `:global(.my-app-dark) .about-social-btn:hover { background-color: rgba(232, 152, 32, 0.18) !important; }` to bump the hover chip alpha on dark while matching the light-mode rule's `!important` specificity (D-08).

### `src/views/ProjectsView.vue`
- Added `:global(.my-app-dark) .projects-tag-wip` override with `color: #fdf3dc !important` (light amber text) so the WIP chip text is legible on dark (light-mode `#b07010` dark-amber text would be invisible against a dark-amber chip background).
- Added `:global(.my-app-dark) .projects-tag-active` override with `color: #6ee7a4 !important` for the same reason on the success chip.
- All override rules use `!important` to match the light-mode rule specificity (D-08).

### `src/components/Login.vue`
- Added `dark:text-white` paired with `text-black` on the h1.
- Added `dark:text-white/80` paired with `text-black/80` on the subtitle.
- Added `dark:text-white/90` paired with `text-black/90` on the "Remember me" label.
- Decorative purple/green/blue radial gradients in `.login-bg` left untouched (intentional subtle blobs).

### `src/views/BlogView.vue`
- Added `dark:opacity-80` to the branding logo (bumped from 60% light → 80% dark for visibility).

### `src/views/AboutView.vue`
- Added `bg-surface-page min-h-screen` to the wrapper and `text-2xl font-bold` + `style="color: var(--color-typo-heading)"` to the h1 so the placeholder page is dark-mode-aware.

### `src/components/CustomNavBar.vue`
- Added `class="dark:invert"` to the brand-mark `<Avatar image="/branding_logo.svg">` so the navy SVG flips to light on dark (D-12 option 1).
- Toggle button, profile dropdown, and `useTheme()` import untouched (Phase 19 contract preserved).

## Anti-Regression Confirmation

The following locked files were verified UNMODIFIED across all 8 commits (`git diff --name-only HEAD~8..HEAD`):

- `src/main.ts` (Phase 17 PrimeVue darkModeSelector lock)
- `src/composables/useTheme.ts` (Phase 19 toggle contract lock)
- `src/composables/useIsMobile.ts` (Phase 17 lock)
- `src/assets/wallecx-overrides.css` (Phase 22 scope)
- `src/components/projects/wallecx/**` (Phase 22 scope)
- `src/components/projects/lextrack/**`, `larga/**`, `gift-exchange/**`, `api-playground/**` (Phase 21 scope)
- `src/views/HomeView.vue` (intentionally untouched — inherits from HeroSection + AboutMeSection children)

## Verification

- `npm run type-check` → exit 0
- `npm run build-only` → exit 0 (built in 1.95s; PWA precache 56 entries / 4969 KiB)
- All 8 per-task automated grep checks passed before committing.
- 8 atomic commits landed on `feat/wallecx` branch.

## Deviations from Plan

None — plan executed exactly as written. The exact patterns specified in each task's `<action>` block matched the source files on disk (`text-black` / `text-black/80` / `text-black/90` strings verified before Login.vue edit; Avatar at `CustomNavBar.vue:91` confirmed had no existing `class` prop to merge).

## Reusable Patterns Introduced

1. **`--color-mix-target` variable** is now available globally. Any future component using `color-mix(in srgb, <accent> X%, <fixed-color>)` can route the second color through `var(--color-mix-target)` and inherit theme switching for free.
2. **`:global(.my-app-dark)` inside `<style scoped>`** is now established as the canonical pattern for per-component dark overrides. Repeated in 4 Vue SFCs this phase.
3. **`!important` specificity matching** is now an explicit rule (D-08) — any `:global(.my-app-dark)` override of a `!important` rule must also be `!important`.

## Follow-Up Items (Deferred to UAT)

- Hero amber blobs (2 inline rgba styles) left untouched per D-07. If UAT shows they fade out on dark, follow-up is to add `:global(.my-app-dark) .hero-blob-amber-*` rules that bump alpha.
- ProjectsView CTA button uses `color: #ffffff` on `var(--color-brand-primary)` — light navy + white = great, dark navy `#7896ba` + white = borderline. UAT-driven.
- DiceBear identicon SVG (`<Avatar :image="avatarImage">`) untouched — randomized multi-color SVGs typically high-contrast. UAT to flag.
- PrimeVue Menubar/Menu items rely on Phase 18 variant alignment — pre-emptive `.my-app-dark .p-menubar` overrides intentionally NOT added (D-13).

## Self-Check: PASSED

- All 8 expected commits exist (`git log --oneline -10` confirmed: 7ab0f5a, 1c2d182, 26b7cd3, 436367f, cc41976, a9c41f0, 0a6c108, 69ec2f3).
- `.planning/phases/20-site-shell-non-app-pages/20-HUMAN-UAT.md` exists.
- All 8 source files modified are present in `git diff --name-only HEAD~8..HEAD`; anti-regression files absent.
- `npm run type-check` and `npm run build-only` both exited 0.
