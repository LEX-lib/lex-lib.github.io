# Phase 33: Mobile Foundation - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 33 delivers the **mobile primitives every later v4.3 phase consumes**:
- **FND-01** — `@vueuse/core` promoted from transitive (via `@vueuse/motion`) to a direct dependency + `useMobileEnv` composable centralizing mobile/tablet/standalone state, the captured install-prompt event, and safe-area insets
- **FND-02** — `beforeinstallprompt` listener registered at `App.vue` scope (not WallecxApp.vue) so the Android Chrome event survives in-app navigation to `/projects/wallecx`
- **FND-03** — `rollup-plugin-visualizer` (+ `cross-env` for Windows) wired behind an `ANALYZE=true`-gated `npm run analyze` script
- **FND-04** — `vue@^3.5.18 → ^3.5.34` patch bump + `primevue@^4.3.7 → ^4.5.5` minor bump (lockstep with `@primevue/auto-import-resolver` + `@primevue/forms`), with a branch smoke-test gate before merge

This is a foundation phase — it ships primitives and dependency changes, not user-facing mobile UX. The visible mobile work (layout, forms, PWA polish) lands in Phases 34–37.

</domain>

<decisions>
## Implementation Decisions

### useMobileEnv API shape
- **D-01:** `useMobileEnv()` returns a **single object of refs/functions** — `{ isMobile, isTablet, isStandalone, installPromptEvent, safeAreaInsets }`. Downstream phases destructure what they need from one composable. Cleanest single-import surface for Phases 34–37.
- **D-02:** `useMobileEnv` **extends, does not replace** `useIsMobile.ts` (locked A-43-1). The existing `useIsMobile()` keeps returning `Ref<boolean>` at the 639px breakpoint verbatim — its current callers are NOT migrated in Phase 33 (backward-compatible). `useMobileEnv` is the single source of truth for the breakpoint so the two never diverge (either `useMobileEnv` consumes `useIsMobile` internally, or both read the same breakpoint constant — planner's call).

### Breakpoint tiers
- **D-03:** Tri-state tiers exposed: **`isMobile` (≤639px)**, **`isTablet` (640–1023px)**, **desktop (≥1024px, the implicit `!isMobile && !isTablet` case)**. The 639px mobile threshold stays aligned with Tailwind `sm:` and the existing `useIsMobile` value (Phase 17 D-10).
- **D-04:** iPad (768–820px test viewport) is a **first-class tablet tier**, NOT treated as mobile and NOT treated as desktop. This lets dialogs later choose Drawer-on-mobile / Dialog-on-tablet-and-up rather than forcing iPad into a phone bottom-sheet. The tablet tier is the substrate for that decision in Phase 35.

### Install-prompt capture scope
- **D-05:** Phase 33 is **capture-only**. It registers the `beforeinstallprompt` listener at `App.vue` scope and stores the event in `useMobileEnv.installPromptEvent`. No install UI ships in Phase 33.
- **D-06:** The existing iOS-only `PwaInstallBanner.vue` stays **as-is** in Phase 33 (no edits). The Android Install button, the 30-day dismissal frequency rule (NFR-PWA-BANNER-FREQUENCY), and all banner copy/UX changes are **deferred to Phase 37** (PWA Install + Standalone Polish), where they belong. This keeps the foundation/polish split clean.

### Version-upgrade posture (FND-04)
- **D-07:** **Bundle both bumps, fix-forward.** Vue 3.5.34 + PrimeVue 4.5.5 (lockstep with `@primevue/auto-import-resolver` + `@primevue/forms`) upgrade together. If the branch smoke-test surfaces a regression, fix it **within Phase 33 before merge** — do NOT pin PrimeVue back or split the baseline. Goal: one clean version baseline for the entire v4.3 milestone.
- **D-08:** Smoke-test surface (must be manually verified before merge per roadmap success criterion 4): PrimeVue **Drawer, Dialog, DatePicker (touchUI), FileUpload (capture), MultiSelect, and ColorPicker direct-v-model** (the PrimeVue #8135 ManageMembership workaround). Highest-watch item: the **v2.3 PrimeVue #7465 dark-mode override CSS** — verify it still suppresses the white-flash-on-open after the minor bump, since it targets internal PrimeVue classes that could shift between minors.

### Claude's Discretion
- **Reactivity source for breakpoints** — `matchMedia` (existing `useIsMobile` pattern) vs `@vueuse/core` `useMediaQuery` / `useWindowSize`. FND-01 promotes `@vueuse/core` to a direct dep, so leaning `useMediaQuery` (auto-handles listener cleanup, matches the promotion intent), but the planner may keep the `matchMedia` style if it's simpler to make `useIsMobile` and `useMobileEnv` share one source. Either is acceptable as long as D-02 (single source of truth) holds.
- **`installPromptEvent` storage mechanism** — module-scope singleton ref inside `useMobileEnv.ts` (per A-43-4) is the expected approach; no new Pinia store (locked invariant). Planner confirms the exact shape.
- **Visualizer script ergonomics** — `npm run analyze` name, treemap output path, `.gitignore` entry for the report artifact, and whether the report is committed as a reference or regenerated on demand. Low-stakes; planner decides.
- **`safeAreaInsets` exposure shape** — whether it returns CSS `env()` strings, computed pixel numbers, or a reactive object. Planner picks based on what Phase 34 sticky surfaces need most.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone planning
- `.planning/REQUIREMENTS.md` — FND-01..04 functional requirements + 16 NFR/CON (Phase 33 binds none directly but delivers the primitives later phases use)
- `.planning/ROADMAP.md` §"Phase 33: Mobile Foundation" — goal, 4 success criteria, dependency/ordering rationale
- `.planning/research/SUMMARY.md` — v4.3 synthesis; phase sequencing + stack-delta rationale

### Stack & architecture (research)
- `.planning/research/STACK.md` — exact version targets (Vue 3.5.34, PrimeVue 4.5.5), `@vueuse/core` promotion (0 KB net), `rollup-plugin-visualizer@^7.0.1` + `cross-env` rationale, rejected libs
- `.planning/research/ARCHITECTURE.md` — A-43-1 (`useMobileEnv` extends `useIsMobile`), A-43-4 (App.vue-scope listener + module-singleton), A-43-5 (PwaInstallBanner extended not split — relevant to deferred P37 work)
- `.planning/research/PITFALLS.md` — M-6 (`useWindowSize`/matchMedia initial-value race → seed initial value), M-9 (`BeforeInstallPromptEvent.prompt()` single-use), C-1 (registerType stays 'prompt')

### Existing code (scouted)
- `src/composables/useIsMobile.ts` — current `Ref<boolean>`, raw `matchMedia`, 639px breakpoint, mount/unmount listener; the thing `useMobileEnv` must stay consistent with (D-02)
- `src/components/projects/wallecx/PwaInstallBanner.vue` — current iOS-only instructional banner, boolean localStorage dismissal, `isInStandaloneMode()` + `isIosSafari()` helpers, safe-area-inset-bottom; stays untouched in P33, extended in P37
- `package.json` — current deps: `vue@^3.5.18`, `primevue@^4.3.7`, `@primevue/auto-import-resolver@^4.3.7`, `@primevue/forms@^4.3.9`, `@vueuse/motion@^3.0.3` (transitive `@vueuse/core`); no direct `@vueuse/core`, no `rollup-plugin-visualizer`, no `cross-env`
- `src/App.vue` — listener registration site for FND-02 (read before planning to confirm mount lifecycle)
- `vite.config.ts` — PWA block (`registerType: 'prompt'` LOCKED), Workbox cap, rolldown chunk groups; where the visualizer plugin attaches

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useIsMobile.ts`**: Already seeds its initial value synchronously from `matchMedia(...).matches` (avoids the M-6 first-render race). `useMobileEnv` should preserve that seeding behavior whichever reactivity source it uses.
- **`PwaInstallBanner.vue` helpers**: `isInStandaloneMode()` (display-mode + iOS `navigator.standalone`) and `isIosSafari()` are reusable detection logic — `useMobileEnv.isStandalone` can lift `isInStandaloneMode()` into the composable so the banner (P37) and any standalone-gated UI share one detector.

### Established Patterns
- **Composables live in `src/composables/`** (`useIsMobile.ts`, `useTheme.ts`, `useChartTheme.ts`). `useMobileEnv.ts` follows the same location + naming.
- **No new Pinia store** (locked invariant) — `installPromptEvent` is a module-scope singleton ref, not store state.
- **Breakpoint 639px** = Tailwind `sm:` minus 1 (Phase 17 D-10). Tablet upper bound 1023px = Tailwind `lg:` minus 1 — keeps tiers aligned with Tailwind's scale.

### Integration Points
- **`App.vue`** — `beforeinstallprompt` listener registers here on mount (FND-02), writes to the `useMobileEnv` module singleton.
- **`vite.config.ts`** — `rollup-plugin-visualizer` attaches to the build plugins array, gated on `process.env.ANALYZE`.
- **`package.json`** — `@vueuse/core` moves to `dependencies`; `rollup-plugin-visualizer` + `cross-env` added to `devDependencies`; `analyze` script added.

</code_context>

<specifics>
## Specific Ideas

- iPad must be a real tablet tier, not "big phone" or "small desktop" — the user explicitly wants the 768–820 viewport handled as its own tier so dialogs can later differentiate Drawer (mobile) vs Dialog (tablet+).
- One clean version baseline for the whole milestone is the priority — the user accepts fix-forward effort within Phase 33 over a mixed Vue-new/PrimeVue-old baseline.
- Phase 33 stays a pure foundation — no visible install UI, no banner edits. The user wants the foundation/polish boundary kept crisp.

</specifics>

<deferred>
## Deferred Ideas

- **Android Install button + `event.prompt()` wiring** → Phase 37 (PWA polish). Event is captured in P33; the button that consumes it is built in P37.
- **30-day dismissal frequency rule (NFR-PWA-BANNER-FREQUENCY)** → Phase 37. The existing boolean localStorage dismissal stays in P33.
- **Migrating existing `useIsMobile()` callers to `useMobileEnv`** → not in scope. Backward-compatible by design (A-43-1); migration, if ever wanted, is a separate cleanup, not v4.3 work.

None of the above are scope creep — they are correctly-sequenced later-phase work surfaced during the discussion.

</deferred>

---

*Phase: 33-mobile-foundation*
*Context gathered: 2026-05-27*
