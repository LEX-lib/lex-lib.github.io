---
phase: 37-pwa-install-standalone-polish
verified: 2026-05-29T02:00:00Z
status: gaps_found
score: 10/12 must-haves verified
overrides_applied: 0
gaps:
  - truth: "isStandalone === true ALWAYS suppresses banner branches (D-37-08)"
    status: failed
    reason: "useMobileEnv.ts lines 104-109: isStandalone is seeded from detectStandalone() at construction time but the standaloneMatch ref is NOT watched — if the user accepts an install prompt mid-session, standaloneMatch flips to true but isStandalone stays frozen at false. PwaInstallBanner.vue's v-else-if='installPromptEvent && !isStandalone' guard and WallecxApp.vue's isStandalone.value check in the eviction toast can misfire. Standalone-on-launch is correctly detected; runtime display-mode flip is not. Documented as CR-01 in 37-REVIEW.md."
    artifacts:
      - path: "src/composables/useMobileEnv.ts"
        issue: "Lines 107-109: bare if (standaloneMatch.value) sets isStandalone once; no watch() wires standaloneMatch changes forward"
    missing:
      - "Add watch(standaloneMatch, (matched) => { if (matched) isStandalone.value = true }, { immediate: false }) in useMobileEnv.ts to make isStandalone reactive to runtime display-mode changes"
  - truth: "Each tab component watches props.pendingAction with { immediate: true } and opens the appropriate Manage dialog on match"
    status: partial
    reason: "The watch and immediate:true are correctly implemented in all three tab components. However pendingAction is never reset to null after dispatch in WallecxApp.vue — the ref retains the action string for the entire session. If <Suspense> remounts a tab (e.g., component GC), the immediate watcher re-fires with the stale action, triggering openManage(null) or activeSubTab switch a second time without user gesture. Documented as CR-02 in 37-REVIEW.md."
    artifacts:
      - path: "src/components/projects/wallecx/WallecxApp.vue"
        issue: "Lines 87-92: pendingAction.value = action is set but never reset to null after dispatch; router.replace clears the URL but not the ref"
    missing:
      - "After pendingAction.value = action and router.replace({ query: {} }), add: await nextTick(); pendingAction.value = null to prevent replay on tab remount"
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
**Verified:** 2026-05-29T02:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | iOS splash PNGs exist with correct pixel dimensions (1179x2556, 1080x2340, 1536x2048) | VERIFIED | PNG IHDR bytes confirmed: all 3 match expected dimensions; sizes 7 KB, 22 KB, 9 KB (all under 3 MiB cap) |
| 2 | Four 96x96 shortcut PNGs exist on disk for 4 manifest shortcuts | VERIFIED | All 4 exist at public/shortcuts/, each 37 KB (well above 1 KiB floor) |
| 3 | pwa-assets.config.ts drives assets-generator with combinePresetAndAppleSplashScreens + #002244 background | VERIFIED | File exists, contains combinePresetAndAppleSplashScreens, #002244, branding_logo.svg, headLinkOptions preset:'2023' |
| 4 | OfflineBanner.vue shows when offline, auto-clears when online, NO retry button | VERIFIED | useOnline() imported from @vueuse/core; v-if="!isOnline"; exact copy locked; zero <button> elements; Teleport to body; role=status, aria-live=polite; z-50, top-0; paddingTop env(safe-area-inset-top) |
| 5 | OfflineBanner mounted site-wide in App.vue | VERIFIED | <OfflineBanner /> first element in App.vue template; import present; Phase 33 substrate (handleBeforeInstallPrompt, setInstallPromptEvent, clearInstallPromptEvent) intact |
| 6 | PwaInstallBanner.vue has two branches: iOS (v-if isIosVisible) and Android (v-else-if installPromptEvent && !isStandalone && !_dismissed) | VERIFIED | File confirmed: iOS branch v-if="isIosVisible", Android branch v-else-if="installPromptEvent && !isStandalone && !_dismissed"; DismissalRecord interface present; THIRTY_DAYS_MS constant present; handleAndroidInstall calls event.prompt() synchronously before any await; clearInstallPromptEvent called after userChoice; legacy 'true' migration branch present; writeDismissalRecord with explicit platform branches |
| 7 | isStandalone === true ALWAYS suppresses banner branches (D-37-08) | FAILED | useMobileEnv.ts lines 104-109: standaloneMatch (reactive) is NOT watched — isStandalone is seeded from detectStandalone() once at construction time. The if (standaloneMatch.value) block at line 107 is a one-shot check, not a reactive watcher. Standalone detection on launch is correct; mid-session display-mode flip (user accepts install prompt) is NOT propagated. See CR-01 in 37-REVIEW.md. |
| 8 | index.html declares apple-mobile-web-app-capable, status-bar-style black-translucent, title Wallecx, 2 theme-color metas, 3 apple-touch-startup-image links | VERIFIED | All 6 meta/link tags present with correct values; LOCKED viewport-fit comment byte-intact; color-scheme meta count=1 (not duplicated); no manual <link rel=manifest> added; 2 theme-color tags (light #002244, dark #0d1117) |
| 9 | vite.config.ts manifest.shortcuts array has 4 entries targeting /projects/wallecx?action=... | VERIFIED | 4 entries confirmed: add-expense, add-vaccination, add-membership, open-reports; each with correct 96x96 PNG icon src and purpose:'any'; LOCKED registerType:'prompt' and scope:'/' comments byte-intact |
| 10 | WallecxApp.vue reads route.query.action, maps via ACTION_TAB_MAP, awaits nextTick, sets pendingAction, calls router.replace | VERIFIED | All elements present: ACTION_TAB_MAP with 4 keys, await nextTick() before pendingAction.value = action, router.replace({ query: {} }); SW toast style:{paddingBottom:'env(safe-area-inset-bottom)'} present; isIosSafari() || isStandalone.value gating for eviction copy; exact eviction string byte-intact |
| 11 | Each tab component watches props.pendingAction with { immediate: true } and opens the appropriate Manage dialog on match | PARTIAL | All 3 tabs have defineProps, watch(() => props.pendingAction, ..., { immediate: true }), correct action handling. HOWEVER pendingAction is never reset to null in WallecxApp.vue after dispatch — stale ref may replay on tab remount. See CR-02 in 37-REVIEW.md. |
| 12 | guard.spec.ts contains test asserting query.redirect === '/projects/wallecx?action=add-expense' after redirect | VERIFIED | "preserves query string in redirect when not authenticated" test exists at line 75-82; asserts router.currentRoute.value.query.redirect === '/projects/wallecx?action=add-expense' |

**Score: 10/12 truths verified (2 failed/partial)**

---

### Deferred Items

None — all Phase 37 scope items were attempted.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `pwa-assets.config.ts` | Asset generator config (preset 2023 + Apple splash combine + #002244 bg) | VERIFIED | 637B, correct combinePresetAndAppleSplashScreens shape |
| `public/splash/apple-splash-portrait-1179x2556.png` | iPhone 14 Pro splash, 1179x2556px | VERIFIED | 7224B, dimensions confirmed via IHDR |
| `public/splash/apple-splash-portrait-1080x2340.png` | Android-class 360x780@3x splash | VERIFIED | 22208B, generated via sharp inline (D-37-01-A) |
| `public/splash/apple-splash-portrait-1536x2048.png` | iPad 768x1024@2x splash | VERIFIED | 9251B, dimensions confirmed |
| `public/shortcuts/shortcut-add-expense.png` | 96x96 shortcut icon | VERIFIED | 37102B |
| `public/shortcuts/shortcut-add-vaccination.png` | 96x96 shortcut icon | VERIFIED | 37102B |
| `public/shortcuts/shortcut-add-membership.png` | 96x96 shortcut icon | VERIFIED | 37102B |
| `public/shortcuts/shortcut-open-reports.png` | 96x96 shortcut icon | VERIFIED | 37102B |
| `src/components/OfflineBanner.vue` | Site-wide offline banner, useOnline-driven, Teleport to body | VERIFIED | 590B, fully substantive (23 lines) |
| `src/App.vue` | OfflineBanner mount above CustomNavBar | VERIFIED | Contains import + <OfflineBanner /> |
| `src/components/projects/wallecx/PwaInstallBanner.vue` | Two-branch install banner (iOS + Android) | VERIFIED | 8161B (221 lines); two branches present and wired |
| `index.html` | iOS standalone meta tags + 3 splash link tags | VERIFIED | 3080B; all 9 new lines present |
| `vite.config.ts` | manifest.shortcuts array — 4 entries | VERIFIED | 4 shortcuts confirmed with correct URLs and icons |
| `src/components/projects/wallecx/WallecxApp.vue` | pendingAction dispatch + SW toast safe-area + iOS eviction-aware copy | VERIFIED | 5922B; all 5 zones confirmed |
| `src/components/projects/wallecx/ExpensesTab.vue` | pendingAction prop + immediate watcher | VERIFIED | defineProps + watch with immediate:true + add-expense + open-reports handling |
| `src/components/projects/wallecx/VaccinationsTab.vue` | pendingAction prop + immediate watcher | VERIFIED | defineProps + watch with immediate:true + add-vaccination handling |
| `src/components/projects/wallecx/MembershipsTab.vue` | pendingAction prop + immediate watcher | VERIFIED | defineProps + watch with immediate:true + add-membership handling |
| `src/router/__tests__/guard.spec.ts` | Query-preservation test (D-37-16) | VERIFIED | "preserves query string in redirect when not authenticated" test at line 75 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| pwa-assets.config.ts | public/branding_logo.svg | images: ['public/branding_logo.svg'] | WIRED | String present in file |
| package.json | @vite-pwa/assets-generator CLI | generate-pwa-assets script | WIRED | "generate-pwa-assets": "pwa-assets-generator" confirmed |
| index.html splash links | public/splash/*.png (Plan 01 outputs) | href="/splash/apple-splash-portrait-*" | WIRED | 3 link tags reference files that exist on disk |
| OfflineBanner.vue | @vueuse/core useOnline | import { useOnline } from '@vueuse/core' | WIRED | Import present, useOnline() called, v-if="!isOnline" drives visibility |
| App.vue | OfflineBanner.vue | import OfflineBanner + <OfflineBanner /> | WIRED | Both import and template usage confirmed |
| PwaInstallBanner.vue | useMobileEnv.installPromptEvent singleton | import { useMobileEnv, clearInstallPromptEvent } | WIRED | Import, destructure, and usage confirmed in both template and handler |
| PwaInstallBanner.vue Android handler | BeforeInstallPromptEvent.prompt() | event.prompt() synchronous before await | WIRED | Confirmed synchronous call at line 124 before await event.userChoice |
| vite.config.ts manifest.shortcuts | WallecxApp ACTION_TAB_MAP keys | URL ?action= matches 4 keys | WIRED | 4 URLs match 4 ACTION_TAB_MAP keys exactly |
| WallecxApp.vue pendingAction | Tab :pending-action prop | :pending-action="pendingAction" | WIRED | 3 occurrences confirmed in template (VaccinationsTab, MembershipsTab, ExpensesTab) |
| router.beforeEach query preservation | WallecxApp.vue dispatch after login | to.fullPath includes ?action=..., redirects as query.redirect | WIRED | guard.spec.ts test proves query.redirect === '/projects/wallecx?action=add-expense' |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| OfflineBanner.vue | isOnline (Ref<boolean>) | useOnline() from @vueuse/core | Yes — reactively seeded from navigator.onLine | FLOWING |
| PwaInstallBanner.vue | installPromptEvent | useMobileEnv() module singleton written by App.vue | Yes — written by real browser beforeinstallprompt event | FLOWING |
| WallecxApp.vue | pendingAction | route.query.action (real router state) | Yes — reads actual URL query param; ACTION_TAB_MAP allowlist gates | FLOWING (with CR-02 caveat — never reset) |
| WallecxApp.vue | evictionMessage | isIosSafari() || isStandalone.value | Conditional — isStandalone has reactivity gap (CR-01) | PARTIAL |

---

### Behavioral Spot-Checks

Step 7b is SKIPPED for PWA-specific behaviors (splash rendering, install prompt, offline network toggle) — these require a running browser with network control and cannot be exercised with a single CLI command. The guard spec test is the one runnable behavioral check.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Guard query-preservation test exists and passes | guard.spec.ts line 75-82 (static read) | 4th test present, asserts query.redirect === '/projects/wallecx?action=add-expense' | PASS (static verification) |
| No debt markers in modified files | Scanned pwa-assets.config.ts, OfflineBanner.vue, App.vue, PwaInstallBanner.vue, index.html, vite.config.ts, WallecxApp.vue, ExpensesTab.vue, VaccinationsTab.vue, MembershipsTab.vue, guard.spec.ts | 0 TBD / FIXME / XXX markers found | PASS |

---

### Probe Execution

No probes declared in plans or discoverable at scripts/*/tests/probe-*.sh. SKIPPED.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PWA-01 | 37-04 | iOS standalone meta tags (apple-mobile-web-app-capable, status-bar-style black-translucent, title Wallecx, per-color-scheme theme-color) | SATISFIED | All 6 tags present in index.html; confirmed in codebase |
| PWA-02 | 37-01, 37-04 | Per-device-resolution iOS splash screens (390x844, 360x780, 768x1024); branded splash on install | SATISFIED (code) / NEEDS HUMAN (device) | 3 PNGs exist at correct paths with correct dimensions; apple-touch-startup-image links in index.html; human visual check of branded content passed (Task 3 checkpoint approved) |
| PWA-04 | 37-03 | Android Chrome BeforeInstallPromptEvent surfaced via Install button in PwaInstallBanner.vue; iOS instructional path coexists | SATISFIED | Two-branch component wired to module singleton; synchronous prompt(); M-9 single-use cleanup |
| PWA-06 | 37-05 | SW-update toast respects safe-area-inset on iPhone | SATISFIED (code) / NEEDS HUMAN (device) | style: { paddingBottom: 'env(safe-area-inset-bottom)' } in watch(needRefresh) toast call |
| PWA-07 | 37-02 | Offline banner backed by useOnline; banner auto-clears when navigator goes back online | SATISFIED | OfflineBanner.vue with useOnline(), v-if="!isOnline", no retry button, mounted in App.vue |
| PWA-09 | 37-01, 37-05 | manifest shortcuts array (4 Quick Actions); deep-link dispatch in WallecxApp | SATISFIED (code) / NEEDS HUMAN (device) | manifest.shortcuts 4 entries in vite.config.ts; ACTION_TAB_MAP dispatch wired; tab watchers with immediate:true |
| PWA-05 | NOT in Phase 37 | PWA-UAT-01 close | NOT Phase 37 scope — assigned to Phase 38 (ROADMAP confirmed) | N/A |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/composables/useMobileEnv.ts | 104-109 | isStandalone seeded once from detectStandalone() — standaloneMatch ref NOT watched; runtime display-mode flip does not propagate | BLOCKER (CR-01) | PwaInstallBanner standalone hard-gate and WallecxApp eviction copy branch can misfire if user installs PWA mid-session |
| src/components/projects/wallecx/WallecxApp.vue | 87-92 | pendingAction.value = action never reset to null after dispatch — stale ref can replay immediate watchers on tab remount | BLOCKER (CR-02) | openManage(null) or activeSubTab switch fires again without user gesture if Suspense remounts a tab |
| src/components/projects/wallecx/PwaInstallBanner.vue | 27-30 + WallecxApp.vue 28-31 | isIosSafari() duplicated verbatim in two files | WARNING (WR-02) | Logic drift risk if UA detection needs updating |
| src/components/projects/wallecx/WallecxApp.vue | 91 | router.replace({ query: {} }) not awaited — navigation errors silently discarded | WARNING (WR-03) | No immediate runtime impact but masks guard-cancelled navigation |
| src/components/projects/wallecx/VaccinationsTab.vue | 168, 173, 199 | console.error prefix "WallecxApp: ..." — stale name for moved logic | INFO (WR-04) | Debugging friction only |
| src/components/OfflineBanner.vue | 16 | color: '#0d1117' hardcoded hex instead of CSS variable | INFO (IN-03) | Minor maintainability — no functional impact if palette is stable |

---

### Human Verification Required

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

---

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 (BLOCKER — CR-01): isStandalone reactivity break in useMobileEnv.ts**

The Phase 37 must-have "isStandalone === true ALWAYS suppresses" is only partially met. On PWA launch, `detectStandalone()` correctly returns `true` and `isStandalone` is seeded correctly for the banner hard-gate. However, if a user accepts an Android install prompt MID-SESSION (banner shown in browser, user taps Install, browser transitions to standalone), `standaloneMatch` flips reactively but `isStandalone` stays stale at `false`. The banner will not self-extinguish via the standalone gate. The fix requires one `watch(standaloneMatch, ...)` call in `useMobileEnv.ts`.

**Gap 2 (BLOCKER — CR-02): pendingAction not reset after dispatch**

The shortcut deep-link dispatch is wired correctly. The gap is that `pendingAction.value` is never reset to `null` after the action is consumed. With `{ immediate: true }` on all three tab watchers, any future unmount-and-remount of a tab component (e.g., Suspense GC, route navigation away and back) will re-trigger `openManage(null)` or `activeSubTab.value = 'reports'` without user gesture. The fix is to add `await nextTick(); pendingAction.value = null;` after the dispatch block.

Both gaps were identified in the 37-REVIEW.md (CR-01 and CR-02) committed at de39872. The code review report is already present in the phase directory.

---

_Verified: 2026-05-29T02:00:00Z_
_Verifier: Claude (gsd-verifier)_
