# Requirements: Wallecx v2.3 UX Polish

**Defined:** 2026-05-16
**Core Value:** Each authenticated user can save, retrieve, and display their own vaccination records and membership/loyalty cards — without ever losing access to them.

## v2.3 Requirements

### Bottom Sheet

Replace side drawer (VaccinationGroupPanel) and centered dialog (MembershipDetail) with a bottom sheet on mobile viewports for a more natural mobile interaction pattern.

- [ ] **UX-01**: On mobile (< 640px), the vaccination group detail panel slides up from the bottom of the screen instead of from the right; all vaccination records and edit/delete actions within the group remain accessible
- [ ] **UX-02**: On mobile (< 640px), the membership card detail view slides up from the bottom of the screen instead of opening as a centered dialog; all card details and barcode display remain accessible
- [ ] **UX-03**: Bottom sheets can be dismissed by tapping the backdrop or a close button
- [ ] **UX-04**: On desktop (≥ 640px), existing drawer (VaccinationGroupPanel) and dialog (MembershipDetail) layouts are unchanged

### Dark Mode

Fix visual rendering issues caused by PrimeVue #7465 so Wallecx components display correctly when the `my-app-dark` class is active.

- [ ] **DARK-01**: Vaccination group cards and membership card tiles render with the correct dark palette when dark mode is active — no white/light bleed from PrimeVue #7465
- [ ] **DARK-02**: ManageVaccination dialog, ManageMembership dialog, and the vaccination group detail panel render correctly in dark mode
- [ ] **DARK-03**: The full-screen scan overlay and BarcodeDisplay component render correctly in dark mode

### Mobile Toolbar

- [ ] **MOB-09**: On mobile viewports (< 640px), the grid/list view toggle is not rendered in WallecxToolbar; when hidden, the vaccination tab uses list layout by default regardless of any stored sessionStorage value

---

## Deferred

### Data Export

- **CONV-01**: JSON export of all membership card records — mirrors the vaccination export; deferred to v3.x
- **CONV-03**: Expiry date reminders — requires notification infrastructure; deferred

### Advanced Barcode

- **SCAN-ADV-01**: PDF417 and Aztec code formats via dynamic `bwip-js` import

### Advanced PWA

- **PWA-ADV-01**: Offline data access for membership and vaccination records
- **PWA-ADV-02**: Background Sync for queued CRUD operations
- **PWA-ADV-03**: Swipe-to-dismiss gestures on cards and drawers

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Swipe-to-dismiss on bottom sheet | Gesture detection complexity; tap-backdrop dismiss is sufficient |
| Bottom sheet on tablet (640px–1024px) | Drawer/dialog work well on mid-size viewports; mobile-only is the target |
| Dark mode toggle in-app | The Lexarium design system handles dark mode via `my-app-dark` class — no per-app toggle |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |
| UX-04 | — | Pending |
| DARK-01 | — | Pending |
| DARK-02 | — | Pending |
| DARK-03 | — | Pending |
| MOB-09 | — | Pending |

**Coverage:**
- v2.3 requirements: 8 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 8

---

*Requirements defined: 2026-05-16*
*Traceability updated: pending roadmap creation*
