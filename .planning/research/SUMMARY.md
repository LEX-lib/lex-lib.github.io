# Project Research Summary — v4.3 Wallecx Mobile Optimization

**Project:** Lexarium — Wallecx
**Domain:** Mobile-grade polish layer on an existing Vue 3 + PrimeVue 4 + Tailwind v4 + PocketBase + vite-plugin-pwa SPA mini-app
**Researched:** 2026-05-26
**Confidence:** HIGH

## Executive Summary

v4.3 is a **presentation-layer polish milestone, not a refactor.** The four research dimensions (STACK, FEATURES, ARCHITECTURE, PITFALLS) converge on a single thesis: every locked invariant from v2.0–v4.2 stays put (BR-2 barcode, registerType prompt, NetworkOnly /api/*, requestKey isolation, card_color no-hash, shell-owns-data, single ConfirmDialog), and the milestone ships a thin lateral layer of mobile-grade UX on top: real isMobile/isTablet/isStandalone reactive env, Dialog vs Drawer unification, iOS 16px input fix, sticky action bars, beforeinstallprompt capture, iOS standalone meta tags + splash images, and per-tab bundle splitting.

The recommended approach is **category-grouped phases** (foundation composable -> layout audit -> forms and dialogs -> performance -> PWA polish -> conditional virtualization -> UAT sweep), continuing numbering from Phase 33. Net new dependencies are minimal: promote @vueuse/core from transitive to direct (0 KB net), add rollup-plugin-visualizer as a devDep, patch-bump Vue 3.5.18->3.5.34, and minor-bump PrimeVue 4.3.7->4.5.5 (smoke-test in a branch before merge). Everything else is local code/CSS/meta-tag changes.

The three highest-cost regression risks are (a) flipping registerType to autoUpdate and destroying unsaved CRUD input on a deploy; (b) regressing BR-2 barcode colors in a dark-mode/mobile CSS sweep so memberships fail at checkout counters; and (c) switching getFullList() to getList() for "mobile pagination" and tripping the locked PocketBase v0.29.x count-path 400 bug (D-31-B). All three are surfaced as REQUIREMENTS.md candidate REQ-IDs below.

## Key Findings

### Recommended Stack

Stack is **locked**; v4.3 adds only what the mobile-optimization capabilities require. Bundle wins come from splitting existing chunks (visualizer-driven), not from new libraries.

**Stack additions:**
- **@vueuse/core ^13.9.0 (promote to direct dep)** — already transitive via @vueuse/motion; unlocks useWindowSize, useScrollLock, useSwipe, useOnline, usePreferredReducedMotion, useMediaQuery. **0 KB net.**
- **rollup-plugin-visualizer ^7.0.1 (devDep)** — bundle treemap report gated on ANALYZE=true; informs lazy-import decisions. **0 KB runtime.**
- **cross-env (devDep)** — Windows-friendly ANALYZE=true flag for the new npm run analyze script.

**Version upgrades:**
- **vue ^3.5.18 -> ^3.5.34** — patch only; pure reactivity/memory fixes. LOW risk.
- **primevue ^4.3.7 -> ^4.5.5** (+ @primevue/auto-import-resolver, @primevue/forms lockstep) — minor; Drawer/Dialog/Timeline a11y fixes. **MEDIUM-LOW risk; branch smoke-test required** before merge.
- **vite-plugin-pwa ^1.3.0** — already current; no change.

**Rejected:** vue-virtual-scroller / @tanstack/vue-virtual (defer until measured — datasets too small), vite-imagetools / vite-plugin-image-optimizer (only 1-2 static images to compress), body-scroll-lock (unmaintained — use VueUse useScrollLock), vue-pwa-install (Vue 2-era wrapper around 30 lines).

### Expected Features

Drawn from 40+ catalogued features across 4 categories (Layout, Performance, Forms, PWA). Tier 1 = ship in v4.3; details in FEATURES.md.

**Must have (table stakes):**
- **LT-01 44x44 touch-target audit** [Layout | S] — every interactive element across all 3 tabs.
- **LT-03 Safe-area inset coverage** [Layout | S] — every fixed/overlay surface, both orientations; prerequisite for sticky surfaces and iOS status-bar black-translucent.
- **LT-05 Sticky TabList + toolbar** [Layout | M] — pinned so long lists do not lose context.
- **LT-08 Sticky action bars in all 4 manage dialogs** [Layout | M] — Save/Cancel always above the keyboard.
- **FD-01 iOS 16px input font** [Forms | S] — single global @media (max-width: 640px) rule; the single most-cited iOS PWA bug.
- **FD-03 inputmode / autocomplete / enterkeyhint sweep** [Forms | S] — keyboard correctness on every input.
- **FD-04 DatePicker touchUI mode** [Forms | M] — full-screen modal calendar on mobile.
- **FD-05 Camera capture on FileUpload** [Forms | S] — capture=environment for receipt/scan; PrimeVue passthrough verification needed.
- **PF-02 Per-tab defineAsyncComponent** [Perf | M] — split VaccinationsTab / MembershipsTab / ExpensesTab from the WallecxApp.vue shell.
- **PF-04 Skeleton states everywhere** [Perf | S] — match final layout dims to keep CLS <= 0.1.
- **PWA-01 iOS standalone status-bar meta tags** [PWA | S] — apple-mobile-web-app-* + theme-color per color-scheme; index.html currently missing these.
- **PWA-02 iOS splash screens** [PWA | M] — via existing @vite-pwa/assets-generator.
- **PWA-04 Android beforeinstallprompt capture** [PWA | M] — listener at App.vue scope; UI in extended PwaInstallBanner.vue.
- **PWA-05 PWA-UAT-01** [PWA | M] — deferred from Phase 22 V6; gated on PWA-01..04 + LT-03.

**Should have (differentiators):**
- **PF-07 WebP receipt/scan upload** [Perf | S] — pass fileType image/webp to existing browser-image-compression.
- **PF-09 Preconnect hints** [Perf | S] — DNS+TLS warm-up for PocketBase origin.
- **PWA-07 Offline banner + retry** [PWA | S] — via useOnline.
- **PWA-09 Manifest shortcuts** [PWA | S] — long-press Quick Actions (Add Expense etc.).
- **FD-09 Unsaved-changes guard** [Forms | M] — confirm before discarding dirty form on backdrop tap.

**Defer (locked anti-features or out-of-budget):**
- **LT-11 Bottom-sheet snap points** — no PrimeVue primitive; complex; low payoff.
- **PF-06 List virtualization** — instrument first; threshold >= 500 rendered rows.
- **PWA-08 Standalone history-back integration** — complex; risky popstate handling.
- **All PWA-AF / FD-AF / LT-AF entries** — explicitly locked out (autoUpdate SW, IndexedDB replica, push notifications, FAB, long-press menus, native select swap).

### Architecture Approach

v4.3 is a **thin lateral layer over the existing architecture.** No new collections, no new routes, no Pinia store, no design-token churn. The five integration surfaces are: one new composable (useMobileEnv), one new optional wrapper (BaseMobileDialog), one extended component (PwaInstallBanner), vite.config.ts build-target tweaks (async tab imports), and deferred virtualization. The shell-owns-data pattern (ExpensesTab -> ExpensesListView + ExpensesReportsView) is preserved verbatim.

**Key architecture decisions (the load-bearing 6 of 11):**

1. **A-43-1 useMobileEnv.ts extends, does NOT replace useIsMobile.ts.** Backward-compatible for 8 existing call sites; centralizes isMobile / isTablet / isStandalone / installPromptEvent / safeAreaInsets. New v4.3 code uses the new composable; existing code is not forced to migrate.
2. **A-43-2 BaseMobileDialog.vue is per-dialog opt-in, NOT big-bang refactor.** Migrate ManageExpense -> ManageBudget -> ManageMembership -> ManageVaccination, one per phase-plan. ManageMembership is the highest-risk migration (ColorPicker direct v-model invariant, PrimeVue #8135) and goes late.
3. **A-43-4 beforeinstallprompt listener registers at App.vue scope, NOT WallecxApp.vue.** The event fires once on first page load; if the user navigates to /projects/wallecx AFTER the event fires, capture is lost. Module-scope singleton ref in useMobileEnv.ts solves this.
4. **A-43-5 PwaInstallBanner.vue extended for iOS + Android in ONE component.** Splitting would duplicate dismissal storage, standalone detection, visual frame, safe-area calcs.
5. **A-43-6 Per-tab defineAsyncComponent from WallecxApp.vue.** Initial chunk drops by ~2/3; first-click tab switch is sub-second; subsequent switches are cached.
6. **A-43-9 Build order grouped by CATEGORY (not by tab).** One pattern established once and applied across surfaces is cheaper than rediscovering it tab-by-tab.

### Critical Pitfalls (5 of 8 critical + 21 moderate + 7 minor)

1. **C-1 registerType drift to autoUpdate** -> silent SW reload destroys unsaved CRUD input. Lock prompt with inline LOCKED comment; REQ: NFR-PWA-AUTOUPDATE. **Owner: PWA polish phase.**
2. **C-2 BR-2 barcode regression via dark-mode mobile CSS sweep** -> cream-on-navy bars unreadable at checkout. Add Vitest/Playwright snapshot guard on BarcodeDisplay.vue SVG fill; REQ: NFR-BR-2-PRESERVED. **Owner: Layout audit phase + PWA standalone phase.**
3. **C-5 iOS auto-zoom on inputs <16px** -> page zooms in on focus and never zooms back. Confirmed in code (text-sm on ManageExpense.vue labels). Single global @media (max-width: 640px) rule on .p-inputtext, .p-textarea, .p-datepicker-input, .p-inputnumber-input, .p-select-label with font-size: 16px !important. REQ: NFR-IOS-NO-ZOOM. **Owner: Forms phase.**
4. **C-4 100vh / h-screen measuring wrong on iOS/Android** -> sticky bottom controls offscreen under URL bar. Replace with 100dvh (svh fallback). REQ: NFR-DVH-NOT-VH. **Owner: Layout audit phase.**
5. **C-7 getList() regression on wallecx_* collections** -> D-31-B count-path 400. Do NOT paginate; prefer client-side virtualization; if getList is unavoidable, skipTotal=true. REQ: CON-PB-COUNT-BUG. **Owner: Performance phase.**
6. **C-6 Workbox maximumFileSizeToCacheInBytes 3 MiB silently skips bigger chunks** -> standalone PWA breaks offline days later. Add build-time chunk-size assertion. REQ: NFR-PWA-PRECACHE-FITS. **Owner: Performance phase.**
7. **M-3 Drawer swipe-down-to-close destroys unsaved form input** -> guard via PrimeVue Drawer config + dirty-state confirmation. REQ: NFR-DRAWER-DIRTY-GUARD. **Owner: Forms phase.**
8. **C-3 Duplicate requestKey from new mobile refetch (pull-to-refresh, focus-back)** -> PocketBase SDK auto-cancels, list renders empty. New mobile fetch paths require distinct requestKeys. REQ: NFR-REQUESTKEY-UNIQUE. **Owner: Performance phase + any layout phase adding a refresh affordance.**

Full pitfall matrix (8 critical + 21 moderate + 7 minor) and 16 candidate REQ-IDs in PITFALLS.md.

## Implications for Roadmap

Suggested phase structure (continuing numbering from v4.2 Phase 32), category-grouped per A-43-9:

### Phase 33 — Mobile foundation: useMobileEnv + PWA install capture
**Rationale:** App.vue listener for beforeinstallprompt MUST register before user navigates to Wallecx (event fires once on first page load). Foundation composable unblocks every later phase.
**Delivers:** src/composables/useMobileEnv.ts; App.vue listener wiring; extended PwaInstallBanner.vue (Android path); spec files for both. useIsMobile.ts kept as-is for backward compat.
**Addresses:** PWA-04, partial PWA-01 prep; unblocks LT-03/05/08 by exposing safeAreaInsets.
**Avoids:** Late event-listener registration silently dropping the Android install prompt.

### Phase 34 — Layout audit + 44px touch targets + safe-area + horizontal-scroll sweep
**Rationale:** Fix the shell before the dialogs — dialog content inherits the layout frame. Establishes safe-area inset wiring required by Phase 35 sticky bars and Phase 37 PWA status-bar black-translucent.
**Delivers:** Per-tab scoped CSS fixes; 100dvh migration; touch-target audit; sticky TabList + toolbar; horizontal-scroll prevention sweep; MultiSelect chip cap; DatePicker touchUI; AttachmentPreview pinch-zoom check.
**Addresses:** LT-01, LT-02, LT-03, LT-04, LT-05, LT-06, LT-07.
**Avoids:** C-2 BR-2 regression (barcode visual check), C-4 100vh trap, M-1 viewport-fit lock, M-4 MultiSelect chip overflow, M-5 DatePicker touch, M-7 Tabs scroll discoverability.

### Phase 35 — Forms and dialogs on small screens (BaseMobileDialog rollout + iOS 16px fix)
**Rationale:** Sticky action bar depends on Phase 34 safe-area wiring; iOS 16px fix is one CSS rule but the per-dialog BaseMobileDialog migration is the risky part. Order: ManageExpense -> ManageBudget -> ManageMembership (ColorPicker risk, late) -> ManageVaccination.
**Delivers:** BaseMobileDialog.vue; global @media (max-width: 640px) input-font-size rule in wallecx-overrides.css; sticky bottom action bars in all 4 Manage* dialogs; per-field inputmode/autocomplete/enterkeyhint; camera capture on FileUpload; focus auto-scroll; Drawer dirty-state guard.
**Addresses:** LT-08, LT-09, FD-01, FD-02, FD-03, FD-04 (touchUI applied), FD-05, FD-06, FD-07. Tier-2 if budget: FD-08, FD-09, FD-10.
**Avoids:** C-5 iOS zoom-on-focus, M-3 Drawer swipe-to-close eats form, M-13 card_color hash regression (ManageMembership ColorPicker), M-14 ConfirmDialog singleton, M-15 z-index collision.

### Phase 36 — Mobile performance: bundle splits + asset compression + measurement
**Rationale:** Perf work is non-functional and easier to verify once visual layer (33-35) is stable. Visualizer-driven, not speculative.
**Delivers:** rollup-plugin-visualizer wired (gated on ANALYZE=true); WallecxApp.vue tabs converted to defineAsyncComponent; per-Manage* defineAsyncComponent; PWA icon regeneration; about-me-photo.png one-time squoosh compression; WebP upload format; preconnect hints; performance.mark/measure instrumentation; payload-size + duration measurement per Wallecx collection on mobile cellular (REQ NFR-PERF-MEASURE).
**Addresses:** PF-01, PF-02, PF-03, PF-05; Tier-2: PF-07, PF-08, PF-09.
**Avoids:** C-6 3 MiB precache cap, C-7 getList D-31-B trap, M-17 chart plugin inflation, M-18 image-compression on main thread, M-19 getFullList scale, M-20 auto-import bundle inflation.

### Phase 37 — PWA standalone polish + install flow UAT
**Rationale:** Requires Phase 33 listener + Phase 34 safe-area + Phase 36 reduced bundle to feel native-grade. iOS meta tags + splash + theme-color land here.
**Delivers:** apple-mobile-web-app-* meta tags in index.html; apple-touch-startup-image set via @vite-pwa/assets-generator; per-color-scheme theme-color meta; display-mode standalone CSS tweaks; SW-update toast safe-area verification; manifest shortcuts (Tier-2); offline banner via useOnline (Tier-2); banner-dismissal frequency rule.
**Addresses:** PWA-01, PWA-02, PWA-03, PWA-06, PWA-10; Tier-2: PWA-07, PWA-09.
**Avoids:** C-1 registerType drift (re-affirm LOCKED), C-8 manifest scope narrowing, M-8 banner fatigue, M-10 iOS 7-day eviction UX, M-11 splash variants, M-12 theme-color mismatch, N-7 iOS standalone capture inconsistency.

### Phase 38 — PWA-UAT-01 (deferred from Phase 22 V6) + mobile UAT sweep
**Rationale:** Natural milestone-close UAT. Mirrors v4.1 Phase 30 sweep structure. Real-device iOS + Android Chrome required.
**Delivers:** PWA-UAT-01-HUMAN-UAT.md with viewport-tagged scenarios across phases 33-37; iOS A2HS install + force-quit + relaunch + dark-mode toggle + auth survival; Android beforeinstallprompt install; standalone in-app navigation; barcode visual check in dark-mode standalone.
**Addresses:** PWA-05.
**Avoids:** Final guardrail against C-2, C-1, M-8, M-10 in real installed standalone mode.

### Phase 38b (conditional) — List virtualization
**Rationale:** Only triggered if Phase 36 instrumentation reveals >16ms scroll jank on long-running expense logs or any collection exceeds ~500 rendered rows. Likely skipped.
**Delivers:** @tanstack/vue-virtual integration in ONE long list view (probably ExpensesListView); virtual scroller consumes the already-sorted array.
**Addresses:** PF-06.
**Avoids:** M-16 virtualization breaks sessionStorage sort-restore order.

### Phase Ordering Rationale

- **Foundation before audit:** useMobileEnv must land first so Phase 34/35/37 can consume safeAreaInsets, isStandalone, installPromptEvent. App.vue listener registration ordering matters for first-page-load capture (A-43-4).
- **Shell before dialogs:** Layout audit (34) fixes the frame; forms (35) fix the content. Reversing the order would mean re-doing dialog work after the shell moves.
- **Performance after visual:** Bundle splits and async components are easier to verify (and easier to detect regressions in) once the visual surface is stable.
- **PWA polish last (before UAT):** Status-bar / splash / install affordance want the safe-area wiring (34), the sticky bars (35), and the reduced bundle (36) all in place before UAT.
- **Category grouping (A-43-9):** Each phase establishes ONE pattern across all 3 tabs; tab-by-tab ordering would rediscover the same patterns 3x and produce less reviewable diffs.

### Research Flags

**Phases likely needing deeper research during planning (/gsd-research-phase):**
- **Phase 35** — PrimeVue 4.5.5 minor-upgrade smoke test (Drawer body-scroll lock parity with Dialog; FileUpload capture passthrough syntax; touchUI on DatePicker inside Drawer); ColorPicker direct-v-model survival through BaseMobileDialog slot rendering.
- **Phase 36** — rollup-plugin-visualizer output review against locked v2.1 D-09 3 MiB cap; concrete chunk-split decisions per-tab.
- **Phase 37** — apple-touch-startup-image media-query list for v4.3 viewports (390x844, 360x780, 768x1024); @vite-pwa/assets-generator regeneration commands.

**Phases with standard patterns (skip deep research):**
- **Phase 33** — useMobileEnv is a straightforward composable; beforeinstallprompt capture is a documented 30-line pattern.
- **Phase 34** — Tailwind min-h-[44px] + 100dvh + overflow-x-hidden audit; no new tech.
- **Phase 38** — UAT only; mirrors v4.1 Phase 30 workflow.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct npm ls verification; current package versions confirmed against vuejs.org, PrimeVue releases, vite-pwa, rollup-plugin-visualizer. One MEDIUM flag: PrimeVue 4.3->4.5 minor reads as pure fixes but warrants branch smoke-test. |
| Features | HIGH | Apple HIG, Material 3, web.dev Core Web Vitals, MDN PWA all converge; classifications cross-checked against existing Wallecx code state. Two MEDIUM flags: FD-05 PrimeVue FileUpload capture passthrough exposure on basic mode; FD-07 PrimeVue 4 Drawer body-scroll lock parity with Dialog. |
| Architecture | HIGH | All 11 decisions grounded in source files read directly (WallecxApp.vue, PwaInstallBanner.vue, useIsMobile.ts, vite.config.ts, wallecx-overrides.css, App.vue, main.ts). |
| Pitfalls | HIGH | 8 critical + 21 moderate + 7 minor verified against MDN/CanIUse, Workbox docs, PrimeVue 4 docs, WebKit notes, and STATE.md locked invariants. Codebase grep evidence confirmed C-5 trap directly in ManageExpense.vue (text-sm on inputs). |

**Overall confidence:** HIGH.

### Gaps to Address (open questions for Requirements / Roadmap step)

- **Production record counts unknown.** Wallecx is a personal vault; per-collection record counts (vaccinations / memberships / expenses) are not measured. Phase 36 instrumentation (REQ NFR-PERF-MEASURE) closes this gap and determines whether Phase 38b virtualization is triggered. Roadmap must surface this measurement as the gating signal.
- **PrimeVue 4.3->4.5 minor-upgrade smoke test scope.** Drawer + Dialog + DatePicker (touchUI) + FileUpload (capture) + MultiSelect chip behavior must be re-verified in a branch before merge. Recommendation: run the upgrade as the FIRST plan in Phase 35 (forms phase touches dialogs the most).
- **Virtualization defer-vs-include decision.** Currently deferred (Phase 38b conditional). The roadmap should explicitly require Phase 36 instrumentation report before Phase 38 milestone-close to either close the loop (no virtualization needed) or trigger Phase 38b.
- **Bundle composition of current Wallecx critical path.** Visualizer report from Phase 36 will reveal whether leaflet, quill, vue-pdf-embed, dompurify, or axios are inadvertently in the Wallecx first-paint chunk. Roadmap should treat the visualizer output as the input to phase-36 plan sequencing, not as a milestone-close-only artifact.
- **PWA-UAT-01 device coverage.** Requires real iOS + Android devices; iPad-820 viewport explicit. Roadmap should call out the device matrix in Phase 38 acceptance criteria.
- **16 candidate REQ-IDs from PITFALLS.md** need conversion to REQUIREMENTS.md entries; some bind every phase (e.g. NFR-BR-2-PRESERVED, CON-CONFIRMDIALOG-SINGLETON), others bind a specific phase (e.g. NFR-IOS-NO-ZOOM -> Phase 35).

## Sources

### Primary (HIGH confidence)
- .planning/research/STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md (researched 2026-05-26)
- .planning/PROJECT.md, .planning/STATE.md (locked architectural invariants v2.0-v4.2)
- Direct source-file reads: WallecxApp.vue, PwaInstallBanner.vue, useIsMobile.ts, vite.config.ts, wallecx-overrides.css, App.vue, main.ts, router/index.ts, ManageExpense.vue
- Apple Human Interface Guidelines (44pt touch target, safe-area insets, apple-mobile-web-app-* meta tags, viewport-fit=cover)
- web.dev — Core Web Vitals + INP (LCP <=2.5s / INP <=200ms / CLS <=0.1) and Installation prompt guide
- MDN — meta viewport interactive-widget, apple-mobile-web-app-status-bar-style, Web App Manifest, beforeinstallprompt
- vite-plugin-pwa 1.3.0 docs + @vite-pwa/assets-generator 1.0.2
- PrimeVue 4 docs — Drawer / Dialog / DatePicker (touchUI) / FileUpload / MultiSelect / Tabs
- @vueuse/core docs — useWindowSize, useScrollLock, useSwipe, useOnline, usePreferredReducedMotion
- CSS-Tricks + WebKit notes — iOS 16px input-zoom prevention
- Workbox 7.x docs — maximumFileSizeToCacheInBytes precache skip semantics
- CanIUse / MDN — dvh/svh/lvh viewport units (Safari 15.4+, Chrome 108+)

### Secondary (MEDIUM confidence)
- interactive-widget=resizes-content Android Chrome keyboard semantics (Chromium-only; iOS uses legacy overlay)
- iOS 7-day localStorage eviction (ITP / WebKit Storage Standard) — anecdotal navigator.storage.persist() success rate on iOS
- browser-image-compression Web Worker fallback behavior under Vite worker config edge cases
- Material Design 3 — 48dp touch target (corroborates HIG 44pt floor)
- Wallecx per-user data scale estimates (10-40 vaccinations, 5-30 memberships, 50-500 expenses) — inferred from personal vault scope

### Tertiary (LOW confidence)
- Vendor chunk composition (2.57 MiB raw / ~700 KiB gzipped) — quoted from v2.1 Plan 14-04 notes; needs visualizer verification in Phase 36
- iOS standalone PWA capture=environment reliability across iOS 17.x builds — WebKit bug history; mitigate by offering both Take photo and Choose from gallery

---
*Research completed: 2026-05-26*
*Ready for roadmap: yes*
