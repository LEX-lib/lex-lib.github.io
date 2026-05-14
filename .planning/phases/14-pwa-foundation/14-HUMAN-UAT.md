---
status: passed
phase: 14-pwa-foundation
source: [14-VERIFICATION.md]
started: 2026-05-14
updated: 2026-05-14
---

## Current Test

All tests passed by user on 2026-05-14.

## Tests

### 1. Chrome DevTools PWA installability (PWA-07)
expected: Run `npm run preview`, open `http://localhost:4173/projects/wallecx` in Chrome. DevTools > Application > Manifest shows no installability errors. Service worker registers successfully (status "Activated and is running").
result: passed

### 2. iOS Safari standalone mode
expected: Share > Add to Home Screen on an iOS device. App opens without browser chrome, with the navy (#002244) W icon on the home screen and a navy splash background.
result: passed

### 3. Offline precache shell load
expected: With SW activated, go offline, reload `/projects/wallecx`. App shell loads from ServiceWorker cache without network requests. Wallecx tab shell (vaccinations/memberships tabs) is visible.
result: passed — data fetches fail offline as expected (NetworkOnly for PocketBase, by design)

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
