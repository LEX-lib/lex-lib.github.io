# Requirements: Lexarium — v4.3 Wallecx Mobile Optimization

**Defined:** 2026-05-26
**Core Value:** Each authenticated user can save, retrieve, and display their own vaccination records, membership/loyalty cards, and daily expenses — without ever losing access to them, and can track spending against per-category budget targets.

**Milestone Goal:** Make Wallecx feel native-grade on mobile across all 3 tabs (Vaccinations, Memberships, Expenses List + Reports) and the PWA install + standalone surfaces.

**Test viewports:** iOS Safari ~390px, Android Chrome ~360–412px, iPad ~768–820px.

## Milestone v4.3 Requirements

### Foundation (FND)

- [x] **FND-01**: `@vueuse/core` promoted from transitive (via `@vueuse/motion`) to direct dependency; `useMobileEnv` composable centralizes `isMobile`, `isTablet`, `isStandalone`, `installPromptEvent`, and `safeAreaInsets` — backward-compatible with existing `useIsMobile.ts` callers
- [x] **FND-02**: `beforeinstallprompt` listener registered at `App.vue` scope (NOT `WallecxApp.vue`) so the Android Chrome install event is captured even when the user reaches `/projects/wallecx` via in-app navigation
- [x] **FND-03**: `rollup-plugin-visualizer` added as devDep with `ANALYZE=true`-gated `npm run analyze` script; treemap report generated and reviewed before Performance phase planning
- [x] **FND-04**: Patch-bump `vue@^3.5.18 → ^3.5.34`; minor-bump `primevue@^4.3.7 → ^4.5.5` lockstep with `@primevue/auto-import-resolver` + `@primevue/forms`; branch smoke-test validates Drawer + Dialog + DatePicker (touchUI) + FileUpload (capture) + MultiSelect + ColorPicker direct v-model survive before merge

### Layout & Touch Targets (LT)

- [x] **LT-01**: Every interactive element in Wallecx (buttons, links, icon buttons, tab triggers, card tiles, sort/filter affordances) meets the 44×44px iOS touch-target floor on mobile viewports
- [x] **LT-02**: PrimeVue Drawer bottom-sheet instances render a visible drag handle with parity across `MembershipDetail`, `VaccinationGroupPanel`, and all 4 Manage dialogs in mobile (Drawer) mode
- [x] **LT-03**: `env(safe-area-inset-*)` insets respected on every fixed/overlay surface (sticky action bars, install banner, scan overlay, sticky TabList, bottom drawers, Reports period selector) in both orientations and in PWA standalone mode
- [x] **LT-04**: All `100vh` / `h-screen` occurrences in `src/components/projects/wallecx/` replaced with `100dvh` (with `100svh` fallback); audit pass confirms 0 raw `100vh` matches
- [x] **LT-05**: WallecxApp.vue TabList + each tab's filter/sort toolbar pinned to the top on scroll (mobile only); long lists keep tab context visible
- [x] **LT-07**: All 4 Manage dialogs and detail views verify internal-scroll behavior on small viewports — content scrolls, header + sticky action bar remain pinned, no double-scroll trap
- [x] **LT-08**: All 4 Manage dialogs (`ManageVaccination`, `ManageMembership`, `ManageExpense`, `ManageBudget`) render sticky bottom action bars (Save/Cancel) that remain visible above the virtual keyboard on mobile
- [x] **LT-09**: `<meta name="viewport">` in `index.html` includes `viewport-fit=cover` (required for `env(safe-area-inset-*)` non-zero values); locked with an inline LOCKED comment

### Mobile Performance (PF)

- [ ] **PF-01**: Bundle visualizer report generated; chunk-split decisions documented (which libs accidentally in Wallecx critical path — suspects: `leaflet`, `quill`, `vue-pdf-embed`, `dompurify`); concrete split actions taken in this phase
- [ ] **PF-02**: WallecxApp.vue tabs (`VaccinationsTab`, `MembershipsTab`, `ExpensesTab`) converted to `defineAsyncComponent`; per-Manage* dialog also async; initial Wallecx chunk drops at least 50%
- [ ] **PF-04**: Skeleton states (matching final layout dimensions) replace blank-spinner states in VaccinationsTab, MembershipsTab, ExpensesListView, ExpensesReportsView, and AttachmentPreview; CLS ≤ 0.1 verified
- [ ] **PF-05**: `performance.mark/measure` instrumentation logs payload size + duration for each `wallecx_*` `getFullList` on mobile cellular; baseline recorded in milestone close
- [ ] **PF-06** *(conditional)*: List virtualization integrated in `ExpensesListView` ONLY IF PF-05 instrumentation reveals >16ms scroll jank or any collection exceeds ~500 rendered rows on test devices; otherwise deferred to a future milestone
- [ ] **PF-07**: Receipt/scan upload pipeline passes `fileType: 'image/webp'` to `browser-image-compression`; output mime confirmed WebP; storage size reduction documented
- [ ] **PF-09**: `<link rel="preconnect">` + `<link rel="dns-prefetch">` hints for the PocketBase origin in `index.html`; warm cellular cold-start cut

### Forms & Dialogs on Small Screens (FD)

- [x] **FD-01**: Global `@media (max-width: 640px)` CSS rule in `wallecx-overrides.css` sets `font-size: 16px !important` on `.p-inputtext`, `.p-inputnumber-input`, `.p-textarea`, `.p-select-label`, `.p-multiselect-label`, `.p-datepicker-input` to prevent iOS auto-zoom-on-focus
- [x] **FD-03**: Every input across all 4 Manage dialogs carries appropriate `inputmode`, `autocomplete`, and `enterkeyhint` attributes (e.g., `inputmode="decimal"` on Amount, `enterkeyhint="done"` on last field)
- [ ] **FD-04**: PrimeVue DatePicker uses the default tap-to-open popup overlay on mobile at every site (ManageExpense date, ExpensesToolbar From/To, ExpensesReportsView Custom range, ManageVaccination date, ManageMembership expiry); usability on mobile is provided by the FD-01 16px no-zoom rule. *(History: PrimeVue 4.5.5 dropped the `touchUI` prop; `:inline="isMobile"` was tried 2026-05-27 then reverted 2026-05-28 after UAT showed inline calendars crowd the always-rendered filter/range pickers — see 35-CONTEXT.md D-35-13 RE-CORRECTED.)*
- [x] **FD-05**: PrimeVue FileUpload (or raw `<input type="file">` fallback) on receipt/scan affordances opens the device camera via `capture="environment"`; gallery-picker fallback also offered separately for iOS standalone reliability
- [x] **FD-06**: Focused input auto-scrolls into view when the virtual keyboard opens (both iOS overlay and Android `interactive-widget=resizes-content` paths verified)
- [x] **FD-07**: `BaseMobileDialog.vue` wrapper component established; per-dialog migration in order ManageExpense → ManageBudget → ManageMembership → ManageVaccination; `ManageMembership` migration explicitly preserves the ColorPicker direct-v-model invariant (PrimeVue #8135 workaround)
- [x] **FD-09**: Dirty-state guard — backdrop tap / swipe-down on a mobile Drawer containing a CRUD form prompts `useConfirm` ("Discard changes?") before dismissing; reusing the existing shell-level ConfirmDialog instance

### PWA Install + Standalone Polish (PWA)

- [ ] **PWA-01**: `index.html` includes `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style="black-translucent"`, `apple-mobile-web-app-title="Wallecx"`, and per-color-scheme `<meta name="theme-color">` (light: navy, dark: dark surface token); confirmed correct on iOS standalone install
- [ ] **PWA-02**: Per-device-resolution iOS splash screens generated via `@vite-pwa/assets-generator`; `<link rel="apple-touch-startup-image">` set for all v4.3 test viewports (390×844, 360×780, 768×1024); branded splash replaces white-flash on install + launch
- [ ] **PWA-04**: Android Chrome `BeforeInstallPromptEvent` captured at App.vue scope (via FND-02); `PwaInstallBanner.vue` extended with an Android Install button that calls `event.prompt()`; iOS instructional path coexists in the same component
- [ ] **PWA-05**: PWA-UAT-01 (deferred from Phase 22 V6) closed — viewport-tagged install + force-quit + relaunch + dark-mode toggle + auth survival UAT executed on real iOS device, real Android device, and iPad-820 viewport; results recorded
- [ ] **PWA-06**: SW-update toast ("Refresh / Later") respects safe-area-inset on iPhone with notch / dynamic island; verified in standalone
- [ ] **PWA-07**: Offline banner backed by `useOnline` shows when navigator goes offline (in addition to existing NetworkOnly /api/* toast behavior); retry affordance offered on reconnect
- [ ] **PWA-09**: Web App Manifest declares `shortcuts` array — Quick Actions for long-press home-screen icon (Add Expense, Add Vaccination, Add Membership, Open Reports)

### Non-Functional Requirements & Constraints (NFR / CON)

These bind every phase, not just the phase that introduces them. Each cites the originating pitfall ID in PITFALLS.md.

- [ ] **NFR-PWA-AUTOUPDATE** *(C-1)*: `registerType` in `vite.config.ts` must remain `'prompt'`; any phase touching the PWA block preserves the existing LOCKED comment. Reason: CRUD forms have unsaved state — silent SW reload destroys input
- [ ] **NFR-BR-2-PRESERVED** *(C-2)*: BarcodeDisplay.vue must render black bars on white background in BOTH themes AND in PWA standalone AND at all v4.3 test viewports (390/360/768). Vitest/Playwright snapshot guard added; UAT verifies in scan overlay
- [ ] **NFR-REQUESTKEY-UNIQUE** *(C-3)*: Each PocketBase `requestKey` is owned by exactly one call site (or one helper). New mobile fetch paths (pull-to-refresh, focus-back, intersection-lazy-load) require new distinct requestKeys, documented in STATE.md `Architectural Invariants` at ship time
- [ ] **NFR-DVH-NOT-VH** *(C-4)*: No `100vh` / `h-screen` in `src/components/projects/wallecx/`. Use `100dvh` (with `100svh` fallback). Milestone-close audit grep returns 0 matches
- [ ] **NFR-IOS-NO-ZOOM** *(C-5)*: All form inputs in Wallecx render at ≥16px on mobile viewports (≤640px). Enforced via global `@media` rule (FD-01) AND grep audit that flags `text-xs` / `text-sm` on any input element
- [ ] **NFR-PWA-PRECACHE-FITS** *(C-6)*: All chunks in `dist/manifest.json` fit under the configured `maximumFileSizeToCacheInBytes` (currently 3 MiB). `npm run build` log scan for "exceeds" or "Skipping precaching" produces 0 matches
- [ ] **CON-PB-COUNT-BUG** *(C-7)*: `getList()` without `{ skipTotal: true }` is broken on `wallecx_*` collections in PB v0.29.x (D-31-B). Code review rejects any new `getList(` call against `wallecx_*` unless it passes `{ skipTotal: true }`. Prefer `getFullList()` or client-side virtualization
- [ ] **CON-PWA-SCOPE** *(C-8)*: Manifest `scope: '/'` is mandatory and must not be narrowed. Verified in PWA polish phase
- [ ] **CON-VIEWPORT-FIT** *(M-1)*: `index.html` `<meta name="viewport">` must include `viewport-fit=cover`. Inline LOCKED comment retained (LT-09)
- [ ] **NFR-DRAWER-DIRTY-GUARD** *(M-3)*: Mobile Drawer (`position="bottom"`) dismissal must not silently destroy unsaved CRUD form state. Confirmation dialog gates discard (FD-09)
- [ ] **NFR-PWA-BANNER-FREQUENCY** *(M-8)*: Install banner must NOT show in standalone mode (`display-mode: standalone` OR `navigator.standalone === true`) and must respect a localStorage dismissal record (re-show only after ≥30 days)
- [ ] **NFR-IOS-EVICTION-UX** *(M-10)*: When auth expires due to iOS 7-day localStorage eviction, the redirect surfaces clear copy explaining the cause (not the generic "Session expired"); install banner copy mentions home-screen pinning as mitigation
- [ ] **NFR-IOS-SPLASH** *(M-11)*: `apple-touch-startup-image` defined for all v4.3 test viewports (390×844, 360×780, 768×1024) via @vite-pwa/assets-generator; verified branded splash on iPhone install + relaunch (PWA-02)
- [ ] **CON-CARD-COLOR-NO-HASH** *(M-13)*: `card_color` stored without `#` prefix. Any mobile color-picker UX swap (e.g., native `<input type="color">`) strips `#` on save and prepends on read. Membership mapper Vitest spec re-runs and extends if ColorPicker swapped
- [ ] **CON-CONFIRMDIALOG-SINGLETON** *(M-14)*: Exactly one `<ConfirmDialog />` mounts at WallecxApp.vue shell level. Mobile-positioning needs solved via scoped CSS targeting `.p-confirmdialog`, not by mounting a second instance. Grep audit returns 1 line
- [ ] **NFR-PERF-MEASURE** *(M-19)*: v4.3 must log a one-time payload-size + duration measurement per `wallecx_*` `getFullList` on a mid-tier mobile device under cellular conditions, recorded in MILESTONES.md at close. Gates whether PF-06 virtualization triggers

## Future Requirements

Carried forward from PROJECT.md (deferred from v4.2 or earlier):

- **HEALTH-01**: Code-level collection health check on app boot or Reports tab mount (boot-time probe of `wallecx_expense_budgets` reachability with inline warning + setup steps)
- **UAT-28-CLOSE**: Walk through Phase 28's 9 deferred budget-tracking UAT scenarios
- **UAT-29-CLOSE**: Walk through Phase 29's 7 deferred period-comparison UAT scenarios
- **PB-REALTIME**: PocketBase realtime `subscribe('*', cb)` / `unsubscribe('*')` lifecycle for `wallecx_*` collections — uniform application across all wallecx collections
- **EXP-ADV-02**: Recurring expenses
- **EXP-ADV-03**: Multi-currency support
- **EXP-ADV-05**: Year-over-year period comparison
- **EXP-ADV-06**: Custom-range period comparison
- **EXP-ADV-08**: Multi-period trend / sparkline
- **EXP-ADV-09** *(new from v4.3 PITFALLS M-19)*: Expense archival / windowed fetch — only triggered if `getFullList()` payload exceeds threshold per NFR-PERF-MEASURE
- **CONV-03**: Expiry date reminders
- **SCAN-ADV-01**: PDF417 and Aztec code formats

## Out of Scope

Explicitly excluded from v4.3 to keep scope mobile-focused. Anti-features locked out by research are listed with reasoning.

| Feature | Reason |
|---------|--------|
| Floating Action Button (FAB) | Anti-feature per FEATURES.md — conflicts with PrimeVue tab shell + bottom safe-area; "Add" affordances already in toolbars |
| Long-press context menus | Anti-feature — conflicts with iOS standalone gestures; existing edit/delete affordances in detail views |
| Swipe-to-delete on list rows | Anti-feature — conflicts with bottom-sheet swipe-down; risk of accidental delete |
| Pull-to-refresh | Anti-feature for v4.3 — duplicates already-instant `getFullList` and risks C-3 requestKey collision |
| `registerType: 'autoUpdate'` SW | Anti-feature — destroys unsaved CRUD state on deploy (locked NFR-PWA-AUTOUPDATE) |
| IndexedDB offline replica | Anti-feature — PocketBase has no offline SDK; replica complexity exceeds value for personal vault |
| Native `<select>` swap from PrimeVue Select | Anti-feature — design-system regression; PrimeVue Select with touchUI patterns covers mobile UX |
| Native `alert/prompt/confirm` | Anti-feature — non-themed; existing `useConfirm` covers all confirmation paths |
| Push notifications | Anti-feature — no notification infrastructure; CONV-03 (expiry reminders) deferred too |
| Web Share Target API | Anti-feature — no inbound-share use case |
| Periodic background sync | Anti-feature — battery cost; iOS does not support it |
| AVIF receipt upload format | Anti-feature — WebP (PF-07) covers compression; AVIF browser support not yet universal |
| HEALTH-01 (boot-time collection health check) | Mobile-scope split — defer to next milestone |
| UAT-28-CLOSE / UAT-29-CLOSE | Mobile-scope split — deferred to next milestone |
| PB-REALTIME (uniform wallecx_* subscribe) | Mobile-scope split — defer to next milestone |
| LexTrack / Larga / Gift Exchange / API Playground mobile work | v4.3 stays Wallecx-focused; other mini-apps in a later milestone |
| Lexarium shell + nav mobile work | v4.3 stays Wallecx-focused; out of v3.0 dark-mode sweep + later milestone |
| Bottom-sheet snap points | Out of v4.3 budget — no PrimeVue primitive; complex; low payoff |
| Standalone history-back integration | Out of v4.3 budget — complex popstate handling |
| Lockdown via `<meta viewport ... user-scalable=no>` | A11y regression — users must be able to zoom. FD-01 uses font-size, not viewport lockdown |
| Apple Wallet / Google Wallet export | Requires server-side certificate signing |

## Traceability

Populated by gsd-roadmapper during ROADMAP.md creation (2026-05-26). Each functional requirement maps to exactly one phase. NFR/CON requirements list the **verification-owner phase**; binds to multiple phases documented in each phase's "Binds NFR/CON" section in ROADMAP.md.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 33 | Complete (33-02) |
| FND-02 | Phase 33 | Complete (33-02) |
| FND-03 | Phase 33 | Complete (33-03) |
| FND-04 | Phase 33 | Complete (33-01) |
| LT-01 | Phase 34 | Complete |
| LT-02 | Phase 34 | Complete |
| LT-03 | Phase 34 | Complete |
| LT-04 | Phase 34 | Complete |
| LT-05 | Phase 34 | Complete |
| LT-07 | Phase 34 | Complete |
| LT-08 | Phase 35 | Complete (35-01..05) |
| LT-09 | Phase 34 | Complete |
| PF-01 | Phase 36 | Pending |
| PF-02 | Phase 36 | Pending |
| PF-04 | Phase 36 | Pending |
| PF-05 | Phase 36 | Pending |
| PF-06 | Phase 38b | Conditional (triggered by PF-05 instrumentation) |
| PF-07 | Phase 36 | Pending |
| PF-09 | Phase 36 | Pending |
| FD-01 | Phase 35 | Complete (35-01) |
| FD-03 | Phase 35 | Complete (35-02..05) |
| FD-04 | Phase 35 | Complete (35-02..05, revert f8eb9c7 — popup-everywhere) |
| FD-05 | Phase 35 | Complete (35-02, 35-04, 35-05) |
| FD-06 | Phase 35 | Complete (35-01..05) |
| FD-07 | Phase 35 | Complete (35-01) |
| FD-09 | Phase 35 | Complete (35-02..05) |
| PWA-01 | Phase 37 | Pending |
| PWA-02 | Phase 37 | Pending |
| PWA-04 | Phase 37 | Pending |
| PWA-05 | Phase 38 | Pending |
| PWA-06 | Phase 37 | Pending |
| PWA-07 | Phase 37 | Pending |
| PWA-09 | Phase 37 | Pending |
| NFR-PWA-AUTOUPDATE | Phase 37 (owner; binds 36, 38) | Pending |
| NFR-BR-2-PRESERVED | Phase 38 (final owner; binds 34, 35, 37) | Pending |
| NFR-REQUESTKEY-UNIQUE | Phase 36 (owner; binds 38b) | Pending |
| NFR-DVH-NOT-VH | Phase 34 (owner; binds milestone-close audit) | Pending |
| NFR-IOS-NO-ZOOM | Phase 35 (owner; binds 34 grep audit, 38 UAT) | Complete (35-01 rule; 35-06 grep audit PASS; real-device deferred to 38) |
| NFR-PWA-PRECACHE-FITS | Phase 36 (owner; binds 37) | Pending |
| CON-PB-COUNT-BUG | Phase 36 (owner; binds 38b) | Pending |
| CON-PWA-SCOPE | Phase 37 (owner; binds 38) | Pending |
| CON-VIEWPORT-FIT | Phase 34 (owner; binds 37 PWA) | Pending |
| NFR-DRAWER-DIRTY-GUARD | Phase 35 (owner; binds 38 UAT) | Complete (35-02..05; human-verify APPROVED) |
| NFR-PWA-BANNER-FREQUENCY | Phase 37 (owner; binds 38 UAT) | Pending |
| NFR-IOS-EVICTION-UX | Phase 37 (owner; binds 38 UAT) | Pending |
| NFR-IOS-SPLASH | Phase 37 (owner; binds 38 UAT) | Pending |
| CON-CARD-COLOR-NO-HASH | Phase 35 (owner; ManageMembership migration) | Complete (35-04; 35-06 grep audit PASS; membershipMapper 11 tests green) |
| CON-CONFIRMDIALOG-SINGLETON | Phase 35 (owner; binds 38 UAT) | Complete (35-06 grep audit: exactly 1 <ConfirmDialog in WallecxApp.vue) |
| NFR-PERF-MEASURE | Phase 36 (owner; gates Phase 38b conditional) | Pending |

**Coverage:**
- v4.3 functional requirements: 32 total (4 FND + 8 LT + 8 PF + 7 FD + 7 PWA — PF-06 is conditional)
- v4.3 non-functional / constraints: 16 total
- Total: 48 requirements
- Mapped to phases: 48/48 (100%) — PF-06 mapped to conditional Phase 38b
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-26 after gathering milestone goals (mobile optimization for Wallecx + PWA polish) and consuming research outputs (STACK / FEATURES / ARCHITECTURE / PITFALLS / SUMMARY in `.planning/research/`).*
*Traceability populated: 2026-05-26 by gsd-roadmapper — 32/32 functional + 16/16 NFR/CON mapped; PF-06 conditional accepted per milestone scope.*
