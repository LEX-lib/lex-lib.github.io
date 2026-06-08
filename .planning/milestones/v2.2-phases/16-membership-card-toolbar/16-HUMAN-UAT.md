---
status: resolved
phase: 16-membership-card-toolbar
source: [16-VERIFICATION.md]
started: 2026-05-15T00:00:00.000Z
updated: 2026-05-15T00:00:00.000Z
---

## Current Test

All tests passed — approved by user.

## Tests

### 1. Real-time search filtering
expected: Typing into the search input filters the membership card grid immediately (no button press required); only cards whose card_name or issuer contains the typed text (case-insensitive) are shown
result: passed

### 2. × button clears search
expected: Clicking the × (clear) button in the search input clears the query and the full card grid restores instantly
result: passed (icon fix applied — replaced oversized button wrapper with right-aligned InputIcon)

### 3. No-results empty state
expected: When the search term matches no cards, the grid is replaced by an informative empty-state message with a "Clear search" button — not a blank area
result: passed

### 4. Sort mode reordering
expected: Selecting each of the 4 sort modes (Recently Added, Name A–Z, Issuer A–Z, Expiry Date) reorders the card grid immediately; cards without an expiry_date sort last in Expiry Date mode
result: passed

### 5. Sort mode session persistence
expected: After selecting a sort mode and navigating away from the Memberships tab then back, the selected sort mode is restored (both the dropdown value and the card order)
result: passed

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
