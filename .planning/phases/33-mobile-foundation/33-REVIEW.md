---
phase: 33-mobile-foundation
reviewed: 2026-05-27T08:24:14Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/composables/useMobileEnv.ts
  - src/composables/__tests__/useMobileEnv.spec.ts
  - src/App.vue
  - src/components/projects/wallecx/ManageVaccination.vue
  - vite.config.ts
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-27T08:24:14Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 33 (Mobile Foundation) is well-engineered and the documented invariants hold:
the install listener in `App.vue` is capture-only (`preventDefault` + stash, never
`.prompt()`), `useIsMobile.ts` is untouched and is delegated to for the 639px single
source of truth, `registerType: 'prompt'` and `scope: '/'` LOCKED comments are intact,
the install event is a module singleton (no new Pinia store), and the visualizer is
correctly ANALYZE-gated. Listener teardown in `App.vue` is correct and symmetric.

The findings below are correctness/robustness concerns rather than blockers. The most
important is a lifecycle-hook pitfall: `useMobileEnv()` transitively registers
`onMounted`/`onUnmounted` via `useIsMobile()`, so calling it outside a component setup
context (as the documentation suggests Phase 37 might, and as the test suite literally
does) silently breaks `isMobile` reactivity. The `isStandalone` runtime-flip logic is
also one-directional and runs only once at call time.

## Warnings

### WR-01: `useMobileEnv()` inherits `onMounted`/`onUnmounted` from `useIsMobile()` — breaks when called outside a component setup

**File:** `src/composables/useMobileEnv.ts:96` (and `src/composables/useIsMobile.ts:18-19`)
**Issue:** `useMobileEnv()` calls `useIsMobile()`, which registers its `matchMedia`
`change` listener inside `onMounted` and removes it in `onUnmounted`. These hooks are
no-ops (Vue logs `onMounted is called when there is no active component instance`) when
invoked outside a component `setup()`/`<script setup>`. The doc comments explicitly
frame this composable as consumable by "Phase 37's Install button" and "every future
reader," and the spec file calls `useMobileEnv()` directly at the top level of test
cases (e.g. `useMobileEnv.spec.ts:73`). In any such non-setup caller, the `isMobile`
ref is seeded synchronously but will **never update** on viewport resize because the
`change` listener is never attached. The unit tests do not catch this because they read
values synchronously and never dispatch a `change` event (by design, per the M-6 guard
comment) — so the broken listener wiring is invisible to the suite.
**Fix:** Either (a) document loudly that `useMobileEnv()` MUST be called from a component
setup context, or (b) make the listener registration robust to non-setup callers. Option
(b) keeps the "consume anywhere" promise:
```ts
// in useIsMobile.ts — guard the lifecycle hooks
import { ref, onMounted, onUnmounted, getCurrentInstance, type Ref } from 'vue'

export function useIsMobile(breakpoint = 639): Ref<boolean> {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const isMobile = ref(query.matches)
  const handler = (e: MediaQueryListEvent) => { isMobile.value = e.matches }
  if (getCurrentInstance()) {
    onMounted(() => query.addEventListener('change', handler))
    onUnmounted(() => query.removeEventListener('change', handler))
  } else {
    query.addEventListener('change', handler) // caller owns lifetime
  }
  return isMobile
}
```
Note: the phase invariant says `useIsMobile.ts` must not be modified. If that hard
constraint stands, prefer option (a) and add a JSDoc `@remarks` to `useMobileEnv` stating
it must run inside setup, so Phase 37 does not call it from an event handler or a store.

### WR-02: `isStandalone` runtime-flip is one-directional and evaluated only once at call time

**File:** `src/composables/useMobileEnv.ts:104-109`
**Issue:** `isStandalone` is a plain `ref(detectStandalone())` seeded once. The
`standaloneMatch` media query is read exactly once (`if (standaloneMatch.value) ...`) at
call time and never watched, so the "Mirror runtime display-mode changes while preserving
the iOS seed" comment is not actually implemented — nothing re-runs when the media query
fires a `change`. Worse, the merge is one-directional: it can flip `false → true` but if
the session ever leaves standalone mode (display-mode change to `browser`), `isStandalone`
stays `true`. The reactive `standaloneMatch` ref is otherwise unused. The test passes only
because it asserts the synchronous seed, never a runtime change.
**Fix:** Use a `watch`/`watchEffect` (or `computed`) so display-mode changes actually
propagate, while keeping the iOS `navigator.standalone` seed:
```ts
const iosStandalone =
  'standalone' in window.navigator &&
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true
const standaloneMatch = useMediaQuery('(display-mode: standalone)')
const isStandalone = computed(() => iosStandalone || standaloneMatch.value)
```
If the one-shot seed is intentional and runtime flips are out of scope, drop the unused
`standaloneMatch` query and the misleading "Mirror runtime display-mode changes" comment
to avoid implying behaviour that isn't there.

### WR-03: `new Date(rec.date_administered)` can yield an Invalid Date and silently corrupt the field

**File:** `src/components/projects/wallecx/ManageVaccination.vue:54`
**Issue:** The seed watch does `administeredDate.value = rec ? new Date(rec.date_administered) : null`.
If `rec.date_administered` is empty, malformed, or in a format `Date` parses
inconsistently across engines (bare `YYYY-MM-DD` is parsed as UTC midnight, which can
display as the *previous* day in negative-offset timezones), the DatePicker shows a wrong
or invalid date. An `Invalid Date` object is truthy, so the `onSubmit` required-check
(`if (!administeredDate.value)` at line 143) passes, and `dayjs(InvalidDate).format(...)`
emits `"Invalid Date"` which then gets POSTed as `date_administered`. The rest of the
component uses `dayjs` consistently (line 155) but the seed bypasses it.
**Fix:** Parse with `dayjs` for consistency and guard validity:
```ts
const parsed = rec ? dayjs(rec.date_administered) : null
administeredDate.value = parsed && parsed.isValid() ? parsed.toDate() : null
```

## Info

### IN-01: `void mapToUpdateVaccination` is dead code with no runtime effect

**File:** `src/components/projects/wallecx/ManageVaccination.vue:185`
**Issue:** `void mapToUpdateVaccination;` references the imported mapper purely to keep
the import from being flagged unused; the FormData is built manually above and the mapper
is never invoked. The comment says the mapper "defines the canonical writable field set"
but nothing enforces that the manually-built FormData (lines 150-164) stays in sync with
it — they can silently diverge. This is a maintenance trap: the import exists only to make
a comment true.
**Fix:** Either actually route the update payload through `mapToUpdateVaccination(...)`
(so the mapper is the single source of writable fields), or remove the unused import and
the `void` statement and keep the explanatory comment without the dead reference.

### IN-02: Image-processing path can leak the object URL on decode failure

**File:** `src/components/projects/wallecx/ManageVaccination.vue:94-100`
**Issue:** `URL.createObjectURL(file)` is revoked at line 100, but only on the success
path. If `img.onerror` rejects the promise, the `await` throws before line 100 runs and
the object URL is never revoked (the `catch` at line 132 does not revoke it). Minor memory
leak per failed upload.
**Fix:** Revoke in a `finally` tied to the load promise:
```ts
const objectUrl = URL.createObjectURL(file)
try {
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = objectUrl
  })
} finally {
  URL.revokeObjectURL(objectUrl)
}
```

### IN-03: `BeforeInstallPromptEvent` cast in App.vue is unchecked

**File:** `src/App.vue:22`
**Issue:** `handleBeforeInstallPrompt(event: Event)` casts `event as BeforeInstallPromptEvent`
unconditionally before stashing. This is acceptable in Phase 33 because the event is only
ever stored (capture-only) and never has `.platforms`/`.prompt()` touched. Flagging it so
Phase 37 is aware the stored object is an unvalidated cast — when Phase 37 calls
`.prompt()`, it should null-check the singleton and ideally feature-detect `'prompt' in event`
before relying on the typed surface.
**Fix:** No change required this phase. Add a note for Phase 37 to feature-detect before
calling `.prompt()`.

### IN-04: Zod `dose_number` validation message asserts a range the schema doesn't fully enforce

**File:** `src/components/projects/wallecx/ManageVaccination.vue:63`
**Issue:** The `dose_number` field is `.optional().nullable()` with min/max messages
"Dose number must be between 0 and 20." The `InputNumber` in the template already constrains
`:min="0" :max="20"`, so this is belt-and-suspenders and fine. Minor: the `.int()` check has
no custom message, so a non-integer (not reachable via the stepless InputNumber, but possible
if the field is ever rebound) would surface Zod's default English message, inconsistent with
the curated messages elsewhere.
**Fix:** Optional — add a message to `.int({ message: "Dose number must be a whole number." })`
for consistency if the field is ever made free-entry.

---

_Reviewed: 2026-05-27T08:24:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
