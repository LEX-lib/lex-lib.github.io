---
status: testing
phase: 38-mobile-uat-sweep
source:
  - 38-CONTEXT.md (D-03 net-new checks)
  - .planning/REQUIREMENTS.md (PWA-05 + bound NFR/CON)
targets:
  - real-ios
  - real-android
  - ipad-820-emulated
started: 2026-06-05
updated: 2026-06-05
policy: |
  UAT-only (D-04): record pass/fail only — no in-phase fixes; failures route to a
  separate gap phase. Unavailable targets may be deferred with explicit sign-off,
  non-blocking for milestone close (D-05). Test against the deployed Vercel preview
  with Deployment Protection disabled.
---

# Phase 38: Mobile UAT Sweep — Human UAT

Run the **net-new** checks below on the deployed Vercel preview, then report results as
`N1 ✅`, `N5 ❌ <what happened>`, etc. I'll record pass/fail here.

## Carried forward from Phase 37 (already PASSED — do NOT re-run, D-02)

Recorded authoritative in `37-UAT.md` (9/9 real iOS + Android): branded splash · status-bar
style + title · theme-color flip · Android Quick Actions (Chrome WebAPK) · deep-link dispatch ·
SW-update toast safe-area · offline banner auto-clear · 30-day + standalone gate · iOS eviction copy.
**Known constraint (not a defect):** Android Quick Actions need a Chrome/Samsung WebAPK install; Edge on Android adds a non-WebAPK shortcut.

---

## Net-new checks

### 📱 Real iOS

| # | Check | Steps | Expected ✅ | Result |
|---|-------|-------|-------------|--------|
| N1-iOS | Force-quit + relaunch + auth survival | Sign in, install/open PWA. Fully **force-quit** (swipe away from app switcher). Reopen from home-screen icon. | App relaunches to a working state; **still signed in** (no re-login); lands on a usable screen. | pending |
| N5 | 16px no-zoom inputs | Open a form (e.g. Add Expense), tap each text/number input. | iOS does **not** auto-zoom the page on focus (inputs are ≥16px). | pending |

### 🤖 Real Android

| # | Check | Steps | Expected ✅ | Result |
|---|-------|-------|-------------|--------|
| N1-And | Force-quit + relaunch + auth survival | Sign in, install via Chrome (WebAPK). Force-quit from recents. Reopen icon. | Relaunches working; **auth persists**; usable screen. | pending |

### 📲 Either real mobile (iOS or Android)

| # | Check | Steps | Expected ✅ | Result |
|---|-------|-------|-------------|--------|
| N3 | BR-2 barcode light **and** dark | Open Memberships → a card with a barcode. View in **light** theme, then toggle **dark** theme. | Barcode renders **black bars on white background in BOTH themes** (never white-on-dark / unscannable). | pending |
| N4 | LT-07 double-scroll | Navigate Wallecx tabs/long lists; scroll to bottom and back. | **No double-scroll trap** (page and inner list don't fight; no nested stuck scroll). | pending |
| N6 | Sticky bar above keyboard | Open a form, focus an input so the on-screen keyboard appears. | The form's action/submit bar stays **visible above the keyboard** (not hidden behind it). | pending |
| N7 | Camera affordances | In a form with image capture, trigger the photo control. | The **2-affordance** flow works (e.g. take photo / choose from library); camera launches; image attaches. | pending |
| N8 | Inline DatePicker | Open a form with a date field; tap it. | Date picker renders **inline / mobile-appropriate** and a date can be selected without layout breakage. | pending |
| N9 | Dirty-guard | Open a Manage dialog/drawer, change a field, then try to dismiss without saving. | An **unsaved-changes guard** fires (confirm discard) rather than silently losing edits. | pending |

### 🖥️ Emulated iPad-820 (DevTools, 820px width — layout only, D-01)

| # | Check | Steps | Expected ✅ | Result |
|---|-------|-------|-------------|--------|
| N2 | iPad-820 layout | Desktop browser → DevTools device toolbar → set width **820px**. Load `/projects/wallecx`. Exercise tabs, a form, a dialog. | Layout, tabs, forms, dialogs render correctly at 820px (no overflow/clipping/broken spacing). *Install/standalone behaviors NOT proven here — record as "emulation-verified, layout only".* | pending |

---

## Summary

total: 9
passed: 0
issues: 0
pending: 9
deferred: 0

## Notes / Deferrals

[Record any device target you can't cover here, with your sign-off, per D-05.]
