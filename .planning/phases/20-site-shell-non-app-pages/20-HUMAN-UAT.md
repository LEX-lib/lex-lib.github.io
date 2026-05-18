# Phase 20 Human UAT — Site Shell & Non-App Pages Dark Mode

**Created:** 2026-05-18
**Phase:** 20-site-shell-non-app-pages
**Requirements covered:** THEME-04, THEME-05, THEME-06, THEME-07, THEME-08
**Tester:** human (visual confirmation only — code-verifiable structural fixes already passed)

## How to Run

1. `npm run dev`
2. Open http://localhost:5173/ in a Chromium-based browser
3. Open DevTools → Device Toolbar; have a 375px-wide mobile preset ready (e.g. iPhone SE)
4. For each row below, test in BOTH viewports (375px + ≥ 640px / desktop ≥ 1024px) AND BOTH themes (light + dark)
5. Toggle theme via the sun/moon button in the NavBar (top-right)

## UAT Checklist

### SC-1: Home Page (HeroSection + AboutMeSection) — THEME-04
- [ ] Light mode 375px: hero name "Cedrick Jhan" visible, body text readable, "About Me" CTA legible, navy + amber decorative blobs subtly visible
- [ ] Light mode desktop: same as above, plus image side decoration visible
- [ ] Dark mode 375px: hero name renders LIGHT (not dark), body text readable on dark page, "About Me" CTA visible with amber background + dark navy text; navy blobs replaced by amber-tinted blobs (NOT invisible black/blue rectangles)
- [ ] Dark mode desktop: same as above
- [ ] About section: photo visible, "About Me" heading light on dark, body text readable, blockquote callout has visible amber accent, social buttons (LinkedIn + email) visible with amber hover effect

### SC-2: ProjectsView — THEME-05
- [ ] Light mode 375px: 5 project tiles render in single column; titles visible, descriptions readable, WIP/Active tags clearly colored (amber/green), tech tags subtle
- [ ] Light mode desktop: 2-column grid; same legibility
- [ ] Dark mode 375px: tile backgrounds are dark (not white), tile borders visible but subtle, project titles light on dark, descriptions readable, WIP tag chip background visibly amber-tinted with LIGHT amber/cream text (NOT dark amber `#b07010` which would be invisible), Active tag chip with light green text
- [ ] Dark mode desktop: same as above
- [ ] CTA "View Project" button: navy/blue button background, white text legible on both themes

### SC-3: BlogView — THEME-06
- [ ] Light mode 375px + desktop: branding logo visible at 60% opacity, "Blog coming soon" heading dark, body subtitle readable
- [ ] Dark mode 375px + desktop: branding logo visible (opacity bumped to 80% on dark via `dark:opacity-80`), heading light, subtitle readable on dark page

### SC-4: Login — THEME-07
- [ ] Light mode 375px + desktop: glass card centered, "Welcome back" h1 black, "Sign in to continue" subtitle visible, email + password float labels work, "Remember me" label visible
- [ ] Dark mode 375px + desktop: glass card still readable, "Welcome back" h1 WHITE (not black, via `dark:text-white`), subtitle white at 80% alpha, "Remember me" white at 90% alpha; decorative purple/green/blue radial gradients still visible (subtle); form fields use PrimeVue dark tokens
- [ ] Error states: trigger a validation error (submit with empty email) — error message visible on both themes

### SC-5: CustomNavBar — THEME-08
- [ ] Light mode: brand logo Avatar visible (navy-on-white), Home/Projects/Blog menu items readable, theme toggle icon (moon) visible, "Log In" button visible
- [ ] Dark mode: brand logo Avatar visible (inverted via `dark:invert` — appears as light amber/cream lines on dark navy), menu items light on dark, theme toggle icon (sun) visible, "Log In" button visible OR (when logged in) DiceBear avatar visible
- [ ] Toggle interaction: clicking the sun/moon button immediately re-themes ALL surfaces with no flash or partial bleed
- [ ] Reload after toggle: theme persists (Phase 19 localStorage contract holds)
- [ ] Profile dropdown (when logged in): clicking the avatar opens the dropdown; "Logout" item visible on both themes

## Failure-Mode Catalog

If any of the following are observed, file a finding in `20-UAT-FINDINGS.md` and re-open the relevant task:

| Symptom | Likely Cause | Reopen Task |
|---|---|---|
| White card faces visible in ProjectsView dark mode | Missing `.my-app-dark` override on `.project-card` background | Task 4 |
| Hero CTA hover button background turns full white in dark | `--color-mix-target` not applied to CSS variable in base.css | Tasks 1 + 2 |
| Hero navy decorative blobs invisible on dark | `:global(.my-app-dark) .hero-blob-navy-*` rules missing or wrong selector | Task 2 |
| About-me social button hover chip invisible on dark | Missing `:global(.my-app-dark) .about-social-btn:hover` override | Task 3 |
| WIP tag text illegible on dark (dark amber on dark amber) | `:global(.my-app-dark) .projects-tag-wip` missing `color: #fdf3dc !important` | Task 4 |
| Login "Welcome back" h1 stays black on dark | `dark:text-white` not applied | Task 5 |
| Blog placeholder logo near-invisible on dark | `dark:opacity-80` not applied | Task 6 |
| NavBar brand logo invisible on dark | `dark:invert` not applied to Avatar | Task 7 |
| PrimeVue Menubar / Menu items show light theme bleed | Phase 18 variant-alignment regression — file in Phase 22 audit | n/a (Phase 22) |
| Wallecx pages look broken | OUT OF SCOPE — Phase 22 owns Wallecx audit | n/a |
| LexTrack/Larga/MonitoX/API Playground broken | OUT OF SCOPE — Phase 21 owns mini-apps | n/a |
| Theme toggle doesn't fire / icon doesn't change | Phase 19 regression — file as Phase 19 follow-up | n/a |

## Out of Scope for This UAT

- Mini-apps (LexTrack, Larga, MonitoX, API Playground) — Phase 21
- Wallecx interior screens — Phase 22
- Animated theme transitions — THEME-ADV-02 (deferred)
- Per-user PocketBase theme sync — THEME-ADV-01 (deferred)

## Sign-Off

- [ ] All checked items verified by tester
- [ ] No critical findings (any "white card face" or "illegible text" = critical)
- [ ] Findings (if any) recorded in `20-UAT-FINDINGS.md`

**Tester:** _________________
**Date:** _________________
