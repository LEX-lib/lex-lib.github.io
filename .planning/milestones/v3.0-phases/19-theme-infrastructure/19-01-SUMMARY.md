---
phase: 19
plan: 01
subsystem: theme-infrastructure
tags: [theme, dark-mode, composable, fouc, navbar]
dependency_graph:
  requires:
    - src/main.ts (darkModeSelector ".my-app-dark" — Phase 17, unchanged)
    - src/assets/base.css (@custom-variant dark + token overrides — Phase 18, unchanged)
  provides:
    - "useTheme(): { theme: Readonly<Ref<'light'|'dark'>>, toggle, setTheme }"
    - "Synchronous .my-app-dark class application before first paint"
    - "NavBar sun/moon toggle visible on every route"
  affects:
    - Phases 20–22 (consume useTheme + the reliably-applied .my-app-dark class)
tech_stack:
  added: []
  patterns:
    - "Module-level singleton Ref shared across all useTheme() callers"
    - "Inline synchronous FOUC-prevention script in <head>"
    - "MediaQueryList listener with localStorage-override short-circuit"
key_files:
  created:
    - src/composables/useTheme.ts
  modified:
    - index.html
    - src/components/CustomNavBar.vue
decisions:
  - "Storage key 'lexarium:theme' and class 'my-app-dark' duplicated in inline script + composable (D-10 byte-for-byte sync)"
  - "Module-scope Ref (not inside useTheme) for cross-component singleton (D-04)"
  - "Composable hydrates from documentElement.classList — inline script is the source of truth at boot (D-04)"
  - "OS prefers-color-scheme listener attached at module scope, not in onMounted (D-06)"
  - "OS listener short-circuits when localStorage has a value (D-07); does NOT write to localStorage itself (D-08)"
  - "Imported toggle aliased as toggleTheme in NavBar to avoid colliding with existing Avatar Menu toggle local"
metrics:
  duration_minutes: 4
  completed: "2026-05-18T10:51:23Z"
  task_count: 3
  file_count: 3
---

# Phase 19 Plan 01: Theme Infrastructure Summary

One-liner: Synchronous FOUC script + module-singleton `useTheme()` composable + NavBar sun/moon toggle, all sharing `'lexarium:theme'` localStorage key and `'my-app-dark'` html class.

## Files Created / Modified

| File | Change | Commit |
| ---- | ------ | ------ |
| `index.html` | Added inline FOUC `<script>` block + `<meta name="color-scheme" content="light dark">` in `<head>` before `</head>`. Synchronous, no async/defer/module. | f498374 |
| `src/composables/useTheme.ts` | New. Module-level singleton `theme` Ref, `setTheme`/`toggle` (atomic Ref + class + localStorage write), MediaQueryList listener that follows OS while no explicit choice. | 00d230f |
| `src/components/CustomNavBar.vue` | Added `useTheme` import, destructured `toggle` aliased as `toggleTheme`, inserted Button + iconify-icon as first child of `#end` slot's `<div>`. Reactive icon (`mdi:weather-sunny` vs `mdi:weather-night`) and aria-label swap. | ee9346a |

## Contract Artifact (consumed by Phases 20–22)

```ts
// src/composables/useTheme.ts
export function useTheme(): {
  theme: Readonly<Ref<'light' | 'dark'>>
  toggle: () => void
  setTheme: (t: 'light' | 'dark') => void
}
```

Storage contract (mirrored byte-for-byte in `index.html` inline script):
- Key: `'lexarium:theme'`
- Values: `'light'` | `'dark'`
- Class: `'my-app-dark'` on `document.documentElement`

## Key Decisions Made

1. **Module-scope Ref (D-04).** `const theme = ref<Theme>(...)` lives outside `useTheme()` so every call returns the same reactive state. The NavBar toggle propagates to any other component reading `theme` automatically.
2. **Hydration from DOM, not from localStorage.** The composable reads `document.documentElement.classList.contains('my-app-dark')` to initialize the Ref. The inline script in `index.html` is the source of truth at boot; the composable just observes its result. This avoids a hydration race.
3. **Inline script wrapped in try/catch.** Defensive against embedded WebViews that throw on `localStorage` access (private mode, sandboxed iframes). On catch, falls back to `prefers-color-scheme`.
4. **OS listener at module scope.** Listener lives for the lifetime of the page — not tied to any component's lifecycle. Avoids attach/detach churn and ensures site-wide reactivity.
5. **Listener short-circuit, no detach (D-07).** When the user toggles, `localStorage` gets a value; the OS listener's callback then sees it and no-ops. Clearing localStorage manually (DevTools) resumes OS-following behavior.
6. **Local alias for imported `toggle`.** `CustomNavBar.vue` already had `const toggle = (event: Event) => menu.value.toggle(event)` for the Avatar profile menu popup. Renaming would break Phase-prior code; instead destructured `useTheme().toggle` as `toggleTheme`.

## Anti-Regression Confirmation

Verified via `git diff --name-only b427593..HEAD`:

- `src/main.ts` — NOT modified. `darkModeSelector: ".my-app-dark"` configuration intact (Phase 17 lock).
- `src/assets/base.css` — NOT modified. `@custom-variant dark` + Phase 18 token overrides intact.
- `src/assets/wallecx-overrides.css` — NOT modified. Phase 18 PrimeVue Card overrides intact.

Only three files in the plan's `files_modified` were touched.

## Verification Results

| Check | Result |
| ----- | ------ |
| Task 1 acceptance script (FOUC strings + placement) | OK |
| Task 2 acceptance script (composable structure + module-scope Ref) | OK |
| Task 3 acceptance script (NavBar import + icon/aria strings) | OK |
| `npm run type-check` | exit 0 |
| `npm run build-only` | exit 0 (built in 1.85s) |
| FOUC `<script>` placement: in `<head>` and BEFORE `<script type="module" src="/src/main.ts">` | confirmed |
| Storage key `'lexarium:theme'` present in both `index.html` and `useTheme.ts` | confirmed |
| Class `'my-app-dark'` present in both `index.html` and `useTheme.ts` | confirmed |
| Module-scope `theme` Ref (not inside `useTheme()`) | confirmed |

## Deviations from Plan

None — the plan executed exactly as written. All three `<action>` snippets were copied verbatim from `19-CONTEXT.md` §Specific Ideas. No Rule 1/2/3 auto-fixes were needed.

## Authentication Gates

None encountered.

## Deferred / Out-of-Scope (per plan)

- No dark-mode CSS added to any page or mini-app (Phases 20–22 scope).
- No animated transitions (THEME-ADV-02, deferred).
- No PocketBase sync of theme preference (THEME-ADV-01, deferred).
- No new npm packages.

## Self-Check: PASSED

- `index.html` exists and contains FOUC script — confirmed via grep above.
- `src/composables/useTheme.ts` exists — confirmed by Task 2 acceptance script.
- `src/components/CustomNavBar.vue` modified — confirmed by Task 3 acceptance script.
- Commits `f498374`, `00d230f`, `ee9346a` all present in `git log`.
