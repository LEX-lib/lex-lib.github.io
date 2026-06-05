---
phase: 37-pwa-install-standalone-polish
verified: 2026-06-05T08:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 10/12
  gaps_closed:
    - "isStandalone === true ALWAYS suppresses banner branches (D-37-08) — watch(standaloneMatch, ...) wired; one-shot if-block removed"
    - "Each tab component watches props.pendingAction with { immediate: true } — pendingAction.value = null reset added after dispatch in WallecxApp.vue"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "iOS branded splash on install"
    expected: "Tapping the home-screen icon for the Wallecx PWA on iOS 390x844 shows the Wallecx branding logo on navy #002244 background — not a white flash — for 0.5-2 seconds"
    why_human: "apple-touch-startup-image rendering requires an actual iOS device or Safari simulator; grep can verify the link tags exist but not that iOS honors them with the specific media query match"
  - test: "iOS status bar black-translucent style in standalone mode"
    expected: "After installing and launching, the status bar renders with black-translucent style (content draws behind it with safe-area clearance) and the title reads 'Wallecx'"
    why_human: "Requires real iOS device or Xcode simulator; browser DevTools cannot replicate standalone install behavior"
  - test: "Per-color-scheme theme-color flip"
    expected: "Toggling system dark/light mode while the installed PWA is open flips the iOS status bar background between #002244 (light) and #0d1117 (dark)"
    why_human: "Requires real iOS 16+ device; browser DevTools cannot simulate system-level color scheme switch in standalone mode"
  - test: "Android Quick Actions long-press"
    expected: "Long-pressing the installed Wallecx icon on Android Chrome shows 4 shortcuts: Add Expense, Add Vaccination, Add Membership, Open Reports; tapping each deep-links to /projects/wallecx?action=<action>"
    why_human: "Requires real Android device with installed PWA; emulators may not support long-press shortcut rendering from manifest.shortcuts"
  - test: "Shortcut deep-link dispatch when authenticated"
    expected: "Tapping Add Expense shortcut opens WallecxApp on the Expenses tab and immediately opens the ManageExpense dialog in create mode; URL bar shows no ?action= after dispatch"
    why_human: "End-to-end behavior requires app running with auth session; Vue watchers and Suspense timing cannot be reliably tested in jsdom"
  - test: "SW-update toast safe-area on iPhone with Dynamic Island"
    expected: "The SW-update toast ('A new version of Wallecx is available. Refresh / Later') is fully visible above the iPhone home indicator and Dynamic Island in standalone mode — not clipped"
    why_human: "Requires real iPhone with notch/Dynamic Island running in PWA standalone mode"
  - test: "Offline banner appears and auto-clears"
    expected: "Enabling airplane mode shows the amber 'You're offline. Changes will resume when you reconnect.' banner at top of screen; disabling airplane mode makes it disappear automatically without user action"
    why_human: "Requires toggling real device network state; jsdom does not simulate navigator.onLine changes"
  - test: "30-day banner re-show gate in standalone mode"
    expected: "In standalone mode, the install banner never shows regardless of localStorage dismissal record"
    why_human: "Requires installed PWA session; browser DevTools mock of display-mode standalone is imperfect"
  - test: "iOS eviction-aware auth-expired copy"
    expected: "On iOS Safari or in standalone mode, when the auth token has expired, the toast shows 'iOS may have cleared local data after 7 days without opening the app. Please sign in again. Tip: pin Wallecx to your home screen to prevent this.' — not the generic copy"
    why_human: "Requires real iOS device or forced token expiry; isIosSafari() UA detection works only with real UA strings"
---

# Phase 37: PWA Install + Standalone Polish — Verification Report

**Phase Goal:** Ship PWA install and standalone polish for Wallecx — iOS splash screens, Android install banner, site-wide offline banner, Android Quick Actions, SW update toast, and eviction-aware copy.
**Verified:** 2026-06-05T08:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plans 37-06); previous status was gaps_found (10/12)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | iOS splash PNGs exist with correct pixel dimensions (1179x2556, 1080x2340, 1536x2048) | VERIFIED | PNG IHDR bytes confirmed: all 3 match expected dimensions; sizes 7 KB, 22 KB, 9 KB (all under 3 MiB cap). No regression — file untouched by 37-06. |
| 2 | Four 96x96 shortcut PNGs exist on disk for 4 manifest shortcuts | VERIFIED | All 4 exist at public/shortcuts/, each 37 KB. No regression — files untouched by 37-06. |
| 3 | pwa-assets.config.ts drives assets-generator with combinePresetAndAppleSplashScreens + #002244 background | VERIFIED | File exists, contains combinePresetAndAppleSplashScreens, #002244, branding_logo.svg, headLinkOptions preset:'2023'. No regression. |
| 4 | OfflineBanner.vue shows when offline, auto-clears when online, NO retry button | VERIFIED | useOnline() imported from @vueuse/core; v-if="!isOnline"; exact copy locked; zero button elements; Teleport to body; role=status, aria-live=polite. No regression — file untouched by 37-06. |
| 5 | OfflineBanner mounted site-wide in App.vue | VERIFIED | <OfflineBanner /> first element in App.vue template; import present. No regression — file untouched by 37-06. |
| 6 | PwaInstallBanner.vue has two branches: iOS (v-if isIosVisible) and Android (v-else-if installPromptEvent && !isStandalone && !_dismissed) | VERIFIED | iOS branch v-if="isIosVisible", Android branch v-else-if="installPromptEvent && !isStandalone && !_dismissed"; handleAndroidInstall calls event.prompt() synchronously before any await. No regression — file untouched by 37-06. |
| 7 | isStandalone === true ALWAYS suppresses banner branches (D-37-08) | VERIFIED (was FAILED) | useMobileEnv.ts line 1: `import { ref, watch, type Ref } from 'vue'` — watch imported. Lines 110-112: `watch(standaloneMatch, (matched) => { if (matched) isStandalone.value = true }, { immediate: false })` reactive watcher present. One-shot `if (standaloneMatch.value)` block is GONE (grep confirmed: 0 matches). Seed `const isStandalone = ref(detectStandalone())` at line 109 unchanged. Regression tests: 'reactively flips isStandalone false->true when display-mode changes to standalone mid-session (CR-01)' and 'isStandalone remains true after a subsequent display-mode change back to non-standalone (one-directional, CR-01)' both present in spec. Full suite 76/76 per SUMMARY. |
| 8 | index.html declares apple-mobile-web-app-capable, status-bar-style black-translucent, title Wallecx, 2 theme-color metas, 3 apple-touch-startup-image links | VERIFIED | All 6 meta/link tags present with correct values. No regression — file untouched by 37-06. |
| 9 | vite.config.ts manifest.shortcuts array has 4 entries targeting /projects/wallecx?action=... | VERIFIED | 4 entries confirmed: add-expense, add-vaccination, add-membership, open-reports; each with correct 96x96 PNG icon src and purpose:'any'. No regression — file untouched by 37-06. |
| 10 | WallecxApp.vue reads route.query.action, maps via ACTION_TAB_MAP, awaits nextTick, sets pendingAction, calls router.replace | VERIFIED | ACTION_TAB_MAP with 4 keys present; await nextTick() before pendingAction.value = action (line 89); router.replace({ query: {} }) (line 91); SW toast style:{paddingBottom:'env(safe-area-inset-bottom)'} present; isIosSafari() || isStandalone.value gating for eviction copy. No regression to existing logic. |
| 11 | Each tab component watches props.pendingAction with { immediate: true } and opens the appropriate Manage dialog on match | VERIFIED (was PARTIAL) | All 3 tab components unchanged and still have defineProps + watch with immediate:true. WallecxApp.vue lines 92-93 now add a second `await nextTick()` followed by `pendingAction.value = null` after router.replace — preventing stale action replay on Suspense tab remount. Grep confirmed: `pendingAction.value = null` at line 93; two separate `await nextTick()` calls at lines 89 and 92. No tab component was modified (git log confirmed). |
| 12 | guard.spec.ts contains test asserting query.redirect === '/projects/wallecx?action=add-expense' after redirect | VERIFIED | "preserves query string in redirect when not authenticated" test exists; asserts router.currentRoute.value.query.redirect === '/projects/wallecx?action=add-expense'. No regression — file untouched by 37-06. |

**Score: 12/12 truths verified**

---

### Deferred Items

None — all Phase 37 scope items were attempted and now verified.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `pwa-assets.config.ts` | Asset generator config (preset 2023 + Apple splash combine + #002244 bg) | VERIFIED | Unchanged from initial verification |
| `public/splash/apple-splash-portrait-1179x2556.png` | iPhone 14 Pro splash, 1179x2556px | VERIFIED | Unchanged |
| `public/splash/apple-splash-portrait-1080x2340.png` | Android-class 360x780@3x splash | VERIFIED | Unchanged |
| `public/splash/apple-splash-portrait-1536x2048.png` | iPad 768x1024@2x splash | VERIFIED | Unchanged |
| `public/shortcuts/shortcut-add-expense.png` | 96x96 shortcut icon | VERIFIED | Unchanged |
| `public/shortcuts/shortcut-add-vaccination.png` | 96x96 shortcut icon | VERIFIED | Unchanged |
| `public/shortcuts/shortcut-add-membership.png` | 96x96 shortcut icon | VERIFIED | Unchanged |
| `public/shortcuts/shortcut-open-reports.png` | 96x96 shortcut icon | VERIFIED | Unchanged |
| `src/components/OfflineBanner.vue` | Site-wide offline banner, useOnline-driven, Teleport to body | VERIFIED | Unchanged |
| `src/App.vue` | OfflineBanner mount above CustomNavBar | VERIFIED | Unchanged |
| `src/components/projects/wallecx/PwaInstallBanner.vue` | Two-branch install banner (iOS + Android) | VERIFIED | Unchanged |
| `index.html` | iOS standalone meta tags + 3 splash link tags | VERIFIED | Unchanged |
| `vite.config.ts` | manifest.shortcuts array — 4 entries | VERIFIED | Unchanged |
| `src/components/projects/wallecx/WallecxApp.vue` | pendingAction dispatch + SW toast safe-area + iOS eviction-aware copy + CR-02 reset | VERIFIED | Lines 92-93 added: second await nextTick() + pendingAction.value = null |
| `src/components/projects/wallecx/ExpensesTab.vue` | pendingAction prop + immediate watcher | VERIFIED | Unchanged — null-tolerant watcher confirmed |
| `src/components/projects/wallecx/VaccinationsTab.vue` | pendingAction prop + immediate watcher | VERIFIED | Unchanged |
| `src/components/projects/wallecx/MembershipsTab.vue` | pendingAction prop + immediate watcher | VERIFIED | Unchanged |
| `src/router/__tests__/guard.spec.ts` | Query-preservation test (D-37-16) | VERIFIED | Unchanged |
| `src/composables/useMobileEnv.ts` | Reactive standalone propagation via watch(standaloneMatch, ...) | VERIFIED (new — CR-01) | watch imported from 'vue' (line 1); watch(standaloneMatch, ...) at lines 110-112; one-shot if-block removed |
| `src/composables/__tests__/useMobileEnv.spec.ts` | CR-01 regression tests: reactive flip + one-directional invariant | VERIFIED (new — CR-01) | Two new tests in 'standalone detection' describe block; fireStandaloneChange() helper implemented; standaloneListeners capture array wired |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| pwa-assets.config.ts | public/branding_logo.svg | images: ['public/branding_logo.svg'] | WIRED | Unchanged from initial verification |
| package.json | @vite-pwa/assets-generator CLI | generate-pwa-assets script | WIRED | Unchanged |
| index.html splash links | public/splash/*.png | href="/splash/apple-splash-portrait-*" | WIRED | Unchanged |
| OfflineBanner.vue | @vueuse/core useOnline | import { useOnline } from '@vueuse/core' | WIRED | Unchanged |
| App.vue | OfflineBanner.vue | import OfflineBanner + <OfflineBanner /> | WIRED | Unchanged |
| PwaInstallBanner.vue | useMobileEnv.installPromptEvent singleton | import { useMobileEnv, clearInstallPromptEvent } | WIRED | Unchanged |
| PwaInstallBanner.vue Android handler | BeforeInstallPromptEvent.prompt() | event.prompt() synchronous before await | WIRED | Unchanged |
| vite.config.ts manifest.shortcuts | WallecxApp ACTION_TAB_MAP keys | URL ?action= matches 4 keys | WIRED | Unchanged |
| WallecxApp.vue pendingAction | Tab :pending-action prop | :pending-action="pendingAction" | WIRED | Unchanged |
| router.beforeEach query preservation | WallecxApp.vue dispatch after login | to.fullPath includes ?action=..., redirects as query.redirect | WIRED | Unchanged |
| useMobileEnv.ts standaloneMatch | isStandalone ref | watch(standaloneMatch, (matched) => { if (matched) isStandalone.value = true }, { immediate: false }) | WIRED (new — CR-01) | Reactive watcher at line 110 confirmed; one-directional false->true |
| WallecxApp.vue dispatch block | pendingAction ref (reset) | await nextTick(); pendingAction.value = null after router.replace | WIRED (new — CR-02) | Lines 92-93 confirmed; second nextTick precedes null assignment |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| OfflineBanner.vue | isOnline (Ref<boolean>) | useOnline() from @vueuse/core | Yes — reactively seeded from navigator.onLine | FLOWING |
| PwaInstallBanner.vue | installPromptEvent | useMobileEnv() module singleton written by App.vue | Yes — written by real browser beforeinstallprompt event | FLOWING |
| WallecxApp.vue | pendingAction | route.query.action (real router state) | Yes — reads actual URL query param; reset to null after dispatch (CR-02 closed) | FLOWING |
| WallecxApp.vue | evictionMessage | isIosSafari() || isStandalone.value | Conditional — isStandalone now reactive to mid-session flip (CR-01 closed) | FLOWING |
| useMobileEnv.ts | isStandalone | detectStandalone() seed + watch(standaloneMatch) watcher | Yes — synchronous seed on construction; watcher propagates runtime display-mode flip | FLOWING (CR-01 closed) |

---

### Behavioral Spot-Checks

Step 7b is SKIPPED for PWA-specific behaviors (splash rendering, install prompt, offline network toggle) — these require a running browser with network control and cannot be exercised with a single CLI command.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Guard query-preservation test exists and passes | guard.spec.ts static read + SUMMARY reports 76/76 | 4th test present; full suite green | PASS |
| watch(standaloneMatch) present in useMobileEnv.ts | grep | Line 110 confirmed | PASS |
| one-shot if(standaloneMatch.value) block absent | grep | 0 matches confirmed | PASS |
| pendingAction.value = null present after router.replace | grep | Line 93 confirmed; second nextTick at line 92 precedes it | PASS |
| No edits to VERIFIED Phase 37 files outside the two declared targets | git log --since=initial-verify on 9 protected files | 0 commits returned | PASS |
| No debt markers in modified files | Pattern scan on useMobileEnv.ts, useMobileEnv.spec.ts, WallecxApp.vue | 0 TBD / FIXME / XXX markers found | PASS |

---

### Probe Execution

No probes declared in plans or discoverable at scripts/*/tests/probe-*.sh. SKIPPED.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PWA-01 | 37-04 | iOS standalone meta tags (apple-mobile-web-app-capable, status-bar-style black-translucent, title Wallecx, per-color-scheme theme-color) | SATISFIED | All 6 tags present in index.html; unchanged from initial verification |
| PWA-02 | 37-01, 37-04 | Per-device-resolution iOS splash screens (390x844, 360x780, 768x1024); branded splash on install | SATISFIED (code) / NEEDS HUMAN (device) | 3 PNGs exist at correct paths with correct dimensions; apple-touch-startup-image links in index.html |
| PWA-04 | 37-03, 37-06 | Android Chrome BeforeInstallPromptEvent surfaced via Install button in PwaInstallBanner.vue; isStandalone hard-gate now fully reactive (CR-01 closed) | SATISFIED | Two-branch component wired to module singleton; synchronous prompt(); isStandalone reactive watcher ensures banner self-extinguishes on mid-session install |
| PWA-06 | 37-05 | SW-update toast respects safe-area-inset on iPhone | SATISFIED (code) / NEEDS HUMAN (device) | style: { paddingBottom: 'env(safe-area-inset-bottom)' } in watch(needRefresh) toast call |
| PWA-07 | 37-02 | Offline banner backed by useOnline; banner auto-clears when navigator goes back online | SATISFIED | OfflineBanner.vue with useOnline(), v-if="!isOnline", no retry button, mounted in App.vue |
| PWA-09 | 37-01, 37-05, 37-06 | manifest shortcuts array (4 Quick Actions); deep-link dispatch in WallecxApp; pendingAction reset prevents replay (CR-02 closed) | SATISFIED (code) / NEEDS HUMAN (device) | manifest.shortcuts 4 entries in vite.config.ts; ACTION_TAB_MAP dispatch wired; pendingAction.value = null reset in place |
| PWA-05 | NOT in Phase 37 | PWA-UAT-01 close | NOT Phase 37 scope — assigned to Phase 38 (ROADMAP confirmed) | N/A |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/projects/wallecx/PwaInstallBanner.vue | 27-30 + WallecxApp.vue 28-31 | isIosSafari() duplicated verbatim in two files | WARNING (WR-02) | Logic drift risk if UA detection needs updating — out of gap-closure scope, unchanged |
| src/components/projects/wallecx/WallecxApp.vue | 91 | router.replace({ query: {} }) not awaited — navigation errors silently discarded | WARNING (WR-03) | No immediate runtime impact — out of gap-closure scope, unchanged |
| src/components/projects/wallecx/VaccinationsTab.vue | 168, 173, 199 | console.error prefix "WallecxApp: ..." — stale name for moved logic | INFO (WR-04) | Debugging friction only — out of scope |
| src/components/OfflineBanner.vue | 16 | color: '#0d1117' hardcoded hex instead of CSS variable | INFO (IN-03) | Minor maintainability — out of scope |

No new anti-patterns introduced by 37-06. The two former BLOCKERs (CR-01, CR-02) are resolved.

---

### Human Verification Required

The following 9 device-dependent behaviors require human testing on real iOS/Android hardware or installed PWA sessions. These are unchanged from the initial verification — they are not code defects and cannot be verified programmatically.

#### 1. iOS Branded Splash on Install

**Test:** On an iPhone running iOS 16+ at 390x844 viewport, open the preview URL in Safari, tap Share > Add to Home Screen > Add. Tap the home-screen icon.
**Expected:** A branded splash with the Wallecx logo on a solid navy #002244 background appears (0.5-2s). No white flash.
**Why human:** apple-touch-startup-image rendering requires actual iOS Safari + installed PWA state; DevTools cannot simulate it.

#### 2. iOS Status Bar black-translucent + Title "Wallecx"

**Test:** After installing PWA on iOS, launch it from home screen. Inspect status bar.
**Expected:** Status bar renders black-translucent (content visible underneath); iOS home screen launcher label reads "Wallecx".
**Why human:** apple-mobile-web-app-status-bar-style and apple-mobile-web-app-title only take effect in PWA standalone mode on real iOS.

#### 3. Per-color-scheme theme-color flip

**Test:** With PWA installed on iOS, toggle system dark/light mode while app is open.
**Expected:** Status bar background switches between #002244 (light) and #0d1117 (dark) matching the system color scheme.
**Why human:** Requires real iOS 16+ device; DevTools emulation cannot simulate system-level color scheme change in standalone mode.

#### 4. Android Quick Actions long-press + deep-link dispatch

**Test:** On Android with installed PWA, long-press the Wallecx home-screen icon. Tap "Add Expense".
**Expected:** 4 shortcuts appear (Add Expense, Add Vaccination, Add Membership, Open Reports). Tapping Add Expense opens WallecxApp on Expenses tab with ManageExpense dialog in create mode.
**Why human:** Requires real Android device with installed PWA; long-press shortcut rendering cannot be simulated in emulators reliably.

#### 5. SW-update toast safe-area clearance on iPhone with Dynamic Island

**Test:** In standalone mode on iPhone with Dynamic Island (iPhone 14 Pro or later), trigger a SW update. Observe toast position.
**Expected:** The Refresh/Later toast is fully visible above the home indicator and Dynamic Island — not clipped.
**Why human:** Safe-area inset rendering requires real device with home indicator geometry.

#### 6. Offline banner appears and auto-clears

**Test:** Enable airplane mode on a device. Open the installed Wallecx PWA.
**Expected:** Amber banner appears at top: "You're offline. Changes will resume when you reconnect." When airplane mode is disabled, banner disappears automatically without any user interaction.
**Why human:** navigator.onLine events require real network state change; jsdom does not simulate them.

#### 7. 30-day dismissal gate and standalone suppression

**Test:** Dismiss the install banner. Re-launch the same day. Confirm it does not reappear. Then open the installed PWA in standalone mode. Confirm the banner never appears regardless of dismissal record.
**Expected:** Banner suppressed within 30-day window; banner always suppressed in standalone mode.
**Why human:** Requires installed PWA session; localStorage timing and display-mode standalone detection cannot be reliably tested in jsdom.

#### 8. iOS eviction-aware auth-expired copy

**Test:** On iOS Safari or in standalone mode, allow auth token to expire (or force expiry by clearing PocketBase auth store in DevTools). Navigate to /projects/wallecx.
**Expected:** Toast shows "iOS may have cleared local data after 7 days without opening the app. Please sign in again. Tip: pin Wallecx to your home screen to prevent this." (not the generic copy).
**Why human:** Requires real iOS UA string for isIosSafari() to return true; token expiry requires either waiting or simulated token manipulation.

#### 9. Shortcut deep-link dispatch when authenticated

**Test:** Tap the Add Expense Android shortcut while authenticated. Confirm ManageExpense dialog opens in create mode and ?action= is absent from the URL bar after dispatch.
**Expected:** Expense dialog opens once; URL is clean; action does not replay if navigating away and back to the Expenses tab.
**Why human:** End-to-end Suspense timing and pendingAction reset (CR-02) cannot be reliably asserted in jsdom; requires app running with auth session.

---

### Gaps Summary

Both BLOCKER gaps from the initial verification are now closed. No code-level gaps remain.

**CR-01 (CLOSED):** `watch(standaloneMatch, (matched) => { if (matched) isStandalone.value = true }, { immediate: false })` added to `useMobileEnv.ts` (line 110). The one-shot `if (standaloneMatch.value)` block is gone. The synchronous seed `ref(detectStandalone())` is preserved. Two regression tests (reactive flip + one-directional invariant) added to `useMobileEnv.spec.ts`. Full test suite 76/76 green.

**CR-02 (CLOSED):** `await nextTick(); pendingAction.value = null;` appended at lines 92-93 of `WallecxApp.vue` dispatch block, after `router.replace({ query: {} })`. The second `nextTick` ensures tab watchers consume the action value before the ref is cleared. No tab component was modified; null is a no-op in all three tab watcher branches.

Remaining open items (WR-02, WR-03, WR-04, IN-03) are warnings and info items explicitly excluded from gap-closure scope.

Phase 37 code-level goal is **fully achieved**. Status is `human_needed` because 9 device-dependent behaviors still await human verification on real iOS/Android hardware.

---

_Verified: 2026-06-05T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after: 37-06 gap closure (commits a8928b5, c6f76b4, b3ed18f)_
