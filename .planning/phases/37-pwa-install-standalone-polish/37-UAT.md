---
status: complete
phase: 37-pwa-install-standalone-polish
source:
  - 37-01-SUMMARY.md
  - 37-02-SUMMARY.md
  - 37-03-SUMMARY.md
  - 37-04-SUMMARY.md
  - 37-05-SUMMARY.md
  - 37-06-SUMMARY.md
started: 2026-06-05T09:05:09Z
updated: 2026-06-05T09:05:09Z
---

## Current Test

[testing complete]

## Tests

### 1. iOS branded splash on install
expected: Cold-launching the installed Wallecx PWA on iOS shows the Wallecx logo on a solid navy #002244 background (~0.5–2s), not a white flash.
result: pass
note: Required the gap fix in commit e8770ae — the build originally shipped only 3 apple-touch-startup-image links (one matching no Apple device), so most iPhones got a white flash. Now ships the full Apple device matrix (38 portrait+landscape PNGs).

### 2. iOS status bar black-translucent + title "Wallecx"
expected: Launched from the home screen, the status bar renders black-translucent (content draws underneath) and the launcher label reads "Wallecx".
result: pass

### 3. Per-color-scheme theme-color flip
expected: Toggling system dark/light while the installed PWA is open flips the status bar background between #002244 (light) and #0d1117 (dark).
result: pass

### 4. Android Quick Actions long-press
expected: Long-pressing the installed Wallecx icon shows 4 shortcuts (Add Expense, Add Vaccination, Add Membership, Open Reports).
result: pass
note: Works when installed as a Chrome (or Samsung Internet) WebAPK. KNOWN PLATFORM CONSTRAINT — Microsoft Edge on Android adds a non-WebAPK bookmark shortcut (browser-badged icon) and does NOT surface manifest shortcuts; this is Edge's Android behavior, not a Wallecx defect. Deployed manifest verified correct (4 shortcuts, all icons 200/png).

### 5. Shortcut deep-link dispatch when authenticated
expected: Tapping "Add Expense" opens WallecxApp on the Expenses tab and immediately opens the ManageExpense dialog in create mode; the URL clears the ?action= after dispatch.
result: pass

### 6. SW-update toast safe-area on iPhone with Dynamic Island
expected: The "A new version of Wallecx is available — Refresh / Later" toast is fully visible above the home indicator / Dynamic Island in standalone mode — not clipped.
result: pass

### 7. Offline banner appears and auto-clears
expected: Enabling airplane mode shows the amber "You're offline. Changes will resume when you reconnect." banner at the top; disabling airplane mode makes it disappear automatically without user action.
result: pass

### 8. 30-day banner re-show gate + standalone suppression
expected: After dismissal the install banner stays hidden within the 30-day window; in standalone (installed) mode the banner never shows regardless of dismissal record.
result: pass
note: Standalone suppression is now reactive mid-session (gap fix 37-06 / CR-01 — isStandalone watcher).

### 9. iOS eviction-aware auth-expired copy
expected: On iOS Safari / standalone with an expired auth token, the toast shows the iOS eviction copy ("iOS may have cleared local data after 7 days… pin Wallecx to your home screen…"), not the generic "session expired" copy.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0

## Gaps

[none — all human-verification checks passed]

## Notes

- Phase 37 reached 12/12 code-level must-haves after gap-closure plan 37-06 (CR-01 isStandalone reactivity, CR-02 pendingAction reset).
- A second device-QA gap surfaced post-merge and was fixed in commit e8770ae: the iOS splash link set covered ~1 iPhone class; replaced with the full generated Apple device matrix.
- Android Quick Actions require a Chrome/Samsung Internet WebAPK install — Edge on Android is a documented platform limitation (no manifest shortcuts), not a code defect.
