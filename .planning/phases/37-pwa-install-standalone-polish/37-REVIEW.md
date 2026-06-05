---
phase: 37-pwa-install-standalone-polish
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - components.d.ts
  - index.html
  - package.json
  - pwa-assets.config.ts
  - src/App.vue
  - src/components/OfflineBanner.vue
  - src/components/projects/wallecx/ExpensesTab.vue
  - src/components/projects/wallecx/MembershipsTab.vue
  - src/components/projects/wallecx/PwaInstallBanner.vue
  - src/components/projects/wallecx/VaccinationsTab.vue
  - src/components/projects/wallecx/WallecxApp.vue
  - src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts
  - src/router/__tests__/guard.spec.ts
  - vite.config.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 37: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

This phase implements PWA install-banner polish (Android `beforeinstallprompt` flow, iOS instructional banner), standalone-mode gating, 30-day dismissal persistence, SW update prompt, shortcut deep-links via `?action=`, and associated splash/manifest assets.

The majority of the implementation is solid: the module-singleton pattern for `installPromptEvent`, safe-area padding, the dismissal-migration path, and the test structure are all well-reasoned. Two blockers exist. The first is a critical reactivity break in `useMobileEnv.ts` — `isStandalone` is seeded but never wired to update when `standaloneMatch` changes reactively, meaning the PWA install banner hard-gate and the auth-eviction message can misfire. The second is that `pendingAction` in `WallecxApp.vue` is never reset to `null` after being consumed, so shortcut deep-link actions replay every time a tab mounts for the first time after that session.

Four warnings are also present: a flaky async-await timing gap in the `handleAndroidInstall` tests, duplicated `isIosSafari()` logic across two components, an unawaited `router.replace()` that silences navigation errors, and stale-named console error prefixes in `VaccinationsTab.vue`.

---

## Critical Issues

### CR-01: `isStandalone` is never reactively updated — hard gate is broken

**File:** `src/composables/useMobileEnv.ts:104-109`

**Issue:** The comment says "`isStandalone` is kept reactive via the same media query so an install during the session flips it." The implementation contradicts this. `standaloneMatch` (a reactive `Ref<boolean>` from `useMediaQuery`) is queried once with a plain `if` statement at construction time, but there is no `watch` binding it to `isStandalone`. After `useMobileEnv()` returns, `standaloneMatch` updates but `isStandalone` does not — it stays frozen at the value set during construction.

Concrete consequence: `PwaInstallBanner.vue` gates both branches on `isStandalone.value` inside the template (`v-else-if="... && !isStandalone ..."`). If the user installs the PWA during the session (e.g., accepts the Android prompt), `standaloneMatch` flips to `true`, but `isStandalone` remains `false`. The banner would not self-extinguish via the standalone gate. More critically, `WallecxApp.vue` uses `isStandalone.value` in the auth-eviction toast copy; stale value produces the wrong message on non-iOS standalone sessions.

```typescript
// CURRENT — broken: one-shot if, not reactive
const standaloneMatch = useMediaQuery('(display-mode: standalone)')
const isStandalone = ref(detectStandalone())
if (standaloneMatch.value) {
  isStandalone.value = true
}

// FIX — wire a watch so runtime display-mode changes propagate
import { watch } from 'vue'

const standaloneMatch = useMediaQuery('(display-mode: standalone)')
const isStandalone = ref(detectStandalone())
watch(standaloneMatch, (matched) => {
  if (matched) isStandalone.value = true
  // Don't flip back to false — iOS navigator.standalone never fires again
}, { immediate: false })
```

---

### CR-02: `pendingAction` is never reset — shortcut actions replay on every tab first-mount

**File:** `src/components/projects/wallecx/WallecxApp.vue:87-91`

**Issue:** In `onMounted`, `WallecxApp.vue` reads the `?action=` query param, sets `activeTab`, waits a tick, then writes `pendingAction.value = action`. The query string is cleared with `router.replace({ query: {} })`. However, `pendingAction` itself is never reset back to `null`.

All three tab components (`VaccinationsTab`, `MembershipsTab`, `ExpensesTab`) have `watch(() => props.pendingAction, ..., { immediate: true })`. `immediate: true` fires on watcher registration, which happens during component first-mount inside `<Suspense>`. Because tabs are lazy (`defineAsyncComponent`), they mount asynchronously. If the user navigates away and back to `WallecxApp` within the same session, the tabs do NOT remount (they are preserved by Suspense), so the watcher does not re-fire. But if Suspense does remount a tab (e.g., after the component is GC'd and re-resolved), `pendingAction` is still non-null, which will fire `openManage(null)` or switch sub-tabs again — an unintended second invocation with no user gesture.

The fix is to clear `pendingAction` once it has been dispatched. Because `pendingAction` is consumed by all three tabs via watchers, it should be cleared after the watchers have had a chance to read it, which is one microtask after the next tick:

```typescript
// After setting pendingAction:
pendingAction.value = action;
router.replace({ query: {} });
// Reset so it doesn't re-fire on tab remount
await nextTick();
pendingAction.value = null;
```

Alternatively, tabs that consume the action should emit an event back to `WallecxApp` to request clearance (`emit('action-consumed')`), which is the more robust pattern.

---

## Warnings

### WR-01: Test async-timing is insufficient for `handleAndroidInstall` — tests can pass spuriously

**File:** `src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts:336-341`

**Issue:** `handleAndroidInstall` is an `async` function that awaits `event.userChoice`. The test triggers it via `installBtn!.click()` and then awaits two `nextTick()` calls. `event.userChoice` is `Promise.resolve(...)` (already resolved), so two microtask flushes may be enough in the current jsdom/Vitest runtime — but this is fragile. The `await event.prompt()` inside `handleAndroidInstall` (prompt is `vi.fn(() => Promise.resolve())`) adds another microtask. Total: at least two microtask continuations must drain after the click. If Vitest's scheduler changes or if `prompt` gains latency, these tests will produce false passes because `clearInstallPromptEvent` and `writeDismissalRecord` are not yet called when assertions run.

The robust fix is to use `vi.waitFor` or `flushPromises` from `@vue/test-utils`:

```typescript
import { flushPromises } from '@vue/test-utils'
// ...
installBtn!.click()
await flushPromises()   // drains all promise queues before asserting
expect(fakeEvent.prompt).toHaveBeenCalledOnce()
expect(spies.clearInstallPromptEvent).toHaveBeenCalled()
```

---

### WR-02: `isIosSafari()` is duplicated verbatim across two components

**File:** `src/components/projects/wallecx/PwaInstallBanner.vue:27-30` and `src/components/projects/wallecx/WallecxApp.vue:28-31`

**Issue:** The `isIosSafari()` function (identical regex logic) is copy-pasted into both `PwaInstallBanner.vue` and `WallecxApp.vue`. The comment in `PwaInstallBanner.vue` explicitly labels it "byte-intact," indicating this duplication was intentional but undesirable long-term. Any future change to the detection logic (e.g., adding `GSA/` for Google Search App on iOS) must be applied in both places or the components diverge silently.

The function should be extracted into `useMobileEnv.ts` or a shared `src/utils/platform.ts` module and imported:

```typescript
// src/utils/platform.ts
export function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
}
```

---

### WR-03: `router.replace({ query: {} })` is not awaited — navigation errors are silently swallowed

**File:** `src/components/projects/wallecx/WallecxApp.vue:91`

**Issue:** `router.replace()` returns a `Promise<NavigationFailure | void>`. The call is not awaited. This is a pattern-level warning: if `router.replace` fails (e.g., navigation guard cancels it), the failure is silently discarded and TypeScript's `no-floating-promises` rule (if enforced by ESLint) would flag this. More practically, because `pendingAction.value = action` was just set on line 90 and the query-string clear is non-awaited, there is a subtle ordering concern if a navigation guard triggers a redirect during the replace.

```typescript
// Fix: await the replace
await router.replace({ query: {} });
```

---

### WR-04: `VaccinationsTab.vue` console error prefixes reference old component name `WallecxApp`

**File:** `src/components/projects/wallecx/VaccinationsTab.vue:168,173,199,274,335`

**Issue:** All `console.warn` and `console.error` calls in `VaccinationsTab.vue` use the prefix `"WallecxApp: ..."` (e.g., `"WallecxApp: listToken refresh failed"`, `"WallecxApp: getFullList failed"`). The tab logic has been moved to a standalone `VaccinationsTab.vue` component — the prefix is stale and will mislead debugging sessions (a developer searching for `WallecxApp` errors will have trouble attributing them to the correct file). The prefix should be updated to `"VaccinationsTab: ..."`.

---

## Info

### IN-01: `apple-mobile-web-app-title` in `index.html` names the app "Wallecx" but the page `<title>` names it "Lexarium"

**File:** `index.html:13,42`

**Issue:** The `<meta name="apple-mobile-web-app-title">` is `"Wallecx"` but the `<title>` element is `"Lexarium - Explore. Experiment. Evolve."` This is intentional for a multi-app portfolio, but the `apple-mobile-web-app-title` applies globally to the entire Lexarium shell when saved to home screen on iOS, not just to the Wallecx sub-route. A user who adds any other page to their home screen (e.g., the root `/`) will also see "Wallecx" as the app name. This may or may not match the intended UX; worth a conscious decision.

---

### IN-02: `writeDismissalRecord` constructs `DismissalRecord` with redundant conditional

**File:** `src/components/projects/wallecx/PwaInstallBanner.vue:81-85`

**Issue:** The ternary in `writeDismissalRecord` constructs two identical object shapes — only the `platform` field differs, and `platform` is already the parameter:

```typescript
// Current — redundant ternary:
const record: DismissalRecord =
  platform === 'ios'
    ? { dismissedAt: new Date().toISOString(), platform: 'ios' }
    : { dismissedAt: new Date().toISOString(), platform: 'android' };

// Simplified:
const record: DismissalRecord = {
  dismissedAt: new Date().toISOString(),
  platform,
};
```

This is dead logic complexity that could mask a future bug if the two branches diverge unintentionally.

---

### IN-03: `OfflineBanner.vue` hardcodes a color hex `#0d1117` instead of using the CSS variable

**File:** `src/components/OfflineBanner.vue:16`

**Issue:** The inline style sets `color: '#0d1117'` for the text foreground. `#0d1117` is the dark-mode page background color (as noted in `index.html` line 15 comment). This value is not sourced from a CSS variable and will become stale if the dark-mode palette changes. The warning banner also has no explicit dark-mode override, so the hardcoded dark color on the warning yellow background could conflict in light mode if the variable resolves differently.

```html
<!-- Suggested: use a semantic token or confirmed-contrast value -->
:style="{
  backgroundColor: 'var(--color-status-warning)',
  paddingTop: 'env(safe-area-inset-top)',
  color: 'var(--color-status-warning-text, #0d1117)',
}"
```

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
