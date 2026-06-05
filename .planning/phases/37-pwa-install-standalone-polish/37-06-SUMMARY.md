---
phase: 37-pwa-install-standalone-polish
plan: "06"
subsystem: wallecx-pwa
tags: [pwa, standalone, reactive, tdd, gap-closure, cr-01, cr-02]
dependency_graph:
  requires: [37-01, 37-02, 37-03, 37-04, 37-05]
  provides: [reactive-standalone-flip, pending-action-reset]
  affects: [useMobileEnv, WallecxApp, PwaInstallBanner]
tech_stack:
  added: []
  patterns: [vue-watch-reactive, tdd-red-green]
key_files:
  created: []
  modified:
    - src/composables/useMobileEnv.ts
    - src/composables/__tests__/useMobileEnv.spec.ts
    - src/components/projects/wallecx/WallecxApp.vue
decisions:
  - "D-37-06-CR-01: Replace one-shot if(standaloneMatch.value) block with watch(standaloneMatch, ..., { immediate: false }) — one-directional false->true, seed preserved"
  - "D-37-06-CR-02: Append second await nextTick() + pendingAction.value = null after router.replace in WallecxApp.vue dispatch block to prevent action replay on Suspense remount"
metrics:
  duration_minutes: 8
  completed_date: "2026-06-05"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
requirements: [PWA-04, PWA-09]
---

# Phase 37 Plan 06: Gap Closure CR-01 & CR-02 Summary

**One-liner:** Reactive `watch(standaloneMatch)` replaces one-shot if-block in useMobileEnv.ts (CR-01); `pendingAction.value = null` reset prevents deep-link replay on Suspense remount (CR-02).

## What Was Built

Two BLOCKER gap closures from 37-VERIFICATION.md, both correctness defects in already-shipped Phase 37 code:

### Task 1 — CR-01: isStandalone reactive mid-session flip (TDD)

**RED:** Upgraded the matchMedia mock in `useMobileEnv.spec.ts` to capture 'change' listeners on the standalone query via a `standaloneListeners` array and a `fireStandaloneChange()` helper. Added two new tests in the 'standalone detection' describe block: one for the reactive false->true flip, one for the one-directional stay-true invariant. Tests failed as expected — the production code had a one-shot `if (standaloneMatch.value)` block.

**GREEN:** In `useMobileEnv.ts`, added `watch` to the vue import and replaced the one-shot `if` block with `watch(standaloneMatch, (matched) => { if (matched) isStandalone.value = true }, { immediate: false })`. The `{ immediate: false }` option preserves the synchronous seed from `ref(detectStandalone())` as the single source for the initial value; the watcher only handles subsequent runtime flips.

### Task 2 — CR-02: pendingAction reset after dispatch

In `WallecxApp.vue` `onMounted` dispatch block, appended `await nextTick(); pendingAction.value = null;` after `router.replace({ query: {} })`. The second `nextTick` allows all tab watchers (`{ immediate: true }`) to consume the current action value before the ref is cleared. A subsequent Suspense remount sees `null` (a no-op in every tab watcher branch) so the action does not replay without a user gesture.

## Verification Results

- `npm run test:unit -- src/composables/__tests__/useMobileEnv.spec.ts`: 12/12 pass
- `npm run test:unit` (full suite): 76/76 pass
- `npm run type-check`: exits 0
- Grep: `watch(standaloneMatch` present in useMobileEnv.ts at line 110
- Grep: `pendingAction.value = null` present in WallecxApp.vue at line 93
- `watch` imported from 'vue' in useMobileEnv.ts (line 1)
- No edits to VERIFIED Phase 37 files outside the two declared targets

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 RED | a8928b5 | test(37-06): add failing test for isStandalone reactive flip (CR-01 RED) |
| Task 1 GREEN | c6f76b4 | feat(37-06): make isStandalone reactive to mid-session display-mode flip (CR-01) |
| Task 2 | b3ed18f | fix(37-06): reset pendingAction after deep-link dispatch (CR-02) |

## Deviations from Plan

None — plan executed exactly as written.

## TDD Gate Compliance

- RED gate commit: a8928b5 `test(37-06): ...`
- GREEN gate commit: c6f76b4 `feat(37-06): ...`
- REFACTOR: not needed (minimal implementation, no cleanup required)

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes introduced.

## Self-Check: PASSED

- src/composables/useMobileEnv.ts — present, contains `watch(standaloneMatch`
- src/composables/__tests__/useMobileEnv.spec.ts — present, contains `fireStandaloneChange`
- src/components/projects/wallecx/WallecxApp.vue — present, contains `pendingAction.value = null`
- Commits a8928b5, c6f76b4, b3ed18f — all in git log
