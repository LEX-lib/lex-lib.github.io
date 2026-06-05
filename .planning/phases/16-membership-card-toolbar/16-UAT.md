---
status: complete
phase: 16-membership-card-toolbar
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md]
started: 2026-05-16T00:00:00.000Z
updated: 2026-05-16T00:00:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Vaccinations tab regression — search and sort still work
expected: Open the Vaccinations tab. Type into the search bar — vaccine group cards filter immediately. Change the sort dropdown — groups reorder. Switch between grid and list view — the view changes. Everything works the same as before this phase.
result: pass

### 2. Membership search filters in real time
expected: Open the Memberships tab. A search input and sort dropdown are visible above the card grid. Type part of a card name or issuer — only matching cards are shown immediately (no button press needed). Clearing the text restores all cards.
result: pass

### 3. × icon clears search
expected: With text in the search input, a × icon appears on the right side of the input field (inside the input, not outside it). Clicking the × clears the input and the full card grid is restored instantly.
result: pass

### 4. No-results empty state
expected: Type a search term that matches no cards (e.g. "zzzzzz"). Instead of a blank area, an empty state appears with a magnifying glass icon, a message like "No cards match …", and a "Clear search" button. Clicking that button clears the input and restores the grid.
result: pass

### 5. Sort modes reorder the grid
expected: Open the sort dropdown — four options are available: Recently Added, Name A–Z, Issuer A–Z, Expiry Date. Selecting each one immediately reorders the card grid. For Expiry Date, cards without an expiry sort at the bottom.
result: pass

### 6. Sort mode persists across navigation
expected: Select a sort mode other than "Recently Added". Navigate away (e.g. switch to the Vaccinations tab and back). The sort dropdown still shows the previously selected mode and the cards are in the same order.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
