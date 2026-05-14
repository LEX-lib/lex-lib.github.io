# Phase 15: Mobile Layouts - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Make every Wallecx screen fully usable on a 375px phone viewport. This covers: responsive single-column grids, 44px minimum touch targets, keyboard-safe CRUD dialogs (max-height: 80dvh + overflow-y: auto), device notch / home indicator safe-area insets, overscroll-behavior lock, and an iOS-only "Add to Home Screen" install guidance banner.

No new data capabilities, collections, or routes are added in this phase.

</domain>

<decisions>
## Implementation Decisions

### iOS Install Banner (MOB-08)

- **D-01:** `PwaInstallBanner.vue` is a **fixed bottom strip** — sits above the home indicator using safe-area-inset-bottom padding so it is always visible without displacing content.
- **D-02:** Appearance is **minimal**: Wallecx icon + brief text ("Install: tap 📤 then Add to Home Screen") + an X dismiss button. Uses the existing navy/amber brand palette. No custom SVG for the Share icon — use a Unicode/emoji glyph or an `iconify-icon` icon.
- **D-03:** Dismiss is **X button only** — clicking X sets a `localStorage` key (e.g., `wallecx_install_banner_dismissed`) to `"true"`, and the banner never reappears. No auto-dismiss timer, no expiry. Matches MOB-08 spec exactly.
- **D-04:** Shown only on iOS Safari (check `navigator.userAgent` for iPhone/iPad/iPod) when NOT in standalone mode (check `window.matchMedia('(display-mode: standalone)').matches`). Not shown on Android (Android uses `beforeinstallprompt` flow already handled via vue-sonner).
- **D-05:** Rendered in `WallecxApp.vue` template (not App.vue) — it is Wallecx-specific and should not bleed into other mini-apps.

### Dialog Scroll (MOB-05)

- **D-06:** Apply `max-height: 80dvh` and `overflow-y: auto` to PrimeVue Dialog content via a **global CSS override** in a single scoped `<style>` block. Target `.p-dialog-content` class. One rule covers ManageVaccination, ManageMembership, VaccinationDetail, and MembershipDetail dialogs without touching their templates.
- **D-07:** `interactive-widget=resizes-content` added to the `<meta name="viewport">` tag in `index.html` alongside `viewport-fit=cover`. Both go in the same viewport meta update (MOB-05 + MOB-06 share the same file touch).

### Safe-area Insets (MOB-06)

- **D-08:** `viewport-fit=cover` added to `index.html` viewport meta (pairs with D-07 above).
- **D-09:** **Top safe-area** (notch / Dynamic Island) is handled in **App.vue or CustomNavBar wrapper** — the nav bar lives outside WallecxApp.vue in App.vue, so top inset padding belongs there. This prevents double-padding if the nav bar is ever made sticky/fixed.
- **D-10:** **WallecxApp.vue** handles `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)` on its root container. Bottom inset is especially important for the home indicator bar on notch-less iPhones.

### Overscroll Lock (MOB-07)

- **D-11:** `overscroll-behavior: none` applied to the WallecxApp.vue root container element via Tailwind `overscroll-none` class (or inline style if Tailwind v4 exposes it). Prevents iOS pull-to-refresh while scrolling card grids.

### Touch Targets (MOB-02)

- **D-12:** Use **per-element Tailwind classes** (`min-h-[44px]`, `min-w-[44px]`, `touch-manipulation`) directly on wrapper divs or buttons in each component. Explicit and auditable. Does not affect other mini-apps.
- **D-13:** Components to audit for touch target compliance: `WallecxToolbar.vue` (search clear, sort, view toggle buttons), `VaccinationGroupPanel.vue` (View/Edit/Delete drawer rows), `MembershipCard.vue` (card tile), `VaccinationGroupCard.vue` (card tile), dialog action buttons in ManageVaccination and ManageMembership.

### Responsive Grid (MOB-03, MOB-04)

- **D-14:** The existing grid classes (`grid grid-cols-1 sm:grid-cols-2 gap-4`) in both `MembershipsTab.vue` and `VaccinationsTab.vue` already implement single-column on <640px and 2-column on ≥640px. Verify this is correct and no override is needed for MOB-03/04. The vaccination view toggle in list mode already forces single-column everywhere — mobile behavior is already correct.
- **D-15:** The loading skeleton grids in both tabs also already use `grid grid-cols-1 sm:grid-cols-2 gap-4` — no change needed there either.

### Claude's Discretion

- Exact text of the iOS install banner copy (within the "minimal: icon + text + X" decision).
- Iconify icon to use for the Share/install glyph in the banner.
- Whether to use a Tailwind `overscroll-none` class (if available in v4) or inline CSS for overscroll-behavior.
- Which `localStorage` key name to use for the banner dismissed state (e.g., `wallecx_pwa_banner_dismissed`).
- Whether App.vue or CustomNavBar is the better place to add the top safe-area padding (pick whichever is cleaner given the current template structure).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §MOB-01 through MOB-08 — Locked mobile requirements with exact technical specs (80dvh, 44px, viewport-fit=cover, interactive-widget=resizes-content, localStorage dismiss)

### Project
- `.planning/PROJECT.md` — Brand palette (navy #002244, amber), Rubik font, core value statement

### Phase 14 patterns (PWA patterns already in place)
- `.planning/phases/14-pwa-foundation/14-PATTERNS.md` — WallecxApp.vue script setup patterns, toast patterns, PocketBase import patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `grid grid-cols-1 sm:grid-cols-2 gap-4` — already the correct responsive grid class in both MembershipsTab.vue and VaccinationsTab.vue (both data and skeleton states). MOB-03/MOB-04 may be verify-only.
- `vue-sonner` toast — established pattern in WallecxApp.vue; not needed for install banner (fixed strip, not toast).
- `iconify-icon` element — available project-wide for icons.
- PrimeVue `Drawer` breakpoints: `:breakpoints="{ '641px': '92vw' }"` — already set on the vaccination group panel drawer.
- PrimeVue `Dialog` breakpoints: `:breakpoints="{ '960px': '75vw', '641px': '92vw' }"` — already set on all 4 dialogs.

### Established Patterns
- `localStorage` not yet used in Wallecx (sessionStorage is used for view toggle). PWA banner dismissed state is the first localStorage use — use `localStorage.getItem` / `localStorage.setItem`.
- `navigator.storage.persist()` pattern already in WallecxApp.vue onMounted — follow same try/catch + silent-fail pattern for iOS detection.
- Tailwind v4 via `@tailwindcss/vite` plugin — utility classes work as expected. Arbitrary values (`min-h-[44px]`) are valid.
- PrimeVue PassThrough (`:pt`) is available but NOT the chosen approach for dialog scroll — use global CSS override in `<style>` block.

### Integration Points
- `index.html` viewport meta tag — currently `width=device-width, initial-scale=1.0`. Needs `viewport-fit=cover, interactive-widget=resizes-content` appended.
- `App.vue` — CustomNavBar is rendered here, above `<RouterView />`. Top safe-area padding goes in this component (on the App.vue wrapper or CustomNavBar).
- `WallecxApp.vue` — root container gets `env(safe-area-inset-bottom/left/right)` padding + `overscroll-behavior: none`.
- `PwaInstallBanner.vue` — new component, referenced from WallecxApp.vue template.

</code_context>

<specifics>
## Specific Ideas

- iOS install banner: minimal strip with emoji Share icon (📤) or `mdi:export-variant` / `mdi:share` iconify icon — matches the native iOS Share sheet icon visually without needing a custom SVG.
- Banner copy example: "Tap 📤 then **Add to Home Screen** to install Wallecx" — align left with icon, dismiss X on the right.
- The banner should use the navy background (`#002244` or `var(--color-brand-navy)`) with amber or white text to match the Wallecx brand established in Phase 11.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-mobile-layouts*
*Context gathered: 2026-05-14*
