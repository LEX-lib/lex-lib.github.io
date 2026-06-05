# Phase 19: Theme Infrastructure - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the single source of truth for site-wide theme state. The system reads OS `prefers-color-scheme` as the first-visit default, allows manual override via a NavBar sun/moon toggle button, persists the user's choice in localStorage, and applies the `.my-app-dark` class to `<html>` synchronously before first paint (no FOUC). This phase only delivers the infrastructure — it does NOT add dark-mode CSS to any pages or mini-apps (those are Phases 20–22).

**In scope:** THEME-01 (useTheme composable), THEME-02 (toggle behavior + localStorage write + .my-app-dark class application), THEME-03 (NavBar toggle button visible on every route).

**Out of scope:** Any dark-mode rendering work on site shell, non-app pages, mini-apps, or Wallecx (those are Phases 20–22 respectively). PocketBase sync of theme preference (deferred as THEME-ADV-01). Animated transitions between themes (deferred as THEME-ADV-02). Additional theme variants beyond light/dark.

</domain>

<decisions>
## Implementation Decisions

### FOUC Prevention — Inline Script in index.html
- **D-01:** Add a small synchronous `<script>` block in `index.html` `<head>` that runs BEFORE Vue mounts. It reads `localStorage.getItem('lexarium:theme')` → falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches` → adds `.my-app-dark` to `document.documentElement` if the resolved theme is `'dark'`. This is the canonical FOUC-prevention pattern (Tailwind docs, Vercel, etc.). The composable then hydrates from the already-applied state on mount, so the two stay in sync.
- **D-02:** The inline script must be **synchronous** (no `async`, no `defer`) and live in `<head>` BEFORE any CSS `<link>` or `<script type="module">` tags so the class is applied before stylesheets are processed.

### Composable API — `useTheme()`
- **D-03:** `src/composables/useTheme.ts` exports a single function `useTheme()` returning `{ theme, toggle, setTheme }`:
  - `theme: Readonly<Ref<'light' | 'dark'>>` — reactive current theme (read-only by design; callers can't mutate directly to avoid bypassing side effects)
  - `toggle: () => void` — flips light↔dark
  - `setTheme: (t: 'light' | 'dark') => void` — explicit set
- **D-04:** Internal state is a module-level (singleton) Ref initialized on first call from `document.documentElement.classList.contains('my-app-dark')` (already set by the inline script). All callers share the same Ref — calling `useTheme()` in NavBar and in any other component returns the same reactive state.
- **D-05:** `setTheme` and `toggle` both: (a) update the internal Ref, (b) call `document.documentElement.classList.add/remove('my-app-dark')`, (c) `localStorage.setItem('lexarium:theme', value)`. All three happen atomically inside the setter.

### Live OS Preference Listener
- **D-06:** On first `useTheme()` call, attach a `MediaQueryList.addEventListener('change', ...)` listener to `window.matchMedia('(prefers-color-scheme: dark)')`. The listener only acts when `localStorage.getItem('lexarium:theme')` is `null` (i.e. user has not made an explicit choice yet) — in that case, OS theme changes flow through to `setTheme()` and the site follows the OS live.
- **D-07:** Once the user explicitly toggles (i.e. `localStorage.getItem('lexarium:theme')` is no longer null), the OS listener becomes inert (still attached, but its callback short-circuits because localStorage now has a value). This preserves the "user choice wins" rule without needing to detach/reattach the listener.
- **D-08:** If the user clears localStorage manually (e.g. via DevTools) and the OS preference changes, the site will resume following OS preference — this is acceptable behavior and matches user expectation.

### Storage Contract
- **D-09:** localStorage key: `lexarium:theme`. Values: literal strings `'light'` or `'dark'` (no JSON serialization — keep it simple).
- **D-10:** The inline script and the composable MUST use the exact same key and value format. Any drift will cause a hydration mismatch.

### NavBar Toggle Button
- **D-11:** Toggle button placed in `CustomNavBar.vue` `#end` slot, BEFORE the Login button / Avatar. The button is visible on every route because CustomNavBar.vue is mounted in `App.vue` at the route shell level.
- **D-12:** Icon family: **Iconify mdi:*** via `<iconify-icon>` web component (matches existing NavBar pattern — Home/Projects/Blogs all use `mdi:*` icons).
  - When dark mode is active: show `mdi:weather-sunny` (clicking returns to light)
  - When light mode is active: show `mdi:weather-night` (clicking enters dark)
- **D-13:** Button styling: use PrimeVue `<Button variant="text">` (consistent with the Login/profile button in the same slot). Size matches sibling buttons.
- **D-14:** Accessibility:
  - `aria-label="Switch to dark mode"` when light is active
  - `aria-label="Switch to light mode"` when dark is active
  - Icon itself has `aria-hidden="true"` (the button's aria-label is the only screen-reader-exposed text)

### Composable Pattern
- **D-15:** Mirror the `useIsMobile.ts` pattern from Phase 17: single named export, small focused composable, `onMounted`/`onUnmounted` lifecycle for any listeners. Live in `src/composables/`. TypeScript strict.

### Anti-Regression for Wallecx
- **D-16:** Manually toggling `.my-app-dark` on `<html>` via DevTools must still produce identical visual results to Phase 18's behavior. The composable's effect (toggling that class) is the same input Wallecx's CSS is already designed for. Wallecx audit is Phase 22's job, but Phase 19 must not regress the existing flow.

### Claude's Discretion
- Exact button dimensions/padding — match sibling buttons in `#end` slot.
- Whether to wrap the inline script in a try/catch for environments where localStorage is unavailable (e.g. some embedded WebViews) — recommended yes, defensively.
- Whether `theme` is exposed as `Readonly<Ref>` via Vue's `readonly()` wrapper or just by convention (TypeScript type-only readonly) — pick whichever is idiomatic for the codebase.
- Whether to also write a tiny `meta name="color-scheme" content="light dark"` tag in `index.html` so native form controls (scrollbars, dropdowns) match the active theme — recommended yes, low cost.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Theme Infrastructure (THEME-01, THEME-02, THEME-03)

### Roadmap
- `.planning/ROADMAP.md` §Phase 19 — Goal, success criteria (SC 1–4), dependencies

### Project State
- `.planning/STATE.md` §Architectural Invariants — locked rules including the `darkModeSelector: ".my-app-dark"` already configured in `src/main.ts`

### Prior Phase Context (patterns to carry forward)
- `.planning/phases/17-mobile-bottom-sheets-view-toggle/17-CONTEXT.md` — `useIsMobile` composable pattern (single named export, matchMedia + listener) — `useTheme` mirrors this shape
- `.planning/phases/18-dark-mode-fixes/18-CONTEXT.md` — `@custom-variant dark` already in base.css; custom `@theme` token dark overrides already in base.css; `.my-app-dark` selector contract

### External Docs (PrimeVue official, established in Phase 18)
- `https://primevue.org/tailwind/#darkmode` — Tailwind dark-mode setup with PrimeVue (the variant alignment that makes this whole system work)

### Files to Modify
- `index.html` — add inline FOUC-prevention script in `<head>` (before any CSS link or module script); optionally add `<meta name="color-scheme" content="light dark">`
- `src/components/CustomNavBar.vue` — add toggle button to `#end` slot; wire to `useTheme().toggle`

### Files to Create
- `src/composables/useTheme.ts` — composable exporting `useTheme()`

### Files Untouched
- `src/main.ts` — `darkModeSelector: ".my-app-dark"` already configured (Phase 17 anti-regression)
- `src/assets/base.css` — `@custom-variant dark` and custom theme dark overrides already present (Phase 18 work)
- `src/assets/wallecx-overrides.css` — Phase 18 overrides intact; no changes
- All Wallecx components — Phase 22 will audit them; not Phase 19's scope
- All non-Wallecx pages and mini-apps — Phases 20–21 scope

</canonical_refs>

<code_context>
## Existing Code Insights

### Currently configured (no changes needed)
- `src/main.ts:89` — `darkModeSelector: ".my-app-dark"` configured in PrimeVue theme options
- `src/assets/base.css:3` — `@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));` (Phase 18)
- `src/assets/base.css` `.my-app-dark` block — overrides for custom `--color-typo-*`, `--color-brand-*`, `--color-surface-*` tokens (Phase 18 follow-up)
- `src/components/projects/wallecx/MembershipCard.vue` — `pickTextColor` WCAG luminance helper (Phase 18)

### Existing patterns to mirror
- `src/composables/useIsMobile.ts` — single named export, `window.matchMedia`, `onMounted`/`onUnmounted` lifecycle. `useTheme` follows the same shape.
- `src/components/CustomNavBar.vue:85-145` — PrimeVue `<Menubar>` with `#start` (logo) and `#end` (login/avatar) slots. Toggle button goes in `#end`.
- `src/components/CustomNavBar.vue:95-97` — `<iconify-icon :icon="item.icon" width="24" height="24">` is the established icon rendering pattern in the NavBar.

### Reusable assets
- `<iconify-icon>` web component — already in use; `mdi:weather-sunny` and `mdi:weather-night` resolve via the existing Iconify setup, no new dependency
- PrimeVue `<Button variant="text">` — same style as the existing Login/profile button in `#end`
- `App.vue` already imports `CustomNavBar` and renders it above `RouterView` — toggle is automatically visible on every route

### Integration points
- `index.html` `<head>` is the only correct place for the FOUC script
- `App.vue` doesn't need changes — `CustomNavBar` already lives there
- The composable's first call (on `useTheme()` instantiation) reads `document.documentElement.classList.contains('my-app-dark')` to hydrate from the inline script's pre-mount state

</code_context>

<specifics>
## Specific Ideas

### Inline FOUC script (for `index.html` `<head>`, BEFORE CSS links)

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('lexarium:theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored || (prefersDark ? 'dark' : 'light');
      if (theme === 'dark') {
        document.documentElement.classList.add('my-app-dark');
      }
    } catch (e) {
      // localStorage unavailable (private mode in some browsers); fall back to OS preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('my-app-dark');
      }
    }
  })();
</script>
<meta name="color-scheme" content="light dark" />
```

### `src/composables/useTheme.ts` skeleton

```ts
import { ref, readonly, type Ref } from 'vue'

const STORAGE_KEY = 'lexarium:theme'
const DARK_CLASS = 'my-app-dark'

type Theme = 'light' | 'dark'

const theme = ref<Theme>(
  document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light'
)

function applyTheme(value: Theme): void {
  if (value === 'dark') {
    document.documentElement.classList.add(DARK_CLASS)
  } else {
    document.documentElement.classList.remove(DARK_CLASS)
  }
}

function setTheme(value: Theme): void {
  theme.value = value
  applyTheme(value)
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // localStorage unavailable; in-memory state still works
  }
}

function toggle(): void {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

// One-time OS preference listener — only acts when user has no explicit choice
const mql = window.matchMedia('(prefers-color-scheme: dark)')
mql.addEventListener('change', (e) => {
  let hasExplicitChoice = false
  try {
    hasExplicitChoice = localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    hasExplicitChoice = false
  }
  if (!hasExplicitChoice) {
    const next: Theme = e.matches ? 'dark' : 'light'
    theme.value = next
    applyTheme(next)
    // Do NOT write to localStorage — keep OS-tracking mode active
  }
})

export function useTheme() {
  return {
    theme: readonly(theme) as Readonly<Ref<Theme>>,
    toggle,
    setTheme,
  }
}
```

### CustomNavBar.vue `#end` slot — toggle button

```html
<template #end>
  <div class="flex items-center gap-2">
    <Button
      variant="text"
      type="button"
      :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    >
      <iconify-icon
        :icon="theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'"
        width="24"
        height="24"
        aria-hidden="true"
      />
    </Button>

    <Button @click="router.push('/login')" v-if="!auth.isLoggedIn">
      Log In
    </Button>
    <!-- ...existing profile button... -->
  </div>
</template>
```

```ts
// at top of <script setup> in CustomNavBar.vue
import { useTheme } from '@/composables/useTheme'
const { theme, toggle } = useTheme()
```

</specifics>

<deferred>
## Deferred Ideas

- **Animated transitions between themes** (THEME-ADV-02) — CSS variable interpolation across body background and text colors. Polish item; instant toggle is acceptable for v3.0.
- **PocketBase sync of theme preference** (THEME-ADV-01) — schema migration + per-user record; localStorage covers anonymous and authenticated users for v3.0.
- **Theme picker UI with named variants** (THEME-ADV-03) — sepia, high-contrast, etc.; only light/dark for v3.0.
- **Auto-schedule theme based on sunset/sunrise** — out of scope; users can rely on OS-level scheduling.
- **Visible "follow system" indicator on the toggle** — third state showing "auto / OS-following" mode. Considered but rejected — adds UI complexity for marginal gain; reset by clearing localStorage in DevTools is sufficient for now. Could revisit in a future polish phase.

</deferred>

---

*Phase: 19-theme-infrastructure*
*Context gathered: 2026-05-18*
