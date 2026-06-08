# Phase 22: Wallecx Audit - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

The v3.0 milestone closer. Confirm Phase 18's Wallecx dark mode still holds now that `.my-app-dark` is driven by the site-wide NavBar toggle (Phase 19) rather than manual DevTools toggling. Fix any regressions surfaced by the toggle flow, route transitions, or PWA standalone mode. **No new Wallecx dark-mode CSS unless audit reveals concrete regressions.**

**In scope:** THEME-13 — Wallecx renders correctly in dark mode when toggled via the NavBar button; no regressions from Phase 18; barcode stays black-on-white (BR-2 preserved).

**Out of scope:**
- Re-implementing or refactoring Phase 18's Wallecx dark mode work
- PocketBase theme sync (THEME-ADV-01)
- Animated transitions (THEME-ADV-02)
- Any feature additions to Wallecx (this is the milestone CLOSER)
- LexTrack DatePicker/TabView contrast (Phase 21 deferred UAT item, not Wallecx)
- API Playground sign-off (Phase 21 deferred UAT item, not Wallecx)

</domain>

<decisions>
## Implementation Decisions

### Audit Strategy — Spot-Check on Regression Vectors
- **D-01:** Spot-check approach. Walk specific regression vectors rather than re-walking Phase 18's full 15-component sweep (which was already approved):
  1. **Toggle interaction:** Open `/projects/wallecx` → click NavBar toggle → confirm all Wallecx surfaces (card grids, dialogs, bottom sheets) re-paint immediately without refresh
  2. **Route transition:** `/projects/wallecx` (dark) → `/projects` (still dark) → `/projects/wallecx` (still dark) → theme persists; no flash on re-entry
  3. **Hard reload while dark:** Toggle to dark → hard refresh (Ctrl+F5) → no FOUC; Wallecx renders dark on first paint (Phase 19 inline FOUC script + Phase 18 token overrides do their job)
  4. **PWA standalone mode:** Install PWA (Chrome DevTools → Application → Manifest → Install, OR phone install) → open standalone → toggle dark → close and re-open → choice persists
  5. **BR-2 invariant:** Open a membership card with a barcode → confirm BarcodeDisplay renders black-on-white in BOTH themes (constants from Phase 12, locked)

### Code Changes — Verification-Only by Default
- **D-02:** Zero Wallecx source changes expected. Phase 18 already shipped the dark mode work; Phase 19 added the toggle; Wallecx CSS already responds to `.my-app-dark`. If audit confirms no regressions, the deliverable is just `22-VERIFICATION.md` + `22-01-SUMMARY.md` + the milestone-closer commit on STATE/ROADMAP.
- **D-03:** **Opportunistic polish allowed but bounded.** If the audit reveals a minor regression (e.g., a Wallecx surface that bleeds because Phase 19's `--color-mix-target` interaction with Wallecx CSS produced an unexpected effect), fix it via `wallecx-overrides.css` or scoped component CSS — NOT by reworking Phase 18's strategy. Each fix is its own atomic commit.

### Anti-Regression — Hard Locks
- **D-04:** `src/main.ts`, `src/composables/useTheme.ts`, `src/composables/useIsMobile.ts`, `src/assets/base.css`, `index.html`, all `src/views/**`, all `src/components/projects/{lextrack,larga,gift-exchange,api-playground}/**`, and all `src/components/Hero*`, `About*`, `Login.vue`, `CustomNavBar.vue` are LOCKED. None may be modified in Phase 22.
- **D-05:** `BarcodeDisplay.vue` constants `BARCODE_FOREGROUND = '#000000'` and `BARCODE_BACKGROUND = '#ffffff'` REMAIN UNCHANGED in any theme (BR-2 invariant from STATE.md / Phase 12).
- **D-06:** If a fix lands in `wallecx-overrides.css`, it MUST be a Phase-18-style `.my-app-dark .p-*` selector pattern. Do NOT introduce new global CSS or new dependencies.

### PWA Standalone Verification
- **D-07:** PWA verification is a UAT step, not a code task. Tester installs the PWA, toggles theme, and confirms the toggle works identically to the in-browser flow. Document outcome in `22-HUMAN-UAT.md`. Known to-watch-for: iOS standalone has 7-day localStorage eviction (separate auth concern; not theme-specific — but verify that after eviction the theme falls back gracefully to OS-preference + first-visit default per Phase 19 D-06).

### Verification Deliverables
- **D-08:** Phase 22 produces:
  1. `22-01-PLAN.md` — single tiny plan with 2-3 tasks
  2. `22-01-SUMMARY.md` — outcome of audit; documents zero changes OR any fixes applied
  3. `22-HUMAN-UAT.md` — 5-vector checklist (toggle interaction, route transition, FOUC, PWA, BR-2)
  4. `22-VERIFICATION.md` — final SC-1..4 verdict per ROADMAP §Phase 22
- **D-09:** Final phase commit (after UAT sign-off) closes v3.0 and updates STATE.md + ROADMAP.md to mark the milestone shipped.

### Claude's Discretion
- Whether to split the audit into multiple SUMMARY/UAT docs or keep them consolidated — keep consolidated unless audit reveals enough fixes to warrant per-fix documentation.
- Specific selectors for any new `.my-app-dark .p-*` overrides — pattern matches Phase 18.
- Whether to add the deferred Phase 21 items (LexTrack DatePicker, API Playground sign-off) into this UAT pass — defer further (they're not Wallecx).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Wallecx Audit (THEME-13)

### Roadmap
- `.planning/ROADMAP.md` §Phase 22 — Goal, SC 1–4

### Prior Phase Context (locked)
- `.planning/phases/12-read-path-card-grid-barcode-display-and-detail/12-CONTEXT.md` — BarcodeDisplay BR-2 invariant
- `.planning/phases/18-dark-mode-fixes/18-CONTEXT.md` — Variant alignment + token overrides + MembershipCard luminance helper
- `.planning/phases/19-theme-infrastructure/19-CONTEXT.md` — useTheme + NavBar toggle + FOUC script contract
- `.planning/phases/20-site-shell-non-app-pages/20-CONTEXT.md` — `--color-mix-target` var + `:global(.my-app-dark)` pattern
- `.planning/phases/21-mini-app-dark-mode-sweep/21-CONTEXT.md` — mini-app sweep strategy + status-color theme-independence

### STATE Invariants
- `.planning/STATE.md` §Architectural Invariants — BR-2 (BarcodeDisplay foreground/background), navy/amber brand, no in-app theme toggle (Lexarium-level)

### Files Untouched (anti-regression, ALL of Phase 22)
- `src/main.ts`, `src/composables/useTheme.ts`, `src/composables/useIsMobile.ts`
- `src/assets/base.css`, `index.html`
- `src/components/CustomNavBar.vue`, `src/components/HeroSection.vue`, `src/components/AboutMeSection.vue`, `src/components/Login.vue`
- All `src/views/**`
- All `src/components/projects/{lextrack,larga,gift-exchange,api-playground}/**`
- `src/components/projects/wallecx/BarcodeDisplay.vue` (BR-2 constants)

### Files Potentially Modified (only if audit reveals regression)
- `src/assets/wallecx-overrides.css` — extend existing patterns ONLY if audit-revealed
- Any specific Wallecx component (`src/components/projects/wallecx/**`) — only via scoped CSS additions, no template/script changes for dark-mode reasons

</canonical_refs>

<code_context>
## Existing Code Insights

### What's already in place (no change expected)
- `useTheme` composable drives `.my-app-dark` on `<html>` (Phase 19)
- `@custom-variant dark` aligns Tailwind with PrimeVue (Phase 18)
- `base.css` `.my-app-dark` block overrides custom `@theme` tokens (Phases 18 + 20)
- `wallecx-overrides.css` contains `.p-dialog-content` cap (Phase 15), `.p-drawer-bottom .p-drawer` height (Phase 17), `.my-app-dark .p-card` separation (Phase 18)
- `MembershipCard.vue` `pickTextColor` luminance helper (Phase 18)
- Bottom-sheet drag handle pill `bg-gray-300 dark:bg-gray-600` (Phase 17 + corrected during Phase 18 UAT)

### Regression vectors to watch
- **Toggle re-paint timing:** Wallecx may have CRUD dialogs open when user toggles theme. PrimeVue Dialog re-renders should pick up the new theme tokens; verify.
- **Bottom sheet on iOS Safari standalone:** Phase 17's bottom drawer + Phase 19's FOUC script + iOS standalone — combination not previously co-tested
- **PWA cache invalidation:** Phase 14 set `registerType: 'prompt'`, NetworkOnly for /api/*, and 56-entry precache. Theme CSS changes should land in the bundle; first-time PWA load post-deploy may need refresh. Out of scope to test cache behavior; just confirm theme works on a fresh install.

</code_context>

<specifics>
## Specific Ideas

### Spot-check audit script (for `22-HUMAN-UAT.md`)

```
1. **Toggle interaction** (light → dark mid-Wallecx)
   - Open /projects/wallecx in LIGHT mode
   - Click NavBar sun/moon button
   - Verify: NavBar icon flips, page background goes dark, vaccination tab cards switch to dark surface,
     membership tab cards keep user color with contrast-aware text (Phase 18 pickTextColor)
   - Open a CRUD dialog → click toggle while dialog is open → verify dialog re-paints

2. **Route transitions** (theme persistence)
   - Wallecx in dark → navigate to /projects → back to /projects/wallecx → theme should stick
   - Hard reload (Ctrl+F5) → no flash; first paint is already dark

3. **Bottom sheets in dark mode** (Phase 17 carry-forward)
   - Mobile viewport (375px) → open vaccination group panel → verify it slides from bottom in dark mode
   - Verify drag handle pill (bg-gray-300 dark:bg-gray-600) is visible against dark drawer background

4. **BarcodeDisplay BR-2 invariant**
   - Open a membership card with a barcode
   - Both themes: barcode itself renders BLACK on WHITE (NEVER follows theme)
   - Surrounding dialog/sheet chrome adapts to theme

5. **PWA standalone**
   - Install Wallecx as a PWA (DevTools Application → Manifest → Install, OR phone)
   - Toggle dark, close standalone, re-open → choice persists
   - Hard close (force quit) and re-open → choice persists
```

### Expected outcome

```markdown
## 22-01-SUMMARY.md expected outcome (if no regressions)

**Plan:** 22-01 (Wallecx audit)
**Tasks:** 1 (audit + UAT doc generation)
**Source changes:** 0
**Deliverables:** 22-HUMAN-UAT.md, 22-VERIFICATION.md

**Audit outcome:** Wallecx renders correctly when toggled via the NavBar button.
Phase 18's dark mode contract holds; no regressions surfaced by the Phase 19/20/21
toggle flow.

THEME-13 SATISFIED — v3.0 milestone ready to close.
```

</specifics>

<deferred>
## Deferred Ideas

- **PocketBase theme sync** (THEME-ADV-01) — already deferred at milestone start.
- **Animated transitions** (THEME-ADV-02) — already deferred at milestone start.
- **LexTrack DatePicker/TabView contrast** — Phase 21 deferred UAT item; not Wallecx scope; revisit in a future polish phase if it bothers users.
- **API Playground sign-off** — Phase 21 deferred UAT item; not Wallecx scope.
- **v3.0-ROADMAP.md archive** — milestone archive file (parallels v1.0/v2.0/v2.2) — generate at `/gsd-complete-milestone` time, NOT in this phase.

</deferred>

---

*Phase: 22-wallecx-audit*
*Context gathered: 2026-05-19*
