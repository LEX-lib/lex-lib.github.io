# Requirements: Lexarium v3.0 Site-Wide Dark Mode

**Defined:** 2026-05-18
**Core Value:** Every Lexarium surface renders correctly in both light and dark themes; users can toggle between them or rely on OS preference. Marks the shift from "individual themed mini-apps" to "themed platform."

## v3.0 Requirements

### Theme Infrastructure

Establish a single source of truth for theme state with OS preference detection, manual override via a NavBar button, and localStorage persistence.

- [ ] **THEME-01**: `useTheme` composable in `src/composables/useTheme.ts` exposes reactive `Ref<'light' | 'dark'>` state. On first call, reads `localStorage.getItem('lexarium:theme')` — if present, uses that value; otherwise reads `window.matchMedia('(prefers-color-scheme: dark)').matches` to determine OS preference.
- [ ] **THEME-02**: When the theme value changes, the composable applies/removes the `.my-app-dark` class on `document.documentElement` (the `<html>` element), and writes the current value to `localStorage` under the key `lexarium:theme`.
- [ ] **THEME-03**: NavBar in `CustomNavBar.vue` shows a sun/moon toggle button. The icon reflects the current theme (sun when dark mode is active, moon when light mode is active). Clicking flips the theme; state persists across reloads and navigation.

### Site Shell & Non-App Pages

The site shell and pages outside of mini-apps render correctly in dark mode.

- [ ] **THEME-04**: HomeView, HeroSection, and AboutMeSection render correctly in dark mode — backgrounds, headings, body text, and call-to-action elements all have appropriate dark-mode contrast.
- [ ] **THEME-05**: ProjectsView (the directory of mini-apps) renders correctly in dark mode — project tiles, descriptions, and links all readable.
- [ ] **THEME-06**: BlogView renders correctly in dark mode.
- [ ] **THEME-07**: Login screen renders correctly in dark mode — form fields, labels, and error states all visible.
- [ ] **THEME-08**: CustomNavBar renders correctly in dark mode — links, brand mark, and the theme toggle itself are visible against the dark background.

### Mini-App Dark Mode Sweep

Each existing mini-app under `/projects/` renders correctly in dark mode.

- [ ] **THEME-09**: LexTrack (`/projects/lextrack`) renders correctly in dark mode — task lists, meeting forms, support requests, dialogs, and tables.
- [ ] **THEME-10**: Larga (`/projects/larga`) renders correctly in dark mode — Leaflet map controls, geocoder input, route panels.
- [ ] **THEME-11**: Gift Exchange / MonitoX (`/projects/gift-exchange/*`) renders correctly in dark mode — join, draw, manage, and result sub-routes.
- [ ] **THEME-12**: API Playground (`/projects/api-playground`) renders correctly in dark mode — request panel, response display, headers tables, syntax-highlighted body.

### Wallecx Audit

Confirm Phase 18's dark mode work still holds when the site-wide toggle is wired up.

- [ ] **THEME-13**: Wallecx (`/projects/wallecx`) renders correctly in dark mode when toggled via the NavBar button — no regressions from Phase 18. All surfaces (card grids, dialogs, bottom sheets, scan overlay, BarcodeDisplay still black-on-white per BR-2) verified.

---

## Deferred

### Theme Polish

- **THEME-ADV-01**: Per-user theme preference synced to PocketBase (requires schema migration; localStorage covers anonymous + authenticated users for v3.0)
- **THEME-ADV-02**: Smooth animated transition between themes (CSS variable color interpolation)
- **THEME-ADV-03**: Additional theme variants beyond light/dark (e.g., high-contrast, sepia)
- **THEME-ADV-04**: System-level `color-scheme` CSS property declarations for native form controls

### Carried over from v2.3

- **CONV-01**: JSON export of all membership card records (mirrors vaccination export)
- **CONV-03**: Expiry date reminders (requires notification infrastructure)
- **SCAN-ADV-01**: PDF417 and Aztec code formats via dynamic `bwip-js` import
- **PWA-ADV-01..03**: Offline data access, background sync, swipe-to-dismiss gestures

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-user theme synced via PocketBase | Schema migration + auth-gated logic; localStorage is sufficient for v3.0; deferred as THEME-ADV-01 |
| Smooth animated theme transitions | Polish item; instant toggle is acceptable for v3.0 |
| Additional theme variants (sepia, high-contrast) | Out of scope for v3.0; light/dark covers the primary need |
| System `color-scheme` CSS property for form controls | Polish item; PrimeVue forms already adapt via the variant alignment |
| Auto-detect time-of-day theme switching | Users can opt in via OS-level scheduling; not a Lexarium concern |
| In-app theme picker / customisation | Out of scope; light/dark only |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 19 | Pending |
| THEME-02 | Phase 19 | Pending |
| THEME-03 | Phase 19 | Pending |
| THEME-04 | Phase 20 | Pending |
| THEME-05 | Phase 20 | Pending |
| THEME-06 | Phase 20 | Pending |
| THEME-07 | Phase 20 | Pending |
| THEME-08 | Phase 20 | Pending |
| THEME-09 | Phase 21 | Pending |
| THEME-10 | Phase 21 | Pending |
| THEME-11 | Phase 21 | Pending |
| THEME-12 | Phase 21 | Pending |
| THEME-13 | Phase 22 | Pending |

**Coverage:**
- v3.0 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---

*Requirements defined: 2026-05-18*
*Traceability: roadmap pending, will be filled when Phases 19–22 are scoped*
