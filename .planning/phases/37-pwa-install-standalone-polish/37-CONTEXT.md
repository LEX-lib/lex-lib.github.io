# Phase 37: PWA Install + Standalone Polish - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 37 makes Wallecx feel **native when installed** by closing the remaining iOS PWA polish gaps and shipping the Android install affordance whose event was captured in Phase 33:

- **PWA-01** — iOS standalone meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style="black-translucent"`, `apple-mobile-web-app-title="Wallecx"`) + per-color-scheme `<meta name="theme-color">` (light navy, dark token) in `index.html`
- **PWA-02** — `@vite-pwa/assets-generator` produces `apple-touch-startup-image` PNGs for the 3 v4.3 test viewports (390×844, 360×780, 768×1024), wired into `index.html` so installs show a branded splash, not a white flash
- **PWA-04** — `PwaInstallBanner.vue` extended with an Android branch that calls `installPromptEvent.prompt()` (the event captured at App.vue scope in Phase 33). iOS instructional branch coexists in the same component
- **PWA-06** — Existing SW-update toast in WallecxApp.vue gets safe-area-inset polish so "Refresh / Later" is fully tappable above iPhone home indicator + dynamic island in standalone mode
- **PWA-07** — Site-wide offline banner backed by `@vueuse/core` `useOnline`; auto-clears on reconnect (no retry button — see D-37-12 / docs reword)
- **PWA-09** — Manifest `shortcuts` array with 4 Quick Actions (Add Expense / Add Vaccination / Add Membership / Open Reports) that deep-link via `?action=…` query param

Plus NFR/CON owners: **NFR-PWA-AUTOUPDATE** (`registerType: 'prompt'` byte-intact), **NFR-PWA-BANNER-FREQUENCY** (30-day dismissal + standalone-suppression), **NFR-IOS-SPLASH** (splash for the 3 viewports), **NFR-IOS-EVICTION-UX** (eviction-aware copy), **CON-PWA-SCOPE** (`scope: '/'` byte-intact), **NFR-BR-2-PRESERVED** (any theme-color / standalone CSS does not regress BarcodeDisplay).

This is the **PWA polish phase** — safe-area wiring (Phase 34), sticky bars (Phase 35), and the reduced bundle (Phase 36) are all in place; Phase 37 makes the installed experience feel native-grade before Phase 38 UAT.

</domain>

<decisions>
## Implementation Decisions

### Banner branch logic (PWA-04)
- **D-37-01:** **Event presence + iOS UA combined.** Android branch shows when `useMobileEnv.installPromptEvent` is non-null. iOS branch shows when `isIosSafari() && !isStandalone && installPromptEvent === null`. The Android branch self-extinguishes when Chrome fires `appinstalled` (already handled in App.vue — clears the singleton). iOS still needs UA detection (iOS Safari never fires `beforeinstallprompt`).
- **D-37-02:** **One component, two branches.** A-43-5 ("PwaInstallBanner extended, not split") upheld. `PwaInstallBanner.vue` grows an `v-else-if installPromptEvent` branch; component stays at the same path. No new file.

### Android banner visual (PWA-04)
- **D-37-03:** **Same navy bar, swapped content.** Reuses the existing `position: fixed; bottom: 0` `#002244` bar with `paddingBottom: calc(env(safe-area-inset-bottom) + 0.75rem)`. Copy: **"Install Wallecx for faster access and home-screen shortcuts."** Right-aligned **"Install"** button (44×44 min touch target, light text on navy) that calls `installPromptEvent.prompt()`. Same `mdi:close` dismiss icon as iOS branch. Visual continuity — one design language.
- **D-37-04:** **Hide-banner on either prompt outcome, no toast.** After `installPromptEvent.prompt()` resolves: on `accepted` clear `installPromptEvent` (Chrome also fires `appinstalled` which already clears it via App.vue); on `dismissed` write the 30-day dismissal record AND clear `installPromptEvent` in the singleton so the banner hides for this session. M-9 honored: each captured event is used at most once — `.prompt()` is never called twice on the same event reference.

### Banner mount scope
- **D-37-05:** **`PwaInstallBanner.vue` stays mounted in `WallecxApp.vue` (line 125).** The install pitch is Wallecx-scoped — `start_url` is `/projects/wallecx`, so pitching install outside that route is off-topic. No relocation.

### 30-day dismissal record (NFR-PWA-BANNER-FREQUENCY)
- **D-37-06:** **JSON schema, single key.** Key remains `wallecx_pwa_banner_dismissed` (no rename). Value is `JSON.stringify({ dismissedAt: <ISO8601>, platform: 'ios' | 'android' })`. Re-show gate: `Date.now() - Date.parse(parsed.dismissedAt) >= 30 * 86_400_000`. Platform field is captured for future per-platform behavior but the gate is platform-agnostic (one record suppresses both branches).
- **D-37-07:** **Legacy `'true'` migrates lazily on first read.** On read, if value is the literal string `'true'` (Phase 14 schema), parse fails → overwrite with `{ dismissedAt: <now-ISO>, platform: <detected> }`. The 30-day clock starts NOW for existing dismissers — fair re-show in 30 days, no surprise immediate banner, no data loss.
- **D-37-08:** **Suppression: hard gates only.** `isStandalone === true` always suppresses (regardless of dismissal record); localStorage read failure (private browsing) silently suppresses (existing behavior). No session-timer, no auth re-check (route guard already enforces).

### Offline banner (PWA-07)
- **D-37-09:** **Persistent banner backed by `useOnline`.** `@vueuse/core` `useOnline` (already a direct dep since Phase 33) drives a fixed-position banner. Persistent — stays until reconnect. Matches the ROADMAP language of "clear offline banner".
- **D-37-10:** **Mount in `App.vue` (site-wide), top of viewport.** New component `OfflineBanner.vue` mounted in `App.vue` (offline awareness is site-wide, not Wallecx-only). Position fixed top, just under `CustomNavBar`, with `paddingTop: env(safe-area-inset-top)` so it sits below the iOS status bar safely. Color: status-warning tone (NOT navy) so it visually distinguishes itself from the bottom-anchored install banner. They can coexist on screen without collision (top vs bottom).
- **D-37-11:** **No retry button.** `useOnline` reactivity is itself the retry mechanism — when the browser fires `online`, the ref flips and the banner disappears. A button can't make the network return; pretending it can is dishonest. Banner copy: **"You're offline. Changes will resume when you reconnect."** Honest, zero-state.
- **D-37-12:** **ROADMAP / REQUIREMENTS PWA-07 + SC#4 reworded by the planner.** Both `.planning/ROADMAP.md` §"Phase 37" SC#4 and `.planning/REQUIREMENTS.md` PWA-07 currently say "retry affordance" — that wording predates the useOnline-driven design. Planner edits both: drop "retry affordance", replace with **"banner auto-clears when navigator goes back online (useOnline reactive)"**. Small docs edit landed inside one of Phase 37's plans (likely the offline-banner plan).

### Manifest shortcuts deep-link (PWA-09)
- **D-37-13:** **Single route + `?action=…` query param.** All 4 shortcuts target `/projects/wallecx?action={add-expense | add-vaccination | add-membership | open-reports}`. One auth guard path, no `src/router/index.ts` changes, `start_url` unchanged.
- **D-37-14:** **Dispatch via `pendingAction` ref in `WallecxApp.vue`.** On mount, WallecxApp reads `route.query.action`:
  1. Map action → `activeTab` (e.g. `add-expense` → `activeTab = 'expenses'`)
  2. Set a `pendingAction` ref. The relevant tab component watches `pendingAction` — ExpensesTab opens ManageExpense in create mode when `pendingAction === 'add-expense'`; `open-reports` toggles the expenses-tab sub-tab to reports.
  3. After dispatch, `router.replace({ query: {} })` clears the param so a re-mount or back-button doesn't re-trigger.
  Locked invariant respected: **NO new Pinia store** (STATE.md). Simple ref + watch only.
- **D-37-15:** **Manifest entries: `name + short_name + url + 96×96 icon` per shortcut.** Each entry in `vite.config.ts` manifest `shortcuts` array has its own 96×96 PNG generated by `@vite-pwa/assets-generator` (already locked for splash — extend its config). 4 new PNGs in `public/shortcuts/`. Android renders the icons on long-press.
- **D-37-16:** **Auth fallback preserves the action via the existing guard.** Existing `router.beforeEach` does `next({ name: 'login', query: { redirect: to.fullPath } })`. `to.fullPath` includes the `?action=…` segment, so after login the redirect resolves to `/projects/wallecx?action=add-expense` and the WallecxApp dispatch fires naturally. **Planner must add a unit test in `src/router/__tests__/guard.spec.ts`** asserting query-string preservation through the redirect (the existing test at line 35 references `name: 'wallecx'` but does not cover query preservation).

### Claude's Discretion

- **Dark-mode `theme-color` hex value.** Light is navy `#002244` (matches the manifest `theme_color`). Dark should match the app's dark-mode background token. Planner decides between reading the actual computed value of `--color-background` from `base.css` or hardcoding a hex that matches it. NFR-BR-2-PRESERVED still applies (no regression on BarcodeDisplay black-on-white).
- **`apple-touch-startup-image` splash background.** `@vite-pwa/assets-generator` background-color config — navy `#002244` (matches `background_color` in manifest) is the natural default; planner confirms during asset generation.
- **iOS eviction-aware auth-expired copy site.** Currently WallecxApp.vue line 60 fires a generic `toast.info("Your session has expired. Please sign in again.")`. NFR-IOS-EVICTION-UX wants iOS-specific copy ("iOS may have evicted local data after 7 days of inactivity — sign in again. Pinning Wallecx to your home screen helps preserve it.") **when** detection says iOS + (was-standalone OR is-iOS-Safari). Planner picks whether copy lives at the toast site, the login page's redirect-aware message, or both. Detector reuse: existing `isIosSafari()` in PwaInstallBanner.vue can be lifted into `useMobileEnv` or duplicated.
- **SW-update toast safe-area implementation (PWA-06).** vue-sonner toast options API — planner picks between `style: { paddingBottom: 'env(safe-area-inset-bottom)' }` on the toast call, a global Toaster prop in App.vue, or a CSS override targeting `[data-sonner-toaster]`. Whichever passes a "fully visible above home indicator + dynamic island" eyeball check on 390×844.
- **Splash + shortcut-icon visual content.** Designer-style call — assets-generator config (logo source path, padding) is open to the planner / research agent.

### Folded Todos
*None — `gsd-sdk query todo.match-phase 37` returned 0 matches.*

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 37: PWA Install + Standalone Polish" — goal, 7 success criteria, bound NFR/CON (NFR-PWA-AUTOUPDATE, CON-PWA-SCOPE, NFR-PWA-BANNER-FREQUENCY, NFR-IOS-EVICTION-UX, NFR-IOS-SPLASH, NFR-BR-2-PRESERVED). **SC#4 wording planned to change** per D-37-12.
- `.planning/REQUIREMENTS.md` — PWA-01, PWA-02, PWA-04, PWA-06, PWA-07, PWA-09 (functional); NFR/CON list (lines 51–80). **PWA-07 wording planned to change** per D-37-12.
- `.planning/STATE.md` §"Architectural Invariants" — `registerType: 'prompt'`, NetworkOnly /api/*, no new Pinia store, ConfirmDialog singleton.

### Phase 33 substrate (already in place — read before planning)
- `src/composables/useMobileEnv.ts` — `{ isMobile, isTablet, isStandalone, installPromptEvent, safeAreaInsets }` shape; module-singleton `installPromptEvent`; `setInstallPromptEvent` / `clearInstallPromptEvent` exports. Phase 37 is the FIRST consumer of `installPromptEvent.prompt()`.
- `src/App.vue` lines 6–37 — `beforeinstallprompt` capture (preventDefault + setInstallPromptEvent) and `appinstalled` clear. Phase 37 does NOT modify capture; it consumes the singleton.
- `.planning/phases/33-mobile-foundation/33-CONTEXT.md` — D-05 (capture-only), D-06 (banner edits deferred to Phase 37), A-43-5 (banner extended not split). The contract Phase 37 honors.

### PWA infrastructure (already configured — extend, don't rewrite)
- `vite.config.ts` — VitePWA block lines 27–101. LOCKED: `registerType: 'prompt'` line 28, `scope: '/'` line 42. Phase 37 extends `manifest.shortcuts` (new array) and touches `includeAssets` for the new splash + shortcut icons. Workbox cap (3 MiB line 86) unchanged.
- `index.html` — Phase 37 adds iOS meta tags + per-color-scheme `<meta name="theme-color">` + `<link rel="apple-touch-startup-image">` entries near line 9. Existing `<meta name="color-scheme" content="light dark" />` (line 27) and `viewport-fit=cover` LOCKED line 8 unchanged.
- `src/components/projects/wallecx/PwaInstallBanner.vue` — current iOS-only banner (76 lines). `isIosSafari()`, `isInStandaloneMode()`, BANNER_DISMISSED_KEY. Phase 37 EXTENDS this file (D-37-02).
- `src/components/projects/wallecx/WallecxApp.vue` lines 18–38 — existing `useRegisterSW` + vue-sonner toast for needRefresh ("Refresh / Later"). Phase 37 polishes safe-area only; trigger logic byte-intact.
- `src/components/projects/wallecx/WallecxApp.vue` lines 41–66 — existing auth-expired toast site (NFR-IOS-EVICTION-UX target for the eviction-aware copy).

### Routing
- `src/router/index.ts` lines 62–86 — `/projects/wallecx` route + `meta.requiresAuth` + `beforeEach` redirect with `redirect: to.fullPath`. Query preservation through redirect is the mechanism for D-37-16.
- `src/router/__tests__/guard.spec.ts` line 35 — existing guard spec. Phase 37 ADDS a query-preservation test (per D-37-16).

### Phase 33 / 34 / 35 / 36 cumulative invariants (must hold)
- `vite.config.ts` line 28 `registerType: 'prompt'` LOCKED comment — byte-intact (NFR-PWA-AUTOUPDATE).
- `vite.config.ts` line 42 `scope: '/'` LOCKED comment — byte-intact (CON-PWA-SCOPE).
- `index.html` line 8 `viewport-fit=cover` LOCKED comment — byte-intact (LT-09 / Phase 34).
- `src/components/projects/wallecx/BarcodeDisplay.vue` black-on-white in light + dark + standalone — eyeball-checked when iOS theme-color and standalone CSS land (NFR-BR-2-PRESERVED, final owner Phase 38 but Phase 37 must not regress).

### Tooling
- `@vite-pwa/assets-generator` — NEW dev-dep (per NFR-IOS-SPLASH and D-37-15). Planner picks exact version + config file location. Generates splash PNGs (PWA-02) AND shortcut icons (PWA-09) in one tool.
- `@vueuse/core` `useOnline` — already a direct dep since Phase 33 (FND-01). No new install.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useMobileEnv.installPromptEvent`** (module singleton ref) — Phase 37's primary consumer. `.prompt()` called from PwaInstallBanner.vue Android branch.
- **`useMobileEnv.isStandalone`** — drives both install-banner suppression (D-37-08) and the iOS eviction-aware copy decision (Claude's discretion).
- **`PwaInstallBanner.vue` helpers** — `isIosSafari()` lines 8–11 and `isInStandaloneMode()` lines 13–19 stay; the existing iOS instructional render path stays as a `v-if` branch.
- **`@vueuse/core` `useOnline`** — drives the offline banner. Already direct dep.
- **vue-sonner `toast`** — already used for SW-update prompt (WallecxApp.vue line 25) and auth-expired (line 61). Phase 37 polishes the SW one for safe-area; eviction copy may pick toast or login page.
- **router redirect-with-fullPath** — used by every protected route; Phase 37 leans on it for shortcut auth fallback (D-37-16).

### Established Patterns
- **Teleport-to-body fixed banners** — PwaInstallBanner.vue uses `<Teleport to="body">`; OfflineBanner.vue will follow the same pattern so its z-index is independent of any parent stacking context.
- **Min 44×44 touch targets** — Phase 34 LT-01 floor. Both new buttons (Install on Android branch, dismiss on both banners) must hit it.
- **Safe-area paddingBottom on bottom-fixed surfaces; paddingTop on top-fixed surfaces** — Phase 34 substrate. Offline banner is the first top-fixed user-facing surface in this stack (CustomNavBar is the existing one).
- **No new Pinia store** (locked invariant) — `pendingAction` is a local ref in WallecxApp.vue, NOT a store (D-37-14).
- **vite.config.ts LOCKED comments** — Phase 33's append-only-edit discipline holds. Phase 37 only EXTENDS the manifest object (`shortcuts` array, optional extra `includeAssets`); does NOT touch the LOCKED lines.

### Integration Points
- **`PwaInstallBanner.vue`** — new Android branch consumes `useMobileEnv.installPromptEvent`. Dismiss path writes the new JSON dismissal schema.
- **`App.vue`** — new `<OfflineBanner />` mount, sibling to `<CustomNavBar />`, before `<RouterView />`.
- **`WallecxApp.vue`** — new `pendingAction` ref + `route.query.action` watcher + `activeTab` reassignment; SW-update toast call gets safe-area styling option; auth-expired toast may grow eviction-aware copy.
- **`vite.config.ts`** — `manifest.shortcuts` array added; `includeAssets` may grow new shortcut/splash filenames.
- **`index.html`** — new iOS standalone meta tags, per-color-scheme `theme-color` (existing single one is in the manifest, not yet in `index.html`), and `<link rel="apple-touch-startup-image">` entries for 390×844 / 360×780 / 768×1024.

</code_context>

<specifics>
## Specific Ideas

- **One design language for both banners.** The Android install branch reuses the navy bar verbatim — same `#002244`, same fixed-bottom layout, same `mdi:close` dismiss. Only the copy and the new "Install" CTA change.
- **The 30-day clock should be fair to legacy dismissers.** Migrating `'true'` to `{ dismissedAt: now }` (not "dismissed forever") was an explicit choice — existing iOS users who dismissed get the new Android Install button surfaced in 30 days, not never.
- **The offline banner is honest about what it can do.** No retry button — `useOnline` reactivity IS the retry mechanism. ROADMAP + REQUIREMENTS get reworded by the planner to match this design intent (D-37-12).
- **Manifest shortcuts use the simplest possible URL shape.** One query param, one auth guard path, no new routes — `pendingAction` ref + watch dispatches inside WallecxApp. No Pinia store.

</specifics>

<deferred>
## Deferred Ideas

- **Two-physical-component split of PwaInstallBanner.vue** — surfaced during D-37-02 discussion. Off the table per A-43-5 (extended, not split). Stays as a single component.
- **Cross-platform dismissal independence** (iOS dismissed leaves Android pristine and vice versa) — surfaced during D-37-06 discussion. Schema captures `platform` field so this is implementable later as a one-line gate change without a storage migration; not built now.
- **Session-timer pre-banner delay** — surfaced during D-37-08. Rejected as unneeded state.
- **Toast on `accepted` install outcome** — surfaced during D-37-04. Rejected — Chrome's own dialog is the feedback signal.
- **Retry button on offline banner** — surfaced during D-37-11. Rejected as theatre; documentation realigned with the design (D-37-12).
- **Hash-based and dedicated-route shortcut URL shapes** — surfaced during D-37-13. Rejected; query param is simplest and lossless.
- **Maskable-purpose shortcut icons** — surfaced during D-37-15. Doubles asset count for marginal polish. Single `purpose:'any'` 96×96 PNG per shortcut is enough.
- **Login-page eviction-aware copy** — surfaced during Claude's-Discretion analysis. Not deferred so much as left to planner; if planner picks the toast site only, the login-page copy stays generic.

None of the above are scope creep — they are correctly-sequenced rejected alternatives or planner-discretion items surfaced during discussion.

</deferred>

---

*Phase: 37-pwa-install-standalone-polish*
*Context gathered: 2026-05-28*
