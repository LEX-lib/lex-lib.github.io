---
phase: 37-pwa-install-standalone-polish
plan: "02"
subsystem: pwa-offline-banner
tags: [pwa, offline, ux, vue3, vueuse, teleport]
dependency_graph:
  requires: []
  provides: [OfflineBanner.vue, App.vue-OfflineBanner-mount]
  affects: [src/App.vue, src/components/OfflineBanner.vue, .planning/ROADMAP.md, .planning/REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: [useOnline-reactive-banner, Teleport-to-body-fixed-panel]
key_files:
  created:
    - src/components/OfflineBanner.vue
  modified:
    - src/App.vue
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - components.d.ts
decisions:
  - "No retry button: useOnline reactivity IS the retry mechanism (D-37-11)"
  - "Amber status-warning bg (#e89820) via CSS var token — theme-independent in both light and dark (base.css status tokens)"
  - "paddingTop: env(safe-area-inset-top) on top-fixed banner keeps content below iOS status bar"
  - "Teleport to body for stacking-context independence; z-50 matches PwaInstallBanner; coexists with bottom-fixed install banner"
  - "OfflineBanner first in App.vue template before CustomNavBar for readability; Teleport placement governs actual DOM position"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_changed: 5
---

# Phase 37 Plan 02: OfflineBanner + App.vue Mount + Docs Reword Summary

**One-liner:** Site-wide offline banner using `useOnline` from `@vueuse/core`, Teleport to body, fixed amber top, no retry button; mounted in App.vue; ROADMAP and REQUIREMENTS reworded to align with useOnline-reactive design (D-37-12).

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create OfflineBanner.vue | 1c91ebe | src/components/OfflineBanner.vue (created) |
| 2 | Mount in App.vue + reword docs | 22a1a62 | src/App.vue, .planning/ROADMAP.md, .planning/REQUIREMENTS.md, components.d.ts |

---

## OfflineBanner.vue Final Structure

**File:** `src/components/OfflineBanner.vue` (23 lines)

- `<script setup lang="ts">` — imports ONLY `useOnline` from `@vueuse/core`; binds `const isOnline = useOnline()`
- No watchers, no `onMounted`, no props/emits — purely presentational
- Template: `<Teleport to="body">` wrapping a single `<div v-if="!isOnline">`
- Classes: `fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2`
- Inline `:style` binding:
  - `backgroundColor: 'var(--color-status-warning)'` — resolves to `#e89820` in both light and dark (status tokens are theme-independent per base.css)
  - `paddingTop: 'env(safe-area-inset-top)'` — keeps banner below iOS status bar
  - `color: '#0d1117'` — dark text on amber for AA contrast; white would wash
- Accessibility: `role="status"` + `aria-live="polite"`
- Copy: `You're offline. Changes will resume when you reconnect.` (exact string, D-37-11 locked)
- No `<button>` element — zero count confirmed (D-37-11 no retry button)

Key link: `from '@vueuse/core'` → `useOnline()` return type `Ref<boolean>`; `v-if="!isOnline"` drives visibility without any additional reactive overhead.

---

## App.vue Diff Scope

**File:** `src/App.vue` (script: 1 import line added; template: 1 component mount added)

**Script change:** Added `import OfflineBanner from "@/components/OfflineBanner.vue";` after the `CustomNavBar` import and before the `Toaster` import — imports stay grouped.

**Template change:** Added `<OfflineBanner />` as the FIRST sibling element in `<template>`, before `<CustomNavBar />`.

**Phase 33 substrate preserved (FND-02 byte-intact confirmation):**
- `handleBeforeInstallPrompt` function: PRESENT
- `handleAppInstalled` function: PRESENT
- `setInstallPromptEvent` import: PRESENT
- `clearInstallPromptEvent` import: PRESENT
- `window.addEventListener("beforeinstallprompt", ...)`: PRESENT
- `window.addEventListener("appinstalled", ...)`: PRESENT
- `onMounted` / `onUnmounted` teardown: PRESENT

---

## ROADMAP.md SC#4 Before/After

**Before:**
> `4. Going offline (airplane mode) inside the installed PWA shows a clear offline banner with a retry affordance; reconnecting clears the banner; existing NetworkOnly /api/* toast behavior remains intact`

**After:**
> `4. Going offline (airplane mode) inside the installed PWA shows a clear offline banner; the banner auto-clears when navigator goes back online (useOnline reactive); existing NetworkOnly /api/* toast behavior remains intact`

**Also fixed:** Goal line in Phase 37 description that contained "retry affordance" — replaced with "auto-clears when navigator goes back online (useOnline reactive)".

---

## REQUIREMENTS.md PWA-07 Before/After

**Before:**
> `**PWA-07**: Offline banner backed by useOnline shows when navigator goes offline (in addition to existing NetworkOnly /api/* toast behavior); retry affordance offered on reconnect`

**After:**
> `**PWA-07**: Offline banner backed by useOnline shows when navigator goes offline (in addition to existing NetworkOnly /api/* toast behavior); banner auto-clears when navigator goes back online (useOnline reactive)`

---

## Gate Results

| Gate | Result |
|------|--------|
| `npm run type-check` (Task 1) | PASS — exits 0 |
| Component content verification script | PASS — OK |
| `npm run test:unit` (Task 1) | PASS — 59/59 tests |
| `npm run type-check` (Task 2) | PASS — exits 0 |
| App.vue + docs verification script | PASS — OK |
| `npm run test:unit` (Task 2) | PASS — 59/59 tests |
| `npm run build` (Task 2) | PASS — 73 precache entries, 0 "exceeds", 0 "Skipping precaching" (NFR-PWA-PRECACHE-FITS) |
| `<button` count in OfflineBanner.vue | PASS — 0 (no retry button, D-37-11) |
| ROADMAP.md `grep "retry affordance"` | PASS — 0 matches |
| REQUIREMENTS.md `grep "retry affordance offered on reconnect"` | PASS — 0 matches |

---

## Deviations from Plan

None — plan executed exactly as written.

The only additional change beyond the plan's specified files was updating `components.d.ts` (auto-generated by `unplugin-vue-components` when `npm run build` ran) to include the `OfflineBanner` component auto-import declaration. This is expected and intentional — the file is tracked and registers new globally available components. It was committed alongside the Task 2 files.

---

## Known Stubs

None — `OfflineBanner.vue` is fully wired to `useOnline` from `@vueuse/core` with no hardcoded empty values or placeholder text.

---

## Threat Flags

No new threat surface introduced:
- `OfflineBanner.vue` reads only `navigator.onLine` via `useOnline` (browser API, no user input, no PII)
- `App.vue` receives only a new component mount — no new network endpoints, auth paths, or schema changes
- Static amber banner renders only when offline; disappears automatically on reconnect

T-37-02-01 through T-37-02-SC from the plan's threat model — all accepted or already mitigated by z-50 stacking.

---

## Self-Check

### Created files exist:

- `src/components/OfflineBanner.vue` — FOUND
- `.planning/phases/37-pwa-install-standalone-polish/37-02-SUMMARY.md` — this file

### Commits exist:

- `1c91ebe` — feat(37-02): create OfflineBanner.vue — FOUND
- `22a1a62` — feat(37-02): mount OfflineBanner in App.vue; reword ROADMAP + REQUIREMENTS PWA-07 — FOUND

## Self-Check: PASSED
