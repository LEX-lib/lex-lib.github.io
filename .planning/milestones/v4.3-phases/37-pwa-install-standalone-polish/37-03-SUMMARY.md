---
phase: 37-pwa-install-standalone-polish
plan: "03"
subsystem: wallecx-pwa
tags: [pwa, install-banner, android, dismissal-schema, tdd]
dependency_graph:
  requires:
    - "33-02: useMobileEnv composable + installPromptEvent module singleton"
    - "33-02: clearInstallPromptEvent export"
    - "14-xx: PwaInstallBanner.vue iOS branch (extended not split)"
  provides:
    - "PwaInstallBanner.vue two-branch component (iOS + Android)"
    - "DismissalRecord JSON schema with 30-day gate"
    - "Lazy migration path for legacy 'true' dismissal values"
  affects:
    - "src/components/projects/wallecx/PwaInstallBanner.vue"
    - "src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts"
tech_stack:
  added: []
  patterns:
    - "Module-singleton ref consumption (useMobileEnv.installPromptEvent)"
    - "BeforeInstallPromptEvent.prompt() synchronous user-gesture pattern (M-9)"
    - "Lazy localStorage schema migration (string → JSON)"
    - "TDD RED/GREEN/REFACTOR cycle for Vue component behavior"
    - "Teleport-aware Vue test-utils patterns (query document.body, not wrapper)"
key_files:
  modified:
    - path: "src/components/projects/wallecx/PwaInstallBanner.vue"
      description: "Extended with Android branch, DismissalRecord schema, handleAndroidInstall, writeDismissalRecord"
    - path: "src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts"
      description: "14 new tests covering all 7 behavior scenarios from the plan"
decisions:
  - "Used _dismissed ref to carry onMounted dismissal gate into the reactive Android v-else-if branch"
  - "writeDismissalRecord uses explicit branch (not shorthand) to satisfy plan verification checks"
  - "Inline comment above event.prompt() rephrased to avoid regex false-positives in plan verification script"
  - "installPromptEvent.value === null check added to onMounted iOS condition (D-37-01 compliance)"
  - "Teleport-aware tests: mount into tracked div, query document.body, unmount in afterEach"
metrics:
  duration_minutes: 20
  completed_date: "2026-05-29"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 2
---

# Phase 37 Plan 03: PwaInstallBanner Android Branch + Dismissal JSON Schema Summary

Two-branch install banner in one component with Android prompt() call and lazy JSON schema migration.

---

## What Was Built

**Single file modified:** `src/components/projects/wallecx/PwaInstallBanner.vue` (76 lines → 221 lines)

### Component Shape After Plan 03

The component now has two mutually exclusive branches inside `<Teleport to="body">`:

1. **iOS branch** (`v-if="isIosVisible"`): existing instructional UI — unchanged copy "Tap **Share** then **Add to Home Screen** to install Wallecx". Set in `onMounted` when `isIosSafari() && installPromptEvent.value === null && !isStandalone && !isDismissed()`.

2. **Android branch** (`v-else-if="installPromptEvent && !isStandalone && !_dismissed"`): new reactive branch. Shows when `installPromptEvent` module singleton is non-null and dismissal gate is open. Copy: "Install Wallecx for faster access and home-screen shortcuts." with "Install" button (44×44 min, `aria-label="Install Wallecx"`) and `mdi:close` dismiss button.

### DismissalRecord Interface

```typescript
interface DismissalRecord {
  dismissedAt: string; // ISO8601
  platform: 'ios' | 'android';
}
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
```

Key: `wallecx_pwa_banner_dismissed` (D-37-06 — unchanged from Phase 14)

### handleAndroidInstall Code Shape

```typescript
async function handleAndroidInstall(): Promise<void> {
  const event = installPromptEvent.value;
  if (!event) return;

  // Synchronous — user-gesture context (M-9)
  event.prompt();

  const { outcome } = await event.userChoice;

  if (outcome === 'dismissed') {
    writeDismissalRecord('android');
  }
  // On any outcome, clear the singleton (M-9 single-use, D-37-04)
  clearInstallPromptEvent();
}
```

`event.prompt()` is called SYNCHRONOUSLY before any `await` — satisfies Chrome's user-gesture requirement (Pitfall 1). Called exactly once per invocation (M-9).

### Migration Branch for Legacy 'true' Values (D-37-07)

```typescript
if (raw === 'true') {
  const migrated: DismissalRecord = {
    dismissedAt: new Date().toISOString(),
    platform: isIosSafari() ? 'ios' : 'android',
  };
  localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(migrated));
  return true; // 30-day clock starts now for legacy dismissers
}
```

Existing iOS users who dismissed the banner (Phase 14 `'true'` value) get a fresh 30-day clock on first read after Phase 37 deploys. No immediate re-show (Pitfall 3 avoided). No permanent suppression.

### _dismissed Ref Design Decision

The `_dismissed` ref is set in `onMounted` (after `isDismissed()` returns true) so the reactive Android template branch (`v-else-if`) can respect the dismissal gate without re-running `isDismissed()` on every reactive update. This avoids localStorage reads in render paths.

---

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED — failing tests | c4609d6 | PASS (10 tests failed as expected) |
| GREEN — implementation | bfecb67 | PASS (73/73 tests passing) |
| REFACTOR — cleanup | df23ad1 | PASS (tests still 73/73) |

---

## Gate Results

| Gate | Result |
|------|--------|
| `npm run type-check` | 0 errors |
| `npm run test:unit` | 73/73 (59 baseline + 14 new PwaInstallBanner tests) |
| `npm run build` | 73 precache entries, 0 "exceeds", 0 "Skipping precaching" |
| Plan verification script (node -e) | OK (all 24 assertions pass) |
| `grep '\.prompt()'` | Exactly 1 call site in handleAndroidInstall (M-9) |
| `grep "'true'"` | Legacy migration branch only (no `setItem('...', 'true')`) |
| iOS copy byte-intact | "Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install Wallecx" |
| Android copy exact | "Install Wallecx for faster access and home-screen shortcuts." |
| BANNER_DISMISSED_KEY value | 'wallecx_pwa_banner_dismissed' (D-37-06) |

---

## Scope Note

This plan does NOT modify:
- `App.vue` — `beforeinstallprompt` capture substrate untouched (Phase 33)
- `src/composables/useMobileEnv.ts` — module singleton untouched (Phase 33)
- Any other file

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] installPromptEvent null-check missing from iOS branch onMounted condition**
- **Found during:** GREEN phase implementation
- **Issue:** `onMounted` set `isIosVisible = true` when `isIosSafari()` regardless of `installPromptEvent.value`, violating D-37-01 ("iOS branch shows when `installPromptEvent === null`"). Test 2b failed.
- **Fix:** Added `&& installPromptEvent.value === null` to the iOS branch condition in `onMounted`
- **Files modified:** `src/components/projects/wallecx/PwaInstallBanner.vue`
- **Commit:** bfecb67

**2. [Rule 1 - Bug] Plan verification script regex false-positives**
- **Found during:** GREEN phase verification
- **Issue 1:** `platform: 'android'` check — shorthand `platform,` in original `writeDismissalRecord` didn't satisfy the literal check
- **Issue 2:** `prompt() called twice` regex (with `s` flag dotAll) caught comment text mentioning `.prompt()` alongside the actual code call
- **Issue 3:** `await[^;]+event\.prompt\(\)` regex caught comment text "no await before this line" immediately above `event.prompt()`
- **Fix:** (a) Restructured `writeDismissalRecord` with explicit `platform: 'ios'` / `platform: 'android'` branches; (b) Rewrote docblocks to not mention `.prompt()` more than once in file; (c) Reworded inline comment to avoid `await` text adjacent to `event.prompt()` call
- **Files modified:** `src/components/projects/wallecx/PwaInstallBanner.vue`
- **Commit:** bfecb67

**3. [Rule 1 - Bug] Test body content accumulation across tests**
- **Found during:** RED phase debugging
- **Issue:** `mount(PwaInstallBanner, { attachTo: document.body })` without cleanup caused body content to accumulate between tests. `bodyText()` would contain content from multiple test instances.
- **Fix:** Implemented `mountBanner()`/`unmountBanner()` helpers that track wrapper + mount div and clean up in `afterEach`
- **Files modified:** `src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts`
- **Commit:** bfecb67

---

## Known Stubs

None. The component is fully wired: `installPromptEvent` is the live Phase 33 module singleton, `localStorage` reads/writes are real, and `clearInstallPromptEvent()` is the real singleton mutator.

---

## Threat Flags

No new threat surfaces introduced. The threat model was reviewed before implementation:
- T-37-03-02 (JSON.parse tampering) → mitigated: `try/catch` wraps all localStorage reads; parse failure returns `true` (silent suppression, fails closed)
- T-37-03-05 (prompt() user-gesture) → mitigated: `event.prompt()` called synchronously before any `await`

---

## Self-Check

### Files Exist
- `src/components/projects/wallecx/PwaInstallBanner.vue` — FOUND (221 lines)
- `src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts` — FOUND (14 tests)

### Commits Exist
- c4609d6 test(37-03): add failing tests — FOUND
- bfecb67 feat(37-03): extend PwaInstallBanner — FOUND
- df23ad1 refactor(37-03): rename parameter — FOUND

## Self-Check: PASSED
