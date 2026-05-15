# Requirements: Wallecx v2.2 Sort and Search for Membership Cards

**Defined:** 2026-05-15
**Core Value:** Membership card holders can quickly locate a specific card by typing a name or issuer, and organize the grid to match how they think — without scrolling through an unordered list.

## v2.2 Requirements

Phase numbering continues from v2.1 (last phase was 15 → v2.2 starts at Phase 16).

### Membership Card Toolbar

A persistent toolbar above the membership card grid enabling client-side search and sort — mirroring the existing vaccination toolbar pattern from Phase 7.

- [ ] **ORG-01**: User can type into a search input to filter the membership card grid in real time by card name or issuer (case-insensitive, partial match); when no cards match, an informative empty-state message replaces the grid; the search can be cleared via a × button
- [ ] **ORG-02**: User can select a sort mode from a dropdown to reorder the membership card grid; available modes: Name A–Z, Issuer A–Z, Expiry Date (soonest first — cards without an expiry date sorted last), Recently Added; the selected mode is retained for the current session

---

## Deferred

### Organisation (deferred from v2.0 backlog)

- **CONV-01**: JSON export of all membership card records — mirrors the vaccination export; deferred to v3.x
- **CONV-03**: Expiry date reminders — requires notification infrastructure; deferred

### Advanced Barcode (deferred from v2.0)

- **SCAN-ADV-01**: PDF417 and Aztec code formats via dynamic `bwip-js` import

### UX Enhancements (deferred from v2.1)

- **UX-ADV-01**: Bottom sheet refactor for MembershipDetail and VaccinationDetail
- **UX-ADV-02**: Dark mode fix (PrimeVue #7465)

### Advanced PWA (deferred from v2.1)

- **PWA-ADV-01**: Offline data access for membership and vaccination records
- **PWA-ADV-02**: Background Sync for queued CRUD operations
- **PWA-ADV-03**: Swipe-to-dismiss gestures on cards and drawers

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| View toggle (grid/list) for membership cards | Not in ORG-01/ORG-02 scope; membership cards are always grid-view |
| Server-side search/sort | Client-side computed is sufficient for personal vault size; mirrors vaccination approach |
| Search persistence across sessions | Within-session ref retention is sufficient; cross-session persistence is excess complexity |
| Push notifications for expiring cards | Requires server-side infrastructure — deferred to v3.x |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ORG-01 | Phase 16 | Pending |
| ORG-02 | Phase 16 | Pending |

**Coverage:**
- v2.2 requirements: 2 total
- Mapped to phases: 2 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-05-15*
*Traceability updated: 2026-05-15 — Phase 16 assigned to ORG-01, ORG-02*
