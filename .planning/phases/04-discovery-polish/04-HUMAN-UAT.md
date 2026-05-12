---
status: partial
phase: 04-discovery-polish
source: [04-VERIFICATION.md]
started: 2026-05-12T10:50:00.000Z
updated: 2026-05-12T10:50:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Wallecx tile visual + hover gradient
expected: Tile appears on /projects page with mdi:shield-check icon, WIP tag, navy-to-amber gradient bar on hover, and clicking navigates to /projects/wallecx (authenticated) or /login?redirect=... (unauthenticated)
result: [pending]

### 2. Download records — JSON content and token-free card_url
expected: Clicking "Download records" produces a wallecx-vaccinations-YYYY-MM-DD.json file containing all records belonging to the current user with a card_url field that is a plain PocketBase file URL (no token query param)
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
