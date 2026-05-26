# Domain Pitfalls — v4.3 Wallecx Mobile Optimization

**Domain:** Adding mobile-grade polish to an existing Vue 3 + PrimeVue 4 + Tailwind v4 + PocketBase + vite-plugin-pwa app
**Researched:** 2026-05-26
**Scope:** v4.3 — layout & touch targets, mobile performance, forms & dialogs on small screens, PWA install + standalone polish
**Confidence overall:** HIGH (most pitfalls verified against either codebase grep, PrimeVue 4 docs, vite-plugin-pwa docs, MDN CanIUse, or recent iOS Safari / Chromium release notes)

> Mental model for this milestone: this is a **modification** milestone, not a greenfield build. Most pitfalls below are about regressing something that already works (BR-2 barcode, NetworkOnly PocketBase, requestKey isolation, registerType: 'prompt', card_color contract) while reshuffling layout for small screens. Treat invariants from STATE.md as load-bearing — the most expensive bug in v4.3 will be silently undoing one of them, not failing to ship a new feature.

---

## Critical Pitfalls

Mistakes that cause production-visible defects, lost user data, regress a locked invariant, or require a follow-up bug-fix milestone (v4.4).

### Pitfall C-1: registerType drift from `'prompt'` to `'autoUpdate'`

**Category:** PWA install + standalone polish
**What goes wrong:** A well-meaning refactor of `vite.config.ts` (e.g. "let's auto-update the SW so the install prompt UX is cleaner") flips `registerType: 'prompt'` to `'autoUpdate'`. Next deploy, any user with an open ManageExpense / ManageVaccination / ManageMembership / ManageBudget dialog containing unsaved input gets a silent SW reload that destroys their input mid-typing.
**Why it happens:** `'autoUpdate'` looks simpler in docs and removes the "Update available — Refresh / Later" toast. Reviewers without milestone context don't see the connection to unsaved CRUD state.
**Consequences:** Silent data loss in the middle of a save. Indistinguishable from a browser crash to the user. No telemetry — they just lose what they typed.
**Prevention:**
- Lock `registerType: 'prompt'` in `vite.config.ts` with an inline comment (already present: `// LOCKED: never 'autoUpdate' — CRUD forms have unsaved state`). Do NOT remove that comment during v4.3.
- Add a guard test: any PR that touches `vite.config.ts` PWA block must keep the LOCKED comment AND `registerType: "prompt"`.
- REQUIREMENTS.md non-functional: **NFR-PWA-AUTOUPDATE — `registerType` must remain `'prompt'`. Any phase touching `vite.config.ts` MUST preserve the LOCKED comment.**
**Detection:** Open ManageExpense, start typing, deploy a no-op change, watch input wiped without a "Refresh / Later" toast = regression.
**Owner phase:** PWA polish phase (the one touching `vite.config.ts`, manifest, install banner).

---

### Pitfall C-2: BR-2 barcode invariant regression via mobile CSS sweep

**Category:** Mobile layout pitfalls (PrimeVue + Tailwind v4)
**What goes wrong:** A mobile dark-mode override sweep adds `.my-app-dark .barcode-display { background: var(--color-surface-card); color: var(--color-typo-body); }` (looks "correct" for dark mode). Now the barcode SVG renders cream-on-navy instead of black-on-white → most barcode scanners (1D, especially Code128/EAN-13) cannot read it. Same regression possible via aggressive `*:not(.barcode-display)` selectors or Tailwind theme tokens applied too globally.
**Why it happens:** Mobile sweep + dark-mode polish frequently happen in the same pass. The BR-2 invariant (barcode stays black-on-white in BOTH themes) is the kind of contract you only remember when you read the v2.0/v3.0 archives.
**Consequences:** Memberships unusable at checkout counter for any user on dark mode — directly hits Core Value ("membership card grid with barcode scan overlay"). Already verified twice in v4.1 Phase 30 sweep; regressing it in v4.3 is a milestone-level failure.
**Prevention:**
- Add a Vitest/Playwright snapshot guarding `BarcodeDisplay.vue` SVG `fill` / `background` after every CSS change in v4.3.
- Wallecx UAT script for every v4.3 layout phase: open scan overlay on iPhone in dark mode and visually confirm white background + black bars.
- REQUIREMENTS.md non-functional: **NFR-BR-2-PRESERVED — BarcodeDisplay must render black bars on white background in BOTH themes AND in PWA standalone AND at all v4.3 test viewports (390/360/768).** Verify in the same UAT pass as v4.1 Phase 30.
**Detection:** Visual diff on `BarcodeDisplay` SVG; failed scan in counter test.
**Owner phase:** Layout & touch-target audit phase (touches Memberships) AND PWA standalone phase (re-verify in installed mode).

---

### Pitfall C-3: PocketBase auto-cancel via duplicated `requestKey` from new mobile path

**Category:** Mobile performance + project-specific
**What goes wrong:** A new mobile-only code path (e.g. a "swipe to refresh" gesture on ExpensesListView, or an `IntersectionObserver`-based lazy fetch when the Reports tab scrolls into view) calls `pb.collection('wallecx_expenses').getFullList({ requestKey: 'expenses-getFullList' })` while a previous in-flight call is still pending. PocketBase SDK **auto-cancels** the earlier request because the keys match → list renders empty or stale, toast fires, user sees "Failed to load expenses" on a healthy network.
**Why it happens:** STATE.md locks requestKeys per collection (`expenses-getFullList`, `expense-budgets-getFullList`, etc.) under the assumption of one-call-per-mount. Mobile patterns (pull-to-refresh, tab re-entry, focus-back-from-background) introduce N-calls-per-mount and break that assumption.
**Consequences:** Intermittent empty states on mobile that are impossible to reproduce on desktop. Mirrors v4.2 BUG-02 in symptom (misleading toast + empty list) but root cause is different.
**Prevention:**
- Any new mobile interaction that triggers a refetch must EITHER reuse the existing call site (debounced) OR use a distinct `requestKey` (`'expenses-pull-to-refresh'`, etc.).
- Document new requestKeys in STATE.md `Architectural Invariants` the moment they ship.
- Code-review rule: `grep -r "requestKey:" src/components/projects/wallecx/` must show 1 caller per key (or N callers all using the same fetch helper).
- REQUIREMENTS.md non-functional: **NFR-REQUESTKEY-UNIQUE — each PocketBase requestKey is owned by exactly one call site (or one helper). New mobile fetch paths require a new requestKey.**
**Detection:** Network panel shows `?cancel=true` 200s; UI shows empty/stale list with no error in console.
**Owner phase:** Mobile performance phase (lazy-loading work) AND any layout phase that adds a refresh affordance.

---

### Pitfall C-4: 100vh / `h-screen` measuring wrong on iOS Safari and Chrome on Android

**Category:** Mobile layout (Tailwind v4)
**What goes wrong:** A bottom sheet, scan overlay, sticky action bar, or the Wallecx shell uses `h-screen` (Tailwind v4 → `height: 100vh`) or raw `100vh`. On iOS Safari and Android Chrome, `100vh` is the **largest** viewport (URL bar collapsed), so the layout overflows by ~70–100px when the URL bar is showing — the bottom of the view (notably the sticky action bar on dialogs and the scan overlay's "Close" button) sits below the URL bar and is unreachable.
**Why it happens:** Browser legacy behavior; well known but easy to ship in scoped styles a reviewer doesn't scrutinize. Reduced-motion overlays and full-screen scan overlay use 100vh historically.
**Consequences:** Scan overlay Close button unreachable → user has to force-quit to exit a frozen full-screen state. Sticky action bar (Save / Delete) on Drawer offscreen → cannot save.
**Prevention:**
- Replace **all** `h-screen` / `100vh` in `src/components/projects/wallecx/` with `100dvh` (dynamic viewport) where available, with `100svh` fallback ladder, e.g. `height: 100dvh; height: 100svh;` or Tailwind v4's `h-dvh` / `h-svh` arbitrary classes.
- `100dvh` is supported in iOS Safari 15.4+ and Chrome 108+ (both well below current iOS Safari ~17–18 and Chromium ~120+).
- Audit pass before milestone close: `grep -rn "100vh\|h-screen" src/components/projects/wallecx/` must return 0 (or every hit annotated as intentional).
**Detection:** Open scan overlay on iPhone with URL bar visible; the close icon is below the URL bar.
**Owner phase:** Layout & touch-target audit phase.

**Confidence:** HIGH — `dvh`/`svh`/`lvh` shipped in Safari 15.4 (March 2022) and Chrome 108 (Nov 2022); current iOS Safari ≥17 and Chrome ≥120 in v4.3 test viewports support both.

---

### Pitfall C-5: iOS auto-zoom on form focus because input font-size < 16px

**Category:** Forms & dialogs on small screens
**What goes wrong:** iOS Safari auto-zooms the viewport when an input/select/textarea with `font-size < 16px` receives focus. The page then never zooms back, leaving labels and the Save button misaligned or offscreen. Grep against the current ManageExpense.vue shows `class="text-sm"` on labels and surrounding spans (Tailwind v4 `text-sm = 0.875rem = 14px`). **The actual `<InputText>` / `<InputNumber>` / `<DatePicker>` / `<Select>` / `<MultiSelect>` / `<Textarea>` font-size is inherited from PrimeVue's Aura preset** — verify per-component before assuming. But any mobile pass that adds `text-sm` to the actual input element (not just the label) is a trap.
**Why it happens:** `text-sm` looks right on desktop, the iOS zoom only triggers on focus on real device, and DevTools mobile emulator does NOT reproduce auto-zoom.
**Consequences:** Forms feel broken on every iPhone; users cannot easily see the field they're typing into. Affects all four CRUD dialogs (ManageVaccination, ManageMembership, ManageExpense, ManageBudget).
**Prevention:**
- Add a scoped CSS guard at `WallecxApp.vue` shell level: `@media (max-width: 640px) { .p-inputtext, .p-inputnumber-input, .p-textarea, .p-select-label, .p-multiselect-label, .p-datepicker-input { font-size: 16px !important; } }`. The `!important` is justified — it must beat any inherited `text-sm`.
- Lint/grep rule before milestone close: `grep -rn "text-xs\|text-sm" src/components/projects/wallecx/Manage*.vue` — every match on an input element must be replaced or overridden.
- Alternative belt-and-suspenders: `<meta name="viewport" content="... user-scalable=no">` is **NOT acceptable** (a11y regression — users cannot zoom). Use font-size, not viewport lockdown.
- REQUIREMENTS.md non-functional: **NFR-IOS-NO-ZOOM — All form inputs in v4.3 must render at ≥16px on mobile viewports to prevent iOS auto-zoom-on-focus.**
**Detection:** Open ManageExpense on iPhone, tap Amount field, page zooms in and never zooms back. Verify on real device — DevTools emulator does not reproduce this.
**Owner phase:** Forms & dialogs on small screens phase.

**Confidence:** HIGH — documented WebKit behavior since iOS 4; survives in iOS 18.

---

### Pitfall C-6: Workbox `maximumFileSizeToCacheInBytes: 3 MiB` silently skips bigger files

**Category:** PWA install + standalone + mobile performance
**What goes wrong:** v2.1 locked `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` in `vite.config.ts` to accommodate the 2.57 MiB vendor bundle. If v4.3 adds a chart enhancement, a list virtualization library, or a new PrimeVue auto-imported component that pushes any single chunk over 3 MiB, **Workbox silently skips precaching it** — the chunk is missing offline, the app shell breaks in standalone mode after first launch with intermittent ChunkLoadError on subsequent visits.
**Why it happens:** Workbox logs a warning during build (`Skipping precaching of "<path>" because it exceeds maximumFileSizeToCacheInBytes`), but the warning is buried in `npm run build` output and the build SUCCEEDS. PWA still installs. The failure mode is days later when a user is offline.
**Consequences:** Standalone PWA broken offline for any user who installed before the deploy and has no network during a session that needs the over-3-MiB chunk. v2.1 D-09 invariant violated.
**Prevention:**
- Add a build-time assertion in CI / `npm run build` that the largest chunk in `dist/assets` does not exceed `3 * 1024 * 1024 - safety_margin (e.g. 200 KiB)`.
- Build log scan: `npm run build 2>&1 | grep -i "exceeds\|skipping"` must produce 0 matches in v4.3.
- Mobile performance phase: budget the bundle BEFORE adding anything new. If a new lib pushes a chunk close to 3 MiB, split it or lazy-load it via dynamic import; do NOT raise the cap (the higher the cap, the slower the first PWA install on cellular).
- REQUIREMENTS.md non-functional: **NFR-PWA-PRECACHE-FITS — all chunks listed in `dist/manifest.json` must fit under the configured precache cap; build must verify.**
**Detection:** `dist/assets/*.js` file size > 3 MiB; build warning about precache skip; offline standalone test shows ChunkLoadError.
**Owner phase:** Mobile performance phase.

**Confidence:** HIGH — verified in Workbox 7.x docs; same root cause as v2.1 D-09's reason for the 3 MiB cap.

---

### Pitfall C-7: PocketBase `getList()` (with totalItems) regression introduced by mobile pagination

**Category:** Project-specific + mobile performance
**What goes wrong:** Mobile performance phase decides "the expenses list has 300 rows, let's paginate" and switches a call from `getFullList()` to `getList(page, perPage)`. On the v0.29.x PocketBase instance with `@request.auth.id != "" && user = @request.auth.id`-shaped listRules (all five `wallecx_*` collections), the totalItems COUNT path returns **400 Something went wrong** (D-31-B in STATE.md).
**Why it happens:** Pagination is the textbook answer to "list is big on mobile"; reviewers who didn't ship v4.2 won't know D-31-B exists.
**Consequences:** Expenses tab broken on mobile. Same toast as BUG-02. Visible in production.
**Prevention:**
- Pin D-31-B in REQUIREMENTS.md as a constraint: **CON-PB-COUNT-BUG — `getList()` without `skipTotal: true` is broken on `wallecx_*` collections in PB v0.29.x. Use `getFullList()` (default) or `getList(p, pp, { skipTotal: true })`. Never read `totalItems` from these collections.**
- Code-review rule: any new `getList(` call against `wallecx_*` must include `{ skipTotal: true }` OR be rejected.
- Prefer client-side virtualization (vue-virtual-scroller, @tanstack/virtual) over server-side pagination for v4.3 — keeps the single-`getFullList`-per-mount invariant intact.
**Detection:** 400 response in Network panel against `/api/collections/wallecx_*/records` with `page=1&perPage=N`.
**Owner phase:** Mobile performance phase (list virtualization).

---

### Pitfall C-8: PWA manifest `start_url` mismatch breaks installed PWA

**Category:** PWA install + standalone polish
**What goes wrong:** Current `start_url: "/projects/wallecx"` with `scope: "/"` is correct. If v4.3 changes `scope` to `/projects/wallecx` (looks "more scoped"), navigation to `/projects/wallecx/expenses-sub-route` (if one were ever added) or to `/login` after auth expiry breaks — the PWA window cannot navigate out of scope and either opens an external browser or shows a blank screen.
**Why it happens:** "Scope to the mini-app" looks correct in PWA tutorials.
**Consequences:** Installed PWA loses login redirect, loses cross-route nav.
**Prevention:** STATE.md already locks `scope: '/'`. Re-affirm in v4.3 REQUIREMENTS.md.
- REQUIREMENTS.md: **CON-PWA-SCOPE — `scope: '/'` is mandatory and must not be narrowed.**
**Detection:** Auth expires in standalone PWA → redirect to `/login` opens external browser tab.
**Owner phase:** PWA polish phase.

---

## Moderate Pitfalls

Defects that ship intermittently or are easy to QA-catch but require rework.

### Pitfall M-1: `env(safe-area-inset-*)` ignored on `position: fixed` without `viewport-fit=cover`

**Category:** Mobile layout / PWA standalone
**What goes wrong:** Sticky action bars, the install banner, and bottom-anchored Drawers use `padding-bottom: env(safe-area-inset-bottom)`. On iOS in standalone mode, the inset is only non-zero when the meta tag includes `viewport-fit=cover`. Current `index.html` has it (`viewport-fit=cover, interactive-widget=resizes-content`) — good. But if a phase strips/rewrites that meta during a mobile polish pass, all safe-area math becomes zero and content sits under the home-indicator bar.
**Why it happens:** Easy to miss in meta-tag refactors.
**Prevention:**
- Lock the viewport meta in `index.html` with an inline comment: `<!-- viewport-fit=cover REQUIRED for env(safe-area-inset-*) to be non-zero -->`.
- v4.3 UAT: home-indicator visible distance below buttons in standalone mode on iPhone with notch / dynamic island.
- REQUIREMENTS.md: **CON-VIEWPORT-FIT — index.html viewport meta must include `viewport-fit=cover`.**

**Confidence:** HIGH — Apple Human Interface Guidelines + WebKit blog 2017.

---

### Pitfall M-2: `interactive-widget=resizes-content` Android keyboard behavior surprises

**Category:** Forms & dialogs on small screens
**What goes wrong:** Current meta tag includes `interactive-widget=resizes-content` (Chromium 108+). Android Chrome on form focus now **resizes the layout viewport** rather than overlaying the virtual keyboard. A `position: fixed` sticky action bar implemented assuming overlay behavior will now jump up into the visual region above the keyboard (correct, intended) — but a Drawer bottom-sheet with a fixed-height inner scroll container can collapse to 0 height because the parent viewport shrank.
**Why it happens:** Drawer height set via `100dvh` minus a fixed handle, no `min-height` floor.
**Prevention:**
- Bottom-sheet Drawer pattern: use `max-height: 90dvh; min-height: 320px; height: auto;` not a fixed `height`.
- Test: open ManageExpense on Drawer (mobile), tap Description field, keyboard opens → Save button must remain visible above keyboard, Drawer body must remain scrollable.

**Confidence:** MEDIUM — `interactive-widget` is Chromium-only; iOS Safari uses the legacy overlay model. Behavior diverges across platforms; test both.

---

### Pitfall M-3: PrimeVue Drawer `position="bottom"` swipe-to-close conflict with internal scroll

**Category:** Forms & dialogs / Mobile layout
**What goes wrong:** PrimeVue 4 Drawer with `position="bottom"` accepts swipe-down-on-handle to dismiss. If ManageExpense's Drawer body contains a scrollable form, a downward swipe inside the form sometimes dismisses the Drawer when the form is already scrolled to top — destroying unsaved input.
**Why it happens:** Drawer swipe handler doesn't always check scroll-at-top before dismissing.
**Prevention:**
- Pattern: when `position="bottom"` on a Drawer with a form inside, set `:modal="true"` and `:dismissable-mask="false"` AND ensure the Drawer handle is the only swipe-dismiss target (verify in PrimeVue 4 source). If swipe-down dismissal cannot be restricted to the handle, override `@hide` with a confirmation dialog (`useConfirm`) when the form is dirty.
- v4.3 UAT scenario: open ManageExpense (mobile), type into a field, swipe down on Drawer body → must NOT lose input.
- REQUIREMENTS.md: **NFR-DRAWER-DIRTY-GUARD — Mobile Drawer dismissal must not silently destroy unsaved CRUD form state.**

**Confidence:** MEDIUM — verify against PrimeVue 4 Drawer docs and source before phase planning.

---

### Pitfall M-4: PrimeVue MultiSelect chips overflow horizontally on narrow viewports

**Category:** Forms & dialogs / Mobile layout
**What goes wrong:** ExpensesListView's category MultiSelect uses chip display. With 5+ categories selected on a 360px viewport, chips overflow the trigger button horizontally → horizontal scroll appears at page level. Hits Wallecx "no horizontal scroll" rule.
**Why it happens:** PrimeVue MultiSelect chip default behavior.
**Prevention:**
- Use `:max-selected-labels="2"` + `selectedItemsLabel="{0} categories"` to cap chip render.
- OR set `display="comma"` on mobile via responsive prop.
- Scoped CSS guard: `.p-multiselect-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }` inside `@media (max-width: 640px)`.

**Confidence:** HIGH — PrimeVue 4 docs.

---

### Pitfall M-5: PrimeVue DatePicker mobile UX — calendar overflow + touch targets

**Category:** Forms & dialogs
**What goes wrong:** PrimeVue 4 DatePicker (used in ExpensesToolbar From/To range, ManageExpense date field, ExpensesReportsView Custom range) renders a calendar overlay. On 360px viewport, the calendar can clip outside the visible area. Day cells default to ~28–32px height — below the 44px touch-target line.
**Why it happens:** PrimeVue calendar sizing is desktop-optimized; mobile overlays touch a tiny day grid.
**Prevention:**
- Use `:touchUI="true"` prop on DatePicker for mobile (`isMobile` computed via `useWindowSize`), which renders a centered modal dialog with larger day cells (similar to native date picker).
- OR scope a CSS override: `@media (max-width: 640px) { .p-datepicker-day-cell { min-width: 44px; min-height: 44px; } }`.
- v4.3 UAT: tap a date cell on 360px viewport — adjacent cells must not register accidental taps.

**Confidence:** HIGH — `touchUI` is a documented PrimeVue 4 Calendar/DatePicker prop.

---

### Pitfall M-6: `useWindowSize` race on initial render → flash of wrong layout

**Category:** Mobile layout
**What goes wrong:** `const { width } = useWindowSize(); const isMobile = computed(() => width.value < 640);` — on first render, `width.value` may briefly be `0` (or the previous reactive value from a different route) before the `resize` listener fires. A Drawer that conditionally chooses `position="bottom"` vs `position="right"` based on `isMobile` can render in the wrong position for one frame, causing visible flicker.
**Why it happens:** `useWindowSize` is reactive but the initial sync is `nextTick`-bound.
**Prevention:**
- Initialize: `const { width } = useWindowSize({ initialWidth: window.innerWidth });` — pass `initialWidth` so the first computed read is correct.
- For SSR safety (not applicable to this SPA but good hygiene): guard with `typeof window !== 'undefined'`.

**Confidence:** HIGH — `@vueuse/core` `useWindowSize` docs.

---

### Pitfall M-7: PrimeVue Tabs `scrollable` on narrow viewport — tab labels truncate vs scroll

**Category:** Mobile layout
**What goes wrong:** WallecxApp.vue uses PrimeVue Tabs for Vaccinations / Memberships / Expenses. ExpensesReportsView uses PrimeVue Tabs (scrollable) for Month / Quarter / Year / Custom (locked v4.0 decision). On 320px viewports, three top-level tabs fit but the inner period tabs scroll. The scroll indicator (left/right chevron) is often invisible on touch devices — users don't know they can scroll.
**Why it happens:** PrimeVue 4 Tabs scrollable mode shows chevrons on hover (desktop) but they're easy to miss on touch.
**Prevention:**
- Add an explicit fade-mask on the right edge of the period selector so users see "more content offscreen".
- OR force the period selector to wrap to a 2x2 grid on narrow viewports.
- v4.3 UAT: 320px viewport — Custom period tab must be discoverable (not silently offscreen).

**Confidence:** MEDIUM — PrimeVue 4 Tabs docs.

---

### Pitfall M-8: iOS install banner ineligibility AFTER first dismissal

**Category:** PWA install
**What goes wrong:** iOS does NOT support `BeforeInstallPromptEvent`. Wallecx's `PwaInstallBanner.vue` (already exists) likely shows a manual "Tap Share → Add to Home Screen" hint on iOS. If v4.3 polish makes the banner more aggressive (showing again on every visit), users get banner fatigue → train themselves to dismiss it without reading.
**Why it happens:** iOS has no install API; the banner is purely instructional.
**Prevention:**
- Track dismissal in `localStorage` (`wallecx:pwa-install-dismissed: 'YYYY-MM-DD'`).
- Show again only after N days (suggest 30) OR if the user explicitly visits a "How to install" link.
- Detect already-installed via `window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true` → suppress banner entirely.
- REQUIREMENTS.md: **NFR-PWA-BANNER-FREQUENCY — Install banner must not show in standalone mode, and must respect a localStorage-based dismissal record.**

**Confidence:** HIGH — `window.navigator.standalone` is iOS-specific; `display-mode: standalone` is cross-platform.

---

### Pitfall M-9: `BeforeInstallPromptEvent.prompt()` may only be called once per event

**Category:** PWA install (Chromium / Android)
**What goes wrong:** A common bug: store the event globally and call `prompt()` from multiple components. Chromium fires the event once per page load — a stored reference can be called only once. A second call rejects.
**Why it happens:** Spec contract not obvious; banner refactors may add a second entry point ("install" link in user menu + banner button).
**Prevention:**
- Single owner of the event: `PwaInstallBanner.vue` or a Pinia store. After `prompt()` resolves, null out the stored event.
- Don't show the install affordance after the event was consumed once in this session.

**Confidence:** HIGH — `BeforeInstallPromptEvent` Chromium contract.

---

### Pitfall M-10: navigator.storage.persist() not granted → 7-day localStorage eviction

**Category:** PWA install + standalone + project-specific
**What goes wrong:** v2.1 calls `navigator.storage.persist()` on WallecxApp mount. The browser MAY return `false` (especially on iOS, where heuristics are stricter). If false, iOS evicts localStorage (including PocketBase auth token) after 7 days of inactivity → user thinks they were logged out for no reason.
**Why it happens:** persist() is a request, not a guarantee.
**Prevention:**
- Log the persist() result during v4.3 mobile testing (`console.info('persistGranted=', granted)`). If consistently `false` on iOS test devices, add a daily "ping" to PocketBase from a service worker `periodicSync` (where supported) to keep the origin "active".
- Alternatively, mitigate UX: when auth expires, show a clear "You were logged out due to inactivity (iOS storage policy)" toast instead of generic "Session expired".
- Add a clear copy line in the install banner: "Pin Wallecx to your home screen to avoid being logged out after 7 days of inactivity."
- REQUIREMENTS.md: **NFR-IOS-EVICTION-UX — Login-required redirect after iOS storage eviction must surface a copy explaining why (not just "session expired").**

**Confidence:** MEDIUM — iOS storage eviction is well-documented (ITP / 7-day rule); persist() success rate on iOS is anecdotally low.

---

### Pitfall M-11: Apple splash screens / touch icons missing per-device variants

**Category:** PWA install + standalone polish
**What goes wrong:** iOS requires per-device-resolution splash screens (`<link rel="apple-touch-startup-image" media="..." href="...">`) for a custom standalone splash. Without them, iOS shows a white screen + the apple-touch-icon centered → "blank flash" between tap-icon and app-loaded.
**Why it happens:** Multi-device variants are tedious; easy to ship one icon and call it done.
**Prevention:**
- Use `@vite-pwa/assets-generator` (already a devDep) to generate per-device splash and touch icons. Refer to its docs for the full media-query list.
- Verify in v4.3 UAT: install on iPhone, force-quit, re-open → splash should be branded, not white.
- REQUIREMENTS.md: **NFR-IOS-SPLASH — Apple touch startup images must be defined for all v4.3 test viewports (390x844, 360x780, 768x1024).**

**Confidence:** HIGH — Apple developer docs + @vite-pwa/assets-generator docs.

---

### Pitfall M-12: Theme color mismatch between manifest and `<meta name="theme-color">`

**Category:** PWA install + standalone polish
**What goes wrong:** Manifest `theme_color: "#002244"` (navy). `index.html` does NOT currently have a `<meta name="theme-color">` — Chromium falls back to manifest, but iOS Safari (and the iOS PWA chrome bar) reads ONLY the meta tag. Without it, the iOS PWA status bar tints to white/default — looks unbranded against the navy app.
**Why it happens:** Easy to assume manifest is enough.
**Prevention:**
- Add to `index.html`: `<meta name="theme-color" content="#002244" media="(prefers-color-scheme: light)">` AND `<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">` (or whatever the dark surface token resolves to).
- Verify on iPhone standalone install: status bar matches app chrome in both themes.

**Confidence:** HIGH — Apple developer docs + Chromium documentation.

---

### Pitfall M-13: card_color contract regression via mobile color-picker polish

**Category:** Project-specific
**What goes wrong:** A mobile-polish phase touches `ManageMembership.vue`'s ColorPicker affordance (e.g. swapping to a native `<input type="color">` for better mobile UX). Native color picker emits `#RRGGBB` **with** the leading `#`. Storing it directly violates the locked invariant `card_color stored without # prefix`. MembershipCard renders broken backgrounds.
**Why it happens:** Native color picker UX is genuinely better on mobile; the temptation is real.
**Prevention:**
- If swapping to native: strip `#` on save (`card_color = newValue.replace(/^#/, '')`); prepend `#` on read for the native input's value binding.
- Vitest spec: `membershipMapper.spec.ts` already locks the contract — re-run + extend if ColorPicker swaps.
- REQUIREMENTS.md: **CON-CARD-COLOR-NO-HASH — `card_color` is stored without `#` prefix. Any UI swap must preserve this contract.**

**Confidence:** HIGH — STATE.md locked invariant.

---

### Pitfall M-14: useConfirm broadcast scope — ConfirmDialog duplicated on mobile

**Category:** Project-specific
**What goes wrong:** A mobile-polish phase notices the ConfirmDialog renders centered in viewport and "fixes" it by adding a second `<ConfirmDialog />` inside ExpensesListView with mobile-specific positioning. `useConfirm` broadcasts to **all** mounted ConfirmDialog instances → confirmation fires twice; click "Confirm" once, two delete requests fire; second one returns 404 with confusing toast.
**Why it happens:** STATE.md locked the single-shell-level instance invariant for exactly this reason in v2.0.
**Prevention:**
- REQUIREMENTS.md: **CON-CONFIRMDIALOG-SINGLETON — Exactly one `<ConfirmDialog />` mounts at WallecxApp.vue shell level. Any mobile-positioning need must be solved via CSS targeting `.p-confirmdialog`, not by mounting a second instance.**
- Grep guard: `grep -rn "<ConfirmDialog" src/components/projects/wallecx/` must return exactly 1 line.

**Confidence:** HIGH — STATE.md locked invariant + PrimeVue 4 `useConfirm` source.

---

### Pitfall M-15: PrimeVue Dialog/Drawer z-index collision with PWA install banner

**Category:** Mobile layout
**What goes wrong:** PwaInstallBanner.vue is `position: fixed; bottom: 0; z-index: ?`. If banner z-index is higher than the PrimeVue overlay layer, a dialog opens with the banner still showing — banner partially covers Save/Cancel buttons. If lower, the install banner is hidden behind dialog backdrop forever.
**Why it happens:** PrimeVue 4 manages its own z-index layer (typically 1100+); custom fixed elements need careful coordination.
**Prevention:**
- Read PrimeVue 4's default overlay z-index from the Aura preset (or `useZIndex` if exposed).
- Hide the install banner while ANY PrimeVue overlay is open: use a Pinia flag `useOverlayStore` toggled by Dialog/Drawer/Confirm `@show` / `@hide`.
- OR: install banner z-index = 900 (below PrimeVue overlay), AND auto-dismiss on first Dialog open.

**Confidence:** MEDIUM — depends on PrimeVue 4 Aura preset z-index values; verify before phase planning.

---

### Pitfall M-16: List virtualization breaks sessionStorage scroll-restore + sort persistence

**Category:** Mobile performance / project-specific
**What goes wrong:** Phase 25 D-09 locked: "sessionStorage sort restoration runs BEFORE getFullList in onMounted". If mobile-perf phase wraps ExpensesListView in `vue-virtual-scroller` or similar, the virtual scroller's lazy item mount can fire `intersection` events that re-trigger derived computeds — including sort persistence — out of order. Result: sort mode "blinks" on mount.
**Why it happens:** Virtual scrollers mount items asynchronously as they scroll into view.
**Prevention:**
- Sort/filter logic must operate on the FULL `expenses` array, BEFORE virtualization. Pass the sorted array to the virtual scroller as the data source — the scroller only handles render windowing.
- Reproduce the v4.0 Phase 25 v-if chain (isLoading → raw empty → filtered empty → list) inside the virtualized component.

**Confidence:** MEDIUM — depends on virtualization lib chosen.

---

### Pitfall M-17: Chart.js bundle inflation via accidental full-import

**Category:** Mobile performance
**What goes wrong:** PrimeVue 4 Chart dynamically imports `chart.js/auto`. v4.0 confirmed chart.js is a runtime dep. If v4.3 adds a chart plugin (e.g. `chartjs-plugin-annotation` for budget threshold lines) by importing it at module top, the entire chart.js controllers/elements/scales registry inflates the chart bundle. On mobile cellular, the Reports tab visibly stalls.
**Why it happens:** Chart.js tree-shaking requires explicit registration (`Chart.register(...)`), but `chart.js/auto` already auto-registers everything — adding a plugin compounds it.
**Prevention:**
- Lazy-import chart plugins inside the same dynamic import as chart.js: `const { default: annotation } = await import('chartjs-plugin-annotation');`.
- Measure: `npm run build` and check the size of the chart-containing chunk before and after; budget < 200 KiB gzipped delta.
- If a plugin is heavy, defer it to a hover-only / drilldown affordance.

**Confidence:** HIGH — chart.js v4 + PrimeVue 4 Chart docs.

---

### Pitfall M-18: browser-image-compression heavy on mobile main thread

**Category:** Mobile performance
**What goes wrong:** `browser-image-compression@^2.0.2` runs in a Web Worker by default, but if the worker file path is wrong (e.g. Vite asset hashing changes the worker URL), it falls back to running on the main thread. On a low-end Android (Snapdragon 6xx) compressing a 12 MP receipt photo can lock the UI for 5–10s.
**Why it happens:** Vite's worker handling can drop the worker URL on certain build configs.
**Prevention:**
- Verify in dev: `browser-image-compression` debug log shows "useWebWorker: true" actually using a worker.
- Add a loading state in ManageExpense / ManageMembership / ManageVaccination receipt upload that shows "Compressing image…" with a spinner. User waits with feedback instead of perceiving freeze.
- Set `maxIteration: 5` (default 10) for mobile to bound worst-case time.

**Confidence:** MEDIUM — depends on Vite worker config nuances.

---

### Pitfall M-19: `getFullList()` on growing collections — when does it hurt?

**Category:** Mobile performance
**What goes wrong:** All five `wallecx_*` collections use `getFullList()` (per requestKey invariant). At 100 records, fine. At 1000 expenses, the response is ~1–3 MB JSON over cellular → 5–15s load.
**Why it happens:** Per-user data grows over months; no rotation strategy.
**Prevention:**
- Establish a v4.3 measurement: log payload size + duration of each `getFullList` on real-device cellular. If any collection exceeds ~500 records or ~500 KiB, mark in a "future candidates" issue (e.g. "EXP-ADV-09 expense archival / windowed fetch").
- v4.3 itself should NOT add pagination (see C-7); instead, document the threshold for when pagination becomes worth the v0.29.x bug workaround.
- REQUIREMENTS.md: **NFR-PERF-MEASURE — v4.3 must log a one-time payload-size + duration measurement per Wallecx collection on a mid-tier mobile device under cellular conditions, recorded in MILESTONES.md.**

**Confidence:** HIGH — basic network math.

---

### Pitfall M-20: PrimeVue auto-import resolver pulls in unused components

**Category:** Mobile performance
**What goes wrong:** `unplugin-vue-components` + `PrimeVueResolver` inlines components by name match. If a mobile-polish phase types `<Knob />` somewhere as a placeholder and never removes it, the entire Knob component + dependencies ship in the bundle.
**Why it happens:** Auto-import is invisible — no `import` statement to grep.
**Prevention:**
- `npm run build` and check `dist/assets/primevue-*.js` size before and after each v4.3 phase. Budget zero regression.
- Periodic audit: search for `<\\b[A-Z][a-zA-Z]+` in Wallecx templates and cross-check against an allowlist of intentionally used PrimeVue components.

**Confidence:** HIGH — `unplugin-vue-components` docs.

---

### Pitfall M-21: dayjs locale / plugin double-load

**Category:** Mobile performance
**What goes wrong:** v4.0 Phase 26-01 confirmed: `period.ts` extends `quarterOfYear` at module top. If a v4.3 phase adds another plugin (e.g. `duration`, `relativeTime` for "2 hours ago") at a different module, both modules call `dayjs.extend(plugin)`. Extension is idempotent so no functional bug — but `import 'dayjs/plugin/relativeTime'` from N modules can fragment the dayjs chunk in unhelpful ways.
**Why it happens:** Tree-shaking dayjs plugins is fiddly.
**Prevention:**
- Centralize all dayjs plugin extensions in ONE module (`src/lib/wallecx/dayjs-setup.ts`) imported once from `main.ts` (or from `WallecxApp.vue`).
- v4.3 should not add new dayjs plugins unless strictly needed.

**Confidence:** MEDIUM — dayjs plugin tree-shaking behavior is documented.

---

## Minor Pitfalls

Polish issues; catch in a final UAT pass.

### Pitfall N-1: PrimeVue FileUpload mobile capture attribute

**Category:** Forms & dialogs
**What goes wrong:** PrimeVue FileUpload accepts `accept="image/*"`. On mobile, this opens both camera AND gallery in the OS picker. To force camera (for receipt capture), pass `capture="environment"` (or `"user"` for selfies). Without it, users have to navigate two more taps.
**Prevention:** Add `:pt="{ input: { capture: 'environment' } }"` (or equivalent passthrough) on receipt/scan upload affordances. Verify the PrimeVue 4 passthrough syntax.
**Confidence:** HIGH — HTML5 capture attribute, MDN.

### Pitfall N-2: 300ms tap delay — non-issue in 2026

**Category:** Forms & dialogs
**What's true:** 300ms tap delay is solved on all current iOS Safari and Android Chrome when viewport meta has `width=device-width` (which Wallecx does). No need to add `touch-action: manipulation` for this purpose.
**Prevention:** Don't waste a phase on tap delay; it's a non-issue. Confirm by checking that the viewport meta has `width=device-width` (it does).
**Confidence:** HIGH — well-established since 2016 across iOS Safari and Chromium.

### Pitfall N-3: PrimeVue Dialog already traps focus and scroll

**Category:** Forms & dialogs
**What's true:** PrimeVue 4 Dialog / Drawer trap focus by default (`:modal="true"`) and prevent body scroll. No manual scroll-trapping needed. Re-implementing it is a waste of a phase.
**Prevention:** Trust PrimeVue's overlay focus management; verify with a screen-reader UAT pass.
**Confidence:** HIGH — PrimeVue 4 docs + ARIA dialog pattern.

### Pitfall N-4: PrimeVue Tabs reactive `activeTab` string vs index

**Category:** Mobile layout
**What goes wrong:** A mobile polish phase swaps PrimeVue Tabs from string-typed `activeTab` to index-typed and breaks the deep-link / hash-based tab switching (not currently used but might be added).
**Prevention:** STATE.md already locks "PrimeVue Tabs with string-typed `activeTab`". Re-affirm if the phase touches Tabs internals.
**Confidence:** HIGH — STATE.md locked invariant.

### Pitfall N-5: Wake Lock API still requires HTTPS and user gesture

**Category:** Project-specific (scan overlay)
**What's true:** Wake Lock (used in v2.0 scan overlay) requires HTTPS (Vercel ✓) and a user gesture (the tap that opens the overlay). v4.3 mobile polish must not move the wake-lock acquisition outside the user-gesture handler (e.g. into onMounted of a re-architected overlay).
**Prevention:** Acquire wake lock inside the click handler that opens the overlay, not in lifecycle hooks.
**Confidence:** HIGH — Wake Lock API spec.

### Pitfall N-6: `prefers-reduced-motion` already respected in chart — preserve

**Category:** Mobile layout
**What's true:** v4.0 Phase 26-01 D-04: chart honors prefers-reduced-motion (duration: 0). Mobile polish that adds new animations (e.g. drawer slide-in, list-item fade-in) must respect the same media query.
**Prevention:** Wrap any new motion in `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`.
**Confidence:** HIGH — MDN.

### Pitfall N-7: iOS file-input camera capture inconsistent in standalone PWA

**Category:** PWA install + standalone
**What goes wrong:** In iOS standalone PWAs, `<input type="file" accept="image/*" capture="environment">` historically opens camera less reliably than in Safari tab (iOS 16: camera works; iOS 17.x: regression in some builds; iOS 18: largely restored). The result is the photo picker opens instead of camera, on a phase that needed the camera (receipt upload).
**Prevention:** Don't depend on `capture` working in standalone; offer a "Take photo" affordance AND a "Choose from gallery" affordance separately. v4.3 UAT scenario: receipt upload in installed PWA on iOS 17+.
**Confidence:** MEDIUM — WebKit bug history.

---

## Phase-Specific Warning Matrix

| v4.3 Phase Topic | Likely Pitfalls (IDs) | Mitigation Owner |
|---|---|---|
| Mobile layout & touch-target audit (3 tabs) | C-2 (BR-2), C-4 (100vh), M-1 (safe-area), M-4 (MultiSelect chips), M-5 (DatePicker touch), M-6 (useWindowSize race), M-7 (Tabs scroll), N-4 (Tabs string activeTab) | Layout phase verifies BR-2 + locked invariants intact |
| Mobile performance (bundle, lazy-load, virtualization) | C-3 (requestKey dup), C-6 (3 MiB precache), C-7 (PB count bug), M-16 (virt + sort), M-17 (chart plugins), M-18 (image-compression worker), M-19 (getFullList scale), M-20 (auto-import), M-21 (dayjs) | Perf phase publishes bundle-size diff + payload-size measurement |
| Forms & dialogs on small screens | C-5 (16px), M-2 (Android keyboard), M-3 (Drawer swipe), M-4 (MultiSelect), M-5 (DatePicker), M-15 (z-index), N-1 (capture), N-3 (focus trap) | Forms phase verifies dirty-state guard on all 4 Manage* dialogs |
| PWA install + standalone polish | C-1 (registerType), C-6 (precache cap), C-8 (scope), M-1 (viewport-fit), M-8 (banner fatigue), M-9 (prompt once), M-10 (eviction), M-11 (splash), M-12 (theme-color), N-7 (capture standalone) | PWA phase verifies all locked PWA invariants intact + 4 viewports installed |
| Project-specific (cross-phase) | C-1 (registerType), C-2 (BR-2), C-3 (requestKey), C-7 (PB count), M-13 (card_color), M-14 (ConfirmDialog), N-4 (Tabs), N-5 (Wake Lock) | Every phase must re-affirm intersecting invariants |

---

## REQUIREMENTS.md Candidate Non-Functional / Invariant Requirements

These are the pitfalls worth surfacing as explicit REQ-IDs so they bind every phase, not just the phase that introduces them. (Roadmapper: convert each into a `NFR-*` or `CON-*` entry; phrasing is already in REQ-ready form above.)

| Candidate REQ-ID | Pitfall | Type | Where verified |
|---|---|---|---|
| `NFR-PWA-AUTOUPDATE` | C-1 | non-functional | PWA phase + every PR touching vite.config.ts |
| `NFR-BR-2-PRESERVED` | C-2 | invariant | Layout phase + PWA phase + milestone UAT |
| `NFR-REQUESTKEY-UNIQUE` | C-3 | invariant | Perf phase + any new mobile interaction phase |
| `NFR-DVH-NOT-VH` | C-4 | non-functional | Layout phase |
| `NFR-IOS-NO-ZOOM` | C-5 | non-functional | Forms phase |
| `NFR-PWA-PRECACHE-FITS` | C-6 | non-functional | Perf phase + build CI |
| `CON-PB-COUNT-BUG` | C-7 | constraint | Perf phase |
| `CON-PWA-SCOPE` | C-8 | constraint | PWA phase |
| `CON-VIEWPORT-FIT` | M-1 | constraint | Layout phase |
| `NFR-DRAWER-DIRTY-GUARD` | M-3 | non-functional | Forms phase |
| `NFR-PWA-BANNER-FREQUENCY` | M-8 | non-functional | PWA phase |
| `NFR-IOS-EVICTION-UX` | M-10 | non-functional | PWA phase |
| `NFR-IOS-SPLASH` | M-11 | non-functional | PWA phase |
| `CON-CARD-COLOR-NO-HASH` | M-13 | invariant | Forms phase (if ColorPicker touched) |
| `CON-CONFIRMDIALOG-SINGLETON` | M-14 | invariant | Every phase |
| `NFR-PERF-MEASURE` | M-19 | non-functional | Perf phase + milestone close |

---

## Sources

| Topic | Source | Confidence |
|---|---|---|
| `dvh` / `svh` / `lvh` units | MDN + CanIUse (Safari 15.4+, Chrome 108+) | HIGH |
| iOS auto-zoom on inputs <16px | WebKit / Apple developer docs | HIGH |
| `viewport-fit=cover` + `env(safe-area-inset-*)` | Apple Human Interface Guidelines, WebKit blog | HIGH |
| `interactive-widget=resizes-content` | Chromium docs (108+) | MEDIUM |
| Workbox `maximumFileSizeToCacheInBytes` | Workbox 7.x docs | HIGH |
| `BeforeInstallPromptEvent` single-use | Chrome platform docs | HIGH |
| iOS 7-day storage eviction | WebKit ITP / Storage Standard | MEDIUM |
| Apple touch startup images | Apple developer docs + @vite-pwa/assets-generator | HIGH |
| `<meta name="theme-color">` per color-scheme | Apple developer docs + MDN | HIGH |
| PrimeVue 4 Drawer / Dialog / DatePicker / MultiSelect / Tabs / FileUpload | PrimeVue 4 official docs | HIGH (verify versions before each phase) |
| PocketBase v0.29.x count-path bug | STATE.md D-31-B (verified during v4.2) | HIGH |
| `card_color` no-hash invariant | STATE.md (locked v2.0) | HIGH |
| BR-2 barcode invariant | STATE.md (locked v2.0, re-verified v4.1 Phase 30) | HIGH |
| Wake Lock API HTTPS + gesture | W3C Wake Lock spec | HIGH |
| `prefers-reduced-motion` | MDN, used in v4.0 Phase 26-01 | HIGH |
| `unplugin-vue-components` auto-import inflating bundles | unplugin-vue-components docs | HIGH |
| chart.js v4 + PrimeVue 4 Chart dynamic import | PrimeVue 4 Chart docs + chart.js v4 docs | HIGH |
| `browser-image-compression` worker behavior | npm pkg docs | MEDIUM |
| `useWindowSize` (`@vueuse/core`) initial-value race | @vueuse/core docs | HIGH |

---

*Researched 2026-05-26 for v4.3 Wallecx Mobile Optimization milestone. Codebase grep evidence: `text-sm` confirmed on ManageExpense.vue labels (C-5 trap directly in code); `useWindowSize` already imported in 5 Wallecx files (M-6 applies); 100vh/h-screen grep returned 0 in wallecx folder but exists elsewhere in src (audit pass needed). Next: Requirements step converts the candidate NFR/CON list into REQUIREMENTS.md REQ-IDs; Roadmapper assigns each NFR/CON to its owning phase.*
